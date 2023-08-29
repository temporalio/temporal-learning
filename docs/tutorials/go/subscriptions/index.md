---
title: "Build a subscription workflow with Temporal and Go"
sidebar_position: 3
keywords: [Go,tutorial,temporal,workflows,SDK,subscription]
description: Build a subscription application with Temporal and Go.
last_update:
  date: 2023-08-30
image: /img/temporal-logo-twitter-card.png
---

### Introduction

In this tutorial, you'll build a subscription web application using Temporal and Go.
You'll create a web server to handle requests and use Temporal [Workflows](https://docs.temporal.io/workflows), [Activities](https://docs.temporal.io/activities), and [Queries](https://docs.temporal.io/workflows#query) to build the core of the application.

Since you're building the business logic with Temporal's Workflows and Activities, you'll be able to use Temporal to manage each subscription rather than relying on a separate database or task queue. This reduces the complexity of the code you have to write and support.

You'll create an endpoint for users to give their email address, and then create a new [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution) using that email address which will simulate sending an email message at certain intervals. The user can check on the status of their subscription, which you'll handle using a Query, and they can end the subscription at any time by unsubscribing, which you'll handle by cancelling the Workflow Execution. You can view the user's entire process through [Temporal's Web UI](https://docs.temporal.io/web-ui). For this tutorial, you'll simulate sending emails, but you can adapt this example to call a live email service in the future.

By the end of this tutorial, you'll have a clear understand how to use Temporal to create and manage long-running Workflows within a web application.

You'll find the code for this tutorial on GitHub in the [subscription-workflow-go](https://github.com/temporalio/subscription-workflow-go) repository.

## Prerequisites 

- [Set up a local development environment for Temporal and Go](https://learn.temporal.io/getting_started/go/dev_environment/).
- Complete the [Hello World](https://learn.temporal.io/getting_started/go/hello_world_in_go/) to ensure you understand the basics of creating Workflows and Activities with Temporal.
- Install the latest versions of [Temporal Server](https://docs.temporal.io/clusters#temporal-server) and the [Go SDK](https://pkg.go.dev/go.temporal.io/sdk)

Create a new directory for the project called `email-subscription-project`.
Run `go mod init subscribeemail` to create a Go module file in the project directory.
Run `go mod tidy` to update the Go module file.

:::note

Always run `go mod tidy` after importing new packages to the application.

:::

## Develop the Workflow

A Workflow defines a sequence of steps defined by writing code, known as a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition), and are carried out by running that code, which results in a Workflow Execution.

The Temporal Go SDK recommends the use of a single struct for parameters and return types.
This lets you add fields without breaking Workflow compatibility.
Before writing the Workflow Definition, you'll define the data object used by the Workflow Definition.

To set up the struct, create a new file called `subscribe.go` in your project directory.

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["1"]}-->
[subscribe.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscribe.go)
```go
package subscribeemails
```
<!--SNIPEND-->

This struct will represent the data you'll send to your Activity and Workflow.
You'll create an `EmailDetails` struct with the following fields:
 - `EmailAddress`: a string to pass a user's email
 - `Message`: a string to pass a message to the user
 - `IsSubscribed`: a boolean to track whether the user is subscribed
 - `SubscriptionCount`: an integer to track the number of emails sent

Add the following code to the `subscribe.go` file:

<!--SNIPSTART subscription-workflow-go-subscribe {"selectedLines": ["4-11"]}-->
[subscribe.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscribe.go)
```go
// ...
const ClientHostPort string = "localhost:4000"

type EmailDetails struct {
	EmailAddress      string `json:"emailAddress"`
	Message           string `json:"message"`
	IsSubscribed      bool   `json:"isSubscribed"`
	SubscriptionCount int    `json:"subscriptionCount"`
}
```
<!--SNIPEND-->

Now that you have your `EmailDetails` struct defined, you can now move on to writing the Workflow Definition.

To create a new Workflow Definition, create a new file called `workflow.go`.
This file will contain the `SubscriptionWorkflow()` function.

Use the `workflow.go` file to write deterministic logic inside your Workflow Definition and to execute the Activity.

Add the following code to define the Workflow:

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["4-29", "54-62", "65-68"]}-->
[workflow.go](https://github.com/temporalio/subscription-workflow-go/blob/master/workflow.go)
```go
// ...
	"errors"
	"time"

	"go.temporal.io/sdk/workflow"
)

// Workflow definition
func SubscriptionWorkflow(ctx workflow.Context, emailDetails EmailDetails) error {
	duration := 12 * time.Second
	logger := workflow.GetLogger(ctx)
	logger.Info("Subscription created", "EmailAddress", emailDetails.EmailAddress)

	// Query handler
	err := workflow.SetQueryHandler(ctx, "GetDetails", func() (EmailDetails, error) {
		return emailDetails, nil
	})

	if err != nil {
		return err
	}
	// variable for Activity Options. Timeout can be set to a longer timespan (such as a month)
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 2 * time.Minute,
		WaitForCancellation: true,
	})

// ...
	logger.Info("Sending welcome email", "EmailAddress", emailDetails.EmailAddress)
	emailDetails.SubscriptionCount++
	data := EmailDetails{
		EmailAddress:      emailDetails.EmailAddress,
		Message:           "Welcome! Looks like you've been signed up!",
		IsSubscribed:      true,
		SubscriptionCount: emailDetails.SubscriptionCount,
	}

// ...
	if err != nil {
		return err
	}

```
<!--SNIPEND-->

The `SubscriptionWorkflow()` function requires two arguments: `ctx` and `EmailDetails.
`EmailDetails` propagates the function's `data` struct, which is used alongside `ctx` to execute the Activity.

In addition to a Query handler, the Workflow Definition needs a cancellation handler.
Create a new function within `SubscriptionWorkflow()` to send cancellation emails and end the Workflow Execution.

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["32-52"]}-->
[workflow.go](https://github.com/temporalio/subscription-workflow-go/blob/master/workflow.go)
```go
// ...
		newCtx, cancel := workflow.NewDisconnectedContext(ctx)
		defer cancel()

		if errors.Is(ctx.Err(), workflow.ErrCanceled) {
			data := EmailDetails{
				EmailAddress:      emailDetails.EmailAddress,
				Message:           "Your subscription has been canceled. Sorry to see you go!",
				IsSubscribed:      false,
				SubscriptionCount: emailDetails.SubscriptionCount,
			}
			// send cancellation email
			err := workflow.ExecuteActivity(newCtx, SendEmail, data).Get(newCtx, nil)
			if err != nil {
				logger.Error("Failed to send cancellation email", "Error", err)
			} else {
				// Cancellation received.
				logger.Info("Sent cancellation email", "EmailAddress", emailDetails.EmailAddress)
			}
		}
	}()

```
<!--SNIPEND-->

The `SubscriptionWorkflow()` function needs a `for` loop to continue sending emails.
The `for` loop executes the email Activity while `IsSubscribed` is `true`, and even uses a Timer to pause the Workflow between emails.
The Timer can pause the Workflow for seconds, days, months, or even years, depending on your business logic.

Add the following code to run a `for` loop:

<!--SNIPSTART subscription-workflow-go-main {"selectedLines": ["71-92"]}-->
[workflow.go](https://github.com/temporalio/subscription-workflow-go/blob/master/workflow.go)
```go
// ...
		emailDetails.SubscriptionCount++
		data := EmailDetails{
			EmailAddress:      emailDetails.EmailAddress,
			Message:           "This is yet another email in the Subscription Workflow.",
			IsSubscribed:      true,
			SubscriptionCount: emailDetails.SubscriptionCount,
		}

		err = workflow.ExecuteActivity(ctx, SendEmail, data).Get(ctx, nil)
		if err != nil {
			return err
		}
		logger.Info("Sent content email", "EmailAddress", emailDetails.EmailAddress)
		// Sleep the Workflow until the next subscription email needs to be sent.
		// This can be set to sleep every month between emails.
		if err = workflow.Sleep(ctx, duration); err != nil {
			return err
		}
	}
	return nil
}

