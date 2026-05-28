// Single-page tutorial: Build a recurring billing subscription system with TypeScript.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create your project" },
  { id: "define-customer", label: "Define your customer" },
  { id: "define-activities", label: "Define external interactions" },
  { id: "define-workflow", label: "Define your application logic" },
  { id: "run-workflow", label: "Run the subscription Workflow" },
  { id: "retrieve-details", label: "Retrieve subscription details" },
  { id: "cancel-update", label: "Cancel subscription and update charge" },
  { id: "wait-input", label: "Wait for user input" },
  { id: "cancel-ongoing", label: "Cancel an ongoing subscription" },
  { id: "update-charge", label: "Update the charge amount" },
  { id: "retrieve-billing", label: "Retrieve billing period and total" },
  { id: "conclusion", label: "Conclusion" },
];

const TSCONFIG_JSON = `{
  "extends": "@tsconfig/node20/tsconfig.json",
  "version": "4.9.5",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "./src",
    "outDir": "./lib"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}`;

const DEPENDENCIES_JSON = `"dependencies": {
  "@temporalio/activity": "^1.10.0",
  "@temporalio/client": "^1.10.0",
  "@temporalio/worker": "^1.10.0",
  "@temporalio/workflow": "^1.10.0",
}`;

const SCRIPTS_JSON = `"scripts": {
  "start": "ts-node src/worker.ts",
  "start.watch": "nodemon src/worker.ts",
  "workflow": "ts-node src/scripts/execute-workflow.ts",
  "querybillinginfo": "ts-node src/scripts/query-billinginfo.ts",
  "cancelsubscription": "ts-node src/scripts/cancel-subscription.ts",
  "updatechargeamount": "ts-node src/scripts/update-chargeamt.ts"
}`;

const SHARED_TS = `export const TASK_QUEUE_NAME = "subscriptions-task-queue";

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  subscription: {
    trialPeriod: number;
    billingPeriod: number;
    maxBillingPeriods: number;
    initialBillingPeriodCharge: number;
  };
  id: string;
}`;

const ACTIVITIES_WELCOME_TS = `import { log } from "@temporalio/activity";

import { Customer } from "./shared";

export async function sendWelcomeEmail(customer: Customer) {
  log.info(\`Sending welcome email to \${customer.email}\`);
}`;

const ACTIVITIES_REST_TS = `// ...
export async function sendCancellationEmailDuringTrialPeriod(
  customer: Customer
) {
  log.info(\`Sending trial cancellation email to \${customer.email}\`);
}
export async function chargeCustomerForBillingPeriod(
  customer: Customer,
  chargeAmount: number
) {
  log.info(
    \`Charging \${customer.email} amount \${chargeAmount} for their billing period\`
  );
}
export async function sendSubscriptionFinishedEmail(
  customer: Customer
) {
  log.info(\`Sending subscription completed email to \${customer.email}\`);
}
export async function sendSubscriptionOverEmail(customer: Customer) {
  log.info(\`Sending subscription over email to \${customer.email}\`);
}`;

const WORKFLOW_IMPORTS_TS = `import {
  proxyActivities,
  log,
  workflowInfo,
  sleep,
} from "@temporalio/workflow";
import type * as activities from "./activities";
import { Customer } from "./shared";

const {
  sendWelcomeEmail,
  sendSubscriptionFinishedEmail,
  chargeCustomerForBillingPeriod,
  sendCancellationEmailDuringTrialPeriod,
  sendSubscriptionOverEmail,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 seconds",
});`;

