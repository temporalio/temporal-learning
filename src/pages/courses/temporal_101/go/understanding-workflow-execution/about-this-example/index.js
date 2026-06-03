// Free preview lesson 1 of 2 from the Temporal 101 (Go) course.
// Source: https://github.com/temporalio/edu-101-go-content (understanding-workflow-execution/about-this-example.md)

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
  { id: "actors", label: "Actors in the scenario" },
  { id: "workers-and-tasks", label: "Workers and tasks" },
  { id: "commands", label: "Commands" },
  { id: "activities", label: "Activity Definitions" },
  { id: "workflow", label: "Workflow Definition" },
  { id: "worker", label: "Worker initialization" },
  { id: "summary", label: "Summary" },
];

const ACTIVITIES_GO = `func GreetInSpanish(ctx context.Context, name string) (string, error) {
\tgreeting, err := callService("get-spanish-greeting", name)
\treturn greeting, err
}

func FarewellInSpanish(ctx context.Context, name string) (string, error) {
\tgreeting, err := callService("get-spanish-farewell", name)
\treturn greeting, err
}

//utility function for making calls to the microservices
func callService(stem string, name string) (string, error) {
\tbase := "http://localhost:9999/" + stem + "?name=%s"
\turl := fmt.Sprintf(base, url.QueryEscape(name))

\tresp, err := http.Get(url)
\tif err != nil {
\t\treturn "", err
\t}
\tdefer resp.Body.Close()

\tbody, err := ioutil.ReadAll(resp.Body)
\tif err != nil {
\t\treturn "", err
\t}

\ttranslation := string(body)

\tstatus := resp.StatusCode
\tif status >= 400 {
\t\tmessage := fmt.Sprintf("HTTP Error %d: %s", status, translation)
\t\treturn "", errors.New(message)
\t}

\treturn translation, nil
}`;

const WORKFLOW_GO = `package farewell

import (
\t"time"

\t"go.temporal.io/sdk/workflow"
)

func GreetSomeone(ctx workflow.Context, name string) (string, error) {
\toptions := workflow.ActivityOptions{
\t\tStartToCloseTimeout: time.Second * 5,
\t}
\tctx = workflow.WithActivityOptions(ctx, options)

\tvar spanishGreeting string
\terr := workflow.ExecuteActivity(ctx, GreetInSpanish, name).Get(ctx, &spanishGreeting)
\tif err != nil {
\t\treturn "", err
\t}

\tvar spanishFarewell string
\terr = workflow.ExecuteActivity(ctx, FarewellInSpanish, name).Get(ctx, &spanishFarewell)
\tif err != nil {
\t\treturn "", err
\t}

\tvar helloGoodbye = "\\n" + spanishGreeting + "\\n" + spanishFarewell

\treturn helloGoodbye, nil
}`;

const WORKER_GO = `package main

import (
\t"log"
\tfarewell "temporal101/exercises/farewell-workflow/solution"

\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"
)

func main() {
\tc, err := client.Dial(client.Options{})
\tif err != nil {
\t\tlog.Fatalln("Unable to create client", err)
\t}
\tdefer c.Close()

\tw := worker.New(c, "greeting-tasks", worker.Options{})

\tw.RegisterWorkflow(farewell.GreetSomeone)
\tw.RegisterActivity(farewell.GreetInSpanish)
\tw.RegisterActivity(farewell.FarewellInSpanish)

\terr = w.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("Unable to start worker", err)
\t}
}`;

const IMG_BASE =
  "/courses/temporal-101/go/understanding-workflow-execution";

