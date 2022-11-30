// @@@SNIPSTART subscription-go-workflow-execution-starter
package main

import (
	"context"
	"log"
	"strconv"
	"subscription-workfow"
	"time"

	"go.temporal.io/sdk/client"
)

func main() {
	// The client is a heavyweight object that should be created once per process.
	c, err := client.NewClient(client.Options{})
	if err != nil {
		log.Fatalln("Unable to create client", err)
	}
	defer c.Close()

	// default subscription
	sub :=
		subscription.Subscription{
			TrialPeriod:         time.Second * 10,
			BillingPeriod:       time.Second * 10,
			MaxBillingPeriods:   24,
			BillingPeriodCharge: 120,
		}

	// create Workflow Execution for 5 customers
	for i := 0; i < 5; i++ {
		cust := subscription.Customer{
			FirstName:    "First Name" + strconv.Itoa(i),
			LastName:     "Last Name" + strconv.Itoa(i),
			Email:        "someemail" + strconv.Itoa(i),
			Subscription: sub,
			Id:           "Id-" + strconv.Itoa(i),
		}

		workflowOptions := client.StartWorkflowOptions{
			ID:                 "SubscriptionsWorkflow" + cust.Id,
			TaskQueue:          "SubscriptionsTaskQueueGo",
			WorkflowRunTimeout: time.Minute * 10,
		}

		we, err := c.ExecuteWorkflow(context.Background(), workflowOptions, subscription.SubscriptionWorkflow, cust)
		if err != nil {
			log.Fatalln("Unable to execute workflow", err)
		}

		log.Println("Started workflow", "WorkflowID", we.GetID(), "RunID", we.GetRunID())

	}
}
// @@@SNIPEND