const WORKFLOW_DEF_TS = `export async function subscriptionWorkflow(
  customer: Customer
): Promise<string> {
  let subscriptionCancelled = false;
  let totalCharged = 0;
  let billingPeriodNumber = 1;
  let billingPeriodChargeAmount =
    customer.subscription.initialBillingPeriodCharge;

  // Send welcome email to customer
  await sendWelcomeEmail(customer);

  // Check if the subscription was cancelled during the trial period
  if (subscriptionCancelled) {
    await sendCancellationEmailDuringTrialPeriod(customer);
    return \`Subscription finished for: \${customer.id}\`;
  } else {
    // Trial period is over, start billing until we reach the max billing periods or subscription is cancelled
    while (true) {
      if (billingPeriodNumber > customer.subscription.maxBillingPeriods) break;

      if (subscriptionCancelled) {
        await sendSubscriptionFinishedEmail(customer);
        return \`Subscription finished for: \${customer.id}, Total Charged: \${totalCharged}\`;
      }

      log.info(\`Charging \${customer.id} amount \${billingPeriodChargeAmount}\`);

      await chargeCustomerForBillingPeriod(customer, billingPeriodChargeAmount);
      totalCharged += billingPeriodChargeAmount;
      billingPeriodNumber++;

      // Wait for the next billing period or until the subscription is cancelled
      await sleep(customer.subscription.billingPeriod);
    }

    // If the subscription period is over and not cancelled, notify the customer to buy a new subscription
    await sendSubscriptionOverEmail(customer);
    return \`Completed \${
      workflowInfo().workflowId
    }, Total Charged: \${totalCharged}\`;
  }
}`;

