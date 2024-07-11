---
id: subscription-tutorial
sidebar_position: 3
keywords: [TypeScript, temporal, sdk, tutorial, entity workflow]
tags: [TypeScript, SDK]
last_update:
  date: 2024-07-11
title: Build a Recuring Billing Subscription Workflow with TypeScript
description: Implement a subscription application using Temporal's Workflows, Activities, Signals, and Queries, enabling the payment workflow to be canceled or modified during execution.
image: /img/temporal-logo-twitter-card.png
---

![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)

## Introduction

Managing subscription-based services requires precision and fault tolerance at every step. You need to handle processes like user sign-ups, trial periods, billing cycles, and cancellations reliably. This often involves making reliable calls to external services such as databases, email servers, and payment gateways. These interactions need to be fault-tolerant to prevent data loss, ensure seamless user experiences, and maintain the integrity of your subscription management system despite failures or network issues.

In this tutorial, you'll build a phone subscription management application using TypeScript. You'll handle the entire subscription lifecycle, from welcoming new users to managing billing and cancellations, ensuring that your application remains reliable even during failures.

To achieve this, you will leverage Temporal, an open-source platform that ensures the successful completion of long-running processes despite failures or network issues. Temporal provides fault tolerance by automatically retrying failed tasks, and ensures durability by persisting Workflow states, allowing them to resume from the last known state after a failure like a power outage. It offers scalability to handle high volumes of Workflows concurrently, making it ideal for cases like the subscription service if it had thousands of customers.

## Prerequisites

