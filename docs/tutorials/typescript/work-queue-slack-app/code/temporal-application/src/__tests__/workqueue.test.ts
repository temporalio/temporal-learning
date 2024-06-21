// @@@SNIPSTART typescript-slack-app-workqueue-workflow-tests
import {WorkflowClient} from "@temporalio/client";
import {TestWorkflowEnvironment} from "@temporalio/testing";
import {Worker, Runtime, DefaultLogger} from "@temporalio/worker";
import {v4 as uuidv4} from "uuid";
import {
  getWorkqueueDataQuery,
  addWorkToQueueSignal,
  claimWorkSignal,
  completeWorkSignal,
  workqueue,
} from "../workflows/workqueue";
import {WorkqueueData, WorkqueueStatus} from "../../../common-types/types";
import {WorkflowCoverage} from "@temporalio/nyc-test-coverage";

describe("Work Queue Workflow", () => {
  let client: WorkflowClient;
  let testEnv: TestWorkflowEnvironment;
  const workflowCoverage = new WorkflowCoverage();

  beforeAll(async () => {
    Runtime.install({logger: new DefaultLogger("WARN")});
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  afterAll(() => {
    workflowCoverage.mergeIntoGlobalCoverage();
  });

  test("should add work to the queue", async () => {
    const {client, nativeConnection} = testEnv;
    const worker = await Worker.create(
      workflowCoverage.augmentWorkerOptions({
        connection: nativeConnection,
        taskQueue: "test",
        workflowsPath: require.resolve("../workflows"),
      })
    );
    const workflowId = uuidv4();
    await worker.runUntil(async () => {
      const handle = await client.workflow.start(workqueue, {
        args: [],
        workflowId: workflowId,
        taskQueue: "test",
      });
      const workItem: WorkqueueData = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        channelId: "test-channel",
        channelName: "test-channel",
        userId: "test-user",
        work: "Test work",
        status: WorkqueueStatus.Backlog,
      };
      await handle.signal(addWorkToQueueSignal, workItem);
      const result = await handle.query(getWorkqueueDataQuery);
      expect(result).toContainEqual(workItem);
    });
  }, 10000);

  test("should claim work in the queue", async () => {
    const {client, nativeConnection} = testEnv;
    const worker = await Worker.create(
      workflowCoverage.augmentWorkerOptions({
        connection: nativeConnection,
        taskQueue: "test",
        workflowsPath: require.resolve("../workflows"),
      })
    );
    const workflowId = uuidv4();
    await worker.runUntil(async () => {
      const handle = await client.workflow.start(workqueue, {
        args: [],
        taskQueue: "test",
        workflowId,
      });
      const workItem: WorkqueueData = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        channelId: "test-channel",
        channelName: "test-channel",
        userId: "test-user",
        work: "Test work",
        status: WorkqueueStatus.Backlog,
      };
      await handle.signal(addWorkToQueueSignal, workItem);
      await handle.signal(claimWorkSignal, {
        workId: workItem.id,
        claimantId: "claimer-id",
      });
      const result: WorkqueueData[] = await handle.query(getWorkqueueDataQuery);
      const updatedItem = result.find((item) => item.id === workItem.id);
      expect(updatedItem).toBeDefined();
      expect(updatedItem?.claimantId).toBe("claimer-id");
    });
  }, 10000);

  test("should complete work in the queue", async () => {
    const {client, nativeConnection} = testEnv;
    const worker = await Worker.create(
      workflowCoverage.augmentWorkerOptions({
        connection: nativeConnection,
        taskQueue: "test",
        workflowsPath: require.resolve("../workflows"),
      })
    );
    const workflowId = uuidv4();
    await worker.runUntil(async () => {
      const handle = await client.workflow.start(workqueue, {
        args: [],
        taskQueue: "test",
        workflowId,
      });
      const workItem: WorkqueueData = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        channelId: "test-channel",
        channelName: "test-channel",
        userId: "test-user",
        work: "Test work",
        status: WorkqueueStatus.Backlog,
      };
      await handle.signal(addWorkToQueueSignal, workItem);
      await handle.signal(completeWorkSignal, {workId: workItem.id});
      const result = await handle.query(getWorkqueueDataQuery);
      expect(result).not.toContainEqual(workItem);
    });
  }, 10000);

  test("should continue as new when event count is high", async () => {
    const {client, nativeConnection} = testEnv;
    const worker = await Worker.create(
      workflowCoverage.augmentWorkerOptions({
        connection: nativeConnection,
        taskQueue: "test",
        workflowsPath: require.resolve("../workflows"),
      })
    );
    const workflowId = uuidv4();
    await worker.runUntil(async () => {
      const handle = await client.workflow.start(workqueue, {
        args: [],
        taskQueue: "test",
        workflowId,
      });
      for (let i = 0; i < 500; i++) {
        const workItem: WorkqueueData = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          channelId: "test-channel",
          channelName: "test-channel",
          userId: "test-user",
          work: `Test work ${i}`,
          status: WorkqueueStatus.Backlog,
        };

        await handle.signal(addWorkToQueueSignal, workItem);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Allow time for continueAsNew
      const result = await handle.query(getWorkqueueDataQuery);
      expect(result.length).toBe(500);
    });
  }, 10000);
});
// @@@SNIPEND
