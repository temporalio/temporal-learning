// Reference code lives at https://github.com/temporalio/email-subscription-project-go.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "workflow", label: "Develop the Workflow" },
  { id: "activities", label: "Develop the Activities" },
  { id: "worker", label: "Build the Worker" },
  { id: "web-server", label: "Build the web server" },
  { id: "query", label: "Add a Query" },
  { id: "unsubscribe", label: "Unsubscribe users" },
  { id: "tests", label: "Create integration tests" },
  { id: "conclusion", label: "Conclusion" },
];

const SUBSCRIBE_GO = `package subscribeemails

const TaskQueueName string = "email_subscription"
const ClientHostPort string = "localhost:4000"

type EmailDetails struct {
\tEmailAddress      string \`json:"emailAddress"\`
\tMessage           string \`json:"message"\`
\tIsSubscribed      bool   \`json:"isSubscribed"\`
\tSubscriptionCount int    \`json:"subscriptionCount"\`
}`;

const WORKFLOW_GO = `package subscribeemails

import (
\t"errors"
\t"time"

\t"go.temporal.io/sdk/workflow"
)

// Workflow definition
func SubscriptionWorkflow(ctx workflow.Context, emailDetails EmailDetails) error {
\tduration := 12 * time.Second
\tlogger := workflow.GetLogger(ctx)
\tlogger.Info("Subscription created", "EmailAddress", emailDetails.EmailAddress)

// ...
\t// variable for Activity Options. Timeout can be set to a longer timespan (such as a month)
\tctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
\t\tStartToCloseTimeout: 2 * time.Minute,
\t\tWaitForCancellation: true,
\t})

// ...
\t// handling for the first email ever
\tlogger.Info("Sending welcome email", "EmailAddress", emailDetails.EmailAddress)
\temailDetails.SubscriptionCount++
\tdata := EmailDetails{
\t\tEmailAddress:      emailDetails.EmailAddress,
\t\tMessage:           "Welcome! Looks like you've been signed up!",
\t\tIsSubscribed:      true,
\t\tSubscriptionCount: emailDetails.SubscriptionCount,
\t}

\t// send welcome email, increment billing period
\terr = workflow.ExecuteActivity(ctx, SendEmail, data).Get(ctx, nil)
\tif err != nil {
\t\treturn err
\t}

\t// start subscription period. execute until no longer subscribed
\tfor emailDetails.IsSubscribed {
\t\temailDetails.SubscriptionCount++
\t\tdata := EmailDetails{
\t\t\tEmailAddress:      emailDetails.EmailAddress,
\t\t\tMessage:           "This is yet another email in the Subscription Workflow.",
\t\t\tIsSubscribed:      true,
\t\t\tSubscriptionCount: emailDetails.SubscriptionCount,
\t\t}

\t\terr = workflow.ExecuteActivity(ctx, SendEmail, data).Get(ctx, nil)
\t\tif err != nil {
\t\t\treturn err
\t\t}
\t\tlogger.Info("Sent content email", "EmailAddress", emailDetails.EmailAddress)
\t\t// Sleep the Workflow until the next subscription email needs to be sent.
\t\t// This can be set to sleep every month between emails.
\t\tif err = workflow.Sleep(ctx, duration); err != nil {
\t\t\treturn err
\t\t}
\t}
\treturn nil
}`;

const ACTIVITIES_GO = `package subscribeemails

import (
\t"context"

\t"go.temporal.io/sdk/activity"
)

// email activities
func SendEmail(ctx context.Context, emailInfo EmailDetails) (string, error) {
\tactivity.GetLogger(ctx).Info("Sending email to customer", "EmailAddress", emailInfo.EmailAddress)
\treturn "Email sent to " + emailInfo.EmailAddress, nil
}`;

const WORKER_GO = `package main

import (
\t"log"
\t"subscribeemails"

\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"
)

func main() {
\t// create client and worker
\tc, err := client.Dial(client.Options {
\t\tHostPort: client.DefaultHostPort,
\t\tNamespace: client.DefaultNamespace,
\t})
\tif err != nil {
\t\tlog.Fatalln("Unable to create Temporal Client.", err)
\t}
\tdefer c.Close()
\t// create Worker
\tw := worker.New(c, subscribeemails.TaskQueueName, worker.Options{})
\t// register Activity and Workflow
\tw.RegisterWorkflow(subscribeemails.SubscriptionWorkflow)
\tw.RegisterActivity(subscribeemails.SendEmail)

\tlog.Println("Worker is starting.")
\t// Listen to Task Queue
\terr = w.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("Unable to start Worker.", err)
\t}
}`;

