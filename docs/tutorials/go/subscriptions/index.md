## Introduction

Creating reliable applications can be a complex process, often plagued by volatility that seems beyond your control.

In this tutorial, you'll be writing a [Workflow](https://docs.temporal.io/workflows) for a limited-time Subscription application.
The application will be able to:

1. Send a "welcome" email to the user upon signup.
2. Start the billing process and send subsequent subscription emails.
3. Look up the customer's information regarding:
    - Amount Charged
    - Period number
4. End the subscription when:
    - The maximum amount of billing periods has been reached.
    - The user has chosen to unsubscribe.

This tutorial focuses on implementing an email subscription application with Temporal’s Workflows, [Activities](https://docs.temporal.io/activities), and [Queries](https://docs.temporal.io/workflows#query).
This is achieved by using:

- Activities to send emails
- Queries to retrieve the status of an ongoing subscription
- Cancellation to end the subscription

Not only do you get a more accessible introduction to [Temporal Workflow APIs](https://docs.temporal.io/application-development), but we'll also provide an example of how to break down project requirements into Temporal logic.

:::tip Skip ahead

To skip straight to a fully working example, check out the Subscription Workflow in the Go repository.

:::

## Prerequisites 

Before starting this tutorial, make sure that you've set up:
- [Temporal Server](https://docs.temporal.io/clusters#temporal-server)
- [Temporal Go SDK](https://pkg.go.dev/go.temporal.io/sdk)
- [Go 1.17+](https://go.dev/dl/)

If you plan to implement APIs for sending emails and billing, make sure those are set up as well. 
This tutorial will be mocking actual emails and billing.

## Create the project

In your code editor, create a new project.

## Develop the Workflow

A Workflow starts with a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition)—a sequence of steps defined in code that are carried out in a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).
Before the Workflow Definition can be written, we need to identify and define the data objects to be used in our application.

### Data objects

In Go, data objects are known as **structs**—variable types that contain multiple variables within it. 
We can use structs to organize our information and optimize updates to the Workflow.

Start by creating a file called `subscribe.go`.

```go
package subscribe_emails

import "time
```
Any structs created in this file can be used throughout the app by defining it in the package `subscribe_emails`.

Next, create a struct for `Subscription`. 
This data class will contain the user's email information, as well as the progress of their subscription.

```go
// Subscription is the user email and campaign they'll receive.
type Subscription struct {
    EmailInfo EmailInfo
    Periods   Periods
}
```

As you can see, `Subscription` contains instances of two other data classes, which we'll define as well.
Let's start with `EmailInfo`.
This struct contains the user's email address, along with the message they'll be sent.

```go
// EmailInfo is the data that the Activity uses to send the message.
type EmailInfo struct {
    EmailAddress string
    Mail         string
}
```

The other data class we'll create is `Periods`. 
This struct contains information about how long the Subscription lasts, along with how much is charged per billing period.

```go
// Periods contain duration info for trial and full subscription periods
type Periods struct {
    TrialPeriod          time.Duration
    BillingPeriod        time.Duration
    MaxBillingPeriods    int
    BillingPeriodCharge  int
}
```

Now that our data classes have been defined, we can now define the Workflow.

### Writing the Workflow Definition

Create a new file called `workflow.go`.
This will soon contain the logic needed to facilitate the Subscription.

Define your variables and initiate a logger.
Make sure to establish your Workflow with Activity Options.

```go
// Workflow definition
func SubscriptionWorkflow(ctx workflow.Context, subscription Subscription) error {

	var activities *Activities
	billingPeriodNum := 0
	duration := time.Minute

	logger := workflow.GetLogger(ctx)
	logger.Info("Subscription created for " + subscription.EmailInfo.EmailAddress)

	ao := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Minute,
		WaitForCancellation: true,
	}

	ctx = workflow.WithActivityOptions(ctx, ao)
// ...
}
```

Next, create a function to handle [cancellation](https://docs.temporal.io/activities#cancellation).

```go
// Handle any cleanup, including cancellations.
	defer func() {
if !errors.Is(ctx.Err(), workflow.ErrCanceled) {
			data := EmailInfo {
				EmailAddress: subscription.EmailInfo.EmailAddress,
				Mail:         "Welcome! Looks like you've been signed up!",
			}
			e := workflow.ExecuteActivity(ctx, activities.SendCancellationEmailDuringActiveSubscription, data)

			if err != nil {
				logger.Error("Failed to send cancel email", "Error", e)
			} else {
				// Cancellation received, which will trigger an unsubscribe email.
				logger.Info("Sending cancellation email")
			}
			return
		}

		newCtx, _ := workflow.NewDisconnectedContext(ctx)

		data := EmailInfo {
				EmailAddress: subscription.EmailInfo.EmailAddress,
				Mail: "You have been unsubscribed from the Subscription Workflow. Good bye.",
		}

		logger.Info("Sending unsubscribe email to " + subscription.EmailInfo.EmailAddress)
		err := workflow.ExecuteActivity(newCtx, activities.SendSubscriptionOverEmail, data).Get(newCtx, nil)

		if err != nil {
			logger.Error("Unable to send unsubscribe message", "Error", err)
		}
	}()
```

Finish off the Workflow Definition with a for-loop to send Subscription emails until the `MaxBillingPeriods` amount is reached.

```go
// start subscription period
	for (billingPeriodNum < subscription.Periods.MaxBillingPeriods) {

		data := EmailInfo{
				EmailAddress: subscription.EmailInfo.EmailAddress,
				Mail:         "This is yet another email in the Subscription Workflow.",
		}

		err = workflow.ExecuteActivity(ctx, activities.SendSubscriptionEmail, data).Get(ctx, nil)

		if err != nil {
			logger.Error("Failed to send email ", "Error", err)
		}

		logger.Info("sent content email to " + subscription.EmailInfo.EmailAddress)

		err = workflow.ExecuteActivity(ctx, activities.ChargeCustomerForBillingPeriod, data).Get(ctx, nil)

		if err != nil {
			logger.Error("Failed to charge customer ", "Error", err)
		}

		billingPeriodNum++

		workflow.Sleep(ctx, duration)
	}

	return nil
```

We can now write the Activities to mock sending the emails.

## Develop the Activities

An Activity is a function designed to perform a specific, well-defined action over a period of time.
While Activities are optimal for interacting with outside APIs, the [Activity Definition](https://docs.temporal.io/activities#activity-definition) in this tutorial will mock this behavior.

The Activity Definition has already been written for the Subscription app, so feel free to look it over before proceeding to the next step.

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

func (a *Activities) SendSubscriptionEmail(ctx context.Context, emailInfo EmailInfo) (string, error) {
	activity.GetLogger(ctx).Info("sending subscription email to: ", emailInfo.EmailAddress)
	return "Sending subscription email completed for: " + emailInfo.EmailAddress, nil
// add conditions for cancellation and expiration
}
```

## Build the Worker

In order to execute the code we've defined so far, we'll need to create a [Worker Process](https://docs.temporal.io/workers#worker-process).

Create a `worker` folder, and create the `main.go` file for the [Worker program](https://docs.temporal.io/workers#worker-program).

```go
package main

import (
	"log"
	"subscribe_emails"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)
```

Create the [Client](https://docs.temporal.io/temporal#temporal-client) and the [Worker Entity](https://docs.temporal.io/workers#worker-entity).

```go
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

	w := worker.New(c, "subscription_emails", worker.Options{})
// ...
}
```

Register the Workflow and Activities to the Worker.

```go
	// register Activity and Workflow
	w.RegisterWorkflow(subscribe_emails.SubscriptionWorkflow)
	w.RegisterActivity(&subscribe_emails.Activities{})
```

Finally, get the Worker to listen to the [Task Queue](https://docs.temporal.io/tasks#task-queue).

```go
	// Listen to Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start Worker.", err)
	}
	log.Println("Worker successfully started.")
```

## Build the gateway

The gateway is our application's way of communicating with an external HTTP server. 
It also serves as the entry point for starting the Workflow Execution.

There are several handlers that make the Subscription possible. These handlers allow us to subscribe, unsubscribe, and get details about the Workflow.
An index handler exists as well.

To begin, create a `gateway` folder with the file `main.go`.
Create a Client in `main.go`.

```go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"subscribe_emails"

	"go.temporal.io/sdk/client"
)

var temporalClient client.Client
var taskQueueName string

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
	_ = http.ListenAndServe(":"+port, nil)
}
```

Create an `index` handler.
When viewed in the browser, it'll create an input field to collect the email needed to kick off the Workflow.

```go
func indexHandler(w http.ResponseWriter, _ *http.Request) {
	_, _ = fmt.Fprint(w, "<h1>Sign up here!")
	_, _ = fmt.Fprint(w, "<form method='post' action='subscribe'><input required name='email' type='email'><input type='submit' value='Subscribe'>")
}
```

### Subscribe handler

The `/subscribe` handler starts the Workflow Execution for the given email address.
The email is used to generate a unique [Workflow ID](https://docs.temporal.io/workflows#workflow-id), meaning only one Workflow can be executed per email address.

<!-- TODO: mention that ID can be reused after a Workflow ends or is terminated. -->

Create a parser for the handler.

```go
func subscribeHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		// in case of any error
		_, _ = fmt.Fprint(w, "<h1>Error processing form</h1>")
		return
	}
