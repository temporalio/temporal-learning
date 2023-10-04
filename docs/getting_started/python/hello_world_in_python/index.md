---
id: hello-world-tutorial-python
title: Build a Temporal Application from scratch in Python
sidebar_position: 3
keywords: [python,temporal,sdk,tutorial, hello world, temporal application, workflow, activity, test temporal workflows, mock temporal activities, pytest]
last_update:
  date: 2023-03-02
description: In this tutorial you will build a Temporal Application using the Python SDK. You'll write a Workflow, an Activity, tests, and define a Worker.
tags: [Python, SDK]
image: /img/temporal-logo-twitter-card.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

![Temporal Python SDK](/img/sdk_banners/banner_python.png)

:::note Tutorial information

- **Level:** ⭐ Temporal beginner
- **Time:** ⏱️ ~15 minutes
- **Goals:** 🙌
  - Set up, build, and test a Temporal Application project using the [Python SDK](https://github.com/temporalio/sdk-python).
  - Identify the four parts of a Temporal Application.
  - Describe how the Temporal Server gets information to the Worker.
  - Explain how to define Workflow Definitions with the Temporal Python SDK.

:::

### Introduction

Creating reliable applications is a difficult task. [Temporal](https://temporal.io) lets you create fault-tolerant resilient applications using programming languages you already know, so you can build complex applications that execute successfully and recover from failures.

In this tutorial, you will build a [Temporal Application](https://docs.temporal.io/temporal#temporal-application) using the [Temporal Python SDK](https://github.com/temporalio/sdk-python). The Application will consist of the following pieces.

1. A [Workflow](https://docs.temporal.io/workflows): Workflows are functions that define the overall flow of the Application and represent the orchestration aspect of the business logic.
2. An [Activity](https://docs.temporal.io/activities): Activities are functions called during Workflow Execution and represent the execution aspect of your business logic. The Workflow you'll create executes a single Activity, which takes a string from the Workflow as input and returns a formatted version of this string to the Workflow.
3. A [Worker](https://docs.temporal.io/workers): Workers host the Activity and Workflow code and execute the code piece by piece.

You'll also write a test with the [pytest](https://pytest.org) framework to ensure your Workflow executes successfully.

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal Applications.

All the code in this tutorial is available in the [hello-world python template](https://github.com/temporalio/hello-world-project-template-python) repository.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and Python](../dev_environment/index.md).

## ![](/img/icons/harbor-crane.png) Create a new Python project

To get started with the Temporal Python SDK, create a new Python project and initialize a new virtual environment, just like any other Python program.

In a terminal, create a directory called `hello-world-temporal`:

```command
mkdir hello-world-temporal
```

Change into that directory:

```command
cd hello-world-temporal
```

Create a Python virtual environment with `venv`:

<Tabs queryString groupId="os">
  <TabItem value="win" label="Windows">

```command
python -m venv env
```

  </TabItem>
  <TabItem value="mac" label="macOS">

```command
python3 -m venv env
```

  </TabItem>
</Tabs>


Activate the environment:

<Tabs queryString groupId="os">
  <TabItem value="win" label="Windows">

```command
env\Scripts\activate
```

  </TabItem>
  <TabItem value="mac" label="macOS">

```command
source env/bin/activate
```

  </TabItem>
</Tabs>

Then install the Temporal SDK:

```command
python -m pip install temporalio
```

You'll use the [pytest](https://docs.pytest.org/) framework to create and run your tests. To install pytest, use the following command:

```command
python -m pip install pytest
```

You'll also need the `pytest_asyncio` package. Install that with the following command:

```command
python -m pip install pytest_asyncio
```

With your project workspace configured, you're ready to create your first Temporal Workflow and Activity. In this tutorial, you'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities. You write a Workflow using one of the programming languages supported by a Temporal SDK. This code is known as a *Workflow Definition*. 

In the Temporal Python SDK, you define [Workflow Definitions](https://docs.temporal.io/workflows#workflow-definition) by creating a class and annotate it with the `@workflow.defn` decorator.

You then use the `@workflow.run` decorator to specify the method that the Workflow should invoke. Exactly one method must have this decorator and it must be added to an `async def` method.  

Create the file `workflows.py` in the root of your project and add the following code to create a `SayHello` class to define the Workflow:

<!--SNIPSTART python-project-template-workflows -->
<!--SNIPEND-->

In this example, the `run` method is decorated with `@workflow.run`, so it's the method that the Workflow will invoke.

This method accepts a string value that will hold the name, and it returns a string. You can learn more in the [Workflow parameters](https://docs.temporal.io/dev-guide/python/foundations#workflow-parameters) section of the Temporal documentation.

:::tip

You can pass multiple inputs to a Workflow, but it's a good practice to send a single input. If you have several values you want to send, you should define an object or a [data class](https://docs.python.org/3/library/dataclasses.html) and pass that into the Workflow instead.

:::

The method calls the `workflow.execute_activty` method which executes an Activity called `say_hello`, which you'll define next. `workflow.execute_activity` needs the [Activity Type](https://docs.temporal.io/activities#activity-type), the input parameters for the Activity, and a [Start-To-Close Timeout](https://docs.temporal.io/activities#start-to-close-timeout) or [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout). 

Finally, the `run` method returns the result of the Activity Execution.

:::info

In the Temporal Python SDK, Workflow files are reloaded in a sandbox for every run. To keep from reloading an import on every run, you can mark it as *passthrough* so it reuses the module from outside the sandbox. Standard library modules and `temporalio` modules are passed through by default. All other modules that are used in a deterministic way, such as activity function references or third-party modules, should be passed through this way.

This is why this example uses `with workflow.unsafe.imports_passed_through():`. You can learn more about this in our [knowledge base](https://docs.temporal.io/kb/python-sandbox-environment).

:::

With your Workflow Definition created, you're ready to create the `say_hello` Activity.

## Create an Activity

In a Temporal Application, Activities are where you execute [non-deterministic](https://docs.temporal.io/workflows#deterministic-constraints) code or perform operations that may fail, such as API requests or database calls. Your Workflow Definitions call Activities and process the results. Complex Temporal Applications have Workflows that invoke many Activities, using the results of one Activity to execute another.

For this tutorial, your Activity won't be complex; you'll define an Activity that takes a string as input and uses it to create a new string as output, which is then returned to the Workflow. This will let you see how Workflows and Activities work together without building something complicated.

In the Temporal Python SDK, you define an Activity by decorating a function with `@activity.defn`.

Create a new file called `activities.py` and add the following code to define a `say_hello` function to define the Activity:

<!--SNIPSTART python-project-template-activities -->
<!--SNIPEND-->

The logic within the `say_hello` function creates the string and returns the greeting.

Your [Activity Definition](https://docs.temporal.io/dev-guide/python/foundations#develop-activities) can accept input parameters just like Workflow Definitions.  Review the [Activity parameters](https://docs.temporal.io/dev-guide/python/foundations#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

Like Workflow Definitions, if you have more than one parameter for an Activity, you should bundle the data into a data class rather than sending multiple input parameters. This will make future updates easier.


You've completed the logic for the application; you have a Workflow and an Activity defined. Before moving on, you'll write a unit test for your Workflow.

## ![](/img/icons/check.png) Add a unit test

The Temporal Python SDK includes functions that help you test your Workflow executions. Let's add tests to the application to make sure the Workflow works as expected.

Create a new folder in your project directory called `tests`:

```command
mkdir tests
```

In the `tests` folder, create a new file called `test_run_worker.py`. This file will contain the tests for your Workflow and Activity.

Create an empty `__init__.py` file within that directory:

```command
touch tests/__init__.py`
```

Then create the file `tests/test_run_workflow.py` file and add the following content to test the Workflow:

<!--SNIPSTART hello-world-project-template-python-tests {"selectedLines": ["1-28"]} -->
<!--SNIPEND-->

This code snippet imports the `uuid` and `pytest` packages, along with `Activity` and `Worker` from the Temporal SDK. It then imports `WorkflowEnvironment` from the Temporal SDK so you can create an environment for testing. It then imports your Activity and Workflow. 

The test function `test_execute_workflow` creates a `WorkflowEnvironment` so it can run the tests. It then creates a random Task Queue name and initiates the Worker with `env.client.execute_workflow`. It then checks if the result of the Workflow Execution is `Hello, World!` when the input parameter is `World`.

:::note

The `start_time_skipping()` option starts a new environment that lets you test long-running Workflows without waiting for them to complete in real-time. You can use the `start_local()` option instead, which uses a full local insTance of the Temporal server instead. Both of these options download an instances of Temporal server on your first test run. This instance runs as a separate process during your test runs. 

The `start_time_skipping()` option isn't a full implementation of the Temporal server, but it's good for basic tests like the ones in this tutorial. 

:::

This code tests the Workflow and invokes the actual `say_hello` Activity. However, you may want to test your Workflows and mock out the Activity so you can see how your Workflow responds to different inputs and results. 

Add the following code to create a test that uses a mocked `say_hello` Activity:

<!--SNIPSTART hello-world-project-template-python-tests {"selectedLines": ["29-51"]}-->
<!--SNIPEND-->

This creates a function called `say_hello_mocked` which the Workflow test will use as the mock Activity function. The `test_mock_activity` test then checks that the outcome of the Workflow is `"Hello, World from mocked activity!"` for the passed input parameter `World`, using the same type of test setup as the previous test function.

Run the following command from the project root to start the tests:

```command
pytest
```

This command will search for files in your `tests` folder that match the pattern `test_*.py` or `*_test.py`.

You'll see output similar to the following from your test run indicating that the test was successful:

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

You can also pass the command line option `--workflow-environment` at runtime to change the test environment.

Most test suites reuse the local environment across tests. You can explore [fixtures in Pytest](https://docs.pytest.org/en/6.2.x/fixture.html) to set this up.

You've built a test suite and you've successfully tested your Workflow. You can reuse the `conftest.py` file you've built in future Temporal Python projects.

You have a working Temporal Application and tests that make sure the Workflow executes as expected. Next, you'll configure a Worker to execute your Workflow.

## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity functions and executes them. The Temporal Cluster tells the Worker to execute a specific function from information it pulls from the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue). After the Worker runs the code, it communicates the results back to the Temporal Cluster.

When you start a Workflow, you tell the server which Task Queue the Workflow and Activities use. A Worker listens and polls on the Task Queue, looking for work to do.

To configure a Worker process using the Python SDK, you'll connect to the Temporal Cluster and give it the name of the Task Queue to poll. 

You'll connect to the Temporal Cluster using a Temporal Client, which provides a set of APIs to communicate with a Temporal Cluster. You'll use Clients to interact with existing Workflows or to start new ones.

In this tutorial you'll create a small standalone Worker program so you can see how all of the components work together. 

Create the file `run_worker.py` in the root of your project and add the following code to connect to the Temporal Server, instantiate the Worker, and register the Workflow and Activity:

<!--SNIPSTART python-project-template-run-worker-->
<!--SNIPEND-->

This program connects to the Temporal Cluster using `client.Connect`. In this example, you only need to provide a target host and a Namespace. Since you're running this locally, you use [localhost:7233](http://localhost:7233) for the target host, and you specify the optional default Namespace name, `default`.

You then create a new Worker instance by specifying the client, the Task Queue to poll, and the Workflows and Activities to monitor. Then you run the worker.

You've created a program that instantiates a Worker to process the Workflow. Now you need to start the Workflow.

## Write code to start a Workflow Execution

You can start a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. In this tutorial, you'll use the Temporal SDK to start the Workflow, which is how most real-world applications work. 

Starting a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, configuring the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL. In this tutorial, you'll create a small command-line program that starts the Workflow Execution.

Create the file `run_workflow.py` and add the following to connect to the server and start the Workflow:

<!--SNIPSTART python-project-template-run-workflow-->
<!--SNIPEND-->

Like the Worker you created, this program uses `client.Connect` to connect to the Temporal server. It then executes the Workflow using `client.ExecuteWorkflow`, which requires the Workflow to run, the input parameters for the Workflow, a [Workflow ID](https://docs.temporal.io/dev-guide/python/foundations#workflow-id) for the Workflow, and the Task Queue to use. The Worker you configured is looking for tasks on that Task Queue.

:::tip Specify a Workflow ID

You need to specify a Workflow ID when executing a Workflow. You'll use this ID to locate the Workflow Execution later in logs or to interact with a running Workflow in the future.

Using a Workflow ID that reflects some business process or entity is a good practice. For example, you might use a customer identifier or email address as part of the Workflow ID  if you ran one Workflow per customer. This would make it easier to find all the Workflow Executions related to that customer later.

:::

You have a Workflow, an Activity, a Worker, and a way to start a Workflow Execution. It's time to run the Workflow.

## ![](/img/icons/run.png) Run the Temporal Application

To run your Temporal Application, you need to start the Workflow and the Worker. You can start these in any order, but you'll need to run each command from a separate terminal window, as the Worker needs to be constantly running to look for tasks to execute.

First, ensure that your local Temporal Cluster is running. 

To start the Worker, run this command from the project root:

```command
python run_worker.py
```

You won't see any output right away, but leave the program running.

To start the Workflow, open a new terminal window and switch to your project root:

```command
cd hello-world-temporal
```

Activate the virtual environment in this terminal:

<Tabs queryString groupId="os">
  <TabItem value="win" label="Windows">

```command
env\Scripts\activate
```

  </TabItem>
  <TabItem value="mac" label="macOS">

```command
source env/bin/activate
```

  </TabItem>
</Tabs>

Then run `run_workflow.py` from the project root to start the Workflow Execution:

```command
python run_workflow.py
```

The program runs and returns the result:

```command
Result: Hello, Temporal!
```

Switch to the terminal window that's running the Worker. Stop the Worker process with `CTRL-C` in the terminal.

You have successfully built a Temporal Application from scratch.

## Conclusion

You now know how to build a Temporal Application using the Python SDK. You've built a Workflow, an Activity, a test suite, and a Worker.

### Review

Answer the following questions to see if you remember the important concepts from this tutorial.

<details>
<summary>

**What are the minimum four pieces of a Temporal Application?**

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
