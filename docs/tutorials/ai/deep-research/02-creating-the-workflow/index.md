---
id: adding-durability-with-temporal
sidebar_position: 2
keywords: [ai, durable, temporal, genai, llm, openai-agents-sdk, deep-research, agents]
tags: [AI, durable, temporal, LLM, genai, workflow, activities, OpenAI Agents SDK]
last_update:
  date: 2026-02-01
  author: Angela Zhou
title: "Part 2: Creating the Workflow"
description: Create the Temporal Workflow, Worker, and server for your durable deep research agent
image: /img/temporal-logo-twitter-card.png
---

# Part 2: Creating the Workflow for Your Deep Research Agent

In [Part 1](../setting-the-stage), you set up the template repository and learned how the agent pipeline works. Now you'll add Temporal to make it durable.

You'll create three components:
1. **InteractiveResearchManager** - Orchestrates the multi-agent pipeline
2. **InteractiveResearchWorkflow** - Manages state and human-in-the-loop
3. **Worker** - Executes Workflows with the OpenAI Agents plugin

Let's start building.

## Step 1: Create the Interactive Research Manager

The manager orchestrates the multi-agent research pipeline. It runs inside the Workflow, and thanks to the OpenAI Agents integration, all its `Runner.run()` calls are automatically durable.

Here's the flow the manager implements:

```
                        User Query
                             │
                             ▼
               ┌─────────────────────────┐
               │      Triage Agent       │
               │  "Is this specific?"    │
               └─────────────────────────┘
                      │           │
                 No   │           │  Yes
                      ▼           ▼
         ┌────────────────┐    ┌─────────────────────────────────┐
         │ Clarify Agent  │    │      Research Pipeline          │
         │ (ask questions)│    │  Plan → Search → Write Report   │
         └────────────────┘    └─────────────────────────────────┘
                 │                           │
                 ▼                           ▼
         Return questions            Return completed report
         (wait for user)
```

When the user provides answers, the manager enriches the original query with their responses and runs the research pipeline.

Create the directory structure:

```bash
mkdir -p deep_research/workflows
```

Now create `deep_research/workflows/research_manager.py` and let's build it step by step.

### Set Up Imports

Start with the necessary imports:

```python
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional

from agents import Runner

from deep_research.agents.triage_agent import new_triage_agent
from deep_research.agents.clarifying_agent import new_clarifying_agent
from deep_research.agents.planner_agent import new_planner_agent
from deep_research.agents.search_agent import new_search_agent
from deep_research.agents.writer_agent import new_writer_agent
from deep_research.models import (
    ReportData,
    WebSearchPlan,
    TriageResult,
    ClarificationQuestions,
)
```

:::note No Temporal imports here
Notice this file doesn't import anything from Temporal. The manager is just a plain Python class that calls `Runner.run()`. So where does durability come from?

The durability happens because:
1. The Interactive Research Workflow that we will create will import this Research manager
2. The Worker is configured with the `OpenAIAgentsPlugin`
3. When `Runner.run()` is called from within a Workflow, the plugin intercepts it and executes it as a durable Activity

This separation keeps the manager simple and testable—it doesn't need to know about Temporal at all.
:::

### Define the Result Type

The manager needs to communicate whether clarifications are needed. Create a dataclass for this:

```python
@dataclass
class ClarificationResult:
    """Result from initial clarification check."""
    needs_clarifications: bool
    questions: Optional[list[str]] = None
    report_data: Optional[ReportData] = None
```

This result tells the Workflow one of two things:
- **Clarifications needed**: Returns the questions to ask the user
- **No clarifications needed**: Returns the completed report directly

### Create the Manager Class

Now create the `InteractiveResearchManager` class. Start with initialization:

```python
class InteractiveResearchManager:
    """
    Orchestrates the multi-agent research pipeline.

    All LLM calls are automatically durable via the OpenAI Agents SDK
    Temporal integration - no manual Activity wrapping needed.
    """

    def __init__(self):
        self.triage_agent = new_triage_agent()
        self.clarifying_agent = new_clarifying_agent()
        self.planner_agent = new_planner_agent()
        self.search_agent = new_search_agent()
        self.writer_agent = new_writer_agent()
```