```
<!--SNIPEND-->

Since the user's email address is set to the [Workflow Id](https://docs.temporal.io/workflows#workflow-id), attempting to subscribe with the same email address twice will result in an error and prevent the Workflow Execution from spawning again.

Therefore, only one running Workflow Execution per email address can exist within the associated [Namespace](https://docs.temporal.io/namespaces). 
This ensures that the user won't receive multiple email subscriptions. This also helps reduce the complexity of the code you have to write and maintain.

With this Workflow Definition in place, you can now develop an Activity to send emails.

## Develop the Activities

Create a new file called activities.py and develop the Activity Definition.

<!--SNIPSTART subscription-workflow-go-activities-->
[activities.go](https://github.com/temporalio/subscription-workflow-go/blob/master/activities.go)
```go
package subscribeemails

import (
	"context"

	"go.temporal.io/sdk/activity"
)

// email activities
func SendEmail(ctx context.Context, emailInfo EmailDetails) (string, error) {
	activity.GetLogger(ctx).Info("Sending email to customer", "EmailAddress", emailInfo.EmailAddress)
	return "Email sent to " + emailInfo.EmailAddress, nil
}

```
<!--SNIPEND-->

Each iteration of the Workflow loop will execute this Activity, which simulates sending a message to the user.

Now that the Activity Definition and Workflow Definition have been created, it's time to write the Worker process.

## Build the Worker

Create a `worker` folder, and create the `main.go` file for the [Worker program](https://docs.temporal.io/workers#worker-program).

<!--SNIPSTART subscription-workflow-go-worker-->
[worker/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/worker/main.go)
```go
package main

