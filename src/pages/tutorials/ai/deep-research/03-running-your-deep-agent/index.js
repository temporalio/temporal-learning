// Tutorial chapter 3 of 3: Run the Worker, server, and test durability.
// See ./index.js for shared canonical-source notes.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIAL_STEPS = [
  {
    n: 1,
    label: "Setting the Stage",
    href: "/tutorials/ai/deep-research/01-setting-the-stage/",
  },
  {
    n: 2,
    label: "Creating the Workflow",
    href: "/tutorials/ai/deep-research/02-creating-the-workflow/",
  },
  {
    n: 3,
    label: "Running Your Application",
    href: "/tutorials/ai/deep-research/03-running-your-deep-agent/",
  },
];

const TOC_ITEMS = [
  { id: "create-worker", label: "Step 1: Create the Worker" },
  { id: "update-server", label: "Step 2: Update the FastAPI server" },
  { id: "running", label: "Running the application" },
  { id: "testing-durability", label: "Testing durability" },
  { id: "what-you-built", label: "What you've built" },
  { id: "next-steps", label: "Next steps" },
];

const TOUCH_WORKER = `touch run_worker.py`;

const WORKER_IMPORTS = `import asyncio
from datetime import timedelta

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.common import RetryPolicy
from temporalio.worker import Worker
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

from deep_research.workflows.research_workflow import InteractiveResearchWorkflow

load_dotenv()  # Load OPENAI_API_KEY from .env

TASK_QUEUE = "deep-research-queue"`;

const WORKER_PLUGIN_PY = `async def main():
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
    )`;

const WORKER_CONNECT_PY = `    # Connect to Temporal
    client = await Client.connect(
        "localhost:7233",
        namespace="default",
        plugins=[openai_plugin],
    )`;

const WORKER_RUN_PY = `    # Create worker
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[InteractiveResearchWorkflow],
    )

    print("Worker started on task queue: deep-research-queue")
    print("Press Ctrl+C to stop")

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())`;

const FULL_WORKER_PY = `"""
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
    asyncio.run(main())`;

const SERVER_IMPORTS_PY = `from datetime import timedelta

from temporalio.client import Client
from temporalio.contrib.openai_agents import OpenAIAgentsPlugin, ModelActivityParameters

from deep_research.workflows.research_workflow import (
    InteractiveResearchWorkflow,
    UserQueryInput,
    SingleClarificationInput,
)

TASK_QUEUE = "deep-research-queue"`;

const SERVER_STARTUP_PY = `temporal_client: Client = None

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
    print("Connected to Temporal!")`;

const START_RESEARCH_ENDPOINT = `@app.post("/api/start-research")
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
    }`;

const GET_STATUS_ENDPOINT = `@app.get("/api/status/{session_id}")
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
    }`;

const SUBMIT_ANSWER_ENDPOINT = `@app.post("/api/answer/{session_id}/{question_index}")
async def submit_answer(session_id: str, question_index: int, request: AnswerRequest):
    handle = temporal_client.get_workflow_handle(session_id)

    status = await handle.execute_update(
        InteractiveResearchWorkflow.provide_clarification,
        SingleClarificationInput(answer=request.answer.strip()),
    )

    return {"status": "accepted", "session_status": status.status}`;

const GET_RESULT_ENDPOINT = `@app.get("/api/result/{session_id}")
async def get_result(session_id: str):
    handle = temporal_client.get_workflow_handle(session_id)
    result = await handle.result()

    return {
        "session_id": session_id,
        "short_summary": result["short_summary"],
        "markdown_report": result["markdown_report"],
        "follow_up_questions": result["follow_up_questions"],
    }`;

const FULL_SERVER_PY = `"""
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
    uvicorn.run(app, host="0.0.0.0", port=8234)`;

const START_SERVER_CMD = `temporal server start-dev`;
const START_WORKER_CMD = `uv run run_worker.py`;
const START_API_CMD = `uv run run_server.py`;

