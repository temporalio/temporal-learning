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

### Introduction

In this tutorial, you’ll build an email subscription web application using Temporal and Python. You’ll create a web server using the [Flask](https://flask.palletsprojects.com/) framework to handle requests and use Temporal Workflows, Activities, and Queries to build the core of the application. Your web server will handle requests from the end user and interact with a Temporal Workflow to manage the email subscription process. Since you’re building the business logic with Temporal’s Workflows and Activities, you’ll be able to use Temporal to manage each subscription rather than relying on a separate database or task queue. This reduces the complexity of the code you have to write and maintain.

You’ll create an endpoint for users to give their email address, and then create a new Workflow execution using that email address which will simulate sending an email message at certain intervals. The user can check on the status of their subscription, which you’ll handle using a Query, and they can end the subscription at any time by unsubscribing, which you’ll handle by cancelling the Workflow Execution. You can view the user’s entire process through Temporal’s Web UI. For this tutorial, you’ll simulate sending emails, but you can adapt this example to call a live email service in the future.

By the end of this tutorial, you’ll have a clear understand how to use Temporal to create and manage long-running Workflows within a web application.

You'll find the code for this tutorial on GitHub in the [email-subscription-project-python](https://github.com/temporalio/email-subscription-project-python) repository.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and Python](/getting_started/python/dev_environment/index.md).
- Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial to ensure you understand the basics of creating Workflows and Activities with Temporal.

## Develop the Workflow

A Workflow defines a sequence of steps defined by writing code, known as a Workflow Definition, and are carried out by running that code, which results in a Workflow Execution.

The Temporal Python SDK recommends the use of a single [data class](https://docs.python.org/3/library/dataclasses.html) for parameters and return types. This lets you add fields without breaking compatibility. Before writing the Workflow Definition, you'll define the data objects used by the Workflow Definitions.

To set up the data class, create a new file called `shared_objects.py` in your project directory:

```command
nano shared_objects.py
```

The data class will represent the data you'll send to your Activity and Workflow. You'll create a `ComposeEmail` data class with the following fields:

- `email`: as a string to pass a user's email
- `message`: as a string to pass a message to the user
- `count`: as an integer to track the number of emails sent
- `subscribed`: as a boolean to track whether the user is subscribed


Add the following code to the `shared_objects.py` file:

<!--SNIPSTART email-subscription-project-python-shared_objects {"selectedLines": ["1-14"]}-->
<!--SNIPEND-->

Now that you have the `WorkflowOptions` and `EmailDetails` data class defined, you can now move on to writing the Workflow Definition.

To create a new Workflow Definition, create a new file called `workflows.py`. This file will contain the `SendEmailWorkflow` class and its attributes.

```command
nano workflows.py
```

Use the `workflows.py` file to write deterministic logic inside your Workflow Definition and to [start the Activity Execution](https://python.temporal.io/temporalio.workflow.html#start_activity).

Add the following code to define the Workflow:

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["1-38"]}-->
<!--SNIPEND-->

The `run()` method, decorated with `@workflow.run`, takes in the email address as an argument. This method initializes the `_email`, `_message`, `_subscribed`, and `_count` attributes of the `SendEmailWorkflow` instance.

The `SendEmailWorkflow` class has a loop that checks if the `_subscribed` attribute is True, and if so, starts the `send_email()` Activity.

The while loop increments the `_count` attribute and calls the `send_email()` Activity with the current `ComposeEmail` object. The loop will continue as long as the `_subscribed` attribute is true.

The `start_activity()` method executes the `send_email()` Activity with the following parameters:

- The `send_email()` Activity Definition
- The `ComposeEmail` data class
- A `start_to_close_timeout()` parameter, which tells the Temporal Server to time out the Activity 10 seconds from when the Activity starts

The loop also includes a sleep statement that causes the Workflow to pause for a set amount of time between email. You can define this in seconds, days, months, or even years, depending on your business logic.

Since the user's email address serves as the Workflow Id, attempting to subscribe with the same email address twice will result in a `Workflow Execution already started` error and prevent the Workflow Execution from spawning again.

Therefore, only one Workflow Execution per email address can exist within the associated Namespace for the given retention period. This ensures that the user won't receive multiple email subscriptions. This also helps reduce the complexity of the code you have to write and maintain.

With this Workflow Definition in place, you can now develop an Activity to send emails.

## Develop an Activity

Create a new file called `activities.py` and develop the asynchronous Activity Definition.

```command
nano activities.py
```

<!--SNIPSTART email-subscription-project-python-activity_function {"selectedLines": ["1-11"]}-->
<!--SNIPEND-->

Each iteration of the Workflow loop will execute this Activity, which simulates sending a message to the user.

Now that the Activity Definition and Workflow Definition have been created, it's time to write the Worker process.

## Bundle and run it with the Worker

Create a new file called `run_worker.py` and develop the Worker process to execute your Workflow and Activity Definitions.

```command
nano run_worker.py
```

<!--SNIPSTART email-subscription-project-python-run_worker-->
<!--SNIPEND-->

Now that you've written the logic to execute the Workflow and Activity Definitions, try to build the gateway.

## Build the web server

The web server is used to handle requests.
This tutorial uses the Flask as the entry point for initiating Workflow Execution and communicating with the `subscribe`, `get-details`, and `unsubscribe` routes.

### Global Client

Register the Temporal Client function to run before the first request to this instance of the application.

Create a new file called `run_flask.py` to develop your Flask endpoints.

```command
nano run_flask.py
```

Import your libraries and use the `connect_temporal()` function on the Flask app to connect to the Temporal Server.
The `get_client()` function is used to retrieve the Client connection from the Flask app once it's been initialized.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["2-16"]}-->
<!--SNIPEND-->

A Temporal Client enables you to communicate with the Temporal Cluster.
Communication with a Temporal Cluster includes, but isn't limited to, the following:

- Starting Workflow Executions
- Sending Queries to Workflow Executions
- Getting the results of a Workflow Execution

Now that your connection to the Temporal Server is open, define your first Flask endpoint.

First, build the `/subscribe` endpoint.

In the `run_flask.py` file, define a `/subscribe` endpoint as an asynchronous function, so that users can subscribe to the emails.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["18-35"]}-->
<!--SNIPEND-->

In the `start_subscription()` function, get the Temporal Server connection from the Flask application.
The `WorkflowOptions` object is used to pass the email address given by the user to the Workflow Execution and sets the Workflow Id. This ensures that the email is unique across all Workflows so that the user can't sign up multiple times, only receive the emails they've subscribed to, and when they cancel; they cancel the Workflow run.

With this endpoint in place, you can now send a POST request to `/subscribe` with an email address in the request body to start a new Workflow that sends an email to that address.

But how would you get details about the subscription? Learn to query your Workflow to get back information on the state of things in the next section.

## Add a Query

Now create a method in which a user can get information about their subscription details.
 and add a new method called `details()` to the `SendEmailWorkflow` class and use the `@workflow.query` decorator.

To allow users to retrieve information about their subscription details, add a new method called `details()` to the `SendEmailWorkflow` class in the `workflows.py` file. Decorate this method with `@workflow.query`.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["53-55"]}-->
<!--SNIPEND-->

