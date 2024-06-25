import "dotenv/config";
import {Client, Connection} from "@temporalio/client";

export let temporalClient: Client;

export async function initializeTemporalClient() {
  const key = Buffer.from(process.env.TEMPORAL_CLOUD_PRIVATE_KEY!, "utf-8");
  const cert = Buffer.from(process.env.TEMPORAL_CLOUD_PEM!, "utf-8");
  const address = process.env.TEMPORAL_CLOUD_ADDRESS!;
  const namespace = process.env.TEMPORAL_CLOUD_NAMESPACE!;
  const connection = await Connection.connect({
    address: address,
    tls: {
      clientCertPair: {
        crt: cert,
        key: key,
      },
    },
  });

  CLOUD LOGIC
  temporalClient = new Client({
    connection,
    namespace: namespace,
  });
}
