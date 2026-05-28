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
  { id: "retrieve-event-history", label: "Retrieve a Workflow Execution's Event History" },
  { id: "add-replay-test", label: "Add a Replay test" },
  { id: "intrinsic-non-deterministic-logic", label: "Intrinsic non-deterministic logic" },
  { id: "durability-through-replays", label: "Non-deterministic code changes" },
];

const IMG_BASE = "/img/tutorials/go/background-check";

const TESTS_TREE = `/backgroundcheck
    ...
    /tests
        | tests.go
        | backgroundcheck_workflow_history.json`;

const SHOW_WORKFLOW_LOCAL = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --output json > backgroundcheck_workflow_event_history.json`;

const SHOW_WORKFLOW_CLOUD = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --tls-cert-path /path/to/ca.pem \\
 --tls-key-path /path/to/ca.key \\
 --output json  > backgroundcheck_workflow_history.json`;

const SHOW_WORKFLOW_SELF_HOSTED = `temporal_docker workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --output json  > backgroundcheck_workflow_history.json`;

const REPLAY_TEST_GO = `// TestReplayWorkflowHistoryFromFile tests for Event History compatibility.
func (s *UnitTestSuite) TestReplayWorkflowHistoryFromFile() {
\t// Create a new Replayer
\treplayer := worker.NewWorkflowReplayer()
\t// Register the Workflow with the Replayer
\treplayer.RegisterWorkflow(workflows.BackgroundCheck)
\t// Compare the current Workflow code against the existing Event History
\t// This call fails unless updated to use 'backgroundcheck_workflow_event_history_with_timer.json'
\terr := replayer.ReplayWorkflowHistoryFromJSONFile(nil, "backgroundcheck_workflow_event_history.json")
\ts.NoError(err)
}`;

const NON_DETERMINISTIC_GO = `// CAUTION! Do not use this code!
package workflows

import (
\t"math/rand"
\t"time"

\t"go.temporal.io/sdk/workflow"

\t"background-check-tutorialchapters/durability/activities"
)

// BackgroundCheckNonDeterministic is an anti-pattern Workflow Definition
func BackgroundCheckNonDeterministic(ctx workflow.Context, param string) (string, error) {
\tactivityOptions := workflow.ActivityOptions{
\t\tStartToCloseTimeout: 10 * time.Second,
\t}
\tctx = workflow.WithActivityOptions(ctx, activityOptions)
\tvar ssnTraceResult string
\t// highlight-start
\t// CAUTION, the following code is an anti-pattern showing what NOT to do
\tnum := rand.Intn(100)
\tif num > 50 {
\t\terr := workflow.Sleep(ctx, 10*time.Second)
\t\tif err != nil {
\t\t\treturn "", err
\t\t}
\t}
\t// highlight-end
\terr := workflow.ExecuteActivity(ctx, activities.SSNTraceActivity, param).Get(ctx, &ssnTraceResult)
\tif err != nil {
\t\treturn "", err
\t}
\treturn ssnTraceResult, nil
}`;

const WORKER_PANIC_LOG = `2023/11/08 08:33:03 ERROR Workflow panic Namespace backgroundcheck_namespace TaskQueue backgroundcheck-replay-task-queue-local WorkerID 89476@flossypurse-macbook-pro.local@ WorkflowType BackgroundCheckNonDeterministic WorkflowID backgroundcheck_workflow RunID 02f36de4-ca96-4468-a883-91c098996354 Attempt 1 Error unknown command CommandType: Timer, ID: 5, possible causes are nondeterministic workflow definition code or incompatible change in the workflow definition StackTrace process event for backgroundcheck-replay-task-queue-local [panic]:
go.temporal.io/sdk/internal.panicIllegalState(...)`;

