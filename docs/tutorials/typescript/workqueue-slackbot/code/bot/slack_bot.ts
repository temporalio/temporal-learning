#!/usr/bin/env ts-node
import {
  App,
  GenericMessageEvent,
  ButtonAction,
  BlockAction,
  BlockElementAction,
} from "@slack/bolt";
import {initializeTemporalClient} from "./modules/temporal";
import {
  handleWorkqueueCommand,
  signalClaimWork,
  signalCompleteWork,
} from "./modules/workqueue";

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN!,
});

// Listen for generic awake test message
app.message("iq awake?", async ({message, say}) => {
  console.log("I am.");
  const genericMessage = message as GenericMessageEvent;
  await say(`I am <@${genericMessage.user}>!`);
});

// Listen for Work Queue messages
app.command("/workqueue", async ({command, ack, say, client, respond}) => {
  await ack(); // Acknowledge the command request
  await handleWorkqueueCommand(command, client, say, respond);
});

// Listen for Work Item Claim
app.action<BlockAction<BlockElementAction>>(
  "wq_claim",
  async ({ack, say, body}) => {
    await ack();
    // Ensure the body.actions[0] is a ButtonAction
    const action = body.actions[0] as ButtonAction;
    const [channelName, workId, userId] = action.value.split("_");
    const claimantId = body.user.id;
    // Send signal to the Temporal workflow to claim the work
    console.log(body);
    await signalClaimWork(channelName, workId, claimantId, userId, say);
  }
);
// Listen for Work Item Completion
app.action<BlockAction<BlockElementAction>>(
  "wq_complete",
  async ({ack, say, body}) => {
    await ack();
    const action = body.actions[0] as ButtonAction;
    const [channelName, workId, userId] = action.value.split("_");
    const message = body.message as GenericMessageEvent;
    // Send signal to the Temporal workflow to complete the work
    await signalCompleteWork(channelName, workId, message, userId, say);
  }
);

// Register Slack bot error handler
app.error(async ({error}: {error: Error}) => {
  if (error instanceof Error) {
    console.error(`Error: ${error.name}, Message: ${error.message}`);
  } else {
    console.error("An unknown error occurred", error);
  }
});

// Start the app
(async () => {
  await app.start();
  await initializeTemporalClient();
  console.log("⚡️ Bolt app is running!");
})();
