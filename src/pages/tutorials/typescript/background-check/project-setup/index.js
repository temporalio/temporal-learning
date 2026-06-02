// Tutorial chapter 2 of 3: Set up a Temporal Application project.

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
  { n: 1, label: "Introduction", href: "/tutorials/typescript/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/typescript/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/typescript/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "install-cli", label: "Install the Temporal CLI" },
  { id: "choose-dev-cluster", label: "Choose a development Cluster" },
  { id: "boilerplate-project", label: "Boilerplate project code" },
  { id: "start-workflow", label: "Start a Workflow" },
  { id: "test-framework", label: "Add a testing framework" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BASE = "/img/tutorials/typescript/background-check";

const WORKFLOW_TS = `import * as workflow from '@temporalio/workflow';
import type * as activities from './activities';

const { ssnTrace } = workflow.proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

export async function backgroundCheck(ssn: string): Promise<string> {
  return await ssnTrace(ssn);
}`;

const ACTIVITY_TS = `export async function ssnTrace(param: string): Promise<string> {
  // This is where a call to another service is made
  // Here we are pretending that the service that does SSNTrace returned "pass"
  return 'pass';
}`;

const WORKER_TS = `import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // Step 1: Establish a connection with Temporal server.
  //
  // Worker code uses \`@temporalio/worker.NativeConnection\`.
  // (But in your application code it's \`@temporalio/client.Connection\`.)
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
    // TLS and gRPC metadata configuration goes here.
  });
  // Step 2: Register Workflows and Activities with the Worker and specify your
  // namespace and Task Queue.
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'background-check',
    // Workflows are registered using a path as they run in a separate JS context.
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  // Step 3: Start accepting tasks on the \`background-check\` queue
  //
  // The worker runs until it encounters an unexepected error or the process receives a shutdown signal registered on
  // the SDK Runtime object.
  //
  // By default, worker logs are written via the Runtime logger to STDERR at INFO level.
  //
  // See https://typescript.temporal.io/api/classes/worker.Runtime#install to customize these defaults.
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const CLOUD_WORKER_TS = `import fs from 'fs/promises';

import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

// Note that serverNameOverride and serverRootCACertificate are optional.
async function run({
  address,
  namespace,
  clientCertPath,
  clientKeyPath,
  serverNameOverride,
  serverRootCACertificatePath,
  taskQueue,
}: Env) {
  let serverRootCACertificate: Buffer | undefined = undefined;
  if (serverRootCACertificatePath) {
    serverRootCACertificate = await fs.readFile(serverRootCACertificatePath);
  }

  const connection = await NativeConnection.connect({
    address,
    tls: {
      serverNameOverride,
      serverRootCACertificate,
      clientCertPair: {
        crt: await fs.readFile(clientCertPath),
        key: await fs.readFile(clientKeyPath),
      },
    },
  });

  const worker = await Worker.create({
    connection,
    namespace,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue,
  });
  console.log('Worker connection successfully established');

  await worker.run();
  await connection.close();
}

run(getEnv()).catch((err) => {
  console.error(err);
  process.exit(1);
});

// Helpers for configuring the mTLS client and worker samples
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ReferenceError(\`\${name} environment variable is not defined\`);
  }
  return value;
}

export interface Env {
  address: string;
  namespace: string;
  clientCertPath: string;
  clientKeyPath: string;
  serverNameOverride?: string;
  serverRootCACertificatePath?: string;
  taskQueue: string;
}

export function getEnv(): Env {
  return {
    address: requiredEnv('TEMPORAL_ADDRESS'),
    namespace: requiredEnv('TEMPORAL_NAMESPACE'),
    clientCertPath: requiredEnv('TEMPORAL_CLIENT_CERT_PATH'),
    clientKeyPath: requiredEnv('TEMPORAL_CLIENT_KEY_PATH'),
    serverNameOverride: process.env.TEMPORAL_SERVER_NAME_OVERRIDE,
    serverRootCACertificatePath: process.env.TEMPORAL_SERVER_ROOT_CA_CERT_PATH,
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'hello-world-mtls',
  };
}`;

const SELF_HOSTED_WORKER_TS = `import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // Step 1: Establish a connection with Temporal server.
  //
  // Worker code uses \`@temporalio/worker.NativeConnection\`.
  // (But in your application code it's \`@temporalio/client.Connection\`.)
  const connection = await NativeConnection.connect({
    address: '172.18.0.4:7233',
    // TLS and gRPC metadata configuration goes here.
  });
  // Step 2: Register Workflows and Activities with the Worker and specify your
  // namespace and Task Queue.
  const worker = await Worker.create({
    connection,
    namespace: 'backgroundcheck_namespace',
    taskQueue: 'hello-world',
    // Workflows are registered using a path as they run in a separate JS context.
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const DOCKERFILE = `FROM node:20 as build

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app

RUN npm ci

COPY tsconfig.json /app/
COPY src /app/src

RUN npm run build

# Reinstall without dev dependencies now that the application is built
RUN npm ci --omit dev

FROM gcr.io/distroless/nodejs20-debian11


COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/lib /app/lib

CMD ["/app/lib/worker.js"]`;

const DOCKER_COMPOSE_YAML = `services:
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

const DOCKER_INSPECT_JSON = `[
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

const PROJECT_STRUCTURE_EXAMPLE = `monorepo/
├── backgroundcheck
│   ├── activities
│   ├── tests
│   │   ├── backgroundcheck.tests.ts
│   │   └── ssntracen.tests.ts
│   ├── worker.ts
│   └── workflows
│       └── backgroundcheck.ts
├── loanapplication
│   ├── activities
│   │   └── creditcheck.ts
│   ├── tests
│   │   ├── creditcheck.tests.ts
│   │   └── loanapplication.tests.ts
│   ├── worker.ts
│   └── workflows
│       └── loanapplication.ts
├── shared_activities
│   ├── payment.ts
│   └── send_email.ts
└── shared_tests
    └── tests.ts`;

const PROJECT_FINAL_STRUCTURE = `├── README.md
├── package-lock.json
├── package.json
├── src
│   ├── activities.ts
│   ├── client.ts
│   ├── mocha
│   │   ├── backgroundcheck.test.ts
│   │   └── ssntrace.test.ts
│   ├── worker.ts
│   └── workflows.ts
└── tsconfig.json`;

const PROJECT_INITIAL_STRUCTURE = `├── README.md
├── node_modules
├── package-lock.json
├── package.json
├── src
│   ├── activities.ts
│   ├── client.ts
│   ├── mocha
│   ├── worker.ts
│   └── workflows.ts
└── tsconfig.json`;

const CREATE_TEMPORAL_OUTPUT = `Creating a new Temporal project in /Users/brianhogan/dev/documentation-samples-typescript/backgroundcheck/

Downloading files for sample empty. This might take a moment.

Installing packages. This might take a couple of minutes.`;

const SUCCESS_OUTPUT = `Success! Created project backgroundcheck at:

~/backgroundcheck/`;

const WORKFLOW_TEST_TS = `import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import assert from 'assert';
import { before, describe, it } from 'mocha';
import { backgroundCheck } from '../workflows';

describe('Background check workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the Workflow', async () => {
    const ssn = '111-22-3333';
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'testing';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        ssnTrace: async () => 'pass',
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(backgroundCheck, {
        args: [ssn],
        workflowId: 'background-check-test',
        taskQueue,
      }),
    );
    assert.equal(result, 'pass');
  });
});`;

const ACTIVITY_TEST_TS = `import { MockActivityEnvironment } from '@temporalio/testing';
import assert from 'assert';
import { describe, it } from 'mocha';
import * as activities from '../activities';

