// @@@SNIPSTART typescript-project-setup-chapter-backgroundcheck-workflow-test
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { backgroundCheck } from '../workflows';
import assert from 'assert';

describe('Background check workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the Workflow', async () => {
    const ssn = '111-22-3333';
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'testing';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        ssnTrace: async () => 'pass',
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(backgroundCheck, {
        args: [ssn],
        workflowId: 'background-check-test',
        taskQueue,
      }),
    );
    assert.equal(result, 'pass');
  });
});

// @@@SNIPEND
