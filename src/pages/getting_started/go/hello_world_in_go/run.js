// Hello World tutorial chapter 3 of 3: Run the application and observe automatic retries.
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
    label: "Build the application",
    href: "/getting_started/go/hello_world_in_go/",
  },
  {
    n: 2,
    label: "Test and run a Worker",
    href: "/getting_started/go/hello_world_in_go/worker-and-test/",
  },
  {
    n: 3,
    label: "Run and observe retries",
    href: "/getting_started/go/hello_world_in_go/run/",
  },
];

const TOC_ITEMS = [
  { id: "client", label: "Run the Workflow from a client" },
  { id: "web-ui", label: "Explore the Web UI" },
  { id: "retries", label: "Observe automatic retries" },
  { id: "conclusion", label: "Conclusion" },
];

const CLIENT_GO = `package main

import (
\t"context"
\t"fmt"
\t"log"
\t"os"

\t"temporal-ip-geolocation/iplocate"

\t"github.com/google/uuid"
\t"go.temporal.io/sdk/client"
)

func main() {
\tif len(os.Args) <= 1 {
\t\tlog.Fatalln("Must specify a name as the command-line argument")
\t}
\tname := os.Args[1]

\tc, err := client.Dial(client.Options{})
\tif err != nil {
\t\tlog.Fatalln("Unable to create client", err)
\t}
\tdefer c.Close()

\tworkflowID := "getAddressFromIP-" + uuid.New().String()

\toptions := client.StartWorkflowOptions{
\t\tID:        workflowID,
\t\tTaskQueue: iplocate.TaskQueueName,
\t}

\twe, err := c.ExecuteWorkflow(context.Background(), options, iplocate.GetAddressFromIP, name)
\tif err != nil {
\t\tlog.Fatalln("Unable to execute workflow", err)
\t}

\tvar result string
\terr = we.Get(context.Background(), &result)
\tif err != nil {
\t\tlog.Fatalln("Unable get workflow result", err)
\t}

\tfmt.Println(result)
}`;

const CLIENT_OUTPUT = `2024/12/17 10:43:15 INFO  No logger configured for temporal client. Created default one.
Hello, Brian. Your IP is 198.51.100.23 and your location is Seattle, Washington, United States`;

const IMG_BASE = "/img/getting_started/go/hello_world_in_go";

