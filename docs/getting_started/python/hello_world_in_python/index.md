---
id: hello-world-tutorial-python
title: Build a Temporal "Hello World!" Application in Python
sidebar_position: 3
keywords: [python, temporal, sdk, tutorial, hello world, pytest]
last_update:
  date: 2023-02-02
description: In this tutorial, you will build your first Temporal Application using the Python SDK
tags: [Python, SDK]
image: /img/temporal-logo-twitter-card.png
draft: true
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

You'll also write a test with the [pytest](https://pytest.org) framework to ensure your Workflow executes successfully.

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal Applications.

All the code in this tutorial is available in the [hello-world python template](https://github.com/temporalio/hello-world-project-template-python) repository.

### Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and Python](../dev_environmnet/index.md).

## ![](/img/icons/harbor-crane.png) Create a new Python project

To get started with the Temporal Python SDK, create a new Python project, just like any other Python program.

In a terminal, create a directory called `hello-world-temporal`:


```command
mkdir hello-world-temporal
```

Change into that directory:

```command
cd hello-world-temporal
```

Create a Python virtual environment with `venv`:

```command
python3 -m venv env
```

Activate the environment:

```command
source env/bin/activate
```

Then install the Temporal SDK:

```command
python -m pip install temporalio
```

You'll use [pytest](https://docs.pytest.org/) to create your tests. To install pytest, use the following command:

```command
python -m pip install pytest
```

You'll also need the `pytest_asyncio` package. Install that with the following command:

```command
python -m pip install pytest_asyncio
```

With your project workspace configured, you're ready to create your first Temporal Workflow and Activity. In this tutorial, you'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities.  You write a Workflow using one of the programming languages supported by a Temporal SDK. This code is known as a *Workflow Definition*. 

In the Temporal Python SDK, you define [Workflow Definitions](https://docs.temporal.io/workflows#workflow-definition) by creating a class and annotate it with the `@workflow.defn` decorator.

You then use the `@workflow.run` decorator to specify the method that should be invoked for the Workflow. Exactly one method must have this decorator and it must be added to an `async def` method.  

Create the file `run_worker.py` in the root of your project and add the following code to create a `SayHello` class to define the Workflow:

<!--SNIPSTART python-project-template-run-worker {"selectedLines": ["1-3", "14-20"]}-->
<!--SNIPEND-->

In this example, the `run` method is decorated with `@workflow.run`, so it's the method that will be invoked. 

This method accepts a string value that will hold the name, and it returns a string. You can learn more in the [Workflow parameters](https://docs.temporal.io/application-development/foundations#workflow-parameters) section of the Temporal documentation.


:::tip

You can pass multiple inputs to a Workflow, but it's a good practice to send a single input. If you have several values you want to send, you should define an object or a [data class](https://docs.python.org/3/library/dataclasses.html) and pass that into the Workflow instead.

:::

The method calls the `workflow.execute_activty` method which executes an Activity called `say_hello`, which you'll define next. `workflow.execute_activity` needs the [Activity Type](https://docs.temporal.io/activities#activity-type), the input parameters for the Activity, and a [Schedule-To-Close Timeout](https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout). 

Finally, the `run` method returns the result of the Activity Execution.

With your Workflow Definition created, you're ready to create the `say_hello` Activity.

## Create an Activity

Use Activities in your Temporal Applications to execute [non-deterministic](https://docs.temporal.io/workflows#deterministic-constraints) code or perform operations that may fail.

For this tutorial, your Activity won't be complex; you'll define an Activity that takes a string as input and uses it to create a new string as output, which is then returned to the Workflow. This will let you see how Workflows and Activities work together without building something complicated.

In the Temporal Python SDK, you define an Activity by decorating a function with `@activity.defn`.

In the `run_worker.py` file, add the following code to define a `say_hello` function:

<!--SNIPSTART python-project-template-run-worker {"selectedLines": ["4", "9-11"]}-->
<!--SNIPEND-->

Your [Activity Definition](https://docs.temporal.io/activities#activity-definition) can accept input parameters just like Workflow Definitions.  Review the [Activity parameters](https://docs.temporal.io/application-development/foundations?lang=python#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

The logic within the `say_hello` function creates the string and returns the greeting.

You've completed the logic for the application; you have a Workflow and an Activity defined. Before moving on, you'll write a unit test for your Workflow.

Before moving on, you'll write a unit test for your Workflow and Activity.

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

<!--SNIPSTART hello-world-project-template-python-tests {"selectedLines": ["1-26"]}-->
<!--SNIPEND-->

This code snippet imports the required package, `Client`, `Worker`, `say_hello` from `run_worker`, and `uuid`.

The test function `test_execute_workflow` creates a random task queue name and initiates the Worker with `client.execute_workflow`. It then checks if the result of the Workflow Execution is `Hello, World!` when the input parameter is `World`.

This code tests the Workflow and invokes the actual `say_hello` Activity. However, you may want to test your Workflows and mock out the activity so you can see how your Workflow responds to different inputs and results. Add the following code to create a test that uses a mocked `say_hello` Activity:

<!--SNIPSTART hello-world-project-template-python-tests {"selectedLines": ["29-48"]}-->
<!--SNIPEND-->

This creates a function called `say_hello_mocked` which is used as the mock activity function. The test then checks thatthe outcome of the mocked function is `"Hello, World from mocked activity!"` for the passed input parameter `World`.

To run your tests you'll need a file called `test/conftest.py` that sets up and tears down resources for the test. This file defines several fixtures that are automatically passed as arguments to any test function that declares them as a parameter. 

Create the file  `test/conftest.py` and add the following code to import the necessary libraries for the tests:

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["1-9"]}-->
<!--SNIPEND-->

Pytest lets you configure command-line options you can use when you run the tests. Add the following code to the file to add an option called  `--workflow-environment` that can take one of three values: `local`, `time-skipping`, or an existing server.

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["12-17"]}-->
<!--SNIPEND-->

If you use `local`, tests run in a new local environment for testing.

The `time-skipping` option starts a new environment that allows for time-skipping, so you don't have to wait for long-running Workflows when you're testing your code.

If you pass any string other than `local` and `time-skipping` then the tests will connect to the target server using that string.

If this option is not passed, it defaults to `local`.

Next, you'll need to define the `event_loop()` function to ensure that the async functions work properly across versions of Python. Add the following code:

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["20-31"]}-->
<!--SNIPEND-->

The function sets the event loop policy on older versions of Python to `ProactorEventLoop` and closes the event loop when the test completes.

Now add the following code to create the test environment for Workflows:

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["34-44"]}-->
<!--SNIPEND-->

This fixture starts up a new instance of `WorkflowEnvironment`, which is a test environment for running Temporal Workflows and Activities.

The type of environment to start is determined by the `--workflow-environment` command line option passed by the user. This fixture also shuts down the environment after the test completes.

Finally, add this code to define a Temporal Client that the tests will use:

<!--SNIPSTART hello-world-project-template-python-conftest {"selectedLines": ["47-49"]}-->
<!--SNIPEND-->

This fixture creates a new client connected to the `WorkflowEnvironment`. The `WorkflowEnvironment` is passed as an argument, so this fixture is dependent on the env fixture. This fixture is automatically closed when the test completes, so it doesn't need an explicit teardown.

Save the file. Your test environment is configured and you're ready to run your tests.

Run the following command from the project root:

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

You've built a test suite and you've successfully tested your Workflow. You can reuse the `conftest.py` file you've built in future Temporal Python projects.

You have a working application and a test to ensure the Workflow executes as expected. Next, you'll configure a Worker to execute your Workflow.


## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity functions and executes them one at a time. The Temporal Cluster tells the Worker to execute a specific function from information it pulls from the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue). After the Worker runs the code, it communicates the results back to the Temporal Cluster.

When you start a Workflow, you tell the server which Task Queue the Workflow and Activities use. A Worker listens and polls on the Task Queue, looking for work to do.

To configure a Worker process using the Python SDK, you'll connect to the Temporal Cluster and give it the name of the Task Queue to poll. 

You'll connect to the Temporal Cluster using a Temporal Client, which provides a set of APIs to communicate with a Temporal Cluster. You'll use Clients to interact with existing Workflows or to start new ones.

In the `run_worker.py` file, add the following code to connect to the Temporal Server, instantiate the Worker, and register the Workflow and Activity:

<!--SNIPSTART python-project-template-run-worker {"selectedLines": ["6", "23-34"]}-->
<!--SNIPEND-->

The Client accepts two arguments in this example, a target host and a namespace. Since you're running this locally, use [localhost:7233](http://localhost:7233) and specify the optional default Namespace name, `default`.

You then create a new Worker instance by specifying the client, the Task Queue to poll, and the Workflows and Activities to monitor.


You've created a program that instantiates a Worker to process the Workflow. Now you need to start the Workflow.

## Write the code to run a Workflow Execution

You can run a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. In this tutorial, you'll use the Temporal SDK to run the Workflow, which is how most real-world applications work.

Running a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, configuring the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL. In this tutorial, you'll create a small command-line program that starts the Workflow Execution.

Create the file `run_workflow.py` and add the following to connect to the server and start the Workflow.

<!--SNIPSTART python-project-template-run-workflow-->
<!--SNIPEND-->

To execute a Workflow, specify the Workflow Type, pass an argument, specify the [Workflow ID](https://docs.temporal.io/application-development/foundations/?lang=python#workflow-id), and the Task Queue. The Worker you configured is looking for tasks on the Task Queue.

:::tip Specify a Workflow ID

You don't need to specify a Workflow ID, as Temporal will generate one for you, but defining the ID yourself makes it easier for you to find it later in logs or interact with a running Workflow in the future. 

Using an ID that reflects some business process or entity is a good practice. For example, you might use a customer ID or email address as part of the Workflow ID  if you ran one Workflow per customer. This would make it easier to find all of the Workflow Executions related to that customer later.

:::

You have a Workflow, an Activity, a Worker, and a way to start a Workflow Execution. It's time to run the Workflow.

## ![](/img/icons/run.png) Run the application

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
