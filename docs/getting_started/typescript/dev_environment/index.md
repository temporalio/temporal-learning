---
id: ts-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the TypeScript programming language.
keywords: [typescript, javascript, js, temporal, sdk, development environment]
tags: [TypeScript, SDK, development environment]
last_update:
  date: 2022-11-08
title: Set up a local development environment for Temporal and TypeScript
image: /img/temporal-logo-twitter-card.png
---

To follow the TypeScript SDK tutorials and build your own Temporal applications, you'll need the TypeScript SDK and a Temporal server.

## Install Node.js

The TypeScript SDK requires Node.js 14 or later.

Install Node.js via your package manager by following [the official Node.js instructions](https://nodejs.org/en/download/package-manager/).

## Set up the Temporal TypeScript SDK

:::caution Node.js Version
The Temporal TypeScript SDK Package Initializer (`@temporalio/create`) fails with Node.js 18 on versions 18.7 or higher due to an issue with an upstream Node.js library. You can upgrade to Node.js 19, revert to Node.js 18.6 or lower, or use the [Hello World](https://github.com/temporalio/samples-typescript/tree/main/hello-world) project from our TypeScript SDK samples as a starting point for your applications until this issue with Node.js 18 is resolved.
:::

You can create a new project with the Temporal SDK:.

```command
npx @temporalio/create@latest ./my-app
```

You can also add the Temporal TypeScript SDK to an existing project with the following command:

```command
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```


## Set up a Temporal development cluster

Download and install the Temporal development cluster locally using Docker Compose. You'll run this server in the background while you develop your applications.

You must have [Docker](https://docs.docker.com/engine/install) and [Docker Compose](https://docs.docker.com/compose/install) installed.

Then clone the [temporalio/docker-compose](https://github.com/temporalio/docker-compose) repository and run `docker-compose up` from the root of that repo:

```command
git clone https://github.com/temporalio/docker-compose.git
```

```command
cd docker-compose
```

```command
docker-compose up
```

When the Temporal Cluster is running, the Temporal Web UI becomes available in your browser: [localhost:8080](http://localhost:8080/)

Review other methods in the [Run a dev Cluster](https://docs.temporal.io/application-development/foundations#run-a-dev-cluster) section in Temporal's documentation.

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
