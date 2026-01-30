---
id: building-deep-research-agent
sidebar_position: 1
keywords: [ai, temporal, workflow, activities, agents, deep-research, human-in-the-loop, multi-agent, openai-agents-sdk]
tags: [AI, temporal, LLM, agents, workflow, activities, human-in-the-loop, OpenAI Agents SDK]
last_update:
  date: 2026-01-30
  author: Angela Zhou
title: "Building a Durable Deep Research Agent with Temporal"
description: Learn how to build a durable, multi-agent research application with human-in-the-loop capabilities using Temporal
image: /img/temporal-logo-twitter-card.png
---

# Building a Durable Deep Research Agent with Temporal and the OpenAI Agents SDK

Deep research agents built with the [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) orchestrate multiple LLM calls—triaging queries, asking clarifying questions, planning searches, gathering information, and writing reports. The results are impressive, but there's a catch: **what happens when something fails halfway through?**

Consider this scenario: Your research agent has already:
1. Determined your query needs clarification ✓
2. Generated three clarifying questions ✓
3. Collected your answers to two of them ✓

Then your server crashes. Without durability, you're back to square one—losing the LLM calls you've already paid for and forcing your user to start over. Even worse, if the user had spent time thoughtfully answering those clarifying questions, that effort is gone too.

In this tutorial, you'll transform a working (but non-durable) deep research agent into a production-ready application using Temporal. By the end, your agent will:

- **Survive failures** at any step without losing progress
- **Wait indefinitely** for human input while maintaining state
- **Automatically retry** failed LLM calls with exponential backoff
- **Resume seamlessly** after crashes or restarts

## Prerequisites

Before starting this tutorial, you should have:

