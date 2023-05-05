---
id: subscription-tutorial
sidebar_position: 3
keywords: [TypeScript, temporal, sdk, tutorial]
tags: [TypeScript, SDK]
last_update:
  date: 2023-03-05
title: Build a subscription workflow with Temporal and TypeScript
description: This tutorial teaches you how to implement an email subscription application with Temporal's Workflows, Activities, and Queries; however, the key learning allows users to subscribe and start their business logic through a web action.
image: /img/temporal-logo-twitter-card.png
---

### Introduction

In this tutorial, you’ll build an email subscription web application using Temporal and TypeScript. You’ll create a web server using [Node.js](https://nodejs.org/en) and [Express](https://expressjs.com/), and you will use Temporal Workflows, Activities, and Queries to build the core of the application. Your web server will handle requests from the end user and interact with a Temporal Workflow to manage the email subscription process. Since you’re building the business logic with Temporal’s Workflows and Activities, you’ll be able to use Temporal to manage each subscription rather than relying on a separate database or task queue. This reduces the complexity of the code you have to write and maintain.

You’ll create an endpoint for users to give their email address, and then create a new Workflow execution using that email address which will simulate sending an email message at certain intervals. The user can check on the status of their subscription, which you’ll handle using a Query, and they can end the subscription at any time by unsubscribing, which you’ll handle by cancelling the Workflow Execution. You can view the user’s entire process through Temporal’s Web UI. For this tutorial, you’ll simulate sending emails, but you can adapt this example to call a live email service in the future.

By the end of this tutorial, you’ll have experience using Temporal to create and manage long-running Workflows within a web application.

You can find the code for this tutorial on GitHub in the [email-subscription-project-ts](https://github.com/temporalio/email-subscription-project-ts) repository.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and TypeScript](/getting_started/typescript/dev_environment/index.md).
- Complete the [Hello World](/getting_started/typescript/hello_world_in_python/index.md) tutorial to ensure you understand the basics of creating Workflows and Activities with Temporal.


## Create a new project

:::info

This is a step by step guide that shows you how to create a project from scratch, and the goal is for you to better understand the structure of a Temporal application by creating the files on your own. 

Many Temporal projects are easier to spin up using the [package initializer](https://docs.temporal.io/typescript/package-initializer#optional-flags) to download a project from our [samples-typescript repository](https://github.com/temporalio/samples-typescript).

:::

To build an app with the Temporal TypeScript SDK, you'll create a new directory and use `npm` to initialize it as a Node.js project. Then you'll add the Temporal SDK packages and other dependencies to your project. 

In a terminal, create a new project directory called `email-subscription-app`:

```command
mkdir email-subscription-app
```

Switch to the new directory:

```command
cd email-subscription-app
```

Create the `package.json` file in the root of your project and add the following code to the file that defines the project, sets up scripts, and defines the dependencies this project requires:

[package.json](https://github.com/temporalio/email-subscription-project-ts/blob/ks/code-for-tutorial/package.json)

```json
{
  "name": "email-subscription-app",
  "version": "1.0.0",

  "scripts": {
    "build": "tsc --build",
    "build.watch": "tsc --build --watch",
    "lint": "eslint .",
    "format": "prettier --write .",
    "start": "ts-node src/worker.ts",
    "start.watch": "nodemon src/worker.ts",
    "workflow": "ts-node src/client.ts",
    "workflow.watch": "nodemon src/client.ts"
  },
  "nodemonConfig": {
    "execMap": {
      "ts": "ts-node"
    },
    "ext": "ts",
    "watch": [
      "src"
    ]
  },
  "dependencies": {
    "@temporalio/activity": "^1.0.0",
    "@temporalio/client": "^1.0.0",
    "@temporalio/worker": "^1.0.0",
    "@temporalio/workflow": "^1.0.0",
    "body-parser": "^1.20.1",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@tsconfig/node16": "^1.0.0",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.14",
    "@types/node": "^16.18.22",
    "@types/uuid": "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-deprecation": "^1.2.1",
    "nodemon": "^2.0.12",
    "prettier": "^2.8.3",
    "ts-node": "^10.8.1",
    "typescript": "^4.4.2"
  }
}
```
You should check out a few parts of the `package.json`, and the first is the `scripts` section. These are the `npm` commands you'll use to build, lint, and start your application code.  

Next, take a look at the packages listed as dependencies. These are the packages that compose the Temporal TypeScript SDK, and each package maps to the four parts of a Temporal application: an Activity, Client, Worker, and Workflow. 

Finally, look through the `devDependencies` section. These are the packages that let you set up a Node.js project with [Nodemon](https://www.npmjs.com/package/nodemon) (a tool that automatically restarts your application when it detects a change in your code), TypeScript, ESLint, and ts-node.

Save the file, then download the dependencies specified in the `package.json` file with the command: 

```command
npm install
```

Downloading the dependencies can take a few minutes to complete. Once the download is done, you will have new a `package-lock.json` file and a `node_modules` directory. 

Your project workspace is configured, so you're ready to create your Temporal Activity and Workflow. You'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities. You define a Workflow by writing a *Workflow Definition* using one of the Temporal SDKs. You can learn more in the [Develop Workflows](https://docs.temporal.io/application-development/foundations?lang=typescript#develop-workflows) section of the Temporal documentation.

To begin your Workflow, create a new subdirectory called `src`:

```command
mkdir src
```

Create the file `workflows.ts` in the `src` directory.

## Develop the Workflow

A Workflow defines a sequence of steps defined by writing code, known as a Workflow Definition, and are carried out by running that code, which results in a Workflow Execution.

To create a new Workflow Definition, create a new file called `workflows.ts`. 

Add the following code to define the Workflow:

<!--SNIPSTART-->
TODO: add the code from the file below using snipsync.

https://github.com/temporalio/email-subscription-project-ts/blob/ks/code-for-tutorial/src/workflows.ts
<!--SNIPEND-->

In this code, the variable `sendEmail` is assigned the value of `proxyActivites`, which is a method from the Temporal TypeScript SDK that lets you configure the Activity with different options. In this example, you have specified that the Start-to-Close Timeout for your Activity will be one minute, meaning that your Activity has one minute to begin before it times out. You also set the maximum number of retries to 3. 

The `subscription` function is the name of your Workflow. This function accepts an argument that is a string (ideally, an email address), and will attempt to run the `sendEmail` Activity. 

The user's email address serves as the Workflow Id, so attempting to subscribe with the same email address twice will result in a `Workflow Execution already started` error and prevent the Workflow Execution from spawning again.

Therefore, only one Workflow Execution per email address can exist within the associated Namespace for the given retention period. This ensures that the user won't receive multiple email subscriptions. This also helps reduce the complexity of the code you have to write and maintain.

With this Workflow Definition in place, you can now develop an Activity to send emails.

## Develop an Activity

Create a new file called `activities.ts` in the `src` directory so you can develop the asynchronous Activity Definition.

 <!--SNIPSTART-->
TODO: add the code from the file below using snipsync.

https://github.com/temporalio/email-subscription-project-ts/blob/ks/code-for-tutorial/src/activities.ts
<!--SNIPEND-->

Each iteration of the Workflow loop will execute this Activity, which simulates sending a message to the user.

Now that the Activity Definition and Workflow Definition have been created, it's time to write the Worker process.

## Create the Worker

Create a new file called `worker.ts` and develop the Worker process to execute your Workflow and Activity Definitions.

<!--SNIPSTART-->
TODO: add the code from the file below using snipsync.

https://github.com/temporalio/email-subscription-project-ts/blob/main/src/worker.ts

<!--SNIPEND-->

Now that you've written the logic to execute the Workflow and Activity Definitions, it is time to build the gateway.

## Build the web server

The web server is used to handle requests.
This tutorial uses Node.js and Express to create `subscribe`, `details`, and `unsubscribe` routes which trigger the Workflow and Activities. 

### Global Client

Register the Temporal Client function to run before the first request to this instance of the application.

Create a new file called `client.ts` to develop your endpoints.


Import your libraries and use the `connect_temporal()` function on the Flask app to connect to the Temporal Server.
The `get_client()` function is used to retrieve the Client connection from the Flask app once it's been initialized.

<!--SNIPSTART-->
TODO: add lines 1-15 using snipsync. 

https://github.com/temporalio/email-subscription-project-ts/blob/ks/code-for-tutorial/src/client.ts
<!--SNIPEND-->

A Temporal Client enables you to communicate with the Temporal Cluster.
Communication with a Temporal Cluster includes, but isn't limited to, the following:

- Starting Workflow Executions
- Sending Queries to Workflow Executions
- Getting the results of a Workflow Execution

Now that your connection to the Temporal Server is open, define your first Flask endpoint.

First, build the `/subscribe` endpoint.

In the `client` file, define a `/subscribe` endpoint as an asynchronous function, so that users can subscribe to the emails.

<!--SNIPSTART-->
TODO: add lines for the /subscribe endpoint using snipsync. 
<!--SNIPEND-->

In the `try` block, you start the `subscription` Workflow and set the name of the Task Queue, set the WorkflowId as the email address given by the user, and you specify the argument that will be passed to the `sendEmail` Activity. 

With this endpoint in place, you can now send a POST request to `/subscribe` with an email address in the request body to start a new Workflow that sends an email to that address.

But how would you get details about the subscription? Learn to query your Workflow to get back information on the state of things in the next section.

TODO: Update the rest of this tutorial 

## Add a Query

Now create a method in which a user can get information about their subscription details.
 and add a new method called `details()` to the `SendEmailWorkflow` class and use the `@workflow.query` decorator.

To allow users to retrieve information about their subscription details, add a new method called `details()` to the `SendEmailWorkflow` class in the `workflows.py` file. Decorate this method with `@workflow.query`.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["53-55"]}-->
[workflows.py](https://github.com/temporalio/email-subscription-project-python/blob/master/workflows.py)
```py
// ...
    @workflow.query
    def details(self) -> EmailDetails:
        return self.email_details
```
<!--SNIPEND-->

The email_details object is an instance of `EmailDetails`. 
Queries can be used even if the Workflow is completed, which is useful for when the user unsubscribes but still wants to retrieve information about their subscription.

Queries should never mutate anything in the Workflow.

Now that you've added the ability to Query your Workflow, let's add the ability to Query from our Flask application.

To enable users to query the Workflow from the Flask application, add a new endpoint called `/get_details` to the `run_flask.py` file.

Use the [get_workflow_handle()](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) function to return a Workflow handle by a Workflow Id.

<!--SNIPSTART email-subscription-project-python-run_flask {"selectedLines": ["38-55"]}-->
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
@app.route("/get_details", methods=["GET"])
async def get_query():
    client: Client = get_client()
    email_id = request.args.get("email")
    handle = client.get_workflow_handle(email_id)
    results = await handle.query(SendEmailWorkflow.details)

    message =  jsonify(
        {
            "email": results.email,
            "message": results.message,
            "subscribed": results.subscribed,
            "numberOfEmailsSent": results.count
        }
    )

    response = make_response(message, 200)
    return response
```
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
[run_flask.py](https://github.com/temporalio/email-subscription-project-python/blob/master/run_flask.py)
```py
// ...
@app.route("/unsubscribe", methods=["DELETE"])
async def end_subscription():
    client = get_client()
    email_id: str = str(request.json.get("email"))
    handle = client.get_workflow_handle(
        email_id,
    )
    await handle.cancel()
    message = jsonify({"message": "Requesting cancellation"})

    # Return 202 because this is a request to cancel and the API has accepted
    # the request but has not processed yet.
    response = make_response(message, 202)
    return response
```
<!--SNIPEND-->

The `handle.cancel()` method sends a cancellation request to the Workflow Execution that was started with the `/subscribe` endpoint.

When the Workflow receives the cancellation request, it will cancel the Workflow Execution and return a `CancelledError` to the Workflow Execution, which is handled in our `try/except` block in the `workflows.py` file.

<!--SNIPSTART email-subscription-project-python-workflows {"selectedLines": ["32-50"]}-->
[workflows.py](https://github.com/temporalio/email-subscription-project-python/blob/master/workflows.py)
```py
// ...
            try:
                await workflow.start_activity(
                    send_email,
                    self.email_details,
                    start_to_close_timeout=timedelta(seconds=10),
                )
                await asyncio.sleep(duration)

            except asyncio.CancelledError as err:
                # Cancelled by the user. Send them a goodbye message.
                self.email_details.subscribed = False
                self.email_details.message = "Sorry to see you go"
                await workflow.start_activity(
                    send_email,
                    self.email_details,
                    start_to_close_timeout=timedelta(seconds=10),
                )
                # raise error so workflow shows as cancelled.
                raise err
```
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
[tests/test_run_worker.py](https://github.com/temporalio/email-subscription-project-python/blob/master/tests/test_run_worker.py)
```py

import pytest
import asyncio

from temporalio.worker import Worker
from temporalio.testing import WorkflowEnvironment
from temporalio.exceptions import CancelledError
from temporalio.client import WorkflowFailureError, WorkflowExecutionStatus

from shared_objects import EmailDetails
from activities import send_email
from run_worker import SendEmailWorkflow
#

@pytest.mark.asyncio
async def test_create_email() -> None:
    task_queue_name: str = "subscription"

    async with await WorkflowEnvironment.start_local() as env:
        data: EmailDetails = EmailDetails(email="test@example.com", message="Here's your message!")

        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[SendEmailWorkflow],
            activities=[send_email],
        ):

            handle = await env.client.start_workflow(
                SendEmailWorkflow.run,
                data,
                id=data.email,
                task_queue=task_queue_name,
            )

            assert WorkflowExecutionStatus.RUNNING == (await handle.describe()).status


@pytest.mark.asyncio
async def test_cancel_workflow() -> None:
    task_queue_name: str = "email_subscription"

    async with await WorkflowEnvironment.start_local() as env:
        data: EmailDetails = EmailDetails(email="test@example.com", message="Here's your message!")

        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[SendEmailWorkflow],
            activities=[send_email],
        ):

            handle = await env.client.start_workflow(
                SendEmailWorkflow.run,
                data,
                id=data.email,
                task_queue=task_queue_name,
            )

            await handle.cancel()

            # Cancelling a workflow requests cancellation. Need to wait for the
            # workflow to complete.
            with pytest.raises(WorkflowFailureError) as err:
                await handle.result()

            assert isinstance(err.value.cause, CancelledError)

            assert WorkflowExecutionStatus.CANCELED == (await handle.describe()).status
```
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