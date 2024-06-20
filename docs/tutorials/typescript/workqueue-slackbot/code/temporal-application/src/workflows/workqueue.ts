import {
  isCancellation,
  continueAsNew,
  defineQuery,
  defineSignal,
  setHandler,
  workflowInfo,
  condition,
} from "@temporalio/workflow";
import {WorkqueueData} from "../../../common-types/types";

export const getWorkqueueDataQuery =
  defineQuery<WorkqueueData[]>("getWorkqueueData");
export const addWorkToQueueSignal =
  defineSignal<[WorkqueueData]>("addWorkqueueData");
export const claimWorkSignal =
  defineSignal<[{workId: string; claimantId: string}]>("claimWork");
export const completeWorkSignal =
  defineSignal<[{workId: string}]>("completeWork");

export async function workqueue(existingData?: WorkqueueData[]): Promise<void> {
  const wqdata: WorkqueueData[] = existingData ?? [];

  // Register a Query handler for 'getWorkqueueData'
  setHandler(getWorkqueueDataQuery, () => {
    return wqdata;
  });

  // Register the Signal handler for adding work
  setHandler(addWorkToQueueSignal, (data: WorkqueueData) => {
    wqdata.push(data);
  });

  // Register Signal handler for claiming work
  setHandler(claimWorkSignal, ({workId, claimantId}) => {
    const workItem = wqdata.find((item) => item.id === workId);
    if (workItem) {
      workItem.claimantId = claimantId;
      workItem.status = 2;
    }
  });

  // Register Signal handler for completing work
  setHandler(completeWorkSignal, ({workId}) => {
    const index = wqdata.findIndex((item) => item.id === workId);
    if (index !== -1) {
      wqdata.splice(index, 1);
    }
  });

  try {
    // Await until suggestion to Continue-As-New due to History size
    // If a Cancellation request exists, the condition call will throw the Cancellation error
    await condition(() => workflowInfo().continueAsNewSuggested);
  } catch (e) {
    // Catch a Cancellation error
    if (isCancellation(e)) {
      // Set the Workflow status to Cancelled by throwing the CancelledFailure error
      throw e;
    } else {
      // Handle other types of errors
      throw e;
    }
  }
  await continueAsNew<typeof workqueue>(wqdata);
}
