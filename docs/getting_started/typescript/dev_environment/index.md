---
id: ts-dev-env
title: Set up a local development environment for Temporal and TypeScript
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the TypeScript programming language.
keywords: [typescript, javascript, js, temporal, sdk, development environment]
tags: [TypeScript, SDK, development environment]
last_update:
  date: 2023-03-27
image: /img/temporal-logo-twitter-card.png
---

<img className="banner" src="/img/sdk_banners/banner_typescript.png" alt="Temporal TypeScript SDK" />

To follow the TypeScript SDK tutorials and build your own Temporal applications, you'll need the TypeScript SDK and a Temporal server.

## Install Node.js

The TypeScript SDK requires Node.js 18 or later.

Install Node.js via your package manager by following [the official Node.js instructions](https://nodejs.org/en/download/package-manager/).

## Set up the Temporal TypeScript SDK

You can create a new project with the Temporal SDK:

```command
npx @temporalio/create@latest ./my-app
```

You can also add the Temporal TypeScript SDK to an existing project with the following command:

```command
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```

Next, you'll configure a local Temporal Service for development.

## Set up a local Temporal Service for development with Temporal CLI

import TemporalService from '@site/docs/getting_started/_temporal_service.md'

<TemporalService />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
