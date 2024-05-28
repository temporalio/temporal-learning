import * as workflow from '@temporalio/workflow';
import type * as activities from './activities';

const { ssnTrace } = workflow.proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
});

export async function backgroundCheck(ssn: string): Promise<string> {
  return await ssnTrace(ssn);
}

