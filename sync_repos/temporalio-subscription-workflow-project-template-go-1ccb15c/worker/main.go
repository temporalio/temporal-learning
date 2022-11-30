// @@@SNIPSTART subscription-go-worker-start
package main

import (
	"log"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"

	"subscription-workfow"
)

func main() {
	// The client and Worker are heavyweight objects that should be created once per process.
	c, err := client.NewClient(client.Options{})
	if err != nil {
		log.Fatalln("Unable to create client", err)
	}
	defer c.Close()

	w := worker.New(c, "SubscriptionsTaskQueueGo", worker.Options{})

	w.RegisterWorkflow(subscription.SubscriptionWorkflow)
	w.RegisterActivity(&subscription.Activities{})

	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start worker", err)
	}
}
// @@@SNIPEND
