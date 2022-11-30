// @@@SNIPSTART subscription-ts-workflow-execution-starter
import { Connection, WorkflowClient } from "@temporalio/client";
import { SubscriptionWorkflow } from "../workflows";
import { Customer } from "../types";

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service, {
    workflowDefaults: { taskQueue: "SubscriptionsTaskQueueTS" },
  });

  const custArray = [1, 2, 3, 4, 5].map(
    (i) =>
      ({
        FirstName: "First Name" + i,
        LastName: "Last Name" + i,
        Email: "email-" + i + "@customer.com",
        Subscription: {
          TrialPeriod: 3000 + i * 1000, // 3 seconds
          BillingPeriod: 3000 + i, // 3 seconds
          MaxBillingPeriods: 3,
          initialBillingPeriodCharge: 120 + i * 10,
        },
        Id: "Id-" + i,
      } as Customer)
  );
  const resultArr = await Promise.all(
    custArray.map((cust) =>
      client
        .execute(SubscriptionWorkflow, {
          args: [cust],
          workflowId: "SubscriptionsWorkflow" + cust.Id,
          workflowRunTimeout: "10 mins",
        })
        .catch((err) => console.error("Unable to execute workflow", err))
    )
  );
  resultArr.forEach((result) => {
    console.log("Workflow result", result);
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
