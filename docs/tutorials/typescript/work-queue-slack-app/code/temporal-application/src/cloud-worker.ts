// @@@SNIPSTART typescript-slack-app-temporal-application-cloud-worker
import "dotenv/config";
import path from "path";
import {Worker, NativeConnection} from "@temporalio/worker";
import * as activities from "./activities/index";

async function run() {
  try {
    const key = Buffer.from(
      process.env.TEMPORAL_CLOUD_PRIVATE_KEY || "",
      "utf-8"
    );
    const cert = Buffer.from(process.env.TEMPORAL_CLOUD_PEM || "", "utf-8");
    const connection = await NativeConnection.connect({
      address: process.env.TEMPORAL_CLOUD_ADDRESS || "",
      tls: {
        clientCertPair: {
          crt: cert,
          key: key,
        },
      },
    });

    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_CLOUD_NAMESPACE || "",
      workflowsPath: path.resolve(__dirname, "./workflows"),
      activities,
      taskQueue: `${process.env.ENV}-temporal-iq-task-queue`,
    });

    await worker.run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
// @@@SNIPEND
