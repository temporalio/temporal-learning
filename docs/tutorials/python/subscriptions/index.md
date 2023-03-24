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

In this tutorial, you’ll build an email subscription web application using Temporal and Python. You’ll create a web server to handle requests and use Temporal Workflows, Activities, and Queries to build the core of the application. Your web server will handle requests from the end user and interact with a Temporal Workflow to manage the email subscription process. Since you’re building the business logic with Temporal’s Workflows and Activities, you’ll be able to use Temporal to manage each subscription rather than relying on a separate database or task queue. This reduces the complexity of the code you have to write and maintain.

You’ll create a sign-up page where users provide their email, and you’ll create a new Workflow execution using that email address which will simulate sending an email message at certain intervals. The user can check on the status of their subscription which you’ll handle using a Query, and they can end the subscription at any time by unsubscribing, which you’ll handle by cancelling the Workflow Execution.  You can view the user’s entire process through Temporal’s Web UI. For this tutorial, you’ll simulate sending emails, but you can adapt this example to call a live email service in the future.

By the end of this tutorial, you’ll have a clear understand how to use Temporal to create and manage long-running Workflows within a web application.

### Working sample

All the code for this tutorial is stored on GitHub in the [email-subscription-project-python](https://github.com/temporalio/email-subscription-project-python) repository.

## Prerequisites

Before starting this tutorial:

- Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial
- Install Flask (tested with version [2.2.2](https://github.com/pallets/flask/releases/tag/2.2.2))
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

To create a new Workflow Definition, start by creating a new file called `workflows.py`. This file will contain the `SendEmailWorkflow` class and its attributes.

```bash
nano workflows.py
```

Use the `workflows.py` file to write deterministic logic inside your Workflow Definition and to [start the Activity](https://python.temporal.io/temporalio.workflow.html#start_activity) Execution.

The `SendEmailWorkflow` class contains a loop that checks if the `_subscribed` attribute is True, and if so, starts the `send_email()` Activity.

Since the user's email address serves as the Workflow Id, attempting to subscribe with the same email address twice will result in a `Workflow Execution already started` error and prevent the Workflow Execution from spawning again.

Therefore, only one Workflow Execution per email address can exist within the associated Namespace for the given retention period, which ensures that the user won't receive multiple email subscriptions. This helps reduce the complexity of the code you have to write and maintain.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["1-36"]}-->
<!--SNIPEND-->

The `run()` method, which is decorated with `@workflow.run`, takes in the email address as an argument. This method initializes the `_email`, `_message`, `_subscribed`, and `_count` attributes of the `SendEmailWorkflow` instance.

The while loop increments the `_count` attribute and calls the `send_email()` Activity with the current `ComposeEmail` object. The loop will continue as long as the `_subscribed` attribute is true.

The `start_activity()` method is used to execute the `send_email()` Activity with the following parameters:

- The `send_email()` Activity Definition
- The `ComposeEmail` data class
- A `start_to_close_timeout()` parameter, which tells the Temporal Server to time out the Activity 10 seconds from when the Activity starts

The loop also includes a sleep statement that causes the Workflow to pause for a set amount of time between email. This could be set to seconds, days, months, or even years, depending on your business logic.

With this Workflow Definition in place, you can now develop an Activity to execute your email function.

## Develop an Activity

Create a new file called `activities.py` and develop the asynchronous Activity Definition.

```bash
nano activities.py
```

<!--SNIPSTART email-subscription-project-python-activity_function {"selectedLines": ["1-10"]}-->
<!--SNIPEND-->

Each iteration of the Workflow loop will execute this Activity, which simulates sending a message to the user.

Now that the Activity Definition and Workflow Definition have been created, it is time to write the Worker process.

## Bundle and run it with the Worker

Create a new file called `run_worker.py` and develop the Worker process to execute your Workflow and Activity Definitions.

```bash
nano run_worker.py
```

<!--SNIPSTART email-subscription-project-python-run_worker-->
<!--SNIPEND-->

Now that we've written the logic to execute the Workflow and Activity Definitions, let's build the gateway.

## Build the web server

The web server is used handle requests.
This tutorial uses the Flask as the entry point for initiating Workflow Execution and communicating with the `subscribe`, `get-details`, and `unsubscribe` routes.

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

In the `run_flask.py` file, write a `/subscribe` endpoint as an asynchronous function, so that users can subscribe to the email subscription.

In the `start_workflow` function, pass the name of the Workflow run method, arguments to be passed to the Workflow Execution, the Workflow Id, and the Task Queue name. Ensure that the Task Queue name matches the same Task Queue that was declared in the Worker process.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["16-31"]}-->
<!--SNIPEND-->

The Workflow Id is set when the user provides their email.
This ensures that the email is unique across all Workflows so that the user can't sign up multiple times, only receive the emails they've subscribed to, and when they cancel; they cancel the Workflow run.

Next, learn to query your Workflow.

## Add a Query

Now create a method in which a user can see the results of their subscription.

Use a Query method so a user can get information about their subscription details.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["42-52"]}-->
<!--SNIPEND-->

- `greeting`: returns the greeting message
- `message`: returns a message to the user
- `count`: returns the number of messages sent to the user

The Query can be used even if the Workflow is completed, which is useful for when the user `unsubscribes()` but wants to get details about their subscription.

Queries should never mutate anything in the Workflow.

----

Let's write an endpoint so that users can get details about the email subscription.

Use [get_workflow_handle()](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) to return a Workflow handle by a Workflow Id.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["32-52"]}-->
<!--SNIPEND-->

Using `handle.query()` creates a Handle on the Workflow and calls the Query method on the handle to get the value of the variables.
This function enables you to return all the information about the user's email subscription that's declared in the Workflow.

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

This tutorial demonstrates how to build an email subscription web application using Temporal and Python. By leveraging Temporal's Workflows, Activities, and Queries, the tutorial shows how to create a web server that interacts with Temporal to manage the email subscription process. 

With this knowledge, you will be able to take on more complex Workflows and Activities to create even stronger applications.