const SHOW_LONG = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow_break \\
 --namespace backgroundcheck_namespace \\
 --fields long`;

const SHOW_LONG_OUTPUT = `Progress:
  ID          Time                     Type                                                        Details
   1  2023-11-08T15:32:03Z  WorkflowExecutionStarted    {WorkflowType:{Name:BackgroundCheckNonDeterministic},
                                                        ParentInitiatedEventId:0,
                                                        TaskQueue:{Name:backgroundcheck-replay-task-queue-local,
                                                        Kind:Normal}, Input:["555-55-5555"],
                                                        WorkflowExecutionTimeout:0s, WorkflowRunTimeout:0s,
                                                        WorkflowTaskTimeout:10s, Initiator:Unspecified,
                                                        OriginalExecutionRunId:02f36de4-ca96-4468-a883-91c098996354,
                                                        Identity:temporal-cli:flossypurse@flossypurse-macbook-pro.local,
                                                        FirstExecutionRunId:02f36de4-ca96-4468-a883-91c098996354,
                                                        Attempt:1, FirstWorkflowTaskBackoff:0s,
                                                        ParentInitiatedEventVersion:0}
   2  2023-11-08T15:32:03Z  WorkflowTaskScheduled       {TaskQueue:{Name:backgroundcheck-replay-task-queue-local,
                                                        Kind:Normal}, StartToCloseTimeout:10s, Attempt:1}
   3  2023-11-08T15:32:03Z  WorkflowTaskStarted         {ScheduledEventId:2, Identity:89425@flossypurse-macbook-pro.local@,
                                                        RequestId:7a2515a0-885b-46a5-997f-4d41fe86a290,
                                                        SuggestContinueAsNew:false, HistorySizeBytes:762}
   4  2023-11-08T15:32:03Z  WorkflowTaskCompleted       {ScheduledEventId:2, StartedEventId:3, Identity:89425@flossypurse-macbook-pro.local@,
                                                        BinaryChecksum:2d9bc9784e1f18c4906cf95289a8bbcb,SdkMetadata:{CoreUsedFlags:[],
                                                        LangUsedFlags:[3]}, MeteringMetadata:{NonfirstLocalActivityExecutionAttempts:0}}
   5  2023-11-08T15:32:03Z  TimerStarted                {TimerId:5, StartToFireTimeout:1m0s, WorkflowTaskCompletedEventId:4}
   6  2023-11-08T15:33:03Z  TimerFired                  {TimerId:5, StartedEventId:5}
   7  2023-11-08T15:33:03Z  WorkflowTaskScheduled       {TaskQueue:{Name:flossypurse-macbook-pro.local:26d90960-cd3f-4229-8312-3716e916ac77,
                                                        Kind:Sticky}, StartToCloseTimeout:10, Attempt:1}
   8  2023-11-08T15:33:03Z  WorkflowTaskStarted         {ScheduledEventId:7, Identity:89476@flossypurse-macbook-pro.local@,
                                                        RequestId:ed6a7561-e9b8-4949-94b7-42d7b66640c5,
                                                        SuggestContinueAsNew:false, HistorySizeBytes:1150}
   9  2023-11-08T15:33:03Z  WorkflowTaskFailed          {ScheduledEventId:7, StartedEventId:8, Cause:NonDeterministicError,
                                                        Failure:{Message:unknown command CommandType: Timer, ID: 5, possible causes are
                                                        nondeterministic workflow definition code or incompatible change in the workflow definition,
                                                        Source:GoSDK, StackTrace:process event for backgroundcheck-replay-task-queue-local
                                                        [panic]: go.temporal.io/sdk/internal.panicIllegalState(...)
                                                        /Users/flossypurse/go/pkg/mod/go.temporal.io/sdk@v1.25.1/in
                                                        ternal/internal_command_state_machine.go:440 go.temporal.io/sdk/internal ...
                                                        poral.io/sdk@v1.25.1/internal/internal_worker_base.go:356 +0x48 created by
                                                        go.temporal.io/sdk/internal.(*baseWorker).processTaskAsync in goroutine 50
                                                        /Users/flossypurse/go/pkg/mod/go.temporal.io/sdk@v1.25.1/internal/internal_worker_base.go:352
                                                        +0xbc, FailureInfo:{ApplicationFailureInfo:{Type:PanicError, NonRetryable:true}}},
                                                        Identity:89476@flossypurse-macbook-pro.local@, ForkEventVersion:0,
                                                        BinaryChecksum:da7cae1f96abf543ca8b6e7c3f3ab072}`;

const SHOW_BASIC = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace`;

