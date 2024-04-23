import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";

async function run() {
  const connection = await NativeConnection.connect({
    address: "localhost:7233",
  });

  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: "background-check",
    // Workflows are registered using a path as they run in a separate JS context.
    workflowsPath: require.resolve("./workflows"),
    activities,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});