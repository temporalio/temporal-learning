---
title: "Build an Email Subscription App with Temporal and Go"
sidebar_position: 1
keywords: [Go,tutorial,temporal,workflows,SDK,subscription]
description: "Tutorial for building a Subscription application with Temporal and Go."
last_update:
  date: 2023-05-03
image: /img/temporal-logo-twitter-card.png
---

## Introduction

In this tutorial, you'll write a [Workflow](https://docs.temporal.io/workflows) for a Subscription application.
The application sends emails at specified time intervals until the subscription's limit has been reached.

The application will do the following:

1. Send a "welcome" email to the user upon signup.
2. Start the billing process and send subsequent subscription emails.
3. Look up the user's email address and current place in the subscription.
4. End the subscription when:
    - The end of the subscription period has been reached.
    - The user has chosen to unsubscribe.

This is achieved by breaking down project requirements into Temporal logic:

- A [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition) that contains the logic needed to start and end the subscription. [Workflow Executions](https://docs.temporal.io/workflows#workflow-execution) are created per email address.
- [Activities](https://docs.temporal.io/activities) that are used to send emails to the subscriber defined in the Workflow.
- A [Query](https://docs.temporal.io/workflows#query) to retrieve the user's email address and the status of their subscription.
- A [Cancellation Handler](https://docs.temporal.io/activities#cancellation) for users to opt out of the subscription early.

Since the business logic is handled in Temporal's Workflow and Activities, Temporal manages each subscription rather than relying on a separate database or Task Queue.
This reduces the complexity of the code you write and maintain.

Ultimately, you'll create a web server to handle requests from the end user and interact with the Temporal Workflow to manage the email subscription process.
All Workflow Executions begin with entry of a valid email address on the sign-up page, and simulate sending emails until the subscription ends.
The process is viewed through the Temporal Web UI.

By the end of this tutorial, you'll understand how to use Temporal for creating and managing long-running Workflows.

Check out the [Subscription Workflow in the Go repository](https://github.com/temporalio/subscription-workflow-go) for a full view of all the tutorial's code.

## Prerequisites 

Before starting this tutorial:

- [Set up a local development environment for developing Temporal Applications using the Go programming language](https://learn.temporal.io/getting_started/go/dev_environment/)
- Follow the tutorial [Build your first Temporal Application in Go](https://learn.temporal.io/getting_started/go/hello_world_in_go/).

- [Temporal Server](https://docs.temporal.io/clusters#temporal-server)
- [Temporal Go SDK](https://pkg.go.dev/go.temporal.io/sdk)
- [Go 1.17+](https://go.dev/dl/)

This tutorial mocks actual emails and billing. 
Configuring additional APIs won't be necessary.

## Create the project

Run `go mod init [PATH]` to create a Go module file.

Run `go mod tidy` to update the Go module file.

:::note

Run `go mod tidy` again after adding new imports to the application.

:::

## Develop the Workflow

A Workflow starts with a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition), a sequence of steps defined in code that are carried out in a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).
Before writing the Workflow Definition, identify and define the data objects to be used in our application.

## Data objects

In Go, data objects are known as **structs**—types that contain multiple fields within it. 
Use structs organize your information.

Start by creating a file called `subscribe.go`.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["1-3"]}-->
[subscribe.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscribe.go)
```go
package subscribe_emails

import "time"
```
<!--SNIPEND-->

Next, create a struct for `Subscription`. 
This data type contains the user's email information, as well as the subscription progress.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["12-17"]}-->
[subscribe.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscribe.go)
```go
// ...
type Subscription struct {
	EmailInfo    EmailInfo
	SubscriptionPeriod time.Duration
	MaxSubscriptionPeriods int
}
```
<!--SNIPEND-->

`Subscription` contains instances of two other data types that have yet to be defined.
Let's start with `EmailInfo`.
This struct contains the user's email address, along with the message they'll be sent.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["6-10"]}-->
[subscribe.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscribe.go)
```go
// ...
type EmailInfo struct {
	EmailAddress string
	Mail string
}

```
<!--SNIPEND-->

The other data type you'll create is `Periods`. 
This struct contains information about how long the Subscription lasts.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["11-16"]}-->
[subscribe.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscribe.go)
```go
// ...
// Subscription is the user email and duration information.
type Subscription struct {
	EmailInfo    EmailInfo
	SubscriptionPeriod time.Duration
	MaxSubscriptionPeriods int
}
```
<!--SNIPEND-->

Now that you've defined your data types, you can define the Workflow.

## Writing the Workflow Definition

Create a new file called `workflow.go`.
This will soon contain the logic needed to facilitate the Subscription.

Define your variables and initiate a logger.
Make sure to establish your Workflow with Activity Options.

<!--SNIPSTART subscription-workflow-go-workflow {"selectedLines": ["1-10", "11-39"]}-->
[workflow.go](https://github.com/temporalio/subscription-workflow-go/blob/master/workflow.go)
```go
package subscribe_emails

import (
	"errors"
	"strconv"
	"time"

	"go.temporal.io/sdk/workflow"
)

// ...
// Workflow definition
func SubscriptionWorkflow(ctx workflow.Context, subscription Subscription) error {
	// declare variables, duration, and logger
	var activities *Activities
	subscriptionPeriodNum := 0
	// duration can be set up to a month.
	duration := time.Minute

	logger := workflow.GetLogger(ctx)
	logger.Info("Subscription created for " + subscription.EmailInfo.EmailAddress)
	// Query result to be returned
	var queryResult string
	// Query handler
	e := workflow.SetQueryHandler(ctx, "GetDetails", func(input []byte) (string, error) {
		queryResult = subscription.EmailInfo.EmailAddress + " is on billing period " + strconv.Itoa(subscriptionPeriodNum) + " out of " + strconv.Itoa(subscription.MaxSubscriptionPeriods)
 		return queryResult, nil
	})
	if e != nil {
		logger.Info("SetQueryHandler failed: " + e.Error())
		return e 
	}
	// variable for Activity Options. Timeout can be set to a longer timespan (such as a month)
	ao := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Minute,
		WaitForCancellation: true,
	}

	ctx = workflow.WithActivityOptions(ctx, ao)

```
<!--SNIPEND-->

Next, create a function to handle a [cancellation](https://docs.temporal.io/activities#cancellation).

<!--SNIPSTART subscription-workflow-go-workflow {"selectedLines": ["41-72"]}-->
[workflow.go](https://github.com/temporalio/subscription-workflow-go/blob/master/workflow.go)
```go
// ...
	defer func() {
		if errors.Is(ctx.Err(), workflow.ErrCanceled) {
			newCtx, _ := workflow.NewDisconnectedContext(ctx)
			data := EmailInfo {
				EmailAddress: subscription.EmailInfo.EmailAddress,
				Mail:         "Oh my! Looks like your subscription has been canceled!",
			}
			// send cancellation email
			err := workflow.ExecuteActivity(newCtx, activities.SendCancellationEmail, data)
			if err != nil {
				logger.Error("Failed to send cancel email", "Error", e)
			} else {
				// Cancellation received, which will trigger an unsubscribe email.
				logger.Info("Sending cancellation email")
			}
			return
		}

		newCtx, _ := workflow.NewDisconnectedContext(ctx)
		// information for the newly-ended subscription email
		data := EmailInfo {
				EmailAddress: subscription.EmailInfo.EmailAddress,
				Mail: "You have been unsubscribed from the Subscription Workflow. Good bye.",
		}
		logger.Info("Sending unsubscribe email to " + subscription.EmailInfo.EmailAddress)
		// send the cancelled subscription email
		err := workflow.ExecuteActivity(newCtx, activities.SendSubscriptionEndedEmail, data).Get(newCtx, nil)

		if err != nil {
			logger.Error("Unable to send unsubscribe message", "Error", err)
		}
	}()
```
<!--SNIPEND-->

Finish off the Workflow Definition with a for-loop to send Subscription emails until the `MaxBillingPeriods` amount is reached.

<!--SNIPSTART subscription-workflow-go-workflow {"selectedLines": ["74-88", "90-118"]}-->
[workflow.go](https://github.com/temporalio/subscription-workflow-go/blob/master/workflow.go)
```go
// ...
	logger.Info("Sending welcome email to " + subscription.EmailInfo.EmailAddress)

	data := EmailInfo {
		EmailAddress: subscription.EmailInfo.EmailAddress,
		Mail:         "Welcome! Looks like you've been signed up!",
	}
			
	// send welcome email, increment billing period
	err := workflow.ExecuteActivity(ctx, activities.SendWelcomeEmail, data).Get(ctx, nil)

	if err != nil {
		logger.Error("Failed to send welcome email", "Error", err)
	} else {
		subscriptionPeriodNum++
	}
// ...
	// start subscription period. execute until MaxBillingPeriods is reached
	for (subscriptionPeriodNum < subscription.MaxSubscriptionPeriods) {
		data := EmailInfo{
				EmailAddress: subscription.EmailInfo.EmailAddress,
				Mail:         "This is yet another email in the Subscription Workflow.",
		}

		err = workflow.ExecuteActivity(ctx, activities.SendSubscriptionEmail, data).Get(ctx, nil)

		if err != nil {
			logger.Error("Failed to send email ", "Error", err)
		} else {
			logger.Info("Sent content email to " + subscription.EmailInfo.EmailAddress)
			// increment billing period for successful email
			subscriptionPeriodNum++
			// Sleep the Workflow until the next subscription email needs to be sent.
			// This can be set to sleep every month between emails.
			workflow.Sleep(ctx, duration)
		}
		// return any errors that may have occurred.
		return err
	}
	return err
}
```
<!--SNIPEND-->

Your app still has a way to go before it's ready to run.
In the next section, you'll define the Activities that send the subscription emails.

## Develop the Activities

Activities are optimal for interacting with APIs. 
The [Activity Definition](https://docs.temporal.io/activities#activity-definition) in this tutorial mocks this behavior.

Create four Activity functions in a new file: `activities.go`.
Label the Activities as follows:
- `SendWelcomeEmail`
- `SendCancellationEmail`
- `SendSubscriptionEndedEmail`
- `SendSubscriptionEmail`

Each Activity logs what they are "doing" to the console.

<!--SNIPSTART subscription-workflow-go-activities-->
[activities.go](https://github.com/temporalio/subscription-workflow-go/blob/master/activities.go)
```go
package subscribe_emails

import (
	"context"

	"go.temporal.io/sdk/activity"
)

type Activities struct {

}
// email activities
func (a *Activities) SendWelcomeEmail(ctx context.Context, emailInfo EmailInfo) (string, error) {
	activity.GetLogger(ctx).Info("sending welcome email to customer", emailInfo.EmailAddress)
	return "Sending welcome email completed for " + emailInfo.EmailAddress, nil
}

func (a *Activities) SendCancellationEmail(ctx context.Context, emailInfo EmailInfo) (string, error) {
	activity.GetLogger(ctx).Info("sending cancellation email during active subscription to: ", emailInfo.EmailAddress)
	return "Sending cancellation email during active subscription completed for: " + emailInfo.EmailAddress, nil
}

func (a *Activities) SendSubscriptionEndedEmail(ctx context.Context, emailInfo EmailInfo) (string, error) {
	activity.GetLogger(ctx).Info("sending subscription over email to: ", emailInfo.EmailAddress)
	return "Sending subscription over email completed for: " + emailInfo.EmailAddress, nil
}

func (a *Activities) SendSubscriptionEmail(ctx context.Context, emailInfo EmailInfo) (string, error) {
	activity.GetLogger(ctx).Info("sending subscription email to: ", emailInfo.EmailAddress)
	return "Sending subscription email for: " + emailInfo.EmailAddress, nil
}
```
<!--SNIPEND-->

These Activities can be customized to call an Email API to send actual emails.
Of course, the Activities won't run if they're not registered to a Worker.
Now, you'll build the Worker Process.

## Build the Worker

In order to execute the code defined so far, you must create a [Worker Process](https://docs.temporal.io/workers#worker-process).

Create a `worker` folder, and create the `main.go` file for the [Worker program](https://docs.temporal.io/workers#worker-program).

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["1-9"]}-->
[worker/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/worker/main.go)
```go
package main

import (
	"log"
	"subscribe_emails"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)
```
<!--SNIPEND-->

Create the [Client](https://docs.temporal.io/temporal#temporal-client) and the [Worker Entity](https://docs.temporal.io/workers#worker-entity).

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["11-22"]}-->
[worker/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/worker/main.go)
```go
// ...
func main() {
	// create client and worker
	c, err := client.Dial(client.Options {
		HostPort: client.DefaultHostPort,
		Namespace: client.DefaultNamespace,
	})
	if err != nil {
		log.Fatalln("Unable to create Temporal Client.", err)
	}
	defer c.Close()
	// create Worker
	w := worker.New(c, "subscription_emails", worker.Options{})
```
<!--SNIPEND-->

Register the Workflow and Activities to the Worker.

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["23-25"]}-->
[worker/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/worker/main.go)
```go
// ...
	// register Activity and Workflow
	w.RegisterWorkflow(subscribe_emails.SubscriptionWorkflow)
	w.RegisterActivity(&subscribe_emails.Activities{})
```
<!--SNIPEND-->

Finally, tell the Worker to listen to the [Task Queue](https://docs.temporal.io/tasks#task-queue).

<!--SNIPSTART subscription-workflow-go-worker {"selectedLines": ["27-33"]}-->
[worker/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/worker/main.go)
```go
// ...
	// Listen to Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start Worker.", err)
	}
	log.Println("Worker successfully started.")
}
```
<!--SNIPEND-->

All of the application components are there, but aren't running. 
Time to build a web server to interact with the app!

## Build the web server

The web server allows the user to communicate with the Temporal Application, and also serves as the entry point for starting the Workflow Execution.

There are several handlers that make the Subscription possible. These handlers allow you to subscribe, unsubscribe, and get details about the Workflow.
An index handler exists as well.

Create a `gateway` folder with the file `main.go`.
Create a Client in `main.go`.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["1-12", "14-15", "142-163"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"subscribe_emails"

	"go.temporal.io/sdk/client"
)
// ...
var temporalClient client.Client
var taskQueueName string
// ...
	fmt.Fprint(w, "Your details have been retrieved. Results: " + result)
}
// set up handlers, Client, port, Task Queue name.
func main() {
	port := "4000"
	taskQueueName = "subscription_emails"

	var err error
	temporalClient, err = client.Dial(client.Options {
		HostPort: client.DefaultHostPort,
	})

	if err != nil {
		panic(err)
	}

	fmt.Printf("Starting the web server on port %s\n", port)

	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/subscribe", subscribeHandler)
	http.HandleFunc("/unsubscribe", unsubscribeHandler)
	http.HandleFunc("/getdetails", getDetailsHandler)
```
<!--SNIPEND-->

Create an `index` handler.
This handler creates an input field to collect the email needed to kick off the Workflow.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["17-21"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
// create the index handler, accessed at localhost:4000
func indexHandler(w http.ResponseWriter, _ *http.Request) {
	_, _ = fmt.Fprint(w, "<h1>Sign up here!")
	_, _ = fmt.Fprint(w, "<form method='post' action='subscribe'><input required name='email' type='email'><input type='submit' value='Subscribe'>")
}
```
<!--SNIPEND-->

## Build the `/subscribe` handler

The `/subscribe` handler starts the Workflow Execution for the given email address.
The email generates a unique [Workflow ID](https://docs.temporal.io/workflows#workflow-id), meaning only one Workflow can be executed per email address.

<!-- TODO: mention that ID can be reused after a Workflow ends or is terminated. -->

Create a parser for the handler.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["24-30"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
func subscribeHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		// in case of any error
		_, _ = fmt.Fprint(w, "<h1>Error processing form</h1>")
		return
	}
```
<!--SNIPEND-->

Get the address from the form, and configure your Workflow Options.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["30-45"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
	}
	// check for valid email value
	email := r.PostForm.Get("email")

	if email == "" {
		// in case of any error
		_, _ = fmt.Fprint(w, "<h1>Email is blank</h1>")
		return
	}

	// use the email as the id in the workflow.
	workflowOptions := client.StartWorkflowOptions{
		ID:        "subscribe_email_" + email,
		TaskQueue: taskQueueName,
		WorkflowExecutionErrorWhenAlreadyStarted: true,
	}
```
<!--SNIPEND-->

Define and execute the Workflow within the handler.
<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["44-65"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
		WorkflowExecutionErrorWhenAlreadyStarted: true,
	}

	// Define the subscription
	subscription := subscribe_emails.Subscription{
		EmailInfo: subscribe_emails.EmailInfo{
			EmailAddress: email,
			Mail: "",
		},
			SubscriptionPeriod: 5,
			MaxSubscriptionPeriods: 12,
	}

	// Execute the Temporal Workflow to start the subscription.
	_, err = temporalClient.ExecuteWorkflow(context.Background(), workflowOptions, subscribe_emails.SubscriptionWorkflow, subscription)

	if err != nil {
		_, _ = fmt.Fprint(w, "<h1>Couldn't sign up</h1>")
		log.Print(err)
	} else {
		_, _ = fmt.Fprint(w, "<h1>Signed up!</h1>")
	}
```
<!--SNIPEND-->

## Build the `/unsubscribe` handler

The `/unsubscribe` handler cancels the Workflow with a given email in its Workflow ID.

For this app, you'll use a switch case to handle the response and provide new information to the Workflow Execution.

Create a new function. 
Define the two cases.
<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["68-77"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...

// create unsubscribe handler, accessed at localhost:4000/unsubscribe
func unsubscribeHandler(w http.ResponseWriter, r *http.Request) {
	
	switch r.Method {

	case "GET":
		// create input field for the email
		_, _ = fmt.Fprint(w, "<h1>Unsubscribe</h1><form method='post' action='/unsubscribe'><input required name='email' type='email'><input type='submit' value='Unsubscribe'>")

```
<!--SNIPEND-->

Canceling the Workflow will happen in "POST".
After the Workflow is found for the given email address, notify the user that their subscription has ended.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["78-106"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
	case "POST":
		// check value in input field
		err := r.ParseForm()

		if err != nil {
			// in case of any error
			_, _ = fmt.Fprint(w, "<h1>Error processing form</h1>")
			return
		}

		email := r.PostForm.Get("email")

		if email == "" {
			// in case of any error
			_, _ = fmt.Fprint(w, "<h1>Email is blank</h1>")
			return
		}
		// get Workflow ID to unsubscribe
		workflowID := "subscribe_email_" + email
		// cancel the Workflow Execution
		err = temporalClient.CancelWorkflow(context.Background(), workflowID, "")

		if err != nil {
			_, _ = fmt.Fprint(w, "<h1>Couldn't unsubscribe you</h1>")
			log.Fatalln("Unable to cancel Workflow Execution", err)
		} else {
			_, _ = fmt.Fprint(w, "<h1>Unsubscribed you from our emails. Sorry to see you go.</h1>")
			log.Println("Workflow Execution cancelled", "WorkflowID", workflowID)
		}
```
<!--SNIPEND-->

## Build the Query handler

Emails are great for showing the progress of the subscription, but what if you need additional subscription details?
For this, you'll build a Query to get details about the Workflow Execution.
This Query has two endpoints: `/getdetails` and `/showdetails`.

### Build the `/getdetails` endpoint

Like `/unsubscribe`, the `/getdetails` handler incorporates a switch case for getting an email address and receiving information from a Workflow Execution.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["112-116"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
func getDetailsHandler(w http.ResponseWriter, r *http.Request) {
	_, _ = fmt.Fprint(w, "<h1>Get description details here!</h1>")
	_, _ = fmt.Fprint(w, "<form method='get' action='/details'><input required name='email' type='email'><input type='submit' value='GetDetails'>")
}

```
<!--SNIPEND-->

### Build the `/showdetails` endpoint

The `/showdetails` handler uses the information gathered from `/getdetails` to retrieve and print subscription information.

Define the variables needed to Query the Workflow, and then handle the result. 

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["118-144"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
func showDetailsHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the query string
	queryValues, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil {
	 	log.Println("Failed to query Workflow.")
		return 
	}
   
	// Extract the email parameter
	email := queryValues.Get("email")

	workflowID := "subscribe_email_" + email
	queryType := "GetDetails"
	
	// print email, billing period, charge, etc.
	resp, err := temporalClient.QueryWorkflow(context.Background(), workflowID, "", queryType)
	if err != nil {
		log.Fatalln("Unable to Query Workflow", err)
	}
	var result string
	if err := resp.Get(&result); err != nil {
		log.Fatalln("Unable to decode Query result", err)
	}
	log.Println("Received Query result", "Result: " + result)
	fmt.Fprint(w, "Your details have been retrieved. Results: " + result)
}
// set up handlers, Client, port, Task Queue name.
```
<!--SNIPEND-->

## Create an integration test

Integration testing is essential to software development.
Testing ensures that all the components of an application are working as expected.

The Temporal Go SDK includes functions to help test your Workflow Executions.
Using this, along with the [Testify module](https://github.com/stretchr/testify), allows you to test for successful Workflow Executions.

Create a new file called `subscription_test.go`.
Import the Temporal Go SDK Test Suite, Go's testing and time libraries, and the `require` module from Testify.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["2-11"]}-->
[subscription_test.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscription_test.go)
```go
// ...

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"go.temporal.io/sdk/testsuite"
)

func Test_SuccessfulSubscriptionWorkflow (t *testing.T) {
```
<!--SNIPEND-->

### Create test function

Create a function called `Test_SuccessfulSubscriptionWorkflow`.
Create an instance of TestSuite and initiate the environment.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["12-14"]}-->
[subscription_test.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscription_test.go)
```go
// ...
	testSuite := &testsuite.WorkflowTestSuite{}
	env := testSuite.NewTestWorkflowEnvironment()
	var activities *Activities
```
<!--SNIPEND-->

Initiate the Activities and create a Subscription struct called `testDetails`.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["15-26"]}-->
[subscription_test.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscription_test.go)
```go
// ...

	testDetails := Subscription{
		EmailInfo {
			EmailAddress: "example@temporal.io",
			Mail: "",
		},
		SubscriptionPeriod: ,
		MaxSubscriptionPeriods: 12,
	}

	env.RegisterWorkflow(SubscriptionWorkflow)

```
<!--SNIPEND-->

Register the Workflow and Activities.
<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["28-31"]}-->
[subscription_test.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscription_test.go)
```go
// ...
	env.RegisterActivity(activities.SendSubscriptionEmail)
	env.RegisterActivity(activities.SendCancellationEmail)
	env.RegisterActivity(activities.SendSubscriptionEndedEmail)
	
```
<!--SNIPEND-->

Finally, execute the Workflow.
Require the test to not return an error.

<!--SNIPSTART subscription-workflow-go-subscribe-test {"selectedLines": ["33-36"]}-->
[subscription_test.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscription_test.go)
```go
// ...
	env.ExecuteWorkflow(SubscriptionWorkflow, testDetails)
	require.NoError(t, env.GetWorkflowError())
}

```
<!--SNIPEND-->

## Conclusion

This tutorial demonstrates how to build a web application using Temporal and Go. 
Through the use of Temporal's Workflows, Activities, and Queries, the tutorial shows how to create a web server that interacts with Temporal to manage the email subscription process.

With this knowledge, you'll be able to use more complex Workflows and Activities to create even stronger applications.
