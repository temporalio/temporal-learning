// Hello World tutorial chapter 2 of 3: Write a unit test and configure a Worker.
// Canonical code: https://github.com/temporalio/hello-world-project-template-python
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
  { id: "test", label: "Add a unit test" },
  { id: "worker", label: "Configure a Worker" },
];

const TEST_PY = `import uuid

import pytest

from temporalio import activity
from temporalio.worker import Worker
from temporalio.testing import WorkflowEnvironment

from activities import say_hello
from workflows import SayHello

@pytest.mark.asyncio
async def test_execute_workflow():
    task_queue_name = str(uuid.uuid4())
    async with await WorkflowEnvironment.start_time_skipping() as env:

        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[SayHello],
            activities=[say_hello],
        ):
            assert "Hello, World!" == await env.client.execute_workflow(
                SayHello.run,
                "World",
                id=str(uuid.uuid4()),
                task_queue=task_queue_name,
            )`;

const TEST_MOCK_PY = `# ...


@activity.defn(name="say_hello")
async def say_hello_mocked(name: str) -> str:
    return f"Hello, {name} from mocked activity!"


@pytest.mark.asyncio
async def test_mock_activity():
    task_queue_name = str(uuid.uuid4())
    async with await WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[SayHello],
            activities=[say_hello_mocked],
        ):
            assert "Hello, World from mocked activity!" == await env.client.execute_workflow(
                SayHello.run,
                "World",
                id=str(uuid.uuid4()),
                task_queue=task_queue_name,
            )`;

const TEST_OUTPUT = `===================== test session starts =====================
platform darwin -- Python 3.10.9, pytest-7.2.0, pluggy-1.0.0
rootdir: /hello-world-python-getting-started
plugins: asyncio-0.20.3, anyio-3.6.2
asyncio: mode=strict
collected 2 items

tests/test_run_workflow.py ..                             [100%]
===================== 2 passed in 10.29s ======================`;

const RUN_WORKER_PY = `import asyncio

from temporalio import activity, workflow
from temporalio.client import Client
from temporalio.worker import Worker

from activities import say_hello
from workflows import SayHello

async def main():
    client = await Client.connect("localhost:7233", namespace="default")
    # Run the worker
    worker = Worker(
        client, task_queue="hello-task-queue", workflows=[SayHello], activities=[say_hello]
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())`;

