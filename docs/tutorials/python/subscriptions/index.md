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

Throughout the Python Subscription tutorial, you will accomplish the following goals:

- Use Activities to mock sending emails.
- Use Queries to retrieve the status of the email subscription.
- Use a Cancellation to end the subscription.

### Tasks

To accomplish these goals, you will need to build the following:

- Temporal Environment for the Flask Web application
- Implement functionalities of subscribing and canceling the emails, as well as fetching information.

### Working sample

All the code for this tutorial is stored on GitHub in the following repository:

- [email-subscription-project-python](https://github.com/temporalio/email-subscription-project-python)


## Setting up the environment

A prerequisite to get started is to install the following:

- Temporal Server
- Temporal Library
- Flask Sever

### Project requirements

- Python 3.7 or greater (tested with version 3.11)
- Temporal Python SDK (tested with version [1.0.0](https://github.com/temporalio/sdk-python/releases/tag/1.0.0)).
- Flask (tested with version [2.2.2](https://github.com/pallets/flask/releases/tag/2.2.2)).

#### Activate Virtual Environment

Run the following command to create a new virtual environment:

```bash
python3 -m venv venv
```

This command creates a new directory called `venv`, which contains the following items:

- Python interpreter (Python 3.11.0 in this case)
- Scripts for activating and deactivating the virtual environment

Activate the virtual environment to start using it:

```bash
source venv/bin/activate
(venv) $
```

After activating, the virtual environment `(venv)` will be displayed on your command prompt.

Since the virtual environment is active, running the python command will run the Python 3 version of the interpreter (which is stored within your virtual environment itself):

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

Before writing the Workflow Definition, define the data objects used by the Workflow Definitions.

### Define Dataclass

Now it's time to actually write some code for our Python application.


The Temporal Python SDK strongly encourages the use of a single dataclass for parameters and return types, so fields with defaults can be added without breaking compatibility.

Create a new file called `shared_objects.py` to set a Dataclass and describe its objects as parameters.

```bash
nano shared_objects.py
```

The Dataclass will store the objects to send to your Activity and Workflow.

- add `email` as a string to pass a user's email.
- add `message` as a string to pass a message to the user.
- add `count` to as an integer to track the number of emails sent.

<!--SNIPSTART email-subscription-project-python-shared_objects-->
[subscription/shared_objects.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/shared_objects.py)
```py
from dataclasses import dataclass


@dataclass
class ComposeEmail:
    email: str
    message: str
    count: int = 0


```
<!--SNIPEND-->

Now, that the data objects are declared, let's write the Workflow Definition.

### Define Workflow Definition

Workflows are fundamental units of a Temporal Application and orchestrate the execution of Activities.

In the Temporal Python SDK, Workflow Definitions contain the `@workflow.defn` decorator and the method invoked for the Workflow is decorated with `@workflow.run`.

Create a new file called `workflows.py` to create the `SendEmailWorkflow` class and define its attributes.

```bash
nano workflows.py
```

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["1-36"]}-->
[subscription/workflows.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/workflows.py)
```py

import asyncio
from datetime import timedelta

from shared_objects import ComposeEmail
from temporalio import workflow

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
    async def run(self, email, message):
        self._email = f"{email}"
        self._message = "Here's your message!"
        self._subscribed = True
        self._count = 0

        while self._subscribed is True:
            self._count += 1
            await workflow.start_activity(
                send_email,
                ComposeEmail(self._email, self._message, self._count),
                start_to_close_timeout=timedelta(seconds=10),
            )
            await asyncio.sleep(3)

        return ComposeEmail(self._email, self._message, self._count)
```
<!--SNIPEND-->

In the Workflow method, create a loop that checks if `_subscribed` is `True`. If it is set to `True`, start the Activity.


The `while` loop starts the Activity with the `start_activity()` function. Exactly one method name must have this decorator and must be defined on an `async def` method. The method’s arguments are the Workflow’s arguments, which in this example takes the Activity Type, an object or data class, and a `Schedule-To-Close Timeout`.

The loop increments the`_count` attribute and calls the `send_email` Activity with the current `ComposeEmail` object.
The loop will continue as long as the `_subscribed` attribute is `True`.
The loop also includes a sleep statement that causes the workflow to pause for three seconds between email sends.

Now that you've developed a Workflow Definition, let's develop an Activity to execute a function.

## Develop Activity

An Activity is a normal function or method execution that's intended to execute a single, well-defined action (either short or long-running).

Create a new file called `activities.py` and develop an Activity Definition by using the `@activity.defn` decorator and write a function that mocks sending an email.


```bash
nano activities.py
```

<!--SNIPSTART email-subscription-project-python-activity_function {"selectedLines": ["1-10"]}-->
[subscription/activities.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/activities.py)
```py
from shared_objects import ComposeEmail
from temporalio import activity


@activity.defn
async def send_email(details: ComposeEmail) -> str:
    print(
        f"Sending email to {details.email} with message: {details.message}, count: {details.count}"
    )
    return "success"
```
<!--SNIPEND-->

The `send_email` function takes in the data class `ComposeEmail`, and passes the `email`, `message`, and `count` objects.

The logic within the `send_email` function mocks sending an email, by creating a string returning the `success` status.

This is an Activity Definition that will be called by the Workflow to send an email.
It takes a `ComposeEmail` object as its argument and returns a string.
The function simply prints the email details to the console and returns `"success"`.

## Bundle and run it with the Worker

Now that the Activity Definition and Workflow Definition are written, run the Worker process.
The Worker Process is where the Workflow and Activity Definitions are executed.

Start by connecting to the Temporal Client, defining the Worker and its arguments, then run the Worker.

Create a new file called `run_worker.py` and develop the Worker process to execute your Workflow and Activity Definitions.

```bash
nano run_worker.py
```

<!--SNIPSTART email-subscription-project-python-run_worker-->
[subscription/run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/run_worker.py)
```py
import asyncio

from activities import send_email
from temporalio.client import Client
from temporalio.worker import Worker
from workflows import SendEmailWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="hello-activity-task-queue",
        workflows=[SendEmailWorkflow],
        activities=[send_email],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

The `main` function connects to a Temporal Client and creates a Worker object to run the `SendEmailWorkflow` Workflow and the `send_email()` Activity.

The `if __name__ == "__main__":` block runs the main function using `asyncio.run`.

Now that we've written the logic to execute the Workflow and Activity Definitions, let's build the gateway.

## Build the gateway

### Global Client

Register the Temporal Client function to run before the first request to this instance of the application.

Create a new file called `run_flask.py` to develop your Flask endpoints.

```bash
nano run_worker.py
```

This code defines an asynchronous function `get_client()` that creates a Client connection to Temporal server and returns it. 
The Client connection is saved in a global variable g for future use.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["9-12"]}-->
[subscription/run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/run_flask.py)
```py
// ...
async def get_client():
    if Client not in g:
        g.client = await Client.connect("localhost:7233")
    return g.client
```
<!--SNIPEND-->

The `Client.connect()` method is called to create a connection to the Temporal service at `localhost:7233`.

A Temporal Client enables you to communicate with the Temporal Cluster.
Communication with a Temporal Cluster includes, but isn't limited to, the following:

- Starting Workflow Executions.
- Sending Queries to Workflow Executions.
- Getting the results of a Workflow Execution.

### Build the first endpoint


In the `run_flask.py` file, write a `/subscribe/` endpoint as an asynchronous function.

The `get_client()` returns the global Temporal Client object.
In the `start_workflow` function, pass the name of the Workflow run method, arguments to be passed to the Workflow Execution, the Workflow Id, and the Task Queue name.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["15-31"]}-->
[subscription/run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/run_flask.py)
```py
// ...
@app.route("/subscribe/", methods=["POST"])
async def start_subscription():
    await get_client()

    await g.client.start_workflow(
        SendEmailWorkflow.run,
        args=(request.form["email"], request.form["message"]),
        id="send-email-activity",
        task_queue="hello-activity-task-queue",
    )
    handle = g.client.get_workflow_handle(
        "send-email-activity",
    )
    emails_sent: int = await handle.query(SendEmailWorkflow.count)
    email: str = await handle.query(SendEmailWorkflow.greeting)

    return jsonify({"status": "ok", "email": email, "emails_sent": emails_sent})
```
<!--SNIPEND-->
This demonstrates the basic steps to start a Workflow.

Next, learn to query your Workflow.

## Add a Query

Add Query methods to your Workflow.

In this example, write 3 queries to return the `email`, a `message`, and how many emails were sent.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["38-48"]}-->
[subscription/workflows.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/workflows.py)
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

[@workflow.query](https://python.temporal.io/temporalio.workflow.html#query) is a decorator for a Workflow Query method.
Queries should never mutate anything in the Workflow.

Each Query methods returns the current values of the Workflow attributes.

----

Now, in the `run_flask.py` tell the Flask endpoint to query the Workflow's `count` and `email` string name and return it in a JSON response.
Start with the `/subscribe/` endpoint.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["25-31"]}-->
[subscription/run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/run_flask.py)
```py
// ...
    handle = g.client.get_workflow_handle(
        "send-email-activity",
    )
    emails_sent: int = await handle.query(SendEmailWorkflow.count)
    email: str = await handle.query(SendEmailWorkflow.greeting)

    return jsonify({"status": "ok", "email": email, "emails_sent": emails_sent})
```
<!--SNIPEND-->
[get_workflow_handle()](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) returns a Workflow handle to an existing Workflow by its Id.
[query()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#query) will query the Workflow on the handle.

----

Add additional Queries to the Flask routes.

In this example, when you land on `/get-details/`, the `get_query` function will return the `status`, number of emails sent, and the original email.
<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["38-52"]}-->
[subscription/run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/run_flask.py)
```py
// ...
    handle = g.client.get_workflow_handle(
        "send-email-activity",
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

## Add the Cancellation

To send a cancellation notice to an endpoint, use the HTTP `DELETE` method to return a `cancel()` method on the Workflow's handle.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["57-63"]}-->
[subscription/run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/subscription/run_flask.py)
```py
// ...
async def end_subscription():
    await get_client()
    handle = g.client.get_workflow_handle(
        "send-email-activity",
    )
    await handle.cancel()
    return jsonify({"status": "ok"})
```
<!--SNIPEND-->

- [get_workflow_handle](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle_for) gets a Workflow handle to an existing Workflow by its Id.
- [cancel()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel) cancels the Workflow.

## Writing tests

In this example, we're testing a `SendEmailWorkflow` that sends an email to a given email address with a specified message, and we're replacing the `send_email` Activity with a mocked implementation `send_email_mocked`.
This test has two parts:

- `test_execute_workflow_with_mock_activity`: verifies that the workflow can be executed with a mocked activity function that returns a predefined response.
- `test_execute_workflow_with_real_activity`: verifies that the workflow can be executed with the actual send_email activity function, which sends an email with the given inputs.
  
You can run these tests by running `pytest` in the directory containing the test file and the `conftest.py` file.

## Conclusion


