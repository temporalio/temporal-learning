// Tutorial chapter 2 of 3: Set up a Temporal Application project with the Python SDK.

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
  { n: 1, label: "Introduction", href: "/tutorials/python/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/python/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/python/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "install-cli", label: "Install the Temporal CLI" },
  { id: "choose-dev-cluster", label: "Choose a development Cluster" },
  { id: "boilerplate-project", label: "Boilerplate project code" },
  { id: "start-workflow", label: "Start the Workflow" },
  { id: "test-framework", label: "Add a testing framework" },
];

const WORKFLOW_PY = `from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities.ssntraceactivity_dacx import ssn_trace_activity

@workflow.defn
class BackgroundCheck:
    @workflow.run
    async def run(self, ssn: str) -> str:
        return await workflow.execute_activity(
            ssn_trace_activity,
            ssn,
            schedule_to_close_timeout=timedelta(seconds=5),
        )`;

const ACTIVITY_PY = `from temporalio import activity

@activity.defn
async def ssn_trace_activity(ssn) -> str:
    return "pass"`;

const DEV_WORKER_PY = `import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities.ssntraceactivity_dacx import ssn_trace_activity
from workflows.backgroundcheck_dacx import BackgroundCheck

async def main():
    client = await Client.connect("localhost:7233", namespace="backgroundcheck_namespace")

    worker = Worker(
        client,
        namespace="backgroundcheck_namespace",
        task_queue="backgroundcheck-boilerplate-task-queue",
        workflows=[BackgroundCheck],
        activities=[ssn_trace_activity],
    )

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())`;

const CLOUD_WORKER_PY = `import asyncio
import os

from temporalio.client import Client, TLSConfig
from temporalio.worker import Worker

from activities.ssntraceactivity_dacx import ssn_trace_activity
from workflows.backgroundcheck_dacx import BackgroundCheck

async def main():
    with open(os.getenv("TEMPORAL_MTLS_TLS_CERT"), "rb") as f:
        client_cert = f.read()

    with open(os.getenv("TEMPORAL_MTLS_TLS_KEY"), "rb") as f:
        client_key = f.read()

    client = await Client.connect(
        os.getenv("TEMPORAL_HOST_URL"),
        namespace=os.getenv("TEMPORAL_NAMESPACE"),
        tls=TLSConfig(
            client_cert=client_cert,
            client_private_key=client_key,
        ),
    )

    worker = Worker(
        client,
        task_queue="backgroundcheck-boilerplate-task-queue",
        workflows=[BackgroundCheck],
        activities=[ssn_trace_activity],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())`;

const SELF_HOSTED_WORKER_PY = `import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities.ssntraceactivity_dacx import ssn_trace_activity
from workflows.backgroundcheck_dacx import BackgroundCheck

async def main():
    client = await Client.connect(
        "172.18.0.4:7233"  # The IP address of the Temporal Server on your network.
    )

    worker = Worker(
        client,
        task_queue="backgroundcheck-boilerplate-task-queue",
        workflows=[BackgroundCheck],
        activities=[ssn_trace_activity],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())`;

const DOCKERFILE = `FROM python:3.11

RUN mkdir /app

COPY . /app

COPY pyproject.toml /app

WORKDIR /app

RUN pip3 install poetry

RUN poetry config virtualenvs.create false

RUN poetry install

CMD [ "poetry", "run", "python", "/app/run_worker.py" ]`;

const DOCKER_COMPOSE_SNIPPET = `services:
  # ...
  temporal:
    container_name: temporal
    # ...
    networks:
      - temporal-network
    ports:
      - 7233:7233
    # ...
  # ...`;

const DOCKER_INSPECT_OUTPUT = `[
  {
    "Name": "temporal-network",
    // ...
    "Containers": {
      // ...
      "53cf62f0cc6cfd2a9627a2b5a4c9f48ffe5a858f0ef7b2eaa51bf7ea8fd0e86f": {
        "Name": "temporal",
        // ...
        "IPv4Address": "172.18.0.4/16"
        // ...
      }
      // ...
    }
    // ...
  }
]`;

const MONOREPO_LAYOUT = `/monorepo
    /shared_activities
        | payment.py
        | send_email.py
    /background_check
        /workflows
            | background_check_workflow.py
        /activities
            | ssn_trace_activity.py
        /worker
            | main.py
    /loan_application
        /workflows
            | loan_application_workflow.py
        /activities
            | credit_check_activity.py
        /worker
            | main.py
    /tests
       | pytest.ini
       | workflow_tests.py
       | activity_tests.py`;

