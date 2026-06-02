// Tutorial chapter 3 of 3: Develop for Durable Execution with the Python SDK.

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
  { n: 1, label: "Introduction", href: "/tutorials/python/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/python/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/python/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "retrieve-event-history", label: "Retrieve a Workflow Execution's Event History" },
  { id: "add-replay-test", label: "Add a Replay test" },
  { id: "intrinsic-non-deterministic-logic", label: "Intrinsic non-deterministic logic" },
  { id: "durability-through-replays", label: "Non-deterministic code changes" },
];

const TEST_DIR_TREE = `.
├── backgroundcheck.py
├── main.py
├── ssntraceactivity.py
└── tests
    ├── __init__.py
    ├── backgroundcheck_workflow_history.json
    ├── conftest.py
    └── replay_dacx_test.py`;

const CLI_SHOW_LOCAL = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --output json > tests/backgroundcheck_workflow_history.json`;

const CLI_SHOW_CLOUD = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --tls-cert-path /path/to/ca.pem \\
 --tls-key-path /path/to/ca.key \\
 --output json  > tests/backgroundcheck_workflow_history.json`;

const CLI_SHOW_SELF_HOSTED = `temporal_docker workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace \\
 --output json  > tests/backgroundcheck_workflow_history.json`;

const REPLAY_TEST_PY = `@pytest.mark.asyncio
async def test_replay_workflow_history_from_file():
    with open("tests/backgroundcheck_workflow_history.json", "r") as f:
        history_json = json.load(f)
        await Replayer(workflows=[BackgroundCheck]).replay_workflow(
            WorkflowHistory.from_json("backgroundcheck_workflow", history_json)
        )`;

const EVENT_HISTORY_SHOW = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace`;

const EVENT_HISTORY_OUTPUT = `Progress:
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

const BACKGROUNDCHECK_SLEEP_PY = `import asyncio
from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from ssntraceactivity import ssn_trace_activity

@workflow.defn()
class BackgroundCheck:
    @workflow.run
    async def run(self, ssn: str) -> str:
        random_number = workflow.random().randint(1, 100)
        if random_number < 50:
            await asyncio.sleep(60)
            workflow.logger.info("Sleeping for 60 seconds")
        return await workflow.execute_activity(
            ssn_trace_activity,
            ssn,
            schedule_to_close_timeout=timedelta(seconds=5),
        )`;

const IMG_BASE = "/img/tutorials/python/background-check";

