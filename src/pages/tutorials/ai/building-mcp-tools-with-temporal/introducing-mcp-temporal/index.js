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
    label: "Introducing MCP and Temporal",
    href: "/tutorials/ai/building-mcp-tools-with-temporal/introducing-mcp-temporal/",
  },
  {
    n: 2,
    label: "Adding Human-in-the-Loop",
    href: "/tutorials/ai/building-mcp-tools-with-temporal/adding-hitl-to-mcp-tools/",
  },
];

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "what-youll-learn", label: "What you'll learn" },
  { id: "mcp-key-concepts", label: "MCP key concepts" },
  { id: "limitations-of-mcp-tools", label: "Limitations of MCP tools" },
  { id: "how-temporal-transforms", label: "How Temporal transforms MCP tools" },
  { id: "building-durable-tool", label: "Building a durable MCP tool" },
  { id: "whats-next", label: "What's next?" },
];

const INSTRUCTIONS_PY = `instructions = "You are a helpful weather assistant. Provide clear, concise weather information."`;

const TOOLS_PY = `tools = [
    {
        "type": "function",
        "name": "get_weather_alerts",
        "description": "Get current weather alerts for a US state",
        "parameters": {...}
    }
]`;

const FRAGILE_TOOL_PY = `from fastmcp import FastMCP
import httpx
import asyncio

mcp = FastMCP("fragile-weather")

@mcp.tool()
async def make_nws_request(city: str) -> str:
    async with httpx.AsyncClient() as client:
        # Network call can fail
        response = await client.get(f"https://api.weather.com/{city}")

    # Processing can crash
    data = response.json()

    # Long operation might timeout
    await asyncio.sleep(30)

    # No state persistence
    result = f"Weather for {city}: {data['temp']}°F"

    return result`;

const ACTIVITIES_PY = `from typing import Any
from temporalio import activity
import httpx

USER_AGENT = "weather-app/1.0"

@activity.defn
async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a request to the NWS API with proper error handling."""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/geo+json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=5.0)
        response.raise_for_status()
        return response.json()`;

const WORKFLOW_IMPORTS_PY = `from temporalio import workflow
from datetime import timedelta`;

const WORKFLOW_CONST_PY = `NWS_API_BASE = "https://api.weather.gov"`;

const WORKFLOW_IMPORT_ACTIVITY_PY = `# Import Activities and models using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from workflows.weather_activities import make_nws_request`;

const WORKFLOW_CLASS_PY = `@workflow.defn # marks the class as a Workflow
class GetForecast:
    @workflow.run # a single async method
    async def run(self, latitude: float, longitude: float) -> str:
        """Get weather forecast for a location.

        Args:
            latitude: Latitude of the location
            longitude: Longitude of the location
        """
        # Your orchestration logic will go here`;

const WORKFLOW_STEP1_PY = `@workflow.defn
class GetForecast:
    @workflow.run
    async def run(self, latitude: float, longitude: float) -> str:
        # Step 1: Get the forecast grid endpoint
        points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
        points_data = await workflow.execute_activity(
            make_nws_request,
            points_url,
            start_to_close_timeout=timedelta(seconds=40),
        )

        if not points_data:
            return "Unable to fetch forecast data for this location."`;

const WORKFLOW_SLEEP_PY = `    # Optional: Add a delay between calls
    await workflow.sleep(10)`;

const WORKFLOW_STEP2_PY = `@workflow.defn # marks the class as a Workflow
class GetForecast:
    @workflow.run # a single async method
    async def run(self, latitude: float, longitude: float) -> str:
        # Step 1: Get the forecast grid endpoint
        points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
        points_data = await workflow.execute_activity(
            make_nws_request,
            points_url,
            start_to_close_timeout=timedelta(seconds=40),
        )

        if not points_data:
            return "Unable to fetch forecast data for this location."

        # Optional: Add a delay between calls
        await workflow.sleep(10)

        # Step 2: Get the actual forecast
        forecast_url = points_data["properties"]["forecast"]
        forecast_data = await workflow.execute_activity(
            make_nws_request,
            forecast_url,
            start_to_close_timeout=timedelta(seconds=40),
        )

        if not forecast_data:
            return "Unable to fetch detailed forecast."`;

const WORKFLOW_FORMAT_PY = `        # Format the periods into a readable forecast
        periods = forecast_data["properties"]["periods"]
        forecasts = []
        for period in periods[:5]:  # Only show next 5 periods
            forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
            forecasts.append(forecast)

        return "\\n---\\n".join(forecasts)`;

const WORKFLOW_COMPLETE_PY = `from temporalio import workflow
from datetime import timedelta

NWS_API_BASE = "https://api.weather.gov"

# Import Activities and models using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from workflows.weather_activities import make_nws_request

@workflow.defn
class GetForecast:
    @workflow.run
    async def run(self, latitude: float, longitude: float) -> str:
        """Get weather forecast for a location.

        Args:
            latitude: Latitude of the location
            longitude: Longitude of the location
        """
        # Step 1: Get the forecast grid endpoint
        points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
        points_data = await workflow.execute_activity(
            make_nws_request,
            points_url,
            start_to_close_timeout=timedelta(seconds=40),
        )

        if not points_data:
            return "Unable to fetch forecast data for this location."

        # Optional: Add a delay between calls
        await workflow.sleep(10)

        # Step 2: Get the actual forecast
        forecast_url = points_data["properties"]["forecast"]
        forecast_data = await workflow.execute_activity(
            make_nws_request,
            forecast_url,
            start_to_close_timeout=timedelta(seconds=40),
        )

        if not forecast_data:
            return "Unable to fetch detailed forecast."

        # Format the periods into a readable forecast
        periods = forecast_data["properties"]["periods"]
        forecasts = []
        for period in periods[:5]:  # Only show next 5 periods
            forecast = f"""
{period['name']}:
Temperature: {period['temperature']}°{period['temperatureUnit']}
Wind: {period['windSpeed']} {period['windDirection']}
Forecast: {period['detailedForecast']}
"""
            forecasts.append(forecast)

        return "\\n---\\n".join(forecasts)`;

