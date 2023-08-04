---
title: "Build an Email Subscription App with Temporal and Go"
sidebar_position: 3
keywords: [Go,tutorial,temporal,workflows,SDK,subscription]
description: Build a subscription application with Temporal and Go.
last_update:
  date: 2023-06-30
image: /img/temporal-logo-twitter-card.png
---

### Introduction

In this tutorial, you'll build an email subscription application using Temporal and Go.
You'll also create a web server to handle interactions between the user and the application.

The application will break down the business logic into the following Temporal components:

- A [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition) with the logic for running a subscription. The application creates one [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution) per email address.
- An [Activity](https://docs.temporal.io/activities) that mocks sending emails to the subscriber defined in the Workflow.
- A [Query](https://docs.temporal.io/workflows#query) that retrieves Workflow information.
- A [Cancellation Handler](https://docs.temporal.io/activities#cancellation) that allows customers to unsubscribe.

This logical breakdown lets Temporal manage each subscription rather than relying on a separate database or Task Queue.
This reduces the complexity of the code.

To interact with the Temporal Workflow, you'll also create several endpoints to handle requests from the end user.
These requests include:

- Starting the subscription Workflow with a valid email address.
- Querying for subscription information.
- Canceling the subscription.

The process of a subscription Workflow will be viewable through the Temporal Web UI.
Each endpoint will also have a corresponding web page, which is necessary for viewing subscription information.

By the end of this tutorial, you'll understand how to use Temporal for creating and managing long-running Workflows.

Check out the [subscription Workflow on GitHub](/getting_started/go/dev_environment/index.md) for a full view of this tutorial's code.

## Prerequisites 

Before starting this tutorial:

- [Set up a local development environment for Temporal and Go](https://learn.temporal.io/getting_started/go/dev_environment/).
- Complete the [Hello World](https://learn.temporal.io/getting_started/go/hello_world_in_go/).

In addition, install the latest versions of:
- [Temporal Server](https://docs.temporal.io/clusters#temporal-server)
- [Temporal Go SDK](https://pkg.go.dev/go.temporal.io/sdk)
- [Go](https://go.dev/dl/)

## Create the project

Create a new directory for the project called `email-subscription-project`.

Run `go mod init subscribeemail` to create a Go module file in the project directory.

Run `go mod tidy` to update the Go module file.

:::note

Run `go mod tidy` again after adding new imports to the application.

:::

After you create the project, start defining the project's Temporal components.

## Develop the Workflow

A Workflow starts with a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition), which is a sequence of steps defined in code and carried out in a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).
Before writing the Workflow Definition, define the data object that your application will use.

### Data objects

Go uses **structs** as data objects. Structs are data types that contain multiple fields within it. 
Use structs to organize each subscription's user and duration information.
This practice ensures backward compatibility with Workflows.

Start by creating a file called `subscribe.go`.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["1"]}-->
<!--SNIPEND-->

Next, create a struct for the `EmailDetails` data object. 
This data type holds the subscriber's email information and details about the subscription, such as:

 - `EmailAddress`: the email address of the subscriber
 - `Message`: the content of the email sent to the subscriber
 - `IsSubscribed`: a boolean to track subscription status
 - `SubscriptionPeriodCount`: an integer to track the number of emails sent on the Workflow

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["6-11"]}-->
<!--SNIPEND-->

Define your constants in this file as well.
For this tutorial, you'll define the application's access port as a constant, along with the Task Queue name.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["3-4"]}-->
<!--SNIPEND-->

After defining the data types and constants, you'll develop the Workflow Definition.

### Write the Workflow Definition

A Workflow Definition has a sequence of steps for the application to run through Workflow Executions.
The subscription Workflow will include the logic needed to successfully start, run, and cancel individual subscriptions.

Create a new file called `workflow.go`.
Import libraries and create the function `SubscriptionWorkflow()`.

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["2-13"]}-->
<!--SNIPEND-->

Set a logger and establish the `duration` that the Workflow sleeps between emails.
This can be any span of time from seconds to years.
For the purpose of this tutorial, set it to 12 seconds.

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["14-18"]}-->
<!--SNIPEND-->

Add a Query Handler to receive detail requests and return Workflow information.

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["19-24"]}-->
<!--SNIPEND-->

Set the Workflow's Activity Options.

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["26-30"]}-->
<!--SNIPEND-->

Next, create a function to handle [cancellations](https://docs.temporal.io/activities#cancellation).

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["33-53"]}-->
<!--SNIPEND-->

As you can see, every Activity Execution involves defining the update for the Workflow Execution.
Since your Workflow must welcome new subscribers, you'll define an update for a newly started Workflow as well.

Define the update in the variable `data`, signifying the data passed from the Activity to the Workflow.
Execute the Activity for the first email.

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["57-69"]}-->
<!--SNIPEND-->

Finish off the Workflow Definition with a loop to send subscription emails until the user cancels their subscription.

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["72-93"]}-->
<!--SNIPEND-->

Your app still has a way to go before it's ready to run.
In the next section, you'll define the Activity to send subscription emails.

## Develop the Activities

