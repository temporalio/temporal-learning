// @@@SNIPSTART typescript-slack-app-dev-temporal-client
import "dotenv/config";
import {Client, Connection} from "@temporalio/client";

export let temporalClient: Client;

export async function initializeTemporalClient() {
  const connection = await Connection.connect();

  temporalClient = new Client({
    connection,
    namespace: process.env.TEMPORAL_DEV_NAMESPACE!,
  });
}
// @@@SNIPEND