const PROJECT_LAYOUT = `/backgroundcheck
    /workflows
        | background_check_workflow.py
    /activities
        | ssn_trace_activity.py
    /worker
        | main.py
    /tests
       | pytest.ini
       | workflow_tests.py
       | activity_tests.py`;

const VENV_SETUP = `mkdir background_check
cd background_check
python -m venv venv
source venv/bin/activate  # On Windows, use \`venv\\Scripts\\activate\`
pip install temporalio`;

const WORKFLOW_TEST_PY = `import uuid

import pytest

from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from activities.ssntraceactivity_dacx import ssn_trace_activity
from workflows.backgroundcheck_dacx import BackgroundCheck

@pytest.mark.asyncio
async def test_execute_workflow():
    task_queue_name = str(uuid.uuid4())
    async with await WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[BackgroundCheck],
            activities=[ssn_trace_activity],
        ):
            assert "pass" == await env.client.execute_workflow(
                BackgroundCheck.run,
                "555-55-5555",
                id=str(uuid.uuid4()),
                task_queue=task_queue_name,
            )`;

const ACTIVITY_TEST_PY = `import pytest
from temporalio.testing import ActivityEnvironment
from activities.ssntraceactivity_dacx import ssn_trace_activity

@pytest.mark.asyncio
async def test_ssn_trace_activity() -> str:
    activity_environment = ActivityEnvironment()
    expected_output = "pass"
    assert expected_output == await activity_environment.run(
        ssn_trace_activity, "55-55-555"
    )`;

const CLI_START_LOCAL = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue \\
 --type BackgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace`;

const CLI_LIST_LOCAL = `temporal workflow list \\
 --namespace backgroundcheck_namespace`;

const CLI_START_CLOUD = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-cloud \\
 --type BackgroundCheck \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key \\
 --input '"555-55-5555"' \\
 --namespace <namespace>.<account-id> \\
 --address <namespace>.<account-id>.tmprl.cloud:<port>`;

const CLI_ENV_VARS = `# set Cloud env variables
temporal env set cloud.namespace <namespace>.<account-id>
temporal env set cloud.address <namespace>.<account-id>.tmprl.cloud:<port>
temporal env set cloud.tls-cert-path ca.pem
temporal env set cloud.tls-key-path ca.key
# set local env variables
temporal env set local.namespace <namespace>`;

const CLI_ENV_USE = `temporal workflow start \\
 # ...
 --env cloud \\
 # ...`;

const CLI_LIST_CLOUD = `temporal workflow list \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key \\
 --namespace <namespace>.<account-id> \\
 --address <namespace>.<account-id>.tmprl.cloud:<port>`;

const CLI_START_SELF_HOSTED = `temporal_docker workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-self-hosted \\
 --type BackgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace`;

const CLI_LIST_SELF_HOSTED = `temporal_docker workflow list \\
 --namespace backgroundcheck_namespace`;

const DOCKER_COMPOSE_SHELL = `git clone https://github.com/temporalio/docker-compose.git
cd  docker-compose
docker compose up`;

const IMG_BASE = "/img/tutorials/python/background-check";