The manager initializes all five agents from your existing agent files:
- **Triage Agent**: Decides if the query needs clarification
- **Clarifying Agent**: Generates follow-up questions
- **Planner Agent**: Creates a search strategy
- **Search Agent**: Executes web searches
- **Writer Agent**: Synthesizes results into a report

### Add the Helper Methods

Now add the individual pipeline steps. These are the building blocks that the rest of the manager will use:

:::info Automatic Durability
Every `Runner.run()` call is automatically a durable Temporal Activity. If a call fails due to rate limiting, Temporal retries it. If the Worker crashes mid-pipeline, Temporal remembers which calls succeeded and resumes from there.
:::

```python
    async def _plan_searches(self, query: str) -> WebSearchPlan:
        """Use the planner agent to create a search strategy."""
        result = await Runner.run(
            self.planner_agent,
            f"Create a search plan for: {query}",
        )
        return result.final_output_as(WebSearchPlan)

    async def _perform_searches(self, search_plan: WebSearchPlan) -> list[str]:
        """Execute all searches concurrently."""
        async def search(item) -> str:
            prompt = f"Search for: {item.query}\nReason: {item.reason}"
            result = await Runner.run(
                self.search_agent,
                prompt,
            )
            return str(result.final_output)

        tasks = [search(item) for item in search_plan.searches]
        return await asyncio.gather(*tasks)

    async def _write_report(self, query: str, search_results: list[str]) -> ReportData:
        """Use the writer agent to synthesize results into a report."""
        prompt = f"Original query: {query}\nSearch results: {search_results}"
        result = await Runner.run(
            self.writer_agent,
            prompt,
        )
        return result.final_output_as(ReportData)
```

Notice how `_perform_searches` uses `asyncio.gather` to run multiple Search Agent calls concurrently. The Planner Agent doesn't just generate one search—it creates a comprehensive search plan with multiple queries to cover different angles of the topic. For example, a question about "production AI best practices" might generate searches for error handling, cost optimization, monitoring, rate limiting, and more. Running these in parallel is faster than sequential execution, and gives the Writer Agent richer material to synthesize into the final report.

### Add the Research Pipeline

Now that the helper methods exist, add the method that orchestrates them:

```python
    async def _run_research_pipeline(self, query: str) -> ReportData:
        """Execute the full research pipeline: plan → search → write."""
        # Plan searches
        print(f"Planning searches for: {query[:50]}...")
        search_plan = await self._plan_searches(query)

        # Execute searches concurrently
        print(f"Executing {len(search_plan.searches)} searches...")
        search_results = await self._perform_searches(search_plan)

        # Write report
        print("Writing research report...")
        report = await self._write_report(query, search_results)

        return report
```

The pipeline follows three steps:
1. **Plan**: The planner agent creates a list of searches to perform
2. **Search**: All searches run concurrently for speed
3. **Write**: The writer agent synthesizes everything into a report

### Add the Public Methods

Finally, add the two public methods that the Workflow will call. First, the completion method (simpler of the two):

```python
    async def run_with_clarifications_complete(
        self,
        original_query: str,
        questions: list[str],
        responses: list[str],
    ) -> ReportData:
        """Complete research using clarification responses."""
        context = "\n".join(f"- {q}: {a}" for q, a in zip(questions, responses))
        enriched_query = f"{original_query}\n\nClarifications:\n{context}"
        return await self._run_research_pipeline(enriched_query)
```

Next, the main entry point that triages the query and either asks for clarifications or runs research directly:

```python
    async def run_with_clarifications_start(self, query: str) -> ClarificationResult:
        """
        Start research and determine if clarifications are needed.

        Returns whether clarifications are needed and either:
        - The clarification questions (if needed)
        - The completed report (if query was specific enough)
        """
        # Step 1: Check if clarifications are needed
        triage_result = await Runner.run(
            self.triage_agent,
            query,
        )
        needs_clarification = triage_result.final_output_as(TriageResult)

        if needs_clarification.needs_clarification:
            # Step 2a: Generate clarifying questions
            clarify_result = await Runner.run(
                self.clarifying_agent,
                f"Generate clarifying questions for: {query}",
            )
            questions = clarify_result.final_output_as(ClarificationQuestions)
            return ClarificationResult(
                needs_clarifications=True,
                questions=questions.questions,
            )
        else:
            # Step 2b: Query is specific enough, run research directly
            report = await self._run_research_pipeline(query)
            return ClarificationResult(
                needs_clarifications=False,
                report_data=report,
            )
```

