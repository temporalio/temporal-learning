---
id: adding-durability-with-temporal
sidebar_position: 2
keywords: [ai, durable, temporal, genai, llm, openai-agents-sdk, deep-research, agents]
tags: [AI, durable, temporal, LLM, genai, workflow, activities, OpenAI Agents SDK]
last_update:
  date: 2026-02-01
  author: Angela Zhou
title: "Part 3: Running Your Deep Agent"
description: Create the Temporal Workflow, Worker, and server for your durable deep research agent
image: /img/temporal-logo-twitter-card.png
---

# Part 3: Running Your Deep Agent

In [Part 2](../creating-the-workflow), you created the Workflow and Manager that orchestrate the research pipeline. Now you'll run your application and see your durable agents in action.

You'll build two final components:
1. [**Worker**](https://docs.temporal.io/workers) - Executes Workflows with the OpenAI Agents plugin
2. [**FastAPI Server**](https://fastapi.tiangolo.com/) - Connects the UI to your Temporal Workflows

## Step 1: Create the Worker

The [Worker](https://docs.temporal.io/workers) is the process that executes your Workflows and Activities. For this project, the key is configuring the [`OpenAIAgentsPlugin`](https://python.temporal.io/temporalio.contrib.openai_agents.OpenAIAgentsPlugin.html)—this is what makes all `Runner.run()` calls automatically durable.

Create `run_worker.py` in the project root:

```bash
touch run_worker.py
```

### Set Up Imports

Start with the imports:

```python
import asyncio
from datetime import timedelta

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.common import RetryPolicy
from temporalio.worker import Worker
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

from deep_research.workflows.research_workflow import InteractiveResearchWorkflow

load_dotenv()  # Load OPENAI_API_KEY from .env

TASK_QUEUE = "deep-research-queue"
```

:::note Task Queues
The [`task_queue`](https://docs.temporal.io/task-queue) parameter is how Temporal routes work to Workers. When you start a Workflow on the `"deep-research-queue"` task queue, only Workers listening to that queue will execute it. This lets you run different types of work on different machines.
:::

### Configure the OpenAI Agents Plugin

This is what makes your agents durable. Create the plugin with [timeout](https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy) and [retry settings](https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy):

```python
async def main():
    """Start the Worker with OpenAI Agents integration."""

    # Configure OpenAI Agents plugin for automatic LLM durability
    openai_plugin = OpenAIAgentsPlugin(
        model_params=ModelActivityParameters(
            start_to_close_timeout=timedelta(seconds=120),
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=1),
                maximum_interval=timedelta(seconds=30),
                backoff_coefficient=2.0,
                maximum_attempts=5,
            ),
        )
    )
```

Let's break down the `ModelActivityParameters`:

- **[`start_to_close_timeout`](https://docs.temporal.io/encyclopedia/detecting-activity-failures#start-to-close-timeout)**: Each LLM call has 120 seconds to complete. If it takes longer, Temporal considers it failed and retries. We strongly recommend always setting a Start-to-Close Timeout!
- **[`retry_policy`](https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy)**: Controls how failures are handled:
  - [`initial_interval`](https://docs.temporal.io/encyclopedia/retry-policies#initial-interval): Wait 1 second before the first retry
  - [`maximum_interval`](https://docs.temporal.io/encyclopedia/retry-policies#maximum-interval): Never wait more than 30 seconds between retries
  - [`backoff_coefficient`](https://docs.temporal.io/encyclopedia/retry-policies#maximum-interval): Double the wait time after each failure (1s → 2s → 4s → 8s...)
  - [`maximum_attempts`](https://docs.temporal.io/encyclopedia/retry-policies#maximum-interval): Try up to 5 times before giving up

:::info Why These Settings Matter
With LLM APIs, rate limits, network issues, and timeouts can be common. These retry settings mean your research agent keeps trying instead of failing. A rate-limited call will automatically retry with backoff until it succeeds.
:::

### Connect to Temporal with the Plugin

The plugin is passed when connecting to Temporal:

```python
    # Connect to Temporal
    client = await Client.connect(
        "localhost:7233",
        namespace="default",
        plugins=[openai_plugin],
    )
```

Passing the plugin here is what connects everything—it tells the Temporal client to intercept `Runner.run()` calls and execute them as durable Activities.

### Create and Run the Worker

Finally, create the Worker and start it:

```python
    # Create worker
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[InteractiveResearchWorkflow],
    )

    print("Worker started on task queue: deep-research-queue")
    print("Press Ctrl+C to stop")

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

<details>
<summary>Your complete <code>run_worker.py</code> should look like this</summary>

```python
"""
Temporal Worker for the Deep Research Agent.

The OpenAIAgentsPlugin makes all Runner.run() calls automatically durable.
"""

import asyncio
from datetime import timedelta

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.common import RetryPolicy
from temporalio.worker import Worker
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

from deep_research.workflows.research_workflow import InteractiveResearchWorkflow

load_dotenv()  # Load OPENAI_API_KEY from .env

TASK_QUEUE = "deep-research-queue"


async def main():
    """Start the Worker with OpenAI Agents integration."""

    # Configure OpenAI Agents plugin for automatic LLM durability
    openai_plugin = OpenAIAgentsPlugin(
        model_params=ModelActivityParameters(
            start_to_close_timeout=timedelta(seconds=120),
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=1),
                maximum_interval=timedelta(seconds=30),
                backoff_coefficient=2.0,
                maximum_attempts=5,
            ),
        )
    )

    # Connect to Temporal
    client = await Client.connect(
        "localhost:7233",
        namespace="default",
        plugins=[openai_plugin],
    )

    # Create worker
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[InteractiveResearchWorkflow],
    )

    print("Worker started on task queue: deep-research-queue")
    print("Press Ctrl+C to stop")

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

</details>

The Worker is now ready, and you'll start the Worker in the "Running the Application" section below.

---

## Step 2: Update the FastAPI Server

Remember, the template's `run_server.py` uses an in-memory manager that loses state on restart. Let's update it to use Temporal instead. Remove the contents of your `run_server.py` file.

### Add Temporal Imports

Add these imports at the top of `run_server.py`:

```python
from datetime import timedelta

from temporalio.client import Client
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

from deep_research.workflows.research_workflow import (
    InteractiveResearchWorkflow,
    UserQueryInput,
    SingleClarificationInput,
)

TASK_QUEUE = "deep-research-queue"
```

### Add Temporal Client Connection

<details>
<summary>What is a Temporal Client for?</summary>

To interact with Temporal (starting Workflows, sending Updates, running Queries), you need a [Temporal Client](https://docs.temporal.io/develop/python/temporal-client).

A Temporal Client provides APIs to:

- Start a Workflow Execution (like starting a new research session when a user submits a query)
- Query the state of a running Workflow (like checking how many clarification questions have been answered)
- Send Updates to running Workflows (like submitting user answers to clarification questions)
- Get results from completed Workflows (like retrieving the final research report)

</details>

Each request handler (starting research, submitting answers, checking status) needs access to the same Temporal client.

To share the client across all request handlers, we:
1. Create a global variable to hold the client
2. Initialize it once when the server starts (using [FastAPI's startup event](https://fastapi.tiangolo.com/advanced/events/#startup-event))
3. Access it from any request handler

```python
temporal_client: Client = None

@app.on_event("startup")
async def startup():
    """Connect to Temporal on server startup."""
    global temporal_client

    openai_plugin = OpenAIAgentsPlugin(
        model_params=ModelActivityParameters(
            start_to_close_timeout=timedelta(seconds=120),
        )
    )

    temporal_client = await Client.connect(
        "localhost:7233",
        namespace="default",
        plugins=[openai_plugin],
    )
    print("Connected to Temporal!")
```

### Update the API Endpoints

Replace the existing endpoint implementations. The key change: instead of calling the in-memory `research_manager`, we now interact with Temporal Workflows.

**Start Research** - Start a Workflow and send the query via Update:

```python
@app.post("/api/start-research")
async def start_research(request: StartResearchRequest):
    workflow_id = f"research-{uuid.uuid4()}"

    handle = await temporal_client.start_workflow(
        InteractiveResearchWorkflow.run,
        id=workflow_id,
        task_queue=TASK_QUEUE,
    )

    status = await handle.execute_update(
        InteractiveResearchWorkflow.start_research,
        UserQueryInput(query=request.query.strip()),
    )

    return {
        "session_id": workflow_id,
        "status": status.status,
        "clarification_questions": status.clarification_questions,
    }
```

This endpoint does two things:

1. **Starts a new Workflow** — [`start_workflow()`](https://python.temporal.io/temporalio.client.Client.html#start_workflow) creates a new Workflow Execution with a unique ID. The Workflow begins running and immediately waits for input (remember the `wait_condition` in the `run` method).

2. **Sends the query via Update** — [`execute_update()`](https://python.temporal.io/temporalio.client.WorkflowHandle.html#execute_update) calls the `start_research` Update handler, which processes the query and returns the status. If clarifications are needed, the response includes the questions.

The `workflow_id` becomes the `session_id` that the UI uses for all subsequent interactions with this research session.

**Get Status** - Query the Workflow state:

```python
@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    handle = temporal_client.get_workflow_handle(session_id)
    status = await handle.query(InteractiveResearchWorkflow.get_status)

    # Compute current question for the UI
    current_question = None
    current_question_index = 0
    if status.clarification_questions:
        current_question_index = len(status.clarification_responses)
        if current_question_index < len(status.clarification_questions):
            current_question = status.clarification_questions[current_question_index]

    return {
        "session_id": session_id,
        "status": status.status,
        "clarification_questions": status.clarification_questions,
        "clarification_responses": status.clarification_responses,
        "current_question": current_question,
        "current_question_index": current_question_index,
    }
```

This endpoint reads the Workflow's current state:

1. **Gets a handle to an existing Workflow** — [`get_workflow_handle()`](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle) retrieves a handle using the session ID (which is the Workflow ID).

2. **Queries the Workflow** — [`handle.query()`](https://python.temporal.io/temporalio.client.WorkflowHandle.html#query) calls the `get_status` Query handler to read the current state without modifying it.

**Submit Answer** - Send clarification via Update:

```python
@app.post("/api/answer/{session_id}/{question_index}")
async def submit_answer(session_id: str, question_index: int, request: AnswerRequest):
    handle = temporal_client.get_workflow_handle(session_id)

    status = await handle.execute_update(
        InteractiveResearchWorkflow.provide_clarification,
        SingleClarificationInput(answer=request.answer.strip()),
    )

    return {"status": "accepted", "session_status": status.status}
```

This endpoint sends a clarification answer to the Workflow:

1. **Gets the Workflow handle** — Same pattern as before, using the session ID.

2. **Sends the answer via Update** — `execute_update()` calls the `provide_clarification` Update handler, which appends the answer to `clarification_responses`.

3. **May trigger research completion** — If this was the final answer needed, the Workflow's `wait_condition` wakes up and research begins automatically.

**Get Result** - Wait for Workflow completion:

```python
@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    handle = temporal_client.get_workflow_handle(session_id)
    result = await handle.result()

    return {
        "session_id": session_id,
        "short_summary": result["short_summary"],
        "markdown_report": result["markdown_report"],
        "follow_up_questions": result["follow_up_questions"],
    }
```

This endpoint waits for the research to complete and returns the final report:

1. **Gets the Workflow handle** — Same pattern as before.

2. **Waits for completion** — [`handle.result()`](https://python.temporal.io/temporalio.client.WorkflowHandle.html#result) blocks until the Workflow finishes and returns its final output. For a research session, this could take several minutes while the agents plan searches, execute them, and write the report.

3. **Returns the report** — The response includes the summary, full markdown report, and suggested follow-up questions.

:::info Key Pattern
Notice the pattern: `get_workflow_handle(session_id)` retrieves a handle to an existing Workflow by ID. You can then:
- **Query** it to read state (`handle.query()`)
- **Update** it to send data and get a response (`handle.execute_update()`)
- **Wait for completion** (`handle.result()`)
:::

<details>
<summary>Your complete <code>run_server.py</code> should look like this</summary>

```python
"""
FastAPI Backend with Temporal Integration.
"""

import uuid
from datetime import timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from temporalio.client import Client
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

from deep_research.workflows.research_workflow import (
    InteractiveResearchWorkflow,
    UserQueryInput,
    SingleClarificationInput,
)

TASK_QUEUE = "deep-research-queue"

app = FastAPI(title="Deep Research Agent")

temporal_client: Client = None


@app.on_event("startup")
async def startup():
    """Connect to Temporal on server startup."""
    global temporal_client

    openai_plugin = OpenAIAgentsPlugin(
        model_params=ModelActivityParameters(
            start_to_close_timeout=timedelta(seconds=120),
        )
    )

    temporal_client = await Client.connect(
        "localhost:7233",
        namespace="default",
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
    workflow_id = f"research-{uuid.uuid4()}"

    handle = await temporal_client.start_workflow(
        InteractiveResearchWorkflow.run,
        id=workflow_id,
        task_queue=TASK_QUEUE,
    )

    status = await handle.execute_update(
        InteractiveResearchWorkflow.start_research,
        UserQueryInput(query=request.query.strip()),
    )

    return {
        "session_id": workflow_id,
        "status": status.status,
        "clarification_questions": status.clarification_questions,
    }


@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    """Query the workflow status."""
    handle = temporal_client.get_workflow_handle(session_id)
    status = await handle.query(InteractiveResearchWorkflow.get_status)

    # Compute current question for the UI
    current_question = None
    current_question_index = 0
    if status.clarification_questions:
        current_question_index = len(status.clarification_responses)
        if current_question_index < len(status.clarification_questions):
            current_question = status.clarification_questions[current_question_index]

    return {
        "session_id": session_id,
        "status": status.status,
        "clarification_questions": status.clarification_questions,
        "clarification_responses": status.clarification_responses,
        "current_question": current_question,
        "current_question_index": current_question_index,
    }


@app.post("/api/answer/{session_id}/{question_index}")
async def submit_answer(session_id: str, question_index: int, request: AnswerRequest):
    """Send a clarification answer via workflow update."""
    handle = temporal_client.get_workflow_handle(session_id)

    status = await handle.execute_update(
        InteractiveResearchWorkflow.provide_clarification,
        SingleClarificationInput(answer=request.answer.strip()),
    )
    return {"status": "accepted", "session_status": status.status}


@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    """Get the final workflow result."""
    handle = temporal_client.get_workflow_handle(session_id)
    result = await handle.result()
    return {
        "session_id": session_id,
        "short_summary": result["short_summary"],
        "markdown_report": result["markdown_report"],
        "follow_up_questions": result["follow_up_questions"],
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    print("Starting Deep Research Agent on http://localhost:8234")
    print("Make sure your Temporal Worker is running: uv run run_worker.py")
    uvicorn.run(app, host="0.0.0.0", port=8234)
```

</details>

---

## Running the Application

You'll need three terminal windows.

### Terminal 1: Start the Temporal Server

```bash
temporal server start-dev
```

The first step to run anything in Temporal is to make sure you have a local Temporal Service running.
As you will see in the command line output, your Temporal Server should now be running on `http://localhost:8233`. When you first access this server, you should see zero Workflows running.

### Terminal 2: Start the Worker

```bash
uv run run_worker.py
```

You'll see the output: `Worker started on task queue: deep-research-queue`

### Terminal 3: Start the FastAPI Server

```bash
uv run run_server.py
```

### Use the Application

1. Open `http://localhost:8234` in your browser
2. Enter a research query
3. Answer the clarification questions
4. Wait for the research to complete

### Observe in the Temporal Web UI

While your research runs, open the **Temporal Web UI** at `http://localhost:8233` to see what's happening:

1. Click on **Workflows** in the left sidebar
2. Find your workflow (ID starts with `research-`)
3. Click to see the **Event History**—every LLM call, every state change

You'll see each `Runner.run()` call appear as an Activity. If one fails, you can watch Temporal retry it. This visibility is invaluable for debugging production issues.

---

## Testing Durability

1. Start a research query (use a broad topic so clarifications are generated)
2. Answer one clarification question
3. **Stop the Worker** (Ctrl+C in Terminal 2)
4. Wait 10 seconds
5. **Restart the Worker** (`uv run run_worker.py`)

**Result**: The Workflow retained all state—the original query, the triage agent's decision, the clarification questions the clarifying agent generated, and every answer you already provided. You didn't pay twice for those LLM calls. If the agent had already completed searches, those results would be preserved too. Nothing was lost. 

---

## What You've Built

You've transformed a fragile, in-memory research agent into a production-ready application with durable execution. Along the way, you applied the following key concepts:

1. **OpenAI Agents SDK + Temporal Integration**
   - The `OpenAIAgentsPlugin` makes every `Runner.run()` call automatically durable
   - No special wrappers needed—just write normal agent code

2. **Separation of Concerns**
   - **Workflow**: Manages state, handles Updates/Queries, coordinates waiting
   - **Manager**: Orchestrates the agent pipeline, calls `Runner.run()`

3. **Human-in-the-Loop Pattern**
   - **Updates**: Send data to the Workflow and get a response (start research, submit answers)
   - **Queries**: Read Workflow state without modifying it (check status)
   - **`wait_condition`**: Pause indefinitely for human input at zero cost

4. **Production-Ready Patterns**
   - Retry policies for handling LLM failures
   - Timeouts to handle slow or unresponsive API calls
---

## Next Steps

- Sign up [here](https://pages.temporal.io/get-updates-education) to get notified when new Temporal educational content gets published
- Join our Temporal Community Slack [here](https://t.mp/slack)