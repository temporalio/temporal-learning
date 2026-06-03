// Tutorial chapter 2 of 3: Run the Python money-transfer application.

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
  { n: 1, label: "Understand the application", href: "/getting_started/python/first_program_in_python/" },
  { n: 2, label: "Run the application", href: "/getting_started/python/first_program_in_python/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/python/first_program_in_python/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "start-the-workflow", label: "Start the Workflow" },
  { id: "view-the-state", label: "View the state in the Web UI" },
  { id: "start-the-worker", label: "Start the Worker" },
];

const TASK_QUEUE_PY = `MONEY_TRANSFER_TASK_QUEUE_NAME = "TRANSFER_MONEY_TASK_QUEUE"`;

const RUN_WORKFLOW_PY = `import asyncio
import traceback

from temporalio.client import Client, WorkflowFailureError

from shared import MONEY_TRANSFER_TASK_QUEUE_NAME, PaymentDetails
from workflows import MoneyTransfer


async def main() -> None:
    client: Client = await Client.connect("localhost:7233")

    data: PaymentDetails = PaymentDetails(
        source_account="85-150",
        target_account="43-812",
        amount=250,
        reference_id="12345",
    )

    try:
        result = await client.execute_workflow(
            MoneyTransfer.run,
            data,
            id="pay-invoice-701",
            task_queue=MONEY_TRANSFER_TASK_QUEUE_NAME,
        )

        print(f"Result: {result}")

    except WorkflowFailureError:
        print("Got expected exception: ", traceback.format_exc())


if __name__ == "__main__":
    asyncio.run(main())`;

const RUN_WORKER_PY = `import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import BankingActivities
from shared import MONEY_TRANSFER_TASK_QUEUE_NAME
from workflows import MoneyTransfer


async def main() -> None:
    client: Client = await Client.connect("localhost:7233", namespace="default")
    activities = BankingActivities()
    worker: Worker = Worker(
        client,
        task_queue=MONEY_TRANSFER_TASK_QUEUE_NAME,
        workflows=[MoneyTransfer],
        activities=[activities.withdraw, activities.deposit, activities.refund],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())`;

const WORKER_OUTPUT = `2024/02/12 10:55:43 INFO  Started Worker
2024/02/12 10:55:43 Withdrawing $250 from account 85-150.

2024/02/12 10:55:43 Depositing $250 into account 43-812.`;

const TRANSFER_COMPLETE = `Transfer complete.
Withdraw: {'amount': 250, 'receiver': '43-812', 'reference_id': 'fff4d970-226d-4db5-8e1c-3047a63f9c85', 'sender': '85-150'}
Deposit: {'amount': 250, 'receiver': '43-812', 'reference_id': 'fff4d970-226d-4db5-8e1c-3047a63f9c85', 'sender': '85-150'}`;

const IMG_BASE = "/img/getting_started/python/first_program_in_python";

export default function Chapter2Page() {
  return (
    <Layout
      title="Run the application - Run your first Temporal Python app"
      description="Chapter 2: Start the Workflow, watch it in the Web UI, and run a Worker."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_python.png" alt="Temporal Python SDK" className={styles.heroBannerImg} />
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
                  { label: "Python", href: "/getting_started/python" },
                  { label: "First program", href: "/getting_started/python/first_program_in_python/" },
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
                First, make sure the local Temporal Service is running. Open a new terminal window and run:
              </p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>To start the Workflow, run <code>run_workflow.py</code>:</p>
              <CodeBlock language="bash">python run_workflow.py</CodeBlock>
              <p>The Workflow is now running. Leave the program running.</p>
              <p>
                The Task Queue is where Temporal Workers look for Workflows and Activities to execute:
              </p>
              <CodeBlock language="python" title="shared.py">{TASK_QUEUE_PY}</CodeBlock>
              <p>Here's how <code>run_workflow.py</code> connects to the Cluster and starts the Workflow:</p>
              <CodeBlock language="python" title="run_workflow.py">{RUN_WORKFLOW_PY}</CodeBlock>
            </section>

            <section className={styles.section} id="view-the-state">
              <h2 className={styles.sectionTitle}>View the state of the Workflow in the Web UI</h2>
              <p>
                Visit the{" "}
                <a href="http://localhost:8233" target="_blank" rel="noopener noreferrer">Temporal Web UI</a>{" "}
                where you'll see your Workflow listed.
              </p>
              <p>
                <img src={`${IMG_BASE}/workflow_running.png`} alt="The Workflow running" className={styles.diagramImage} />
              </p>
              <p>
                Click the <strong>Workflow ID</strong>. You can see everything about the execution: inputs, timeouts,
                scheduled retries, attempts, stack traces, and more.
              </p>
              <p>
                <img src={`${IMG_BASE}/workflow_status.png`} alt="The details of the run" className={styles.diagramImage} />
              </p>
              <p>Click the <strong>Input and Results</strong> section to see the inputs:</p>
              <p>
                <img src={`${IMG_BASE}/inputs_results.png`} alt="Input and results" className={styles.diagramImage} />
              </p>
              <p>
                The Workflow is running, but hasn't executed yet - no Workers are connected to the Task Queue. You'll
                start the Worker next.
              </p>
            </section>

            <section className={styles.section} id="start-the-worker">
              <h2 className={styles.sectionTitle}>Start the Worker</h2>
              <p>A Worker:</p>
              <ul>
                <li>can only execute Workflows and Activities registered to it.</li>
                <li>knows which piece of code to execute based on the Tasks it gets from the Task Queue.</li>
                <li>only listens to the Task Queue that it's registered to.</li>
              </ul>
              <p>Open a new terminal window. Run <code>run_worker.py</code> from the project root:</p>
              <CodeBlock language="bash">python run_worker.py</CodeBlock>
              <p>It connects to the Temporal Cluster, specifies the Task Queue, and registers the Workflow and three Activities:</p>
              <CodeBlock language="python" title="run_worker.py">{RUN_WORKER_PY}</CodeBlock>
              <p>When the Worker starts, it begins polling the Task Queue:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>
              <p>Switch back to the terminal where your <code>python run_workflow.py</code> program is running:</p>
              <CodeBlock>{TRANSFER_COMPLETE}</CodeBlock>
              <p>Check the Web UI again. You'll see one Worker registered, and the Workflow status shows completed:</p>
              <p>
                <img src={`${IMG_BASE}/completed_workflow.png`} alt="There is now one Worker and the Workflow is complete" className={styles.diagramImage} />
              </p>
              <p>
                Each of these steps is recorded in the Event History. You just ran a Temporal Workflow application
                and saw how Workflows, Activities, and Workers interact. Next you'll explore failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/python/first_program_in_python/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Understand the application</span>
              </Link>
              <Link to="/getting_started/python/first_program_in_python/simulate-failures/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
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