### What You Built

The `InteractiveResearchManager` provides two entry points that the Workflow will call:

| Method | When It's Called | What It Does |
|--------|------------------|--------------|
| `run_with_clarifications_start()` | User submits initial query | Triages query, returns questions OR completed report |
| `run_with_clarifications_complete()` | User answers all questions | Enriches query with answers, runs full research pipeline |

The manager handles all the LLM orchestration—the Workflow just needs to call these methods and manage the waiting-for-humans part.

<details>
<summary>Your complete <code>research_manager.py</code> should look like this</summary>

```python
"""
Interactive Research Manager - Orchestrates the multi-agent research pipeline.

This is a plain Python class - no Temporal imports needed. Durability comes from:
1. Being called from within a Temporal Workflow
2. The Worker's OpenAIAgentsPlugin intercepting Runner.run() calls
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional

from agents import Runner

from deep_research.agents.triage_agent import new_triage_agent
from deep_research.agents.clarifying_agent import new_clarifying_agent
from deep_research.agents.planner_agent import new_planner_agent
from deep_research.agents.search_agent import new_search_agent
from deep_research.agents.writer_agent import new_writer_agent
from deep_research.models import (
    ReportData,
    WebSearchPlan,
    TriageResult,
    ClarificationQuestions,
)


@dataclass
class ClarificationResult:
    """Result from initial clarification check."""
    needs_clarifications: bool
    questions: Optional[list[str]] = None
    report_data: Optional[ReportData] = None


class InteractiveResearchManager:
    """
    Orchestrates the multi-agent research pipeline.

    All LLM calls are automatically durable via the OpenAI Agents SDK
    Temporal integration - no manual Activity wrapping needed.
    """

    def __init__(self):
        self.triage_agent = new_triage_agent()
        self.clarifying_agent = new_clarifying_agent()
        self.planner_agent = new_planner_agent()
        self.search_agent = new_search_agent()
        self.writer_agent = new_writer_agent()

    async def run_with_clarifications_start(self, query: str) -> ClarificationResult:
        """
        Start research and determine if clarifications are needed.

        Returns whether clarifications are needed and either:
        - The clarification questions (if needed)
        - The completed report (if query was specific enough)
        """
        # Check if clarifications are needed
        triage_result = await Runner.run(
            self.triage_agent,
            query,
        )
        needs_clarification = triage_result.final_output_as(TriageResult)

        if needs_clarification.needs_clarification:
            # Generate clarifying questions
            clarify_result = await Runner.run(
                self.clarifying_agent,
                f"Generate clarifying questions for: {query}",
            )
            questions = clarify_result.final_output_as(ClarificationQuestions)
            return ClarificationResult(
                needs_clarifications=True,
                questions=questions.questions,
            )
        else:
            # Query is specific enough, run research directly
            report = await self._run_research_pipeline(query)
            return ClarificationResult(
                needs_clarifications=False,
                report_data=report,
            )

    async def run_with_clarifications_complete(
        self,
        original_query: str,
        questions: list[str],
        responses: list[str],
    ) -> ReportData:
        """Complete research using clarification responses."""
        context = "\n".join(f"- {q}: {a}" for q, a in zip(questions, responses))
        enriched_query = f"{original_query}\n\nClarifications:\n{context}"
        return await self._run_research_pipeline(enriched_query)

    async def _run_research_pipeline(self, query: str) -> ReportData:
        """Execute the full research pipeline: plan → search → write."""
        # Plan searches
        print(f"Planning searches for: {query[:50]}...")
        search_plan = await self._plan_searches(query)

        # Execute searches concurrently
        print(f"Executing {len(search_plan.searches)} searches...")
        search_results = await self._perform_searches(search_plan)

        # Write report
        print("Writing research report...")
        report = await self._write_report(query, search_results)

        return report

    async def _plan_searches(self, query: str) -> WebSearchPlan:
        """Use the planner agent to create a search strategy."""
        result = await Runner.run(
            self.planner_agent,
            f"Create a search plan for: {query}",
        )
        return result.final_output_as(WebSearchPlan)

    async def _perform_searches(self, search_plan: WebSearchPlan) -> list[str]:
        """Execute all searches concurrently."""
        async def search(item) -> str:
            prompt = f"Search for: {item.query}\nReason: {item.reason}"
            result = await Runner.run(
                self.search_agent,
                prompt,
            )
            return str(result.final_output)

        tasks = [search(item) for item in search_plan.searches]
        return await asyncio.gather(*tasks)

    async def _write_report(self, query: str, search_results: list[str]) -> ReportData:
        """Use the writer agent to synthesize results into a report."""
        prompt = f"Original query: {query}\nSearch results: {search_results}"
        result = await Runner.run(
            self.writer_agent,
            prompt,
        )
        return result.final_output_as(ReportData)
```