const WORKER_TS = `import { TASK_QUEUE_NAME } from "./shared";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";

async function run() {
  const connection = await NativeConnection.connect({
    address: "localhost:7233",
  });

  // Step 1: Register Workflows and Activities with the Worker and connect to
  // the Temporal server.
  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve("./workflows"),
    activities,
    taskQueue: TASK_QUEUE_NAME,
  });

  // Step 2: Start accepting tasks on the \`subscriptions-task-queue\` queue
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const EXECUTE_IMPORTS_TS = `import { Connection, Client } from "@temporalio/client";
import { subscriptionWorkflow } from "../workflows";
import { Customer, TASK_QUEUE_NAME } from "../shared";`;

const EXECUTE_CUSTOMER_TS = `const cust = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "email-1@customer.com",
  subscription: {
    trialPeriod: 3, // 3 seconds
    billingPeriod: 3, // 3 seconds
    maxBillingPeriods: 3,
    initialBillingPeriodCharge: 120,
  },
  id: "Id-1"
};`;

const EXECUTE_RUN_TS = `async function run() {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({
    connection,
  });

  const execution = await client.workflow.start(subscriptionWorkflow, {
    args: [cust],
    taskQueue: TASK_QUEUE_NAME,
    workflowId: "SubscriptionsWorkflow" + cust.id,
  });
  const result = await execution.result();
  return result;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const CUST_ARRAY_TS = `const custArray: Customer[] = [1, 2, 3, 4, 5].map((i) => ({
  firstName: "First Name" + i,
  lastName: "Last Name" + i,
  email: "email-" + i + "@customer.com",
  subscription: {
    trialPeriod: 3000 + i * 1000, // 3 seconds
    billingPeriod: 3000 + i, // 3 seconds
    maxBillingPeriods: 3,
    initialBillingPeriodCharge: 120 + i * 10,
  },
  id: "Id-" + i,
}));`;

const RUN_ARRAY_TS = `async function run() {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({
    connection,
  });

  const custArray: Customer[] = [1, 2, 3, 4, 5].map((i) => ({
    firstName: "First Name" + i,
    lastName: "Last Name" + i,
    email: "email-" + i + "@customer.com",
    subscription: {
      trialPeriod: 3 + i * 1000, // 3 seconds
      billingPeriod: 3 + i, // 3 seconds
      maxBillingPeriods: 3,
      initialBillingPeriodCharge: 120 + i * 10,
    },
    id: "Id-" + i,
  }));
  const resultArr = await Promise.all(
    custArray.map(async (cust) => {
      try {
        const execution = await client.workflow.start(subscriptionWorkflow, {
          args: [cust],
          taskQueue: TASK_QUEUE_NAME,
          workflowId: "SubscriptionsWorkflow" + cust.id,
          workflowRunTimeout: "10 mins",
        });
        const result = await execution.result();
        return result;
      } catch (err) {
        console.error("Unable to execute workflow for customer:", cust.id, err);
        return \`Workflow failed for: \${cust.id}\`;
      }
    })
  );
  resultArr.forEach((result) => {
    console.log("Workflow result", result);
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const QUERIES_DEFS_TS = `export const customerIdNameQuery = defineQuery<string>("customerIdName");
export const billingPeriodNumberQuery = defineQuery<number>(
  "billingPeriodNumber"
);
export const totalChargedAmountQuery =
  defineQuery<number>("totalChargedAmount");`;

const QUERY_HANDLERS_TS = `  setHandler(customerIdNameQuery, () => customer.id);
  setHandler(billingPeriodNumberQuery, () => billingPeriodNumber);
  setHandler(totalChargedAmountQuery, () => totalCharged);`;

const SIGNAL_DEFS_TS = `export const cancelSubscription = defineSignal("cancelSubscription");
export const updateBillingChargeAmount = defineSignal<[number]>(
  "updateBillingChargeAmount"
);`;

const SIGNAL_HANDLERS_TS = `setHandler(cancelSubscription, () => {
  subscriptionCancelled = true;
});
setHandler(updateBillingChargeAmount, (newAmount: number) => {
  billingPeriodChargeAmount = newAmount;
  log.info(
    \`Updating BillingPeriodChargeAmount to \${billingPeriodChargeAmount}\`
  );
});`;

const CONDITION_REPLACEMENT_TS = `// ...
  // Used to wait for the subscription to be cancelled or for a trial period timeout to elapse
  if (
    await condition(
      () => subscriptionCancelled,
      customer.subscription.trialPeriod
    )
  ) {
    await sendCancellationEmailDuringTrialPeriod(customer);
    return \`Subscription finished for: \${customer.id}\`;
  } else {
    // Trial period is over, start billing until we reach the max billing periods for the subscription or subscription has been cancelled
    while (true) {
      if (billingPeriodNumber > customer.subscription.maxBillingPeriods) break;

      if (subscriptionCancelled) {
        await sendSubscriptionFinishedEmail(customer);
        return \`Subscription finished for: \${customer.id}, Total Charged: \${totalCharged}\`;
      }

      log.info(\`Charging \${customer.id} amount \${billingPeriodChargeAmount}\`);

      await chargeCustomerForBillingPeriod(customer, billingPeriodChargeAmount);
      totalCharged += billingPeriodChargeAmount;
      billingPeriodNumber++;

      // Wait for the next billing period or until the subscription is cancelled
      await sleep(customer.subscription.billingPeriod);
    }

    // If the subscription period is over and not cancelled, notify the customer to buy a new subscription
    await sendSubscriptionOverEmail(customer);
    return \`Completed \${
      workflowInfo().workflowId
    }, Total Charged: \${totalCharged}\`;
  }`;

const CANCEL_CUSTOMER_TS = `const customer: Customer = {
  firstName: "Grant",
  lastName: "Fleming",
  email: "email-1@customer.com",
  subscription: {
    trialPeriod: 2000,
    billingPeriod: 2000,
    maxBillingPeriods: 12,
    initialBillingPeriodCharge: 100,
  },
  id: "ABC123",
};`;

const CANCEL_BOILERPLATE_TS = `import { Connection, Client } from "@temporalio/client";
import { subscriptionWorkflow } from "../workflows";
import { TASK_QUEUE_NAME, Customer } from "../shared";

async function run() {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({
    connection,
  });
  const subscriptionWorkflowExecution = await client.workflow.start(
    subscriptionWorkflow,
    {
      args: [customer],
      taskQueue: TASK_QUEUE_NAME,
      workflowId: \`subscription-\${customer.id}\`,
    }
  );
  console.log(await subscriptionWorkflowExecution.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const CANCEL_HANDLE_TS = `// ...
  const subscriptionWorkflowExecution = await client.workflow.start(
    subscriptionWorkflow,
    {
      args: [customer],
      taskQueue: TASK_QUEUE_NAME,
      workflowId: \`subscription-\${customer.id}\`,
    }
  );
  const handle = await client.workflow.getHandle(\`subscription-\${customer.id}\`);`;

const CANCEL_SIGNAL_TS = `const handle = await client.workflow.getHandle(\`subscription-\${customer.id}\`);
await handle.signal(cancelSubscription);`;

const UPDATE_BOILERPLATE_TS = `import { Connection, Client } from "@temporalio/client";
import { subscriptionWorkflow } from "../workflows";
import { TASK_QUEUE_NAME, Customer } from "../shared";

async function run() {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({
    connection,
  });
  const subscriptionWorkflowExecution = await client.workflow.start(
    subscriptionWorkflow,
    {
      args: [customer],
      taskQueue: TASK_QUEUE_NAME,
      workflowId: \`subscription-\${customer.id}\`,
    }
  );
  console.log(await subscriptionWorkflowExecution.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

const customer: Customer = {
  firstName: "Grant",
  lastName: "Fleming",
  email: "email-1@customer.com",
  subscription: {
    trialPeriod: 2000,
    billingPeriod: 2000,
    maxBillingPeriods: 12,
    initialBillingPeriodCharge: 100,
  },
  id: "ABC123",
};`;

const UPDATE_FULL_TS = `async function run() {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({
    connection,
  });
  const subscriptionWorkflowExecution = await client.workflow.start(
    subscriptionWorkflow,
    {
      args: [customer],
      taskQueue: TASK_QUEUE_NAME,
      workflowId: \`subscription-\${customer.id}\`,
    }
  );
  const handle = await client.workflow.getHandle(\`subscription-\${customer.id}\`);

  // Signal workflow and update charge amount to 300 for next billing period
  try {
    await handle.signal(updateBillingChargeAmount, 300);
    console.log(
      \`subscription-\${customer.id} updating BillingPeriodChargeAmount to 300\`
    );
  } catch (err) {
    console.error("Cant signal workflow", err);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const QUERY_BOILERPLATE_TS = `import { Connection, Client } from "@temporalio/client";
import { subscriptionWorkflow } from "../workflows";
import { TASK_QUEUE_NAME, Customer } from "../shared";

async function run() {
  const connection = await Connection.connect({ address: "localhost:7233" });
  const client = new Client({
    connection,
  });
  const subscriptionWorkflowExecution = await client.workflow.start(
    subscriptionWorkflow,
    {
      args: [customer],
      taskQueue: TASK_QUEUE_NAME,
      workflowId: \`subscription-\${customer.id}\`,
    }
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});`;

const QUERY_LOOP_TS = `// ...
  // Wait for some time before querying to allow the workflow to progress
  for (let i = 1; i <= 5; i++) {
    // Loop for 5 billing periods
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Adjust the wait time to match billing period plus buffer
    try {
      const billingPeriodNumber =
        await subscriptionWorkflowExecution.query<number>(
          "billingPeriodNumber"
        );
      const totalChargedAmount =
        await subscriptionWorkflowExecution.query<number>("totalChargedAmount");

      console.log("Workflow Id", subscriptionWorkflowExecution.workflowId);
      console.log("Billing Period", billingPeriodNumber);
      console.log("Total Charged Amount", totalChargedAmount);
    } catch (err) {
      console.error(
        \`Error querying workflow with ID \${subscriptionWorkflowExecution.workflowId}:\`,
        err
      );
    }
  }`;

export default function RecurringBillingSystemPage() {
  return (
    <Layout
      title="Build a recurring billing subscription system with TypeScript"
      description="Implement a subscription application using Temporal's Workflows, Activities, Signals, and Queries."
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
                  { label: "Recurring billing system" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a recurring billing subscription system with TypeScript
            </h1>

            <MetaChips items={["~2 hours", "TypeScript", "Intermediate"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                Managing subscription-based services requires precision and
                fault tolerance at every step. You need to reliably handle
                processes like user sign-ups, trial periods, billing
                cycles, and cancellations. This often involves making
                durable calls to external services such as databases,
                email servers, and payment gateways.
              </p>
              <p>
                In this tutorial you build the backend processes of a phone
                subscription management application using TypeScript. You
                handle the entire subscription lifecycle, from welcoming
                new users to managing billing and cancellations through
                command-line programs. While using command-line scripts
                simplifies the demonstration, in a real-world scenario
                you'd likely build a web interface or API.
              </p>
              <p>
                You'll find the code for this tutorial on GitHub in the{" "}
                <a
                  href="https://github.com/temporalio/subscription-workflow-project-template-typescript"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  subscription-workflow-project-template-typescript
                </a>{" "}
                repository.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  <a
                    href="https://learn.temporal.io/getting_started/typescript/dev_environment/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Set up a local development environment for Temporal and
                    TypeScript
                  </a>
                  .
                </li>
                <li>
                  Complete the{" "}
                  <a
                    href="https://learn.temporal.io/getting_started/typescript/hello_world_in_typescript/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Hello World
                  </a>{" "}
                  tutorial.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>Create your project</h2>
              <p>
                Create a new project directory called{" "}
                <code>subscription-workflow-with-temporal</code>:
              </p>
              <CodeBlock language="bash">
                mkdir subscription-workflow-with-temporal
              </CodeBlock>
              <CodeBlock language="bash">
                cd subscription-workflow-with-temporal
              </CodeBlock>

              <p>
                Install <code>@tsconfig/node20</code>,{" "}
                <a
                  href="https://nodemon.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nodemon
                </a>
                , and <code>ts-node</code>:
              </p>
              <CodeBlock language="bash">
                {`npm install --save-dev @tsconfig/node20
npm install --save-dev nodemon
npm install --save-dev ts-node`}
              </CodeBlock>

              <p>Configure TypeScript:</p>
              <CodeBlock language="bash">touch tsconfig.json</CodeBlock>
              <CodeBlock language="json" title="tsconfig.json">
                {TSCONFIG_JSON}
              </CodeBlock>

              <p>Install Temporal and its dependencies:</p>
              <CodeBlock language="bash">
                npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
              </CodeBlock>
              <p>Your dependencies in <code>package.json</code>:</p>
              <CodeBlock language="json">{DEPENDENCIES_JSON}</CodeBlock>

              <p>Create a <code>src</code> folder and files:</p>
              <CodeBlock language="bash">
                {`mkdir -p src
touch src/worker.ts src/workflows.ts src/activities.ts
mkdir src/scripts
touch src/scripts/cancel-subscription.ts src/scripts/execute-workflow.ts src/scripts/query-billinginfo.ts src/scripts/update-chargeamt.ts`}
              </CodeBlock>

              <p>In <code>package.json</code>, create scripts:</p>
              <CodeBlock language="json">{SCRIPTS_JSON}</CodeBlock>
            </section>

            <section className={styles.section} id="define-customer">
              <h2 className={styles.sectionTitle}>Define your customer</h2>
              <p>
                Define the customer information needed when signing up. Use
                a single object for parameters and return types - this
                allows you to change fields without breaking Workflow
                compatibility. Create <code>src/shared.ts</code>:
              </p>
              <CodeBlock language="bash">touch src/shared.ts</CodeBlock>
              <p>
                The <code>Customer</code> object will have:{" "}
                <code>firstName</code>, <code>lastName</code>,{" "}
                <code>email</code>, <code>id</code>, and a{" "}
                <code>subscription</code> object with{" "}
                <code>trialPeriod</code>, <code>billingPeriod</code>,{" "}
                <code>maxBillingPeriods</code>, and{" "}
                <code>initialBillingPeriodCharge</code>.
              </p>
              <p>
                Your <code>shared.ts</code> will also include a{" "}
                <a
                  href="https://docs.temporal.io/workers#task-queue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queue
                </a>{" "}
                name to route tasks to the appropriate{" "}
                <a
                  href="https://docs.temporal.io/workers#worker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker
                </a>
                .
              </p>
              <CodeBlock language="ts" title="src/shared.ts">
                {SHARED_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="define-activities">
              <h2 className={styles.sectionTitle}>
                Define external interactions
              </h2>
              <p>
                Define the functions that handle interactions with external
                systems. These are called{" "}
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>
                . If an Activity fails, Temporal can automatically retry it.
              </p>
              <p>
                For this tutorial, define Activities for tasks like
                charging customers and sending emails, stubbed out with
                basic <code>log</code> statements. Add the following code
                to <code>src/activities.ts</code>:
              </p>
              <CodeBlock language="ts" title="src/activities.ts">
                {ACTIVITIES_WELCOME_TS}
              </CodeBlock>

              <p>Add a few more email/charging functions:</p>
              <CodeBlock language="ts" title="src/activities.ts">
                {ACTIVITIES_REST_TS}
              </CodeBlock>
            </section>

            <section className={styles.section} id="define-workflow">
              <h2 className={styles.sectionTitle}>
                Define your application logic
              </h2>
              <p>
                Build a Temporal Workflow to use those functions for the
                business logic. A{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definition
                </a>{" "}
                is essentially a function that can store state and
                orchestrates Activities.
              </p>
              <p>Workflow requirements:</p>
              <ol>
                <li>
                  <strong>User Signup and Free Trial</strong>: send a
                  welcome email and start a free trial for the duration
                  defined by <code>trialPeriod</code>.
                </li>
                <li>
                  <strong>Cancellation During Trial</strong>: if the user
                  cancels during the trial period, send a trial
                  cancellation email and complete the Workflow.
                </li>
                <li>
                  <strong>Billing Process</strong>: if the trial expires
                  without cancellation, start the billing process, charging
                  up to <code>maxBillingPeriods</code> times. If the
                  customer cancels during a billing period, send a
                  subscription cancellation email.
                </li>
                <li>
                  <strong>Dynamic Updates</strong>: cancel a subscription,
                  look up the amount charged, or change billing amount.
                </li>
              </ol>

              <p>Start by adding imports and Activities:</p>
              <CodeBlock language="ts" title="src/workflows.ts">
                {WORKFLOW_IMPORTS_TS}
              </CodeBlock>
              <p>
                Using <code>proxyActivities</code>, you can create a proxy
                object that allows users to call the Activity from within
                the Workflow as if it's a local function.{" "}
                <code>startToCloseTimeout</code> indicates the maximum
                time for an Activity to execute, including retries.
              </p>

              <p>Add the <code>subscriptionWorkflow</code> definition:</p>
              <CodeBlock language="ts" title="src/workflows.ts">
                {WORKFLOW_DEF_TS}
              </CodeBlock>
              <p>
                The <code>sleep</code> function is a durable Timer
                provided by Temporal. The Temporal Server persists the
                sleep details in its database. This ensures that the
                Workflow can resume accurately after the specified
                duration, even if the Server or Worker experiences
                downtime.
              </p>

              <Admonition type="note" title="Production Consideration: Managing Long-Running Workflows">
                <p>
                  In production code, Temporal recommends using the{" "}
                  <a
                    href="https://docs.temporal.io/workflows#continue-as-new"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    continue-as-new
                  </a>{" "}
                  feature to manage long-running Workflows and prevent
                  excessively large{" "}
                  <a
                    href="https://docs.temporal.io/workflows#event-history"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Event Histories
                  </a>
                  . You can learn more in Temporal's free course:{" "}
                  <a
                    href="https://learn.temporal.io/courses/temporal_102/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal 102
                  </a>
                  .
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="run-workflow">
              <h2 className={styles.sectionTitle}>Run the subscription Workflow</h2>
              <p>
                Ensure you have a local Temporal Service running. Open a
                separate terminal window and start the service with{" "}
                <code>temporal server start-dev</code>. Your Temporal
                Server should run on <code>http://localhost:8233</code>.
              </p>
              <p>Define your Worker program in <code>worker.ts</code>:</p>
              <CodeBlock language="ts" title="src/worker.ts">
                {WORKER_TS}
              </CodeBlock>

              <p>Run the Worker:</p>
              <CodeBlock language="bash">npm run start</CodeBlock>
              <p>
                To restart the Worker on Workflow changes, use{" "}
                <code>nodemon</code>:
              </p>
              <CodeBlock language="bash">npm run start.watch</CodeBlock>

              <p>
                Create your Client to start your{" "}
                <code>subscriptionWorkflow</code> in{" "}
                <code>execute-workflow.ts</code>:
              </p>
              <CodeBlock language="ts" title="src/scripts/execute-workflow.ts">
                {EXECUTE_IMPORTS_TS}
              </CodeBlock>
              <p>Add a customer object:</p>
              <CodeBlock language="ts" title="src/scripts/execute-workflow.ts">
                {EXECUTE_CUSTOMER_TS}
              </CodeBlock>
              <p>Then add the run function:</p>
              <CodeBlock language="ts" title="src/scripts/execute-workflow.ts">
                {EXECUTE_RUN_TS}
              </CodeBlock>

              <p>Run your Client:</p>
              <CodeBlock language="bash">npm run workflow</CodeBlock>
              <p>
                The Worker, polling the same Task Queue, picks up the
                task and executes it. The Workflow Execution completes
                successfully with output:{" "}
                <code>Completed SubscriptionsWorkflowId-1, Total Charged: 360</code>
                . This log of events is known as an{" "}
                <a
                  href="https://docs.temporal.io/workflows#event-history"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event History
                </a>
                .
              </p>

              <p>
                Replace the <code>cust</code> object with a{" "}
                <code>custArray</code>:
              </p>
              <CodeBlock language="ts">{CUST_ARRAY_TS}</CodeBlock>
              <p>Modify your Client code to loop through the array:</p>
              <CodeBlock language="ts">{RUN_ARRAY_TS}</CodeBlock>

              <p>Run your Workflow:</p>
              <CodeBlock language="bash">npm run workflow</CodeBlock>
              <p>
                You'll see five more instances of the Subscription
                Workflow. The Worker outputs Activity logs:{" "}
                <code>Sending welcome email to email-1@customer.com</code>,
                etc.
              </p>
            </section>

            <section className={styles.section} id="retrieve-details">
              <h2 className={styles.sectionTitle}>Retrieve subscription details</h2>
              <p>
                A{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/application-message-passing#queries"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Query
                </a>{" "}
                is a synchronous operation to get the state of a Workflow
                Execution without impacting its execution.
              </p>
              <p>
                Open <code>workflows.ts</code>, add <code>defineQuery</code>{" "}
                to your imports from <code>@temporalio/workflow</code>, and
                add Query definitions above the Workflow Definition:
              </p>
              <CodeBlock language="ts">{QUERIES_DEFS_TS}</CodeBlock>

              <p>Use the <code>setHandler</code> function to handle Queries:</p>
              <CodeBlock language="ts">{QUERY_HANDLERS_TS}</CodeBlock>
              <p>
                These Query handlers return subscription details. Queries
                can also be used after the Workflow completes.
              </p>
            </section>

            <section className={styles.section} id="cancel-update">
              <h2 className={styles.sectionTitle}>
                Cancel your subscription and update billing charge amount
              </h2>
              <p>
                A Signal is an asynchronous message sent to a running
                Workflow Execution, allowing you to change its state and
                control its flow.
              </p>
              <p>
                Add <code>defineSignal</code> to your imports, and add the
                Signal definitions:
              </p>
              <CodeBlock language="ts">{SIGNAL_DEFS_TS}</CodeBlock>
              <p>This defines:</p>
              <ol>
                <li>
                  <code>cancelSubscription</code>: a Signal with no input
                  parameters.
                </li>
                <li>
                  <code>updateBillingChargeAmount</code>: a Signal that
                  takes a number parameter.
                </li>
              </ol>

              <p>Implement the Signal handlers:</p>
              <CodeBlock language="ts">{SIGNAL_HANDLERS_TS}</CodeBlock>
            </section>

            <section className={styles.section} id="wait-input">
              <h2 className={styles.sectionTitle}>
                Wait for user input to continue or cancel your subscription
              </h2>
              <p>
                The Temporal SDK provides the{" "}
                <a
                  href="https://typescript.temporal.io/api/namespaces/workflow#condition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  condition
                </a>{" "}
                method to determine the execution path until a specified
                condition is satisfied or a timeout is reached. Add{" "}
                <code>condition</code> to your imports.
              </p>
              <p>
                Modify your Workflow Execution code to wait for the
                subscription to be canceled or for a trial period timeout.
                Replace the existing trial/billing block with:
              </p>
              <CodeBlock language="ts" title="src/workflows.ts">
                {CONDITION_REPLACEMENT_TS}
              </CodeBlock>
              <p>
                The <code>condition</code> method pauses the Workflow
                until either the <code>subscriptionCancelled</code> flag
                is true or the trial period expires.
              </p>
            </section>

            <section className={styles.section} id="cancel-ongoing">
              <h2 className={styles.sectionTitle}>
                Cancel an ongoing subscription
              </h2>
              <p>
                Send your <code>cancelSubscription</code> Signal from the
                Temporal Client. In <code>cancel-subscription.ts</code>,
                first define your customer object:
              </p>
              <CodeBlock language="ts" title="src/scripts/cancel-subscription.ts">
                {CANCEL_CUSTOMER_TS}
              </CodeBlock>
              <p>Then bring in some boilerplate Client code:</p>
              <CodeBlock language="ts">{CANCEL_BOILERPLATE_TS}</CodeBlock>
              <p>Add the <code>cancelSubscription</code> Signal import:</p>
              <CodeBlock language="ts">
                import &#123; subscriptionWorkflow, cancelSubscription &#125; from "../workflows";
              </CodeBlock>
              <p>
                Obtain the handle of the running Workflow Execution using{" "}
                <a
                  href="https://typescript.temporal.io/api/classes/client.WorkflowClient#gethandle"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  getHandle
                </a>
                :
              </p>
              <CodeBlock language="ts">{CANCEL_HANDLE_TS}</CodeBlock>
              <p>Use the handle to send the Signal:</p>
              <CodeBlock language="ts">{CANCEL_SIGNAL_TS}</CodeBlock>

              <p>Save your code, ensure your Worker is running, and send:</p>
              <CodeBlock language="bash">npm run cancelsubscription</CodeBlock>
              <p>
                You should see:{" "}
                <em>Completed subscription-ABC123, Total Charged: 1200</em>.
              </p>
            </section>

            <section className={styles.section} id="update-charge">
              <h2 className={styles.sectionTitle}>Update the charge amount</h2>
              <p>
                Send another Signal to update the charge amount in{" "}
                <code>update-chargeamt.ts</code>:
              </p>
              <CodeBlock language="ts" title="src/scripts/update-chargeamt.ts">
                {UPDATE_BOILERPLATE_TS}
              </CodeBlock>
              <p>Add the Signal import:</p>
              <CodeBlock language="ts">
                import &#123; subscriptionWorkflow, updateBillingChargeAmount &#125; from "../workflows";
              </CodeBlock>
              <p>Get the handle and send the Signal:</p>
              <CodeBlock language="ts">{UPDATE_FULL_TS}</CodeBlock>

              <p>Send the Signal:</p>
              <CodeBlock language="bash">npm run updatechargeamount</CodeBlock>
              <p>
                Output: <em>updating BillingPeriodChargeAmount to 300</em>.
              </p>
            </section>

            <section className={styles.section} id="retrieve-billing">
              <h2 className={styles.sectionTitle}>
                Retrieve billing period and total charged details
              </h2>
              <p>
                Send a Query through the Client to retrieve information
                from a running or completed Workflow. In{" "}
                <code>query-billinginfo.ts</code>, reuse the customer
                object:
              </p>
              <CodeBlock language="ts" title="src/scripts/query-billinginfo.ts">
                {CANCEL_CUSTOMER_TS}
              </CodeBlock>
              <p>Then bring in the boilerplate Client code:</p>
              <CodeBlock language="ts">{QUERY_BOILERPLATE_TS}</CodeBlock>
              <p>
                Iterate through five billing periods and use the{" "}
                <code>WorkflowHandle.query</code> method:
              </p>
              <CodeBlock language="ts">{QUERY_LOOP_TS}</CodeBlock>

              <p>Send the Queries:</p>
              <CodeBlock language="bash">npm run querybillinginfo</CodeBlock>
              <p>
                You should see the Workflow Id, the billing period, and the
                total charged amount in the command-line output.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                By using Temporal, you built a fault-tolerant subscription
                Workflow that manages complex state transitions and
                interactions with external services. Temporal's durable
                execution and automatic state persistence ensured that
                your Workflow could reliably handle user sign-ups, trial
                periods, billing cycles, and cancellations, even in the
                face of failures or interruptions.
              </p>
              <p>
                As a next step, try using{" "}
                <a
                  href="https://expressjs.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Express.js
                </a>{" "}
                to build an API for your application. The code you used
                in the command-line scripts can be adapted for your API
                endpoints, enabling more seamless and user-friendly
                interactions with your Temporal Workflow Executions.
              </p>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
