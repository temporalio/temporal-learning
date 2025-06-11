---
title: Run your first Temporal application with the Python SDK
id: run-your-first-app-tutorial-python
sidebar_position: 2
description: In this tutorial, you'll run your first Temporal app using the Python SDK and explore Workflows, Activities, Task Queues, and compensating transactions. Then you'll see how Temporal recovers from failures.
keywords: [python, temporal, sdk, tutorial, example, workflow, worker, getting started, errors, failures, activity, temporal application, compensating transactions]
tags: [Python, SDK]
last_update:
  date: 2024-06-24
code_repo: https://github.com/temporalio/money-transfer-project-template-python
image: /img/temporal-logo-twitter-card.png
---

<img className="banner" src="/img/sdk_banners/banner_python.png" alt="Temporal Python SDK" />

:::note Tutorial information

- **Level**: ⭐ Temporal beginner
- **Time**: ⏱️ ~10 minutes
- **Goals**: 🙌
  - Explore Temporal's core terminology and concepts.
  - Complete several runs of a Temporal Workflow application using a Temporal Cluster and the [Python SDK](https://github.com/temporalio/sdk-python).
  - Practice reviewing the state of the Workflow.
  - Understand the inherent reliability of Workflow methods.

:::

### Introduction

You can think of Temporal as a sort of "cure-all" for the pains you experience as a developer when trying to build reliable applications. Whether you're writing a complex transaction-based Workflow or working with remote APIs, you know that creating reliable applications is a complex process. Developing your application on the Temporal Platform guarantees that your code runs to completion no matter what.

The language-specific SDK, in this case the Temporal [Python SDK](https://github.com/temporalio/sdk-python), provides a comprehensive solution to the complexities that arise from modern application development.

Temporal provides reliability primitives to ensure durable execution of your code, such as seamless and fault-tolerant application state tracking, automatic retries, timeouts, rollbacks due to process failures, and more.

In this tutorial, you'll run your first Temporal Application. You'll use Temporal's Web UI for application state visibility, and then explore how Temporal helps you recover from a couple of common failures.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal Applications using the Python programming language](/getting_started/python/dev_environment/index.md)
- Ensure you have Git installed to clone the project.

## ![](/img/icons/workflow.png) Application overview
In this tutorial, you will run a [Temporal Application](https://docs.temporal.io/temporal#temporal-application) using the [Temporal Python SDK](https://github.com/temporalio/sdk-python).

This project in this tutorial simulates a money transfer application, focusing on essential transactions such as withdrawals, deposits, and refunds. The importance of Temporal in this context lies in its ability to handle your code efficiently and reliably.

In this sample application, money comes out of one account and goes into another. However, there are a few things that can go wrong with this process. If the withdrawal fails, then there is no need to try to make a deposit. But if the withdrawal succeeds, but the deposit fails, then the money needs to go back to the original account.

One of Temporal's most important features is its ability to maintain the application state when something fails. When failures happen, Temporal recovers processes where they left off or rolls them back correctly. This allows you to focus on business logic, instead of writing application code to recover from failure.

Now that you know how the application will work, it's time to download the application to your local machine, so you can try it out yourself.

## ![](/img/icons/download.png) Download the example application

The application you'll use in this tutorial is available in a [GitHub repository](https://github.com/temporalio/money-transfer-project-template-python).

Open a new terminal window and use `git` to clone the repository:

```command
git clone https://github.com/temporalio/money-transfer-project-template-python
```

Once you have the repository cloned, change to the project directory:

```command
cd money-transfer-project-template-python
```

:::tip

The repository for this tutorial is a GitHub Template repository, which means you could clone it to your own account and use it as the foundation for your own Temporal application. GitHub's [Creating a Repository from a Template](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template) guide walks you through the steps.

:::

Now that you've downloaded the project, let's dive into the code.

## Explore the application's Workflow and Activity Definitions

The Temporal Application will consist of the following pieces:

1. A [Workflow](https://docs.temporal.io/workflows) written in your programming language of choice using the Python SDK. A Workflow defines the overall flow of the application.
2. An [Activity](https://docs.temporal.io/activities) is a method that encapsulates business logic prone to failure (e.g., calling a service that may go down). These Activities can be automatically retried upon some failure.
3. A [Worker](https://docs.temporal.io/workers), provided by the Temporal SDK, which runs your Workflow and Activities reliably and consistently.

Temporal applications are built using an abstraction called Workflows. You'll develop those Workflows by writing code in a general-purpose programming language such as Python. Conceptually, a Workflow defines a sequence of steps. With Temporal, those steps are defined by writing code, known as a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition), and are carried out by running that code, which results in a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).

These Workflow Executions orchestrate the execution of [Activities](https://docs.temporal.io/activities), which execute a single, well-defined action, such as calling another service, transcoding a media file, or sending an email message. In the money transfer application, you have three Activity methods, `withdraw()`, `deposit()`, and `refund()`. These symbolize the movement of funds between accounts.

The following diagram illustrates what happens when you start the Workflow:

![High-level project design](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/temporal-high-level-application-design.png)

None of your application code runs on the Temporal Server. Your Worker, Workflow, and Activity run on your infrastructure, along with the rest of your applications.


### Workflow Definition

A Workflow Definition in Python uses the **`@workflow.defn`** decorator on the Workflow class to identify a Workflow.

This is what the Workflow Definition looks like for this kind of process:

<!--SNIPSTART python-money-transfer-project-template-workflows-->
[workflows.py](https://github.com/temporalio/money-transfer-project-template-python/blob/main/workflows.py)
```py
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

with workflow.unsafe.imports_passed_through():
    from activities import BankingActivities
    from shared import PaymentDetails


@workflow.defn
class MoneyTransfer:
    @workflow.run
    async def run(self, payment_details: PaymentDetails) -> str:
        retry_policy = RetryPolicy(
            maximum_attempts=3,
            maximum_interval=timedelta(seconds=2),
            non_retryable_error_types=["InvalidAccountError", "InsufficientFundsError"],
        )

        # Withdraw money
        withdraw_output = await workflow.execute_activity_method(
            BankingActivities.withdraw,
            payment_details,
            start_to_close_timeout=timedelta(seconds=5),
            retry_policy=retry_policy,
        )

        # Deposit money
        try:
            deposit_output = await workflow.execute_activity_method(
                BankingActivities.deposit,
                payment_details,
                start_to_close_timeout=timedelta(seconds=5),
                retry_policy=retry_policy,
            )

            result = f"Transfer complete (transaction IDs: {withdraw_output}, {deposit_output})"
            return result
        except ActivityError as deposit_err:
            # Handle deposit error
            workflow.logger.error(f"Deposit failed: {deposit_err}")
            # Attempt to refund
            try:
                refund_output = await workflow.execute_activity_method(
                    BankingActivities.refund,
                    payment_details,
                    start_to_close_timeout=timedelta(seconds=5),
                    retry_policy=retry_policy,
                )
                workflow.logger.info(
                    f"Refund successful. Confirmation ID: {refund_output}"
                )
                raise deposit_err
            except ActivityError as refund_error:
                workflow.logger.error(f"Refund failed: {refund_error}")
                raise refund_error


```
<!--SNIPEND-->

- The `MoneyTransfer` class takes in transaction details. It executes Activities to withdraw and deposit the money. It also returns the results of the process.

- The asynchronous `run` method signature includes an `input` variable typed as `PaymentDetails`. This class stores details that the Workflow uses to perform the money transfer.

This type is defined in the file `shared.py`:

<!--SNIPSTART python-money-transfer-project-template-shared {"selectedLines": ["1", "6-12"]}-->
[shared.py](https://github.com/temporalio/money-transfer-project-template-python/blob/cloud/shared.py)
```py
from dataclasses import dataclass
# ...
@dataclass
class PaymentDetails:
    source_account: str
    target_account: str
    amount: int
    reference_id: str

```
<!--SNIPEND-->

:::tip

It's a good practice to send a single data class object into a Workflow as its input, rather than multiple, separate input variables. As your Workflows evolve, you may need to add additional inputs, and using a single argument will make it easier for you to change long-running Workflows in the future.

:::

:::note

Notice that the `PaymentDetails` includes a `reference_id` field. Some APIs let you send a unique _idempotency key_ along with the transaction details. This guarantees that if a failure occurs and you have to retry the transaction, the API you're calling will use the key to ensure it only executes the transaction once.

:::

### Activity Definition

In the Temporal Python SDK, you define an Activity by decorating a method with **`@activity.defn`**.

[Activities](https://docs.temporal.io/application-development/foundations/?lang=python#develop-activities) are where you perform the business logic for your application. In the money transfer application, you have three Activity methods, `withdraw()`, `deposit()`, and `refund()`. The Workflow Definition calls the Activities `withdraw()` and `deposit()` to handle the money transfers.

First, the `withdraw()` Activity takes the details about the transfer and calls a service to process the withdrawal:

<!--SNIPSTART python-money-transfer-project-template-withdraw {"selectedLines": ["12-35"]}-->
[activities.py](https://github.com/temporalio/money-transfer-project-template-python/blob/main/activities.py)
```py
# ...

    @activity.defn
    async def withdraw(self, data: PaymentDetails) -> str:
        reference_id = f"{data.reference_id}-withdrawal"
        try:
            confirmation = await asyncio.to_thread(
                self.bank.withdraw, data.source_account, data.amount, reference_id
            )
            return confirmation
        except InvalidAccountError:
            raise
        except Exception:
            activity.logger.exception("Withdrawal failed")
            raise

```
<!--SNIPEND-->

Second, if the transfer succeeded, the `withdraw()` method returns the confirmation.

Lastly, the `deposit()` Activity method looks almost identical to the `withdraw()` method. It similarly takes the transfer details and calls a service to process the deposit, ensuring the money is successfully added to the receiving account:

<!--SNIPSTART python-money-transfer-project-template-deposit-->
[activities.py](https://github.com/temporalio/money-transfer-project-template-python/blob/main/activities.py)
```py
    @activity.defn
    async def deposit(self, data: PaymentDetails) -> str:
        reference_id = f"{data.reference_id}-deposit"
        try:
            confirmation = await asyncio.to_thread(
                self.bank.deposit, data.target_account, data.amount, reference_id
            )
            """
            confirmation = await asyncio.to_thread(
                self.bank.deposit_that_fails,
                data.target_account,
                data.amount,
                reference_id,
            )
            """
            return confirmation
        except InvalidAccountError:
            raise
        except Exception:
            activity.logger.exception("Deposit failed")
            raise

```
<!--SNIPEND-->

:::tip Why you use Activities

At first glance, you might think you can incorporate your logic into the Workflow Definition. However, Temporal Workflows have certain [deterministic constraints](https://docs.temporal.io/workflows#deterministic-constraints) and must produce the same output each time, given the same input. This means that any non-deterministic work such as interacting with the outside world, like accessing files or network resources, must be done by Activities.

In addition, by using Activities, you can take advantage of Temporal's ability to retry Activities indefinitely, which you'll explore later in this tutorial.

Use Activities for your business logic, and use Workflows to coordinate the Activities.

:::

## Set the Retry Policy

Temporal makes your software durable and fault tolerant by default which allows you to code more reliable systems.

If an Activity fails, Temporal Workflows automatically retries the failed Activity by default. You can also customize how those retries happen through the [Retry Policy](https://docs.temporal.io/dev-guide/python/features#activity-retries).

At the top of the `MoneyTransfer` Workflow Definition, you'll see a Retry Policy defined that looks like this:

<!--SNIPSTART python-money-transfer-project-template-workflows {"selectedLines": ["16-20"]} -->
[workflows.py](https://github.com/temporalio/money-transfer-project-template-python/blob/main/workflows.py)
```py
# ...
        retry_policy = RetryPolicy(
            maximum_attempts=3,
            maximum_interval=timedelta(seconds=2),
            non_retryable_error_types=["InvalidAccountError", "InsufficientFundsError"],
        )
```
<!--SNIPEND-->


By default, Temporal retries failed Activities forever, but you can specify some errors that Temporal should not attempt to retry. In this example, it'll retry the failed Activity for 3 attempts, but if the Workflow encounters an error, it will refund money to the sender's account.

In the case of an error with the `deposit()` Activity, the Workflow will attempt to put the money back.

In this Workflow, each Activity uses the same Retry Policy options, but you could specify different options for each Activity.

:::caution This is a simplified example.

Transferring money is a tricky subject, and this tutorial's example doesn't cover all possible issues that can go wrong. It doesn't include logic to clean things up if a Workflow is cancelled, and it doesn't handle other edge cases where money would be withdrawn but not deposited. There's also the possibility that this Workflow can fail when refunding the money to the original account. In a production scenario, you'll want to account for those cases with more advanced logic, including adding a "human in the loop" step where someone is notified of the refund issue and can intervene.

This example only shows some core features of Temporal and is not intended for production use.
:::

When you _start_ a Workflow, you are telling the Temporal Server, "Track the state of the Workflow with this method signature." Workers execute the Workflow code piece by piece, relaying the execution events and results back to the server.

Let's see that in action.

## Start the Workflow

You have two ways to start a Workflow with Temporal, either through the [Temporal command-line tool](https://docs.temporal.io/cli) or the [SDK](https://docs.temporal.io/encyclopedia/temporal-sdks). In this tutorial, you use the SDK to start the Workflow, which is how most Workflows get started in a live environment.

First, make sure the local [Temporal Cluster](https://docs.temporal.io/clusters) is running in a terminal from the [previous tutorial](https://learn.temporal.io/getting_started/python/dev_environment/). This is done by opening a new terminal window and running the following command:
```command
temporal server start-dev
```

To start the Workflow, run `run_workflow.py` from the project root using the following command:

```command
python run_workflow.py
```

The Workflow is now running. Leave the program running.

To start a Workflow, you connect to the Temporal Cluster, specify the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue), the Workflow should use, and Activities it expects in your code. In this tutorial, this is a small command-line program that starts the Workflow Execution.

In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL.

The Temporal Server is an essential part of the overall system, but requires additional components for operation. The complete system is known as the Temporal Cluster, which is a deployment of the Temporal Server, plus the additional components used with it such as a database like Apache Cassandra, PostgreSQL, or MySQL.

The Task Queue is where Temporal Workflows look for Workflows and Activities to execute. You define Task Queues by assigning a name as a string. You'll use this Task Queue name when you start a Workflow Execution, and you'll use it again when you define your Workers.

<!--SNIPSTART python-money-transfer-project-template-shared {"selectedLines": ["3"]}-->
[shared.py](https://github.com/temporalio/money-transfer-project-template-python/blob/cloud/shared.py)
```py
# ...
MONEY_TRANSFER_TASK_QUEUE_NAME = "TRANSFER_MONEY_TASK_QUEUE"
```
<!--SNIPEND-->

:::note

This tutorial uses a separate program to start the Workflow, but you don't have to follow this pattern. In fact, most real applications start a Workflow as part of another program. For example, you might start the Workflow in response to a button press or an API call.

:::


Next, you'll explore one of the unique value propositions Temporal offers: application state visibility.

## View the state of the Workflow with the Temporal Web UI

Temporal records every execution, its progress, and application state through Temporal's Web UI. This provides insights into errors and app performance.

Temporal's Web UI lets you see details about the Workflow you're running. You can use this tool to see the results of Activities and Workflows, and also identify problems with your Workflow Execution.

1. Visit the [Temporal Web UI](http://localhost:8233) where you will see your Workflow listed. The link will direct you to localhost:8233.

![The Workflow running](images/workflow_running.png)

2. Click the **Workflow ID** for your Workflow.

Now you can see everything you want to know about the execution of the Workflow, including the input values it received, timeout configurations, scheduled retries, number of attempts, stack traceable errors, and more.

![The details of the run.](images/workflow_status.png)

3. You can see the inputs and results of the Workflow Execution by clicking the **Input and Results** section:

![Input and results](images/inputs_results.png)

You see your inputs, but the results are in progress.

You started the Workflow, and the interface shows that the Workflow is running, but the Workflow hasn't executed yet. As you see from the Web UI, there are no Workers connected to the Task Queue.

You need at least one Worker running to execute your Workflows. You'll start the Worker next.

## Start the Worker

A Worker is responsible for executing pieces of Workflow and Activity code. In this project, the file `run_worker.py` contains the code for the Worker.

Your `run_workflow.py` program is still running in your terminal, waiting for the Workflow to complete. Leave it running.

Open a new terminal window.

In this new terminal window, run `run_worker.py` from the project root using the following command:

```command
python run_worker.py
```

In production environments, Temporal applications often operate with hundreds or thousands of Workers. This is because adding more Workers not only enhances your application's availability but also boosts its scalability.

One thing that people new to Temporal may find surprising is that the Temporal Cluster does not execute your code. The entity responsible for executing your code is known as a Worker, and it's common to run Workers on multiple servers.

A Worker:

- Can only execute Workflows and Activities registered to it.
- Knows which piece of code to execute based on the Tasks it gets from the Task Queue.
- Only listens to the Task Queue that it's registered to.

After the Worker executes code, it returns the results back to the Temporal Server. Note that the Worker listens to the same Task Queue you used when you started the Workflow Execution.

Like the program that started the Workflow, it connects to the Temporal Cluster and specifies the Task Queue to use. It also registers the Workflow and the three Activities:


<!--SNIPSTART python-money-transfer-project-template-run-worker-->
[run_worker.py](https://github.com/temporalio/money-transfer-project-template-python/blob/main/run_worker.py)
```py
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import BankingActivities
from shared import MONEY_TRANSFER_TASK_QUEUE_NAME
from workflows import MoneyTransfer


async def main() -> None:
    client: Client = await Client.connect("localhost:7233", namespace="default")
    # Run the worker
    activities = BankingActivities()
    worker: Worker = Worker(
        client,
        task_queue=MONEY_TRANSFER_TASK_QUEUE_NAME,
        workflows=[MoneyTransfer],
        activities=[activities.withdraw, activities.deposit, activities.refund],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

When you start the Worker, it begins polling the Task Queue for Tasks to process. The terminal output from the Worker looks like this:

```output
2024/02/12 10:55:43 INFO  No logger configured for temporal client. Created default one.
2024/02/12 10:55:43 INFO  Started Worker Namespace default TaskQueue money-transfer WorkerID 76984@temporal.local@
2024/02/12 10:55:43 DEBUG ExecuteActivity Namespace default TaskQueue money-transfer WorkerID 76984@temporal.local@ WorkflowType MoneyTransfer WorkflowID pay-invoice-701 RunID 3312715c-9fea-4dc3-8040-cf8f270eb53c Attempt 1 ActivityID 5 ActivityType Withdraw
2024/02/12 10:55:43 Withdrawing $250 from account 85-150.

2024/02/12 10:55:43 DEBUG ExecuteActivity Namespace default TaskQueue money-transfer WorkerID 76984@temporal.local@ WorkflowType MoneyTransfer WorkflowID pay-invoice-701 RunID 3312715c-9fea-4dc3-8040-cf8f270eb53c Attempt 1 ActivityID 11 ActivityType Deposit
2024/02/12 10:55:43 Depositing $250 into account 43-812.
```

The Worker continues running, waiting for more Tasks to execute.

Switch back to the terminal window where your `python run_workflow.py` program is running, and you'll see it's completed:

```output
Transfer complete.
Withdraw: {'amount': 250, 'receiver': '43-812', 'reference_id': 'fff4d970-226d-4db5-8e1c-3047a63f9c85', 'sender': '85-150'}
Deposit: {'amount': 250, 'receiver': '43-812', 'reference_id': 'fff4d970-226d-4db5-8e1c-3047a63f9c85', 'sender': '85-150'}
```

Check the Temporal Web UI again. You will see one Worker registered where previously there was none, and the Workflow status shows that it completed:

![There is now one Worker and the Workflow is complete](images/completed_workflow.png)

Here's what happens when the Worker runs and connects to the Temporal Cluster:

- The first Task the Worker finds is the one that tells it to execute the Workflow method.
- The Worker communicates the event back to the Server.
- This causes the Server to send Activity Tasks to the Task Queue.
- The Worker then grabs each of the Activity Tasks in sequence from the Task Queue and executes each of the corresponding Activities.

Each of these steps gets recorded in the Event History. You can audit them in Temporal Web by clicking on the **History** tab next to **Summary**.

After a Workflow completes, the full history persists for a set retention period (typically 7 to 30 days) before the history is deleted.

:::note

You can set up [the Archival feature](https://docs.temporal.io/concepts/what-is-archival) to send these entries to long-term storage for compliance or audit needs.

:::

You just ran a Temporal Workflow application and saw how Workflows, Activities, and Workers interact. Now you'll explore how Temporal gives you tools to handle failures.

## ![](/img/icons/warning.png) Simulate failures

Despite your best efforts, there's going to be a time when something goes wrong in your application. You might encounter a network glitch, a server might go offline, or you might introduce a bug into your code. One of Temporal's most important features is its ability to maintain the state of a Workflow when something fails. To demonstrate this, you will simulate some failures for your Workflow and see how Temporal responds.

### Recover from a server crash

Unlike many modern applications that require complex processes and external databases to handle failure, Temporal automatically preserves the state of your Workflow even if the server is down. You can test this by stopping the local Temporal Cluster while a Workflow is running.

Try it out by following these steps:

1. Make sure your Worker is stopped before proceeding, so your Workflow doesn't finish. Switch to the terminal that's running your Worker and stop it by pressing `CTRL+C`.
2. Switch back to the terminal where your Workflow ran. Start the Workflow again with `python run_workflow.py`.
3. Verify the Workflow is running in the UI.
4. Shut down the Temporal Server by either using `CTRL+C` in the terminal window running the server.
5. After the Temporal Cluster has stopped, restart it and visit the UI.

Your Workflow is still listed:

![The second Workflow appears in the list of Workflows](images/second_workflow.png)

If the Temporal Cluster goes offline, you can pick up where you left off when it comes back online again.

### Recover from an unknown error in an Activity

This demo application makes a call to an external service in an Activity. If that call fails due to a bug in your code, the Activity produces an error.

To test this out and see how Temporal responds, you'll simulate a bug in the `deposit()` Activity method.

Let your Workflow continue to run but don't start the Worker yet.

1. Open the `activities.py` file and switch out the comments on the `return` statements so that the `deposit()` method returns an error:

<!--SNIPSTART  python-money-transfer-project-template-deposit-->
[activities.py](https://github.com/temporalio/money-transfer-project-template-python/blob/main/activities.py)
```py
    @activity.defn
    async def deposit(self, data: PaymentDetails) -> str:
        reference_id = f"{data.reference_id}-deposit"
        try:
            confirmation = await asyncio.to_thread(
                self.bank.deposit, data.target_account, data.amount, reference_id
            )
            """
            confirmation = await asyncio.to_thread(
                self.bank.deposit_that_fails,
                data.target_account,
                data.amount,
                reference_id,
            )
            """
            return confirmation
        except InvalidAccountError:
            raise
        except Exception:
            activity.logger.exception("Deposit failed")
            raise

```
<!--SNIPEND-->

2. Save your changes and switch to the terminal that was running your Worker.

3. Start the Worker again:

```command
python run_worker.py
```

Note, that you must restart the Worker every time there's a change in code. You will see the Worker complete the `withdraw()` Activity method, but it errors when it attempts the `deposit()` Activity method.

The important thing to note here is that the Worker keeps retrying the `deposit()` method:

```output
2024/02/12 10:59:09 INFO  No logger configured for temporal client. Created default one.
2024/02/12 10:59:09 INFO  Started Worker Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@
2024/02/12 10:59:09 DEBUG ExecuteActivity Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkflowType MoneyTransfer WorkflowID pay-invoice-701 RunID d321c45e-c0b8-4dd8-a8cb-8dcbf2c7d137 Attempt 1 ActivityID 5 ActivityType Withdraw
2024/02/12 10:59:09 Withdrawing $250 from account 85-150.

2024/02/12 10:59:09 DEBUG ExecuteActivity Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkflowType MoneyTransfer WorkflowID pay-invoice-701 RunID d321c45e-c0b8-4dd8-a8cb-8dcbf2c7d137 Attempt 1 ActivityID 11 ActivityType Deposit
2024/02/12 10:59:09 Depositing $250 into account 43-812.

2024/02/12 10:59:09 ERROR Activity error. Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkflowID pay-invoice-701 RunID d321c45e-c0b8-4dd8-a8cb-8dcbf2c7d137 ActivityType Deposit Attempt 1 Error This deposit has failed.
2024/02/12 10:59:10 Depositing $250 into account 43-812.

2024/02/12 10:59:10 ERROR Activity error. Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkflowID pay-invoice-701 RunID d321c45e-c0b8-4dd8-a8cb-8dcbf2c7d137 ActivityType Deposit Attempt 2 Error This deposit has failed.
2024/02/12 10:59:12 Depositing $250 into account 43-812.

2024/02/12 10:59:12 ERROR Activity error. Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkflowID pay-invoice-701 RunID d321c45e-c0b8-4dd8-a8cb-8dcbf2c7d137 ActivityType Deposit Attempt 3 Error This deposit has failed.
2024/02/12 10:59:16 Depositing $250 into account 43-812.

...

```

The Workflow keeps retrying using the `RetryPolicy` specified when the Workflow first executes the Activity.

You can view more information about the process in the [Temporal Web UI](http://localhost:8233).

4. Click the Workflow. You'll see more details including the state, the number of attempts run, and the next scheduled run time:

![The next Activity](images/activity_failure.png)

5. Click any `ActivityTaskFailed` event link to see the Failure details and call stack.
This lets you explore the location and reason for failed Activity Tasks.

Traditionally, you're forced to implement timeout and retry logic within the service code itself. This is repetitive and prone to errors. With Temporal, you can specify timeout configurations in the Workflow code as Activity options. Temporal offers multiple ways to specify timeouts, including [Schedule-To-Start Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-start-timeout), [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout), [Start-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-start-to-close-timeout), and [Heartbeat Timeout](https://docs.temporal.io/concepts/what-is-a-heartbeat-timeout).

In `workflows.py`, you can see that a `StartToCloseTimeout` is specified for the Activities, and a Retry Policy tells the server to retry the Activities up to 500 times:

<!--SNIPSTART python-project-template-run-workflow-->
[run_workflow.py](https://github.com/temporalio/money-transfer-project-template-python/blob/main/run_workflow.py)
```py
import asyncio
import traceback

from temporalio.client import Client, WorkflowFailureError

from shared import MONEY_TRANSFER_TASK_QUEUE_NAME, PaymentDetails
from workflows import MoneyTransfer


async def main() -> None:
    # Create client connected to server at the given address
    client: Client = await Client.connect("localhost:7233")

    data: PaymentDetails = PaymentDetails(
        source_account="85-150",
        target_account="43-812",
        amount=250,
        reference_id="12345",
    )

    try:
        result = await client.execute_workflow(
            MoneyTransfer.run,
            data,
            id="pay-invoice-701",
            task_queue=MONEY_TRANSFER_TASK_QUEUE_NAME,
        )

        print(f"Result: {result}")

    except WorkflowFailureError:
        print("Got expected exception: ", traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

You can read more about [Retries](https://docs.temporal.io/retry-policies) in the documentation.

Your Workflow is running, but only the `withdraw()` Activity method has succeeded. In any other application, you would likely have to abandon the entire process and perform a rollback.

With Temporal, you can debug and resolve the issue while the Workflow is running.

6. Pretend that you found a fix for the issue. Switch the comments back to the `return` statements of the `deposit()` method in the `activities.py` file and save your changes.

How can you possibly update a Workflow that's already halfway complete? You restart the Worker.

7. To restart the Worker, cancel the currently running worker with `CTRL+C`:

```output
# continuing logs from previous retries...

2024/02/12 10:59:40 ERROR Activity error. Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkflowID pay-invoice-701 RunID d321c45e-c0b8-4dd8-a8cb-8dcbf2c7d137 ActivityType Deposit Attempt 6 Error This deposit has failed.
2024/02/12 11:00:12 Depositing $250 into account 43-812.

2024/02/12 11:00:12 ERROR Activity error. Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkflowID pay-invoice-701 RunID d321c45e-c0b8-4dd8-a8cb-8dcbf2c7d137 ActivityType Deposit Attempt 7 Error This deposit has failed.

^C

2024/02/12 11:01:10 INFO  Worker has been stopped. Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ Signal interrupt
2024/02/12 11:01:10 INFO  Stopped Worker Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@
2024/02/12 11:01:10 WARN  Failed to poll for task. Namespace default TaskQueue money-transfer WorkerID 77310@temporal.local@ WorkerType WorkflowWorker Error worker stopping

```

8. Then restart the Worker by running the following command:

```command
python run_worker.py
```

The Worker starts again. On the next scheduled attempt, the Worker picks up right where the Workflow was failing and successfully executes the newly compiled `deposit()` Activity method.

9. Switch back to the terminal where your `run_workflow.py` program is running, and you'll see it complete:

```output
Transfer complete.
            Withdraw: {'amount': 250, 'receiver': '43-812', 'reference_id': '1f35f7c6-4376-4fb8-881a-569dfd64d472', 'sender': '85-150'}
            Deposit: {'amount': 250, 'receiver': '43-812', 'reference_id': '1f35f7c6-4376-4fb8-881a-569dfd64d472', 'sender': '85-150'}
```

10. Visit the [Web UI](http://localhost:8233) again, and you'll see the Workflow has completed:

![Both Workflows completed successfully](images/completed_workflows.png)

You have just fixed a bug in a running application without losing the state of the Workflow or restarting the transaction!

## Conclusion

You now know how to run a Temporal Workflow and understand some value Temporal offers. You explored Workflows and Activities, you started a Workflow Execution, and you ran a Worker to handle that execution.

You also saw how Temporal recovers from failures and how it retries Activities.

Exploring the key advantages Temporal offers:

1. Temporal gives you full visibility in the state of your Workflow and code execution.
2. Temporal maintains the state of your Workflow, even through server outages and errors.
3. Temporal lets you time out and retry Activity code using options that exist outside your business logic.
4. Temporal enables you to perform "live debugging" of your business logic while the Workflow is running.

### Further exploration

Try the following things before moving on to get more practice working with a Temporal application:

- Change the Retry Policy in `workflows.py` so it only retries 1 time. Then change the `deposit()` Activity in `activities.py`, so it uses the `refund()` method.
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
