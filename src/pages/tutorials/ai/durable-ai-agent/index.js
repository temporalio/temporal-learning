// Tutorial chapter 1 of 4: Build the agent toolkit.
// Canonical code lives at https://github.com/temporal-community/tutorial-temporal-ai-agent.
// Update the *_PY constants here when the upstream repo changes.

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "dev-environment", label: "Setting up your development environment" },
  { id: "toolkit", label: "Constructing the agent toolkit" },
  { id: "exposing-tools", label: "Exposing the tools to the agent" },
];

const PROJECT_TREE_INIT = `temporal-ai-agent/
├── .gitignore
├── .python-version
├── main.py
├── README.md
├── pyproject.toml
└── uv.lock`;

const PYPROJECT_ADDITION = `[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

# Tell hatchling what to include
[tool.hatch.build.targets.wheel]
packages = ["activities", "api", "models", "prompts", "shared", "tools", "workflows"]`;

const PYPROJECT_FULL = `[project]
name = "temporal-ai-agent"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.9"
dependencies = [
    "python-dotenv>=1.0.0",
    "fastapi>=0.115.12",
    "jinja2>=3.1.6",
    "litellm>=1.72.2",
    "stripe>=12.2.0",
    "temporalio>=1.12.0",
    "uvicorn>=0.34.3",
    "requests>=2.32.4",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

# Tell hatchling what to include
[tool.hatch.build.targets.wheel]
packages = ["activities", "api", "models", "prompts", "shared", "tools", "workflows"]`;

const ENV_FILE = `# LLM Configuration
LLM_MODEL=openai/gpt-4o
LLM_KEY=YOUR_OPEN_AI_KEY

# Set if the user should click a Confirm button in the UI to allow the tool
# to execute
SHOW_CONFIRM=True

# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=agent-task-queue

# (Optional) - Uncomment both lines and set RAPIDAPI_KEY if you plan on
# using the real flights API
# RAPIDAPI_KEY=YOUR_RAPID_API_KEY
# RAPIDAPI_HOST_FLIGHTS=sky-scrapper.p.rapidapi.com

# (Optional) - Uncomment and set STRIPE_API_KEY if you plan on using the Stripe
# API to generate a fake invoice
# STRIPE_API_KEY=YOUR_STRIPE_API_KEY

# Uncomment if connecting to Temporal Cloud using mTLS (not needed for local dev server)
# TEMPORAL_TLS_CERT='path/to/cert.pem'
# TEMPORAL_TLS_KEY='path/to/key.pem'

# Uncomment if connecting to Temporal Cloud using API key (not needed for local dev server)
# TEMPORAL_API_KEY=abcdef1234567890`;

const FIND_EVENTS_SAMPLE_JSON = `{
  "New York": [
    {
      "eventName": "Winter Jazzfest",
      "dateFrom": "2025-01-10",
      "dateTo": "2025-01-19",
      "description": "A multi-venue jazz festival featuring emerging and established artists performing across Greenwich Village venues."
    },`;

const FIND_EVENTS_TEST_PY = `import json

from tools.find_events import find_events

if __name__ == "__main__":
    search_args = {"city": "Austin", "month": "December"}
    results = find_events(search_args)
    print(json.dumps(results, indent=2))`;

const FIND_EVENTS_OUTPUT = `{
  "note": "Returning events from December plus one month either side (i.e., November, December, January).",
  "events": [
    {
      "city": "Austin",
      "eventName": "Austin Celtic Festival",
      "dateFrom": "2025-11-08",
      "dateTo": "2025-11-09",
      "description": "Celebration of Celtic culture featuring traditional music, dance, crafts, and Irish food.",
      "month": "previous month"
    },
    {
      "city": "Austin",
      "eventName": "Trail of Lights",
      "dateFrom": "2025-12-05",
      "dateTo": "2025-12-23",
      "description": "Holiday light display in Zilker Park featuring festive decorations, food vendors, and family activities.",
      "month": "requested month"
    }
  ]
}`;

const SEARCH_FLIGHTS_TEST_PY = `import json

from tools.search_flights import search_flights

if __name__ == "__main__":

    flights = search_flights(
        {
            "origin": "ORD",
            "destination": "DFW",
            "dateDepart": "2025-09-20",
            "dateReturn": "2025-09-22",
        }
    )
    print(json.dumps(flights, indent=2))`;

const SEARCH_FLIGHTS_MOCK_OUTPUT = `{
  "currency": "USD",
  "destination": "DFW",
  "origin": "ORD",
  "results": [
    {
      "operating_carrier": "Southwest Airlines",
      "outbound_flight_code": "WN427",
      "price": 462.43,
      "return_flight_code": "WN744",
      "return_operating_carrier": "Southwest Airlines"
    }
  ]
}`;

const RAPIDAPI_ENV = `RAPIDAPI_KEY=YOUR_RAPID_API_KEY
RAPIDAPI_HOST_FLIGHTS=sky-scrapper.p.rapidapi.com`;

const SEARCH_FLIGHTS_LIVE_OUTPUT = `Searching for: ORD
Searching for: DFW
{
  "origin": "ORD",
  "destination": "DFW",
  "currency": "USD",
  "results": [
    {
      "outbound_flight_code": "NK824",
      "operating_carrier": "Spirit Airlines",
      "return_flight_code": "NK828",
      "return_operating_carrier": "Spirit Airlines",
      "price": 119.98
    },
  ]
}`;

const CREATE_INVOICE_TEST_PY = `from tools.create_invoice import create_invoice

if __name__ == "__main__":

    args_create = {
        "email": "ziggy.tardigrade@example.com",
        "amount": 150.00,
        "description": "Flight to Replay",
        "days_until_due": 7,
    }
    invoice_details = create_invoice(args_create)
    print(invoice_details)`;

const CREATE_INVOICE_MOCK_OUTPUT = `[CreateInvoice] Creating invoice with: {'email': 'ziggy.tardigrade@example.com', 'amount': 150.0, 'description': 'Flight to Replay', 'days_until_due': 7}
{'invoiceStatus': 'generated', 'invoiceURL': 'https://pay.example.com/invoice/12345', 'reference': 'INV-12345'}`;

const STRIPE_ENV = `STRIPE_API_KEY=YOUR_STRIPE_API_KEY`;

