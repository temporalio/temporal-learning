// Free preview lesson 2 of 2 for Temporal 101 (Java) - Understanding Workflow Execution.
// Source content mirrors temporalio/edu-101-java-content/understanding-workflow-execution/code-walkthrough.md.

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
    href: "/courses/temporal_101/java/understanding-workflow-execution/about-this-example/",
  },
  {
    n: 2,
    label: "Code walkthrough",
    href: "/courses/temporal_101/java/understanding-workflow-execution/code-walkthrough/",
  },
];

const TOC_ITEMS = [
  { id: "video", label: "Video" },
  { id: "transcript", label: "Transcript" },
];

export default function CodeWalkthroughPage() {
  return (
    <Layout
      title="Code walkthrough - Temporal 101 (Java) free preview"
      description="Free preview lesson: a video walkthrough of how the Worker, Temporal Cluster, and Client Application drive a Workflow Execution from start to finish."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 101", href: "/courses/temporal_101" },
                  { label: "Java", href: "/courses/temporal_101/java" },
                  { label: "Code walkthrough" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Code walkthrough</h1>

            <MetaChips items={["Free preview", "Temporal 101", "Java"]} />

            <TutorialStepper steps={LESSONS} currentStep={2} />

            <p className={styles.intro}>
              This video walks through the example application from the
              previous lesson, showing how the Worker, the Temporal Cluster,
              and the Client Application drive a Workflow Execution from start
              to finish - and how Temporal recovers from a Worker crash and a
              transient Activity failure.
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
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/p2QVTRCzFNc?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0"
                  title="Code Walkthrough"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </section>

            <section className={styles.section} id="transcript">
              <h2 className={styles.sectionTitle}>Transcript</h2>
              <details>
                <summary>Video Transcript</summary>
                <p>
                  As you learned, the Worker executes your Workflow and
                  Activity code, so a Workflow Execution cannot progress
                  unless at least one Worker is running.
                </p>
                <p>
                  This example starts the Worker by invoking the{" "}
                  <code>main</code> method inside the class shown here, which
                  launches a new process.
                </p>
                <p>
                  The code in this method begins by creating a{" "}
                  <code>WorkflowServiceStubs</code> instance, which represents
                  a connection to a Temporal Cluster that's running locally.
                  Next, it uses this instance to create a Temporal Client that
                  can communicate with that cluster. Finally, it uses the
                  Client to create a <code>WorkerFactory</code> that can be
                  used to create one or more Workers.
                </p>
                <p>
                  Next, it uses that factory to create a new Worker instance,
                  which we refer to as a "Worker Entity." The string passed
                  to the method here is the name of the Task Queue on the
                  Temporal Cluster that the Worker Entity will poll.
                </p>
                <p>
                  A Worker will only execute Tasks for Workflow and Activity
                  Types that have been registered with it.
                </p>
                <p>
                  The lines highlighted here perform that registration, using
                  references to classes that implement the Workflow and
                  Activity Definitions.
                </p>
                <p>
                  Running the Worker Entity opens a long-lasting connection to
                  the Temporal Cluster, which it uses to continuously poll for
                  new tasks. Although the Worker is running, the Workflow is
                  not, so the Task Queue is empty and the Worker Entity has
                  nothing to do.
                </p>
                <p>
                  One way to start the Workflow is with the{" "}
                  <code>temporal</code> command-line tool. This example
                  specifies the name of the Worker's Task Queue, which matches
                  the value used to initialize the Worker Entity. It also
                  specifies a user-defined Workflow ID, the Workflow Type, and
                  the input data in JSON format.
                </p>
                <p>
                  An alternative is to start it from code within your own
                  application by using a Temporal Client to call the Workflow
                  Method, in this case the <code>greetSomeone</code> method,
                  with your input.
                </p>
                <p>
                  Regardless of how you start the Workflow, the behavior will
                  be the same: the Temporal Cluster records a new Event into
                  the Event History of this Workflow Execution and{" "}
                  <code>WorkflowExecutionStarted</code> will be the first
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
                  and records another event,{" "}
                  <code>WorkflowTaskScheduled</code>, into the Event History.
                  Its name follows a pattern: when a new Task is added to the
                  queue, the name ends with "Scheduled."
                </p>
                <p>
                  Since the Worker Process has capacity to do some processing
                  work, it accepts this new Task. This results in a new
                  Event, one whose name also follows a pattern. When a Worker
                  dequeues a Task, the Cluster generates an event whose name
                  ends with "Started."
                </p>
                <p>
                  The Worker Process begins the Workflow Task by invoking the
                  method from the Workflow Definition.
                </p>
                <p>
                  It continues by running code within this method. In this
                  example, the first few statements configure timeout options
                  for the Activities.
                </p>
                <p>
                  The code highlighted here requests execution of the first
                  Activity for this Workflow, <code>greetInSpanish</code>, the
                  result of which will be assigned to the{" "}
                  <code>spanishGreeting</code> variable. Since the result
                  won't be available until the <code>greetInSpanish</code>{" "}
                  Activity returns a value, this call will block until the
                  Activity Execution is complete.
                </p>
                <p>
                  A couple of important things also happen as a result of the
                  request for execution of the <code>greetInSpanish</code>{" "}
                  Activity. Since the Worker can't make further progress on
                  the Workflow until the Activity Execution concludes, it
                  notifies the Cluster that the current Workflow Task is
                  complete. In response, the Cluster adds a new Event to the
                  history.
                </p>
                <p>
                  The Worker also sends a Command to the Cluster requesting
                  it to schedule an Activity Task.
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
                  The Worker Entity now invokes the method corresponding to
                  the Activity Definition for the{" "}
                  <code>greetInSpanish</code> Activity.
                </p>
                <p>
                  The Worker then runs the code within the method. In this
                  case, the Activity calls the utility method, which in turn
                  issues a request to the microservice.
                </p>
                <p>
                  This request was successful and the service responds by
                  providing a customized greeting in Spanish.
                </p>
                <p>
                  When the Activity method returns, the Worker notifies the
                  Cluster that the Activity Task is complete, resulting in a
                  new Event.
                </p>
                <p>
                  In response, the Temporal Cluster queues a new Workflow Task
                  and logs another Event.
                </p>
                <p>
                  When the Worker accepts this new Task, the Temporal Cluster
                  adds a <code>WorkflowTaskStarted</code> Event to the
                  History.
                </p>
                <p>
                  The Worker continues where it left off by executing the next
                  statement in the Workflow Definition.
                </p>
                <p>
                  It is now time to execute the second Activity, so the Worker
                  notifies the Temporal Cluster that the current Workflow
                  Task is complete and sends a Command to schedule an
                  Activity Task.
                </p>
                <p>
                  The Temporal Cluster queues an Activity Task for the second
                  Activity and logs an <code>ActivityTaskScheduled</code>{" "}
                  Event to the history. Let's take a moment to look at a
                  failure scenario. What happens if the Worker crashes - for
                  example, because it ran out of memory?
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
                  When the Worker accepts the Activity Task, the Temporal
                  Cluster adds <code>ActivityTaskStarted</code> to the Event
                  History.
                </p>
                <p>
                  The Worker now invokes the method for the second Activity.
                </p>
                <p>
                  As before, it then runs the code within the method, which
                  uses the utility method to call a microservice.
                </p>
                <p>
                  But what if that microservice went offline just before the
                  request? In this case, the request would fail, ultimately
                  causing the Activity method to throw an exception.
                </p>
                <p>
                  The default behavior in Temporal is for a failed Activity to
                  be automatically retried, with a short delay, until it
                  succeeds or is canceled. You can customize this behavior
                  with a Retry Policy.
                </p>
                <p>
                  Through a retry, the Worker invokes the Activity method
                  again, which in turn invokes the utility method and calls
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
              </details>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/java/understanding-workflow-execution/about-this-example/"
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
                Continue on TalentLMS to unlock the rest of Temporal 101 -
                including quizzes, the certificate, and the deeper material on
                Workflow Execution, Event History, failure handling, and more.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <MagentaCta href="https://temporal.talentlms.com/catalog/info/id:140">
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
