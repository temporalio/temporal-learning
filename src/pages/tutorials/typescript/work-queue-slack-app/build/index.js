// Tutorial chapter 1 of 2: Build the Work Queue Slack App.

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
  { n: 1, label: "Build the app", href: "/tutorials/typescript/work-queue-slack-app/build/" },
  { n: 2, label: "Deploy to production", href: "/tutorials/typescript/work-queue-slack-app/deploy/" },
];

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "overview", label: "Overview of the application" },
  { id: "slack-config", label: "Create a Slack App" },
  { id: "ts-projects", label: "Create TypeScript projects" },
  { id: "create-work-queue-workflow", label: "Create the Workflow" },
  { id: "develop-slack-bot", label: "Develop the Slack bot" },
  { id: "test-workflow", label: "Test the Workflow (Optional)" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BASE = "/img/tutorials/typescript/work-queue-slack-app/build";

const COMMON_TYPES_TS = `export interface WorkqueueData {
  id: string;
  timestamp: string;
  channelName: string;
  channelId: string;
  userId: string;
  work: string;
  status: WorkqueueStatus;
  claimantId?: string;
  // Add more properties as needed
}

export enum WorkqueueStatus {
  Backlog = 1,
  InProgress = 2,
  Done = 3,
}`;

const WORKQUEUE_WORKFLOW_TS = `import {
  condition,
  continueAsNew,
  isCancellation,
  workflowInfo,
  // ...
} from '@temporalio/workflow';
import { WorkqueueData } from '../../../common-types/types';
// ...
export async function workqueue(existingData?: WorkqueueData[]): Promise<void> {
  const wqdata: WorkqueueData[] = existingData ?? [];
  // ...
  try {
    // Await until suggestion to Continue-As-New due to History size
    // If a Cancellation request exists, the condition call will throw the Cancellation error
    await condition(() => workflowInfo().continueAsNewSuggested);
  } catch (e) {
    // Catch a Cancellation error
    if (isCancellation(e)) {
      // Set the Workflow status to Cancelled by throwing the CancelledFailure error
      throw e;
    } else {
      // Handle other types of errors
      throw e;
    }
  }
  await continueAsNew<typeof workqueue>(wqdata);
}`;

const SIGNALS_QUERIES_TS = `import {
  // ...
  defineQuery,
  defineSignal,
  setHandler,
} from '@temporalio/workflow';
// ...
export const getWorkqueueDataQuery = defineQuery<WorkqueueData[]>(
  'getWorkqueueData',
);
export const addWorkToQueueSignal = defineSignal<[WorkqueueData]>(
  'addWorkqueueData',
);
export const claimWorkSignal = defineSignal<
  [{ workId: string; claimantId: string }]
>('claimWork');
export const completeWorkSignal = defineSignal<[{ workId: string }]>(
  'completeWork',
);

export async function workqueue(existingData?: WorkqueueData[]): Promise<void> {
  // ...
  // Register a Query handler for 'getWorkqueueData'
  setHandler(getWorkqueueDataQuery, () => {
    return wqdata;
  });

  // Register the Signal handler for adding work
  setHandler(addWorkToQueueSignal, (data: WorkqueueData) => {
    wqdata.push(data);
  });

  // Register Signal handler for claiming work
  setHandler(claimWorkSignal, ({ workId, claimantId }) => {
    const workItem = wqdata.find((item) => item.id === workId);
    if (workItem) {
      workItem.claimantId = claimantId;
      workItem.status = 2;
    }
  });

  // Register Signal handler for completing work
  setHandler(completeWorkSignal, ({ workId }) => {
    const index = wqdata.findIndex((item) => item.id === workId);
    if (index !== -1) {
      wqdata.splice(index, 1);
    }
  });
  // ...
}`;

const DEV_WORKER_TS = `import 'dotenv/config';
import { NativeConnection, Worker } from '@temporalio/worker';
import path from 'path';

async function run() {
  try {
    const worker = await Worker.create({
      namespace: process.env.TEMPORAL_DEV_NAMESPACE || '',
      workflowsPath: path.resolve(__dirname, './workflows'),
      taskQueue: \`\${process.env.ENV}-temporal-iq-task-queue\`,
    });

    await worker.run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();`;

const DEV_TEMPORAL_CLIENT_TS = `import 'dotenv/config';
import { Client, Connection } from '@temporalio/client';

export let temporalClient: Client;

export async function initializeTemporalClient() {
  const connection = await Connection.connect();

  temporalClient = new Client({
    connection,
    namespace: process.env.TEMPORAL_DEV_NAMESPACE!,
  });
}`;

const SLACK_BOT_TS = `import 'dotenv/config';
import {
  App,
  // ...
} from '@slack/bolt';
import { initializeTemporalClient } from './modules/dev-temporal-client';
// ...
// Initializes your app with your bot token, app token, and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN!,
});
// ...
// Register Slack bot error handler
app.error(async ({ error }: { error: Error }) => {
  if (error instanceof Error) {
    console.error(\`Error: \${error.name}, Message: \${error.message}\`);
  } else {
    console.error('An unknown error occurred', error);
  }
});

// Start the app
(async () => {
  try {
    await app.start();
    await initializeTemporalClient();
    console.log('⚡️ Bolt app is running!');
  } catch (error) {
    console.error('Failed to start Bolt app:', error);
  }
})();`;

const WORKQUEUE_HANDLER_TS = `// ...
import {
  RespondFn,
  SayFn,
  SlackCommandMiddlewareArgs,
  // ...
} from '@slack/bolt';
import { WorkqueueData, WorkqueueStatus } from '../../common-types/types';
import { temporalClient } from './dev-temporal-client';
// ...
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
// ...
// Handles and routes all incoming Work Queue Slash Commands
export async function handleWorkqueueCommand(
  command: SlackCommandMiddlewareArgs['command'],
  say: SayFn,
  respond: RespondFn,
) {
  const commandText = command.text?.trim();

  if (commandText === '!delete') {
    await deleteWorkqueue(command, say);
  } else if (commandText === '') {
    await displayWorkQueue(command, respond);
  } else {
    await addWorkToQueue(command, say);
  }
  return;
}`;

const DISPLAY_QUEUE_TS = `// ...
// Display the Work Queue for the channel
// Creates a new Work Queue if it does not exist
async function displayWorkQueue(
  command: SlackCommandMiddlewareArgs['command'],
  respond: RespondFn,
) {
  // Get the channel name in plain text
  const channelName = command.channel_name;
  // Create a new Work Queue for the channel
  await createNewWorkQueue(channelName);
  // If the Work Queue already exists, Query it
  const data = await queryWorkQueue(channelName, respond);
  await replyEphemeral(
    respond,
    'Work Queue cannot display',
    formatWorkqueueDataForSlack(channelName, data),
  );
}

// Create a new Work Queue for the channel if one does not exist
async function createNewWorkQueue(workflowid: string): Promise<void> {
  try {
    await temporalClient.workflow.start('workqueue', {
      taskQueue: \`\${process.env.ENV}-temporal-iq-task-queue\`,
      workflowId: workflowid,
    });
  } catch (e) {
    if (e instanceof WorkflowExecutionAlreadyStartedError) {
      console.log('Workflow already started');
    } else {
      throw e;
    }
  }
}

// Read the state of the Work Queue for the channel using a Query
async function queryWorkQueue(
  workflowId: string,
  say: SayFn,
): Promise<WorkqueueData[]> {
  try {
    const handle = temporalClient.workflow.getHandle(workflowId);
    const result = await handle.query<WorkqueueData[]>(getWorkqueueDataQuery);
    console.log('Current workqueue data:', result);
    return result;
  } catch (error) {
    console.error('Error querying workqueue data:', error);
    await say('An error occurred while Querying the Work Queue.');
    return [];
  }
}`;

const ADD_WORK_TS = `// ...
// Add work to the queue using a Signal
async function addWorkToQueue(
  command: SlackCommandMiddlewareArgs['command'],
  say: SayFn,
) {
  // Get the channel name in plain text
  const channelId = command.channel_id;
  const channelName = command.channel_name;
  const wqdata = buildWQData(command, channelId, channelName);
  await signalAddWork(wqdata, say);
  // Reply to the message directly in the thread
  await reply(say, \`Added Work \${wqdata.id} to the Queue.\`);
}
// ...
async function signalAddWork(params: WorkqueueData, say: SayFn): Promise<void> {
  try {
    await temporalClient.workflow.signalWithStart('workqueue', {
      workflowId: params.channelName,
      taskQueue: \`\${process.env.ENV}-temporal-iq-task-queue\`,
      signal: addWorkToQueueSignal,
      signalArgs: [params],
    });
  } catch (error) {
    console.error('Error signaling workqueue data:', error);
    await say('An error occurred while Signaling the Work Queue.');
  }
}`;

const CLAIM_LISTENER_TS = `// ...
// Listen for Work Item Claim
app.action<BlockAction<BlockElementAction>>(
  'wq_claim',
  async ({ ack, say, body }) => {
    await ack();
    // Ensure the body.actions[0] is a ButtonAction
    const action = body.actions[0] as ButtonAction;
    if (action.value) {
      const [channelName, workId, userId] = action.value.split('_');
      const claimantId = body.user.id;
      // Send signal to the Temporal workflow to claim the work
      await signalClaimWork(channelName, workId, claimantId, userId, say);
    } else {
      console.error('Action value is undefined.');
    }
  },
);`;

const CLAIM_FN_TS = `// ...
export async function signalClaimWork(
  channelName: string,
  workId: string,
  claimantId: string,
  userId: string,
  say: SayFn,
) {
  try {
    const handle = temporalClient.workflow.getHandle(channelName);
    await handle.signal(claimWorkSignal, { workId, claimantId });
    console.log(\`Work item \${workId} claimed by \${claimantId}\`);
    await reply(
      say,
      \`<@\${userId}> Work item \${workId} claimed by <@\${claimantId}>.\`,
    );
  } catch (error) {
    console.error('Failed to signal claim work:', error);
  }
}`;

const COMPLETE_LISTENER_TS = `// ...
// Listen for Work Item Completion
app.action<BlockAction<BlockElementAction>>(
  'wq_complete',
  async ({ ack, say, body }) => {
    await ack();
    const action = body.actions[0] as ButtonAction;
    if (action.value) {
      const [channelName, workId, userId] = action.value.split('_');
      const message = body.message as GenericMessageEvent;
      // Send signal to the Temporal workflow to complete the work
      await signalCompleteWork(channelName, workId, message, userId, say);
    } else {
      console.error('Action value is undefined.');
    }
  },
);`;

const COMPLETE_FN_TS = `// ...
export async function signalCompleteWork(
  channelId: string,
  workId: string,
  message: GenericMessageEvent,
  userId: string,
  say: SayFn,
) {
  try {
    const handle = temporalClient.workflow.getHandle(channelId);
    await handle.signal(completeWorkSignal, { workId });
    console.log(\`Work item \${workId} marked as complete\`);
    await reply(say, \`<@\${userId}> Work item \${workId} marked as complete.\`);
  } catch (error) {
    console.error('Failed to signal complete work:', error);
  }
}`;

const DELETE_WORKQUEUE_TS = `// ...
// Delete the Work Queue for the channel with a Cancellation Request
export async function deleteWorkqueue(
  command: SlackCommandMiddlewareArgs['command'],
  say: SayFn,
): Promise<void> {
  const workflowId = command.channel_name;
  try {
    const handle = temporalClient.workflow.getHandle(workflowId);
    await handle.cancel();
    console.log(\`Workflow with ID \${workflowId} has been cancelled.\`);
    await reply(say, \`Work Queue has been deleted for this channel.\`);
  } catch (error) {
    console.error(\`Failed to cancel workflow with ID \${workflowId}:\`, error);
    await reply(say, \`Failed to delete Work Queue for this channel.\`);
  }
}`;

const TEST_SUITE_TS = `import { WorkflowCoverage } from '@temporalio/nyc-test-coverage';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { DefaultLogger, Runtime, Worker } from '@temporalio/worker';
// ...
describe('Work Queue Workflow', () => {
  let testEnv: TestWorkflowEnvironment;
  const workflowCoverage = new WorkflowCoverage();

  beforeAll(async () => {
    Runtime.install({ logger: new DefaultLogger('WARN') });
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  afterAll(() => {
    workflowCoverage.mergeIntoGlobalCoverage();
  });
  // ...
});`;

const TEST_ADDWORK_TS = `// ...
test('should add work to the queue', async () => {
  // Get a test environment Temporal Client
  const { client, nativeConnection } = testEnv;
  // Create a test environment Worker
  const worker = await Worker.create(
    workflowCoverage.augmentWorkerOptions({
      connection: nativeConnection,
      taskQueue: 'test',
      workflowsPath: require.resolve('../workflows'),
    }),
  );
  // ...
  // Run the Worker
  await worker.runUntil(async () => {
    const handle = await client.workflow.start(workqueue, {
      args: [],
      workflowId: workflowId,
      taskQueue: 'test',
    });
    const workItem: WorkqueueData = {
      // ...
    };
    // Add work to the queue
    await handle.signal(addWorkToQueueSignal, workItem);
    // Check to see if the data is there
    const result = await handle.query(getWorkqueueDataQuery);
    // Compare the data
    expect(result).toContainEqual(workItem);
  });
});`;

const ENV_BOT = `SLACK_SIGNING_SECRET="<slack-signing-secret>"
SLACK_BOT_TOKEN="<slack-bot-token>"
SLACK_APP_TOKEN="<slack_app_token>"
SLACK_WORKSPACE="<slack_workspace>"
ENV="dev"`;

const PROJECT_STRUCTURE = `-- your-workqueue-slack-app
  |-- temporal-application # This is the Temporal Application project
  |   |-- .env
  |   |-- src
  |   |   |-- workflows
  |   |   |   |-- workqueue.ts
  |   |   |-- index.ts
  |   |-- package.json
  |   |-- tsconfig.json
  |-- bot # This is the Slack bot project
  |   |-- .env
  |   |-- src
  |   |   |-- index.ts
  |   |-- package.json
  |   |-- tsconfig.json
  |-- common-types # These types are shared by both projects
      |-- types.ts`;

const PACKAGE_JSON_WORKER = `{
  // ...
  "scripts": {
    "start": "ts-node src/worker.ts"
  }
  // ...
}`;

const PACKAGE_JSON_BOT = `{
  // ...
  "scripts": {
    "start": "ts-node src/slack_bot.ts"
  }
  // ...
}`;

const PACKAGE_JSON_DEVDEPS = `{
  // ...
  "devDependencies": {
    "@temporalio/client": "^1.10.1",
    "@temporalio/nyc-test-coverage": "^1.10.1",
    "@temporalio/testing": "^1.10.1",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
    // Any other packages needed for testing logic
  }
  // ...
}`;

export default function WorkQueueBuildPage() {
  return (
    <Layout
      title="Build the app - Work Queue Slack App with TypeScript"
      description="Build a Slash Command Slack App using Temporal to manage work queues without a traditional database."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  {
                    label: "Work Queue Slack App",
                    href: "/tutorials/typescript/work-queue-slack-app/",
                  },
                  { label: "Build the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Work Queue Slack App with TypeScript
            </h1>

            <MetaChips items={["~2 hours", "TypeScript", "Intermediate"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              A Slash Command Slack App lets Slack users interact with an
              application using a Slash Command (<code>/&lt;command&gt;</code>) in
              a Slack channel. When you build a Slash Command Slack App,
              you might need to persist data between interactions.
              Traditionally, you connect to a database to do this. With a
              Temporal Application, you can store that data directly within
              a function that's resilient to process crashes and can be
              horizontally scaled.
            </p>

            <p>
              In this tutorial you build a Work Queue Slash Command Slack
              App. Imagine an organization with many teams. Each team
              provides a service to the organization and has a Slack
              channel. While a common task tracking system might be in
              place, many micro-tasks don't warrant a full task entry. By
              the end of this tutorial, you will have built a Slash command
              Slack App to submit and manage general work requests in a
              Slack channel that responds to interactive block elements.
            </p>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>
                Before starting this tutorial,{" "}
                <Link to="/getting_started/typescript/dev_environment/">
                  set up a local development environment for Temporal and
                  TypeScript
                </Link>
                .
              </p>
              <p>
                Review or complete the{" "}
                <Link to="/getting_started/typescript/first_program_in_typescript/">
                  Run your first Temporal application with the TypeScript SDK
                </Link>{" "}
                tutorial.
              </p>
            </section>

            <section className={styles.section} id="overview">
              <h2 className={styles.sectionTitle}>Overview of the application</h2>
              <p>
                The system includes a Slack Workspace, a Slack App, a
                Temporal Service, and a Temporal Application. Traditionally,
                you would need a database to maintain the state of your
                Slack App between interactions. However, by using Temporal,
                you can maintain the state directly within a Temporal
                Application. The Workflow maintains state even if the
                process crashes - and can rebuild and resume on a different
                process on a different machine.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/temporal-slack-app.svg`}
                  alt="System component architecture"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                During development, you will manage your Temporal
                Application, the Slack bot, and the Temporal Service. In
                production, if you use Temporal Cloud as your Temporal
                Service, you only need to deploy the Temporal Application.
                Your Temporal Application replaces an entire database with
                less than 70 lines of code.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/temporal-slack-app-dev-vs-prod.svg`}
                  alt="Temporal development vs production"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                To use Temporal Cloud in production, see the{" "}
                <Link to="/tutorials/typescript/work-queue-slack-app/deploy/">
                  Deploy your application to DigitalOcean
                </Link>{" "}
                part of the tutorial.
              </p>
              <p>Functional requirements:</p>
              <ol>
                <li>A user can submit a work request with a Slash Command.</li>
                <li>A user can see all the work requests for the channel with a Slash Command.</li>
                <li>A user can click a button to claim a work request.</li>
                <li>A user can click a button to mark a work request as complete.</li>
                <li>A user can delete the Work Queue for the channel with a Slash Command.</li>
              </ol>
              <p>
                <img
                  src={`${IMG_BASE}/work-queue-demo.gif`}
                  alt="App functionality demo"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="slack-config">
              <h2 className={styles.sectionTitle}>
                Create a new Slack App configuration
              </h2>
              <p>
                Before you write any code, configure your application with
                Slack to get your API tokens. Go to{" "}
                <a
                  href="https://api.slack.com/apps?new_app=1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://api.slack.com/apps?new_app=1
                </a>{" "}
                and create an app "From scratch." Name the app and select a
                workspace.
              </p>
              <p>
                Enable <strong>Socket Mode</strong>. Under Settings, select{" "}
                <strong>Socket Mode</strong> and toggle ON socket mode.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/enable-sockets.png`}
                  alt="Enable Socket Mode"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Socket Mode means you don't have to set up and expose an
                HTTP server to receive events from Slack. Slack gives you
                an application token starting with <code>xapp</code> under{" "}
                <strong>App-Level Tokens</strong> in <strong>Basic Information</strong>.
              </p>
              <p>
                Next, create a Slash Command. Select{" "}
                <strong>Slash Commands</strong> in the sidebar, click{" "}
                <strong>Create New Command</strong>, and add a new command
                for <code>/workqueue</code>.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/enable-slash-command.png`}
                  alt="Create a Slash Command"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Subscribe to Events. Under <strong>Features</strong>, select{" "}
                <strong>Event Subscriptions</strong>, ensure <strong>Enable Events</strong>{" "}
                is ON, and add subscriptions for:
              </p>
              <ul>
                <li><code>message.groups</code></li>
                <li><code>message.im</code></li>
                <li><code>message.channels</code></li>
              </ul>
              <p>
                <img
                  src={`${IMG_BASE}/subscribe-to-bot-events.png`}
                  alt="Subscribe to bot events"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Set up <strong>OAuth &amp; Permissions</strong>. Enable the
                following Bot Token Scopes:
              </p>
              <ul>
                <li><code>channels:history</code></li>
                <li><code>channels:read</code></li>
                <li><code>chat:write</code></li>
                <li><code>groups:history</code></li>
                <li><code>groups:read</code></li>
                <li><code>im:history</code></li>
                <li><code>mpim:history</code></li>
              </ul>
              <p>
                Install the app in Slack via <strong>Install App</strong>
                . Record the <strong>Signing Secret</strong>, <strong>App
                Level Token</strong>, and <strong>Bot User OAuth Token</strong>{" "}
                for later use.
              </p>
            </section>

            <section className={styles.section} id="ts-projects">
              <h2 className={styles.sectionTitle}>
                Create TypeScript projects for the Slack App
              </h2>
              <p>
                You need two TypeScript projects for this Slack
                application: <code>temporal-application</code> and{" "}
                <code>bot</code>. Create a new TypeScript project for the
                bot:
              </p>
              <CodeBlock language="bash">
                {`mkdir bot
cd bot
npm init
tsc --init`}
              </CodeBlock>

              <Admonition type="note" title="Project structure">
                <p>This tutorial assumes the following structure:</p>
                <CodeBlock>{PROJECT_STRUCTURE}</CodeBlock>
              </Admonition>

              <p>
                In the <code>temporal-application</code> project, install
                dependencies:
              </p>
              <CodeBlock language="bash">
                {`npm install @temporalio/worker dotenv path
npm install --save-dev typescript ts-node @types/node`}
              </CodeBlock>
              <p>
                In the <code>bot</code> project, install dependencies:
              </p>
              <CodeBlock language="bash">
                {`npm install @slack/bolt @slack/web-api @temporalio/client crypto date-fns dotenv
npm install --save-dev typescript ts-node @types/node`}
              </CodeBlock>

              <h3 id="slack-env-variables">Slack bot environment variables</h3>
              <p>
                Grab the Slack credentials and in the project root of the
                bot application, add them to a <code>.env</code> file:
              </p>
              <CodeBlock>{ENV_BOT}</CodeBlock>
              <p>
                The <code>ENV</code> variable is prepended to the Task
                Queue name for your Temporal Application. This lets you use
                the same Temporal Namespace locally and in production
                without worrying about production Tasks getting executed
                on your local machine.
              </p>

              <h3 id="worker-env-variables">Temporal Application environment variables</h3>
              <p>
                In the <code>temporal-application</code> project, make
                sure you have a <code>.env</code> file with the{" "}
                <code>ENV</code> variable:
              </p>
              <CodeBlock>ENV="dev"</CodeBlock>

              <p>
                Define the common types used across the application. Create
                a file <code>types.ts</code> in the <code>common-types</code>{" "}
                directory:
              </p>
              <CodeBlock language="ts" title="common-types/types.ts">
                {COMMON_TYPES_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="create-work-queue-workflow">
              <h2 className={styles.sectionTitle}>Create a Work Queue Workflow</h2>
              <p>
                Before you build the Slack bot, create a Temporal Workflow
                to persist the state of the Work Queue. This Workflow will
                be long running and any given instance of it will map
                directly to a specific Slack channel. This pattern is often
                called the Entity Workflow pattern.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/sequence-vs-entity-pattern.svg`}
                  alt="Sequence vs Entity pattern Workflow"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Other very common use cases for an entity pattern Workflow:
                customers, shopping carts, orders, users.
              </p>
              <p>
                To craft the Entity Workflow pattern, use the handy{" "}
                <code>condition</code> API. The Workflow awaits on a{" "}
                <a
                  href="https://docs.temporal.io/workflows#continue-as-new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Continue-As-New
                </a>{" "}
                suggestion from the Temporal Service.
              </p>
              <CodeBlock language="ts" title="temporal-application/src/workflows/workqueue.ts">
                {WORKQUEUE_WORKFLOW_TS}
              </CodeBlock>
              <p>
                What's also handy about the <code>condition</code> API is
                that if there is a Cancellation request, the condition
                call will throw a Cancellation error.
              </p>

              <p>
                Next, define message handlers - Signals and Queries.
                Signals send data into a Workflow. Queries read the state
                of a Workflow.
              </p>
              <CodeBlock language="ts" title="temporal-application/src/workflows/workqueue.ts">
                {SIGNALS_QUERIES_TS}
              </CodeBlock>

              <p>
                Register your Workflow with a Temporal Worker. Create{" "}
                <code>worker.ts</code> inside <code>temporal-application/src</code>:
              </p>
              <CodeBlock language="ts" title="temporal-application/src/dev-worker.ts">
                {DEV_WORKER_TS}
              </CodeBlock>

              <p>
                Make sure your <code>package.json</code> in the{" "}
                <code>temporal-application</code> project has a script to
                run the Worker:
              </p>
              <CodeBlock language="json">{PACKAGE_JSON_WORKER}</CodeBlock>
              <p>Then run:</p>
              <CodeBlock language="bash">npm start</CodeBlock>
              <p>Leave the Worker running while you develop the Slack bot.</p>

              <Admonition type="note">
                <p>
                  If you make any changes to the Workflow code you will
                  need to restart the Worker.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="develop-slack-bot">
              <h2 className={styles.sectionTitle}>Develop your Slack Bot</h2>
              <p>
                Create two modules: one for the Temporal Client, and one
                that interacts with the Work Queue Workflow. The main{" "}
                <code>slack_bot.ts</code> file initializes the Slack App
                and the Temporal Client.
              </p>
              <p>
                First, create and export a Temporal Client in{" "}
                <code>bot/modules/temporal-client.ts</code>:
              </p>
              <CodeBlock language="ts" title="bot/modules/dev-temporal-client.ts">
                {DEV_TEMPORAL_CLIENT_TS}
              </CodeBlock>

              <p>
                Now, initialize the Slack App in <code>bot/slack_bot.ts</code>:
              </p>
              <CodeBlock language="ts" title="bot/slack_bot.ts">
                {SLACK_BOT_TS}
              </CodeBlock>

              <p>
                Create the <code>workqueue</code> module that interacts
                with the Work Queue Workflow at{" "}
                <code>bot/modules/workqueue.ts</code>:
              </p>
              <CodeBlock language="ts" title="bot/modules/workqueue.ts">
                {WORKQUEUE_HANDLER_TS}
              </CodeBlock>
              <p>There are three possible ways to use the Slash Command:</p>
              <ol>
                <li>
                  <code>workqueue !delete</code> - delete the Work Queue
                  via a Cancellation request to the Workflow.
                </li>
                <li>
                  <code>workqueue</code> - display the current Work Queue
                  via a Query.
                </li>
                <li>
                  <code>workqueue &lt;work&gt;</code> - add a new work
                  item via a Signal.
                </li>
              </ol>

              <p>
                Define <code>displayWorkQueue</code>, <code>createNewWorkqueue</code>,
                and <code>queryWorkqueue</code> in <code>workqueue.ts</code>:
              </p>
              <CodeBlock language="ts" title="bot/modules/workqueue.ts">
                {DISPLAY_QUEUE_TS}
              </CodeBlock>

              <p>
                Add the functionality to add work to the Work Queue:
              </p>
              <CodeBlock language="ts" title="bot/modules/workqueue.ts">
                {ADD_WORK_TS}
              </CodeBlock>
              <p>
                The key here is the Temporal Client's <code>signalWithStart</code>{" "}
                API. This starts the Workflow if it doesn't exist and then
                sends the Signal with Work Item data.
              </p>

              <p>
                Next, implement work-item claim. In <code>slack_bot.ts</code>,
                add a listener for the <code>wq_claim</code> button:
              </p>
              <CodeBlock language="ts" title="bot/slack_bot.ts">
                {CLAIM_LISTENER_TS}
              </CodeBlock>
              <p>
                Then in <code>workqueue.ts</code>, define a{" "}
                <code>claimWork</code> function:
              </p>
              <CodeBlock language="ts" title="bot/modules/workqueue.ts">
                {CLAIM_FN_TS}
              </CodeBlock>

              <p>
                Add a listener for the <code>wq_complete</code> button:
              </p>
              <CodeBlock language="ts" title="bot/slack_bot.ts">
                {COMPLETE_LISTENER_TS}
              </CodeBlock>
              <p>
                Define a <code>completeWork</code> function in{" "}
                <code>workqueue.ts</code>:
              </p>
              <CodeBlock language="ts" title="bot/modules/workqueue.ts">
                {COMPLETE_FN_TS}
              </CodeBlock>

              <p>
                Finally, add the ability to delete a Work Queue for the
                channel. Send a Cancellation Request using the Workflow ID:
              </p>
              <CodeBlock language="ts" title="bot/modules/workqueue.ts">
                {DELETE_WORKQUEUE_TS}
              </CodeBlock>
              <p>
                By using the Slack channel name as the Workflow ID, you
                can tell which Workflow corresponds to which channel in
                the Temporal UI when debugging.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/workflow-id-temporal-ui.png`}
                  alt="Workflow ID in Temporal UI"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                Run your Slack bot. Make sure your <code>package.json</code>{" "}
                in the <code>bot</code> project has a script:
              </p>
              <CodeBlock language="json">{PACKAGE_JSON_BOT}</CodeBlock>
              <p>Then run:</p>
              <CodeBlock language="bash">npm start</CodeBlock>
              <p>
                Once running, the bot listens for the <code>workqueue</code>{" "}
                Slash Command, <code>wq_claim</code>, and <code>wq_complete</code>{" "}
                button click events in your Slack workspace.
              </p>
            </section>

            <section className={styles.section} id="test-workflow">
              <h2 className={styles.sectionTitle}>
                Test the Workflow with Jest framework (Optional)
              </h2>
              <p>
                Test the Work Queue Workflow using Jest. Create{" "}
                <code>workqueue.test.ts</code> in the{" "}
                <code>temporal-application/src/__tests__</code> directory.
                Ensure you have the following devDependencies:
              </p>
              <CodeBlock language="json">{PACKAGE_JSON_DEVDEPS}</CodeBlock>
              <p>Set up the Test Suite:</p>
              <CodeBlock language="ts" title="src/__tests__/workqueue.test.ts">
                {TEST_SUITE_TS}
              </CodeBlock>
              <p>You can test for many scenarios:</p>
              <ul>
                <li>Adding work to the queue</li>
                <li>Claiming work in the queue</li>
                <li>Completing work in the queue</li>
                <li>Continuing-As-New when event count is high</li>
              </ul>
              <p>The basic pattern to test adding work looks like this:</p>
              <CodeBlock language="ts" title="src/__tests__/workqueue.test.ts">
                {TEST_ADDWORK_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You built a Slack App that uses Temporal to manage a Work
                Queue. You created a Work Queue Workflow, sent messages
                to the Workflow, and tested the Temporal Application.
              </p>
              <p>
                This Slack App is a great example of how you can use
                Temporal as a backend for your application without having
                to manage a database. The backend is scalable and you can
                observe it and debug it using the Temporal UI.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/typescript/work-queue-slack-app/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Series overview
                </span>
                <span className={styles.chapterNavTitle}>
                  Work Queue Slack App
                </span>
              </Link>
              <Link
                to="/tutorials/typescript/work-queue-slack-app/deploy/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Deploy to production
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
