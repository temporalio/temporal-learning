---
id: run-your-first-app-tutorial-java
title: Run your first Temporal application with the Java SDK
sidebar_position: 2
description: In this tutorial you will run your first Temporal app using the Java SDK
keywords: [ava, temporal, sdk, tutorial]
tags: [Java, SDK]
last_update:
  date: 2021-10-01
image: /img/temporal-logo-twitter-card.png
---

import { OutdatedNotice } from '@site/src/components'

<OutdatedNotice />

import { ResponsivePlayer } from '@site/src/components'

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

:::note Tutorial information

- **Level**: ⭐ Temporal beginner
- **Time**: ⏱️ ~20 minutes
- **Goals**: 🙌
  - Complete several runs of a Temporal Workflow application using the Temporal server and the [Java SDK](https://github.com/temporalio/java-sdk).
  - Practice reviewing the state of the Workflow.
  - Understand the inherent reliability of Workflow functions.
  - Learn many of Temporal's core terminology and concepts.

:::

## Introduction

The [Temporal server](https://github.com/temporalio/temporal) and a language specific SDK, in this case the [Java SDK](https://github.com/temporalio/java-sdk), provide a comprehensive solution to the complexities which arise from modern application development. You can think of Temporal as a sort of "cure all" for the pains you experience as a developer when trying to build reliable applications. Temporal provides reliability primitives right out of the box, such as seamless and fault tolerant application state tracking, automatic retries, timeouts, databases to track application states, rollbacks due to process failures, and more.

In this tutorial you'll run your first Temporal Workflow application and forever change the way you approach application development.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal applications using the Java programming language](/getting_started/java/dev_environment/index.md)
- Ensure you have Git installed to clone the project.

## ![](images/repair-tools.png) Project setup

This tutorial uses a fully working template application which can be downloaded as a zip or converted to a new repository in your own Github account and cloned. Github's ["Creating a Repository from a Template" guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template) will walk you through the steps.

- To use the [Github project](https://github.com/temporalio/money-transfer-project-template-java), execute these commands in a new Terminal window:

  ```command
  git clone https://github.com/temporalio/money-transfer-project-template-java
  ```

  ```command
  cd money-transfer-project-template-java
  ```

- [Zip download](https://github.com/temporalio/money-transfer-project-template-java/archive/refs/heads/master.zip)

To build the project, either open it with [IntelliJ](https://www.jetbrains.com/idea/) (the project will build automatically) or make sure you have [Gradle](https://gradle.org/install/) installed and run the Gradle build command from the root of the project:

```command
./gradlew build
```

Once your project has finished building, you are ready to go.

## ![](images/workflow.png) Application overview

This project template mimics a "money transfer" application that has a single [Workflow function](https://docs.temporal.io/java/workflows) which orchestrates the execution of an Account object's `withdraw()` and `deposit()` methods, representing a transfer of money from one account to another. Temporal calls these particular methods [Activity functions](https://docs.temporal.io/java/activities).

To run the application you will do the following:

1. Send a signal to the Temporal server to start the money transfer. The Temporal server will then start tracking the progress of your Workflow function execution.
2. Run a Worker. A Worker is a wrapper around your compiled Workflow and Activity code. A Worker's only job is to execute the Activity and Workflow functions and communicate the results back to the Temporal server.

Here's a high-level illustration of what's happening:

![High level project design](images/temporal-high-level-application-design.png)

### The Workflow function

The Workflow function is the application entry point. This is what our money transfer Workflow looks like:

<!--SNIPSTART money-transfer-project-template-java-workflow-implementation-->
<!--SNIPEND-->

When you "start" a Workflow you are basically telling the Temporal server, "track the state of the Workflow with this function signature". Workers will execute the Workflow code below, piece by piece, relaying the execution events and results back to the server.

### Initiate transfer

There are two ways to start a Workflow with Temporal, either via the SDK or via the [CLI](https://docs.temporal.io/tctl). For this tutorial we used the SDK to start the Workflow, which is how most Workflows get started in a live environment. The call to the Temporal server can be done [synchronously or asynchronously](https://docs.temporal.io/java/workflows). Here we do it asynchronously, so you will see the program run, tell you the transaction is processing, and exit.

<!--SNIPSTART money-transfer-project-template-java-workflow-initiator-->
<!--SNIPEND-->

Make sure the [Temporal cluster](https://docs.temporal.io/clusters/quick-install) is running in a terminal.

:::note
If you are using Temporal CLI, start your server and specify a database filename. Temporal CLI uses an in-memory database by default, and that won't work for the demonstrations in this tutorial.

Start Temporal CLI with the following command:

```command
temporal server start-dev --db-filename your_temporal.db --ui-port 8080
```

When you stop and start the server again, remember to specify the same database file each time.

:::


Run the `InitiateMoneyTransfer` class within IntelliJ or from the project root using the following command:

```command
./gradlew initiateTransfer
```


Next you'll explore one of the unique value propositions Temporal offers: application state visibility. 

## View the state of the Workflow with the Temporal Web UI

Temporal's Web UI lets you see details about the Workflow you're running. You can use this tool to see the results of Activities and Workflows, and also identify problems with your Workflow execution.

Visit the [Temporal Web UI](http://localhost:8080) where you will see your Workflow listed.

Next, click the "Run Id" for your Workflow. Now we can see everything we want to know about the execution of the Workflow code we told the server to track, such as what parameter values it was given, timeout configurations, scheduled retries, number of attempts, stack traceable errors, and more.

It seems that our Workflow is "running", but why hasn't the Workflow and Activity code executed yet? Investigate by clicking on the Task Queue name to view active "Pollers" registered to handle these Tasks. The list will be empty. There are no Workers polling the Task Queue!


### The Worker

It's time to start the Worker. A Worker is responsible for executing pieces of Workflow and Activity code.

- It can only execute code that has been registered to it.
- It knows which piece of code to execute from Tasks that it gets from the Task Queue.
- It only listens to the Task Queue that it is registered to.

After The Worker executes code, it returns the results back to the Temporal server. Note that the Worker listens to the same Task Queue that the Workflow and Activity tasks are sent to. This is called "Task routing", and is a built-in mechanism for load balancing.

<!--SNIPSTART money-transfer-project-template-java-worker-->
<!--SNIPEND-->

Task Queues are defined by a simple string name.

<!--SNIPSTART money-transfer-project-template-java-shared-constants-->
<!--SNIPEND-->

Run the `TransferMoneyWorker` class from IntelliJ, or run the following command from the project root in separate terminal:

```command
./gradlew startWorker
```

When you start the Worker it begins polling the Task Queue.
The first Task the Worker finds is the one that tells it to execute the Workflow function.
The Worker communicates the event back to the server which then causes the server to send Activity Tasks to the Task Queue as well.
The Worker then grabs each of the Activity Tasks in their respective order from the Task Queue and executes each of the corresponding Activities.
You will get a console output showing that both activity tasks were executed by the Worker:

```bash
Withdrawing $18.740000 from account 001-001. ReferenceId: 2ab46ccb-3791-4dd2-84e6-62319eb710a2

Depositing $18.740000 into account 002-002. ReferenceId: 2ab46ccb-3791-4dd2-84e6-62319eb710a2
```

<img alt="Celebratory confetti" class="docs-image-centered docs-image-max-width-20" src="images/confetti.png" />

**Congratulations**, you just ran a Temporal Workflow application!

## ![](images/warning.png) Failure simulation

So, you've just got a taste of one of Temporal's amazing value propositions: visibility into the Workflow and the status of the Workers executing the code. Let's explore another key value proposition, maintaining the state of a Workflow, even in the face of failures. To demonstrate this we will simulate some failures for our Workflow. Make sure your Worker is stopped before proceeding.

### Recover from a server crash

Unlike many modern applications that require complex leader election processes and external databases to handle failure, Temporal automatically preserves the state of your Workflow even if the server is down. You can easily test this by following these steps (again, make sure your Worker is stopped so your Workflow doesn't finish):

1. Start the Workflow again.
2. Verify the Workflow is running in the UI.
3. Shut down the Temporal server by either using 'Ctrl+C' or via the Docker dashboard.
5. After the Temporal cluster has stopped, restart it. If you are using Temporal CLI, run the same command you used previously to ensure you use the same database file.

Visit the UI. Your Workflow is still listed.

### Recover from an Activity error

Next let's simulate a bug in one of the Activity functions. Inside your project, open the `AccountActivityImpl.java` file and uncomment the line that throws an Exception in the `deposit()` method.

<!--SNIPSTART money-transfer-project-template-java-activity-implementation-->
<!--SNIPEND-->

Save your changes and run the Worker. You will see the Worker complete the `withdraw()` Activity method, but throw the Exception when it attempts the `deposit()` Activity method. The important thing to note here is that the Worker keeps retrying the `deposit()` method.

You can view more information about what is happening in the [UI](http://localhost:8080). Click on the RunId of the Workflow. You will see the pending Activity listed there with details such as its state, the number of times it has been attempted, and the next scheduled attempt.


<br/>

Traditionally application developers are forced to implement timeout and retry logic within the business code itself. With Temporal, one of the key value propositions is that timeout configurations ([Schedule-To-Start Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-start-timeout), [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout), [Start-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-start-to-close-timeout), and [Heartbeat Timeout](https://docs.temporal.io/concepts/what-is-a-heartbeat-timeout)) and [Retry Policies](https://docs.temporal.io/retry-policies) are specified in the Workflow code as Activity options. In our Workflow code you can see that we have specified a `setStartToCloseTimeout` for our Activities, and set a retry policy that tells the server to retry them up to 500 times. But we did that as an example for this tutorial, as Temporal automatically uses a default retry policy if one isn't specified!

So, your Workflow is running, but only the `withdraw()` Activity method succeeded. In any other application, the whole process would likely have to be abandoned and rolled back. So, here is the last value proposition of this tutorial: With Temporal, we can debug the issue while the Workflow is running! Pretend that you found a potential fix for the issue; Re-comment the Exception in the `AccountActivityImpl.java` file and save your changes. How can we possibly update Workflow code that is already halfway complete? With Temporal, it is actually very simple: just restart the Worker!

On the next scheduled attempt, the Worker will pick up right where the Workflow was failing and successfully execute the newly compiled `deposit()` Activity method, completing the Workflow. Basically, you have just fixed a bug "on the fly" with out losing the state of the Workflow.


## Conclusion

<img alt="Business person blasting off with a backpack rocket" class="docs-image-centered docs-image-max-width-20" src="images/boost.png" />

You now know how to run a Temporal Workflow and understand some of the key values Temporal offers.

### Review

Answer the following questions to see if you remember some of the more important concepts from this tutorial:

<details>
<summary>

**What are four of Temporal's value propositions that you learned about in this tutorial?**

</summary>

1. Temporal gives you full visibility in the state of your Workflow and code execution.
2. Temporal maintains the state of your Workflow, even through server outages and errors.
3. Temporal makes it easy to timeout and retry Activity code using options that exist outside of your business logic.
4. Temporal enables you to perform "live debugging" of your business logic while the Workflow is running.

</details>

<details>
<summary>

**How do you pair up Workflow initiation with a Worker that executes it?**

</summary>

Use the same Task Queue.

</details>

<details>
<summary>

**What do you have to do if you make changes to Activity code for a Workflow that is running?**

</summary>

Restart the Worker.

</details>
