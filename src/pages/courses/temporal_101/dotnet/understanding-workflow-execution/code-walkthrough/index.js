// Free preview lesson 2 of 2 from the Temporal 101 (.NET) course.
// Source: https://github.com/temporalio/edu-101-dotnet-content (understanding-workflow-execution/code-walkthrough.md)

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
    href: "/courses/temporal_101/dotnet/understanding-workflow-execution/about-this-example/",
  },
  {
    n: 2,
    label: "Code walkthrough",
    href: "/courses/temporal_101/dotnet/understanding-workflow-execution/code-walkthrough/",
  },
];

const TOC_ITEMS = [
  { id: "video", label: "Video" },
  { id: "transcript", label: "Transcript" },
];

export default function CodeWalkthroughPage() {
  return (
    <Layout
      title="Code walkthrough - Temporal 101 (.NET) free preview"
      description="Free preview lesson: a video walkthrough of how a Temporal Workflow Execution progresses for the .NET farewell-workflow example."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_dotnet.png"
            alt="Temporal .NET SDK"
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
                  { label: ".NET", href: "/courses/temporal_101/dotnet" },
                  { label: "Code walkthrough" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Code walkthrough</h1>

            <MetaChips items={["Free preview", "Temporal 101", ".NET"]} />

            <TutorialStepper steps={LESSONS} currentStep={2} />

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
                  src="https://www.youtube.com/embed/JM-Sia_ZrXk?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0"
                  title="Code Walkthrough (Temporal 101 - .NET)"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </section>

            <section className={styles.section} id="transcript">
              <h2 className={styles.sectionTitle}>Transcript</h2>
              <details>
                <summary>Video transcript</summary>
                <p>
                  In this video, you will see how a Temporal Workflow Execution
                  works by examining the code from the{" "}
                  <code>farewell-workflow</code> exercise.
                </p>
                <p>
                  As you have learned, a Worker executes your Workflow and
                  Activity code, so a Workflow Execution cannot progress unless
                  at least one Worker is running.
                </p>
                <p>
                  Take a look at the code for a Worker. This is the{" "}
                  <code>Program.cs</code> file in the Worker subdirectory, and
                  I'll go section-by-section through the code to explain what
                  is happening.
                </p>
                <p>
                  At the top of the file, there are some <code>using</code>{" "}
                  statements that import dependencies required for this
                  program. The first two imports are the Client and Worker from
                  the Temporal .NET SDK. The third import is{" "}
                  <code>TemporalioFarewell.Workflow</code>, a custom namespace
                  containing Workflow and Activity definitions specific to this
                  application.
                </p>
                <p>
                  Next, we will create a Client that connects to the local
                  Temporal Server, which is on <code>localhost:7233</code>, in
                  the <code>default</code> namespace. We will create an
                  instance of <code>TranslateActivities</code>, making the
                  Activities available for use in the Worker. Next, we create a
                  new Worker Entity with that Client and the name of the Task
                  Queue, <code>farewell-workflow</code>.
                </p>
                <p>
                  A Worker can execute Workflow and Activity Tasks for types
                  that are registered with it. The highlighted lines include
                  references to the Workflow and Activity Definitions. When you
                  launch the Worker with the command{" "}
                  <code>dotnet run --project Worker</code>, you create a new
                  Worker process with a Worker entity and a Temporal Client
                  which opens a long-lasting connection to the Temporal
                  Service, which it uses to continuously poll for new tasks.
                  Although the Worker is running, the Workflow is not, so the
                  Task Queue is empty and the Worker has nothing to do.
                </p>
                <p>
                  One way to start the Workflow is with the{" "}
                  <code>temporal</code> command-line tool. This example
                  specifies the name of the Worker's task queue, a user-defined
                  Workflow ID, the Workflow Type, and the input data.
                </p>
                <p>
                  An alternative is to start the Workflow from code within your
                  own application by using a Temporal Client to call the{" "}
                  <code>ExecuteWorkflowAsync</code> with your input. To run the
                  Workflow, you will use the Client. This is the{" "}
                  <code>Program.cs</code> file in the Client directory. First,
                  you create a new Client that will communicate with the
                  Temporal Service. Then, you start your Workflow from code
                  within your own application by calling{" "}
                  <code>client.ExecuteWorkflowAsync</code> with your input, in
                  this case the <code>greeting</code> Workflow. You also
                  specify the arguments to pass to your Workflow, in this
                  example the name argument, the name of the Task Queue, and a
                  unique identifier for this Workflow. When you run this code
                  with the command <code>dotnet run --project Client</code>,
                  the Temporal Service records a new Event into the Event
                  History of this Workflow Execution.{" "}
                  <code>WorkflowExecutionStarted</code> is always the first
                  Event.
                </p>
                <p>
                  As I continue with my explanation, pay attention to the Event
                  History shown on the right. Additional events will begin
                  appearing below this one as the Workflow Execution
                  progresses. I won't mention all of them, but I highlight them
                  in yellow when they first appear so they're easier to spot.
                  You can also find these events for each Workflow Execution in
                  the Temporal UI.
                </p>
                <p>
                  The Temporal Service adds a Workflow Task to the Task Queue
                  and records another event,{" "}
                  <code>WorkflowTaskScheduled</code>, into the Event History.
                  Its name follows a pattern: when a new Task is added to the
                  queue, the name ends with "Scheduled." Since the Worker
                  Process has capacity to do some processing work, it accepts
                  this new Task: <code>WorkflowTaskStarted</code>. When a
                  Worker dequeues a Task and accepts it, this results in a new
                  Event that ends with "Started."
                </p>
                <p>
                  The Worker process starts by registering{" "}
                  <code>GreetingWorkflow</code>, allowing it to handle workflow
                  tasks associated with this Workflow Definition. It continues
                  by running the code within this Workflow Definition.
                </p>
                <p>
                  Back to the Client code:{" "}
                  <code>client.ExecuteWorkflowAsync</code>. A few important
                  things happen as a result of the executing the{" "}
                  <code>greeting</code> workflow. The Worker can't make further
                  progress on the Workflow until the Activity Execution
                  concludes, so it notifies the Service that the current
                  Workflow Task is complete.
                </p>
                <p>
                  In response, the Service adds a new Event to the history.
                  The Worker also sends a command to the Service requesting it
                  to schedule an Activity Task. The Temporal Service creates an
                  Activity Task and adds it to the Task Queue, resulting in a
                  new Event. Since the Worker Process has capacity to perform
                  additional work, it accepts the Activity Task. The Worker
                  Entity now invokes the function corresponding to the Activity
                  Definition for the <code>GetSpanishGreeting</code> Activity.
                  The Worker then runs the code within the function. In this
                  case, the Activity issues a request to the microservice. This
                  request was successful and the service responds by providing
                  a customized greeting in Spanish. When the Activity function
                  returns, the Worker notifies the Service that the Activity
                  Task is complete, resulting in a new Event. In response, the
                  Temporal Service queues a new Workflow Task and logs another
                  Event. When the Worker accepts this new Task, the Temporal
                  Service adds a <code>WorkflowTaskStarted</code> Event to the
                  history. The Worker continues where it left off by executing
                  the next statement in the Workflow Definition.
                </p>
                <p>
                  It is now time to execute the second Activity, so the Worker
                  notifies the Temporal Service that the current Workflow Task
                  is complete and sends a Command to schedule an Activity Task.
                  The Temporal Service queues an Activity Task for the second
                  Activity and logs an <code>ActivityTaskScheduled</code> Event
                  to the history. Let's take a moment to look at a failure
                  scenario.
                </p>
                <p>
                  What happens if the Worker crashes; for example, because it
                  ran out of memory?
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
                  Activities that completed successfully before the crash won't
                  be executed again; instead, Temporal reuses the values
                  returned by their previous executions.
                </p>
                <p>
                  When the Worker accepts the Activity Task, the Temporal
                  Service adds <code>ActivityTaskStarted</code> to the Event
                  History. The Worker now invokes the function for the second
                  Activity. As before, it then runs the code within the
                  function, which calls a microservice. But what if that
                  microservice went offline just before the request? In this
                  case, the request would fail, ultimately causing the Activity
                  function to return an error.
                </p>
                <p>
                  The default behavior in Temporal is for a failed Activity to
                  be automatically retried, with a short delay, until it
                  succeeds or is canceled. You can customize this behavior with
                  a Retry Policy. Through a retry, the Worker invokes the
                  Activity function again, which in turn invokes the call to
                  the microservice.
                </p>
                <p>
                  For this example, let's assume that the service outage was an
                  intermittent failure, so the request made during the retry is
                  successful. Since the service is now back online, it responds
                  to our latest request and provides the requested farewell
                  message. When the function returns, the Worker notifies the
                  Temporal Service that the Activity Task is complete.
                </p>
                <p>
                  There are still a few lines of the Workflow code that haven't
                  been run yet, so the Temporal Service adds a new Workflow
                  Task to the queue. When the Worker accepts this new Task,
                  the Temporal Service adds a <code>WorkflowTaskStarted</code>{" "}
                  Event to the history. The Worker continues where it left
                  off, executing the remaining statements in the Workflow
                  Definition. Once this function returns, the Workflow Task is
                  complete. Since the Workflow function returned, Workflow
                  Execution is now complete, and the Service adds the final
                  event to its history.
                </p>
                <p>
                  The Worker continues polling for new Tasks, but there is no
                  more work related to this Workflow Execution.
                </p>
                <p>
                  The Client application, which has been awaiting the result of
                  the Workflow Execution because it's blocked, will now receive
                  that value. The Service provides the result to the
                  application, which can process it however it wishes.
                </p>
                <p>
                  And now you've seen what happens during a Workflow Execution.
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
                Continue on TalentLMS to unlock the rest of Temporal 101 -
                including quizzes, the certificate, and the deeper material on
                Workflow Execution, Event History, failure handling, and more.
              </p>
              <div
                style={{ display: "flex", justifyContent: "center" }}
              >
                <MagentaCta href="https://temporal.talentlms.com/catalog/info/id:254">
                  Continue on TalentLMS
                </MagentaCta>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/dotnet/understanding-workflow-execution/about-this-example/"
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
