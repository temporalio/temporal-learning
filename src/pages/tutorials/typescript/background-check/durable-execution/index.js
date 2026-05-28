// Tutorial chapter 3 of 3: Develop code that durably executes.

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
  { n: 1, label: "Introduction", href: "/tutorials/typescript/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/typescript/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/typescript/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "retrieve-event-history", label: "Retrieve Event History" },
  { id: "replay-a-workflow-execution", label: "Replay a Workflow Execution" },
  { id: "intrinsic-non-deterministic-logic", label: "Intrinsic non-deterministic logic" },
  { id: "non-deterministic-code-changes", label: "Non-deterministic code changes" },
];

const IMG_BASE = "/img/tutorials/typescript/background-check";

const SHOW_LOCAL = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --output json > backgroundcheck_workflow_history.json`;

const SHOW_CLOUD = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --tls-cert-path /path/to/ca.pem \\
 --tls-key-path /path/to/ca.key \\
 --output json  > backgroundcheck_workflow_history.json`;

const SHOW_SELFHOSTED = `temporal_docker workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --output json  > backgroundcheck_workflow_history.json`;

const REPLAY_SINGLE_TS = `const filePath = './history_file.json';
const history = await JSON.parse(fs.promises.readFile(filePath, 'utf8'));
await Worker.runReplayHistory(
  {
    workflowsPath: require.resolve('./your/workflows'),
  },
  history,
);`;

const REPLAY_CONNECTION_TS = `const connection = await Connection.connect({ address });
const client = new Client({ connection, namespace: 'your-namespace' });
const handle = client.workflow.getHandle('your-workflow-id');
const history = await handle.fetchHistory();
await Worker.runReplayHistory(
  {
    workflowsPath: require.resolve('./your/workflows'),
  },
  history,
);`;

const REPLAY_BULK_TS = `const executions = client.workflow.list({
  query: 'TaskQueue=foo and StartTime > "2022-01-01T12:00:00"',
});
const histories = executions.intoHistories();
const results = Worker.runReplayHistories(
  {
    workflowsPath: require.resolve('./your/workflows'),
  },
  histories,
);
for await (const result of results) {
  if (result.error) {
    console.error('Replay failed', result);
  }
}`;

const NON_DETERMINISTIC_TS = `import { log, proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { ssnTraceActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

// backgroundCheckNonDeterministic is an anti-pattern Workflow Definition
export async function backgroundCheckNonDeterministic(
  ssn: string,
): Promise<string> {
  // CAUTION, the following code is an anti-pattern showing what NOT to do
  if (getRandomNumber(1, 100) > 50) {
    await sleep('10 seconds');
  }

  log.info('Preparing to run daily report', {});

  try {
    const ssnTraceResult = await ssnTraceActivity(ssn);
    return ssnTraceResult;
  } catch (err) {
    throw err;
  }
}

function getRandomNumber(min: number, max: number) {
  let seed = 1234;
  seed = Math.floor(((seed * seed) % 10000) / 100);
  return min + (seed % (max - min + 1));
}`;

const WORKER_LOG_ERROR = `2023/11/08 08:33:03 ERROR Workflow panic Namespace backgroundcheck_namespace TaskQueue backgroundcheck-replay-task-queue-local WorkerID 89476@flossypurse-macbook-pro.local@ WorkflowType BackgroundCheckNonDeterministic WorkflowID backgroundcheck_workflow RunID 02f36de4-ca96-4468-a883-91c098996354 Attempt 1 Error unknown command CommandType: Timer, ID: 5, possible causes are nondeterministic workflow definition code or incompatible change in the workflow definition StackTrace process event for backgroundcheck-replay-task-queue-local [panic]:
go.temporal.io/sdk/internal.panicIllegalState(...)`;

