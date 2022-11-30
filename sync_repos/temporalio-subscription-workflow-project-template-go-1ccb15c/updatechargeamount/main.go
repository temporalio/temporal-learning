// @@@SNIPSTART subscription-go-updatechargeamount-signal
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

	// Signal all workflows and update charge amount to 300 for next billing period
	for i := 0; i < 5; i++ {
		err = c.SignalWorkflow(context.Background(),
			"SubscriptionsWorkflowId-"+strconv.Itoa(i), "", "billingperiodcharge", 300)
		if err != nil {
			log.Fatalln("Unable to signal workflow", err)
		}
	}
}
// @@@SNIPEND
