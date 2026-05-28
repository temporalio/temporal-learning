// Tutorial chapter 2 of 3: Run the Java money-transfer application.

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
  { n: 1, label: "Understand the application", href: "/getting_started/java/first_program_in_java/" },
  { n: 2, label: "Run the application", href: "/getting_started/java/first_program_in_java/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/java/first_program_in_java/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "start-the-workflow", label: "Start the Workflow" },
  { id: "view-the-state", label: "View the state in the Web UI" },
  { id: "start-the-worker", label: "Start the Worker" },
];

const SHARED_JAVA = `package moneytransferapp;

public interface Shared {
    static final String MONEY_TRANSFER_TASK_QUEUE = "MONEY_TRANSFER_TASK_QUEUE";
}`;

const TRANSFER_APP_JAVA = `import io.temporal.api.common.v1.WorkflowExecution;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;

public class TransferApp {
    public static void main(String[] args) throws Exception {
        WorkflowServiceStubs serviceStub = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(serviceStub);

        WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue(Shared.MONEY_TRANSFER_TASK_QUEUE)
                .setWorkflowId("money-transfer-workflow")
                .build();

        MoneyTransferWorkflow workflow = client.newWorkflowStub(MoneyTransferWorkflow.class, options);

        String referenceId = UUID.randomUUID().toString().substring(0, 18);
        String fromAccount = randomAccountIdentifier();
        String toAccount = randomAccountIdentifier();
        int amountToTransfer = ThreadLocalRandom.current().nextInt(15, 75);
        TransactionDetails transaction = new CoreTransactionDetails(fromAccount, toAccount, referenceId, amountToTransfer);

        WorkflowExecution we = WorkflowClient.start(workflow::transfer, transaction);

        System.out.printf("\\nMONEY TRANSFER PROJECT\\n\\n");
        System.out.printf("Initiating transfer of $%d from [Account %s] to [Account %s].\\n\\n",
                          amountToTransfer, fromAccount, toAccount);
        System.out.printf("[WorkflowID: %s]\\n[RunID: %s]\\n[Transaction Reference: %s]\\n\\n",
                          we.getWorkflowId(), we.getRunId(), referenceId);
        System.exit(0);
    }
}`;

const WORKER_JAVA = `package moneytransferapp;

import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

public class MoneyTransferWorker {

    public static void main(String[] args) {
        WorkflowServiceStubs serviceStub = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(serviceStub);
        WorkerFactory factory = WorkerFactory.newInstance(client);

        Worker worker = factory.newWorker(Shared.MONEY_TRANSFER_TASK_QUEUE);
        worker.registerWorkflowImplementationTypes(MoneyTransferWorkflowImpl.class);
        worker.registerActivitiesImplementations(new AccountActivityImpl());

        System.out.println("Worker is running and actively polling the Task Queue.");
        System.out.println("To quit, use ^C to interrupt.");

        factory.start();
    }
}`;

const START_OUTPUT = `MONEY TRANSFER PROJECT

Initiating transfer of $62 from [Account 249946050] to [Account 591856595].

[WorkflowID: money-transfer-workflow]
[RunID: 37688cca-ffa2-48cf-809b-f18f5119bca3]
[Transaction Reference: 1480a22d-d0fc-4361]`;

const WORKER_OUTPUT = `Worker is running and actively polling the Task Queue.
To quit, use ^C to interrupt.

Withdrawing $62 from account 249946050.
[ReferenceId: 1480a22d-d0fc-4361]

Depositing $62 into account 591856595.
[ReferenceId: 1480a22d-d0fc-4361]
[1480a22d-d0fc-4361] Transaction succeeded.`;

const IMG_BASE = "/img/getting_started/java/first_program_in_java";

