// Free preview lesson 2 of 2 for Temporal 101 (TypeScript): Understanding Workflow Execution.
// Source content: github.com/temporalio/edu-101-typescript-content at understanding-workflow-execution/.

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
    href: "/courses/temporal_101/typescript/understanding-workflow-execution/about-this-example/",
  },
  {
    n: 2,
    label: "Code walkthrough",
    href: "/courses/temporal_101/typescript/understanding-workflow-execution/code-walkthrough/",
  },
];

const TOC_ITEMS = [
  { id: "video", label: "Video" },
  { id: "transcript", label: "Transcript" },
];

export default function CodeWalkthroughPage() {
  return (
    <Layout
      title="Code walkthrough - Understanding Workflow Execution (TypeScript)"
      description="Lesson 2: Watch a code walkthrough of a Temporal Workflow Execution using the TypeScript SDK."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 101", href: "/courses/temporal_101" },
                  {
                    label: "TypeScript",
                    href: "/courses/temporal_101/typescript",
                  },
                  { label: "Code walkthrough" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Code walkthrough</h1>

            <MetaChips items={["Free preview", "Temporal 101", "TypeScript"]} />

            <TutorialStepper steps={LESSONS} currentStep={2} />

            <p className={styles.intro}>
              In this video, you will see how a Temporal Workflow Execution
              works by examining the code from the farewell-workflow
              exercise.
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
                  className="video-frame"
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/IvMFHSdRohc?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0"
                  frameBorder="0"
                  allowFullScreen
                  title="Code walkthrough video"
                ></iframe>
              </div>
            </section>

            <section className={styles.section} id="transcript">
              <h2 className={styles.sectionTitle}>Transcript</h2>
              <details>
                <summary>Show transcript</summary>
                <p>
                  In this video, you will see how a Temporal Workflow
                  Execution works by examining the code from the
                  farewell-workflow exercise.
                </p>
                <p>
                  As you have learned, a Worker executes your Workflow and
                  Activity code, so a Workflow Execution cannot progress
                  unless at least one Worker is running.
                </p>
                <p>
                  Take a look at the code for a Worker. This is the{" "}
                  <code>worker.ts</code> file, and I'll go section-by-section
                  through the code to explain what is happening.
                </p>
                <p>
                  At the top of the file, there are two import statements.
                  Since this example is written in TypeScript code, the
                  program begins by importing its dependenices. The first
                  dependency is the Worker from the Temporal TypeScript SDK,
                  and the second is the Activities that you have defined in
                  your <code>activities.ts</code> file.
                </p>
                <p>
                  Next is the <code>run</code> function. This function
                  creates a new Worker Entity and then runs the new Worker.
                </p>
                <p>
                  A Worker executes Workflow and Activity Tasks for types
                  that are registered with it. In this Worker, you
                  registered the Workflow defined in the workflows file, and
                  all functions from the Activities module. You also
                  specified the name of the Task Queue, translation-tasks.
                </p>
                <p>
                  When you launch the Worker with the command{" "}
                  <code>npm run start.watch</code>, you create a new Worker
                  process with a Worker entity and a Temporal Client which
                  opens a long-lasting connection to the Temporal Cluster,
                  which it uses to continuously poll for new tasks. Although
                  the Worker is running, the Workflow is not, so the task
                  queue is empty and the Worker has nothing to do.
                </p>
                <p>
                  The farewell-workflow exercise has two Workflow
                  Definitions: one called <code>greeting</code> and another
                  called <code>farewell</code>. I'll show the greeting
                  Workflow first.
                </p>
                <p>
                  To run the Workflow, you will use the Client. This is the{" "}
                  <code>greeting.ts</code> file in the clients directory.
                  First, you create a new Client that will communicate with
                  the Temporal Cluster.
                </p>
                <p>
                  Then, you start your Workflow from code within your own
                  application by calling <code>client.workflow.execute</code>{" "}
                  with your input, in this case the <code>greeting</code>{" "}
                  Workflow. You also specify the arguments to pass to your
                  Workflow, in this example the string "Tina," the name of
                  the Task Queue, and a unique identifer for this Workflow.
                </p>
                <p>
                  When you run this code with the command{" "}
                  <code>npm run greeting</code>, the Temporal Cluster records
                  a new Event into the Event History of this Workflow
                  Execution. <code>WorkflowExecutionStarted</code> is always
                  the first Event.
                </p>
                <p>
                  As I continue with my explanation, pay attention to the
                  Event History shown on the right. Additional events will
                  begin appearing below this one as the Workflow Execution
                  progresses. I won't mention all of them, but I highlight
                  them in yellow when they first appear so they're easier to
                  spot. You can also find these events for each Workflow
                  Execution in the Temporal UI.
                </p>
                <p>
                  The Temporal Cluster adds a Workflow Task to the Task
                  Queue and records another event,{" "}
                  <code>WorkflowTaskScheduled</code>, into the Event History.
                  Its name follows a pattern: when a new Task is added to
                  the queue, the name ends with "Scheduled."
                </p>
                <p>
                  Since the Worker Process has capacity to do some
                  processing work, it accepts this new Task. This results in
                  a new Event, <code>WorkflowTaskStarted</code>. When a
                  Worker dequeues a Task, the Cluster generates an event
                  whose name ends with "Started."
                </p>
                <p>
                  The Worker Process begins the Workflow Task by invoking
                  the function from the Workflow Definition. It continues by
                  running the code within this function.
                </p>
                <p>
                  Back to the client code.{" "}
                  <code>client.workflow.execute</code>.
                </p>
                <p>
                  A few important things happen as a result of the executing
                  the <code>greeting</code> workflow. The Worker can't make
                  further progress on the Workflow until the Activity
                  Execution concludes, so it notifies the Cluster that the
                  current Workflow Task is complete. In response, the
                  Cluster adds a new Event to history. The Worker also sends
                  a command to the cluster requesting it to schedule an
                  Activity Task.
                </p>
                <p>
                  The Temporal Cluster creates an Activity Task and adds it
                  to the Task Queue, resulting in a new Event.
                </p>
                <p>
                  Since the Worker Process has capacity to perform
                  additional work, it accepts the Activity Task.
                </p>
                <p>
                  The Worker Entity now invokes the function corresponding
                  to the Activity Definition for the{" "}
                  <code>getSpanishGreeting</code> Activity.
                </p>
                <p>
                  The Worker then runs the code within the function. In this
                  case, the Activity issues a request to the microservice.
                </p>
                <p>
                  This request was successful and the service responds by
                  providing a customized greeting in Spanish.
                </p>
                <p>
                  When the Activity function returns, the Worker notifies
                  the cluster that the Activity Task is complete, resulting
                  in a new Event. Since there is only one Activity in this
                  Workflow and the function returns, the Temporal Cluster
                  adds a new Workflow Task to the queue.
                </p>
                <p>
                  When the Worker accepts this new Task, the Temporal
                  Cluster adds a <code>WorkflowTaskStarted</code> Event to
                  the history. The Worker continues where it left off,
                  executing the remaining statements in the Workflow
                  Definition, and logs <code>WorkflowExecutionCompleted</code>{" "}
                  when everything is done.
                </p>
                <p>
                  It is now time to execute the farewell Workflow. The
                  command <code>npm run farwell</code> executes the code in
                  the <code>farewell.ts</code> file.
                </p>
                <p>
                  The original Worker process is still running, and the
                  Temporal Client is continuously polling for new tasks, so
                  it sees the new Workflow Execution request, accepts the
                  Workflow Task, completes the Workflow Task and schedules
                  the <code>getSpanishFarewell</code> Activity Task.
                </p>
                <p>
                  Let's take a moment to look at a failure scenario. What
                  happens if the Worker crashes; for example, because it ran
                  out of memory?
                </p>
                <p>
                  You can recover from this by restarting the Worker or
                  launching a new Worker on a different machine. In either
                  case, Temporal will automatically recreate the state of
                  the Workflow up to the point of failure, so progress will
                  continue on from there, as if the Worker never crashed at
                  all.
                </p>
                <p>
                  Activities that completed successfully before the crash
                  won't be executed again; instead, Temporal reuses the
                  values returned by their previous executions.
                </p>
                <p>
                  When the Worker accepts the Activity Task. The Temporal
                  Cluster adds <code>ActivityTaskStarted</code> to the Event
                  History.
                </p>
                <p>
                  But what if that microservice went offline just before the
                  request? In this case, the request would fail, ultimately
                  causing the Activity function to return the error from
                  Axios.
                </p>
                <p>
                  The default behavior in Temporal is for a failed Activity
                  to be automatically retried, with a short delay, until it
                  succeeds or is canceled. You can customize this behavior
                  with a Retry Policy.
                </p>
                <p>
                  Through a retry, the Worker invokes the Activity function
                  again, which in turn calls out to the microservice.
                </p>
                <p>
                  For this example, let's assume that the service outage was
                  an intermittent failure, so the request made during the
                  retry is successful.
                </p>
                <p>
                  Since the service is now back online, it responds to our
                  latest request and provides the requested farewell
                  message.
                </p>
                <p>
                  When the function returns, the Worker notifies the
                  Temporal Cluster that the Activity Task is complete.
                </p>
                <p>
                  There are still a few lines of the Workflow code that
                  haven't been run yet, so the Temporal Cluster adds a new
                  Workflow Task to the queue.
                </p>
                <p>
                  When the Worker accepts this new Task, the Temporal
                  Cluster adds a <code>WorkflowTaskStarted</code> Event to
                  the history. The Worker continues where it left off,
                  executing the remaining statements in the Workflow
                  Definition.
                </p>
                <p>
                  Once this function returns, the Workflow Task is complete.
                </p>
                <p>
                  The Worker continues polling for new Tasks, but there is
                  no more work related to this Workflow Execution.
                </p>
                <p>
                  The client application, which has been awaiting the result
                  of the Workflow Execution because it's blocked, will now
                  receive that value.
                </p>
                <p>
                  The cluster provides the result to the application, which
                  can process it however it wishes, and the Workflow begins
                  it's final set of actions, ending with{" "}
                  <code>WorkflowExecutionCompleted</code>.
                </p>
                <p>
                  In this video, you saw what happens during two Workflow
                  Executions, and learned about how Temporal handles failure
                  situations.
                </p>
              </details>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>
                You've finished the free preview
              </h2>
              <p
                style={{
                  marginBottom: "16px",
                  color: "var(--nd-fg-muted)",
                }}
              >
                Continue on TalentLMS to unlock the rest of Temporal 101 for free -
                including quizzes, exercises, and the deeper material on
                Workflow Execution, Event History, failure handling, and more.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <MagentaCta href="https://temporal.talentlms.com/catalog/info/id:135">
                  Continue on TalentLMS
                </MagentaCta>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/typescript/understanding-workflow-execution/about-this-example/"
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
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