const GATEWAY_MAIN_GO = `package main

import (
\t"context"
\t"encoding/json"
\t"fmt"
\t"log"
\t"net/http"
\t"net/url"
\t"subscribeemails"

\t"go.temporal.io/sdk/client"
)

var temporalClient client.Client

type RequestData struct {
\tEmail string \`json:"email"\`
}

type ResponseData struct {
\tStatus  string \`json:"status"\`
\tMessage string \`json:"message"\`
}

// ...
func main() {

\tvar err error
\ttemporalClient, err = client.Dial(client.Options{
\t\tHostPort: client.DefaultHostPort,
\t})

\tif err != nil {
\t\tpanic(err)
\t}

\tfmt.Printf("Starting the web server on %s\\n", subscribeemails.ClientHostPort)

\thttp.HandleFunc("/subscribe", subscribeHandler)
\thttp.HandleFunc("/unsubscribe", unsubscribeHandler)
\thttp.HandleFunc("/details", showDetailsHandler)
\t_ = http.ListenAndServe(":4000", nil)
}`;

const SUBSCRIBE_HANDLER = `// ...
// create subscribe handler, which collects the email in the index handler form
func subscribeHandler(w http.ResponseWriter, r *http.Request) {

\t// only respond to POST
\tif r.Method != http.MethodPost {
\t\thttp.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
\t\treturn
\t}

\t// ensure JSON request
\tif r.Header.Get("Content-Type") != "application/json" {
\t\thttp.Error(w, "Invalid Content-Type, expecting application/json", http.StatusUnsupportedMediaType)
\t\treturn
\t}

\tvar requestData RequestData

\t// decode request into variable
\terr := json.NewDecoder(r.Body).Decode(&requestData)
\tif err != nil {
\t\thttp.Error(w, "Error processing request body", http.StatusBadRequest)
\t\treturn
\t}

\t// check if the email is blank
\tif requestData.Email == "" {
\t\thttp.Error(w, "Email is blank", http.StatusBadRequest)
\t\treturn
\t}

\t// use the email as the id in the workflow.
\tworkflowOptions := client.StartWorkflowOptions{
\t\tID:                                       requestData.Email,
\t\tTaskQueue:                                subscribeemails.TaskQueueName,
\t\tWorkflowExecutionErrorWhenAlreadyStarted: true,
\t}

\t// Define the EmailDetails struct
\tsubscription := subscribeemails.EmailDetails{
\t\tEmailAddress:      requestData.Email,
\t\tMessage:           "Welcome to the Subscription Workflow!",
\t\tSubscriptionCount: 0,
\t\tIsSubscribed:      true,
\t}

\t// Execute the Temporal Workflow to start the subscription.
\t_, err = temporalClient.ExecuteWorkflow(context.Background(), workflowOptions, subscribeemails.SubscriptionWorkflow, subscription)

\tif err != nil {
\t\thttp.Error(w, "Couldn't sign up user. Please try again.", http.StatusInternalServerError)
\t\tlog.Print(err)
\t\treturn
\t}

\t// build response
\tresponseData := ResponseData{
\t\tStatus:  "success",
\t\tMessage: "Signed up.",
\t}

\t// send headers
\tw.Header().Set("Content-Type", "application/json")
\tw.WriteHeader(http.StatusCreated) // 201 Created status code

\t// send response
\tif err := json.NewEncoder(w).Encode(responseData); err != nil {
\t\tlog.Print("Could not encode response JSON", err)
\t\thttp.Error(w, "Internal server error", http.StatusInternalServerError)
\t}
}`;

const QUERY_HANDLER = `// ...

\t// Query handler
\terr := workflow.SetQueryHandler(ctx, "GetDetails", func() (EmailDetails, error) {
\t\treturn emailDetails, nil
\t})

\tif err != nil {
\t\treturn err
\t}
\t// variable for Activity Options. Timeout can be set to a longer timespan (such as a month)`;

