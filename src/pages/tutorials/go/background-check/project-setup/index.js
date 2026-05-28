import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIAL_STEPS = [
  { n: 1, label: "Introduction", href: "/tutorials/go/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/go/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/go/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "install-cli", label: "Install the Temporal CLI" },
  { id: "choose-dev-cluster", label: "Choose a development Cluster" },
  { id: "boilerplate-project", label: "Boilerplate Temporal Application project code" },
  { id: "start-workflow", label: "Start Workflow using the CLI" },
  { id: "test-framework", label: "Add a testing framework" },
];

const IMG_BASE = "/img/tutorials/go/background-check";

const PROJECT_TREE_MONOREPO = `/monorepo
    /shared_activities
        | payment.go
        | send_email.go
    /shared_tests
        | tests.go
    /backgroundcheck
        /workflows
            | backgroundcheck.go
        /activities
            | ssntrace.go
        /worker
            | main.go
        /tests
            | tests.go
    /loanapplication
        /workflows
            | loanapplication.go
        /activities
            | creditcheck.go
        /worker
            | main.go
        /tests
            | tests.go`;

const PROJECT_TREE_TUTORIAL = `/backgroundcheck
    /workflows
        | backgroundcheck.go
    /activities
        | ssntrace.go
    /worker
        | main.go
    /tests
        | tests.go`;

const GO_MOD_INIT = `mkdir backgroundcheck
cd backgroundcheck
go mod init github.com/your_name/backgroundcheck`;

const WORKFLOW_GO = `package workflows

import (
\t"time"

\t"go.temporal.io/sdk/workflow"

\t"background-check-tutorialchapters/setup/activities"
)

// BackgroundCheck is your custom Workflow Definition.
func BackgroundCheck(ctx workflow.Context, param string) (string, error) {
\t// Define the Activity Execution options
\t// StartToCloseTimeout or ScheduleToCloseTimeout must be set
\tactivityOptions := workflow.ActivityOptions{
\t\tStartToCloseTimeout: 10 * time.Second,
\t}
\tctx = workflow.WithActivityOptions(ctx, activityOptions)
\t// Execute the Activity synchronously (wait for the result before proceeding)
\tvar ssnTraceResult string
\terr := workflow.ExecuteActivity(ctx, activities.SSNTraceActivity, param).Get(ctx, &ssnTraceResult)
\tif err != nil {
\t\treturn "", err
\t}
\t// Make the results of the Workflow available
\treturn ssnTraceResult, nil
}`;

const ACTIVITY_GO = `package activities

import (
\t"context"
)

// SSNTraceActivity is your custom Activity Definition.
func SSNTraceActivity(ctx context.Context, param string) (*string, error) {
\t// This is where a call to another service is made
\t// Here we are pretending that the service that does SSNTrace returned "pass"
\tresult := "pass"
\treturn &result, nil
}`;

const DEV_WORKER_GO = `package main

import (
\t"log"

\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"

\t"background-check-tutorialchapters/setup/activities"
\t"background-check-tutorialchapters/setup/workflows"
)

func main() {
\t// Initialize a Temporal Client
\t// Specify the Namespace in the Client options
\tclientOptions := client.Options{
\t\tNamespace: "backgroundcheck_namespace",
\t}
\ttemporalClient, err := client.Dial(clientOptions)
\tif err != nil {
\t\tlog.Fatalln("Unable to create a Temporal Client", err)
\t}
\tdefer temporalClient.Close()
\t// Create a new Worker
\tyourWorker := worker.New(temporalClient, "backgroundcheck-boilerplate-task-queue-local", worker.Options{})
\t// Register Workflows
\tyourWorker.RegisterWorkflow(workflows.BackgroundCheck)
\t// Register Activities
\tyourWorker.RegisterActivity(activities.SSNTraceActivity)
\t// Start the Worker Process
\terr = yourWorker.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("Unable to start the Worker Process", err)
\t}
}`;

const CLOUD_WORKER_GO = `package main

import (
\t"crypto/tls"
\t"log"
\t"os"

\t"github.com/joho/godotenv"

\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"

\t"background-check-tutorialchapters/setup/activities"
\t"background-check-tutorialchapters/setup/workflows"
)

func main() {
\terr := godotenv.Load(".env")
\tif err != nil {
\t\tlog.Fatalln("Unable to load environment variables from file", err)
\t}
\t// Get the key and cert from your env or local machine
\tclientKeyPath := "./ca.key"
\tclientCertPath := "./ca.pem"
\t// Use the crypto/tls package to create a cert object
\tcert, err := tls.LoadX509KeyPair(clientCertPath, clientKeyPath)
\tif err != nil {
\t\tlog.Fatalln("Unable to load cert and key pair.", err)
\t}
\t// Specify the host and port of your Temporal Cloud Namespace
\t// Host and port format: namespace.unique_id.tmprl.cloud:port
\tnamespace := os.Getenv("TEMPORAL_CLOUD_NAMESPACE")
\tport := os.Getenv("TEMPORAL_CLOUD_PORT")
\thostPort := namespace + ".tmprl.cloud:" + port
\t// Create a new Temporal Client
\t// Specify Namespace, Hostport and tls certificates in the ConnectionOptions
\ttemporalClient, err := client.Dial(client.Options{
\t\tHostPort:  hostPort,
\t\tNamespace: namespace,
\t\tConnectionOptions: client.ConnectionOptions{
\t\t\tTLS: &tls.Config{Certificates: []tls.Certificate{cert}},
\t\t},
\t})
\tif err != nil {
\t\tlog.Fatalln("Unable to connect to Temporal Cloud.", err)
\t}
\tdefer temporalClient.Close()
\t// Create a new Worker
\tyourWorker := worker.New(temporalClient, "backgroundcheck-boilerplate-task-queue-cloud", worker.Options{})
\t// Register Workflows
\tyourWorker.RegisterWorkflow(workflows.BackgroundCheck)
\t// Register Activities
\tyourWorker.RegisterActivity(activities.SSNTraceActivity)
\t// Start the Worker Process
\terr = yourWorker.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("Unable to start the Worker Process", err)
\t}
}`;

const DOCKER_COMPOSE_YML = `services:
  # ...
  temporal:
    container_name: temporal
    # ...
    networks:
      - temporal-network
    ports:
      - 7233:7233
    # ...
  # ...`;

const DOCKER_INSPECT_JSON = `[
  {
    "Name": "temporal-network",
    // ...
    "Containers": {
      // ...
      "53cf62f0cc6cfd2a9627a2b5a4c9f48ffe5a858f0ef7b2eaa51bf7ea8fd0e86f": {
        "Name": "temporal",
        // ...
        "IPv4Address": "172.18.0.4/16"
        // ...
      }
      // ...
    }
    // ...
  }
]`;

const SELF_HOSTED_WORKER_GO = `package main

import (
\t"log"

\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"

\t"background-check-tutorialchapters/setup/activities"
\t"background-check-tutorialchapters/setup/workflows"
)

/**
Set IP address, port, and Namespace in the Temporal Client options.
**/

func main() {
\t// Initialize a Temporal Client
\t// Specify the IP, port, and Namespace in the Client options
\tclientOptions := client.Options{
\t\tHostPort:  "172.18.0.4:7233",
\t\tNamespace: "backgroundcheck_namespace",
\t}
\ttemporalClient, err := client.Dial(clientOptions)
\tif err != nil {
\t\tlog.Fatalln("Unable to create a Temporal Client", err)
\t}
\tdefer temporalClient.Close()
\t// Create a new Worker
\tyourWorker := worker.New(temporalClient, "backgroundcheck-boilerplate-task-queue-self-hosted", worker.Options{})
\t// Register Workflows
\tyourWorker.RegisterWorkflow(workflows.BackgroundCheck)
\t// Register Activities
\tyourWorker.RegisterActivity(activities.SSNTraceActivity)
\t// Start the Worker Process
\terr = yourWorker.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("Unable to start the Worker Process", err)
\t}
}`;

const DOCKERFILE = `FROM golang:1.20 AS builder

WORKDIR /app

COPY . .

RUN go get
RUN go build -o bin ./self_hosted/main_dacx.go

ENTRYPOINT ["/app/bin"]`;

const START_WORKFLOW_LOCAL = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-local \\
 --type BackgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace \\
 --workflow-id backgroundcheck_workflow`;

const START_WORKFLOW_CLOUD = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-cloud \\
 --type BackgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace <namespace>.<account-id> \\
 --workflow-id backgroundcheck_workflow \\
 --address <namespace>.<account-id>.tmprl.cloud:<port> \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key`;

const ENV_SET_BLOCK = `# set Cloud env variables
temporal env set cloud.namespace <namespace>.<account-id>
temporal env set cloud.address <namespace>.<account-id>.tmprl.cloud:<port>
temporal env set cloud.tls-cert-path ca.pem
temporal env set cloud.tls-key-path ca.key
# set local env variables
temporal env set local.namespace <namespace>`;

const ENV_USE_BLOCK = `temporal workflow start \\
 # ...
 --env cloud \\
 # ...`;

const LIST_WORKFLOWS_CLOUD = `temporal workflow list \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key \\
 --namespace <namespace>.<account-id> \\
 --address <namespace>.<account-id>.tmprl.cloud:<port>`;

const START_WORKFLOW_SELF_HOSTED = `temporal_docker workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-self-hosted \\
 --type BackgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace \\
 --workflow-id backgroundcheck_workflow`;

const TEST_FRAMEWORK_GO = `package setup

import (
\t"testing"

\t"github.com/stretchr/testify/mock"
\t"github.com/stretchr/testify/suite"
\t"go.temporal.io/sdk/testsuite"

\t"background-check-tutorialchapters/setup/activities"
\t"background-check-tutorialchapters/setup/workflows"
)

// UnitTestSuite is a struct that wraps around the testing suites
type UnitTestSuite struct {
\t// Add testify test suite package
\tsuite.Suite
\t// Add the Temporal Go SDK Workflow test suite
\ttestsuite.WorkflowTestSuite
}

// Test_BackgroundCheckApplication runs the full set of tests in this application.
func Test_BackgroundCheckApplication(t *testing.T) {
\ts := &UnitTestSuite{}
\tsuite.Run(t, s)
}`;

const TEST_WORKFLOW_GO = `const ssn string = "555-55-5555"

// Test_BackgroundCheckWorkflow tests the BackgroundCheck Workflow function
func (s *UnitTestSuite) Test_BackgroundCheckWorkflow() {
\t// Initialize a Temporal Go SDK Workflow test environment.
\t// The best practice is to create a new environment for each Workflow test.
\t// Doing so ensures that each test runs in its own isolated sandbox.
\tenv := s.NewTestWorkflowEnvironment()
\t// Mock the Activity Execution for the Workflow
\tssnTraceResult := "pass"
\tenv.OnActivity(activities.SSNTraceActivity, mock.Anything, ssn).Return(&ssnTraceResult, nil)
\t// Run the Workflow in the test environment
\tenv.ExecuteWorkflow(workflows.BackgroundCheck, ssn)
\t// Check that the Workflow reach a completed status
\ts.True(env.IsWorkflowCompleted())
\t// Check whether the Workflow returned an error
\ts.NoError(env.GetWorkflowError())
\t// Check that no error is returned while getting the result
\t// And check for the expected value of the Workflow result
\tvar result string
\ts.NoError(env.GetWorkflowResult(&result))
\ts.Equal(result, ssnTraceResult)
}`;

const TEST_ACTIVITY_GO = `// Test_SSNTraceActivity tests the SSNTraceActivity function
func (s *UnitTestSuite) Test_SSNTraceActivity() {
\t// Create a test environment
\tenv := s.NewTestActivityEnvironment()
\t// Register Activity with the enviroment
\tenv.RegisterActivity(activities.SSNTraceActivity)
\t// Run the Activity in the test enviroment
\tfuture, err := env.ExecuteActivity(activities.SSNTraceActivity, ssn)
\t// Check there was no error on the call to execute the Activity
\ts.NoError(err)
\t// Check that there was no error returned from the Activity
\tvar result string
\ts.NoError(future.Get(&result))
\t// Check for the expected return value.
\ts.Equal("pass", result)
}`;

const GOW_BLOCK = `go install github.com/mitranim/gow@latest
gow worker/main.go # automatically restarts when the project files change`;

const DOCKER_COMPOSE_UP = `git clone https://github.com/temporalio/docker-compose.git
cd  docker-compose
docker compose up`;

export default function ProjectSetupPage() {
  return (
    <Layout
      title="Project setup - Build a Background Check application with Go"
      description="Chapter 2: Install the Temporal CLI, set up a Go project, run a Worker, start a Workflow, and add a testing framework."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_go.png"
            alt="Temporal Go SDK"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Go", href: "/tutorials/go" },
                  { label: "Background Check", href: "/tutorials/go/background-check/" },
                  { label: "Project setup" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a Temporal Application project
            </h1>

            <MetaChips items={["~45 minutes", "Intermediate", "Go"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              The first step to creating a new Temporal Application is to set
              up your development environment. This chapter walks through the
              steps to do that using the Go SDK.
            </p>

            <Admonition type="tip" title="Construct a new Temporal Application project">
              <p>
                This chapter covers the minimum set of concepts and
                implementation details needed to build and run a Temporal
                Application using Go.
              </p>
              <p>
                By the end of this section you will know how to construct a
                new Temporal Application project.
              </p>
              <p>Learning objectives:</p>
              <ul>
                <li>Describe the tools available and recommended to develop Workflows.</li>
                <li>Describe the code that actually forms a Temporal application.</li>
                <li>Implement an appropriate testing framework.</li>
              </ul>
              <p>
                Much of the information in this chapter is also covered in the{" "}
                <a
                  href="https://learn.temporal.io/courses/temporal_101/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal 101 course
                </a>
                .
              </p>
            </Admonition>

            <p>
              This chapter introduces the{" "}
              <a
                href="https://learn.temporal.io/examples/go/background-checks/#what-is-the-real-life-use-case"
                target="_blank"
                rel="noopener noreferrer"
              >
                Background Check use case
              </a>{" "}
              and a sample application as a means to contextualize the
              information. Future tutorial chapters build on this use case and
              sample application.
            </p>

            <p>There are three ways to follow this guide:</p>
            <ul>
              <li>Use a local dev server</li>
              <li>Use Temporal Cloud</li>
              <li>Use a self-hosted environment such as Docker</li>
            </ul>

            <p>In this chapter you will do the following:</p>
            <ol>
              <li>Download the Temporal CLI.</li>
              <li>Choose your development Cluster.</li>
              <li>Create a Namespace on your development Cluster.</li>
              <li>Copy boilerplate code into your IDE.</li>
              <li>Run the Worker.</li>
              <li>Start the Workflow using the CLI.</li>
              <li>Explore the Web UI to view the status of the Workflow and confirm polling Workers.</li>
              <li>Add a testing framework and unit tests to the application.</li>
              <li>Run the application unit tests.</li>
            </ol>

            <section className={styles.section} id="install-cli">
              <h2 className={styles.sectionTitle}>Install the Temporal CLI</h2>
              <p>
                <strong>How to download and install the Temporal CLI</strong>
              </p>
              <p>The Temporal CLI is available on macOS, Windows, and Linux.</p>

              <h3>macOS</h3>
              <p>
                <strong>Install the Temporal CLI with Homebrew</strong>
              </p>
              <CodeBlock language="bash">brew install temporal</CodeBlock>
              <p>
                <strong>Install the Temporal CLI from CDN</strong>
              </p>
              <ol>
                <li>
                  Select the platform and architecture needed.
                  <ul>
                    <li>
                      Download for Darwin amd64:{" "}
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=darwin&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        temporal.download
                      </a>
                    </li>
                    <li>
                      Download for Darwin arm64:{" "}
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=darwin&arch=arm64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        temporal.download
                      </a>
                    </li>
                  </ul>
                </li>
                <li>Extract the downloaded archive.</li>
                <li>
                  Add the <code>temporal</code> binary to your PATH.
                </li>
              </ol>

              <h3>Linux</h3>
              <p>
                <strong>Install the Temporal CLI with Homebrew</strong>
              </p>
              <CodeBlock language="bash">brew install temporal</CodeBlock>
              <p>
                <strong>Install the Temporal CLI from CDN</strong>
              </p>
              <ol>
                <li>
                  Select the platform and architecture needed.
                  <ul>
                    <li>
                      Download for Linux amd64:{" "}
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=linux&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        temporal.download
                      </a>
                    </li>
                    <li>
                      Download for Linux arm64:{" "}
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=linux&arch=arm64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        temporal.download
                      </a>
                    </li>
                  </ul>
                </li>
                <li>Extract the downloaded archive.</li>
                <li>
                  Add the <code>temporal</code> binary to your PATH.
                </li>
              </ol>

              <h3>Windows</h3>
              <p>
                <strong>Install the Temporal CLI from CDN</strong>
              </p>
              <ol>
                <li>
                  Select the platform and architecture needed and download the binary.
                  <ul>
                    <li>
                      Download for Windows amd64:{" "}
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=windows&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        temporal.download
                      </a>
                    </li>
                    <li>
                      Download for Windows arm64:{" "}
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=windows&arch=arm64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        temporal.download
                      </a>
                    </li>
                  </ul>
                </li>
                <li>Extract the downloaded archive.</li>
                <li>
                  Add the <code>temporal.exe</code> binary to your PATH.
                </li>
              </ol>
            </section>

            <section className={styles.section} id="choose-dev-cluster">
              <h2 className={styles.sectionTitle}>Choose a development Cluster</h2>
              <p>
                <strong>Which development Cluster should you choose?</strong>
              </p>
              <p>
                We recommend choosing a development environment based on your
                requirements.
              </p>
              <p>
                The source code for the Temporal Server (the orchestrating
                component of the Temporal Cluster) is licensed under the MIT
                open source license. So, in theory, anyone can take the
                Temporal Server code and run their Temporal Platform in any
                number of creative ways.
              </p>
              <p>
                However, for most developers we recommend starting by choosing
                one of the following:
              </p>
              <ul>
                <li>Local development server</li>
                <li>Temporal Cloud</li>
                <li>Self-hosted Temporal Cluster</li>
              </ul>

              <Admonition type="info" title="Temporal does not directly run your code">
                <p>
                  Keep in mind that in every scenario, the "Temporal Platform"
                  does not host and run your Workers (application code). It is
                  up to you, the developer, to host your application code. The
                  Temporal Platform ensures that properly written code durably
                  executes in the face of platform-level failures.
                </p>
              </Admonition>

              <h3>Local dev server</h3>
              <p>
                <strong>When to use a local development server?</strong>
              </p>
              <p>
                We recommend using the local development server if you are new
                to Temporal, or want to start something from scratch and don't
                have a self-hosted environment ready or want to pay for a
                Temporal Cloud account.
              </p>
              <p>
                The Temporal CLI comes bundled with a development server and
                provides a fast way to start running Temporal Applications.
              </p>
              <p>
                However, the local development server does not emit any
                metrics. If you are eager to set up Cluster-level metrics for
                performance tuning, we recommend using a self-hosted Cluster
                or Temporal Cloud.
              </p>

              <h4>Start the dev server</h4>
              <p>
                <strong>How to start a local development server</strong>
              </p>
              <p>
                If you have successfully installed the Temporal CLI, open a
                new terminal and run the following command:
              </p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                This command automatically starts the Temporal Web UI, creates
                a default Namespace, and creates an in-memory database.
              </p>
              <p>
                The Temporal Web UI serves to{" "}
                <a
                  href="http://localhost:8233/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233
                </a>
                .
              </p>
              <p>
                For more command details and options, see the{" "}
                <a
                  href="https://docs.temporal.io/cli/server#start-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CLI reference
                </a>
                .
              </p>

              <h4>Create a custom Namespace</h4>
              <p>
                <strong>How to create a Namespace on the development server</strong>
              </p>
              <p>
                The development server automatically creates a default
                Namespace (named "default") when it starts up. However, you'll
                create a custom one for the application. Since this is
                recommended at a production level, it's worth practicing it
                with the development server.
              </p>
              <p>
                Use the <code>temporal operator namespace create</code> command
                using the Temporal CLI to create a Namespace on the
                development server.
              </p>
              <CodeBlock language="bash">
                temporal operator namespace create backgroundcheck_namespace
              </CodeBlock>
              <p>
                For command details and options, see the{" "}
                <a
                  href="https://docs.temporal.io/cli/operator#create"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CLI reference
                </a>
                .
              </p>

              <h3>Temporal Cloud</h3>
              <p>
                <strong>When to use Temporal Cloud</strong>
              </p>
              <p>
                If you do not have a Temporal Cloud Account, you can request
                one using the link on the{" "}
                <a
                  href="https://docs.temporal.io/cloud/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Started with Temporal Cloud
                </a>{" "}
                guide.
              </p>
              <p>
                We recommend starting off with Temporal Cloud if you already
                have a production use case, or need to move a scalable proof of
                concept into production.
              </p>
              <p>
                In other words, Temporal Cloud is perfect if you are ready to
                run at scale and don't want the overhead of managing your own
                self-hosted Cluster.
              </p>
              <p>
                To create a Namespace in Temporal Cloud, follow the
                instructions in{" "}
                <a
                  href="https://docs.temporal.io/cloud/namespaces#create-a-namespace"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to create a Namespace
                </a>
                .
              </p>

              <Admonition type="info" title="Safely store your certificate and private key">
                <p>
                  Store certificates and private keys generated for your
                  Namespace as files or environment variables in your project.
                  You need access to your certificate and key to run your
                  Workers and start Workflows.
                </p>
                <p>
                  For more information on certificate requirements, see{" "}
                  <a
                    href="https://docs.temporal.io/cloud/certificates"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How to manage certificates in Temporal Cloud
                  </a>
                  .
                </p>
              </Admonition>

              <h3>Self-hosted Temporal Cluster</h3>
              <p>
                We recommend using a self-hosted environment if you are
                starting something new and need to scale with production-level
                features, but don't yet need or want to pay for Temporal
                Cloud.
              </p>
              <p>
                For example, running a self-hosted Cluster lets you try
                different databases, view Cluster metrics, use custom{" "}
                <a
                  href="https://docs.temporal.io/visibility#search-attribute"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Search Attributes
                </a>
                , and even play with the{" "}
                <a
                  href="https://docs.temporal.io/clusters#archival"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Archival
                </a>{" "}
                feature.
              </p>
              <p>
                For the purposes of this guide, we show how to use a
                self-hosted environment that runs completely out of Docker.
                Note that it takes a fair amount of experience to elevate from
                a self-hosted environment in Docker to something that can run
                at an enterprise production scale. The self-hosted information
                in this guide should help you make more informed decisions.
              </p>
              <p>To follow along with self-hosted parts of this guide, install the following:</p>
              <ul>
                <li>
                  <a
                    href="https://docs.docker.com/engine/install"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docker
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.docker.com/compose/install"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docker Compose
                  </a>
                  .
                </li>
              </ul>
              <p>
                Then, clone the{" "}
                <a
                  href="https://github.com/temporalio/docker-compose.git"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/docker-compose
                </a>{" "}
                repository, change directory into the project root, and run{" "}
                <code>docker compose up</code>.
              </p>
              <CodeBlock language="bash">{DOCKER_COMPOSE_UP}</CodeBlock>
              <p>Create a command alias for the Temporal CLI:</p>
              <CodeBlock language="bash">
                alias temporal_docker="docker exec temporal-admin-tools temporal"
              </CodeBlock>
              <p>Create a Namespace.</p>
              <CodeBlock language="bash">
                temporal_docker operator namespace create backgroundcheck_namespace
              </CodeBlock>
            </section>

            <section className={styles.section} id="boilerplate-project">
              <h2 className={styles.sectionTitle}>
                Boilerplate Temporal Application project code
              </h2>
              <p>
                <strong>
                  What is the minimum code I need to create a boilerplate
                  Temporal Application?
                </strong>
              </p>
              <p>
                Let's start with a single Activity Workflow and register those
                functions with a Worker.
              </p>
              <p>
                After we get the Worker running and have started a Workflow
                Execution, we'll add a testing framework.
              </p>

              <h3>Project structure</h3>
              <p>
                You can organize Temporal Application code to suit various
                needs in a way that aligns with the idiomatic style of the
                language you are working in. This includes structuring your
                files according to your organization's best practices.
              </p>
              <p>However, there are some general ways to think about organizing code.</p>
              <p>
                The best practice is to group Workflows together, Activities
                together, and separate your Worker process into a standalone
                file. Often this happens respectively per use case, business
                process, or domain.
              </p>
              <p>
                For monorepo-style organizational techniques, consider a
                designated Workflow directory for each use case and place each
                Workflow in its own file, but also maintain a dedicated place
                for shared Activities.
              </p>
              <p>For example, your project structure could look like this:</p>
              <CodeBlock>{PROJECT_TREE_MONOREPO}</CodeBlock>
              <p>If you are following along with this guide, your project will look like this:</p>
              <CodeBlock>{PROJECT_TREE_TUTORIAL}</CodeBlock>

              <h3>Initialize Go project dependency framework</h3>
              <p>
                If you have created a similar project structure as noted
                earlier, run <code>go mod init</code> to create a new Go module
                for this project. The module name will be something like{" "}
                <code>&lt;your_name&gt;/backgroundcheck</code>:
              </p>
              <CodeBlock language="bash">{GO_MOD_INIT}</CodeBlock>
              <p>
                Then, use <code>go get</code> to install the Temporal Go SDK:
              </p>
              <CodeBlock language="bash">go get go.temporal.io/sdk</CodeBlock>

              <h3>Boilerplate Workflow code</h3>
              <p>
                In the Temporal Go SDK programming model, a{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definition
                </a>{" "}
                is an exportable function. The <code>BackgroundCheck</code>{" "}
                function below is an example of a basic Workflow Definition.
              </p>
              <CodeBlock language="go" title="setup/workflows/backgroundcheck.go" showLineNumbers>
                {WORKFLOW_GO}
              </CodeBlock>
              <p>
                The first parameter of a Go-based Workflow Definition must be
                of the{" "}
                <a
                  href="https://pkg.go.dev/go.temporal.io/sdk/workflow#Context"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>workflow.Context</code>
                </a>{" "}
                type. It is used by the Temporal Go SDK to pass around
                Workflow Execution context, and virtually all the Go SDK APIs
                that are callable from the Workflow require it. It is acquired
                from the{" "}
                <a
                  href="https://pkg.go.dev/go.temporal.io/sdk/workflow"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>go.temporal.io/sdk/workflow</code>
                </a>{" "}
                package.
              </p>
              <p>
                The <code>workflow.Context</code> entity operates similarly to
                the standard <code>context.Context</code> entity provided by
                Go. The only difference between <code>workflow.Context</code>{" "}
                and <code>context.Context</code> is that the <code>Done()</code>{" "}
                function, provided by <code>workflow.Context</code>, returns{" "}
                <code>workflow.Channel</code> instead of the standard Go{" "}
                <code>chan</code>.
              </p>
              <p>
                Additional parameters can be passed to the Workflow when it is
                invoked. A Workflow Definition may support multiple custom
                parameters, or none. All Workflow Definition parameters must
                be serializable and can't be channels, functions, variadic, or
                unsafe pointers.
              </p>
              <p>
                To spawn an{" "}
                <a
                  href="https://docs.temporal.io/activities#activity-execution"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity Execution
                </a>
                , call{" "}
                <a
                  href="https://pkg.go.dev/go.temporal.io/sdk/workflow#hdr-Execute_Activity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>ExecuteActivity()</code>
                </a>{" "}
                inside your Workflow Definition. The API is available from the{" "}
                <code>go.temporal.io/sdk/workflow</code> package. The{" "}
                <code>ExecuteActivity()</code> API call requires an instance of{" "}
                <code>workflow.Context</code>, the Activity function name, and
                any variables to be passed to the Activity Execution.
              </p>
              <p>
                A Go-based Workflow Definition can return either just an{" "}
                <code>error</code> or a <code>customValue, error</code>{" "}
                combination. We'll get into the best practices around Workflow
                params and returns in one of the next sections.
              </p>
              <p>
                In regards to code organization, we recommend organizing
                Workflow code together with other Workflow code. For example,
                in a small project like this, it is still a best practice to
                have a dedicated file for each Workflow.
              </p>

              <h3>Boilerplate Activity code</h3>
              <p>
                In the Temporal Go SDK programming model, an Activity is an
                exportable function or a <code>struct</code> method. Below is
                an example of an Activity defined as a function.
              </p>
              <CodeBlock language="go" title="setup/activities/ssntraceactivity.go">
                {ACTIVITY_GO}
              </CodeBlock>
              <p>
                The first parameter of an Activity Definition is{" "}
                <code>context.Context</code>. This parameter is optional for
                an Activity Definition, though it is recommended, especially
                if the Activity is expected to use other Go SDK APIs.
              </p>
              <p>
                An Activity Definition can support as many other custom
                parameters as needed. However, all parameters must be
                serializable. For example, parameters can't be channels,
                functions, variadic, or unsafe pointers.
              </p>

              <h3>Run a dev server Worker</h3>
              <p>
                To run a Worker Process with a local development server,
                define the following steps in code:
              </p>
              <ul>
                <li>Initialize a Temporal Client.</li>
                <li>Create a new Worker by passing the Client to the creation call.</li>
                <li>Register the application's Workflow and Activity functions.</li>
                <li>Call run on the Worker.</li>
              </ul>
              <p>
                In regards to organization, we recommend keeping Worker code
                separate from Workflow and Activity code.
              </p>
              <CodeBlock language="go" title="setup/dev_server_worker/main.go">
                {DEV_WORKER_GO}
              </CodeBlock>

              <Admonition type="info" title="Auto restart worker when code changes">
                <p>
                  Use{" "}
                  <a
                    href="https://github.com/mitranim/gow"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>gow</code>
                  </a>{" "}
                  to automatically restart the Worker Process whenever any of
                  the Go code files in your project change.
                </p>
                <CodeBlock language="bash">{GOW_BLOCK}</CodeBlock>
              </Admonition>

              <h3>Run a Temporal Cloud Worker</h3>
              <p>
                A Temporal Cloud Worker requires that you specify the
                following in the Client connection options:
              </p>
              <ul>
                <li>Temporal Cloud Namespace</li>
                <li>Temporal Cloud Address</li>
                <li>Certificate and private key associated with the Namespace</li>
              </ul>
              <CodeBlock language="go" title="setup/cloud_worker/main.go">
                {CLOUD_WORKER_GO}
              </CodeBlock>
              <p>
                To run a Temporal Cloud Worker, you'll change some parameters
                in your Client connection code, such as updating the
                namespace and gRPC endpoint. You'll use:
              </p>
              <ul>
                <li>
                  The{" "}
                  <a
                    href="https://docs.temporal.io/cloud/namespaces#temporal-cloud-namespace-id"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal Cloud Namespace Id
                  </a>
                  .
                </li>
                <li>
                  The{" "}
                  <a
                    href="https://docs.temporal.io/cloud/namespaces#temporal-cloud-grpc-endpoint"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Namespace's gRPC endpoint
                  </a>
                  . The endpoint uses this format{" "}
                  <code>(namespace.unique_id.tmprl.cloud:port)</code>.
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/cloud/saml#integrate-saml-with-your-temporal-cloud-account"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Paths to the SSL certificate (.pem) and private key (.key)
                  </a>{" "}
                  registered to your Namespace and stored on your Worker's
                  file system.
                </li>
              </ul>
              <p>
                Copy the Namespace Id and the gRPC endpoint from the Namespace
                detail Web page on{" "}
                <a
                  href="https://cloud.temporal.io/namespaces"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Cloud Namespaces
                </a>
                . Click on a Namespace name to open the Namespace details.
              </p>

              <h3>Run a Self-hosted Worker</h3>
              <p>
                To deploy a self-hosted Worker to your Docker environment, you
                need to configure your Worker with the appropriate IP address
                and port.
              </p>

              <h4>Confirm network</h4>
              <p>
                The default <code>docker-compose.yml</code> file in the{" "}
                <code>temporalio/docker-compose</code> repo has the Temporal
                Server exposed on port 7233 on the <code>temporal-network</code>.
              </p>
              <CodeBlock language="yaml">{DOCKER_COMPOSE_YML}</CodeBlock>
              <p>
                If you are using a different or customized docker compose
                file, you can see the available networks by using the
                following command:
              </p>
              <CodeBlock language="bash">docker network ls</CodeBlock>

              <h4>Confirm IP address</h4>
              <p>
                Get the IP address of the Docker network that the containers
                are using.
              </p>
              <p>To do that, first inspect the network:</p>
              <CodeBlock language="bash">docker network inspect temporal-network</CodeBlock>
              <p>
                Look for the container named <code>temporal</code>.
              </p>
              <p>Example output:</p>
              <CodeBlock language="json">{DOCKER_INSPECT_JSON}</CodeBlock>
              <p>Copy the IP address part.</p>

              <h4>Customize Client options</h4>
              <p>Set IP address, port, and Namespace in the Temporal Client options.</p>
              <CodeBlock language="go" title="setup/self_hosted_worker/main.go">
                {SELF_HOSTED_WORKER_GO}
              </CodeBlock>

              <h4>Build and deploy Docker image</h4>
              <p>
                Add a Docker file to the root of your Background Check
                application project.
              </p>
              <p>
                Name the file <code>dockerfile</code>, with no extensions, and
                add the following configuration:
              </p>
              <CodeBlock language="dockerfile">{DOCKERFILE}</CodeBlock>

              <Admonition type="info">
                <p>
                  Make sure the Golang builder version matches the one used by
                  the Go SDK. Different versions of the Go SDK may use
                  different versions of Golang.
                </p>
              </Admonition>

              <p>Then build the Docker image using the following command:</p>
              <CodeBlock language="bash">
                docker build . -t backgroundcheck-worker-image:latest
              </CodeBlock>
              <p>
                Now run the Worker on the same network as the Temporal Cluster
                containers using the following command:
              </p>
              <CodeBlock language="bash">
                docker run --network temporal-network backgroundcheck-worker-image:latest
              </CodeBlock>
            </section>

            <section className={styles.section} id="start-workflow">
              <h2 className={styles.sectionTitle}>Start Workflow using the CLI</h2>
              <p>
                <strong>How to start a Workflow using the CLI</strong>
              </p>
              <p>
                You can use the Temporal CLI to start a Workflow whether you
                are using a local development server, Temporal Cloud, or are
                in a self-hosted environment. However, you need to provide
                additional options to the command when operating with the
                Temporal Cloud or self-hosted environments.
              </p>

              <h3>Local dev Server</h3>
              <p>
                <strong>How to start a Workflow with the Temporal CLI while using the local development server</strong>
              </p>
              <p>
                Use the Temporal CLI <code>temporal workflow start</code>{" "}
                command to start your Workflow.
              </p>
              <CodeBlock language="bash">{START_WORKFLOW_LOCAL}</CodeBlock>
              <p>
                <strong>Parameters breakdown</strong>
              </p>
              <ul>
                <li>
                  <code>--task-queue</code>: The name of the Task Queue for all
                  the Workflow Execution's Tasks. Unless otherwise specified,
                  Activity Executions use the Workflow Execution's Task Queue
                  name by default.
                </li>
                <li>
                  <code>--type</code>: This is the Workflow Type name. By
                  default, this is the function name. In the Go SDK, this name
                  can be customized when{" "}
                  <a
                    href="https://docs.temporal.io/dev-guide/go/foundations#customize-workflow-type"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    registering the Workflow
                  </a>
                  .
                </li>
                <li>
                  <code>--input</code>: This must be a valid JSON object that
                  can be unmarshaled into the parameter(s) that the Workflow
                  function accepts. Read more in the{" "}
                  <a
                    href="https://docs.temporal.io/dataconversion"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Data conversion
                  </a>{" "}
                  guide.
                </li>
                <li>
                  <code>--namespace</code>: This is the Namespace that you
                  want to run your Temporal Application in.
                </li>
                <li>
                  <code>--workflow-id</code>: A{" "}
                  <a
                    href="https://docs.temporal.io/workflows#workflow-id"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflow Id
                  </a>{" "}
                  is a custom identifier provided by you. The Temporal Platform
                  generates one if one isn't provided. However, we highly
                  recommend supplying your own Workflow Id with your own
                  naming convention. A{" "}
                  <a
                    href="https://docs.temporal.io/workflows#workflow-id-reuse-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflow Id Reuse Policy
                  </a>{" "}
                  enables fine controls over whether Workflow Ids can be
                  reused in the Platform within the Retention Period.
                </li>
              </ul>
              <p>
                For more details, see the{" "}
                <a
                  href="https://docs.temporal.io/cli/workflow#start"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporal workflow start
                </a>{" "}
                command API reference.
              </p>
              <p>
                After you start the Workflow, you can see it in the Temporal
                Platform. Use the Temporal CLI or the Temporal Web UI to
                monitor the Workflow's progress.
              </p>

              <h4>List Workflows</h4>
              <p>
                Use the <code>temporal workflow list</code> command to list
                all of the Workflows in the Namespace:
              </p>
              <CodeBlock language="bash">
                {`temporal workflow list \\
 --namespace backgroundcheck_namespace`}
              </CodeBlock>

              <h4>View in Web UI</h4>
              <p>
                You can also use the Web UI to see the Workflows associated
                with the Namespace.
              </p>
              <p>
                The local development server starts the Web UI at{" "}
                <a
                  href="http://localhost:8233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233
                </a>
                .
              </p>
              <p>
                When you visit for the first time, the Web UI directs you to{" "}
                <code>/namespaces/default/workflows</code>.
              </p>
              <p>
                Use the Namespace dropdown to select the project Namespace you
                created earlier.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/web-ui-namespace-selection.png`}
                  alt="Web UI Namespace selection"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                You should now be at{" "}
                <code>/namespaces/backgroundcheck_namespace/workflows</code>.
              </p>

              <h4>Confirm polling Worker</h4>
              <p>
                If you ever want to confirm that a Worker is polling on the
                Task Queue that the Workflow started on, you can visit the
                Workflow Execution's details page and click on the Task Queue
                name.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/click-task-queue-name.png`}
                  alt="Click on the Task Queue name to view polling Workers"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                This will direct you to a page where you can view the Workers
                polling that Task Queue. If there are none, the application
                won't run.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/confirm-workers-polling-task-queue.png`}
                  alt="Confirm Workers polling Task Queue"
                  className={styles.diagramImage}
                />
              </p>

              <h3>Temporal Cloud</h3>
              <p>
                <strong>How to start a Workflow with Temporal CLI when using Temporal Cloud</strong>
              </p>
              <p>
                Run the <code>temporal workflow start</code> command, and make
                sure to specify the certificate and private key arguments.
              </p>
              <CodeBlock language="bash">{START_WORKFLOW_CLOUD}</CodeBlock>
              <p>
                Make sure that the certificate path, private key path,
                Namespace, and address argument values match your project.
              </p>

              <Admonition type="info" title="Use environment variables">
                <p>
                  Use{" "}
                  <a
                    href="https://docs.temporal.io/cli#environment-variables"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    environment variables
                  </a>{" "}
                  as a way to quickly switch between a local dev server and
                  Temporal Cloud, for example.
                </p>
                <p>You can customize the environment names to be anything you want.</p>
                <CodeBlock language="bash">{ENV_SET_BLOCK}</CodeBlock>
                <p>
                  In this way, you can just provide a single <code>--env</code>{" "}
                  command option when using the CLI rather than specifying
                  each connection option in every command.
                </p>
                <CodeBlock language="bash">{ENV_USE_BLOCK}</CodeBlock>
              </Admonition>

              <h4>List Workflows</h4>
              <p>
                Run the <code>temporal workflow list</code> command, and make
                sure to specify the certificate and private key arguments.
              </p>
              <CodeBlock language="bash">{LIST_WORKFLOWS_CLOUD}</CodeBlock>

              <h4>View in Web UI</h4>
              <p>
                Visit the Workflows page of your Cloud Namespace. The URL will
                look something like the following:
              </p>
              <CodeBlock>
                {`https://cloud.temporal.io/namespaces/<namespace>.<account-id>/workflows`}
              </CodeBlock>

              <h3>Self-hosted</h3>
              <p>
                <strong>How to start a Workflow with the Temporal CLI when using a Self-hosted Cluster</strong>
              </p>
              <p>
                Use your Temporal CLI alias to run the{" "}
                <code>temporal workflow start</code> command and start your
                Workflow.
              </p>
              <CodeBlock language="bash">{START_WORKFLOW_SELF_HOSTED}</CodeBlock>

              <h4>List Workflows</h4>
              <p>
                Using your Temporal CLI alias, run the{" "}
                <code>temporal workflow list</code> command. This command
                lists the Workflow Executions within the Namespace:
              </p>
              <CodeBlock language="bash">
                {`temporal_docker workflow list \\
 --namespace backgroundcheck_namespace`}
              </CodeBlock>

              <h4>View in the Web UI</h4>
              <p>
                When you visit for the first time, the Web UI directs you to{" "}
                <code>http://localhost:8080/namespaces/default/workflows</code>.
              </p>
              <p>
                Use the Namespace dropdown to select the project Namespace you
                created earlier.
              </p>
              <p>
                You should now be at{" "}
                <code>http://localhost:8080/namespaces/backgroundcheck_namespace/workflows</code>.
              </p>
            </section>

            <section className={styles.section} id="test-framework">
              <h2 className={styles.sectionTitle}>Add a testing framework</h2>
              <p>
                <strong>How to add a Testing Framework and Tests for the Workflow and Activity</strong>
              </p>
              <p>
                Each Temporal SDK has a testing suite that can be used in
                conjunction with a typical language specific testing
                framework. In the Temporal Go SDK, the{" "}
                <a
                  href="https://pkg.go.dev/go.temporal.io/sdk/testsuite"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>testsuite</code> package
                </a>{" "}
                provides a test environment in which the Workflow and Activity
                code may be run for test purposes.
              </p>
              <CodeBlock language="go" title="setup/tests/backgroundcheckboilerplate_test.go">
                {TEST_FRAMEWORK_GO}
              </CodeBlock>
              <p>
                In this example, we use a custom struct that absorbs both the
                testing functionality from{" "}
                <a
                  href="https://pkg.go.dev/github.com/stretchr/testify/suite"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  testify
                </a>{" "}
                via <code>suite.Suite</code> and the testing functionality
                from the Temporal test framework via{" "}
                <code>testsuite.WorkflowTestSuite</code>. Next we create a
                regular test function recognized by the <code>go test</code>{" "}
                command, and pass an instance of the struct to{" "}
                <code>suite.Run</code>.
              </p>

              <h3>Add Workflow function tests</h3>
              <p>We can test Workflow code for the following conditions:</p>
              <ul>
                <li>Workflow status. For example, did the Workflow reach a completed status?</li>
                <li>Workflow returned an error. Did the Workflow function return an error?</li>
                <li>Error when checking for a result of a Workflow. Is there an error in getting the result returned by the Workflow?</li>
                <li>Workflow return value. If the Workflow did return something other than an error, is it what you expected it to be?</li>
              </ul>
              <p>
                We can also perform a Workflow Replay test, and we'll provide
                detailed coverage of this topic in another section.
              </p>
              <CodeBlock language="go" title="setup/tests/backgroundcheckboilerplate_test.go">
                {TEST_WORKFLOW_GO}
              </CodeBlock>
              <p>
                Calling <code>env.ExecuteWorkflow(...)</code> executes the
                Workflow logic and any invoked Activities inside the test
                process. The first parameter of <code>env.ExecuteWorkflow(...)</code>{" "}
                contains a reference to the Workflow function and any
                parameters that the Workflow needs.
              </p>
              <p>
                The call to <code>env.OnActivity</code> is important, because
                if this call is not made to "mock" the execution or another
                function is used to replace it, the test environment will
                execute the actual Activity code including any calls to
                outside services.
              </p>
              <p>
                After executing the Workflow in the above example, we assert
                that the Workflow ran through completion via the call to{" "}
                <code>env.IsWorkflowComplete()</code>. We also assert that no
                errors were returned by asserting on the return value of{" "}
                <code>env.GetWorkflowError()</code>.
              </p>
              <p>
                If our Workflow returned a value, we could have retrieved that
                value via a call to <code>s.env.GetWorkflowResult(&amp;value)</code>{" "}
                and had additional asserts on that value.
              </p>

              <h3>Add Activity function tests</h3>
              <p>We can test Activity code for the following conditions:</p>
              <ul>
                <li>Error when invoking the Activity Execution.</li>
                <li>Error when checking for the result of the Activity Execution.</li>
                <li>Activity return values. Check to ensure the return value is expected.</li>
              </ul>
              <CodeBlock language="go" title="setup/tests/backgroundcheckboilerplate_test.go">
                {TEST_ACTIVITY_GO}
              </CodeBlock>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/go/background-check/introduction/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Introduction
                </span>
              </Link>
              <Link
                to="/tutorials/go/background-check/durable-execution/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &rarr;
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Develop for durability
                </span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