export default function Chapter2ProjectSetup() {
  return (
    <Layout
      title="Project setup - Temporal Python SDK Background Check tutorial"
      description="Chapter 2: Install the CLI, choose a Cluster, build a boilerplate Workflow and Worker, and add a testing framework."
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
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Python", href: "/tutorials/python" },
                  {
                    label: "Background Check",
                    href: "/tutorials/python/background-check/",
                  },
                  { label: "Project setup" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a Temporal Application project
            </h1>

            <MetaChips items={["~40 minutes", "Intermediate", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              This chapter covers how to use a terminal, a code editor, and a
              development Cluster to create a Namespace, write a single
              Activity Workflow, run a Worker that talks to your development
              Cluster, run a Workflow using the Temporal CLI, add a testing
              framework, and view Workflows in the Web UI.
            </p>

            <Admonition type="note" title="Construct a new Temporal Application project">
              <p>
                This section of the Temporal Python SDK Background Check
                tutorial covers the minimum set of concepts and implementation
                details needed to build and run a Temporal Application using
                Python.
              </p>
              <p>
                By the end of this section you will know how to construct a new
                Temporal Application project.
              </p>
            </Admonition>

            <Admonition type="info" title="Choose your development environment">
              <p>There are three ways to follow this guide:</p>
              <ul>
                <li>
                  <a href="#choose-dev-cluster">Use a local dev server</a>
                </li>
                <li>
                  <a href="#choose-dev-cluster">Use Temporal Cloud</a>
                </li>
                <li>
                  <a href="#choose-dev-cluster">
                    Use a self-hosted environment such as Docker
                  </a>
                </li>
              </ul>
              <p>
                Read more in the <a href="#choose-dev-cluster">Choose a development Cluster</a>{" "}
                section on this page.
              </p>
            </Admonition>

            <section className={styles.section} id="install-cli">
              <h2 className={styles.sectionTitle}>Install the Temporal CLI</h2>
              <p>
                The Temporal CLI is available on macOS, Windows, and Linux.
                Reference{" "}
                <a
                  href="https://docs.temporal.io/cli"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the documentation
                </a>{" "}
                for detailed install information.
              </p>

              <h3>Install via download</h3>
              <ol>
                <li>
                  Download the version for your OS and architecture:
                  <ul>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=linux&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Linux amd64
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=linux&arch=arm64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Linux arm64
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=darwin&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        macOS amd64
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=darwin&arch=arm64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        macOS arm64
                      </a>{" "}
                      (Apple silicon)
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=windows&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Windows amd64
                      </a>
                    </li>
                  </ul>
                </li>
                <li>Extract the downloaded archive.</li>
                <li>
                  Add the <code>temporal</code> binary to your <code>PATH</code>{" "}
                  (<code>temporal.exe</code> for Windows).
                </li>
              </ol>

              <h3>Install via Homebrew</h3>
              <CodeBlock language="bash">brew install temporal</CodeBlock>

              <h3>Build</h3>
              <ol>
                <li>
                  Install{" "}
                  <a href="https://go.dev/" target="_blank" rel="noopener noreferrer">
                    Go
                  </a>
                </li>
                <li>Clone the repository</li>
                <li>
                  Switch to the cloned directory and run{" "}
                  <code>go build ./cmd/temporal</code>
                </li>
              </ol>

              <Admonition type="note">
                <ul>
                  <li>
                    The executable will be at <code>temporal</code> (
                    <code>temporal.exe</code> for Windows). Reference{" "}
                    <a
                      href="https://docs.temporal.io/cli"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      the documentation
                    </a>{" "}
                    for detailed usage information.
                  </li>
                </ul>
              </Admonition>
            </section>

            <section className={styles.section} id="choose-dev-cluster">
              <h2 className={styles.sectionTitle}>
                Choose a development Cluster
              </h2>
              <p>
                <strong>Which development Cluster should you choose?</strong>
              </p>
              <p>
                We recommend choosing a development environment based on your
                requirements. The source code for the Temporal Server (the
                orchestrating component of the Temporal Cluster) is licensed
                under the MIT open source license, so in theory anyone can take
                the Temporal Server code and run their Temporal Platform in any
                number of creative ways.
              </p>
              <p>
                However, for most developers we recommend starting by choosing
                one of the following:
              </p>
              <ul>
                <li>Local development server</li>
                <li>Temporal Cloud</li>
                <li>Self-hosted Temporal Cluster</li>
              </ul>

              <Admonition type="info" title="Temporal does not directly run your code">
                <p>
                  Keep in mind that in every scenario, the Temporal Platform
                  does not host and run your Workers (application code). It is
                  up to you, the developer, to host your application code. The
                  Temporal Platform ensures that properly written code durably
                  executes in the face of platform-level failures.
                </p>
              </Admonition>

              <h3>Local dev server</h3>
              <p>
                <strong>When to use a local development server?</strong>
              </p>
              <p>
                We recommend using the local development server if you are new
                to Temporal, or want to start something from scratch and don't
                have a self-hosted environment ready or want to pay for a
                Temporal Cloud account.
              </p>
              <p>
                The Temporal CLI comes bundled with a development server and
                provides a fast way to start running Temporal Applications.
              </p>
              <p>
                However, the local development server does not emit any metrics.
                If you are eager to set up Cluster-level metrics for performance
                tuning, we recommend using a self-hosted Cluster or Temporal
                Cloud.
              </p>

              <h4>Start the dev server</h4>
              <p>
                If you have successfully installed the Temporal CLI, open a new
                terminal and run the following command:
              </p>
              <CodeBlock language="bash">
                temporal server start-dev --db-filename temporal.db
              </CodeBlock>
              <p>
                This command automatically starts the Temporal Web UI, creates
                a default Namespace, and creates a persistence database.
              </p>
              <p>
                The Temporal Web UI serves to{" "}
                <a
                  href="http://localhost:8233/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233
                </a>
                .
              </p>
              <p>
                For more command details and options, see the{" "}
                <a
                  href="https://docs.temporal.io/cli/server#start-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CLI reference
                </a>
                .
              </p>

              <h4>Create a custom Namespace</h4>
              <p>
                The development server automatically creates a default
                Namespace (named "default") when it starts up. However, you
                will create a custom one for our application. Since this is
                something recommended at a production level, it's recommended
                to practice it with the development server.
              </p>
              <p>
                Use the <code>temporal operator namespace create</code> command
                using the Temporal CLI to create a Namespace on the development
                server.
              </p>
              <CodeBlock language="bash">
                temporal operator namespace create backgroundcheck_namespace
              </CodeBlock>

              <h3>Temporal Cloud</h3>
              <p>
                If you do not have a Temporal Cloud account, you can request
                one using the link on the{" "}
                <a
                  href="https://docs.temporal.io/cloud/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Started with Temporal Cloud
                </a>{" "}
                guide.
              </p>
              <p>
                We recommend starting off with Temporal Cloud if you already
                have a production use case, or need to move a scalable proof
                of concept into production. Temporal Cloud is perfect if you
                are ready to run at scale and don't want the overhead of
                managing your own self-hosted Cluster.
              </p>
              <p>
                To create a Namespace in Temporal Cloud, follow the
                instructions in{" "}
                <a
                  href="https://docs.temporal.io/cloud/namespaces#create-a-namespace"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to create a Namespace
                </a>
                .
              </p>

              <Admonition type="info" title="Safely store your certificate and private key">
                <p>
                  Store certificates and private keys generated for your
                  Namespace as files or environment variables in your project.
                  You need access to your certificate and key to run your
                  Workers and start Workflows.
                </p>
                <p>
                  For more information on certificate requirements, see{" "}
                  <a
                    href="https://docs.temporal.io/cloud/certificates"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How to manage certificates in Temporal Cloud
                  </a>
                  .
                </p>
              </Admonition>

              <h3>Self-hosted Temporal Cluster</h3>
              <p>
                We recommend using a self-hosted environment if you are
                starting something new and need to scale with production-level
                features, but don't yet need or want to pay for Temporal Cloud.
              </p>
              <p>
                For example, running a self-hosted Cluster lets you try
                different databases, view Cluster metrics, use custom{" "}
                <a
                  href="https://docs.temporal.io/visibility#search-attribute"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Search Attributes
                </a>
                , and even play with the{" "}
                <a
                  href="https://docs.temporal.io/clusters#archival"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Archival
                </a>{" "}
                feature.
              </p>
              <p>
                For the purposes of this guide, we show how to use a
                self-hosted environment that runs completely out of Docker. To
                follow along with self-hosted parts of this guide, install the
                following:
              </p>
              <ul>
                <li>
                  <a
                    href="https://docs.docker.com/engine/install"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docker
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.docker.com/compose/install"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docker Compose
                  </a>
                </li>
              </ul>
              <p>
                Then, clone the{" "}
                <a
                  href="https://github.com/temporalio/docker-compose.git"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/docker-compose
                </a>{" "}
                repository, change directory into the root of the project, and
                run <code>docker compose up</code>:
              </p>
              <CodeBlock language="shell">{DOCKER_COMPOSE_SHELL}</CodeBlock>
              <p>Create a command alias for the Temporal CLI:</p>
              <CodeBlock language="shell">
                {`alias temporal_docker="docker exec temporal-admin-tools temporal"`}
              </CodeBlock>
              <p>Create a Namespace.</p>
              <CodeBlock language="shell">
                temporal_docker operator namespace create backgroundcheck_namespace
              </CodeBlock>
            </section>

            <section className={styles.section} id="boilerplate-project">
              <h2 className={styles.sectionTitle}>
                Boilerplate Temporal Application project code
              </h2>
              <p>
                Let's start with a single Activity Workflow and register those
                functions with a Worker. After we get the Worker running and
                have started a Workflow Execution, we will add a testing
                framework.
              </p>

              <h3>Project structure</h3>
              <p>
                You can organize Temporal Application code to suit various
                needs in a way that aligns with the idiomatic style of the
                language you are working in. The best practice is to group
                Workflows together, Activities together, and separate your
                Worker process into a standalone file. Often this happens
                respectively per use case, business process, or domain.
              </p>
              <p>For monorepo-style organization, your project might look like:</p>
              <CodeBlock language="text">{MONOREPO_LAYOUT}</CodeBlock>
              <p>If you are following along with this guide, your project will look like this:</p>
              <CodeBlock language="text">{PROJECT_LAYOUT}</CodeBlock>

              <h3>Initialize Python project dependency framework</h3>
              <p>
                In Python, you'd typically use <code>pip</code> and{" "}
                <code>virtualenv</code> or <code>venv</code> for dependency
                management and environment isolation. For more information, see{" "}
                <a
                  href="https://packaging.python.org/en/latest/tutorials/installing-packages/#creating-virtual-environments"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Creating Virtual Environments
                </a>
                .
              </p>
              <p>
                Set up a virtual environment for the project and initialize it
                using <code>pip</code>.
              </p>
              <CodeBlock language="bash">{VENV_SETUP}</CodeBlock>
              <p>
                After activation, any Python command you run will use the
                virtual environment's isolated Python interpreter and
                libraries. Remember to always activate the virtual environment
                when working on this project.
              </p>

              <h3>Boilerplate Workflow code</h3>
              <p>
                In the Temporal Python SDK programming model, a Workflow
                Definition is defined as a class. The <code>BackgroundCheck</code>{" "}
                class below is an example of a basic Workflow Definition.
              </p>
              <CodeBlock language="py" title="backgroundcheck_boilerplate/workflows/backgroundcheck.py">
                {WORKFLOW_PY}
              </CodeBlock>
              <p>
                Use the <code>@workflow.defn</code> decorator on the{" "}
                <code>BackgroundCheck</code> class to identify a Workflow.
              </p>
              <p>
                Use the <code>@workflow.run</code> to mark the entry point
                method to be invoked. This must be set on one asynchronous
                method defined on the same class as <code>@workflow.defn</code>.
              </p>
              <p>Run methods have positional parameters.</p>
              <p>
                In this example, pass in the Activity name,{" "}
                <code>ssn_trace_activity</code> and an argument, <code>ssn</code>.
                We get into the best practices around Workflow params and
                returns in one of the next sections.
              </p>

              <h3>Boilerplate Activity code</h3>
              <p>
                In the Temporal Python SDK programming model, an Activity is a
                function and can be used as an instance method of a class. You
                can use asynchronous, synchronous multithreaded, and
                synchronous multiprocess/other functions to define an Activity.
              </p>
              <CodeBlock language="py" title="backgroundcheck_boilerplate/activities/ssntraceactivity.py">
                {ACTIVITY_PY}
              </CodeBlock>
              <p>
                The <code>ssn_trace_activity</code> function passes a string
                and returns <code>pass</code>.
              </p>
              <p>
                An Activity Definition can support as many other custom
                parameters as needed; however, all parameters must be
                serializable.
              </p>
              <p>The default data converter supports converting multiple types including:</p>
              <ul>
                <li><code>None</code></li>
                <li><code>bytes</code></li>
                <li>
                  <code>google.protobuf.message.Message</code> - As JSON when
                  encoding, but has ability to decode binary proto from other
                  languages
                </li>
                <li>
                  Anything that can be converted to JSON including:
                  <ul>
                    <li>
                      Anything that{" "}
                      <a
                        href="https://docs.python.org/3/library/json.html#json.dump"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        json.dump
                      </a>{" "}
                      supports natively
                    </li>
                    <li>
                      <a
                        href="https://docs.python.org/3/library/dataclasses.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        dataclasses
                      </a>
                    </li>
                    <li>
                      Iterables including ones JSON dump may not support by
                      default, e.g. <code>set</code>
                    </li>
                    <li>
                      Any class with a <code>dict()</code> method and a static{" "}
                      <code>parse_obj()</code> method, e.g.{" "}
                      <a
                        href="https://pydantic-docs.helpmanual.io/usage/models"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pydantic models
                      </a>{" "}
                      (the default data converter is deprecated for Pydantic
                      models)
                    </li>
                    <li>
                      <a
                        href="https://docs.python.org/3/library/enum.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        IntEnum, StrEnum
                      </a>{" "}
                      based enumerates
                    </li>
                    <li>
                      <a
                        href="https://docs.python.org/3/library/uuid.html"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        UUID
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
              <p>
                This notably doesn't include any <code>date</code>,{" "}
                <code>time</code>, or <code>datetime</code> objects as they may
                not work across SDKs.
              </p>
              <p>
                Users are strongly encouraged to use a single{" "}
                <code>dataclass</code> for parameter and return types so fields
                with defaults can be easily added without breaking
                compatibility.
              </p>

              <h3>Run a dev server Worker</h3>
              <p>
                To run a Worker Process with a local development server,
                define the following steps in code:
              </p>
              <ul>
                <li>Initialize a Temporal Client.</li>
                <li>Create a new Worker by passing the Client to creation call.</li>
                <li>Register the application's Workflow and Activity functions.</li>
                <li>Call run on the Worker.</li>
              </ul>
              <p>
                We recommend keeping Worker code separate from Workflow and
                Activity code.
              </p>
              <CodeBlock language="py" title="backgroundcheck_boilerplate/dev_server_worker/main.py">
                {DEV_WORKER_PY}
              </CodeBlock>

              <h3>Run a Temporal Cloud Worker</h3>
              <p>
                A Temporal Cloud Worker requires that you specify the
                following in the Client connection options:
              </p>
              <ul>
                <li>Temporal Cloud Namespace</li>
                <li>Temporal Cloud Address</li>
                <li>Certificate and private key associated with the Namespace</li>
              </ul>
              <CodeBlock language="py" title="backgroundcheck_boilerplate/cloud_worker/main.py">
                {CLOUD_WORKER_PY}
              </CodeBlock>
              <p>
                To run a Temporal Cloud Worker, you'll change some parameters
                in your Client connection code, such as updating the namespace
                and gRPC endpoint. You'll use:
              </p>
              <ul>
                <li>
                  The{" "}
                  <a
                    href="https://docs.temporal.io/cloud/namespaces#temporal-cloud-namespace-id"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal Cloud Namespace Id
                  </a>
                  .
                </li>
                <li>
                  The{" "}
                  <a
                    href="https://docs.temporal.io/cloud/namespaces#temporal-cloud-grpc-endpoint"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Namespace's gRPC endpoint
                  </a>
                  . The endpoint uses this format{" "}
                  <code>(namespace.unique_id.tmprl.cloud:port)</code>.
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/cloud/saml#integrate-saml-with-your-temporal-cloud-account"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Paths to the SSL certificate (.pem) and private key (.key)
                  </a>{" "}
                  registered to your Namespace and stored on your Worker's
                  file system.
                </li>
              </ul>

              <h3>Run a self-hosted Worker</h3>
              <p>
                To deploy a self-hosted Worker to your Docker environment, you
                need to configure your Worker with the appropriate IP address
                and port.
              </p>

              <h4>Confirm network</h4>
              <p>
                The default <code>docker-compose.yml</code> file in the{" "}
                <code>temporalio/docker-compose</code> repo has the Temporal
                Server exposed on port 7233 on the <code>temporal-network</code>:
              </p>
              <CodeBlock language="yml">{DOCKER_COMPOSE_SNIPPET}</CodeBlock>
              <p>
                If you are using a different or customized docker compose file,
                you can see the available networks by using the following
                command:
              </p>
              <CodeBlock language="shell">docker network ls</CodeBlock>

              <h4>Confirm IP address</h4>
              <p>
                Get the IP address of the Docker network that the containers
                are using. To do that, first inspect the network:
              </p>
              <CodeBlock language="shell">
                docker network inspect temporal-network
              </CodeBlock>
              <p>
                Look for the container named <code>temporal</code>. Example
                output:
              </p>
              <CodeBlock language="json">{DOCKER_INSPECT_OUTPUT}</CodeBlock>
              <p>Copy the IP address part.</p>

              <h4>Customize Client options</h4>
              <p>Set IP address, port, and Namespace in the Temporal Client options.</p>
              <CodeBlock language="py" title="backgroundcheck_boilerplate/self_hosted_worker/main.py">
                {SELF_HOSTED_WORKER_PY}
              </CodeBlock>

              <h4>Build and deploy Docker image</h4>
              <Admonition type="note">
                <p>
                  This Dockerfile is used to containerize the Background Check
                  application so that it can run seamlessly in any environment
                  that supports Docker.
                </p>
              </Admonition>
              <p>
                Add a Docker file to the root of your Background Check
                application project. Name the file <code>Dockerfile</code>,
                with no extensions, and add the following configuration:
              </p>
              <CodeBlock language="dockerfile" title="Dockerfile">
                {DOCKERFILE}
              </CodeBlock>
              <p>Then build the Docker image using the following command:</p>
              <CodeBlock language="shell">
                docker build . -t backgroundcheck-worker-image:latest
              </CodeBlock>
              <p>
                Now run the Worker on the same network as the Temporal Cluster
                containers using the following command:
              </p>
              <CodeBlock language="shell">
                docker run --network temporal-network backgroundcheck-worker-image:latest
              </CodeBlock>
            </section>

            <section className={styles.section} id="start-workflow">
              <h2 className={styles.sectionTitle}>
                Start Workflow using the Temporal CLI
              </h2>
              <p>
                You can use the Temporal CLI to start a Workflow whether you
                are using a local development server, Temporal Cloud, or are
                in a self-hosted environment. However, you need to provide
                additional options to the command when operating with
                Temporal Cloud or self-hosted environments.
              </p>

              <h3>Local dev Server</h3>
              <p>
                Use the Temporal CLI <code>temporal workflow start</code>{" "}
                command to start your Workflow.
              </p>
              <CodeBlock language="shell">{CLI_START_LOCAL}</CodeBlock>
              <p>
                For more details, see the{" "}
                <a
                  href="https://docs.temporal.io/cli/workflow#start"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporal workflow start
                </a>{" "}
                command API reference.
              </p>
              <p>
                After you start the Workflow, you can see it in the Temporal
                Platform. Use the Temporal CLI or the Temporal Web UI to
                monitor the Workflow's progress.
              </p>

              <h4>List Workflows</h4>
              <p>
                Use the <code>temporal workflow list</code> command to list
                all of the Workflows in the Namespace:
              </p>
              <CodeBlock language="shell">{CLI_LIST_LOCAL}</CodeBlock>

              <h4>View in Web UI</h4>
              <p>
                You can also use the Web UI to see the Workflows associated
                with the Namespace. The local development server starts the
                Web UI at{" "}
                <a
                  href="http://localhost:8233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233
                </a>
                .
              </p>
              <p>
                When you visit for the first time, the Web UI directs you to{" "}
                <a
                  href="http://localhost:8233/namespaces/default/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233/namespaces/default/workflows
                </a>
                .
              </p>
              <p>Use the Namespace dropdown to select the project Namespace you created earlier.</p>
              <p>
                <img
                  src={`${IMG_BASE}/web-ui-namespace-selection.png`}
                  alt="Web UI Namespace selection"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                You should now be at{" "}
                <a
                  href="http://localhost:8233/namespaces/backgroundcheck_namespace/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233/namespaces/backgroundcheck_namespace/workflows
                </a>
                .
              </p>

              <h3>Temporal Cloud</h3>
              <p>
                Run the <code>temporal workflow start</code> command, and make
                sure to specify the certificate and private key arguments.
              </p>
              <CodeBlock language="shell">{CLI_START_CLOUD}</CodeBlock>
              <p>
                Make sure that the certificate path, private key path,
                Namespace, and address argument values match your project.
              </p>

              <Admonition type="info" title="Use environment variables">
                <p>
                  Use environment variables as a way to quickly switch between
                  a local dev server and Temporal Cloud, for example. You can
                  customize the environment names to be anything you want.
                </p>
                <CodeBlock language="shell">{CLI_ENV_VARS}</CodeBlock>
                <p>
                  In this way, you can just provide a single <code>--env</code>{" "}
                  command option when using the Temporal CLI rather than
                  specifying each connection option in every command.
                </p>
                <CodeBlock language="shell">{CLI_ENV_USE}</CodeBlock>
              </Admonition>

              <h4>List Workflows</h4>
              <p>
                Run the <code>temporal workflow list</code> command, and make
                sure to specify the certificate and private key arguments.
              </p>
              <CodeBlock language="shell">{CLI_LIST_CLOUD}</CodeBlock>

              <h4>View in Web UI</h4>
              <p>
                Visit the Workflows page of your Cloud Namespace. The URL will
                look something like the following:
              </p>
              <CodeBlock language="text">
                {`https://cloud.temporal.io/namespaces/<namespace>.<account-id>/workflows`}
              </CodeBlock>
              <p>
                <img
                  src={`${IMG_BASE}/cloud-view-workflows.png`}
                  alt="View Workflows in the Cloud UI"
                  className={styles.diagramImage}
                />
              </p>

              <h3>Self-hosted</h3>
              <p>
                Use your Temporal CLI alias to run the{" "}
                <code>temporal workflow start</code> command and start your
                Workflow.
              </p>
              <CodeBlock language="shell">{CLI_START_SELF_HOSTED}</CodeBlock>

              <h4>List Workflows</h4>
              <p>
                Using your Temporal CLI alias, run the{" "}
                <code>temporal workflow list</code> command. This command lists
                the Workflow Executions within the Namespace:
              </p>
              <CodeBlock language="shell">{CLI_LIST_SELF_HOSTED}</CodeBlock>

              <h4>View in the Web UI</h4>
              <p>
                When you visit for the first time, the Web UI directs you to{" "}
                <a
                  href="http://localhost:8080/namespaces/default/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8080/namespaces/default/workflows
                </a>
                .
              </p>
              <p>Use the Namespace dropdown to select the project Namespace you created earlier.</p>
              <p>
                You should now be at{" "}
                <a
                  href="http://localhost:8080/namespaces/backgroundcheck_namespace/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8080/namespaces/backgroundcheck_namespace/workflows
                </a>
                .
              </p>
            </section>

            <section className={styles.section} id="test-framework">
              <h2 className={styles.sectionTitle}>Add a testing framework</h2>
              <p>
                Each Temporal SDK has a testing suite that can be used in
                conjunction with a typical language-specific testing framework.
                In the Temporal Python SDK, the{" "}
                <a
                  href="https://python.temporal.io/temporalio.testing.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  testing package
                </a>{" "}
                provides a test environment in which the Workflow and Activity
                code may be run for test purposes.
              </p>
              <p>
                The <code>BackgroundCheck</code> Workflow code checks the
                following conditions:
              </p>
              <ol>
                <li>It receives a social security number and a unique ID as input parameters.</li>
                <li>
                  It starts a new Activity <code>ssn_trace_activity</code> with
                  the input SSN.
                </li>
                <li>It waits for the Activity to complete and returns the result.</li>
                <li>
                  If the Activity returns "pass", it logs a message indicating
                  that the background check passed.
                </li>
                <li>
                  If the Activity returns "fail", it raises an exception
                  indicating that the background check failed.
                </li>
              </ol>
              <p>
                We can also perform a Workflow Replay test, and we'll provide
                detailed coverage of this topic in the next chapter.
              </p>

              <h3>Add Workflow function tests</h3>
              <p>
                This is a unit test written in Python using the pytest library.
                The test checks the <code>execute_workflow</code> method of the{" "}
                <code>BackgroundCheck</code> Workflow.
              </p>
              <p>
                The test creates a new <code>WorkflowEnvironment</code> and a{" "}
                <code>Worker</code> with a Task Queue and the{" "}
                <code>BackgroundCheck</code> Workflow and{" "}
                <code>ssn_trace_activity</code> activity. Then, it executes the{" "}
                <code>BackgroundCheck.run</code> method with a social security
                number and a unique ID, and asserts that the result is equal
                to "pass". The test is marked with{" "}
                <code>@pytest.mark.asyncio</code> to indicate that it is an
                asynchronous test.
              </p>
              <CodeBlock language="py" title="backgroundcheck_boilerplate/tests/workflow_test.py">
                {WORKFLOW_TEST_PY}
              </CodeBlock>

              <h3>Add Activity function tests</h3>
              <p>
                This is Python using the{" "}
                <a
                  href="https://pytest.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  pytest
                </a>{" "}
                framework and the{" "}
                <a
                  href="https://python.temporal.io/temporalio.testing.ActivityEnvironment.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ActivityEnvironment
                </a>{" "}
                class from the Temporal Python SDK. It tests the{" "}
                <code>ssn_trace_activity</code> function from the activities
                module. The function takes a social security number as input
                and returns a string indicating whether the SSN is valid or
                not. The test checks if the function returns "pass" when given
                the SSN "55-55-555".
              </p>
              <CodeBlock language="py" title="backgroundcheck_boilerplate/tests/activity_test.py">
                {ACTIVITY_TEST_PY}
              </CodeBlock>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/python/background-check/introduction/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Introduction</span>
              </Link>
              <Link
                to="/tutorials/python/background-check/durable-execution/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Develop for durability
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
