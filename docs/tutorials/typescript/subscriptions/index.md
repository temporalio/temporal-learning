---
id: subscription-tutorial
sidebar_position: 3
keywords: [TypeScript, temporal, sdk, tutorial, entity workflow]
tags: [TypeScript, SDK]
last_update:
  date: 2024-06-07
title: Build a subscription workflow with Temporal and TypeScript
description: Implement a subscription application using Temporal's Workflows, Activities, Signals, and Queries, enabling the payment workflow to be canceled or modified during execution.
image: /img/temporal-logo-twitter-card.png
---

![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)

## Introduction

In this tutorial, you'll build a subscription application using Temporal and TypeScript. You'll use Temporal Workflows, Activities, sleep, Signals, and Queries to manage the core subscription logic. By leveraging Temporal's capabilities, you can handle complex subscription scenarios directly within Temporal's environment, reducing the need for external databases or queues. This reduces the complexity of the code you have to write and maintain.

You'll create a Temporal Workflow to simulate a subscription process, including free trial periods, billing cycles, and subscription cancellations. This Workflow can be used to query users' billing information, update billing amounts, and cancel users' subscriptions at any time. These interactions will be managed using Temporal's Signals and Queries, enabling real-time updates to ongoing Workflows. You can view the user's entire process through Temporal's Web UI. 

By the end of this tutorial, you'll have a clear understanding of how to use Temporal to create and manage long-running Workflows.

You'll find the code for this tutorial on GitHub in the [subscription-workflow-project-template-typescript](https://github.com/temporalio/subscription-workflow-project-template-typescript) repository.

## Prerequisites 