export default function Chapter3Page() {
  return (
    <Layout
      title="Run and observe retries - Build a Temporal app from scratch in Go"
      description="Chapter 3: Start the Workflow from a client, explore the Temporal Web UI, and watch Temporal recover from a failed Activity."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Go", href: "/getting_started/go" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/go/hello_world_in_go/",
                  },
                  { label: "Run and observe retries" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run the Workflow and observe retries</h1>

            <MetaChips
              items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              With your Workflow, Activities, Worker, and tests in place,
              you'll now start the Workflow from a small client program. Then
              you'll explore the run in the Temporal Web UI and watch Temporal
              automatically retry an Activity when the network drops.
            </p>

            <section className={styles.section} id="client">
              <h2 className={styles.sectionTitle}>Run the Workflow from a client</h2>
              <p>
                You can start a Workflow Execution by using the Temporal CLI or
                by writing code using the Temporal SDK.
              </p>
              <p>
                Starting a Workflow Execution using the Temporal SDK involves
                connecting to the Temporal Server, configuring the Task Queue
                the Workflow should use, and starting the Workflow with the
                input parameters it expects. In a real application, you may
                invoke this code when someone submits a form, presses a
                button, or visits a certain URL. In this tutorial, you will
                create a small CLI program that runs your Temporal Workflow.
              </p>
              <p>
                Create a new directory called <code>client</code> to hold the
                program:
              </p>
              <CodeBlock language="bash">mkdir client</CodeBlock>
              <p>
                Then create the file <code>client/main.go</code>:
              </p>
              <CodeBlock language="bash">touch client/main.go</CodeBlock>
              <p>
                Open <code>client/main.go</code> in your editor and add the
                following code to the file to connect to the server and start
                the Workflow:
              </p>
              <CodeBlock language="go" title="client/main.go">
                {CLIENT_GO}
              </CodeBlock>
              <p>
                In the <code>main</code> function you check to see if there is
                at least one argument passed and then capture the user's name
                from the arguments.
              </p>
              <p>
                The <code>main</code> function then sets up a connection to
                your Temporal Server, invokes your Workflow, passes in an
                argument for the <code>name</code>, and assigns the Workflow a
                unique identifier using a UUID. The client dispatches the
                Workflow on the same Task Queue that the Worker is polling on.
                That's why you used a constant to ensure the Task Queue name
                is consistent. If there's a mismatch, your Workflow will
                execute on a different Task Queue and there won't be any
                Workers polling for tasks.
              </p>

              <Admonition type="note" title="Specify a Workflow Id">
                <p>
                  A Workflow ID is unique in a Namespace and identifies a
                  Workflow Execution. Using an identifier that reflects some
                  business process or entity is a good practice. For example,
                  you might use a customer identifier as part of the Workflow
                  Id if you run one Workflow per customer. This would make it
                  easier to find all Workflow Executions related to that
                  customer later.
                </p>
                <p>
                  In this tutorial you're generating a UUID and appending it
                  to a string that identifies the Workflow.
                </p>
              </Admonition>

              <p>
                You can{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/go/foundations#get-workflow-results"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  get the results
                </a>{" "}
                from your Workflow right away, or you can get the results at a
                later time. This implementation attempts to get the results
                immediately by calling <code>we.Get</code>, which blocks the
                program's execution until the Workflow Execution completes.
              </p>
              <p>
                Now you can run your Workflow. First, ensure that your local
                Temporal Service is running, and that your Worker program is
                running also.
              </p>
              <p>
                Then open a new terminal and switch to the project directory:
              </p>
              <CodeBlock language="bash">cd temporal-ip-geolocation</CodeBlock>
              <p>
                Now run the following command to run the Workflow using the
                client program you wrote:
              </p>
              <CodeBlock language="bash">go run client/main.go Brian</CodeBlock>
              <p>You'll see the following output:</p>
              <CodeBlock>{CLIENT_OUTPUT}</CodeBlock>

              <Admonition type="tip">
                <p>
                  To run your Temporal Application, you need to start the
                  Workflow and the Worker. You can start these in any order,
                  but you'll need to run each command from a separate terminal
                  window, as the Worker needs to be constantly running to look
                  for tasks to execute.
                </p>
              </Admonition>

              <p>
                Your Temporal Application works. Now review it in the Temporal
                Web UI.
              </p>
            </section>

            <section className={styles.section} id="web-ui">
              <h2 className={styles.sectionTitle}>
                Exploring your application in the Web UI
              </h2>
              <p>
                The Temporal Web UI gives you insights into your Workflow's
                execution. Open the Temporal Web UI by visiting{" "}
                <code>http://localhost:8233</code> and click on your completed
                Workflow to view the execution history. You'll see results
                similar to the following image:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/overview.png`}
                  alt="The UI shows the results of the Workflow including the output"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                You'll see the dates the Workflow Execution ran, how long it
                took to run, the input to the Workflow, and the result.
              </p>
              <p>
                After that, you see the Event History, detailing the entire
                flow, including the inputs and outputs of the Activity
                Executions:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/history.png`}
                  alt="The Workflow History showing all Activities and their results, oldest to newest."
                  className={styles.diagramImage}
                />
              </p>
              <p>
                The most recent event is at the top, so read the history from
                the bottom up to see each step in the process. Using this
                history, you can see exactly how your Workflow executed and
                pinpoint any places things might have gone wrong.
              </p>
              <p>
                Temporal stores the results of each Activity in this history,
                as you can see in the image. If there was a system crash
                between the <code>GetIP</code> and <code>GetLocationInfo</code>{" "}
                Activity Executions, a new Worker would re-run the Workflow,
                but would use the previous Event History to reconstruct the
                Workflow's state. Instead of re-running <code>GetIP</code>, it
                would use the previous run's value and continue on. This
                prevents duplicate executions. By relying on the stored Event
                History, Temporal ensures that the Workflow can recover
                seamlessly, maintaining reliability and consistency even after
                a crash.
              </p>
              <p>
                In this application, this recovery isn't crucial. But imagine
                a situation where each Activity execution was a bank
                transaction. If a crash occurred between transactions, the
                Worker can pick up where the previous one failed. Nobody gets
                charged multiple times because something failed.
              </p>
              <p>Next, you'll explore how Temporal handles failed Activities.</p>
            </section>

            <section className={styles.section} id="retries">
              <h2 className={styles.sectionTitle}>Observe automatic retries</h2>
              <p>
                When you developed your Activities, you didn't include any
                error-handling code. So if there's a problem making the
                request, the Workflow will handle the error using the Retry
                Policy.
              </p>
              <p>
                Test this out. Disconnect your local machine from the Internet
                by turning off your Wi-Fi connection or unplugging your
                network cable.
              </p>
              <p>
                Then, with the local Temporal Service running and your Worker
                running, switch to the terminal window where you ran your
                Workflow and run it again:
              </p>
              <CodeBlock language="bash">go run client/main.go Brian</CodeBlock>
              <p>This time you don't get a response.</p>
              <p>
                Visit <code>http://localhost:8233</code> to open the Temporal
                Web UI and locate the Workflow Execution that's currently
                running. When you select it, you'll see something like the
                following image, indicating that there's a problem:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/timeline_failed.png`}
                  alt="The timeline shows the Activity failure"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                As you can see, the <code>GetIP</code> Activity has failed and
                Temporal is retrying it. Scroll down to the Event History and
                you'll see the failure represented there:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/history_failed.png`}
                  alt="The Event History shows the failed Activity"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Select the <strong>Pending Activity</strong> item in the table
                to see why it failed and you'll see the stack trace:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/activity_stack_trace.png`}
                  alt="The Activity stack trace shows the error"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                In the <strong>Last Failure</strong> field, you can see that a
                DNS error occurred whilst resolving the domain name for the
                external service that the <code>GetIP</code> Activity fetches
                data from.
              </p>
              <p>
                Connect to the internet again and wait. After a few moments,
                the Workflow recovers and completes:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/history_recovered.png`}
                  alt="Once the network comes back the history updates and shows that things completed."
                  className={styles.diagramImage}
                />
              </p>
              <p>
                If you return to your terminal where you launched the
                Workflow, you'll find your results there as well.
              </p>
              <p>
                You can recover from failures by letting Temporal handle them
                for you instead of writing complex error-handling logic. You
                can also decide that you only want to retry a fixed number of
                times, or that you only want to recover on certain kinds of
                errors.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                In this tutorial you built your first Temporal Application
                from scratch. You used the Temporal Go SDK to build a
                resilient application that recovered from failure. You wrote
                tests to verify that it works and reviewed the Event History
                for a working execution. You also tested your Workflow without
                an internet connection to understand how Temporal recovers
                from failures like network outages.
              </p>
              <p>
                Take this application one step further and add a new Activity
                that gets the current weather for the location you found.
              </p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take Temporal 101 with Go</h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks -
                    Workflows and Activities - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>
                    Start Temporal 101 <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link to="/paths/beginner" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Keep building</span>
                  <h3 className={styles.nextTitle}>Explore the Beginner path</h3>
                  <p className={styles.nextBody}>
                    Continue along the Beginner learning path with more
                    tutorials and courses.
                  </p>
                  <span className={styles.nextCta}>
                    Browse Beginner <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/go/hello_world_in_go/worker-and-test/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 2
                </span>
                <span className={styles.chapterNavTitle}>
                  Test and run a Worker
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