export default function Chapter2Page() {
  return (
    <Layout
      title="Run the application - Run your first Temporal Java app"
      description="Chapter 2: Start the Workflow, watch it appear in the Web UI, and run a Worker."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_java.png" alt="Temporal Java SDK" className={styles.heroBannerImg} />
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
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Java", href: "/getting_started/java" },
                  { label: "First program", href: "/getting_started/java/first_program_in_java/" },
                  { label: "Run the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run the application</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Now that you understand the Workflow and Activities, run the application. You'll start the Workflow,
              watch it appear in the Web UI, then start a Worker that executes the Activities and completes the
              transfer.
            </p>

            <section className={styles.section} id="start-the-workflow">
              <h2 className={styles.sectionTitle}>Start the Workflow</h2>
              <p>
                First, make sure the local{" "}
                <a href="https://docs.temporal.io/clusters" target="_blank" rel="noopener noreferrer">Temporal Service</a>{" "}
                is running. Open a new terminal window and run:
              </p>
              <CodeBlock language="bash">{`temporal server start-dev \\
    --log-level=never \\
    --ui-port 8080 \\
    --db-filename=temporal.db`}</CodeBlock>
              <p>To start the Workflow, run this Maven command:</p>
              <CodeBlock language="bash">{`mvn compile exec:java \\
    -Dexec.mainClass="moneytransferapp.TransferApp" \\
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn`}</CodeBlock>
              <p>This command runs the <code>TransferApp.java</code> file, starting the Workflow process:</p>
              <CodeBlock>{START_OUTPUT}</CodeBlock>
              <p>
                The Task Queue is where Temporal Workers look for Workflows and Activities to execute. You define
                Task Queues by assigning a name as a string:
              </p>
              <CodeBlock language="java" title="Shared.java">{SHARED_JAVA}</CodeBlock>
              <p>And here's how <code>TransferApp.java</code> connects to the Cluster and starts the Workflow:</p>
              <CodeBlock language="java" title="TransferApp.java">{TRANSFER_APP_JAVA}</CodeBlock>
              <Admonition type="note">
                <p>
                  This tutorial uses a separate program to start the Workflow, but you don't have to follow this
                  pattern. Most real applications start a Workflow as part of another program - in response to a
                  button press or an API call.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="view-the-state">
              <h2 className={styles.sectionTitle}>View the state of the Workflow with the Temporal Web UI</h2>
              <p>
                Visit the{" "}
                <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Temporal Web UI</a>{" "}
                where you'll see your Workflow listed.
              </p>
              <p>
                <img src={`${IMG_BASE}/workflow-running.png`} alt="The Workflow running" className={styles.diagramImage} />
              </p>
              <p>
                Click the <strong>Workflow ID</strong>. You can see everything about the execution: inputs, timeout
                configurations, scheduled retries, number of attempts, stack traces, and more.
              </p>
              <p>
                <img src={`${IMG_BASE}/workflow-status.png`} alt="The details of the run" className={styles.diagramImage} />
              </p>
              <p>Click the <strong>Input and Results</strong> section to see the inputs:</p>
              <p>
                <img src={`${IMG_BASE}/workflow-input.png`} alt="Input and results" className={styles.diagramImage} />
              </p>
              <p>
                The Workflow is running, but it hasn't executed yet - there are no Workers connected to the Task
                Queue. You'll start the Worker next.
              </p>
            </section>

            <section className={styles.section} id="start-the-worker">
              <h2 className={styles.sectionTitle}>Start a Worker</h2>
              <p>
                A Worker is responsible for executing pieces of Workflow and Activity code. The Worker:
              </p>
              <ul>
                <li>can only execute Workflows and Activities registered to it.</li>
                <li>knows which piece of code to execute based on the Tasks it gets from the Task Queue.</li>
                <li>only listens to the Task Queue that it's registered to.</li>
              </ul>
              <p>Open a new terminal window. In this new window, run the following command to start the Worker:</p>
              <CodeBlock language="bash">{`mvn compile exec:java \\
    -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \\
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn`}</CodeBlock>
              <p>Like the program that started the Workflow, it connects to the Temporal Cluster and registers the Workflow and the three Activities:</p>
              <CodeBlock language="java" title="MoneyTransferWorker.java">{WORKER_JAVA}</CodeBlock>
              <p>When the Worker starts, it begins polling the Task Queue. The output looks like this:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>
              <p>Check the Web UI again. You'll see one Worker registered, and the Workflow status shows that it completed:</p>
              <p>
                <img src={`${IMG_BASE}/completed-workflow.png`} alt="There is now one Worker and the Workflow is complete" className={styles.diagramImage} />
              </p>
              <p>
                Each of these steps is recorded in the Event History, which you can audit under the <strong>History</strong>{" "}
                tab next to <strong>Summary</strong>. After a Workflow completes, the full history persists for a
                retention period (typically 7 to 30 days).
              </p>
              <p>
                You just ran a Temporal Workflow application and saw how Workflows, Activities, and Workers interact.
                Next you'll explore how Temporal handles failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/java/first_program_in_java/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Understand the application</span>
              </Link>
              <Link to="/getting_started/java/first_program_in_java/simulate-failures/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
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
