---
id: hello-world-tutorial-python
sidebar_position: 3
keywords: [python, temporal, sdk, tutorial]
last_update:
  date: 2023-01-09
title: Build a Temporal "Hello World!" Application in Python
sidebar_label: Build a Temporal Application in Python
description: In this tutorial, you will build your first Temporal Application using the Python SDK
tags: [Python, SDK]
image: /img/temporal-logo-twitter-card.png
---

![](images/banner.svg)

:::note Tutorial information

- **Level:** ⭐ Temporal beginner
- **Time:** ⏱️ ~20 minutes
- **Goals:** 🙌
  - Set up, build, and test a Temporal application project using the [Python SDK](https://github.com/temporalio/sdk-python).
  - Identify the four parts of a Temporal Workflow application.
  - Describe how the Temporal Server gets information to the Worker.
  - Explain how to define Workflow Definitions with the Temporal Python SDK.

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

<!--SNIPSTART python-project-template-run-worker {"selectedLines": ["1-3", "15-20"]}-->
<!--SNIPEND-->

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

<!--SNIPSTART python-project-template-run-worker {"selectedLines": ["5", "9-11"]}-->
<!--SNIPEND-->


Your Activity Definition can accept input parameters.

Review the [Activity parameters](https://docs.temporal.io/application-development/foundations?lang=python#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

The logic within the `say_hello` function creates the string and returns the greeting.

You've completed the logic for the application by defining a Workflow and an Activity. The next step is to configure your Client to connect to your Temporal Server.

## Configure a Client

A Temporal Client provides a set of APIs to communicate with a Temporal Cluster.

Clients are used to interact with existing Workflows or to start new ones.

Clients don’t have explicit close statements. The Client pass two arguments in this example, a target host and a namespace. Since you're running this locally, use [localhost:7233](http://localhost:7233) and specify the optional default Namespace name, `default`.

In the `run_worker.py` file, add the following to connect the Client to the server.

<!--SNIPSTART python-project-template-run-worker {"selectedLines": ["6", "23-24"]}-->
<!--SNIPEND-->


You've created a program that connects to a Temporal Client. The next step is to configure a Worker to process the Workflow.

## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity functions and executes them one at a time. The Temporal Server tells the Worker to execute a specific function from information it pulls from the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue). After the Worker runs the code, it communicates the results back to the Temporal Server.

To configure a Worker process using the Python SDK, give it the name of the Task Queue to poll. When you start a Workflow, tell the server which Task Queue the Workflow and Activities use.

A Worker Entity listens and polls on a single Task Queue. A Worker Entity contains both a Workflow Worker and an Activity Worker so that it can make progress of either a Workflow Execution or an Activity Execution.

In the `run_worker.py` file, add the following in the `def main()` function.

<!--SNIPSTART python-project-template-run-worker {"selectedLines": ["6", "25-34"]}-->
<!--SNIPEND-->


You've created a program that instantiates a Worker to process the Workflow. The next step is to write the code that runs a Workflow Execution.

## Write the code to run a Workflow Execution

You can run a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. In this tutorial, you'll use the Temporal SDK to run the Workflow, which is how most real-world applications work.

Running a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, configuring the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL.

In this tutorial, you'll create a small command-line program that starts the Workflow Execution.

To execute a Workflow, specify the Workflow Type, pass an argument, specify the [Workflow ID](https://docs.temporal.io/application-development/foundations/?lang=python#workflow-id), and the Task Queue. The Worker you configured is looking for tasks on the Task Queue.

Create the `run_workflow.py` file and add the following to connect to the server and start the Workflow.

<!--SNIPSTART python-project-template-run-workflow-->
<!--SNIPEND-->


You have a Workflow, an Activity, a Worker, and a way to start a Workflow Execution.

Before moving on, you'll write a unit test for your Workflow and Activity.

## ![](/img/icons/check.png) Add a unit test

The Temporal Python SDK includes functions that help you test your Workflow executions. Let's add tests to the application to make sure the Workflow works as expected.

### Pytest Prerequisites

[Install pytest](#instal-pytest) and [Create the folder structure](#create-the-folder-structure) are prerequisite steps needed before writing the tests.

#### Install pytest

[pytest](https://docs.pytest.org/) requires: Python 3.7+

To install pytest, you can use the following command:

```bash
pip install pytest
```

This command will install the pytest framework and its dependencies.

#### Create the folder structure

1. Create a new folder in your project directory called `tests`.
2. In the `tests` folder, create a new file called `test_run_worker.py`. This file will contain the tests for your Workflow and Activity.
3. Create a `__init__.py` file.

Your directory should look like this.

```bash
tests
├── __init__.py
├── conftest.py
└── test_run_worker.py
```

### Test the Workflow

The following code block shows an example of how to test the Workflow using pytest in the `test_run_workflow.py` file:

<!--SNIPSTART hello-world-project-template-python-tests {"selectedLines": ["1-26"]}-->
<!--SNIPEND-->


This code snippet import required package, `Client`, `Worker`, `say_hello` from `run_worker`, and `uuid`.

A test function `test_execute_workflow` is created, where it creates a random `task_queue_name` and initiates the Worker, and checks if the outcome is `Hello, World!` for the input parameter `World`.

### Test the Activity

The following code block shows an example of how to test the Activity using pytest:

<!--SNIPSTART hello-world-project-template-python-tests {"selectedLines": ["29-48"]}-->
<!--SNIPEND-->

This creates a function `say_hello_mocked` which is used for mocking the activity function, using assert statement the function checks if the outcome of the mocked function is `"Hello, World from mocked activity!"` for the passed input parameter `World`.

### Configuration file

Next, create a `conftest.py` file that sets up and tears down resources for the test.

The `conftest.py` file defines several fixtures that are automatically passed as arguments to any test function that declares them as a parameter.

#### Imports

Import the necessary libraries for the tests.

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["1-9"]}-->
<!--SNIPEND-->

#### `pytest_addoption` function

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["12-17"]}-->
<!--SNIPEND-->


This allows you to pass the command line option while running the tests. In this case, it adds an option `--workflow-environment` that can take one of three values: `local`, `time-skipping`, or target to existing server.

If this option is not passed, it defaults to `local`.

#### `event_loop` fixture

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["20-31"]}-->
<!--SNIPEND-->

This fixture creates an event loop, which is a control structure that manages the scheduling of asynchronous tasks in Python.

It is used by the `asyncio` library, which is built into Python. The function sets the event loop policy on older versions of Python to `ProactorEventLoop` and also make sure to close the event loop when the test completes.

#### `env` fixture

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["34-44"]}-->
<!--SNIPEND-->

This fixture starts up a new instance of `WorkflowEnvironment`, which is a test environment for running Temporal Workflows and Activities.

The type of environment to start is determined by the `--workflow-environment` command line option passed by the user. This fixture also shutdown the environment after the test completes

- `local`: will start a new local environment for testing.
- `time-skipping`: will start a new environment that allows for time-skipping.

Target to existing server: If you pass any string other than `local` and `time-skipping` then it will connect to the target server using that string.

#### `client` fixture

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["47-49"]}-->
<!--SNIPEND-->

