// Free preview lesson 1 of 2 for Temporal 101 (TypeScript): Understanding Workflow Execution.
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
  { id: "actors", label: "Actors in the scenario" },
  { id: "task-assignment", label: "How work gets assigned" },
  { id: "commands", label: "The role of Commands" },
  { id: "activities", label: "The Activity Definitions" },
  { id: "workflow", label: "The Workflow Definition" },
  { id: "worker", label: "The Worker" },
  { id: "summary", label: "Summary" },
];

const ACTIVITIES_TS = `import axios from 'axios';

const url = 'http://localhost:9999';

export async function getSpanishGreeting(name: string): Promise<string> {
  const response = await axios.get(\`\${url}/get-spanish-greeting?name=\${name}\`);

  return response.data;
}

export async function getSpanishFarewell(name: string): Promise<string> {
  const response = await axios.get(\`\${url}/get-spanish-farwell?name=\${name}\`);

  return response.data;
}`;

const WORKFLOW_TS = `import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { getSpanishGreeting, getSpanishFarewell } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '10 seconds',
});

export async function greeting(name: string): Promise<string> {
  const response = await getSpanishGreeting(name);
  return response;
}

export async function farewell(name: string): Promise<string> {
  const response = await getSpanishFarewell(name);
  return response;
}`;

const WORKER_TS = `import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'translation-tasks',
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const IMG_BASE = "/courses/temporal-101/typescript/chapter_09";

export default function AboutThisExamplePage() {
  return (
    <Layout
      title="About this example - Understanding Workflow Execution (TypeScript)"
      description="Lesson 1: Meet the actors in a Temporal Workflow Execution and explore the example application."
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
                  { label: "About this example" },
                ]}
              />
            </div>

            <h1 className={styles.title}>About this example</h1>

            <MetaChips items={["Free preview", "Temporal 101", "TypeScript"]} />

            <TutorialStepper steps={LESSONS} currentStep={1} />

            <p className={styles.intro}>
              During the previous exercise, you executed a Workflow that
              included two Activities, both of which made a call to a
              microservice that provided a customized message in Spanish.
              That exercise demonstrates many of the key concepts you've
              learned during this course. Although you now have first-hand
              experience with developing and running applications on the
              Temporal Platform, you'll gain a deeper understanding of how
              Temporal works by looking at what happens during Workflow
              Execution.
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
                  alt="Actors in the Workflow Execution scenario"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="task-assignment">
              <h2 className={styles.sectionTitle}>How work gets assigned</h2>
              <p>
                The assignment of work is indirect. The Temporal Cluster does
                not assign tasks to a Worker (in fact, the Temporal Cluster
                does not maintain a list of Workers).
              </p>
              <p>
                Instead, the Workers continually poll the Temporal Cluster's
                Task Queue and accept tasks when they have spare capacity to
                process them. There are several benefits to this approach,
                but one of them is that tasks will just sit in the queue if
                there aren't enough Workers, which means that you can
                increase throughput and scalability by adding more Workers.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/workers-and-tasks.png`}
                  alt="Workers polling for and accepting tasks"
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
              <h2 className={styles.sectionTitle}>The role of Commands</h2>
              <p>
                Another thing that will help you understand Temporal is the
                role of Commands. When the Worker encounters certain API
                calls during a Workflow Execution, such as a call of an
                Activity function's proxy, it sends a Command to the
                Temporal Cluster. The Cluster acts on these Commands, for
                example, by creating an Activity Task, but also stores them
                in case of failure.
              </p>
              <p>
                For example, if the Worker crashes, the Temporal Service
                sends the stored information to another Worker to recreate
                the state of the Workflow to what it was immediately before
                the crash, and the new Worker resumes progress from that
                point. This allows you, as a developer, to code as if this
                type of failure wasn't even a possibility.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/commands-ts.png`}
                  alt="Worker sending Commands to the Temporal Cluster"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>The Activity Definitions</h2>
              <p>
                The application defines two Activities:{" "}
                <code>getSpanishGreeting</code> and{" "}
                <code>getSpanishFarewell</code>.
              </p>
              <CodeBlock language="ts" title="activities.ts">
                {ACTIVITIES_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>The Workflow Definition</h2>
              <p>
                The Workflow Definition executes those two Activities and
                returns a string created from their output.
              </p>
              <CodeBlock language="ts" title="workflows.ts">
                {WORKFLOW_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>The Worker</h2>
              <p>
                Here's the Worker initialization code, which registers the
                Workflow and Activity Definitions.
              </p>
              <CodeBlock language="ts" title="worker.ts">
                {WORKER_TS}
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
                to="/courses/temporal_101/typescript/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Temporal 101 with TypeScript
                </span>
              </Link>
              <Link
                to="/courses/temporal_101/typescript/understanding-workflow-execution/code-walkthrough/"
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
