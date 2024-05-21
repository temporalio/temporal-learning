// @@@SNIPSTART setup-chapter-worker-cloud
package main

import (
	"crypto/tls"
	"log"
	"os"

	"github.com/joho/godotenv"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"

	"background-check-tutorialchapters/setup/activities"
	"background-check-tutorialchapters/setup/workflows"
)

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalln("Unable to load environment variables from file", err)
	}
	// Get the key and cert from your env or local machine
	clientKeyPath := "./ca.key"
	clientCertPath := "./ca.pem"
	// Use the crypto/tls package to create a cert object
	cert, err := tls.LoadX509KeyPair(clientCertPath, clientKeyPath)
	if err != nil {
		log.Fatalln("Unable to load cert and key pair.", err)
	}
	// Specify the host and port of your Temporal Cloud Namespace
	// Host and port format: namespace.unique_id.tmprl.cloud:port
	namespace := os.Getenv("TEMPORAL_CLOUD_NAMESPACE")
	port := os.Getenv("TEMPORAL_CLOUD_PORT")
	hostPort := namespace + ".tmprl.cloud:" + port
	// Create a new Temporal Client
	// Specify Namespace, Hostport and tls certificates in the ConnectionOptions
	temporalClient, err := client.Dial(client.Options{
		HostPort:  hostPort,
		Namespace: namespace,
		ConnectionOptions: client.ConnectionOptions{
			TLS: &tls.Config{Certificates: []tls.Certificate{cert}},
		},
	})
	if err != nil {
		log.Fatalln("Unable to connect to Temporal Cloud.", err)
	}
	defer temporalClient.Close()
	// Create a new Worker
	yourWorker := worker.New(temporalClient, "backgroundcheck-boilerplate-task-queue-cloud", worker.Options{})
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