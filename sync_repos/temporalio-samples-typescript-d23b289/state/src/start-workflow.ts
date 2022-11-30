import { WorkflowClient } from '@temporalio/client';
import { trackState } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const _handle = await client.start(trackState, {
    taskQueue: 'state',
    workflowId: 'state-id-0',
  });

  console.log("Workflow 'state-id-0' started. You can now signal, query, or cancel it.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
