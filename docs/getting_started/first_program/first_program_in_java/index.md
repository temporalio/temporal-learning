---
id: run-your-first-app-tutorial
sidebar_position: 1
title: Run your first Temporal application with the Java SDK
---

import { ResponsivePlayer } from '@site/src/components'

<img alt="" class="docs-image-centered" src="https://raw.githubusercontent.com/temporalio/documentation-images/main/static/rocket-launch-java.jpg" />

:::note Tutorial information

- **Level**: ⭐ Temporal beginner
- **Time**: ⏱️ ~20 minutes
- **Goals**: 🙌
  - Complete several runs of a Temporal Workflow application using the Temporal server and the [Java SDK](https://github.com/temporalio/java-sdk).
  - Practice reviewing the state of the Workflow.
  - Understand the inherent reliability of Workflow functions.
  - Learn many of Temporal's core terminology and concepts.

:::

The [Temporal server](https://github.com/temporalio/temporal) and a language specific SDK, in this case the [Java SDK](https://github.com/temporalio/java-sdk), provide a comprehensive solution to the complexities which arise from modern application development. You can think of Temporal as a sort of "cure all" for the pains you experience as a developer when trying to build reliable applications. Temporal provides reliability primitives right out of the box, such as seamless and fault tolerant application state tracking, automatic retries, timeouts, databases to track application states, rollbacks due to process failures, and more.

In this tutorial you'll run your first Temporal Workflow application and forever change the way you approach application development.

Keep reading or follow along with this video walkthrough:

<ResponsivePlayer url='https://youtu.be/jjRu8GJgL1k'/>

## ![](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/repair-tools.png) Project setup

Before starting, make sure you have looked over the [tutorial prerequisites](https://docs.temporal.io/java/tutorial-prerequisites) setup.
- Ensure the Temporal Server is running (using [Docker is the fastest way](https://docs.temporal.io/application-development-guide/#run-a-dev-cluster))
- Make sure you have the [Java JDK](https://www.oracle.com/ca-enhttps://docs.temporal.io/java/technologies/javase-downloads.html) installed. These tutorials were produced using Java SE 14.0.1. You can check which version you have installed using the command  `java -version`.
- Install [Gradle](https://gradle.org/install/), a dependency management and build tool that Temporal uses for Java projects. You can also install the [IntelliJ IDEA](https://www.jetbrains.com/idea/) IDE which includes Gradle.


This tutorial uses a fully working template application which can be downloaded as a zip or converted to a new repository in your own Github account and cloned. Github's [creating a repository from a template guide](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template) will walk you through the steps.

- To use the [Github project](https://github.com/temporalio/money-transfer-project-template-java), execute these commands in a new Terminal window:

  ```bash
  git clone https://github.com/temporalio/money-transfer-project-template-java
  cd money-transfer-project-template-java
  ```

- [Zip download](https://github.com/temporalio/money-transfer-project-template-java/archive/master.zip)


To build the project, either open the project folder with [IntelliJ](https://www.jetbrains.com/idea/) (the project will build automatically) or make sure you have [Gradle](https://gradle.org/install/) installed and run the Gradle build command from the root of the project:

```bash
./gradlew build
```

The project will build and you'll see the following message when it completes:

```
BUILD SUCCESSFUL in 13s                                                                                                                │id": "wg5ndWVJQnipp7BQ2YohUQ"  }
5 actionable tasks: 5 executed
```

Now that the project is built, you can explore the application.

## ![](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/workflow.png) Application overview

This project template mimics a "money transfer" application that has a single [Workflow function](https://docs.temporal.io/java/workflows) which orchestrates the execution of an `Account` object's `withdraw()` and `deposit()` methods, representing a transfer of money from one account to another. Temporal calls these particular methods [Activity functions](https://docs.temporal.io/java/activities).

To run the application you will do the following:

1. Send a signal to the Temporal server to start the money transfer. The Temporal server will track the progress of your Workflow function execution.
2. Run a Worker. A Worker is a wrapper around your compiled Workflow and Activity code. A Worker's only job is to execute the Activity and Workflow functions and communicate the results back to the Temporal server.

Here's a high-level illustration of what's happening:

![High level project design](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/temporal-high-level-application-design.png)

### The Workflow function

The Workflow function is the application entry point. This is what our money transfer Workflow looks like:

<!--SNIPSTART money-transfer-project-template-java-workflow-implementation-->
<!--SNIPEND-->

When you "start" a Workflow you are basically telling the Temporal server, "track the state of the Workflow with this function signature". Workers will execute the Workflow code below, piece by piece, relaying the execution events and results back to the server.

### Initiate transfer

There are two ways to start a Workflow with Temporal, either via the SDK or via the [CLI](https://docs.temporal.io/tctl). For this tutorial we used the SDK to start the Workflow, which is how most Workflows get started in a live environment. The call to the Temporal server can be done [synchronously or asynchronously](https://docs.temporal.io/java/workflows). Here we do it asynchronously, so you will see the program run, tell you the transaction is processing, and exit.

<!--SNIPSTART money-transfer-project-template-java-workflow-initiator-->
<!--SNIPEND-->

### Running the Workflow

Make sure the [Temporal server](https://docs.temporal.io/clusters/quick-install) is running in a terminal. Then run the `InitiateMoneyTransfer` class within IntelliJ or from the project root using the following command:

```bash
./gradlew initiateTransfer
```

You'll see the following output:

```
> Task :initiateTransfer
09:59:20.966 [main] INFO  i.t.s.WorkflowServiceStubsImpl - Created WorkflowServiceStubs for channel: ManagedChannelOrphanWrapper{delegate=ManagedChannelImpl{logId=1, target=127.0.0.1:7233}}

Transfer of $18.740000 from account 001-001 to account 002-002 is processing

WorkflowID: money-transfer-workflow RunID: 2264a82e-479d-46fa-87cf-9f6dd1eba3b7

BUILD SUCCESSFUL in 7s
3 actionable tasks: 1 executed, 2 up-to-date
```

<details>
<summary>Troubleshooting</summary>

If you get `Connection refused: /127.0.0.1:7233` error, make sure the [Temporal server is running](https://docs.temporal.io/clusters/quick-install).

If you get `ALREADY_EXISTS: Workflow execution is already running. WorkflowId: money-transfer-workflow, RunId:<...>`, stop your Temporal docker-compose process [started earlier](https://docs.temporal.io/clusters/quick-install) and recreate Temporal docker-compose containers using:

```bash
docker-compose rm -f
docker-compose up
```

</details>

### State visibility

OK, now it's time to check out one of the really cool value propositions offered by Temporal: application state visibility. Visit the [Temporal Web UI](http://localhost:8080) where you will see your Workflow listed.

![The workflow running](images/workflow_running.png)

Next, click the ID for your Workflow. Now you can see everything you want to know about the execution of the Workflow code we told the server to track, such as what parameter values it was given, timeout configurations, scheduled retries, number of attempts, stack traceable errors, and more.

![The details of the run.](images/workflow_status.png)

It also tells you that there was an error.  You need at least one worker running in order to execute your workflows. 

### The Worker

It's time to start the Worker. A Worker is responsible for executing pieces of Workflow and Activity code.

- It can only execute code that has been registered to it.
- It knows which piece of code to execute from Tasks that it gets from the Task Queue.
- It only listens to the Task Queue that it is registered to.

After The Worker executes code, it returns the results back to the Temporal Server.
Note that the Worker listens to the same Task Queue that the Workflow and Activity Tasks are sent to.
This is called "Task routing", and is a built-in mechanism for load balancing.

<!--SNIPSTART money-transfer-project-template-java-worker-->
<!--SNIPEND-->

Task Queues are defined by a simple string name.

<!--SNIPSTART money-transfer-project-template-java-shared-constants-->
<!--SNIPEND-->

### Running the Worker

Run the `TransferMoneyWorker` class from IntelliJ, or run the following command from the project root in a separate terminal:

```
./gradlew startWorker
```

When you start the Worker it begins polling the Task Queue. 

```
> Task :startWorker
10:12:06.235 [main] INFO  i.t.s.WorkflowServiceStubsImpl - Created WorkflowServiceStubs for channel: ManagedChannelOrphanWrapper{delegate=ManagedChannelImpl{logId=1, target=127.0.0.1:7233}}
10:12:06.442 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Workflow Poller taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default", identity=79869@temporal.local}
10:12:06.443 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Local Activity Poller taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default", identity=79869@temporal.local}
10:12:06.444 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Activity Poller taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default", identity=79869@temporal.local}
10:12:06.445 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Host Local Workflow Poller, identity=66833119-96d5-4034-a340-9cc0a0ee5a2c}
<=========----> 75% EXECUTING [26s]
> :startWorker
```


You will see output in the console showing that both activity tasks were executed by the Worker:

```
Withdrawing $18.740000 from account 001-001. ReferenceId: 7f126f98-7c77-4dd1-aab9-99f74dd6a29b

Depositing $18.740000 into account 002-002. ReferenceId: 7f126f98-7c77-4dd1-aab9-99f74dd6a29b
```

If you check the Temporal Web UI again, you will see one Worker registered where previously there was none, and the Workflow status will show that its completed:

![There is now one worker and the Workflow is complete](images/completed_workflow.png)

:::tip What actually happens under the hood

> - The first Task the Worker finds is the one that tells it to execute the Workflow function.
> - The Worker communicates the event back to the server.
> - This causes the server to send Activity Tasks to the Task Queue.
> - The Worker then grabs each of the Activity Tasks in their respective order from the Task Queue and executes each of the corresponding Activities.
>
> Each of these are **History Events** that can be audited in Temporal Web (under the `History` tab next to `Summary`). Once a workflow is completed and closed, the full history will persist for a set retention period (typically 7-30 days) before being deleted. You can set up [the Archival feature](https://docs.temporal.io/concepts/what-is-archival) to send them to long term storage for compliance/audit needs.

:::

<img alt="Celebratory confetti" class="docs-image-centered docs-image-max-width-20" src="https://raw.githubusercontent.com/temporalio/documentation-images/main/static/confetti.png" />

You've just ran a Temporal Workflow application!

## ![](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/warning.png) Failure simulation

You just got a taste of one of Temporal's amazing value propositions: visibility into the Workflow and the status of the Workers executing the code. Let's explore another key value proposition, maintaining the state of a Workflow, even in the face of failures. To demonstrate this you will simulate some failures for your Workflow. Make sure your Worker is stopped before proceeding by pressing `CTRL+C`.

### Recover from a Server crash

Unlike many modern applications that require complex leader election processes and external databases to handle failure, Temporal automatically preserves the state of your Workflow even if the server is down. You can easily test this by following these steps (again, make sure your Worker is stopped so your Workflow doesn't finish):

1. Start the Workflow again with `./gradlew initiateTransfer`.
2. Visit `http://localhost:8080/` and Verify the new Workflow is running in the UI.
3. Shut down the Temporal server by either using `CTRL+C` in the terminal window running the server or via the Docker dashboard.
4. After the Temporal server has stopped, restart it with `docker compose up` and visit the UI at `http://localhost:8080` again.

Your Workflow is still listed:

![The second workflow is listed](images/second_workflow.png)

### Recover from an Activity error

Next you'll simulate a bug in the `deposit()` Activity method. Let your Workflow continue to run but don't start the Worker yet.

Inside your project, open the file `src/mainhttps://docs.temporal.io/java/moneytransferapp/AccountActivityImpl.java` and uncomment the line that throws an Exception in the `deposit()` method.

<!--SNIPSTART money-transfer-project-template-java-activity-implementation-->
<!--SNIPEND-->

Save your changes to the file.

Now run the Worker:

```bash
./gradlew startWorker
```

You will see the Worker complete the `withdraw()` Activity method, but throw the Exception when it attempts the `deposit()` Activity method.  The important thing to note here is that the Worker keeps retrying the `Deposit()` function:

```bash
> Task :startWorker
10:27:29.770 [main] INFO  i.t.s.WorkflowServiceStubsImpl - Created WorkflowServiceStubs for channel: ManagedChannelOrphanWrapper{delegate=ManagedChannelImpl{logId=1, target=127.0.0.1:7233}}
10:27:29.979 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Workflow Poller taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default", identity=81214@temporal.local}
10:27:29.981 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Local Activity Poller taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default", identity=81214@temporal.local}
10:27:29.982 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Activity Poller taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default", identity=81214@temporal.local}
10:27:29.983 [main] INFO  io.temporal.internal.worker.Poller - start: Poller{name=Host Local Workflow Poller, identity=e3eb0c2a-17f1-44b9-be79-6b236bbfb25b}

Withdrawing $18.740000 from account 001-001. ReferenceId: f9035c64-8b06-4c08-8c50-cfcdf32ce3f5

Depositing $18.740000 into account 002-002. ReferenceId: f9035c64-8b06-4c08-8c50-cfcdf32ce3f5
10:27:31.577 [Activity Executor taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default": 1] WARN  i.t.i.a.POJOActivityTaskHandler - Activity failure. ActivityId=39b73458-ed6e-36ed-9beb-281f9896dc93, activityType=Deposit, attempt=1
java.lang.RuntimeException: simulated
        at moneytransferapp.AccountActivityImpl.deposit(AccountActivityImpl.java:23)
        at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:104)
        at java.base/java.lang.reflect.Method.invoke(Method.java:577)
        at io.temporal.internal.activity.POJOActivityTaskHandler$POJOActivityInboundCallsInterceptor.execute(POJOActivityTaskHandler.java:214)
        at io.temporal.internal.activity.POJOActivityTaskHandler$POJOActivityImplementation.execute(POJOActivityTaskHandler.java:180)
        at io.temporal.internal.activity.POJOActivityTaskHandler.handle(POJOActivityTaskHandler.java:120)
        at io.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:204)
        at io.temporal.internal.worker.ActivityWorker$TaskHandlerImpl.handle(ActivityWorker.java:164)
        at io.temporal.internal.worker.PollTaskExecutor.lambda$process$0(PollTaskExecutor.java:93)
        at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
        at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
        at java.base/java.lang.Thread.run(Thread.java:833)

Depositing $18.740000 into account 002-002. ReferenceId: f9035c64-8b06-4c08-8c50-cfcdf32ce3f5
10:27:32.615 [Activity Executor taskQueue="MONEY_TRANSFER_TASK_QUEUE", namespace="default": 2] WARN  i.t.i.a.POJOActivityTaskHandler - Activity failure. ActivityId=39b73458-ed6e-36ed-9beb-281f9896dc93, activityType=Deposit, attempt=2
java.lang.RuntimeException: simulated
        at moneytransferapp.AccountActivityImpl.deposit(AccountActivityImpl.java:23)

        ...


# it keeps retrying... with the RetryPolicy specified in workflow.go
```


You can view more information about what is happening in the [UI](localhost:8080). Click on the Workflow where you can see details about the pending Activity:

![The next activity](images/activity_failure.png)

Click **Stack trace** to  see a stack trace showing you the errors:

![The stack trace](images/stack_trace.png)

Select the **Pending Activities** link to see more details including its state, the number of times it has been attempted, and the next scheduled run time:

![More details about the activity](images/activity_failure_details.png)

<br/>

Traditionally application developers are forced to implement timeout and retry logic within the business code itself. With Temporal, one of the key value propositions is that timeout configurations ([Schedule-To-Start Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-start-timeout), [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout), [Start-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-start-to-close-timeout), and [Heartbeat Timeout](https://docs.temporal.io/concepts/what-is-a-heartbeat-timeout)) and [Retry Policies](https://docs.temporal.io/concepts/what-is-a-retry-policy) are specified in the Workflow code as Activity options. In our Workflow code you can see that we have specified a setStartToCloseTimeout for our Activities, and set a retry policy that tells the server to retry them up to 500 times. But we did that as an example for this tutorial, as Temporal automatically uses a default retry policy if one isn't specified!

Your Workflow is running, but only the `withdraw()` Activity method has succeeded. In any other application, the whole process would likely have to be abandoned and rolled back.  So, here is the last value proposition of this tutorial: With Temporal, we can debug the issue while the Workflow is running! 

Pretend that you found a fix for the issue; Re-comment the Exception in the AccountActivityImpl.java file and save your changes. 

How can you possibly update a Workflow that is already halfway complete? You restart the Worker!

First, cancel the worker with `CTRL+C`.

Then restart the worker:

```bash
./gradlew startWorker
```

On the next scheduled attempt, the Worker will pick up right where the Workflow was failing and successfully execute the newly compiled `deposit()` Activity method, completing the Workflow. Basically, you have just fixed a bug "on the fly" with out losing the state of the Workflow.

Visit the [UI](http://localhost:8080) again and you'll see the workflow has completed:

![Both workflows completed successfully](images/completed_workflows.png)

You now know how to run a Temporal Workflow and understand some of the key values Temporal offers.

<img alt="Business person blasting off with a backpack rocket" class="docs-image-centered docs-image-max-width-20" src="https://raw.githubusercontent.com/temporalio/documentation-images/main/static/boost.png" />

## ![](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/wisdom.png) Review

Let's do a quick review to make sure you remember some of the more important pieces.

<Expander text="What are four of Temporal's value propositions that you learned about in this tutorial?">

1. Temporal gives you full visibility in the state of your Workflow and code execution.
2. Temporal maintains the state of your Workflow, even through server outages and errors.
3. Temporal makes it easy to timeout and retry Activity code using options that exist outside of your business logic.
4. Temporal enables you to perform "live debugging" of your business logic while the Workflow is running.

</Expander>

<Expander text="How do you pair up Workflow initiation with a Worker that executes it?">
  Use the same Task Queue.
</Expander>

<Expander text="What do you have to do if you make changes to Activity code for a Workflow that is running?">
  Restart the Worker.
</Expander>
