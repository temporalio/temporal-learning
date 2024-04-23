// code I wrote to run the worker
import fs from "fs/promises";

import { Worker, NativeConnection } from "@temporalio/worker";
import * as activities from "./activities";

async function run() {

  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS!,
    tls: {
      clientCertPair: {
        crt: await fs.readFile(process.env.TEMPORAL_MTLS_TLS_CERT!),
        key: await fs.readFile(process.env.TEMPORAL_MTLS_TLS_KEY!),
      },
    },
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE!,
    taskQueue: "money-transfer",
    workflowsPath: require.resolve("./workflows"),
    activities,
  });

  await worker.run();
  await connection.close();
}