import (
	"log"
	"subscribeemails"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

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
	w := worker.New(c, subscribeemails.TaskQueueName, worker.Options{})
	// register Activity and Workflow
	w.RegisterWorkflow(subscribeemails.SubscriptionWorkflow)
	w.RegisterActivity(subscribeemails.SendEmail)

	log.Println("Worker is starting.")
	// Listen to Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start Worker.", err)
	}
}
```
<!--SNIPEND-->

Now that you've written the logic to execute the Workflow and Activity Definitions, try to build the gateway.

## Build the web server

The web server is used to handle requests.
This tutorial uses [Go's HTTP library](https://pkg.go.dev/net/http) as the entry point for initiating Workflow Executions and for communicating with the `/subscribe`, `/unsubscribe`, and `/details` endpoints. 

Create a `gateway` folder with the file `main.go`.
Establish your JSON request and response structs, set the endpoint handlers, and connect to the Temporal Client.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["1-25", "198-215"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"subscribeemails"

	"go.temporal.io/sdk/client"
)

var temporalClient client.Client

type RequestData struct {
	Email string `json:"email"`
}

type ResponseData struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// ...

	var err error
	temporalClient, err = client.Dial(client.Options{
		HostPort: client.DefaultHostPort,
	})

	if err != nil {
		panic(err)
	}

	fmt.Printf("Starting the web server on %s\n", subscribeemails.ClientHostPort)

	http.HandleFunc("/subscribe", subscribeHandler)
	http.HandleFunc("/unsubscribe", unsubscribeHandler)
	http.HandleFunc("/details", showDetailsHandler)
	_ = http.ListenAndServe(":4000", nil)
}

```
<!--SNIPEND-->

The Temporal Client enables you to communicate with the Temporal Cluster. Communication with a Temporal Cluster includes, but isn't limited to, the following:

- Starting Workflow Executions
- Querying Workflow Executions
- Getting the results of a Workflow Execution

The `RequestData` and `ResponseData` structs format information in JSON format.
Temporal recommends JSON formatting for data that's handled by other programs—a good practice to establish for a future of live service interactions.

Now that the connection to the Temporal Server is open, define your first endpoint.

