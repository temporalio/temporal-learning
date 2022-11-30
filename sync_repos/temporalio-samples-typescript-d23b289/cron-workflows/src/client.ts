import { WorkflowClient } from '@temporalio/client';
import { scheduledWorkflow } from './workflows';

// Save this to later terminate or cancel this schedule
const workflowId = 'my-schedule';

async function run() {
  const client = new WorkflowClient();

  const handle = await client.start(scheduledWorkflow, {
    taskQueue: 'cron-workflows',
    workflowId: 'my-schedule', // Save this to later terminate or cancel this schedule
    cronSchedule: '* * * * *', // start every minute
    args: ['Temporal'],
  });
  console.log('Cron started');

  try {
    await handle.result(); // await completion of Workflow, which doesn't happen since it's a cron Workflow
  } catch (err: any) {
    console.error(err.message + ':' + handle.workflowId);
  }
}

// just for this demo - cancel the workflow on Ctrl+C
process.on('SIGINT', async () => {
  const client = new WorkflowClient();

  const handle = client.getHandle(workflowId);
  await handle.cancel();
  console.log(`\nCanceled Workflow ${handle.workflowId}`);
  process.exit(0);
});
// you cannot catch SIGKILL

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
