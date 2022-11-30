// @@@SNIPSTART subscription-go-cancel-subscription-signal
package main

import (
	"context"
	"log"
	"strconv"

	"go.temporal.io/sdk/client"
)

func main() {
	// The client is a heavyweight object that should be created once per process.
	c, err := client.NewClient(client.Options{})
	if err != nil {
		log.Fatalln("Unable to create client", err)
	}
	defer c.Close()

	// Signal all Workflow Executions and cancel the subscription
	for i := 0; i < 5; i++ {
		err = c.SignalWorkflow(context.Background(),
			"SubscriptionsWorkflowId-"+strconv.Itoa(i), "", "cancelsubscription", true)
		if err != nil {
			log.Fatalln("Unable to signal workflow", err)
		}
	}
}
// @@@SNIPEND
