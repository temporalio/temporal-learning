// Chapter 3 of 3: Develop code that durably executes with Java.

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
  { n: 1, label: "Introduction", href: "/tutorials/java/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/java/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/java/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "retrieve-event-history", label: "Retrieve Event History" },
  { id: "add-replay-test", label: "Add a Replay test" },
  { id: "intrinsic-non-deterministic-logic", label: "Intrinsic non-deterministic logic" },
  { id: "durability-through-replays", label: "Non-deterministic code changes" },
  { id: "workflow-reset", label: "Workflow Reset" },
];

const IMG_BASE = "/img/tutorials/java/background-check";

const DIR_TREE = `/backgroundcheck
    ...
    /main
    /test
    backgroundcheck_workflow_history.json`;

const SHOW_LOCAL = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --output json > backgroundcheck_workflow_event_history.json`;

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

const REPLAY_TEST_SNIPPET = `// ...
  @Test
  public void testSuccessfulReplayFromFile(BackgroundCheckReplayWorkflow workflow) throws Exception {

    File eventHistoryFile = new File("backgroundcheck_workflow_event_history.json");

    assertDoesNotThrow(() -> WorkflowReplayer.replayWorkflowExecution(eventHistoryFile,
        BackgroundCheckReplayWorkflowImpl.class));

  }
}`;

const NON_DETERMINISTIC_WORKFLOW = `package backgroundcheckreplay;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;
import java.util.Random;

public class BackgroundCheckReplayNonDeterministicWorkflowImpl implements BackgroundCheckReplayNonDeterministicWorkflow {

  // Define the Activity Execution options
  // StartToCloseTimeout or ScheduleToCloseTimeout must be set
  ActivityOptions options = ActivityOptions.newBuilder()
          .setStartToCloseTimeout(Duration.ofSeconds(5))
          .build();

  // Create an client stub to activities that implement the given interface
  private final BackgroundCheckReplayActivities activities =
      Workflow.newActivityStub(BackgroundCheckReplayActivities.class, options);

  @Override
  public String backgroundCheck(String socialSecurityNumber) {

    // CAUTION, the following code is an anti-pattern showing what NOT to do
    Random random = new Random();
    if(random.nextInt(101)>= 50){
      Workflow.sleep(Duration.ofSeconds(60));
    }

    // Execute the Activity synchronously (wait for the result before proceeding)
    String ssnTraceResult = activities.ssnTraceActivity(socialSecurityNumber);

    // Make the results of the Workflow available
    return ssnTraceResult;
  }

}`;

const SHOW_WORKFLOW = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow \\
 --namespace backgroundcheck_namespace`;

const HISTORY_OUTPUT = `Progress:
  ID          Time                     Type
   1  2023-11-08T21:58:50Z  WorkflowExecutionStarted
   2  2023-11-08T21:58:50Z  WorkflowTaskScheduled
   3  2023-11-08T21:58:50Z  WorkflowTaskStarted
   4  2023-11-08T21:58:50Z  WorkflowTaskCompleted
   5  2023-11-08T21:58:50Z  TimerStarted
   6  2023-11-08T21:59:50Z  TimerFired
   7  2023-11-08T21:59:50Z  WorkflowTaskScheduled
   8  2023-11-08T21:59:50Z  WorkflowTaskStarted
   9  2023-11-08T21:59:50Z  WorkflowTaskCompleted
  10  2023-11-08T21:59:50Z  ActivityTaskScheduled
  11  2023-11-08T21:59:50Z  ActivityTaskStarted
  12  2023-11-08T21:59:50Z  ActivityTaskCompleted
  13  2023-11-08T21:59:50Z  WorkflowTaskScheduled
  14  2023-11-08T21:59:50Z  WorkflowTaskStarted
  15  2023-11-08T21:59:50Z  WorkflowTaskCompleted
  16  2023-11-08T21:59:50Z  WorkflowExecutionCompleted

Result:
  Status: COMPLETED
  Output: ["pass"]`;

