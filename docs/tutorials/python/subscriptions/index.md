---
id: subscription-tutorial
sidebar_position: 3
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-03-01
title: Build a subscription workflow with Temporal and Python
description: This tutorial teaches you how to implement an email subscription application with Temporal's Workflows, Activities, and Queries; however, the key learning allows users to subscribe and start your business logic through a web action.
image: /img/temporal-logo-twitter-card.png
---

## Introduction

This tutorial teaches you how to implement an email subscription application with Temporal's Workflows, Activities, and Queries; however, the key learning allows users to subscribe and start your business logic through a web action.
Because the business logic is built with Temporal's Workflows and Activities, you get many features built into the application. This tutorial covers how to use loops within Workflows, setting a Workflow Id to business logic, querying the Workflow, and handling Cancellations.

The user provides a unique identifier, in this case an email address, and the entire Workflow kicks off. For the purposes of this tutorial, you'll simulate sending an email message through an interval period. The user can end the subscription at anytime and because this sends a cancellation to the Workflow, the user won't receive any further emails.

You can view the user's entire integration through the Web UI.

By the end of this tutorial, you'll have a clear understand how to use Temporal to create long-running Workflows.

### Goals

Throughout the Python Subscription tutorial, you'll accomplish the following goals:

- Build a subscription Workflow
- Use Activities to mock sending emails
- Use Queries to retrieve the status and details of the email subscription
- Use a Cancellation to end the subscription
- Test the Cancellation Workflow

### Tasks

To accomplish these goals, you will need to build the following:

- A Flask Web application
- Implement functionalities of subscribing and canceling the emails, as well as fetching information
- Use Pytest to test the Cancellation Workflow

### Working sample

