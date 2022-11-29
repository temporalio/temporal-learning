---
id: hello-world
sidebar_position: 1
keywords: [typescript, javascript, temporal, sdk, tutorial, learn]
tags: [TypeScript, SDK]
last_update:
  date: 2022-11-28
title: Build a Temporal "Hello World!" app from scratch in TypeScript
---
:::note Tutorial information

- **Level:** ⭐ Temporal beginner
- **Time:** ⏱️ ~10 minutes
- **Goals:** 🙌
  - Set up, build, and test a Temporal application project from scratch using the [TypeScript SDK](https://github.com/temporalio/sdk-typescript).
  - Identify the four parts of a Temporal Workflow application
  - Describe how the Temporal server gets information to the Worker	
:::

### Introduction

Creating reliable applications is a difficult task. [Temporal](https://temporal.io) lets you create fault-tolerant resiliant applications using programming languages you already know, so you can build complex applications that execute successfully and recover from failures.

In this tutorial, you will build your first Temporal Application from scratch using the [Temporal TypeScript SDK](https://github.com/temporalio/sdk-typescript). The app will consist of four pieces:

1. A [Workflow](https://docs.temporal.io/workflows): Workflows are functions that define the overall flow of the application and represent the orchestration aspect of the business logic.
2. An [Activity](https://docs.temporal.io/activities): Activities are functions called during Workflow Execution and represent the execution aspect of your business logic. The Workflow you'll create executes a single Activity, which takes a string from the Workflow as input and returns a formatted version of this string to the Workflow.
3. A [Worker](https://docs.temporal.io/workers): Workers host the Activity and Workflow code and execute the code piece by piece.
4. An initiator: To start a Workflow, you need to send a signal to the Temporal server to tell it to track the state of the Workflow. You'll write a separate program to do this.

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal applications.

All of the code in this tutorial is available in hello-world directory of the [samples-typescript](https://github.com/temporalio/samples-typescript/tree/main/hello-world) repository. 

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal applications using Node.js and TypeScript](/getting_started/typescript/dev_environment/index.md)

The TypeScript SDK requires Node.js 14 or later

## Create a new project

To create an app with the Temporal TypeScript SDK, you'll create a new directory and use `npm` to initialize it as a Node.js project. Then you'll add the Temporal SDK packages and other dependencies to your project. 

In a terminal, create a new project directory called `hello-world`:

```command
mkdir hello-world
```

Switch to the new directory:

```command
cd hello-world
```

Create a `package.json` file: 

```command
touch package.json
```

Copy and paste the following in your `package.json`:

[package.json](https://github.com/temporalio/samples-typescript/blob/main/hello-world/package.json)

```json
{
  "name": "temporal-hello-world",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsc --build",
    "build.watch": "tsc --build --watch",
    "lint": "eslint .",
    "start": "ts-node src/worker.ts",
    "start.watch": "nodemon src/worker.ts",
    "workflow": "ts-node src/client.ts"
  },
  "nodemonConfig": {
    "execMap": {
      "ts": "ts-node"
    },
    "ext": "ts",
    "watch": [
      "src"
    ]
  },
  "dependencies": {
    "@temporalio/activity": "^1.0.0",
    "@temporalio/client": "^1.0.0",
    "@temporalio/worker": "^1.0.0",
    "@temporalio/workflow": "^1.0.0",
    "nanoid": "3.x"
  },
  "devDependencies": {
    "@tsconfig/node16": "^1.0.0",
    "@types/node": "^16.11.43",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-deprecation": "^1.2.1",
    "nodemon": "^2.0.12",
    "ts-node": "^10.8.1",
    "typescript": "^4.4.2"
  }
}
```

There are a few parts of the `package.json` you should check out, and the first is the scripts object. These are the `npm` commands you'll use to build, lint and start your application code.  

Next, take a look at the packages listed as dependencies. These are the packages that make up the the Temporal TypeScript SDK, and each package maps to the four parts of a Temporal application: an activity, client, worker, and workflow. There is also [Nanoid](https://npm.io/package/nanoid), an `npm` package which will let you generate a unique ID for your workflow.

Finally, look through the dev dependencies. These are the packages that let you setup a Node.js project with Nodemon, TypeScript and ESLint. You'll be using [ts-node](https://github.com/TypeStrong/ts-node) which will directly run TypeScript on Node.js without you needing to precompile. 

Download the dependencies specified in the `package.json` file with the command: 

```command
npm install
```

Once this command is complete, you will have a `package-lock.json` file and a `node_modules` directory. 

Your project workspace is configured, so you're ready to create your first Temporal Activity and Workflow. You'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities. You define a Workflow by writing a *Workflow Definition* using one of the Temporal SDKs. You can learn more in the [Workflow parameters](https://docs.temporal.io/application-development/foundations/#workflow-parameters) section of the Temporal documentation.

To begin your workflow, create a new subdirectory called `src`:

```command
mkdir src
```

Create the file `workflows.ts` in the `src` directory: 

```command
touch src/workflows.ts
```

Next, add the following TypeScript code to define the Workflow:

:::info

The JavaScript code is an example of the code that the TypeScript compiler will generate, and you do not need to copy and paste it. This is true for all the following code samples.

:::


<!--SNIPSTART typescript-hello-workflow-->
[hello-world/src/workflows.ts](https://github.com/temporalio/samples-typescript/blob/master/hello-world/src/workflows.ts)
```ts
import { proxyActivities } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
export async function example(name: string): Promise<string> {
  return await greet(name);
}
```
<!--SNIPEND-->

In this code, the variable `greet` is assigned the value of `proxyActivites`, which is a method from the Temporal TypeScript SDK that lets you configure the Activity with different options. In this example, you have specified that start to close timeout for your activity will be one minute, meaning that your activity has one minute to begin before it time sout. Of all the Temporal timeout options,  `startToCloseTimeOut` is the one you should always set. 

The `example` function executes an Activity called `greet`, and the function returns the result of the Activity. You'll create the `greet` function in the next section. 

:::tip
You can pass multiple inputs to a Workflow, but it's a good practice to send a single input. If you have several values you want to send, you should define a Struct and pass that into the Workflow instead.
:::

You can learn more about the kinds of inputs you can pass to a Workflow in the [Workflow parameters](https://docs.temporal.io/application-development/foundations#workflow-parameters) section of the Temporal documentation. Next, you'll define the Activity that your workflow will execute. 

## Create an Activity

You use Activities in your Temporal Applications to execute non-deterministic code or perform operations that may fail.

For this tutorial, your Activity won't be complex; you'll create an Activity that takes a string as input and uses it to create a new string as output, which is then returned to the Workflow. This will let you see how Workflows and Activities work together without building something complicated.

With the Temporal TypeScript SDK, you define Activities similarly to how you define Workflows: using an exportable TypeScript module.

Create the file `activities.ts` in the `src` directory:

```command
touch src/activities.ts
```

Add the following code to define a `greet` function:

<!--SNIPSTART typescript-hello-activity-->
[hello-world/src/activities.ts](https://github.com/temporalio/samples-typescript/blob/master/hello-world/src/activities.ts)
```ts
export async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}
```
<!--SNIPEND-->

Your Activity Definition can accept input parameters. Review the [Activity parameters](https://docs.temporal.io/application-development/foundations?lang=typescript#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

You've completed the logic for the application; you have a Workflow and an Activity defined. Next, you'll setup a Worker.

## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity functions and executes them one at a time. The Temporal Server tells the Worker to execute a specific function from information it pulls from the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue). After the Worker runs the code, it communicates the results back to the Temporal Server.

Create a new file for the Worker:

```command
touch src/worker.ts
```

Copy and paste this code in the `worker.ts` file:

<!--SNIPSTART typescript-hello-worker-->
[hello-world/src/worker.ts](https://github.com/temporalio/samples-typescript/blob/master/hello-world/src/worker.ts)
```ts
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // Step 1: Register Workflows and Activities with the Worker and connect to
  // the Temporal server.
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'hello-world',
  });
  // Worker connects to localhost by default and uses console.error for logging.
  // Customize the Worker by passing more options to create():
  // https://typescript.temporal.io/api/classes/worker.Worker
  // If you need to configure server connection parameters, see docs:
  // https://docs.temporal.io/typescript/security#encryption-in-transit-with-mtls

  // Step 2: Start accepting tasks on the `hello-world` queue
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```
<!--SNIPEND-->

In the code, you configure your Worker process by creating create an async function called `run`. In the function body, you initialize a variable called `worker`, and the worker variable uses the TypeScript SDK to create a Worker with a `workflowsPath` that will run your activities and a specifies the name of a Task Queue. You need to define the Task Queue name, and in this example it is called `hello-world`.

Your Worker is configured, and next you will start your worker from the command line. 

## Run the Worker 

You will use an npm script to start your worker. Run the command: 

```command
npm run start.watch
```
The script runs and returns the result:

```
> temporal-hello-world@0.1.0 start
> ts-node src/worker.ts workflow.watch

2022-11-22T04:38:12.091Z [INFO] Creating worker {
  options: {
    namespace: 'default',
    identity: '65411@User-MacBook-Pro.local',
    shutdownGraceTime: '10s',
    maxConcurrentActivityTaskExecutions: 100,
    maxConcurrentLocalActivityExecutions: 100,
    enableNonLocalActivities: true,
    maxConcurrentWorkflowTaskExecutions: 100,
    stickyQueueScheduleToStartTimeout: '10s',
    maxHeartbeatThrottleInterval: '60s',
    defaultHeartbeatThrottleInterval: '30s',
    isolateExecutionTimeout: '5s',
    workflowThreadPoolSize: 8,
    maxCachedWorkflows: 261,
    enableSDKTracing: false,
    showStackTraceSources: false,
    debugMode: false,
    interceptors: { activityInbound: [Array], workflowModules: [Array] },
    sinks: { defaultWorkerLogger: [Object] },
    workflowsPath: '/Users/kim/hello-world-temporal/src/workflows.ts',
    activities: { greet: [AsyncFunction: greet] },
    taskQueue: 'hello-world',
    shutdownGraceTimeMs: 10000,
    stickyQueueScheduleToStartTimeoutMs: 10000,
    isolateExecutionTimeoutMs: 5000,
    maxHeartbeatThrottleIntervalMs: 60000,
    defaultHeartbeatThrottleIntervalMs: 30000,
    loadedDataConverter: {
      payloadConverter: [DefaultPayloadConverter],
      failureConverter: [DefaultFailureConverter],
      payloadCodecs: []
    }
  }
}
2022-11-22T04:38:13.298Z [INFO] asset workflow-bundle-d624b57670e912aab581.js 695 KiB [emitted] [immutable] (name: main)
2022-11-22T04:38:13.298Z [INFO] runtime modules 937 bytes 4 modules
2022-11-22T04:38:13.298Z [INFO] modules by path ./node_modules/@temporalio/ 209 KiB
2022-11-22T04:38:13.298Z [INFO]   modules by path ./node_modules/@temporalio/common/ 111 KiB 19 modules
2022-11-22T04:38:13.298Z [INFO]   modules by path ./node_modules/@temporalio/workflow/ 95.2 KiB
2022-11-22T04:38:13.298Z [INFO]     ./node_modules/@temporalio/workflow/lib/worker-interface.js 11.8 KiB [built] [code generated]
2022-11-22T04:38:13.299Z [INFO]     ./node_modules/@temporalio/workflow/lib/alea.js 2.87 KiB [built] [code generated]
2022-11-22T04:38:13.299Z [INFO]     + 11 modules
2022-11-22T04:38:13.299Z [INFO]   ./node_modules/@temporalio/worker/lib/workflow-log-interceptor.js 2.25 KiB [built] [code generated]
2022-11-22T04:38:13.299Z [INFO] modules by path ./src/ 784 bytes
2022-11-22T04:38:13.299Z [INFO]   ./src/workflows-autogenerated-entrypoint.js 540 bytes [built] [code generated]
2022-11-22T04:38:13.299Z [INFO]   ./src/workflows.ts 244 bytes [built] [code generated]
2022-11-22T04:38:13.299Z [INFO] __temporal_custom_payload_converter (ignored) 15 bytes [built] [code generated]
2022-11-22T04:38:13.299Z [INFO] __temporal_custom_failure_converter (ignored) 15 bytes [built] [code generated]
2022-11-22T04:38:13.299Z [INFO] ./node_modules/ms/index.js 2.95 KiB [built] [code generated]
2022-11-22T04:38:13.299Z [INFO] webpack 5.75.0 compiled successfully in 540 ms
2022-11-22T04:38:13.303Z [INFO] Workflow bundle created { size: '0.68MB' }
2022-11-22T04:38:13.751Z [INFO] Worker state changed { state: 'RUNNING' }
```

In the output, you will see an object listing the worker options and their values, as well as timestamps from nodemon describing which programs have been invoked and when the Worker in running. Because the project runs `ts-node src/worker.ts` with [nodemon](https://nodemon.io/) so that when a change is made to the code, nodemon will automatically reload the worker. 

Now that you have your Worker running, it's time for you to start a Workflow execution. 

## Configure a Workflow Execution

You can start a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. 

Starting a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, configuring the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL. In this tutorial, you will create a `client.ts` file that triggers your Temporal Workflow. 


Create a `client.ts` file in the `src` directory:

```command
touch src/client.ts
```

Copy and paste the following code:

<!--SNIPSTART typescript-hello-client-->
[hello-world/src/client.ts](https://github.com/temporalio/samples-typescript/blob/master/hello-world/src/client.ts)
```ts
import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  // Connect to the default Server location (localhost:7233)
  const connection = await Connection.connect();
  // In production, pass options to configure TLS and other settings:
  // {
  //   address: 'foo.bar.tmprl.cloud',
  //   tls: {}
  // }

  const client = new WorkflowClient({
    connection,
    // namespace: 'foo.bar', // connects to 'default' namespace if not specified
  });

  const handle = await client.start(example, {
    // type inference works! args: [name: string]
    args: ['Temporal'],
    taskQueue: 'hello-world',
    // in practice, use a meaningful business id, eg customerId or transactionId
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  // optional: wait for client result
  console.log(await handle.result()); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```
<!--SNIPEND-->

In the `client.ts` file, the `run` function sets up a connection string, invokes your activity (the `greet` function), passes in an argument for the `name` parameter (in this example, the name is Temporal) and assigns the workflow a unique ID with Nanoid. 

Now that your client is setup, it's time for you to use this code to start your Workflow execution. 

## Start a Workflow Execution

To start your Workflow, open a new tab in your terminal and change into the `src` directory: 

```command
cd src
```

Then, run the npm script: 

```command
npm run workflow
```

The script runs and returns the result:  

```
Hello, Temporal! 
```

The "Hello, Temporal!" output is generated as the result of a few steps. First, `client.ts` passes 'Temporal' as an argument to the Workflow. Next, the Workflow passes the argument to the Activity, and finally the Activity taking the argument as name and returning `Hello, ${name}!`.

In this example, you create a unique ID for your Workflow using Nanoid. The [Workflow ID](https://docs.temporal.io/application-development/foundations?lang=ts#workflow-id) is tracked by the Task Queue, and the the Worker is looking for tasks on that Task Queue.

:::tip Specify a Workflow ID
You don't need to specify a Workflow ID, as Temporal will generate one for you, but defining the ID yourself makes it easier for you to find it later in logs or interact with a running Workflow in the future. 

Using an ID that reflects some business process or entity is a good practice. For example, you might use a customer ID or email address as part of the Workflow ID  if you ran one Workflow per customer. This would make it easier to find all of the Workflow Executions related to that customer later.
:::

You can [get the results](https://docs.temporal.io/application-development/foundations?lang=typescript#get-workflow-results) from your Workflow right away, or you can get the results at a later time. 

You have successfully built a Temporal application from scratch!

## Conclusion

You now know how to build a Temporal Workflow application using the TypeScript SDK.

### Review

Answer the following questions to see if you remember some of the important concepts from this tutorial:

<details>
<summary>

**What are the four parts of a Temporal Workflow application?**

</summary>

1. An Activity function.
2. A Workflow function.
3. A Worker to host the Activity and Workflow code.
4. Some way to start the Workflow.

</details>

<details>
<summary>

**How does the Temporal server get information to the Worker?**

</summary>

It adds the information to a Task Queue.

</details>
