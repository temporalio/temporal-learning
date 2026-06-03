// Free preview lesson 2 of 2 from the Temporal 101 (Go) course.
// Source: https://github.com/temporalio/edu-101-go-content (understanding-workflow-execution/code-walkthrough.md)

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const LESSONS = [
  {
    n: 1,
    label: "About this example",
    href: "/courses/temporal_101/go/understanding-workflow-execution/about-this-example/",
  },
  {
    n: 2,
    label: "Code walkthrough",
    href: "/courses/temporal_101/go/understanding-workflow-execution/code-walkthrough/",
  },
];

const TOC_ITEMS = [
  { id: "video", label: "Video" },
  { id: "transcript", label: "Transcript" },
];

export default function CodeWalkthroughPage() {
  return (
    <Layout
      title="Code walkthrough - Temporal 101 (Go) free preview"
      description="Free preview of Temporal 101 (Go): watch a step-by-step walkthrough of a Workflow Execution and its Event History."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 101", href: "/courses/temporal_101" },
                  { label: "Go", href: "/courses/temporal_101/go" },
                  {
                    label: "Understanding Workflow Execution",
                    href: "/courses/temporal_101/go/understanding-workflow-execution/about-this-example/",
                  },
                  { label: "Code walkthrough" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Code walkthrough</h1>

            <MetaChips items={["Free preview", "Temporal 101", "Go"]} />

            <TutorialStepper steps={LESSONS} currentStep={2} />

            <p className={styles.intro}>
              Watch a step-by-step walkthrough of the example application as a
              Workflow Execution progresses. Pay attention to the Event History
              on the right side of the screen - new events appear as the
              Worker, the Temporal Cluster, and the Client interact.
            </p>

            <section className={styles.section} id="video">
              <h2 className={styles.sectionTitle}>Video</h2>
              <div
                style={{
                  maxWidth: "1040px",
                  aspectRatio: "1040/585",
                  margin: "24px auto",
                }}
              >
                <iframe
                  width="1040"
                  height="585"
                  src="https://www.youtube.com/embed/gMP01CmD-rI?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0"
                  title="Code Walkthrough (Temporal 101 - Go)"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: 0 }}
                ></iframe>
              </div>
            </section>

            <section className={styles.section} id="transcript">
              <h2 className={styles.sectionTitle}>Transcript</h2>
              <details>
                <summary>Video Transcript</summary>
                <p>
                  As you learned, the Worker executes your Workflow and
                  Activity code, so a Workflow Execution cannot progress unless
                  at least one Worker is running. Launching the Worker creates
                  a new process. Since this example is written in Go, a program
                  begins by locating the main package and running the main
                  function.
                </p>
                <p>This function first creates a Temporal client.</p>
                <p>
                  Next, it creates a new Worker Entity with that client, the
                  name of the Task Queue, and options for configuring its
                  behavior. This example uses the default options.
                </p>
                <p>
                  A Worker can execute Workflow and Activity Tasks for types
                  that are registered with it. The highlighted lines include
                  references to function names in the Workflow and Activity
                  Definitions.
                </p>
                <p>
                  Running the Worker Entity opens a long-lasting connection to
                  the Temporal Cluster, which it uses to continuously poll for
                  new tasks. Although the Worker is running, the Workflow is
                  not, so the task queue is empty and the Worker has nothing
                  to do.
                </p>
                <p>
                  One way to start the Workflow is with the{" "}
                  <code>temporal</code> command-line tool. This example
                  specifies the name of the Worker's task queue, a
                  user-defined Workflow ID, the Workflow Type, and the input
                  data.
                </p>
                <p>
                  An alternative is to start it from code within your own
                  application by using a Temporal client to call the{" "}
                  <code>ExecuteWorkflow</code> function with your input.
                </p>
                <p>
                  Regardless of how you start the Workflow, the behavior will
                  be the same: the Temporal Cluster records a new Event into
                  the Event History of this Workflow Execution.{" "}
                  <code>WorkflowExecutionStarted</code> is always the first
                  Event.
                </p>
                <p>
                  As I continue with my explanation, pay attention to the
                  Event History shown on the right. Additional events will
                  begin appearing below this one as Workflow Execution
                  progresses. I won't mention all of them, but I highlight
                  them in yellow when they first appear so they're easier to
                  spot.
                </p>
                <p>
                  The Temporal Cluster adds a Workflow Task to the Task Queue
                  and records another event, <code>WorkflowTaskScheduled</code>
                  , into the Event History. Its name follows a pattern: when a
                  new Task is added to the queue, the name ends with
                  "Scheduled."
                </p>
                <p>
                  Since the Worker Process has capacity to do some processing
                  work, it accepts this new Task. This results in a new Event,
                  one whose name also follows a pattern. When a Worker
                  dequeues a Task, the Cluster generates an event whose name
                  ends with "Started."
                </p>
                <p>
                  The Worker Process begins the Workflow Task by invoking the
                  function from the Workflow Definition. It continues by
                  running code within this function. In this example, the
                  first few statements configure timeout options for the
                  Activities.
                </p>
                <p>
                  The Workflow code highlighted here declares a variable that
                  will receive the output of our first Activity and then
                  requests execution of that Activity:{" "}
                  <code>GreetInSpanish</code>. Since <code>ExecuteActivity</code>{" "}
                  returns a Future, and this example invokes a <code>Get</code>{" "}
                  function on that, it will block until the Activity Execution
                  completes, at which point we can access the output if the
                  execution was successful or the error if it was not.
                </p>
                <p>
                  A few important things happen as a result of the{" "}
                  <code>ExecuteActivity</code> call. The Worker can't make
                  further progress on the Workflow until the Activity
                  Execution concludes, so it notifies the Cluster that the
                  current Workflow Task is complete. In response, the Cluster
                  adds a new Event to history. The Worker also sends a command
                  to the cluster requesting it to schedule an Activity Task.
                </p>
                <p>
                  The Temporal Cluster creates an Activity Task and adds it to
                  the Task Queue, resulting in a new Event.
                </p>
                <p>
                  Since the Worker Process has capacity to perform additional
                  work, it accepts the Activity Task.
                </p>
                <p>
                  The Worker Entity now invokes the function corresponding to
                  the Activity Definition for the <code>GreetInSpanish</code>{" "}
                  Activity.
                </p>
                <p>
                  The Worker then runs the code within the function. In this
                  case, the Activity calls the utility function, which in turn
                  issues a request to the microservice.
                </p>
                <p>
                  This request was successful and the service responds by
                  providing a customized greeting in Spanish.
                </p>
                <p>
                  When the Activity function returns, Worker notifies the
                  cluster that the Activity Task is complete, resulting in a
                  new Event.
                </p>
                <p>
                  In response, the Temporal Cluster queues a new Workflow Task
                  and logs another Event.
                </p>
                <p>
                  When the Worker accepts this new Task, the Temporal Cluster
                  adds a WorkflowTaskStarted Event to the History.
                </p>
                <p>
                  The Worker continues where it left off by executing the next
                  statement in the Workflow Definition.
                </p>
                <p>
                  It is now time to execute the second Activity, so the Worker
                  notifies the Temporal Cluster that the current Workflow Task
                  is complete and sends a Command to schedule an Activity
                  Task.
                </p>
                <p>
                  The Temporal Cluster queues an Activity Task for the second
                  Activity and logs an <code>ActivityTaskScheduled</code> Event
                  to the history. Let's take a moment to look at a failure
                  scenario. What happens if the Worker crashes; for example,
                  because it ran out of memory?
                </p>
                <p>
                  You can recover from this by restarting the Worker or
                  launching a new Worker on a different machine. In either
                  case, Temporal will automatically recreate the state of the
                  Workflow up to the point of failure, so progress will
                  continue on from there, as if the Worker never crashed at
                  all.
                </p>
                <p>
                  Activities that completed successfully before the crash
                  won't be executed again; instead, Temporal reuses the values
                  returned by their previous executions.
                </p>
                <p>
                  When the Worker accepts the Activity Task. The Temporal
                  Cluster adds <code>ActivityTaskStarted</code> to the Event
                  History.
                </p>
                <p>
                  The Worker now invokes the function for the second Activity.
                  As before, it then runs the code within the function, which
                  uses the utility method to call a microservice.
                </p>
                <p>
                  But what if that microservice went offline just before the
                  request? In this case, the request would fail, ultimately
                  causing the Activity function to return an error.
                </p>
                <p>
                  The default behavior in Temporal is for a failed Activity to
                  be automatically retried, with a short delay, until it
                  succeeds or is canceled. You can customize this behavior
                  with a Retry Policy.
                </p>
                <p>
                  Through a retry, the Worker invokes the Activity function
                  again, which in turn invokes the utility function and calls
                  out to the microservice.
                </p>
                <p>
                  For this example, let's assume that the service outage was
                  an intermittent failure, so the request made during the
                  retry is successful.
                </p>
                <p>
                  Since the service is now back online, it responds to our
                  latest request and provides the requested farewell message.
                </p>
                <p>
                  When the function returns, the Worker notifies the Temporal
                  Cluster that the Activity Task is complete.
                </p>
                <p>
                  There are still a few lines of the Workflow code that
                  haven't been run yet, so the Temporal Cluster adds a new
                  Workflow Task to the queue.
                </p>
                <p>
                  When the Worker accepts this new Task, the Temporal Cluster
                  adds a <code>WorkflowTaskStarted</code> Event to the history.
                  The Worker continues where it left off, executing the
                  remaining statements in the Workflow Definition.
                </p>
                <p>
                  Once this function returns, the Workflow Task is complete.
                </p>
                <p>
                  Since the Workflow function returned, Workflow Execution is
                  now complete, and the Cluster adds the final event to its
                  history.
                </p>
                <p>
                  The Worker continues polling for new Tasks, but there is no
                  more work related to this Workflow Execution.
                </p>
                <p>
                  The client application, which has been awaiting the result
                  of the Workflow Execution because it's blocked on the Get
                  call, will now receive that value.
                </p>
                <p>
                  The cluster provides the result to the application, which
                  can process it however it wishes.
                </p>
                <p>And now you've seen what happens during a Workflow Execution.</p>
              </details>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/go/understanding-workflow-execution/about-this-example/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: lesson 1
                </span>
                <span className={styles.chapterNavTitle}>
                  About this example
                </span>
              </Link>
            </div>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>
                You've finished the free preview
              </h2>
              <p style={{ marginBottom: "16px", color: "var(--nd-fg-muted)" }}>
                Continue on TalentLMS to unlock the rest of Temporal 101 for free -
                including quizzes, exercises, and the deeper material on
                Workflow Execution, Event History, failure handling, and more.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <MagentaCta href="https://temporal.talentlms.com/catalog/info/id:126">
                  Continue on TalentLMS
                </MagentaCta>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
