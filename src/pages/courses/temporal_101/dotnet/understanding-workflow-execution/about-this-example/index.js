// Free preview lesson 1 of 2 from the Temporal 101 (.NET) course.
// Source: https://github.com/temporalio/edu-101-dotnet-content (understanding-workflow-execution/about-this-example.md)

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
  { id: "actors", label: "Actors in the scenario" },
  { id: "workers-and-tasks", label: "Workers and tasks" },
  { id: "commands", label: "Commands" },
  { id: "activities", label: "Activity Definitions" },
  { id: "workflow", label: "Workflow Definition" },
  { id: "worker", label: "Worker initialization" },
  { id: "summary", label: "Summary" },
];

const ACTIVITIES_CSHARP = `namespace TemporalioFarewell.Workflow;

using Temporalio.Activities;

public class TranslateActivities
{
    private readonly HttpClient client;

    public TranslateActivities(HttpClient client) => this.client = client;

    [Activity]
    public async Task<string> GetSpanishGreetingAsync(string name)
    {
        var encodedName = Uri.EscapeDataString(name);
        var response = await client.GetAsync($"http://localhost:5125/get-spanish-greeting?name={encodedName}");
        return await response.Content.ReadAsStringAsync();
    }

    [Activity]
    public async Task<string> GetSpanishFarewellAsync(string name)
    {
        var encodedName = Uri.EscapeDataString(name);
        var response = await client.GetAsync($"http://localhost:5125/get-spanish-farewell?name={encodedName}");
        return await response.Content.ReadAsStringAsync();
    }
}`;

const WORKFLOW_CSHARP = `namespace TemporalioFarewell.Workflow;

using Temporalio.Workflows;

[Workflow]
public class GreetingWorkflow
{
    [WorkflowRun]
    public async Task<string> RunAsync(string name)
    {
        // Spanish greeting
        var greeting = await Workflow.ExecuteActivityAsync(
            (TranslateActivities act) => act.GetSpanishGreetingAsync(name),
            new() { ScheduleToCloseTimeout = TimeSpan.FromMinutes(3) });
        // Spanish farewell
        var farewell = await Workflow.ExecuteActivityAsync(
            (TranslateActivities act) => act.GetSpanishFarewellAsync(name),
            new() { ScheduleToCloseTimeout = TimeSpan.FromMinutes(3) });
        // Greeting and farewell
        return $"{greeting}\\n{farewell}";
    }
}`;

const WORKER_CSHARP = `// This file is designated to run the Worker
using Temporalio.Client;
using Temporalio.Worker;
using TemporalioFarewell.Workflow;

// Create a client to localhost on "default" namespace
var client = await TemporalClient.ConnectAsync(new("localhost:7233"));

// Cancellation token to shutdown worker on ctrl+c
using var tokenSource = new CancellationTokenSource();
Console.CancelKeyPress += (_, eventArgs) =>
{
    tokenSource.Cancel();
    eventArgs.Cancel = true;
};

using var httpClient = new HttpClient();
var activities = new TranslateActivities(httpClient);

// Create worker
using var worker = new TemporalWorker(
    client,
    new TemporalWorkerOptions("farewell-workflow").
        AddAllActivities(activities).
        AddWorkflow<GreetingWorkflow>());

// Run worker until cancelled
Console.WriteLine("Running worker");
try
{
    await worker.ExecuteAsync(tokenSource.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Worker cancelled");
}`;

const IMG_BASE =
  "/courses/temporal-101/dotnet/chapter_09";

export default function AboutThisExamplePage() {
  return (
    <Layout
      title="About this example - Temporal 101 (.NET) free preview"
      description="Free preview of Temporal 101 (.NET): meet the Worker, Temporal Service, and Client Application that work together during a Workflow Execution."
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
                  { label: "About this example" },
                ]}
              />
            </div>

            <h1 className={styles.title}>About this example</h1>

            <MetaChips items={["Free preview", "Temporal 101", ".NET"]} />

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
              <h2 className={styles.sectionTitle}>Actors in the scenario</h2>
              <p>
                Let's begin by identifying the actors in this scenario, which
                will help to reiterate some important concepts.
              </p>
              <p>
                First, the example includes a Worker, which executes the
                Workflow and Activity code, and uses a Client to communicate
                with the Temporal Service.
              </p>
              <p>
                Next, the Temporal Service orchestrates the execution of that
                code by coordinating with the Worker, using a shared task
                queue.
              </p>
              <p>
                Finally, the program that starts the Workflow, which will be
                referred to as a Client application because it requests
                Workflow Execution as well as the result from the Temporal
                Service, uses a Client to do this.
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
                The assignment of work is indirect. The Temporal Service does
                not assign tasks to a Worker (in fact, the Temporal Service
                does not maintain a list of Workers).
              </p>
              <p>
                Instead, the Workers continually poll the Temporal Service's
                Task Queue and accept tasks when they have spare capacity to
                process them. There are several benefits to this approach,
                but one of them is that tasks will just sit in the queue if
                there aren't enough Workers, which means that you can increase
                throughput and scalability by adding more Workers.
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
                during a Workflow Execution, such as a call to the Workflow's{" "}
                <code>ExecuteActivityAsync</code> function, it sends a Command
                to the Temporal Service. The Service acts on these Commands,
                for example, by creating an Activity Task, but also stores
                them in case of failure.
              </p>
              <p>
                For example, if the Worker crashes, the Temporal Service uses
                this information to recreate the state of the Workflow to
                what it was immediately before the crash and then resumes
                progress from that point. This allows you, as a developer, to
                code as if this type of failure wasn't even a possibility.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/commands.png`}
                  alt="Diagram showing Worker sending Commands to the Temporal Service"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>Activity Definitions</h2>
              <p>
                The application defines two Activities:{" "}
                <code>GetSpanishGreeting</code> and{" "}
                <code>GetSpanishFarewell</code>.
              </p>
              <CodeBlock language="csharp" title="TranslateActivities.cs">
                {ACTIVITIES_CSHARP}
              </CodeBlock>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>
                The Workflow Definition executes those two Activities and
                returns a string created from their output.
              </p>
              <CodeBlock language="csharp" title="GreetingWorkflow.cs">
                {WORKFLOW_CSHARP}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Worker initialization</h2>
              <p>
                Here's the Worker initialization code, which registers the
                Workflow and Activity Definitions.
              </p>
              <CodeBlock language="csharp" title="Program.cs">
                {WORKER_CSHARP}
              </CodeBlock>
            </section>

            <section className={styles.section} id="summary">
              <h2 className={styles.sectionTitle}>Summary</h2>
              <p>
                In this course, you saw how the parts of a Temporal
                Application - a Worker, the Temporal Service, and the Client
                Application - work together during a Workflow Execution.
              </p>
              <p>
                In the next video, you will see how all the parts work
                together through a code walkthrough.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/dotnet/"
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
                to="/courses/temporal_101/dotnet/understanding-workflow-execution/code-walkthrough/"
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