</details>

---

## Step 2: Create the Interactive Research Workflow

Now we bring in Temporal. The manager handles LLM orchestration, but it can't:

- **Persist state** across server restarts
- **Wait for humans** without consuming resources
- **Resume from failures** without re-running completed work

That's what the Workflow provides. It wraps the manager, tracks state (query, questions, answers), and uses Temporal's primitives to wait indefinitely for human input while remaining fully durable.

Create `deep_research/workflows/research_workflow.py`.

### Understanding the Workflow Structure

Here's what this Workflow needs to do:

1. **Wait for research to start** via an [Update](https://docs.temporal.io/develop/python/message-passing#send-update-from-client) from the UI
2. **Determine if clarifications are needed** by calling the manager
3. **Wait for human answers** (can wait indefinitely—hours, days, weeks)
4. **Complete research** when all answers are collected
5. **Return the final report**

### Set Up Imports and Data Classes

Start with the imports:

```python
from dataclasses import dataclass, field

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from deep_research.workflows.research_manager import InteractiveResearchManager
    from deep_research.models import ReportData
```

:::note
**Why `workflow.unsafe.imports_passed_through()`?**
Temporal relies on a [Replay mechanism](https://docs.temporal.io/encyclopedia/event-history/event-history-python) to recover from failure .As your program progresses, Temporal saves the input and output from function calls to the history. This allows a failed program to restart right where it left off.

Temporal requires this special import pattern for Workflows for replay. This import pattern tells Temporal: _"These imports are safe to use during replay."_
:::

Next, define the data classes that the Workflow uses to communicate with the outside world:

```python
@dataclass
class UserQueryInput:
    """Input for starting research."""
    query: str


@dataclass
class SingleClarificationInput:
    """Input for providing a single clarification answer."""
    answer: str


@dataclass
class ResearchStatus:
    """Current status of the research workflow."""
    original_query: str | None
    clarification_questions: list[str]
    clarification_responses: list[str]
    status: str


@dataclass
class InteractiveResearchResult:
    """Final result from the research workflow."""
    short_summary: str
    markdown_report: str
    follow_up_questions: list[str]
```

These data classes serve specific purposes:
- **`UserQueryInput`**: What the UI sends when starting research
- **`SingleClarificationInput`**: What the UI sends when answering a question
- **`ResearchStatus`**: What the UI polls to show progress
- **`InteractiveResearchResult`**: The final output when research completes

### Define the Workflow Class

Now create the main Workflow class. Start with the class definition and initialization:

```python
@workflow.defn
class InteractiveResearchWorkflow:
    """
    Long-running workflow for interactive research with clarifying questions.

    The workflow:
    1. Waits for research to be started via update
    2. If clarifications needed, waits for each answer via updates
    3. Once all answers collected, completes research
    4. Returns the final report
    """

    def __init__(self) -> None:
        self.research_manager = InteractiveResearchManager()

        # State that persists across crashes
        self.original_query: str | None = None
        self.clarification_questions: list[str] = []
        self.clarification_responses: list[str] = []
        self.report_data: ReportData | None = None
        self.research_initialized: bool = False
```

:::tip Why We Create the Manager Inside the Workflow
Notice that `InteractiveResearchManager()` is instantiated inside the Workflow. This is the key to making your LLM calls durable.

When the Workflow calls `self.research_manager.run_with_clarifications_start()`, that method calls `Runner.run()` internally. Because this happens inside a Workflow context, the OpenAI Agents plugin intercepts those calls and executes them as durable Activities.

The manager itself has no Temporal code—it's plain Python. The durability comes from *where* it runs (inside a Workflow) and the plugin configuration (on the [Worker](https://docs.temporal.io/workers), which we will configure in the next part).
:::

Add a helper method for building results:

```python
    def _build_result(
        self,
        summary: str,
        report: str,
        questions: list[str],
    ) -> InteractiveResearchResult:
        """Helper to build the result object."""
        return InteractiveResearchResult(
            short_summary=summary,
            markdown_report=report,
            follow_up_questions=questions,
        )
```

### Adding Human in the Loop

Let's understand how the UI communicates with the Workflow to enable human-in-the-loop interactions.

The research Workflow follows this pattern:

1. **Workflow starts** and immediately waits for the user's research query
2. **User submits query** → Workflow processes it, may generate clarifying questions
3. **Workflow pauses** and waits for the user to answer (can wait indefinitely—hours, days, weeks)
4. **User submits answers** → Workflow resumes and completes the research
5. **Workflow returns** the final report

Unlike a traditional server that would timeout or consume resources while waiting, **Temporal Workflows can pause indefinitely at zero cost**. The Workflow state is durably persisted, and it resumes instantly when input arrives.

Here's how the UI, server, and Workflow communicate:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────────────┐
│   Browser   │         │   FastAPI   │         │   Temporal Workflow │
│     UI      │         │   Server    │         │                     │
└──────┬──────┘         └──────┬──────┘         └──────────┬──────────┘
       │                       │                           │
       │  Submit query         │                           │
       │──────────────────────►│  start_research (Update)  │
       │                       │──────────────────────────►│
       │                       │                           │ Process query,
       │                       │                           │ generate questions
       │                       │◄──────────────────────────│
       │  Return questions     │  Return status            │
       │◄──────────────────────│                           │
       │                       │                           │
       │       · · ·           │       · · ·               │ WAITING
       │   (user thinking)     │                           │ (zero cost)
       │       · · ·           │       · · ·               │
       │                       │                           │
       │  Submit answer        │                           │
       │──────────────────────►│  provide_clarification    │
       │                       │  (Update)                 │
       │                       │──────────────────────────►│
       │                       │◄──────────────────────────│ RESUME
       │◄──────────────────────│                           │
       │                       │                           │
```

The Workflow exposes three types of handlers for this communication:

| Handler | Type | Purpose |
|---------|------|---------|
| `get_status()` | Query | Read current state (questions, answers, status) |
| `start_research()` | Update | Send query, receive status with any clarification questions |
| `provide_clarification()` | Update | Send answer, receive updated status |

Now let's implement each of these handlers.

### Add the Query Handler

Before adding the handlers that modify state, let's add a method to read state. The `get_status` method serves two purposes:

1. **As a Query handler** — Clients can call it directly to check the Workflow's current state
2. **As a helper** — The Update handlers (which we'll add next) call it to return status after modifying state

[Queries](https://docs.temporal.io/encyclopedia/workflow-message-passing#sending-queries) are read-only—they can inspect Workflow state but cannot modify it. The server's `/api/status` endpoint calls this Query to get the current state: What's the original query? Are there clarification questions? How many have been answered?

```python
    @workflow.query
    def get_status(self) -> ResearchStatus:
        """Get current research status."""
        if self.report_data:
            status = "completed"
        elif self.clarification_questions and len(self.clarification_responses) < len(self.clarification_questions):
            status = "awaiting_clarification"
        elif self.original_query:
            status = "researching"
        else:
            status = "pending"

        return ResearchStatus(
            original_query=self.original_query,
            clarification_questions=self.clarification_questions,
            clarification_responses=self.clarification_responses,
            status=status,
        )
```

### Add the Update Handlers

Now let's add the handlers that receive input and modify state. That's where [Updates](https://docs.temporal.io/encyclopedia/workflow-message-passing#sending-updates) come in.

<details>
<summary>What is an Update?</summary>

Temporal provides three ways to communicate with a running Workflow:

| Type | Direction | Can Modify State? | Returns Response? |
|------|-----------|-------------------|-------------------|
| **[Query](https://docs.temporal.io/develop/python/message-passing#send-query)** | Client → Workflow | No (read-only) | Yes |
| **[Signal](https://docs.temporal.io/develop/python/message-passing#send-signal-from-client)** | Client → Workflow | Yes | No |
| **[Update](https://docs.temporal.io/sending-messages#sending-updates)** | Client → Workflow | Yes | Yes |

An [Update](https://docs.temporal.io/encyclopedia/workflow-message-passing#sending-updates) combines the best of both: it can modify Workflow state like a Signal, but also returns a response like a Query. This makes it perfect for our use case—the UI sends a research query and immediately gets back the status (including any clarification questions).

</details>

First, add the Update that starts research:

```python
    @workflow.update
    async def start_research(self, input: UserQueryInput) -> ResearchStatus:
        """Start a new research session."""
        workflow.logger.info(f"Starting research for: '{input.query}'")
        self.original_query = input.query

        # Check if clarifications are needed (calls the manager)
        result = await self.research_manager.run_with_clarifications_start(self.original_query)

        if result.needs_clarifications:
            self.clarification_questions = result.questions
        else:
            self.report_data = result.report_data

        self.research_initialized = True
        return self.get_status()
```

This Update calls the manager to check if clarifications are needed, stores the result, then sets `research_initialized = True`. It returns the current status (using the `get_status` Query we just defined) so the UI knows immediately whether to show clarification questions.

Next, add the Update that accepts clarification answers:

```python
    @workflow.update
    async def provide_clarification(self, input: SingleClarificationInput) -> ResearchStatus:
        """Provide an answer to the current clarification question."""
        self.clarification_responses.append(input.answer)
        return self.get_status()
```

Each time the user answers a question, this Update appends their answer to `clarification_responses`.

### Add the Main Run Method

Now that you've created handlers for receiving input (Updates) and checking state (Queries), let's add the main `run` method that coordinates everything.

The `run` method needs to wait for external input—first for the user's query, then potentially for their answers to clarification questions. This is where [`workflow.wait_condition()`](https://python.temporal.io/temporalio.workflow.html#wait_condition) comes in:

- Pauses the Workflow until a condition becomes true
- Consumes **zero resources** while waiting—no polling, no timers
- Resumes instantly when an Update modifies state
- Optionally accepts a timeout: `workflow.wait_condition(lambda: condition, timeout=timedelta(hours=24))`

```python
    @workflow.run
    async def run(self) -> InteractiveResearchResult:
        """Waits for research to start and complete."""
        # Wait for research to be initialized via the start_research Update
        await workflow.wait_condition(lambda: self.research_initialized)

        # If clarifications needed, wait for all answers
        if self.clarification_questions:
            await workflow.wait_condition(
                lambda: len(self.clarification_responses) >= len(self.clarification_questions)
            )
            # Complete research with the enriched query
            self.report_data = await self.research_manager.run_with_clarifications_complete(
                self.original_query,
                self.clarification_questions,
                self.clarification_responses,
            )

        # Return the final report
        return self._build_result(
            self.report_data.short_summary,
            self.report_data.markdown_report,
            self.report_data.follow_up_questions,
        )
```

Here's how the pieces connect:

1. The `run` method starts and waits for `research_initialized` to become `True`
2. When the UI calls `start_research`, that Update sets `research_initialized = True`
3. The first `wait_condition` wakes up and the Workflow continues
4. If clarifications are needed, it waits for all answers to be collected
5. When `provide_clarification` adds the final answer, the second `wait_condition` wakes up
6. The Workflow completes the research and returns the report

<details>
<summary>Your complete <code>research_workflow.py</code> should look like this</summary>

```python
"""
Interactive Research Workflow - Manages state and human-in-the-loop.
"""

from dataclasses import dataclass, field

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from deep_research.workflows.research_manager import InteractiveResearchManager
    from deep_research.models import ReportData


@dataclass
class UserQueryInput:
    """Input for starting research."""
    query: str


@dataclass
class SingleClarificationInput:
    """Input for providing a single clarification answer."""
    answer: str


@dataclass
class ResearchStatus:
    """Current status of the research workflow."""
    original_query: str | None
    clarification_questions: list[str]
    clarification_responses: list[str]
    status: str


@dataclass
class InteractiveResearchResult:
    """Final result from the research workflow."""
    short_summary: str
    markdown_report: str
    follow_up_questions: list[str]


@workflow.defn
class InteractiveResearchWorkflow:
    """Workflow for interactive research with clarifying questions."""

    def __init__(self) -> None:
        self.research_manager = InteractiveResearchManager()
        self.original_query: str | None = None
        self.clarification_questions: list[str] = []
        self.clarification_responses: list[str] = []
        self.report_data: ReportData | None = None
        self.research_initialized: bool = False

    def _build_result(
        self,
        summary: str,
        report: str,
        questions: list[str],
    ) -> InteractiveResearchResult:
        return InteractiveResearchResult(
            short_summary=summary,
            markdown_report=report,
            follow_up_questions=questions,
        )

    @workflow.run
    async def run(self) -> InteractiveResearchResult:
        """Main workflow loop - waits for research to start and complete."""
        await workflow.wait_condition(lambda: self.research_initialized)

        if self.clarification_questions:
            await workflow.wait_condition(
                lambda: len(self.clarification_responses) >= len(self.clarification_questions)
            )
            self.report_data = await self.research_manager.run_with_clarifications_complete(
                self.original_query,
                self.clarification_questions,
                self.clarification_responses,
            )

        return self._build_result(
            self.report_data.short_summary,
            self.report_data.markdown_report,
            self.report_data.follow_up_questions,
        )

    @workflow.query
    def get_status(self) -> ResearchStatus:
        """Get current research status."""
        if self.report_data:
            status = "completed"
        elif self.clarification_questions and len(self.clarification_responses) < len(self.clarification_questions):
            status = "awaiting_clarification"
        elif self.original_query:
            status = "researching"
        else:
            status = "pending"

        return ResearchStatus(
            original_query=self.original_query,
            clarification_questions=self.clarification_questions,
            clarification_responses=self.clarification_responses,
            status=status,
        )

    @workflow.update
    async def start_research(self, input: UserQueryInput) -> ResearchStatus:
        """Start a new research session."""
        self.original_query = input.query
        result = await self.research_manager.run_with_clarifications_start(self.original_query)

        if result.needs_clarifications:
            self.clarification_questions = result.questions
        else:
            self.report_data = result.report_data

        self.research_initialized = True
        return self.get_status()

    @workflow.update
    async def provide_clarification(self, input: SingleClarificationInput) -> ResearchStatus:
        """Provide an answer to the current clarification question."""
        self.clarification_responses.append(input.answer)
        return self.get_status()
```

</details>

### What You Built

The Workflow exposes three interfaces for external communication:

| Interface | Type | Purpose |
|-----------|------|---------|
| `get_status()` | Query | UI polls for current state (read-only) |
| `start_research()` | Update | UI sends query, receives status (may include questions) |
| `provide_clarification()` | Update | UI sends answer, receives updated status |

---

## Step 3: Clean Up the Old Manager

The template's original `deep_research/research_manager.py` managed sessions in memory without durability. Now that you've created the durable `InteractiveResearchManager` in `deep_research/workflows/research_manager.py`, the old file is no longer needed.

Delete it:

```bash
rm deep_research/research_manager.py
```

Your new Workflow and Manager handle everything the old file did—but durably.

---

Now that you've created the Workflow, Manager, and data classes, let's run everything and see durability in action in [Part 3: Running Your Application](../running-your-deep-agent).