export default function Chapter3Page() {
  return (
    <Layout
      title="Part 3: Running Your Deep Agent - Deep Research Agent"
      description="Create the Temporal Worker with the OpenAI Agents plugin, update the FastAPI server, run the application, and test durability."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="Deep Research Agent tutorial"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI", href: "/tutorials/ai" },
                  {
                    label: "Deep Research",
                    href: "/tutorials/ai/deep-research/",
                  },
                  { label: "Part 3: Running" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Part 3: Running Your Deep Agent</h1>

            <MetaChips items={["~30 minutes", "Intermediate", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              In{" "}
              <Link to="/tutorials/ai/deep-research/02-creating-the-workflow/">
                Part 2
              </Link>
              , you created the Workflow and Manager that orchestrate the
              research pipeline. Now you'll run your application and see your
              durable agents in action.
            </p>

            <p>You'll build two final components:</p>
            <ol>
              <li>
                <a
                  href="https://docs.temporal.io/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>Worker</strong>
                </a>{" "}
                - Executes Workflows with the OpenAI Agents plugin
              </li>
              <li>
                <a
                  href="https://fastapi.tiangolo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>FastAPI Server</strong>
                </a>{" "}
                - Connects the UI to your Temporal Workflows
              </li>
            </ol>

            <section className={styles.section} id="create-worker">
              <h2 className={styles.sectionTitle}>Step 1: Create the Worker</h2>
              <p>
                The{" "}
                <a
                  href="https://docs.temporal.io/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker
                </a>{" "}
                is the process that executes your Workflows and Activities.
                For this project, the key is configuring the{" "}
                <a
                  href="https://python.temporal.io/temporalio.contrib.openai_agents.OpenAIAgentsPlugin.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>OpenAIAgentsPlugin</code>
                </a>{" "}
                - this is what makes all <code>Runner.run()</code> calls
                automatically durable.
              </p>

              <p>
                Create <code>run_worker.py</code> in the project root:
              </p>
              <CodeBlock language="bash">{TOUCH_WORKER}</CodeBlock>

              <h3>Set up imports</h3>
              <p>Start with the imports:</p>
              <CodeBlock language="python">{WORKER_IMPORTS}</CodeBlock>

              <Admonition type="note" title="Task Queues">
                <p>
                  The{" "}
                  <a
                    href="https://docs.temporal.io/task-queue"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>task_queue</code>
                  </a>{" "}
                  parameter is how Temporal routes work to Workers. When you
                  start a Workflow on the <code>"deep-research-queue"</code>{" "}
                  task queue, only Workers listening to that queue will
                  execute it. This lets you run different types of work on
                  different machines.
                </p>
              </Admonition>

              <h3>Configure the OpenAI Agents plugin</h3>
              <p>
                This is what makes your agents durable. Create the plugin with{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  timeout
                </a>{" "}
                and{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  retry settings
                </a>
                :
              </p>
              <CodeBlock language="python">{WORKER_PLUGIN_PY}</CodeBlock>

              <p>
                Let's break down the <code>ModelActivityParameters</code>:
              </p>
              <ul>
                <li>
                  <strong>
                    <a
                      href="https://docs.temporal.io/encyclopedia/detecting-activity-failures#start-to-close-timeout"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <code>start_to_close_timeout</code>
                    </a>
                  </strong>
                  : Each LLM call has 120 seconds to complete. If it takes
                  longer, Temporal considers it failed and retries. Always set
                  a Start-to-Close Timeout.
                </li>
                <li>
                  <strong>
                    <a
                      href="https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <code>retry_policy</code>
                    </a>
                  </strong>
                  : Controls how failures are handled:
                  <ul>
                    <li>
                      <a
                        href="https://docs.temporal.io/encyclopedia/retry-policies#initial-interval"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <code>initial_interval</code>
                      </a>
                      : Wait 1 second before the first retry
                    </li>
                    <li>
                      <a
                        href="https://docs.temporal.io/encyclopedia/retry-policies#maximum-interval"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <code>maximum_interval</code>
                      </a>
                      : Never wait more than 30 seconds between retries
                    </li>
                    <li>
                      <a
                        href="https://docs.temporal.io/encyclopedia/retry-policies#maximum-interval"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <code>backoff_coefficient</code>
                      </a>
                      : Double the wait time after each failure (1s → 2s → 4s
                      → 8s...)
                    </li>
                    <li>
                      <a
                        href="https://docs.temporal.io/encyclopedia/retry-policies#maximum-interval"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <code>maximum_attempts</code>
                      </a>
                      : Try up to 5 times before giving up
                    </li>
                  </ul>
                </li>
              </ul>

              <Admonition type="info" title="Why these settings matter">
                <p>
                  With LLM APIs, rate limits, network issues, and timeouts can
                  be common. These retry settings mean your research agent
                  keeps trying instead of failing. A rate-limited call will
                  automatically retry with backoff until it succeeds.
                </p>
              </Admonition>

              <h3>Connect to Temporal with the plugin</h3>
              <p>The plugin is passed when connecting to Temporal:</p>
              <CodeBlock language="python">{WORKER_CONNECT_PY}</CodeBlock>
              <p>
                Passing the plugin here is what connects everything - it tells
                the Temporal client to intercept <code>Runner.run()</code>{" "}
                calls and execute them as durable Activities.
              </p>

              <h3>Create and run the Worker</h3>
              <p>Finally, create the Worker and start it:</p>
              <CodeBlock language="python">{WORKER_RUN_PY}</CodeBlock>

              <details>
                <summary>
                  Your complete <code>run_worker.py</code> should look like
                  this
                </summary>
                <CodeBlock language="python" title="run_worker.py">
                  {FULL_WORKER_PY}
                </CodeBlock>
              </details>

              <p>
                The Worker is now ready, and you'll start the Worker in the
                "Running the Application" section below.
              </p>
            </section>

            <section className={styles.section} id="update-server">
              <h2 className={styles.sectionTitle}>
                Step 2: Update the FastAPI server
              </h2>

              <details>
                <summary>Why use the FastAPI Server?</summary>
                <p>
                  The{" "}
                  <a
                    href="https://fastapi.tiangolo.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    FastAPI Server
                  </a>{" "}
                  acts as the HTTP layer between your browser UI and Temporal.
                  When a user submits a query or answers a question, the
                  server translates that HTTP request into Temporal operations
                  (starting Workflows, sending Updates, running Queries).
                </p>
                <p>
                  The server doesn't run the research agents directly - it
                  simply communicates with Temporal, while the Worker executes
                  the actual agent logic.
                </p>
              </details>

              <p>
                The template's <code>run_server.py</code> uses an in-memory
                manager that loses state on restart. Update it to use Temporal
                instead. Remove the contents of your <code>run_server.py</code>{" "}
                file.
              </p>

              <h3>Add Temporal imports</h3>
              <p>
                Add these imports at the top of <code>run_server.py</code>:
              </p>
              <CodeBlock language="python">{SERVER_IMPORTS_PY}</CodeBlock>

              <h3>Add Temporal client connection</h3>

              <details>
                <summary>What is a Temporal Client for?</summary>
                <p>
                  To interact with Temporal (starting Workflows, sending
                  Updates, running Queries), you need a{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/temporal-client"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal Client
                  </a>
                  .
                </p>
                <p>A Temporal Client provides APIs to:</p>
                <ul>
                  <li>
                    Start a Workflow Execution (like starting a new research
                    session when a user submits a query)
                  </li>
                  <li>
                    Query the state of a running Workflow (like checking how
                    many clarification questions have been answered)
                  </li>
                  <li>
                    Send Updates to running Workflows (like submitting user
                    answers to clarification questions)
                  </li>
                  <li>
                    Get results from completed Workflows (like retrieving the
                    final research report)
                  </li>
                </ul>
              </details>

              <p>
                Each request handler (starting research, submitting answers,
                checking status) needs access to the same Temporal client.
              </p>
              <p>To share the client across all request handlers, you:</p>
              <ol>
                <li>Create a global variable to hold the client</li>
                <li>
                  Initialize it once when the server starts (using{" "}
                  <a
                    href="https://fastapi.tiangolo.com/advanced/events/#startup-event"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    FastAPI's startup event
                  </a>
                  )
                </li>
                <li>Access it from any request handler</li>
              </ol>
              <CodeBlock language="python">{SERVER_STARTUP_PY}</CodeBlock>

              <h3>Update the API endpoints</h3>
              <p>
                Replace the existing endpoint implementations. The key change:
                instead of calling the in-memory <code>research_manager</code>,
                you now interact with Temporal Workflows.
              </p>

              <p>
                <strong>Start Research</strong> - Start a Workflow and send the
                query via Update:
              </p>
              <CodeBlock language="python">{START_RESEARCH_ENDPOINT}</CodeBlock>

              <p>This endpoint does two things:</p>
              <ol>
                <li>
                  <strong>Starts a new Workflow</strong> -{" "}
                  <a
                    href="https://python.temporal.io/temporalio.client.Client.html#start_workflow"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>start_workflow()</code>
                  </a>{" "}
                  creates a new Workflow Execution with a unique ID. The
                  Workflow begins running and immediately waits for input
                  (remember the <code>wait_condition</code> in the{" "}
                  <code>run</code> method).
                </li>
                <li>
                  <strong>Sends the query via Update</strong> -{" "}
                  <a
                    href="https://python.temporal.io/temporalio.client.WorkflowHandle.html#execute_update"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>execute_update()</code>
                  </a>{" "}
                  calls the <code>start_research</code> Update handler, which
                  processes the query and returns the status. If
                  clarifications are needed, the response includes the
                  questions.
                </li>
              </ol>
              <p>
                The <code>workflow_id</code> becomes the{" "}
                <code>session_id</code> that the UI uses for all subsequent
                interactions with this research session.
              </p>

              <p>
                <strong>Get Status</strong> - Query the Workflow state:
              </p>
              <CodeBlock language="python">{GET_STATUS_ENDPOINT}</CodeBlock>

              <p>This endpoint reads the Workflow's current state:</p>
              <ol>
                <li>
                  <strong>Gets a handle to an existing Workflow</strong> -{" "}
                  <a
                    href="https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>get_workflow_handle()</code>
                  </a>{" "}
                  retrieves a handle using the session ID (which is the
                  Workflow ID).
                </li>
                <li>
                  <strong>Queries the Workflow</strong> -{" "}
                  <a
                    href="https://python.temporal.io/temporalio.client.WorkflowHandle.html#query"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>handle.query()</code>
                  </a>{" "}
                  calls the <code>get_status</code> Query handler to read the
                  current state without modifying it.
                </li>
              </ol>

              <p>
                <strong>Submit Answer</strong> - Send clarification via Update:
              </p>
              <CodeBlock language="python">{SUBMIT_ANSWER_ENDPOINT}</CodeBlock>

              <p>This endpoint sends a clarification answer to the Workflow:</p>
              <ol>
                <li>
                  <strong>Gets the Workflow handle</strong> - Same pattern as
                  before, using the session ID.
                </li>
                <li>
                  <strong>Sends the answer via Update</strong> -{" "}
                  <code>execute_update()</code> calls the{" "}
                  <code>provide_clarification</code> Update handler, which
                  appends the answer to <code>clarification_responses</code>.
                </li>
                <li>
                  <strong>May trigger research completion</strong> - If this
                  was the final answer needed, the Workflow's{" "}
                  <code>wait_condition</code> wakes up and research begins
                  automatically.
                </li>
              </ol>

              <p>
                <strong>Get Result</strong> - Wait for Workflow completion:
              </p>
              <CodeBlock language="python">{GET_RESULT_ENDPOINT}</CodeBlock>

              <p>
                This endpoint waits for the research to complete and returns
                the final report:
              </p>
              <ol>
                <li>
                  <strong>Gets the Workflow handle</strong> - Same pattern as
                  before.
                </li>
                <li>
                  <strong>Waits for completion</strong> -{" "}
                  <a
                    href="https://python.temporal.io/temporalio.client.WorkflowHandle.html#result"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>handle.result()</code>
                  </a>{" "}
                  blocks until the Workflow finishes and returns its final
                  output. For a research session, this could take several
                  minutes while the agents plan searches, execute them, and
                  write the report.
                </li>
                <li>
                  <strong>Returns the report</strong> - The response includes
                  the summary, full markdown report, and suggested follow-up
                  questions.
                </li>
              </ol>

              <Admonition type="info" title="Key pattern">
                <p>
                  Notice the pattern: <code>get_workflow_handle(session_id)</code>{" "}
                  retrieves a handle to an existing Workflow by ID. You can
                  then:
                </p>
                <ul>
                  <li>
                    <strong>Query</strong> it to read state (
                    <code>handle.query()</code>)
                  </li>
                  <li>
                    <strong>Update</strong> it to send data and get a response
                    (<code>handle.execute_update()</code>)
                  </li>
                  <li>
                    <strong>Wait for completion</strong> (
                    <code>handle.result()</code>)
                  </li>
                </ul>
              </Admonition>

              <details>
                <summary>
                  Your complete <code>run_server.py</code> should look like
                  this
                </summary>
                <CodeBlock language="python" title="run_server.py">
                  {FULL_SERVER_PY}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="running">
              <h2 className={styles.sectionTitle}>Running the application</h2>
              <p>You'll need three terminal windows.</p>

              <h3>Terminal 1: Start the Temporal Server</h3>
              <CodeBlock language="bash">{START_SERVER_CMD}</CodeBlock>
              <p>
                The first step to run anything in Temporal is to make sure you
                have a local Temporal Service running. As you'll see in the
                command line output, your Temporal Server should now be
                running on <code>http://localhost:8233</code>. When you first
                access this server, you should see zero Workflows running.
              </p>

              <h3>Terminal 2: Start the Worker</h3>
              <CodeBlock language="bash">{START_WORKER_CMD}</CodeBlock>
              <p>
                You'll see the output:{" "}
                <code>Worker started on task queue: deep-research-queue</code>
              </p>

              <h3>Terminal 3: Start the FastAPI Server</h3>
              <CodeBlock language="bash">{START_API_CMD}</CodeBlock>

              <h3>Use the application</h3>
              <ol>
                <li>
                  Open <code>http://localhost:8234</code> in your browser
                </li>
                <li>Enter a research query</li>
                <li>Answer the clarification questions</li>
                <li>Wait for the research to complete</li>
              </ol>

              <h3>Observe in the Temporal Web UI</h3>
              <p>
                While your research runs, open the{" "}
                <strong>Temporal Web UI</strong> at{" "}
                <code>http://localhost:8233</code> to see what's happening:
              </p>
              <ol>
                <li>
                  Click on <strong>Workflows</strong> in the left sidebar
                </li>
                <li>
                  Find your workflow (ID starts with <code>research-</code>)
                </li>
                <li>
                  Click to see the <strong>Event History</strong> - every LLM
                  call, every state change
                </li>
              </ol>
              <p>
                You'll see each <code>Runner.run()</code> call appear as an
                Activity. If one fails, you can watch Temporal retry it. This
                visibility is invaluable for debugging production issues.
              </p>
            </section>

            <section className={styles.section} id="testing-durability">
              <h2 className={styles.sectionTitle}>Testing durability</h2>
              <ol>
                <li>
                  Start a research query (use a broad topic so clarifications
                  are generated)
                </li>
                <li>Answer one clarification question</li>
                <li>
                  <strong>Stop the Worker</strong> (Ctrl+C in Terminal 2)
                </li>
                <li>Wait 10 seconds</li>
                <li>
                  <strong>Restart the Worker</strong> (
                  <code>uv run run_worker.py</code>)
                </li>
              </ol>
              <p>
                <strong>Result</strong>: The Workflow retained all state - the
                original query, the triage agent's decision, the clarification
                questions the clarifying agent generated, and every answer you
                already provided. You didn't pay twice for those LLM calls. If
                the agent had already completed searches, those results would
                be preserved too. Nothing was lost.
              </p>
            </section>

            <section className={styles.section} id="what-you-built">
              <h2 className={styles.sectionTitle}>What you've built</h2>
              <p>
                You've transformed a fragile, in-memory research agent into a
                production-ready application with durable execution. Along the
                way, you applied the following key concepts:
              </p>
              <ol>
                <li>
                  <strong>OpenAI Agents SDK + Temporal Integration</strong>
                  <ul>
                    <li>
                      The <code>OpenAIAgentsPlugin</code> makes every{" "}
                      <code>Runner.run()</code> call automatically durable
                    </li>
                    <li>
                      No special wrappers needed - just write normal agent code
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Separation of Concerns</strong>
                  <ul>
                    <li>
                      <strong>Workflow</strong>: Manages state, handles
                      Updates/Queries, coordinates waiting
                    </li>
                    <li>
                      <strong>Manager</strong>: Orchestrates the agent
                      pipeline, calls <code>Runner.run()</code>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Human-in-the-Loop Pattern</strong>
                  <ul>
                    <li>
                      <strong>Updates</strong>: Send data to the Workflow and
                      get a response (start research, submit answers)
                    </li>
                    <li>
                      <strong>Queries</strong>: Read Workflow state without
                      modifying it (check status)
                    </li>
                    <li>
                      <strong>
                        <code>wait_condition</code>
                      </strong>
                      : Pause indefinitely for human input at zero cost
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Production-Ready Patterns</strong>
                  <ul>
                    <li>Retry policies for handling LLM failures</li>
                    <li>Timeouts to handle slow or unresponsive API calls</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className={styles.section} id="next-steps">
              <h2 className={styles.sectionTitle}>Next steps</h2>
              <ul>
                <li>
                  Sign up{" "}
                  <a
                    href="https://pages.temporal.io/get-updates-education"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>{" "}
                  to get notified when new Temporal educational content gets
                  published
                </li>
                <li>
                  Join our Temporal Community Slack{" "}
                  <a
                    href="https://t.mp/slack"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>{" "}
                  to stay up to date about what's going on in the Temporal
                  community
                </li>
              </ul>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/ai/deep-research/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Series overview</span>
                  <h3 className={styles.nextTitle}>
                    Revisit the Deep Research series
                  </h3>
                  <p className={styles.nextBody}>
                    Jump back to any of the three parts of the series to
                    review the manager, Workflow, or Worker configuration.
                  </p>
                  <span className={styles.nextCta}>
                    Back to overview <span aria-hidden="true">&rarr;</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/ai/durable-ai-agent/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>
                    Build a Durable AI Agent with Temporal and Python
                  </h3>
                  <p className={styles.nextBody}>
                    Build a durable AI agent from scratch with the Temporal
                    Python SDK - construct the toolkit, wire up the agent,
                    build the Workflow, and run it end to end.
                  </p>
                  <span className={styles.nextCta}>
                    Start the walkthrough{" "}
                    <span aria-hidden="true">&rarr;</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/deep-research/02-creating-the-workflow/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous: Part 2
                </span>
                <span className={styles.chapterNavTitle}>
                  Creating the Workflow
                </span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