const CREATE_INVOICE_STRIPE_OUTPUT = `{'invoiceStatus': 'open', 'invoiceURL': 'https://invoice.stripe.com/i/acct_1RMFbIQej3CO0i8K/test_YWNjdF8xUk1GYklRZWozQ08wThLLF9TVJpYWZ2WXREVXZrcDJqMGhIM0hSdkVEa2hVYmM0LDE0MTI2NjEwNg0200VaZpBdSc?s=ap', 'reference': 'FEUS4MXS-0001'}`;

const TOOLKIT_TREE = `temporal-ai-agent/
├── .env
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
├── uv.lock
├── scripts/
│   ├── create_invoice_test.py
│   ├── find_events_test.py
│   └── search_flights_test.py
└── tools/
    ├── __init__.py
    ├── create_invoice.py
    ├── find_events.py
    ├── search_flights.py
    └── data/
        └── find_events_data.json`;

const MODELS_IMPORTS_PY = `from dataclasses import dataclass
from typing import List`;

const TOOL_ARGUMENT_PY = `@dataclass
class ToolArgument:
    name: str
    type: str
    description: str`;

const TOOL_DEFINITION_PY = `@dataclass
class ToolDefinition:
    name: str
    description: str
    arguments: List[ToolArgument]`;

const REGISTRY_IMPORT_PY = `from models.core import ToolArgument, ToolDefinition`;

const FIND_EVENTS_TOOL_HEAD_PY = `find_events_tool = ToolDefinition(
    name="FindEvents",
    description="Find upcoming events to travel to a given city (e.g., 'New York City') and a date or month. "
    "It knows about events in North America only (e.g. major North American cities). "
    "It will search 1 month either side of the month provided. "
    "Returns a list of events. ",
    # arguments to be inserted here in the next step
)`;

const FIND_EVENTS_TOOL_ARGS_PY = `    arguments=[
        ToolArgument(
            name="city",
            type="string",
            description="Which city to search for events",
        ),
        ToolArgument(
            name="month",
            type="string",
            description="The month to search for events (will search 1 month either side of the month provided)",
        ),
    ]`;

const FIND_EVENTS_TOOL_FULL_PY = `find_events_tool = ToolDefinition(
    name="FindEvents",
    description="Find upcoming events to travel to a given city (e.g., 'New York City') and a date or month. "
    "It knows about events in North America only (e.g. major North American cities). "
    "It will search 1 month either side of the month provided. "
    "Returns a list of events. ",
    arguments=[
        ToolArgument(
            name="city",
            type="string",
            description="Which city to search for events",
        ),
        ToolArgument(
            name="month",
            type="string",
            description="The month to search for events (will search 1 month either side of the month provided)",
        ),
    ],
)`;

const SEARCH_FLIGHTS_TOOL_PY = `search_flights_tool = ToolDefinition(
    name="SearchFlights",
    description="Search for return flights from an origin to a destination within a date range (dateDepart, dateReturn). "
    "You are allowed to suggest dates from the conversation history, but ALWAYS ask the user if ok.",
    arguments=[
        ToolArgument(
            name="origin",
            type="string",
            description="Airport or city (infer airport code from city and store)",
        ),
        ToolArgument(
            name="destination",
            type="string",
            description="Airport or city code for arrival (infer airport code from city and store)",
        ),
        ToolArgument(
            name="dateDepart",
            type="ISO8601",
            description="Start of date range in human readable format, when you want to depart",
        ),
        ToolArgument(
            name="dateReturn",
            type="ISO8601",
            description="End of date range in human readable format, when you want to return",
        ),
        ToolArgument(
            name="userConfirmation",
            type="string",
            description="Indication of the user's desire to search flights, and to confirm the details "
            + "before moving on to the next step",
        ),
    ],
)`;

const CREATE_INVOICE_TOOL_PY = `create_invoice_tool = ToolDefinition(
    name="CreateInvoice",
    description="Generate an invoice for the items described for the total inferred by the conversation history so far. Returns URL to invoice.",
    arguments=[
        ToolArgument(
            name="amount",
            type="float",
            description="The total cost to be invoiced. Infer this from the conversation history.",
        ),
        ToolArgument(
            name="tripDetails",
            type="string",
            description="A description of the item details to be invoiced, inferred from the conversation history.",
        ),
        ToolArgument(
            name="userConfirmation",
            type="string",
            description="Indication of user's desire to create an invoice",
        ),
    ],
)`;

const HANDLER_IMPORTS_PY = `from typing import Any, Callable, Dict

from tools.create_invoice import create_invoice
from tools.find_events import find_events
from tools.search_flights import search_flights`;

const TOOL_HANDLERS_PY = `# Dictionary mapping tool names to their handler functions
TOOL_HANDLERS: Dict[str, Callable[..., Any]] = {
    "SearchFlights": search_flights,
    "CreateInvoice": create_invoice,
    "FindEvents": find_events,
}`;

const GET_HANDLER_PY = `def get_handler(tool_name: str) -> Callable[..., Any]:
    """Get the handler function for a given tool name.

    Args:
        tool_name: The name of the tool to get the handler for.

    Returns:
        The handler function for the specified tool.

    Raises:
        ValueError: If the tool name is not found in the registry.
    """
    if tool_name not in TOOL_HANDLERS:
        raise ValueError(f"Unknown tool: {tool_name}")

    return TOOL_HANDLERS[tool_name]`;

