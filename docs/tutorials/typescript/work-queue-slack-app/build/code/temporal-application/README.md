# Work Queue Slack App Temporal Application

**Development**

To run the application as a local development Worker, ensure you have a `.env` file at the root of the Temporal Application project with the following variables:

ENV="dev"
TEMPORAL_DEV_NAMESPACE=""

Then run:

```
npm run start-dev
```

To test the application:

```
npm test
```

**Production**

To run the application as a Temporal Cloud Worker, ensure you have a `.env` file at the root of the Temporal Application project with the following variables:

ENV="prod"
TEMPORAL_CLOUD_ADDRESS=""
TEMPORAL_CLOUD_NAMESPACE=""
TEMPORAL_DEV_NAMESPACE=""
TEMPORAL_CLOUD_PEM=""
TEMPORAL_CLOUD_PRIVATE_KEY=""

Then run:

```
npm run start-cloud
```