const SHOW_DETAILS_HANDLER = `// ...
// create part of the Query handler that returns information at localhost:4000/details
func showDetailsHandler(w http.ResponseWriter, r *http.Request) {
\t// Parse the query string
\tqueryValues, err := url.ParseQuery(r.URL.RawQuery)
\tif err != nil {
\t\thttp.Error(w, "Couldn't query values. Please try again.", http.StatusInternalServerError)
\t\tlog.Println("Failed to query Workflow.")
\t\treturn
\t}

\t// Extract the email parameter
\temail := queryValues.Get("email")

\tworkflowID := email
\tqueryType := "GetDetails"

\t// print email, billing period, charge, etc.
\tresp, err := temporalClient.QueryWorkflow(context.Background(), workflowID, "", queryType)
\tif err != nil {
\t\thttp.Error(w, "Couldn't query values. Please try again.", http.StatusInternalServerError)
\t\tlog.Println("Failed to query Workflow.")
\t\treturn
\t}

\tvar result subscribeemails.EmailDetails

\tif err := resp.Get(&result); err != nil {
\t\thttp.Error(w, "Couldn't query values. Please try again.", http.StatusInternalServerError)
\t\tlog.Println("Failed to query Workflow.")
\t\treturn
\t}

\t// send headers
\tw.Header().Set("Content-Type", "application/json")
\tw.WriteHeader(http.StatusCreated) // 201 Created status code

\t// send response
\tif err := json.NewEncoder(w).Encode(result); err != nil {
\t\tlog.Print("Could not encode response JSON", err)
\t\thttp.Error(w, "Internal server error", http.StatusInternalServerError)
\t}
}`;

const CANCEL_DEFER = `// ...
\tdefer func() {
\t\tnewCtx, cancel := workflow.NewDisconnectedContext(ctx)
\t\tdefer cancel()

\t\tif errors.Is(ctx.Err(), workflow.ErrCanceled) {
\t\t\tdata := EmailDetails{
\t\t\t\tEmailAddress:      emailDetails.EmailAddress,
\t\t\t\tMessage:           "Your subscription has been canceled. Sorry to see you go!",
\t\t\t\tIsSubscribed:      false,
\t\t\t\tSubscriptionCount: emailDetails.SubscriptionCount,
\t\t\t}
\t\t\t// send cancellation email
\t\t\terr := workflow.ExecuteActivity(newCtx, SendEmail, data).Get(newCtx, nil)
\t\t\tif err != nil {
\t\t\t\tlogger.Error("Failed to send cancellation email", "Error", err)
\t\t\t} else {
\t\t\t\t// Cancellation received.
\t\t\t\tlogger.Info("Sent cancellation email", "EmailAddress", emailDetails.EmailAddress)
\t\t\t}
\t\t}
\t}()`;

const UNSUBSCRIBE_HANDLER = `// ...
// create unsubscribe handler, accessed at localhost:4000/unsubscribe
func unsubscribeHandler(w http.ResponseWriter, r *http.Request) {

\t// only respond to POST
\tif r.Method != http.MethodDelete {
\t\thttp.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
\t\treturn
\t}

\t// ensure JSON request
\tif r.Header.Get("Content-Type") != "application/json" {
\t\thttp.Error(w, "Invalid Content-Type, expecting application/json", http.StatusUnsupportedMediaType)
\t\treturn
\t}

\tvar requestData RequestData

\t// decode request into variable
\terr := json.NewDecoder(r.Body).Decode(&requestData)
\tif err != nil {
\t\thttp.Error(w, "Error processing request body", http.StatusBadRequest)
\t\treturn
\t}

\t// check if the email is blank
\tif requestData.Email == "" {
\t\thttp.Error(w, "Email is blank", http.StatusBadRequest)
\t\treturn
\t}
\tworkflowID := requestData.Email

\t// cancel the Workflow Execution
\terr = temporalClient.CancelWorkflow(context.Background(), workflowID, "")
\tif err != nil {
\t\thttp.Error(w, "Couldn't unsubscribe. Please try again.", http.StatusInternalServerError)
\t\tlog.Print(err)
\t\treturn
\t}

\t// build response
\tresponseData := ResponseData{
\t\tStatus:  "success",
\t\tMessage: "Unsubscribed.",
\t}

\t// send headers
\tw.Header().Set("Content-Type", "application/json")
\tw.WriteHeader(http.StatusAccepted) // 202 Accepted status code

\t// send response
\tif err := json.NewEncoder(w).Encode(responseData); err != nil {
\t\tlog.Print("Could not encode response JSON", err)
\t\thttp.Error(w, "Internal server error", http.StatusInternalServerError)
\t}
}`;