// ...

}
```

Get the address from the form, and use it to configure your Workflow Options.

```go
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
	}
```

Define and execute the Workflow within the handler.

```go
// Define the subscription
	subscription := subscribe_emails.Subscription{
		EmailInfo: subscribe_emails.EmailInfo{
			EmailAddress: email,
			Mail: "",
		},
		Periods: subscribe_emails.Periods{
			MaxBillingPeriods: 30,
			BillingPeriodCharge: 10,
		},
	}

	// execute the Temporal Workflow to start the subscription.
	_, err = temporalClient.ExecuteWorkflow(context.Background(), workflowOptions, subscribe_emails.SubscriptionWorkflow, subscription)

	if err != nil {
		_, _ = fmt.Fprint(w, "<h1>Couldn't sign up</h1>")
		log.Print(err)
	} else {
		_, _ = fmt.Fprint(w, "<h1>Signed up!</h1>")
	}
```

### Unsubscribe handler

The `/unsubscribe` handler cancels the Workflow with a given email in its Workflow ID.

For this app, we'll be making use of a switch case to handle what happens when the endpoint gets a response, and when it posts new information to the Workflow Execution.

Start by creating a new function. Define the two cases.

```go
func unsubscribeHandler(w http.ResponseWriter, r *http.Request) {
	
	switch r.Method {

	case "GET":
		// will add more later

	case "POST":
		// will add more later

	}
}
```

Add parsing for the input field, along with an error check.

```go
case "GET":

		// http.ServeFile(w, r, "form.html")
		_, _ = fmt.Fprint(w, "<h1>Unsubscribe</h1><form method='post' action='/unsubscribe'><input required name='email' type='email'><input type='submit' value='Unsubscribe'>")
