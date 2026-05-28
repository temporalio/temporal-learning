// Hello World tutorial chapter 1 of 3: Build the Workflow and Activity from scratch.
// Canonical code lives at https://github.com/temporalio/hello-world-project-template-python.
// Update the *_PY constants here when the upstream repo changes.

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create a new Python project" },
  { id: "workflow", label: "Create a Workflow" },
  { id: "activity", label: "Create an Activity" },
];

const WORKFLOW_PY = `from datetime import timedelta
from temporalio import workflow

# Import activity, passing it through the sandbox without reloading the module
with workflow.unsafe.imports_passed_through():
    from activities import say_hello

@workflow.defn
class SayHello:
    @workflow.run
    async def run(self, name: str) -> str:
        return await workflow.execute_activity(
            say_hello, name, start_to_close_timeout=timedelta(seconds=5)
        )`;

const ACTIVITY_PY = `from temporalio import activity

@activity.defn
async def say_hello(name: str) -> str:
    return f"Hello, {name}!"
`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Build the application - Build a Temporal app from scratch in Python"
      description="Chapter 1: Create a Python project, define a Workflow class, and write an Activity function."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Python", href: "/getting_started/python" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/python/hello_world_in_python/",
                  },
                  { label: "Build the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Temporal Application from scratch in Python
            </h1>

            <MetaChips
              items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Creating reliable applications is a difficult task.{" "}
              <a
                href="https://temporal.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal
              </a>{" "}
              lets you create fault-tolerant resilient applications using
              programming languages you already know, so you can build complex
              applications that execute successfully and recover from failures.
              In this tutorial, you'll build a{" "}
              <a
                href="https://docs.temporal.io/temporal#temporal-application"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Application
              </a>{" "}
              using the{" "}
              <a
                href="https://github.com/temporalio/sdk-python"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Python SDK
              </a>
              .
            </p>

            <Admonition type="note" title="What you'll build">
              <p>The app will consist of the following pieces:</p>
              <ol>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/workflows"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflow
                  </a>
                  : Workflows are functions that define the overall flow of the
                  Application and represent the orchestration aspect of the
                  business logic.
                </li>
                <li>
                  An{" "}
                  <a
                    href="https://docs.temporal.io/activities"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activity
                  </a>
                  : Activities are functions called during Workflow Execution
                  and represent the execution aspect of your business logic.
                  The Workflow you'll create executes a single Activity, which
                  takes a string from the Workflow as input and returns a
                  formatted version of this string to the Workflow.
                </li>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/workers"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Worker
                  </a>
                  : Workers host the Activity and Workflow code and execute the
                  code piece by piece.
                </li>
              </ol>
              <p>
                You'll also write a test with the{" "}
                <a
                  href="https://pytest.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  pytest
                </a>{" "}
                framework to ensure your Workflow executes successfully.
              </p>
              <p>
                All the code in this tutorial is available in the{" "}
                <a
                  href="https://github.com/temporalio/hello-world-project-template-python"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  hello-world python template
                </a>{" "}
                repository.
              </p>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li>
                  <Link to="/getting_started/python/dev_environment/">
                    Set up a local development environment for developing
                    Temporal Applications with Python
                  </Link>
                  . Ensure the Temporal Service is running locally and you can
                  access the Web UI on port <code>8233</code> (the default).
                </li>
                <li>
                  Follow the{" "}
                  <Link to="/getting_started/python/first_program_in_python/">
                    Run your first Temporal application with the Python SDK
                  </Link>{" "}
                  tutorial to understand how Temporal's components fit together.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>Create a new Python project</h2>
              <p>
                To get started with the Temporal Python SDK, create a new
                Python project and initialize a new virtual environment, just
                like any other Python program.
              </p>
              <p>
                In a terminal, create a directory called{" "}
                <code>hello-world-temporal</code>:
              </p>
              <CodeBlock language="bash">mkdir hello-world-temporal</CodeBlock>
              <p>Change into that directory:</p>
              <CodeBlock language="bash">cd hello-world-temporal</CodeBlock>
              <p>
                Create a Python virtual environment with <code>venv</code>:
              </p>
              <Tabs queryString groupId="os">
                <TabItem value="win" label="Windows">
                  <CodeBlock language="bash">python -m venv env</CodeBlock>
                </TabItem>
                <TabItem value="mac" label="macOS">
                  <CodeBlock language="bash">python3 -m venv env</CodeBlock>
                </TabItem>
              </Tabs>
              <p>Activate the environment:</p>
              <Tabs queryString groupId="os">
                <TabItem value="win" label="Windows">
                  <CodeBlock language="bash">env\Scripts\activate</CodeBlock>
                </TabItem>
                <TabItem value="mac" label="macOS">
                  <CodeBlock language="bash">source env/bin/activate</CodeBlock>
                </TabItem>
              </Tabs>
              <p>Then install the Temporal SDK:</p>
              <CodeBlock language="bash">python -m pip install temporalio</CodeBlock>
              <p>
                You'll use the{" "}
                <a
                  href="https://docs.pytest.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  pytest
                </a>{" "}
                framework to create and run your tests. To install pytest, use
                the following command:
              </p>
              <CodeBlock language="bash">python -m pip install pytest</CodeBlock>
              <p>
                You'll also need the <code>pytest_asyncio</code> package.
                Install that with the following command:
              </p>
              <CodeBlock language="bash">python -m pip install pytest_asyncio</CodeBlock>
              <p>
                With your project workspace configured, you're ready to create
                your first Temporal Workflow and Activity. In this tutorial,
                you'll start with the Workflow.
              </p>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Create a Workflow</h2>
              <p>
                Workflows are where you configure and organize the execution of
                Activities. You write a Workflow using one of the programming
                languages supported by a Temporal SDK. This code is known as a{" "}
                <em>Workflow Definition</em>.
              </p>
              <p>
                In the Temporal Python SDK, you define{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definitions
                </a>{" "}
                by creating a class and annotate it with the{" "}
                <code>@workflow.defn</code> decorator.
              </p>
              <p>
                You then use the <code>@workflow.run</code> decorator to specify
                the method that the Workflow should invoke. Exactly one method
                must have this decorator and it must be added to an{" "}
                <code>async def</code> method.
              </p>
              <p>
                Create the file <code>workflows.py</code> in the root of your
                project and add the following code to create a{" "}
                <code>SayHello</code> class to define the Workflow:
              </p>
              <CodeBlock language="py" title="workflows.py">
                {WORKFLOW_PY}
              </CodeBlock>
              <p>
                In this example, the <code>run</code> method is decorated with{" "}
                <code>@workflow.run</code>, so it's the method that the Workflow
                will invoke.
              </p>
              <p>
                This method accepts a string value that will hold the name, and
                it returns a string. You can learn more in the{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/python/foundations#workflow-parameters"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow parameters
                </a>{" "}
                section of the Temporal documentation.
              </p>

              <Admonition type="tip">
                <p>
                  You can pass multiple inputs to a Workflow, but it's a good
                  practice to send a single input. If you have several values
                  you want to send, you should define an object or a{" "}
                  <a
                    href="https://docs.python.org/3/library/dataclasses.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    data class
                  </a>{" "}
                  and pass that into the Workflow instead.
                </p>
              </Admonition>

              <p>
                The method calls the <code>workflow.execute_activity</code>{" "}
                method which executes an Activity called <code>say_hello</code>,
                which you'll define next.{" "}
                <code>workflow.execute_activity</code> needs the{" "}
                <a
                  href="https://docs.temporal.io/activities#activity-type"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity Type
                </a>
                , the input parameters for the Activity, and a{" "}
                <a
                  href="https://docs.temporal.io/activities#start-to-close-timeout"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Start-To-Close Timeout
                </a>{" "}
                or{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-schedule-to-close-timeout"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule-To-Close Timeout
                </a>
                .
              </p>
              <p>
                Finally, the <code>run</code> method returns the result of the
                Activity Execution.
              </p>

              <Admonition type="info">
                <p>
                  In the Temporal Python SDK, Workflow files are reloaded in a
                  sandbox for every run. To keep from reloading an import on
                  every run, you can mark it as <em>passthrough</em> so it
                  reuses the module from outside the sandbox. Standard library
                  modules and <code>temporalio</code> modules are passed through
                  by default. All other modules that are used in a deterministic
                  way, such as activity function references or third-party
                  modules, should be passed through this way.
                </p>
                <p>
                  This is why this example uses{" "}
                  <code>with workflow.unsafe.imports_passed_through():</code>.
                  You can learn more about this in our{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/python-sdk-sandbox"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    sandbox documentation
                  </a>
                  .
                </p>
              </Admonition>

              <p>
                With your Workflow Definition created, you're ready to create
                the <code>say_hello</code> Activity.
              </p>
            </section>

            <section className={styles.section} id="activity">
              <h2 className={styles.sectionTitle}>Create an Activity</h2>
              <p>
                In a Temporal Application, Activities are where you execute{" "}
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  non-deterministic
                </a>{" "}
                code or perform operations that may fail, such as API requests
                or database calls. Your Workflow Definitions call Activities
                and process the results. Complex Temporal Applications have
                Workflows that invoke many Activities, using the results of one
                Activity to execute another.
              </p>
              <p>
                For this tutorial, your Activity won't be complex; you'll
                define an Activity that takes a string as input and uses it to
                create a new string as output, which is then returned to the
                Workflow. This will let you see how Workflows and Activities
                work together without building something complicated.
              </p>
              <p>
                In the Temporal Python SDK, you define an Activity by
                decorating a function with <code>@activity.defn</code>.
              </p>
              <p>
                Create a new file called <code>activities.py</code> and add the
                following code to define a <code>say_hello</code> function to
                define the Activity:
              </p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITY_PY}
              </CodeBlock>
              <p>
                The logic within the <code>say_hello</code> function creates
                the string and returns the greeting.
              </p>
              <p>
                Your{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/python/foundations#develop-activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity Definition
                </a>{" "}
                can accept input parameters just like Workflow Definitions.
                Review the{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/python/foundations#activity-parameters"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity parameters
                </a>{" "}
                section of the Temporal documentation for more details, as
                there are some limitations you'll want to be aware of when
                running more complex applications.
              </p>
              <p>
                Like Workflow Definitions, if you have more than one parameter
                for an Activity, you should bundle the data into a data class
                rather than sending multiple input parameters. This will make
                future updates easier.
              </p>
              <p>
                You've completed the logic for the application; you have a
                Workflow and an Activity defined. Before moving on, you'll
                write a unit test for your Workflow.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/python/first_program_in_python/simulate-failures/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Run your first Temporal Python app
                </span>
              </Link>
              <Link
                to="/getting_started/python/hello_world_in_python/worker-and-test/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
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