Activities are optimal for interacting with APIs. 
The [Activity Definition](https://docs.temporal.io/activities#activity-definition) in this tutorial mocks this behavior.

Create a new file called `activities.go`, and define a single `SendEmail()` function.

The Activity logs what it's "doing" to the console, and returns a status message that's viewable on the Web UI.

<!--SNIPSTART subscription-workflow-go-activities-->
<!--SNIPEND-->

The Activity won't run if it's not registered to a Worker.
Now it's time to build the Worker Process.

## Build the Worker

To execute the code defined so far, you must create a [Worker Process](https://docs.temporal.io/workers#worker-process).

Create a `worker` folder, and create the `main.go` file for the [Worker program](https://docs.temporal.io/workers#worker-program).

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["1-11"]}-->
<!--SNIPEND-->

Create the [Client](https://docs.temporal.io/temporal#temporal-client) and the [Worker Entity](https://docs.temporal.io/workers#worker-entity).

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["11-22"]}-->
<!--SNIPEND-->

Register the Workflow and Activity to the Worker.

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["23-25"]}-->
<!--SNIPEND-->

Finally, tell the Worker to listen to the [Task Queue](https://docs.temporal.io/tasks#task-queue).

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["27-33"]}-->
<!--SNIPEND-->

All the application components are there, but they aren't running yet. 
Build a web server with [Go's HTTP library](https://pkg.go.dev/net/http) to interact with the app.

## Build the web server

The web server lets the user to communicate with the Temporal Application, and also serves as the entry point for starting the Workflow Execution.

There are several handlers that make the subscription possible. These handlers let you to subscribe, unsubscribe, and get details about the Workflow with a Query.

Create a `gateway` folder with the file `main.go`.
Create a Client in `main.go`.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["1-12", "14-15", "142-163"]}-->
<!--SNIPEND-->

Create an `index` handler.
This handler creates an input field to collect the email through an updated `EmailDetails` variable.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["17-21"]}-->
<!--SNIPEND-->

Now, when you access the application at `localhost:4000`, there will be an input field that starts the Workflow Execution for the provided email address.
The logic to start the Workflow will exist in the `/subscribe` handler, which you'll build next.

### Build the `/subscribe` handler

The `/subscribe` handler starts the Workflow Execution for the given email address.
The email generates a unique [Workflow Id](https://docs.temporal.io/workflows#workflow-id), meaning only one Workflow runs per email address.
However, once a Workflow cancels or completes, the email address becomes reusable.

Create a parser for the handler.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["23-29"]}-->
<!--SNIPEND-->

Get the address from the form, and configure your Workflow Options.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["30-45"]}-->
<!--SNIPEND-->

Define and execute the Workflow within the handler.
<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["45-65"]}-->
<!--SNIPEND-->

You now have the capability to start a Workflow Execution, but nothing to perform cancellations with.
The `/unsubscribe` handler addresses this issue.

### Build the `/unsubscribe` handler

The `/unsubscribe` handler cancels the Workflow with a given email in its Workflow Id.

For this app, you'll use a switch case to handle the response and give new information to the Workflow Execution.

Create a new function. 
Define the two cases.
<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["68-77"]}-->
<!--SNIPEND-->

Canceling the Workflow will happen in your "DELETE" case.
After cancelling the Workflow for the given email address, tell the user that their subscription has ended.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["78-106"]}-->
<!--SNIPEND-->

Users can now opt out of their subscriptions early.
However, there still exists the need to keep an eye on ongoing subscriptions.

For that, you'll build the Query handler.

## Build the Query handler

Emails are great for showing the progress of the subscription, but what if you need more subscription details?
For this, you'll build a Query to get details about the Workflow Execution.
This Query has two endpoints: `/getdetails` and `/showdetails`.

### Build the `/getdetails` endpoint

Like `/unsubscribe`, the `/getdetails` handler incorporates a switch case for getting an email address and receiving information from a Workflow Execution.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["108-111"]}-->
<!--SNIPEND-->

With this, you've built the first part of the Query handler.
To view the details retrieved by it, you'll next build a second endpoint.

### Build the `/showdetails` endpoint

The `/showdetails` handler uses the information gathered from `/getdetails` to retrieve and print subscription information.

Define the variables needed to Query the Workflow, and then handle the result. 

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["114-139"]}-->
<!--SNIPEND-->

## Create integration tests

Integration testing is essential to software development.
Testing ensures that all the components of an application are working as expected.

The Temporal Go SDK includes functions to help test your Workflow Executions.
Using this, along with the [Testify module](https://github.com/stretchr/testify), lets you to test for cancelled Workflow Executions.

Create a new file called `subscription_test.go`.
Import the Temporal Go SDK Test Suite, Go's testing and time libraries, and the `require` module from Testify.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["2-7"]}-->
<!--SNIPEND-->

Create a function called `Test_CanceledSubscriptionWorkflow`, along with instances of TestSuite and the environment.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["9-13"]}-->
<!--SNIPEND-->

Create a subscription struct called `testDetails`.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["13-18"]}-->
<!--SNIPEND-->

Register the Workflow and Activities.
<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["20-22"]}-->
<!--SNIPEND-->

Finally, execute the Workflow.
Follow up with a cancellation request.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["24-28"]}-->
<!--SNIPEND-->

## Conclusion

This tutorial creates a web server that interacts with Temporal to manage an email subscription process, that users can subscribe, unsubscribe, and lookup the status of their subscription details with.

With this knowledge, you'll be able to use more complex Workflows and Activities to create even stronger applications.
