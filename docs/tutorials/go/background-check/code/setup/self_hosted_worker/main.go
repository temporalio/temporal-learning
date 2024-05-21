// @@@SNIPSTART setup-chapter-worker-self-hosted
package main

import (
	"log"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"

	"background-check-tutorialchapters/setup/activities"
	"background-check-tutorialchapters/setup/workflows"
)

/**
Set IP address, port, and Namespace in the Temporal Client options.
**/

func main() {
	// Initialize a Temporal Client
	// Specify the IP, port, and Namespace in the Client options
	clientOptions := client.Options{
		HostPort:  "172.18.0.4:7233",
		Namespace: "backgroundcheck_namespace",
	}
	temporalClient, err := client.Dial(clientOptions)
	if err != nil {
		log.Fatalln("Unable to create a Temporal Client", err)
	}
	defer temporalClient.Close()
	// Create a new Worker
	yourWorker := worker.New(temporalClient, "backgroundcheck-boilerplate-task-queue-self-hosted", worker.Options{})
	// Register Workflows
	yourWorker.RegisterWorkflow(workflows.BackgroundCheck)
	// Register Activities
	yourWorker.RegisterActivity(activities.SSNTraceActivity)
	// Start the Worker Process
	err = yourWorker.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start the Worker Process", err)
	}
}

// @@@SNIPEND
