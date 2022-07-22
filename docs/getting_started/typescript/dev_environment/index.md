---
id: ts-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the TypeScript programming language.
keywords: [typescript, javascript, js, temporal, sdk, development environment]
tags: [TypeScript, SDK, development environment]
last_update:
  date: 2022-07-22
title: Set up a Local Development Environment for Temporal and TypeScript
---

To follow the TypeScript SDK tutorials and build your own Temporal applications, you'll need the TypeScript SDK and a Temporal server.

## Install Node.js

Install Node.js via your package manager by following [the official Node.js instructions](https://nodejs.org/en/download/package-manager/).

## Set up the Temporal TypeScript SDK

The TypeScript SDK requires Node.js 14 or later.

You can create a new project with the Temporal SDK:.

```command
npx @temporalio/create@latest ./my-app
```

You can also add the Temporal TypeScript SDK to an existing project with the following command:

```command
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```


## Set up a Temporal development server

Download and install the Temporal Server locally using Docker Compose by following [How to run a Temporal Cluster for local development using Docker Compose](https://docs.temporal.io/clusters/quick-install/#docker-compose).

You'll run this server in the background while you develop your applications.

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
