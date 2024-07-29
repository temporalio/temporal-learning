---
id: subscription-tutorial
sidebar_position: 3
keywords: [TypeScript, temporal, sdk, tutorial, entity workflow]
tags: [TypeScript, SDK]
last_update:
  date: 2024-07-24
title: Build a Recurring Billing Subscription Workflow with TypeScript
description: Implement a subscription application using Temporal's Workflows, Activities, Signals, and Queries, enabling the payment workflow to be canceled or modified during execution.
image: /img/temporal-logo-twitter-card.png
---

![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)

## Introduction

Managing subscription-based services requires precision and fault tolerance at every step. You need to reliably handle processes like user sign-ups, trial periods, billing cycles, and cancellations. This often involves making durable calls to external services such as databases, email servers, and payment gateways. These interactions need to be fault-tolerant to prevent data loss, ensure seamless user experiences, and support the integrity of your subscription management system, regardless of any failures or network issues.

In this tutorial, you'll build the backend processes of a phone subscription management application using TypeScript. You'll handle the entire subscription lifecycle, from welcoming new users to managing billing and cancellations through command-line programs. You will not be building a web app or API; instead, your focus will be on interacting with Temporal through command-line scripts that you will develop. While using command-line scripts for this tutorial simplifies the demonstration, note that in a real-world scenario, you would likely build a web interface or API to manage these interactions.

To achieve this, you will leverage Temporal, an open source platform that ensures the successful completion of long-running processes despite failures or network issues. Temporal provides fault tolerance by automatically retrying failed tasks, and ensures durability by persisting Workflow states, allowing them to resume from the last known state after a failure like a power outage. It offers scalability to handle high volumes of Workflows concurrently, making it ideal for cases like the subscription service that may have thousands of customers.

You'll find the code for this tutorial on GitHub in the [subscription-workflow-project-template-typescript](https://github.com/temporalio/subscription-workflow-project-template-typescript) repository.

## Prerequisites

