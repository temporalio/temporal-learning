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


- [Set up a local development environment for developing Temporal Applications using the Java  language](/getting_started/java/dev_environment/).
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


These Workflow Executions orchestrate the execution of [Activities](https://docs.temporal.io/activities), which execute a single, well-defined action, such as calling another service, transcoding a media file, or sending an email message. In the money transfer application, you have three Activity async methods, `WithdrawAsync`, `DepositAsync`, and `RefundAsync`. These symbolize the movement of funds between accounts. They operate asynchronously, ensuring that the application can handle other tasks while waiting for the banking operations to complete.


The following diagram illustrates what happens when you start the Workflow:


![High-level project design](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/temporal-high-level-application-design.png)


None of your application code runs on the Temporal Server. Your Worker, Workflow, and Activity run on your infrastructure, along with the rest of your applications.

### Workflow Definition


In the Temporal Java SDK, a Workflow Definition is marked by the **`@WorkflowInterface`** attribute placed above the class.


This is what the Workflow Definition looks like for this process:


**Workflow Definition interface**


<!--SNIPSTART money-transfer-java-workflow-interface-->
<!--SNIPEND-->


**Workflow Definition implementation**


<!--SNIPSTART money-transfer-java-workflow-implementation-->
<!--SNIPEND-->


- The `@WorkflowMethod` attribute is placed on the `transfer` method within the `MoneyTransferWorkflow` class.

- The `MoneyTransferWorkflow` interface uses the `@WorkflowInterface` attribute.

- The `MoneyTransferWorkflow` class is designed to manage the transaction process, which entails withdrawing funds from one account and depositing the money into another through executing the Activities.

- The `MoneyTransferWorkflow` class contains a method, `transfer`, that takes a `TransactionDetails` object as input. This holds the transaction details to perform the money transfer.

This type is defined in the `TransactionDetails` class:

<!--SNIPSTART money-transfer-java-transaction-details-->
<!--SNIPEND-->
<!--SNIPSTART money-transfer-java-coreTransactionDetails-->
<!--SNIPEND-->

:::tip


It's a good practice to send a single object into a Workflow as its input, rather than multiple, separate input variables. As your Workflows evolve, you may need to add inputs, and using a single argument will make it easier for you to change long-running Workflows in the future.


:::


:::note
Notice that the `TransactionDetails` object includes a `transactionReferenceId` member. Some APIs let you send a unique _idempotency key_ along with the transaction details. This guarantees that if a failure occurs and you have to retry the transaction, the API you're calling will use the key to ensure it only executes the transaction once.


:::

### Activity Definition


In the Temporal Java SDK, you mark a method within a class as an Activity by adding the `@ActivityMethod` attribute to the method. You mark an interface as an Activity Interface by adding `@ActivityInterface`.


<!--SNIPSTART money-transfer-java-activity-interface {"selectedLines": ["3-19"]}-->
<!--SNIPEND-->


Activities are where you perform the business logic for your application. In the money transfer application, you have three Activity methods, `withdraw`, `deposit`, and `refund`. The Workflow Definition calls the Activities `withdraw` and `deposit` methods to handle the money transfers.


First, the `withdraw` Activity takes the details about the transfer and calls a service to process the withdrawal:
Second, if the transfer succeeded, the `withdraw` method returns the confirmation.
Lastly, the `deposit` Activity method works like the `withdraw` method. It similarly takes the transfer details and calls a service to process the deposit, ensuring the money is successfully added to the receiving account:

<!--SNIPSTART money-transfer-java-activity-implementation {"selectedLines": ["3-42"]}-->
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

<!--SNIPSTART money-transfer-java-workflow-implementation {"selectedLines": ["12-37"]}-->
<!--SNIPEND-->


By default, Temporal retries failed Activities forever, but you can specify some errors that Temporal should not attempt to retry. In this example, it'll retry the failed Activity for 3 attempts, but if the Workflow encounters an error, it will refund money to the sender's account.


In the case of an error with the `DepositAsync()` Activity, the Workflow will attempt to put the money back.


In this Workflow, each Activity uses the same Retry Policy options, but you could specify different options for each Activity.


:::caution This is a simplified example.


Transferring money is a tricky subject, and this tutorial's example doesn't cover all possible issues that can go wrong. It doesn't include logic to clean things up if a Workflow is cancelled, and it doesn't handle other edge cases where money would be withdrawn but not deposited. There's also the possibility that this Workflow can fail when refunding the money to the original account. In a production scenario, you'll want to account for those cases with more advanced logic, including adding a "human in the loop" step where someone is notified of the refund issue and can intervene.


This example only shows some core features of Temporal and is not intended for production use.
:::


When you _start_ a Workflow, you are telling the Temporal Server, "Track the state of the Workflow with this method signature." Workers execute the Workflow code piece by piece, relaying the execution events and results back to the server.


Let's see that in action.


## Start the Workflow


You have two ways to start a Workflow with Temporal, either through the [Temporal command-line tool](https://docs.temporal.io/cli) or the [SDK](https://docs.temporal.io/encyclopedia/temporal-sdks). In this tutorial, you use the SDK to start the Workflow, which is how most Workflows get started in a live environment.


First, make sure the local [Temporal Service](https://docs.temporal.io/clusters) is running in a Terminal from the [previous tutorial](https://learn.temporal.io/getting_started/dotnet/dev_environment/). This is done by opening a new terminal window and running the following command:
```command
temporal server start-dev \
    --log-level=never \
    --ui-port 8080
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

Initiating transfer of $19 from [Account 300891909] to [Account 748137397].

[WorkflowID: money-transfer-workflow]
[RunID: 158fdc2a-ab9e-4960-9828-c92e6ff05874]
[Transaction Reference: 10541c87-1b17-4fa5]
```


To start a Workflow, you connect to the Temporal Cluster, specify the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue), the Workflow should use, and Activities it expects in your code. In this tutorial, this is a small command-line program that starts the Workflow Execution.


In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL.


The Temporal Server is an essential part of the overall system, but requires additional components for operation. The complete system is known as the Temporal Service, which is a deployment of the Temporal Server, plus the additional components used with it such as a database like Apache Cassandra, PostgreSQL, or MySQL.


The Task Queue is where Temporal Workers look for Workflows and Activities to execute. You define Task Queues by assigning a name as a string. You'll use this Task Queue name when you start a Workflow Execution, and you'll use it again when you define your Workers.


<!--SNIPSTART money-transfer-java-shared-->
<!--SNIPEND-->



:::note


This tutorial uses a separate program to start the Workflow, but you don't have to follow this pattern. In fact, most real applications start a Workflow as part of another program. For example, you might start the Workflow in response to a button press or an API call.


:::



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


![Input and results](images/inputs_results.png)


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
<!--SNIPEND-->

When you start the Worker, it begins polling the Task Queue for Tasks to process. The terminal output from the Worker looks like this:


```
Worker is running and actively polling the Task Queue.
To quit, use ^C to interrupt.

Withdrawing $19 from account 300891909.
[ReferenceId: 10541c87-1b17-4fa5]

Depositing $19 into account 748137397.
[ReferenceId: 10541c87-1b17-4fa5]
[10541c87-1b17-4fa5] Transaction succeeded.
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


wefwef


## ![](/img/icons/warning.png) Simulate failures


Despite your best efforts, there's going to be a time when something goes wrong in your application. You might encounter a network glitch, a server might go offline, or you might introduce a bug into your code. One of Temporal's most important features is its ability to maintain the state of a Workflow when something fails. To demonstrate this, you will simulate some failures for your Workflow and see how Temporal responds.


### Recover from a server crash


Unlike many modern applications that require complex processes and external databases to handle failure, Temporal automatically preserves the state of your Workflow even if the server is down. You can test this by stopping the local Temporal Cluster while a Workflow is running.


Try it out by following these steps:


1. Make sure your Worker is stopped before proceeding, so your Workflow doesn't finish. Switch to the terminal that's running your Worker and stop it by pressing `CTRL+C`.
2. Switch back to the terminal where your Workflow ran. Start the Workflow again with `dotnet run --project MoneyTransferClient`.
3. Verify the Workflow is running in the [Web UI](http://localhost:8233).
4. Shut down the Temporal Server by either using `CTRL+C` in the terminal window running the server.
5. After the Temporal Cluster has stopped, restart it and visit the UI. This can be done by running `temporal server start-dev` in the terminal window and navigating to [localhost:8233](http://localhost:8233/).


Your Workflow is still listed:


![The second Workflow appears in the list of Workflows](images/second_workflow.png)


Despite your best efforts, there's going to be a time when something goes wrong in your application. You might encounter a network glitch, a server might go offline, or you might introduce a bug into your code. One of Temporal's most important features is its ability to maintain the state of a Workflow when something fails. To demonstrate this, you will simulate some failures for your Workflow and see how Temporal responds.


### Recover from a server crash


Unlike many modern applications that require complex processes and external databases to handle failure, Temporal automatically preserves the state of your Workflow even if the server is down. You can test this by stopping the local Temporal Cluster while a Workflow is running.


Try it out by following these steps:


1. Make sure your Worker is stopped before proceeding, so your Workflow doesn't finish. Switch to the terminal that's running your Worker and stop it by pressing `CTRL+C`.
2. Switch back to the terminal where your Workflow ran. Start the Workflow again with `dotnet run --project MoneyTransferClient`.
3. Verify the Workflow is running in the [Web UI](http://localhost:8080).
4. Shut down the Temporal Server by either using `CTRL+C` in the terminal window running the server.
5. After the Temporal Cluster has stopped, restart it and visit the UI. This can be done by running `temporal server start-dev` in the terminal window and navigating to [localhost:8080](http://localhost:8080/).


Your Workflow is still listed:

## ![](/img/icons/warning.png) Simulate failures

Temporal is built to allow failure-prone processes to keep moving forward.
It provides the backbone and oversight that enables this without you having to develop the capability in your own code.
This keeps your code focused on your business logic and not on recovery strategies.

Despite your best efforts, services and other items will fail.
One of Temporal's most important features is its ability to maintain the state of a Workflow during a failure and continue on once that failure resolves.
To demonstrate this, you will simulate failures for your Workflow and see how Temporal responds.

### Recover from a server crash

Unlike many modern applications that require complex processes and external databases to handle failure, Temporal preserves the state of your Workflow Execution even if the server is down.
Test this by stopping the local Temporal Cluster while a Workflow is running.

Try it out by following these steps:

1. Stop your Worker.
   Switch to the terminal that's running your Worker and press `CTRL+C`.
1. Return to the terminal window running the development server.
   Shut it down with `CTRL+C`.
1. After the Temporal Cluster has stopped, restart it to use a local database.


   ```bash
   temporal server start-dev \
       --log-level=never \
       --ui-port 8080 \
   ```

1. Switch back to the terminal where your Workflow ran.
   Start a new Workflow Execution.


   ```bash
   mvn compile exec:java \
       -Dexec.mainClass="moneytransferapp.TransferApp" \
       -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
   ```

   Note the WorkflowID and RunID.
   They also appear in the WebUI and help you locate the process you were using.

1. Return to the development server terminal session.
   Shut it down with `CTRL+C`.
1. Re-start the server, using the same data.


   ```bash
   temporal server start-dev \
       --log-level=never \
       --ui-port 8080 \
       --db-filename=temporal.db
   ```

1. Verify the Workflow is running in the [Development Service Web UI](http://localhost:8080).

   ![](images/still-running.png)

When you add a database to your Temporal Service you can recover from where you left off, even when a service goes offline.
You pick up from where you left off when it comes back online again.

### Recover from an Activity error

Explore how Temporal responds to failed Activities and works with your timeout and retry policies
The `deposit` Activity lets you "fail" a deposit when you set `activityShouldSucceed` to `false`.

Your Worker app should not be running at this time.
Recompile it and run it to pick up this new logic.

```bash
mvn clean install \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=info 2>/dev/null
mvn compile exec:java \
    -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
```

:::note

You must compile and restart the Worker every time there's a change in code.

:::

Now visit the Worker running in the terminal window:

```bash
Withdrawing $63 from account 714985048.
[ReferenceId: cc935eb0-cfe1-421e]
Deposit failed
Deposit failed
Deposit failed
[cc935eb0-cfe1-421e] Deposit of $63 to account 993113084 failed.
[cc935eb0-cfe1-421e] Refunding $63 to account 714985048.

Refunding $63 to account 714985048.
[ReferenceId: cc935eb0-cfe1-421e]
[cc935eb0-cfe1-421e] Refund to originating account was successful.
[cc935eb0-cfe1-421e] Transaction is complete. No transfer made.
```

The Worker completed the `withdraw` activity but failed (as you set) with `deposit`.
In this log, the Activity ran out of time, stopped after 3 retries, and the Workflow moved onto the compensating activity.

### Review the failed Activity with the Development Server WebUI

Visit the [Temporal Web UI](http://localhost:8080) and click your Workflow Id to view the Workflow details.
The Event History is longer this time and contains an ActivityTaskFailed event.

![ActivityTaskFailed event](images/activity-task-failed-event.png)

Click on this to reveal the detail information about the failure call.

![ActivityTaskFailed event details](images/activity-task-failed-details.png)

### Retry logic

Without Temporal oversight, you must implement timeout and retry logic within the service code.
It makes it your code hard to read with your recovery logic living right next to business logic.
With Temporal, you can specify timeout configurations in the Workflow code as Activity options.

Temporal offers multiple ways to specify timeouts, including [Schedule-To-Start Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-start-timeout), [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout), [Start-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-start-to-close-timeout), and [Heartbeat Timeout](https://docs.temporal.io/concepts/what-is-a-heartbeat-timeout).
By default your code will be retried forever, unless a Schedule-To-Close Timeout or Start-To-Close Timeout is specified.
This is not a good outcome.
You want your code to complete (best outcome) or fail sensibly (an acceptable outcome), not to hang forever.
Failing "sensibly" means that you can revive your failed Workflows by changing the services it relies on or re-establishing other ways that ensure Workflow success.

### Increase the bug severity

Next, you'll make the Workflow fail harder.
That is, you'll override some code that makes `deposit` continue to fail and prevent the timeout and recovery mechanisms from stepping in.

1. Quit the Worker if it is still running.

1. Make sure the `deposit` will still fail.

   ```java
   boolean activityShouldSucceed = false;
   ```

1. Increase out the maximum number of attempts from 5 to a much bigger number:

   ```
   .setMaximumAttempts(5000)
   ```

1. Increase the schedule-to-close timeout from 5 seconds to a much bigger number:

   ```
   .setScheduleToCloseTimeout(Duration.ofSeconds(5000))
   ```

1. Compile and run the updated Worker


   ```bash
   mvn clean install \
       -Dorg.slf4j.simpleLogger.defaultLogLevel=info 2>/dev/null
   mvn compile exec:java \
       -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \
       -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
   ```

### Start a Workflow Execution

Next, you'll explore a Workflow Execution that cannot complete.

1. Start another Workflow:


   ```bash
   mvn compile exec:java -Dexec.mainClass="moneytransferapp.TransferApp" \
      -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
   ```

1. Wait for the Workflow to fail a few times.
   The Workflow keeps retrying using the RetryPolicy.
   Then quit from the Worker.

   ```
   Withdrawing $48 from account 420011264.
   [ReferenceId: 29de07b9-c795-4dbb]
   Deposit failed
   Deposit failed
   Deposit failed
   Deposit failed
   Deposit failed
   ^C
   ```

1. Visit the Web UI and view the Workflow.
   It will still be "Running".
   The Timeline will show multiple deposit attempts.

1. Return to your editor and set `activityShouldSucceed` to `true` in the `deposit` method.

1. Once again, compile and run the Worker:


   ```bash
   mvn clean install \
       -Dorg.slf4j.simpleLogger.defaultLogLevel=info 2>/dev/null
   mvn compile exec:java \
       -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \
       -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
   ```

Now, the transfer finally completes.
The Workflow picks up and continues from where it left off.

```
Depositing $48 into account 941350378.
[ReferenceId: 29de07b9-c795-4dbb]
[29de07b9-c795-4dbb] Transaction succeeded.
```

You have just fixed a bug in a running application.
You didn't lose the Workflow Execution state, didn't have to restart the transaction, and didn't have to repeat work.
The Workflow Execution picked up from where it left off.
It used the corrected code to move forward.

### Conclusion

You now know how to run a Temporal Workflow and understand a part of the value Temporal offers.
You explored Workflows and Activities, you started a Workflow Execution, and you ran a Worker to handle that execution.
You also saw how Temporal recovers from failures and how it retries Activities.

Temporal key advantages include:

1. Temporal gives you **full visibility** into the state of your Workflow and code execution.
1. Temporal **maintains the state** of your Workflow through server outages and errors.
1. Temporal lets you **time out and retry Activity code** with options outside your business logic.
1. Temporal helps you **perform "live debugging" of your business logic** while a Workflow is running.

Answer the following questions to see if you remember some of the more important concepts from this tutorial:

<details>
<summary>
Why should you define a shared constant to store the Task Queue name?
</summary>
The Task Queue name is used in two parts of the code.
The first starts the Workflow.
The second configures the Worker.
If their values differ, the Worker and Temporal Service would not share the same Task Queue.
The Workflow Execution could not progress.
</details>

<details>
<summary>
When you modify Activity code for a running Workflow, what do you need to do?
</summary>
Restart the Worker so it picks up the updated details and can apply them to Activity Tasks.
</details>
