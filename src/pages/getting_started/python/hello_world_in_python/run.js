// Hello World tutorial chapter 3 of 3: Start the Workflow Execution and run the application.
// Canonical code: https://github.com/temporalio/hello-world-project-template-python
// See ./index.js for shared canonical-source notes.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
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
    href: "/getting_started/python/hello_world_in_python/",
  },
  {
    n: 2,
    label: "Test and run a Worker",
    href: "/getting_started/python/hello_world_in_python/worker-and-test/",
  },
  {
    n: 3,
    label: "Run the application",
    href: "/getting_started/python/hello_world_in_python/run/",
  },
];

const TOC_ITEMS = [
  { id: "client", label: "Write code to start a Workflow Execution" },
  { id: "run", label: "Run the Temporal Application" },
  { id: "conclusion", label: "Conclusion" },
];

const RUN_WORKFLOW_PY = `import asyncio

from run_worker import SayHello
from temporalio.client import Client


async def main():
    # Create client connected to server at the given address
    client = await Client.connect("localhost:7233")

    # Execute a workflow
    result = await client.execute_workflow(
        SayHello.run, "Temporal", id="hello-workflow", task_queue="hello-task-queue"
    )

    print(f"Result: {result}")


if __name__ == "__main__":
    asyncio.run(main())`;

const RUN_OUTPUT = `Result: Hello, Temporal!`;

export default function Chapter3Page() {
  return (
    <Layout
      title="Run the application - Build a Temporal app from scratch in Python"
      description="Chapter 3: Write a small client program to start the Workflow Execution, run the Worker, and see your Temporal app in action."
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
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Python", href: "/getting_started/python" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/python/hello_world_in_python/",
                  },
                  { label: "Run the application" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run the Temporal Application</h1>

            <MetaChips
              items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              With your Workflow, Activity, test, and Worker in place, the
              final piece is starting the Workflow from a small client program.
              You'll then run the Worker and the client side-by-side to see
              your Temporal Application execute end-to-end.
            </p>

            <section className={styles.section} id="client">
              <h2 className={styles.sectionTitle}>
                Write code to start a Workflow Execution
              </h2>
              <p>
                You can start a Workflow Execution by using the Temporal CLI or
                by writing code using the Temporal SDK. In this tutorial,
                you'll use the Temporal SDK to start the Workflow, which is how
                most real-world applications work.
              </p>
              <p>
                Starting a Workflow Execution using the Temporal SDK involves
                connecting to the Temporal Server, configuring the Task Queue
                the Workflow should use, and starting the Workflow with the
                input parameters it expects. In a real application, you may
                invoke this code when someone submits a form, presses a
                button, or visits a certain URL. In this tutorial, you'll
                create a small command-line program that starts the Workflow
                Execution.
              </p>
              <p>
                Create the file <code>run_workflow.py</code> and add the
                following to connect to the server and start the Workflow:
              </p>
              <CodeBlock language="py" title="run_workflow.py">
                {RUN_WORKFLOW_PY}
              </CodeBlock>
              <p>
                Like the Worker you created, this program uses{" "}
                <code>client.Connect</code> to connect to the Temporal server.
                It then executes the Workflow using{" "}
                <code>client.ExecuteWorkflow</code>, which requires the
                Workflow to run, the input parameters for the Workflow, a{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/python/foundations#workflow-id"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow ID
                </a>{" "}
                for the Workflow, and the Task Queue to use. The Worker you
                configured is looking for tasks on that Task Queue.
              </p>

              <Admonition type="tip" title="Specify a Workflow ID">
                <p>
                  You need to specify a Workflow ID when executing a Workflow.
                  You'll use this ID to locate the Workflow Execution later in
                  logs or to interact with a running Workflow in the future.
                </p>
                <p>
                  Using a Workflow ID that reflects some business process or
                  entity is a good practice. For example, you might use a
                  customer identifier or email address as part of the Workflow
                  ID if you ran one Workflow per customer. This would make it
                  easier to find all the Workflow Executions related to that
                  customer later.
                </p>
              </Admonition>

              <p>
                You have a Workflow, an Activity, a Worker, and a way to start
                a Workflow Execution. It's time to run the Workflow.
              </p>
            </section>

            <section className={styles.section} id="run">
              <h2 className={styles.sectionTitle}>Run the Temporal Application</h2>
              <p>
                To run your Temporal Application, you need to start the
                Workflow and the Worker. You can start these in any order, but
                you'll need to run each command from a separate terminal
                window, as the Worker needs to be constantly running to look
                for tasks to execute.
              </p>
              <p>
                First, ensure that your local Temporal Cluster is running. If
                it is not running, run the following command to start it.
              </p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>To start the Worker, run this command from the project root:</p>
              <CodeBlock language="bash">python run_worker.py</CodeBlock>
              <p>
                You won't see any output right away, but leave the program
                running.
              </p>
              <p>
                To start the Workflow, open a new terminal window and switch
                to your project root:
              </p>
              <CodeBlock language="bash">cd hello-world-temporal</CodeBlock>
              <p>Activate the virtual environment in this terminal:</p>
              <Tabs queryString groupId="os">
                <TabItem value="win" label="Windows">
                  <CodeBlock language="bash">env\Scripts\activate</CodeBlock>
                </TabItem>
                <TabItem value="mac" label="macOS">
                  <CodeBlock language="bash">source env/bin/activate</CodeBlock>
                </TabItem>
              </Tabs>
              <p>
                Then run <code>run_workflow.py</code> from the project root to
                start the Workflow Execution:
              </p>
              <CodeBlock language="bash">python run_workflow.py</CodeBlock>
              <p>The program runs and returns the result:</p>
              <CodeBlock language="bash">{RUN_OUTPUT}</CodeBlock>
              <p>
                Switch to the terminal window that's running the Worker. Stop
                the Worker process with <code>CTRL-C</code> in the terminal.
              </p>
              <p>
                You have successfully built a Temporal Application from
                scratch.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You now know how to build a Temporal Application using the
                Python SDK. You've built a Workflow, an Activity, a test
                suite, and a Worker. Along the way, you saw how Temporal's
                building blocks fit together: the Workflow orchestrates the
                Activity, the Worker hosts and executes the code, and a client
                program kicks off the Workflow Execution.
              </p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>
                    Take Temporal 101 with Python
                  </h3>
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
                  <h3 className={styles.nextTitle}>
                    Explore the Beginner path
                  </h3>
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
                to="/getting_started/python/hello_world_in_python/worker-and-test/"
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
