---
id: building-deep-research-agent
sidebar_position: 1
keywords: [ai, temporal, agents, deep-research, human-in-the-loop, multi-agent, openai-agents-sdk]
tags: [AI, temporal, LLM, agents, workflow, activities, human-in-the-loop, OpenAI Agents SDK]
last_update:
  date: 2026-02-01
  author: Angela Zhou
title: "Part 1: Setting the Stage"
description: Learn how to build a durable, multi-agent research application with human-in-the-loop capabilities using Temporal
image: /img/temporal-logo-twitter-card.png
---

# Part 1: Setting the Stage for Your Deep Research Agent

Deep research agents orchestrate multiple LLM calls—triaging queries, asking clarifying questions, planning searches, gathering information, and writing reports. But there's a catch: **what happens when an agent fails halfway through?** 

Consider this scenario: Your research agent has already:
1. Determined your query needs clarification ✓
2. Generated three clarifying questions ✓
3. Collected your answers to two of them ✓

Then your server crashes. Without durability, you're back to square one—losing the LLM calls you've already paid for and forcing your user to start over.

This challenge becomes especially important with multi-agent architectures where _agents call other agents_, creating deep call stacks where a failure at any level can cascade and lose significant work.

In this tutorial, you'll transform a working (but non-durable) deep research agent into a production-ready application using [Temporal](https://temporal.io/) and the [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/). By the end, your agent will:

- **Survive failures** at any step without losing progress
- **Wait indefinitely** for human input while maintaining state
- **Automatically retry** failed LLM calls with exponential backoff
- **Resume seamlessly** after crashes or restarts

We use the OpenAI Agents SDK in this tutorial because it provides a clean, minimal abstraction for building multi-agent systems—and because Temporal has a built-in integration that makes every agent call automatically durable.

## Prerequisites

Before starting this tutorial, you should have:

