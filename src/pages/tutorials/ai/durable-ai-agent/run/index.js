// Tutorial chapter 4 of 4: Run and observe the agent.
// See ../index.js for shared canonical-source notes.

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
  { n: 1, label: "Build the toolkit", href: "/tutorials/ai/durable-ai-agent/" },
  { n: 2, label: "Define agent behavior", href: "/tutorials/ai/durable-ai-agent/agent-behavior/" },
  { n: 3, label: "Workflow & Worker", href: "/tutorials/ai/durable-ai-agent/workflow/" },
  { n: 4, label: "Run and observe", href: "/tutorials/ai/durable-ai-agent/run/" },
];

const TOC_ITEMS = [
  { id: "rest-api", label: "Building a REST API" },
  { id: "running", label: "Running your agent" },
  { id: "tracing", label: "Tracing the Workflow Execution" },
  { id: "durability", label: "Witnessing the Durability of the Agent" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BASE = "/img/tutorials/ai/durable-ai-agent";

const API_IMPORTS_PY = `import asyncio
from collections import deque
from contextlib import asynccontextmanager
from typing import Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from temporalio.api.enums.v1 import WorkflowExecutionStatus
from temporalio.client import Client
from temporalio.exceptions import TemporalError

from models.requests import AgentGoalWorkflowParams, CombinedInput, ConversationHistory
from shared.config import TEMPORAL_TASK_QUEUE, get_temporal_client
from tools.goal_registry import goal_event_flight_invoice
from workflows.agent_goal_workflow import AgentGoalWorkflow`;

const API_INSTANCE_PY = `temporal_client: Optional[Client] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global temporal_client
    # Create the Temporal client
    temporal_client = await get_temporal_client()
    yield


app = FastAPI(lifespan=lifespan)

# Load environment variables
load_dotenv()

AGENT_GOAL = goal_event_flight_invoice`;

const API_MIDDLEWARE_PY = `app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Temporal AI Agent!"}`;

const UVICORN_OUTPUT = `INFO:     Will watch for changes in these directories: ['/Users/ziggy/temporal-ai-agent']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [31826] using StatReload
INFO:     Started server process [31828]
INFO:     Waiting for application startup.
Address: localhost:7233, Namespace default
(If unset, then will try to connect to local server)
INFO:     Application startup complete.`;

const ENSURE_CLIENT_PY = `def _ensure_temporal_client() -> Client:
    """Ensure temporal client is initialized and return it.

    Returns:
        TemporalClient: The initialized temporal client.

    Raises:
        HTTPException: If client is not initialized.
    """
    if temporal_client is None:
        raise HTTPException(status_code=500, detail="Temporal client not initialized")
    return temporal_client`;

const START_WORKFLOW_PY = `@app.post("/start-workflow")
async def start_workflow() -> Dict[str, str]:
    """Start the AgentGoalWorkflow"""
    temporal_client = _ensure_temporal_client()

    # Create combined input
    combined_input = CombinedInput(
        tool_params=AgentGoalWorkflowParams(
            None, deque([f"### {AGENT_GOAL.starter_prompt}"])
        ),
        agent_goal=AGENT_GOAL,
    )

    workflow_id = "agent-workflow"

    # Start the workflow with the starter prompt from the goal
    await temporal_client.start_workflow(
        AgentGoalWorkflow.run,
        combined_input,
        id=workflow_id,
        task_queue=TEMPORAL_TASK_QUEUE,
    )

    return {
        "message": f"Workflow started with goal's starter prompt: {AGENT_GOAL.starter_prompt}."
    }`;

const SEND_PROMPT_PY = `@app.post("/send-prompt")
async def send_prompt(prompt: str) -> Dict[str, str]:
    """Sends the user prompt to the Workflow"""
    temporal_client = _ensure_temporal_client()

    workflow_id = "agent-workflow"
    handle = temporal_client.get_workflow_handle(workflow_id)
    await handle.signal("user_prompt", prompt)

    return {"message": f"Prompt '{prompt}' sent to workflow {workflow_id}."}`;

const CONFIRM_API_PY = `@app.post("/confirm")
async def send_confirm() -> Dict[str, str]:
    """Sends a 'confirm' signal to the workflow."""
    temporal_client = _ensure_temporal_client()

    workflow_id = "agent-workflow"
    handle = temporal_client.get_workflow_handle(workflow_id)
    await handle.signal("confirm")
    return {"message": "Confirm signal sent."}`;

const END_CHAT_API_PY = `@app.post("/end-chat")
async def end_chat() -> Dict[str, str]:
    """Sends a 'end_chat' signal to the workflow."""
    temporal_client = _ensure_temporal_client()

    workflow_id = "agent-workflow"
    handle = temporal_client.get_workflow_handle(workflow_id)
    await handle.signal("end_chat")
    return {"message": "End chat signal sent."}`;

const GET_HISTORY_API_PY = `@app.get("/get-conversation-history")
async def get_conversation_history() -> ConversationHistory:
    """Calls the workflow's 'get_conversation_history' query."""

    temporal_client = _ensure_temporal_client()

    try:
        handle = temporal_client.get_workflow_handle("agent-workflow")

        failed_states = [
            WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_TERMINATED,
            WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_CANCELED,
            WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_FAILED,
        ]

        description = await handle.describe()
        if description.status in failed_states:
            print("Workflow is in a failed state. Returning empty history.")
            return []

        # Set a timeout for the query
        try:
            conversation_history = await asyncio.wait_for(
                handle.query("get_conversation_history"),
                timeout=5,  # Timeout after 5 seconds
            )
            return conversation_history
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=404,
                detail="Temporal query timed out (worker may be unavailable).",
            )

    except TemporalError as e:
        error_message = str(e)
        print(f"Temporal error: {error_message}")

        # If worker is down or no poller is available, return a 404
        if "no poller seen for task queue recently" in error_message:
            raise HTTPException(
                status_code=404, detail="Workflow worker unavailable or not found."
            )

        if "workflow not found" in error_message:
            await start_workflow()
            return []
        else:
            # For other Temporal errors, return a 500
            raise HTTPException(
                status_code=500, detail="Internal server error while querying workflow."
            )`;

const API_FULL_PY = `import asyncio
from collections import deque
from contextlib import asynccontextmanager
from typing import Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from temporalio.api.enums.v1 import WorkflowExecutionStatus
from temporalio.client import Client
from temporalio.exceptions import TemporalError

from models.requests import AgentGoalWorkflowParams, CombinedInput, ConversationHistory
from shared.config import TEMPORAL_TASK_QUEUE, get_temporal_client
from tools.goal_registry import goal_event_flight_invoice
from workflows.agent_goal_workflow import AgentGoalWorkflow

temporal_client: Optional[Client] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global temporal_client
    # Create the Temporal client
    temporal_client = await get_temporal_client()
    yield


app = FastAPI(lifespan=lifespan)

# Load environment variables
load_dotenv()

AGENT_GOAL = goal_event_flight_invoice


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> Dict[str, str]:
    return {"message": "Temporal AI Agent!"}


def _ensure_temporal_client() -> Client:
    """Ensure temporal client is initialized and return it.

    Returns:
        TemporalClient: The initialized temporal client.

    Raises:
        HTTPException: If client is not initialized.
    """
    if temporal_client is None:
        raise HTTPException(status_code=500, detail="Temporal client not initialized")
    return temporal_client


@app.post("/start-workflow")
async def start_workflow() -> Dict[str, str]:
    """Start the AgentGoalWorkflow"""
    temporal_client = _ensure_temporal_client()

    # Create combined input
    combined_input = CombinedInput(
        tool_params=AgentGoalWorkflowParams(
            None, deque([f"### {AGENT_GOAL.starter_prompt}"])
        ),
        agent_goal=AGENT_GOAL,
    )

    workflow_id = "agent-workflow"

    # Start the workflow with the starter prompt from the goal
    await temporal_client.start_workflow(
        AgentGoalWorkflow.run,
        combined_input,
        id=workflow_id,
        task_queue=TEMPORAL_TASK_QUEUE,
    )

    return {
        "message": f"Workflow started with goal's starter prompt: {AGENT_GOAL.starter_prompt}."
    }


@app.post("/send-prompt")
async def send_prompt(prompt: str) -> Dict[str, str]:
    """Sends the user prompt to the Workflow"""
    temporal_client = _ensure_temporal_client()

    workflow_id = "agent-workflow"
    handle = temporal_client.get_workflow_handle(workflow_id)
    await handle.signal("user_prompt", prompt)

    return {"message": f"Prompt '{prompt}' sent to workflow {workflow_id}."}


@app.post("/confirm")
async def send_confirm() -> Dict[str, str]:
    """Sends a 'confirm' signal to the workflow."""
    temporal_client = _ensure_temporal_client()

    workflow_id = "agent-workflow"
    handle = temporal_client.get_workflow_handle(workflow_id)
    await handle.signal("confirm")
    return {"message": "Confirm signal sent."}


@app.post("/end-chat")
async def end_chat() -> Dict[str, str]:
    """Sends a 'end_chat' signal to the workflow."""
    temporal_client = _ensure_temporal_client()

    workflow_id = "agent-workflow"
    handle = temporal_client.get_workflow_handle(workflow_id)
    await handle.signal("end_chat")
    return {"message": "End chat signal sent."}


@app.get("/get-conversation-history")
async def get_conversation_history() -> ConversationHistory:
    """Calls the workflow's 'get_conversation_history' query."""

    temporal_client = _ensure_temporal_client()

    try:
        handle = temporal_client.get_workflow_handle("agent-workflow")

        failed_states = [
            WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_TERMINATED,
            WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_CANCELED,
            WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_FAILED,
        ]

        description = await handle.describe()
        if description.status in failed_states:
            print("Workflow is in a failed state. Returning empty history.")
            return []

        # Set a timeout for the query
        try:
            conversation_history = await asyncio.wait_for(
                handle.query("get_conversation_history"),
                timeout=5,  # Timeout after 5 seconds
            )
            return conversation_history
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=404,
                detail="Temporal query timed out (worker may be unavailable).",
            )

    except TemporalError as e:
        error_message = str(e)
        print(f"Temporal error: {error_message}")

        # If worker is down or no poller is available, return a 404
        if "no poller seen for task queue recently" in error_message:
            raise HTTPException(
                status_code=404, detail="Workflow worker unavailable or not found."
            )

        if "workflow not found" in error_message:
            await start_workflow()
            return []
        else:
            # For other Temporal errors, return a 500
            raise HTTPException(
                status_code=500, detail="Internal server error while querying workflow."
            )`;

const API_TREE = `temporal-ai-agent/
├── .env
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
├── uv.lock
├── activities/
|   ├── __init__.py
|   └── activities.py
├── api/
│   └── main.py
├── models/
│   ├── __init__.py
│   ├── core.py
│   └── requests.py
├── prompts/
│   ├── __init__.py
│   ├── agent_prompt_generators.py
│   └── prompts.py
├── scripts/
│   ├── create_invoice_test.py
│   ├── find_events_test.py
│   └── search_flights_test.py
├── tools/
│   ├── __init__.py
│   ├── create_invoice.py
│   ├── find_events.py
│   ├── goal_registry.py
│   ├── search_flights.py
│   ├── tool_registry.py
│   └── data/
|       └── find_events_data.json
├── worker/
│   └── worker.py
└── workflows/
    ├── __init__.py
    ├── agent_goal_workflow.py
    └── workflow_helpers.py`;

const TEMPORAL_START_OUTPUT = `CLI 1.1.1 (Server 1.25.1, UI 2.31.2)

Server:  localhost:7233
UI:      http://localhost:8233
Metrics: http://localhost:53697/metrics`;

const WORKER_OUTPUT = `Worker will use LLM model: openai/gpt-4o
Address: localhost:7233, Namespace default
(If unset, then will try to connect to local server)
AgentActivities initialized with LLM model: openai/gpt-4o
Worker ready to process tasks!
Starting worker, connecting to task queue: agent-task-queue
Ready to begin processing...`;

export default function Chapter4Page() {
  return (
    <Layout
      title="Run and observe the agent - Build a durable AI agent"
      description="Chapter 4: Build the REST API, run your agent end to end, and witness Temporal's durability guarantees."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="Build a durable AI agent with Temporal"
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
                  { label: "Durable AI Agent", href: "/tutorials/ai/durable-ai-agent/" },
                  { label: "Run and observe" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run and observe the agent</h1>

            <MetaChips items={["~30 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={4} />

            <p className={styles.intro}>
              You now have everything in place to run your agent. In this
              final chapter you'll build a FastAPI backend so a UI can
              interact with the Workflow, run the agent end to end, trace
              its execution in the Temporal Web UI, and witness Temporal's
              durability across simulated failures.
            </p>

            <section className={styles.section} id="rest-api">
              <h2 className={styles.sectionTitle}>Building a REST API for interacting with your agent</h2>
              <p>
                Now that you have your agent implemented, you need a way for
                client applications to interact with it. Temporal provides
                client libraries, but having an API to manage invoking a
                Workflow, sending Signals and Queries, and managing various
                Workflow Executions is a typical pattern for managing
                Temporal Workflows.
              </p>
              <p>
                In this step, you will create a backend API that will serve
                as the interface for interacting with your agent. You'll use
                the{" "}
                <a
                  href="https://fastapi.tiangolo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FastAPI
                </a>{" "}
                framework to build this. FastAPI is a great choice to pair
                with Temporal, as it's an async Python backend that
                supports type hints.
              </p>

              <h3>Setting up the FastAPI application</h3>
              <p>First, create the directory structure for your FastAPI application:</p>
              <CodeBlock language="bash">mkdir api</CodeBlock>

              <p>
                Next, create the API file at <code>api/main.py</code> and
                include the following <code>import</code> statements:
              </p>
              <CodeBlock language="python" title="api/main.py">
                {API_IMPORTS_PY}
              </CodeBlock>
              <p>
                This imports various packages from the standard library,
                third-party libraries including FastAPI and Temporal, and a
                few of your custom libraries. The API imported the{" "}
                <code>AgentGoalWorkflow</code> so it can invoke it, the{" "}
                <code>goal_event_flight_invoice</code> for specification of
                the goal, the <code>get_temporal_client</code> function and{" "}
                <code>TEMPORAL_TASK_QUEUE</code> constant for communicating
                with the Temporal service, and a few of your custom types
                for proper communication with the Workflow.
              </p>

              <p>Next, add the code to configure and instantiate the FastAPI object:</p>
              <CodeBlock language="python" title="api/main.py">
                {API_INSTANCE_PY}
              </CodeBlock>
              <p>
                This creates a Temporal client, then uses the{" "}
                <code>lifespan</code> function to call the{" "}
                <code>get_temporal_client</code> function. The{" "}
                <code>lifespan</code> function, paired with the{" "}
                <code>@asynccontextmanager</code> decorator defines a
                context manager that defines startup and shutdown behavior
                for your FastAPI app. Next, it creates the FastAPI app,
                passing in the <code>lifespan</code> as a parameter.
                Finally, you load in the environment variables and specify
                the <code>AGENT_GOAL</code> to{" "}
                <code>goal_event_flight_invoice</code>.
              </p>

              <p>
                Next, add the appropriate middleware for handling CORS and
                define the root handler for your app:
              </p>
              <CodeBlock language="python" title="api/main.py">
                {API_MIDDLEWARE_PY}
              </CodeBlock>
              <p>
                The CORS settings are set up to allow for access from an
                origin. Any request to the root of your application will
                return JSON with a single key and a message.
              </p>

              <p>Before moving on, test your FastAPI app by running the following commands:</p>

              <p>In one terminal, start your Temporal development server:</p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                This starts a local Temporal service running on port 7233
                with the web UI running on port 8233. The output of this
                command should resemble (the exact version numbers may not
                match):
              </p>
              <CodeBlock>{TEMPORAL_START_OUTPUT}</CodeBlock>

              <p>
                In another terminal, start the API using <code>uv</code>{" "}
                from the root of your project:
              </p>
              <CodeBlock language="bash">uv run uvicorn api.main:app --reload</CodeBlock>
              <p>
                This uses <code>uvicorn</code>, an ASGI server to run the
                FastAPI app and auto reload the app if any changes are
                detected.
              </p>
              <p>The output of this command should resemble:</p>
              <CodeBlock>{UVICORN_OUTPUT}</CodeBlock>

              <p>Next, test your application is working by sending a request to it:</p>
              <CodeBlock language="bash">curl localhost:8000</CodeBlock>
              <p>Your response should be:</p>
              <CodeBlock>{`{"message":"Temporal AI Agent!"}`}</CodeBlock>

              <p>
                Now that you have the base FastAPI application configured
                with a Temporal client, you will implement the functions to
                interact with your agent Workflow.
              </p>

              <h3>Implementing agent Workflow endpoints</h3>
              <p>
                Your API only needs a few endpoints to communicate with the
                agent. You will implement the functionality to send
                Signals, get the conversation history, and start the
                Workflow.
              </p>

              <h4>Validating the Temporal client</h4>
              <p>
                Every function will use the same Temporal client. First,
                you will implement a helper function to verify the client
                is set up correctly.
              </p>
              <p>Add the following function to your <code>main.py</code> file:</p>
              <CodeBlock language="python" title="api/main.py">
                {ENSURE_CLIENT_PY}
              </CodeBlock>
              <p>
                This function ensures the global Temporal client is not{" "}
                <code>None</code>. If it isn't, the function returns the
                client. If it is <code>None</code>, it will raise an
                exception. This is a type-safe way of validating the
                client before every function call.
              </p>

              <h4>Starting the agent Workflow</h4>
              <p>
                Next, you'll define an endpoint that a client will use to
                start the agent Workflow. This endpoint is a POST
                endpoint, and doesn't take any parameters.
              </p>
              <p>Add the endpoint to your <code>api.py</code> file:</p>
              <CodeBlock language="python" title="api/main.py">
                {START_WORKFLOW_PY}
              </CodeBlock>
              <p>
                The code verifies the Temporal client, then creates a{" "}
                <code>CombinedInput</code> type containing an{" "}
                <code>AgentGoalWorkflowParams</code> object and the{" "}
                <code>AGENT_GOAL</code>. The{" "}
                <code>AgentGoalWorkflowParams</code> object assigns{" "}
                <code>None</code> to its first attribute, which represents
                the conversation history. This is fine, as there is
                currently no conversation history. The second attribute is
                the first prompt the agent will execute. You then specify
                the <code>workflow_id</code> that will identify the
                execution, in this case it is hard coded to{" "}
                <code>agent-workflow</code>. Finally, you start the
                Workflow asynchronously using{" "}
                <code>temporal.client.start_workflow</code>, specifying the
                Workflow method <code>AgentGoalWorkflow.run</code>, the
                parameter <code>combined_input</code>,{" "}
                <code>workflow_id</code>, and <code>task_queue</code>.
              </p>
              <p>
                The function then returns with a message stating that the
                Workflow has started.
              </p>

              <h4>Sending a user prompt to the Workflow</h4>
              <p>
                Now you'll implement sending the user's prompt to the
                Workflow. The user will interact with the chatbot
                interface, sending messages to the agent. The chatbot
                sends these as Signals to the <code>user_prompt</code>{" "}
                Signal handler you defined in your Workflow.
              </p>
              <p>Add the following code to send the user's prompt to the Workflow:</p>
              <CodeBlock language="python" title="api/main.py">
                {SEND_PROMPT_PY}
              </CodeBlock>
              <p>
                This code identifies the Workflow Execution by its{" "}
                <code>workflow_id</code>, and sends the user's prompts
                sent to the API as Signals to that Workflow Execution.
              </p>

              <h4>Sending a confirmation to the Workflow</h4>
              <p>
                If you have the <code>SHOW_CONFIRM</code> option set in
                your <code>.env</code> file, then the user must confirm
                the tool before it is executed. This choice is sent to
                the workflow via a Signal. You already implemented the
                Signal handler in the Workflow, now you will implement
                sending the Signal.
              </p>
              <p>Add the following code to send the <code>confirm</code> Signal:</p>
              <CodeBlock language="python" title="api/main.py">
                {CONFIRM_API_PY}
              </CodeBlock>
              <p>
                This code identifies the Workflow Execution by its{" "}
                <code>workflow_id</code>, and sends the Signals sent to
                the API to that Workflow Execution.
              </p>

              <h4>Ending the chat</h4>
              <p>
                Finally, the user can choose to end the chat at any time
                by saying something along the lines of "end conversation."
                You also implemented this Signal handler in your Workflow,
                so now you'll implement the sending of the Signal.
              </p>
              <p>Add the following code:</p>
              <CodeBlock language="python" title="api/main.py">
                {END_CHAT_API_PY}
              </CodeBlock>
              <p>
                This code identifies the Workflow Execution by its{" "}
                <code>workflow_id</code>, and sends the Signals sent to
                the API to that Workflow Execution.
              </p>

              <h4>Retrieving the conversation history</h4>
              <p>
                The last API endpoint you must implement retrieves the
                conversation history. The UI uses this to populate the
                interface for the user to read. This API will perform a
                Query and retrieve the information from the running
                Workflow Execution.
              </p>
              <p>Add the following code to implement the endpoint:</p>
              <CodeBlock language="python" title="api/main.py">
                {GET_HISTORY_API_PY}
              </CodeBlock>
              <p>
                This function identifies the Workflow by its Workflow ID,
                then checks the Workflow Execution's status, making sure
                it isn't in a failed state. It then performs the Query,
                setting a timeout of five seconds, handling various
                errors as they may occur. If the Workflow Execution
                isn't found however, the endpoint will actually kick it
                off.
              </p>

              <details>
                <summary>
                  The <code>api/main.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="api/main.py">
                  {API_FULL_PY}
                </CodeBlock>
              </details>

              <p>You just implemented an API allowing client programs to interact with your agent.</p>

              <details>
                <summary>Before moving on to the next section, verify your files and directory structure is correct.</summary>
                <CodeBlock>{API_TREE}</CodeBlock>
              </details>

              <p>In the next step, you will test your agent using a chatbot web interface.</p>
            </section>

            <section className={styles.section} id="running">
              <h2 className={styles.sectionTitle}>Running your agent</h2>
              <p>
                Now that you have implemented a mechanism of communication
                for your agent, it's time to test it. You will now
                download a React frontend that implements a chatbot UI to
                interact with your agent. The UI will open in a terminal
                window and prompt the user with a message stating their
                purpose and instructing the user what to do next.
                Throughout the conversation, the user will interact with
                the agent, responding to questions from the agent as the
                agent tries to accomplish its goal.
              </p>

              <h3>Adding a Chatbot Web UI</h3>
              <p>To get started, download the pre-built React based web UI:</p>
              <CodeBlock language="bash">
                curl -o frontend.zip https://raw.githubusercontent.com/temporal-community/tutorial-temporal-ai-agent/main/frontend.zip
              </CodeBlock>

              <p>
                Once downloaded, extract the files from the zip to your
                root directory. You can do this with your OS's tool, or
                with a command line tool like <code>unzip</code>:
              </p>
              <CodeBlock language="bash">unzip frontend.zip</CodeBlock>

              <p>
                Next, change directories into the <code>frontend</code>{" "}
                directory that was just extracted and install the packages
                to run the UI:
              </p>
              <CodeBlock language="bash">{`cd frontend
npm install`}</CodeBlock>

              <p>
                Once the packages are finished installing, the web UI is
                ready to interact with your API.
              </p>

              <h3>Starting Your Agent</h3>
              <p>
                You now have assembled all the pieces to run the agent to
                completion. Running the agent requires a minimum of{" "}
                <strong>four</strong> different terminals, however there
                will only be one Worker process running. You can either
                open multiple terminals, or use a terminal multiplexer
                like <code>screen</code> or <code>tmux</code>. This
                tutorial can function with a single Worker. However, as
                with all real-world Temporal deployments, it is always
                better to run multiple Workers for scaling and redundancy.
              </p>
              <p>
                The first requirement is running a local Temporal server
                that coordinates workflow execution and provides durability
                guarantees.
              </p>

              <p>In the first terminal, start the development server:</p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                This starts a local Temporal service running on port 7233
                with the web UI running on port 8233. The output of this
                command should resemble (the exact version numbers may not
                match):
              </p>
              <CodeBlock>{TEMPORAL_START_OUTPUT}</CodeBlock>

              <p>In the second terminal, start your Worker:</p>
              <CodeBlock language="bash">uv run worker/worker.py</CodeBlock>
              <p>You should see the following output:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>

              <p>
                If you are able, running a second Worker in another
                terminal is recommended using the steps above.
              </p>

              <p>Next, open another terminal and run the FastAPI application:</p>
              <CodeBlock language="bash">uv run uvicorn api.main:app --reload</CodeBlock>
              <p>
                This uses <code>uvicorn</code>, an ASGI server to run the
                FastAPI app and auto-reload the app if any changes are
                detected.
              </p>
              <p>The output of this command should resemble:</p>
              <CodeBlock>{UVICORN_OUTPUT}</CodeBlock>

              <p>
                Finally, open the last new terminal, change directories
                into the <code>frontend</code> directory and start the
                web UI:
              </p>
              <CodeBlock language="bash">{`cd frontend
npx vite`}</CodeBlock>
              <p>
                You will see output to your terminal, and then your web
                browser will open to <code>localhost:5173</code> with your
                agent running.
              </p>

              <Admonition type="note">
                <p>
                  When first starting the web UI, you may see a red error
                  banner appear upon startup with a message about timeouts.
                  This is expected, as the UI begins polling immediately
                  before the Workflow may begin. This will go away within
                  a few seconds once the Workflow Execution has started
                  and the first message from the agent appears.
                </p>
              </Admonition>

              <p>
                Finally, open a new browser tab and navigate to{" "}
                <code>localhost:8233</code>. This will display the
                Temporal Web UI. You should see a running Workflow
                Execution there with the Workflow ID{" "}
                <strong>agent-workflow</strong>. Click on the link to open
                it so you can watch the Workflow progress as you test your
                agent.
              </p>

              <h3>Testing the complete system</h3>
              <p>With all components running, you can now test the agent Workflow.</p>
              <p>
                Navigate back to <code>localhost:5173</code>. You should
                see a message <em>similar</em> to the following. Remember,
                the agent's responses are powered by an LLM, so the
                responses are non-deterministic, meaning they are likely to
                be slightly different every time.
              </p>
              <CodeBlock>{`Agent: Welcome! I'm here to help you plan your travel to events in North America.
I can assist you in finding events, booking flights, and generating invoices for your trip.
To get started, please tell me which city and month you're interested in traveling to?`}</CodeBlock>

              <p>
                Test the conversation by responding with a city you'd
                like to travel to and the month you want to travel:
              </p>
              <CodeBlock>{`You: I'd like to see events in San Francisco in March`}</CodeBlock>

              <p>The agent will process receive your prompt and use the LLM to determine the next step:</p>
              <CodeBlock>{`Agent: Let's proceed with finding events in San Francisco in March.`}</CodeBlock>

              <p>
                It will determine that it should use the{" "}
                <code>FindEvents</code> tool and search for events.
              </p>

              <Admonition type="note">
                <p>
                  If you have the <code>SHOW_CONFIRM</code> environment
                  variable set to <code>True</code>, the UI will prompt you
                  to confirm execution of this tool and all future tool
                  executions. By default this is enabled, so you will need
                  to confirm the execution.
                </p>
              </Admonition>

              <p>
                Once you have confirmed the tool execution, the agent
                executes the tool and provides events for you to choose
                from:
              </p>
              <CodeBlock>{`Agent: I found a couple of events in San Francisco:
1. Lunar New Year Festival & Parade from February 8 to February 22, 2026
2. San Francisco International Film Festival from April 17 to May 1, 2026
Would you like to search for flights to attend any of these events? If so, please provide your departure city.`}</CodeBlock>

              <p>You can then respond with which event you'd like to attend:</p>
              <CodeBlock>{`You: I would like to attend the San Francisco International Film Festival`}</CodeBlock>

              <p>However, you forgot to provide the departure city here, which the agent recognized and then prompted you for again.</p>
              <CodeBlock>{`Agent: Great choice! The San Francisco International Film Festival is from April 17 to May 1, 2026.
Please provide your departure city so I can search for flights.`}</CodeBlock>

              <p>Thinking about lunch, you accidentally input your lunch order into the chatbot:</p>
              <CodeBlock>{`I would like to order two double cheeseburgers.`}</CodeBlock>

              <p>The agent's guardrails recognize this isn't valid for its goal, so it informs you and prompts you to enter your departure city.</p>
              <CodeBlock>{`Agent: Your request to order two double cheeseburgers doesn't align with our current goal.
We're working on organizing a trip for you to attend the San Francisco International Film Festival.
To proceed, please let me know your departure city so I can search for flights for your trip.`}</CodeBlock>

              <p>You then provide it with your departure city:</p>
              <CodeBlock>{`You: I'm sorry. I'd like to depart from Austin, TX`}</CodeBlock>

              <p>
                The agent now has the information it needs, and can move
                on to the next step. However, it may decide to confirm
                with you again to ensure that's what you meant.
              </p>
              <CodeBlock>{`Agent: Thanks! You're departing from Austin, TX.
Would you like to proceed with searching for flights from Austin to San Francisco for the San Francisco International Film Festival?`}</CodeBlock>

              <p>To which you should either confirm or deny. In this instance, confirm:</p>
              <CodeBlock>{`You: Yes`}</CodeBlock>

              <p>This extra confirmation step may not always happen. It depends if the LLM decides to verify.</p>

              <p>
                However, it is now satisfied and is ready to execute the
                next tool. This is evident because after this response,
                you are asked to confirm execution for the{" "}
                <code>SearchFlights</code> tool:
              </p>
              <CodeBlock>{`Agent: Let's proceed with searching for flights from Austin, TX (AUS) to San Francisco (SFO) around the dates of April 17 to May 1, 2026.`}</CodeBlock>

              <p>After you confirm the tool usage, the agent then executes the tool, searching for flights to your destination.</p>

              <Admonition type="note">
                <p>
                  If you have supplied a RAPIDAPI key, this will make a
                  call to a microservice to check for real flight data.
                  If the API returns multiple times with an error or no
                  flights, this is the external API being unreliable and
                  returning sporadic error messages. To alleviate this,
                  use the mocked function instead.
                </p>
              </Admonition>

              <p>
                Once the agent finds flight options, it will present them
                to you, allowing you to select a flight if there are
                multiple. It will prompt you if you would like to create
                an invoice for the flight:
              </p>
              <CodeBlock>{`Agent:
I found the cheapest flight with Southwest Airlines for $149.75.
Would you like to create an invoice for this flight?`}</CodeBlock>

              <p>To which you confirm:</p>
              <CodeBlock>{`You: Yes`}</CodeBlock>

              <p>
                And the agent will proceed with creating an invoice,
                prompting the user to allow the execution of the{" "}
                <code>CreateInvoice</code> tool:
              </p>
              <CodeBlock>{`Agent: Let's proceed with creating an invoice for the Southwest Airlines flight.`}</CodeBlock>

              <p>The agent then creates the invoice, the goal is complete, and the chat is over.</p>
              <CodeBlock>{`Agent: Invoice generated successfully!
You can view and pay your invoice at: https://pay.example.com/invoice/12345.
Your reference number is INV-12345. If you need further assistance, feel free to ask.`}</CodeBlock>

              <Admonition type="note">
                <p>
                  If you set a <code>STRIPE_API_KEY</code> environment
                  variable in your <code>.env</code> file, the tool will
                  use the Stripe API to create an invoice in your Stripe
                  environment. Otherwise, it will create a pseudo link.
                </p>
              </Admonition>

              <p>
                Now that the chat is over, the Workflow Execution is
                over. You can start another chat session by clicking the{" "}
                <strong>Start New Chat</strong> button in the web UI,
                which will start a new Workflow Execution.
              </p>
              <p>Next, you'll examine the Event History of your most recent chat session.</p>
            </section>

            <section className={styles.section} id="tracing">
              <h2 className={styles.sectionTitle}>Tracing the Workflow Execution in the Web UI</h2>
              <p>
                One of the features of Temporal is the observability that
                you gain via the Temporal Web UI. This is made possible
                since every event is stored, along with the inputs and
                output of Workflows, Activities, and other Temporal
                operations.
              </p>
              <p>
                Open the Temporal Web UI at{" "}
                <code>http://localhost:8233</code> and navigate to your
                most recent run.
              </p>
              <p>
                <em>
                  Your UI may not look exactly like the screenshots below
                  due to differing UI versions, varying output from LLMs,
                  and different user inputs. This is fine; the core
                  concepts are still applicable.
                </em>
              </p>

              <p>
                Navigate to the Workflows page to see your past agent
                Workflow Executions. This is also the default landing
                page.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/workflow-executions.png`}
                  alt="Screenshot of the Temporal Web UI Workflow Executions list page with your current Workflow Executions"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                You will see all of your completed and currently running
                chat sessions here. Click on the{" "}
                <strong>Workflow ID</strong> link{" "}
                <strong>agent-workflow</strong> of the most recently
                completed execution to see the details about that
                specific execution.
              </p>
              <p>
                At the top, you'll see the summary for the Workflow
                Execution. This contains information such as the duration
                of the execution, when it started, when it ended, what
                Task Queue it used, the size of the history, and the
                Workflow Type. All of this information can also be pieced
                together throughout the <strong>Event History</strong>,
                the <strong>Summary</strong> section provides an easier
                way to find it.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/summary.png`}
                  alt="Screenshot of the summary section of the Temporal Web UI for the most recent Workflow Execution"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                Next is the <strong>Input</strong> and{" "}
                <strong>Result</strong> section. Here you can see the
                initial input to the Workflow, and the final result that
                the agent returned in JSON format.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/workflow-input-results.png`}
                  alt="Screenshot of the input and output section of the Temporal Web UI for the most recent Workflow Execution's input and outputs"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                Below that is the <strong>Event History</strong>{" "}
                timeline. This is a time-based representation of every
                event that occurred during the execution of the Workflow.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/timeline.png`}
                  alt="Screenshot of the timeline section of the Temporal Web UI for the most recent Workflow Execution"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                Each individual event in this timeline is expandable. You
                can click on it and view the details for the event. For
                example, if you click on a purple <strong>Signal</strong>{" "}
                icon, you can see the Signal name, the identity of the
                Worker that processed it, and the input.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/timeline-signal-expanded.png`}
                  alt="Screenshot of the timeline section of the Temporal Web UI, with a signal portion expanded so the data can be viewed"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                Other events will contain other information. Activities
                will contain information regarding the timeouts, retry
                policies, and input and results.
              </p>
              <p>
                Finally, you have the list version of the{" "}
                <strong>Event History</strong>. Everything that is
                recorded above is derived from this history. You can click
                into each individual event and see all the information
                about a single event. Certain events, such as Activities,
                that typically come in a group, will be automatically
                paired for concise viewing as shown below.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/expanded-activity.png`}
                  alt="Screenshot of the Event History list section in the Temporal Web UI with an Activity expanded so the results can be seen"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                You can also use this UI live. During a running Workflow
                Execution, you can watch live updates as you interact
                with your chatbot, and see the events come in to the
                timeline and list views. If you'd like, run another
                session of your chatbot and have the web UI open in a
                separate browser tab on another window so you can witness
                this.
              </p>
              <p>Next, you'll explore a few testing scenarios for demonstrating how Temporal adds durability to your agent.</p>
            </section>

            <section className={styles.section} id="durability">
              <h2 className={styles.sectionTitle}>(Optional) Witnessing the Durability of the Agent</h2>
              <p>
                Building your agent with Temporal adds durability to your
                agent. This means that your agent can withstand failures
                that traditional applications wouldn't be able to, such as
                internet outages or process crashes. Perform the following
                scenarios to witness the durability Temporal provides.
              </p>
              <p>
                The following scenario is a simulation of one engineer's{" "}
                <em>very</em> bad day at work. Follow along and see how
                Temporal mitigated potentially outage level issues.
              </p>

              <h3>Part 1: Terminating the Worker</h3>
              <p>
                <em>Scenario</em>: Your agent is deployed to production.
                You have a chat session running, and a Worker is
                processing your Workflow. Suddenly, the virtual machine
                hosting your Worker is rebooted for updates. The Worker
                is forcefully terminated and progress appears lost. What
                happens?
              </p>
              <p><em>Simulating this scenario</em>:</p>
              <ol>
                <li>Ensure your Temporal development server, Worker (be sure you only have one running), API, and web UI are running.</li>
                <li>Start a new chat session.</li>
                <li>Before typing anything in the chat, kill the Worker using <code>CTRL-C</code>.</li>
                <li>Type a city and month in the chat, and press <strong>Send</strong>.</li>
                <li>You will see the UI stall, and not make progress. You may also see an error message appear at the top saying <strong>Error fetching history</strong>.</li>
                <li>Return to the Worker terminal and restart the Worker.</li>
                <li>Return to the web UI and watch for progress. Eventually the message should send and the agent Workflow progresses like nothing happened.</li>
                <li>If you are prompted to confirm the tool execution, do so. Then leave the UI up for the next scenario.</li>
              </ol>
              <p>
                <em>What happened?</em>: When the Worker came back online,
                it registered with the Task Queue and began listening for
                tasks it could execute. When the original Worker timed
                out, not returning a response for the task it was supposed
                to execute, the new Worker accepted it. The new Worker
                then rebuilt the state of the original Workflow
                Execution, up to the point of failure, and continued
                execution as if nothing happened. This new Worker could
                have been on another virtual machine within the Worker
                fleet, or the original Worker when the virtual machine
                finished its upgrade. This ensured that the state was not
                lost and the Workflow continued to progress.
              </p>

              <h3>Part 2: Turning off the Internet</h3>
              <p>
                <em>Scenario</em>: After the upgrade finished, somewhere,
                miles away, Danny the data center intern trips over an
                improperly managed power cable and the network switch to
                the rack where your Worker is hosted goes down. While he
                scrambles to plug it back in, your Worker is
                intermittently without network access. What happens?
              </p>
              <p><em>Simulating this scenario</em>:</p>
              <ol>
                <li>Either continue from the previous session, or start with a new chat window and don't send a message yet.</li>
                <li>Turn off your Wifi/Unplug your network adapter to simulate this failure.</li>
                <li>Respond to the prompt the agent posed to you. The agent will validate this using the LLM, which it won't be able to access.</li>
                <li>Go to your Temporal Web UI at <code>localhost:8233</code> and find the failing Activity. You will see it attempting to retry the call to the LLM.</li>
                <li>Turn the internet back on.</li>
                <li>Eventually, the LLM call will succeed, with no intervention from the developer.</li>
                <li>If you are prompted to confirm the tool execution, do so. Then leave the UI up for the next scenario.</li>
              </ol>
              <p>
                <em>What happened?</em>: Temporal Activities are retried
                automatically upon failure. Intermittent failures such
                as network outages are often fixed via retries. Each
                Activity has a default Retry Policy that retries, then
                backs off increasingly to a maximum duration. Once the
                network comes back online, at the next retry interval
                the LLM call will execute and succeed.
              </p>

              <h3>Part 3: Swapping out LLMs</h3>
              <p>
                <em>Scenario</em>: Now that the switch is back online,
                the developer can breathe a sigh of relief. Unfortunately
                they get paged that their OpenAI credits are depleted,
                there are angry customers trying to use the chatbot, and
                the only person with a corporate card to replenish the
                credits is on PTO. You have an Anthropic account with
                some Claude credits you can swap in quickly.
              </p>

              <Admonition type="note">
                <p>This scenario requires an Anthropic account with a Claude API token.</p>
              </Admonition>

              <p><em>Simulating this scenario</em>:</p>
              <ol>
                <li>Either continue from the previous session, or start with a new chat window. Send a few chats to make progress in the Workflow, but do not complete it.</li>
                <li>
                  Open the <code>.env</code> file and modify the following variables:
                  <ul>
                    <li><code>LLM_MODEL</code>: <code>anthropic/claude-sonnet-4-20250514</code></li>
                    <li><code>LLM_KEY</code>: Your LLM Key</li>
                  </ul>
                </li>
                <li>Restart the Worker.</li>
                <li>Respond to the next prompt in the chat.</li>
                <li>The agent will respond as if nothing happened, continuing the conversation.</li>
              </ol>
              <p>
                <em>What happened?</em>: Since the agent is durable and
                preserves state, the conversation history was preserved
                when the Worker was terminated. The state of the Workflow
                was reconstructed to the point where the Worker was
                terminated, and the conversation history was sent to
                Claude as context when executing the next prompt. The
                agent continues executing as if nothing happened.
              </p>
              <p>These are just some of the failure scenarios the agent can survive.</p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                In this tutorial, you built a durable AI agent that
                handles multi-turn conversations, executes tools to
                achieve a goal, and recovers from failures. You
                implemented the agent using Temporal primitives,
                including Workflows, Activities, Signals, Queries,
                Workers, and Task Queues. You created a REST API to
                enable client integration with your agent. You tested
                your agent with a chatbot interface, and witnessed the
                agent survive various failure scenarios.
              </p>

              <h3>Key architectural patterns</h3>
              <p>Your implementation demonstrates several important patterns for building AI agent systems:</p>
              <p>
                <strong>Durability through orchestration</strong>:
                Temporal Workflows provide automatic state persistence,
                ensuring conversations survive process crashes, network
                failures, and infrastructure issues. This durability is
                essential for AI agents that manage long-running,
                stateful interactions.
              </p>
              <p>
                <strong>Separation of concerns</strong>: The architecture
                cleanly separates orchestration logic (Workflows),
                external interactions (Activities), tool implementations
                (Python functions), and user interface (API), making the
                system maintainable and extensible.
              </p>
              <p>
                <strong>Observability by design</strong>: Every
                execution step is recorded in the Event History,
                providing visibility into the agent's execution without
                the need for extra tools.
              </p>
              <p>
                <strong>Extensibility</strong>: The tool and goal
                registry pattern enables adding defining new tools and
                goals without modifying the core Workflow logic.
              </p>

              <h3>Resources for continued learning</h3>
              <p>To continue your learning on Temporal and its use for AI, check out the following resources:</p>
              <ul>
                <li>
                  Download and run a more feature-rich{" "}
                  <a
                    href="https://github.com/temporal-community/temporal-ai-agent/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    version of this agent
                  </a>
                  , which is what inspired this tutorial.
                </li>
                <li>
                  Learn more about{" "}
                  <a
                    href="https://temporal.io/solutions/ai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal AI Use Cases
                  </a>
                  .
                </li>
                <li>
                  Explore the{" "}
                  <a
                    href="https://docs.temporal.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal documentation
                  </a>{" "}
                  for more Temporal features and best practices.
                </li>
                <li>
                  Take a{" "}
                  <Link to="/courses/">Temporal Course</Link> and dive
                  deeper into Temporal topics.
                </li>
                <li>
                  Ask a question in the{" "}
                  <a
                    href="https://temporal.io/slack"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal community
                  </a>{" "}
                  in the #topic-ai channel.
                </li>
              </ul>

              <h3>Final thoughts</h3>
              <p>
                The foundation you built in this tutorial enables you to
                build agents to solve nearly any goal. If you're up to
                it, try writing your own goal and tools and have the
                agent execute them. Temporal's Durable Execution brings
                reliability and observability to long-running,
                distributed systems, which is exactly what AI agents are.
              </p>
              <p>
                Check back later for the next installment in this
                tutorial series, where you will continue to add
                functionality to your agent.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/durable-ai-agent/workflow/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 3
                </span>
                <span className={styles.chapterNavTitle}>
                  Build the agent Workflow and Worker
                </span>
              </Link>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: "3rem" }}>What's next?</h2>
            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>More tutorials</span>
                <span className={styles.chapterNavTitle}>
                  Explore more AI tutorials
                </span>
              </Link>
              <Link
                to="/tutorials/ai/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>Learning path</span>
                <span className={styles.chapterNavTitle}>
                  Follow the AI learning path
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