const SHOW_LONG = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow_break \\
 --namespace backgroundcheck_namespace \\
 --fields long`;

const PROGRESS_OUTPUT = `Progress:
  ID          Time                     Type                                                        Details
   1  2023-11-08T15:32:03Z  WorkflowExecutionStarted    {WorkflowType:{Name:BackgroundCheckNonDeterministic},
                                                        ParentInitiatedEventId:0,
                                                        TaskQueue:{Name:backgroundcheck-replay-task-queue-local,
                                                        Kind:Normal}, Input:["555-55-5555"],
                                                        WorkflowExecutionTimeout:0s, WorkflowRunTimeout:0s,
                                                        WorkflowTaskTimeout:10s, Initiator:Unspecified,
                                                        ...}
   2  2023-11-08T15:32:03Z  WorkflowTaskScheduled       {TaskQueue:{Name:backgroundcheck-replay-task-queue-local,
                                                        Kind:Normal}, StartToCloseTimeout:10s, Attempt:1}
   3  2023-11-08T15:32:03Z  WorkflowTaskStarted         {ScheduledEventId:2, ...}
   4  2023-11-08T15:32:03Z  WorkflowTaskCompleted       {ScheduledEventId:2, StartedEventId:3, ...}
   5  2023-11-08T15:32:03Z  TimerStarted                {TimerId:5, StartToFireTimeout:1m0s, WorkflowTaskCompletedEventId:4}
   6  2023-11-08T15:33:03Z  TimerFired                  {TimerId:5, StartedEventId:5}
   7  2023-11-08T15:33:03Z  WorkflowTaskScheduled       {TaskQueue:{Name:flossypurse-macbook-pro.local:...,
                                                        Kind:Sticky}, StartToCloseTimeout:10, Attempt:1}
   8  2023-11-08T15:33:03Z  WorkflowTaskStarted         {ScheduledEventId:7, ...}
   9  2023-11-08T15:33:03Z  WorkflowTaskFailed          {ScheduledEventId:7, StartedEventId:8, Cause:NonDeterministicError,
                                                        Failure:{Message:unknown command CommandType: Timer, ID: 5, possible causes are
                                                        nondeterministic workflow definition code or incompatible change in the workflow definition,
                                                        ...}}`;

const SLEEP_WORKFLOW_TS = `import { log } from '@temporalio/workflow';
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities'; // Assuming 'activities' is the file containing your activity definitions

const { ssnTraceActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

export async function backgroundCheckWorkflow(param: string): Promise<string> {
  // Sleep for 1 minute
  log.info('Sleeping for 1 minute...');
  await sleep(60 * 1000); // sleep for 60 seconds
  log.info('Finished sleeping');

  // Execute the SSNTraceActivity synchronously
  try {
    const ssnTraceResult = await ssnTraceActivity(param);
    // Return the result of the Workflow
    return ssnTraceResult;
  } catch (err) {
    throw err;
  }
}`;

const SHOW_BC = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace`;

const SHOW_BC_OUTPUT = `Progress:
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

export default function DurableExecutionPage() {
  return (
    <Layout
      title="Develop for durability - Background Check tutorial with TypeScript"
      description="Replay Workflow Executions, identify non-deterministic code, and evolve Workflow Definitions safely."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_typescript.png"
            alt="Temporal TypeScript SDK"
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
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  {
                    label: "Background Check",
                    href: "/tutorials/typescript/background-check/",
                  },
                  { label: "Develop for durability" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Develop code that durably executes
            </h1>

            <MetaChips items={["~30 minutes", "TypeScript", "Intermediate"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              The SDK's ability to{" "}
              <a
                href="https://docs.temporal.io/encyclopedia/temporal-sdks#replays"
                target="_blank"
                rel="noopener noreferrer"
              >
                Replay
              </a>{" "}
              a Workflow Execution is a major aspect of Temporal's durable
              execution. This chapter introduces the development patterns
              that enable it.
            </p>

            <Admonition type="note" title="Develop for a Durable Execution">
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
              <p>Learning objectives:</p>
              <ul>
                <li>Identify SDK API calls that map to Events.</li>
                <li>Recognize non-deterministic Workflow code.</li>
                <li>Explain how Workflow code execution progresses.</li>
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
                . We recommend starting with either the Temporal CLI or the
                Web UI.
              </p>

              <h3>Using the Temporal CLI</h3>
              <p>
                Use the <code>temporal workflow show</code> command to save
                the Event History to a local file.
              </p>
              <p>
                <strong>Local dev server:</strong>
              </p>
              <CodeBlock language="bash">{SHOW_LOCAL}</CodeBlock>

              <Admonition type="info" title="Workflow Id returns the most recent Workflow Execution">
                <p>
                  The most recent Event History for that Workflow Id is
                  returned when you only use the Workflow Id. Use the{" "}
                  <code>--run-id</code> option to get the Event History of an
                  earlier Workflow Execution by the same Workflow Id.
                </p>
              </Admonition>

              <p>
                <strong>Temporal Cloud</strong> - provide the paths to your
                certificate and private keys or set them as environment
                variables:
              </p>
              <CodeBlock language="bash">{SHOW_CLOUD}</CodeBlock>

              <p>
                <strong>Self-hosted Temporal Cluster</strong> using the
                Temporal CLI command alias:
              </p>
              <CodeBlock language="bash">{SHOW_SELFHOSTED}</CodeBlock>

              <h3>Via the UI</h3>
              <p>
                A Workflow Execution's Event History is also available in
                the Web UI. Navigate to the Workflows page and select the
                Workflow Execution:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/select-workflow-execution-in-ui.png`}
                  alt="Select a Workflow Execution from the Workflows page"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                From the details page you can copy the Event History from
                the JSON tab and paste it into the{" "}
                <code>backgroundcheck_workflow_history.json</code> file:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/copy-events-from-workflow-details-page.png`}
                  alt="Copy Event History JSON object from the Web UI"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="replay-a-workflow-execution">
              <h2 className={styles.sectionTitle}>
                Replay a Workflow Execution in TypeScript
              </h2>
              <p>
                To replay a single Event History, use{" "}
                <a
                  href="https://typescript.temporal.io/api/classes/worker.Worker#runreplayhistory"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  worker.runReplayHistory
                </a>
                .
              </p>
              <p>
                When an Event History is replayed and non-determinism is
                detected,{" "}
                <a
                  href="https://typescript.temporal.io/api/classes/workflow.DeterminismViolationError"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DeterminismViolationError
                </a>{" "}
                is thrown. If replay fails for any other reason,{" "}
                <a
                  href="https://typescript.temporal.io/api/classes/worker.ReplayError"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ReplayError
                </a>{" "}
                is thrown.
              </p>
              <p>Load a single Event History from disk:</p>
              <CodeBlock language="ts">{REPLAY_SINGLE_TS}</CodeBlock>
              <p>Download the Event History programmatically using a Client:</p>
              <CodeBlock language="ts">{REPLAY_CONNECTION_TS}</CodeBlock>
              <p>
                Combine{" "}
                <a
                  href="https://typescript.temporal.io/api/classes/client.WorkflowClient#list"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  client.workflow.list()
                </a>{" "}
                and{" "}
                <a
                  href="https://typescript.temporal.io/api/classes/worker.Worker#runreplayhistories"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  worker.runReplayHistories()
                </a>{" "}
                to replay in bulk:
              </p>
              <CodeBlock language="ts">{REPLAY_BULK_TS}</CodeBlock>

              <h3>Why add a Replay test?</h3>
              <p>
                The Replay test verifies whether the current Workflow code
                remains compatible with the Event Histories of earlier
                Workflow Executions. A failed Replay test typically indicates
                non-deterministic behavior.
              </p>
              <p>Workflow code becomes non-deterministic primarily through:</p>
              <ol>
                <li>
                  <a
                    href="https://docs.temporal.io/dev-guide/go/durable-execution#intrinsic-non-deterministic-logic"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Intrinsic non-deterministic logic
                  </a>
                  : when Workflow state or branching logic is determined by
                  factors beyond the SDK's control.
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/dev-guide/go/durable-execution#durability-through-replays"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Non-deterministic code changes
                  </a>
                  : when you change Workflow code and deploy those changes
                  while there are still active Workflow Executions on older
                  code versions.
                </li>
              </ol>
            </section>

            <section className={styles.section} id="intrinsic-non-deterministic-logic">
              <h2 className={styles.sectionTitle}>
                Intrinsic non-deterministic logic
              </h2>
              <p>
                Due to the Temporal TypeScript Sandbox, many common sources
                of non-determinism will not cause non-deterministic errors,
                because the Sandbox replaces non-deterministic methods with
                deterministic ones. Here are common sources of
                non-determinism in other SDKs to be aware of:
              </p>

              <h3>Random number generation</h3>
              <ul>
                <li>
                  Since random numbers are non-deterministic, avoid them in
                  Workflows in other SDKs.
                </li>
                <li>
                  With the TypeScript SDK, <code>Math.random()</code> is
                  overridden by a deterministic version using a pseudo-random
                  number generator seeded with a value specific to the
                  Workflow Execution.
                </li>
                <li>
                  For truly random numbers, use Activities.
                </li>
              </ul>

              <h3>Interacting with external systems or state</h3>
              <ul>
                <li>
                  Directly accessing or mutating external systems or state
                  (API calls, file I/O, communicating with other services,
                  invoking LLMs and AI services) should be avoided within
                  the Workflow. LLMs and AI services are non-deterministic
                  even when the network call succeeds.
                </li>
                <li>
                  With the TypeScript SDK, the Workflow sandbox cannot
                  import code that makes network requests or nondeterministic
                  modules. Use Activities for such operations.
                </li>
              </ul>

              <h3>Working with system time</h3>
              <ul>
                <li>
                  <code>Date.now()</code> is overridden with a deterministic
                  version that reflects the current system time in
                  milliseconds, recorded at the first invocation of a
                  Workflow Task. It remains constant during replays.
                </li>
                <li>
                  Use{" "}
                  <a
                    href="https://typescript.temporal.io/api/namespaces/workflow/#sleep"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    sleep()
                  </a>{" "}
                  to ensure deterministic behavior during replays.
                </li>
                <li>
                  <code>setTimeout</code> is also safe due to the TypeScript
                  sandbox.
                </li>
              </ul>

              <h3>Handling data structures with non-deterministic ordering</h3>
              <p>
                Be careful when iterating over data structures. In some
                cases, such as iterating over object properties with a{" "}
                <code>for in</code> loop, the order of property enumeration
                may not be guaranteed.
              </p>

              <p>
                One way to produce a non-deterministic error is to use a
                random number to determine whether to sleep inside the
                Workflow:
              </p>
              <CodeBlock language="ts" title="workflow.ts">
                {NON_DETERMINISTIC_TS}
              </CodeBlock>

              <p>The Worker logs will show something similar to:</p>
              <CodeBlock language="bash">{WORKER_LOG_ERROR}</CodeBlock>
              <p>You will see the failure in the Web UI as well:</p>
              <p>
                <img
                  src={`${IMG_BASE}/non-deterministic-workflow-task-failure.png`}
                  alt="Web UI view of a non-determinism error"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                To inspect the Workflow Task failure using the Temporal CLI,
                use the <code>long</code> value for the <code>--fields</code>{" "}
                option:
              </p>
              <CodeBlock language="bash">{SHOW_LONG}</CodeBlock>
              <CodeBlock>{PROGRESS_OUTPUT}</CodeBlock>

              <h3>VSCode Debugger extension</h3>
              <p>
                Non-deterministic code can be hard to catch while developing
                Workflows. Leverage the{" "}
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=temporal-technologies.temporalio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Debugger for VS Code
                </a>{" "}
                to debug Workflows by their ID or Workflow Event History
                file. See the{" "}
                <a
                  href="https://github.com/temporalio/vscode-debugger-extension/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vscode-debugger-extension README
                </a>{" "}
                for usage details.
              </p>

              <h3>Does this mean Temporal can't be used for AI?</h3>
              <p>
                No - the opposite. Workflow determinism is exactly what
                makes Temporal a strong fit for AI applications. LLM calls,
                tool use, and agent steps are non-deterministic by nature,
                so you place them in Activities. This separation makes the
                orchestration dependable even though these individual steps
                are non-deterministic, so your agent can recover from
                crashes, retry failed LLM calls, and resume long-running
                tasks without losing state.
              </p>
            </section>

            <section className={styles.section} id="non-deterministic-code-changes">
              <h2 className={styles.sectionTitle}>
                Non-deterministic code changes
              </h2>
              <p>
                The most important thing to take away is to make sure you
                have an application versioning plan whenever you develop
                and maintain a Temporal Application that will deploy to
                production.
              </p>

              <h3>The Event History</h3>
              <p>
                Inspect the Event History of a recent Background Check
                Workflow:
              </p>
              <CodeBlock language="bash">{SHOW_BC}</CodeBlock>
              <p>You should see output similar to:</p>
              <CodeBlock>{SHOW_BC_OUTPUT}</CodeBlock>
              <p>Key events in the sequence:</p>
              <ul>
                <li>
                  <code>WorkflowExecutionStarted</code>: created in response
                  to the request to start the Workflow Execution.
                </li>
                <li>
                  <code>WorkflowTaskScheduled</code>: a Workflow Task is in
                  the Task Queue.
                </li>
                <li>
                  <code>WorkflowTaskStarted</code>: a Worker successfully
                  polled the Task and started evaluating Workflow code.
                </li>
                <li>
                  <code>WorkflowTaskCompleted</code>: the Worker suspended
                  execution and made as much progress that it could.
                </li>
                <li>
                  <code>ActivityTaskScheduled</code>: the ExecuteActivity
                  API was called and the Worker sent the{" "}
                  <a
                    href="https://docs.temporal.io/references/commands#scheduleactivitytask"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ScheduleActivityTask
                  </a>{" "}
                  Command.
                </li>
                <li>
                  <code>ActivityTaskStarted</code>: the Worker started
                  evaluating Activity code.
                </li>
                <li>
                  <code>ActivityTaskCompleted</code>: the Worker completed
                  Activity code and returned any results to the Server.
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
                  serves as a source of truth for all possible Events in
                  the Workflow Execution's Event History.
                </p>
              </Admonition>

              <h3>Workflow Sleep sample</h3>
              <p>
                Add logging statements and a Timer to see how this affects
                the Event History. The <code>sleep()</code> API causes the
                Workflow to sleep for a minute before the Activity call.
              </p>
              <p>
                By using Temporal's logging API, the Worker suppresses log
                messages during replay so log statements from the original
                execution aren't duplicated by re-execution.
              </p>
              <CodeBlock language="ts" title="workflow.ts">
                {SLEEP_WORKFLOW_TS}
              </CodeBlock>

              <h3>Inspect the new Event History</h3>
              <p>
                After updating your Workflow code, run your tests again.
                The <code>TestReplayWorkflowHistoryFromFile</code> test will
                fail because the new code creates new Events and alters the
                Event History sequence. To get the test to pass, get an
                updated Event History JSON file.
              </p>

              <Admonition type="info" title="Double check Task Queue names">
                <p>
                  Reminder that this guide jumps between several sample
                  applications using multiple Task Queues. Make sure you
                  start Workflows on the same Task Queue that the Worker is
                  listening to.
                </p>
              </Admonition>

              <p>
                The new Event History contains two new Events from the{" "}
                <code>sleep()</code> API call which sends the{" "}
                <a
                  href="https://docs.temporal.io/references/commands#starttimer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  StartTimer Command
                </a>
                :
              </p>
              <ul>
                <li><code>TimerStarted</code></li>
                <li><code>TimerFired</code></li>
              </ul>
              <p>
                No Events related to logging appear. If you remove the
                Sleep call, there is no compatibility issue with the
                previous code. The basic rule: if the API call generates a{" "}
                <a
                  href="https://docs.temporal.io/references/commands"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Command
                </a>{" "}
                that creates Events in the Workflow History that takes a
                new path from the existing Event History, then it is a
                non-deterministic change.
              </p>

              <p>Non-deterministic changes include:</p>
              <ul>
                <li>Adding or removing an Activity</li>
                <li>
                  Switching the Activity Type used in a call to{" "}
                  <code>ExecuteActivity</code>
                </li>
                <li>Adding or removing a Timer</li>
                <li>
                  Altering the execution order of Activities or Timers
                  relative to one another
                </li>
              </ul>

              <p>Changes that do not lead to non-deterministic errors:</p>
              <ul>
                <li>
                  Modifying non-Command generating statements in a Workflow
                  Definition, such as logging statements
                </li>
                <li>
                  Changing attributes in the <code>ActivityOptions</code>
                </li>
                <li>Modifying code inside of an Activity Definition</li>
              </ul>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/typescript/background-check/project-setup/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 2
                </span>
                <span className={styles.chapterNavTitle}>Project setup</span>
              </Link>
              <Link
                to="/tutorials/typescript"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Back to TypeScript tutorials{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  All TypeScript tutorials
                </span>
              </Link>
            </div>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/typescript/work-queue-slack-app/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Build a Work Queue Slack App
                  </h3>
                  <p className={styles.nextBody}>
                    Build a Slack work-queue app and deploy it to
                    production on a DigitalOcean Droplet.
                  </p>
                  <span className={styles.nextCta}>
                    Start the series <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/typescript/recurring-billing-system/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Build a recurring billing subscription system
                  </h3>
                  <p className={styles.nextBody}>
                    Use Workflows, Activities, Signals, and Queries to
                    build a fault-tolerant subscription system.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
