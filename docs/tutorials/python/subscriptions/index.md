---
id: subscription-tutorial
sidebar_position: 3
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-03-01
title: Build a subscription workflow with Temporal and Python

description: In this tutorial, we will tour all of the Workflow APIs you should know, primarily Signals, Queries, by building a realistic monthly subscription payments Workflow that can be canceled.
image: /img/temporal-logo-twitter-card.png
---

## Introduction

### Goals

Throughout the Python Subscription tutorial, you will accomplish the following:

- Use Activities to mock sending emails.
- Use Queries to retrieve the status of the email subscription.
- Use a Cancellation to end the subscription.

### Tasks

To accomplish these goals, you will need to build the following:

- Temporal Environment for the Flask Web application
- Implement functionalities of subscribing and canceling the emails, as well as fetching information.

### Working sample

To see a working sample, see the [email-subscription-project-python](https://github.com/temporalio/email-subscription-project-python) tutorial on GitHub.

## Setting up the environment

Before you can get started, view the following requirements:

- Temporal Server
- Temporal Library
- Flask Sever

### Project requirements

- Temporal Python SDK (tested with version [1.0.0](https://github.com/temporalio/sdk-python/releases/tag/1.0.0)).
- Flask (tested with version [2.2.2](https://github.com/pallets/flask/releases/tag/2.2.2)).

```python
pip install temporalio
pip install "Flask[asyinco]"
```

## Develop Workflow

Workflow defines a sequence of steps defined by writing code, known as a Workflow Definition, and are carried out by running that code, which results in a Workflow Execution.

Before writing the Workflow Definition, define the data objects used by the Workflow Definitions.

### Define Dataclass


The Temporal Python SDK strongly encourages the use of a single dataclass for parameters and return types, so fields with defaults can be added without breaking compatibility.

In the following example, set the `ComposeEmail` dataclass and define the necessary parameters.

For this tutorial, write an `email`, `message`, and `count` parameter.

<!--SNIPSTART run_worker {"selectedLines": ["10-14"]}-->
[run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_worker.py)
```py
// ...
@dataclass
class ComposeEmail:
    email: str
    message: str
    count: int = 0
```
<!--SNIPEND-->

This dataclass includes 3 typed objects, `email`, `message`, and `count`.

### Define Workflow Definition

Workflows are fundamental units of a Temporal Application and orchestrate the execution of Activities.

In the Temporal Python SDK, Workflow Definitions contain the `@workflow.defn` decorator and the method invoked for the Workflow is decorated with `@workflow.run`.

Create a `SendEmailWorkflow` class, and define the attributes that we want to pass to the class.

<!--SNIPSTART run_worker {"selectedLines": ["25-31"]}-->
[run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_worker.py)
```py
// ...
@workflow.defn
class SendEmailWorkflow:
    def __init__(self) -> None:
        self._email: str = "<no email>"
        self._message: str = "<no message>"
        self._subscribed: bool = False
        self._count: int = 0
```
<!--SNIPEND-->

In the Workflow method, create a loop that checks if `_subscribed` is `True`. If it is set to `True`, start the Activity.

<!--SNIPSTART run_worker {"selectedLines": ["33-49"]}-->
[run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_worker.py)
```py
// ...
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

The `while` loop starts the Activity with the `start_activity()` function. Exactly one method name must have this decorator and must be defined on an `async def` method. The method’s arguments are the Workflow’s arguments, which in this example takes the Activity Type, an object or data class, and a `Schedule-To-Close Timeout`.

The loop increments the`_count` attribute and calls the `send_email` Activity with the current `ComposeEmail` object.
The loop will continue as long as `_subscribed` attribute is `True`.
The loop also includes a sleep statement that causes the workflow to pause for three seconds between email sends.

## Develop Activity

An Activity is a normal function or method execution that's intended to execute a single, well-defined action (either short or long-running).

Develop an Activity Definition by using the `@activity.defn` decorator and write a function that mocks sending an email.

In the following example, the `send_email` function takes in the data class `ComposeEmail`, and pass the `email`, `message`, and `count` objects.

<!--SNIPSTART run_worker {"selectedLines": ["17-22"]}-->
[run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_worker.py)
```py
// ...
@activity.defn
async def send_email(details: ComposeEmail) -> str:
    print(
        f"Sending email to {details.email} with message: {details.message}, count: {details.count}"
    )
    return "success"
```
<!--SNIPEND-->

The logic within the `send_email` function mocks sending an email, by creating a string returning the `success` status.

This is an Activity Definition that will be called by the Workflow to send an email.
It takes a `ComposeEmail` object as its argument and returns a string.
The function simply prints the email details to the console and returns `"success"`.

## Bundle and run it with the Worker

Now that the Activity Definition and Workflow Definition are written, run the Worker process.
The Worker Process is where the Workflow Functions and Activity Functions are executed.

Start by connecting to the Temporal Client, defining the Worker and its arguments, then run the Worker.

<!--SNIPSTART run_worker {"selectedLines": ["64-77"]}-->
[run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_worker.py)
```py
// ...
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

Creates a program that connects to a Temporal Client.

Workers can specify multiple Workflows and Activities in a list.

## Build the gateway

### Global Client

Register the Temporal Client function to run before the first request to this instance of the application.

This code defines an asynchronous function `get_client()` that creates a Client connection to Temporal server and returns it. 
The Client connection is saved in a global variable g for future use.

<!--SNIPSTART run_flask {"selectedLines": ["10-13"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
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


In the `run_flask.py` file, write the `/subscribe/` endpoint as an asynchronous function.

The `get_client()` returns the global Temporal Client object.
In the `start_workflow` function, pass the name of the Workflow run method, arguments to be passed to the Workflow Execution, the Workflow Id, and the Task Queue name.

<!--SNIPSTART run_flask {"selectedLines": ["17-25"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
async def start_subscription():
    client = await get_client()

    await g.client.start_workflow(
        SendEmailWorkflow.run,
        args=(request.form["email"], request.form["message"]),
        id="send-email-activity",
        task_queue="hello-activity-task-queue",
    )
```
<!--SNIPEND-->
This demonstrates the basic steps to start a Workflow.

Next, learn to query your Workflow.

## Add a Query

Add Query methods to your Workflow.

In this example, write 3 queries to return the `email`, a `message`, and how many emails were sent.

<!--SNIPSTART run_worker {"selectedLines": ["51-61"]}-->
[run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_worker.py)
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

Now tell the Flask endpoint to query the Workflow's `count` and `email` string name and return it in a JSON response.

<!--SNIPSTART run_flask {"selectedLines": ["24-32"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
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
[get_workflow_handle()](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) return a Workflow handle to an existing Workflow by its Id.
[query()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#query) will query the Workflow on the handle.

----

Add additional Queries to the Flask routes.

In this example, when you land on `/get-details/`, the `get_query` function will return the `status`, number of emails sent, and the original email.
<!--SNIPSTART run_flask {"selectedLines": ["36-52"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
@app.route("/get-details/", methods=["GET"])
async def get_query():
    client = await get_client()
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
```
<!--SNIPEND-->

`handle.query()` creates a Handle on the Workflow and calls the Query method on the handle to get the value of the variables.

## Add the Cancellation

To send a cancellation notice to an endpoint, use the HTTP `DELETE` method to return a `cancel()` method on the Workflow's handle.

<!--SNIPSTART run_flask {"selectedLines": ["57-63"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
@app.route("/unsubscribe/", methods=["DELETE"])
async def end_subscription():
    client = await get_client()
    handle = g.client.get_workflow_handle(
        "send-email-activity",
    )
    await handle.cancel()
```
<!--SNIPEND-->

- [get_workflow_handle](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle_for) gets a Workflow handle to an existing Workflow by its ID.
- [cancel()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel) cancels the Workflow.

## Writing tests

## Conclusion

