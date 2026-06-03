// Tutorial chapter 2 of 3: Run the .NET money-transfer application.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIAL_STEPS = [
  { n: 1, label: "Understand the application", href: "/getting_started/dotnet/first_program_in_dotnet/" },
  { n: 2, label: "Run the application", href: "/getting_started/dotnet/first_program_in_dotnet/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/dotnet/first_program_in_dotnet/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "start-the-workflow", label: "Start the Workflow" },
  { id: "view-the-state", label: "View the state in the Web UI" },
  { id: "start-the-worker", label: "Start the Worker" },
];

const WORKER_CS = `using Temporalio.Client;
using Temporalio.Worker;
using Temporalio.MoneyTransferProject.MoneyTransferWorker;

var client = await TemporalClient.ConnectAsync(new("localhost:7233"));

using var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>
{
    tokenSource.Cancel();
    eventArgs.Cancel = true;
};

var activities = new BankingActivities();

using var worker = new TemporalWorker(
    client,
    new TemporalWorkerOptions(taskQueue: "MONEY_TRANSFER_TASK_QUEUE")
        .AddAllActivities(activities)
        .AddWorkflow<MoneyTransferWorkflow>()
);

Console.WriteLine("Running worker...");
try
{
    await worker.ExecuteAsync(tokenSource.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Worker cancelled");
}`;

const WORKER_OUTPUT = `Running worker...
Withdrawing $400 from account 85-150.
Depositing $400 into account 43-812.`;

const IMG_BASE = "/img/getting_started/dotnet/first_program_in_dotnet";

export default function Chapter2Page() {
  return (
    <Layout
      title="Run the application - Run your first Temporal .NET app"
      description="Chapter 2: Start the Workflow, watch it in the Web UI, and run a Worker."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_dotnet.png" alt="Temporal .NET SDK" className={styles.heroBannerImg} />
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
                  { label: ".NET", href: "/getting_started/dotnet" },
                  { label: "First program", href: "/getting_started/dotnet/first_program_in_dotnet/" },
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
              <p>To start the Workflow, run the following command:</p>
              <CodeBlock language="bash">dotnet run --project MoneyTransferClient</CodeBlock>
              <p>
                This command runs the <code>Program.cs</code> file within the <code>MoneyTransferClient</code>{" "}
                project, starting the Workflow process. The Workflow is now running. Leave the program running.
              </p>
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
                Click the <strong>Workflow ID</strong>. You can see everything about the execution: inputs,
                timeouts, scheduled retries, attempts, stack traces, and more:
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
              <p>Open a new terminal window and run the Worker:</p>
              <CodeBlock language="bash">dotnet run --project MoneyTransferWorker</CodeBlock>
              <p>The Worker connects to the Temporal Cluster, specifies the Task Queue, and registers the Workflow and Activities:</p>
              <CodeBlock language="csharp" title="MoneyTransferWorker/Program.cs">{WORKER_CS}</CodeBlock>
              <p>When the Worker starts, it begins polling the Task Queue:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>
              <p>Check the Web UI again. You'll see one Worker registered, and the Workflow status shows completed:</p>
              <p>
                <img src={`${IMG_BASE}/completed_workflow.png`} alt="Worker registered and Workflow complete" className={styles.diagramImage} />
              </p>
              <p>
                You just ran a Temporal Workflow application and saw how Workflows, Activities, and Workers
                interact. Next you'll explore how Temporal handles failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/dotnet/first_program_in_dotnet/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Understand the application</span>
              </Link>
              <Link to="/getting_started/dotnet/first_program_in_dotnet/simulate-failures/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
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