const RETRY_POLICY_PY = `from temporalio.common import RetryPolicy

points_data = await workflow.execute_activity(
    make_nws_request,
    points_url,
    start_to_close_timeout=timedelta(seconds=40),
    retry_policy=RetryPolicy(
        maximum_attempts=3,
        initial_interval=timedelta(seconds=2),
        backoff_coefficient=3.0
    ),
)`;

const MCP_INIT_PY = `from temporalio.client import Client
from fastmcp import FastMCP

# Initialize FastMCP server with a name
mcp = FastMCP("weather")`;

const MCP_TOOL_STUB_PY = `@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """`;

const MCP_TOOL_PY = `@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    client = await Client.connect("localhost:7233")
    handle = await client.start_workflow(
        GetForecast,
        args=[latitude, longitude],
        id=f"forecast-{latitude}-{longitude}",
        task_queue="weather-task-queue",
    )
    return await handle.result()`;

const MCP_RUN_PY = `if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')`;

const WEATHER_COMPLETE_PY = `from temporalio.client import Client
from fastmcp import FastMCP
from workflow import GetForecast

# Initialize FastMCP server
mcp = FastMCP("weather")

@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    client = await Client.connect("localhost:7233")
    handle = await client.start_workflow(
        GetForecast,
        args=[latitude, longitude],
        id=f"forecast-{latitude}-{longitude}",
        task_queue="weather-task-queue",
    )
    return await handle.result()

if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')`;

const WORKER_IMPORTS_PY = `import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from activities import make_nws_request
from workflow import GetForecast`;

const WORKER_MAIN_PY = `async def main():
    # Connect to Temporal service
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="weather-task-queue", # Task queue that your Worker is listening to.
        workflows=[GetForecast], # Register the Workflow on your Worker
        activities=[make_nws_request], # Register the Activities on your Worker
    )

    print("Worker started. Listening for workflows...")
    await worker.run()`;

const WORKER_ENTRY_PY = `if __name__ == "__main__":
    asyncio.run(main())`;

const WORKER_COMPLETE_PY = `import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from activities import make_nws_request
from workflow import GetForecast

async def main():
    # Connect to Temporal service
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="weather-task-queue", # Task queue that your Worker is listening to.
        workflows=[GetForecast], # Register the Workflow on your Worker
        activities=[make_nws_request], # Register the Activities on your Worker
    )

    print("Worker started. Listening for workflows...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())`;

const CLAUDE_CONFIG_JSON = `{
    "mcpServers": {
      "weather": {
        "command": "uv",
        "args": [
          "--directory",
          "/Users/yourname/path/to/edu-durable-mcp-tutorial-template",
          "run",
          "weather.py"
        ]
      }
    }
  }`;