export default function Chapter2Page() {
  return (
    <Layout
      title="Test and run a Worker - Build a Temporal app from scratch in Python"
      description="Chapter 2: Write a pytest unit test for your Workflow, then configure a Worker to host the Workflow and Activity."
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
                  { label: "Get Started", href: "/start" },
                  { label: "Python", href: "/getting_started/python" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/python/hello_world_in_python/",
                  },
                  { label: "Test and run a Worker" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Test and run a Worker</h1>

            <MetaChips
              items={["~10 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              With your Workflow and Activity in place, you'll write a unit
              test to verify the Workflow runs as expected, then configure a
              Worker to host the code and poll a Task Queue for work.
            </p>

            <section className={styles.section} id="test">
              <h2 className={styles.sectionTitle}>Add a unit test</h2>
              <p>
                The Temporal Python SDK includes functions that help you test
                your Workflow executions. Let's add tests to the application to
                make sure the Workflow works as expected.
              </p>
              <p>
                Create a new folder in your project directory called{" "}
                <code>tests</code>:
              </p>
              <CodeBlock language="bash">mkdir tests</CodeBlock>
              <p>
                Create an empty <code>__init__.py</code> file within that
                directory:
              </p>
              <CodeBlock language="bash">touch tests/__init__.py</CodeBlock>
              <p>
                Create the <code>/test_run_workflow.py</code> file in the{" "}
                <code>tests</code> directory and add the following content to
                test the Workflow:
              </p>
              <CodeBlock language="bash">touch tests/test_run_workflow.py</CodeBlock>
              <CodeBlock language="py" title="tests/test_run_workflow.py">
                {TEST_PY}
              </CodeBlock>
              <p>
                This code snippet imports the <code>uuid</code> and{" "}
                <code>pytest</code> packages, along with <code>Activity</code>{" "}
                and <code>Worker</code> from the Temporal SDK. It then imports{" "}
                <code>WorkflowEnvironment</code> from the Temporal SDK so you
                can create an environment for testing. It then imports your
                Activity and Workflow.
              </p>
              <p>
                The test function <code>test_execute_workflow</code> creates a{" "}
                <code>WorkflowEnvironment</code> so it can run the tests. It
                then creates a random Task Queue name and initiates the Worker
                with <code>env.client.execute_workflow</code>. It then checks
                if the result of the Workflow Execution is{" "}
                <code>Hello, World!</code> when the input parameter is{" "}
                <code>World</code>.
              </p>

              <Admonition type="note">
                <p>
                  The <code>start_time_skipping()</code> option starts a new
                  environment that lets you test long-running Workflows without
                  waiting for them to complete in real-time. You can use the{" "}
                  <code>start_local()</code> option instead, which uses a full
                  local instance of the Temporal server instead. Both of these
                  options download an instances of Temporal server on your
                  first test run. This instance runs as a separate process
                  during your test runs.
                </p>
                <p>
                  The <code>start_time_skipping()</code> option isn't a full
                  implementation of the Temporal server, but it's good for
                  basic tests like the ones in this tutorial.
                </p>
              </Admonition>

              <p>
                This code tests the Workflow and invokes the actual{" "}
                <code>say_hello</code> Activity. However, you may want to test
                your Workflows and mock out the Activity so you can see how
                your Workflow responds to different inputs and results.
              </p>
              <p>
                Add the following code to create a test that uses a mocked{" "}
                <code>say_hello</code> Activity:
              </p>
              <CodeBlock language="py" title="tests/test_run_workflow.py">
                {TEST_MOCK_PY}
              </CodeBlock>
              <p>
                This creates a function called <code>say_hello_mocked</code>{" "}
                which the Workflow test will use as the mock Activity function.
                The <code>test_mock_activity</code> test then checks that the
                outcome of the Workflow is{" "}
                <code>"Hello, World from mocked activity!"</code> for the
                passed input parameter <code>World</code>, using the same type
                of test setup as the previous test function.
              </p>
              <p>
                Run the following command from the project root to start the
                tests:
              </p>
              <CodeBlock language="bash">pytest</CodeBlock>
              <p>
                This command will search for files in your <code>tests</code>{" "}
                folder that match the pattern <code>test_*.py</code> or{" "}
                <code>*_test.py</code>.
              </p>
              <p>
                You'll see output similar to the following from your test run
                indicating that the test was successful:
              </p>
              <CodeBlock language="bash">{TEST_OUTPUT}</CodeBlock>
              <p>
                You can also pass the command line option{" "}
                <code>--workflow-environment</code> at runtime to change the
                test environment.
              </p>
              <p>
                Most test suites reuse the local environment across tests. You
                can explore{" "}
                <a
                  href="https://docs.pytest.org/en/6.2.x/fixture.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  fixtures in Pytest
                </a>{" "}
                to set this up.
              </p>
              <p>
                You've built a test suite and you've successfully tested your
                Workflow. You can reuse the <code>conftest.py</code> file
                you've built in future Temporal Python projects.
              </p>
              <p>
                You have a working Temporal Application and tests that make
                sure the Workflow executes as expected. Next, you'll configure
                a Worker to execute your Workflow.
              </p>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Configure a Worker</h2>
              <p>
                A{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-worker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker
                </a>{" "}
                hosts Workflow and Activity functions and executes them. The
                Temporal Cluster tells the Worker to execute a specific
                function from information it pulls from the{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-task-queue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queue
                </a>
                . After the Worker runs the code, it communicates the results
                back to the Temporal Cluster.
              </p>
              <p>
                When you start a Workflow, you tell the server which Task Queue
                the Workflow and Activities use. A Worker listens and polls on
                the Task Queue, looking for work to do.
              </p>
              <p>
                To configure a Worker process using the Python SDK, you'll
                connect to the Temporal Cluster and give it the name of the
                Task Queue to poll.
              </p>
              <p>
                You'll connect to the Temporal Cluster using a Temporal Client,
                which provides a set of APIs to communicate with a Temporal
                Cluster. You'll use Clients to interact with existing Workflows
                or to start new ones.
              </p>
              <p>
                In this tutorial you'll create a small standalone Worker
                program so you can see how all of the components work together.
              </p>
              <p>
                Create the file <code>run_worker.py</code> in the root of your
                project and add the following code to connect to the Temporal
                Server, instantiate the Worker, and register the Workflow and
                Activity:
              </p>
              <CodeBlock language="py" title="run_worker.py">
                {RUN_WORKER_PY}
              </CodeBlock>
              <p>
                This program connects to the Temporal Cluster using{" "}
                <code>client.Connect</code>. In this example, you only need to
                provide a target host and a Namespace. Since you're running
                this locally, you use{" "}
                <a
                  href="http://localhost:7233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  localhost:7233
                </a>{" "}
                for the target host, and you specify the optional default
                Namespace name, <code>default</code>.
              </p>
              <p>
                You then create a new Worker instance by specifying the client,
                the Task Queue to poll, and the Workflows and Activities to
                monitor. Then you run the worker.
              </p>
              <p>
                You've created a program that instantiates a Worker to process
                the Workflow. Now you need to start the Workflow.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/python/hello_world_in_python/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Build the application
                </span>
              </Link>
              <Link
                to="/getting_started/python/hello_world_in_python/run/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Run the application
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
