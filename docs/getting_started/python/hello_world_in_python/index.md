---
id: hello-world-tutorial-python
sidebar_position: 2
keywords: [python,temporal,sdk,tutorial]
last_update:
  date: 2022-12-05
title: Build a Temporal "Hello World!" Application in Python
sidebar_label: Build a Temporal Application in Python
description: In this tutorial you will build your first Temporal Application using the Python SDK
tags: [Python, SDK]
image: /img/temporal-logo-twitter-card.png
---

![](images/banner.svg)

:::note Tutorial information

- **Level:** ⭐ Temporal beginner
- **Time:** ⏱️ ~20 minutes
- **Goals:** 🙌
  - Build a Temporal Application project using the [Python SDK](https://github.com/temporalio/sdk-python).
  - Become more familiar with core concepts and the application structure.

:::

### Introduction

Creating reliable applications is a difficult task. [Temporal](https://temporal.io) lets you create fault-tolerant resilient applications using programming languages you already know, so you can build complex applications that execute successfully and recover from failures.

In this tutorial, you will build a [Temporal Application](https://docs.temporal.io/temporal#temporal-application) using the [Temporal Python SDK](https://github.com/temporalio/sdk-python). The Application will consist of the following pieces.

1. A [Workflow](https://docs.temporal.io/workflows): Workflows are functions that define the overall flow of the Application and represent the orchestration aspect of the business logic.
2. An [Activity](https://docs.temporal.io/activities): Activities are functions called during Workflow Execution and represent the execution aspect of your business logic. The Workflow you'll create executes a single Activity, which takes a string from the Workflow as input and returns a formatted version of this string to the Workflow.
3. A [Worker](https://docs.temporal.io/workers): Workers host the Activity and Workflow code and execute the code piece by piece.

<!--You'll also write a unit test to ensure your Workflow executes successfully.-->

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal Applications.

<!--
All the code in this tutorial is available in the [hello-world python template](https://github.com/temporalio/hello-world-project-template-python) repository.
-->

### Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and Python](../dev_environmnet/index.md).

## ![](/img/icons/harbor-crane.png) Create a new Python project

To get started with the Temporal Python SDK, create a new Python project, just like any other Python program.

In a terminal, create a directory called `hello-world-temporal` and change into that directory.

```command
mkdir hello-world-temporal
cd hello-world-temporal
```

With your project workspace configured, you're ready to create your first Temporal Workflow and Activity. In this tutorial, you'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities.

In the Temporal Python SDK, [Workflow Definitions](https://docs.temporal.io/workflows#workflow-definition) are defined as classes and are run in a sandbox environment.
Create the file `run_worker.py` in the root of your project and add the following code to create a `SayHello` class to define the Workflow.

```python
from temporalio import workflow
import asyncio
from datetime import datetime, timedelta

@workflow.defn
class SayHello:
    @workflow.run
    async def run(self, name: str) -> str:
        return await workflow.execute_activity(
            say_hello, name, schedule_to_close_timeout=timedelta(seconds=5)
        )
```

In the Temporal Python SDK, `@workflow.defn` defines a Workflow class method and the [Workflow Type](https://docs.temporal.io/workflows#workflow-type) defaults to the unqualified class name. The Workflow Type can be customized with a `name` parameter inside the decorator, for example `@workflow.defn(name="customized-name")`.

The method invoked for the Workflow is decorated with `@workflow.run`. Exactly one method name must have this decorator and must be defined on an `async def` method. The method’s arguments are the Workflow’s arguments, which in this example takes the [Activity Type](https://docs.temporal.io/activities#activity-type), an object or data class, and a [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout).

:::tip

You can pass multiple inputs to a Workflow, but it's a good practice to send a single input.

:::

With your Workflow Definition created, you're ready to create the `say_hello` Activity.

## Create an Activity

Use Activities in your Temporal Applications to execute [non-deterministic](https://docs.temporal.io/workflows#deterministic-constraints) code or perform operations that may fail.

For this tutorial, you'll create an Activity that takes a string as input and uses it to create a new string as output, which is then returned to the Workflow.

This will let you see how Workflows and Activities work together.

In the Temporal Python SDK, [Activity Definition](https://docs.temporal.io/activities#activity-definition) are functions marked with a decorator, `@activity.defn`.

In the `run_worker.py` file, add the following code to define a `say_hello` function.

```python
from temporalio import activity

# ...

@activity.defn
async def say_hello(name: str) -> str:
    return f"Hello, {name}!"
```

Your Activity Definition can accept input parameters.

Review the [Activity parameters](https://docs.temporal.io/application-development/foundations?lang=python#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

The logic within the `say_hello` function creates the string and returns the greeting.

You've completed the logic for the application by defining a Workflow and an Activity. The next step is to configure your Client to connect to your Temporal Server.

<!--

Before moving on, you'll write a unit test for your Workflow.

## ![](/img/icons/check.png) Add a unit test

The Temporal Python SDK includes functions that help you test your Workflow executions. Let's add a basic unit test to the application to make sure the Workflow works as expected.

-->

## Configure a Client

Clients don’t have explicit close statements. The Client pass two arguments in this example, a target host and a namespace. Since you're running this locally, use [localhost:7233](http://localhost:7233) and specify the optional default Namespace name, `default`.

In the `run_worker.py` file, add the following to connect the Client to the server.

```python
from temporalio.client import Client
# ...

async def main():
    client = await Client.connect("localhost:7233", namespace="default")
```

You've created a program that connects to a Temporal Client. The next step is to configure a Worker to process the Workflow.

## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity functions and executes them one at a time. The Temporal Server tells the Worker to execute a specific function from information it pulls from the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue). After the Worker runs the code, it communicates the results back to the Temporal Server.

To configure a Worker process using the Python SDK, give it the name of the Task Queue to poll. When you start a Workflow, tell the server which Task Queue the Workflow and Activities use.

The Worker Program defines the `client`, `task_queue`, `workflows`, and `activities`.

A Worker Entity listens and polls on a single Task Queue. A Worker Entity contains both a Workflow Worker and an Activity Worker so that it can make progress of either a Workflow Execution or an Activity Execution.

In the `run_worker.py` file, add the following in the `def main()` function.

```python
from temporalio.worker import Worker
# ...

    # Run the worker
    worker = Worker(
        client, task_queue="my-task-queue", workflows=[SayHello], activities=[say_hello]
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

You've created a program that instantiates a Worker to process the Workflow. The next step is to write the code that runs a Workflow Execution.

## Write the code to run a Workflow Execution

You can run a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. In this tutorial, you'll use the Temporal SDK to run the Workflow, which is how most real-world applications work.

Running a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, configuring the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL.

In this tutorial, you'll create a small command-line program that starts the Workflow Execution.

To execute a Workflow, specify the Workflow Type, pass an argument, specify the [Workflow ID](https://docs.temporal.io/application-development/foundations/?lang=python#workflow-id), and the Task Queue. The Worker you configured is looking for tasks on the Task Queue.

Create the `run_workflow.py` file and add the following to connect to the server and start the Workflow.

```python
import asyncio
from temporalio.client import Client

# Import the workflow from the previous code
from run_worker import SayHello


async def main():
    # Create client connected to server at the given address
    client = await Client.connect("localhost:7233")

    # Execute a workflow
    result = await client.execute_workflow(
        SayHello.run, "Temporal", id="my-workflow-id", task_queue="my-task-queue"
    )

    print(f"Result: {result}")


if __name__ == "__main__":
    asyncio.run(main())
```

You have a Workflow, an Activity, a Worker, and a way to start a Workflow Execution. Now, it's time to run the Workflow.

## ![](/img/icons/run.png) Run the Application

To execute the Application, start the Worker and run the Workflow.

To start the Worker, run the following command.

```command
python run_worker.py
```

In a separate command terminal, start the Workflow by running the following command.

```command
python run_workflow.py
```

The following output indicate that the Worker has started and has connected to the Task Queue and processed your Workflow.

```command
Result: Hello, Temporal!
```

Stop the Worker process with `CTRL-C` in the terminal.

You have successfully built a Temporal Application from scratch.

## Conclusion

You now know how to build a Temporal Application using the Python SDK.

### Review

Answer the following questions to see if you remember some of the more important concepts from this tutorial.

<details>
<summary>

**What are the minimum four pieces of a Temporal Workflow application?**

</summary>

1. A Workflow Definition.
2. An Activity Definition.
3. A Worker to host the Activity and Workflow code.
4. Some way to start the Workflow.

</details>

<details>
<summary>

**How does the Temporal server get information to the Worker?**

</summary>

It adds the information to a Task Queue.

</details>

<details>
<summary>

**True or false, with the Temporal Python SDK, you define Workflow Definition by writing functions?**

</summary>

False. Workflow Definitions are classes.

</details>