All the code for this tutorial is stored on GitHub in the [email-subscription-project-python](https://github.com/temporalio/email-subscription-project-python) repository.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and Python](/getting_started/python/dev_environment/index.md).
- [Flask Sever](https://flask.palletsprojects.com/en/2.2.x/quickstart/)

You will build on the concepts you learned in the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial.

### Project requirements

- Python 3.7 or greater (tested with version 3.11)
- Temporal Python SDK (tested with version [1.0.0](https://github.com/temporalio/sdk-python/releases/tag/1.0.0)).
  - `pip install temporalio`
- Flask (tested with version [2.2.2](https://github.com/pallets/flask/releases/tag/2.2.2)).
  - `pip install "Flask[asyinco]"`

## Develop Workflow

A Workflow defines a sequence of steps defined by writing code, known as a Workflow Definition, and are carried out by running that code, which results in a Workflow Execution.

Before writing the Workflow Definition, it is important to define the data objects used by the Workflow Definitions.

### Define Data Class

The Temporal Python SDK recommends the use of a single [data class](https://docs.python.org/3/library/dataclasses.html) for parameters and return types. This allows for the addition of fields with defaults without breaking compatibility.

To set up the data class and describe its objects as parameters, create a new file called `shared_objects.py`.

```bash
nano shared_objects.py
```

The data class will store the objects to be sent to your Activity and Workflow. Add the following objects to the `ComposeEmail` data class:

- `email`: as a string to pass a user's email
- `message`: as a string to pass a message to the user
- `count`: as an integer to track the number of emails sent

<!--SNIPSTART email-subscription-project-python-shared_objects {"selectedLines": ["1", "4-8"]}-->
<!--SNIPEND-->

`ComposeEmail` allows you to pass an email and message string, as well as a count integer, into the Workflow.

Now that the data objects are declared, let's move on to writing the Workflow Definition.

### Define Workflow Definition

To create a new Workflow Definition, you can start by creating a new file called `workflows.py`. This file will contain the `SendEmailWorkflow` class and its attributes.

```bash
nano workflows.py
```

You can use the `workflows.py` file write deterministic logic inside your Workflow Definition and to [start the Activity](https://python.temporal.io/temporalio.workflow.html#start_activity).

The `SendEmailWorkflow` class, for example, contains a loop that checks if the `_subscribed` attribute is True, and if so, starts the `send_email` Activity.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["1-36"]}-->
<!--SNIPEND-->

The `run()` method, which is decorated with `@workflow.run`, takes in the email address as an argument. This method initializes the `_email`, `_message`, `_subscribed`, and `_count` attributes of the `SendEmailWorkflow` instance.

The while loop increments the `_count` attribute and calls the `send_email` Activity with the current `ComposeEmail` object. The loop will continue as long as the `_subscribed` attribute is true. 

The `start_activity()` method is used to execute the `send_email` Activity with the following parameters:

- The `send_email()` Activity Definition.
- The `ComposeEmail` data class.
- A `start_to_close_timeout()` parameter, which tells the Temporal Server to time out the Activity 10 seconds from when the Activity starts.

The loop also includes a sleep statement that causes the Workflow to pause for a set amount of time between email. This could be set to seconds, days, months, or even years, depending on your business logic.

With this Workflow Definition in place, you can now develop an Activity to execute your email function.

## Develop an Activity

An Activity is a function or method execution that's designed to perform a specific, well-defined action, either short or long-running.

To create an Activity Definition, start by creating a new file called `activities.py`.
Then use the `@activity.defn` decorator to write a function that simulates sending an email.

```bash
nano activities.py
```

<!--SNIPSTART email-subscription-project-python-activity_function {"selectedLines": ["1-10"]}-->
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
<!--SNIPEND-->

The `main` function connects to a Temporal [Client](https://python.temporal.io/temporalio.client.Client.html) and creates a Worker object to run the `SendEmailWorkflow` Workflow and the `send_email()` Activity.

In this tutorial, the Client is connecting to `localhost:7223` and the Namespace name is set to the default name.

The [Worker](https://python.temporal.io/temporalio.worker.Worker.html) processes the Workflow and Activities. Once created, Workers can be run and shutdown explicitly with `run` or `shutdown`.

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
<!--SNIPEND-->

The Workflow Id is set when the user provides their email. This ensures that the email is unique across all Workflows so that the user can't sign up multiple times, only receive the emails they've subscribed to, and when they cancel; they cancel the Workflow.

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
<!--SNIPEND-->

When a user wants to get information about their subscription details, you can return any of the information from the Query. 
The Query can be used even if the Workflow is completed. 

Queries should never mutate anything in the Workflow.

----
Let's write an endpoint to get details about the Email subscription.

Create an asynchronous function to Query and return details about the email subscription.

Use [get_workflow_handle()](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) returns a Workflow handle to an existing Workflow by its Id.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["32-52"]}-->
<!--SNIPEND-->

Using `handle.query()` creates a Handle on the Workflow and calls the Query method on the handle to get the value of the variables.
This function enables you to return all the information about the user's email subscription.

Now that users can subscribe and view the details of their subscription, let's give them a way to unsubscribe.

## Add the Cancellation

To send a cancellation notice to an endpoint, use the HTTP `DELETE` method on the `unsubscribe` endpoint to return a [cancel()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel) method on the Workflow's handle.


<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["53-61"]}-->
<!--SNIPEND-->

This should allow users to cancel the Workflow and prevent the Workflow from continuing to execute the Activity.
As mentioned previously, the Workflow Id is tied to the email address given by the `subscribe` endpoint. When a user pass their email address to `unsubscribe`, they're canceling that Workflow.

## Create an integration test

Integration testing is an essential part of software development that helps ensure that different components of an application work together correctly.

The Temporal Python SDK includes functions that help you test your Workflow Executions. 

Workflow testing can be done in an integration test fashion against a [test server](https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#start_local) or from a [given Client](https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#from_client).

In this section, you'll learn how to write an integration test using the Temporal Python SDK to test the cancellation of a Workflow. Let's add tests to the application to ensure the Cancellation works as expected.

### Setup tests environment

To set up the test environment, create a new Python file called `test_run_worker.py` in the `tests` directory, include the `__init__.py` file.

```bash
touch tests/test_run_workflow.py
touch tests/__init__.py
```

### Import modules

The Temporal Python SDK includes functions that help you test your Workflow Executions. In this section, you will import the necessary modules and classes to test the cancellation of a Workflow.

Import the Temporal [Client](https://python.temporal.io/temporalio.client.Client.html), for Accessing the Temporal Client, [WorkflowExecutionStatus](https://python.temporal.io/temporalio.client.WorkflowExecutionStatus.html) to get the status of the Workflow Execution, and the [WorkflowFailureError](https://python.temporal.io/temporalio.client.WorkflowFailureError.html) class to return if the Workflow is unsuccessful.

Then, import the Activities and Worker modules from your application.

<!--SNIPSTART email-subscription-project-python-test_run_worker {"selectedLines": ["3-9"]}-->
<!--SNIPEND-->

Now that you've imported the necessary modules, you can write the test function.

### Create the test function

In the `test_run_worker.py` file, create an asynchronous test function called `test_execute_workflow` that takes the `client` object as a parameter. The `client` object is used to connect to the local Temporal server.

Set the `task_queue` parameter to match the worker process. In this example, it is set to `subscription`.

Use the `start_workflow()` function to start the workflow, passing in the `SendEmailWorkflow.run` function, along with the necessary arguments:

Assign the handle variable to the result of the `start_workflow()` function call so that you can test the cancellation action.

Assert and test of the status of the Workflow Execution.

<!--SNIPSTART email-subscription-project-python-test_run_worker {"selectedLines": ["12-33"]}-->
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

**Results**: You've successfully written, executed, and passed a Cancellation Workflow test.

## Conclusion

Building a Python Subscription application with the Temporal SDK provides a powerful solution for sending email subscriptions. With the help of Workflows, Activities, and Queries, you can easily mock sending emails, retrieve subscription status, and cancel subscriptions.  By using web actions, you can easily subscribe and start your business logic, and thanks to the robust features built into Temporal's Workflows and Activities, your application will be reliable.

With this knowledge, you will be able to take on more complex Workflows and Activities to create even stronger applications.
