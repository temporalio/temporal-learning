---
id: durable-weather-mcp-server
sidebar_position: 1
keywords: [temporal, mcp, model context protocol, ai, durability, workflows]
tags: [temporal, mcp, ai, workflows]
last_update:
  date: 2025-11-13
  author: Angela Zhou
title: "Part 1: Creating a Durable Weather MCP Server with Temporal"
description: Learn how to combine MCP (Model Context Protocol) and Temporal to build AI applications with powerful, durable tool integrations that automatically handle failures and retries.
image: /img/temporal-logo-twitter-card.png
---

# Creating a Durable Weather MCP Server with Temporal

Modern AI applications need to do more than just chat—they need to fetch real-time data, query databases, and call external APIs. These integrations are what make them practical. But there's a problem: external systems are inherently unreliable. APIs go down, networks fail, rate limits kick in, and requests timeout.

When you're building these tools with [MCP (Model Context Protocol)](https://modelcontextprotocol.io/docs/getting-started/intro), you get a standardized way to expose functionality to AI applications like Claude Desktop, Cursor, and Windsurf. Write the integration once, and it works across any MCP-compatible platform.

But **standardization doesn't solve reliability**. Your MCP tools still need to handle failures, manage retries, and maintain state when things go wrong. That's where Temporal comes in. It provides the infrastructure to make your MCP tools durable—automatically retrying failed operations, preserving state across crashes, and ensuring long-running operations complete even if your process restarts.

<div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', marginBottom: '1.5rem' }}>
  <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} src="https://www.youtube.com/embed/myovLBN2RvQ?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0&wmode=transparent" title="Adding Durability to AI Applications with Temporal" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

In this tutorial, you'll build a weather forecast MCP server that Claude Desktop can use to fetch real-time weather data from the National Weather Service API. You'll implement the tool using Temporal Workflows, which handle the API calls, retries, and state management automatically.

## Prerequisites

Before you begin, you'll need:

- [Claude Desktop](https://www.claude.com/download)
- Python with uv installed
- A basic understanding of MCP (check out [this section](#if-youre-new-to-mcp-here-are-some-key-concepts) of the tutorial if you'll like to learn more!)

## What You'll Learn

By the end of this tutorial, you'll understand:

- What MCP is and why it matters for AI applications
- How to build MCP tools that are durable and fault-tolerant
- How Temporal Workflows make MCP tools production-ready

## If you're new to MCP, here are some key concepts:

<details>
<summary>
What is Model Context Protocol (MCP)?
</summary>

### [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/getting-started/intro) is a protocol that allows LLMs to direct AI applications to invoke external functions.

### Three Main Benefits:

**a) Custom integrations** - Connect your applications to external services like Slack, Google Calendar, databases, and other systems

**b) Portable toolset** - Build your toolset **once** using the MCP standard and use it **everywhere**. For example, create custom coding tools (boilerplate generators, prompt templates, documentation automation) that work across any MCP-compatible IDE or application (e.g., VSCode, Windsurf).

**c) Open-source MCP servers** - Leverage other open-source MCP servers. If you make an MCP Client, it will allow your application to connect to other MCP servers developed by third parties.

With MCP, tools can present their capabilities to an agentic system dynamically.

