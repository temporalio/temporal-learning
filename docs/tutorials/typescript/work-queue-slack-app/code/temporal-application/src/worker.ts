// @@@SNIPSTART typescript-slack-app-temporal-application-worker
import "dotenv/config";
import path from "path";
import {Worker, NativeConnection} from "@temporalio/worker";

async function run() {
  try {
    // CLOUD LOGIC
    // const key = Buffer.from(
    //   process.env.TEMPORAL_CLOUD_PRIVATE_KEY || "",
    //   "utf-8"
    // );
    // const cert = Buffer.from(process.env.TEMPORAL_CLOUD_PEM || "", "utf-8");
    // const connection = await NativeConnection.connect({
    //   address: process.env.TEMPORAL_CLOUD_ADDRESS || "",
    //   tls: {
    //     clientCertPair: {
    //       crt: cert,
    //       key: key,
    //     },
    //   },
    // });

    const worker = await Worker.create({
      // connection,
      namespace: process.env.TEMPORAL_CLOUD_NAMESPACE || "",
      workflowsPath: path.resolve(__dirname, "./workflows"),
      taskQueue: `${process.env.IQ_ENV}-temporal-iq-task-queue`,
    });

    await worker.run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
// @@@SNIPEND
