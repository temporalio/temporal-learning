// Tutorial chapter 2 of 3: Run the TypeScript money-transfer application.

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
  { n: 1, label: "Understand the application", href: "/getting_started/typescript/first_program_in_typescript/" },
  { n: 2, label: "Run the application", href: "/getting_started/typescript/first_program_in_typescript/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/typescript/first_program_in_typescript/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "start-the-workflow", label: "Start the Workflow" },
  { id: "view-the-state", label: "View the state in the Web UI" },
  { id: "start-the-worker", label: "Start the Worker" },
];

const CLIENT_TS = `import { Connection, Client } from '@temporalio/client';
import { moneyTransfer } from './workflows';
import type { PaymentDetails } from './shared';

import { namespace, taskQueueName } from './shared';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection, namespace });

  const details: PaymentDetails = {
    amount: 400,
    sourceAccount: '85-150',
    targetAccount: '43-812',
    referenceId: '12345',
  };

  console.log(
    \`Starting transfer from account \${details.sourceAccount} to account \${details.targetAccount} for $\${details.amount}\`
  );

  const handle = await client.workflow.start(moneyTransfer, {
    args: [details],
    taskQueue: taskQueueName,
    workflowId: 'pay-invoice-801',
  });

  console.log(
    \`Started Workflow \${handle.workflowId} with RunID \${handle.firstExecutionRunId}\`
  );
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const WORKER_TS = `import { Worker } from '@temporalio/worker';
import * as activities from './activities';
import { namespace, taskQueueName } from './shared';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    namespace,
    taskQueue: taskQueueName,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const START_OUTPUT = `Starting transfer from account 85-150 to account 43-812 for $400
Started Workflow pay-invoice-801 with RunID 67fe2aff-3aa9-4239-af38-9460720832d3`;

const WORKER_OUTPUT = `2023-10-11T19:17:18.918501Z Workflow bundle created { size: '0.74MB' }
2023-10-11T19:17:18.918501Z INFO temporal_sdk_core::worker: Initializing worker task_queue=money-transfer namespace=default
2023-10-11T19:17:18.918501Z INFO [INFO] Worker state changed { state: 'RUNNING' }`;

const TRANSFER_COMPLETE = `...

2023/09/29 05:40:30 Transfer complete (transaction IDs: W8478248637, D0867170869)`;

const IMG_BASE = "/img/getting_started/typescript/first_program_in_typescript";

export default function Chapter2Page() {
  return (
    <Layout
      title="Run the application - Run your first Temporal TypeScript app"
      description="Chapter 2: Start the Workflow, watch it in the Web UI, and run a Worker."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_typescript.png" alt="Temporal TypeScript SDK" className={styles.heroBannerImg} />
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
                  { label: "Get Started", href: "/start" },
                  { label: "TypeScript", href: "/getting_started/typescript" },
                  { label: "First program", href: "/getting_started/typescript/first_program_in_typescript/" },
                  { label: "Run the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run the application</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Now that you understand the Workflow and Activities, run the application. You'll start the Workflow,
              watch it appear in the Web UI, then start a Worker that executes the Activities.
            </p>

            <section className={styles.section} id="start-the-workflow">
              <h2 className={styles.sectionTitle}>Start the Workflow</h2>
              <p>
                First, start the Temporal development server with a database file and Web UI on port 8080:
              </p>
              <CodeBlock language="bash">temporal server start-dev --db-filename your_temporal.db --ui-port 8080</CodeBlock>
              <Admonition type="note">
                <p>
                  Temporal's dev server uses an in-memory database by default, which won't work for the failure
                  demos. Specifying a database file ensures records persist when you restart.
                </p>
              </Admonition>
              <p>Then run <code>client.ts</code>:</p>
              <CodeBlock language="bash">npm run client</CodeBlock>
              <p>You'll see output like:</p>
              <CodeBlock>{START_OUTPUT}</CodeBlock>
              <p>The Workflow is now running. Leave the program running. Here's how <code>client.ts</code> works:</p>
              <CodeBlock language="typescript" title="src/client.ts">{CLIENT_TS}</CodeBlock>
            </section>

            <section className={styles.section} id="view-the-state">
              <h2 className={styles.sectionTitle}>View the state of the Workflow in the Web UI</h2>
              <p>
                Visit the{" "}
                <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Temporal Web UI</a>{" "}
                where you'll see your Workflow listed.
              </p>
              <p>
                <img src={`${IMG_BASE}/workflow_running.png`} alt="The Workflow running" className={styles.diagramImage} />
              </p>
              <p>
                Click the <strong>Workflow ID</strong>. You'll see inputs, timeouts, scheduled retries, attempts,
                stack traces, and more:
              </p>
              <p>
                <img src={`${IMG_BASE}/workflow_status.png`} alt="The details of the run" className={styles.diagramImage} />
              </p>
              <p>Click <strong>Input and Results</strong> to see the inputs:</p>
              <p>
                <img src={`${IMG_BASE}/inputs_results.png`} alt="Input and results" className={styles.diagramImage} />
              </p>
              <p>
                The Workflow hasn't executed yet - no Workers are connected to the Task Queue. You'll start the
                Worker next.
              </p>
            </section>

            <section className={styles.section} id="start-the-worker">
              <h2 className={styles.sectionTitle}>Start the Worker</h2>
              <p>A Worker:</p>
              <ul>
                <li>can only execute Workflows and Activities registered to it.</li>
                <li>knows which piece of code to execute based on Tasks from the Task Queue.</li>
                <li>only listens to the Task Queue that it's registered to.</li>
              </ul>
              <p>Open a new terminal window. Run the Worker:</p>
              <CodeBlock language="bash">npm run worker</CodeBlock>
              <p>The Worker connects to the Temporal Cluster, specifies the Task Queue, and registers the Workflow and Activities:</p>
              <CodeBlock language="typescript" title="src/worker.ts">{WORKER_TS}</CodeBlock>
              <p>When the Worker starts, it begins polling the Task Queue:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>
              <p>Switch back to where <code>npm run client</code> was running:</p>
              <CodeBlock>{TRANSFER_COMPLETE}</CodeBlock>
              <p>Check the Web UI again. You'll see one Worker registered and the Workflow completed:</p>
              <p>
                <img src={`${IMG_BASE}/completed_workflow.png`} alt="Worker registered and Workflow complete" className={styles.diagramImage} />
              </p>
              <p>
                You just ran a Temporal Workflow application and saw how Workflows, Activities, and Workers
                interact. Next you'll explore how Temporal handles failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/typescript/first_program_in_typescript/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Understand the application</span>
              </Link>
              <Link to="/getting_started/typescript/first_program_in_typescript/simulate-failures/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3 <span aria-hidden="true" className={styles.chapterNavArrow}>→</span>
                </span>
                <span className={styles.chapterNavTitle}>Simulate failures</span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
