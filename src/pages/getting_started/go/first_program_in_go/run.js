// Tutorial chapter 2 of 3: Run the money-transfer application.
// See ./index.js for shared canonical-source notes.

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
  {
    n: 1,
    label: "Understand the application",
    href: "/getting_started/go/first_program_in_go/",
  },
  {
    n: 2,
    label: "Run the application",
    href: "/getting_started/go/first_program_in_go/run/",
  },
  {
    n: 3,
    label: "Simulate failures",
    href: "/getting_started/go/first_program_in_go/simulate-failures/",
  },
];

const TOC_ITEMS = [
  { id: "start-the-workflow", label: "Start the Workflow" },
  { id: "view-the-state", label: "View the state in the Web UI" },
  { id: "start-the-worker", label: "Start the Worker" },
];

const TASK_QUEUE_CONST = `const MoneyTransferTaskQueueName = "TRANSFER_MONEY_TASK_QUEUE"`;

const START_GO = `func main() {
\t// Create the client object just once per process
\tc, err := client.Dial(client.Options{})

\tif err != nil {
\t\tlog.Fatalln("Unable to create Temporal client:", err)
\t}

\tdefer c.Close()

\tinput := app.PaymentDetails{
\t\tSourceAccount: "85-150",
\t\tTargetAccount: "43-812",
\t\tAmount:        250,
\t\tReferenceID:   "12345",
\t}

\toptions := client.StartWorkflowOptions{
\t\tID:        "pay-invoice-701",
\t\tTaskQueue: app.MoneyTransferTaskQueueName,
\t}

\tlog.Printf("Starting transfer from account %s to account %s for %d", input.SourceAccount, input.TargetAccount, input.Amount)

\twe, err := c.ExecuteWorkflow(context.Background(), options, app.MoneyTransfer, input)
\tif err != nil {
\t\tlog.Fatalln("Unable to start the Workflow:", err)
\t}

\tlog.Printf("WorkflowID: %s RunID: %s\\n", we.GetID(), we.GetRunID())

\tvar result string

\terr = we.Get(context.Background(), &result)

\tif err != nil {
\t\tlog.Fatalln("Unable to get Workflow result:", err)
\t}

\tlog.Println(result)
}`;

const WORKER_GO = `func main() {

\tc, err := client.Dial(client.Options{})
\tif err != nil {
\t\tlog.Fatalln("Unable to create Temporal client.", err)
\t}
\tdefer c.Close()

\tw := worker.New(c, app.MoneyTransferTaskQueueName, worker.Options{})

\t// This worker hosts both Workflow and Activity functions.
\tw.RegisterWorkflow(app.MoneyTransfer)
\tw.RegisterActivity(app.Withdraw)
\tw.RegisterActivity(app.Deposit)
\tw.RegisterActivity(app.Refund)

\t// Start listening to the Task Queue.
\terr = w.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("unable to start Worker", err)
\t}
}`;

const START_OUTPUT_FIRST = `2022/11/14 10:52:20 INFO  No logger configured for temporal client. Created default one.
2022/11/14 10:52:20 Starting transfer from account 85-150 to account 43-812 for 250
2022/11/14 10:52:20 WorkflowID: pay-invoice-701 RunID: 3312715c-9fea-4dc3-8040-cf8f270eb53c`;

const WORKER_OUTPUT = `2022/11/14 10:55:43 INFO  No logger configured for temporal client. Created default one.
2022/11/14 10:55:43 INFO  Started Worker Namespace default TaskQueue TRANSFER_MONEY_TASK_QUEUE WorkerID 76984@temporal.local@
2022/11/14 10:55:43 DEBUG ExecuteActivity ActivityType Withdraw
2022/11/14 10:55:43 Withdrawing $250 from account 85-150.

2022/11/14 10:55:43 DEBUG ExecuteActivity ActivityType Deposit
2022/11/14 10:55:43 Depositing $250 into account 43-812.`;

const TRANSFER_COMPLETE_OUTPUT = `...

2022/11/14 10:55:43 Transfer complete (transaction IDs: W1779185060, D4129841576)`;

const IMG_BASE = "/img/getting_started/go/first_program_in_go";

