---
id: hello-world
sidebar_position: 1
keywords: [typescript, javascript,temporal,sdk,tutorial,learn]
tags: [TypeScript, SDK]
last_update:
  date: 2021-10-01
title: Temporal "Hello World!" app in TypeScript
description: Explore the components that make up the Hello World program in TypeScript..
---

:::info WORK IN PROGRESS
This tutorial is a work in progress. Some sections may be incomplete, out of date, or missing. We're working to update it.
:::

## Introduction

In this tutorial, you'll explore the different components that make up a Temporal project using the TypeScript SDK.  The SDK steers developers to write  Workflows and Activities in TypeScript but vanilla JS is also supported.

## Prerequisites

- [Set up a local development environment for developing Temporal applications using TypeScript](/getting_started/typescript/dev_environment/index.md)

### Define a Workflow

In the TypeScript SDK, each Workflow execution is run in a separate V8 isolated context in order to provide a [deterministic runtime](https://docs.temporal.io/typescript/determinism).

A Workflow is also an async function, but it has access to special Workflow APIs like [Signals](https://docs.temporal.io/concepts/what-is-a-signal), [Queries](https://docs.temporal.io/concepts/what-is-a-query), Timers, and Child Workflows.

The following snippet uses `proxyActivities` to create a function that, when called, schedules an Activity in the system:

`src/workflows.ts`

<!--SNIPSTART typescript-hello-workflow -->
<!--SNIPEND-->


[@temporalio/workflow API reference](https://typescript.temporal.io/api/namespaces/workflow)

### Define an activity

Activities are called from Workflows in order to run non-deterministic code.

[@temporalio/activity API reference](https://typescript.temporal.io/api/namespaces/activity)

Any async function can be used as an Activity as long as its parameters and return value are serializable.
Activities run in the Node.js execution environment, meaning you can easily port over any existing code into an Activity and it should work.

`src/activities.ts`

<!--SNIPSTART typescript-hello-activity -->
<!--SNIPEND-->


### Worker

[@temporalio/worker API reference](https://typescript.temporal.io/api/namespaces/worker)

The Worker hosts Workflows and Activities, connects to Temporal Server, and continually polls a Task Queue for Commands coming from Clients (see below).
See the list of [WorkerOptions](https://typescript.temporal.io/api/interfaces/worker.workeroptions) for customizing Worker creation.

`src/worker.ts`

<!--SNIPSTART typescript-hello-worker -->
<!--SNIPEND-->

### Client

[@temporalio/client API reference](https://typescript.temporal.io/api/namespaces/client)

The [`WorkflowClient`](https://typescript.temporal.io/api/classes/client.workflowclient) class is used to interact with existing Workflows or to start new ones.

It can be used in any Node.js process (for example, an [Express](https://expressjs.com/) web server) and is separate from the Worker.

`src/client.ts`

<!--SNIPSTART typescript-hello-client -->
<!--SNIPEND-->

### Testing

There is no official test suite for Workflows and Activities yet.

- Since Activities are async functions, they should be testable as long as you avoid using [Context](https://typescript.temporal.io/api/classes/activity.context) or are able to mock it.
- You can test Workflows by running them with a [WorkflowClient](https://typescript.temporal.io/api/classes/client.workflowclient).
- Check [the SDK's own tests](https://github.com/temporalio/sdk-typescript/tree/52f67499860526cd180912797dc3e6d7fa4fc78f/packages/test/src) for more examples.

## Conclusion

You should now be familiar with the Hello World project, which is the main way we encourage scaffolding out new projects.

Dive deeper into developing with TypeScript with the following tutorials:

- Explore using Signals, Queries and Timers in our [Subscription Workflow tutorial](/tutorials/typescript/subscriptions/index.md).
- Use Temporal in a larger Node.js app in [Integrate Temporal into an existing Next.js application
](/tutorials/typescript/nextjs/index.md).
