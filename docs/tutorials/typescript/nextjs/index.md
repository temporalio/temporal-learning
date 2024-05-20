---
id: nextjs-tutorial
sidebar_position: 2
keywords: [TypeScript, temporal, sdk, tutorial, NextJS]
tags: [TypeScript, SDK]
last_update:
  date: 2021-10-01
title: Integrating Temporal into an existing Next.js application
description: Explore how Temporal integrates into an existing Next.js application using Next.js API routes. This gives you the ability to write full-stack, long-running applications end to end in TypeScript.
image: /img/temporal-logo-twitter-card.png
---

![Temporal TypeScript SDK](/img/sdk_banners/banner_typescript.png)

import { OutdatedNotice } from '@site/src/components'

<OutdatedNotice />

## Introduction

In this tutorial, you'll explore how Temporal integrates into an **existing Next.js application** using Next.js API routes. This gives you the ability to write full-stack, long-running applications end to end in TypeScript.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal Applications using the TypeScript programming language](/getting_started/typescript/dev_environment/)

This tutorial is written for a reasonably experienced TypeScript/Next.js developer.  Whether you are using [Gatsby Functions](https://www.gatsbyjs.com/docs/reference/functions/), [Blitz.js API Routes](https://blitzjs.com/docs/api-routes) or just have a standard Express.js app, you should be able to adapt this tutorial with only minor modifications.

:::tip Skip ahead

**To skip straight to a fully working example, you can check our [samples-typescript repo](https://github.com/temporalio/samples-typescript/tree/main/nextjs-ecommerce-oneclick)** or use the [package initializer](https://docs.temporal.io/typescript/package-initializer) to create a new project with the following command:

```command
npx @temporalio/create@latest nextjs-temporal-app --sample nextjs-ecommerce-oneclick
```
:::

## Prerequisites

- [Set up a local development environment for developing Temporal applications using TypeScript](/getting_started/typescript/dev_environment/index.md)
- Review the [Hello World in TypeScript tutorial](/getting_started/typescript/hello_world_in_typescript/index.md) to understand the basics of getting a Temporal TypeScript SDK project up and running.

## Create a Next.js project

Create a new Next.js project with the `create-next-app` tool:

```command
npx create-next-app@latest nextjs-temporal
```

Accept all of the defaults. When the project generator completes, and the dependencies install, switch to the new project's root directory;

```command
cd nextjs-temporal
```




## Add Temporal to your Next.js project

Temporal doesn't prescribe folder structure; feel free to ignore or modify these instructions per your own needs.

In the root directory of your Next.js project, execute the following command to install Temporal and its dependencies:

```command
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```

Install the `@tsconfig/node20` package as a developer dependency, as you'll use it as the foundation for a Temporal-specific `tsconfig` file.

```command
npm install --save-dev @tsconfig/node20
```

Then set up folders and files for your Workflow, Activity, and Worker code:

```command
mkdir -p temporal/src # create folder, recursively
```

```command
touch temporal/src/worker.ts temporal/src/workflows.ts temporal/src/activities.ts
```


Configure TypeScript to compile from `temporal/src` to `temporal/lib` with a `tsconfig.json`.

```command
touch temporal/tsconfig.json
```

Add the following configuration to the file:

```json
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "version": "4.4.2",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "./src",
    "outDir": "./lib"
  },
  "include": ["src/**/*.ts"]
}
```

For convenience, set up some scripts to run the builds in your project root's `package.json`.

Add the `npm-run-all` command to your project as a dependency:

```command
npm install npm-run-all --save-dev
```

Then use `npm-run-all` to define scripts to run your Temporal build processes and run the Next.JS app alongside Temporal Workers.

Locate your existing `scripts` section, which defines  scripts to run and build Next.js applications:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
```

Change the scripts so you can build and run your Next.js application and your Temporal Workers at the same time:

```json
  "scripts": {
    "dev": "npm-run-all -l build:temporal --parallel dev:temporal dev:next start:worker",
    "dev:next": "next dev",
    "dev:temporal": "tsc --build --watch ./temporal/tsconfig.json",
    "build:next": "next build",
    "build:temporal": "tsc --build ./temporal/tsconfig.json",
    "start:worker": "nodemon ./temporal/lib/worker",
    "start": "next start",
    "lint": "eslint ."
  },
```

These scripts let you run the following steps with a single `npm run dev` command:

- build Temporal once.
- start Next.js locally.
- start a Temporal Worker.
- rebuild Temporal files when they change.

With your project configured, you can write your Temporal Workflows and Activities.

## Write your first Workflow, Activity and Worker

Activities are the only way to interact with the outside world in Temporal. You use them to make API requests, access the filesystem, or perform other non-deterministic operations.
See the [Activities docs](https://docs.temporal.io/dev-guide/typescript/foundations//#develop-activities) for more info.

Inside of `/temporal/src/activities.ts`, write a basic Activity function for a "purchase.":

```ts
// /temporal/src/activities.ts
import { Context } from '@temporalio/activity';

export async function purchase(id: string): Promise<string> {
  console.log(`Purchased ${id}!`);
  return Context.current().info.activityId;
}
```

This Activity prints a message to the console and returns the ID of the Activity. In a real application it would interact with a payment API.

Next, define the order Workflow.

Inside of `/temporal/src/workflows.ts`, write a Workflow function that calls this Activity:

```ts
// /temporal/src/workflows.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities'; // purely for type safety

const { purchase } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function OneClickBuy(id: string): Promise<string> {
  const result = await purchase(id); // calling the activity
  await sleep('10 seconds'); // demo use of timer
  console.log(`Activity ID: ${result} executed!`);
}
```

Workflow code is bundled and run inside a [deterministic v8 isolate](https://docs.temporal.io/typescript/determinism) so we can persist and replay every state change.
This is why Workflow code must be separate from Activity code, and why you have to `proxyActivities` instead of directly importing them.
Workflows also have access to a special set of [Workflow APIs](https://docs.temporal.io/typescript/workflows#workflow-apis) which we recommend exploring next.

With your Workflows and Activities done, you can now write the Worker that will host both and poll the `ecommerce-oneclick` Task Queue.

In `temporal/src/worker.ts`, add the following code:

```ts
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

run().catch((err) => console.log(err));

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'ecommerce-oneclick',
  });

  // Start accepting tasks on the `tutorial` queue
  await worker.run();
}
```

When the Worker finds Workflow Tasks or Activity Tasks for the Workflows and Activities it's hosting, it executes them.

See the full [Worker docs](https://docs.temporal.io/dev-guide/typescript/foundations//#run-worker-processes) for more info.

You can now run your Worker with the following command:

```
npm run build:temporal && npm run start:worker`
```