export default function AboutThisExamplePage() {
  return (
    <Layout
      title="About this example - Temporal 101 (Go) free preview"
      description="Free preview of Temporal 101 (Go): meet the Worker, Cluster, and Client Application that work together during a Workflow Execution."
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
                  { label: "About this example" },
                ]}
              />
            </div>

            <h1 className={styles.title}>About this example</h1>

            <MetaChips items={["Free preview", "Temporal 101", "Go"]} />

            <TutorialStepper steps={LESSONS} currentStep={1} />

            <p className={styles.intro}>
              During the <a href="https://github.com/temporalio/edu-101-go-code/blob/main/exercises/farewell-workflow/README.md" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>previous exercise</a>, you executed a Workflow that
              included two Activities, both of which made a call to a
              microservice that provided a customized message in Spanish. That
              exercise demonstrates many of the key concepts you've learned
              during this course. Although you now have first-hand experience
              with developing and running applications on the Temporal
              Platform, you'll gain a deeper understanding of how Temporal
              works by looking at what happens during Workflow Execution.
            </p>

            <section className={styles.section} id="actors">
              <h2 className={styles.sectionTitle}>Actors in the scenario</h2>
              <p>
                Let's begin by identifying the actors in this scenario, which
                will help to reiterate some important concepts.
              </p>
              <p>
                First, the example includes a Worker, which executes the
                Workflow and Activity code, and uses a Client to communicate
                with the Cluster.
              </p>
              <p>
                Next, the Temporal Cluster orchestrates the execution of that
                code by coordinating with the Worker, using a shared task
                queue.
              </p>
              <p>
                Finally, the program that starts the Workflow, which will be
                referred to as a Client application because it requests
                Workflow Execution as well as the result from the Temporal
                Cluster, uses a Client to do this.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/actors-in-scenario.png`}
                  alt="Diagram showing actors in Workflow execution scenario"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="workers-and-tasks">
              <h2 className={styles.sectionTitle}>Workers and tasks</h2>
              <p>
                The assignment of work is indirect. The Temporal Cluster does
                not assign tasks to a Worker (in fact, the Temporal Cluster
                does not maintain a list of Workers). Instead, the Workers
                continually poll the Temporal Cluster's Task Queue and accept
                tasks when they have spare capacity to process them. There are
                several benefits to this approach, but one of them is that
                tasks will just sit in the queue if there aren't enough
                Workers, which means that you can increase throughput and
                scalability by adding more Workers.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/workers-and-tasks.png`}
                  alt="Diagram showing Workers polling tasks from the Task Queue"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                As you learned earlier, Temporal applications in production
                will typically have multiple Workers; however, this example
                uses a single Worker for the sake of simplicity.
              </p>
            </section>

            <section className={styles.section} id="commands">
              <h2 className={styles.sectionTitle}>Commands</h2>
              <p>
                Another thing that will help you understand Temporal is the
                role of Commands. When the Worker encounters certain API calls
                during Workflow Execution, such as a call to the Workflow's{" "}
                <code>ExecuteActivity</code> function, it sends a Command to
                the Temporal Cluster. The Cluster acts on these Commands, for
                example, by creating an Activity Task, but also stores them in
                case of failure.
              </p>
              <p>
                For example, if the Worker crashes, the Temporal Cluster sends
                the stored information to another Worker to recreate the state
                of the Workflow to what it was immediately before the crash,
                and the new Worker resumes progress from that point. This
                allows you, as a developer, to code as if this type of failure
                wasn't even a possibility.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/commands-go.png`}
                  alt="Diagram showing Worker sending Commands to the Temporal Cluster"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>Activity Definitions</h2>
              <p>
                The application defines two Activities:{" "}
                <code>GreetInSpanish</code> and <code>FarewellInSpanish</code>,
                plus a utility function that both Activities use to call the
                translation service.
              </p>
              <CodeBlock language="go" title="activity.go">
                {ACTIVITIES_GO}
              </CodeBlock>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>
                The Workflow Definition executes those two Activities and
                returns a string created from their output.
              </p>
              <CodeBlock language="go" title="workflow.go">
                {WORKFLOW_GO}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Worker initialization</h2>
              <p>
                And here's the Worker initialization code, which registers the
                Workflow and Activity Definitions.
              </p>
              <CodeBlock language="go" title="main.go">
                {WORKER_GO}
              </CodeBlock>
            </section>

            <section className={styles.section} id="summary">
              <h2 className={styles.sectionTitle}>Summary</h2>
              <p>
                In this course, you saw how the parts of a Temporal Application
                - a Worker, the Temporal Cluster and the Client Application -
                work together during a Workflow Execution.
              </p>
              <p>
                In the next video, you will see a code walkthrough that shows
                how all of these parts work together.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/go/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Back to course overview
                </span>
              </Link>
              <Link
                to="/courses/temporal_101/go/understanding-workflow-execution/code-walkthrough/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: lesson 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Code walkthrough
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
