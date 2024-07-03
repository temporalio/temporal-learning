# Work Queue Slack App bot application

**Development**

To start the Slack bot in a development environment, ensure you have a `.env` file at the root of bot project with the following variables:

SLACK_SIGNING_SECRET=""
SLACK_BOT_TOKEN=""
SLACK_APP_TOKEN=""
SLACK_WORKSPACE=""
ENV="dev"
TEMPORAL_DEV_NAMESPACE=""

Then run:

```
npm start
```

**Production**

To start the Slack bot in a production environment (using Temporal Cloud), ensure you have a `.env` file at the root of the bot project with the following variables:

SLACK_SIGNING_SECRET=""
SLACK_BOT_TOKEN=""
SLACK_APP_TOKEN=""
SLACK_WORKSPACE=""
ENV="prod"
TEMPORAL_CLOUD_ADDRESS=""
TEMPORAL_CLOUD_NAMESPACE=""
TEMPORAL_CLOUD_PEM=""
TEMPORAL_CLOUD_PRIVATE_KEY=""

Update the `import` statement in `slack_bot.ts` to:

```
import {initializeTemporalClient} from "./modules/cloud-temporal-client";
```

Then run:

```
npm start
```
