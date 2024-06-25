// @@@SNIPSTART typescript-slack-app-bot-workqueue-module
import "dotenv/config";
import {
  SayFn,
  RespondFn,
  SlackCommandMiddlewareArgs,
  GenericMessageEvent,
} from "@slack/bolt";
import {WorkqueueData, WorkqueueStatus} from "../../common-types/types";
import {temporalClient} from "./dev-temporal-client";
import crypto from "crypto";
import {formatDistanceToNow} from "date-fns";
import {
  getWorkqueueDataQuery,
  addWorkToQueueSignal,
  claimWorkSignal,
  completeWorkSignal,
} from "../../temporal-application/src/workflows/workqueue";
import {WorkflowExecutionAlreadyStartedError} from "@temporalio/client";

// Handles and routes all incoming Work Queue Slash Commands
export async function handleWorkqueueCommand(
  command: SlackCommandMiddlewareArgs["command"],
  say: SayFn,
  respond: RespondFn
) {
  const commandText = command.text?.trim();

  if (commandText === "!delete") {
    await deleteWorkqueue(command, say);
  } else if (commandText === "") {
    await displayWorkQueue(command, respond);
  } else {
    await addWorkToQueue(command, say);
  }
  return;
}

// Custom reply function that sends a message in the same thread
// Defaults to text, but capable of sending blocks as well
async function reply(say: SayFn, text: string, blocks?: any) {
  try {
    // If the message is already part of a thread, reply in the same thread
    await say({
      text, // Always include the text field
      blocks, // Include blocks if provided
    });
  } catch (error) {
    console.error("Error occurred while sending message:", error);
    throw new Error("Failed to send message");
  }
}

// Custom replyEphemeral function that sends an ephemeral message
// Defaults to text, but capable of sending blocks as well
async function replyEphemeral(respond: RespondFn, text: string, blocks?: any) {
  try {
    await respond({
      text, // Always include the text field
      blocks, // Include blocks if provided
    });
  } catch (error) {
    console.error("Error occurred while sending ephemeral message:", error);
    throw new Error("Failed to send ephemeral message");
  }
}

// Display the Work Queue for the channel
// Creates a new Work Queue if it does not exist
async function displayWorkQueue(
  command: SlackCommandMiddlewareArgs["command"],
  respond: RespondFn
) {
  // Get the channel name in plain text
  const channelName = command.channel_name;
  // Create a new Work Queue for the channel
  await createNewWorkQueue(channelName);
  // If the Work Queue already exists, Query it
  const data = await queryWorkQueue(channelName, respond);
  await replyEphemeral(
    respond,
    "Work Queue cannot display",
    formatWorkqueueDataForSlack(channelName, data)
  );
}

// Create a new Work Queue for the channel if one does not exist
async function createNewWorkQueue(workflowid: string): Promise<void> {
  try {
    await temporalClient.workflow.start("workqueue", {
      taskQueue: `${process.env.ENV}-temporal-iq-task-queue`,
      workflowId: workflowid,
    });
  } catch (e) {
    if (e instanceof WorkflowExecutionAlreadyStartedError) {
      console.log("Workflow already started");
    } else {
      throw e;
    }
  }
}

// Read the state of the Work Queue for the channel using a Query
async function queryWorkQueue(
  workflowId: string,
  say: SayFn
): Promise<WorkqueueData[]> {
  try {
    const handle = temporalClient.workflow.getHandle(workflowId);
    const result = await handle.query<WorkqueueData[]>(getWorkqueueDataQuery);
    console.log("Current workqueue data:", result);
    return result;
  } catch (error) {
    console.error("Error querying workqueue data:", error);
    await say("An error occurred while Querying the Work Queue.");
    return [];
  }
}

// Add work to the queue using a Signal
async function addWorkToQueue(
  command: SlackCommandMiddlewareArgs["command"],
  say: SayFn
) {
  // Get the channel name in plain text
  const channelId = command.channel_id;
  const channelName = command.channel_name;
  const wqdata = buildWQData(command, channelId, channelName);
  await signalAddWork(wqdata, say);
  // Reply to the message directly in the thread
  await reply(say, `Added Work ${wqdata.id} to the Queue.`);
}