- **Beginner knowledge of Temporal** including [Workflows](https://docs.temporal.io/workflows), [Activities](https://docs.temporal.io/activities), and [Workers](https://docs.temporal.io/workers)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- Cloned [the template repository](https://github.com/temporalio/edu-deep-research-tutorial-template)

## Getting Started: Clone the Template Repository

The [template repository](https://github.com/temporalio/edu-deep-research-tutorial-template) contains a fully functional deep research agent—but **without any durability**. Let's get it running first so you can see what we're working with.

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

4. **Run the application:**

```bash
uv run run_server.py
```

5. **Open your browser** and navigate to **http://localhost:8234**

Try entering a research query like _"what is the best spaghetti recipe?"_ The agent will ask clarifying questions, then conduct research and generate a report.

:::note
**Optional - Observe The Problem:** While this works, try stopping the server (Ctrl+C) mid-research. When you restart, all the context is gone. Your agent has no memory of what you last asked and you need to start from scratch. Let's fix that.
:::

## Understanding the Current Architecture

Before adding Temporal, let's understand the existing structure:

```
deep_research/
├── agents/                    # Individual AI agents (OpenAI Agents SDK)
│   ├── triage_agent.py        # Decides if clarification is needed
│   ├── clarifying_agent.py    # Generates follow-up questions
│   ├── planner_agent.py       # Creates search strategy
│   ├── search_agent.py        # Executes web searches
│   └── writer_agent.py        # Writes final report
├── models.py                  # Data structures
├── research_manager.py        # Orchestrates agents + manages sessions (NOT durable)
└── pdf_generator.py           # Converts reports to PDF
```

The `research_manager.py` file orchestrates the agents and tracks session state in memory. If the server restarts, all that state is lost. We'll replace this with a Temporal Workflow that persists state durably and can wait indefinitely for human input.

## The OpenAI Agents SDK and Temporal

The [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) provides primitives for building AI agents. An **Agent** combines an LLM with instructions and tools. A **Runner** executes agents:

```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You help with research.",
    model="gpt-4o-mini",
)
result = await Runner.run(agent, "What is the best spaghetti recipe?")
```

You can chain agents together—use one agent's output as input to the next—to build complex multi-agent systems like the deep research agent in this tutorial.

### Making Agents Durable with Temporal

The OpenAI Agents SDK has a **built-in Temporal integration**. Here's how it works:

1. You configure an `OpenAIAgentsPlugin` with retry policies and timeouts
2. The plugin intercepts every `Runner.run()` call in your Workflow
3. Each call automatically executes as a Temporal Activity

This means you don't wrap each agent call in an Activity yourself—the integration handles it transparently. Your agent code stays clean, but every LLM call gets Temporal's reliability: if a call fails, Temporal retries it; if your Worker crashes mid-research, Temporal tracks which calls completed and resumes from there.

Your agents can now handle real-world production challenges:

- **Rate-limited LLMs?** Automatic retries with backoff until capacity returns
- **Network issues?** Retries until requests succeed
- **Application crashes?** Temporal resumes from the last checkpoint, saving you compute and token costs
- **Found a bug mid-execution?** Fix it and continue running Workflows

You code the happy path; Temporal handles the rest. Let's go ahead and try it out!

## Setup

Add the Temporal SDK with the OpenAI Agents integration:

```bash
uv add 'temporalio[openai-agents]'
```

Now you'll create these components:

1. **InteractiveResearchManager** - A class that orchestrates the multi-agent pipeline: triaging queries, generating clarifying questions, planning searches, executing them, and writing the final report. It calls `Runner.run()` for each agent. Because it runs inside a Workflow with the OpenAI Agents plugin, every LLM call is automatically durable—if a call fails due to rate limiting or network issues, Temporal retries it; if the Worker crashes, Temporal remembers which calls succeeded and resumes from there.

2. **InteractiveResearchWorkflow** - The Temporal Workflow that manages the research session. It tracks state (original query, clarification questions, user answers), exposes Updates for the UI to start research and submit answers, and pauses indefinitely while waiting for human input—without consuming resources.

3. **Worker** - The process that executes your Workflow and Activities. You'll configure it with `OpenAIAgentsPlugin`, which is what makes all those `Runner.run()` calls inside the Workflow automatically become durable Activities.

---

## Step 1: Create the Interactive Research Manager

The manager orchestrates the multi-agent research pipeline. It runs inside the Workflow, and thanks to the OpenAI Agents integration, all its `Runner.run()` calls are automatically durable.

Create the directory structure:

```bash
mkdir -p deep_research/workflows
touch deep_research/workflows/__init__.py
```

Create `deep_research/workflows/research_manager.py`:

```python
"""
Interactive Research Manager - Orchestrates the multi-agent research pipeline.

This manager runs inside a Temporal Workflow. All LLM calls via Runner.run()
are automatically durable thanks to the OpenAI Agents SDK integration.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from agents import Runner, RunConfig

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
        self.run_config = RunConfig()
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
            run_config=self.run_config,
        )
        needs_clarification = triage_result.final_output_as(TriageResult)

        if needs_clarification.needs_clarification:
            # Generate clarifying questions
            clarify_result = await Runner.run(
                self.clarifying_agent,
                f"Generate clarifying questions for: {query}",
                run_config=self.run_config,
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
        responses: dict[str, str],
    ) -> ReportData:
        """Complete research using clarification responses."""
        enriched_query = self._enrich_query(original_query, questions, responses)
        return await self._run_research_pipeline(enriched_query)

    def _enrich_query(
        self,
        original_query: str,
        questions: list[str],
        responses: dict[str, str],
    ) -> str:
        """Combine original query with clarification responses."""
        enriched = f"Original query: {original_query}\n\nAdditional context from clarifications:\n"
        for i, question in enumerate(questions):
            answer = responses.get(f"question_{i}", "No specific preference")
            enriched += f"- {question}: {answer}\n"
        return enriched

    async def _run_research_pipeline(self, query: str) -> ReportData:
        """Execute the full research pipeline: plan → search → write."""
        # Plan searches
        workflow.logger.info(f"Planning searches for: {query[:50]}...")
        search_plan = await self._plan_searches(query)

        # Execute searches concurrently
        workflow.logger.info(f"Executing {len(search_plan.searches)} searches...")
        search_results = await self._perform_searches(search_plan)

        # Write report
        workflow.logger.info("Writing research report...")
        report = await self._write_report(query, search_results)

        return report

    async def _plan_searches(self, query: str) -> WebSearchPlan:
        """Use the planner agent to create a search strategy."""
        result = await Runner.run(
            self.planner_agent,
            f"Create a search plan for: {query}",
            run_config=self.run_config,
        )
        return result.final_output_as(WebSearchPlan)

    async def _perform_searches(self, search_plan: WebSearchPlan) -> list[str]:
        """Execute all searches concurrently."""
        async def search(item) -> str | None:
            try:
                prompt = f"Search for: {item.query}\nReason: {item.reason}"
                result = await Runner.run(
                    self.search_agent,
                    prompt,
                    run_config=self.run_config,
                )
                return str(result.final_output)
            except Exception:
                return None

        tasks = [asyncio.create_task(search(item)) for item in search_plan.searches]
        results = []
        for task in asyncio.as_completed(tasks):
            result = await task
            if result is not None:
                results.append(result)
        return results

    async def _write_report(self, query: str, search_results: list[str]) -> ReportData:
        """Use the writer agent to synthesize results into a report."""
        prompt = f"Original query: {query}\nSearch results: {search_results}"
        result = await Runner.run(
            self.writer_agent,
            prompt,
            run_config=self.run_config,
        )
        return result.final_output_as(ReportData)
```

<details>
<summary>Why use a separate manager class?</summary>

The manager separates **agent orchestration** from **state management**:

- **Manager**: Knows how to run agents, plan searches, write reports
- **Workflow**: Knows how to manage state, wait for humans, handle failures

This separation makes the code cleaner and follows the pattern used in production systems like the [AWS re:Invent 2025 demo](https://github.com/temporal-community/aws-reinvent-25-demo).

All `Runner.run()` calls inside the manager are automatically durable because the OpenAI Agents SDK Temporal integration intercepts them.

</details>

---

## Step 2: Create the Interactive Research Workflow

The Workflow manages state and handles human-in-the-loop interactions. It delegates agent orchestration to the manager.

Create `deep_research/workflows/research_workflow.py`:

```python
"""
Interactive Research Workflow - Manages state and human-in-the-loop.

This workflow handles:
- Starting research and determining if clarifications are needed
- Collecting clarification answers one at a time
- Waiting for human input (can wait indefinitely)
- Completing research when all answers are collected
"""

import asyncio
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

from temporalio import activity, workflow
from temporalio.exceptions import ApplicationError

with workflow.unsafe.imports_passed_through():
    from deep_research.workflows.research_manager import InteractiveResearchManager
    from deep_research.models import ReportData


# ============================================
# Data Classes
# ============================================

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
    original_query: str | None = None
    clarification_questions: list[str] = None
    clarification_responses: dict[str, str] = None
    current_question_index: int = 0
    current_question: str | None = None
    status: str = "pending"
    research_completed: bool = False

    def __post_init__(self):
        if self.clarification_questions is None:
            self.clarification_questions = []
        if self.clarification_responses is None:
            self.clarification_responses = {}


@dataclass
class InteractiveResearchResult:
    """Final result from the research workflow."""
    short_summary: str
    markdown_report: str
    follow_up_questions: list[str]


# ============================================
# Activity for Processing Clarifications
# ============================================

@dataclass
class ProcessClarificationInput:
    """Input for clarification processing activity."""
    answer: str
    current_question_index: int
    current_question: str | None
    total_questions: int


@dataclass
class ProcessClarificationResult:
    """Result from clarification processing activity."""
    question_key: str
    answer: str
    new_index: int


@activity.defn
async def process_clarification(input: ProcessClarificationInput) -> ProcessClarificationResult:
    """
    Process a single clarification answer.

    This is an Activity so it can be retried if something fails.
    """
    activity.logger.info(
        f"Processing clarification {input.current_question_index + 1}/{input.total_questions}: "
        f"'{input.answer}'"
    )

    question_key = f"question_{input.current_question_index}"
    return ProcessClarificationResult(
        question_key=question_key,
        answer=input.answer,
        new_index=input.current_question_index + 1,
    )


# ============================================
# Workflow
# ============================================

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

        # State
        self.original_query: str | None = None
        self.clarification_questions: list[str] = []
        self.clarification_responses: dict[str, str] = {}
        self.current_question_index: int = 0
        self.report_data: ReportData | None = None
        self.research_completed: bool = False
        self.workflow_ended: bool = False
        self.research_initialized: bool = False

    def _build_result(
        self,
        summary: str,
        report: str,
        questions: list[str] | None = None,
    ) -> InteractiveResearchResult:
        """Helper to build the result object."""
        return InteractiveResearchResult(
            short_summary=summary,
            markdown_report=report,
            follow_up_questions=questions or [],
        )

    @workflow.run
    async def run(self) -> InteractiveResearchResult:
        """
        Main workflow loop - waits for research to start and complete.
        """
        while True:
            workflow.logger.info("Waiting for research to start or complete...")

            # Wait for: workflow end, research complete, or research initialized
            await workflow.wait_condition(
                lambda: self.workflow_ended
                or self.research_completed
                or self.research_initialized
            )

            # Handle workflow end signal
            if self.workflow_ended:
                return self._build_result(
                    "Research ended by user",
                    "Research workflow ended by user",
                )

            # Handle completed research
            if self.research_completed and self.report_data:
                return self._build_result(
                    self.report_data.short_summary,
                    self.report_data.markdown_report,
                    self.report_data.follow_up_questions,
                )

            # Handle initialized but not completed
            if self.research_initialized and not self.research_completed:
                if self.clarification_questions:
                    # Wait for all clarifications
                    await workflow.wait_condition(
                        lambda: self.workflow_ended
                        or len(self.clarification_responses) >= len(self.clarification_questions)
                    )

                    if self.workflow_ended:
                        return self._build_result(
                            "Research ended by user",
                            "Research workflow ended by user",
                        )

                    # Complete research with clarifications
                    if self.original_query:
                        self.report_data = await self.research_manager.run_with_clarifications_complete(
                            self.original_query,
                            self.clarification_questions,
                            self.clarification_responses,
                        )
                    self.research_completed = True
                    continue

                elif self.report_data is not None:
                    # No clarifications needed, already have report
                    self.research_completed = True
                    continue

                # Fallback
                return self._build_result(
                    "No research completed",
                    "Research failed to start properly",
                )

    def _get_current_question(self) -> str | None:
        """Get the current question that needs an answer."""
        if self.current_question_index >= len(self.clarification_questions):
            return None
        return self.clarification_questions[self.current_question_index]

    # ============================================
    # Query: Get Status
    # ============================================

    @workflow.query
    def get_status(self) -> ResearchStatus:
        """Get current research status."""
        current_question = self._get_current_question()

        # Determine status
        if self.workflow_ended:
            status = "ended"
        elif self.research_completed:
            status = "completed"
        elif self.clarification_questions and len(self.clarification_responses) < len(self.clarification_questions):
            status = "awaiting_clarification"
        elif self.original_query and not self.research_completed:
            status = "researching"
        else:
            status = "pending"

        return ResearchStatus(
            original_query=self.original_query,
            clarification_questions=self.clarification_questions,
            clarification_responses=self.clarification_responses,
            current_question_index=self.current_question_index,
            current_question=current_question,
            status=status,
            research_completed=self.research_completed,
        )

    # ============================================
    # Update: Start Research
    # ============================================

    @workflow.update
    async def start_research(self, input: UserQueryInput) -> ResearchStatus:
        """Start a new research session."""
        workflow.logger.info(f"Starting research for: '{input.query}'")
        self.original_query = input.query

        # Check if clarifications are needed
        result = await self.research_manager.run_with_clarifications_start(self.original_query)

        if result.needs_clarifications:
            self.clarification_questions = result.questions or []
        else:
            # No clarifications needed
            if result.report_data is not None:
                self.report_data = result.report_data

        self.research_initialized = True
        return self.get_status()

    # ============================================
    # Update: Provide Clarification Answer
    # ============================================

    @workflow.update
    async def provide_clarification(self, input: SingleClarificationInput) -> ResearchStatus:
        """Provide an answer to the current clarification question."""
        current_question = self._get_current_question()

        # Process via activity (for retries)
        result = await workflow.execute_activity(
            process_clarification,
            ProcessClarificationInput(
                answer=input.answer,
                current_question_index=self.current_question_index,
                current_question=current_question,
                total_questions=len(self.clarification_questions),
            ),
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Update state
        self.clarification_responses[result.question_key] = result.answer
        self.current_question_index = result.new_index

        return self.get_status()

    @provide_clarification.validator
    def validate_clarification(self, input: SingleClarificationInput) -> None:
        """Validate the clarification input."""
        if not input.answer.strip():
            raise ValueError("Answer cannot be empty")

        if not self.original_query:
            raise ValueError("No active research session")

        if not self.clarification_questions or len(self.clarification_responses) >= len(self.clarification_questions):
            raise ValueError("Not collecting clarifications")

    # ============================================
    # Signal: End Workflow
    # ============================================

    @workflow.signal
    async def end_workflow(self) -> None:
        """Signal to end the workflow early."""
        self.workflow_ended = True
```

<details>
<summary>Understanding the Workflow structure</summary>

The workflow follows the pattern from the [AWS re:Invent 2025 demo](https://github.com/temporal-community/aws-reinvent-25-demo):

**Main Loop (`run` method)**:
- Waits for state changes using `workflow.wait_condition()`
- Handles three cases: workflow ended, research completed, research initialized
- The loop allows the workflow to wait indefinitely for human input

**Updates**:
- `start_research`: Begins research and determines if clarifications are needed
- `provide_clarification`: Accepts a single answer and advances to next question

**Query**:
- `get_status`: Returns current state for the UI to poll

**Signal**:
- `end_workflow`: Allows users to cancel research

</details>

---

## Step 3: Update the Agent Files

The existing agent files need small updates to expose the `new_*_agent()` functions that the manager expects.

Update `deep_research/agents/triage_agent.py` to ensure it has:

```python
def new_triage_agent() -> Agent:
    """Create a new triage agent."""
    return Agent(
        name="Triage Agent",
        instructions=TRIAGE_PROMPT,
        model="gpt-4o-mini",
        output_type=TriageResult,
    )
```

Similarly ensure all agent files export their `new_*_agent()` functions. The template already has these, so you may not need changes.

Update `deep_research/agents/__init__.py`:

```python
from .triage_agent import new_triage_agent, check_needs_clarification
from .clarifying_agent import new_clarifying_agent, generate_clarification_questions
from .planner_agent import new_planner_agent, create_search_plan
from .search_agent import new_search_agent, perform_web_search
from .writer_agent import new_writer_agent, write_report

__all__ = [
    "new_triage_agent",
    "new_clarifying_agent",
    "new_planner_agent",
    "new_search_agent",
    "new_writer_agent",
    "check_needs_clarification",
    "generate_clarification_questions",
    "create_search_plan",
    "perform_web_search",
    "write_report",
]
```

---

## Step 4: Create the Worker

The Worker executes Workflows and Activities. The key is configuring `OpenAIAgentsPlugin` which makes all `Runner.run()` calls durable.

Create `run_worker.py` in the project root:

```python
"""
Temporal Worker for the Deep Research Agent.

The OpenAIAgentsPlugin makes all Runner.run() calls automatically durable.
"""

import asyncio
import os
from datetime import timedelta

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.worker import Worker
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

from deep_research.workflows.research_workflow import (
    InteractiveResearchWorkflow,
    process_clarification,
)

load_dotenv()

TEMPORAL_ADDRESS = os.getenv("TEMPORAL_ADDRESS", "localhost:7233")
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "deep-research-queue")


async def main():
    """Start the Worker with OpenAI Agents integration."""
    print(f"Connecting to Temporal at {TEMPORAL_ADDRESS}...")

    # Configure OpenAI Agents plugin for automatic LLM durability
    openai_plugin = OpenAIAgentsPlugin(
        model_params=ModelActivityParameters(
            start_to_close_timeout=timedelta(seconds=120),
            retry_policy={
                "initial_interval": timedelta(seconds=1),
                "maximum_interval": timedelta(seconds=30),
                "backoff_coefficient": 2.0,
                "maximum_attempts": 5,
            },
        )
    )

    # Connect with the plugin
    client = await Client.connect(
        TEMPORAL_ADDRESS,
        namespace=TEMPORAL_NAMESPACE,
        plugins=[openai_plugin],
    )

    # Create worker
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[InteractiveResearchWorkflow],
        activities=[process_clarification],
    )

    print(f"Worker started on task queue: {TASK_QUEUE}")
    print("LLM calls are automatically durable via OpenAIAgentsPlugin")
    print("Press Ctrl+C to stop")

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Step 5: Update the FastAPI Server

Update `run_server.py` to use Temporal Workflows instead of the in-memory manager:

```python
"""
FastAPI Backend with Temporal Integration.
"""

import os
import uuid
from pathlib import Path
from typing import Optional
from datetime import timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from temporalio.client import Client
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

load_dotenv()

from deep_research.workflows.research_workflow import (
    InteractiveResearchWorkflow,
    UserQueryInput,
    SingleClarificationInput,
)

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8234"))
TEMPORAL_ADDRESS = os.getenv("TEMPORAL_ADDRESS", "localhost:7233")
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "deep-research-queue")

app = FastAPI(title="Deep Research Agent (Temporal)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

temporal_client: Optional[Client] = None


@app.on_event("startup")
async def startup():
    """Connect to Temporal on server startup."""
    global temporal_client
    print(f"Connecting to Temporal at {TEMPORAL_ADDRESS}...")

    openai_plugin = OpenAIAgentsPlugin(
        model_params=ModelActivityParameters(
            start_to_close_timeout=timedelta(seconds=120),
        )
    )

    temporal_client = await Client.connect(
        TEMPORAL_ADDRESS,
        namespace=TEMPORAL_NAMESPACE,
        plugins=[openai_plugin],
    )
    print("Connected to Temporal!")


class StartResearchRequest(BaseModel):
    query: str


class AnswerRequest(BaseModel):
    answer: str


@app.get("/")
async def serve_index():
    index_path = Path(__file__).parent / "ui" / "index.html"
    if index_path.exists():
        return HTMLResponse(content=index_path.read_text())
    raise HTTPException(status_code=404, detail="Index page not found")


@app.get("/success")
async def serve_success():
    success_path = Path(__file__).parent / "ui" / "success.html"
    if success_path.exists():
        return HTMLResponse(content=success_path.read_text())
    raise HTTPException(status_code=404, detail="Success page not found")


static_path = Path(__file__).parent / "ui"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")


@app.post("/api/start-research")
async def start_research(request: StartResearchRequest):
    """Start a new research workflow."""
    workflow_id = f"research-{uuid.uuid4().hex[:8]}"

    # Start the workflow (it will wait for the start_research update)
    handle = await temporal_client.start_workflow(
        InteractiveResearchWorkflow.run,
        id=workflow_id,
        task_queue=TASK_QUEUE,
    )

    # Send the start_research update with the query
    status = await handle.execute_update(
        InteractiveResearchWorkflow.start_research,
        UserQueryInput(query=request.query.strip()),
    )

    return {"session_id": workflow_id, "status": status.status}


@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    """Query the workflow status."""
    handle = temporal_client.get_workflow_handle(session_id)

    try:
        status = await handle.query(InteractiveResearchWorkflow.get_status)
        return {
            "session_id": session_id,
            "status": status.status,
            "original_query": status.original_query,
            "current_question": status.current_question,
            "current_question_index": status.current_question_index,
            "total_questions": len(status.clarification_questions) if status.clarification_questions else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/answer/{session_id}/{question_index}")
async def submit_answer(session_id: str, question_index: int, request: AnswerRequest):
    """Send a clarification answer via workflow update."""
    handle = temporal_client.get_workflow_handle(session_id)

    try:
        status = await handle.execute_update(
            InteractiveResearchWorkflow.provide_clarification,
            SingleClarificationInput(answer=request.answer.strip()),
        )
        return {
            "status": "accepted",
            "session_status": status.status,
            "questions_remaining": len(status.clarification_questions) - status.current_question_index if status.clarification_questions else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    """Get the final workflow result."""
    handle = temporal_client.get_workflow_handle(session_id)

    try:
        result = await handle.result()
        return {
            "session_id": session_id,
            "short_summary": result.short_summary,
            "markdown_report": result.markdown_report,
            "follow_up_questions": result.follow_up_questions,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "mode": "temporal",
        "temporal_address": TEMPORAL_ADDRESS,
        "task_queue": TASK_QUEUE,
    }


if __name__ == "__main__":
    import uvicorn
    print(f"Starting Deep Research Agent on http://{API_HOST}:{API_PORT}")
    print("Make sure your Temporal Worker is running: uv run run_worker.py")
    uvicorn.run(app, host=API_HOST, port=API_PORT)
```

---

## Running the Application

You'll need three terminal windows.

### Terminal 1: Start the Temporal Server

```bash
temporal server start-dev
```

This starts a local Temporal server with the Web UI at http://localhost:8233.

### Terminal 2: Start the Worker

```bash
uv run run_worker.py
```

### Terminal 3: Start the FastAPI Server

```bash
uv run run_server.py
```

### Use the Application

1. Open http://localhost:8234 in your browser
2. Enter a research query
3. Answer the clarification questions
4. Wait for the research to complete

---

## Testing Durability

### Test 1: Survive a Worker Crash

1. Start a research query (use a broad topic so clarifications are generated)
2. Answer one clarification question
3. **Stop the Worker** (Ctrl+C in Terminal 2)
4. Wait 10 seconds
5. **Restart the Worker** (`uv run run_worker.py`)

**Result**: Your next answer is accepted, research completes normally.

### Test 2: Survive a Server Crash

1. Start a new research query
2. Answer one clarification question
3. **Stop the FastAPI server** (Ctrl+C in Terminal 3)
4. **Restart the server** (`uv run run_server.py`)
5. Refresh the browser

**Result**: The session continues where you left off.

---

## What You've Built

| Feature | Before | After |
|---------|--------|-------|
| Server crashes | All sessions lost | Sessions continue |
| Worker crashes | Progress lost | Resume from checkpoint |
| LLM failures | Crash or manual retry | Automatic retry |
| Human wait times | Memory/timeout issues | Wait indefinitely |
| Architecture | Manager does everything | Workflow + Manager separation |

---

## Summary

You learned how to:

1. **Use the OpenAI Agents SDK Temporal integration** - LLM calls are automatically durable
2. **Separate concerns** - Workflow manages state, Manager orchestrates agents
3. **Add human-in-the-loop** - Updates for input, Queries for status, Signals for control
4. **Follow production patterns** - Based on the AWS re:Invent 2025 demo architecture

Your research agent now provides production-grade reliability. No more lost research, no more wasted LLM calls, and no more frustrated users starting over after a crash.