Create a `subscribeHandler()` function so users can subscribe to the emails.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["28-96"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...

	// only respond to POST
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// ensure JSON request
	if r.Header.Get("Content-Type") != "application/json" {
		http.Error(w, "Invalid Content-Type, expecting application/json", http.StatusUnsupportedMediaType)
		return
	}

	var requestData RequestData

	// decode request into variable
	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Error processing request body", http.StatusBadRequest)
		return
	}

	// check if the email is blank
	if requestData.Email == "" {
		http.Error(w, "Email is blank", http.StatusBadRequest)
		return
	}

	// use the email as the id in the workflow.
	workflowOptions := client.StartWorkflowOptions{
		ID:                                       requestData.Email,
		TaskQueue:                                subscribeemails.TaskQueueName,
		WorkflowExecutionErrorWhenAlreadyStarted: true,
	}

	// Define the EmailDetails struct
	subscription := subscribeemails.EmailDetails{
		EmailAddress:      requestData.Email,
		Message:           "Welcome to the Subscription Workflow!",
		SubscriptionCount: 0,
		IsSubscribed:      true,
	}

	// Execute the Temporal Workflow to start the subscription.
	_, err = temporalClient.ExecuteWorkflow(context.Background(), workflowOptions, subscribeemails.SubscriptionWorkflow, subscription)

	if err != nil {
		http.Error(w, "Couldn't sign up user. Please try again.", http.StatusInternalServerError)
		log.Print(err)
		return
	}

	// build response
	responseData := ResponseData{
		Status:  "success",
		Message: "Signed up.",
	}

	// send headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201 Created status code

	// send response
	if err := json.NewEncoder(w).Encode(responseData); err != nil {
		log.Print("Could not encode response JSON", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

```
<!--SNIPEND-->

Use error handlers to ensure that the function only responds to a "POST" request in JSON format.
After decoding the request, use `workflowOptions` to pass in the user's email address and set the Workflow Id.
This ensures that the email is unique across all Workflows so that the user can't sign up multiple times.
They'll only receive the emails they've subscribed to, and once they unsubscribe, they cancel the Workflow run.

With this endpoint in place, you can now send a "POST" request to `/subscribe` with an email address in the request body. 
In return, you'll receive a JSON response that shows a new Workflow has started, along with a welcome email.

But how would you get details about the subscription? 
In the next section, you'll query your Workflow to get back information on the state of things.

## Add a Query

Create a function called `showDetailsHandler()` in which a user can get information about their subscription details.
Make sure to include error handlers to ensure proper "GET" requests and responses.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["155-195"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...
	// Parse the query string
	queryValues, err := url.ParseQuery(r.URL.RawQuery)
	if err != nil {
		http.Error(w, "Couldn't query values. Please try again.", http.StatusInternalServerError)
		log.Println("Failed to query Workflow.")
		return
	}

	// Extract the email parameter
	email := queryValues.Get("email")

	workflowID := email
	queryType := "GetDetails"

	// print email, billing period, charge, etc.
	resp, err := temporalClient.QueryWorkflow(context.Background(), workflowID, "", queryType)
	if err != nil {
		http.Error(w, "Couldn't query values. Please try again.", http.StatusInternalServerError)
		log.Println("Failed to query Workflow.")
		return
	}

	var result subscribeemails.EmailDetails

	if err := resp.Get(&result); err != nil {
		http.Error(w, "Couldn't query values. Please try again.", http.StatusInternalServerError)
		log.Println("Failed to query Workflow.")
		return
	}

	// send headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201 Created status code

	// send response
	if err := json.NewEncoder(w).Encode(result); err != nil {
		log.Print("Could not encode response JSON", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

```
<!--SNIPEND-->

The resulting function returns the email address associated with the Workflow—in other words, the Workflow Id.
The handle only gets the value of the `EmailDetails` variables.
Queries should never mutate anything in the Workflow.

Queries can be used even if after the Workflow completes.
This is useful for retrieving information after unsubscribing from the subscription.

Now that users can subscribe and view the details of their subscription, you need to provide them with a way to unsubscribe.

## Unsubscribe users with a Workflow Cancellation request

Users will want to unsubscribe from the email list at some point, so give them a way to do that.

Create a new function called `unsubscribeHandler()` that sends a cancellation request to the Workflow Execution.

<!--SNIPSTART subscription-workflow-go-gateway {"selectedLines": ["99-152"]}-->
[gateway/main.go](https://github.com/temporalio/subscription-workflow-go/blob/master/gateway/main.go)
```go
// ...

	// only respond to POST
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// ensure JSON request
	if r.Header.Get("Content-Type") != "application/json" {
		http.Error(w, "Invalid Content-Type, expecting application/json", http.StatusUnsupportedMediaType)
		return
	}

	var requestData RequestData

	// decode request into variable
	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Error processing request body", http.StatusBadRequest)
		return
	}

	// check if the email is blank
	if requestData.Email == "" {
		http.Error(w, "Email is blank", http.StatusBadRequest)
		return
	}
	workflowID := requestData.Email

	// cancel the Workflow Execution
	err = temporalClient.CancelWorkflow(context.Background(), workflowID, "")
	if err != nil {
		http.Error(w, "Couldn't unsubscribe. Please try again.", http.StatusInternalServerError)
		log.Print(err)
		return
	}

	// build response
	responseData := ResponseData{
		Status:  "success",
		Message: "Unsubscribed.",
	}

	// send headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201 Created status code

	// send response
	if err := json.NewEncoder(w).Encode(responseData); err != nil {
		log.Print("Could not encode response JSON", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

```
<!--SNIPEND-->

The `CancelWorkflow()` function sends a cancellation request to the Workflow Execution started on the `/subscribe` endpoint.

When the Workflow receives the cancellation request, it will cancel the Workflow Execution and return a `CancelledError` to the Workflow Execution.
This is then handled by the error handlers included in the `unsubscribeHandler()` function.

Users can now send a "DELETE" request to `/unsubscribe` to cancel the Workflow associated with the request body's email address. 
This allows users to unsubscribe from the email list and prevent any further emails from sending.

Now that you've added the ability to unsubscribe from the email list, test your application code to ensure it works as expected.

## Create integration tests

Integration testing is an essential part of software development that helps ensure that different components of an application work together correctly.
In this section, you'll write an integration test using the Go SDK to test the cancellation of a Workflow.

The Temporal Go SDK includes functions to help test your Workflow Executions.
Use these functions alongside the [Testify module](https://github.com/stretchr/testify) to create integration tests against a test server or a given Client.

To set up the test environment, create a new file called `subscription_test.go`.
Create a test function called `Test_CanceledSubscriptionWorkflow()`.

<!--SNIPSTART subscription-workflow-go-subscribe-test-->
[subscription_test.go](https://github.com/temporalio/subscription-workflow-go/blob/master/subscription_test.go)
```go
package subscribeemails

import (
	"testing"
	"time"

	"go.temporal.io/sdk/testsuite"
)

func Test_CanceledSubscriptionWorkflow(t *testing.T) {
	testSuite := &testsuite.WorkflowTestSuite{}
	env := testSuite.NewTestWorkflowEnvironment()

	testDetails := EmailDetails{
		EmailAddress:      "example@temporal.io",
		Message:           "This is a test to see if the Workflow cancels. This is dependent on the bool variable in the testDetails struct.",
		IsSubscribed:      true,
		SubscriptionCount: 12,
	}

	// set delayed callback to allow time for cancellation.
	env.RegisterDelayedCallback(func() {
		env.CancelWorkflow()
	}, 5 * time.Second)

	env.RegisterWorkflow(SubscriptionWorkflow)
	env.RegisterActivity(SendEmail)

	env.ExecuteWorkflow(SubscriptionWorkflow, testDetails)
}




```
<!--SNIPEND-->

This function creates a Workflow Execution by starting the Workflow with some test data.
The function then cancels it with the `CancelWorkflow()` function that was assigned to `RegisterDelayedCallback()`.

With the test function created, run it to see if it works.
Use the command `go test` to start the test.

```
subscription-workflow-go % go test
2023/08/21 11:43:40 INFO  Subscription created EmailAddress example@temporal.io
2023/08/21 11:43:40 INFO  Sending welcome email EmailAddress example@temporal.io
2023/08/21 11:43:40 INFO  Sending email to customer ActivityID 2 ActivityType SendEmail Attempt 1 WorkflowType SubscriptionWorkflow WorkflowID default-test-workflow-id RunID default-test-run-id EmailAddress example@temporal.io
2023/08/21 11:43:40 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 2 ActivityType SendEmail
2023/08/21 11:43:40 INFO  Sending email to customer ActivityID 3 ActivityType SendEmail Attempt 1 WorkflowType SubscriptionWorkflow WorkflowID default-test-workflow-id RunID default-test-run-id EmailAddress example@temporal.io
2023/08/21 11:43:40 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 3 ActivityType SendEmail
2023/08/21 11:43:40 INFO  Sent content email EmailAddress example@temporal.io
2023/08/21 11:43:40 DEBUG Auto fire timer TimerID 0 TimerDuration 5s TimeSkipped 5s
2023/08/21 11:43:40 DEBUG RequestCancelTimer TimerID 4
2023/08/21 11:43:40 INFO  Sending email to customer ActivityID 5 ActivityType SendEmail Attempt 1 WorkflowType SubscriptionWorkflow WorkflowID default-test-workflow-id RunID default-test-run-id EmailAddress example@temporal.io
2023/08/21 11:43:40 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 5 ActivityType SendEmail
2023/08/21 11:43:40 INFO  Sent cancellation email EmailAddress example@temporal.io
PASS
ok      subscribeemails 0.285s
```

With a cancellation request that fires after five seconds, this test shows the successful creation of a subscription as well as its cancellation.
You've successfully written, executed, and passed a Cancellation Workflow test. 

Temporal's Go SDK provides a number of functions that help you test your Workflow Executions. 
By following the best practices for testing your code, you can be confident that your Workflows are reliable and performant.

## Conclusion

This tutorial demonstrates how to build an email subscription application using Temporal and Go.
By leveraging Workflows, Activities, and Queries, the tutorial shows how to create a web server that interacts with Temporal to manage the subscription process.

With this knowledge, you'll be able to use more complex Workflows and Activities to create even stronger applications.
