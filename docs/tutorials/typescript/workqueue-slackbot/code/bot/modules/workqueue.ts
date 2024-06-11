import "dotenv/config";
import { SayFn, GenericMessageEvent } from "@slack/bolt";
import { WebClient } from "@slack/web-api";
import { WorkqueueData, WorkqueueStatus } from "../../common-types/types";
import { temporalClient } from "./temporal";
import crypto from "crypto";
import { formatDistanceToNow } from "date-fns";

// Handles and routes all incoming Work Queue messages
export async function handleWorkqueueMessages(
  message: GenericMessageEvent,
  say: SayFn,
  client: WebClient
) {
  const messageText = message.text?.trim();

  if (
    !messageText ||
    (!messageText.startsWith("!w") && !messageText.startsWith("!wa"))
  ) {
    // Ignore the message if it doesn't start with "!w" or "!wa"
    return;
  }

  if (messageText === "!wdelete") {
    const channelName = await getChannelName(message.channel, say, client);
    await deleteWorkqueue(channelName, say, message);
  } else if (messageText === "!w") {
    await displayWorkqueue(message, say, client);
  } else if (messageText.startsWith("!wa")) {
    await addWorkToQueue(message, say, client);
  }
  return;
}

// Handles the action of claiming a work item

// Custom reply function that sends a message in the same thread
// Defaults to text, but capable of sending blocks as well
async function reply(
  say: SayFn,
  text: string,
  m: GenericMessageEvent,
  blocks?: any
) {
  try {
    if (m.thread_ts) {
      // If the message is already part of a thread, reply in the same thread
      await say({
        text, // Always include the text field
        blocks, // Include blocks if provided
        thread_ts: m.thread_ts,
      });
    } else {
      // If the message is not part of a thread, start a new thread
      await say({
        text, // Always include the text field
        blocks, // Include blocks if provided
        thread_ts: m.ts,
      });
    }
  } catch (error) {
    console.error("Error occurred while sending message:", error);
    throw new Error("Failed to send message");
  }
}

// Dispay the Work Queue for the channel
// Creates a new Work Queue if it does not exist
async function displayWorkqueue(
  message: GenericMessageEvent,
  say: SayFn,
  client: WebClient
) {
  // Only take action if the message starts with "w!"
  const text = message.text?.trim();
  if (!message.text || message.text.trim() != "!w") {
    return;
  }
  // Get the channel name in plain text
  const channelName = await getChannelName(message.channel, say, client);
  // Check if the Workqueue already exists for the channel
  if (await checkIfWorkqueueExists(channelName)) {
    // If the Workqueue already exists, Query it
    const data = await queryWorkqueue(channelName, say);
    await reply(
      say,
      "Work Queue cannot display",
      message,
      formatWorkqueueDataForSlack(channelName, data)
    );
  } else {
    // Create a new Workqueue for the channel
    await reply(
      say,
      `Workqueue does not yet exist for ${channelName}, creating...`,
      message
    );
    await createNewWorkqueue(channelName);
  }
}

async function addWorkToQueue(
  message: GenericMessageEvent,
  say: SayFn,
  client: WebClient
) {
  const genericMessage = message as GenericMessageEvent;
  // Get the channel name in plain text
  const channelId = genericMessage.channel;
  const channelName = await getChannelName(channelId, say, client);
  const wqdata = buildWQData(genericMessage, channelId, channelName);
  await signalWorkqueue(wqdata, say);
  // Reply to the message directly in the thread
  await reply(say, `Added Work ${wqdata.id} to the Queue.`, genericMessage);
}

function buildWQData(
  message: GenericMessageEvent,
  channelId: string,
  channelName: string
): WorkqueueData {
  // Provide a default value if message.text is undefined
  const messageText = message.text ?? "";
  // Strip out '!wa' from the beginning
  const work = messageText.startsWith("!wa") ? messageText.slice(3).trim() : "";
  // Use the thread_ts if it exists, otherwise use the ts
  let ts: string = "";
  if (message.thread_ts) {
    ts = message.thread_ts;
  } else {
    ts = message.ts;
  }
  // Construct the WorkqueueData object
  return {
    id: generateUniqueId(),
    timestamp: createTimestamp(),
    channelId: channelId,
    channelName: channelName,
    userId: message.user,
    work: work,
    messageLink: `https://${process.env.SLACK_WORKSPACE}.slack.com/archives/${channelId}/${message.ts}`,
    status: WorkqueueStatus.Backlog,
  };
}

