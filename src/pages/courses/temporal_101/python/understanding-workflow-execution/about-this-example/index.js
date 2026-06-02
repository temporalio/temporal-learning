// Free preview lesson 1 of 2 for Temporal 101 (Python).
// Source: https://github.com/temporalio/edu-101-python-content/blob/main/understanding-workflow-execution/about-this-example.md

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
    href: "/courses/temporal_101/python/understanding-workflow-execution/about-this-example/",
  },
  {
    n: 2,
    label: "Code walkthrough",
    href: "/courses/temporal_101/python/understanding-workflow-execution/code-walkthrough/",
  },
];

const TOC_ITEMS = [
  { id: "actors", label: "The actors in the scenario" },
  { id: "how-work-is-assigned", label: "How work is assigned" },
  { id: "commands", label: "The role of Commands" },
  { id: "activities", label: "The Activity Definitions" },
  { id: "workflow", label: "The Workflow Definition" },
  { id: "worker", label: "The Worker initialization code" },
  { id: "summary", label: "Summary" },
];

const ACTIVITIES_PY = `import urllib.parse
from temporalio import activity

class TranslateActivities:
    def __init__(self, session):
        self.session = session

    @activity.defn
    async def greet_in_spanish(self, name: str) -> str:
        greeting = await self.call_service("get-spanish-greeting", name)
        return greeting

    @activity.defn
    async def farewell_in_spanish(self, name: str) -> str:
        farewell = await self.call_service("get-spanish-farewell", name)
        return farewell

    # Utility method for making calls to the microservices
    async def call_service(self, stem: str, name: str) -> str:
        base = f"http://localhost:9999/{stem}"
        url = f"{base}?name={urllib.parse.quote(name)}"

        async with self.session.get(url) as response:
            response.raise_for_status()
            return await response.text()
`;

const WORKFLOW_PY = `from datetime import timedelta
from temporalio import workflow

# Import activity, passing it through the sandbox without reloading the module
with workflow.unsafe.imports_passed_through():
    from translate import TranslateActivities


@workflow.defn
class GreetSomeone:
    @workflow.run
    async def run(self, name: str) -> str:
        greeting = await workflow.execute_activity_method(
            TranslateActivities.greet_in_spanish,
            name,
            start_to_close_timeout=timedelta(seconds=5),
        )

        farewell = await workflow.execute_activity_method(
            TranslateActivities.greet_in_spanish,
            name,
            start_to_close_timeout=timedelta(seconds=5),
        )

        return f"{greeting}\\n{farewell}"
`;

const WORKER_PY = `import asyncio
import aiohttp

from temporalio.client import Client
from temporalio.worker import Worker

from translate import TranslateActivities
from greeting import GreetSomeone


async def main():
    client = await Client.connect("localhost:7233", namespace="default")

    # Run the worker
    async with aiohttp.ClientSession() as session:
        activities = TranslateActivities(session)

        worker = Worker(
            client,
            task_queue="greeting-tasks",
            workflows=[GreetSomeone],
            activities=[activities.greet_in_spanish, activities.farewell_in_spanish],
        )
        print("Starting the worker....")
        await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
`;

export default function AboutThisExamplePage() {
  return (
    <Layout
      title="About this example - Understanding Workflow Execution (Python)"
      description="Walk through the actors, Commands, and code that make up the Temporal 101 Python example."
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
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 101", href: "/courses/temporal_101" },
                  { label: "Python", href: "/courses/temporal_101/python" },
                  { label: "About this example" },
                ]}
              />
            </div>

            <h1 className={styles.title}>About this example</h1>

            <MetaChips items={["Free preview", "Temporal 101", "Python"]} />

            <TutorialStepper steps={LESSONS} currentStep={1} />

            <p className={styles.intro}>
              During the previous exercise, you executed a Workflow that
              included two Activities, both of which made a call to a
              microservice that provided a customized message in Spanish. That
              exercise demonstrates many of the key concepts you've learned
              during this course. Although you now have first-hand experience
              with developing and running applications on the Temporal
              Platform, you'll gain a deeper understanding of how Temporal
              works by looking at what happens during Workflow Execution.
            </p>

            <section className={styles.section} id="actors">
              <h2 className={styles.sectionTitle}>
                The actors in the scenario
              </h2>
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
                  src="/courses/temporal-101/python/chapter_09/actors-in-scenario.png"
                  alt="Screenshot showing actors in Workflow execution scenario"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="how-work-is-assigned">
              <h2 className={styles.sectionTitle}>How work is assigned</h2>
              <p>
                The assignment of work is indirect. The Temporal Cluster does
                not assign tasks to a Worker (in fact, the Temporal Cluster
                does not maintain a list of Workers).
              </p>
              <p>
                Instead, the Workers continually poll the Temporal Cluster's
                Task Queue when they have open slots to process tasks. There
                are several benefits to this approach, but one of them is that
                tasks will just sit in the queue if there aren't enough
                Workers, which means that you can increase throughput and
                scalability by adding more Workers.
              </p>
              <p>
                <img
                  src="/courses/temporal-101/python/chapter_09/workers-and-tasks.png"
                  alt="Screenshot showing Workers and tasks"
                  className={styles.diagramImage}
                />
              </p>
              <Admonition type="note">
                <p>
                  As you learned earlier, Temporal applications in production
                  will typically have multiple Workers; however, this example
                  uses a single Worker for the sake of simplicity.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="commands">
              <h2 className={styles.sectionTitle}>The role of Commands</h2>
              <p>
                Another thing that will help you understand Temporal is the
                role of Commands. When the Worker encounters certain API calls
                during a Workflow Execution, such as a call to the Workflow's{" "}
                <code>execute_activity_method</code> function, it sends a
                Command to the Temporal Cluster. The Cluster acts on these
                Commands, for example, by creating an Activity Task, but also
                stores them in case of failure.
              </p>
              <p>
                For example, if the Worker crashes, the Temporal Service works
                with the remaining Workers to recreate the state of the
                Workflow to what it was immediately before the crash, and they
                resume progress from that point. This allows you, as a
                developer, to code as if this type of failure wasn't even a
                possibility.
              </p>
              <p>
                <img
                  src="/courses/temporal-101/python/chapter_09/commands-python.png"
                  alt="Screenshot showing Commands"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>
                The Activity Definitions
              </h2>
              <p>
                The application defines two Activities:{" "}
                <code>greet_in_spanish</code> and{" "}
                <code>farewell_in_spanish</code>.
              </p>
              <CodeBlock language="python" title="translate.py">
                {ACTIVITIES_PY}
              </CodeBlock>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>The Workflow Definition</h2>
              <p>
                The Workflow Definition executes those two Activities and
                returns a string created from their output.
              </p>
              <CodeBlock language="python" title="greeting.py">
                {WORKFLOW_PY}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>
                The Worker initialization code
              </h2>
              <p>
                Here's the Worker initialization code, which registers the
                Workflow and Activity Definitions.
              </p>
              <CodeBlock language="python" title="worker.py">
                {WORKER_PY}
              </CodeBlock>
            </section>

            <section className={styles.section} id="summary">
              <h2 className={styles.sectionTitle}>Summary</h2>
              <p>
                In this course, you saw how the parts of a Temporal
                Application - a Worker, the Temporal Cluster and the Client
                Application - work together during a Workflow Execution.
              </p>
              <p>
                In the next video, you will see how all the parts work
                together via a code walkthrough.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/python/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Temporal 101 with Python
                </span>
              </Link>
              <Link
                to="/courses/temporal_101/python/understanding-workflow-execution/code-walkthrough/"
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