- [Set up a local development environment for Temporal and TypeScript](https://learn.temporal.io/getting_started/typescript/dev_environment/).
- Complete the [Hello World](https://learn.temporal.io/getting_started/typescript/hello_world_in_typescript/) tutorial to ensure you understand the basics of creating Workflows and Activities with Temporal.

## Tutorial objectives

Your task is to write a Workflow for a limited time subscription (e.g., a 36-month Phone plan) that satisfies these conditions:

1. When the user signs up:

    - Send a welcome email.
    - Start a free trial for `trialPeriod`.

2. During the trial period:

    - If the user cancels during the trial, **send a trial cancellation email** and complete the Workflow.
    - If the `trialPeriod` expires without cancellation, start the billing process.

3. Billing Process:
   - As long as you have not exceeded `maxBillingPeriods`,
    - **Charge the customer** for the `billingPeriodChargeAmount`.
    - Wait for the next `billingPeriod`.
    - If the customer cancels during a billing period, **send a subscription cancellation email**.
    - If the subscription ends normally (exceeded `maxBillingPeriods` without cancellation), **send a subscription ended email** and complete the Workflow Execution.
4. At any point while subscriptions are ongoing, you should be able to:
   - Look up and change any customer's amount charged.
   - Adjust the period number for manual adjustments (e.g., refunds).

All of this has to be fault tolerant, scalable to millions of customers, testable, maintainable!

By the end of this tutorial, you will have a clear understanding of how to create and manage a long-running Workflow for your subscription application. You will also be able to enable real-time updates to ongoing Workflows to retrieve subscription details such as users' billing information, update billing amounts, and cancel users' subscriptions at any time.

You'll find the code for this tutorial on GitHub in the [subscription-workflow-project-template-typescript](https://github.com/temporalio/subscription-workflow-project-template-typescript) repository.

## Create your project

In a terminal, create a new project directory called `subscription-workflow-with-temporal`:

```command
mkdir subscription-workflow-with-temporal
```

Switch to the new directory:

```command
cd subscription-workflow-with-temporal
```

Create the `package.json` file in the root of your project and add the following code to the file that defines the project, sets up scripts, and defines the dependencies this project requires:

[package.json](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/package.json)

```json
{
  "name": "temporal-subscription-workflow-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsc --build",
    "build.watch": "tsc --build --watch",
    "start": "ts-node src/worker.ts",
    "start.watch": "nodemon src/worker.ts",
    "workflow": "ts-node src/scripts/execute-workflow.ts",
    "querybillinginfo": "ts-node src/scripts/query-billinginfo.ts",
    "cancelsubscription": "ts-node src/scripts/cancel-subscription.ts",
    "updatechargeamount": "ts-node src/scripts/update-chargeamt.ts",
    "lint": "eslint .",
    "test": "mocha --exit --require ts-node/register --require source-map-support/register src/mocha/*.test.ts"
  },
  "nodemonConfig": {
    "execMap": {
      "ts": "ts-node"
    },
    "ext": "ts",
    "watch": [
      "src"
    ]
  },
  "dependencies": {
    "@temporalio/activity": "~1.10.0",
    "@temporalio/client": "~1.10.0",
    "@temporalio/worker": "~1.10.0",
    "@temporalio/workflow": "~1.10.0",
    "@types/node": "^20.14.2"
  },
  "devDependencies": {
    "@temporalio/testing": "~1.10.0",
    "@types/mocha": "8.x",
    "@tsconfig/node20": "^1.0.2",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-deprecation": "^1.2.1",
    "nodemon": "^3.1.3",
    "mocha": "8.x",
    "prettier": "^2.4.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

Review the scripts section of the `package.json`. These are the `npm` commands you'll use to build, lint, and start your application code.

Next, examine the packages listed as dependencies. These are the packages that compose the Temporal TypeScript SDK, and each package maps to the four parts of a Temporal application: an Activity, Client, Worker, and Workflow. You will explore each component in this subscription, and how they work together to create a fault-tolerant Workflow for your subscription application.

Save the file, then download the dependencies specified in the `package.json` file with the command:

```command
npm install
```

Downloading the dependencies can take a few minutes to complete. Once the download is done, you will have new a `package-lock.json` file and a `node_modules` directory.

Temporal doesn't prescribe folder structure; feel free to set up your folders however you wish. In this tutorial, you will create a `src` folder for your code that holds the subscription logic:

```command
mkdir -p src
touch src/worker.ts src/workflows.ts src/activities.ts # create folder, recursively
```

Configure TypeScript by adding a new `tsconfig.json` in the root directory:

```command
touch tsconfig.json
```

Add the following configuration to the file:

```js
{
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
}
```

Your project workspace is configured, so you're ready to start creating your application.

## Define external interactions

You will begin by defining the functions that handle interactions with external systems. These functions are called [Activities](https://docs.temporal.io/dev-guide/typescript/foundations/#develop-activities).

Activities are the building blocks of a Temporal Workflow. They encapsulate the logic for tasks that interact with external services such as querying a database or calling a third-party API. One of the key benefits of using Activities is their built-in fault tolerance. If an Activity fails, Temporal can automatically retry it until it succeeds or reaches a specified retry limit. This ensures that transient issues, like network glitches or temporary service outages, do not result in data loss or incomplete processes.

For this tutorial, you'll define Activities for tasks like charging customers and sending emails, which typically interact with external services. To keep things simple and focus on the Workflow logic, these Activities will be stubbed out with basic `console.log` statements. Here's an excerpt:

<!--SNIPSTART subscription-ts-activities {"selectedLines": ["5-12"]}-->

[src/activities.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/activities.ts)

```ts
// ...
export async function sendWelcomeEmail(customer: Customer) {
  log.info(`Sending welcome email to ${customer.email}`);
}
export async function sendCancellationEmailDuringTrialPeriod(
  customer: Customer
) {
  log.info(`Sending trial cancellation email to ${customer.email}`);
}
```

<!--SNIPEND-->

Cre

## Define your application logic

A Workflow defines a sequence of steps defined by writing code, known as a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition). These steps are executed as a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).

A Workflow Definition is essentially a function, which can store state and orchestrates the execution of Activities. Workflows manage the coordination and logic of your application's processes, while Activities perform the tasks which interact with external services.

Although a Workflow Definition can have multiple parameters, Temporal recommends the use of a single object for parameters and return types. This approach allows you to modify fields without breaking Workflow compatibility. Before writing the Workflow Definition, you'll define the data object used by the Workflow.

To set up the object, create a new file called `shared.ts` in your project directory. This file will hold some constants you'll use in the application.

This object will represent the data you'll send to your Activity and Workflow. You'll create a `Customer` object with the following fields:

- `firstName`: A string used to pass in the user's first name.
- `lastName`: A string used to pass in the user's last name.
- `email`: A string used to pass in the user's email address.
- `id`: A string that uniquely identifies the customer.
- `subscription`: Another object with several keys that have information about the user's subscription such as:
  - `trialPeriod`: A number that defines the length of the user's trial period in seconds (used for demo purposes).
  - `billingPeriod`: A number that defines the interval between billing cycles in seconds.
  - `maxBillingPeriods`: A number that defines the maximum number of billing cycles before the subscription ends.
  - `initialBillingPeriodCharge`: A number that defines the initial charge amount for the first billing period.

Your `shared.ts` file will also include a [Task Queue](https://docs.temporal.io/workers#task-queue) name. The Task Queue helps route tasks to the appropriate [Worker](https://docs.temporal.io/workers#worker). When you start a Workflow, it places tasks into the Task Queue. Workers continuously poll this queue for tasks and execute them. The Workflow doesn't proceed until a Worker picks up and processes the Workflow Task from the Task Queue.

Create the shared.ts file in your project directory with the following code:

<!--SNIPSTART subscription-ts-shared-file {"selectedLines": ["1-14"]}-->

[src/shared.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/shared.ts)

```ts
export const TASK_QUEUE_NAME = "subscriptions-task-queue";

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
}
```

<!--SNIPEND-->

Now that you have your `Customer` object defined, you can move on to writing the Workflow Definition. As mentioned, the Workflow will orchestrate the sequence of Activities such as sending welcome emails, charging customers, and handling cancellations.

To create a new Workflow Definition, create a new file called `workflows.ts`. This file will contain the `subscriptionWorkflow` function. The requirements of this Workflow Definition are the following:

1. **User Signup and Free Trial**: When the user signs up, send a welcome email and start a free trial for the duration defined by `trialPeriod`.
2. **Cancellation During Trial**: If the user cancels during the trial period, send a trial cancellation email and complete the Workflow.
3. **Billing Process**:
   - If the trial period expires without cancellation, start the billing process.
   - As long as the number of billing periods does not exceed `maxBillingPeriods`:
    - Charge the customer the amount defined by `billingPeriodChargeAmount`.
    - Wait for the next `billingPeriod`.
  - If the customer cancels during a billing period, **send a subscription cancellation email**.
  - If the subscription ends normally (exceeding maxBillingPeriods without cancellation), send a subscription ended email and complete the Workflow.
4. **Dynamic Updates**: At any point while subscriptions are ongoing, be able to:
  - Cancel a subscription.
  - Look up and the amount charged on a customer's account so far.
  - Change any customer billing amount.

Create the `workflows.ts` file with the following code:

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["1-12", "14-22", "35-42", "57-59", "72-79", "91", "94-100"]}-->

[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)

```ts
import {
  proxyActivities,
  log,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  workflowInfo,
  sleep,
} from "@temporalio/workflow";
import type * as activities from "./activities";
import {Customer} from "./shared";
// ...
const {
  sendWelcomeEmail,
  sendCancellationEmailDuringActiveSubscription,
  chargeCustomerForBillingPeriod,
  sendCancellationEmailDuringTrialPeriod,
  sendSubscriptionOverEmail,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: "5 seconds",
});
// ...
export async function subscriptionWorkflow(
  customer: Customer
): Promise<string> {
  let subscriptionCancelled = false;
  let totalCharged = 0;
  let billingPeriodNumber = 1;
  let billingPeriodChargeAmount =
    customer.subscription.initialBillingPeriodCharge;
  // ...
  // Send welcome email to customer
  await sendWelcomeEmail(customer);
  await sleep(customer.subscription.trialPeriod);
  // ...
  while (true) {
    if (billingPeriodNumber > customer.subscription.maxBillingPeriods) break;

    log.info(`Charging ${customer.id} amount ${billingPeriodChargeAmount}`);

    await chargeCustomerForBillingPeriod(customer, billingPeriodChargeAmount);
    totalCharged += billingPeriodChargeAmount;
    billingPeriodNumber++;
    // ...
  }
  // ...
  if (!subscriptionCancelled) {
    await sendSubscriptionOverEmail(customer);
  }
  return `Completed ${
    workflowInfo().workflowId
  }, Total Charged: ${totalCharged}`;
}
```

<!--SNIPEND-->

Notice that in the above code, you are using the [`sleep`](https://typescript.temporal.io/api/namespaces/workflow#sleep) API for the first time.

:::note The importance of deferred execution

The `sleep` function is a simple yet powerful **durable timer** provided by Temporal. When you call `sleep` in a Workflow, the Temporal Server persists the sleep details in its database. This ensures that the Workflow can be resumed accurately after the specified duration, even if the Temporal Server or Worker experiences downtime.

To test the fault tolerance of this feature, you can intentionally shut down your Worker or Temporal Server during the sleep period. When the system is back up, you will notice that the Workflow continues from where it left off, demonstrating Temporal's resilience.

:::

In the following example, after sending the welcome email, the Workflow waits for the duration of the trial period before proceeding to the next steps. This is achieved using the `sleep` function, which pauses the Workflow Execution until the subscription has ended.

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["58-59"]}-->

[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)

```ts
// ...
await sendWelcomeEmail(customer);
await sleep(customer.subscription.trialPeriod);
```

<!--SNIPEND-->

Now, you will look into how to query your Workflow to retrieve information such as the Workflow ID, the billing period, and the total amount charged. This allows you to interact with the Workflow while it is running and get real-time updates on its status and progress.

## Retrieve subscription details

A [Query](https://docs.temporal.io/encyclopedia/application-message-passing#queries) is a synchronous operation that is used to get the state or other details of a Workflow Execution without impacting its execution. Queries are typically used to access the state of an active Workflow Execution, but they can also be applied to closed Workflow Executions.

In this section, you will use Queries to allow users to obtain information about their subscription details.

The first step is to add a new Query definition to the `subscriptionWorkflow` Workflow. To define a Query in the Workflow, you will need to use the [`defineQuery`](https://typescript.temporal.io/api/namespaces/workflow/#definequery) method provided by the TypeScript API. This function returns a `QueryDefinition` object, which carries the Query's signature: the Query Type (a unique name used to identify the Query), the input parameters types, and the Query's return type.

Open the `workflow.ts` file and add a Query Definition to the top of the Workflow Definition:

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["25-28", "32-33"]}-->

[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)

```ts
// ...
export const customerIdNameQuery = defineQuery<string>("customerIdName");
export const billingPeriodNumberQuery = defineQuery<number>(
  "billingPeriodNumber"
);
// ...
export const totalChargedAmountQuery =
  defineQuery<number>("totalChargedAmount");
