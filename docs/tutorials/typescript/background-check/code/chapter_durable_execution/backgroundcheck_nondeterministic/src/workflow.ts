/* eslint-disable no-useless-catch */
// @@@SNIPSTART typescript-durability-chapter-nondeterministic-workflow
import { proxyActivities, log, sleep } from "@temporalio/workflow";
import type * as activities from "./activities";

const { ssnTraceActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
});

// backgroundCheckNonDeterministic is an anti-pattern Workflow Definition
export async function backgroundCheckNonDeterministic(ssn: string): Promise<string> {
  // CAUTION, the following code is an anti-pattern showing what NOT to do
  if (getRandomNumber(1, 100) > 50) {
    await sleep("10 seconds");
  }

  log.info("Preparing to run daily report", {});

  try {
    const ssnTraceResult = await ssnTraceActivity(ssn);
    return ssnTraceResult;
  } catch (err) {
    throw err;
  }
}

function getRandomNumber(min: number, max: number) {
  let seed = 1234;
  seed = Math.floor(((seed * seed) % 10000) / 100);
  return min + (seed % (max - min + 1));
}
// @@@SNIPEND
