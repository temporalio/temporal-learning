// @@@SNIPSTART subscription-ts-querybillinginfo-query
import { Connection, WorkflowClient } from "@temporalio/client";

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service, {
    workflowDefaults: { taskQueue: "SubscriptionsTaskQueueTS" },
  });
  for (let i = 1; i < 6; i++) {
    const handle = await client.getHandle("SubscriptionsWorkflowId-" + i);
    const result = await handle.query<number>("BillingPeriodNumber");
    const result2 = await handle.query<number>("BillingPeriodChargeAmount");

    console.log("Workflow:", "Id", handle.workflowId);
    console.log("Billing Results", "Billing Period", result);
    console.log("Billing Results", "Billing Period Charge", result2);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