export default function IntroducingMcpTemporalPage() {
  return (
    <Layout
      title="Part 1: Creating a Durable Weather MCP Server with Temporal"
      description="Learn how to combine MCP (Model Context Protocol) and Temporal to build AI applications with powerful, durable tool integrations that automatically handle failures and retries."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="AI tutorials"
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
                  {
                    label: "Building Durable MCP Tools",
                    href: "/tutorials/ai/building-mcp-tools-with-temporal/",
                  },
                  { label: "Part 1: Introducing MCP" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Creating a Durable Weather MCP Server with Temporal
            </h1>

            <MetaChips items={["~60 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Modern AI applications need to do more than just chat - they
              need to fetch real-time data, query databases, and call
              external APIs. These integrations are what make them
              practical. But external systems are inherently unreliable.
              APIs go down, networks fail, rate limits kick in, and
              requests timeout.
            </p>
            <p>
              When you're building these tools with{" "}
              <a
                href="https://modelcontextprotocol.io/docs/getting-started/intro"
                target="_blank"
                rel="noopener noreferrer"
              >
                MCP (Model Context Protocol)
              </a>
              , you get a standardized way to expose functionality to AI
              applications like Claude Desktop, Cursor, and Windsurf. Write
              the integration once, and it works across any MCP-compatible
              platform.
            </p>
            <p>
              But <strong>standardization doesn't solve reliability</strong>.
              Your MCP tools still need to handle failures, manage retries,
              and maintain state when things go wrong. That's where Temporal
              comes in. It provides the infrastructure to make your MCP
              tools durable - automatically retrying failed operations,
              preserving state across crashes, and ensuring long-running
              operations complete even if your process restarts.
            </p>

            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                maxWidth: "100%",
                marginBottom: "1.5rem",
              }}
            >
              <iframe
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
                src="https://www.youtube.com/embed/myovLBN2RvQ?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0&wmode=transparent"
                title="Adding Durability to AI Applications with Temporal"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>

            <p>
              In this tutorial, you'll build a weather forecast MCP server
              that Claude Desktop can use to fetch real-time weather data
              from the National Weather Service API. You'll implement the
              tool using Temporal Workflows, which handle the API calls,
              retries, and state management automatically.
            </p>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before you begin, you'll need:</p>
              <ul>
                <li>
                  <a
                    href="https://www.claude.com/download"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Claude Desktop
                  </a>
                </li>
                <li>Python with uv installed</li>
                <li>
                  A basic understanding of MCP (check out the{" "}
                  <a href="#mcp-key-concepts">MCP key concepts</a> section
                  below if you'd like to learn more)
                </li>
              </ul>
            </section>

            <section className={styles.section} id="what-youll-learn">
              <h2 className={styles.sectionTitle}>What you'll learn</h2>
              <p>By the end of this tutorial, you'll understand:</p>
              <ul>
                <li>What MCP is and why it matters for AI applications</li>
                <li>How to build MCP tools that are durable and fault-tolerant</li>
                <li>How Temporal Workflows make MCP tools production-ready</li>
              </ul>
            </section>

            <section className={styles.section} id="mcp-key-concepts">
              <h2 className={styles.sectionTitle}>MCP key concepts</h2>

              <h3 className={styles.subsectionTitle}>
                What is Model Context Protocol (MCP)?
              </h3>
              <p>
                <a
                  href="https://modelcontextprotocol.io/docs/getting-started/intro"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Model Context Protocol (MCP)
                </a>{" "}
                is a protocol that allows LLMs to direct AI applications to
                invoke external functions.
              </p>
              <p>
                <strong>Three main benefits:</strong>
              </p>
              <ul>
                <li>
                  <strong>Custom integrations</strong> - Connect your
                  applications to external services like Slack, Google
                  Calendar, databases, and other systems.
                </li>
                <li>
                  <strong>Portable toolset</strong> - Build your toolset{" "}
                  <strong>once</strong> using the MCP standard and use it{" "}
                  <strong>everywhere</strong>. For example, create custom
                  coding tools (boilerplate generators, prompt templates,
                  documentation automation) that work across any
                  MCP-compatible IDE or application (such as VSCode or
                  Windsurf).
                </li>
                <li>
                  <strong>Open-source MCP servers</strong> - Leverage other
                  open-source MCP servers. If you make an MCP Client, it
                  will allow your application to connect to other MCP
                  servers developed by third parties.
                </li>
              </ul>
              <p>
                With MCP, tools can present their capabilities to an agentic
                system dynamically.
              </p>

              <h3 className={styles.subsectionTitle}>
                Instructions, tools, and their limitations
              </h3>
              <p>From basic AI agent design, there are two key concepts:</p>
              <p>
                <strong>1. Instructions</strong>
              </p>
              <p>
                Instructions define <em>how</em> an agent should behave and
                make decisions. They're written in human language to guide
                the agent's actions.
              </p>
              <CodeBlock language="python">{INSTRUCTIONS_PY}</CodeBlock>
              <p>
                <strong>2. Tools</strong>
              </p>
              <p>
                Tools are how things actually get done. They can be local
                processes ("read this local file") or remote calls ("query
                this database").
              </p>
              <CodeBlock language="python">{TOOLS_PY}</CodeBlock>
              <p>
                You define problems in simple, human-readable terms, and the
                AI works with you using the available tools.
              </p>

              <h4>Traditional approach limitations</h4>
              <p>
                <strong>1. Pre-definition constraint.</strong> The system is
                constrained by its pre-defined tools. What if you want to
                use tools without pre-defining them in your application? For
                example, a user wants to check the weather, but the response
                is: "Sorry, I don't have weather capabilities built in yet" -
                even though weather APIs exist and are accessible.
              </p>
              <p>
                <strong>2. Integration complexity.</strong> Each integration
                has its own description and format. You need to maintain
                different versions of different integrations. Adding a new
                tool means code changes, testing, and redeployment.
              </p>
              <p>
                MCP lets agents be extended beyond their initial
                configuration - they can discover and use new tools
                dynamically.
              </p>

              <h3 className={styles.subsectionTitle}>
                MCP primitives: prompts, resources, and tools
              </h3>
              <p>
                MCP primitives are the things you interact with through MCP:
              </p>
              <ul>
                <li>
                  <strong>Prompts</strong> - Templates and instructions
                </li>
                <li>
                  <strong>Resources</strong> - Static data like files,
                  databases, and external APIs
                </li>
                <li>
                  <strong>Tools</strong> - Agent-ready APIs that perform
                  actions
                </li>
              </ul>
              <p>
                Think of MCP like giving an AI assistant a{" "}
                <strong>complete workspace</strong> instead of just a chat
                window.
              </p>
              <ul>
                <li>
                  <strong>Prompts</strong> = "Here's what I want" - Your
                  instructions and requests.
                </li>
                <li>
                  <strong>Resources</strong> = "Here's what you need to
                  know" - Background data: your codebase, database records,
                  documentation.
                </li>
                <li>
                  <strong>Tools</strong> = "Here's what you can do" -
                  Actions the LLM can take: API calls, function execution,
                  file operations.
                </li>
              </ul>
              <p>
                <strong>
                  User prompt + injected resources + available tools = LLM
                  decision-making.
                </strong>
              </p>

              <h3 className={styles.subsectionTitle}>
                MCP client-server architecture
              </h3>
              <p>
                MCP establishes a client-server communication model where
                the client and server exchange messages.
              </p>
              <ul>
                <li>
                  <strong>MCP Clients</strong> - Embedded in AI applications
                </li>
                <li>
                  <strong>MCP Servers</strong> - Provide tools and resources
                </li>
                <li>
                  <strong>Transport Protocol</strong> - Communication layer
                  between them
                </li>
              </ul>
              <p>
                <strong>MCP Server.</strong> A system that data owners
                create to make their systems accessible to AI applications.
                It operates independently from the AI application, listens
                for requests from MCP Clients and responds accordingly,
                provides tools, resources, and capabilities, and
                communicates available capabilities to the Client.
              </p>
              <p>
                <strong>MCP Client.</strong> AI applications that connect to
                MCP Servers to access external data and tools. When you use
                Claude Desktop, you'll see various tools and integrations
                available - this is because Claude Desktop has a built-in
                MCP Client. The MCP Client is a{" "}
                <strong>component inside</strong> your AI application, not a
                separate service.
              </p>
              <p>
                When you build <strong>one MCP Server</strong>, it instantly
                works with all MCP-compatible applications - Claude Desktop,
                Cursor, Windsurf, Zed, and custom apps. You don't need
                custom integrations per platform.
              </p>

              <h3 className={styles.subsectionTitle}>Transport protocols</h3>
              <p>
                MCP supports multiple transport protocols, letting you
                choose the best communication method for your use case.
              </p>
              <p>
                <strong>stdio.</strong> Standard input/output runs the MCP
                server as a local subprocess. Ideal for local development
                and desktop applications like Claude Desktop.
              </p>
              <p>
                <strong>streamable-http.</strong> Uses Server-Sent Events
                (SSE) over HTTP, allowing the MCP server to run as a remote
                web service. Ideal for cloud deployments, microservices,
                and scenarios where multiple clients need to access the
                same MCP server from different machines.
              </p>
            </section>

            <section className={styles.section} id="limitations-of-mcp-tools">
              <h2 className={styles.sectionTitle}>
                The limitations of MCP tools
              </h2>
              <p>
                MCP enables powerful tool integrations, but the protocol
                itself doesn't provide durability. When your AI agent calls
                an MCP tool that:
              </p>
              <ul>
                <li>Makes external API calls</li>
                <li>Processes long-running operations</li>
                <li>Coordinates multiple services</li>
              </ul>
              <p>
                What happens if the Weather API is down? What if the network
                fails halfway through?
              </p>

              <h3 className={styles.subsectionTitle}>
                Example of a non-durable MCP tool
              </h3>
              <p>
                Without durability, if the code below fails, everything is
                lost - no retry, no recovery, no memory of what happened.
              </p>
              <CodeBlock language="python">{FRAGILE_TOOL_PY}</CodeBlock>
              <p>
                <strong>Possible problems:</strong>
              </p>
              <ul>
                <li>Network failures lose all progress</li>
                <li>No automatic retries</li>
                <li>No state persistence</li>
                <li>Difficult to debug what happened</li>
              </ul>
            </section>

            <section className={styles.section} id="how-temporal-transforms">
              <h2 className={styles.sectionTitle}>
                How Temporal transforms MCP tools
              </h2>
              <p>
                MCP servers need to orchestrate complex, multi-step
                operations that interact with external systems. Temporal is
                a great choice for this use case. With Temporal:
              </p>
              <ul>
                <li>Your MCP tool can run for hours, days, or even months</li>
                <li>
                  The tool keeps running even if the MCP server process
                  crashes or restarts
                </li>
                <li>State is preserved across failures automatically</li>
                <li>
                  When an external API is temporarily down, Temporal retries
                  automatically
                </li>
              </ul>

              <Admonition type="info" title="Durable Execution">
                <p>
                  Durable Execution ensures that your application behaves
                  correctly despite adverse conditions by guaranteeing that
                  it will run to completion.
                </p>
                <ul>
                  <li>
                    If an LLM call fails halfway through processing, you{" "}
                    <strong>don't lose the work already completed</strong>.
                  </li>
                  <li>
                    If a database query times out, you can{" "}
                    <strong>retry just that step</strong> without restarting
                    everything.
                  </li>
                  <li>
                    If your application crashes, it can{" "}
                    <strong>resume from the last successful operation</strong>.
                  </li>
                  <li>
                    <strong>Long-running processes</strong> can span hours
                    or days without losing context.
                  </li>
                </ul>
                <p>
                  Without durability, every failure means starting over.
                  With durability, failures become recoverable interruptions
                  instead of catastrophic losses. This is especially
                  critical for GenAI applications where LLM calls are
                  expensive, slow, and unpredictable.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="building-durable-tool">
              <h2 className={styles.sectionTitle}>
                Building a durable MCP tool
              </h2>
              <p>
                In this tutorial, you'll build a weather forecast tool that
                Claude Desktop can use to fetch real-time weather data from
                the National Weather Service API. By the end, you'll have a
                working MCP server that:
              </p>
              <ul>
                <li>Fetches weather forecast data from an external API</li>
                <li>
                  Returns formatted weather information that Claude can
                  present to users
                </li>
                <li>
                  Automatically handles API failures, retries, and network
                  issues through Temporal
                </li>
              </ul>
              <p>
                This hands-on example will show you exactly how Temporal
                transforms a simple MCP tool into a production-ready,
                fault-tolerant integration. You can follow along or check
                out the code in the{" "}
                <a
                  href="https://github.com/temporalio/edu-durable-mcp-tutorial-template"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  tutorial repository
                </a>
                .
              </p>

              <h3 className={styles.subsectionTitle}>Project setup</h3>
              <p>
                First, create a new directory for your project and set up
                the required dependencies:
              </p>
              <CodeBlock language="bash">{`mkdir durable-mcp-tutorial
cd durable-mcp-tutorial`}</CodeBlock>
              <p>
                Initialize a new Python project with <code>uv</code>:
              </p>
              <CodeBlock language="bash">uv init</CodeBlock>
              <p>Add the required dependencies:</p>
              <CodeBlock language="bash">uv add temporalio fastmcp httpx</CodeBlock>
              <p>
                This will create a virtual environment and install all
                necessary packages.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 1: Define external interactions as Activities
              </h3>
              <p>
                You will now define the functions that handle interactions
                with external systems. These functions are called{" "}
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>
                .
              </p>
              <p>
                Activities encapsulate the logic for tasks that interact
                with external services such as querying a database or
                calling a third-party API. One of the key benefits of using
                Activities is their built-in fault tolerance. If an Activity
                fails, Temporal can automatically retry it until it succeeds
                or reaches a specified retry limit. This ensures that
                transient issues - like network glitches or temporary
                service outages - don't result in data loss or incomplete
                processes.
              </p>
              <p>Examples:</p>
              <ul>
                <li>
                  <strong>External API calls</strong> - LLM requests,
                  database queries
                </li>
                <li>
                  <strong>File system operations</strong> - Reading
                  documents, writing reports
                </li>
                <li>
                  <strong>Network operations</strong> - HTTP requests, email
                  sending
                </li>
              </ul>
              <p>
                <strong>Without Temporal</strong>, you would need to write
                retry logic with exponential backoff, timeout handling,
                error logging and monitoring, and state tracking between
                retry attempts.
              </p>
              <p>
                <strong>With Temporal Activities</strong>, all of this is
                handled automatically. You just write the business logic -
                making the API request - and Temporal takes care of the
                rest.
              </p>
              <p>
                Your weather tool needs to make HTTP requests to the
                National Weather Service API. These requests are the
                perfect example of operations that can and will fail in
                production.
              </p>

              <h4>Creating your first Activities</h4>
              <p>
                Create a new file to call the National Weather Service API
                called <code>activities.py</code>:
              </p>
              <CodeBlock language="python" title="activities.py">
                {ACTIVITIES_PY}
              </CodeBlock>
              <p>
                As you can see, this is as straightforward as adding the{" "}
                <code>@activity.defn</code> decorator above your regular
                Python function. As an Activity, your API call is now:
              </p>
              <ul>
                <li>Protected against API timeouts</li>
                <li>Automatically retried with backoff</li>
                <li>Observable for debugging</li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                Step 2: Creating the Workflow
              </h3>
              <p>
                Now you'll create a Workflow that orchestrates your
                Activity (making API calls to the Weather Service) to fetch
                and format forecast data. Create a file called{" "}
                <code>workflow.py</code> to contain your workflow logic.
              </p>

              <h4>Understanding Workflow structure</h4>
              <p>
                Workflows in Temporal are defined as{" "}
                <strong>asynchronous classes</strong> with these key
                elements:
              </p>
              <ol>
                <li>
                  <strong>Class decorator</strong>:{" "}
                  <code>@workflow.defn</code> marks the class as a Workflow
                </li>
                <li>
                  <strong>Entry point method</strong>: A single{" "}
                  <code>async</code> method decorated with{" "}
                  <code>@workflow.run</code>
                </li>
                <li>
                  <strong>Activity execution</strong>: Activities are
                  called using <code>workflow.execute_activity()</code>
                </li>
              </ol>
              <p>
                A{" "}
                <a
                  href="https://docs.temporal.io/workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definition
                </a>{" "}
                is essentially a function that can store state and
                orchestrates the execution of Activities. Workflows manage
                the coordination and logic of your application's processes,
                while Activities perform the tasks that interact with
                external services or are prone to failure.
              </p>

              <h4>Step 2.1: Set up your Workflow file</h4>
              <p>
                Create <code>workflow.py</code> and start with the
                necessary imports:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_IMPORTS_PY}
              </CodeBlock>

              <h4>Step 2.2: Define constants</h4>
              <p>Set up the base URL for the National Weather Service API:</p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_CONST_PY}
              </CodeBlock>

              <h4>Step 2.3: Import Activity inside the Workflow</h4>
              <p>
                Before you can use your Activities, you need to import them
                inside your Workflow. Temporal requires a special import
                pattern:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_IMPORT_ACTIVITY_PY}
              </CodeBlock>

              <Admonition type="note">
                <p>
                  <strong>
                    Why <code>workflow.unsafe.imports_passed_through()</code>?
                  </strong>{" "}
                  Temporal relies on a{" "}
                  <a
                    href="https://docs.temporal.io/encyclopedia/event-history/event-history-python#How-History-Replay-Provides-Durable-Execution"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Replay mechanism
                  </a>{" "}
                  to recover from failure. As your program progresses,
                  Temporal saves the input and output from function calls
                  to the history. This allows a failed program to restart
                  right where it left off.
                </p>
                <p>
                  Temporal requires this special import pattern for
                  Workflows for replay. This import pattern tells Temporal:
                  "These imports are safe to use during replay."
                </p>
              </Admonition>

              <h4>Step 2.4: Define the Workflow class</h4>
              <p>Create your Workflow class with the required decorators:</p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_CLASS_PY}
              </CodeBlock>

              <h4>Step 2.5: Execute the first Activity - get forecast endpoint</h4>
              <p>
                The National Weather Service API requires two API calls:
              </p>
              <ol>
                <li>
                  First, get the forecast endpoint URL for the given
                  coordinates
                </li>
                <li>
                  Then, fetch the actual forecast data from that endpoint
                </li>
              </ol>
              <p>
                Inside the <code>run</code> method, call your first
                Activity to get the forecast endpoint. Notice how you:
              </p>
              <ul>
                <li>
                  Build the API URL using the provided latitude and
                  longitude
                </li>
                <li>
                  Use <code>await workflow.execute_activity()</code> to
                  execute the <code>make_nws_request</code> Activity
                </li>
                <li>
                  Set a{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/failure-detection#activity-timeouts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Start-to-Close timeout
                  </a>
                  , which is the maximum amount of time a single Activity
                  Execution can take. Temporal recommends always setting
                  this timeout. Set it to 40 seconds, meaning the Activity
                  has 40 seconds to complete before retrying.
                </li>
              </ul>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_STEP1_PY}
              </CodeBlock>

              <Admonition type="note">
                <p>
                  <strong>
                    Key points about <code>workflow.execute_activity()</code>:
                  </strong>
                </p>
                <ul>
                  <li>
                    First parameter: The Activity function to execute
                    (referenced by name)
                  </li>
                  <li>
                    Second parameter: The input to pass into the Activity
                  </li>
                  <li>
                    Third parameter: The Activity timeout you wish to set
                  </li>
                </ul>
              </Admonition>

              <h4>Step 2.6: Add a durable delay (optional)</h4>
              <p>
                You can add a delay between API calls in case of the
                Weather Service's rate limits. Unlike a regular{" "}
                <code>asyncio.sleep()</code>, <code>workflow.sleep()</code>{" "}
                is durable - if the process crashes during the sleep, the
                Workflow will resume exactly where it left off when it
                restarts:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_SLEEP_PY}
              </CodeBlock>

              <h4>Step 2.7: Execute the second Activity - get forecast data</h4>
              <p>
                Now add the second Activity call to fetch the actual
                forecast. This Activity depends on the output from the
                first Activity:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_STEP2_PY}
              </CodeBlock>

              <h4>Step 2.8: Format the results</h4>
              <p>
                Finally, process and format the forecast data into a
                readable string:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_FORMAT_PY}
              </CodeBlock>

              <p>
                Your complete <code>workflow.py</code> should look like
                this:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_COMPLETE_PY}
              </CodeBlock>

              <h4>Optional: Adding a Retry Policy</h4>
              <p>
                Each Activity has a{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  default Retry Policy
                </a>{" "}
                that retries, then backs off increasingly to a maximum
                duration. You can also add a custom Retry Policy to your
                Activity execution like so:
              </p>
              <CodeBlock language="python">{RETRY_POLICY_PY}</CodeBlock>
              <p>
                This weather-calling Activity includes a custom retry
                policy that controls how failures are handled:
              </p>
              <ul>
                <li>
                  <code>initial_interval</code>: Wait 2 seconds before the
                  first retry
                </li>
                <li>
                  <code>maximum_attempts</code>: Try up to 3 times total
                </li>
                <li>
                  <code>backoff_coefficient</code>: Triple the wait time
                  between each retry (2s → 6s)
                </li>
              </ul>
              <p>
                This means if the API call fails, Temporal will
                automatically retry with exponential backoff, giving
                transient issues time to resolve.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 3: Create the MCP server file
              </h3>
              <p>
                Now you'll create an MCP server that exposes your weather
                forecast functionality as a tool that Claude Desktop (or
                any MCP client) can use. The MCP server acts as a bridge
                between AI applications and your durable Temporal
                Workflows.
              </p>
              <p>The MCP server has two main responsibilities:</p>
              <ol>
                <li>
                  <strong>Expose tools to MCP clients</strong> - Define
                  what capabilities are available and their parameters
                </li>
                <li>
                  <strong>Delegate to Temporal</strong> - When a tool is
                  called, start a Temporal Workflow to handle the actual
                  work
                </li>
              </ol>
              <p>
                This separation of concerns means your MCP server stays
                lightweight and all the complexity, retry logic, and state
                management lives in Temporal.
              </p>

              <h4>Step 3.1: Set up the MCP server file</h4>
              <p>
                Create a new file called <code>weather.py</code>:
              </p>
              <CodeBlock language="python" title="weather.py">
                {MCP_INIT_PY}
              </CodeBlock>
              <p>
                The <code>FastMCP</code> initialization creates an MCP
                server named "weather". This name will appear in Claude
                Desktop when you connect to the server.
              </p>

              <h4>Step 3.2: Define the MCP tool</h4>
              <p>
                Now define the actual tool that MCP clients can call. The{" "}
                <code>@mcp.tool()</code> decorator registers this function
                as an available tool:
              </p>
              <CodeBlock language="python" title="weather.py">
                {MCP_TOOL_STUB_PY}
              </CodeBlock>

              <h4>Step 3.3: Set up Temporal Client connection</h4>
              <p>
                Now it's time to actually call your <code>GetForecast</code>{" "}
                Workflow.
              </p>
              <p>
                A{" "}
                <a
                  href="https://docs.temporal.io/develop/python/temporal-client"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Client
                </a>{" "}
                provides a set of APIs to communicate with a Temporal
                Service. You can use a Temporal Client in your application
                to perform various operations such as:
              </p>
              <ul>
                <li>
                  <strong>Start a Workflow Execution</strong> (like
                  fetching a weather forecast)
                </li>
                <li>
                  <strong>Query the state of a running Workflow</strong>{" "}
                  (like checking if the forecast data has been retrieved)
                </li>
                <li>
                  <strong>Send Signals to running Workflows</strong> (like
                  updating location coordinates mid-execution)
                </li>
                <li>
                  <strong>Get results from completed Workflows</strong>{" "}
                  (like retrieving the formatted weather forecast)
                </li>
              </ul>
              <p>
                Call the <code>GetForecast</code> Workflow from your{" "}
                <code>get_forecast</code> MCP tool.
              </p>
              <CodeBlock language="python" title="weather.py">
                {MCP_TOOL_PY}
              </CodeBlock>

              <Admonition type="note">
                <p>
                  The address <code>localhost:7233</code> is where your
                  Temporal development server will be running. Port 7233 is
                  the default port for Temporal server connections.
                </p>
              </Admonition>

              <p>
                <strong>Breaking down the Workflow start:</strong>
              </p>
              <ul>
                <li>
                  <code>GetForecast</code> - The Workflow to execute
                </li>
                <li>
                  <code>args=[latitude, longitude]</code> - Parameters to
                  pass to the Workflow
                </li>
                <li>
                  <code>id=f"forecast-{`{latitude}`}-{`{longitude}`}"</code> -
                  A unique identifier for this Workflow execution. Using
                  coordinates ensures that duplicate requests for the same
                  location reuse the existing Workflow instead of starting
                  a new one
                </li>
                <li>
                  <code>task_queue="weather-task-queue"</code> - The queue
                  name where this Workflow will be picked up for execution
                  (you'll configure this in the next step)
                </li>
              </ul>
              <p>
                <strong>
                  About <code>handle.result()</code>:
                </strong>{" "}
                this waits for the Workflow to complete and returns the
                result. The MCP server will wait here until the Workflow
                finishes - whether that takes 1 second or 1 hour.
              </p>

              <h4>Step 3.4: Configure the server transport</h4>
              <p>
                Finally, add the code to run the MCP server when the script
                is executed:
              </p>
              <CodeBlock language="python" title="weather.py">
                {MCP_RUN_PY}
              </CodeBlock>
              <p>
                <code>transport='stdio'</code> uses standard input/output
                for communication. This is the recommended transport for
                local MCP servers that Claude Desktop will run as a
                subprocess.
              </p>

              <p>
                Your complete <code>weather.py</code> should look like
                this:
              </p>
              <CodeBlock language="python" title="weather.py">
                {WEATHER_COMPLETE_PY}
              </CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 4: Run your Worker
              </h3>
              <p>
                When you start a Workflow in Temporal, it generates tasks
                that are placed into a queue called a Task Queue.{" "}
                <a
                  href="https://docs.temporal.io/workers"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workers
                </a>{" "}
                continuously poll this queue, pick up available tasks, and
                execute them. Your Workflow progresses as Workers complete
                each task. Think of it as the "engine" that powers your
                Temporal application.
              </p>
              <p>
                Create a new file called <code>worker.py</code> and build
                it step by step:
              </p>

              <h4>Step 4.1: Import dependencies</h4>
              <CodeBlock language="python" title="worker.py">
                {WORKER_IMPORTS_PY}
              </CodeBlock>

              <h4>Step 4.2: Create the Worker function</h4>
              <CodeBlock language="python" title="worker.py">
                {WORKER_MAIN_PY}
              </CodeBlock>

              <h4>Step 4.3: Add the entry point</h4>
              <CodeBlock language="python" title="worker.py">
                {WORKER_ENTRY_PY}
              </CodeBlock>
              <p>This starts the Worker when you run the file.</p>

              <p>
                Your complete <code>worker.py</code> should look like this:
              </p>
              <CodeBlock language="python" title="worker.py">
                {WORKER_COMPLETE_PY}
              </CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 5: Run your application
              </h3>
              <p>
                With your code complete and Claude Desktop configured,
                start your application. You need two terminal windows
                running.
              </p>

              <h4>Terminal 1 - Start the Temporal Server</h4>
              <p>
                The first step is to make sure you have a local Temporal
                Service running. Open a terminal window and start the
                service:
              </p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                As you'll see in the command line output, your Temporal
                Server should now be running on{" "}
                <code>http://localhost:8233</code>. When you first access
                this server, you should see zero Workflows running.
              </p>
              <p>Keep this terminal running throughout the tutorial.</p>

              <h4>Terminal 2 - Start your Worker</h4>
              <p>
                In a new terminal window, navigate to your project
                directory and start the Worker:
              </p>
              <CodeBlock language="bash">uv run worker.py</CodeBlock>
              <p>
                You should see output indicating the Worker has started
                and is listening on the <code>weather-task-queue</code>{" "}
                task queue. Keep this terminal running - the Worker needs
                to be active to execute your Workflows.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 6: Configure Claude Desktop
              </h3>
              <p>
                Claude Desktop has a built-in MCP client. Once you've
                connected your MCP server, Claude Desktop can discover the
                tools you've made available. To connect Claude Desktop to
                your weather MCP server, set up a{" "}
                <code>claude_desktop_config.json</code> file.
              </p>
              <p>
                Create a <code>claude_desktop_config.json</code> file at
                the root of your directory:
              </p>
              <CodeBlock language="json" title="claude_desktop_config.json">
                {CLAUDE_CONFIG_JSON}
              </CodeBlock>
              <ol>
                <li>
                  Replace{" "}
                  <code>
                    /Users/yourname/path/to/edu-durable-mcp-tutorial-template
                  </code>{" "}
                  with your actual project path.
                </li>
                <li>
                  Copy this config file to Claude Desktop's configuration
                  directory:
                  <CodeBlock language="bash">{`cp claude_desktop_config.json ~/Library/Application\\ Support/Claude/claude_desktop_config.json`}</CodeBlock>
                </li>
                <li>
                  Completely quit and restart Claude Desktop for the
                  changes to take effect.
                  <ul>
                    <li>
                      On macOS: Right-click the Claude icon in the dock
                      and select "Quit"
                    </li>
                    <li>
                      On Windows: Right-click the system tray icon and
                      select "Exit"
                    </li>
                  </ul>
                </li>
              </ol>

              <h3 className={styles.subsectionTitle}>
                Step 7: Test the integration
              </h3>
              <p>Now test your durable MCP tool.</p>

              <h4>Verify the connection</h4>
              <ol>
                <li>Open Claude Desktop</li>
                <li>
                  Click on the icon to the right of the plus sign button.
                  You should now see your configured MCP server (e.g.{" "}
                  <code>weather</code>) in Claude Desktop and the blue
                  toggle should be switched on.
                </li>
              </ol>

              <h4>Test the weather tool</h4>
              <ol>
                <li>In Claude Desktop, start a new conversation</li>
                <li>
                  Ask:{" "}
                  <strong>
                    "What's the weather forecast for San Francisco, CA?"
                  </strong>
                </li>
                <li>
                  Claude will analyze your request and determine it needs
                  the <code>get_forecast</code> tool
                </li>
                <li>
                  You'll see a prompt asking for permission to use the
                  tool - click <strong>"Allow"</strong>
                </li>
                <li>
                  Claude will call the tool with the latitude and
                  longitude for San Francisco
                </li>
              </ol>

              <h4>Observe the Workflow in Temporal</h4>
              <p>
                Temporal provides a robust{" "}
                <a
                  href="https://docs.temporal.io/web-ui"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Web UI
                </a>{" "}
                for managing Workflow Executions. You can:
              </p>
              <ul>
                <li>
                  Gain insights like responses from Activities, execution
                  time, and failures
                </li>
                <li>
                  Debug and understand what's happening during your
                  Workflow Executions
                </li>
              </ul>
              <p>
                Access the Web UI at <code>http://localhost:8233</code>{" "}
                when running the Temporal development server. You should
                see that your Workflow Execution has completed
                successfully.
              </p>
              <p>See if you can locate the following items on the Web UI:</p>
              <ul>
                <li>The name of the Task Queue</li>
                <li>The name of the Activities called</li>
                <li>The inputs and outputs of the called Activities</li>
                <li>The inputs and outputs of the Workflow Execution</li>
              </ul>
              <p>
                <strong>Try more locations.</strong> Test the tool with
                different cities:
              </p>
              <ul>
                <li>"What's the weather in New York City?"</li>
                <li>"Get me the forecast for Seattle, WA"</li>
                <li>"What's the weather like in Austin, Texas?"</li>
              </ul>
              <p>
                Each request will create a new Workflow execution that you
                can observe in the Temporal Web UI.
              </p>
              <p>
                You're now done with the core tutorial. Continue on to see
                Temporal's durability in action and experience how it
                recovers from failures.
              </p>

              <h3 className={styles.subsectionTitle}>
                Optional: Testing durability - Quit Claude Desktop during execution
              </h3>
              <p>
                Let's demonstrate Temporal's durability by showing that
                Workflows continue running even when the client
                disconnects.
              </p>

              <h4>Step 1: Increase the Workflow sleep time</h4>
              <p>
                Make the Workflow take longer so you have time to quit
                Claude Desktop while it's running. Open{" "}
                <code>workflow.py</code> and change the sleep duration:
              </p>
              <CodeBlock language="python">{`# Change this line:
await workflow.sleep(10)

# To this:
await workflow.sleep(60)  # 60 seconds`}</CodeBlock>
              <p>
                Save this file, and restart your Worker for the changes to
                take effect:
              </p>
              <ol>
                <li>
                  In the Worker terminal, press <code>Ctrl+C</code> to
                  stop it
                </li>
                <li>
                  Run <code>uv run worker.py</code> again to restart it
                  with the updated code
                </li>
              </ol>

              <h4>Step 2: Start a weather request</h4>
              <ol>
                <li>
                  In Claude Desktop, ask for the weather in any location:{" "}
                  <strong>
                    "What's the weather in Denver, Colorado?"
                  </strong>
                </li>
                <li>
                  Click <strong>"Allow"</strong> when prompted to use the
                  tool
                </li>
                <li>
                  Claude will show that it's waiting for the tool response
                </li>
              </ol>

              <h4>Step 3: Quit Claude Desktop while the Workflow is running</h4>
              <p>Immediately after allowing the tool use:</p>
              <ol>
                <li>
                  <strong>Completely quit Claude Desktop</strong> (don't
                  just close the window)
                  <ul>
                    <li>
                      On macOS: Right-click the Claude icon in the dock
                      and select "Quit"
                    </li>
                    <li>
                      On Windows: Right-click the system tray icon and
                      select "Exit"
                    </li>
                  </ul>
                </li>
                <li>
                  The MCP server will disconnect, but check your terminals
                  - the Worker and Temporal server are still running.
                </li>
              </ol>

              <h4>Step 4: Observe the Workflow still running</h4>
              <p>Notice the following:</p>
              <ul>
                <li>
                  <strong>Status</strong>: The Workflow is still "Running"
                </li>
                <li>
                  <strong>Event History</strong>: Shows the first Activity
                  completed, the Workflow timer started
                </li>
                <li>
                  <strong>Timeline</strong>: You can watch the 60-second
                  sleep countdown in real-time
                </li>
              </ul>
              <p>
                Even though Claude Desktop quit and the MCP server
                disconnected,{" "}
                <strong>
                  the Workflow continues executing in Temporal
                </strong>
                . The Worker is still processing it. You'll then see the
                Workflow complete successfully -{" "}
                <strong>
                  even though the original client (Claude Desktop)
                  disconnected halfway through
                </strong>
                .
              </p>

              <h4>What this demonstrates</h4>
              <p>This experiment proves several critical points:</p>
              <ol>
                <li>
                  <strong>Workflows are durable</strong> - They don't
                  depend on the client staying connected
                </li>
                <li>
                  <strong>Workers are reliable</strong> - As long as the
                  Worker is running, Workflows complete
                </li>
                <li>
                  <strong>State is preserved</strong> - All progress is
                  saved, nothing is lost when clients disconnect
                </li>
              </ol>
              <p>In a production environment, this means:</p>
              <ul>
                <li>
                  Your MCP tools can handle long-running operations
                  (minutes, hours, or even days)
                </li>
                <li>
                  Network interruptions don't cause data loss or
                  incomplete work
                </li>
                <li>
                  Clients can disconnect and reconnect without breaking
                  workflows
                </li>
                <li>The system is truly fault-tolerant</li>
              </ul>
              <p>
                You've now completed this tutorial and seen the power of
                durable MCP tools with Temporal. Check out the{" "}
                <a
                  href="https://github.com/temporalio/edu-durable-mcp-tutorial-template"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  tutorial repository
                </a>{" "}
                that includes all the code used for it.
              </p>
            </section>

            <section className={styles.section} id="whats-next">
              <h2 className={styles.sectionTitle}>What's next?</h2>
              <p>
                In the{" "}
                <Link to="/tutorials/ai/building-mcp-tools-with-temporal/adding-hitl-to-mcp-tools/">
                  next MCP tutorial
                </Link>
                , you'll add{" "}
                <strong>
                  durable human-in-the-loop capabilities to your MCP tools
                  with Temporal
                </strong>
                .
              </p>
              <p>
                Sign up{" "}
                <a
                  href="https://pages.temporal.io/get-updates-education"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>{" "}
                to get notified when new tutorials and educational content
                are published.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/building-mcp-tools-with-temporal/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Series overview
                </span>
                <span className={styles.chapterNavTitle}>
                  Building Durable MCP Tools
                </span>
              </Link>
              <Link
                to="/tutorials/ai/building-mcp-tools-with-temporal/adding-hitl-to-mcp-tools/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: part 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Adding Human-in-the-Loop to MCP Tools
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
