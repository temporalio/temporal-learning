## Introduction

Creating reliable applications can be a complex process, often plagued by volatility that seems beyond your control.

In this tutorial, you'll be writing a Workflow for a limited-time Subscription application.
The application will be able to:

1. Send a "welcome" email to the user upon signup.
2. Start the billing process and send subsequent subscription emails.
3. Look up the customer's information regarding:
    - Amount Charged
    - Period number
4. End the subscription when:
    - The maximum amount of billing periods has been reached.
    - The user has chosen to unsubscribe.

This tutorial focuses on implementing an email subscription application with Temporal’s Workflows, Activities, and Queries.
This is achieved by using:

- Activities to send emails
- Queries to retrieve the status of an ongoing subscription
- Cancellation to end the subscription

Not only do you get a more accessible introduction to Temporal Workflow APIs, but we'll also provide an example of how to break down project requirements into Temporal logic.

:::tip Skip ahead

**To skip straight to a fully working example, check out the Subscription Workflow in Go repository.

:::

## Prerequisites 

Before starting this tutorial, make sure that you've set up:
- Temporal Server
- Temporal Go SDK
- Go 1.17+

If you plan to implement APIs for sending emails and billing, make sure those are set up as well. 
This tutorial will be mocking actual emails and billing.

## Create the project

In your code editor, create a new project.

## Develop the Workflow

A Workflow starts with a Workflow Definition—a sequence of steps defined in code that are carried out in a Workflow Execution.
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

Next, create a function to handle cancellation.

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
While Activities are optimal for interacting with outside APIs, the Activity Definition in this tutorial will mock this behavior.

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

In order to execute the code we've defined so far, we'll need to create a Worker Process.

Create a `worker` folder, and create the `main.go` file that will be executed.

```go
package main

import (
	"log"
	"subscribe_emails"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)
```

Create the Client and the Worker.

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

Finally, get the Worker to listen to the Task Queue.

```go
	// Listen to Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start Worker.", err)
	}
	log.Println("Worker successfully started.")
```

## Build the gateway