describe('ssnTrace activity', async () => {
  it('successfully passes the ssn trace', async () => {
    const env = new MockActivityEnvironment();
    const ssn = '111-22-3333';
    const result = await env.run(activities.ssnTrace, ssn);
    assert.equal(result, 'pass');
  });
});`;

const TEMPORAL_START_LOCAL = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-local \\
 --type backgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace \\
 --workflow-id backgroundcheck_workflow`;

const TEMPORAL_START_CLOUD = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-cloud \\
 --type backgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace <namespace>.<account-id> \\
 --workflow-id backgroundcheck_workflow \\
 --address <namespace>.<account-id>.tmprl.cloud:<port> \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key`;

const TEMPORAL_START_SELFHOSTED = `temporal_docker workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-self-hosted \\
 --type backgroundCheck \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace \\
 --workflow-id backgroundcheck_workflow`;

const TEMPORAL_ENV = `# set Cloud env variables
temporal env set cloud.namespace <namespace>.<account-id>
temporal env set cloud.address <namespace>.<account-id>.tmprl.cloud:<port>
temporal env set cloud.tls-cert-path ca.pem
temporal env set cloud.tls-key-path ca.key
# set local env variables
temporal env set local.namespace <namespace>`;

const TEMPORAL_ENV_USAGE = `temporal workflow start \\
 # ...
 --env cloud \\
 # ...`;