export default function Chapter3DurableExecution() {
  return (
    <Layout
      title="Develop for durability - Temporal Python SDK Background Check tutorial"
      description="Chapter 3: Retrieve Event Histories, add a Replay test, and avoid non-deterministic Workflow code."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_python.png"
            alt="Temporal Python SDK"
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Python", href: "/tutorials/python" },
                  {
                    label: "Background Check",
                    href: "/tutorials/python/background-check/",
                  },
                  { label: "Develop for durability" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Develop code that durably executes
            </h1>

            <MetaChips items={["~25 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              When it comes to the Temporal Platform's ability to durably
              execute code, the SDK's ability to{" "}
              <a
                href="https://docs.temporal.io/encyclopedia/temporal-sdks#replays"
                target="_blank"
                rel="noopener noreferrer"
              >
                Replay
              </a>{" "}
              a Workflow Execution is a major aspect of that. This chapter
              introduces the development patterns which enable that.
            </p>

            <Admonition type="note" title="Develop for a Durable Execution">
              <p>
                This chapter of the Temporal Python SDK Background Check
                tutorial introduces best practices to developing deterministic
                Workflows that can be Replayed, enabling a{" "}
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
              This chapter builds on the Project setup chapter and relies on
              the Background Check use case and sample applications as a means
              to contextualize the information.
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
              <CodeBlock language="text">{TEST_DIR_TREE}</CodeBlock>

              <p>
                <strong>Local dev server</strong>
              </p>
              <p>
                If you have been following along with the earlier chapters of
                this guide, your Workflow Id might be something like{" "}
                <code>backgroundcheck_workflow</code>.
              </p>
              <CodeBlock language="shell">{CLI_SHOW_LOCAL}</CodeBlock>

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
              <CodeBlock language="shell">{CLI_SHOW_CLOUD}</CodeBlock>

              <p>
                <strong>Self-hosted Temporal Cluster</strong>
              </p>
              <p>
                For self-hosted environments, you might be using the Temporal
                CLI command alias:
              </p>
              <CodeBlock language="shell">{CLI_SHOW_SELF_HOSTED}</CodeBlock>

              <h3>Via the UI</h3>
              <p>
                A Workflow Execution's Event History is also available in the
                Web UI. Navigate to the Workflows page in the UI and select
                the Workflow Execution.
              </p>
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
                <a
                  href="https://python.temporal.io/temporalio.worker.Replayer.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Replayer
                </a>{" "}
                class in the SDK. Register the Workflow Definition and then
                specify an existing Event History to compare to.
              </p>
              <p>
                Run the tests in the test directory (pytest). If the Workflow
                Definition and the Event History are incompatible, then the
                test fails.
              </p>
              <CodeBlock language="py" title="backgroundcheck_replay/tests/replay_dacx_test.py">
                {REPLAY_TEST_PY}
              </CodeBlock>
              <p>
                <a
                  href="https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WorkflowEnvironment
                </a>{" "}
                is a class in the Temporal Python SDK that provides a testing
                suite for running Workflows and Activity code.{" "}
                <a
                  href="https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#start_time_skipping"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  start_time_skipping()
                </a>{" "}
                is a method that allows you to skip time in a Workflow
                Execution. By skipping time, you can quickly test how Workflows
                behave over extended periods of time without needing to wait
                in real-time.
              </p>

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
                  <strong>
                    <a href="#intrinsic-non-deterministic-logic">
                      Intrinsic non-deterministic logic
                    </a>
                    :
                  </strong>{" "}
                  This occurs when Workflow state or branching logic within the
                  Workflow gets determined by factors beyond the SDK's control.
                </li>
                <li>
                  <strong>
                    <a href="#durability-through-replays">
                      Non-deterministic code changes
                    </a>
                    :
                  </strong>{" "}
                  When you change your Workflow code and deploy those changes
                  while there are still active Workflow Executions relying on
                  older code versions.
                </li>
              </ol>
            </section>

            <section className={styles.section} id="intrinsic-non-deterministic-logic">
              <h2 className={styles.sectionTitle}>
                Intrinsic non-deterministic logic
              </h2>
              <p>
                "Intrinsic non-determinism" refers to types of Workflow code
                that can disrupt the completion of a Workflow by diverging
                from the expected code path based on the Event History. For
                instance, using a random number to decide which Activities to
                execute is a classic example of intrinsic non-deterministic
                code.
              </p>
              <p>
                Luckily, for Python developers, the Python SDK employs a sort
                of "Sandbox" environment that either wraps many of the typical
                non-deterministic calls, making them safe to use, or prevents
                you from running the code in the first place.
              </p>
              <p>
                Calls that are disallowed will cause a Workflow Task to fail
                with a "Restricted Workflow Access" error, necessitating code
                modification for the Workflow to proceed.
              </p>
              <p>
                Calls such as <code>random.randint()</code> are actually
                caught by the SDK, so that the resulting number persists and
                doesn't cause deterministic issues.
              </p>
              <p>However the sandbox is not foolproof and non-deterministic issues can still occur.</p>
              <p>
                Developers are encouraged to use the SDK's APIs when possible
                and avoid potentially intrinsically non-deterministic code:
              </p>
              <ul>
                <li>
                  <strong>Random number generation:</strong>
                  <ul>
                    <li>
                      Replace <code>random.randint()</code> with{" "}
                      <code>workflow.random().randint()</code>.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Time management:</strong>
                  <ul>
                    <li>
                      Use <code>workflow.now()</code> instead of{" "}
                      <code>datetime.now()</code> or <code>workflow.time()</code>{" "}
                      instead of <code>time.time()</code> for current time.
                    </li>
                    <li>
                      Leverage the custom <code>asyncio</code> event loop in
                      Workflows; use <code>asyncio.sleep()</code> as needed.
                    </li>
                  </ul>
                </li>
              </ul>
              <p>
                Read more about{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/python-sdk-sandbox"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How the Python Sandbox works
                </a>{" "}
                for details.
              </p>
              <p>Other common ways to introduce non-deterministic issues into a Workflow:</p>
              <ol>
                <li>
                  <strong>External system interaction:</strong>
                  <ul>
                    <li>
                      Avoid direct external API calls, file I/O operations,
                      interactions with other services, or LLM and other AI
                      service invocations. The latter are non-deterministic
                      even when the network call succeeds, since the same
                      prompt may return a different response on each call.
                    </li>
                    <li>Utilize Activities for these operations.</li>
                  </ul>
                </li>
                <li>
                  <strong>Data structure iteration:</strong>
                  <ul>
                    <li>Use Python dictionaries as they are deterministically ordered.</li>
                  </ul>
                </li>
                <li>
                  <strong>Run Id usage:</strong>
                  <ul>
                    <li>Be cautious with storing or evaluating the run Id.</li>
                  </ul>
                </li>
              </ol>

              <h3>Does this mean Temporal can't be used for AI?</h3>
              <p>
                No - the opposite. Workflow determinism is exactly what makes
                Temporal a strong fit for AI applications. LLM calls, tool
                use, and agent steps are non-deterministic by nature, so you
                place them in Activities. This separation makes the
                orchestration dependable even though these individual steps
                are non-deterministic, so your agent can recover from crashes,
                retry failed LLM calls, and resume long-running tasks without
                losing state.
              </p>
            </section>

            <section className={styles.section} id="durability-through-replays">
              <h2 className={styles.sectionTitle}>
                Non-deterministic code changes
              </h2>
              <p>
                The most important thing to take away from this section is to
                make sure you have an application versioning plan whenever you
                are developing and maintaining a Temporal Application that
                will eventually deploy to a production environment.
              </p>
              <p>
                Versioning APIs and versioning strategies are covered in other
                parts of the tutorial; this chapter sets the stage to
                understand why and how to approach those strategies.
              </p>

              <h3>The Event History</h3>
              <p>
                Inspect the Event History of a recent Background Check
                Workflow using the <code>temporal workflow show</code> command:
              </p>
              <CodeBlock language="shell">{EVENT_HISTORY_SHOW}</CodeBlock>
              <p>You should see output similar to this:</p>
              <CodeBlock language="shell">{EVENT_HISTORY_OUTPUT}</CodeBlock>
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
                  <code>WorkflowTaskStarted</code>: This Event indicates that a
                  Worker successfully polled the Task and started evaluating
                  Workflow code.
                </li>
                <li>
                  <code>WorkflowTaskCompleted</code>: This Event indicates that
                  the Worker suspended execution and made as much progress as
                  it could.
                </li>
                <li>
                  <code>ActivityTaskScheduled</code>: This Event indicates that
                  the ExecuteActivity API was called and the Worker sent the{" "}
                  <a
                    href="https://docs.temporal.io/references/commands#scheduleactivitytask"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ScheduleActivityTask
                  </a>{" "}
                  Command to the Server.
                </li>
                <li>
                  <code>ActivityTaskStarted</code>: This Event indicates that
                  the Worker successfully polled the Activity Task and started
                  evaluating Activity code.
                </li>
                <li>
                  <code>ActivityTaskCompleted</code>: This Event indicates that
                  the Worker completed evaluation of the Activity code and
                  returned any results to the Server. In response, the Server
                  schedules another Workflow Task to finish evaluating the
                  Workflow code resulting in the remaining Events,{" "}
                  <code>WorkflowTaskScheduled</code>,{" "}
                  <code>WorkflowTaskStarted</code>,{" "}
                  <code>WorkflowTaskCompleted</code>,{" "}
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
                Use the <code>asyncio.sleep()</code> API to cause the Workflow
                to sleep for a minute before the call to execute the Activity.
                The Temporal Python SDK offers deterministic implementations
                to the following API calls:
              </p>
              <ul>
                <li>
                  <a
                    href="https://python.temporal.io/temporalio.workflow.html#now"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    workflow.now()
                  </a>
                </li>
                <li>
                  <a
                    href="https://python.temporal.io/temporalio.workflow.html#random"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    workflow.random()
                  </a>
                </li>
                <li>
                  <a
                    href="https://python.temporal.io/temporalio.workflow.html#time_ns"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    workflow.time_ns()
                  </a>
                </li>
                <li>
                  <a
                    href="https://python.temporal.io/temporalio.workflow.html#time"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    workflow.time()
                  </a>
                </li>
                <li>
                  <a
                    href="https://python.temporal.io/temporalio.workflow.html#uuid4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    workflow.uuid4()
                  </a>
                </li>
              </ul>
              <p>
                Use the <code>workflow.logger</code> API to log from Workflows
                to avoid seeing repeated logs from the Replay of the Workflow
                code.
              </p>
              <CodeBlock language="py" title="backgroundcheck_replay/backgroundcheck_dacx.py">
                {BACKGROUNDCHECK_SLEEP_PY}
              </CodeBlock>

              <h3>Inspect the new Event History</h3>
              <p>
                After updating your Workflow code to include the logging and
                Timer, run your tests again. You should expect to see the{" "}
                <code>TestReplayWorkflowHistoryFromFile</code> test fail. This
                is because the code we added creates new Events and alters
                the Event History sequence.
              </p>
              <p>
                To get this test to pass, we must get an updated Event History
                JSON file. Start a new Workflow and after it is complete,
                download the Event History as a JSON object.
              </p>

              <Admonition type="info" title="Double check Task Queue names">
                <p>
                  Reminder that this guide jumps between several sample
                  applications using multiple Task Queues. Make sure you are
                  starting Workflows on the same Task Queue that the Worker is
                  listening to. Always make sure that all Workers listening to
                  the same Task Queue are registered with the same Workflows
                  and Activities.
                </p>
              </Admonition>

              <p>
                If you inspect the new Event History, you will see two new
                Events in response to the <code>asyncio.sleep()</code> API
                call, which send the{" "}
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
                Events related to logging. And if you were to remove the Sleep
                call from the code, there wouldn't be a compatibility issue
                with the previous code. This is to highlight that only certain
                code changes within Workflow code is non-deterministic. The
                basic thing to remember is that if the API call causes a{" "}
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
                <li>Adding, removing, reordering an Activity call inside a Workflow Execution</li>
                <li>
                  Switching the Activity Type used in a call to{" "}
                  <code>ExecuteActivity</code>
                </li>
                <li>Adding or removing a Timer</li>
                <li>Altering the execution order of Activities or Timers relative to one another</li>
              </ul>
              <p>The following are a few examples of changes that do not lead to non-deterministic errors:</p>
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
                to="/tutorials/python/background-check/project-setup/"
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
                to="/tutorials/python/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Back to Python tutorials{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Browse more tutorials
                </span>
              </Link>
            </div>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/python/geocoding-app/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build a geocoding application</h3>
                  <p className={styles.nextBody}>
                    Get input from a user and call a REST API - a friendly
                    introduction to Activities.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/python/build-an-email-drip-campaign/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build an email drip campaign</h3>
                  <p className={styles.nextBody}>
                    Implement an email subscription application using
                    Workflows, Activities, and Queries from a Flask web action.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/python/build-a-data-pipeline/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build a data pipeline</h3>
                  <p className={styles.nextBody}>
                    Orchestrate a data pipeline using Workflows, Activities,
                    and Schedules to run on an interval.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/python/trip-booking-app/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build a trip booking app</h3>
                  <p className={styles.nextBody}>
                    Use the Saga pattern with compensating Activities to roll
                    back partially completed bookings.
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