const SLEEPING_WORKFLOW = `package backgroundcheckreplay;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;

public class BackgroundCheckReplayWorkflowImpl implements BackgroundCheckReplayWorkflow {

  public static final Logger logger = Workflow.getLogger(BackgroundCheckReplayWorkflowImpl.class);

  // Define the Activity Execution options
  // StartToCloseTimeout or ScheduleToCloseTimeout must be set
  ActivityOptions options = ActivityOptions.newBuilder()
          .setStartToCloseTimeout(Duration.ofSeconds(5))
          .build();

  // Create an client stub to activities that implement the given interface
  private final BackgroundCheckReplayActivities activities =
      Workflow.newActivityStub(BackgroundCheckReplayActivities.class, options);

  @Override
  public String backgroundCheck(String socialSecurityNumber) {

    // Sleep for 1 minute
    logger.info("Sleeping for 1 minute...");
    Workflow.sleep(Duration.ofSeconds(60));
    logger.info("Finished sleeping");

    // Execute the Activity synchronously (wait for the result before proceeding)
    String ssnTraceResult = activities.ssnTraceActivity(socialSecurityNumber);

    // Make the results of the Workflow available
    return ssnTraceResult;
  }

}`;

const RESET_CLI = `$ temporal workflow reset \\
	--workflow-id my-workflow-id \\
	--event-id 4 \\
	--reason "Non-deterministic Error"`;

const WORKER_LOG = `13:47:20.429 WARN  - Workflow task processing failure. startedEventId=8, WorkflowId=test, RunId=20ec9811-89c5-454e-b9ed-c284f19565e4. If seen continuously the workflow might be stuck.
io.temporal.worker.NonDeterministicException: Failure handling event 5 of type 'EVENT_TYPE_TIMER_STARTED' during replay. Event 5 of type EVENT_TYPE_TIMER_STARTED does not match command type COMMAND_TYPE_SCHEDULE_ACTIVITY_TASK. {WorkflowTaskStartedEventId=8, CurrentStartedEventId=3}
        at io.temporal.internal.statemachines.WorkflowStateMachines.handleCommandEvent(WorkflowStateMachines.java:442)
        ...`;

const SHOW_LONG = `temporal workflow show \\
 --workflow-id backgroundcheck_workflow_break \\
 --namespace backgroundcheck_namespace \\
 --fields long`;