const SHOW_BASIC_OUTPUT = `Progress:
  ID          Time                     Type
   1  2023-10-25T20:28:03Z  WorkflowExecutionStarted
   2  2023-10-25T20:28:03Z  WorkflowTaskScheduled
   3  2023-10-25T20:28:03Z  WorkflowTaskStarted
   4  2023-10-25T20:28:03Z  WorkflowTaskCompleted
   5  2023-10-25T20:28:03Z  ActivityTaskScheduled
   6  2023-10-25T20:28:03Z  ActivityTaskStarted
   7  2023-10-25T20:28:03Z  ActivityTaskCompleted
   8  2023-10-25T20:28:03Z  WorkflowTaskScheduled
   9  2023-10-25T20:28:03Z  WorkflowTaskStarted
  10  2023-10-25T20:28:03Z  WorkflowTaskCompleted
  11  2023-10-25T20:28:03Z  WorkflowExecutionCompleted

Result:
  Status: COMPLETED
  Output: ["pass"]`;

const DURABLE_WORKFLOW_GO = `package workflows

import (
\t"time"

\t"go.temporal.io/sdk/workflow"

\t"background-check-tutorialchapters/durability/activities"
)

// BackgroundCheck is your custom Workflow Definition.
func BackgroundCheck(ctx workflow.Context, param string) (string, error) {
\t// highlight-start
\t// Sleep for 1 minute
\tworkflow.GetLogger(ctx).Info("Sleeping for 1 minute...")
\terr := workflow.Sleep(ctx, 60*time.Second)
\tif err != nil {
\t\treturn "", err
\t}
\tworkflow.GetLogger(ctx).Info("Finished sleeping")
\t// highlight-end
\t// Define the Activity Execution options
\t// StartToCloseTimeout or ScheduleToCloseTimeout must be set
\tactivityOptions := workflow.ActivityOptions{
\t\tStartToCloseTimeout: 10 * time.Second,
\t}
\tctx = workflow.WithActivityOptions(ctx, activityOptions)
\t// Execute the Activity synchronously (wait for the result before proceeding)
\tvar ssnTraceResult string
\terr = workflow.ExecuteActivity(ctx, activities.SSNTraceActivity, param).Get(ctx, &ssnTraceResult)
\tif err != nil {
\t\treturn "", err
\t}
\t// Make the results of the Workflow available
\treturn ssnTraceResult, nil
}`;

