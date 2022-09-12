---
id: run-your-first-app-tutorial
sidebar_position: 2
description: In this tutorial you will run your first Temporal app using the Go SDK.
keywords: [go, golang, temporal, sdk, tutorial, example, workflow, worker, getting started, errors]
tags: [Go, SDK]
last_update:
  date: 2022-09-12
title: Run your first Temporal application with the Go SDK
---

![Your first program in Go](images/banner.jpg)

:::note Tutorial information

- **Level**: ⭐ Temporal beginner
- **Time**: ⏱️ ~20 minutes
- **Goals**: 🙌
  - Explore Temporal's core terminology and concepts.
  - Complete several runs of a Temporal Workflow application using the Temporal server and the [Go SDK](https://github.com/temporalio/go-sdk).
  - Practice reviewing the state of the Workflow.
  - Understand the inherent reliability of Workflow functions.

:::

## Introduction

Whether you're writing a complex transaction-based workflow, or working with remote APIs, you know that creating reliable applications is a complex process.

The Temporal server and a language specific SDK, in this case the [Go SDK](https://github.com/temporalio/go-sdk), provide a comprehensive solution to the complexities which arise from modern application development. You can think of Temporal as a sort of "cure all" for the pains you experience as a developer when trying to build reliable applications.

Temporal provides reliability primitives right out of the box, such as seamless and fault tolerant application state tracking, automatic retries, timeouts, rollbacks due to process failures, and more.

In this tutorial you'll run your first Temporal application and explore how Temporal Workflows and Activities work together. You'll use Temporal's Web UI to see how your Workflow executed, and then explore how Temporal helps you recover from errors.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal applications using the Go programming language](/getting_started/go/dev_environment/index.md)
- Ensure you have Git installed to clone the project.



## ![](/img/icons/workflow.png) Application overview

This project template mimics a "money transfer" application that has a single [Workflow function](https://docs.temporal.io/application-development/foundations/?lang=go#develop-workflows) which orchestrates the execution of `Withdraw()` and `Deposit()` functions, representing a transfer of money from one account to another. Temporal calls these particular functions [Activity functions](https://docs.temporal.io/application-development/foundations/?lang=go#develop-activities).

To run the application you will do the following:

1. Send a signal to the Temporal server to start the money transfer. The Temporal server will track the progress of your Workflow function execution.
2. Run a Worker. A Worker is a wrapper around your compiled Workflow and Activity code. A Worker's only job is to execute the Activity and Workflow functions and communicate the results back to the Temporal server.

The following diagram illustrates what happens when you start the Workflow:

![High level project design](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/temporal-high-level-application-design.png)

Temporal's server does not run your code. Your Worker, Workflow, and Activity run on your infrastructure, along with the rest of your applications.

Now that you know how the application will work, it's time to download the application to your local machine so you can try it out yourself.

## ![](/img/icons/download.png) Download the example application

The application you'll use in this tutorial is available in a [GitHub repository](https://github.com/temporalio/money-transfer-project-template-go).

Open a new terminal window and use `git` to clone the repository:

```command
git clone https://github.com/temporalio/money-transfer-project-template-go
```

Once the files are cloned, change to the project directory:

```command
cd money-transfer-project-template-go
```

:::tip

The repository for this tutorial is a GitHub Template repository, which means you could clone it to your own account and use it as the foundation for your own Temporal application. Github's [Creating a Repository from a Template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template) guide will walk you through the steps.

If you convert the template to a new repository and change the name, make sure you change the `go.mod` file to reflect the new project name.
:::


With the project downloaded, let's explore the code, starting with the Workflow.

## Explore the application's Workflow and Activity Definitions

A Temporal application is a set of [Temporal Workflow Executions](https://docs.temporal.io/workflows#workflow-execution), which are reliable, durable function executions. These Workflow Executions orchestrate the execution of [Activities](https://docs.temporal.io/activities), which execute a single, well-defined action, such as calling another service, transcoding a media file, or sending an email message. 

You use a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition) to define the Workflow Execution's constraints. A Workflow Definition in Go is a regular Go function that accepts a Workflow Context and some input values. This is what the money transfer Workflow Definition looks like:

<!--SNIPSTART money-transfer-project-template-go-workflow-->
<!--SNIPEND-->

In this case, the `TransferMoney` function accepts a value called `transferDetails` which is a data structure that holds the details the Workflow will use to perform the money transfer, which is defined in the file `shared.go`: 

<!--SNIPSTART money-transfer-project-template-go-transferdetails-->
<!--SNIPEND-->

The Workflow Definition then calls two Activities, `Withdraw` and `Deposit`. Activities are where you perform the business logic for your application. Like Workflows, you define Activities in Go by defining Go functions which receive a `context` and some input values.

In this tutorial, the `withdraw` Activity takes in the details about the transfer and prints values to the screen:

<!--SNIPSTART money-transfer-project-template-go-activity-withdraw-->
<!--SNIPEND-->

The `Deposit` function looks almost identical:

<!--SNIPSTART money-transfer-project-template-go-activity-deposit-->
<!--SNIPEND-->

There's a commented line in this Activity definition which you'll use later in the tutorial to simulate an error in the Activity.

The Workflow executes both of these Activities, receives their results, and then completes. 

:::tip Why you use Activities
At first glance, you might think you can incorporate your logic into the Workflow definition. However, Temporal Workflows have certain [deterministic constraints](https://docs.temporal.io/workflows#deterministic-constraints). For example, they need to be repayable, and making changes to the Workflow code makes it much harder to replay. 

In addition, by using Activities, you can take advantage of Temporal's ability to retry Activities indefinitely, which you'll explore later in this tutorial.

Use Activities for your business logic, and use Workflows to coordinate the Activities.
:::

When you "start" a Workflow you are telling the Temporal server, "track the state of the Workflow with this function signature". Workers will execute the Workflow code piece by piece, relaying the execution events and results back to the server.

Let's see that in action.

## Start the Workflow 

There are two ways to start a Workflow with Temporal, either via the SDK or via the [CLI](https://docs.temporal.io/tctl). In this tutorial you'll use the SDK to start the Workflow, which is how most Workflows get started in a live environment.

In this tutorial, the file `start/main.go` contains a program that connects to the Temporal server and starts the workflow:


<!--SNIPSTART money-transfer-project-template-go-start-workflow-->
<!--SNIPEND-->

You can make the call  [synchronously or asynchronously](https://docs.temporal.io/go/workflows/#how-to-start-a-workflow). Here we do it asynchronously, so you will see the program run, tell you the transaction is processing, and exit.

:::note
This tutorial uses a separate program to start the workflow, but you don't have to follow this pattern. In fact, most real applications will start a Workflow as part of another program. For example, you may start the Workflow in response to a button press, or an API call. 
:::

Now that you've seen how to use the SDK to start a Workflow Execution, try running the program yourself.

Make sure the [Temporal server](https://docs.temporal.io/clusters/quick-install) is running in a terminal, and then run start/main.go from the project root using the following command:

```command
go run start/main.go
```

If this is your first time running this application, Go may download some dependencies initially, but eventually you will get some feedback that looks like this:

```bash
2022/09/12 11:50:04 INFO  No logger configured for temporal client. Created default one.
2022/09/12 11:50:04
Transfer of $54.990002 from account 001-001 to account 002-002 is processing. ReferenceID: f3627192-bc3f-44c4-9556-f81adddeb41a
2022/09/12 11:50:04
WorkflowID: transfer-money-workflow RunID: 8319df7c-bc08-46d3-b9c9-cece1f42329d
```

The workflow is now running. Now it's time to check out one of the unique value propositions Temporal offers: application state visibility. 

## View the state of the Workflow with the Temporal Web UI

Temporal's Web UI lets you see details about the Workflow you're running. You can use this tool to see the results of Activities and Workflows, and also identify problems with your Workflow execution.

Visit the [Temporal Web UI](http://localhost:8080) where you will see your Workflow listed.

![The workflow running](images/workflow_running.png)

Next, click the ID for your Workflow. Now you can see everything you want to know about the execution of the Workflow, including the  parameter values it received, timeout configurations, scheduled retries, number of attempts, stack traceable errors, and more. 

![The details of the run.](images/workflow_status.png)

You can see the inputs and results of the Workflow Execution by clicking the **Inputs and Results** section:

![Input and results](images/input_output.png)

It seems that the Workflow is "running", but the Workflow hasn't executed yet. As you see from the Web UI, there are no Workers polling the Task Queue.

You need at least one worker running in order to execute your workflows. 

## Start the Worker

It's time to start the Worker. A Worker is responsible for executing pieces of Workflow and Activity code.

- It can only execute code that has been registered to it.
- It knows which piece of code to execute from Tasks that it gets from the Task Queue.
- It only listens to the Task Queue that it is registered to.

After the Worker executes code, it returns the results back to the Temporal Server:

<!--SNIPSTART money-transfer-project-template-go-worker-->
<!--SNIPEND-->

Note that the Worker listens to the same Task Queue that the Workflow and Activity Tasks are sent to.

Task Queues are defined by a string name. To ensure your Task Queue names are consistent, place the Task Queue name in a variable you can share across your project.  In this project, you'll find the Task Queue name defined in the `shared.go` file:

<!--SNIPSTART money-transfer-project-template-go-shared-task-queue-->
<!--SNIPEND-->

In your Terminal, run `worker/main.go` from the project root using the following command:

```command
go run worker/main.go
```

When you start the Worker it begins polling the Task Queue.

The terminal output will look like this:

```bash
2022/09/12 12:03:16 INFO  No logger configured for temporal client. Created default one.
2022/09/12 12:03:16 INFO  Started Worker Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24404@temporal.local@
2022/09/12 12:05:15 DEBUG ExecuteActivity Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24404@temporal.local@ WorkflowType TransferMoney WorkflowID transfer-money-workflow RunID 8319df7c-bc08-46d3-b9c9-cece1f42329d Attempt 1 ActivityID 5 ActivityType Withdraw

Withdrawing $54.990002 from account 001-001. ReferenceId: f3627192-bc3f-44c4-9556-f81adddeb41a
2022/09/12 12:05:15 DEBUG ExecuteActivity Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24404@temporal.local@ WorkflowType TransferMoney WorkflowID transfer-money-workflow RunID 8319df7c-bc08-46d3-b9c9-cece1f42329d Attempt 1 ActivityID 11 ActivityType Deposit

Depositing $54.990002 into account 002-002. ReferenceId: f3627192-bc3f-44c4-9556-f81adddeb41a
```

Check the Temporal Web UI again and you will see one Worker registered where previously there was none, and the Workflow status shows that it is completed:

![There is now one worker and the Workflow is complete](images/completed_workflow.png)

:::tip What actually happens under the hood

> - The first Task the Worker finds is the one that tells it to execute the Workflow function.
> - The Worker communicates the event back to the server.
> - This causes the server to send Activity Tasks to the Task Queue.
> - The Worker then grabs each of the Activity Tasks in their respective order from the Task Queue and executes each of the corresponding Activities.
>
> Each of these are **History Events** that can be audited in Temporal Web (under the `History` tab next to `Summary`). Once a workflow is completed and closed, the full history will persist for a set retention period (typically 7-30 days) before being deleted. You can set up [the Archival feature](https://docs.temporal.io/concepts/what-is-archival) to send them to long term storage for compliance/audit needs.

:::

You've just ran a Temporal Workflow application!

## ![](/img/icons/warning.png) Simulate failures

You just got a taste of one of Temporal's amazing value propositions: visibility into the Workflow and the status of the Workers executing the code. Let's explore another key value proposition, maintaining the state of a Workflow, even in the face of failures. To demonstrate this you will simulate some failures for your Workflow. Make sure your Worker is stopped before proceeding by pressing `CTRL+C`.

### Recover from a server crash

Unlike many modern applications that require complex leader election processes and external databases to handle failure, Temporal automatically preserves the state of your Workflow even if the server is down. You can easily test this by following these steps (again, make sure your Worker is stopped so your Workflow doesn't finish):

1. Start the Workflow again with `go run starter/main.go`.
2. Verify the Workflow is running in the UI.
3. Shut down the Temporal server by either using `CTRL+C` in the terminal window running the server or via the Docker dashboard.
4. After the Temporal server has stopped, restart it and visit the UI.

Your Workflow is still listed:

![The second workflow is listed](images/second_workflow.png)

### Recover from an Activity error

Next you'll simulate a bug in the `Deposit()` Activity function. Let your Workflow continue to run but don't start the Worker yet.

Open the `activity.go` file and switch out the comments on the `return` statements such that the `Deposit()` function returns an error.

<!--SNIPSTART money-transfer-project-template-go-activity-->
<!--SNIPEND-->

Save your changes and run the Worker.

```command
go run worker/main.go
```

You will see the Worker complete the `Withdraw()` Activity function, but it errors when it attempts the `Deposit()` Activity function. The important thing to note here is that the Worker keeps retrying the `Deposit()` function.

```bash
2022/09/12 12:09:21 INFO  No logger configured for temporal client. Created default one.
2022/09/12 12:09:21 INFO  Started Worker Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@
2022/09/12 12:09:21 DEBUG ExecuteActivity Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkflowType TransferMoney WorkflowID transfer-money-workflow RunID c5eb94ae-926e-48e4-bb55-545fed7f3324 Attempt 1 ActivityID 5 ActivityType Withdraw

Withdrawing $54.990002 from account 001-001. ReferenceId: 92be67a3-fdc2-42ac-b160-fe84e8255103
2022/09/12 12:09:21 DEBUG ExecuteActivity Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkflowType TransferMoney WorkflowID transfer-money-workflow RunID c5eb94ae-926e-48e4-bb55-545fed7f3324 Attempt 1 ActivityID 11 ActivityType Deposit

Depositing $54.990002 into account 002-002. ReferenceId: 92be67a3-fdc2-42ac-b160-fe84e8255103
2022/09/12 12:09:21 ERROR Activity error. Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkflowID transfer-money-workflow RunID c5eb94ae-926e-48e4-bb55-545fed7f3324 ActivityType Deposit Attempt 1 Error deposit did not occur due to an issue

Depositing $54.990002 into account 002-002. ReferenceId: 92be67a3-fdc2-42ac-b160-fe84e8255103
2022/09/12 12:09:22 ERROR Activity error. Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkflowID transfer-money-workflow RunID c5eb94ae-926e-48e4-bb55-545fed7f3324 ActivityType Deposit Attempt 2 Error deposit did not occur due to an issue

Depositing $54.990002 into account 002-002. ReferenceId: 92be67a3-fdc2-42ac-b160-fe84e8255103
2022/09/12 12:09:24 ERROR Activity error. Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkflowID transfer-money-workflow RunID c5eb94ae-926e-48e4-bb55-545fed7f3324 ActivityType Deposit Attempt 3 Error deposit did not occur due to an issue

# it keeps retrying using the RetryPolicy specified in workflow.go
```

You can view more information about what is happening in the [UI](localhost:8080). Click on the Workflow. You'll see more details including the state, the number of times it has been attempted, and the next scheduled run time:

![The next activity](images/activity_failure.png)

Click  the **Stack Trace** link to see a stack trace showing you the errors, as well as details about the pending Activity:

![The stack trace of the Activity](images/stack_trace.png)

Traditionally, you're forced to implement timeout and retry logic within the service code itself.  This is repetitive and prone to errors.  With Temporal, one of the key value propositions is that you can specify timeout configurations in the Workflow code as Activity options. Temporal offers multiple ways to specify timeouts, including [Schedule-To-Start Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-start-timeout), [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout), [Start-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-start-to-close-timeout), and [Heartbeat Timeout](https://docs.temporal.io/concepts/what-is-a-heartbeat-timeout). 

In `workflow.go`, you can see that there's a `StartToCloseTimeout` specified for the Activities, and there's a Retry Policy that tells the server to retry the activities up to 500 times. You can read more about [Retries](https://docs.temporal.io/concepts/what-is-a-retry-policy) in the documentation.

Your Workflow is running, but only the `Withdraw()` Activity function has succeeded. In any other application, the whole process would likely have to be abandoned and rolled back. So, here is the last value proposition of this tutorial: With Temporal, you can debug and fix the issue while the Workflow is running.

Pretend that you found a fix for the issue; Switch the comments back on the `return` statements of the `Deposit()` function in the `activity.go` file and save your changes.

How can you possibly update a Workflow that is already halfway complete? You restart the Worker.

First, cancel the running worker with `CTRL+C`:

```bash
# continuing logs from previous retries...
Depositing $54.990002 into account 002-002. ReferenceId: 92be67a3-fdc2-42ac-b160-fe84e8255103
2022/09/12 12:14:24 ERROR Activity error. Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkflowID transfer-money-workflow RunID c5eb94ae-926e-48e4-bb55-545fed7f3324 ActivityType Deposit Attempt 11 Error deposit did not occur due to an issue

^C

2022/09/12 12:14:33 INFO  Worker has been stopped. Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ Signal interrupt
2022/09/12 12:14:33 INFO  Stopped Worker Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@
2022/09/12 12:14:33 WARN  Failed to poll for task. Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkerType WorkflowWorker Error worker stopping
2022/09/12 12:14:33 WARN  Failed to poll for task. Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 24907@temporal.local@ WorkerType ActivityWorker Error worker stopping
```

Then restart the worker:

```command
go run worker/main.go
```

The Worker starts again. On the next scheduled attempt, the Worker will pick up right where the Workflow was failing and successfully execute the newly compiled `Deposit()` Activity function, completing the Workflow:

```bash
2022/09/12 12:14:52 INFO  No logger configured for temporal client. Created default one.
2022/09/12 12:14:52 INFO  Started Worker Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 25348@temporal.local@

Depositing $54.990002 into account 002-002. ReferenceId: 92be67a3-fdc2-42ac-b160-fe84e8255103
```


Visit the [Web UI](http://localhost:8080) again and you'll see the workflow has completed:

![Both workflows completed successfully](images/completed_workflows.png)

You have just fixed a bug "on the fly" without losing the state of the Workflow.

## Conclusion

You now know how to run a Temporal Workflow and understand some of the key values Temporal offers. You explored Workflows and Activities, you started a Workflow Execution and then ran a Worker to handle that execution. You also saw how Temporal recovers from failures and how it retries Activities.

### Review

Answer the following questions to see if you remember some of the more important concepts from this tutorial:

<details>
<summary>

**What are four of Temporal's value propositions that you learned about in this tutorial?**

</summary>

1. Temporal gives you full visibility in the state of your Workflow and code execution.
2. Temporal maintains the state of your Workflow, even through server outages and errors.
3. Temporal makes it easy to time out and retry Activity code using options that exist outside of your business logic.
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
