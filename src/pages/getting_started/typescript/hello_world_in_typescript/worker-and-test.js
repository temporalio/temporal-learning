// Hello World tutorial chapter 2 of 3: Configure a Worker and write tests.
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
    href: "/getting_started/typescript/hello_world_in_typescript/",
  },
  {
    n: 2,
    label: "Test and run a Worker",
    href: "/getting_started/typescript/hello_world_in_typescript/worker-and-test/",
  },
  {
    n: 3,
    label: "Run and observe retries",
    href: "/getting_started/typescript/hello_world_in_typescript/run/",
  },
];

const TOC_ITEMS = [
  { id: "shared", label: "Define the Task Queue name" },
  { id: "worker", label: "Configure and run a Worker" },
  { id: "workflow-test", label: "Write a Workflow test" },
  { id: "activity-tests", label: "Write Activity tests" },
];

const SHARED_TS = `export const TASK_QUEUE_NAME="ip-address-ts";`;

const WORKER_TS = `import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { TASK_QUEUE_NAME } from './shared';

async function run() {
  // Step 1: Establish a connection with Temporal server.
  //
  // Worker code uses \`@temporalio/worker.NativeConnection\`.
  // (But in your application code it's \`@temporalio/client.Connection\`.)
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
    // TLS and gRPC metadata configuration goes here.
  });
  try {
    // Step 2: Register Workflows and Activities with the Worker.
    const worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: TASK_QUEUE_NAME,
      // Workflows are registered using a path as they run in a separate JS context.
      workflowsPath: require.resolve('./workflows'),
      activities,
    });

    // Step 3: Start accepting tasks on the Task Queue specified in TASK_QUEUE_NAME
    //
    // The worker runs until it encounters an unexpected error or the process receives a shutdown signal registered on
    // the SDK Runtime object.
    //
    // By default, worker logs are written via the Runtime logger to STDERR at INFO level.
    //
    // See https://typescript.temporal.io/api/classes/worker.Runtime#install to customize these defaults.
    await worker.run();
  } finally {
    // Close the connection once the worker has stopped
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const WORKER_OUTPUT = `> empty@0.1.0 start.watch
> nodemon src/worker.ts

[nodemon] 2.0.22
[nodemon] to restart at any time, enter \`rs\`
[nodemon] watching path(s): src/**/*
[nodemon] watching extensions: ts
[nodemon] starting \`ts-node src/worker.ts\`
2024-12-09T18:27:38.879Z [INFO] Creating worker {
  sdkComponent: 'worker',
  taskQueue: 'ip-address-ts',
  options: {
   ...
  }
}
...

2024-12-09T18:27:39.412Z [INFO] Workflow bundle created { sdkComponent: 'worker', taskQueue: 'ip-address-ts', size: '0.82MB' }
2024-12-09T18:27:39.493Z [INFO] Worker state changed {
  sdkComponent: 'worker',
  taskQueue: 'ip-address-ts',
  state: 'RUNNING'
}`;

const WORKFLOW_TEST_SETUP_TS = `import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { getAddressFromIP } from '../workflows';
import assert from 'assert';`;

const WORKFLOW_TEST_TS = `describe('getAddressFromIP', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the Workflow with mocked Activities', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        getIP: async (): Promise<string> => '1.1.1.1',
        getLocationInfo: async (_ip: string): Promise<string> => "Planet Earth"
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(getAddressFromIP, {
        args: ['Temporal'],
        workflowId: 'test',
        taskQueue,
      })
    );
    assert.equal(result, "Hello, Temporal. Your IP is 1.1.1.1 and your location is Planet Earth");
  });
});`;

const WORKFLOW_TEST_OUTPUT = `    ✓ successfully completes the Workflow with mocked Activities (543ms)

  1 passing (723ms)`;

const ACTIVITY_TEST_SETUP_TS = `import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../activities';
import assert from 'assert';
import sinon from 'sinon';`;