const TOOL_REGISTRY_FULL_PY = `from typing import Any, Callable, Dict

from models.core import ToolArgument, ToolDefinition
from tools.create_invoice import create_invoice
from tools.find_events import find_events
from tools.search_flights import search_flights

find_events_tool = ToolDefinition(
    name="FindEvents",
    description="Find upcoming events to travel to a given city (e.g., 'New York City') and a date or month. "
    "It knows about events in North America only (e.g. major North American cities). "
    "It will search 1 month either side of the month provided. "
    "Returns a list of events. ",
    arguments=[
        ToolArgument(
            name="city",
            type="string",
            description="Which city to search for events",
        ),
        ToolArgument(
            name="month",
            type="string",
            description="The month to search for events (will search 1 month either side of the month provided)",
        ),
    ],
)


search_flights_tool = ToolDefinition(
    name="SearchFlights",
    description="Search for return flights from an origin to a destination within a date range (dateDepart, dateReturn). "
    "You are allowed to suggest dates from the conversation history, but ALWAYS ask the user if ok.",
    arguments=[
        ToolArgument(
            name="origin",
            type="string",
            description="Airport or city (infer airport code from city and store)",
        ),
        ToolArgument(
            name="destination",
            type="string",
            description="Airport or city code for arrival (infer airport code from city and store)",
        ),
        ToolArgument(
            name="dateDepart",
            type="ISO8601",
            description="Start of date range in human readable format, when you want to depart",
        ),
        ToolArgument(
            name="dateReturn",
            type="ISO8601",
            description="End of date range in human readable format, when you want to return",
        ),
        ToolArgument(
            name="userConfirmation",
            type="string",
            description="Indication of the user's desire to search flights, and to confirm the details "
            + "before moving on to the next step",
        ),
    ],
)

create_invoice_tool = ToolDefinition(
    name="CreateInvoice",
    description="Generate an invoice for the items described for the total inferred by the conversation history so far. Returns URL to invoice.",
    arguments=[
        ToolArgument(
            name="amount",
            type="float",
            description="The total cost to be invoiced. Infer this from the conversation history.",
        ),
        ToolArgument(
            name="tripDetails",
            type="string",
            description="A description of the item details to be invoiced, inferred from the conversation history.",
        ),
        ToolArgument(
            name="userConfirmation",
            type="string",
            description="Indication of user's desire to create an invoice",
        ),
    ],
)


# Dictionary mapping tool names to their handler functions
TOOL_HANDLERS: Dict[str, Callable[..., Any]] = {
    "SearchFlights": search_flights,
    "CreateInvoice": create_invoice,
    "FindEvents": find_events,
}


def get_handler(tool_name: str) -> Callable[..., Any]:
    """Get the handler function for a given tool name.

    Args:
        tool_name: The name of the tool to get the handler for.

    Returns:
        The handler function for the specified tool.

    Raises:
        ValueError: If the tool name is not found in the registry.
    """
    if tool_name not in TOOL_HANDLERS:
        raise ValueError(f"Unknown tool: {tool_name}")

    return TOOL_HANDLERS[tool_name]`;

const REGISTRY_TREE = `temporal-ai-agent/
├── .env
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
├── uv.lock
├── models/
│   ├── __init__.py
│   └── core.py
├── scripts/
│   ├── create_invoice_test.py
│   ├── find_events_test.py
│   └── search_flights_test.py
└── tools/
    ├── __init__.py
    ├── create_invoice.py
    ├── find_events.py
    ├── search_flights.py
    ├── tool_registry.py
    └── data/
        └── find_events_data.json`;