However, you don't have a way to run your Workflow from the application yet.

## Write a Temporal Client inside a Next.js API Route

You'll use Next.js API routes to expose a serverless endpoint that your frontend can call and then communicate with Temporal on the backend.

In the root of your application, add a new `pages/api` folder:

```command
mkdir pages/api
```

Then create the file `pages/api/startBuy.ts`:

```command
touch pages/api/startBuy.ts
```

Within the file, create a `startBuy` route, add a Temporal Client and use it to start a Workflow Execution:

```ts
import { Connection, Client } from '@temporalio/client';
import { OneClickBuy } from '../../temporal/lib/workflows.js';

export default async function startBuy(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Only POST requests allowed' });
    return;
  }

  const { itemId, transactionId } = req.body;
  if (!itemId) {
    res.status(405).send({ message: 'must send itemId to buy' });
    return;
  }
  const connection = await Connection.connect();
  const client = new Client({ connection });
  await client.workflow.start(OneClickBuy, {
    taskQueue: 'ecommerce-oneclick',
    workflowId: transactionId,
    args: [itemId],
  });

  res.status(200).json({ ok: true });
}
```

Save the file.

Now start Next.js and the Temporal worker using the `npm run dev` script you defined:


```command
npm run dev # start Temporal and Next.js in parallel
```

In another terminal window, Use the `curl` command to make a request to the API endpoint, which starts the Temporal Workflow:

```command
curl -d '{"itemId":"item123"}' \
     -H "Content-Type: application/json" \
     -X POST http://localhost:3000/api/startBuy
```

The terminal that's running your application and Temporal Worker will print `Purchased item123`.

To call the API Route from the Next.js frontend, you'd use the `fetch` API to make a request o the `/api/startbuy` method using a similar payload.


```ts
// /pages/index.ts or whatever page you are on
// inside event handler
fetch('/api/startBuy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ itemId }),
});
```

In a production application, the `itemId` would come from another part of your application, such as a database or a Shopify store.

## Deploying your Temporal + Next.js app

You can deploy your Next.js app, including Next.js API Routes with Temporal Clients in them, anywhere you can deploy Next.js applications, including in serverless environments like Vercel or Netlify.

:::important

However, your Temporal Workers **must** be deployed in traditional environments, such as EC2, DigitalOcean, or Render. They won't work in a serverless environment).

:::

**Both Temporal Clients and Temporal Workers must be configured to communicate with a Temporal Service**, whether self-hosted or Temporal Cloud.
To connect to a Temporal Service using mTLS authentication, you will need to configure the connection address, namespace, and mTLS certificates and keys.

You can review [Run Workers with Temporal Cloud for the TypeScript SDK](run-workers-with-cloud-typescript) for more details on creating certificates and connecting to Temporal Cloud.

```ts
// before Worker.create call in worker.ts
const connection = await NativeConnection.connect({
  address,
  tls: {
    clientCertPair: {
      crt: fs.readFileSync(clientCertPath),
      key: fs.readFileSync(clientKeyPath),
    },
  },
});

// inside each Client call inside API Route
const connection = await Connection.connect({
  address,
  tls: {
    clientCertPair: {
      crt: fs.readFileSync(clientCertPath),
      key: fs.readFileSync(clientKeyPath),
    },
  },
});
```

[See the mTLS tutorial](https://docs.temporal.io/typescript/security#mtls-tutorial) for full details, or get in touch with us on Slack if you have reached this stage.

## Production Concerns

As you move into production with your app, please review our docs on:

- [Securing](https://docs.temporal.io/typescript/security)
- [Testing](https://docs.temporal.io/typescript/testing)
- [Patching](https://docs.temporal.io/typescript/patching) (aka migrating code to new versions)
- [Logging](https://docs.temporal.io/typescript/logging)
- [Production Deploy Checklist](https://docs.temporal.io/typescript/production-deploy)

You will also want to have a plan for **monitoring and scaling your Temporal Workers** that host and execute your Activity and Workflow code (separately from monitoring and scaling Temporal Server itself).

## Conclusion

At this point, you have a working full stack example of a Temporal Workflow running inside your Next.js app.

You can explore adding [Signals](https://docs.temporal.io/dev-guide/typescript/features//#signals)  [Queries](https://docs.temporal.io/dev-guide/typescript/features//#queries) to your Workflow, then adding a new API Route to call them.
You can choose to set up one API Route per Signal or Query, or have one API Route handle all of them, Temporal has no opinion on how you set up routing.

Again, for a fully working example, you can check our [samples-typescript repo](https://github.com/temporalio/samples-typescript/tree/main/nextjs-ecommerce-oneclick).
