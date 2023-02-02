---
id: chatbot-tutorial
sidebar_position: 4
keywords: [TypeScript, temporal, sdk, tutorial]
tags: [TypeScript, SDK]
last_update:
  date: 2021-10-01
title: Choose Your Own Adventure Bot walkthrough in TypeScript
description: In this tutorial, we'll integrate all the knowledge gained from Core and Production APIs in an end-to-end, complete demo application.
image: /img/temporal-logo-twitter-card.png
---

import { OutdatedNotice } from '@site/src/components'

<OutdatedNotice />

## Introduction

In this tutorial, we'll integrate all the knowledge gained from Core and Logging APIs in an end-to-end, complete demo application - which happens to be a Choose Your Own Adventure game that you can play on Discord or Slack!

This project will integrate and give context to your understanding of [Temporal SDK APIs](https://docs.temporal.io/application-development/foundations?lang=typescript/#develop-workflows): logging with Sinks, Activity dependency injection, Timer and Promise.race design patterns, Signals (and HTTP Servers for them), Polling patterns, and `continueAsNew` for indefinitely long running Workflows.

:::tip Skip ahead

View the completed project on GitHub: https://github.com/JoshuaKGoldberg/temporal-adventure-bot

:::

Let's dive in!

## Prerequisites

- [Set up a local development environment for developing Temporal applications using TypeScript](/getting_started/typescript/dev_environment/index.md)
- Review the [Hello World in TypeScript tutorial](/getting_started/typescript/hello_world_in_typescript/index.md) to understand the basics of getting a Temporal TypeScript SDK project up and running.

## Project Requirements

- On `/instructions`, posts instructions to Slack/Discord and pins the message
- Continuously runs the game until it reaches an end state:
  - Every day, post the current entry as a poll
  - Wait until the earlier of:
    - Every day, check the poll results
      - If there is consensus, determine next state
      - If no consensus, remind people to vote
    - Allow an admin to `/force` a choice any time
- Report important game updates to a specified logger

import { ResponsivePlayer } from '@site/src/components'

<ResponsivePlayer url='https://www.youtube.com/watch?v=hGIhc6m2keQ' />

[00:00](https://youtube.com/watch?v=hGIhc6m2keQ&t=0s) Project Intro and Demo  
[03:30](https://youtube.com/watch?v=hGIhc6m2keQ&t=210s) Temporal Worker - Activity Dependency Injection  
[07:00](https://youtube.com/watch?v=hGIhc6m2keQ&t=420s) Temporal Sinks for Logging  
[08:00](https://youtube.com/watch?v=hGIhc6m2keQ&t=480s) Temporal Client  
[10:50](https://youtube.com/watch?v=hGIhc6m2keQ&t=650s) RunGame Workflow and Game Logic  
[13:45](https://youtube.com/watch?v=hGIhc6m2keQ&t=825s) Async Race Design Pattern: Timers vs Humans  
[15:00](https://youtube.com/watch?v=hGIhc6m2keQ&t=900s) Design Pattern: Polling  
[18:05](https://youtube.com/watch?v=hGIhc6m2keQ&t=1085s) Signals  
[20:00](https://youtube.com/watch?v=hGIhc6m2keQ&t=1200s) HTTP Server for Signal  
[23:00](https://youtube.com/watch?v=hGIhc6m2keQ&t=1380s) ContinueAsNew


## Overview

### Worker

The Temporal Worker is set up in `src/worker.ts`.
It uses two common Temporal patterns:

- **Dependency Injection**: using the integration object created by `createIntegration` to provide APIs for the social platform being targeted (`Discord` or `Slack`) (see [Platforms](#platforms))
- **Logging Sinks**: providing a `logger.sink` method for the Workflows to log out to `console.log`

### Client

The client in `src/client.ts` will ask Temporal to run two different Workflows:

1. **`instructions`**: Posts instructions to the social platform and pins the message
2. **`runGame`**: Continuously runs the game state until the game is finished

### runGame

Each iteration of the game (so, daily), `runGame` goes through these steps:

1. If the entry has no options, the game is over
2. Post the current entry as a poll
3. Check and remind people to vote once a day until either...
   - ...a choice is made by consensus
   - ...an admin forces a choice
4. If the choice was forced by an admin, mention that
5. Continue with that chosen next step in the game

### Platforms

The `platformFactory` function used in both workers and Workflows reads from `process.env` to return the `createIntegration` and `createServer` methods for the social platform being targeted.

### Integrations

`createIntegration`: creates the client API used to send messages to the social platform.
For example, the Slack integration uses the [Slack Bolt SDK](https://slack.dev/bolt-js).

### Servers

`createServer` creates the (generally Express) server that runs locally and receives webhook events from the social platform.
Both the Discord and Slack servers use Ngrok to expose a local port on the public web, so that a `/force` command configured on the platform sends a message, it can Signal to the Workflow.