export default function Chapter1Page() {
  return (
    <Layout
      title="How to Build a Durable AI Agent with Temporal and Python"
      description="Chapter 1: Set up your Python environment and build the agent toolkit."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI", href: "/tutorials/ai" },
                  { label: "Durable AI Agent", href: "/tutorials/ai/durable-ai-agent/" },
                  { label: "Build the toolkit" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a durable AI agent: set up the toolkit
            </h1>

            <p className={styles.intro}>
              An AI agent uses large language models (LLMs) to plan and execute
              steps towards a goal. While attempting to reach its goal, the
              agent can perform actions such as searching for information,
              interacting with external services, and even calling other agents.
              However, building reliable AI agents presents various challenges.
              Network failures, long-running workflows, observability
              challenges, and more make building AI agents a textbook
              distributed systems problem.
            </p>

            <p>
              Temporal orchestrates long-running workflows, automatically
              handles failure cases from network outages to server crashes,
              provides insights into your running applications, and more. These
              features provide the resiliency and durability necessary to build
              reliable agents that users can rely on.
            </p>

            <p>
              In this tutorial you'll build an AI agent using Temporal that
              searches for events in a given city, helps you book a plane
              ticket, and creates an invoice for the trip. The user will
              interact with this application through a chatbot interface,
              communicating with the agent using natural language. Throughout
              this tutorial you will implement the following components:
            </p>

            <ul>
              <li>Various <strong>tools</strong> the agent will use to search for events, find flights, and generate invoices.</li>
              <li>An <strong>agent goal</strong> that will specify what overall task the agent is trying to achieve and what tools it is allowed to use.</li>
              <li><strong>Temporal Workflows</strong> that will orchestrate multi-turn conversations and ensure durability across failures.</li>
              <li><strong>Temporal Activities</strong> that execute tools and language model calls with automatic retry logic.</li>
              <li>A <strong>FastAPI backend</strong> that connects the web interface to your Temporal Workflows.</li>
              <li>A <strong>web-based chat interface</strong> that allows users to interact with the agent.</li>
            </ul>

            <p>
              By the end of this tutorial, you will have a modular, durable AI
              agent that you can extend to run any goal using any set of tools.
              Your agent will be able to recover from failure, whether it's a
              hardware failure, a tool failure, or an LLM failure. And you'll
              be able to use Temporal to build reliable AI applications that
              maintain state and provide consistent user experiences.
            </p>

            <p>
              You can find the code for this tutorial on GitHub in the{" "}
              <a
                href="https://github.com/temporal-community/tutorial-temporal-ai-agent"
                target="_blank"
                rel="noopener noreferrer"
              >
                tutorial-temporal-ai-agent
              </a>{" "}
              repository.
            </p>

            <MetaChips items={["~30 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>
                Before starting this tutorial, ensure that you have the
                following on your local machine.
              </p>

              <h3>Required</h3>
              <ul>
                <li>
                  <Link to="/getting_started/python/dev_environment/">
                    The Temporal CLI development service
                  </Link>{" "}
                  installed and verified.
                </li>
                <li>
                  <a
                    href="https://www.python.org/downloads/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Python 3.9 or higher
                  </a>{" "}
                  installed. Verify your installation by running{" "}
                  <code>python3 --version</code> in your terminal.
                </li>
                <li>
                  The{" "}
                  <a
                    href="https://docs.astral.sh/uv/getting-started/installation/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>uv</code> package and project manager
                  </a>{" "}
                  installed. <code>uv</code> is a modern, fast Python package
                  manager that will handle virtual environments and
                  dependencies.
                </li>
                <li>
                  The command line tool{" "}
                  <a
                    href="https://curl.se/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    curl
                  </a>{" "}
                  installed for downloading certain files.
                </li>
                <li>
                  <a
                    href="https://nodejs.org/en/download"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Node.js 18 or higher
                  </a>{" "}
                  installed. You can verify your installation with{" "}
                  <code>node --version</code> and <code>npm --version</code>.
                </li>
                <li>
                  An{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenAI API key
                  </a>{" "}
                  saved securely where you can access it. You may need to
                  create an{" "}
                  <a
                    href="https://platform.openai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenAI
                  </a>{" "}
                  account first. You will use this key to configure the LLM
                  integration.
                </li>
              </ul>

              <Admonition type="note">
                <p>
                  OpenAI API Keys require purchasing credits to use. You can
                  succeed with this tutorial with minimal credits; in our
                  experience, less than $1 will suffice.
                </p>
              </Admonition>

              <h3>Optional</h3>
              <p>
                You can opt to use real API services for your tools, or use
                provided mock functions.
              </p>
              <ul>
                <li>
                  A free{" "}
                  <a
                    href="https://rapidapi.com/apiheya/api/sky-scrapper"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    RapidAPI Sky Scrapper API Key
                  </a>{" "}
                  saved securely where you can access it. You will use this to
                  search for flights.
                </li>
                <li>
                  A free{" "}
                  <a
                    href="https://stripe.com/lp/start-now"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Stripe Account
                  </a>{" "}
                  with a configured{" "}
                  <a
                    href="https://docs.stripe.com/sandboxes"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    sandbox
                  </a>
                  . You will use this to generate fake invoices for the flights
                  that are being booked.
                </li>
              </ul>

              <h3>Concepts</h3>
              <p>
                Additionally, this tutorial assumes you have basic familiarity
                with:
              </p>
              <h4>Programming Concepts</h4>
              <ul>
                <li>
                  Temporal fundamentals such as{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/core-application#develop-workflows"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflows
                  </a>
                  ,{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/core-application#develop-activities"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activities
                  </a>
                  ,{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/core-application#run-a-dev-worker"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workers
                  </a>
                  ,{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/message-passing#signals"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Signals
                  </a>
                  , and{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/message-passing#queries"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Queries
                  </a>
                  .
                </li>
                <li>
                  Python fundamentals such as functions, classes,{" "}
                  <a
                    href="https://docs.python.org/3/library/asyncio.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    async/await syntax
                  </a>
                  , and virtual environments.
                </li>
                <li>
                  Command line interface and running commands in a terminal or
                  command prompt.
                </li>
                <li>REST API concepts including HTTP requests and JSON responses.</li>
                <li>How to set and use environment variables in your operating system.</li>
              </ul>
              <h4>AI Concepts</h4>
              <ul>
                <li>
                  <a
                    href="https://temporal.io/blog/a-mental-model-for-agentic-ai-applications"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    A Mental Model for Agentic AI Applications
                  </a>
                </li>
                <li>
                  <a
                    href="https://temporal.io/blog/building-an-agentic-system-thats-actually-production-ready"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Building an agentic system that's actually production ready
                  </a>
                </li>
                <li>
                  <a
                    href="https://temporal.io/blog/from-ai-hype-to-durable-reality-why-agentic-flows-need-distributed-systems"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Why Agentic Flows Need Distributed Systems
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="dev-environment">
              <h2 className={styles.sectionTitle}>
                Setting up your development environment
              </h2>
              <p>
                Before you start coding, you need to set up your Python
                developer environment. In this step, you will set up your
                project structure, install the necessary Python packages, and
                configure the Python environment needed to build your AI agent.
              </p>

              <p>
                First, create your project using <code>uv</code>:
              </p>
              <CodeBlock language="bash">
                {`uv init temporal-ai-agent --python ">=3.9"`}
              </CodeBlock>
              <p>
                <code>uv</code> is a modern Python project and packaging tool
                that sets up a project structure for you. Running this command
                creates the following default Python package structure for you:
              </p>
              <CodeBlock>{PROJECT_TREE_INIT}</CodeBlock>
              <p>
                It automatically runs a <code>git init</code> command for you,
                provides you with the default <code>.gitignore</code> for
                Python, creates a <code>.python-version</code> file that has
                the project's default Python version, a README.md, a Hello
                World <code>main.py</code> program, and a{" "}
                <code>pyproject.toml</code> file for managing the project's
                packages and environment.
              </p>

              <p>Next, change directories into your newly created project:</p>
              <CodeBlock language="bash">cd temporal-ai-agent</CodeBlock>

              <p>
                You won't need the <code>main.py</code> file, so delete it:
              </p>
              <CodeBlock language="bash">rm main.py</CodeBlock>

              <p>
                Next, create your virtual environment by running the following
                command:
              </p>
              <CodeBlock language="bash">uv venv</CodeBlock>
              <p>
                This creates a virtual environment named <code>.venv</code> in
                the current working directory.
              </p>

              <p>
                Now that you have a virtual environment created, add the
                dependencies needed to build your AI agent system:
              </p>
              <CodeBlock language="bash">
                uv add python-dotenv fastapi jinja2 litellm stripe temporalio uvicorn requests
              </CodeBlock>
              <p>This installs all the necessary packages:</p>
              <ul>
                <li><code>python-dotenv</code> - For loading environment variables from a <code>.env</code> file</li>
                <li><code>fastapi</code> and <code>uvicorn</code> - Web framework and server for the API backend</li>
                <li><code>jinja2</code> - Template engine</li>
                <li><code>litellm</code> - Unified interface for different language model providers</li>
                <li><code>stripe</code> - Payment processing library for the invoice generation demo</li>
                <li><code>temporalio</code> - The Temporal Python SDK</li>
                <li><code>requests</code> - HTTP library for API calls</li>
              </ul>

              <p>
                Finally, add the following lines to the end of your{" "}
                <code>pyproject.toml</code> file:
              </p>
              <CodeBlock language="ini" title="pyproject.toml">
                {PYPROJECT_ADDITION}
              </CodeBlock>
              <p>
                This configures <code>uv</code> as to which packages to include
                and enable for execution. You will create these packages later
                in the tutorial.
              </p>

              <details>
                <summary>
                  The <code>pyproject.toml</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="ini" title="pyproject.toml">
                  {PYPROJECT_FULL}
                </CodeBlock>
              </details>

              <p>
                Next, create a <code>.env</code> file to store your
                configuration:
              </p>
              <CodeBlock language="bash">touch .env</CodeBlock>

              <p>
                Next, copy the following configuration to your{" "}
                <code>.env</code> file.
              </p>
              <CodeBlock language="ini" title=".env">
                {ENV_FILE}
              </CodeBlock>

              <p>
                Once copied, replace <code>YOUR_OPEN_API_KEY</code> with your
                OpenAI API key. Setting <code>SHOW_CONFIRM=True</code> requires
                the user to confirm each tool prior to it being executed. This
                will allow you to see what the agent is doing step by step.
                These are the only two mandatory variables to set. This
                tutorial provides both an ability to create pseudo tools that
                perform simulations, or tools that use external APIs to achieve
                their goals. If you plan on using the RapidAPI SkyScraper API
                to look up flight data or the Stripe API to generate an
                invoice, you can uncomment these lines and provide the API
                keys here.
              </p>
              <p>
                Additionally, if you plan on connecting to Temporal Cloud, you
                will need to update the <code>TEMPORAL_ADDRESS</code> and{" "}
                <code>TEMPORAL_NAMESPACE</code> parameters to connect to your
                Temporal Cloud instance. You will also need to uncomment and
                set the <code>TEMPORAL_TLS</code> or{" "}
                <code>TEMPORAL_API_KEY</code> variables, depending on which
                authentication method you are using.
              </p>

              <Admonition type="note">
                <p>
                  As this project is using{" "}
                  <a
                    href="https://pypi.org/project/litellm/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LiteLLM
                  </a>
                  , it supports various different LLM providers. This tutorial
                  will use OpenAI's gpt-4o, but you are welcome to use
                  whichever LLM you wish, so long as it is supported by
                  LiteLLM.
                </p>
              </Admonition>

              <p>
                At this point, you have configured your developer environment
                to include a Python project managed by <code>uv</code> with
                all required dependencies to build a Temporal powered agentic
                AI, and all necessary environment variables.
              </p>
              <p>
                Now that you have set up your developer environment, you will
                build the tools that your agent will use to perform the
                various tasks it needs to accomplish its goal.
              </p>
            </section>

            <section className={styles.section} id="toolkit">
              <h2 className={styles.sectionTitle}>
                Constructing the agent toolkit
              </h2>
              <p>
                In this step, you will acquire the tools that will be available
                to your agent. Agents are aware of the tools they have
                available to them while attempting to achieve their goal. The
                agent will evaluate which tools are available and execute a
                tool if the agent believes it will provide the result the agent
                needs to progress in its task.
              </p>
              <p>
                These tools can take various forms, but in this tutorial
                they're implemented as a series of independent Python scripts
                that provide data in a specific format that the agent can
                process. There are three tools: a <code>find_events</code>{" "}
                tool, a <code>search_flights</code> tool, and a{" "}
                <code>create_invoice</code> tool. The LLM will decide when to
                use each tool as it interacts with the user who is trying to
                find an event and book a flight to attend it. You could
                implement these tools yourself, or you could download a tool
                and provide it to an agent. For this tutorial, you will
                download the tools directly from the{" "}
                <a
                  href="https://github.com/temporal-community/tutorial-temporal-ai-agent"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  companion GitHub repository
                </a>
                .
              </p>

              <h3>Setting up the <code>tools</code> package</h3>
              <p>
                To get started, first create the directory for your tools
                modules:
              </p>
              <CodeBlock language="bash">mkdir tools</CodeBlock>
              <p>Then change directories into it:</p>
              <CodeBlock language="bash">cd tools</CodeBlock>
              <p>
                However, for this to be an importable tools package, you will
                need to add a <code>__init__.py</code> file. It can be blank
                for now, so create it with the following command:
              </p>
              <CodeBlock language="bash">touch __init__.py</CodeBlock>
              <p>
                Now that you have set up the structure for your tools package,
                you'll acquire and test the tools needed to have the agent
                succeed with its goal.
              </p>

              <h3>Acquiring the <code>find_events</code> tool</h3>
              <p>
                The <code>find_events</code> tool searches for events within a
                given city during a certain time of year. The tool takes a
                month and city as inputs and provides events for not only the
                month that was provided, but the months before and after the
                given month as well. The LLM will use this tool to search for
                events when helping the user plan their trip. This tool
                doesn't use an API, but rather simulates looking events up in
                a data store using mock data.
              </p>

              <p>
                First, create a <code>data</code> directory within the{" "}
                <code>tools</code> directory to store the sample event data and
                change directories into it:
              </p>
              <CodeBlock language="bash">{`mkdir data
cd data`}</CodeBlock>

              <p>
                Next, run the following command to download the sample data
                from the companion GitHub repository:
              </p>
              <CodeBlock language="bash">
                curl -o find_events_data.json https://raw.githubusercontent.com/temporal-community/tutorial-temporal-ai-agent/main/tools/data/find_events_data.json
              </CodeBlock>

              <p>
                You can confirm you have the correct data by running the
                following command to sample the file and comparing it to the
                output:
              </p>
              <CodeBlock language="bash">head -8 find_events_data.json</CodeBlock>
              <CodeBlock language="json">{FIND_EVENTS_SAMPLE_JSON}</CodeBlock>

              <Admonition type="note">
                <p>
                  If the dates appear to be far in the past, don't worry.
                  There is logic within the <code>find_events</code> tool that
                  automatically adjusts the date to ensure that no dates can
                  be presented that are in the past.
                </p>
              </Admonition>

              <p>
                Next, change directories back up one directory to the{" "}
                <code>tools</code> directory:
              </p>
              <CodeBlock language="bash">cd ..</CodeBlock>
              <p>
                Now that you have the data, download the{" "}
                <code>find_events</code> tool using the command:
              </p>
              <CodeBlock language="bash">
                curl -o find_events.py https://raw.githubusercontent.com/temporal-community/tutorial-temporal-ai-agent/main/tools/find_events.py
              </CodeBlock>

              <p>
                Open the file and explore the logic; you should never download
                a file from the internet and just trust it.
              </p>
              <p>Try to answer the following questions about the codebase:</p>
              <ul>
                <li>Where in the code does it determine the adjacent months?</li>
                <li>How does the tool prevent the data from <code>find_events_data.json</code> being presented with a date that has already passed?</li>
                <li>What is the schema for the data that will be returned?</li>
              </ul>

              <p>
                Once you have finished reviewing the code, navigate to the
                root directory of your project and create a scripts directory
                for testing this tool. The root of your project should be one
                level higher than your current directory, so you can get there
                by running the following command:
              </p>
              <CodeBlock language="bash">cd ..</CodeBlock>
              <p>Create the <code>scripts</code> directory:</p>
              <CodeBlock language="bash">mkdir scripts</CodeBlock>
              <p>
                Now create a test script named{" "}
                <code>find_events_test.py</code> in the <code>scripts</code>{" "}
                directory and add the following to test your script:
              </p>
              <CodeBlock language="python" title="scripts/find_events_test.py">
                {FIND_EVENTS_TEST_PY}
              </CodeBlock>
              <p>This script will check for events in Austin, TX in the month of December.</p>
              <p>
                From the root of your project, run the script using the
                following command to verify it's configured correctly:
              </p>
              <CodeBlock language="bash">uv run scripts/find_events_test.py</CodeBlock>
              <p>You should see the following output:</p>
              <CodeBlock>{FIND_EVENTS_OUTPUT}</CodeBlock>
              <p>
                Now that you have the <code>find_events</code> tool
                functioning, it's time to do the same for the{" "}
                <code>search_flights</code> tool.
              </p>

              <h3>Acquiring the <code>search_flights</code> tool</h3>
              <p>
                The <code>search_flights</code> tool searches roundtrip
                flights to a destination. The tool takes the origin,
                destination, arrival date, and departure date as arguments and
                returns flight data containing details such as carrier, price,
                and flight code for the flights. The LLM will use this tool to
                find flights to the location once the user has selected the
                dates they wish to travel. This tool can either use the
                RapidAPI SkyScraper API if you have an API key configured in
                your <code>.env</code> file, or it will generate mock data if
                it's unable to detect the API key.
              </p>

              <p>First, change directories into the <code>tools</code> directory:</p>
              <CodeBlock language="bash">cd tools</CodeBlock>
              <p>
                Then get the tool by running the following command to download
                it from the companion GitHub repository:
              </p>
              <CodeBlock language="bash">
                curl -o search_flights.py https://raw.githubusercontent.com/temporal-community/tutorial-temporal-ai-agent/main/tools/search_flights.py
              </CodeBlock>

              <p>
                Next, familiarize yourself with the tool by reviewing the
                code. Try to answer the following questions about the code:
              </p>
              <ul>
                <li>What is the purpose of the <code>search_flights</code> function? (It's not as straightforward of an answer as it may appear.)</li>
                <li>How many REST API calls does it take to complete the real flight API search?</li>
              </ul>
              <p>Once you have finished reviewing the code, you will test it.</p>

              <p>
                Create another test within the <code>scripts</code> directory
                named <code>search_flights_test.py</code> and add the
                following code:
              </p>
              <CodeBlock language="python" title="scripts/search_flights_test.py">
                {SEARCH_FLIGHTS_TEST_PY}
              </CodeBlock>
              <p>
                This test searches for a flight from Chicago to Dallas-Fort
                Worth. However, since this tool can operate in either a mock
                mode or live API mode, there are two ways to verify it.
              </p>

              <h4>Testing the mocked <code>search_flight</code> tool</h4>
              <p>
                Let's start by testing it without the RapidAPI key. If you
                have that set in your <code>.env</code> file, comment it out
                for now, or skip this step.
              </p>
              <p>
                Change directories back to the root of the project and run the
                test using the following command:
              </p>
              <CodeBlock language="bash">{`cd ..
uv run scripts/search_flights_test.py`}</CodeBlock>
              <p>
                Your output will vary, as the mock data function randomly
                generates results. The output should, however, look something
                like this with more items in the results list:
              </p>
              <CodeBlock>{SEARCH_FLIGHTS_MOCK_OUTPUT}</CodeBlock>
              <p>
                If you aren't planning on using the Sky Scrapper API, you can
                skip this next step and continue if you'd like.
              </p>

              <h4>Testing the Sky Scrapper powered <code>search_flights</code> tool</h4>
              <p>
                Testing the API-powered version of the tool is similar to
                testing the mocked version.
              </p>
              <p>
                First, if you haven't uncommented the <code>RAPID_API</code>{" "}
                lines in your <code>.env</code> file and added your API key,
                do this before running the test. You will also need to
                uncomment the <code>RAPIDAPI_HOST_FLIGHTS</code> environment
                variable as this is the endpoint the tool will be accessing.
              </p>
              <CodeBlock language="bash">{RAPIDAPI_ENV}</CodeBlock>

              <p>
                Next, review the code in{" "}
                <code>scripts/search_flights_test.py</code> and make sure
                that the <code>dateDepart</code> and <code>dateReturn</code>{" "}
                dates are both in the future. At this point you have no way
                of determining if the dates are in the past, and the API will
                return an error if you try to search for flights in the past.
              </p>
              <p>
                Once you've reviewed the code, make sure you are at the root
                directory of the project. If you are still in the{" "}
                <code>scripts</code> directory, run the following command:
              </p>
              <CodeBlock language="bash">cd ..</CodeBlock>
              <p>Then run the test using the following command:</p>
              <CodeBlock language="bash">uv run scripts/search_flights_test.py</CodeBlock>
              <p>
                If you've changed the dates or cities, you may see different
                results, but the format should be similar to this:
              </p>
              <CodeBlock>{SEARCH_FLIGHTS_LIVE_OUTPUT}</CodeBlock>

              <Admonition type="info">
                <p>
                  If the API gives you cryptic error messages such as{" "}
                  <strong>Something went wrong</strong> or returns an
                  incomplete response, you can try running it a few times and
                  see if you get a different response.
                </p>
              </Admonition>

              <p>
                Now that you have finished testing the{" "}
                <code>search_flights</code> tool, you can add the final tool
                to the agent's toolkit.
              </p>

              <h3>Acquiring the <code>create_invoice</code> tool</h3>
              <p>
                The final tool is the <code>create_invoice</code> tool. The
                tool takes the customer's email and trip information such as
                the cost of the flight, the description of the event, the
                number of days until the invoice is due, and generates a
                sample invoice for that user showing the details of the
                flight and the cost. The LLM will use this tool to invoice
                the customer once the customer has confirmed their travel
                plans. This tool can either use the Stripe API if you have an
                API key configured in your <code>.env</code> file, or it
                will generate a mock invoice if it is unable to detect an API
                key.
              </p>
              <p>
                First, change directories into the <code>tools</code>{" "}
                directory again:
              </p>
              <CodeBlock language="bash">cd tools</CodeBlock>
              <p>
                Then get the tool by running the following command to download
                it from the companion GitHub repository:
              </p>
              <CodeBlock language="bash">
                curl -o create_invoice.py https://raw.githubusercontent.com/temporal-community/tutorial-temporal-ai-agent/main/tools/create_invoice.py
              </CodeBlock>

              <p>
                Next, familiarize yourself with the tool by reviewing the
                code. Try to answer the following questions about the code:
              </p>
              <ul>
                <li>What customer related verification does the tool do before creating the invoice?</li>
                <li>What does the tool do if this verification fails?</li>
              </ul>
              <p>Once you have finished reviewing the code, test it.</p>
              <p>
                Create another test within the <code>scripts</code> directory
                named <code>create_invoice_test.py</code> and add the
                following code:
              </p>
              <CodeBlock language="python" title="scripts/create_invoice_test.py">
                {CREATE_INVOICE_TEST_PY}
              </CodeBlock>
              <p>
                However, since this tool can operate in either a mock mode or
                live API mode, there are two ways to verify it.
              </p>

              <h4>Testing the mocked <code>create_invoice</code> tool</h4>
              <p>
                Start by testing it without the Stripe key. If you have it
                set in your <code>.env</code> file, comment it out for now,
                or skip this step.
              </p>
              <p>
                Change directories back to the root project directory and run
                the test using the following command:
              </p>
              <CodeBlock language="bash">{`cd ..
uv run scripts/create_invoice_test.py`}</CodeBlock>
              <p>The output should be:</p>
              <CodeBlock>{CREATE_INVOICE_MOCK_OUTPUT}</CodeBlock>
              <p>
                If you aren't planning on using the Stripe API, you can skip
                this next step and continue if you'd like.
              </p>

              <h4>Testing the Stripe-powered <code>create_invoice</code> tool</h4>
              <p>
                Testing the Stripe powered version of the tool is nearly
                identical to testing the mocked version of the tool.
              </p>
              <p>
                First, if you haven't uncommented the{" "}
                <code>STRIPE_API_KEY</code> lines in your <code>.env</code>{" "}
                file and added your API key, do this before running the test.
              </p>
              <CodeBlock language="bash">{STRIPE_ENV}</CodeBlock>

              <Admonition type="warning">
                <p>
                  Make sure you have set up your Stripe account as a{" "}
                  <a
                    href="https://docs.stripe.com/sandboxes"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    sandbox
                  </a>{" "}
                  and are using an API key from there. If it is your first
                  time setting up a Stripe account and you haven't added any
                  billing information, this will be the default. Otherwise the
                  invoices will be real.
                </p>
              </Admonition>

              <p>
                Make sure you aren't in the <code>scripts</code> directory any
                more. If you are, run the following command to get back to
                the root directory of the project:
              </p>
              <CodeBlock language="bash">cd ..</CodeBlock>
              <p>
                Then run the test using the following command the same way
                you would the mocked version:
              </p>
              <CodeBlock language="bash">uv run scripts/create_invoice_test.py</CodeBlock>
              <p>
                The result will contain an <code>invoiceURL</code>, as well
                as the status of the invoice and a reference.
              </p>
              <CodeBlock>{CREATE_INVOICE_STRIPE_OUTPUT}</CodeBlock>
              <p>
                By following that invoice link in a browser, Stripe will
                present you with a sample invoice in your sandbox environment.
              </p>

              <details>
                <summary>
                  Before you move on, verify that you have created all the necessary files in the correct structure.
                </summary>
                <p>
                  So far you've implemented and tested the agent's tools.
                  Verify your directory structure and files look and are named
                  appropriately according to the following diagram before
                  continuing:
                </p>
                <CodeBlock>{TOOLKIT_TREE}</CodeBlock>
              </details>

              <p>
                And those are the three tools in this agent's toolkit to
                achieve its goal. Other goals may have different tools, and
                you could add more tools. Next, you'll make the tools
                available to the agent to use.
              </p>
            </section>

            <section className={styles.section} id="exposing-tools">
              <h2 className={styles.sectionTitle}>Exposing the tools to the agent</h2>
              <p>
                Now that you have the tools necessary to complete the agent's
                goal, you need to implement a way to inform the agent that
                these tools are available. To do this, you'll create a tool
                registry. The tool registry will contain a definition of each
                tool, along with information such as the tool's name,
                description, and what arguments it accepts.
              </p>
              <p>
                However, before you create the registry, you should define the
                tool definition and tool argument as models that can be shared
                across your codebase.
              </p>

              <h3>Defining the core models</h3>
              <p>
                Defining the tool arguments, tool definition, and agent goal as
                custom types allows for better reusability and type hinting.
                Temporal also recommends passing a single object between
                functions, and requires these objects to be serializable.
                Given these requirements, you'll implement the{" "}
                <code>ToolArgument</code> and <code>ToolDefinition</code>{" "}
                types as a Python <code>dataclass</code>.
              </p>
              <p>
                Before you define these models, navigate to the root directory
                of your project and create the <code>models</code> directory:
              </p>
              <CodeBlock language="bash">mkdir models</CodeBlock>
              <p>
                Since this directory will be imported throughout your project,
                it needs to be configured as a module. To do this, create a
                blank <code>__init__.py</code> file by running the following
                command:
              </p>
              <CodeBlock language="bash">touch models/__init__.py</CodeBlock>

              <p>
                Next, create the file <code>core.py</code>. This file will
                contain the tool argument and definition models used in your
                agent. Open <code>models/core.py</code> and add the following
                imports:
              </p>
              <CodeBlock language="python" title="models/core.py">
                {MODELS_IMPORTS_PY}
              </CodeBlock>

              <p>
                Next, add the <code>ToolArgument</code> <code>dataclass</code>{" "}
                to the file:
              </p>
              <CodeBlock language="python" title="models/core.py">
                {TOOL_ARGUMENT_PY}
              </CodeBlock>
              <p>
                An instance of this <code>dataclass</code> will represent an
                argument that your tool can accept, including the name of the
                argument, a description of what the argument represents, and
                the type of the argument, such as an <code>int</code> or{" "}
                <code>str</code>.
              </p>

              <p>
                Next, add the <code>ToolDefinition</code>{" "}
                <code>dataclass</code> to the file:
              </p>
              <CodeBlock language="python" title="models/core.py">
                {TOOL_DEFINITION_PY}
              </CodeBlock>
              <p>
                This will hold information about the tool that's provided to
                the agent so it can determine what action to take. It defines
                the name of the tool, a description of what it can do, and an
                argument list. This list is composed of your{" "}
                <code>ToolArgument</code> objects.
              </p>
              <p>
                Now that you have the appropriate model to define your tools,
                you can create a registry of the tools for the agent to
                access.
              </p>

              <h3>Creating the tool registry</h3>
              <p>
                Agents use LLMs to determine what action to take and then
                execute a tool from their toolkit. However, you have to make
                those tools available to the agent. Now that you have
                structure for defining your tools, you should create a
                registry that your agent reads to load the available tools.
              </p>
              <p>
                Navigate back to the <code>tools</code> directory and create
                the file <code>tools/tool_registry.py</code>. In this file you
                will define all of your tools using the models you defined in
                the previous step.
              </p>

              <p>
                First, add the following import to the file to import the
                models:
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {REGISTRY_IMPORT_PY}
              </CodeBlock>

              <p>
                Next, add the first part of the <code>ToolDefinition</code>{" "}
                for the <code>find_events</code> tool:
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {FIND_EVENTS_TOOL_HEAD_PY}
              </CodeBlock>
              <p>
                This defines your tool using the <code>ToolDefinition</code>{" "}
                model you defined, gives it a name and a description that the
                LLM can use to understand the tool and also use as a prompt.
                Next you need to add the arguments to this instantiation. The
                arguments in the <code>ToolDefinition</code> model were
                defined as a <code>List[ToolArgument]</code>, so you may have
                multiple arguments within your list.
              </p>

              <p>
                To complete the definition, add the following code to your{" "}
                <code>find_events_tool</code> instantiation to add the
                arguments:
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {FIND_EVENTS_TOOL_ARGS_PY}
              </CodeBlock>
              <p>
                The <code>find_events</code> tool requires two arguments, the
                city and month in which to search, and it also provides a
                string description so the LLM would know how to prompt the
                user if an argument is missing.
              </p>
              <p>
                Bringing it all together, the complete{" "}
                <code>ToolDefinition</code> would be:
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {FIND_EVENTS_TOOL_FULL_PY}
              </CodeBlock>

              <p>
                Now that you have the first tool defined in your registry,
                implement the remaining tool definitions.
              </p>
              <p>
                Add the following code to register the{" "}
                <code>search_flights</code> tool. The structure is similar to
                the <code>find_events</code> tool, except that{" "}
                <code>search_flights</code> requires more arguments, to
                search for the origin, destination, departure date, return
                date, and confirmation status. These arguments are a direct
                mapping of the required parameters to the RAPIDAPI REST API.
                When creating a tool that maps to an API, be sure to include
                that API's required parameters as <code>ToolArgument</code>s.
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {SEARCH_FLIGHTS_TOOL_PY}
              </CodeBlock>

              <p>
                And then add the following code to register the{" "}
                <code>create_invoice</code> tool. This tool requires three
                arguments: the amount to be paid, the details of the trip,
                and a user confirmation.
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {CREATE_INVOICE_TOOL_PY}
              </CodeBlock>

              <p>
                You now have a tool registry your agent imports to inform it
                of what tools it has available to execute. Finally, you need
                to create a mapping between the tool registered in{" "}
                <code>tool_registry.py</code> with the actual functions the
                Activity will invoke during Workflow execution.
              </p>

              <h3>Mapping the registry to the functions</h3>
              <p>
                Your agent will use the registry to identify which tool it
                should use, but it still needs to translate the string{" "}
                <code>name</code> of the tool to the function definition the
                code will execute. You will modify the code in{" "}
                <code>tool_registry</code> to add this functionality.
              </p>

              <p>
                First, add the following imports with the other imports in{" "}
                <code>tool_registry.py</code>:
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {HANDLER_IMPORTS_PY}
              </CodeBlock>
              <p>
                These handle the appropriate typings, as well as import the
                function from each of the tool files.
              </p>

              <p>
                Next, go to the bottom of the file after the previous tool
                definitions and add the code to map the string representation
                of the <code>ToolDefinition</code> to the function:
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {TOOL_HANDLERS_PY}
              </CodeBlock>

              <p>
                Finally, add a function named <code>get_handler</code> that
                returns the function given the tool name:
              </p>
              <CodeBlock language="python" title="tools/tool_registry.py">
                {GET_HANDLER_PY}
              </CodeBlock>

              <p>
                You have now successfully implemented a structured model for
                expressing tools available to your AI agent. This is necessary
                for building a robust, capable agent.
              </p>

              <details>
                <summary>
                  The <code>tools/tool_registry.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="tools/tool_registry.py">
                  {TOOL_REGISTRY_FULL_PY}
                </CodeBlock>
              </details>

              <details>
                <summary>
                  Before moving on to the next section, verify that your file and directory structure is correct.
                </summary>
                <p>
                  You just implemented a model for defining your tools in a
                  way that your agent could discover and use them. Verify that
                  your directory structure and file names are correct
                  according to the following diagram before continuing:
                </p>
                <CodeBlock>{REGISTRY_TREE}</CodeBlock>
              </details>

              <p>
                In the next step, you will use the tool definitions you just
                created to define the agent's goal.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  AI tutorials
                </span>
              </Link>
              <Link
                to="/tutorials/ai/durable-ai-agent/agent-behavior/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Define the agent's behavior
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
