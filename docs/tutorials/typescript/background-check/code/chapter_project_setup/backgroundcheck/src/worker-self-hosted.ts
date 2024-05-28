// @@@SNIPSTART typescript-project-setup-chapter-self-hosted-worker
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // Step 1: Establish a connection with Temporal server.
  //
  // Worker code uses `@temporalio/worker.NativeConnection`.
  // (But in your application code it's `@temporalio/client.Connection`.)
  const connection = await NativeConnection.connect({
    address: '172.18.0.4:7233',
    // TLS and gRPC metadata configuration goes here.
  });
  // Step 2: Register Workflows and Activities with the Worker and specify your
  // namespace and Task Queue.
  const worker = await Worker.create({
    connection,
    namespace: 'backgroundcheck_namespace',
    taskQueue: 'hello-world',
    // Workflows are registered using a path as they run in a separate JS context.
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

// @@@SNIPEND
