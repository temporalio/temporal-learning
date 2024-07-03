// @@@SNIPSTART typescript-slack-app-temporal-application-dev-worker
import "dotenv/config";
import path from "path";
import {Worker, NativeConnection} from "@temporalio/worker";
import * as activities from "./activities/index";

async function run() {
  try {
    const worker = await Worker.create({
      namespace: process.env.TEMPORAL_DEV_NAMESPACE || "",
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