function generateUniqueId(): string {
  // 2 bytes = 4 hex digits
  return crypto.randomBytes(2).toString("hex");
}

function createTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

async function getChannelName(
  channelId: string,
  say: SayFn,
  client: WebClient
): Promise<string> {
  try {
    // Use the WebClient to fetch channel info
    const channelInfo = await client.conversations.info({ channel: channelId });
    if (channelInfo.ok) {
      return channelInfo.channel?.name ?? "Unknown Channel";
    } else {
      await say("Unable to fetch channel info.");
      return "Unknown Channel";
    }
  } catch (error) {
    console.error(error);
    await say("An error occurred while fetching channel info.");
    return "Unknown Channel";
  }
}

async function checkIfWorkqueueExists(workflowId: string) {
  try {
    const describeResult =
      await temporalClient.workflowService.describeWorkflowExecution({
        namespace: process.env.TEMPORAL_CLOUD_NAMESPACE!,
        execution: {
          workflowId: workflowId,
        },
      });
    // Check if the Workflow is currently running
    const status = describeResult.workflowExecutionInfo?.status;
    // 1 corresponds to RUNNING
    if (status === 1) {
      console.log(`Workflow with ID ${workflowId} is currently running.`);
      return true;
    } else {
      console.log(`Workflow with ID ${workflowId} is not running.`);
      return false;
    }
  } catch (error: any) {
    if (error.message.includes("NOT_FOUND")) {
      console.log(`No workflow found with ID ${workflowId}.`);
      return false;
    }
    console.error("Error describing workflow execution:", error);
    throw error;
  }
}

async function createNewWorkqueue(workflowid: string): Promise<void> {
  await temporalClient.workflow.start("workqueue", {
    taskQueue: `${process.env.IQ_ENV}-temporal-iq-task-queue`,
    workflowId: workflowid,
  });
}

async function queryWorkqueue(
  workflowId: string,
  say: SayFn
): Promise<WorkqueueData[]> {
  try {
    const handle = temporalClient.workflow.getHandle(workflowId);
    const result = await handle.query<WorkqueueData[]>("getWorkqueueData");
    console.log("Current workqueue data:", result);
    return result;
  } catch (error) {
    console.error("Error querying workqueue data:", error);
    await say("An error occurred while Querying the Work Queue.");
    return [];
  }
}

async function signalWorkqueue(
  params: WorkqueueData,
  say: SayFn
): Promise<void> {
  try {
    await temporalClient.workflow.signalWithStart("workqueue", {
      workflowId: params.channelName,
      taskQueue: `${process.env.IQ_ENV}-temporal-iq-task-queue`,
      signal: "addWorkqueueData",
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
  message: GenericMessageEvent,
  userId: string,
  say: SayFn
) {
  try {
    const handle = temporalClient.workflow.getHandle(channelName);
    await handle.signal("claimWork", { workId, claimantId });
    console.log(`Work item ${workId} claimed by ${claimantId}`);
    await reply(
      say,
      `<@${userId}> Work item ${workId} claimed by <@${claimantId}>.`,
      message
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
    await handle.signal("completeWork", { workId });
    console.log(`Work item ${workId} marked as complete`);
    await reply(
      say,
      `<@${userId}> Work item ${workId} marked as complete.`,
      message
    );
  } catch (error) {
    console.error("Failed to signal complete work:", error);
  }
}

export async function deleteWorkqueue(
  workflowId: string,
  say: SayFn,
  message: GenericMessageEvent
): Promise<void> {
  try {
    const handle = temporalClient.workflow.getHandle(workflowId);
    await handle.cancel();
    console.log(`Workflow with ID ${workflowId} has been cancelled.`);
    await reply(say, `Work Queue has been deleted for this channel.`, message);
  } catch (error) {
    console.error(`Failed to cancel workflow with ID ${workflowId}:`, error);
    await reply(say, `Failed to delete Work Queue for this channel.`, message);
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
          text: `*${index + 1} <${item.messageLink}|${
            item.id
          }>* | ${statusText} | ${combinedText}`,
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