```

<!--SNIPEND-->

These Queries provide:

- `customerIdNameQuery` returns a string value.
- `billingPeriodNumberQuery` returns a number value.
- `totalChargedAmountQuery` returns a number value.

After defining a Query, the next step is to establish how the Workflow handles incoming Queries. This is where Query handlers come into play - they specify the actions a Workflow should take upon receiving a Query. Queries should be read-only and must not include logic that causes Command generation, such as executing Activities.

Use the [`handleQuery`](https://typescript.temporal.io/api/interfaces/workflow.WorkflowInboundCallsInterceptor/#handlequery) method to handle Queries inside a Workflow. This method directs each Query to its corresponding handler logic.

Within the workflow.ts file, handle your Queries as follows:

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["44", "54-55"]}-->

[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)

```ts
// ...
setHandler(customerIdNameQuery, () => customer.id);
// ...
setHandler(billingPeriodNumberQuery, () => billingPeriodNumber);
setHandler(totalChargedAmountQuery, () => totalCharged);
```

<!--SNIPEND-->

These Query handlers return subscription details such as the customer ID, billing period number, and total charged amount. With these handlers in place, you can now retrieve details about the subscription without affecting the ongoing Workflow Execution.

Queries can also be used after the Workflow completes, which is useful if a user unsubscribes but still wants to retrieve information about their subscription.

Now that you've added the ability to query your Workflow, it's time to add Signals to your Workflow Definition as well to control the flow of your Workflow Execution.

## Control application logic flow

A Signal is an asynchronous message sent to a running Workflow Execution, allowing you to change its state and control its flow. For example, in a subscription Workflow, you can send a Signal to change the subscription period. Note that a Signal can only deliver data to a Workflow Execution that has not already closed.

Just like you did with your Queries, you need to both define and handle Signals within the Workflow Definition. You will use the [`defineSignal`](https://typescript.temporal.io/api/namespaces/workflow#definesignal) method provided by the TypeScript API for this purpose. This method creates a Signal Definition object that includes the Signal's name and the input parameter types.

Add the following Signal definitions to your workflows.ts file:

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["24", "29-31"]}-->

[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)

```ts
// ...
export const cancelSubscription = defineSignal("cancelSubscription");
// ...
export const updateBillingChargeAmount = defineSignal<[number]>(
  "updateBillingChargeAmount"
);
```

<!--SNIPEND-->

This code defines two Signals:

1. `cancelSubscription`: A Signal with no input parameters, used to cancel the subscription.
2. `updateBillingChargeAmount`: A Signal that takes a single parameter of type number, used to update the billing charge amount.

However, just defining a Signal is just the first step. You also need to let the Workflow know what to do when it receives a Signal of that type. This is done using a Signal Handler, which is a function within the Workflow that listens for incoming Signals of a specified type and defines the Workflow's response.

In order to implement a Signal handler, you will need to use the [`setHandler`](https://typescript.temporal.io/api/namespaces/workflow/#sethandler) function provided by the TypeScript SDK API. This function associates each Signal with its corresponding handler logic.

Within the `workflows.ts` file, implement the Signal handlers as shown below:

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["45-53"]}-->

[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)

```ts
// ...
setHandler(cancelSubscription, () => {
  subscriptionCancelled = true;
});
setHandler(updateBillingChargeAmount, (newAmount: number) => {
  billingPeriodChargeAmount = newAmount;
  log.info(
    `Updating BillingPeriodChargeAmount to ${billingPeriodChargeAmount}`
  );
});
```

<!--SNIPEND-->

1. When the `subscriptionWorkflow` Execution is running and it receives the `cancelSubscription` Signal, the corresponding handler function sets `subscriptionCancelled` to `true`. This effectively cancels the subscription.
2. Similarly, when the `updateBillingChargeAmount` Signal is received, the handler updates `billingPeriodChargeAmount` to the new value provided by the Client. This mechanism allows the Workflow to dynamically respond to external events without interrupting its execution flow.

You now know what a Query and Signal is, as well as how to define and handle them in your Workflow Definition. In the following sections, you will pause your Workflow until it receives a Signal, and you will send a Signal and Query.

## Wait for user input to continue application logic

In many cases, you may want to pause the Workflow execution until a specific Signal is received or a certain condition is met. For example, in the `subscriptiptionWorkflow`, you might want to wait for the `subscriptionCancelled` Signal before invoking the `sendCancellationEmailDuringTrialPeriod` Activity.

The Temporal SDK provides the [`condition`](https://typescript.temporal.io/api/namespaces/workflow#condition) method for this purpose. The `condition` method allows you to halt the Workflow's progress until a specified condition is satisfied or a timeout is reached.

The `condition` method takes two arguments:

- Condition Function: A function that returns a boolean value.
- Timeout: The maximum time to wait for the condition to become true.

It returns a Promise that resolves when the condition function returns true or when the timeout period expires.

Here's an example of how to use the `condition` method in the `subscriptionWorkflow` to wait for either the `subscriptionCancelled` Signal or for the trial period to expire:

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["61-70"]}-->

[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)

```ts
// ...
// Used to wait for the subscription to be cancelled or for a trial period timeout to elapse
if (
  await condition(
    () => subscriptionCancelled,
    customer.subscription.trialPeriod
  )
) {
  await sendCancellationEmailDuringTrialPeriod(customer);
  return `Subscription finished for: ${customer.id}`;
}
```

<!--SNIPEND-->

In the above code, the condition method pauses the Workflow until either the `subscriptionCancelled` Signal is received or the trial period expires. Once the condition is met, the Workflow invokes the Activity to send a cancellation email. 

To test this functionality, run your `cancel-subscription` script. You should see that the cancellation happens immediately when the Signal is received.

You will will now send a Signal and Query.

## Send commands to Workflows

Now, you will send your Signal from the Temporal [Client](https://docs.temporal.io/evaluate/development-features/temporal-client?_gl=1*143hp81*_gcl_au*MjEwNDA1NDEzLjE3MTM5ODYzOTk.*_ga*NDgwNzM3ODk0LjE3MDI0MDE5ODg.*_ga_R90Q9SJD3D*MTcyMDY0MTU1Ny4yOTguMC4xNzIwNjQxNTU3LjAuMC4w). A Temporal Client is a component available in each Temporal SDK that provides a set of APIs to communicate with a Temporal Service. You can use a Temporal Client in your application to perform various operations such as:
  - Start a subscription trial.
  - List ongoing subscription trials.
  - Query the state of a customer's subscription details.
  - Send information to a running subscription trial (such as cancellation requests).

First, you need to obtain a handle to the running Workflow Execution. The [`getHandle`](https://typescript.temporal.io/api/classes/client.WorkflowClient#gethandle) method is used to obtain a reference, or a "handle", to a specific Workflow Execution. This handle allows you to interact with the Workflow, including sending it Signals.

Start by initiating the Workflow Execution and getting the handle:

<!--SNIPSTART subscription-ts-cancel-subscription-signal {"selectedLines": ["10-18"]}-->

[src/scripts/cancel-subscription.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/scripts/cancel-subscription.ts)

```ts
// ...
const subscriptionWorkflowExecution = await client.workflow.start(
  subscriptionWorkflow,
  {
    args: [customer],
    taskQueue: TASK_QUEUE_NAME,
    workflowId: `subscription-${customer.id}`,
  }
);
const handle = await client.workflow.getHandle(`subscription-${customer.id}`);
```

<!--SNIPEND-->

In the above example, the `handle` variable is now set to the Workflow instance of `subscription-${customer.id}`, defined in the Client when you start the Workflow Execution.

Next, use the handle to send the `cancelSubscription` Signal to the Workflow, instructing it to cancel the subscription:

<!--SNIPSTART subscription-ts-cancel-subscription-signal {"selectedLines": ["20-25"]}-->

[src/scripts/cancel-subscription.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/scripts/cancel-subscription.ts)

```ts
// ...
try {
  await handle.signal(cancelSubscription);
} catch (err: any) {
  if (err.details) console.error(err.details);
  else console.error(err);
}
```

<!--SNIPEND-->

In this code, the Client sends the `cancelSubscription` Signal to the `subscription-${customer.id}` Workflow instance. The Workflow will then handle the Signal accordingly.

You now know how to obtain a handle on a Workflow Execution and send a Signal to it through the Client, enabling dynamic interaction with your running business processes.

## Retrieve details from Workflows

You can also send a Query through the Client to retrieve information from a running or completed Workflow. The SDK provides the `WorkflowHandle.query` method to query a running or completed Workflow, allowing us to access details of the `subscriptionWorkflow`, without interrupting its execution.

Here’s an example of how to use the `WorkflowHandle.query` method:

<!--SNIPSTART subscription-ts-querybillinginfo-query {"selectedLines": ["11-18", "25-34"]}-->

[src/scripts/query-billinginfo.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/scripts/query-billinginfo.ts)

```ts
// ...
const subscriptionWorkflowExecution = await client.workflow.start(
  subscriptionWorkflow,
  {
    args: [customer],
    taskQueue: TASK_QUEUE_NAME,
    workflowId: `subscription-${customer.id}`,
  }
);
// ...
const billingPeriodNumber = await subscriptionWorkflowExecution.query<number>(
  "billingPeriodNumber"
);
const totalChargedAmount = await subscriptionWorkflowExecution.query<number>(
  "totalChargedAmount"
);

console.log("Workflow Id", subscriptionWorkflowExecution.workflowId);
console.log("Billing Period", billingPeriodNumber);
console.log("Total Charged Amount", totalChargedAmount);
```

<!--SNIPEND-->

In the above code, the `WorkflowHandle.query` method is used to request the `billingPeriodNumber` and `totalChargedAmount` from the running Workflow Execution. The results are then printed to the console, providing insight into the Workflow's current state or final details without affecting its ongoing processes.

## Conclusion

By using Temporal, you were able to build a fault-tolerant subscription Workflow that manages complex state transitions and interactions with external services. Temporal's durable execution and automatic state persistence ensured that your Workflow could reliably handle user sign-ups, trial periods, billing cycles, and cancellations, even in the face of failures or interruptions. 

The ability to send Signals and Queries allowed for dynamic interaction with running Workflows, making real-time updates and state retrieval straightforward and easily maintainable. With Temporal, you can simplify the management of long-running business processes, and create scalable and fault-tolerant applications.