- [Set up a local development environment for Temporal and TypeScript](https://learn.temporal.io/getting_started/typescript/dev_environment/).
- Complete the [Hello World](https://learn.temporal.io/getting_started/typescript/hello_world_in_typescript/) tutorial to ensure you understand the basics of creating Workflows and Activities with Temporal.

## Create your project

In a terminal, create a new project directory called `subscription-workflow-with-temporal`:

```command
mkdir subscription-workflow-with-temporal
```

Switch to the new directory:

```command
cd subscription-workflow-with-temporal
```

Firstly, you will install the `@tsconfig/node20` package as a developer dependency. You'll use this for configuring your TypeScript project to target Node.js 20 features and settings.

```command
npm install --save-dev @tsconfig/node20
```

Next, install [Nodemon](https://nodemon.io/) which you'll use to watch your files for changes:

```command
npm install --save-dev nodemon
```

The last step you need in your `devDependencies` is `ts-node`:

```command
npm install --save-dev ts-node
```

You'll also want to configure TypeScript to compile:

```command
touch tsconfig.json
```

Add the following configuration to the `tsconfig.json` file:

```json
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
  "exclude": ["node_modules"]
}
```

With the dependencies installed, you can now add Temporal to your project.

In the root directory of your project, execute the following command to install Temporal and its dependencies:

```command
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```

Your Temporal dependencies should now be in your `package.json`:

```json
"dependencies": {
  "@temporalio/activity": "^1.10.0",
  "@temporalio/client": "^1.10.0",
  "@temporalio/worker": "^1.10.0",
  "@temporalio/workflow": "^1.10.0",
}
```

These are the packages that compose the Temporal TypeScript SDK, and each package maps to some parts of a Temporal application: an Activity, Worker, Client, and Workflow. You will explore each part of this subscription, and how they work together to create a fault-tolerant subscription application. Temporal doesn't require that you use a specific folder structure, but to keep things organized, you'll create a `src` folder for your code that holds the subscription logic.

```command
mkdir -p src
```

Within the `src` folder, you will add the files that hold and run the subscription logic:

```command
touch src/worker.ts src/workflows.ts src/activities.ts
```

You also want to create some script files to cancel a subscription, execute a Workflow, query your Workflow for billing information, and update the charge amount. You will create these as Temporal Clients. The Temporal Client communicates with the Temporal Service to start a Workflow, send data to a Workflow, and more.

```command
mkdir src/scripts
```

You will now add the script files within the `scripts` folder you just created:

```command
touch src/scripts/cancel-subscription.ts src/scripts/execute-workflow.ts src/scripts/query-billinginfo.ts src/scripts/update-chargeamt.ts
```

Now that you know which directory will hold your Temporal files, you can set up some scripts to run in your application. In your `package.json` file, create a scripts section:

```json
"scripts": {
  "start": "ts-node src/worker.ts",
  "start.watch": "nodemon src/worker.ts",
  "workflow": "ts-node src/scripts/execute-workflow.ts",
  "querybillinginfo": "ts-node src/scripts/query-billinginfo.ts",
  "cancelsubscription": "ts-node src/scripts/cancel-subscription.ts",
  "updatechargeamount": "ts-node src/scripts/update-chargeamt.ts"
}
```

Review the scripts. By prefixing any of the scripts with `npm run`, you will be able to run your application, query for subscription details, cancel your subscription, and update your charge amount. Save your file.

Your project workspace is now configured, so you're ready to start creating your application.

## Define your customer

The first step you will take in creating your application is defining your customer information that you need when signing a customer up for a subscription. Although a function in Temporal - known as a Workflow - can have multiple parameters, you should use a single object for parameters and return types. This approach allows you to change fields without breaking Workflow compatibility. You'll begin by defining the data object that defines the customer used by the Temporal Workflow.

To set up the object, create a new file called `shared.ts` in your `src` folder:

```command
touch src/shared.ts
```

This file will hold some constants you'll use in the application.

The first constant will be a `Customer` object that represents the data you'll send to your Workflow. The `Customer` object will have the following fields:

- `firstName`: A string used to pass in the user's first name.
- `lastName`: A string used to pass in the user's last name.
- `email`: A string used to pass in the user's email address.
- `id`: A string that uniquely identifies the customer.
- `subscription`: Another object with several keys that have information about the user's subscription such as:
  - `trialPeriod`: A number that defines the length of the user's trial period in seconds.
  - `billingPeriod`: A number that defines the interval between billing cycles in seconds.
  - `maxBillingPeriods`: A number that defines the maximum number of billing cycles before the subscription ends.
  - `initialBillingPeriodCharge`: A number that defines the initial charge amount for the first billing period.

Your `shared.ts` file will also include a [Task Queue](https://docs.temporal.io/workers#task-queue) name. The Task Queue helps route tasks to the appropriate [Worker](https://docs.temporal.io/workers#worker), a program that executes Temporal tasks. When you start a Workflow in Temporal, tasks get placed into the Task Queue. Workers continuously poll this queue for tasks and execute them. The Workflow doesn't proceed until a Worker picks up and processes the Workflow Task from the Task Queue.

Add the following code in your `shared.ts` file:

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

Now that you have your `Customer` object and Task Queue defined, you can move on to writing some subscription logic.

## Define external interactions

You will now define the functions that handle interactions with external systems. These functions are called [Activities](https://docs.temporal.io/activities).

Activities are the building blocks of a Temporal Workflow. They encapsulate the logic for tasks that interact with external services such as querying a database or calling a third-party API. One of the key benefits of using Activities is their built-in fault tolerance. If an Activity fails, Temporal can automatically retry it until it succeeds or reaches a specified retry limit. This ensures that transient issues, like network glitches or temporary service outages, don't result in data loss or incomplete processes.

For this tutorial, you'll define Activities for tasks like charging customers and sending emails, which typically interact with external services. To keep things focused on the Workflow logic, you will stub these Activities out with basic `log` statements.

First, create the function that sends the Welcome email. Add the following code to `src/activities.ts`:

<!--SNIPSTART subscription-ts-activities {"selectedLines": ["1-7"]}-->
[src/activities.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/activities.ts)
```ts
import { log } from "@temporalio/activity";

import { Customer } from "./shared";

export async function sendWelcomeEmail(customer: Customer) {
  log.info(`Sending welcome email to ${customer.email}`);
}
```
<!--SNIPEND-->

As you can see, an Activity in Temporal is just like writing your typical TypeScript function. This function doesn't actually send an email, it prints a message instead. In a real-world application, you'd place the logic to send the message here.

The Temporal SDK also provides plenty of packages like a logging package which makes it easier to follow your code's execution path at runtime.

Next, you will add a few more functions that sends e-mails that do the following:
- Send a cancellation e-mail during the trial period.
- Send a notification to the customer, letting the customer know that he or she will be charged for the billing period.
- Send a cancellation e-mail during an active subscription.
- If the subscription period is over and not cancelled, send the customer a notification to buy a new subscription.

These functions are nearly identical:

<!--SNIPSTART subscription-ts-activities {"selectedLines": ["8-28"]}-->
[src/activities.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/activities.ts)
```ts
// ...
export async function sendCancellationEmailDuringTrialPeriod(
  customer: Customer
) {
  log.info(`Sending trial cancellation email to ${customer.email}`);
}
export async function chargeCustomerForBillingPeriod(
  customer: Customer,
  chargeAmount: number
) {
  log.info(
    `Charging ${customer.email} amount ${chargeAmount} for their billing period`
  );
}
export async function sendSubscriptionFinishedEmail(
  customer: Customer
) {
  log.info(`Sending subscription completed email to ${customer.email}`);
}
export async function sendSubscriptionOverEmail(customer: Customer) {
  log.info(`Sending subscription over email to ${customer.email}`);
}
```
<!--SNIPEND-->

You will now take these encapsulated functions that defines the external interactions and will incorporate them into the subscription Workflow.

## Define your application logic

Now that you have your functions that can interact with external services, you'll build a Temporal Workflow to use those functions to build your application's business logic. This is where a Workflow comes in.

A Workflow is a sequence of steps defined by writing code, known as a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition). These steps are executed as a [Workflow Execution](https://docs.temporal.io/workflows#workflow-execution).

A Workflow Definition is essentially a function, which can store state and orchestrates the execution of Activities. Workflows manage the coordination and logic of your application's processes, while Activities perform the tasks which interact with external services.

As mentioned, the Workflow will orchestrate the sequence of Activities such as sending welcome emails, charging customers, and handling cancellations.

You will write your Workflow Definition that orchestrates the subscription logic, defined as `subscriptionWorkflow`, in the `workflows.ts` file that you created. The requirements of this Workflow Definition are the following:

1. **User Signup and Free Trial**: When the user signs up, send a welcome email and start a free trial for the duration defined by `trialPeriod`.
2. **Cancellation During Trial**: If the user cancels during the trial period, send a trial cancellation email and complete the Workflow.
3. **Billing Process**:
   - If the trial period expires without cancellation, start the billing process.
   - As long as the number of billing periods doesn't exceed `maxBillingPeriods`:
    - Charge the customer the amount defined by `billingPeriodChargeAmount`.
    - Wait for the next `billingPeriod`.
  - If the customer cancels during a billing period, **send a subscription cancellation email**.
  - If the subscription ends normally (exceeding `maxBillingPeriods` without cancellation), send a subscription ended email and complete the Workflow.
4. **Dynamic Updates**: At any point while subscriptions are ongoing, be able to:
  - Cancel a subscription.
  - Look up and the amount charged on a customer's account so far.
  - Change any customer billing amount.

You'll start by adding in your imports and bringing in your Activities:

```ts
import {
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
});
```

Using `proxyActivities`, imported from the Temporal TypeScript SDK, you can create a proxy object that allows users to call the Activity from within the Workflow as if it's a local function. For example, when you call the `sendWelcomeEmail` Activity now, you aren't calling the Activity directly. You are calling the proxy, which takes care of executing the Activity, managing automatic retries and other configurations you have made with the Activity. This abstraction allows the developer to focus on business logic without having to worry about the intricacies of distributed computing such as retries. You used `startToCloseTimeout` here to indicate the maximum time it should take for an Activity to execute, including retries. There are [other retry configurations](https://docs.temporal.io/develop/typescript/failure-detection#activity-timeouts) that you can add to your proxy object.

Now that you have configured retries with your Activities, you can move onto writing the `subscriptionWorkflow`. The `subscriptionWorkflow` needs to include the following steps:

1. Check if the subscription was canceled during the trial period. If so, you want to call your `sendCancellationEmailDuringTrialPeriod` Activity.

2. If the subscription wasn't canceled during the trial period, you want to start billing the customer until you reach the max billing periods or the subscription is cancelled.

3. If the subscription is cancelled or the billing period is complete during this time, you want to call your `sendSubscriptionFinishedEmail` Activity.

4. Finally, if the subscription period is over and not canceled, notify the customer to buy a new subscription by calling the `sendSubscriptionOverEmail` Activity. Then return with a statement letting the subscription owner know that particular Workflow Execution is complete, and the total amount charged.

Add the following code to your `subscriptionWorkflow` definition:

```ts
export async function subscriptionWorkflow(
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
    return `Subscription finished for: ${customer.id}`;
  } else {
    // Trial period is over, start billing until we reach the max billing periods or subscription is cancelled
    while (true) {
      if (billingPeriodNumber > customer.subscription.maxBillingPeriods) break;

      if (subscriptionCancelled) {
        await sendSubscriptionFinishedEmail(customer);
        return `Subscription finished for: ${customer.id}, Total Charged: ${totalCharged}`;
      }

      log.info(`Charging ${customer.id} amount ${billingPeriodChargeAmount}`);

      await chargeCustomerForBillingPeriod(customer, billingPeriodChargeAmount);
      totalCharged += billingPeriodChargeAmount;
      billingPeriodNumber++;

      // Wait for the next billing period or until the subscription is cancelled
      await sleep(customer.subscription.billingPeriod);
    }

    // If the subscription period is over and not cancelled, notify the customer to buy a new subscription
    await sendSubscriptionOverEmail(customer);
    return `Completed ${
      workflowInfo().workflowId
    }, Total Charged: ${totalCharged}`;
  }
}
```

Notice that in the code, you are using the [`sleep`](https://typescript.temporal.io/api/namespaces/workflow#sleep) function for the first time.

The `sleep` function is a powerful **durable Timer** provided by Temporal. When you call `sleep` in a Workflow, the Temporal Server persists the sleep details in its database. This ensures that the Workflow can resume accurately after the specified duration, even if the Temporal Server or Worker experiences downtime.

:::note Production Consideration: Managing Long-Running Workflows
There may be a possibility of a large value for `maxBillingPeriods`. In production code, Temporal recommends using the [`continue-as-new`](https://docs.temporal.io/workflows#continue-as-new) feature to manage long-running Workflows and prevent excessively large [Event Histories](https://docs.temporal.io/workflows#event-history). This helps maintain performance and reliability. You can learn more about Event History in Temporal's free course: [Temporal 102](https://learn.temporal.io/courses/temporal_102/).
:::

Now that you have your subscription Workflow, you will now run it.

## Run the subscription Workflow

The first step to run anything in Temporal is to make sure you have a local Temporal Service running. Open a separate terminal window and start the service with `temporal server start-dev`.

As you will see in the command line output, your Temporal Server should now be running on `http://localhost:8233`. When you first access this server, you should see zero Workflows running.

The next step is to define your Worker program in `worker.ts`.

Recall that when you start a Workflow in Temporal, it places tasks into the Task Queue. Workers continuously poll this queue for tasks and execute them. Add the Worker program in `worker.ts`:

<!--SNIPSTART subscription-ts-worker-start {"selectedLines": ["1-26"]}-->
[src/worker.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/worker.ts)
```ts
import { TASK_QUEUE_NAME } from "./shared";
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

  // Step 2: Start accepting tasks on the `subscriptions-task-queue` queue
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```
<!--SNIPEND-->

First, you register the Workflows and Activities with the Worker program.
Then, you start accepting the tasks that will route to the Task Queue that your Worker is registered with, which is `subscriptions-task-queue` defined in the `shared.ts` file.

Run the Worker now with the script defined in `package.json` to run your `worker.ts` file and make sure that everything builds and there are no errors. You should run the Worker Program with a new terminal window:

```command
npm run start
```

You should now see your Worker program running. However, note that if you change your Workflow Definition while the Worker is running, you need to restart the Worker process. To prevent this, exit your current Worker program with CTRL+C and run the Worker program using `nodemon` instead to automatically watch for changes:

```command
npm run start.watch
```

However, while the Worker runs, it won't have any tasks to perform because you haven't started a Workflow yet. This is where the [Temporal Client](https://docs.temporal.io/evaluate/development-production-features/temporal-client) will come in. Recall that a Temporal Client is a part available in each Temporal SDK that provides a set of APIs to communicate with a Temporal Service. You can use a Temporal Client in your application to perform various operations such as:
  - Start a subscription trial.
  - List ongoing subscription trials.
  - Query the state of a customer's subscription details.
  - Send information to a running subscription trial (such as cancellation requests).

You will create your Client to start your `subscriptionWorkflow` in `execute-workflow.ts`. Start by adding your import statements first:

```ts
import { Connection, Client } from "@temporalio/client";
import { subscriptionWorkflow } from "../workflows";
import { Customer, TASK_QUEUE_NAME } from "../shared";
```

You first import the Client package from the Temporal SDK and the [Connection](https://typescript.temporal.io/api/classes/client.Connection?_gl=1*ec5epl*_gcl_au*NjgyMzM0NzYwLjE3MjE3Njc1Nzg.*_ga*NDgwNzM3ODk0LjE3MDI0MDE5ODg.*_ga_R90Q9SJD3D*MTcyMTc4NDkxMy4zNDQuMS4xNzIxNzg1ODcyLjAuMC4w) class which allows you to connect your Client to the Temporal Server. You also want to import your `subscriptionWorkflow`, which you will have the Client start, and the Task Queue that the Client will dispatch the Workflow task on. The Worker program that you started in `worker.ts` is currently listening to the same Task Queue for any tasks to perform.

You also want to create your first customer that you will use as an argument to supply to your `subscriptionWorkflow`. After your import statements in `execute-workflow.ts`, add an object that will represent your first customer:

```ts
const cust = {
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
};
```

Next, add the following code after your `cust` object:

```ts
async function run() {
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
});
```

You begin by making a connection to the Temporal Service. The `client.workflow.start` call sends a request to the Temporal Service to start a Workflow Execution with the customer information, a `workflowId`, and dispatches the task to `subscriptions-task-queue`. Make sure that your changes are saved and run your Client code in a new terminal window:

```command
npm run workflow
```

Once you use the command to start the Workflow, the Worker which polls the same Task Queue that the `subscriptionWorkflow` was dispatched to, picks up the task and executes it. Over on your Temporal Service, you can see that the Workflow Execution completed successfully. If you click on `SubscriptionWorkflowId-1`, your Workflow ID, you will see the result of your Workflow Execution: `Completed SubscriptionsWorkflowId-1, Total Charged: 360`. This log of events that you see is known as an [Event History](https://docs.temporal.io/workflows#event-history).

The Event History is a detailed log of events that occur during the lifecycle of a Workflow Execution, such as the Workflow Tasks, as well as tasks related to Activities. It is durably persisted by the Temporal Service and enables state reconstruction, fault tolerance, and recovery by replaying events to regenerate the Workflow's state.

You are sure to have more than one customer, and you don't want to create a new Temporal Client for each customer, so it makes more sense to have an array of customers. Remove the `cust` object in `execute-workflow.ts` and replace it with a `custArray` like so:

```ts
const custArray: Customer[] = [1, 2, 3, 4, 5].map((i) => ({
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
}));
```

The Client code can be modified so that it loops through the `custArray` of customers and dispatches an instance of the Workflow Execution for each customer. Modify your Client code to replace everything under `custArray` with the following:

```ts
async function run() {
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
        return `Workflow failed for: ${cust.id}`;
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
});
```

Save your file and run your Workflow again with `npm run workflow`. This time, after a brief pause due to the Timer in the Workflow Definition, you will see on your Temporal Service five more instances of the Subscription Workflow.

Also, notice in the command-line window that your Worker is running, the Activity logs are being output: `Sending welcome email to email-1@customer.com`, `Charging email-1@customer.com amount 130 for their billing period`, and the other logs.

Now that you know how to run your `subscriptionWorkflow`, you will look into how to query your Workflow to retrieve information such as the billing period and the total amount charged. This allows you to interact with the Workflow while it's running and get real-time updates on its status and progress.

## Retrieve subscription details

A [Query](https://docs.temporal.io/encyclopedia/application-message-passing#queries) is a synchronous operation that's used to get the state or other details of a Workflow Execution without impacting its execution. Queries are typically used to access the state of an active Workflow Execution, but they can also be applied to closed Workflow Executions.

In this section, you will use Queries to allow users to obtain information about their subscription details.

The first step is to add a new Query definition to the `subscriptionWorkflow` Workflow. To define a Query in the Workflow, you will need to use the [`defineQuery`](https://typescript.temporal.io/api/namespaces/workflow/#definequery) method provided by the Temporal TypeScript API. This function returns a `QueryDefinition` object, which carries the Query's signature: the Query Type (a unique name used to identify the Query), the input parameters types, and the Query's return type.

Open the `workflows.ts` file, and add `defineQuery` to your list of imports from `@temporalio/workflow`. Then, add a few Query definitions to above the Workflow Definition:

```ts
export const customerIdNameQuery = defineQuery<string>("customerIdName");
export const billingPeriodNumberQuery = defineQuery<number>(
  "billingPeriodNumber"
);
export const totalChargedAmountQuery =
  defineQuery<number>("totalChargedAmount");
```

These Queries provide:

- `customerIdNameQuery` returns a string value.
- `billingPeriodNumberQuery` returns a number value.
- `totalChargedAmountQuery` returns a number value.

After defining a Query, the next step is to establish how the Workflow handles incoming Queries. This is where Query handlers come into play - they specify the actions a Workflow should take upon receiving a Query. Queries should be read-only and must not include logic that causes Command generation, such as executing Activities.

Use the [`setHandler`](https://typescript.temporal.io/api/namespaces/workflow/#sethandler) function provided by the Temporal TypeScript SDK API. This function associates each Query with its corresponding handler logic.

Within the `workflows.ts` file, add `setHandler` to your list of imports from `@temporalio/workflow`.

Then, within your `subscriptionWorkflow` Workflow right before you call the `sendWelcomeEmail` Activity, use `setHandler` to handle your Queries as follows:

```ts
  setHandler(customerIdNameQuery, () => customer.id);
  setHandler(billingPeriodNumberQuery, () => billingPeriodNumber);
  setHandler(totalChargedAmountQuery, () => totalCharged);
```
<!--SNIPEND-->

These Query handlers return subscription details such as the customer Id, billing period number, and total charged amount. With these handlers in place, you can now retrieve details about the subscription without affecting the ongoing Workflow Execution.

Queries can also be used after the Workflow completes, which is useful if a user unsubscribes but still wants to retrieve information about their subscription.

Now that you've added the ability to query your Workflow, it's time to configure your Workflow Definition so that it may respond to external stimuli such as cancellations or price updates.

## Cancel your subscription and update billing charge amount

A Signal is an asynchronous message sent to a running Workflow Execution, allowing you to change its state and control its flow. For example, in a subscription Workflow, you can send a Signal to change the subscription period. Note that a Signal can only deliver data to a Workflow Execution that hasn't already closed.

Just like you did with your Queries, you need to both define and handle Signals within the Workflow Definition. You will use the [`defineSignal`](https://typescript.temporal.io/api/namespaces/workflow#definesignal) method provided by the Temporal TypeScript API for this purpose. This method creates a Signal Definition object that includes the Signal's name and the input parameter types.

Like you did with your Queries, add `defineSignal` to your list of imports from `@temporalio/workflow`, and add the following Signal definitions to your `workflows.ts` file preceding the Workflow Definition:

```ts
export const cancelSubscription = defineSignal("cancelSubscription");
export const updateBillingChargeAmount = defineSignal<[number]>(
  "updateBillingChargeAmount"
);
```
<!--SNIPEND-->

This code defines two Signals:

1. `cancelSubscription`: A Signal with no input parameters, used to cancel the subscription.
2. `updateBillingChargeAmount`: A Signal that takes a single parameter of type number, used to update the billing charge amount.

However, like Queries, just defining a Signal is the first step. You also need to let the Workflow know what to do when it receives a Signal of that type. This is done using a Signal Handler, which is a function within the Workflow that listens for incoming Signals of a specified type and defines the Workflow's response.

In order to implement a Signal handler, recall that the [`setHandler`](https://typescript.temporal.io/api/namespaces/workflow/#sethandler) function associates each Signal with its corresponding handler logic.

Within the `workflows.ts` file and within the `subscriptionWorkflow` Workflow Definition, implement the Signal handlers as shown:

```ts
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

1. When the `subscriptionWorkflow` Execution is running and it receives the `cancelSubscription` Signal, the corresponding handler function sets `subscriptionCancelled` to `true`. When the Workflow logic detects this flag change, it cancels the subscription.
2. Similarly, when the `updateBillingChargeAmount` Signal is received, the handler updates `billingPeriodChargeAmount` to the new value provided by the Client. This mechanism allows the Workflow to dynamically respond to external events without interrupting its execution flow.

You now know when to use a Signal and Query, as well as how to define and handle them in your Workflow Definition. In the following section, you will defer your Signal. You will wait for either the `subscriptionCancelled` Signal to be sent or for the billing period to expire before sending a cancellation email during the subscription.

## Wait for user input to continue or cancel your subscription

Often, you may want to pause the Workflow Execution until a specific Signal is received or a certain condition is met. For example, in the `subscriptiptionWorkflow`, you might want to wait for the `subscriptionCancelled` Signal before invoking the `sendCancellationEmailDuringTrialPeriod` Activity.

The Temporal SDK provides the [`condition`](https://typescript.temporal.io/api/namespaces/workflow#condition) method for this purpose. The `condition` method allows you to determine the execution path of the Workflow until a specified condition is satisfied or a timeout is reached.

The `condition` method takes two arguments:

- Condition Function: A function that returns a boolean value.
- Timeout: The maximum time to wait for the condition to become true.

It returns a Promise that resolves when the condition function returns true or when the timeout period expires.

Add `condition` in your list of imports from `@temporalio/workflow`.

You will now modify your Workflow Execution code to wait for the subscription to be canceled or for a trial period timeout to elapse. Remove the following:

```ts
// Check if the subscription was cancelled during the trial period
if (subscriptionCancelled) {
  await sendCancellationEmailDuringTrialPeriod(customer);
  return `Subscription finished for: ${customer.id}`;
} else {
  // Trial period is over, start billing until we reach the max billing periods or subscription is cancelled
  while (true) {
    if (billingPeriodNumber > customer.subscription.maxBillingPeriods) break;

    if (subscriptionCancelled) {
      await sendSubscriptionFinishedEmail(customer);
      return `Subscription finished for: ${customer.id}, Total Charged: ${totalCharged}`;
    }

    log.info(`Charging ${customer.id} amount ${billingPeriodChargeAmount}`);

    await chargeCustomerForBillingPeriod(customer, billingPeriodChargeAmount);
    totalCharged += billingPeriodChargeAmount;
    billingPeriodNumber++;

    // Wait for the next billing period or until the subscription is cancelled
    await sleep(customer.subscription.billingPeriod);
  }

  // If the subscription period is over and not cancelled, notify the customer to buy a new subscription
  await sendSubscriptionOverEmail(customer);
  return `Completed ${
    workflowInfo().workflowId
  }, Total Charged: ${totalCharged}`;
}
```

And replace it with:

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["60-94"]}-->
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
} else {
  // Trial period is over, start billing until we reach the max billing periods for the subscription or subscription has been cancelled
  while (true) {
    if (billingPeriodNumber > customer.subscription.maxBillingPeriods) break;

    if (subscriptionCancelled) {
      await sendSubscriptionFinishedEmail(customer);
      return `Subscription finished for: ${customer.id}, Total Charged: ${totalCharged}`;
    }

    log.info(`Charging ${customer.id} amount ${billingPeriodChargeAmount}`);

    await chargeCustomerForBillingPeriod(customer, billingPeriodChargeAmount);
    totalCharged += billingPeriodChargeAmount;
    billingPeriodNumber++;

    // Wait for the next billing period or until the subscription is cancelled
    await sleep(customer.subscription.billingPeriod);
  }

  // If the subscription period is over and not cancelled, notify the customer to buy a new subscription
  await sendSubscriptionOverEmail(customer);
  return `Completed ${
    workflowInfo().workflowId
  }, Total Charged: ${totalCharged}`;
}
```
<!--SNIPEND-->

In the code, the `condition` method pauses the Workflow until either the `subscriptionCancelled` flag is true (meaning a `cancelSubscription` Signal was received) or the trial period expires. Once the condition is met, the Workflow invokes the Activity to send a cancellation email.

In the loop that iterates through the billing period, the loop checks constantly as well for the `subscriptionCancelled` flag to be `true`.

You will now send a Signal and Query to cancel the subscription and retrieve the subscription details.

## Cancel an ongoing subscription

Next you'll cancel the subscription using a Signal, and use a Query to get the subscription details. To do this, you will send your `cancelSubscription` Signal from the Temporal Client.

Since this Client code will focus on canceling an ongoing subscription, in the `cancel-subscription.ts` file, first define your customer object:

```ts
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
};
```

Then bring in some boilerplate Client code:

```ts
import { Connection, Client } from "@temporalio/client";
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
      workflowId: `subscription-${customer.id}`,
    }
  );
  console.log(await subscriptionWorkflowExecution.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Right now, running the above Client code will execute the `subscriptionWorkflow` again. No Signal was sent. To send the cancellation Signal, add the `cancelSubscription` Signal into your list of imports from your Workflows file:

```ts
import { subscriptionWorkflow, cancelSubscription } from "../workflows";
```

Next, to send the Signal, you need to obtain the handle of the running Workflow Execution to direct the Signal towards. The [`getHandle`](https://typescript.temporal.io/api/classes/client.WorkflowClient#gethandle) method is used to obtain a reference, or a handle, to a specific Workflow Execution. This handle allows you to interact with a specific Workflow instance, including sending it Signals.

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

In the example, the `handle` variable is now set to the Workflow instance of `subscription-${customer.id}`, defined in the Client when you start the Workflow Execution.

Next, use the handle to send the `cancelSubscription` Signal to the Workflow, instructing it to cancel the subscription:

```ts
const handle = await client.workflow.getHandle(`subscription-${customer.id}`);
await handle.signal(cancelSubscription);
```

In this code, the Client sends the `cancelSubscription` Signal to the `subscription-${customer.id}` Workflow instance. The Workflow will then handle the Signal according to the logic defined in the `setHandler` function for `cancelSubscription`.

To send this Signal, save your updated Client code, make sure your Worker program is running, and send the command:

```command
npm run cancelsubscription
```

You should see in the command-line output: "Completed subscription-ABC123, Total Charged: 1200".

To reinforce the idea of Signals, you will send another Signal to update the charge amount now.

## Update the charge amount

You'll send another Signal to update the charge amount. Similar to the canceling subscription section, bring in your boilerplate Client code and customer object into `update-chargeamt.ts`:

```ts
import { Connection, Client } from "@temporalio/client";
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
      workflowId: `subscription-${customer.id}`,
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
};
```

To send the cancellation Signal, add the `updateBillingChargeAmount` Signal into your list of imports from your Workflows file:

```ts
import { subscriptionWorkflow, updateBillingChargeAmount } from "../workflows";
```

Retrieve the handle of your `subscriptionWorkflow` and send the `updateBillingChargeAmount` Signal to the handle:

```ts
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
      workflowId: `subscription-${customer.id}`,
    }
  );
  const handle = await client.workflow.getHandle(`subscription-${customer.id}`);

  // Signal workflow and update charge amount to 300 for next billing period
  try {
    await handle.signal(updateBillingChargeAmount, 300);
    console.log(
      `subscription-${customer.id} updating BillingPeriodChargeAmount to 300`
    );
  } catch (err) {
    console.error("Cant signal workflow", err);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

To send this Signal, save your updated Client code, make sure your Worker program is running, and send the command:

```command
npm run updatechargeamount
```

You should see in the command-line output: "updating BillingPeriodChargeAmount to 300."

You now know how to obtain a handle on a Workflow Execution and send a Signal to it through the Client, enabling dynamic interaction with your running business processes.

## Retrieve billing period and total charged details

You will now retrieve details about the billing period and total amount charged. You have already defined and handled your Query. You will now send a Query through the Client to retrieve information from a running or completed Workflow. The SDK provides the `WorkflowHandle.query` method to query a running or completed Workflow, allowing you to access details of the `subscriptionWorkflow`, without interrupting its execution.

Since this Client code will focus on querying the billing info, in the `query-billinginfo.ts` file, first reuse the customer object:

```ts
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
};
```

Then bring in your boilerplate Client code:

```ts
import { Connection, Client } from "@temporalio/client";
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
      workflowId: `subscription-${customer.id}`,
    }
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

After the code where the `subscriptionWorkflow` is started, you can iterate through five billing periods and use the `WorkflowHandle.query` method for the `billingPeriodNumber` and `totalChargedAmount`:

<!--SNIPSTART subscription-ts-querybillinginfo-query {"selectedLines": ["20-41"]}-->
[src/scripts/query-billinginfo.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/scripts/query-billinginfo.ts)
```ts
// ...
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
        `Error querying workflow with ID ${subscriptionWorkflowExecution.workflowId}:`,
        err
      );
    }
  }
```
<!--SNIPEND-->

After the `WorkflowHandle.query` method is used to request the `billingPeriodNumber` and `totalChargedAmount` from the running Workflow Execution, the results are then printed to the console. The results give insight into the Workflow's current state or final details without affecting its ongoing processes.

To send the Queries, save your updated Client code, make sure your Worker program is running, and send the command:

```command
npm run querybillinginfo
```

You should see the Workflow Id, the billing period, and the total charged amount in the command-line output.

You now know how to obtain a handle on a Workflow Execution and send a Query to it through the Client, enabling dynamic interaction with your running business processes.

## Conclusion

By using Temporal, you were able to build a fault-tolerant subscription Workflow that manages complex state transitions and interactions with external services. Temporal's durable execution and automatic state persistence ensured that your Workflow could reliably handle user sign-ups, trial periods, billing cycles, and cancellations, even in the face of failures or interruptions.

The ability to send Signals and Queries allowed for dynamic interaction with running Workflows, making real-time updates and state retrieval straightforward and maintainable. With Temporal, you can simplify the management of long-running business processes, and create scalable and fault-tolerant applications.

As a next step, try using [Express.js](https://expressjs.com/) to build an API for your application. The code you used in the command-line scripts can be adapted for your API endpoints, enabling more seamless and user-friendly interactions with your Temporal Workflow Executions.
