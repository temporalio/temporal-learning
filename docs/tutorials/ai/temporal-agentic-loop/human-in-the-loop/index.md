---
id: human-in-the-loop
sidebar_position: 3
keywords: [ai, durable, temporal, signals, queries, human-in-the-loop, hitl]
tags: [AI, Series]
last_update:
  date: 2025-10-15
  author: Temporal Team
title: "Part 3: Adding Durable Human-in-the-Loop to Our Research Application"
description: Learn how to build interactive AI applications that allow humans to provide feedback and make decisions using Temporal Signals and Queries
image: /img/temporal-logo-twitter-card.png
---

# Part 3: Adding Durable Human-in-the-Loop to Our Research Application (COMING SOON!)

Your durable research application now survives crashes and automatically retries failures. But there's a critical gap: **it runs completely autonomously**.

Imagine this scenario: Your AI generates research on "best travel spots for summer 2025", your application generates a PDF, and sends it to your client - all automatically.

Then your client calls: "I want cheaper options!"

Your application had no way to pause and ask for clarification or approval. It just executed straight through to completion.

**Real-world AI applications need human interaction** to provide feedback, approve decisions, or clarify requirements. But adding human input to automated workflows introduces new challenges: What if the user's browser crashes while they're reviewing? What if they close the tab and come back later? How do you prevent losing expensive LLM work while waiting for approval?

In this tutorial, we'll solve these problems by making your AI application interactive and durable.