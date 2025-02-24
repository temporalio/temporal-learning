---
title: "Learn with Jason - Web Dev Challenge"
sidebar_position: 1
public: false
draft: false
tags: [Community Programs]
keywords: [Temporal, Workflows, Activities, Workers, Task Queues, TypeScript SDK, external service, games, signals, queries, updates]
description: "Web Dev Challenge Prompt for March 11, 2025 - Use Temporal to build a game that’s played on at least 2 devices."
custom_edit_url: null
hide_table_of_contents: true
last_update:
  date: 2025-02-24
image: /img/temporal-logo-twitter-card.png
---

import Link from '@docusaurus/Link';

## The Challenge

**Build a game that's played on at least 2 devices.**

Single player, multiplayer, cooperative, competitive, or something totally different — your challenge is to come up with something fun that is played across at least two devices. Temporal's state tracking and Workflow message passing features tools will allow you to manage sending information between devices dependably.

Your game could be something like Jackbox, where a TV is the "game board" and each player's phone is how they interact with it on their turn. You could make a game that uses phone APIs like the camera or gyroscope. Or you can implement a simple word game like the New York Times connection puzzles, but with the twist that it's designed to be solved collaboratively, and a session can persist beyond the players closing the web app.

:::tip A note about the prompt
The prompt is here to create constraints and give us a general theme. **Creative (mis)interpretations of the prompt are not only allowed — they’re actively encouraged!**

We’re trying to have fun, make each other laugh, learn something new, and get people stoked to build on the web. **The more fun you’re having, the better the show will be.**

The best case for all of us is to approach this as a playful opportunity to build something we enjoy, whether it’s cool, clever, useful, or an intentional trolling effort.
:::

[Previous *Web Dev Challenge* Episodes](https://codetv.dev/series/web-dev-challenge/s1)

## The Tool: Temporal

**Your app must use Temporal as part of the build.** Temporal provides SDKs for Go, TypeScript, Python, .NET (C#), Java, and PHP, so you can use the language of your choice.

If you're using TypeScript (since this is the Web Dev Challenge, after all), you can create a new project using `npx`:

```command
npx @temporalio/create@latest ./my-app
```

You can also add the Temporal TypeScript SDK to an existing project with `npm`:

```command
npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
```

Temporal is a durable execution platform, which means you can orchestrate complex logic across multiple services in a way that’s resilient and flexible. The [getting started docs](https://learn.temporal.io/getting_started/typescript/) are a great way to get familiar with what Temporal is and how you can use it in this challenge. I'd also recommend looking at the [Message Passing documentation](https://docs.temporal.io/develop/typescript/message-passing), or taking Temporal's [Interacting with Workflows course](https://learn.temporal.io/courses/interacting_with_workflows/), to understand how to send input back and forth from running Workflows. You can also look at Temporal’s new [Code Exchange](https://temporal.io/code-exchange) for examples of community-created projects (We even have a community-contributed [React template](https://github.com/proyecto26/projectx)). Finally, if you want to see an example of a (real-time!) game that was created using Temporal, take a look at the [keynote demo](https://github.com/temporalio/replay2024-demo) from the 2024 Replay Conference.