export default function Chapter2Page() {
  return (
    <Layout
      title="Run the application - Run your first Temporal Go app"
      description="Chapter 2: Start the Workflow, watch it execute, and run a Worker."
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
                  { label: "Get Started", href: "/start" },
                  { label: "Go", href: "/getting_started/go" },
                  {
                    label: "First program",
                    href: "/getting_started/go/first_program_in_go/",
                  },
                  { label: "Run the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run the application</h1>

            <MetaChips
              items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Now that you understand the Workflow and Activities, run the
              application. You'll start the Workflow, watch it appear in the
              Web UI, then start a Worker that executes the Activities and
              completes the transfer.
            </p>

            <section className={styles.section} id="start-the-workflow">
              <h2 className={styles.sectionTitle}>Start the Workflow</h2>
              <p>
                You have two ways to start a Workflow with Temporal: via the
                SDK, or via the{" "}
                <a
                  href="https://docs.temporal.io/cli"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporal command-line tool
                </a>
                . In this tutorial you use the SDK.
              </p>
              <p>
                To start a Workflow Execution, you connect to the Temporal
                Cluster, specify the{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-task-queue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queue
                </a>{" "}
                the Workflow should use, and start the Workflow with the input
                parameters it expects.
              </p>
              <p>
                The Task Queue name is defined in <code>shared.go</code>:
              </p>
              <CodeBlock language="go" title="shared.go">
                {TASK_QUEUE_CONST}
              </CodeBlock>
              <p>
                The file <code>start/main.go</code> contains a program that
                connects to the Temporal Server and starts the Workflow:
              </p>
              <CodeBlock language="go" title="start/main.go">
                {START_GO}
              </CodeBlock>
              <p>
                Make sure you've{" "}
                <Link to="/getting_started/go/dev_environment/">
                  installed Temporal CLI on your local machine
                </Link>
                .
              </p>
              <p>
                Start the Temporal development server with the following
                command, which specifies a database file and sets the Web UI
                port to <code>8080</code>:
              </p>
              <CodeBlock language="bash">
                temporal server start-dev --db-filename your_temporal.db --ui-port 8080
              </CodeBlock>

              <Admonition type="note">
                <p>
                  Temporal's development server uses an in-memory database by
                  default, and that won't work for the demonstrations in this
                  tutorial. Specifying a database file ensures that records
                  persist when you restart the service. Remember to specify
                  the same database file each time.
                </p>
              </Admonition>

              <p>Then run <code>start/main.go</code> from the project root:</p>
              <CodeBlock language="bash">go run start/main.go</CodeBlock>
              <p>
                On first run Go may download dependencies; afterwards you'll
                see output like the following:
              </p>
              <CodeBlock>{START_OUTPUT_FIRST}</CodeBlock>
              <p>The Workflow is now running. Leave the program running.</p>
            </section>

            <section className={styles.section} id="view-the-state">
              <h2 className={styles.sectionTitle}>
                View the state of the Workflow in the Web UI
              </h2>
              <p>
                Visit the{" "}
                <a
                  href="http://localhost:8080"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Web UI
                </a>
                , where you will see your Workflow listed.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/workflow_running.png`}
                  alt="The Workflow running"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Click the <strong>Workflow ID</strong>. You can see everything
                about the execution: inputs, timeout configurations, scheduled
                retries, number of attempts, stack traces, and more.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/workflow_status.png`}
                  alt="The details of the run"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Click the <strong>Input and Results</strong> section to see
                the inputs:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/inputs_results.png`}
                  alt="Input and results"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                You see your inputs, but the results are in progress. The
                Workflow hasn't executed yet - there are no Workers connected
                to the Task Queue. You'll start the Worker next.
              </p>
            </section>

            <section className={styles.section} id="start-the-worker">
              <h2 className={styles.sectionTitle}>Start the Worker</h2>
              <p>A Worker:</p>
              <ul>
                <li>listens only to the Task Queue that it is registered to.</li>
                <li>can only execute Workflows and Activities registered to it.</li>
                <li>knows which piece of code to execute from Tasks that it gets from the Task Queue.</li>
              </ul>
              <p>
                In this project, <code>worker/main.go</code> connects to the
                Temporal Cluster, specifies the Task Queue to use, and
                registers the Workflow and the three Activities:
              </p>
              <CodeBlock language="go" title="worker/main.go">
                {WORKER_GO}
              </CodeBlock>
              <p>
                Note that the Worker listens to the same Task Queue you used
                when you started the Workflow Execution.
              </p>
              <p>
                Open a new terminal window and switch to your project directory:
              </p>
              <CodeBlock language="bash">cd money-transfer-project-template-go</CodeBlock>
              <p>
                In this new terminal window, run <code>worker/main.go</code>:
              </p>
              <CodeBlock language="bash">go run worker/main.go</CodeBlock>
              <p>
                When you start the Worker, it begins polling the Task Queue
                for Tasks to process:
              </p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>
              <p>
                Switch back to the terminal where your{" "}
                <code>start/main.go</code> program is running, and you'll see
                it's completed:
              </p>
              <CodeBlock>{TRANSFER_COMPLETE_OUTPUT}</CodeBlock>
              <p>
                Check the Web UI again. You'll see one Worker registered, and
                the Workflow status shows that it completed:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/completed_workflow.png`}
                  alt="There is now one Worker and the Workflow is complete"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Each of these steps is recorded in the Event History, which
                you can audit in the Web UI under the <strong>History</strong>{" "}
                tab next to <strong>Summary</strong>.
              </p>
              <p>
                You just ran a Temporal Workflow application and saw how
                Workflows, Activities, and Workers interact. Next you'll
                explore how Temporal gives you tools to handle failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/go/first_program_in_go/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Understand the application
                </span>
              </Link>
              <Link
                to="/getting_started/go/first_program_in_go/simulate-failures/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Simulate failures
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
