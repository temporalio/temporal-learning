---
id: subscription-tutorial
sidebar_position: 3
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-03-01
title: Build a subscription workflow with Temporal and Python
description: In this tutorial, we will tour all the Workflow APIs you should know, primarily Signals, Queries, by building a realistic monthly subscription payments Workflow that can be canceled.
image: /img/temporal-logo-twitter-card.png
---

## Introduction

This tutorial focuses on implementing an email subscription application with Temporal's Workflows, Activities, and Queries.

### Goals

Throughout the Python Subscription tutorial, you'll accomplish the following goals:

- Use Activities to mock sending emails.
- Use Queries to retrieve the status of the email subscription.
- Use a Cancellation to end the subscription.
- Test the Cancellation Workflow.

### Tasks

To accomplish these goals, you will need to build the following:

- Temporal Environment for the Flask Web application
- Implement functionalities of subscribing and canceling the emails, as well as fetching information.
- Use Pytest to test the Cancellation Workflow.

### Working sample

All the code for this tutorial is stored on GitHub in the following repository:

- [email-subscription-project-python](https://github.com/temporalio/email-subscription-project-python)

You can refer to this tutorial for a completed version of this tutorial.

## Setting up the environment

A prerequisite to get started is to install the following:

- Temporal Library
- Temporal Server
- [Flask Sever](https://flask.palletsprojects.com/en/2.2.x/quickstart/)

### Project requirements

- Flask (tested with version [2.2.2](https://github.com/pallets/flask/releases/tag/2.2.2)).
- Python 3.7 or greater (tested with version 3.11)
- Temporal Python SDK (tested with version [1.0.0](https://github.com/temporalio/sdk-python/releases/tag/1.0.0)).

#### Activate Virtual Environment

Run the following command to create a new virtual environment:

```bash
python3 -m venv venv
```

This command creates a new directory called `venv`, which contains the following items:

- Python interpreter (Python 3.11.0 in this case)
- Scripts for activating and deactivating the virtual environment

Activate the virtual environment:

```bash
source venv/bin/activate
(venv) $
```

After activating, the virtual environment `(venv)` will be displayed on your command prompt.

Since the virtual environment is active, running the Python command will run the Python 3 version of the interpreter (which is stored within your virtual environment itself):

Test that Python is running in your virtual environment.

```bash
(venv) $ python --version
Python 3.11.0
```

Throughout the rest of the tutorial, the `(venv) $` prompt will be ignored.

#### Install packages with pip

With the virtual environment created and activated, it's time to start installing the Python packages that you need using pip.

```bash
pip install temporalio
pip install "Flask[asyinco]"
```

## Develop Workflow

A Workflow defines a sequence of steps defined by writing code, known as a Workflow Definition, and are carried out by running that code, which results in a Workflow Execution.

Before writing the Workflow Definition, it is important to define the data objects used by the Workflow Definitions.

### Define Data Class

Now, it's time to write some code for the Python application. The Temporal Python SDK recommends the use of a single [data class](https://docs.python.org/3/library/dataclasses.html) for parameters and return types. This allows for the addition of fields with defaults without breaking compatibility.

To set up the data class and describe its objects as parameters, create a new file called `shared_objects.py`.

```bash
nano shared_objects.py
```

The data class will store the objects to be sent to your Activity and Workflow. Add the following objects to the `ComposeEmail` data class:

- `email`: as a string to pass a user's email.
- `message`: as a string to pass a message to the user.
- `count`: as an integer to track the number of emails sent

<!--SNIPSTART email-subscription-project-python-shared_objects {"selectedLines": ["1", "4-8"]}-->
[shared_objects.py](https://github.com/temporalio/email-subscription-project-python/blob/master/shared_objects.py)
```py
from dataclasses import dataclass
// ...
@dataclass
class ComposeEmail:
    email: str
    message: str
    count: int = 0
```
<!--SNIPEND-->

`ComposeEmail` allows you to pass an email and message string, as well as a count integer into the Workflow.

Now that the data objects are declared, let's move on to writing the Workflow Definition.

### Define Workflow Definition

In the Temporal, Workflows are fundamental units of a Temporal Application and orchestrate the execution of Activities. In the Temporal Python SDK, Workflow Definitions contain the `@workflow.defn` decorator and the method invoked for the Workflow is decorated with `@workflow.run`.

To create a new Workflow Definition, you can start by creating a new file called `workflows.py`. This file will contain the `SendEmailWorkflow` class and its attributes.

```bash
nano workflows.py
```

You can use the `workflows.py` file write deterministic logic inside your Workflow Definition and to [start the Activity](https://python.temporal.io/temporalio.workflow.html#start_activity).

The `SendEmailWorkflow` class, for example, contains a loop that checks if the `_subscribed` attribute is True, and if so, starts the `send_email` Activity.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["1-36"]}-->
[workflows.py](https://github.com/temporalio/email-subscription-project-python/blob/master/workflows.py)
```py

import asyncio
from datetime import timedelta

from temporalio import workflow

from shared_objects import ComposeEmail

with workflow.unsafe.imports_passed_through():
    from activities import send_email


@workflow.defn
class SendEmailWorkflow:
    def __init__(self) -> None:
        self._email: str = "<no email>"
        self._message: str = "<no message>"
        self._subscribed: bool = False
        self._count: int = 0

    @workflow.run
    async def run(self, email: str):
        self._email = f"{email}"
        self._message = "Welcome to our Subscription Workflow!"
        self._subscribed = True
        self._count = 0

        while self._subscribed is True:
            self._count += 1
            if self._count > 1:
                self._message = "Thank you for staying subscribed!"

            await workflow.start_activity(
                send_email,
                ComposeEmail(self._email, self._message, self._count),
                start_to_close_timeout=timedelta(seconds=10),
```
<!--SNIPEND-->

The `run()` method, which is decorated with `@workflow.run`, takes in the email address as an argument. This method initializes the `_email`, `_message`, `_subscribed`, and `_count` attributes of the `SendEmailWorkflow` instance.

The while loop increments the `_count` attribute and calls the `send_email` Activity with the current `ComposeEmail` object. The loop will continue as long as the `_subscribed` attribute is true.

The `start_activity()` method is used to execute the `send_email` Activity with the following parameters:

- The `send_email()` Activity Definition.
- The `ComposeEmail` data class.
- A `start_to_close_timeout()` parameter, which tells the Temporal Server to time out the Activity 10 seconds from when the activity starts.

The loop also includes a sleep statement that causes the Workflow to pause for a set amount of time between email. This could be set to seconds, days, months, or even years, depending on your business logic.

With this Workflow Definition in place, you can now develop an Activity to execute your email function.

## Develop an Activity

An Activity is a function or method execution that's designed to perform a specific, well-defined action, either short or long-running.

To create an Activity Definiton, start by creating a new file called `activities.py`.
Then use the `@activity.defn` decorator to write a function that simulates sending an email.

```bash
nano activities.py
```

<!--SNIPSTART email-subscription-project-python-activity_function {"selectedLines": ["1-10"]}-->
[activities.py](https://github.com/temporalio/email-subscription-project-python/blob/master/activities.py)
```py
from temporalio import activity

from shared_objects import ComposeEmail


@activity.defn
async def send_email(details: ComposeEmail) -> str:
    print(
        f"Sending email to {details.email} with message: {details.message}, count: {details.count}"
    )
```
<!--SNIPEND-->

The `send_email` function takes in the `ComposeEmail` data class as input, containing the `email`, `message`, and `count` objects.

The logic within the `send_email` function simulates sending an email, by printing the email details to the console and returning a `success` status.

Now that the Activity Definition and Workflow Definition have been created, it is time to write the Worker process.

## Bundle and run it with the Worker

The Worker Process is where the Workflow and Activity Definitions are executed.

Create a new file called `run_worker.py` and develop the Worker process to execute your Workflow and Activity Definitions.

```bash
nano run_worker.py
```

<!--SNIPSTART email-subscription-project-python-run_worker-->
[run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_worker.py)
```py
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import send_email
from workflows import SendEmailWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="subscription",
        workflows=[SendEmailWorkflow],
        activities=[send_email],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

The `main` function connects to a Temporal [Client](https://python.temporal.io/temporalio.client.Client.html) and creates a Worker object to run the `SendEmailWorkflow` Workflow and the `send_email()` Activity.

In this tutorial, the Client is connecting to `localhost:7223` and the Namespace name is set to the default name.

The [Worker](https://python.temporal.io/temporalio.worker.Worker.html) process the Workflow and Activities. Once created, Workers can be run and shutdown explicitly with `run` or `shutdown`.

A Task Queue is required for a Worker.

The `if __name__ == "__main__":` block runs the main function using `asyncio.run`.

Now that we've written the logic to execute the Workflow and Activity Definitions, let's build the gateway.

## Build the gateway

The gateway is used to communicate and send data back and forth. This tutorial uses the gateway as the entry point for initiating Workflow Execution.

This tutorial uses Flask, to `subscribe`, `get-details`, and `unsubscribe`.

### Global Client

Register the Temporal Client function to run before the first request to this instance of the application.

Create a new file called `run_flask.py` to develop your Flask endpoints.

```bash
nano run_flask.py
```

This code defines an asynchronous function `get_client()` that creates a Client connection to Temporal server and returns it.
The Client connection is saved in a global variable g for future use.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["10-12"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
async def get_client():
    if Client not in g:
        g.client = await Client.connect("localhost:7233")
```
<!--SNIPEND-->

The `Client.connect()` method is called to create a connection to the Temporal service at `localhost:7233`.

A Temporal Client enables you to communicate with the Temporal Cluster.
Communication with a Temporal Cluster includes, but isn't limited to, the following:

- Starting Workflow Executions
- Sending Queries to Workflow Executions
- Getting the results of a Workflow Execution

### Build the `subscribe` endpoint

In the `run_flask.py` file, write a `/subscribe` endpoint as an asynchronous function, so that users can subscribe to our email subscription app.

In the `start_workflow` function, pass the name of the Workflow run method, arguments to be passed to the Workflow Execution, the Workflow Id, and the Task Queue name.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["16-31"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
@app.route("/subscribe", methods=["POST", "GET"])
async def start_subscription():
    await get_client()
    email_id = str(request.json.get("email"))
    if request.method == "POST":
        await g.client.start_workflow(
            SendEmailWorkflow.run,
            args=(email_id,),
            id=email_id,
            task_queue="subscription",
        )
        return jsonify({"status": "ok"})
    else:
        return jsonify({"message": "This endpoint requires a POST request."})


```
<!--SNIPEND-->

This demonstrates the basic steps to [start a Workflow](https://python.temporal.io/temporalio.client.Client.html#start_workflow).

Next, learn to query your Workflow.

## Add a Query

In the `workflows.py` file, add a Query method to your Workflow.

The Query method is used to return the details of the subscription.

[@workflow.query](https://python.temporal.io/temporalio.workflow.html#query) is a decorator for a Workflow Query method.
Each Query method returns the current values of the Workflow attributes:

- `greeting`: returns the greeting message.
- `message`: returns a message to the user.
- `count`: returns the number of messages sent to the user.


<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["42-52"]}-->
[workflows.py](https://github.com/temporalio/email-subscription-project-python/blob/master/workflows.py)
```py
// ...
    @workflow.query
    def greeting(self) -> str:
        return self._email

    @workflow.query
    def message(self) -> str:
        return self._message

    @workflow.query
    def count(self) -> int:
        return self._count
```
<!--SNIPEND-->

Queries should never mutate anything in the Workflow.
Now, lets have the Flask application query the Workflow.

----
Let's write an endpoint to get details about the Email subscription.

Create an asyncronus function to Query and return details about the email subscription.

Use [get_workflow_handle()](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) returns a Workflow handle to an existing Workflow by its Id.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["32-52"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
@app.route("/get_details", methods=["GET"])
async def get_query():
    await get_client()
    email_id = str(request.json.get("email"))
    handle = g.client.get_workflow_handle(
        email_id,
    )
    count: int = await handle.query(SendEmailWorkflow.count)
    greeting: str = await handle.query(SendEmailWorkflow.greeting)
    message: str = await handle.query(SendEmailWorkflow.message)

    return jsonify(
        {
            "status": "ok",
            "numberOfEmailsSent": count,
            "email": greeting,
            "message": message,
        }
    )


```
<!--SNIPEND-->

`handle.query()` creates a Handle on the Workflow and calls the Query method on the handle to get the value of the variables.

With this function, you can return all the information about the user's email subscription.

Now that users can subscribe and return details about their subscription, let's give them a way to unsubscribe.

## Add the Cancellation

To send a cancellation notice to an endpoint, use the HTTP `DELETE` method on the `unsubscribe` endpoint to return a [cancel()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel) method on the Workflow's handle.


<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["53-61"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
@app.route("/unsubscribe", methods=["DELETE"])
async def end_subscription():
    await get_client()
    email_id = str(request.json.get("email"))
    handle = g.client.get_workflow_handle(
        email_id,
    )
    await handle.cancel()
    return jsonify({"status": "ok"})
```
<!--SNIPEND-->

This should allow users to cancel the Workflow and prevent the Workflow from continuing to execute the Activity.

## Create an integration test

Integration testing is an essential part of software development that helps ensure that different components of an application work together correctly.

The Temporal Python SDK includes functions that help you test your Workflow Executions. 

Workflow testing can be done in an integration test fashion against a [test server](https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#start_local) or from a [given Client](https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#from_client).


In this section, you'll learn how to write an integration test using the Temporal Python SDK to test the cancellation of a Workflow. Let's add tests to the application to ensure the Cancellation works as expected.

### Setup tests environment

To set up the test environment, create a new Python file called `test_run_worker.py` in the tests directory, include the `__init__.py` file.

```bash
touch tests/test_run_workflow.py
touch tests/__init__.py
```

### Import modules

The Temporal Python SDK includes functions that help you test your Workflow Executions. In this section, you will import the necessary modules and classes to test the cancellation of a Workflow.

Import the Temporal [Client](https://python.temporal.io/temporalio.client.Client.html), for Accessing the Temporal Client, [WorkflowExecutionStatus](https://python.temporal.io/temporalio.client.WorkflowExecutionStatus.html) to get the status of the Workflow Execution, and the [WorkflowFailureError](https://python.temporal.io/temporalio.client.WorkflowFailureError.html) class to return if the Workflow is unsuccessful.

Then, import the Activities and Worker modules from your application.

<!--SNIPSTART email-subscription-project-python-test_run_worker {"selectedLines": ["3-9"]}-->
[tests/test_run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/tests/test_run_worker.py)
```py
// ...
import pytest
from temporalio.client import Client, WorkflowExecutionStatus, WorkflowFailureError
from temporalio.exceptions import CancelledError
from temporalio.worker import Worker

from activities import send_email
from run_worker import SendEmailWorkflow
```
<!--SNIPEND-->

Now that you've imported the necessary modules, you can write the test function.

### Create the test function

In the `test_run_worker.py` file, create an asynchronous test function called `test_execute_workflow` that takes the `client` object as a parameter. The `client` object is used to connect to the local Temporal server.

Set the `task_queue` parameter to match the worker process. In this example, it is set to `subscription`.

Use the `start_workflow()` function to start the workflow, passing in the `SendEmailWorkflow.run` function, along with the necessary arguments:

Assign the handle variable to the result of the `start_workflow()` function call so that you can test the cancellation action.

Assert and test of the status of the Workflow Execution.

<!--SNIPSTART email-subscription-project-python-test_run_worker {"selectedLines": ["12-33"]}-->
[tests/test_run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/tests/test_run_worker.py)
```py
// ...
@pytest.mark.asyncio
async def test_execute_workflow(client: Client):
    task_queue_name = "subscription"
    async with Worker(
        client,
        task_queue=task_queue_name,
        workflows=[SendEmailWorkflow],
        activities=[send_email],
    ):
        handle = await client.start_workflow(
            SendEmailWorkflow.run,
            args=("test@example.com", "Here's your message!"),
            id="subscription",
            task_queue=task_queue_name,
        )
        await handle.cancel()

        with pytest.raises(WorkflowFailureError) as err:
            await handle.result()
        assert isinstance(err.value.cause, CancelledError)

    assert WorkflowExecutionStatus.CANCELED == (await handle.describe()).status
```
<!--SNIPEND-->

Now that you've created a test function for the Workflow Cancellation, test to see if that works.

### Test the function
To test the function, run `pytest` from the command line to automatically discover and execute tests.

```bash
tests/test_run_worker.py::test_execute_workflow
-------------------------------- live log call ---------------------------------
00:00:00 [    INFO] Beginning worker shutdown, will wait 0:00:00 before cancelling activities (_worker.py:419)
PASSED                                                                   [100%]
============================== 1 passed in 00.20s ==============================
```

You've successfully written, executed, and passed a Cancellation Workflow test.

## Conclusion

Building a Python Subscription application with the Temporal SDK provides a powerful solution for sending email subscriptions. With the help of Workflows, Activities, and Queries, you can easily mock sending emails, retrieve subscription status, and cancel a subscription.

With this knowledge, you will be able to take on more complex Workflows and Activities to create even stronger applications.