The email_details object is an instance of `EmailDetails`. 
Queries can be used even if the Workflow is completed, which is useful for when the user unsubscribes but still wants to retrieve information about their subscription.

Queries should never mutate anything in the Workflow.

Now that you've added the ability to Query your Workflow, let's add the ability to Query from our Flask application.

To enable users to query the Workflow from the Flask application, add a new endpoint called `/get_details` to the `run_flask.py` file.

Use the [get_workflow_handle()](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) function to return a Workflow handle by a Workflow Id.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["38-55"]}-->
<!--SNIPEND-->

Using `handle.query()` creates a Handle on the Workflow and calls the Query method on the handle to get the value of the variables.
This function enables you to return all the information about the user's email subscription that's declared in the Workflow.

Now that users can subscribe and view the details of their subscription, you need to provide them with a way to unsubscribe.

## Unsubscribe users with a Workflow Cancellation Request

Users will want to unsubscribe from the email list at some point, so let's give them a way to do that.

With the `run_flask.py` file open, add a new endpoint called `/unsubscribe` to the Flask application.

Temporal allows you to cancel a Workflow by sending a cancellation request to the Workflow Execution.

To send a cancellation notice to an endpoint, use the HTTP `DELETE` method on the `unsubscribe` endpoint to return a [cancel()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel) method on the Workflow's handle.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["58-71"]}-->
<!--SNIPEND-->