export default function DurableExecutionPage() {
  return (
    <Layout
      title="Durable execution - Build a Background Check application with Go"
      description="Chapter 3: Retrieve Event Histories, add a Replay test, and learn how non-determinism breaks Workflows in Go."
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
                  { label: "Durable execution" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Develop code that durably executes
            </h1>

            <MetaChips items={["~30 minutes", "Intermediate", "Go"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              When it comes to the Temporal Platform's ability to durably
              execute code, the SDK's ability to{" "}
              <a
                href="https://docs.temporal.io/dev-guide/sdks#replays"
                target="_blank"
                rel="noopener noreferrer"
              >
                Replay
              </a>{" "}
              a Workflow Execution is a major aspect of that. This chapter
              introduces the development patterns which enable that.
            </p>

            <Admonition type="tip" title="Develop for a Durable Execution">
              <p>
                This chapter introduces best practices for developing
                deterministic Workflows that can be Replayed, enabling a{" "}
                <a
                  href="https://docs.temporal.io/temporal#durable-execution"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Durable Execution
                </a>
                .
              </p>
              <p>
                By the end of this section you will know basic best practices
                for Workflow Definition development.
              </p>
              <p>Learning objectives:</p>
              <ul>
                <li>Identify SDK API calls that map to Events</li>
                <li>Recognize non-deterministic Workflow code</li>
                <li>Explain how Workflow code execution progresses</li>
              </ul>
              <p>
                The information in this chapter is also available in the{" "}
                <a
                  href="https://learn.temporal.io/courses/temporal_102/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal 102 course
                </a>
                .
              </p>
            </Admonition>

            <p>
              This chapter builds on{" "}
              <Link to="/tutorials/go/background-check/project-setup/">
                Construct a new Temporal Application project
              </Link>{" "}
              and relies on the Background Check use case and sample
              applications as a means to contextualize the information.
            </p>

            <p>This chapter walks through the following sequence:</p>
            <ul>
              <li>Retrieve a Workflow Execution's Event History</li>
              <li>Add a Replay test to your application</li>
              <li>Intrinsic non-deterministic logic</li>
              <li>Non-deterministic code changes</li>
            </ul>

            <section className={styles.section} id="retrieve-event-history">
              <h2 className={styles.sectionTitle}>
                Retrieve a Workflow Execution's Event History
              </h2>
              <p>
                There are a few ways to view and download a Workflow
                Execution's{" "}
                <a
                  href="https://docs.temporal.io/workflows#event-history"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event History
                </a>
                . We recommend starting off by using either the Temporal CLI
                or the Web UI to access it.
              </p>

              <h3>Using the Temporal CLI</h3>
              <p>
                Use the Temporal CLI's <code>temporal workflow show</code>{" "}
                command to save your Workflow Execution's Event History to a
                local file. Run the command from the <code>/tests</code>{" "}
                directory so that the file saves alongside the other testing
                files.
              </p>
              <CodeBlock>{TESTS_TREE}</CodeBlock>

              <p>
                <strong>Local dev server</strong>
              </p>
              <p>
                If you have been following along with the earlier chapters of
                this guide, your Workflow Id might be something like{" "}
                <code>backgroundcheck_workflow</code>.
              </p>
              <CodeBlock language="bash">{SHOW_WORKFLOW_LOCAL}</CodeBlock>

              <Admonition type="info" title="Workflow Id returns the most recent Workflow Execution">
                <p>
                  The most recent Event History for that Workflow Id is
                  returned when you only use the Workflow Id to identify the
                  Workflow Execution. Use the <code>--run-id</code> option as
                  well to get the Event History of an earlier Workflow
                  Execution by the same Workflow Id.
                </p>
              </Admonition>

              <p>
                <strong>Temporal Cloud</strong>
              </p>
              <p>
                For Temporal Cloud, remember to either provide the paths to
                your certificate and private keys as command options, or set
                those paths as environment variables:
              </p>
              <CodeBlock language="bash">{SHOW_WORKFLOW_CLOUD}</CodeBlock>

              <p>
                <strong>Self-hosted Temporal Cluster</strong>
              </p>
              <p>
                For self-hosted environments, you might be using the Temporal
                CLI command alias:
              </p>
              <CodeBlock language="bash">{SHOW_WORKFLOW_SELF_HOSTED}</CodeBlock>

              <h3>Via the UI</h3>
              <p>A Workflow Execution's Event History is also available in the Web UI.</p>
              <p>Navigate to the Workflows page in the UI and select the Workflow Execution.</p>
              <p>
                <img
                  src={`${IMG_BASE}/select-workflow-execution-in-ui.png`}
                  alt="Select a Workflow Execution from the Workflows page"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                From the Workflow details page you can copy the Event History
                from the JSON tab and paste it into the{" "}
                <code>backgroundcheck_workflow_history.json</code> file.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/copy-events-from-workflow-details-page.png`}
                  alt="Copy Event History JSON object from the Web UI"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="add-replay-test">
              <h2 className={styles.sectionTitle}>Add a Replay test</h2>
              <p>
                Add the Replay test to the set of application tests. The
                Replayer is available from the{" "}
                <code>go.temporal.io/sdk/worker</code> package in the SDK.
                Register the Workflow Definition and then specify an existing
                Event History to compare to.
              </p>
              <p>
                Run the tests in the test directory (<code>go test</code>).
                If the Workflow Definition and the Event History are
                incompatible then the test fails.
              </p>
              <CodeBlock language="go" title="durability/tests/backgroundcheck_test.go">
                {REPLAY_TEST_GO}
              </CodeBlock>

              <h3>Why add a Replay test?</h3>
              <p>
                The Replay test is important because it verifies whether the
                current Workflow code (Workflow Definition) remains compatible
                with the Event Histories of earlier Workflow Executions.
              </p>
              <p>
                A failed Replay test typically indicates that the Workflow
                code exhibits non-deterministic behavior. In other words, for
                a specific input, the Workflow code can follow different code
                paths during each execution, resulting in distinct sequences
                of Events. The Temporal Platform's ability to ensure durable
                execution depends on the SDK's capability to re-execute code
                and return to the most recent state of the Workflow Function
                execution.
              </p>
              <p>The Replay test executes the same steps as the SDK and verifies compatibility.</p>
              <p>Workflow code becomes non-deterministic primarily through two main avenues:</p>
              <ol>
                <li>
                  <strong>Intrinsic non-deterministic logic:</strong> This
                  occurs when Workflow state or branching logic within the
                  Workflow gets determined by factors beyond the SDK's control.
                </li>
                <li>
                  <strong>Non-deterministic code changes:</strong> When you
                  change your Workflow code and deploy those changes while
                  there are still active Workflow Executions relying on older
                  code versions.
                </li>
              </ol>
            </section>

            <section className={styles.section} id="intrinsic-non-deterministic-logic">
              <h2 className={styles.sectionTitle}>Intrinsic non-deterministic logic</h2>
              <p>
                Referred to as "intrinsic non-determinism", this kind of "bad"
                Workflow code can prevent the Workflow code from completing
                because the Workflow can take a different code path than the
                one expected from the Event History.
              </p>
              <p>
                The following are some common operations that{" "}
                <strong>can't</strong> be done inside of a Workflow Definition:
              </p>
              <ul>
                <li>Generate and rely on random numbers (use Activities instead).</li>
                <li>
                  Accessing / mutating external systems or state. This
                  includes calling an external API, conducting a file I/O
                  operation, talking to another service, invoking an LLM or
                  other AI service, etc. (use Activities instead). LLMs and
                  AI services are non-deterministic even when the network
                  call succeeds, since the same prompt may return a different
                  response on each call.
                </li>
                <li>
                  Relying on system time.
                  <ul>
                    <li>
                      Use <code>workflow.Now()</code> as a replacement for{" "}
                      <code>time.Now()</code>.
                    </li>
                    <li>
                      Use <code>workflow.Sleep()</code> as a replacement for{" "}
                      <code>time.Sleep()</code>.
                    </li>
                  </ul>
                </li>
                <li>
                  Working directly with threads or goroutines.
                  <ul>
                    <li>
                      Use <code>workflow.Go()</code> as a replacement for the{" "}
                      <code>go</code> statement.
                    </li>
                    <li>
                      Use <code>workflow.Channel()</code> as a replacement for
                      the native <code>chan</code> type. Temporal provides
                      support for both buffered and unbuffered channels.
                    </li>
                    <li>
                      Use <code>workflow.Selector()</code> as a replacement
                      for the <code>select</code> statement.
                    </li>
                  </ul>
                </li>
                <li>
                  Iterating over data structures with unknown ordering. This
                  includes iterating over maps using <code>range</code>,
                  because with <code>range</code> the order of the map's
                  iteration is randomized. Instead you can collect the keys
                  of the map, sort them, and then iterate over the sorted
                  keys to access the map. This technique provides
                  deterministic results. You can also use a Side Effect or
                  an Activity to process the map instead.
                </li>
                <li>Storing or evaluating the run Id.</li>
              </ul>
              <p>
                One way to produce a non-deterministic error is to use a
                random number to determine whether to sleep inside the
                Workflow.
              </p>
              <CodeBlock language="go" title="durability/workflows/backgroundcheck_non_deterministic_code.go">
                {NON_DETERMINISTIC_GO}
              </CodeBlock>
              <p>
                If you run the BackgroundCheckNonDeterministic Workflow enough
                times, eventually you will see a Workflow Task failure.
              </p>
              <p>The Worker logs will show something similar to the following:</p>
              <CodeBlock language="bash">{WORKER_PANIC_LOG}</CodeBlock>
              <p>And you will see information about the failure in the Web UI as well.</p>
              <p>
                <img
                  src={`${IMG_BASE}/non-deterministic-workflow-task-failure.png`}
                  alt="Web UI view of a non-determinism error"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                To inspect the Workflow Task failure using the Temporal CLI,
                you can use the <code>long</code> value for the{" "}
                <code>--fields</code> command option with the{" "}
                <code>temporal workflow show</code> command.
              </p>
              <CodeBlock language="bash">{SHOW_LONG}</CodeBlock>
              <p>This will display output similar to the following:</p>
              <CodeBlock>{SHOW_LONG_OUTPUT}</CodeBlock>

              <h3>Static analysis tools</h3>
              <p>
                Non-deterministic code can be hard to catch while developing
                Workflows. The Go SDK doesn't have a restricted runtime to
                identify and prevent the use of <code>time.Sleep</code> or a
                new goroutine. Calling those, or any other invalid construct,
                can lead to ugly non-determinism errors.
              </p>
              <p>
                To help catch these issues early and during development, use
                the{" "}
                <a
                  href="https://github.com/temporalio/sdk-go/tree/master/contrib/tools/workflowcheck"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>workflowcheck</code> static analysis tool
                </a>
                . It attempts to find all invalid code called from inside a
                Workflow Definition. See the{" "}
                <a
                  href="https://github.com/temporalio/sdk-go/blob/master/contrib/tools/workflowcheck/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>workflowcheck</code> README
                </a>{" "}
                for details on how to use it.
              </p>

              <h3>Does this mean Temporal can't be used for AI?</h3>
              <p>
                No - the opposite. Workflow determinism is exactly what makes
                Temporal a strong fit for AI applications. LLM calls, tool
                use, and agent steps are non-deterministic by nature, so you
                place them in Activities. This separation makes the
                orchestration dependable even though these individual steps
                are non-deterministic, so your agent can recover from
                crashes, retry failed LLM calls, and resume long-running
                tasks without losing state.
              </p>
            </section>

            <section className={styles.section} id="durability-through-replays">
              <h2 className={styles.sectionTitle}>Non-deterministic code changes</h2>
              <p>
                The most important thing to take away from this section is to
                make sure you have an application versioning plan whenever
                you are developing and maintaining a Temporal Application that
                will eventually deploy to a production environment.
              </p>
              <p>
                Versioning APIs and versioning strategies are covered in other
                parts of the Background Check tutorial; this chapter sets the
                stage to understand why and how to approach those strategies.
              </p>

              <h3>The Event History</h3>
              <p>
                Inspect the Event History of a recent Background Check
                Workflow using the <code>temporal workflow show</code> command:
              </p>
              <CodeBlock language="bash">{SHOW_BASIC}</CodeBlock>
              <p>You should see output similar to this:</p>
              <CodeBlock>{SHOW_BASIC_OUTPUT}</CodeBlock>
              <p>
                The preceding output shows eleven Events in the Event History
                ordered in a particular sequence. All Events are created by
                the Temporal Server in response to either a request coming
                from a Temporal Client, or a{" "}
                <a
                  href="https://docs.temporal.io/workflows#command"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Command
                </a>{" "}
                coming from the Worker.
              </p>
              <p>Let's take a closer look:</p>
              <ul>
                <li>
                  <code>WorkflowExecutionStarted</code>: This Event is created
                  in response to the request to start the Workflow Execution.
                </li>
                <li>
                  <code>WorkflowTaskScheduled</code>: This Event indicates a
                  Workflow Task is in the Task Queue.
                </li>
                <li>
                  <code>WorkflowTaskStarted</code>: This Event indicates that
                  a Worker successfully polled the Task and started evaluating
                  Workflow code.
                </li>
                <li>
                  <code>WorkflowTaskCompleted</code>: This Event indicates
                  that the Worker suspended execution and made as much
                  progress that it could.
                </li>
                <li>
                  <code>ActivityTaskScheduled</code>: This Event indicates
                  that the ExecuteActivity API was called and the Worker sent
                  the{" "}
                  <a
                    href="https://docs.temporal.io/references/commands#scheduleactivitytask"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>ScheduleActivityTask</code>
                  </a>{" "}
                  Command to the Server.
                </li>
                <li>
                  <code>ActivityTaskStarted</code>: This Event indicates that
                  the Worker successfully polled the Activity Task and
                  started evaluating Activity code.
                </li>
                <li>
                  <code>ActivityTaskCompleted</code>: This Event indicates
                  that the Worker completed evaluation of the Activity code
                  and returned any results to the Server. In response, the
                  Server schedules another Workflow Task to finish evaluating
                  the Workflow code resulting in the remaining Events:{" "}
                  <code>WorkflowTaskScheduled</code>,{" "}
                  <code>WorkflowTaskStarted</code>,{" "}
                  <code>WorkflowTaskCompleted</code>, and{" "}
                  <code>WorkflowExecutionCompleted</code>.
                </li>
              </ul>

              <Admonition type="info" title="Event reference">
                <p>
                  The{" "}
                  <a
                    href="https://docs.temporal.io/references/events"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Event reference
                  </a>{" "}
                  serves as a source of truth for all possible Events in the
                  Workflow Execution's Event History and the data that is
                  stored in them.
                </p>
              </Admonition>

              <h3>Add a call to sleep</h3>
              <p>
                In the following sample, we add a couple of logging statements
                and a Timer to the Workflow code to see how this affects the
                Event History.
              </p>
              <p>
                Use the <code>workflow.Sleep()</code> API to cause the
                Workflow to sleep for a minute before the call to execute the
                Activity. The Temporal SDK offers both a{" "}
                <code>workflow.StartTimer()</code> API and a{" "}
                <code>workflow.Sleep()</code> API that enables you to add
                time-based logic to your Workflow code.
              </p>
              <p>
                Use the <code>workflow.GetLogger</code> API to log from
                Workflows to avoid seeing repeated logs from the Replay of
                the Workflow code.
              </p>
              <CodeBlock language="go" title="durability/workflows/backgroundcheck.go">
                {DURABLE_WORKFLOW_GO}
              </CodeBlock>

              <h3>Inspect the new Event History</h3>
              <p>
                After updating your Workflow code to include the logging and
                Timer, run your tests again. You should expect to see the{" "}
                <code>TestReplayWorkflowHistoryFromFile</code> test fail.
                This is because the code we added creates new Events and
                alters the Event History sequence.
              </p>
              <p>
                To get this test to pass, we must get an updated Event
                History JSON file.{" "}
                <Link to="/tutorials/go/background-check/project-setup/#start-workflow">
                  Start a new Workflow
                </Link>{" "}
                and after it is complete download the Event History as a JSON
                object.
              </p>

              <Admonition type="info" title="Double check Task Queue names">
                <p>
                  Reminder that this guide jumps between several sample
                  applications using multiple Task Queues. Make sure you are
                  starting Workflows on the same Task Queue that the Worker
                  is listening to. And, always make sure that all Workers
                  listening to the same Task Queue are registered with the
                  same Workflows and Activities.
                </p>
              </Admonition>

              <p>
                If you inspect the new Event History, you will see two new
                Events in response to the <code>workflow.Sleep()</code> API
                call which send the{" "}
                <a
                  href="https://docs.temporal.io/references/commands#starttimer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  StartTimer Command
                </a>{" "}
                to the Server:
              </p>
              <ul>
                <li><code>TimerStarted</code></li>
                <li><code>TimerFired</code></li>
              </ul>
              <p>
                However, it is also important to note that you don't see any
                Events related to logging. And if you were to remove the
                Sleep call from the code, there wouldn't be a compatibility
                issue with the previous code. This is to highlight that only
                certain code changes within Workflow code are
                non-deterministic. The basic thing to remember is that if the
                API call causes a{" "}
                <a
                  href="https://docs.temporal.io/references/commands"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Command
                </a>{" "}
                to create Events in the Workflow History that takes a new
                path from the existing Event History, then it is a
                non-deterministic change.
              </p>
              <p>
                This becomes a critical aspect of Workflow development when
                there are running Workflows that have not yet completed and
                rely on earlier versions of the code.
              </p>
              <p>
                Practically, that means non-deterministic changes include but
                are not limited to the following:
              </p>
              <ul>
                <li>Adding or removing an Activity</li>
                <li>
                  Switching the Activity Type used in a call to{" "}
                  <code>ExecuteActivity</code>
                </li>
                <li>Adding or removing a Timer</li>
                <li>Altering the execution order of Activities or Timers relative to one another</li>
              </ul>
              <p>
                The following are a few examples of changes that do not lead
                to non-deterministic errors:
              </p>
              <ul>
                <li>Modifying non-Command generating statements in a Workflow Definition, such as logging statements</li>
                <li>
                  Changing attributes in the <code>ActivityOptions</code>
                </li>
                <li>Modifying code inside of an Activity Definition</li>
              </ul>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/tutorials/go/audiobook/" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Create audiobooks from text with OpenAI and Go
                  </h3>
                  <p className={styles.nextBody}>
                    Build audiobooks from text using OpenAI APIs and Temporal,
                    with robust failure mitigation.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">&rarr;</span>
                  </span>
                </Link>
                <Link to="/courses/" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take a Temporal course</h3>
                  <p className={styles.nextBody}>
                    Free, self-paced courses on Temporal's building blocks -
                    Workflows, Activities, and beyond.
                  </p>
                  <span className={styles.nextCta}>
                    Browse courses <span aria-hidden="true">&rarr;</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/go/background-check/project-setup/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous: chapter 2
                </span>
                <span className={styles.chapterNavTitle}>
                  Project setup
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
