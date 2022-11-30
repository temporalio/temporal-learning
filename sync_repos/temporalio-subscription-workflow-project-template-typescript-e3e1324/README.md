# Temporal Subscription Workflow Template in TypeScript
<!-- @@@SNIPSTART subscription-ts-readme -->
This project template illustrates the design pattern for subscription style business logic.

You might compare this to similar projects in our [Go](https://github.com/temporalio/subscription-workflow-project-template-go), [Java](https://github.com/temporalio/subscription-workflow-project-template-java) and [PHP](https://github.com/temporalio/subscription-workflow-project-template-php) SDKs.

## Project Specifications

Our task is to write a Workflow for a limited time Subscription (eg a 36 month Phone plan) that satisfies these conditions:

1. When the user signs up, **send a welcome email** and start a free trial for `TrialPeriod`.
2. When the `TrialPeriod` expires, start the billing process
   - If the user cancels during the trial, **send a trial cancellation email**.
3. Billing Process:
   - As long as you have not exceeded `MaxBillingPeriods`,
   - **Charge the customer** for the `BillingPeriodChargeAmount`.
   - Then wait for the next `BillingPeriod`.
   - If the customer cancels during a billing period, **send a subscription cancellation email**.
   - If Subscription has ended normally (exceeded `MaxBillingPeriods` without cancellation), **send a subscription ended email**.
4. At any point while subscriptions are ongoing, be able to look up and change any customer's:
   - Amount Charged
   - Period number (for manual adjustments e.g. refunds)

Of course, this all has to be fault tolerant, scalable to millions of customers, testable, maintainable, observable... yada yada, that's... why you're here!

## Tutorial

The guided tutorial for writing this on your own can be found here: https://docs.temporal.io/docs/typescript/subscription-tutorial

## Setup

Run the Temporal Server:

```bash
git clone https://github.com/temporalio/docker-compose.git
cd docker-compose
docker-compose up
```

**Start**

Start the Worker:

```bash
npm run start.watch
```

Start the Workflow Executions:

```bash
npm run workflow
```

This will start the Workflow Executions for 5 customers in parallel:

```bash
Sending welcome email to email-3@customer.com
Sending welcome email to email-4@customer.com
Sending welcome email to email-2@customer.com
Sending welcome email to email-1@customer.com
Sending welcome email to email-5@customer.com
```

Each of their periods and charges are varied on purpose to simulate real life variation.
After their "trial" period, each customer will be charged every 3 seconds:

```
[SubscriptionWorkflow(SubscriptionsWorkflowId-1)] charging Id-1 130
Charging email-1@customer.com amount 130 for their billing period
[SubscriptionWorkflow(SubscriptionsWorkflowId-2)] charging Id-2 140
Charging email-2@customer.com amount 140 for their billing period
[SubscriptionWorkflow(SubscriptionsWorkflowId-3)] charging Id-3 150
Charging email-3@customer.com amount 150 for their billing period
[SubscriptionWorkflow(SubscriptionsWorkflowId-4)] charging Id-4 160
Charging email-4@customer.com amount 160 for their billing period
[SubscriptionWorkflow(SubscriptionsWorkflowId-5)] charging Id-5 170
Charging email-5@customer.com amount 170 for their billing period
```

If you let this run to completion, the Workflow Executions complete and report their results back:

```bash
$ npm run workflow
> temporal-hello-world@0.1.0 workflow /Users/swyx/Temporal/subscription-workflow-project-template-typescript
> ts-node src/scripts/execute-workflow.ts

Workflow result Completed SubscriptionsWorkflowId-1, Total Charged: 390
Workflow result Completed SubscriptionsWorkflowId-2, Total Charged: 420
Workflow result Completed SubscriptionsWorkflowId-3, Total Charged: 450
Workflow result Completed SubscriptionsWorkflowId-4, Total Charged: 480
Workflow result Completed SubscriptionsWorkflowId-5, Total Charged: 510
```

**Get billing info**

You can Query the Workflow Executions and get the billing information for each customer.

```bash
npm run querybillinginfo
```

You can run this after execution completes, or during execution to see the billing period number increase during the executions or see the billing cycle cost.

```bash
Workflow: Id SubscriptionsWorkflowId-1
Billing Results Billing Period 3
Billing Results Billing Period Charge 130
# etc...
```

**Update billing**

You can send a Signal a Workflow Execution to update the billing cycle cost to 300 for all customers.

```bash
npm run updatechargeamount
```

This will update all customer's charge amount to 300:

```bash
[SubscriptionWorkflow(SubscriptionsWorkflowId-4)] updating BillingPeriodChargeAmount 300
[SubscriptionWorkflow(SubscriptionsWorkflowId-4)] charging Id-4 300
Charging email-4@customer.com amount 300 for their billing period
```

**Cancel subscription**

You can send a Signal to all Workflow Executions to cancel the subscription for all customers.
Workflow Executions will complete after the currently executing billing period.

```bash
npm run cancelsubscription
```

This will cancel all outstanding subscriptions, sending a cancellation email to them:

```bash
Sending active subscriber cancellation email to email-2@customer.com
Sending active subscriber cancellation email to email-4@customer.com
Sending active subscriber cancellation email to email-5@customer.com
```


After running this, check out the [Temporal Web UI](localhost://8088) and see that all subscription Workflow Executions have a "Completed" status.
<!-- @@@@SNIPEND -->