const ACTIVITY_TEST_IP_TS = `describe('ip activity', async () => {
  it('successfully gets the ip', async () => {
    const fakeIP = '123.45.67.89';
    const stub = sinon.stub(global, 'fetch').resolves({
      text: () => Promise.resolve(\`\${fakeIP}\\n\`),
    } as Response);

    try {
      const env = new MockActivityEnvironment();
      const ip = await env.run(activities.getIP);
      assert.strictEqual(ip, fakeIP);
    } finally {
      stub.restore();
    }
  });
});`;

const ACTIVITY_TEST_LOCATION_TS = `describe('getLocation activity', async () => {
  it('successfully gets the location', async () => {
    const ip = '123.45.67.89';
    const fakeLocation = {
      city: 'Sample City',
      regionName: 'Sample Region',
      country: 'Sample Country'
    };

    const stub = sinon.stub(global, 'fetch').resolves({
      json: () => Promise.resolve(fakeLocation),
    } as Response);

    try {
      const env = new MockActivityEnvironment();
      const location = await env.run(activities.getLocationInfo, ip);
      assert.strictEqual(location, \`\${fakeLocation.city}, \${fakeLocation.regionName}, \${fakeLocation.country}\`);
    } finally {
      stub.restore();
    }
  });
});`;

const MOCHA_CMD = `npx  mocha \\
  --require ts-node/register \\
  --require source-map-support/register \\
  src/mocha/*.test.ts`;

