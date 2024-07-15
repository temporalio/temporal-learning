---
title: Run your first Temporal application with the Java SDK
id: run-your-first-app-tutorial-java
sidebar_position: 2
description: In this tutorial, you'll run your first Temporal app using the Java SDK and explore Workflows, Activities, Task Queues, and compensating transactions. Then you'll see how Temporal recovers from failures.
keywords: [Java, temporal, sdk, tutorial, example, workflow, worker, getting started, errors, failures, activity, temporal application, compensating transactions]
tags: [Java, SDK]
last_update:
  date: 2024-06-21
code_repo: https://github.com/temporalio/money-transfer-project-java
image: /img/temporal-logo-twitter-card.png
---

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

:::note Tutorial information

- **Level**: ⭐ Temporal beginner
- **Time**: ⏱️ ~10 minutes
- **Goals**: 🙌
- Explore Temporal's core terminology and concepts.
- Complete several runs of a Temporal Workflow application using a Temporal Cluster and the [Java SDK](https://github.com/temporalio/java-sdk).
- Practice reviewing the state of the Workflow.
- Understand the inherent reliability of Workflow methods.

:::

### Introduction


You can think of Temporal as a sort of "cure-all" for the pains you experience as a developer when trying to build reliable applications. Whether you're writing a complex transaction-based Workflow or working with remote APIs, you know that creating reliable applications is a complex process. Developing your application on the Temporal Platform guarantees that your code runs to completion no matter what.


The language-specific SDK, in this case the Temporal [Java SDK](https://github.com/temporalio/sdk-java), provides a comprehensive solution to the complexities that arise from modern application development.


Temporal provides reliability primitives to ensure durable execution of your code, such as seamless and fault-tolerant application state tracking, automatic retries, timeouts, rollbacks due to process failures, and more.


In this tutorial, you'll run your first Temporal Application. You'll use Temporal's Web UI for application state visibility, and then explore how Temporal helps you recover from a couple of common failures.


## Prerequisites


Before starting this tutorial:


- [Set up a local development environment for developing Temporal Applications using the Java language](/getting_started/java/dev_environment/).
- Ensure you have Git installed to clone the project.

:::note Package Management

This tutorial uses the Maven package manager.

:::

## ![](/img/icons/workflow.png) Application overview
In this tutorial, you will run a [Temporal Application](https://docs.temporal.io/temporal#temporal-application) using the [Temporal Java SDK](https://github.com/temporalio/sdk-java).


This project in this tutorial simulates a money transfer application, focusing on essential transactions such as withdrawals, deposits, and refunds. The importance of Temporal in this context lies in its ability to handle your code efficiently and reliably.


In this sample application, money comes out of one account and goes into another. However, there are a few things that can go wrong with this process. If the withdrawal fails, then there is no need to try to make a deposit. But if the withdrawal succeeds, but the deposit fails, then the money needs to go back to the original account.


One of Temporal's most important features is its ability to maintain the application state when something fails. When failures happen, Temporal recovers processes where they left off or rolls them back correctly. This allows you to focus on business logic, instead of writing application code to recover from failure.


Now that you know how the application will work, it's time to download the application to your local machine, so you can try it out yourself.


## ![](/img/icons/download.png) Download the example application


The application you'll use in this tutorial is available in a [GitHub repository](https://github.com/temporalio/money-transfer-project-java).


Open a new terminal window and use `git` to clone the repository:


```command
git clone https://github.com/temporalio/money-transfer-project-java
```


Once you have the repository cloned, change to the project directory:


```command
cd money-transfer-project-java
```

Now that you've downloaded the project, let's dive into the code.

## Explore the application's Workflow and Activity Definitions


The Temporal Application will consist of the following pieces:


1. A [Workflow](https://docs.temporal.io/workflows) written in your programming language of choice such as Java. A Workflow defines the overall flow of the application.
2. An [Activity](https://docs.temporal.io/activities) is a method that encapsulates business logic prone to failure (e.g., calling a service that may go down). These Activities can be automatically retried upon some failure.
3. A [Worker](https://docs.temporal.io/workers), provided by the Temporal SDK, which runs your Workflow and Activities reliably and consistently.


Temporal applications are built using an abstraction called Workflows. You'll develop those Workflows by writing code in a general-purpose programming language such as Java. Conceptually, a Workflow defines a sequence of steps. With Temporal, those steps are defined by writing code, known as a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition), and are carried out by running that code, which results in a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).


These Workflow Executions orchestrate the execution of [Activities](https://docs.temporal.io/activities), which execute a single, well-defined action, such as calling another service, transcoding a media file, or sending an email message. In the money transfer application, you have three Activity methods, `withdraw`, `deposit`, and `refund`. These symbolize the movement of funds between accounts.


The following diagram illustrates what happens when you start the Workflow:


![High-level project design](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/temporal-high-level-application-design.png)


None of your application code runs on the Temporal Server. Your Worker, Workflow, and Activity run on your infrastructure, along with the rest of your applications.

### Workflow Definition


In the Temporal Java SDK, a Workflow Definition is marked by the **`@WorkflowInterface`** attribute placed above the class interface.

The **`@WorkflowMethod`** attribute is placed on the `transfer` method within the `MoneyTransferWorkflow` class. It is the entry point for the Workflow.


This is what the Workflow Definition looks like for this process:


**Workflow Definition interface**


<!--SNIPSTART money-transfer-java-workflow-interface-->
[src/main/java/moneytransfer/MoneyTransferWorkflow.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/MoneyTransferWorkflow.java)
```java
package moneytransferapp;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface MoneyTransferWorkflow {
    // The Workflow Execution that starts this method can be initiated from code or
    // from the 'temporal' CLI utility.
    @WorkflowMethod
    void transfer(TransactionDetails transaction);
}
```
<!--SNIPEND-->

The `MoneyTransferWorkflow` class is designed to manage the transaction process, which entails withdrawing funds from one account and depositing the money into another through executing the Activities.

The `MoneyTransferWorkflow` class contains a method, `transfer`, that takes a `TransactionDetails` instance as input. This holds the transaction details to perform the money transfer.

This type is defined in the `TransactionDetails` class:

<!--SNIPSTART money-transfer-java-transaction-details-->
[src/main/java/moneytransfer/TransactionDetails.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/TransactionDetails.java)
```java
package moneytransferapp;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(as = CoreTransactionDetails.class)
public interface TransactionDetails {
    String getSourceAccountId();
    String getDestinationAccountId();
    String getTransactionReferenceId();
    int getAmountToTransfer();
}
```
<!--SNIPEND-->

:::tip


It's a good practice to send a single object into a Workflow as its input, rather than multiple, separate arguments. As your Workflows evolve, you may need to add information, and using a single argument will make it easier for you to change long-running Workflows in the future.


:::


:::note
Notice that the `TransactionDetails` object includes a `transactionReferenceId` member. Some APIs let you send a unique _idempotency key_ along with the transaction details. This guarantees that if a failure occurs and you have to retry the transaction, the API you're calling will use the key to ensure it only executes the transaction once.


:::


**Workflow Definition implementation**


<!--SNIPSTART money-transfer-java-workflow-implementation-->
[src/main/java/moneytransfer/MoneyTransferWorkflowImpl.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/MoneyTransferWorkflowImpl.java)
```java
package moneytransferapp;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import io.temporal.common.RetryOptions;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

public class MoneyTransferWorkflowImpl implements MoneyTransferWorkflow {
    private static final String WITHDRAW = "Withdraw";

    // RetryOptions specify how to automatically handle retries when Activities fail
    private final RetryOptions retryoptions = RetryOptions.newBuilder()
        .setInitialInterval(Duration.ofSeconds(1)) // Wait 1 second before first retry
        .setMaximumInterval(Duration.ofSeconds(20)) // Do not exceed 20 seconds between retries
        .setBackoffCoefficient(2) // Wait 1 second, then 2, then 4, etc
        .setMaximumAttempts(5000) // Fail after 5000 attempts
        .build();

    // ActivityOptions specify the limits on how long an Activity can execute before
    // being interrupted by the Orchestration service
    private final ActivityOptions defaultActivityOptions = ActivityOptions.newBuilder()
        .setRetryOptions(retryoptions) // Apply the RetryOptions defined above
        .setStartToCloseTimeout(Duration.ofSeconds(2)) // Max execution time for single Activity
        .setScheduleToCloseTimeout(Duration.ofSeconds(5000)) // Entire duration from scheduling to completion including queue time
        .build();

    private final Map<String, ActivityOptions> perActivityMethodOptions = new HashMap<String, ActivityOptions>() {{
        // A heartbeat time-out is a proof-of life indicator that an activity is still working.
        // The 5 second duration used here waits for up to 5 seconds to hear a heartbeat.
        // If one is not heard, the Activity fails.
        // The `withdraw` method is hard-coded to succeed, so this never happens.
        // Use heartbeats for long-lived event-driven applications.
        put(WITHDRAW, ActivityOptions.newBuilder().setHeartbeatTimeout(Duration.ofSeconds(5)).build());
    }};

    // ActivityStubs enable calls to methods as if the Activity object is local but actually perform an RPC invocation
    private final AccountActivity accountActivityStub = Workflow.newActivityStub(AccountActivity.class, defaultActivityOptions, perActivityMethodOptions);

    // The transfer method is the entry point to the Workflow
    // Activity method executions can be orchestrated here or from within other Activity methods
    @Override
    public void transfer(TransactionDetails transaction) {
        // Retrieve transaction information from the `transaction` instance
        String sourceAccountId = transaction.getSourceAccountId();
        String destinationAccountId = transaction.getDestinationAccountId();
        String transactionReferenceId = transaction.getTransactionReferenceId();
        int amountToTransfer = transaction.getAmountToTransfer();

        // Stage 1: Withdraw funds from source
        try {
            // Launch `withdrawal` Activity
            accountActivityStub.withdraw(sourceAccountId, transactionReferenceId, amountToTransfer);
        } catch (Exception e) {
            // If the withdrawal fails, for any exception, it's caught here
            System.out.printf("[%s] Withdrawal of $%d from account %s failed", transactionReferenceId, amountToTransfer, sourceAccountId);
            System.out.flush();

            // Transaction ends here
            return;
        }

        // Stage 2: Deposit funds to destination
        try {
            // Perform `deposit` Activity
            accountActivityStub.deposit(destinationAccountId, transactionReferenceId, amountToTransfer);

            // The `deposit` was successful
            System.out.printf("[%s] Transaction succeeded.\n", transactionReferenceId);
            System.out.flush();

            //  Transaction ends here
            return;
        } catch (Exception e) {
            // If the deposit fails, for any exception, it's caught here
            System.out.printf("[%s] Deposit of $%d to account %s failed.\n", transactionReferenceId, amountToTransfer, destinationAccountId);
            System.out.flush();
        }

        // Continue by compensating with a refund

        try {
            // Perform `refund` Activity
            System.out.printf("[%s] Refunding $%d to account %s.\n", transactionReferenceId, amountToTransfer, sourceAccountId);
            System.out.flush();

            accountActivityStub.refund(sourceAccountId, transactionReferenceId, amountToTransfer);

            // Recovery successful. Transaction ends here
            System.out.printf("[%s] Refund to originating account was successful.\n", transactionReferenceId);
            System.out.printf("[%s] Transaction is complete. No transfer made.\n", transactionReferenceId);
            return;
        } catch (Exception e) {
            // A recovery mechanism can fail too. Handle any exception here
            System.out.printf("[%s] Deposit of $%d to account %s failed. Did not compensate withdrawal.\n",
                transactionReferenceId, amountToTransfer, destinationAccountId);
            System.out.printf("[%s] Workflow failed.", transactionReferenceId);
            System.out.flush();

            // Rethrowing the exception causes a Workflow Task failure
            throw(e);
        }
    }
}
```
<!--SNIPEND-->


### Activity Definition


In the Temporal Java SDK, you mark a method within a class as an Activity by adding the `@ActivityMethod` attribute to the method. You mark an interface as an Activity Interface by adding `@ActivityInterface`.


<!--SNIPSTART money-transfer-java-activity-interface {"selectedLines": ["3-19"]}-->
[src/main/java/moneytransfer/AccountActivity.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/AccountActivity.java)
```java
// ...
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

@ActivityInterface
public interface AccountActivity {
    // Withdraw an amount of money from the source account
    @ActivityMethod
    void withdraw(String accountId, String referenceId, int amount);

    // Deposit an amount of money into the destination account
    @ActivityMethod
    void deposit(String accountId, String referenceId, int amount);

    // Compensate a failed deposit by refunding to the original account
    @ActivityMethod
    void refund(String accountId, String referenceId, int amount);
}
```
<!--SNIPEND-->


Activities are where you perform the business logic for your application. In the money transfer application, you have three Activity methods, `withdraw`, `deposit`, and `refund`. The Workflow Definition calls the Activities `withdraw` and `deposit` methods to handle the money transfers.


First, the `withdraw` Activity takes the details about the transfer and calls a service to process the withdrawal.
Second, if the transfer succeeded, the `withdraw` method returns the confirmation.
Lastly, the `deposit` Activity method works like the `withdraw` method. It similarly takes the transfer details and calls a service to process the deposit, ensuring the money is successfully added to the receiving account:

<!--SNIPSTART money-transfer-java-activity-implementation {"selectedLines": ["3-42"]}-->
[src/main/java/moneytransfer/AccountActivityImpl.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/AccountActivityImpl.java)
```java
// ...
import io.temporal.activity.*;

public class AccountActivityImpl implements AccountActivity {
    // Mock up the withdrawal of an amount of money from the source account
    @Override
    public void withdraw(String accountId, String referenceId, int amount) {
        System.out.printf("\nWithdrawing $%d from account %s.\n[ReferenceId: %s]\n", amount, accountId, referenceId);
        System.out.flush();
    }

    // Mock up the deposit of an amount of money from the destination account
    @Override
    public void deposit(String accountId, String referenceId, int amount) {
        boolean activityShouldSucceed = true;

        if (!activityShouldSucceed) {
            System.out.println("Deposit failed");
            System.out.flush();
            throw Activity.wrap(new RuntimeException("Simulated Activity error during deposit of funds"));
        }

        System.out.printf("\nDepositing $%d into account %s.\n[ReferenceId: %s]\n", amount, accountId, referenceId);
        System.out.flush();
    }

    // Mock up a compensation refund to the source account
    @Override
    public void refund(String accountId, String referenceId, int amount) {
        boolean activityShouldSucceed = true;

        if (!activityShouldSucceed) {
            System.out.println("Refund failed");
            System.out.flush();
            throw Activity.wrap(new RuntimeException("Simulated Activity error during refund to source account"));
        }

        System.out.printf("\nRefunding $%d to account %s.\n[ReferenceId: %s]\n", amount, accountId, referenceId);
        System.out.flush();
   }
}
```
<!--SNIPEND-->

:::tip Why you use Activities


At first glance, you might think you can incorporate your logic into the Workflow Definition. However, Temporal Workflows have certain [deterministic constraints](https://docs.temporal.io/workflows#deterministic-constraints) and must produce the same output each time, given the same input. This means that any non-deterministic work such as interacting with the outside world, like accessing files or network resources, must be done by Activities.


In addition, by using Activities, you can take advantage of Temporal's ability to retry Activities indefinitely, which you'll explore later in this tutorial.


Use Activities for your business logic, and use Workflows to coordinate the Activities.


:::

## Set the Retry Policy


Temporal makes your software durable and fault tolerant by default which allows you to code more reliable systems.


If an Activity fails, Temporal Workflows automatically retry the failed Activity by default. You can also customize how those retries happen through the Retry Policy.


In the `MoneyTransferWorkflow` class, you define a Retry Policy right at the beginning of its main method, `transfer`.

You'll see a **Retry Policy** defined that looks like this:

<!--SNIPSTART money-transfer-java-workflow-implementation {"selectedLines": ["12-20"]}-->
[src/main/java/moneytransfer/MoneyTransferWorkflowImpl.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/MoneyTransferWorkflowImpl.java)
```java
// ...
    private static final String WITHDRAW = "Withdraw";

    // RetryOptions specify how to automatically handle retries when Activities fail
    private final RetryOptions retryoptions = RetryOptions.newBuilder()
        .setInitialInterval(Duration.ofSeconds(1)) // Wait 1 second before first retry
        .setMaximumInterval(Duration.ofSeconds(20)) // Do not exceed 20 seconds between retries
        .setBackoffCoefficient(2) // Wait 1 second, then 2, then 4, etc
        .setMaximumAttempts(5000) // Fail after 5000 attempts
        .build();
```
<!--SNIPEND-->


By default, Temporal retries failed Activities forever, but you can specify some errors that Temporal should not attempt to retry. In this example, it'll retry the failed Activity for 3 attempts, but if the Workflow encounters an error, it will refund money to the sender's account.


In the case of an error with the `deposit` Activity, the Workflow will attempt to put the money back.


In this Workflow, each Activity uses the same Retry Policy options, but you could specify different options for each Activity.


:::caution This is a simplified example.


Transferring money is a tricky subject, and this tutorial's example doesn't cover all possible issues that can go wrong. It doesn't include logic to clean things up if a Workflow is cancelled, and it doesn't handle other edge cases where money would be withdrawn but not deposited. There's also the possibility that this Workflow can fail when refunding the money to the original account. In a production scenario, you'll want to account for those cases with more advanced logic, including adding a "human in the loop" step where someone is notified of the refund issue and can intervene.


This example only shows some core features of Temporal and is not intended for production use.
:::


When you _start_ a Workflow, you are telling the Temporal Server, "Track the state of the Workflow with this method signature." Workers execute the Workflow code piece by piece, relaying the execution events and results back to the server.


Let's see that in action.


## Start the Workflow


You have two ways to start a Workflow with Temporal, either through the [Temporal command-line tool](https://docs.temporal.io/cli) or the [SDK](https://docs.temporal.io/encyclopedia/temporal-sdks). In this tutorial, you use the SDK to start the Workflow, which is how most Workflows get started in a live environment.


First, make sure the local [Temporal Service](https://docs.temporal.io/clusters) is running in a Terminal from the [previous tutorial](https://learn.temporal.io/getting_started/java/dev_environment/). This is done by opening a new terminal window and running the following command:

```command
temporal server start-dev \
    --log-level=never \
    --ui-port 8080 \
    --db-filename=temporal.db
```

To start the Workflow, run this Maven command:
```command
mvn compile exec:java \
    -Dexec.mainClass="moneytransferapp.TransferApp" \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
```

This command runs the `TransferApp.java` file within the project, starting the Workflow process.

The Workflow starts running and the app ends:

```
MONEY TRANSFER PROJECT

Initiating transfer of $62 from [Account 249946050] to [Account 591856595].

[WorkflowID: money-transfer-workflow]
[RunID: 37688cca-ffa2-48cf-809b-f18f5119bca3]
[Transaction Reference: 1480a22d-d0fc-4361]
```


To start a Workflow, you connect to the Temporal Cluster, specify the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue), the Workflow should use, and Activities it expects in your code. In this tutorial, this is a small command-line program that starts the Workflow Execution.


In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL.


The Temporal Server is an essential part of the overall system, but requires additional components for operation. The complete system is known as the Temporal Service, which is a deployment of the Temporal Server, plus the additional components used with it such as a database like Apache Cassandra, PostgreSQL, or MySQL.


The Task Queue is where Temporal Workers look for Workflows and Activities to execute. You define Task Queues by assigning a name as a string. You'll use this Task Queue name when you start a Workflow Execution, and you'll use it again when you define your Workers.


<!--SNIPSTART money-transfer-java-shared-->
[src/main/java/moneytransfer/Shared.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/Shared.java)
```java
package moneytransferapp;

public interface Shared {
    static final String MONEY_TRANSFER_TASK_QUEUE = "MONEY_TRANSFER_TASK_QUEUE";
}
```
<!--SNIPEND-->



:::note


This tutorial uses a separate program to start the Workflow, but you don't have to follow this pattern. In fact, most real applications start a Workflow as part of another program. For example, you might start the Workflow in response to a button press or an API call.


:::

Here is the how the code works for the application that creates new Workflows to transfer money:

<!--SNIPSTART money-transfer-java-initiate-transfer {"selectedLines": ["3-71"]}-->
[src/main/java/moneytransfer/TransferApp.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/TransferApp.java)
```java
// ...
import io.temporal.api.common.v1.WorkflowExecution;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;
import java.util.Random;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.concurrent.ThreadLocalRandom;

public class TransferApp {
    private static final SecureRandom random;

    static {
        // Seed the random number generator with nano date
        random = new SecureRandom();
        random.setSeed(Instant.now().getNano());
    }

    public static String randomAccountIdentifier() {
        return IntStream.range(0, 9)
                .mapToObj(i -> String.valueOf(random.nextInt(10)))
                .collect(Collectors.joining());
    }

    public static void main(String[] args) throws Exception {

        // In the Java SDK, a stub represents an element that participates in
        // Temporal orchestration and communicates using gRPC.

        // A WorkflowServiceStubs communicates with the Temporal front-end service.
        WorkflowServiceStubs serviceStub = WorkflowServiceStubs.newLocalServiceStubs();

        // A WorkflowClient wraps the stub.
        // It can be used to start, signal, query, cancel, and terminate Workflows.
        WorkflowClient client = WorkflowClient.newInstance(serviceStub);

        // Workflow options configure  Workflow stubs.
        // A WorkflowId prevents duplicate instances, which are removed.
        WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue(Shared.MONEY_TRANSFER_TASK_QUEUE)
                .setWorkflowId("money-transfer-workflow")
                .build();

        // WorkflowStubs enable calls to methods as if the Workflow object is local
        // but actually perform a gRPC call to the Temporal Service.
        MoneyTransferWorkflow workflow = client.newWorkflowStub(MoneyTransferWorkflow.class, options);
        
        // Configure the details for this money transfer request
        String referenceId = UUID.randomUUID().toString().substring(0, 18);
        String fromAccount = randomAccountIdentifier();
        String toAccount = randomAccountIdentifier();
        int amountToTransfer = ThreadLocalRandom.current().nextInt(15, 75);
        TransactionDetails transaction = new CoreTransactionDetails(fromAccount, toAccount, referenceId, amountToTransfer);

        // Perform asynchronous execution.
        // This process exits after making this call and printing details.
        WorkflowExecution we = WorkflowClient.start(workflow::transfer, transaction);

        System.out.printf("\nMONEY TRANSFER PROJECT\n\n");
        System.out.printf("Initiating transfer of $%d from [Account %s] to [Account %s].\n\n",
                          amountToTransfer, fromAccount, toAccount);
        System.out.printf("[WorkflowID: %s]\n[RunID: %s]\n[Transaction Reference: %s]\n\n", we.getWorkflowId(), we.getRunId(), referenceId);
        System.exit(0);
    }
}
```
<!--SNIPEND-->


Next, you'll explore one of the unique value propositions Temporal offers: application state visibility.



## View the state of the Workflow with the Temporal Web UI


Temporal records every execution, its progress, and application state through Temporal's Web UI. This provides insights into errors and app performance.


Temporal's Web UI lets you see details about the Workflow you're running. You can use this tool to see the results of Activities and Workflows, and also identify problems with your Workflow Execution.


1. Visit the [Temporal Web UI](http://localhost:8080) where you will see your Workflow listed. The link will direct you to localhost:8080.


![The Workflow running](images/workflow-running.png)

2. Click the **Workflow ID** for your Workflow.


Now you can see everything you want to know about the execution of the Workflow, including the input values it received, timeout configurations, scheduled retries, number of attempts, stack traceable errors, and more.


![The details of the run.](images/workflow-status.png)

3. You can see the inputs and results of the Workflow Execution by clicking the **Input and Results** section:


![Input and results](images/workflow-input.png)


You started the Workflow, and the interface shows that the Workflow is running, but the Workflow hasn't executed yet. As you see from the Web UI, there are no Workers connected to the Task Queue.


You need at least one Worker running to execute your Workflows. You'll start the Worker next.


## Start a Worker

A Worker is responsible for executing pieces of Workflow and Activity code. In this project, the file `Program.cs` contains the code for the Worker within the MoneyTransferWorker project.

Open a new terminal window.

In this new terminal window, run the following command to start the Worker:


```bash
mvn compile exec:java \
    -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
```



In production environments, Temporal applications often operate with hundreds or thousands of Workers. This is because adding more Workers not only enhances your application's availability but also boosts its scalability.


One thing that people new to Temporal may find surprising is that the Temporal Cluster does not execute your code. The entity responsible for executing your code is known as a Worker, and it's common to run Workers on multiple servers.


A Worker:


- Can only execute Workflows and Activities registered to it.
- Knows which piece of code to execute based on the Tasks it gets from the Task Queue.
- Only listens to the Task Queue that it's registered to.


After the Worker executes code, it returns the results back to the Temporal Server. Note that the Worker listens to the same Task Queue you used when you started the Workflow Execution.


Like the program that started the Workflow, it connects to the Temporal Cluster and specifies the Task Queue to use. It also registers the Workflow and the three Activities:



<!--SNIPSTART money-transfer-java-worker-->
[src/main/java/moneytransfer/MoneyTransferWorker.java](https://github.com/temporalio/money-transfer-project-java/blob/main/src/main/java/moneytransfer/MoneyTransferWorker.java)
```java
package moneytransferapp;

import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

public class MoneyTransferWorker {

    public static void main(String[] args) {
        // Create a stub that accesses a Temporal Service on the local development machine
        WorkflowServiceStubs serviceStub = WorkflowServiceStubs.newLocalServiceStubs();

        // The Worker uses the Client to communicate with the Temporal Service
        WorkflowClient client = WorkflowClient.newInstance(serviceStub);

        // A WorkerFactory creates Workers
        WorkerFactory factory = WorkerFactory.newInstance(client);

        // A Worker listens to one Task Queue.
        // This Worker processes both Workflows and Activities
        Worker worker = factory.newWorker(Shared.MONEY_TRANSFER_TASK_QUEUE);

        // Register a Workflow implementation with this Worker
        // The implementation must be known at runtime to dispatch Workflow tasks
        // Workflows are stateful so a type is needed to create instances.
        worker.registerWorkflowImplementationTypes(MoneyTransferWorkflowImpl.class);

        // Register Activity implementation(s) with this Worker.
        // The implementation must be known at runtime to dispatch Activity tasks
        // Activities are stateless and thread safe so a shared instance is used.
        worker.registerActivitiesImplementations(new AccountActivityImpl());

        System.out.println("Worker is running and actively polling the Task Queue.");
        System.out.println("To quit, use ^C to interrupt.");

        // Start all registered Workers. The Workers will start polling the Task Queue.
        factory.start();
    }
}
```
<!--SNIPEND-->

When you start the Worker, it begins polling the Task Queue for Tasks to process. The terminal output from the Worker looks like this:


```
Worker is running and actively polling the Task Queue.
To quit, use ^C to interrupt.

Withdrawing $62 from account 249946050.
[ReferenceId: 1480a22d-d0fc-4361]

Depositing $62 into account 591856595.
[ReferenceId: 1480a22d-d0fc-4361]
[1480a22d-d0fc-4361] Transaction succeeded.
```



The Worker continues running, waiting for more Tasks to execute.



Check the Temporal Web UI again. You will see one Worker registered where previously there was none, and the Workflow status shows that it completed:


![There is now one Worker and the Workflow is complete](images/completed-workflow.png)


Here's what happens when the Worker runs and connects to the Temporal Cluster:


- The first Task the Worker finds is the one that tells it to execute the Workflow.
- The Worker executes the Workflow which requests Activity Execution and communicates the events back to the Server.
- This causes the Server to send Activity Tasks to the Task Queue.
- The Worker then grabs each of the Activity Tasks in sequence from the Task Queue and executes each of the corresponding Activities.


Each of these steps gets recorded in the Event History. You can audit them in Temporal Web by clicking on the **History** tab next to **Summary**.


After a Workflow completes, the full history persists for a set retention period (typically 7 to 30 days) before the history is deleted.



You just ran a Temporal Workflow application and saw how Workflows, Activities, and Workers interact. Now you'll explore how Temporal gives you tools to handle failures.


## ![](/img/icons/warning.png) Simulate failures


Despite your best efforts, there's going to be a time when something goes wrong in your application. You might encounter a network glitch, a server might go offline, or you might introduce a bug into your code. One of Temporal's most important features is its ability to maintain the state of a Workflow when something fails. To demonstrate this, you will simulate some failures for your Workflow and see how Temporal responds.


### Recover from a server crash


Unlike many modern applications that require complex processes and external databases to handle failure, Temporal automatically preserves the state of your Workflow even if the server is down. You can test this by stopping the local Temporal Cluster while a Workflow is running.


Try it out by following these steps:


1. Make sure your Worker is stopped before proceeding, so your Workflow doesn't finish. Switch to the terminal that's running your Worker and stop it by pressing `CTRL+C`.
2. Verify the Workflow is running in the [Web UI](http://localhost:8080). If finished, restart it using the Maven command.
3. Shut down the Temporal Server with `CTRL+C` in the terminal window running the server.
4. After the Temporal Cluster has stopped, restart it and visit the UI. This can be done by running `temporal server start-dev` in the terminal window and navigating to [localhost:8080](http://localhost:8080/).

Your Workflow is still listed and running.


![The second Workflow appears in the list of Workflows](images/still-running.png)


If the Temporal Cluster goes offline, you can pick up where you left off when it comes back online again.


### Recover from an unknown error in an Activity


This demo application makes a call to an external service in an Activity. If that call fails due to a bug in your code, the Activity produces an error.


To test this out and see how Temporal responds, you'll simulate a bug in the `deposit` Activity method.


Try it out by following these steps:

1. Make sure your Worker is stopped before proceeding, so your Workflow doesn't finish. Switch to the terminal that's running your Worker and stop it by pressing `CTRL+C`.

2. Open the `AccountActivityImpl` file and modify the `deposit` method so `activityShouldSucceed` is set to false.


3. Save your changes and switch to the terminal that was running your Worker.

4. Verify the Workflow is running in the [Web UI](http://localhost:8080). If finished, restart it using the Maven command.

5. Start the Worker again:

```bash
mvn clean install \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=info 2>/dev/null
mvn compile exec:java \
    -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
```

Note, that you must restart the Worker every time there's a change in code. You will see the Worker complete the `withdraw` Activity method, but it errors when it attempts the `deposit` Activity method.


The important thing to note here is that the Worker keeps retrying the `deposit` method:

```
Withdrawing $32 from account 612849675.
[ReferenceId: d3d9bcf0-a897-4326]
Deposit failed
Deposit failed
Deposit failed
Deposit failed
```

The Workflow keeps retrying using the `RetryPolicy` specified when the Workflow first executes the Activity.


You can view more information about the process in the [Temporal Web UI](http://localhost:8080).


4. Click the Workflow. You'll see more details including the state, the number of attempts run, and the next scheduled run time.

:::note
Traditionally, you're forced to implement timeout and retry logic within the service code itself. This is repetitive and prone to errors. With Temporal, you can specify timeout configurations in the Workflow code as Activity options.

Temporal offers multiple ways to specify timeouts, including [Schedule-To-Start Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-start-timeout), [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout), [Start-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-start-to-close-timeout), and [Heartbeat Timeout](https://docs.temporal.io/concepts/what-is-a-heartbeat-timeout). By default the code will be retried forever, unless a Schedule-To-Close Timeout or Start-To-Close Timeout is specified.

:::

In the Workflow Definition, you can see that a **`StartToCloseTimeout`** is specified for the Activities, and a Retry Policy tells the server to retry the Activities up to 5000 times.

You can read more about [Retries](https://docs.temporal.io/retry-policies) in the documentation.


Your Workflow is running, but only the `withdraw` Activity method has succeeded. In any other application, you would likely have to abandon the entire process and perform a rollback.


With Temporal, you can debug and resolve the issue while the Workflow is running.

6. Pretend that you found a fix for the issue. Switch `activityShouldSucceed` back to `true` and save your changes.


How can you possibly update a Workflow that's already halfway complete? You restart the Worker.


7. To restart the Worker, go to the terminal where the Worker is running and cancel the Worker with `CTRL+C`.
   Then restart the Worker by running the following command:


```bash
mvn clean install \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=info 2>/dev/null
mvn compile exec:java \
    -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
```


The Worker starts again. On the next scheduled attempt, the Worker picks up right where the Workflow was failing and successfully executes the newly compiled `deposit` Activity method:


```
Depositing $32 into account 872878204.
[ReferenceId: d3d9bcf0-a897-4326]
[d3d9bcf0-a897-4326] Transaction succeeded.
```

8. Visit the [Web UI](http://localhost:8080) again, and you'll see the Workflow has completed.

You have just fixed a bug in a running application without losing the state of the Workflow or restarting the transaction!

## Conclusion


You now know how to run a Temporal Workflow and understand some value Temporal offers. You explored Workflows and Activities, you started a Workflow Execution, and you ran a Worker to handle that execution.


You also saw how Temporal recovers from failures and how it retries Activities.


Exploring the key advantages Temporal offers:


1. Temporal gives you **full visibility** in the state of your Workflow and code execution.
2. Temporal **maintains the state** of your Workflow, even through server outages and errors.
3. Temporal lets you **time out and retry Activity code** using options that exist outside your business logic.
4. Temporal enables you to **perform "live debugging" of your business logic** while the Workflow is running.


### Further exploration


Try the following things before moving on to get more practice working with a Temporal application:


- Change the Retry Policy in so it only retries 1 time.
- Does the Workflow place the money back into the original account?


### Review


Answer the following questions to see if you remember some of the more important concepts from this tutorial:


<details>
<summary>




**Why do we recommend defining a shared constant to store the Task Queue name?**


</summary>


Because the Task Queue name is specified in two different parts of the code (the first starts the Workflow and the second configures the Worker). If their values differ, the Worker and Temporal Cluster would not share the same Task Queue, and the Workflow Execution would not progress.


</details>


<details>
<summary>


**What do you have to do if you modify Activity code for a Workflow that is running?**


</summary>


Restart the Worker.


</details>