const TEST_GO = `package subscribeemails

import (
\t"testing"
\t"time"

\t"go.temporal.io/sdk/testsuite"
)

func Test_CanceledSubscriptionWorkflow(t *testing.T) {
\ttestSuite := &testsuite.WorkflowTestSuite{}
\tenv := testSuite.NewTestWorkflowEnvironment()

\ttestDetails := EmailDetails{
\t\tEmailAddress:      "example@temporal.io",
\t\tMessage:           "This is a test to see if the Workflow cancels. This is dependent on the bool variable in the testDetails struct.",
\t\tIsSubscribed:      true,
\t\tSubscriptionCount: 12,
\t}

\t// set delayed callback to allow time for cancellation.
\tenv.RegisterDelayedCallback(func() {
\t\tenv.CancelWorkflow()
\t}, 5 * time.Second)

\tenv.RegisterWorkflow(SubscriptionWorkflow)
\tenv.RegisterActivity(SendEmail)

\tenv.ExecuteWorkflow(SubscriptionWorkflow, testDetails)
}`;

const TEST_OUTPUT = `subscription-workflow-go % go test
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
ok      subscribeemails 0.285s`;

export default function EmailDripCampaignPage() {
  return (
    <Layout
      title="Build an email drip campaign with Go"
      description="Implement an email subscription application in Go with Temporal's Workflows, Activities, and Queries, using the Temporal Client in a web API."
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
                  { label: "Build an email drip campaign" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Build an email drip campaign with Go</h1>

            <MetaChips items={["~60 minutes", "Intermediate", "Go"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                In this tutorial, you'll build an email subscription web
                application using Temporal and Go. You'll create a web server
                to handle requests, and use Temporal Workflows, Activities,
                and Queries to build the core of the application. Your web
                server will handle requests from the end user and interact
                with a Temporal Workflow to manage the email subscription
                process. Since you're building the business logic with
                Temporal's Workflows and Activities, you'll be able to use
                Temporal to manage each subscription rather than relying on
                a separate database or queue. This reduces the complexity of
                the code you have to write and support.
              </p>
              <p>
                You'll create an endpoint for users to give their email
                address, and then create a new Workflow Execution using that
                email address which will simulate sending an email message at
                certain intervals. The user can check on the status of their
                subscription, which you'll handle using a Query, and they
                can end the subscription at any time by unsubscribing, which
                you'll handle by cancelling the Workflow Execution. You can
                view the user's entire process through Temporal's Web UI.
                For this tutorial, you'll simulate sending emails, but you
                can adapt this example to call a live email service in the
                future.
              </p>
              <p>
                By the end of this tutorial, you'll have a clear
                understanding of how to use Temporal to create and manage
                long-running Workflows within a web application.
              </p>
              <p>
                You'll find the code for this tutorial on GitHub in the{" "}
                <a
                  href="https://github.com/temporalio/email-subscription-project-go"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  email-subscription-project-go
                </a>{" "}
                repository.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  <Link to="/getting_started/go/dev_environment/">
                    Set up a local development environment for Temporal and Go
                  </Link>
                  .
                </li>
                <li>
                  Complete the{" "}
                  <Link to="/getting_started/go/hello_world_in_go/">
                    Hello World
                  </Link>{" "}
                  tutorial to ensure you understand the basics of creating
                  Workflows and Activities with Temporal.
                </li>
                <li>
                  Create a new directory for the project called{" "}
                  <code>email-subscription-project</code>.
                </li>
                <li>
                  Run <code>go mod init subscribeemail</code> to create a Go
                  module file in the project directory.
                </li>
                <li>
                  Run <code>go mod tidy</code> to update the Go module file.
                </li>
              </ul>

              <Admonition type="note">
                <p>
                  Always run <code>go mod tidy</code> after importing new
                  packages to the application.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Develop the Workflow</h2>
              <p>
                A Workflow defines a sequence of steps defined by writing
                code, known as a{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definition
                </a>
                , and are carried out by running that code, which results in
                a Workflow Execution.
              </p>
              <p>
                The Temporal Go SDK recommends the use of a single struct
                for parameters and return types. This lets you change fields
                without breaking Workflow compatibility. Before writing the
                Workflow Definition, you'll define the data object used by
                the Workflow Definition.
              </p>
              <p>
                To set up the struct, create a new file called{" "}
                <code>subscribe.go</code> in your project directory. This
                file will hold some constants you'll use in the application.
              </p>
              <p>
                This struct will represent the data you'll send to your
                Activity and Workflow. You'll create an{" "}
                <code>EmailDetails</code> struct with the following fields:
              </p>
              <ul>
                <li>
                  <code>EmailAddress</code>: a string to pass a user's email
                </li>
                <li>
                  <code>Message</code>: a string to pass a message to the user
                </li>
                <li>
                  <code>IsSubscribed</code>: a boolean to track whether the
                  user is subscribed
                </li>
                <li>
                  <code>SubscriptionCount</code>: an integer to track the
                  number of emails sent
                </li>
              </ul>
              <p>
                Add the following code to the <code>subscribe.go</code> file
                to define the struct, as well as the Task Queue name and
                the host and port your web API will use:
              </p>
              <CodeBlock language="go" title="subscribe.go">
                {SUBSCRIBE_GO}
              </CodeBlock>
              <p>
                Now that you have your <code>EmailDetails</code> struct
                defined, you can move on to writing the Workflow Definition.
              </p>
              <p>
                To create a new Workflow Definition, create a new file called{" "}
                <code>workflow.go</code>. This file will contain the{" "}
                <code>SubscriptionWorkflow()</code> function.
              </p>
              <p>
                Use the <code>workflow.go</code> file to write deterministic
                logic inside your Workflow Definition and to execute the
                Activity.
              </p>
              <p>Add the following code to define the Workflow:</p>
              <CodeBlock language="go" title="workflow.go">
                {WORKFLOW_GO}
              </CodeBlock>
              <p>
                The <code>SubscriptionWorkflow()</code> function requires
                two arguments: <code>ctx</code> and <code>EmailDetails</code>
                . <code>ctx</code> references{" "}
                <code>workflow.Context</code>, which the Go SDK uses to pass
                around Workflow Execution context.{" "}
                <code>EmailDetails</code> propagates the function's{" "}
                <code>data</code> struct, which will be used to execute the
                Activity.
              </p>
              <p>
                The <code>SubscriptionWorkflow()</code> function uses a{" "}
                <code>for</code> loop to send the emails. The{" "}
                <code>for</code> loop executes the <code>SendEmail</code>{" "}
                Activity while <code>IsSubscribed</code> is <code>true</code>
                , and uses a Timer to pause the Workflow between emails. The
                Timer can pause the Workflow for seconds, days, months, or
                even years, depending on your business logic.
              </p>
              <p>
                Later in this tutorial, you will find that the user's email
                address is set to the{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-id"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Id
                </a>
                . This means that attempting to subscribe with the same
                email address twice will result in an error and prevent the
                Workflow Execution from spawning again.
              </p>
              <p>
                Therefore, only one running Workflow Execution per email
                address can exist within the associated{" "}
                <a
                  href="https://docs.temporal.io/namespaces"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Namespace
                </a>
                . This ensures that the user won't receive multiple email
                subscriptions. This also helps reduce the complexity of the
                code you have to write and maintain.
              </p>
              <p>
                With this Workflow Definition in place, you can now develop
                an Activity to send emails.
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>Develop the Activities</h2>
              <p>
                An{" "}
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity
                </a>{" "}
                is a function or method that executes a single, well-defined
                action (either short or long running), such as calling
                another service, transcoding a media file, or sending an
                email message. Workflow code orchestrates the execution of
                Activities, persisting the results.
              </p>
              <p>
                Create a new file called <code>activities.go</code> and add
                the following code to create the Activity Definition:
              </p>
              <CodeBlock language="go" title="activities.go">
                {ACTIVITIES_GO}
              </CodeBlock>
              <p>
                Each iteration of the Workflow loop will execute this
                Activity, which simulates sending a message to the user.
              </p>
              <p>
                Now that the Activity Definition and Workflow Definition
                have been created, it's time to write the Worker process.
              </p>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Build the Worker</h2>
              <p>
                Temporal Workflows and Activities are executed by{" "}
                <a
                  href="https://docs.temporal.io/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workers
                </a>{" "}
                that listen on specific Task Queues. When Workflows and
                Activities return, the Workers send the results back to the
                Temporal Cluster.
              </p>
              <p>
                Create a <code>worker</code> folder, and create the{" "}
                <code>main.go</code> file for the{" "}
                <a
                  href="https://docs.temporal.io/workers#worker-program"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker program
                </a>
                .
              </p>
              <CodeBlock language="go" title="worker/main.go">
                {WORKER_GO}
              </CodeBlock>
              <p>
                Now that you've written the logic to execute the Workflow
                and Activity Definitions, try to build the gateway.
              </p>
            </section>

            <section className={styles.section} id="web-server">
              <h2 className={styles.sectionTitle}>Build the web server</h2>
              <p>
                The web server is used to handle requests. This tutorial
                uses{" "}
                <a
                  href="https://pkg.go.dev/net/http"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Go's HTTP library
                </a>{" "}
                as the entry point for initiating Workflow Executions and
                for communicating with the <code>/subscribe</code>,{" "}
                <code>/unsubscribe</code>, and <code>/details</code>{" "}
                endpoints.
              </p>
              <p>
                Create a <code>gateway</code> folder with the file{" "}
                <code>main.go</code>. Establish your JSON request and
                response structs, set the endpoint handlers, and connect to
                the Temporal Client.
              </p>
              <CodeBlock language="go" title="gateway/main.go">
                {GATEWAY_MAIN_GO}
              </CodeBlock>
              <p>
                The Temporal Client enables you to communicate with the
                Temporal Cluster. Communication with a Temporal Cluster
                includes, but isn't limited to, the following:
              </p>
              <ul>
                <li>Starting Workflow Executions</li>
                <li>Querying Workflow Executions</li>
                <li>Getting the results of a Workflow Execution</li>
              </ul>
              <p>
                The <code>RequestData</code> and <code>ResponseData</code>{" "}
                structs format information in JSON format. Temporal
                recommends JSON formatting for data that's handled by other
                programs - a good practice to establish for a future of live
                service interactions.
              </p>
              <p>
                Now that the connection to the Temporal Server is open,
                define your first endpoint.
              </p>
              <p>
                Create a <code>subscribeHandler()</code> function in the
                same file so users can subscribe to the emails.
              </p>
              <CodeBlock language="go" title="gateway/main.go">
                {SUBSCRIBE_HANDLER}
              </CodeBlock>
              <p>
                Use error handlers to ensure that the function only
                responds to a "POST" request in JSON format. After decoding
                the request, use <code>workflowOptions</code> to pass in
                the user's email address and set the Workflow Id. This
                ensures that the email is unique across all Workflows so
                that the user can't sign up multiple times. They'll only
                receive the emails they've subscribed to, and once they
                unsubscribe, they cancel the Workflow run.
              </p>
              <p>
                With this endpoint in place, you can now send a "POST"
                request to <code>/subscribe</code> with an email address
                in the request body. In return, you'll receive a JSON
                response that shows a new Workflow has started, along with
                a welcome email.
              </p>
              <p>
                But how would you get details about the subscription? In
                the next section, you'll query your Workflow to get back
                information on the state of things.
              </p>
            </section>

            <section className={styles.section} id="query">
              <h2 className={styles.sectionTitle}>Add a Query</h2>
              <p>
                You can let users get information about their subscription
                details by using a Query.
              </p>
              <p>
                To allow users to retrieve information about their
                subscription details, add a new Query handler to the{" "}
                <code>SendEmailWorkflow</code> Workflow.
              </p>
              <p>
                Open the <code>workflow.go</code> file and add a Query
                handler to the top of the Workflow Definition, right after
                the logging statement:
              </p>
              <CodeBlock language="go" title="workflow.go">
                {QUERY_HANDLER}
              </CodeBlock>
              <p>
                This Query handler returns the contents of the{" "}
                <code>emailDetails</code> variable. Queries should never
                mutate anything in the Workflow.
              </p>
              <p>
                You can use Queries even if the Workflow completes, which is
                useful for when the user unsubscribes but still wants to
                retrieve information about their subscription.
              </p>
              <p>
                Now that you've added the ability to Query your Workflow,
                add the ability to Query from the web API.
              </p>
              <p>
                Create a function called <code>showDetailsHandler()</code>{" "}
                in which a user can get information about their subscription
                details. Make sure to include error handlers to ensure
                proper "GET" requests and responses.
              </p>
              <CodeBlock language="go" title="gateway/main.go">
                {SHOW_DETAILS_HANDLER}
              </CodeBlock>
              <p>
                The resulting function returns the email address associated
                with the Workflow - in other words, the Workflow Id.
              </p>
              <p>
                Now that users can subscribe and view the details of their
                subscription, you need to provide them with a way to
                unsubscribe.
              </p>
            </section>

            <section className={styles.section} id="unsubscribe">
              <h2 className={styles.sectionTitle}>
                Unsubscribe users with a Workflow Cancellation request
              </h2>
              <p>
                Users will need to unsubscribe from the email list at some
                point. To gracefully handle the Unsubscribe request, the
                Workflow Definition needs a cancellation handler.
              </p>
              <p>
                Create a new <code>defer</code> block within{" "}
                <code>SubscriptionWorkflow()</code> to send cancellation
                emails and end the Workflow Execution:
              </p>
              <CodeBlock language="go" title="workflow.go">
                {CANCEL_DEFER}
              </CodeBlock>
              <p>
                To send a cancellation notice to an endpoint, use the HTTP{" "}
                <code>DELETE</code> method on the <code>unsubscribe</code>{" "}
                endpoint to return a{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cancel()
                </a>{" "}
                method on the Workflow's handle.
              </p>
              <p>
                Create a new function called <code>unsubscribeHandler()</code>{" "}
                that sends a cancellation request to the Workflow Execution.
              </p>
              <CodeBlock language="go" title="gateway/main.go">
                {UNSUBSCRIBE_HANDLER}
              </CodeBlock>
              <p>
                The <code>CancelWorkflow()</code> function sends a
                cancellation request to the Workflow Execution you started
                on the <code>/subscribe</code> endpoint.
              </p>
              <p>
                When the Workflow receives the cancellation request, it
                will cancel the Workflow Execution and return a{" "}
                <code>CancelledError</code> to the Workflow Execution. This
                is then handled by the error handlers included in the{" "}
                <code>unsubscribeHandler()</code> function.
              </p>
              <p>
                Users can now send a "DELETE" request to{" "}
                <code>/unsubscribe</code> to cancel the Workflow associated
                with the request body's email address. This lets users
                unsubscribe from the email list and prevent any further
                emails from sending.
              </p>
              <p>
                Now that you've added the ability to unsubscribe from the
                email list, test your application code to ensure it works
                as expected.
              </p>
            </section>

            <section className={styles.section} id="tests">
              <h2 className={styles.sectionTitle}>Create integration tests</h2>
              <p>
                Integration testing is an essential part of software
                development that helps ensure that different components of
                an application work together correctly. In this section,
                you'll write an integration test using the Go SDK to test
                the cancellation of a Workflow.
              </p>
              <p>
                The Temporal Go SDK includes functions to help test your
                Workflow Executions. Use these functions alongside the{" "}
                <a
                  href="https://github.com/stretchr/testify"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Testify module
                </a>{" "}
                to create integration tests against a test server or a given
                Client.
              </p>
              <p>
                To set up the test environment, create a new file called{" "}
                <code>subscription_test.go</code>. Create a test function
                called <code>Test_CanceledSubscriptionWorkflow()</code>.
              </p>
              <CodeBlock language="go" title="subscription_test.go">
                {TEST_GO}
              </CodeBlock>
              <p>
                This function creates a Workflow Execution by starting the
                Workflow with some test data. The function then cancels it
                with the <code>CancelWorkflow()</code> function that was
                assigned to <code>RegisterDelayedCallback()</code>.
              </p>
              <p>
                With the test function created, run it to see if it works.
                Use the command <code>go test</code> to start the test.
              </p>
              <CodeBlock>{TEST_OUTPUT}</CodeBlock>
              <p>
                With a cancellation request that fires after five seconds,
                this test shows the successful creation of a subscription
                as well as its cancellation. You've successfully written,
                executed, and passed a Cancellation Workflow test.
              </p>
              <p>
                Temporal's Go SDK provides a number of functions that help
                you test your Workflow Executions. By following the best
                practices for testing your code, you can be confident that
                your Workflows are reliable and performant.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                This tutorial demonstrates how to build an email
                subscription application using Temporal and Go. By
                leveraging Workflows, Activities, and Queries, the tutorial
                shows how to create a web server that interacts with
                Temporal to manage the subscription process.
              </p>
              <p>
                With this knowledge, you'll be able to use more complex
                Workflows and Activities to create even stronger
                applications.
              </p>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