- Beginner knowledge of Temporal including [Workflows](https://docs.temporal.io/workflows), [Activities](https://docs.temporal.io/activities), and [Workers](https://docs.temporal.io/workers)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- Cloned [the template repository](https://github.com/temporalio/edu-deep-research-tutorial-template)

## Getting Started: Clone the Template Repository

The [template repository](https://github.com/temporalio/edu-deep-research-tutorial-template) contains a fully functional deep research agent—but **without any durability**. Let's get it running first so you can see what we're working with.

You can follow along with the solution [here](https://github.com/temporalio/edu-deep-research-tutorial-template/tree/video_tutorial).

1. **Clone the repository:**

```bash
git clone https://github.com/temporalio/edu-deep-research-tutorial-template.git
cd edu-deep-research-tutorial-template
```

2. **Install dependencies:**

```bash
uv sync
```

3. **Set up your OpenAI API key:**

```bash
cp .env-sample .env
# Edit .env and add your OPENAI_API_KEY
```

Skip this step if you already have `OPENAI_API_KEY` exported in your shell profile (e.g., `.zshrc` or `.bashrc`).

4. **Run the application:**

```bash
uv run run_server.py
```

5. **Open your browser** and navigate to **http://localhost:8234**

Try entering a research query like _"what is the best spaghetti recipe?"_ The agent will ask clarifying questions, then conduct research and generate a report.

:::note
**Optional - Observe The Problem:** While this works, try stopping the server (Ctrl+C) mid-research. When you restart, all the context is gone. Your agent has no memory of what you last asked and you need to start from scratch. Let's fix that.
:::

<details>
<summary>With Temporal, your agents can handle real-world production challenges:</summary>

- **Rate-limited LLMs?** Automatic retries with backoff until capacity returns
- **Network issues?** Retries until requests succeed
- **Application crashes?** Temporal resumes from the last checkpoint, saving you compute and token costs
- **Found a bug mid-execution?** Fix it and continue running Workflows

</details>


## Understanding the Current Architecture

Before adding Temporal, let's understand the existing structure:

```
├── run_server.py              # Backend API for the chat interface
├── ui/                        # Browser-based chat interface
└── deep_research/
    ├── agents/                # Individual AI agents (OpenAI Agents SDK)
    │   ├── triage_agent.py    # Decides if clarification is needed
    │   ├── clarifying_agent.py# Generates follow-up questions
    │   ├── planner_agent.py   # Creates search strategy
    │   ├── search_agent.py    # Executes web searches
    │   └── writer_agent.py    # Writes final report
    ├── models.py              # Pydantic models for structured outputs
    └── research_manager.py    # Orchestrates agents + manages sessions (NOT durable)
```

### How the Agent Pipeline Works

When a user submits a research query, it flows through this pipeline:

```
User Query
    ↓
┌─────────────────┐
│  Triage Agent   │ → Decides: Is this query specific enough?
└─────────────────┘
    ↓ No                          ↓ Yes
┌─────────────────┐               │
│Clarifying Agent │               │
└─────────────────┘               │
    ↓                             │
  User answers questions ←────────┤
    ↓                             │
┌─────────────────┐               │
│ Planner Agent   │ ← ────────────┘
└─────────────────┘
    ↓
┌─────────────────┐
│ Search Agent(s) │ → Runs multiple searches concurrently
└─────────────────┘
    ↓
┌─────────────────┐
│  Writer Agent   │ → Synthesizes results into a report
└─────────────────┘
    ↓
Final Report
```

The `research_manager.py` file orchestrates this pipeline and tracks session state in memory. If the server restarts, _all that state is lost_. **We'll replace this with a Temporal Workflow that persists state durably and can wait indefinitely for human input**.

## The OpenAI Agents SDK and Temporal

Before diving into the implementation, let's understand how the OpenAI Agents SDK works and how Temporal integrates with it.

The [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) provides primitives for building AI agents. An **Agent** combines an LLM with instructions and tools. A **Runner** executes those agents:

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You help with research.",
    model="gpt-4o-mini",
)
result = await Runner.run(agent, "What is the best spaghetti recipe?")
```

You can chain agents together—use one agent's output as input to the next—to build complex multi-agent systems like the deep research agent in this tutorial:

```python
# Agent 1: Plan what to search
planner = Agent(name="Planner", instructions="Create a search plan.")
plan = await Runner.run(planner, "Research best restaurants in North Carolina")

# Agent 2: Execute searches based on the plan
searcher = Agent(name="Searcher", instructions="Search the web.")
results = await Runner.run(searcher, plan.final_output)

# Agent 3: Write a report from search results
writer = Agent(name="Writer", instructions="Write a research report.")
report = await Runner.run(writer, results.final_output)
```

### Making Agents Durable with Temporal

The OpenAI Agents SDK has a **built-in Temporal integration** via the [`OpenAIAgentsPlugin`](https://python.temporal.io/temporalio.contrib.openai_agents.OpenAIAgentsPlugin.html).

Without the plugin, `Runner.run()` calls the LLM directly—if it fails or your app crashes, the work is lost. With the plugin, each `Runner.run()` call is recorded in Temporal's [event history](https://docs.temporal.io/encyclopedia/event-history/). This means:

- **If an LLM call fails**, Temporal automatically retries it (with backoff you configure)
- **If your Worker crashes mid-research**, Temporal knows which `Runner.run()` calls already completed and skips them on restart—you don't pay for the same LLM calls twice
- **Your code stays clean**—you write normal `Runner.run()` calls, no special wrappers needed

You code the happy path; Temporal handles the rest. Let's go ahead and try it out!

## Setup

Add the Temporal SDK with the OpenAI Agents integration:

```bash
uv add 'temporalio[openai-agents]'
```

Now you'll create these components:

1. **InteractiveResearchManager** - A class that **orchestrates the multi-agent pipeline**: triaging queries, generating clarifying questions, planning searches, executing them, and writing the final report. It calls `Runner.run()` for each agent. Remember, because it runs inside a Workflow with the OpenAI Agents plugin, every LLM call is automatically durable.

2. **InteractiveResearchWorkflow** - The Temporal Workflow that **manages the research session**. It tracks state (original query, clarification questions, user answers), exposes Updates for the UI to start research and submit answers, and pauses indefinitely while waiting for human input—without consuming resources.

3. **Worker** - The process that **executes your Workflow and Activities**. You'll configure it with `OpenAIAgentsPlugin`, which is what makes all those `Runner.run()` calls inside the Workflow automatically become durable Activities.

Here's how these components fit together:

```
Browser UI ──► Workflow ──► Manager ──► OpenAI API
                  │            │
                  │            └── calls Runner.run() for each agent to make LLM calls durable
                  │
                  └── tracks state (query, questions, answers)
```

Now that we've set the stage by exploring the template's architecture and how Temporal makes `Runner.run()` calls durable, let's build these components in [Part 2: Creating the Workflow](../creating-the-workflow).