The `handle.cancel()` method sends a cancellation request to the Workflow Execution that was started with the `/subscribe` endpoint.

When the Workflow receives the cancellation request, it will cancel the Workflow Execution and return a `CancelledError` to the Workflow Execution, which is handled in our `try/except` block in the `workflows.py` file.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["32-50"]}-->
<!--SNIPEND-->

With this endpoint in place, users can send a `DELETE` request to `/unsubscribe` with an email address in the request body to cancel the Workflow associated with that email address. This allows users to unsubscribe from the email list and prevent any further emails from being sent to them.

Now that you've added the ability to unsubscribe from the email list, test your application code to ensure it works as expected.

## Create an integration test

Integration testing is an essential part of software development that helps ensure that different components of an application work together correctly.

The Temporal Python SDK includes functions that help you test your Workflow Executions.

Workflow testing can be done in an integration test fashion against a [test server](https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#start_local) or from a [given Client](https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#from_client).

In this section, you'll write an integration test using the Temporal Python SDK to test the cancellation of a Workflow. Now, you can add tests to the application to ensure the Cancellation works as expected.

To set up the test environment, create a new Python file called `test_run_worker.py` in the `tests` directory, include the `__init__.py` and the `pytest.ini` files.

```command
touch tests/test_run_worker.py
touch tests/__init__.py
touch tests/pytest.ini
```

The Temporal Python SDK includes functions that help you test your Workflow Executions. In this section, you will import the necessary modules and classes to test the cancellation of a Workflow.

In this code, you are defining two test functions `test_create_email()` and `test_cancel_workflow()` that use the Temporal SDK to create and cancel a Workflow Execution.

<!--SNIPSTART email-subscription-project-python-test_run_worker-->
<!--SNIPEND-->

The `test_create_email()` function creates a Workflow Execution by starting the `SendEmailWorkflow` with some test data. The function then asserts that the status of the Workflow Execution is `RUNNING`.

The `test_cancel_workflow()` function also starts a Workflow Execution, but it then immediately cancels it using the `cancel()` method on the Workflow's handle. It then waits for the Workflow Execution to complete and asserts that the status is `CANCELED`. Finally, the function checks that the Workflow Execution was cancelled due to a `CancelledError`.

Now that you've created a test function for the Workflow Cancellation, run `pytest` to see if that works.

To test the function, run `pytest` from the command line to automatically discover and execute tests.

```output
============================= test session starts ==============================
platform darwin -- Python 3.11.3, pytest-7.2.2, pluggy-1.0.0
rootdir: email-subscription-project-python, configfile: pyproject.toml
plugins: asyncio-0.20.3, anyio-3.6.2
asyncio: mode=Mode.AUTO
collected 2 items

tests/test_run_worker.py::test_create_email
-------------------------------- live log call ---------------------------------
12:01:12 [    INFO] Beginning worker shutdown, will wait 0:00:00 before cancelling activities (_worker.py:425)
PASSED                                                                   [ 50%]
tests/test_run_worker.py::test_cancel_workflow
-------------------------------- live log call ---------------------------------
12:01:23 [    INFO] Beginning worker shutdown, will wait 0:00:00 before cancelling activities (_worker.py:425)
PASSED                                                                   [100%]

============================== 2 passed in 13.24s ==============================
```

You've successfully written, executed, and passed a Cancellation Workflow test, just as you would any other code written in Python.
Temporal's Python SDK provides a number of functions that help you test your Workflow Executions.
By following the best practices for testing your code, you can be confident that your Workflows are reliable and performant.

## Conclusion

This tutorial demonstrates how to build an email subscription web application using Temporal and Python. By leveraging Temporal's Workflows, Activities, and Queries, the tutorial shows how to create a web server that interacts with Temporal to manage the email subscription process.

With this knowledge, you will be able to take on more complex Workflows and Activities to create even stronger applications.