export default function DurableExecutionChapter() {
  return (
    <Layout
      title="Develop for durability - Build a Background Check application with Java"
      description="Chapter 3: Retrieve Event Histories, add Replay tests, recognize non-deterministic code, and reset Workflows."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_java.png"
            alt="Temporal Java SDK"
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
                  { label: "Java", href: "/tutorials/java" },
                  {
                    label: "Background Check",
                    href: "/tutorials/java/background-check/",
                  },
                  { label: "Develop for durability" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Develop code that durably executes
            </h1>

            <MetaChips items={["~30 minutes", "Beginner", "Java"]} />

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
                This chapter introduces best practices for developing
                deterministic Workflows that can be Replayed, enabling{" "}
                <a
                  href="https://docs.temporal.io/temporal#durable-execution"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Durable Execution
                </a>
                . By the end of this section you will know basic best
                practices for Workflow Definition development.
              </p>
              <p>Learning objectives:</p>
              <ul>
                <li>Identify SDK API calls that map to Events</li>
                <li>Recognize non-deterministic Workflow code</li>
                <li>Explain how Workflow code execution progresses</li>
              </ul>
              <p>
                The information in this chapter is also available in the{" "}
                <Link to="/courses/temporal_102/">Temporal 102 course</Link>.
              </p>
            </Admonition>

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
                . Start by using either the Temporal CLI or the Web UI.
              </p>

              <h3>Using the Temporal CLI</h3>
              <p>
                Use <code>temporal workflow show</code> to save the Event
                History to a local file. Run the command from the{" "}
                <code>/backgroundcheckreplay</code> directory so the file is
                available to the testing files.
              </p>
              <CodeBlock>{DIR_TREE}</CodeBlock>

              <p>
                <strong>Local dev server:</strong>
              </p>
              <CodeBlock language="bash">{SHOW_LOCAL}</CodeBlock>

              <Admonition type="info" title="Workflow Id returns the most recent Workflow Execution">
                <p>
                  The most recent Event History for that Workflow Id is
                  returned when you only use the Workflow Id to identify the
                  Workflow Execution. Use the <code>--run-id</code> option to
                  get the Event History of an earlier Workflow Execution by
                  the same Workflow Id.
                </p>
              </Admonition>

              <p>
                <strong>Temporal Cloud:</strong> provide the paths to your
                certificate and private keys, or set those paths as environment
                variables:
              </p>
              <CodeBlock language="bash">{SHOW_CLOUD}</CodeBlock>

              <p>
                <strong>Self-hosted:</strong>
              </p>
              <CodeBlock language="bash">{SHOW_SELFHOSTED}</CodeBlock>

              <h3>Via the UI</h3>
              <p>
                A Workflow Execution's Event History is also available in the
                Web UI. Navigate to the Workflows page and select the Workflow
                Execution.
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
              <p>Add the Replay test to the set of application tests.</p>
              <CodeBlock
                language="java"
                title="src/test/java/backgroundcheckreplay/BackgroundCheckReplayWorkflowTest.java"
              >
                {REPLAY_TEST_SNIPPET}
              </CodeBlock>

              <h3>Why add a Replay test?</h3>
              <p>
                The Replay test is important because it verifies whether the
                current Workflow code remains compatible with the Event
                Histories of earlier Workflow Executions.
              </p>
              <p>
                A failed Replay test typically indicates non-deterministic
                behavior - for a specific input, the Workflow code can follow
                different code paths during each execution, resulting in
                distinct sequences of Events. The Replay test executes the
                same steps as the SDK and verifies compatibility.
              </p>
              <p>
                Workflow code becomes non-deterministic primarily through two
                main avenues:
              </p>
              <ol>
                <li>
                  <a href="#intrinsic-non-deterministic-logic">
                    Intrinsic non-deterministic logic
                  </a>{" "}
                  - when Workflow state or branching logic gets determined by
                  factors beyond the SDK's control.
                </li>
                <li>
                  <a href="#durability-through-replays">
                    Non-deterministic code changes
                  </a>{" "}
                  - when you change Workflow code and deploy those changes
                  while there are still active Workflow Executions relying on
                  older code versions.
                </li>
              </ol>
            </section>

            <section
              className={styles.section}
              id="intrinsic-non-deterministic-logic"
            >
              <h2 className={styles.sectionTitle}>
                Intrinsic non-deterministic logic
              </h2>
              <p>
                "Intrinsic non-determinism" can prevent the Workflow code from
                completing because the Workflow can take a different code path
                than the one expected from the Event History.
              </p>
              <p>
                The following are some common operations that <strong>can't</strong>{" "}
                be done inside of a Workflow Definition:
              </p>
              <ul>
                <li>
                  Generate and rely on random numbers (use Activities
                  instead).
                </li>
                <li>
                  Access or mutate external systems or state. This includes
                  calling an external API, conducting a file I/O operation,
                  talking to another service, invoking an LLM or other AI
                  service (use Activities instead). LLMs and AI services are
                  non-deterministic even when the network call succeeds,
                  since the same prompt may return a different response on
                  each call.
                </li>
                <li>
                  Rely on system time:
                  <ul>
                    <li>
                      Use <code>Workflow.currentTimeMillis()</code> as a
                      replacement for{" "}
                      <code>System.CurrentTimeMillis()</code>.
                    </li>
                    <li>
                      Use <code>Workflow.Sleep()</code> as a replacement for{" "}
                      <code>Thread.Sleep()</code>.
                    </li>
                  </ul>
                </li>
                <li>Work directly with threads.</li>
                <li>
                  Iterate over data structures with unknown ordering. This
                  includes iterating over HashMaps using <code>for</code> as
                  the order is randomized. Collect the keys of the map, sort
                  them, and then iterate over the sorted keys, or use a{" "}
                  <code>LinkedHashMap</code> or other ordered data structure.
                </li>
                <li>Store or evaluate the run Id.</li>
              </ul>
              <p>
                One way to produce a non-deterministic error is to use a
                random number to determine whether to sleep inside the
                Workflow:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckreplay/BackgroundCheckReplayNonDeterministicWorkflowImpl.java"
              >
                {NON_DETERMINISTIC_WORKFLOW}
              </CodeBlock>

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

            <section
              className={styles.section}
              id="durability-through-replays"
            >
              <h2 className={styles.sectionTitle}>
                Non-deterministic code changes
              </h2>
              <p>
                The most important thing to take away from this section is to
                make sure you have an application versioning plan whenever you
                are developing and maintaining a Temporal Application that
                will eventually deploy to a production environment.
              </p>

              <h3>The Event History</h3>
              <p>
                Inspect the Event History of a recent Background Check
                Workflow using <code>temporal workflow show</code>:
              </p>
              <CodeBlock language="bash">{SHOW_WORKFLOW}</CodeBlock>
              <p>You should see output similar to this:</p>
              <CodeBlock>{HISTORY_OUTPUT}</CodeBlock>
              <p>
                All Events are created by the Temporal Server in response to
                either a request coming from a Temporal Client, or a{" "}
                <a
                  href="https://docs.temporal.io/workflows#command"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Command
                </a>{" "}
                coming from the Worker. A closer look:
              </p>
              <ul>
                <li>
                  <code>WorkflowExecutionStarted</code>: created in response
                  to the request to start the Workflow Execution.
                </li>
                <li>
                  <code>WorkflowTaskScheduled</code>: indicates a Workflow
                  Task is in the Task Queue.
                </li>
                <li>
                  <code>WorkflowTaskStarted</code>: indicates that a Worker
                  successfully polled the Task and started evaluating Workflow
                  code.
                </li>
                <li>
                  <code>WorkflowTaskCompleted</code>: the Worker stopped
                  execution and made as much progress as it could.
                </li>
                <li>
                  <code>TimerStarted</code>: schedules a durable timer and
                  records it in the Event History.
                </li>
                <li>
                  <code>TimerFired</code>: after the time specified in the
                  Timer has passed, the Timer fires, resuming execution.
                </li>
                <li>
                  <code>ActivityTaskScheduled</code>: indicates that a request
                  to execute an Activity was made.
                </li>
                <li>
                  <code>ActivityTaskStarted</code>: the Worker successfully
                  polled the Activity Task and started evaluating Activity
                  code.
                </li>
                <li>
                  <code>ActivityTaskCompleted</code>: the Worker completed
                  evaluation of the Activity code and returned results to the
                  Server.
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
                  Workflow Execution's Event History and the data stored in
                  them.
                </p>
              </Admonition>

              <h3>Add a call to sleep</h3>
              <p>
                In the following sample, we add a couple of logging statements
                and a Timer to the Workflow code to see how this affects the
                Event History. Use <code>Workflow.sleep</code> to request the
                Workflow to sleep for a minute before the Activity call. Use{" "}
                <code>Workflow.getLogger</code> to log from Workflows to
                suppress repeated logs from the Replay of the Workflow code.
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckreplay/BackgroundCheckReplayWorkflowImpl.java"
              >
                {SLEEPING_WORKFLOW}
              </CodeBlock>

              <h3>Inspect the new Event History</h3>
              <p>
                After updating your Workflow code, run your tests again. You
                should expect <code>TestReplayWorkflowHistoryFromFile</code>{" "}
                to fail because the new code creates new Events and alters the
                Event History sequence.
              </p>

              <Admonition type="info" title="Double check Task Queue names">
                <p>
                  This guide jumps between several sample applications using
                  multiple Task Queues. Make sure you are starting Workflows
                  on the same Task Queue that the Worker is listening to.
                  Always make sure that all Workers listening to the same Task
                  Queue are registered with the same Workflows and Activities.
                </p>
              </Admonition>

              <p>
                In the new Event History you'll see two new Events in response
                to <code>Workflow.sleep()</code>, which sends the{" "}
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
                <li>
                  <code>TimerStarted</code>
                </li>
                <li>
                  <code>TimerFired</code>
                </li>
              </ul>
              <p>
                You don't see any Events related to logging. And if you were
                to remove the Sleep call from the code, there wouldn't be a
                compatibility issue with the previous code. Only certain code
                changes within Workflow code are non-deterministic. If the
                API call causes a{" "}
                <a
                  href="https://docs.temporal.io/references/commands"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Command
                </a>{" "}
                to create Events that takes a new path from the existing Event
                History, then it is a non-deterministic change.
              </p>
              <p>
                Non-deterministic changes include but are not limited to the
                following:
              </p>
              <ul>
                <li>Adding or removing an Activity</li>
                <li>Adding or removing a Timer</li>
                <li>
                  Altering the execution order of Activities or Timers
                  relative to one another
                </li>
              </ul>
              <p>
                The following are a few examples of changes that do not lead
                to non-deterministic errors:
              </p>
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

            <section className={styles.section} id="workflow-reset">
              <h2 className={styles.sectionTitle}>Workflow Reset</h2>
              <p>
                One way of fixing a Workflow that is blocked by a
                non-deterministic error is to reset the Workflow to an
                earlier state and allow it to progress. This only works if you
                have removed the source of the non-deterministic error.
                Resetting a Workflow to a certain state discards any progress
                the Workflow may have made after that point, so be certain
                this is the action you want to take.
              </p>

              <h3>Resetting via the Web UI</h3>
              <p>
                If you decide you don't need the Timer in this current
                Workflow and delete it, once you have deployed your change,
                go to the currently blocked Workflow in the Web UI and select{" "}
                <strong>Reset</strong> from the dropdown in the top right.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/select-reset-web-ui.png`}
                  alt="Select the Workflow Reset Option"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Next, you'll see a list of available points where the
                Workflow can be reset to. The only valid option would be to
                reset the Workflow to the first{" "}
                <code>WorkflowTaskCompleted</code> with event ID 4, since it
                is before the <code>WorkflowTaskFailed</code> event. Always
                include a reason - the reason will be persisted in the Event
                History and may be useful to others.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/select-event-reset-web-ui.png`}
                  alt="Workflow Reset Points"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Once you've reset the Workflow, you'll notice that the
                Workflow terminated and the Web UI provided a link to a new
                Workflow execution. The Event History up until the point you
                chose was copied over and executed.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/event-terminated-and-reset.png`}
                  alt="Workflow Terminated and Reset"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                After the Timer has fired, the Workflow should execute to
                completion without any more errors. The new Event History
                includes the <code>WorkflowTaskFailed</code> event that was
                used as the reset point, along with the reason you reset the
                Workflow.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/new-event-history-success-with-reset.png`}
                  alt="New Event History Success with Reset"
                  className={styles.diagramImage}
                />
              </p>

              <h3>Resetting via the Temporal CLI</h3>
              <p>
                The following <code>temporal</code> command is the equivalent
                of doing it in the Web UI:
              </p>
              <CodeBlock language="bash">{RESET_CLI}</CodeBlock>
              <p>
                If you run the{" "}
                <code>BackgroundCheckReplayNonDeterministicWorkflow</code>{" "}
                Workflow enough times, eventually you will see a Workflow
                Task failure. The Worker logs will show something similar:
              </p>
              <CodeBlock>{WORKER_LOG}</CodeBlock>
              <p>You will see information about the failure in the Web UI as well.</p>
              <p>
                <img
                  src={`${IMG_BASE}/non-deterministic-workflow-task-failure-java.png`}
                  alt="Web UI view of a non-determinism error"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                To inspect the Workflow Task failure using the Temporal CLI,
                use the <code>long</code> value for the{" "}
                <code>--fields</code> option:
              </p>
              <CodeBlock language="bash">{SHOW_LONG}</CodeBlock>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/java/background-check/project-setup/"
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
                to="/tutorials/java/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Back to{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>Java tutorials</span>
              </Link>
            </div>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/java/build-an-email-drip-campaign/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Java tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Build an email drip campaign
                  </h3>
                  <p className={styles.nextBody}>
                    Implement an email drip campaign with Temporal's
                    Workflows, Activities, and Queries, driven by a Spring
                    Boot web action.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/java/audiobook/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Java tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Create audiobooks with OpenAI
                  </h3>
                  <p className={styles.nextBody}>
                    Build audiobooks from text using OpenAI APIs and Temporal
                    error mitigation.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link to="/courses/" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Self-paced</span>
                  <h3 className={styles.nextTitle}>Temporal courses</h3>
                  <p className={styles.nextBody}>
                    Continue your Temporal journey with free, self-paced
                    courses covering 101, 102, and advanced topics.
                  </p>
                  <span className={styles.nextCta}>
                    Browse courses <span aria-hidden="true">→</span>
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