- Be familiar on how to [set up a local development environment for Temporal and TypeScript](https://learn.temporal.io/getting_started/typescript/dev_environment/).
- Complete the [Hello World](https://learn.temporal.io/getting_started/typescript/hello_world_in_typescript/) tutorial to ensure you understand the basics of creating Workflows and Activities with Temporal.

## Write the Activities

Let's begin by writing our [Activities](https://docs.temporal.io/dev-guide/typescript/foundations/#develop-activities). These are the functions that will interact with the outside world, such as charging customers and sending emails.

For this tutorial, we'll keep things simple by stubbing out these Activities with basic `console.log` statements. This allows us to focus on the Workflow logic in this tutorial. Here's an excerpt:

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

## Develop the Workflow

A Workflow defines a sequence of steps defined by writing code, known as a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition), and are carried out by running that code, which results in a Workflow Execution.

The Temporal TypeScript SDK recommends the use of a single object for parameters and return types. This lets you change fields without breaking Workflow compatibility. Before writing the Workflow Definition, you'll define the data object used by the Workflow Definition.

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

Add the following code to the `shared.ts` file to define the object, as well as the Task Queue name:

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

Now that you have your `Customer` object defined, you can move on to writing the Workflow Definition. The Workflow will orchestrate the sequence of Activities such as sending welcome emails, charging customers, and handling cancellations.

To create a new Workflow Definition, create a new file called `workflows.ts`. This file will contain the `subscriptionWorkflow` function. The requirements of this Workflow Definition are the following:

1. **User Signup and Free Trial**: When the user signs up, send a welcome email and start a free trial for the duration defined by trialPeriod.
2. **Cancellation During Trial**: If the user cancels during the trial period, send a trial cancellation email and complete the Workflow.
3. **Billing Process**:
   - If the trial period expires without cancellation, start the billing process.
   - As long as the number of billing periods does not exceed  `maxBillingPeriods`:
    - Charge the customer the amount defined by `billingPeriodChargeAmount`.
    - Wait for the next `billingPeriod`.
   - If the customer cancels during a billing period, **send a subscription cancellation email**.
   - If Subscription has ended normally (exceeded `maxBillingPeriods` without cancellation), send a subscription ended email and complete the Workflow.
   - If the subscription ends normally (exceeding `maxBillingPeriods` without cancellation), send a subscription ended email and complete the Workflow.
4. **Dynamic Updates**: At any point while subscriptions are ongoing, be able to:
  - Cancel a subscription
  - Look up and the amount charged on a customer's account so far
  - Change any customer billing amount

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
import { Customer } from "./shared";
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

Now, we will explore how to use Signals and Queries to interact with the Workflow during its execution. 

## Using `sleep`

Notice that in the above code, we are using the [`sleep`](https://typescript.temporal.io/api/namespaces/workflow#sleep) API for the first time.

:::note The importance of deferred execution

`sleep` is a simple yet powerful **durable timer** provided by Temporal. When you call `sleep` in a Workflow, the Temporal Server persists the sleep details in its database. This ensures that the Workflow can be resumed accurately after the specified duration, even if the Temporal Server or Worker experiences downtime.

To test the fault tolerance of this feature, you can intentionally shut down your Worker or Temporal Server during the sleep period. When the system is back up, you will notice that the Workflow continues from where it left off, demonstrating Temporal's resilience.

:::

In the example below, after sending the welcome email, the Workflow waits for the duration of the trial period before proceeding to the next steps. This is achieved using the sleep function, which pauses the Workflow execution for the specified period.

<!--SNIPSTART subscription-ts-workflow-definition {"selectedLines": ["58-59"]}-->
[src/workflows.ts](https://github.com/temporalio/subscription-workflow-project-template-typescript/blob/main/src/workflows.ts)
```ts
// ...
  await sendWelcomeEmail(customer);
  await sleep(customer.subscription.trialPeriod);
```
<!--SNIPEND-->

Now, let's look into how we can query our Workflow to get back information on the Workflow ID, the billing period, and the total amount charged. This allows us to interact with the Workflow while it is running and get real-time updates on its status and progress.

## Add a Query

A Query is a synchronous operation that is used to get the state or other details of a Workflow Execution without impacting its execution. While Queries are typically used to access the state of an active Workflow Execution, they can also be applied to closed Workflow Executions.

In this section, we will demonstrate how to use Queries to allow users to obtain information about their subscription details. 

The first step is to add a new Query definition to the `subscriptionWorkflow` Workflow. To define a Query in the Workflow, you will need to use the [`defineQuery`](https://typescript.temporal.io/api/namespaces/workflow/#definequery) method provided by the TypeScript API. This function returns a `QueryDefinition` object, which carries the Query's signature. This signature includes the Query Type (a unique name used to identify the Query), the input parameters types, and the Query's return type.

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

In the code above, calling the `defineQuery` method created the following objects:
- `customerIdNameQuery` returns a string value.
- `billingPeriodNumberQuery` returns a number value.
- `totalChargedAmountQuery` returns a number value.

After defining a Query, the next step is to establish how the Workflow handles incoming Queries. This is where Query handlers come into play - they specify the actions a Workflow should take upon receiving a Query. 

Your Query should not include any logic that causes Command generation (such as executing Activities). Remember, Queries are intended to be read-only operations that do not alter the Workflow's state. 

You will use the [`handleQuery`](https://typescript.temporal.io/api/interfaces/workflow.WorkflowInboundCallsInterceptor/#handlequery) method to handle Queries inside a Workflow. This method directs each Query to its corresponding handler logic.

Within the `workflow.ts` file, we will now handle our Queries:

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

Now, these Query handler returns the details about the subscription, including the customer ID, the billing period number, the total charged amount etc. With these Query handlers in place, you can now retrieve details about the subscription without affecting the ongoing Workflow Execution.

You can use Queries even if the Workflow completes, which is useful for when the user unsubscribes but still wants to retrieve information about their subscription. 

Now that you've added the ability to Query your Workflow, it's time to add Signals to our Workflow as well.

## Signals

A Signal is a message sent asynchronously to a running Workflow Execution which can be used to change its state and control its flow. For example, with a subscription Workflow, I can send a Signal to change the subscription period. Note that a Signal can only deliver data to a Workflow Execution that has not already closed. 

Just like we did with our Queries, we need to both define and handle our Signals within our Workflow Definition. We will use the [`defineSignal`](https://typescript.temporal.io/api/namespaces/workflow#definesignal) method provided by the TypeScript API for this purpose. This method creates a Signal Definition object that includes the Signal's name and the input parameter types.

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

In the code above, we define two Signals:

1. `cancelSubscription`: A Signal with no input parameters, used to cancel the subscription.
2. `updateBillingChargeAmount`: A Signal that takes a single parameter of type number, used to update the billing charge amount.

However, just defining a Signal isn't enough. We also need to let the Workflow know what to do when it receives a Signal of that type. This is done with a Signal handler. Signal handlers are functions within the Workflow that listen for incoming Signals of a specified type and define how the Workflow should react.

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

You have now learned what a Query and Signal is, as well as how to define and handle them in your Workflow Definition. In the next section, you will learn how to send a Signal and Query.

### Invoke a Signal from the Client

Now, you will send your Signal through your Client.

First, you need to obtain a handle to the running Workflow Execution. The [`getHandle`](https://typescript.temporal.io/api/classes/client.WorkflowClient#gethandle) method is used to obtain a reference, or a "handle", to a specific Workflow Execution. This handle allows you to interact with the Workflow, including sending it Signals.

We'll begin by starting the Workflow Execution and getting the handle:

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

In the above example, the `handle` variable is now set to the Workflow instance of `subscription-${customer.id}`, defined in the Client when we start the Workflow.

The Client then sends the `cancelSubscription` Signal to `subscription-${customer.id}`, letting it know to cancel the subscription.

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

You now know how to obtain a handle on a Workflow Execution and send a Signal to it through the Client.

### Invoke a Query from the Client

Sending a Query through the Client is also very similar. The SDK provides the `WorkflowHandle.query` method to query a running or completed Workflow, allowing us to see into details of the `subscriptionWorkflow`, whether it is still running or completed.

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
      const billingPeriodNumber =
        await subscriptionWorkflowExecution.query<number>(
          "billingPeriodNumber"
        );
      const totalChargedAmount =
        await subscriptionWorkflowExecution.query<number>("totalChargedAmount");

      console.log("Workflow Id", subscriptionWorkflowExecution.workflowId);
      console.log("Billing Period", billingPeriodNumber);
      console.log("Total Charged Amount", totalChargedAmount);
```
<!--SNIPEND-->

In the above code, the `WorkflowHandle.query` method is used to request the `billingPeriodNumber` and `totalChargedAmount` from the running Workflow Execution without interrupting its execution. The results are then printed to the console.

## Using `condition` with timeouts

In many cases, you may want to pause the Workflow execution until a specific Signal is received or a certain condition is met. For example, in the `subscriptiptionWorkflow`, we might want to wait for the `subscriptionCancelled` Signal before invoking the `sendCancellationEmailDuringTrialPeriod` Activity.

The Temporal SDK provides the [`condition`](https://typescript.temporal.io/api/namespaces/workflow#condition) method for this purpose. The condition method allows you to halt the Workflow's progress until a specified condition is satisfied or a timeout is reached.

The condition method takes two arguments:

- Condition Function: A function that returns a boolean value.
- Timeout: The maximum time to wait for the condition to become true.

It returns a Promise that resolves when the condition function returns true or when the timeout period expires.

Here's an example of how to use the condition method in the subscriptionWorkflow to wait for either the subscriptionCancelled Signal or for the trial period to expire:

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

In the above code, we use `condition` to wait for the `subscriptionCancelled` Signal or for the trial period to expire. When that happens, we can invoke our Activity to send a cancellation e-mail.

Now when you run your `cancel-subscription` script you can see that the cancellation happens immediately.

## Conclusion
This tutorial demonstrates how to build a subscription application using Temporal and TypeScript. By leveraging Workflows, Activities, Signals, and Queries, the tutorial shows how to create a subscription process with Temporal.

With this knowledge, you'll be able to use more complex Workflows and Activities to create even stronger applications.