const TEMPORAL_LIST_CLOUD = `temporal workflow list \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key \\
 --namespace <namespace>.<account-id> \\
 --address <namespace>.<account-id>.tmprl.cloud:<port>`;

export default function ProjectSetupPage() {
  return (
    <Layout
      title="Project setup - Background Check tutorial with TypeScript"
      description="Set up a new Temporal Application project in TypeScript, run a Worker, start a Workflow, and add tests."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_typescript.png"
            alt="Temporal TypeScript SDK"
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
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  {
                    label: "Background Check",
                    href: "/tutorials/typescript/background-check/",
                  },
                  { label: "Project setup" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a Temporal Application project
            </h1>

            <MetaChips items={["~40 minutes", "TypeScript", "Hands-on"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              The first step to creating a new Temporal Application is to set
              up your development environment. This chapter walks through the
              steps to do that using the TypeScript SDK.
            </p>

            <Admonition type="note" title="Construct a new Temporal Application project">
              <p>
                This chapter covers the minimum set of concepts and
                implementation details needed to build and run a Temporal
                Application using TypeScript. By the end of this section you
                will know how to construct a new Temporal Application project.
              </p>
              <p>Learning objectives:</p>
              <ul>
                <li>Describe the tools available and recommended to develop Workflows.</li>
                <li>Describe the code that actually forms a Temporal application.</li>
                <li>Implement an appropriate testing framework.</li>
              </ul>
              <p>
                Much of the information in this chapter is also covered in the{" "}
                <a
                  href="https://learn.temporal.io/courses/temporal_101/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal 101 course
                </a>
                .
              </p>
            </Admonition>

            <p>
              This chapter introduces the{" "}
              <a
                href="https://learn.temporal.io/examples/go/background-checks/#what-is-the-real-life-use-case"
                target="_blank"
                rel="noopener noreferrer"
              >
                Background Check use case
              </a>{" "}
              and a sample application to contextualize the information. There
              are three ways to follow this guide:
            </p>
            <ul>
              <li>Use a local dev server</li>
              <li>Use Temporal Cloud</li>
              <li>Use a self-hosted environment such as Docker</li>
            </ul>
            <p>In this chapter you will:</p>
            <ol>
              <li>Download the Temporal CLI.</li>
              <li>Choose your development Cluster.</li>
              <li>Create a Namespace on your development Cluster.</li>
              <li>Copy boilerplate code into your IDE.</li>
              <li>Run your Worker.</li>
              <li>Start the Workflow using the Temporal CLI.</li>
              <li>Explore the Web UI to view the status of the Workflow.</li>
              <li>Add a testing framework and unit tests to the application.</li>
              <li>Run the application unit tests.</li>
            </ol>

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
                  Add the <code>temporal</code> binary to your{" "}
                  <code>PATH</code> (<code>temporal.exe</code> for Windows).
                </li>
              </ol>

              <h3>Install via Homebrew</h3>
              <CodeBlock language="bash">brew install temporal</CodeBlock>

              <h3>Build from source</h3>
              <ol>
                <li>
                  Install{" "}
                  <a
                    href="https://go.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go
                  </a>
                </li>
                <li>Clone the repository.</li>
                <li>
                  Switch to the cloned directory and run{" "}
                  <code>go build ./cmd/temporal</code>.
                </li>
              </ol>
            </section>

            <section className={styles.section} id="choose-dev-cluster">
              <h2 className={styles.sectionTitle}>
                Choose a development Cluster
              </h2>
              <p>
                We recommend choosing a development environment based on your
                requirements. For most developers we recommend starting with
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
                Use the local development server if you are new to Temporal or
                want to start from scratch without a self-hosted environment
                or Temporal Cloud account.
              </p>
              <p>
                The Temporal CLI comes bundled with a development server. The
                local development server does not emit metrics. For
                Cluster-level metrics, use a self-hosted Cluster or Temporal
                Cloud.
              </p>
              <p>Start the dev server with:</p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                This command starts the Temporal Web UI, creates a default
                Namespace, and creates an in-memory database. The Web UI
                serves at{" "}
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
                Create a custom Namespace for the application using the
                Temporal CLI:
              </p>
              <CodeBlock language="bash">
                temporal operator namespace create backgroundcheck_namespace
              </CodeBlock>

              <h3>Temporal Cloud</h3>
              <p>
                Start with Temporal Cloud if you already have a production use
                case, or need to move a scalable proof of concept into
                production. Temporal Cloud is ideal if you are ready to run at
                scale and don't want the overhead of managing your own
                self-hosted Cluster.
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
                  Namespace as files or environment variables in your
                  project. You need access to your certificate and key to run
                  your Workers and start Workflows. For more information, see{" "}
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
                Use a self-hosted environment if you are starting something
                new and need to scale with production-level features, but
                don't yet need Temporal Cloud. To follow along, install:
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
                Then clone the{" "}
                <a
                  href="https://github.com/temporalio/docker-compose.git"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/docker-compose
                </a>{" "}
                repository, change directory into the project, and run:
              </p>
              <CodeBlock language="bash">
                {`git clone https://github.com/temporalio/docker-compose.git
cd docker-compose
docker compose up`}
              </CodeBlock>
              <p>Create a command alias for the Temporal CLI:</p>
              <CodeBlock language="bash">
                alias temporal_docker=&quot;docker exec temporal-admin-tools temporal&quot;
              </CodeBlock>
              <p>Create a Namespace:</p>
              <CodeBlock language="bash">
                temporal_docker operator namespace create backgroundcheck_namespace
              </CodeBlock>
            </section>

            <section className={styles.section} id="boilerplate-project">
              <h2 className={styles.sectionTitle}>
                Boilerplate Temporal Application project code
              </h2>
              <p>
                Start with a single Workflow and register that function with a
                Worker. After you get the Worker running and started a
                Workflow Execution, you will add a testing framework.
              </p>

              <h3>Project structure</h3>
              <p>
                Group Workflows together, Activities together, and separate
                your Worker process into a standalone file. For monorepo-style
                organizations, use a designated Workflow directory for each
                use case. Example:
              </p>
              <CodeBlock>{PROJECT_STRUCTURE_EXAMPLE}</CodeBlock>
              <p>Your project will look like this when you've finished this chapter:</p>
              <CodeBlock>{PROJECT_FINAL_STRUCTURE}</CodeBlock>

              <h3>Initialize the TypeScript project</h3>
              <p>
                The TypeScript SDK offers a project creation tool. Run:
              </p>
              <CodeBlock language="bash">
                npx @temporalio/create --sample empty backgroundcheck
              </CodeBlock>

              <Admonition type="note">
                <p>
                  The Temporal TypeScript SDK is dropping support for Node.js
                  14 and Node.js 16 due to their end-of-life status. The{" "}
                  <a
                    href="https://github.com/temporalio/sdk-typescript/releases/tag/v1.9.0"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal TypeScript SDK 1.9 version
                  </a>{" "}
                  is the last minor release supporting Node.js 14, and version
                  1.10 may be the last supporting Node.js 16.
                </p>
              </Admonition>

              <p>You'll see output like the following as the generator runs:</p>
              <CodeBlock>{CREATE_TEMPORAL_OUTPUT}</CodeBlock>
              <p>
                Initialize a Git repository when prompted. The tool then
                confirms your project is created:
              </p>
              <CodeBlock>{SUCCESS_OUTPUT}</CodeBlock>
              <p>
                Switch to the <code>backgroundcheck</code> folder:
              </p>
              <CodeBlock language="bash">cd backgroundcheck</CodeBlock>
              <p>The project generator created the following directory structure:</p>
              <CodeBlock>{PROJECT_INITIAL_STRUCTURE}</CodeBlock>
              <ul>
                <li>
                  <code>package.json</code> holds project dependencies and
                  scripts to run Workflows, tests, linting, and formatting.
                </li>
                <li>
                  <code>tsconfig.json</code> holds the TypeScript
                  configuration designed for working with Temporal's SDK.
                </li>
                <li>
                  <code>src/activities.ts</code> is where you define
                  Activities.
                </li>
                <li>
                  <code>src/client.ts</code> has the code for a small CLI
                  program to execute a Workflow.
                </li>
                <li>
                  <code>src/mocha</code> is where you'll place your tests.
                </li>
                <li>
                  <code>src/workflows.ts</code> is where you define Workflows.
                </li>
                <li>
                  <code>src/worker.ts</code> has the code to configure and run
                  your Worker process.
                </li>
              </ul>

              <h3>Boilerplate Workflow code</h3>
              <p>
                In the Temporal TypeScript SDK programming model, a{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definition
                </a>{" "}
                is an exportable function. Open <code>src/workflows.ts</code>{" "}
                and add the Workflow Definition:
              </p>
              <CodeBlock language="ts" title="src/workflows.ts">
                {WORKFLOW_TS}
              </CodeBlock>
              <p>
                Workflows may have any number of custom parameters, but we
                strongly recommend using objects as parameters so individual
                fields may be altered without changing the Workflow signature.
                All Workflow parameters must be serializable.
              </p>
              <p>
                To return a value, use <code>Promise&lt;something&gt;</code>.
                The Promise makes asynchronous calls and comes with
                guarantees.
              </p>
              <p>
                Workflow logic is constrained by{" "}
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  deterministic execution requirements
                </a>
                . In the Temporal TypeScript SDK, Workflows run in a
                deterministic sandboxed environment. The code is bundled on
                Worker creation using Webpack and can import any package that
                does not reference Node.js or DOM APIs.
              </p>

              <Admonition type="note">
                <p>
                  If you must use a library that references a Node.js or DOM
                  API and you are certain those APIs are not used at runtime,
                  add that module to the{" "}
                  <a
                    href="https://typescript.temporal.io/api/interfaces/worker.BundleOptions#ignoremodules"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ignoreModules
                  </a>{" "}
                  list.
                </p>
              </Admonition>

              <p>
                In the TypeScript SDK you can safely use non-deterministic
                methods - the sandbox replaces non-deterministic code with
                deterministic versions. However, side effects and access to
                external state must be done through Activities. Workflow code
                cannot directly import the Activity Definition, but Activity
                Types can be imported so you can invoke them in a type-safe
                way.
              </p>

              <h3>Boilerplate Activity code</h3>
              <p>
                In the Temporal TypeScript SDK programming model, an Activity
                is an exportable async function. Add the following code to{" "}
                <code>src/activities.ts</code>:
              </p>
              <CodeBlock language="ts" title="src/activities.ts">
                {ACTIVITY_TS}
              </CodeBlock>
              <p>
                This Activity Definition uses a single input parameter and
                returns a string. We recommend creating an Interface and using
                a single input parameter rather than multiple input
                parameters.
              </p>

              <h3>Run a dev server Worker</h3>
              <p>
                To run a Worker Process with a local development server:
              </p>
              <ul>
                <li>Initialize a connection with the Temporal server.</li>
                <li>Create a Worker by passing the Client to the create call.</li>
                <li>Register the Workflow and Activity functions.</li>
                <li>Call <code>run()</code> on the Worker.</li>
              </ul>
              <p>Add the following code to <code>src/worker.ts</code>:</p>
              <CodeBlock language="ts" title="src/worker.ts">
                {WORKER_TS}
              </CodeBlock>

              <Admonition type="info" title="Auto restart Worker when code changes">
                <p>
                  Use{" "}
                  <a
                    href="https://www.npmjs.com/package/nodemon"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    nodemon
                  </a>{" "}
                  to automatically restart the Worker Process whenever code
                  files in your project change. This is automatically
                  configured when you use <code>@temporalio/create</code>:
                </p>
                <CodeBlock language="bash">npm run start.watch</CodeBlock>
              </Admonition>

              <h3>Run a Temporal Cloud Worker</h3>
              <p>
                A Temporal Cloud Worker requires that you specify the
                following in the Client connection options:
              </p>
              <ul>
                <li>Temporal Cloud Namespace</li>
                <li>Temporal Cloud Address</li>
                <li>
                  Certificate and private key associated with the Namespace
                </li>
              </ul>
              <p>
                Add the following to <code>src/worker.ts</code> to communicate
                with Temporal Cloud using an mTLS connection, with
                configuration provided via environment variables:
              </p>
              <CodeBlock language="ts" title="src/worker-cloud.ts">
                {CLOUD_WORKER_TS}
              </CodeBlock>
              <p>
                You'll use the{" "}
                <a
                  href="https://docs.temporal.io/cloud/namespaces#temporal-cloud-namespace-id"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Cloud Namespace Id
                </a>
                , the{" "}
                <a
                  href="https://docs.temporal.io/cloud/namespaces#temporal-cloud-grpc-endpoint"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Namespace's gRPC endpoint
                </a>
                , and paths to the SSL certificate (.pem) and private key
                (.key).
              </p>

              <h3>Run a self-hosted Worker</h3>

              <h4>Confirm network</h4>
              <p>
                The default <code>docker-compose.yml</code> in the{" "}
                <code>temporalio/docker-compose</code> repo has the Temporal
                Server exposed on port 7233 on the <code>temporal-network</code>:
              </p>
              <CodeBlock language="yaml">{DOCKER_COMPOSE_YAML}</CodeBlock>
              <p>To list available networks:</p>
              <CodeBlock language="bash">docker network ls</CodeBlock>

              <h4>Confirm IP address</h4>
              <p>Inspect the network:</p>
              <CodeBlock language="bash">docker network inspect temporal-network</CodeBlock>
              <p>
                Look for the container named <code>temporal</code>. Example
                output:
              </p>
              <CodeBlock language="json">{DOCKER_INSPECT_JSON}</CodeBlock>
              <p>Copy the IP address.</p>

              <h4>Customize Client options</h4>
              <p>
                Set the IP address, port, and Namespace in the Client options
                in <code>src/worker.ts</code>:
              </p>
              <CodeBlock language="ts" title="src/worker-self-hosted.ts">
                {SELF_HOSTED_WORKER_TS}
              </CodeBlock>

              <h4>Build and deploy Docker image</h4>
              <p>
                Add a Dockerfile to the root of your project. Name the file{" "}
                <code>dockerfile</code> with no extension:
              </p>
              <CodeBlock language="dockerfile" title="dockerfile">
                {DOCKERFILE}
              </CodeBlock>
              <p>Build the Docker image:</p>
              <CodeBlock language="bash">
                docker build . -t backgroundcheck-worker-image:latest
              </CodeBlock>
              <p>Run the Worker on the same network as the Temporal Cluster:</p>
              <CodeBlock language="bash">
                docker run --network temporal-network backgroundcheck-worker-image:latest
              </CodeBlock>
            </section>

            <section className={styles.section} id="start-workflow">
              <h2 className={styles.sectionTitle}>
                Start a Workflow using the Temporal CLI
              </h2>
              <p>
                You can use the Temporal CLI to start a Workflow whether you
                are using a local development server, Temporal Cloud, or a
                self-hosted environment. You'll provide additional options
                when operating with Temporal Cloud or self-hosted
                environments.
              </p>

              <h3>Local dev server</h3>
              <p>
                Use the Temporal CLI <code>temporal workflow start</code>{" "}
                command to start your Workflow:
              </p>
              <CodeBlock language="bash">{TEMPORAL_START_LOCAL}</CodeBlock>
              <p>Parameters:</p>
              <ul>
                <li>
                  <code>--task-queue</code>: The name of the Task Queue for
                  the Workflow Execution's Tasks.
                </li>
                <li>
                  <code>--type</code>: The Workflow Type name (by default,
                  the function name).
                </li>
                <li>
                  <code>--input</code>: A valid JSON object that can be
                  unmarshaled into the parameter(s) the Workflow function
                  accepts.
                </li>
                <li>
                  <code>--namespace</code>: The Namespace to run your
                  Application in.
                </li>
                <li>
                  <code>--workflow-id</code>: A custom identifier you
                  provide.
                </li>
              </ul>

              <h4>List Workflows</h4>
              <CodeBlock language="bash">
                {`temporal workflow list \\
 --namespace backgroundcheck_namespace`}
              </CodeBlock>

              <h4>View in Web UI</h4>
              <p>
                The local development server starts the Web UI at{" "}
                <a
                  href="http://localhost:8233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233
                </a>
                . Use the Namespace dropdown to select the project Namespace:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/web-ui-namespace-selection.png`}
                  alt="Web UI Namespace selection"
                  className={styles.diagramImage}
                />
              </p>

              <h4>Confirm polling Worker</h4>
              <p>
                Visit the Workflow Execution's details page and click on the
                Task Queue name to see polling Workers:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/click-task-queue-name.png`}
                  alt="Click on the Task Queue name to view polling Workers"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/confirm-workers-polling-task-queue.png`}
                  alt="Confirm Workers polling Task Queue"
                  className={styles.diagramImage}
                />
              </p>

              <h3>Temporal Cloud</h3>
              <p>
                Run the <code>temporal workflow start</code> command and
                specify the certificate and private key arguments:
              </p>
              <CodeBlock language="bash">{TEMPORAL_START_CLOUD}</CodeBlock>

              <Admonition type="info" title="Use environment variables">
                <p>
                  Use{" "}
                  <a
                    href="https://docs.temporal.io/cli#environment-variables"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    environment variables
                  </a>{" "}
                  to quickly switch between a local dev server and Temporal
                  Cloud.
                </p>
                <CodeBlock language="bash">{TEMPORAL_ENV}</CodeBlock>
                <p>
                  Then provide a single <code>--env</code> command option:
                </p>
                <CodeBlock language="bash">{TEMPORAL_ENV_USAGE}</CodeBlock>
              </Admonition>

              <h4>List Workflows</h4>
              <CodeBlock language="bash">{TEMPORAL_LIST_CLOUD}</CodeBlock>

              <h4>View in Web UI</h4>
              <p>
                Visit the Workflows page of your Cloud Namespace - the URL
                looks like:
              </p>
              <CodeBlock>
                https://cloud.temporal.io/namespaces/&lt;namespace&gt;.&lt;account-id&gt;/workflows
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
                <code>temporal workflow start</code> command:
              </p>
              <CodeBlock language="bash">{TEMPORAL_START_SELFHOSTED}</CodeBlock>
              <h4>List Workflows</h4>
              <CodeBlock language="bash">
                {`temporal_docker workflow list \\
 --namespace backgroundcheck_namespace`}
              </CodeBlock>
            </section>

            <section className={styles.section} id="test-framework">
              <h2 className={styles.sectionTitle}>Add a testing framework</h2>
              <p>
                Each Temporal SDK has a testing suite that can be used in
                conjunction with a language-specific testing framework. In
                the TypeScript SDK, use the{" "}
                <a
                  href="https://mochajs.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mocha
                </a>{" "}
                library and the <code>@temporalio/testing</code> package.
              </p>

              <h3>Add Workflow function tests</h3>
              <p>You can test Workflow code for the following conditions:</p>
              <ul>
                <li>Workflow status - did the Workflow reach a completed status?</li>
                <li>Error when checking for a result of a Workflow.</li>
                <li>Workflow return value - is it what you expected?</li>
              </ul>
              <p>
                Add the following code to{" "}
                <code>src/mocha/backgroundcheck.test.ts</code>:
              </p>
              <CodeBlock language="ts" title="src/mocha/backgroundcheck.test.ts">
                {WORKFLOW_TEST_TS}
              </CodeBlock>
              <p>
                This test uses a local testing server shipped with the SDK.
                In the test body, you create a Worker, register the Workflow
                and Activities, and mock out the Activity to return a
                specific result. <code>client.workflow.execute(...)</code>{" "}
                executes the Workflow logic and any invoked Activities inside
                the test process.
              </p>

              <h3>Add Activity function tests</h3>
              <p>You can test Activity code for the following conditions:</p>
              <ul>
                <li>Error when invoking the Activity Execution.</li>
                <li>Error when checking for the result of the Activity Execution.</li>
                <li>Activity return values.</li>
              </ul>
              <p>
                Add the following code to{" "}
                <code>src/mocha/ssntrace.test.ts</code>:
              </p>
              <CodeBlock language="ts" title="src/mocha/ssntrace.test.ts">
                {ACTIVITY_TEST_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You created a project with TypeScript, created your first
                Workflow and Activity definitions, configured a Worker, and
                wrote tests. You can now:
              </p>
              <ul>
                <li>Describe the tools available and recommended to develop Workflows.</li>
                <li>Describe the code that actually forms a Temporal application.</li>
                <li>Implement an appropriate testing framework.</li>
              </ul>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/typescript/background-check/introduction/"
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
                to="/tutorials/typescript/background-check/durable-execution/"
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