export default function Chapter2Page() {
  return (
    <Layout
      title="Test and run a Worker - Build a Temporal app from scratch in TypeScript"
      description="Chapter 2: Configure a Worker, write a Workflow test, and add Activity tests."
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
                  { label: "Get Started", href: "/start" },
                  { label: "TypeScript", href: "/getting_started/typescript" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/typescript/hello_world_in_typescript/",
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
              Now that the Workflow and Activities are in place, you'll
              configure a Worker to host them and write tests to verify they
              behave as expected. The Worker polls a Task Queue and runs your
              code when work arrives.
            </p>

            <section className={styles.section} id="shared">
              <h2 className={styles.sectionTitle}>Define the Task Queue name</h2>
              <p>
                When you start a Temporal Workflow, the Workflow and its
                Activities get scheduled on the Temporal Service's{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-task-queue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queue
                </a>
                . A{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-worker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker
                </a>{" "}
                hosts Workflow and Activity functions and polls the Task Queue
                for tasks related to those Workflows and Activities. After the
                Worker runs the code, it communicates the results back to the
                Temporal Service where they're stored in the Event History.
                This records the Workflow's entire execution, enabling
                features like fault tolerance by allowing the Workflow to
                replay in case of Worker crashes or restarts.
              </p>
              <p>
                You use the Temporal SDK to define a Worker Program. In your
                Worker Program, you need to specify the name of the Task
                Queue, which must match the Task Queue name used whenever you
                interact with a Workflow from a client application. The Task
                Queue name is a case-insensitive string - define it as a
                constant so you can reuse it.
              </p>
              <p>
                Open the file <code>src/shared.ts</code> and add the following
                line to define the constant for the Task Queue:
              </p>
              <CodeBlock language="ts" title="src/shared.ts">
                {SHARED_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Configure and run a Worker</h2>
              <p>
                When you created the project, the project generator created a
                Worker program for you.
              </p>
              <p>
                Open the file <code>src/worker.ts</code> in your editor and
                you'll see the following code:
              </p>
              <CodeBlock language="ts" title="src/worker.ts">
                {WORKER_TS}
              </CodeBlock>
              <p>
                The code imports the <code>TASK_QUEUE_NAME</code> constant
                along with all the Activities in the{" "}
                <code>src/activities.ts</code> file. It then defines an async
                function named <code>run</code> that creates and runs a Worker
                that talks to the Temporal Service. The Worker takes a
                configuration object that specifies a connection to the
                Temporal Service, <code>workflowsPath</code> (the location of
                your Workflow file), your Activity functions, and the name of
                the Task Queue.
              </p>
              <p>
                In this case your Worker will run your Workflow and your two
                Activities, but there are cases where you could configure one
                Worker to run Activities, and another Worker to run the
                Workflows.
              </p>
              <p>
                Now you will use an <code>npm</code> script to start your
                Worker with{" "}
                <a
                  href="https://nodemon.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nodemon
                </a>
                . Nodemon automatically reloads whenever it detects changes in
                your file, hence the command name <code>start.watch</code>. Be
                sure you have started the local Temporal Service and execute
                the following command to start your Worker:
              </p>
              <CodeBlock language="bash">npm run start.watch</CodeBlock>
              <p>The Worker runs and you see the following output:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>
              <p>
                In the output, you see the Worker options and their values,
                the Webpack bundling output, and the state of the Worker.
              </p>
              <p>
                Your Worker is running and is polling the Temporal Service for
                Workflows to run, but before you start your Workflow, you'll
                write tests to prove it works as expected.
              </p>
            </section>

            <section className={styles.section} id="workflow-test">
              <h2 className={styles.sectionTitle}>Write a Workflow test</h2>
              <p>
                The Temporal TypeScript SDK includes functions that help you
                test your Workflow executions. Let's add a basic unit test to
                the application to make sure the Workflow works as expected.
              </p>
              <p>
                You'll use the{" "}
                <a
                  href="https://mochajs.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mocha
                </a>{" "}
                package to build your test cases and mock the Activity so you
                can test the Workflow in isolation. You'll also use the{" "}
                <code>@temporalio/testing</code> package, which will download a
                test server that provides a <code>TestWorkflowEnvironment</code>.
              </p>
              <p>
                Create the file{" "}
                <code>src/mocha/workflows-mocks.test.ts</code> and add the
                following code to set up the testing environment:
              </p>
              <CodeBlock language="ts" title="src/mocha/workflows-mocks.test.ts">
                {WORKFLOW_TEST_SETUP_TS}
              </CodeBlock>
              <p>
                <code>TestWorkflowEnvironment</code> is a runtime environment
                used to test a Workflow. You use it to connect the Client and
                Worker to the test server and interact with the test server.
                You'll use this to register your Workflow Type and access
                information about the Workflow Execution, such as whether it
                completed successfully and the result or error it returned.
                Since the <code>TestWorkflowEnvironment</code> will be shared
                across tests, you will set it up before all of your tests, and
                tear it down after your tests finish.
              </p>
              <p>
                Add the following code to configure the testing environment
                and test the Workflow execution:
              </p>
              <CodeBlock language="ts" title="src/mocha/workflows-mocks.test.ts">
                {WORKFLOW_TEST_TS}
              </CodeBlock>
              <p>
                This test sets up a test environment to run Workflows that
                uses a lightweight Temporal Service specifically for testing.
                In the test itself, you create a Worker that connects to the
                test environment. This should look familiar, as it's similar
                to the code you wrote to define your Worker Program.
              </p>
              <p>
                Instead of using your actual Activities, you replace the
                Activities <code>getIP</code> and <code>getLocationInfo</code>{" "}
                with async functions that return hard-coded values. This way
                you're testing the Workflow's logic independently of the
                Activities. If you wanted to test the Activities directly as
                part of an integration test, you'd specify them directly as
                you did when you wrote the Worker program.
              </p>
              <p>
                Running the tests requires using the <code>mocha</code> command
                along with requiring the following libraries and pointing the
                test runner to the appropriate folder. Here's what the command
                would look like to run the tests:
              </p>
              <CodeBlock language="bash">{MOCHA_CMD}</CodeBlock>
              <p>
                However, since this is a lot to type into the command line
                every time, you'll find a <code>test</code> script defined in{" "}
                <code>package.json</code> that runs this command for you.
              </p>
              <p>
                Ensure you've saved all your files and execute your tests with
                the following command:
              </p>
              <CodeBlock language="bash">npm test</CodeBlock>
              <p>
                The test environment starts, spins up a Worker, and executes
                the Workflow in the test environment. At the end, you'll see
                that your test passes:
              </p>
              <CodeBlock>{WORKFLOW_TEST_OUTPUT}</CodeBlock>

              <Admonition type="tip">
                <p>
                  If you get an error that your test has timed out, run it
                  again. The first time you run the tests on your local
                  machine, the test server might not start quickly enough.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="activity-tests">
              <h2 className={styles.sectionTitle}>Write Activity tests</h2>
              <p>
                With a Workflow test in place, you can write unit tests for
                the Activities.
              </p>
              <p>
                Both of your Activities make external calls to services that
                will change their results based on who runs them. It will be
                challenging to test these Activities reliably. For example,
                the IP address may vary based on your machine's location.
              </p>
              <p>
                To ensure you can test the Activities in isolation, you'll
                stub out the <code>fetch</code> calls using the{" "}
                <a
                  href="https://sinonjs.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sinon
                </a>{" "}
                library. Sinon.js is a JavaScript testing library that provides
                powerful tools like spies, stubs, and mocks, allowing you to
                replace dependencies with controlled, testable behavior.
              </p>
              <p>
                Add <code>sinon</code> as a development dependency, along with
                its type definitions:
              </p>
              <CodeBlock language="bash">
                npm i sinon @types/sinon --save-dev
              </CodeBlock>
              <p>
                Create the file <code>src/mocha/activities.test.ts</code> and
                add the following code to import the testing libraries you'll
                use:
              </p>
              <CodeBlock language="ts" title="src/mocha/activities.test.ts">
                {ACTIVITY_TEST_SETUP_TS}
              </CodeBlock>
              <p>
                The <code>MockActivityEnvironment</code> from the{" "}
                <code>@temporalio/testing</code> package lets you test
                Activities as if they were part of a Temporal Application.
              </p>
              <p>
                Next, write the test for the <code>getIP</code> Activity, using{" "}
                <code>sinon</code> to stub out actual HTTP calls so your tests
                are consistent. Notice that the stubbed response adds the
                newline character so it replicates the actual response:
              </p>
              <CodeBlock language="ts" title="src/mocha/activities.test.ts">
                {ACTIVITY_TEST_IP_TS}
              </CodeBlock>
              <p>
                To test the Activity itself, you use the{" "}
                <code>MockActivityEnvironment</code> to execute the Activity
                rather than directly calling the <code>getIP</code> function.
              </p>
              <p>
                The <code>try/finally</code> block ensures that if the test
                fails, the tests restore the <code>fetch</code> stub to its
                original functionality. This way other tests you write can
                also stub <code>fetch</code> with a different response.
              </p>
              <p>
                To test the <code>getLocationInfo</code> Activity, you use a
                similar approach. Add the following code to the{" "}
                <code>src/mocha/activities.test.ts</code> file:
              </p>
              <CodeBlock language="ts" title="src/mocha/activities.test.ts">
                {ACTIVITY_TEST_LOCATION_TS}
              </CodeBlock>
              <p>
                This test looks similar to the previous one; you stub out the{" "}
                <code>fetch</code> method and ensure it returns the expected
                data, and then you execute the Activity in the{" "}
                <code>MockActivityEnvironment</code>. Then you restore the
                stubbed <code>fetch</code> method.
              </p>
              <p>Run the tests again to see them pass:</p>
              <CodeBlock language="bash">npm test</CodeBlock>
              <p>
                Now that you have your tests passing, it's time to start a
                Workflow Execution and observe how Temporal handles failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/typescript/hello_world_in_typescript/"
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
                to="/getting_started/typescript/hello_world_in_typescript/run/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Run and observe retries
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