![What is MCP](https://i.postimg.cc/N0kXLyQg/what-is-mcp.png)

*Image credit: [MCP Explained](https://yukitaylor00.medium.com/mcp-explained-how-modular-control-protocol-is-supercharging-ai-integrations-c0ce5ec15967)*
</details>

<details>
<summary>
Instructions, Tools, and Their Limitations
</summary>

### From basic AI agent design, we know there are two key concepts:

### 1. Instructions

Instructions define *how* an agent should behave and make decisions. They're written in human language to guide the agent's actions.

**Example:**

```python
instructions = "You are a helpful weather assistant. Provide clear, concise weather information."
```

### 2. Tools

Tools are how things actually get done. They can be local processes ("read this local file") or remote calls ("query this database").

**Sample tool definition:**

```python
tools = [
    {
        "type": "function",
        "name": "get_weather_alerts",
        "description": "Get current weather alerts for a US state",
        "parameters": {...}
    }
]
```

You define problems in simple, human-readable terms, and the AI works with you using the available tools.

![Agent with Tools](https://images.ctfassets.net/0uuz8ydxyd9p/oi0jwiOM9uG6tgLGlBrf3/8e49117667416feb4081435a7bb3ef6f/Fig2.png)

## The Limitations

However, there are some significant limitations with traditional approaches:

#### 1. Pre-definition Constraint

The system is constrained by its pre-defined tools. What if you want to use tools without pre-defining them in your application?

For example:
- A user wants to check the weather
- The response: "Sorry, I don't have weather capabilities built in yet"
- But weather APIs exist and are accessible!

#### 2. Integration Complexity

- Each integration has its own description and format
- You need to maintain different versions of different integrations
- Adding a new tool means code changes, testing, and redeployment

We want to build agents that can be extended beyond their initial configuration - agents that can discover and use new tools dynamically. Think of Claude Desktop: it can connect to various tools without being rebuilt for each one.
</details>
<details>
<summary>
MCP Primitives: Prompts, Resources, and Tools
</summary>

### MCP primitives are the things you interact with through MCP:

- **Prompts** - Templates and instructions
- **Resources** - Static data like files, databases, and external APIs
- **Tools** - Agent-ready APIs that perform actions

### How Primitives Work Together

Think of MCP like giving an AI assistant a **complete workspace** instead of just a chat window.

- **Prompts** = *"Here's what I want"* - Your instructions and requests
- **Resources** = *"Here's what you need to know"* - Background data: your codebase, database records, documentation
- **Tools** = *"Here's what you can do"* - Actions the LLM can take: API calls, function execution, file operations

**User prompt + injected resources + available tools = LLM decision-making**

For example, a coding agent gets context not just from your prompt, but also from your codebase files (resources accessed through MCP), enabling it to understand your specific project before suggesting changes or using development tools.

![Primitives Working Together](https://images.ctfassets.net/0uuz8ydxyd9p/3NEgDFJRaW8MCfHfaT6Lfj/a416c7f08f62d76eff95d76b1deacce3/Fig5.png)
</details>
<details>
<summary>
How MCP Client-Server Architecture Works
</summary>

MCP establishes a client-server communication model where the client and server exchange messages. The protocol defines how clients communicate with the server.

- **MCP Clients** - Embedded in AI applications
- **MCP Servers** - Provide tools and resources
- **Transport Protocol** - Communication layer between them

### MCP Server

A system that data owners create to make their systems accessible to AI applications. It:

- Operates independently from the AI application
- Listens for requests from MCP Clients and responds accordingly
- Provides tools, resources, and capabilities
- Communicates to the Client what capabilities are available

**Three Key Services:**

1. **Prompt templates** - Pre-built prompts for common tasks (e.g., a resume rewriting template)
2. **Resources** - Static data access including files, databases, and external APIs (essentially GET requests)
3. **Tools** - Functions and APIs that allow MCP clients to perform actions

**Real-world Example:**

A software development team builds an MCP server that connects to their:

- GitHub repositories (for code analysis and pull request management)
- Jira ticketing system (for project tracking and issue creation)
- CI/CD pipeline (for deployment status and build triggers)
- Documentation (for searching and updating technical docs)

Now any MCP-compatible application - whether it's Claude, VSCode, or a custom internal tool - can instantly access all these systems through a single, standardized interface.

### MCP Client

AI applications that can connect to MCP Servers to access external data and tools.

When you use Claude Desktop, you'll see various tools and integrations available - this is because Claude Desktop has a built-in MCP Client.

**MCP Clients:**
- Discover server capabilities (ask servers what tools and resources they have)
- Handle data exchange (receive data from servers and pass it to the AI application)
- Manage tool execution (coordinate when and how the AI uses different tools)

### MCP Clients are Embedded in the Agent

![MCP Clients in Agent](https://i.postimg.cc/ncv93dPM/mcp-clients-in-agent.png)

The MCP Client is a **component inside** your AI application, not a separate service.

**How It Works:**

1. **User Interaction** - User sends a prompt to the agent
2. **Agent Processing** - The LLM processes the request and determines what tools are needed
3. **MCP Client Role** - The embedded MCP Client:
   - Discovers available tools from connected MCP Servers
   - Sends requests to the appropriate MCP Server(s)
   - Receives responses and passes them back to the LLM
4. **Agent Response** - LLM uses the tool results to generate a final response

**The Growing MCP Ecosystem:**

Major AI applications and tools are embedding MCP Clients, including:
- **Claude Desktop** - Anthropic's desktop AI assistant
- **IDEs** - Cursor, Windsurf, Zed, and other AI-powered code editors
- **Custom Applications** - Any app can integrate MCP

When you build **one MCP Server**, it instantly works with **all** of these applications. You don't need to:
- Write custom integrations for each platform
- Learn different APIs for Claude vs. Cursor vs. Windsurf
- Maintain separate codebases for different tools
- Redeploy when new MCP-compatible applications launch

## Transport Protocols

MCP supports multiple transport protocols, allowing you to choose the best communication method for your use case.

### Transport: stdio

Standard input/output (stdio) runs the MCP server as a local subprocess. Ideal for:
- Local development
- Desktop applications like Claude Desktop

![stdio Transport](https://i.postimg.cc/bJjK9wDD/stdio.png)

### Transport: streamable-http

Streamable HTTP uses Server-Sent Events (SSE) over HTTP, allowing the MCP server to run as a remote web service. Ideal for:
- Cloud deployments
- Microservices architectures
- Scenarios where multiple clients need to access the same MCP server from different machines

![Streamable HTTP Transport](https://i.postimg.cc/HnYRFvtz/streamable-http.png)
</details>

## The Limitations of MCP Tools

MCP enables powerful tool integrations, but the protocol itself doesn't provide durability. When your AI agent calls an MCP tool that:
- Makes external API calls
- Processes long-running operations
- Coordinates multiple services

What happens if the Weather API is down? What if the network fails halfway through?

### Example of a Non-Durable MCP Tool

Without durability, if the code below fails, everything is lost - no retry, no recovery, no memory of what happened.

```python
from fastmcp import FastMCP
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
    result = f"Weather for {city}: {data['temp']}�F"

    return result
```

**Possible Problems:**
- Network failures lose all progress
- No automatic retries
- No state persistence
- Difficult to debug what happened

## How Temporal Transforms MCP Tools

MCP servers need to orchestrate complex, multi-step operations that interact with external systems. Temporal is a great choice for this use case. With Temporal:

- Your MCP tool can run for hours, days, or even months
- The tool keeps running even if the MCP server process crashes or restarts
- State is preserved across failures automatically
- When an external API is temporarily down, Temporal retries automatically

<details>
<summary>Temporal Provides Durable Execution</summary>

Durable Execution ensures that your application behaves correctly despite adverse conditions by guaranteeing that it will run to completion. 

- If an LLM call fails halfway through processing, you **don't lose the work already completed**.
- If a database query times out, you can **retry just that step** without restarting everything.
- If your application crashes, it can **resume from the last successful operation**.
- **Long-running processes** can span hours or days without losing context.

Without durability, every failure means starting over. With durability, failures become recoverable interruptions instead of catastrophic losses. This is especially critical for GenAI applications where LLM calls are expensive, slow, and unpredictable.
</details>

## Building a Durable MCP Tool

In this tutorial, you'll build a weather forecast tool that Claude Desktop can use to fetch real-time weather data from the National Weather Service API. By the end, you'll have a working MCP server that:

- Fetches weather forecast data from an external API
- Returns formatted weather information that Claude can present to users
- Automatically handles API failures, retries, and network issues through Temporal

This hands-on example will show you exactly how Temporal transforms a simple MCP tool into a production-ready, fault-tolerant integration. You can follow along or check out the code used [in this repository](https://github.com/temporalio/edu-durable-mcp-tutorial-template).

### Project Setup

First, create a new directory for your project and set up the required dependencies:

```bash
mkdir durable-mcp-tutorial
cd durable-mcp-tutorial
```

Initialize a new Python project with `uv`:

```bash
uv init
```

Add the required dependencies:

```bash
uv add temporalio fastmcp httpx
```

This will create a virtual environment and install all necessary packages.

### Step 1: Define External Interactions as Activities

You will now define the functions that handle interactions with external systems. These functions are called [Activities](https://docs.temporal.io/activities).

Activities encapsulate the logic for tasks that interact with external services such as querying a database or calling a third-party API. One of the key benefits of using Activities is their built-in fault tolerance. If an Activity fails, Temporal can automatically retry it until it succeeds or reaches a specified retry limit. This ensures that transient issues, like network glitches or temporary service outages, don't result in data loss or incomplete processes.

Examples:

- **External API calls** - LLM requests, database queries
- **File system operations** - Reading documents, writing reports
- **Network operations** - HTTP requests, email sending

**Without Temporal**, you would need to write:
- Retry logic with exponential backoff
- Timeout handling
- Error logging and monitoring
- State tracking between retry attempts

**With Temporal Activities**, all of this is handled automatically. You just write the business logic—making the API request—and Temporal takes care of the rest.

Our weather tool needs to make HTTP requests to the National Weather Service API. These requests are the perfect example of operations that can and will fail in production.

#### Creating Your First Activities

Create a new file to call the National Weather Service API called `activities.py`:

```python
from typing import Any
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
        return response.json()
```

As you can see, this is as straightforward as adding the `@activity.defn` decorator above your regular Python function. As an Activity, your API call is now:

- Protected against API timeouts
- Automatically retried with backoff
- Observable for debugging

### Step 2: Creating the Workflow

Now you'll create a Workflow that orchestrates your Activity (making API calls to the Weather Service) to fetch and format forecast data. Create a file called `workflow.py` to contain your workflow logic.

#### Understanding Workflow Structure

Workflows in Temporal are defined as **asynchronous classes** with these key elements:

1. **Class decorator**: `@workflow.defn` marks the class as a Workflow
2. **Entry point method**: A single `async` method decorated with `@workflow.run`
3. **Activity execution**: Activities are called using `workflow.execute_activity()`

A [Workflow Definition](https://docs.temporal.io/workflow-definition) is essentially a function that can store state and orchestrates the execution of Activities. Workflows manage the coordination and logic of your application's processes, while Activities perform the tasks that interact with external services or are prone to failure.

Let's build the Workflow step by step:

#### Step 1: Set Up Your Workflow File

Create `workflow.py` and start with the necessary imports:

```python
from temporalio import workflow
from datetime import timedelta
```

#### Step 2: Define Constants

Set up the base URL for the National Weather Service API:

```python
NWS_API_BASE = "https://api.weather.gov"
```

#### Step 3: Import Activity inside the Workflow

Before you can use your Activities, you need to import them inside your Workflow. Temporal requires a special import pattern:

```python
# Import Activities and models using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from workflows.weather_activities import make_nws_request
```

:::note 
**Why `workflow.unsafe.imports_passed_through()`?** Temporal relies on a [Replay mechanism](https://docs.temporal.io/encyclopedia/event-history/event-history-python#How-History-Replay-Provides-Durable-Execution) to recover from failure. As your program progresses, Temporal saves the input and output from function calls to the history. This allows a failed program to restart right where it left off.

Temporal requires this special import pattern for Workflows for replay. This import pattern tells Temporal: "These imports are safe to use during replay."
:::

#### Step 4: Define the Workflow Class

Create your Workflow class with the required decorators:

```python
@workflow.defn # marks the class as a Workflow
class GetForecast:
    @workflow.run # a single async method
    async def run(self, latitude: float, longitude: float) -> str:
        """Get weather forecast for a location.

        Args:
            latitude: Latitude of the location
            longitude: Longitude of the location
        """
        # Your orchestration logic will go here
```

#### Step 5: Execute the First Activity - Get Forecast Endpoint

The National Weather Service API requires two API calls:
1. First, get the forecast endpoint URL for the given coordinates
2. Then, fetch the actual forecast data from that endpoint

Inside the `run` method, call your first Activity to get the forecast endpoint. Notice how we:
- Build the API URL using the provided latitude and longitude
- Use `await workflow.execute_activity()` to execute the `make_nws_request` Activity
- Set a [Start-to-Close timeout](https://docs.temporal.io/develop/python/failure-detection#activity-timeouts), which is the maximum amount of time a single Activity Execution can take. Temporal recommends always setting this timeout. We'll set it to 40 seconds, meaning the Activity has 40 seconds to complete before retrying. Temporal always recommends setting this Timeout.

```python
@workflow.defn
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
            return "Unable to fetch forecast data for this location."
```

:::note
**Key points about `workflow.execute_activity()`:**
- First parameter: The Activity function to execute (referenced by name)
- Second parameter: The input to pass into the Activity
- Third parameter: The Activity timeout you wish to set
:::

#### Step 6: Add a Durable Delay (Optional)

You can add a delay between API calls in case of the Weather Service's rate limits. Unlike a regular `asyncio.sleep()`, `workflow.sleep()` is durable—if the process crashes during the sleep, the Workflow will resume exactly where it left off when it restarts:

```python
    # Optional: Add a delay between calls
    await workflow.sleep(10)
```

#### Step 7: Execute the Second Activity - Get Forecast Data

Now add the second Activity call to fetch the actual forecast. This Activity depends on the output from the first Activity:

```python
@workflow.defn # marks the class as a Workflow
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
            return "Unable to fetch detailed forecast."
```

#### Step 8: Format the Results

Finally, process and format the forecast data into a readable string:

```python
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

        return "\n---\n".join(forecasts)
```

<details>
<summary>
Your complete <code>workflow.py</code> should look like this:
</summary>

```python
from temporalio import workflow
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

        return "\n---\n".join(forecasts)
```
</details>

#### Optional: Adding a Retry Policy

Each Activity has a [default Retry Policy](https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy) that retries, then backs off increasingly to a maximum duration. You can also add a custom Retry Policy to your Activity execution like so:

```python
from temporalio.common import RetryPolicy

points_data = await workflow.execute_activity(
    make_nws_request,
    points_url,
    start_to_close_timeout=timedelta(seconds=40),
    retry_policy=RetryPolicy(
        maximum_attempts=3,
        initial_interval=timedelta(seconds=2),
        backoff_coefficient=3.0
    ),
)
```

This weather-calling Activity includes a custom retry policy that controls how failures are handled:

- `initial_interval`: Wait 2 seconds before the first retry
- `maximum_attempts`: Try up to 3 times total
- `backoff_coefficient`: Triple the wait time between each retry (2s → 6s)

This means if the API call fails, Temporal will automatically retry with exponential backoff, giving transient issues time to resolve.

### Step 3: Create the MCP Server File

Now you'll create an MCP server that exposes your weather forecast functionality as a tool that Claude Desktop (or any MCP client) can use. The MCP server acts as a bridge between AI applications and your durable Temporal Workflows.

The MCP server has two main responsibilities:

1. **Expose tools to MCP clients** - Define what capabilities are available and their parameters
2. **Delegate to Temporal** - When a tool is called, start a Temporal Workflow to handle the actual work

This separation of concerns means your MCP server stays lightweight and all the complexity, retry logic, and state management lives in Temporal.

#### Step 1: Set Up the MCP Server File

Create a new file called `weather.py`:

```python
from temporalio.client import Client
from fastmcp import FastMCP

# Initialize FastMCP server with a name
mcp = FastMCP("weather")
```

The `FastMCP` initialization creates an MCP server named "weather". This name will appear in Claude Desktop when you connect to the server.

#### Step 2: Define the MCP Tool

Now define the actual tool that MCP clients can call. The `@mcp.tool()` decorator registers this function as an available tool:

```python
@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
```

#### Step 3: Set Up Temporal Client Connection

Now it's time to actually call your `GetForecast` Workflow.

A [Temporal Client](https://docs.temporal.io/develop/python/temporal-client) provides a set of APIs to communicate with a Temporal Service. You can use a Temporal Client in your application to perform various operations such as:
- **Start a Workflow Execution** (like fetching a weather forecast)
- **Query the state of a running Workflow** (like checking if the forecast data has been retrieved)
- **Send signals to running Workflows** (like updating location coordinates mid-execution)
- **Get results from completed Workflows** (like retrieving the formatted weather forecast)

Call the `GetForecast` Workflow from your `get_forecast` MCP tool.

```python
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
```

:::note
The address `localhost:7233` is where your Temporal development server will be running. Port 7233 is the default port for Temporal server connections.
:::

**Breaking down the Workflow start:**

- `GetForecast` - The Workflow to execute
- `args=[latitude, longitude]` - Parameters to pass to the Workflow
- `id=f"forecast-{latitude}-{longitude}"` - A unique identifier for this Workflow execution. Using coordinates ensures that duplicate requests for the same location reuse the existing Workflow instead of starting a new one
- `task_queue="weather-task-queue"` - The queue name where this Workflow will be picked up for execution (we'll configure this in the next step)

**About `handle.result()`:**

This waits for the Workflow to complete and returns the result. The MCP server will wait here until the Workflow finishes—whether that takes 1 second or 1 hour. 

#### Step 5: Configure the Server Transport

Finally, add the code to run the MCP server when the script is executed:

```python
if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='stdio')
```

`transport='stdio'` - Uses standard input/output for communication. This is the recommended transport for local MCP servers that Claude Desktop will run as a subprocess.

<details>
<summary>
Your complete <code>weather.py</code> should look like this:
</summary>

```python
from temporalio.client import Client
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
    mcp.run(transport='stdio')
```
</details>

### Step 4: Run Your Worker

When you start a Workflow in Temporal, it generates tasks that are placed into a queue called a Task Queue. [Workers](https://docs.temporal.io/workers) continuously poll this queue, pick up available tasks, and execute them. Your Workflow progresses as Workers complete each task. Think of it as the "engine" that powers your Temporal application.

Create a new file called `worker.py` and let's build it step by step:

#### Step 1: Import Dependencies:

```
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from activities import make_nws_request
from workflow import GetForecast
```

#### Step 2: Create the Worker Function

```python
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
```

#### Step 3: Add the Entry Point

```python
if __name__ == "__main__":
    asyncio.run(main())
```

This starts the Worker when you run the file.

<details>
<summary>
Your complete <code>worker.py</code> should look like this:
</summary>

```python
import asyncio
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
    asyncio.run(main())
```
</details>

### Step 5: Run Your Application

With your code complete and Claude Desktop configured, let's start your application. You need two terminal windows running:

#### Terminal 1 - Start the Temporal Server

The first step is to make sure you have a local Temporal Service running. Open a terminal window and start the service:

```bash
temporal server start-dev
```

As you will see in the command line output, your Temporal Server should now be running on `http://localhost:8233`. When you first access this server, you should see zero Workflows running.

Keep this terminal running throughout the tutorial.

#### Terminal 2 - Start Your Worker

In a new terminal window, navigate to your project directory and start the Worker:

```bash
uv run worker.py
```

You should see output indicating the Worker has started and is listening on the `weather-task-queue` task queue. Keep this terminal running - the Worker needs to be active to execute your Workflows.

### Step 6: Configure Claude Desktop

Claude Desktop has a built-in MCP client. Once you've connected your MCP server, Claude Desktop can discover the tools you've made available. To connect Claude Desktop your weather MCP server, let's set up a `claude_desktop_config.json` file.

Create a `claude_desktop_config.json` file at the root of your directory:

```json
{
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
  }
```

1. Replace `/Users/yourname/path/to/edu-durable-mcp-tutorial-template` with your actual project path.

2. Copy this config file to Claude Desktop's configuration directory:
```bash
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

3. Completely quit and restart Claude Desktop for the changes to take effect.
   - On macOS: Right-click the Claude icon in the dock and select "Quit"
   - On Windows: Right-click the system tray icon and select "Exit"

### Step 7: Test the Integration

Now let's test your durable MCP tool!

#### Verify the Connection

1. Open Claude Desktop
2. When you open Claude Desktop, click on the icon to the right of the plus sign button. You should now see your configured MCP server (e.g., weather) on your Claude Desktop and the blue toggle should be switched on.

<a href="https://camo.githubusercontent.com/dff311b777f64a5e0895259250018e6cddc59ea478dc34c2c5e7d44d0a8c34f1/68747470733a2f2f692e706f7374696d672e63632f386b576a4d39536d2f636c617564652d6465736b746f702d6d63702d7365727665722d636f6e666967757265642e706e67" target="_blank"><img src="https://camo.githubusercontent.com/dff311b777f64a5e0895259250018e6cddc59ea478dc34c2c5e7d44d0a8c34f1/68747470733a2f2f692e706f7374696d672e63632f386b576a4d39536d2f636c617564652d6465736b746f702d6d63702d7365727665722d636f6e666967757265642e706e67" alt="Temporal Web UI showing completed workflow" /></a>

#### Test the Weather Tool

1. In Claude Desktop, start a new conversation
2. Ask: **"What's the weather forecast for San Francisco, CA?"**
3. Claude will analyze your request and determine it needs the `get_forecast` tool
4. You'll see a prompt asking for permission to use the tool - click **"Allow"**

<a href="https://i.postimg.cc/W4HtBTp0/allow-tool-use.png" target="_blank"><img src="https://i.postimg.cc/W4HtBTp0/allow-tool-use.png" alt="Temporal Web UI showing completed workflow" /></a>

5. Claude will call the tool with the latitude and longitude for San Francisco.

#### Observe the Workflow in Temporal

Temporal provides a robust [Web UI](https://docs.temporal.io/web-ui) for managing Workflow Executions. You can:

- Gain insights like responses from Activities, execution time, and failures
- Debug and understand what's happening during your Workflow Executions

Access the Web UI at `http://localhost:8233` when running the Temporal development server, and you should see that your Workflow Execution has completed successfully.

<a href="https://i.postimg.cc/XvGnyF3c/weather-workflow-execution.png" target="_blank"><img src="https://i.postimg.cc/XvGnyF3c/weather-workflow-execution.png" alt="Temporal Web UI showing completed workflow" /></a>

See if you can you locate the following items on the Web UI:

- The name of the Task Queue
- The name of the Activities called
- The inputs and outputs of the called Activities
- The inputs and outputs of the Workflow Execution

**Try More Locations!**

Test the tool with different cities:
- "What's the weather in New York City?"
- "Get me the forecast for Seattle, WA"
- "What's the weather like in Austin, Texas?"

Each request will create a new Workflow execution that you can observe in the Temporal Web UI.

You're now done with the tutorial. Feel free to continue on to see Temporal's durability in action and experience how it recovers from failures.

### (Optional) Testing Durability: Quit Claude Desktop During Execution

Let's demonstrate Temporal's durability. We'll show that Workflows continue running even when the client disconnects.

#### Step 1: Increase the Workflow Sleep Time

First, let's make the Workflow take longer so we have time to quit Claude Desktop while it's running. Open `workflow.py` and change the sleep duration:

```python
# Change this line:
await workflow.sleep(10)

# To this:
await workflow.sleep(60)  # 60 seconds
```

Save this file, and restart your Worker for the changes to take effect:

1. In the Worker terminal, press `Ctrl+C` to stop it
2. Run `uv run worker.py` again to restart it with the updated code

#### Step 2: Start a Weather Request

1. In Claude Desktop, ask for the weather in any location: **"What's the weather in Denver, Colorado?"**
2. Click **"Allow"** when prompted to use the tool
3. Claude will show that it's waiting for the tool response

#### Step 3: Quit Claude Desktop While the Workflow is Running

Immediately after allowing the tool use:

1. **Completely quit Claude Desktop** (don't just close the window)
   - On macOS: Right-click the Claude icon in the dock and select "Quit"
   - On Windows: Right-click the system tray icon and select "Exit"

2. The MCP server will disconnect, but check your terminals—the Worker and Temporal server are still running!

#### Step 4: Observe the Workflow Still Running

<a href="https://i.postimg.cc/GphqMJ9k/running-workflow.png" target="_blank"><img src="https://i.postimg.cc/GphqMJ9k/running-workflow.png" alt="Temporal Web UI showing completed workflow" /></a>

Notice the following:
- **Status**: The Workflow is still "Running"
- **Event History**: Shows the first Activity completed, the Workflow timer started
- **Timeline**: You can watch the 60-second sleep countdown in real-time

Even though Claude Desktop quit and the MCP server disconnected, **the Workflow continues executing in Temporal**. The Worker is still processing it. You'll then see the Workflow complete successfully—**even though the original client (Claude Desktop) disconnected halfway through**.

#### What This Demonstrates

This experiment proves several critical points:

1. **Workflows are durable** - They don't depend on the client staying connected
2. **Workers are reliable** - As long as the Worker is running, Workflows complete
3. **State is preserved** - All progress is saved, nothing is lost when clients disconnect

In a production environment, this means:

- Your MCP tools can handle long-running operations (minutes, hours, or even days)
- Network interruptions don't cause data loss or incomplete work
- Clients can disconnect and reconnect without breaking workflows
- The system is truly fault-tolerant

You've now completed this tutorial and seen the power of durable MCP tools with Temporal! Check out this [repository](https://github.com/temporalio/edu-durable-mcp-tutorial-template) that includes all the code  used for it.

## What's Next?

In our [next MCP tutorial](/tutorials/ai/building-mcp-tools-with-temporal/adding-hitl-to-mcp-tools/), we'll show you how to add **durable human-in-the-loop capabilities to your MCP tools with Temporal**. 

Sign up [here](https://pages.temporal.io/get-updates-education) to get notified when new tutorials and educational content get published.