// Delete the Work Queue for the channel with a Cancellation Request
export async function deleteWorkqueue(
  command: SlackCommandMiddlewareArgs["command"],
  say: SayFn
): Promise<void> {
  const workflowId = command.channel_name;
  try {
    const handle = temporalClient.workflow.getHandle(workflowId);
    await handle.cancel();
    console.log(`Workflow with ID ${workflowId} has been cancelled.`);
    await reply(say, `Work Queue has been deleted for this channel.`);
  } catch (error) {
    console.error(`Failed to cancel workflow with ID ${workflowId}:`, error);
    await reply(say, `Failed to delete Work Queue for this channel.`);
  }
}

// Create a data object containing work item information
function buildWQData(
  command: SlackCommandMiddlewareArgs["command"],
  channelId: string,
  channelName: string
): WorkqueueData {
  // Provide a default value if message.text is undefined
  const work = command.text ?? "";
  // Construct the WorkqueueData object
  return {
    id: generateUniqueId(),
    timestamp: createTimestamp(),
    channelId: channelId,
    channelName: channelName,
    userId: command.user_id,
    work: work,
    status: WorkqueueStatus.Backlog,
  };
}

// Generate a unique ID for the work item
function generateUniqueId(): string {
  // 2 bytes = 4 hex digits
  return crypto.randomBytes(2).toString("hex");
}

// Create a timestamp in ISO format
function createTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

async function signalAddWork(params: WorkqueueData, say: SayFn): Promise<void> {
  try {
    await temporalClient.workflow.signalWithStart("workqueue", {
      workflowId: params.channelName,
      taskQueue: `${process.env.ENV}-temporal-iq-task-queue`,
      signal: addWorkToQueueSignal,
      signalArgs: [params],
    });
  } catch (error) {
    console.error("Error signaling workqueue data:", error);
    await say("An error occurred while Signaling the Work Queue.");
  }
}

export async function signalClaimWork(
  channelName: string,
  workId: string,
  claimantId: string,
  userId: string,
  say: SayFn
) {
  try {
    const handle = temporalClient.workflow.getHandle(channelName);
    await handle.signal(claimWorkSignal, {workId, claimantId});
    console.log(`Work item ${workId} claimed by ${claimantId}`);
    await reply(
      say,
      `<@${userId}> Work item ${workId} claimed by <@${claimantId}>.`
    );
  } catch (error) {
    console.error("Failed to signal claim work:", error);
  }
}

export async function signalCompleteWork(
  channelId: string,
  workId: string,
  message: GenericMessageEvent,
  userId: string,
  say: SayFn
) {
  try {
    const handle = temporalClient.workflow.getHandle(channelId);
    await handle.signal(completeWorkSignal, {workId});
    console.log(`Work item ${workId} marked as complete`);
    await reply(say, `<@${userId}> Work item ${workId} marked as complete.`);
  } catch (error) {
    console.error("Failed to signal complete work:", error);
  }
}

function formatWorkqueueDataForSlack(
  channelName: string,
  data: WorkqueueData[]
): any {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${channelName} Work Queue`,
        emoji: true,
      },
    },
  ];

  if (data.length === 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "There is no work in the Queue! :tada:",
      },
    });

    return blocks;
  }

  data.forEach((item, index) => {
    const timeInQueue = formatDistanceToNow(new Date(item.timestamp), {
      addSuffix: true,
    });
    const statusText = getStatusText(item.status);
    const timeInQueueText = `Time in Queue: ${timeInQueue}`;
    const claimedText = item.claimantId
      ? `Claimed by <@${item.claimantId}>`
      : "";
    const combinedText = `${timeInQueueText} | ${claimedText}`.trim();

    blocks.push(
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${index + 1} ${item.id}* | ${statusText} | ${combinedText}`,
        },
        accessory: !item.claimantId
          ? {
              type: "button",
              text: {
                type: "plain_text",
                text: "Claim Work",
                emoji: true,
              },
              value: `${item.channelName}_${item.id}_${item.userId}`,
              action_id: "wq_claim",
            }
          : undefined,
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Submitted by: <@${item.userId}>`,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Mark complete",
            emoji: true,
          },
          value: `${item.channelName}_${item.id}_${item.userId}`,
          action_id: "wq_complete",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Requested work: ${item.work}`,
        },
      },
      {
        type: "divider",
      }
    );
  });

  return blocks;
}

function getStatusText(status: WorkqueueStatus): string {
  switch (status) {
    case WorkqueueStatus.Backlog:
      return "Backlog";
    case WorkqueueStatus.InProgress:
      return "In Progress";
    case WorkqueueStatus.Done:
      return "Done";
    default:
      return "Unknown";
  }
}
//@@@SNIPEND
