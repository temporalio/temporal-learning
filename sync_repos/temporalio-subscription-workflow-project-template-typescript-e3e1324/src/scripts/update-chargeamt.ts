// @@@SNIPSTART subscription-ts-updatechargeamount-signal
import { Connection, WorkflowClient } from "@temporalio/client";

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service, {
    workflowDefaults: { taskQueue: "SubscriptionsTaskQueueTS" },
  });
  let j = 0
  console.log(j++)
  // Signal all workflows and update charge amount to 300 for next billing period
  for (let i = 1; i < 6; i++) {
    console.log(j++)
    try {
      console.log(j++)
      const handle = await client.getHandle("SubscriptionsWorkflowId-" + i);
      console.log(j++)
      await handle.signal("BillingPeriodChargeAmount", 300);
      console.log(j++)
    } catch (err) {
      console.error("Cant signal workflow", err);
    }
    console.log('loop', j++)
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