```
Canceling the Workflow will happen in "POST".
After the Workflow is found for the given email address, let the user know that their subscription has ended.

```go
case "POST":

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

		workflowID := "subscribe_email_" + email

		err = temporalClient.CancelWorkflow(context.Background(), workflowID, "")

		if err != nil {
			_, _ = fmt.Fprint(w, "<h1>Couldn't unsubscribe you</h1>")
			log.Fatalln("Unable to cancel Workflow Execution", err)
		} else {
			_, _ = fmt.Fprint(w, "<h1>Unsubscribed you from our emails. Sorry to see you go.</h1>")
			log.Println("Workflow Execution cancelled", "WorkflowID", workflowID)
		}
```

### Build the `getdetails` endpoint

Like `\unsubscribe`, the `\getdetails` handler incorporates a switch case for getting an email address and receiving information from a Workflow Execution.

First, define the function and the first half of the switch case.

```go
func getDetailsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		// http.ServeFile(w, r, "form.html")
		_, _ = fmt.Fprint(w, "<h1>Get subscription details</h1><form method='post' action='/getdetails'><input required name='email' type='email'><input type='submit' value='GetDetails'>")

// ...
	}
}
```

Define the parser in "POST".
Retrieve the email address.

```go
case "POST":

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
```

Now we handle the Query. 
Define the variables needed to Query the Workflow, and then handle the result.

```go
var workflowID, queryType string
		flag.StringVar(&workflowID, "w", "subscribe_email_" + email, "WorkflowID.")
		flag.StringVar(&queryType, "t", "state", "Query type [state|__stack_trace].")
		flag.Parse()

		// print email, billing period, charge, etc.
		resp, err := temporalClient.QueryWorkflow(context.Background(), workflowID, "", queryType)
		if err != nil {
			log.Fatalln("Unable to query workflow", err)
		}
		var result interface{}
		if err := resp.Get(&result); err != nil {
			log.Fatalln("Unable to decode query result", err)
		}
		log.Println("Received query result", "Result", result)
		fmt.Fprint(w, "Your details have been retrieved.")
```

## Conclusion

The Temporal Go SDk provides the means to build powerful, long-lasting applications. 
With a scenario as scalable as a subscription service, Temporal shows what it can do with the help of Workflows, Activities, and Queries.