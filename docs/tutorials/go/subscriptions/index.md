---
title: "Build an Email Subscription App with Temporal and Go"
sidebar_position: 1
keywords: [Go,tutorial,temporal,workflows,SDK,subscription]
description: "Tutorial for building a Subscription application with Temporal and Go."
last_update:
  date: 2023-04-13
image: /img/temporal-logo-twitter-card.png
---

## Introduction

Creating reliable applications can be a complex process, often plagued by volatility that seems beyond your control.

In this tutorial, you'll be writing a [Workflow](https://docs.temporal.io/workflows) for a Subscription application.
The application will send emails at specified time intervals until the subscription's limit has been reached.

The user will be able to:

1. Send a "welcome" email to the user upon signup.
2. Start the billing process and send subsequent subscription emails.
3. Look up the customer's information regarding:
    - Amount Charged
    - Period number
4. End the subscription when:
    - The maximum amount of billing periods has been reached.
    - The user has chosen to unsubscribe.

This tutorial focuses on implementing an email subscription application with Temporal’s [Workflows](https://docs.temporal.io/workflows), [Activities](https://docs.temporal.io/activities), and [Queries](https://docs.temporal.io/workflows#query).
This is achieved by breaking down project requirements into Temporal logic:

- A [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition) that contains the logic needed to start and end the subscription. [Workflow Executions](https://docs.temporal.io/workflows#workflow-execution) are created per email address.
- [Activities](https://docs.temporal.io/activities) that are used to send emails to the subscriber defined in the Workflow.
- A [Query](https://docs.temporal.io/workflows#query) to retrieve the status of an ongoing subscription. This information will include the email address of the user.
- A [Cancellation Handler](https://docs.temporal.io/activities#cancellation) for users to opt out of the subscription early.


:::tip Skip ahead

To skip straight to a fully working example, check out the [Subscription Workflow in the Go repository](https://github.com/temporalio/subscription-workflow-go).

:::

## Prerequisites 

Before starting this tutorial, make sure that you've set up:
- [Temporal Server](https://docs.temporal.io/clusters#temporal-server)
- [Temporal Go SDK](https://pkg.go.dev/go.temporal.io/sdk)
- [Go 1.17+](https://go.dev/dl/)

This tutorial will be mocking actual emails and billing, so setup of additional APIs won't be necessary.

## Create the project

In your code editor, create a new project.

Run `go mod init` to create a Go module file.

Run `go mod tidy` to update the Go module file.

:::note
`go mod tidy` will need to be run periodically as new imports are added to the application.
:::

## Develop the Workflow

A Workflow starts with a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition), a sequence of steps defined in code that are carried out in a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).
Before the Workflow Definition can be written, you'll need to identify and define the data objects to be used in our application.

### Data objects

In Go, data objects are known as **structs**—variable types that contain multiple variables within it. 
You can use structs to organize our information and optimize updates to the Workflow.

Start by creating a file called `subscribe.go`.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["1-3"]}-->
<!--SNIPEND-->

Any structs created in this file can be used throughout the app by defining it in the package `subscribe_emails`.

Next, create a struct for `Subscription`. 
This data type will contain the user's email information, as well as the progress of their subscription.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["19-23"]}-->
<!--SNIPEND-->

As you can see, `Subscription` contains instances of two other data types, which will be defined as well.
Let's start with `EmailInfo`.
This struct contains the user's email address, along with the message they'll be sent.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["5-9"]}-->
<!--SNIPEND-->

The other data type you'll create create is `Periods`. 
This struct contains information about how long the Subscription lasts, along with how much is charged per billing period.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["11-17"]}-->
<!--SNIPEND-->

Now that our data types have been defined, you can now define the Workflow.

### Writing the Workflow Definition

Create a new file called `workflow.go`.
This will soon contain the logic needed to facilitate the Subscription.

Define your variables and initiate a logger.
Make sure to establish your Workflow with Activity Options.

<!--SNIPSTART subscription-workflow-go-workflow {"selectedLines": ["1-10", "11-39"]}-->
<!--SNIPEND-->

Next, create a function to handle a [cancellation](https://docs.temporal.io/activities#cancellation).

<!--SNIPSTART subscription-workflow-go-workflow {"selectedLines": ["41-72"]}-->
<!--SNIPEND-->

Finish off the Workflow Definition with a for-loop to send Subscription emails until the `MaxBillingPeriods` amount is reached.

<!--SNIPSTART subscription-workflow-go-workflow {"selectedLines": ["74-88", 90-118]}-->
<!--SNIPEND-->

## Develop the Activities

An Activity is a function designed to perform a specific, well-defined action over a period of time.
Activities are optimal for interacting with APIs. 
The [Activity Definition](https://docs.temporal.io/activities#activity-definition) in this tutorial will mock this behavior.

Create two Activity functions in a new file: `activities.go`.
Each Activity will simply log what they are "doing" to the console.

<!--SNIPSTART subscription-workflow-go-activities {"selectedLines": ["1-11", "12-21"]}-->
<!--SNIPEND-->

These Activities can be easily customized to call an Email API to send actual emails.

## Build the Worker

In order to execute the code defined so far, you'll need to create a [Worker Process](https://docs.temporal.io/workers#worker-process).

Create a `worker` folder, and create the `main.go` file for the [Worker program](https://docs.temporal.io/workers#worker-program).

<!--SNIPSTART subscription-workflow-go-worker-main {"selectedLines": ["1-9"]}-->
<!--SNIPEND-->

Create the [Client](https://docs.temporal.io/temporal#temporal-client) and the [Worker Entity](https://docs.temporal.io/workers#worker-entity).

<!--SNIPSTART subscription-workflow-go-worker-main {"selectedLines": ["11-22"]}-->
<!--SNIPEND-->

Register the Workflow and Activities to the Worker.

<!--SNIPSTART subscription-workflow-go-worker-main {"selectedLines": ["23-25"]}-->
<!--SNIPEND-->

Finally, get the Worker to listen to the [Task Queue](https://docs.temporal.io/tasks#task-queue).

<!--SNIPSTART subscription-workflow-go-worker-main {"selectedLines": ["27-33"]}-->
<!--SNIPEND-->

## Build the gateway

The gateway allows the user to communicate with the Temporal Application.
It also serves as the entry point for starting the Workflow Execution.

There are several handlers that make the Subscription possible. These handlers allow us to subscribe, unsubscribe, and get details about the Workflow.
An index handler exists as well.

To begin, create a `gateway` folder with the file `main.go`.
Create a Client in `main.go`.

<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["1-12", "14-15", "142-163"]}-->
<!--SNIPEND-->

Create an `index` handler.
When viewed in the browser, it'll create an input field to collect the email needed to kick off the Workflow.

<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["17-20"]}-->
<!--SNIPEND-->

### Subscribe handler

The `/subscribe` handler starts the Workflow Execution for the given email address.
The email is used to generate a unique [Workflow ID](https://docs.temporal.io/workflows#workflow-id), meaning only one Workflow can be executed per email address.

<!-- TODO: mention that ID can be reused after a Workflow ends or is terminated. -->

Create a parser for the handler.

<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["22-28"]}-->
<!--SNIPEND-->

Get the address from the form, and use it to configure your Workflow Options.

<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["30-42"]}-->
<!--SNIPEND-->

Define and execute the Workflow within the handler.
<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["44-64"]}-->
<!--SNIPEND-->

### Unsubscribe handler

The `/unsubscribe` handler cancels the Workflow with a given email in its Workflow ID.

For this app, you'll be making use of a switch case to handle what happens when the endpoint gets a response, and when it posts new information to the Workflow Execution.

Start by creating a new function. Define the two cases.
<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["68-75"]}-->
<!--SNIPEND-->

Canceling the Workflow will happen in "POST".
After the Workflow is found for the given email address, let the user know that their subscription has ended.

<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["77-106"]}-->
<!--SNIPEND-->

### Build the `getdetails` endpoint

Like `\unsubscribe`, the `\getdetails` handler incorporates a switch case for getting an email address and receiving information from a Workflow Execution.

<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["110-113"]}-->
<!--SNIPEND-->

### Build the `showdetails` endpoint

The `\showdetails` handler uses the information gathered from `\getdetails` to retrieve and print subscription information.

Define the variables needed to Query the Workflow, and then handle the result. 

<!--SNIPSTART subscription-workflow-go-worker-gateway-main {"selectedLines": ["115-140"]}-->
<!--SNIPEND-->

## Conclusion

The Temporal Go SDK provides the means to build powerful, long-lasting applications. 
With a scenario as scalable as a subscription service, Temporal shows what it can do with the help of Workflows, Activities, and Queries.