This fixture creates a new client connected to the `WorkflowEnvironment`. The `WorkflowEnvironment` is passed as an argument, so this fixture is dependent on the env fixture. This fixture is automatically closed when the test completes, so it doesn't need an explicit teardown.

### Running the tests

You can run the test through the command line. This file will be loaded by pytest automatically, and it will make these fixtures available to any test that requires them as arguments.

You can also pass the command line option `--workflow-environment` at runtime to change the test environment.

To run the tests, use the following commands:

```bash
python run_worker.py
pytest
```

This command will search for files in your `tests` folder that match the pattern `test_*.py` or `*_test.py`.

You should see the following output or similar.

```bash
===================== test session starts =====================
platform darwin -- Python 3.10.9, pytest-7.2.0, pluggy-1.0.0
rootdir: /hello-world-python-getting-started
plugins: asyncio-0.20.3, anyio-3.6.2
asyncio: mode=strict
collected 2 items

tests/test_run_worker.py ..                             [100%]
===================== 2 passed in 10.29s ======================
```

Now that all tests have past, it's time to run the application.

## ![](/img/icons/run.png) Run the application

To execute the Application, start the Worker and run the Workflow.

To start the Worker, run the following command.

```command
python run_worker.py
```

In a separate command terminal, start the Workflow by running the following command.

```command
python run_workflow.py
```

The following output indicates that the Worker has started and has connected to the Task Queue and processed your Workflow.

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

The Temporal Server adds Tasks to a Task Queue, and the Worker polls the Task Queue.

</details>

<details>
<summary>

**True or false, with the Temporal Python SDK, you define Workflow Definition by writing functions?**

</summary>

False. Workflow Definitions are classes.

</details>
