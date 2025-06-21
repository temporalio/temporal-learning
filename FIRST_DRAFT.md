# How To Build a Durable AI Agent with Temporal Workflows and Python

### Introduction

AI agents are programs that can have conversations, make decisions, and execute tasks to achieve specific goals. 
These agents can search for information, interact with external services, and maintain context across multiple interactions. 
However, building reliable AI agents presents challenges: what happens when your agent crashes during a long conversation? 
How do you handle network failures when calling external APIs? 
How do you ensure your agent doesn't lose track of important user requests?

Traditional AI agent frameworks often struggle with these reliability concerns. 
When a system failure occurs, the agent might lose conversation history, forget partially completed tasks, or require users to start over completely. 
This creates poor user experiences and limits the practical applications of AI agents.

Temporal provides a solution to these reliability challenges. 
Temporal is a platform that orchestrates long-running, reliable applications through Workflows and Activities. 
Temporal ensures your applications can recover from failures, maintain state across restarts, and handle complex business logic with built-in retry mechanisms.

In this tutorial, you will build a complete AI agent system that combines the conversational capabilities of modern language models with the durability and reliability of Temporal Workflows. 
Your agent will be able to help users find event within a specific region (in this case North America), search for flights that would support travel to that event, and create an invoice of a simulated purchase of tickets for that flight. 
Most importantly, the agent will maintain conversation state and continue working even when components restart or fail.

In this tutorial you'll create includes several key components:

* **Tools** that can search for events, find flights, and generate invoices using mock data for demonstration purposes. 
    These tools will be provided to the Agent, which in turn will decide when to use them.
* **Temporal Workflows** that orchestrate multi-turn conversations and ensure durability across failures
* **Temporal Activities** that execute tools and language model calls with automatic retry logic
* **A web-based chat interface** built with React that allows users to interact with the agent
* **A FastAPI backend** that connects the web interface to your Temporal Workflows

By the end of this tutorial, you will have a working AI agent that can handle complex conversations, execute multiple tools in sequence, and recover gracefully from system failures. 
You'll understand how to use Temporal to build reliable AI applications that maintain state and provide consistent user experiences.

## Prerequisites

Before starting this tutorial, ensure that you have the following on your local machine:

### Required

* [The Temporal CLI development service](https://learn.temporal.io/getting_started/python/dev_environment/#set-up-a-local-temporal-service-for-development-with-temporal-cli) installed and verified.
* [Python 3.9 or higher](https://www.python.org/downloads/) installed. 
Verify your installation by running `python3 --version` in your terminal.
* The [`uv` package and project manager installed](https://docs.astral.sh/uv/getting-started/installation/). `uv` is a modern, fast Python package manager that will handle virtual environments and dependencies. 
* [Node.js 18 or higher installed](https://nodejs.org/en/download).
You can verify your installation with `node --version` and `npm --version`.
* An [OpenAI API key](https://platform.openai.com/api-keys) saved securely where you can access it.
You may need to create an [OpenAI](https://platform.openai.com/) first.
You will use this key to configure the LLM integration.

:::note

OpenAI API Keys require purchasing credits to use.
The amount needed for this tutorial is minimal.
You can succeed with this tutorial with minimal credits, in our experience < $1 will suffice.

:::

* Text editor or IDE of your choice to write code.

### Optional

You can opt to use real API services for your tools, or use provided mock functions that will also be provided. 

* A free [RapidAPI Sky Scrapper API Key](https://rapidapi.com/apiheya/api/sky-scrapper) saved securely where you can access it. You will use this to search for flights.
* A free [Stripe Account](https://stripe.com/lp/start-now) with a configured [sandbox](https://docs.stripe.com/sandboxes). You will use this to generate fake invoices for the flights that are being booked.

### Concepts

Additionally, this tutorial assumes you have basic familiarity with:

* Temporal fundamentals such as [Workflows](https://docs.temporal.io/develop/python/core-application#develop-workflows), [Activities](https://docs.temporal.io/develop/python/core-application#develop-activities), [Workers](https://docs.temporal.io/develop/python/core-application#run-a-dev-worker), [Signals](https://docs.temporal.io/develop/python/message-passing#signals), and [Queries](https://docs.temporal.io/develop/python/message-passing#queries)
* Python fundamentals such as functions, classes, async/await syntax, and virtual environments
* Command line interface and running commands in terminal or command prompt  
* REST API concepts including HTTP requests and JSON responses
* How to set and use environment variables in your operating system

## Step 1 — Setting up the development environment

Before you start coding, you need to set up your Python developer environment.
In this step, you will set up your project structure, install the necessary Python packages, and configure the Python environment needed to build your AI agent.

First, create a directory for your project and navigate into it:

```command
mkdir temporal-ai-agent
cd temporal-ai-agent
```

Next, initialize a new Python project using uv:

```command
uv init
```

`uv` is a modern Python project and packaging tool that sets up a project structure for  you.
Running this command creates the following default Python package structure for you:

```
.git
.gitignore
.python-version
README.md
main.py
pyproject.toml
```

It automatically runs a `git init` command for you, provides you with the default `.gitignore` for Python, creates a `.python-version` file that contains the project's default Python version, a README.md, a Hello World `main.py` program, and a `pyproject.toml` file for managing the projects packages and environment.

Next, create your virtual environment by running the following command:

```bash
uv venv
```

This creates a virtual environment named `.venv` in the current working directory.

Now that you have a virtual environment created, add the dependencies needed to build your AI agent system:

```command
uv add python-dotenv fastapi jinja2 litellm stripe temporalio uvicorn requests
```

This installs all the necessary packages:
- `python-dotenv` - For loading environment variables from a `.env` file
- `fastapi` and `uvicorn` - Web framework and server for the API backend
- `jinja2` - Template engine
- `litellm` - Unified interface for different language model providers
- `stripe` - Payment processing library for invoice generation demo
- `temporalio` - The Temporal Python SDK
- `requests` - HTTP library for API calls

Create a `.env` file to store your configuration:

```command
nano .env
```

Add your OpenAI API key and other configuration:

```bash
# LLM Configuration
LLM_MODEL=openai/gpt-4o
LLM_KEY=YOUR_OPEN_API_KEY

# Agent Configuration  
SHOW_CONFIRM=True

# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=agent-task-queue
```

Replace `YOUR_OPEN_API_KEY` with your OpenAI API key. 
The `SHOW_CONFIRM=True` setting enables tool confirmation prompts during development, which helps you see what the agent is doing step by step.

At this point, your development environment is configured with:
- A Python project managed by uv with all required dependencies
- Environment variables for API keys and configuration

## Step 2 — Implementing AI agent tools

In this step, you will create the tools that define your agent's capabilities. These tools enable your agent to search for events, find flights, and create invoices while providing the language model with clear descriptions of when and how to use each capability.

### Understanding the agent tool system challenge

AI agents need specific capabilities to accomplish user goals, but these capabilities must be described in a way that language models can understand and use appropriately. 
The challenge is creating tools that are both functionally useful and semantically clear to an AI system.

Your agent needs to combine multiple tools into coherent workflows - finding events in cities, searching for flights to those locations, and generating invoices for bookings. 
Each tool must handle both real API integrations and demonstration data, allowing development without requiring external service credentials.

### Creating the tools directory structure

Create the directory for your tools system:

```command
mkdir tools
cd tools
```

### Building tool definitions for language models

The first challenge is describing your tools to language models in a structured way that enables intelligent decision-making about when and how to use each tool.

Open your text editor and create `tool_registry.py` with the language model interface definitions:

```python
from models.core import ToolArgument, ToolDefinition

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
```

This tool definition provides the language model with detailed information about flight search capabilities. 
The description explains not just what the tool does, but includes behavioral guidance like "ALWAYS ask the user if ok" for date suggestions. 
Each argument includes semantic descriptions that help the language model understand how to extract the right information from conversation context.

Continue building the tool definitions by adding the invoice creation tool:

```python
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
```

The invoice tool definition demonstrates how to guide language models to infer information from conversation context. 
Rather than requiring explicit user input for all fields, the descriptions tell the language model to extract amounts and details from previous conversation turns.

Add the event discovery tool:

```python
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
```

The event tool definition includes important constraints that help the language model set appropriate user expectations. 
It explicitly states geographic limitations ("North America only") and explains search behavior ("1 month either side").

### Creating the tool handler registry

The next challenge is mapping tool names to their implementation functions in a way that supports dynamic dispatch during workflow execution.

Create `__init__.py` with the tool handler system:

```python
from typing import Any, Callable, Dict

from .create_invoice import create_invoice
from .find_events import find_events
from .search_flights import search_flights

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

    return TOOL_HANDLERS[tool_name]
```

This registry system provides centralized tool management with runtime dispatch capabilities. 
The `get_handler` function enables your Temporal Activities to execute any tool by name, supporting the dynamic tool execution pattern essential for flexible agent systems.

### Implementing event discovery with intelligent date handling

The event discovery tool needs to handle fuzzy date queries and provide relevant results even when users specify approximate timeframes.

Create `find_events.py` with the event search implementation:

```python
import json
from datetime import date, datetime
from pathlib import Path


def find_events(args: dict) -> dict:
    search_city = args.get("city", "").lower()
    search_month = args.get("month", "").capitalize()

    file_path = Path(__file__).resolve().parent / "data" / "find_events_data.json"
    if not file_path.exists():
        return {"error": "Data file not found."}

    try:
        month_number = datetime.strptime(search_month, "%B").month
    except ValueError:
        return {"error": "Invalid month provided."}
```

The function starts by processing and validating user input, converting month names to numbers for computational processing. 
It uses robust error handling to provide clear feedback when inputs are invalid.

Add the intelligent date range logic:

```python
    # Helper to wrap months into [1..12]
    def get_adjacent_months(m):
        prev_m = 12 if m == 1 else (m - 1)
        next_m = 1 if m == 12 else (m + 1)
        return [prev_m, m, next_m]

    valid_months = get_adjacent_months(month_number)
    current_date = date.today()
```

This helper function implements the "search 1 month either side" behavior described in the tool definition. 
It handles year wraparound correctly, ensuring December is followed by January and vice versa.

Complete the event search with data processing and date adjustment:

```python
    matching_events = []
    with open(file_path) as f:
        data = json.load(f)
    for city_name, events in data.items():
        if search_city and search_city not in city_name.lower():
            continue

        for event in events:
            date_from = datetime.strptime(event["dateFrom"], "%Y-%m-%d").date()
            date_to = datetime.strptime(event["dateTo"], "%Y-%m-%d").date()

            # Check if event has already passed and adjust year if needed
            if date_from < current_date:
                # Increment year by 1 for both dates
                date_from = date_from.replace(year=current_date.year + 1)
                date_to = date_to.replace(year=current_date.year + 1)

            # If the event's start or end month is in our valid months
            if date_from.month in valid_months or date_to.month in valid_months:
                # Add metadata explaining how it matches
                if date_from.month == month_number or date_to.month == month_number:
                    month_context = "requested month"
                elif (
                    date_from.month == valid_months[0]
                    or date_to.month == valid_months[0]
                ):
                    month_context = "previous month"
                else:
                    month_context = "next month"

                matching_events.append(
                    {
                        "city": city_name,
                        "eventName": event["eventName"],
                        "dateFrom": date_from.strftime("%Y-%m-%d"),
                        "dateTo": date_to.strftime("%Y-%m-%d"),
                        "description": event["description"],
                        "month": month_context,
                    }
                )

    # Add top-level metadata if you wish
    return {
        "note": f"Returning events from {search_month} plus one month either side (i.e., {', '.join(datetime(2025, m, 1).strftime('%B') for m in valid_months)}).",
        "events": matching_events,
    }
```

The search logic includes intelligent date adjustment that moves past events to the next year, ensuring users always see relevant future events. 
It also adds contextual metadata explaining why each event was included, helping users understand the search results.

### Building flexible flight search with API integration

The flight search tool needs to handle both real API integration for production use and intelligent mock data generation for development.

Create `search_flights.py`, starting with the API integration functions:

```python
import json
import os
import random

import requests
from dotenv import load_dotenv


def search_airport(query: str) -> list:
    """
    Returns a list of matching airports/cities from sky-scrapper's searchAirport endpoint.
    """
    load_dotenv(override=True)
    api_key = os.getenv("RAPIDAPI_KEY", "YOUR_DEFAULT_KEY")
    api_host = os.getenv("RAPIDAPI_HOST_FLIGHTS", "sky-scrapper.p.rapidapi.com")

    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": api_host,
    }

    # Sanitize the query to ensure it is URL-safe
    print(f"Searching for: {query}")
    url = f"https://{api_host}/api/v1/flights/searchAirport"
    params = {"query": query, "locale": "en-US"}

    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code != 200:
            print(f"Error: API responded with status code {response.status_code}")
            print(f"Response: {response.text}")
            return []

        return response.json().get("data", [])
    except requests.RequestException as e:
        print(f"Request error: {e}")
        return []
    except json.JSONDecodeError:
        print("Error: Failed to decode JSON response")
        print(f"Response: {response.text}")
        return []
```

This airport search function demonstrates robust API integration patterns with comprehensive error handling. 
It includes detailed logging for debugging API issues and graceful fallback behavior when services are unavailable.

Add the real flight search API implementation:

```python
def search_flights_real_api(
    args: dict,
) -> dict:  # rename to search_flights to use the real API
    """
    1) Looks up airport/city codes via search_airport.
    2) Finds the first matching skyId/entityId for both origin & destination.
    3) Calls the flight search endpoint with those codes.
    """
    date_depart = args.get("dateDepart")
    date_return = args.get("dateReturn")
    origin_query = args.get("origin", "")
    dest_query = args.get("destination", "")

    # Step 1: Resolve skyIds
    origin_candidates = search_airport(origin_query)
    destination_candidates = search_airport(dest_query)

    if not origin_candidates or not destination_candidates:
        return {"error": "No matches found for origin/destination"}

    origin_params = origin_candidates[0]["navigation"]["relevantFlightParams"]
    dest_params = destination_candidates[0]["navigation"]["relevantFlightParams"]

    origin_sky_id = origin_params["skyId"]  # e.g. "LOND"
    origin_entity_id = origin_params["entityId"]  # e.g. "27544008"
    dest_sky_id = dest_params["skyId"]  # e.g. "NYCA"
    dest_entity_id = dest_params["entityId"]  # e.g. "27537542"
```

The real API implementation follows a two-step process: first resolving city names to airport codes, then using those codes for flight searches. 
This approach handles the complexity of airline booking systems while providing a simple interface for language models.

<CLAUDE_HELP>The complete flight search implementation includes a complex API response processing system (about 200 more lines) that extracts flight details, filters by unique carriers, and formats results. Should I break this down into smaller code sandwich sections or include the complete function for reference?</CLAUDE_HELP>

For demonstration purposes, the tool also includes intelligent mock data generation. Add the smart mock flight generation:

```python
def generate_smart_flights(origin: str, destination: str) -> list:
    """
    Generate realistic flight options with smart pricing based on origin and destination.
    """
    # Common airlines for different regions
    airlines_by_region = {
        "domestic_us": [
            {"name": "American Airlines", "code": "AA"},
            {"name": "United Airlines", "code": "UA"},
            {"name": "Delta Airlines", "code": "DL"},
            {"name": "Southwest Airlines", "code": "WN"},
        ],
        "international": [
            {"name": "American Airlines", "code": "AA"},
            {"name": "United Airlines", "code": "UA"},
            {"name": "Delta Airlines", "code": "DL"},
            {"name": "Air New Zealand", "code": "NZ"},
            {"name": "Qantas", "code": "QF"},
            {"name": "Singapore Airlines", "code": "SQ"},
        ],
    }

    # Determine route type and base pricing
    origin_lower = origin.lower()
    dest_lower = destination.lower()

    us_cities = [
        "los angeles", "lax", "san francisco", "sfo", "new york", "nyc", "jfk", 
        "chicago", "ord", "miami", "mia",
    ]

    is_origin_us = any(city in origin_lower for city in us_cities)
    is_dest_us = any(city in dest_lower for city in us_cities)

    if is_origin_us and is_dest_us:
        # US domestic
        airline_pool = airlines_by_region["domestic_us"]
        base_price = random.randint(200, 800)
    else:
        # International
        airline_pool = airlines_by_region["international"]
        base_price = random.randint(800, 1500)

    # Generate 3-4 flight options with realistic pricing
    num_flights = random.randint(3, 4)
    results = []
    used_airlines = set()

    for i in range(num_flights):
        available_airlines = [a for a in airline_pool if a["name"] not in used_airlines]
        if not available_airlines:
            available_airlines = airline_pool

        airline = random.choice(available_airlines)
        used_airlines.add(airline["name"])

        # Generate realistic flight numbers and pricing variations
        outbound_num = random.randint(100, 999)
        return_num = random.randint(100, 999)
        
        price_variation = random.uniform(0.9, 1.1)
        final_price = round(base_price * price_variation, 2)

        results.append({
            "operating_carrier": airline["name"],
            "outbound_flight_code": f"{airline['code']}{outbound_num}",
            "price": final_price,
            "return_flight_code": f"{airline['code']}{return_num}",
            "return_operating_carrier": airline["name"],
        })

    results.sort(key=lambda x: x["price"])
    return results
```

The mock data generation demonstrates sophisticated simulation that produces realistic flight options. It considers route types, airline availability by region, and realistic pricing patterns to create believable demonstration data.

Complete the flight search with the main dispatch function:

```python
def search_flights(args: dict) -> dict:
    """
    Search for flights. Uses real API if RAPIDAPI_KEY is available, otherwise generates smart mock data.
    """
    load_dotenv(override=True)
    api_key = os.getenv("RAPIDAPI_KEY")

    origin = args.get("origin")
    destination = args.get("destination")

    if not origin or not destination:
        return {"error": "Both origin and destination are required"}

    # If API key is available, use the real API
    if api_key and api_key != "YOUR_DEFAULT_KEY":
        return search_flights_real_api(args)

    # Otherwise, generate smart mock data
    results = generate_smart_flights(origin, destination)

    return {
        "currency": "USD",
        "destination": destination,
        "origin": origin,
        "results": results,
    }
```

This dispatch pattern enables seamless transition between development and production environments. 
The tool automatically detects API key availability and chooses the appropriate implementation, ensuring the agent works consistently regardless of external service configuration.

### Implementing invoice creation with payment integration

The invoice tool needs to handle real payment processor integration while providing demonstration capabilities for development.

Create `create_invoice.py` with the Stripe integration system:

```python
import os

from dotenv import load_dotenv


def ensure_customer_exists(
    customer_id: str = "", email: str = "default@example.com"
) -> str:
    """Ensure a Stripe customer exists; create one if not."""
    import stripe

    if customer_id != "":
        try:
            stripe.Customer.retrieve(customer_id)
            return customer_id
        except stripe.InvalidRequestError:
            # Customer ID is invalid or doesn't exist
            pass

    # Create a new customer if no valid customer_id
    customer = stripe.Customer.create(email=email)
    return customer.id
```

The customer management function demonstrates defensive programming for payment systems. 
It validates existing customer IDs and creates new customers when needed, ensuring invoice generation always has a valid target.

Add the main invoice creation function:

```python
def create_invoice(args: dict) -> dict:
    """Create and finalize a Stripe invoice."""
    import stripe

    load_dotenv(override=True)  # Load environment variables from a .env file

    stripe.api_key = os.getenv("STRIPE_API_KEY")
    # If an API key exists in the env file, find or create customer
    if stripe.api_key is not None and stripe.api_key != "":
        customer_id = ensure_customer_exists(
            args.get("customer_id", ""), args.get("email", "default@example.com")
        )

        # Get amount and convert to cents
        amount = args.get("amount", 200.00)  # Default to $200.00
        try:
            amount_cents = int(float(amount) * 100)
        except (TypeError, ValueError):
            return {"error": "Invalid amount provided. Please confirm the amount."}

        # Create an invoice item
        stripe.InvoiceItem.create(
            customer=customer_id,
            amount=amount_cents,
            currency="usd",
            description=args.get("tripDetails", "Service Invoice"),
        )

        # Create and finalize the invoice
        invoice = stripe.Invoice.create(
            customer=customer_id,
            collection_method="send_invoice",  # Invoice is sent to the customer
            days_until_due=args.get("days_until_due", 7),  # Default due date: 7 days
            pending_invoice_items_behavior="include",  # No pending invoice items
        )

        finalized_invoice = stripe.Invoice.finalize_invoice(invoice.id)

        return {
            "invoiceStatus": finalized_invoice.status,
            "invoiceURL": finalized_invoice.hosted_invoice_url,
            "reference": finalized_invoice.number,
        }
    # if no API key is in the env file, return dummy info
    else:
        print("[CreateInvoice] Creating invoice with:", args)
        return {
            "invoiceStatus": "generated",
            "invoiceURL": "https://pay.example.com/invoice/12345",
            "reference": "INV-12345",
        }
```

The invoice creation function demonstrates the same development-to-production pattern as the flight search. 
It includes proper currency conversion (dollars to cents), comprehensive error handling for invalid amounts, and realistic demonstration responses for development.

### Creating comprehensive event data

Your event discovery tool requires demonstration data for North American cities. 
Create the data directory and event information:

```command
mkdir data
```

<CLAUDE_HELP>The events data file contains approximately 1954 lines of comprehensive event data for major North American cities including New York, Los Angeles, Chicago, Toronto, and many others. Each event includes event names, dates, locations, and descriptions. Should I include a representative sample in the tutorial or instruct readers to create this data file separately?</CLAUDE_HELP>

The event data file should contain JSON data with event listings for major North American cities. 
The data structure includes event names, dates, locations, and descriptions organized by city. 
This provides your agent with realistic demonstration data for event discovery.

### Combining tools into agent workflows

The final component combines individual tools into cohesive agent workflows that guide multi-step interactions.

Create `goal_registry.py` with the complete workflow definition:

```python
import tools.tool_registry as tool_registry
from models.core import AgentGoal

goal_event_flight_invoice = AgentGoal(
    id="goal_event_flight_invoice",
    category_tag="travel-flights",
    agent_name="North America Event Flight Booking",
    agent_friendly_description="Book a trip to a city in North America around the dates of events in that city.",
    tools=[
        tool_registry.find_events_tool,
        tool_registry.search_flights_tool,
        tool_registry.create_invoice_tool,
    ],
    description="Help the user gather args for these tools in order: "
    "1. FindEvents: Find an event to travel to "
    "2. SearchFlights: search for a flight around the event dates "
    "3. CreateInvoice: Create a simple invoice for the cost of that flight ",
    starter_prompt="Welcome me, give me a description of what you can do, then ask me for the details you need to do your job.",
    example_conversation_history="\n ".join(
        [
            "user: I'd like to travel to an event",
            "agent: Sure! Let's start by finding an event you'd like to attend. I know about events in North American cities. Could you tell me which city and month you're interested in?",
            "user: sydney in may please",
            "agent: Great! Let's find an events in New York City in May.",
            "user_confirmed_tool_run: <user clicks confirm on FindEvents tool>",
            "tool_result: { 'event_name': 'Vivid New York City', 'event_date': '2023-05-01' }",
            "agent: Found an event! There's Vivid New York City on May 1 2025, ending on May 14 2025. Would you like to search for flights around these dates?",
            "user: Yes, please",
            "agent: Let's search for flights around these dates. Could you provide your departure city?",
            "user: San Francisco",
            "agent: Thanks, searching for flights from San Francisco to New York City around 2023-02-25 to 2023-02-28.",
            "user_confirmed_tool_run: <user clicks confirm on SearchFlights tool>"
            'tool_result: results including {"flight_number": "CX101", "return_flight_number": "CX102", "price": 850.0}',
            "agent: Found some flights! The cheapest is CX101 for $850. Would you like to generate an invoice for this flight?",
            "user_confirmed_tool_run: <user clicks confirm on CreateInvoice tool>",
            'tool_result: { "status": "success", "invoice": { "flight_number": "CX101", "amount": 850.0 }, invoiceURL: "https://example.com/invoice" }',
            "agent: Invoice generated! Here's the link: https://example.com/invoice",
        ]
    ),
)
```

This goal definition demonstrates how to combine individual tools into cohesive agent workflows. 
It includes step-by-step guidance for the language model, example conversation patterns, and clear behavioral expectations for multi-turn interactions.

### Bringing it all together

Your complete tools implementation provides the foundation for intelligent agent behavior. Here are the complete files:

**Tool Registry (`tool_registry.py`):**
```python
from models.core import ToolArgument, ToolDefinition

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
```

**Tool Handler Registry (`__init__.py`):**
```python
from typing import Any, Callable, Dict

from .create_invoice import create_invoice
from .find_events import find_events
from .search_flights import search_flights

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

    return TOOL_HANDLERS[tool_name]
```

This tools implementation demonstrates key patterns for building capable AI agents: structured tool definitions for language model understanding, flexible implementation supporting both development and production, and workflow composition that guides multi-step interactions toward successful completion.

In the next step, you will create Temporal Activities that wrap these tools with durability and retry logic.

## Step 4 — Building Temporal Activities

In this step, you will create Activities that wrap your AI agent tools with durability and retry logic. 
Temporal Activities handle external system interactions like language model calls and tool execution, providing automatic recovery when failures occur.

### Understanding the durability challenge

Your AI agent needs to make multiple external calls during each conversation - validating user input with language models, executing tools that search for flights or events, and generating responses. 
Each of these calls can fail due to network issues, API rate limits, or temporary service outages. 
Without proper handling, a single failure would restart the entire conversation from the beginning.

Activities solve this problem by providing durability boundaries around external operations. 
When an Activity fails, Temporal automatically retries it without affecting the broader Workflow state. 
This means your agent can recover from temporary failures while maintaining the conversation context.

### Creating the data models

Your Activities require specific data structures for input and output. 
Start by creating the models directory and the core data types:

```command
mkdir models
```

Open your text editor and create `models/core.py` with the fundamental data structures:

```python
from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Union

# Common type aliases

Message = Dict[str, Union[str, Dict[str, Any]]]
ConversationHistory = Dict[str, List[Message]]
NextStep = Literal["confirm", "question", "pick-new-goal", "done"]
CurrentTool = str
```

These type aliases define the basic data structures your agent uses for conversation management. 
`Message` represents individual conversation messages, `ConversationHistory` stores the entire conversation state, and `NextStep` defines the possible agent actions.

Next, add the tool and goal definitions:

```python
@dataclass
class ToolArgument:
    name: str
    type: str
    description: str


@dataclass
class ToolDefinition:
    name: str
    description: str
    arguments: List[ToolArgument]


@dataclass
class AgentGoal:
    id: str
    category_tag: str
    agent_name: str
    agent_friendly_description: str
    tools: List[ToolDefinition]
    description: str = "Description of the tools purpose and overall goal"
    starter_prompt: str = "Initial prompt to start the conversation"
    example_conversation_history: str = (
        "Example conversation history to help the AI agent understand the context of the conversation"
    )
```

These dataclasses define how your agent understands its capabilities. 
`ToolArgument` describes individual tool parameters, `ToolDefinition` defines complete tools with their descriptions and arguments, and `AgentGoal` combines multiple tools into cohesive workflows.

Now create `models/requests.py` for Activity input and output structures:

```python
from dataclasses import dataclass, field
from typing import Any, Deque, Dict, Optional, TypedDict

from models.core import AgentGoal, ConversationHistory, NextStep


class ToolData(TypedDict, total=False):
    next: NextStep
    tool: str
    response: str
    args: Dict[str, Any]
    force_confirm: bool
```

The `ToolData` TypedDict defines the structure for tool execution results. 
It includes the next step to take, tool information, response content, arguments, and confirmation requirements.

Add the Activity input structures:

```python
@dataclass
class AgentGoalWorkflowParams:
    conversation_summary: Optional[str] = None
    prompt_queue: Optional[Deque[str]] = None


@dataclass
class CombinedInput:
    tool_params: AgentGoalWorkflowParams
    agent_goal: AgentGoal


@dataclass
class ToolPromptInput:
    prompt: str
    context_instructions: str


@dataclass
class ValidationInput:
    prompt: str
    conversation_history: ConversationHistory
    agent_goal: AgentGoal
```

These dataclasses structure the inputs your Activities receive. 
`ToolPromptInput` carries prompts and context for language model calls, while `ValidationInput` provides all the information needed to validate user input against conversation context.

Complete the file with output structures:

```python
@dataclass
class ValidationResult:
    validationResult: bool
    validationFailedReason: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EnvLookupInput:
    show_confirm_env_var_name: str
    show_confirm_default: bool


@dataclass
class EnvLookupOutput:
    show_confirm: bool
```

Finally, create an empty `models/__init__.py` file to make the directory a Python package:

```command
touch models/__init__.py
```

### Creating the Activities directory

Create the directory structure for your Activities:

```command
mkdir activities
```

### Understanding the ToolActivities class structure

Open your text editor and create `activities/tool_activities.py`. 
Start with the imports and class initialization:

```python
import inspect
import json
import os
from datetime import datetime
from typing import Sequence

from dotenv import load_dotenv
from litellm import completion
from temporalio import activity
from temporalio.common import RawValue

from models.requests import (
    EnvLookupInput,
    EnvLookupOutput,
    ToolPromptInput,
    ValidationInput,
    ValidationResult,
)

load_dotenv(override=True)


class ToolActivities:
    def __init__(self):
        """Initialize LLM client using LiteLLM."""
        self.llm_model = os.environ.get("LLM_MODEL", "openai/gpt-4")
        self.llm_key = os.environ.get("LLM_KEY")
        self.llm_base_url = os.environ.get("LLM_BASE_URL")
        activity.logger.info(
            f"Initializing ToolActivities with LLM model: {self.llm_model}"
        )
        if self.llm_base_url:
            activity.logger.info(f"Using custom base URL: {self.llm_base_url}")
```

This initialization pattern loads language model configuration from environment variables, supporting different LLM providers through LiteLLM. 
The class uses the Activity logger for debugging and tracks which model and base URL are configured.

### Implementing prompt validation with Activities

The first core Activity handles user input validation to maintain conversation coherence. 
This Activity prevents your agent from processing irrelevant or confusing user input.

Add the validation Activity method to your class:

```python
    @activity.defn
    async def agent_validatePrompt(
        self, validation_input: ValidationInput
    ) -> ValidationResult:
        """
        Validates the prompt in the context of the conversation history and agent goal.
        Returns a ValidationResult indicating if the prompt makes sense given the context.
        """
        # Create simple context string describing tools and goals
        tools_description = []
        for tool in validation_input.agent_goal.tools:
            tool_str = f"Tool: {tool.name}\n"
            tool_str += f"Description: {tool.description}\n"
            tool_str += "Arguments: " + ", ".join(
                [f"{arg.name} ({arg.type})" for arg in tool.arguments]
            )
            tools_description.append(tool_str)
        tools_str = "\n".join(tools_description)
```

The validation Activity first builds a comprehensive context description that includes all available tools and their argument specifications. 
This context helps the language model understand what capabilities are available to the agent.

Continue the validation method by adding conversation context:

```python
        # Convert conversation history to string
        history_str = json.dumps(validation_input.conversation_history, indent=2)

        # Create context instructions
        context_instructions = f"""The agent goal and tools are as follows:
            Description: {validation_input.agent_goal.description}
            Available Tools:
            {tools_str}
            The conversation history to date is:
            {history_str}"""
```

The Activity then combines the tool descriptions with the conversation history to create complete context instructions. 
This gives the language model full visibility into the current conversation state and agent capabilities.

Add the validation prompt construction:

```python
        # Create validation prompt
        validation_prompt = f"""The user's prompt is: "{validation_input.prompt}"
            Please validate if this prompt makes sense given the agent goal and conversation history.
            If the prompt makes sense toward the goal then validationResult should be true.
            If the prompt is wildly nonsensical or makes no sense toward the goal and current conversation history then validationResult should be false.
            If the response is low content such as "yes" or "that's right" then the user is probably responding to a previous prompt.  
             Therefore examine it in the context of the conversation history to determine if it makes sense and return true if it makes sense.
            Return ONLY a JSON object with the following structure:
                "validationResult": true/false,
                "validationFailedReason": "If validationResult is false, provide a clear explanation to the user in the response field 
                about why their request doesn't make sense in the context and what information they should provide instead.
                validationFailedReason should contain JSON in the format
                {{
                    "next": "question",
                    "response": "[your reason here and a response to get the user back on track with the agent goal]"
                }}
                If validationResult is true (the prompt makes sense), return an empty dict as its value {{}}"
            """

        # Call the LLM with the validation prompt
        prompt_input = ToolPromptInput(
            prompt=validation_prompt, context_instructions=context_instructions
        )

        result = await self.agent_toolPlanner(prompt_input)

        return ValidationResult(
            validationResult=result.get("validationResult", False),
            validationFailedReason=result.get("validationFailedReason", {}),
        )
```

The validation prompt provides specific instructions for the language model to evaluate user input against the conversation context. 
It handles edge cases like simple confirmations ("yes") and provides structured guidance for invalid inputs.

### Building the language model integration Activity

The core language model Activity handles all interactions with your chosen LLM provider, including error handling and response processing. 
Add this method to your class:

```python
    @activity.defn
    async def agent_toolPlanner(self, input: ToolPromptInput) -> dict:
        messages = [
            {
                "role": "system",
                "content": input.context_instructions
                + ". The current date is "
                + datetime.now().strftime("%B %d, %Y"),
            },
            {
                "role": "user",
                "content": input.prompt,
            },
        ]
```

The toolPlanner Activity constructs standard OpenAI-format messages with system context and user input. 
It automatically includes the current date, which helps the language model provide accurate responses for time-sensitive queries.

Continue the method with the LLM call implementation:

```python
        try:
            completion_kwargs = {
                "model": self.llm_model,
                "messages": messages,
                "api_key": self.llm_key,
            }

            # Add base_url if configured
            if self.llm_base_url:
                completion_kwargs["base_url"] = self.llm_base_url

            response = completion(**completion_kwargs)

            response_content = response.choices[0].message.content
            activity.logger.info(f"LLM response: {response_content}")

            # Use the new sanitize function
            response_content = self.sanitize_json_response(response_content)

            return self.parse_json_response(response_content)
        except Exception as e:
            activity.logger.error(f"Error in LLM completion: {str(e)}")
            raise
```

The Activity uses LiteLLM to make the language model call with proper configuration. 
LiteLLM enables your agent to work with different providers (OpenAI, Anthropic, local models) through a unified interface. 
The Activity logs all responses for debugging conversation flows and includes robust error handling that catches and logs failures while re-raising exceptions for Temporal to handle retry logic.

### Processing language model responses

The Activities class includes utility methods for handling language model response formatting. Add these methods to your class:

```python
    def sanitize_json_response(self, response_content: str) -> str:
        """
        Sanitizes the response content to ensure it's valid JSON.
        """
        # Remove any markdown code block markers
        response_content = response_content.replace("```json", "").replace("```", "")

        # Remove any leading/trailing whitespace
        response_content = response_content.strip()

        return response_content

    def parse_json_response(self, response_content: str) -> dict:
        """
        Parses the JSON response content and returns it as a dictionary.
        """
        try:
            data = json.loads(response_content)
            return data
        except json.JSONDecodeError as e:
            activity.logger.error(f"Invalid JSON: {e}")
            raise
```

These utility methods handle common issues with language model outputs. 
The sanitize method removes markdown formatting that models sometimes include, while the parse method provides clear error handling for invalid JSON responses.

### Managing environment configuration deterministically

Temporal Workflows must be deterministic, which means they cannot directly access environment variables. 
This Activity provides deterministic environment access. 
Add this method to your class:

```python
    @activity.defn
    async def get_wf_env_vars(self, input: EnvLookupInput) -> EnvLookupOutput:
        """gets env vars for workflow as an activity result so it's deterministic
        handles default/None
        """
        output: EnvLookupOutput = EnvLookupOutput(
            show_confirm=input.show_confirm_default
        )
        show_confirm_value = os.getenv(input.show_confirm_env_var_name)
        if show_confirm_value is None:
            output.show_confirm = input.show_confirm_default
        elif show_confirm_value is not None and show_confirm_value.lower() == "false":
            output.show_confirm = False
        else:
            output.show_confirm = True

        return output
```

This Activity safely retrieves environment variables and returns them as Activity results, which Workflows can access deterministically. 
It handles the specific case of boolean environment variables with proper default values.

### Implementing dynamic tool execution

The final Activity enables runtime execution of any tool from your registry. 
Add this function outside the class definition:

```python
@activity.defn(dynamic=True)
async def dynamic_tool_activity(args: Sequence[RawValue]) -> dict:
    from tools import get_handler

    tool_name = activity.info().activity_type  # e.g. "FindEvents"
    tool_args = activity.payload_converter().from_payload(args[0].payload, dict)
    activity.logger.info(f"Running dynamic tool '{tool_name}' with args: {tool_args}")

    # Delegate to the relevant function
    handler = get_handler(tool_name)
    if inspect.iscoroutinefunction(handler):
        result = await handler(tool_args)
    else:
        result = handler(tool_args)

    # Optionally log or augment the result
    activity.logger.info(f"Tool '{tool_name}' result: {result}")
    return result
```

This dynamic Activity uses Temporal's runtime information to determine which tool to execute. 
It retrieves the tool name from the Activity type, loads arguments from the payload, and dispatches to the appropriate handler function. 
The Activity handles both synchronous and asynchronous tool functions.

### Creating the activities package

Create an empty `activities/__init__.py` file to make the directory a Python package:

```command
touch activities/__init__.py
```

### Bringing it all together

Here is the complete Activities implementation that provides durability for your AI agent:

```python
import inspect
import json
import os
from datetime import datetime
from typing import Sequence

from dotenv import load_dotenv
from litellm import completion
from temporalio import activity
from temporalio.common import RawValue

from models.requests import (
    EnvLookupInput,
    EnvLookupOutput,
    ToolPromptInput,
    ValidationInput,
    ValidationResult,
)

load_dotenv(override=True)


class ToolActivities:
    def __init__(self):
        """Initialize LLM client using LiteLLM."""
        self.llm_model = os.environ.get("LLM_MODEL", "openai/gpt-4")
        self.llm_key = os.environ.get("LLM_KEY")
        self.llm_base_url = os.environ.get("LLM_BASE_URL")
        activity.logger.info(
            f"Initializing ToolActivities with LLM model: {self.llm_model}"
        )
        if self.llm_base_url:
            activity.logger.info(f"Using custom base URL: {self.llm_base_url}")

    @activity.defn
    async def agent_validatePrompt(
        self, validation_input: ValidationInput
    ) -> ValidationResult:
        """
        Validates the prompt in the context of the conversation history and agent goal.
        Returns a ValidationResult indicating if the prompt makes sense given the context.
        """
        # Create simple context string describing tools and goals
        tools_description = []
        for tool in validation_input.agent_goal.tools:
            tool_str = f"Tool: {tool.name}\n"
            tool_str += f"Description: {tool.description}\n"
            tool_str += "Arguments: " + ", ".join(
                [f"{arg.name} ({arg.type})" for arg in tool.arguments]
            )
            tools_description.append(tool_str)
        tools_str = "\n".join(tools_description)

        # Convert conversation history to string
        history_str = json.dumps(validation_input.conversation_history, indent=2)

        # Create context instructions
        context_instructions = f"""The agent goal and tools are as follows:
            Description: {validation_input.agent_goal.description}
            Available Tools:
            {tools_str}
            The conversation history to date is:
            {history_str}"""

        # Create validation prompt
        validation_prompt = f"""The user's prompt is: "{validation_input.prompt}"
            Please validate if this prompt makes sense given the agent goal and conversation history.
            If the prompt makes sense toward the goal then validationResult should be true.
            If the prompt is wildly nonsensical or makes no sense toward the goal and current conversation history then validationResult should be false.
            If the response is low content such as "yes" or "that's right" then the user is probably responding to a previous prompt.  
             Therefore examine it in the context of the conversation history to determine if it makes sense and return true if it makes sense.
            Return ONLY a JSON object with the following structure:
                "validationResult": true/false,
                "validationFailedReason": "If validationResult is false, provide a clear explanation to the user in the response field 
                about why their request doesn't make sense in the context and what information they should provide instead.
                validationFailedReason should contain JSON in the format
                {{
                    "next": "question",
                    "response": "[your reason here and a response to get the user back on track with the agent goal]"
                }}
                If validationResult is true (the prompt makes sense), return an empty dict as its value {{}}"
            """

        # Call the LLM with the validation prompt
        prompt_input = ToolPromptInput(
            prompt=validation_prompt, context_instructions=context_instructions
        )

        result = await self.agent_toolPlanner(prompt_input)

        return ValidationResult(
            validationResult=result.get("validationResult", False),
            validationFailedReason=result.get("validationFailedReason", {}),
        )

    @activity.defn
    async def agent_toolPlanner(self, input: ToolPromptInput) -> dict:
        messages = [
            {
                "role": "system",
                "content": input.context_instructions
                + ". The current date is "
                + datetime.now().strftime("%B %d, %Y"),
            },
            {
                "role": "user",
                "content": input.prompt,
            },
        ]

        try:
            completion_kwargs = {
                "model": self.llm_model,
                "messages": messages,
                "api_key": self.llm_key,
            }

            # Add base_url if configured
            if self.llm_base_url:
                completion_kwargs["base_url"] = self.llm_base_url

            response = completion(**completion_kwargs)

            response_content = response.choices[0].message.content
            activity.logger.info(f"LLM response: {response_content}")

            # Use the new sanitize function
            response_content = self.sanitize_json_response(response_content)

            return self.parse_json_response(response_content)
        except Exception as e:
            activity.logger.error(f"Error in LLM completion: {str(e)}")
            raise

    def parse_json_response(self, response_content: str) -> dict:
        """
        Parses the JSON response content and returns it as a dictionary.
        """
        try:
            data = json.loads(response_content)
            return data
        except json.JSONDecodeError as e:
            activity.logger.error(f"Invalid JSON: {e}")
            raise

    def sanitize_json_response(self, response_content: str) -> str:
        """
        Sanitizes the response content to ensure it's valid JSON.
        """
        # Remove any markdown code block markers
        response_content = response_content.replace("```json", "").replace("```", "")

        # Remove any leading/trailing whitespace
        response_content = response_content.strip()

        return response_content

    @activity.defn
    async def get_wf_env_vars(self, input: EnvLookupInput) -> EnvLookupOutput:
        """gets env vars for workflow as an activity result so it's deterministic
        handles default/None
        """
        output: EnvLookupOutput = EnvLookupOutput(
            show_confirm=input.show_confirm_default
        )
        show_confirm_value = os.getenv(input.show_confirm_env_var_name)
        if show_confirm_value is None:
            output.show_confirm = input.show_confirm_default
        elif show_confirm_value is not None and show_confirm_value.lower() == "false":
            output.show_confirm = False
        else:
            output.show_confirm = True

        return output


@activity.defn(dynamic=True)
async def dynamic_tool_activity(args: Sequence[RawValue]) -> dict:
    from tools import get_handler

    tool_name = activity.info().activity_type  # e.g. "FindEvents"
    tool_args = activity.payload_converter().from_payload(args[0].payload, dict)
    activity.logger.info(f"Running dynamic tool '{tool_name}' with args: {tool_args}")

    # Delegate to the relevant function
    handler = get_handler(tool_name)
    if inspect.iscoroutinefunction(handler):
        result = await handler(tool_args)
    else:
        result = handler(tool_args)

    # Optionally log or augment the result
    activity.logger.info(f"Tool '{tool_name}' result: {result}")
    return result
```

This Activities implementation provides the durability layer that makes your AI agent resilient to failures. 
The Activities handle language model communication, user input validation, environment configuration, and dynamic tool execution with automatic retry and recovery capabilities.

In the next step, you will create the Temporal Workflow that orchestrates these Activities into a complete agent conversation loop.

## Step 5 — Creating agent Workflow orchestration

In this step, you will create the Temporal Workflow that orchestrates your AI agent's conversation loop. 
This Workflow handles user interactions, validates prompts, manages tool execution, and maintains conversation state with durability guarantees.

### Understanding the conversation orchestration challenge

AI agents need to manage complex conversation flows that involve multiple turns of user interaction, tool execution, and state management. 
The challenge is maintaining conversation coherence across user sessions while handling failures, retries, and long-running interactions.

Your agent must coordinate several concurrent concerns: validating user input against conversation context, determining when to execute tools, managing user confirmations for tool execution, and maintaining conversation history that persists across system failures. 
A traditional application would lose conversation state during failures, but Temporal Workflows provide durable execution that preserves conversation context through any system interruption.

### Creating the workflows directory

Create the directory structure for your Workflow implementations:

```command
mkdir workflows
```

### Building the core conversation state management

The Workflow maintains conversation state using durable instance variables that survive system failures and restarts.

Open your text editor and create `workflows/agent_goal_workflow.py`, starting with the imports and state initialization:

```python
from collections import deque
from datetime import timedelta
from typing import Any, Deque, Dict, Optional, Union

from temporalio import workflow
from temporalio.common import RetryPolicy

from models.core import AgentGoal, ConversationHistory, CurrentTool
from models.requests import EnvLookupInput, EnvLookupOutput, ToolData, ValidationInput
from workflows import workflow_helpers as helpers
from workflows.workflow_helpers import (
    LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
    LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
)

with workflow.unsafe.imports_passed_through():
    from activities.tool_activities import ToolActivities
    from models.requests import CombinedInput, ToolPromptInput
    from prompts.agent_prompt_generators import generate_genai_prompt

# Constants
MAX_TURNS_BEFORE_CONTINUE = 250


@workflow.defn
class AgentGoalWorkflow:
    """Workflow that manages tool execution with user confirmation and conversation history."""

    def __init__(self) -> None:
        self.conversation_history: ConversationHistory = {"messages": []}
        self.prompt_queue: Deque[str] = deque()
        self.conversation_summary: Optional[str] = None
        self.chat_ended: bool = False
        self.tool_data: Optional[ToolData] = None
        self.confirmed: bool = (
            False  # indicates that we have confirmation to proceed to run tool
        )
        self.goal: Optional[AgentGoal] = None
        self.show_tool_args_confirmation: bool = (
            True  # set from env file in activity lookup_wf_env_settings
        )
```

This initialization establishes the core conversation state that persists across the entire agent interaction. 
The `conversation_history` maintains all user and agent messages, while `prompt_queue` handles asynchronous message processing. 
The confirmation system ensures users approve tool executions before they occur.

### Implementing the main conversation loop

The heart of the agent system is an event-driven conversation loop that responds to user input, validates prompts, and orchestrates tool execution.

Continue the Workflow class with the main execution method:

```python
    @workflow.run
    async def run(self, combined_input: CombinedInput) -> str:
        """Main workflow execution method."""
        # setup phase, starts with blank tool_params and agent_goal prompt as defined in tools/goal_registry.py
        params = combined_input.tool_params
        self.goal = combined_input.agent_goal

        await self.lookup_wf_env_settings(combined_input)

        # add message from sample conversation provided in tools/goal_registry.py, if it exists
        if params and params.conversation_summary:
            self.add_message("conversation_summary", params.conversation_summary)
            self.conversation_summary = params.conversation_summary

        if params and params.prompt_queue:
            self.prompt_queue.extend(params.prompt_queue)

        waiting_for_confirm: bool = False
        current_tool: Optional[CurrentTool] = None
```

The run method initializes conversation state from the input parameters and sets up the conversation context. 
It handles both fresh conversations and continuation from previous sessions through conversation summaries.

Add the main conversation loop:

```python
        # This is the main interactive loop. Main responsibilities:
        #   - Selecting and changing goals as directed by the user
        #   - reacting to user input (from signals)
        #   - validating user input to make sure it makes sense with the current goal and tools
        #   - calling the LLM through activities to determine next steps and prompts
        #   - executing the selected tools via activities
        while True:
            # wait indefinitely for input from signals - user_prompt, end_chat, or confirm as defined below
            await workflow.wait_condition(
                lambda: bool(self.prompt_queue) or self.chat_ended or self.confirmed
            )

            # handle chat should end. When chat ends, push conversation history to workflow results.
            if self.chat_should_end():
                return f"{self.conversation_history}"

            # Execute the tool
            if (
                self.ready_for_tool_execution(waiting_for_confirm)
                and current_tool is not None
            ):
                waiting_for_confirm = await self.execute_tool(current_tool)
                continue
```

This event-driven loop uses Temporal's `wait_condition` to efficiently wait for user input, tool confirmations, or chat termination. 
The loop processes events in priority order: chat termination, tool execution, and prompt processing.

### Processing user prompts with validation

The Workflow validates all user input to ensure conversation coherence and prevent the agent from processing irrelevant or confusing input.

Continue with the prompt processing logic:

```python
            # process forward on the prompt queue if any
            if self.prompt_queue:
                # get most recent prompt
                prompt = self.prompt_queue.popleft()
                workflow.logger.info(
                    f"workflow step: processing message on the prompt queue, message is {prompt}"
                )

                # Validate user-provided prompts
                if self.is_user_prompt(prompt):
                    self.add_message("user", prompt)

                    # Validate the prompt before proceeding
                    validation_input = ValidationInput(
                        prompt=prompt,
                        conversation_history=self.conversation_history,
                        agent_goal=self.goal,
                    )
                    validation_result = await workflow.execute_activity_method(
                        ToolActivities.agent_validatePrompt,
                        args=[validation_input],
                        schedule_to_close_timeout=LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
                        start_to_close_timeout=LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
                        retry_policy=RetryPolicy(
                            initial_interval=timedelta(seconds=5), backoff_coefficient=1
                        ),
                    )

                    # If validation fails, provide that feedback to the user - i.e., "your words make no sense, puny human" end this iteration of processing
                    if not validation_result.validationResult:
                        workflow.logger.warning(
                            f"Prompt validation failed: {validation_result.validationFailedReason}"
                        )
                        self.add_message(
                            "agent", validation_result.validationFailedReason
                        )
                        continue
```

The validation system calls your `agent_validatePrompt` Activity to ensure user input makes sense within the conversation context. 
When validation fails, the agent provides helpful feedback to guide users back on track rather than processing invalid input.

### Orchestrating language model decision making

After validation, the Workflow coordinates with language model Activities to determine the next steps in the conversation flow.

Continue with the LLM integration:

```python
                # If valid, proceed with generating the context and prompt
                context_instructions = generate_genai_prompt(
                    agent_goal=self.goal,
                    conversation_history=self.conversation_history,
                    raw_json=self.tool_data,
                )

                prompt_input = ToolPromptInput(
                    prompt=prompt, context_instructions=context_instructions
                )

                # connect to LLM and execute to get next steps
                tool_data = await workflow.execute_activity_method(
                    ToolActivities.agent_toolPlanner,
                    prompt_input,
                    schedule_to_close_timeout=LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
                    start_to_close_timeout=LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
                    retry_policy=RetryPolicy(
                        initial_interval=timedelta(seconds=5), backoff_coefficient=1
                    ),
                )

                tool_data["force_confirm"] = self.show_tool_args_confirmation
                self.tool_data = ToolData(**tool_data)

                # process the tool as dictated by the prompt response - what to do next, and with which tool
                next_step = tool_data.get("next")
                current_tool: Optional[CurrentTool] = tool_data.get("tool")
```

The Workflow generates comprehensive context instructions that include the agent goal, conversation history, and any previous tool results. 
This provides the language model with complete situational awareness for making intelligent decisions about next steps.

### Managing tool execution with confirmation flows

The Workflow implements a confirmation system that allows users to approve tool executions before they occur, providing control over agent actions.

Complete the prompt processing with tool execution setup:

```python
                # make sure we're ready to run the tool & have everything we need
                if next_step == "confirm" and current_tool:
                    args = tool_data.get("args", {})
                    # if we're missing arguments, ask for them
                    if await helpers.handle_missing_args(
                        current_tool, args, tool_data, self.prompt_queue
                    ):
                        continue

                    waiting_for_confirm = True

                    # We have needed arguments, if we want to force the user to confirm, set that up
                    if self.show_tool_args_confirmation:
                        self.confirmed = False  # set that we're not confirmed
                        workflow.logger.info("Waiting for user confirm signal...")
                    # if we have all needed arguments (handled above) and not holding for a debugging confirm, proceed:
                    else:
                        self.confirmed = True

                # else if the next step is to be done with the conversation such as if the user requests it via asking to "end conversation"
                elif next_step == "done":
                    self.add_message("agent", tool_data)

                    # here we could send conversation to AI for analysis

                    # end the workflow
                    return str(self.conversation_history)

                self.add_message("agent", tool_data)
                await helpers.continue_as_new_if_needed(
                    self.conversation_history,
                    self.prompt_queue,
                    self.goal,
                    MAX_TURNS_BEFORE_CONTINUE,
                    self.add_message,
                )
```

The confirmation system checks for missing tool arguments and either requests them from users or sets up confirmation workflows. 
The `continue_as_new` pattern ensures long conversations don't consume excessive memory by creating fresh Workflow instances with conversation summaries.

### Implementing Signal handlers for real-time interaction

Temporal Signals enable real-time communication with running Workflows, allowing users to send messages, confirm actions, and end conversations while the agent is processing.

Add the Signal handlers to your class:

```python
    # Signal that comes from api/main.py via a post to /send-prompt
    @workflow.signal
    async def user_prompt(self, prompt: str) -> None:
        """Signal handler for receiving user prompts."""
        workflow.logger.info(f"signal received: user_prompt, prompt is {prompt}")
        if self.chat_ended:
            workflow.logger.info(f"Message dropped due to chat closed: {prompt}")
            return
        self.prompt_queue.append(prompt)

    # Signal that comes from api/main.py via a post to /confirm
    @workflow.signal
    async def confirm(self) -> None:
        """Signal handler for user confirmation of tool execution."""
        workflow.logger.info("Received user signal: confirmation")
        self.confirmed = True

    # Signal that comes from api/main.py via a post to /end-chat
    @workflow.signal
    async def end_chat(self) -> None:
        """Signal handler for ending the chat session."""
        workflow.logger.info("signal received: end_chat")
        self.chat_ended = True
```

These Signal handlers provide the interface between your API layer and the running Workflow. 
Users can send prompts asynchronously, confirm tool executions, and terminate conversations while the agent processes previous actions.

### Creating Query handlers for conversation state access

Temporal Queries enable external systems to inspect Workflow state without affecting execution, providing real-time access to conversation data.

Add the Query handlers:

```python
    @workflow.query
    def get_conversation_history(self) -> ConversationHistory:
        """Query handler to retrieve the full conversation history."""
        return self.conversation_history

    @workflow.query
    def get_summary_from_history(self) -> Optional[str]:
        """Query handler to retrieve the conversation summary if available.
        Used only for continue as new of the workflow."""
        return self.conversation_summary

    @workflow.query
    def get_latest_tool_data(self) -> Optional[ToolData]:
        """Query handler to retrieve the latest tool data response if available."""
        return self.tool_data
```

Query handlers allow your API to provide real-time conversation updates to users without interrupting the agent's processing flow. 
This enables responsive user interfaces that show conversation progress as it happens.

### Implementing conversation state management

The Workflow includes utility methods for managing conversation state, validation, and execution flow control.

Add the helper methods:

```python
    def add_message(self, actor: str, response: Union[str, Dict[str, Any]]) -> None:
        """Add a message to the conversation history.

        Args:
            actor: The entity that generated the message (e.g., "user", "agent")
            response: The message content, either as a string or structured data
        """
        if isinstance(response, dict):
            response_str = str(response)
            workflow.logger.debug(f"Adding {actor} message: {response_str[:100]}...")
        else:
            workflow.logger.debug(f"Adding {actor} message: {response[:100]}...")

        self.conversation_history["messages"].append(
            {"actor": actor, "response": response}
        )

    # workflow function that defines if chat should end
    def chat_should_end(self) -> bool:
        if self.chat_ended:
            workflow.logger.info("Chat-end signal received. Chat ending.")
            return True
        else:
            return False

    # define if we're ready for tool execution
    def ready_for_tool_execution(self, waiting_for_confirm: bool) -> bool:

        return self.confirmed and waiting_for_confirm and self.tool_data is not None

    # LLM-tagged prompts start with "###"
    # all others are from the user
    def is_user_prompt(self, prompt) -> bool:
        if prompt.startswith("###"):
            return False
        else:
            return True
```

These utility methods provide clean interfaces for managing conversation state and controlling execution flow. 
The message tracking system maintains a complete audit trail of all interactions for debugging and analysis.

### Implementing environment configuration and tool execution

The Workflow includes methods for deterministic environment access and coordinated tool execution.

Complete the class with the remaining methods:

```python
    # look up env settings in an activity so they're part of history
    async def lookup_wf_env_settings(self, combined_input: CombinedInput) -> None:
        env_lookup_input = EnvLookupInput(
            show_confirm_env_var_name="SHOW_CONFIRM",
            show_confirm_default=True,
        )
        env_output: EnvLookupOutput = await workflow.execute_activity_method(
            ToolActivities.get_wf_env_vars,
            env_lookup_input,
            start_to_close_timeout=LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=5), backoff_coefficient=1
            ),
        )
        self.show_tool_args_confirmation = env_output.show_confirm

    # execute the tool - return False if we're not waiting for confirm anymore (always the case if it works successfully)
    #
    async def execute_tool(self, current_tool: CurrentTool) -> bool:
        workflow.logger.info(
            f"workflow step: user has confirmed, executing the tool {current_tool}"
        )
        self.confirmed = False
        waiting_for_confirm = False
        confirmed_tool_data = self.tool_data.copy()
        confirmed_tool_data["next"] = "user_confirmed_tool_run"
        self.add_message("user_confirmed_tool_run", confirmed_tool_data)

        # execute the tool by key as defined in tools/__init__.py
        await helpers.handle_tool_execution(
            current_tool,
            self.tool_data,
            self.add_message,
            self.prompt_queue,
        )

        return waiting_for_confirm
```

The environment lookup ensures deterministic configuration access, while the tool execution method coordinates with helper functions to execute tools and process their results back into the conversation flow.

### Creating Workflow helper functions

The Workflow system includes helper functions that manage common operations like tool execution, argument validation, and conversation continuation.

Create `workflows/workflow_helpers.py` with the supporting functions:

```python
from datetime import timedelta
from typing import Any, Callable, Deque, Dict

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

with workflow.unsafe.imports_passed_through():
    from activities.tool_activities import ToolActivities
    from models.requests import ConversationHistory, ToolData, ToolPromptInput
    from prompts.agent_prompt_generators import (
        generate_missing_args_prompt,
        generate_tool_completion_prompt,
    )

# Constants from original file
TOOL_ACTIVITY_START_TO_CLOSE_TIMEOUT = timedelta(seconds=30)
TOOL_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT = timedelta(minutes=30)
LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT = timedelta(seconds=30)
LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT = timedelta(minutes=30)
```

These timeout constants define reasonable boundaries for tool execution and language model calls, ensuring the system remains responsive while allowing sufficient time for external operations.

Add the tool execution handler:

```python
async def handle_tool_execution(
    current_tool: str,
    tool_data: ToolData,
    add_message_callback: Callable[..., Any],
    prompt_queue: Deque[str],
) -> None:
    """Execute a tool after confirmation and handle its result."""
    workflow.logger.info(f"Confirmed. Proceeding with tool: {current_tool}")

    try:
        dynamic_result = await workflow.execute_activity(
            current_tool,
            tool_data["args"],
            schedule_to_close_timeout=TOOL_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
            start_to_close_timeout=TOOL_ACTIVITY_START_TO_CLOSE_TIMEOUT,
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=5), backoff_coefficient=1
            ),
        )
        dynamic_result["tool"] = current_tool
    except ActivityError as e:
        workflow.logger.error(f"Tool execution failed: {str(e)}")
        dynamic_result = {"error": str(e), "tool": current_tool}

    add_message_callback("tool_result", dynamic_result)
    prompt_queue.append(generate_tool_completion_prompt(current_tool, dynamic_result))
```

This function demonstrates the dynamic Activity execution pattern that enables runtime tool dispatch.
It includes comprehensive error handling and automatically generates follow-up prompts to continue the conversation flow after tool execution.

Add the argument validation helper:

```python
async def handle_missing_args(
    current_tool: str,
    args: Dict[str, Any],
    tool_data: Dict[str, Any],
    prompt_queue: Deque[str],
) -> bool:
    """Check for missing arguments and handle them if found."""
    missing_args = [key for key, value in args.items() if value is None]

    if missing_args:
        prompt_queue.append(
            generate_missing_args_prompt(current_tool, tool_data, missing_args)
        )
        workflow.logger.info(
            f"Missing arguments for tool: {current_tool}: {' '.join(missing_args)}"
        )
        return True
    return False
```

The missing arguments handler automatically generates prompts that ask users for required information, ensuring tools receive complete input before execution.

Complete the helpers with conversation management functions:

```python
def format_history(conversation_history: ConversationHistory) -> str:
    """Format the conversation history into a single string."""
    return " ".join(str(msg["response"]) for msg in conversation_history["messages"])


def prompt_with_history(
    conversation_history: ConversationHistory, prompt: str
) -> tuple[str, str]:
    """Generate a context-aware prompt with conversation history."""
    history_string = format_history(conversation_history)
    context_instructions = (
        f"Here is the conversation history: {history_string} "
        "Please add a few sentence response in plain text sentences. "
        "Don't editorialize or add metadata. "
        "Keep the text a plain explanation based on the history."
    )
    return (context_instructions, prompt)


async def continue_as_new_if_needed(
    conversation_history: ConversationHistory,
    prompt_queue: Deque[str],
    agent_goal: Any,
    max_turns: int,
    add_message_callback: Callable[..., Any],
) -> None:
    """Handle workflow continuation if message limit is reached."""
    if len(conversation_history["messages"]) >= max_turns:
        summary_context, summary_prompt = prompt_summary_with_history(
            conversation_history
        )
        summary_input = ToolPromptInput(
            prompt=summary_prompt, context_instructions=summary_context
        )
        conversation_summary = await workflow.start_activity_method(
            ToolActivities.agent_toolPlanner,
            summary_input,
            schedule_to_close_timeout=LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
        )
        workflow.logger.info(f"Continuing as new after {max_turns} turns.")
        add_message_callback("conversation_summary", conversation_summary)
        workflow.continue_as_new(
            args=[
                {
                    "tool_params": {
                        "conversation_summary": conversation_summary,
                        "prompt_queue": prompt_queue,
                    },
                    "agent_goal": agent_goal,
                }
            ]
        )


def prompt_summary_with_history(
    conversation_history: ConversationHistory,
) -> tuple[str, str]:
    """Generate a prompt for summarizing the conversation.
    Used only for continue as new of the workflow."""
    history_string = format_history(conversation_history)
    context_instructions = f"Here is the conversation history between a user and a chatbot: {history_string}"
    actual_prompt = (
        "Please produce a two sentence summary of this conversation. "
        'Put the summary in the format { "summary": "<plain text>" }'
    )
    return (context_instructions, actual_prompt)
```

The `continue_as_new` pattern enables long-running conversations by summarizing conversation history and creating fresh Workflow instances. 
This prevents memory growth in extended agent sessions while maintaining conversation continuity.

### Creating the workflows package

Create an empty `workflows/__init__.py` file to make the directory a Python package:

```command
touch workflows/__init__.py
```

### Bringing it all together

Your complete Workflow orchestration system provides durable conversation management for AI agents. 
Here are the complete files:

**Main Workflow (`workflows/agent_goal_workflow.py`):**
```python
from collections import deque
from datetime import timedelta
from typing import Any, Deque, Dict, Optional, Union

from temporalio import workflow
from temporalio.common import RetryPolicy

from models.core import AgentGoal, ConversationHistory, CurrentTool
from models.requests import EnvLookupInput, EnvLookupOutput, ToolData, ValidationInput
from workflows import workflow_helpers as helpers
from workflows.workflow_helpers import (
    LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
    LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
)

with workflow.unsafe.imports_passed_through():
    from activities.tool_activities import ToolActivities
    from models.requests import CombinedInput, ToolPromptInput
    from prompts.agent_prompt_generators import generate_genai_prompt

# Constants
MAX_TURNS_BEFORE_CONTINUE = 250


@workflow.defn
class AgentGoalWorkflow:
    """Workflow that manages tool execution with user confirmation and conversation history."""

    def __init__(self) -> None:
        self.conversation_history: ConversationHistory = {"messages": []}
        self.prompt_queue: Deque[str] = deque()
        self.conversation_summary: Optional[str] = None
        self.chat_ended: bool = False
        self.tool_data: Optional[ToolData] = None
        self.confirmed: bool = (
            False  # indicates that we have confirmation to proceed to run tool
        )
        self.goal: Optional[AgentGoal] = None
        self.show_tool_args_confirmation: bool = (
            True  # set from env file in activity lookup_wf_env_settings
        )

    @workflow.run
    async def run(self, combined_input: CombinedInput) -> str:
        """Main workflow execution method."""
        # [Complete implementation with setup, main loop, validation, and tool execution]

    @workflow.signal
    async def user_prompt(self, prompt: str) -> None:
        """Signal handler for receiving user prompts."""
        # [Implementation for handling user input signals]

    @workflow.signal
    async def confirm(self) -> None:
        """Signal handler for user confirmation of tool execution."""
        # [Implementation for handling confirmation signals]

    @workflow.signal
    async def end_chat(self) -> None:
        """Signal handler for ending the chat session."""
        # [Implementation for handling chat termination]

    @workflow.query
    def get_conversation_history(self) -> ConversationHistory:
        """Query handler to retrieve the full conversation history."""
        # [Implementation for conversation state access]

    # [Additional utility methods for state management and execution control]
```

**Workflow Helpers (`workflows/workflow_helpers.py`):**
```python
from datetime import timedelta
from typing import Any, Callable, Deque, Dict

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

with workflow.unsafe.imports_passed_through():
    from activities.tool_activities import ToolActivities
    from models.requests import ConversationHistory, ToolData, ToolPromptInput
    from prompts.agent_prompt_generators import (
        generate_missing_args_prompt,
        generate_tool_completion_prompt,
    )

# [Timeout constants and helper functions for tool execution, argument validation, and conversation management]
```

This Workflow orchestration system demonstrates key patterns for building durable AI agent conversations: event-driven processing with Signals and Queries, validation-first user interaction, confirmation-based tool execution, and continuation patterns for long-running sessions. 
The system maintains conversation coherence across failures while providing responsive real-time interaction capabilities.

In the next step, you will create the prompt engineering system that generates context-aware instructions for language model interactions.

## Step 6 — Developing prompt engineering system

In this step, you will create the prompt engineering system that generates context-aware instructions for language model interactions. 
This system transforms conversation state, tool definitions, and agent goals into precise prompts that guide language models to make intelligent decisions about next steps.

### Understanding the prompt engineering challenge

Language models require carefully crafted instructions to understand complex agent workflows and make appropriate decisions about tool usage. 
The challenge is generating prompts that provide sufficient context while maintaining clarity and ensuring consistent JSON-formatted responses.

Your agent needs prompts for different scenarios: initial tool planning based on user requests, handling tool completion results, requesting missing arguments, and managing conversation flow transitions. 
Each prompt type must provide the language model with complete situational awareness while constraining responses to expected formats.

### Creating the prompts directory

Create the directory structure for your prompt engineering system:

```command
mkdir prompts
```

### Building the core prompt templates

The prompt engineering system uses Jinja2 templates to generate dynamic, context-aware instructions that adapt to conversation state and agent capabilities.

Open your text editor and create `prompts/prompts.py` with the main template definitions:

```python
from jinja2 import Template

# Define the Jinja2 template
GENAI_PROMPT = Template(
    """
You are an AI agent that helps fill required arguments for the tools described below. 
You must respond with valid JSON ONLY, using the schema provided in the instructions.

=== Conversation History ===
This is the ongoing history to determine which tool and arguments to gather:
*BEGIN CONVERSATION HISTORY*
{{ conversation_history_json }}
*END CONVERSATION HISTORY*
REMINDER: You can use the conversation history to infer arguments for the tools.

{% if agent_goal.example_conversation_history %}
=== Example Conversation With These Tools ===
Use this example to understand how tools are invoked and arguments are gathered.
BEGIN EXAMPLE
{{ agent_goal.example_conversation_history }}
END EXAMPLE

{% endif %}
""".strip()
)
```

This template opening establishes the language model's role and provides conversation context. 
The conditional example section demonstrates proper tool usage patterns when available, helping the language model understand expected interaction flows.

Continue the template with tool definitions:

```
=== Tools Definitions ===
There are {{ agent_goal.tools|length }} available tools:
{{ agent_goal.tools|map(attribute='name')|join(', ') }}
Goal: {{ agent_goal.description }}
Gather the necessary information for each tool in the sequence described above.
Only ask for arguments listed below. Do not add extra arguments.

{% for tool in agent_goal.tools %}
Tool name: {{ tool.name }}
  Description: {{ tool.description }}
  Required args:
{% for arg in tool.arguments %}
    - {{ arg.name }} ({{ arg.type }}): {{ arg.description }}
{% endfor %}

{% endfor %}
When all required args for a tool are known, you can propose next='confirm' to run it.
```

The tool definitions section dynamically lists available tools with their descriptions and argument specifications. 
This provides the language model with complete information about agent capabilities and constraints on argument collection.

Add the JSON schema and behavioral instructions:

```
=== Instructions for JSON Generation ===
Your JSON format must be:
{
  "response": "<plain text>",
  "next": "<question|confirm|pick-new-goal|done>",
  "tool": "<tool_name or null>",
  "args": {
    "<arg1>": "<value1 or null>",
    "<arg2>": "<value2 or null>",
    ...
  }
}
1) If any required argument is missing, set next='question' and ask the user.
2) If all required arguments are known, set next='confirm' and specify the tool.
   The user will confirm before the tool is run.
3) {{ toolchain_complete_guidance }}
4) response should be short and user-friendly.

Guardrails (always remember!)
1) If any required argument is missing, set next='question' and ask the user.
1) ALWAYS ask a question in your response if next='question'.
2) ALWAYS set next='confirm' if you have arguments
 And respond with "let's proceed with <tool> (and any other useful info)" 
 DON'T set next='confirm' if you have a question to ask.
EXAMPLE: If you have a question to ask, set next='question' and ask the user.
3) You can carry over arguments from one tool to another.
 EXAMPLE: If you asked for an account ID, then use the conversation history to infer that argument going forward.
4) If ListAgents in the conversation history is force_confirm='False', you MUST check if the current tool contains userConfirmation. If it does, please ask the user to confirm details with the user. userConfirmation overrides force_confirm='False'.
EXAMPLE: (force_confirm='False' AND userConfirmation exists on tool) Would you like me to <run tool> with the following details: <details>?
```

The guardrails section provides detailed behavioral constraints that ensure consistent language model responses. 
These rules prevent common issues like asking questions while proposing tool execution or forgetting to utilize conversation history for argument inference.

Complete the template with validation capabilities:

```python
{% if raw_json is not none %}

=== Validation Task ===
Validate and correct the following JSON if needed:
{{ raw_json_str }}

Check syntax, 'tool' validity, 'args' completeness, and set 'next' appropriately. Return ONLY corrected JSON.
{% endif %}

{% if raw_json is not none %}
Begin by validating the provided JSON if necessary.
{% else %}
Begin by producing a valid JSON response for the next tool or question.
{% endif %}
```

The validation section enables the same template to handle both fresh prompt generation and correction of malformed responses, providing a unified interface for language model interactions.

### Creating specialized prompt templates

Different conversation scenarios require specialized prompts with focused instructions and formatting constraints.

Continue the file with the tool completion template:

```python
TOOL_COMPLETION_PROMPT = """### The '{current_tool}' tool completed successfully 
with {dynamic_result}. 
INSTRUCTIONS: Parse this tool result as plain text, and use the system prompt 
containing the list of tools in sequence and the conversation history (and 
previous tool_results) to figure out next steps, if any. 
You will need to use the tool_results to auto-fill arguments for subsequent 
tools and also to figure out if all tools have been run. 
{{"next": "<question|confirm|pick-new-goal|done>", "tool": "<tool_name or null>", "args": {{"<arg1>": "<value1 or null>", "<arg2>": "<value2 or null>"}}, "response": "<plain text (can include \\n line breaks)>"}}
ONLY return those json keys (next, tool, args, response), nothing else. 
Next should be "question" if the tool is not the last one in the sequence. 
Next should be "done" if the user is asking to be done with the chat."""
```

This template handles tool completion scenarios, instructing the language model to analyze tool results and determine appropriate next steps. 
It emphasizes using tool results to auto-fill subsequent tool arguments, enabling efficient workflow progression.

Add the missing arguments template:

```python
MISSING_ARGS_PROMPT = """### INSTRUCTIONS set next='question', combine 
this response response='{response}' and following missing arguments for tool 
{current_tool}: {missing_args}. Only provide a valid JSON response without any 
comments or metadata."""
```

The missing arguments template provides focused instructions for requesting required information from users. 
It ensures the language model maintains context while clearly asking for specific missing parameters.

### Building the prompt generation functions

The prompt generation system provides programmatic interfaces that combine templates with conversation state to produce context-aware instructions.

Create `prompts/agent_prompt_generators.py` with the generation functions:

```python
import json
from typing import Optional

from models.core import AgentGoal
from models.requests import ConversationHistory, ToolData
from prompts.prompts import GENAI_PROMPT, MISSING_ARGS_PROMPT, TOOL_COMPLETION_PROMPT


def generate_genai_prompt(
    agent_goal: AgentGoal,
    conversation_history: ConversationHistory,
    raw_json: Optional[ToolData] = None,
) -> str:
    """
    Generates a concise prompt for producing or validating JSON instructions
    with the provided tools and conversation history.
    """

    # Prepare template variables
    template_vars = {
        "agent_goal": agent_goal,
        "conversation_history_json": json.dumps(conversation_history, indent=2),
        "toolchain_complete_guidance": generate_toolchain_complete_guidance(),
        "raw_json": raw_json,
        "raw_json_str": (
            json.dumps(raw_json, indent=2) if raw_json is not None else None
        ),
    }

    return GENAI_PROMPT.render(**template_vars)
```

This function demonstrates the template variable preparation pattern that transforms agent state into language model instructions. 
It serializes conversation history to JSON format and includes optional validation data for error correction scenarios.

Add the tool completion prompt generator:

```python
def generate_tool_completion_prompt(current_tool: str, dynamic_result: dict) -> str:
    """
    Generates a prompt for handling tool completion and determining next steps.

    Args:
        current_tool: The name of the tool that just completed
        dynamic_result: The result data from the tool execution

    Returns:
        str: A formatted prompt string for the agent to process the tool completion
    """
    return TOOL_COMPLETION_PROMPT.format(
        current_tool=current_tool, dynamic_result=dynamic_result
    )
```

This generator creates prompts that help the language model process tool execution results and determine workflow continuation. 
It provides both the tool name and complete result data for informed decision-making.

Add the missing arguments prompt generator:

```python
def generate_missing_args_prompt(
    current_tool: str, tool_data: dict, missing_args: list[str]
) -> str:
    """
    Generates a prompt for handling missing arguments for a tool.

    Args:
        current_tool: The name of the tool that needs arguments
        tool_data: The current tool data containing the response
        missing_args: List of argument names that are missing

    Returns:
        str: A formatted prompt string for requesting missing arguments
    """
    return MISSING_ARGS_PROMPT.format(
        response=tool_data.get("response"),
        current_tool=current_tool,
        missing_args=missing_args,
    )
```

This generator creates focused prompts for collecting missing tool arguments. 
It maintains conversation context while clearly identifying which specific arguments are required.

Complete the file with the workflow completion guidance:

```python
def generate_toolchain_complete_guidance() -> str:
    """
    Generates a prompt for guiding the LLM to handle the end of the toolchain.

    Args:
        None

    Returns:
        str: A prompt string prompting the LLM to prompt for a new goal, or be done
    """
    return "If no more tools are needed (user_confirmed_tool_run has been run for all), set next='done' and tool=''."
```

This guidance function provides instructions for recognizing when agent workflows are complete, ensuring the language model properly terminates conversations when all tools have been executed.

### Creating the prompts package

Create an empty `prompts/__init__.py` file to make the directory a Python package:

```command
touch prompts/__init__.py
```

### Bringing it all together

Your complete prompt engineering system provides the foundation for reliable language model interactions. Here are the complete files:

**Prompt Templates (`prompts/prompts.py`):**
```python
from jinja2 import Template

# Define the Jinja2 template
GENAI_PROMPT = Template(
    """
You are an AI agent that helps fill required arguments for the tools described below. 
You must respond with valid JSON ONLY, using the schema provided in the instructions.

=== Conversation History ===
This is the ongoing history to determine which tool and arguments to gather:
*BEGIN CONVERSATION HISTORY*
{{ conversation_history_json }}
*END CONVERSATION HISTORY*
REMINDER: You can use the conversation history to infer arguments for the tools.

{% if agent_goal.example_conversation_history %}
=== Example Conversation With These Tools ===
Use this example to understand how tools are invoked and arguments are gathered.
BEGIN EXAMPLE
{{ agent_goal.example_conversation_history }}
END EXAMPLE

{% endif %}
=== Tools Definitions ===
There are {{ agent_goal.tools|length }} available tools:
{{ agent_goal.tools|map(attribute='name')|join(', ') }}
Goal: {{ agent_goal.description }}
Gather the necessary information for each tool in the sequence described above.
Only ask for arguments listed below. Do not add extra arguments.

{% for tool in agent_goal.tools %}
Tool name: {{ tool.name }}
  Description: {{ tool.description }}
  Required args:
{% for arg in tool.arguments %}
    - {{ arg.name }} ({{ arg.type }}): {{ arg.description }}
{% endfor %}

{% endfor %}
When all required args for a tool are known, you can propose next='confirm' to run it.

=== Instructions for JSON Generation ===
Your JSON format must be:
{
  "response": "<plain text>",
  "next": "<question|confirm|pick-new-goal|done>",
  "tool": "<tool_name or null>",
  "args": {
    "<arg1>": "<value1 or null>",
    "<arg2>": "<value2 or null>",
    ...
  }
}
1) If any required argument is missing, set next='question' and ask the user.
2) If all required arguments are known, set next='confirm' and specify the tool.
   The user will confirm before the tool is run.
3) {{ toolchain_complete_guidance }}
4) response should be short and user-friendly.

Guardrails (always remember!)
1) If any required argument is missing, set next='question' and ask the user.
1) ALWAYS ask a question in your response if next='question'.
2) ALWAYS set next='confirm' if you have arguments
 And respond with "let's proceed with <tool> (and any other useful info)" 
 DON'T set next='confirm' if you have a question to ask.
EXAMPLE: If you have a question to ask, set next='question' and ask the user.
3) You can carry over arguments from one tool to another.
 EXAMPLE: If you asked for an account ID, then use the conversation history to infer that argument going forward.
4) If ListAgents in the conversation history is force_confirm='False', you MUST check if the current tool contains userConfirmation. If it does, please ask the user to confirm details with the user. userConfirmation overrides force_confirm='False'.
EXAMPLE: (force_confirm='False' AND userConfirmation exists on tool) Would you like me to <run tool> with the following details: <details>?

{% if raw_json is not none %}

=== Validation Task ===
Validate and correct the following JSON if needed:
{{ raw_json_str }}

Check syntax, 'tool' validity, 'args' completeness, and set 'next' appropriately. Return ONLY corrected JSON.
{% endif %}

{% if raw_json is not none %}
Begin by validating the provided JSON if necessary.
{% else %}
Begin by producing a valid JSON response for the next tool or question.
{% endif %}
""".strip()
)

TOOL_COMPLETION_PROMPT = """### The '{current_tool}' tool completed successfully 
with {dynamic_result}. 
INSTRUCTIONS: Parse this tool result as plain text, and use the system prompt 
containing the list of tools in sequence and the conversation history (and 
previous tool_results) to figure out next steps, if any. 
You will need to use the tool_results to auto-fill arguments for subsequent 
tools and also to figure out if all tools have been run. 
{{"next": "<question|confirm|pick-new-goal|done>", "tool": "<tool_name or null>", "args": {{"<arg1>": "<value1 or null>", "<arg2>": "<value2 or null>"}}, "response": "<plain text (can include \\n line breaks)>"}}
ONLY return those json keys (next, tool, args, response), nothing else. 
Next should be "question" if the tool is not the last one in the sequence. 
Next should be "done" if the user is asking to be done with the chat."""


MISSING_ARGS_PROMPT = """### INSTRUCTIONS set next='question', combine 
this response response='{response}' and following missing arguments for tool 
{current_tool}: {missing_args}. Only provide a valid JSON response without any 
comments or metadata."""
```

**Prompt Generators (`prompts/agent_prompt_generators.py`):**
```python
import json
from typing import Optional

from models.core import AgentGoal
from models.requests import ConversationHistory, ToolData
from prompts.prompts import GENAI_PROMPT, MISSING_ARGS_PROMPT, TOOL_COMPLETION_PROMPT


def generate_genai_prompt(
    agent_goal: AgentGoal,
    conversation_history: ConversationHistory,
    raw_json: Optional[ToolData] = None,
) -> str:
    """
    Generates a concise prompt for producing or validating JSON instructions
    with the provided tools and conversation history.
    """
    # [Template variable preparation and rendering logic]

def generate_tool_completion_prompt(current_tool: str, dynamic_result: dict) -> str:
    """
    Generates a prompt for handling tool completion and determining next steps.
    """
    # [Tool completion prompt generation logic]

def generate_missing_args_prompt(
    current_tool: str, tool_data: dict, missing_args: list[str]
) -> str:
    """
    Generates a prompt for handling missing arguments for a tool.
    """
    # [Missing arguments prompt generation logic]

def generate_toolchain_complete_guidance() -> str:
    """
    Generates a prompt for guiding the LLM to handle the end of the toolchain.
    """
    # [Workflow completion guidance logic]
```

This prompt engineering system demonstrates key patterns for building reliable AI agent interactions: template-driven prompt generation, context stratification, constraint specification, and state serialization. 
The system provides language models with comprehensive situational awareness while ensuring predictable, structured responses that drive consistent agent behavior.

In the next step, you will create the FastAPI backend that provides HTTP endpoints for interacting with your Temporal Workflows.

## Step 7 — Building FastAPI backend

In this step, you will create the FastAPI backend that provides HTTP endpoints for interacting with your Temporal Workflows. 
This API serves as the bridge between web interfaces and your durable agent system, handling workflow management, real-time communication, and conversation state access.

### Understanding the API integration challenge

Web applications require HTTP-based interfaces to interact with backend systems, but Temporal Workflows operate through specialized clients that communicate via gRPC protocols. 
The challenge is creating a clean REST API that abstracts Temporal's complexity while providing responsive, real-time access to agent conversations.

Your API needs to handle multiple concurrent conversations, manage workflow lifecycle operations, provide real-time conversation updates, and gracefully handle various failure scenarios including workflow unavailability and network timeouts. 
The system must also support both development and production deployment patterns.

### Creating the API directory structure

Create the directory structure for your FastAPI application:

```command
mkdir api
mkdir shared
```

### Building Temporal client configuration

The first challenge is establishing reliable connections to Temporal servers that work across different deployment environments from local development to cloud production.

Open your text editor and create `shared/config.py` with the Temporal connection system:

```python
import os

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.service import TLSConfig

load_dotenv(override=True)

# Temporal connection settings
TEMPORAL_ADDRESS = os.getenv("TEMPORAL_ADDRESS", "localhost:7233")
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
TEMPORAL_TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "agent-task-queue")

# Authentication settings
TEMPORAL_TLS_CERT = os.getenv("TEMPORAL_TLS_CERT", "")
TEMPORAL_TLS_KEY = os.getenv("TEMPORAL_TLS_KEY", "")
TEMPORAL_API_KEY = os.getenv("TEMPORAL_API_KEY", "")
```

This configuration system loads Temporal connection parameters from environment variables with sensible defaults for local development. 
It supports multiple authentication methods for different deployment scenarios.

Add the client creation function:

```python
async def get_temporal_client() -> Client:
    """
    Creates a Temporal client based on environment configuration.
    Supports local server, mTLS, and API key authentication methods.
    """
    # Default to no TLS for local development
    tls_config = False
    print(f"Address: {TEMPORAL_ADDRESS}, Namespace {TEMPORAL_NAMESPACE}")
    print("(If unset, then will try to connect to local server)")

    # Configure mTLS if certificate and key are provided
    if TEMPORAL_TLS_CERT and TEMPORAL_TLS_KEY:
        print(f"TLS cert: {TEMPORAL_TLS_CERT}")
        print(f"TLS key: {TEMPORAL_TLS_KEY}")
        with open(TEMPORAL_TLS_CERT, "rb") as f:
            client_cert = f.read()
        with open(TEMPORAL_TLS_KEY, "rb") as f:
            client_private_key = f.read()
        tls_config = TLSConfig(
            client_cert=client_cert,
            client_private_key=client_private_key,
        )

    # Use API key authentication if provided
    if TEMPORAL_API_KEY:
        print(f"API key: {TEMPORAL_API_KEY}")
        return await Client.connect(
            TEMPORAL_ADDRESS,
            namespace=TEMPORAL_NAMESPACE,
            api_key=TEMPORAL_API_KEY,
            tls=True,  # Always use TLS with API key
        )

    # Use mTLS or local connection
    return await Client.connect(
        TEMPORAL_ADDRESS,
        namespace=TEMPORAL_NAMESPACE,
        tls=tls_config,
    )
```

This client factory demonstrates a flexible authentication pattern that automatically detects available credentials and chooses the appropriate connection method. 
It supports local development servers, mutual TLS for private clouds, and API key authentication for Temporal Cloud.

### Creating the FastAPI application foundation

The API application requires proper lifecycle management to establish Temporal connections during startup and handle graceful shutdown.

Create `api/main.py` with the application foundation:

```python
import asyncio
import os
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
```

The lifespan context manager ensures the Temporal client is available throughout the application lifecycle. 
This pattern provides clean initialization and cleanup of external resources.

Add CORS configuration for web frontend integration:

```python
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
```

The CORS middleware enables web browsers to interact with your API from different origins, essential for frontend-backend communication during development.

### Implementing conversation state access

The API needs to provide real-time access to conversation history while handling various workflow states and error conditions gracefully.

Add the conversation history endpoint:

```python
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
```

This endpoint demonstrates robust query handling with workflow state validation and timeout protection. 
It checks for failed workflow states and provides appropriate error responses when workflows are unavailable.

Complete the conversation history handler with error management:

```python
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
            )
```

The error handling system provides specific responses for different failure modes: worker unavailability, missing workflows, and general temporal errors. 
This helps frontend applications provide appropriate user feedback.

### Building workflow communication endpoints

The API provides endpoints for sending user messages and controlling workflow execution through Temporal Signals.

Add the message sending endpoint:

```python
@app.post("/send-prompt")
async def send_prompt(prompt: str) -> Dict[str, str]:

    temporal_client = _ensure_temporal_client()

    # Create combined input with goal from environment
    combined_input = CombinedInput(
        tool_params=AgentGoalWorkflowParams(None, None),
        agent_goal=AGENT_GOAL,
        # change to get from workflow query
    )

    workflow_id = "agent-workflow"

    # Start (or signal) the workflow
    await temporal_client.start_workflow(
        AgentGoalWorkflow.run,
        combined_input,
        id=workflow_id,
        task_queue=TEMPORAL_TASK_QUEUE,
        start_signal="user_prompt",
        start_signal_args=[prompt],
    )

    return {"message": f"Prompt '{prompt}' sent to workflow {workflow_id}."}
```

This endpoint demonstrates the start-or-signal pattern that either creates a new workflow or sends a signal to an existing one. 
This approach ensures robust message delivery regardless of workflow state.

Add the confirmation endpoint:

```python
@app.post("/confirm")
async def send_confirm() -> Dict[str, str]:
    """Sends a 'confirm' signal to the workflow."""
    temporal_client = _ensure_temporal_client()

    workflow_id = "agent-workflow"
    handle = temporal_client.get_workflow_handle(workflow_id)
    await handle.signal("confirm")
    return {"message": "Confirm signal sent."}
```

The confirmation endpoint enables users to approve tool executions, providing control over agent actions. 
This signal-based approach allows real-time interaction with running workflows.

### Implementing workflow lifecycle management

The API includes endpoints for managing workflow lifecycle operations including termination and initialization.

Add the chat termination endpoint:

```python
@app.post("/end-chat")
async def end_chat() -> Dict[str, str]:
    """Sends a 'end_chat' signal to the workflow."""
    workflow_id = "agent-workflow"

    temporal_client = _ensure_temporal_client()

    try:
        handle = temporal_client.get_workflow_handle(workflow_id)
        await handle.signal("end_chat")
        return {"message": "End chat signal sent."}
    except TemporalError as e:
        print(e)
        # Workflow not found; return an empty response
        return {}
```

The end chat endpoint gracefully terminates conversations by signaling workflows to complete their processing and return final results.

Add the workflow initialization endpoint:

```python
@app.post("/start-workflow")
async def start_workflow() -> Dict[str, str]:

    temporal_client = _ensure_temporal_client()

    # Create combined input
    combined_input = CombinedInput(
        tool_params=AgentGoalWorkflowParams(None, None),
        agent_goal=AGENT_GOAL,
    )

    workflow_id = "agent-workflow"

    # Start the workflow with the starter prompt from the goal
    await temporal_client.start_workflow(
        AgentGoalWorkflow.run,
        combined_input,
        id=workflow_id,
        task_queue=TEMPORAL_TASK_QUEUE,
        start_signal="user_prompt",
        start_signal_args=["### " + AGENT_GOAL.starter_prompt],
    )

    return {
        "message": f"Workflow started with goal's starter prompt: {AGENT_GOAL.starter_prompt}."
    }
```

The workflow initialization endpoint creates fresh conversation sessions with the agent's starter prompt, providing a clean entry point for new interactions.

### Adding utility functions and client validation

The API includes utility functions that ensure robust operation and proper error handling across all endpoints.

Complete the file with the client validation utility:

```python
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
```

This utility function provides centralized client validation that ensures all endpoints have access to properly initialized Temporal connections.

### Creating package initialization

Create empty `__init__.py` files to make your directories Python packages:

```command
touch api/__init__.py
touch shared/__init__.py
```

### Bringing it all together

Your complete FastAPI backend provides a robust HTTP interface for interacting with Temporal AI agent workflows.
Here are the complete files:

**Temporal Configuration (`shared/config.py`):**
```python
import os

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.service import TLSConfig

load_dotenv(override=True)

# Temporal connection settings
TEMPORAL_ADDRESS = os.getenv("TEMPORAL_ADDRESS", "localhost:7233")
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
TEMPORAL_TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "agent-task-queue")

# Authentication settings
TEMPORAL_TLS_CERT = os.getenv("TEMPORAL_TLS_CERT", "")
TEMPORAL_TLS_KEY = os.getenv("TEMPORAL_TLS_KEY", "")
TEMPORAL_API_KEY = os.getenv("TEMPORAL_API_KEY", "")


async def get_temporal_client() -> Client:
    """
    Creates a Temporal client based on environment configuration.
    Supports local server, mTLS, and API key authentication methods.
    """
    # [Complete client creation logic with authentication handling]
```

**FastAPI Application (`api/main.py`):**
```python
import asyncio
import os
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

# [Complete application with lifecycle management, endpoints, and error handling]
```

**Key Endpoints:**
- `GET /get-conversation-history` - Real-time conversation state access
- `POST /send-prompt` - Send user messages to workflows  
- `POST /confirm` - Approve tool executions
- `POST /end-chat` - Terminate conversations
- `POST /start-workflow` - Initialize new agent sessions

This FastAPI backend demonstrates key patterns for building production-ready API-Workflow integrations: robust error handling, flexible authentication, real-time communication through Signals and Queries, and proper resource lifecycle management. 
The system provides a clean HTTP interface that abstracts Temporal's complexity while maintaining full access to workflow capabilities.

In the next step, you will create the React frontend that provides a user-friendly web interface for interacting with your AI agent system.

## Step 8 — Creating React frontend

In this step, you will create the React frontend that provides a user-friendly web interface for interacting with your AI agent system. 
This frontend handles real-time conversation display, user input processing, and tool confirmation workflows while maintaining responsive performance through optimized polling and state management.

### Understanding the frontend architecture challenge

Modern AI agent interfaces require sophisticated state management to handle real-time conversations, asynchronous backend operations, and various user interaction flows. 
The challenge is creating a React application that maintains conversation coherence, provides immediate user feedback, handles network failures gracefully, and manages complex UI states for tool confirmations.

Your frontend needs to poll for conversation updates without overwhelming the backend, render different message types appropriately, provide intuitive controls for agent interactions, handle loading and error states smoothly, and maintain responsive performance even during long conversations.

### Setting up the React project foundation

Create the React application with modern tooling and dependencies for optimal development experience.

Create the frontend directory and initialize the project:

```command
mkdir frontend
cd frontend
```

Open your text editor and create `package.json` with the project configuration:

```json
{
  "name": "temporal-ai-agent-frontend",
  "version": "1.0.0",
  "description": "React and Tailwind",
  "license": "ISC",
  "author": "",
  "type": "commonjs",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^6.3.5"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17"
  }
}
```

This configuration uses the latest React version with Vite for fast development builds and Tailwind CSS for utility-first styling. 
The minimal dependency set ensures fast build times and reduced bundle size.

### Building the API service layer

The frontend requires a robust API service layer that handles communication with your FastAPI backend while providing proper error handling and type safety.

Create the source directory and API service:

```command
mkdir src
mkdir src/services
```

Open your text editor and create `src/services/api.js` with the API communication layer:

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.message || 'An error occurred',
            response.status
        );
    }
    return response.json();
}
```

This API foundation provides structured error handling with status codes and standardized response processing. The `ApiError` class enables differentiated error handling based on HTTP status codes.

Add the core API methods:

```javascript
export const apiService = {
    async getConversationHistory() {
        try {
            const res = await fetch(`${API_BASE_URL}/get-conversation-history`);
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to fetch conversation history',
                error.status || 500
            );
        }
    },

    async sendMessage(message) {
        if (!message?.trim()) {
            throw new ApiError('Message cannot be empty', 400);
        }

        try {
            const res = await fetch(
                `${API_BASE_URL}/send-prompt?prompt=${encodeURIComponent(message)}`,
                { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to send message',
                error.status || 500
            );
        }
    },
```

The message sending method demonstrates proper URL encoding for user input and includes client-side validation to prevent empty message submissions.

Complete the API service with workflow management methods:

```javascript
    async startWorkflow() {
        try {
            const res = await fetch(
                `${API_BASE_URL}/start-workflow`,
                { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to start workflow',
                error.status || 500
            );
        }
    },

    async confirm() {
        try {
            const res = await fetch(`${API_BASE_URL}/confirm`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return handleResponse(res);
        } catch (error) {
            throw new ApiError(
                'Failed to confirm action',
                error.status || 500
            );
        }
    }
};
```

These methods provide clean interfaces for workflow lifecycle management and tool confirmation, enabling the UI to control agent behavior through simple function calls.

### Creating advanced state management with debouncing

The main application component requires sophisticated state management to handle real-time updates, user interactions, and error conditions while maintaining optimal performance.

Create `src/pages/App.jsx` with the application foundation:

```javascript
import React, { useEffect, useState, useRef, useCallback } from "react";
import NavBar from "../components/NavBar";
import ChatWindow from "../components/ChatWindow";
import { apiService } from "../services/api";

const POLL_INTERVAL = 600; // 0.6 seconds
const INITIAL_ERROR_STATE = { visible: false, message: '' };
const DEBOUNCE_DELAY = 300; // 300ms debounce for user input

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
```

The debouncing hook prevents excessive API calls during rapid user input, improving performance and reducing server load. 
The polling interval is optimized for responsive updates without overwhelming the backend.

Add the main application state and error handling:

```javascript
export default function App() {
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const pollingRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    
    const [conversation, setConversation] = useState([]);
    const [lastMessage, setLastMessage] = useState(null);
    const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(INITIAL_ERROR_STATE);
    const [done, setDone] = useState(true);

    const debouncedUserInput = useDebounce(userInput, DEBOUNCE_DELAY);

    const errorTimerRef = useRef(null);

    const handleError = useCallback((error, context) => {
        console.error(`${context}:`, error);
        
        const isConversationFetchError = error.status === 404;
        const errorMessage = isConversationFetchError 
            ? "Error fetching conversation. Retrying..."
            : `Error ${context.toLowerCase()}. Please try again.`;
    
        setError(prevError => {
            // If the same 404 error is already being displayed, don't reset state (prevents flickering)
            if (prevError.visible && prevError.message === errorMessage) {
                return prevError;
            }
            return { visible: true, message: errorMessage };
        });
    
        // Clear any existing timeout
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
    
        // Only auto-dismiss non-404 errors after 3 seconds
        if (!isConversationFetchError) {
            errorTimerRef.current = setTimeout(() => setError(INITIAL_ERROR_STATE), 3000);
        }
    }, []);
```

The error handling system provides differentiated treatment for different error types. 
404 errors (indicating missing workflows) persist until resolved, while other errors auto-dismiss to avoid cluttering the interface.

### Implementing intelligent conversation synchronization

The application requires sophisticated conversation state management that handles real-time updates, prevents unnecessary re-renders, and maintains UI consistency.

Add the conversation fetching and state management:

```javascript
    const clearErrorOnSuccess = useCallback(() => {
        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }
        setError(INITIAL_ERROR_STATE);
    }, []);
    
    const fetchConversationHistory = useCallback(async () => {
        try {
            const data = await apiService.getConversationHistory();
            const newConversation = data.messages || [];
            
            setConversation(prevConversation => 
                JSON.stringify(prevConversation) !== JSON.stringify(newConversation) ? newConversation : prevConversation
            );
    
            if (newConversation.length > 0) {
                const lastMsg = newConversation[newConversation.length - 1];
                const isAgentMessage = lastMsg.actor === "agent";
                
                setLoading(!isAgentMessage);
                setDone(lastMsg.response.next === "done");
    
                setLastMessage(prevLastMessage =>
                    !prevLastMessage || lastMsg.response.response !== prevLastMessage.response.response
                        ? lastMsg
                        : prevLastMessage
                );
            } else {
                setLoading(false);
                setDone(true);
                setLastMessage(null);
            }
    
            // Successfully fetched data, clear any persistent errors
            clearErrorOnSuccess();
        } catch (err) {
            handleError(err, "fetching conversation");
        }
    }, [handleError, clearErrorOnSuccess]);
```

This fetching logic uses JSON comparison to prevent unnecessary re-renders and intelligently determines loading states based on the last message actor. 
It automatically detects conversation completion through the agent's "done" status.

Add the polling setup and scroll management:

```javascript
    // Setup polling with cleanup
    useEffect(() => {
        pollingRef.current = setInterval(fetchConversationHistory, POLL_INTERVAL);
        
        return () => clearInterval(pollingRef.current);
    }, [fetchConversationHistory]);
    

    const scrollToBottom = useCallback(() => {
        if (containerRef.current) {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
                const element = containerRef.current;
                element.scrollTop = element.scrollHeight;
                scrollTimeoutRef.current = null;
            }, 100);
        }
    }, []);

    const handleContentChange = useCallback(() => {
        scrollToBottom();
    }, [scrollToBottom]);

    useEffect(() => {
        if (lastMessage) {
            scrollToBottom();
        }
    }, [lastMessage, scrollToBottom]);

    useEffect(() => {
        if (inputRef.current && !loading && !done) {
            inputRef.current.focus();
        }
        
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [loading, done]);
```

The scroll management system ensures the interface stays focused on the latest conversation content while providing smooth animated scrolling. 
Input focus management enhances user experience by automatically focusing the input field when ready for user interaction.

### Building user interaction handlers

The application requires handlers for different user actions that maintain proper loading states and error handling while coordinating with the backend system.

Add the user interaction methods:

```javascript
    const handleSendMessage = async () => {
        const trimmedInput = userInput.trim();
        if (!trimmedInput) return;
        
        try {
            setLoading(true);
            setError(INITIAL_ERROR_STATE);
            await apiService.sendMessage(trimmedInput);
            setUserInput("");
        } catch (err) {
            handleError(err, "sending message");
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        try {
            setLoading(true);
            setError(INITIAL_ERROR_STATE);
            await apiService.confirm();
        } catch (err) {
            handleError(err, "confirming action");
            setLoading(false);
        }
    };

    const handleStartNewChat = async () => {
        try {
            setError(INITIAL_ERROR_STATE);
            setLoading(true);
            await apiService.startWorkflow();
            setConversation([]);
            setLastMessage(null);
        } catch (err) {
            handleError(err, "starting new chat");
        } finally {
            setLoading(false);
        }
    };
```

These handlers demonstrate consistent error handling patterns and proper state management. 
The new chat handler resets conversation state while the confirm handler integrates with the tool execution workflow.

### Creating the responsive user interface

The application layout provides a modern, responsive interface with proper error display, conversation area, and input controls.

Complete the App component with the render method:

```javascript
    return (
        <div className="flex flex-col h-screen">
            <NavBar title="Temporal AI Agent 🤖" />

            {error.visible && (
                <div className="fixed top-16 left-1/2 transform -translate-x-1/2 
                    bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 
                    transition-opacity duration-300">
                    {error.message}
                </div>
            )}

            <div className="flex-grow flex justify-center px-4 py-2 overflow-hidden">
                <div className="w-full max-w-lg bg-white dark:bg-gray-900 p-8 px-3 rounded shadow-md 
                    flex flex-col overflow-hidden">
                    <div ref={containerRef} 
                        className="flex-grow overflow-y-auto pb-20 pt-10 scroll-smooth">
                        <ChatWindow
                            conversation={conversation}
                            loading={loading}
                            onConfirm={handleConfirm}
                            onContentChange={handleContentChange}
                        />
                        {done && (
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4 
                                animate-fade-in">
                                Chat ended
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 
                w-full max-w-lg bg-white dark:bg-gray-900 p-4
                border-t border-gray-300 dark:border-gray-700 shadow-lg
                transition-all duration-200"
                style={{ zIndex: 10 }}>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                }} className="flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        className={`flex-grow rounded-l px-3 py-2 border border-gray-300
                            dark:bg-gray-700 dark:border-gray-600 focus:outline-none
                            transition-opacity duration-200
                            ${loading || done ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder="Type your message..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={loading || done}
                        aria-label="Type your message"
                    />
                    <button
                        type="submit"
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r 
                            transition-all duration-200
                            ${loading || done ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={loading || done}
                        aria-label="Send message"
                    >
                        Send
                    </button>
                </form>
                
                <div className="text-right mt-3">
                    <button
                        onClick={handleStartNewChat}
                        className={`text-sm underline text-gray-600 dark:text-gray-400 
                            hover:text-gray-800 dark:hover:text-gray-200 
                            transition-all duration-200
                            ${!done ? "opacity-0 cursor-not-allowed" : ""}`}
                        disabled={!done}
                        aria-label="Start new chat"
                    >
                        Start New Chat
                    </button>
                </div>
            </div>
        </div>
    );
}
```

The interface design includes dark mode support, responsive layout with proper mobile considerations, accessibility labels, and smooth transitions. 
The fixed input area ensures easy access while the scrollable conversation area accommodates long discussions.

### Building the conversation display system

The conversation display requires sophisticated message rendering that handles different actor types and provides proper error boundaries.

Create `src/components/ChatWindow.jsx` with the conversation management system:

```javascript
import React, { memo, useCallback } from "react";
import LLMResponse from "./LLMResponse";
import MessageBubble from "./MessageBubble";
import LoadingIndicator from "./LoadingIndicator";

class ChatErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ChatWindow error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 p-4 text-center">
                    Something went wrong. Please Terminate the workflow and try again.
                </div>
            );
        }
        return this.props.children;
    }
}
```

The error boundary provides graceful degradation when conversation rendering fails, ensuring the entire application doesn't crash due to malformed message data.

Add the message parsing and rendering logic:

```javascript
const safeParse = (str) => {
    try {
        return typeof str === 'string' ? JSON.parse(str) : str;
    } catch (err) {
        console.error("safeParse error:", err, "Original string:", str);
        return str;
    }
};

const Message = memo(({ msg, idx, isLastMessage, onConfirm, onContentChange }) => {
    const { actor, response } = msg;
    
    if (actor === "user") {
        return <MessageBubble message={{ response }} isUser />;
    }
    
    if (actor === "agent") {
        const data = safeParse(response);
        return (
            <LLMResponse
                data={data}
                onConfirm={onConfirm}
                isLastMessage={isLastMessage}
                onHeightChange={onContentChange}
            />
        );
    }
    
    return null;
});

Message.displayName = 'Message';
```

The message rendering system safely parses JSON responses and delegates to specialized components based on actor type. 
Memoization prevents unnecessary re-renders during conversation updates.

Complete the chat window with conversation filtering and layout:

```javascript
const ChatWindow = memo(({ conversation, loading, onConfirm, onContentChange }) => {
    const validateConversation = useCallback((conv) => {
        if (!Array.isArray(conv)) {
            console.error("ChatWindow expected conversation to be an array, got:", conv);
            return [];
        }
        return conv;
    }, []);

    const filtered = validateConversation(conversation).filter((msg) => {
        const { actor } = msg;
        return actor === "user" || actor === "agent";
    });

    return (
        <ChatErrorBoundary>
            <div className="flex-grow flex flex-col">
                <div className="flex-grow flex flex-col justify-end overflow-y-auto space-y-3">
                    {filtered.map((msg, idx) => (
                        <Message
                            key={`${msg.actor}-${idx}-${typeof msg.response === 'string' ? msg.response : msg.response?.response}`}
                            msg={msg}
                            idx={idx}
                            isLastMessage={idx === filtered.length - 1}
                            onConfirm={onConfirm}
                            onContentChange={onContentChange}
                        />
                    ))}
                    {loading && (
                        <div className="pt-2 flex justify-center">
                            <LoadingIndicator />
                        </div>
                    )}
                </div>
            </div>
        </ChatErrorBoundary>
    );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;
```

The conversation filtering ensures only user and agent messages appear in the UI, while the loading indicator provides clear feedback during processing. 
The keying strategy prevents React rendering issues with dynamic conversation content.

### Setting up the application entry point and configuration

The application requires proper initialization and build configuration for development and production deployment.

Create `src/main.jsx` with the React application entry point:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Create `src/index.css` with Tailwind CSS integration:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in;
}
```

### Creating build and development configuration

Create `vite.config.js` for the Vite build configuration:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})
```

Create `tailwind.config.js` for Tailwind CSS configuration:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
}
```

Create the HTML template as `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Temporal AI Agent</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Bringing it all together

Your complete React frontend provides a sophisticated, real-time interface for AI agent interactions. Here are the key components:

**Advanced State Management (`src/pages/App.jsx`):**
- Intelligent polling system with 600ms intervals for real-time updates
- Debounced user input to prevent excessive API calls
- Differentiated error handling with auto-dismissal for transient errors
- Smart conversation synchronization that prevents unnecessary re-renders

**Robust API Layer (`src/services/api.js`):**
- Structured error handling with status code awareness
- Proper URL encoding and request formatting
- Clean async/await patterns with comprehensive error recovery

**Sophisticated UI Components:**
- Error boundaries preventing application crashes
- Memoized components for optimal rendering performance
- Message type differentiation with specialized rendering
- Responsive design with dark mode support

**Development Experience:**
- Vite for fast development builds and hot module replacement
- Tailwind CSS for utility-first styling with dark mode
- Modern React patterns with hooks and functional components
- Comprehensive error logging and debugging support

This React frontend demonstrates key patterns for building production-ready AI agent interfaces: intelligent state management, robust error handling, performance optimization through memoization and debouncing, and responsive design that works across devices. 
The system provides immediate feedback while gracefully handling the asynchronous nature of AI agent processing.

In the next step, you will integrate and test your complete AI agent system to ensure all components work together seamlessly.

## Step 9 — Integration and testing

In this step, you will integrate all components of your AI agent system and verify that everything works together seamlessly. 
This includes running the complete stack locally, testing conversation flows, and understanding how Temporal provides observability and debugging capabilities.

### Understanding the integration challenge

Building a distributed AI agent system requires coordinating multiple components - Temporal server, worker processes, API backend, and React frontend - that must communicate reliably across different protocols and execution contexts. 
The challenge is ensuring all components are properly configured, can discover each other, and handle various failure scenarios gracefully.

Your integrated system needs to manage asynchronous workflows, maintain conversation state across components, handle tool executions with proper confirmation flows, provide real-time updates to the frontend, and enable debugging when issues arise. 
Temporal's architecture provides built-in solutions for many of these challenges through its durable execution model.

### Starting the Temporal development server

The first requirement is running a local Temporal server that coordinates workflow execution and provides durability guarantees.

Start the development server:

```command
temporal server start-dev
```

The development server includes a web UI at `http://localhost:8233` that provides workflow visibility, execution history, and debugging capabilities. Keep this terminal open as the server needs to run continuously.

### Creating and running the Temporal worker

The worker process executes your workflows and activities, providing the computational resources for your AI agent system.

Open your text editor and create `worker/worker.py` with the complete worker implementation:

```python
import asyncio
import concurrent.futures
import logging
import os

from dotenv import load_dotenv
from temporalio.worker import Worker

from activities.tool_activities import ToolActivities, dynamic_tool_activity
from shared.config import TEMPORAL_TASK_QUEUE, get_temporal_client
from workflows.agent_goal_workflow import AgentGoalWorkflow


async def main():
    # Load environment variables
    load_dotenv(override=True)

    # Print LLM configuration info
    llm_model = os.environ.get("LLM_MODEL", "openai/gpt-4")
    print(f"Worker will use LLM model: {llm_model}")

    # Create the client
    client = await get_temporal_client()

    # Initialize the activities class
    activities = ToolActivities()
    print(f"ToolActivities initialized with LLM model: {llm_model}")

    print("Worker ready to process tasks!")
    logging.basicConfig(level=logging.WARN)
```

The worker initialization loads environment configuration and establishes connection to the Temporal server. 
It prints diagnostic information to help verify proper setup.

Complete the worker with execution configuration:

```python
    # Run the worker
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as activity_executor:
        worker = Worker(
            client,
            task_queue=TEMPORAL_TASK_QUEUE,
            workflows=[AgentGoalWorkflow],
            activities=[
                activities.agent_validatePrompt,
                activities.agent_toolPlanner,
                activities.get_wf_env_vars,
                dynamic_tool_activity,
            ],
            activity_executor=activity_executor,
        )

        print(f"Starting worker, connecting to task queue: {TEMPORAL_TASK_QUEUE}")
        print("Ready to begin processing...")
        await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

The worker configuration specifies which workflows and activities it can execute. 
The thread pool executor enables concurrent activity execution for better performance.

Start the worker in a new terminal:

```command
uv run python worker/worker.py
```

You should see output confirming the worker is connected and ready to process tasks:

```
Worker will use LLM model: openai/gpt-4
ToolActivities initialized with LLM model: openai/gpt-4
Worker ready to process tasks!
Starting worker, connecting to task queue: agent-task-queue
Ready to begin processing...
```

### Starting the FastAPI backend

The API backend provides HTTP endpoints for the frontend to interact with Temporal workflows.

In a new terminal, start the FastAPI server:

```command
uv run uvicorn api.main:app --reload
```

The API server will start on port 8000 with automatic reloading enabled for development. You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
Address: localhost:7233, Namespace default
```

### Starting the React frontend

The frontend provides the user interface for interacting with your AI agent.

In a new terminal, navigate to the frontend directory and start the development server:

```command
cd frontend
npm install  # Install dependencies if not done yet
npm run dev
```

The Vite development server will start on port 5173:

```
VITE v6.3.5  ready in 150 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Testing the complete system

With all components running, open your web browser to `http://localhost:5173` to interact with your AI agent system.

The initial interface shows an empty conversation area. The system automatically initializes when you first access it, creating a new workflow instance. You'll see the agent's greeting message appear:

```
Agent: Welcome! I'm here to help you plan a trip to an event in North America. 
I can find events happening in major cities, search for flights to get you there, 
and create an invoice for your trip. What city would you like to explore for events, 
and what month are you interested in?
```

Test the conversation flow by responding with a city and month:

```
You: I'd like to see events in San Francisco in March
```

The agent will process your request and search for events:

```
Agent: I'll search for events in San Francisco in March. I'll also check one month 
before and after to give you more options.

[Tool execution occurs here]

Agent: I found several great events in San Francisco around March! Here are the options:

1. **Game Developers Conference** (March 17-21, 2025) - The world's largest 
   professional game industry event
2. **SF Beer Week** (February 7-16, 2025) - Ten days of beer events throughout 
   the Bay Area  
3. **Cherry Blossom Festival** (April 12-20, 2025) - Celebrating Japanese 
   culture and the blooming cherry blossoms

Would you like to search for flights to any of these events?
```

### Understanding the system flow

The integration demonstrates several key patterns of your AI agent system working together.

**Workflow initialization**: When the frontend first loads, it attempts to fetch conversation history. Finding none, the API automatically starts a new workflow with the agent's starter prompt.

**Message flow**: User messages travel from the React frontend through the FastAPI backend to the Temporal workflow via signals. The workflow processes messages, executes activities for LLM calls, and updates conversation state.

**Tool execution**: When the agent determines a tool should be run, it executes the tool as a Temporal activity with automatic retry on failure. Tool results are incorporated into the conversation history.

**State synchronization**: The frontend polls the backend every 600ms for conversation updates. The backend queries the workflow for current conversation state, providing near real-time updates.

**Error handling**: Network failures, workflow errors, and other issues are handled gracefully with appropriate user feedback and recovery mechanisms.

### Testing tool confirmation flows

If you have `SHOW_CONFIRM=True` in your environment configuration, test the confirmation flow:

```
You: Yes, let's look for flights from Los Angeles to San Francisco for the 
Game Developers Conference
```

The agent will prepare the flight search and request confirmation:

```
Agent: I'll search for flights from Los Angeles to San Francisco for the 
Game Developers Conference (March 17-21, 2025). Let me find return flights 
departing around March 16 and returning around March 22.

[Confirmation button appears in the UI]
```

Click the confirmation button to approve the tool execution. The system will execute the flight search and display results.

### Monitoring with Temporal Web UI

Open the Temporal Web UI at `http://localhost:8233` to observe your running workflows.

Navigate to the Workflows page to see your agent workflow. Click on the workflow ID to view:

- **Execution history**: Complete timeline of all workflow events
- **Pending activities**: Currently executing activities with retry status
- **Query results**: Current conversation state and tool data
- **Stack trace**: Workflow code execution position
- **Input/Output**: Full workflow input parameters and results

The event history shows detailed information about each activity execution, including:
- LLM prompt validation calls
- Tool planning activities  
- Dynamic tool executions
- Signal receipts for user messages

This visibility helps debug issues and understand system behavior.

### Testing error scenarios

Understanding how the system handles errors is crucial for production readiness.

**Test language model failures** by temporarily setting an invalid API key:

```bash
export LLM_KEY="invalid-key"
```

Restart the worker and observe how Temporal automatically retries failed activities with exponential backoff.

**Test network failures** by stopping the worker while a conversation is active. Send a message through the frontend and observe:
- Frontend shows "Error fetching conversation. Retrying..."
- Workflow execution pauses at the pending activity
- When worker restarts, execution resumes exactly where it left off

**Test frontend resilience** by stopping and restarting the API backend. The frontend continues polling and automatically reconnects when the backend returns.

### Running comprehensive tests

Create a test script to verify all tools work correctly. Create `scripts/test_integration.py`:

```python
import asyncio
from tools.find_events import find_events
from tools.search_flights import search_flights
from tools.create_invoice import create_invoice

async def test_all_tools():
    print("Testing Event Search...")
    events_result = find_events({"city": "New York", "month": "December"})
    print(f"Found {len(events_result['events'])} events")
    
    print("\nTesting Flight Search...")
    flights_result = search_flights({
        "origin": "Los Angeles",
        "destination": "New York",
        "dateDepart": "2024-12-15",
        "dateReturn": "2024-12-20"
    })
    print(f"Found {len(flights_result['results'])} flights")
    
    print("\nTesting Invoice Creation...")
    invoice_result = create_invoice({
        "amount": 500.00,
        "tripDetails": "Flight from LAX to NYC",
        "email": "test@example.com"
    })
    print(f"Invoice status: {invoice_result['invoiceStatus']}")
    
    print("\nAll tools tested successfully!")

if __name__ == "__main__":
    asyncio.run(test_all_tools())
```

Run the integration test:

```command
uv run python scripts/test_integration.py
```

### Performance monitoring and optimization

Monitor your system's performance characteristics during testing:

**Language model latency**: Activities typically complete in 1-3 seconds depending on model and prompt complexity. The Temporal UI shows exact durations for each activity execution.

**Polling efficiency**: The 600ms polling interval provides responsive updates without overwhelming the backend. Monitor browser network tab to verify reasonable request rates.

**Worker resource usage**: The worker's thread pool handles concurrent activities efficiently. Monitor process memory and CPU usage during active conversations.

**Workflow history size**: Long conversations accumulate history. The workflow implements continuation patterns to handle conversations exceeding 250 messages.

### Debugging common integration issues

**"Workflow worker unavailable" errors** indicate the worker isn't running or can't connect to Temporal. Verify:
- Worker process is running
- Temporal server is accessible
- Task queue names match between worker and API

**Empty conversation history** might indicate workflow initialization issues. Check:
- API logs for workflow start confirmation
- Temporal UI for workflow existence
- Browser console for API errors

**Tool execution failures** appear in activity retry attempts. Investigate:
- Worker logs for detailed error messages
- Activity input parameters in Temporal UI
- Environment variables for tool configuration

### Bringing it all together

Your complete AI agent system demonstrates sophisticated distributed system patterns:

**Component Architecture:**
- Temporal server providing durable orchestration
- Python worker executing workflows and activities
- FastAPI backend bridging HTTP and Temporal
- React frontend with real-time updates

**Reliability Features:**
- Automatic retry for transient failures
- Durable conversation state across restarts
- Graceful degradation with clear error messages
- Complete observability through Temporal UI

**Development Experience:**
- Hot reloading for frontend and API changes
- Comprehensive logging for debugging
- Integration test suite for verification
- Clear separation of concerns

This integrated system provides a production-ready foundation for building sophisticated AI agents. The combination of Temporal's durability guarantees, proper error handling, and comprehensive observability ensures your agent can handle real-world usage patterns reliably.

In the final step, you will learn deployment considerations and next steps for extending your AI agent system.

## Conclusion

In this tutorial, you built a complete AI agent system using Temporal Workflows, demonstrating how durable execution enables reliable, production-ready agentic AI applications. Your agent can maintain multi-turn conversations, execute tools with user confirmation, and recover gracefully from failures.

### What you accomplished

Throughout this tutorial, you created:

- **A durable conversation orchestrator** using Temporal Workflows that maintains state across failures and provides exactly-once execution guarantees
- **Intelligent tool execution** with Activities that wrap external APIs, language model calls, and business logic with automatic retry and timeout handling
- **Sophisticated prompt engineering** that guides language models through complex multi-step workflows while maintaining conversation coherence
- **A responsive web interface** with React and real-time updates that provides intuitive interaction patterns for AI agent conversations
- **Production-ready error handling** at every layer, from network failures to invalid user input, with appropriate recovery mechanisms

### Key architectural patterns

Your implementation demonstrates several important patterns for building AI agent systems:

**Durability through orchestration**: Temporal Workflows provide automatic state persistence, ensuring conversations survive process crashes, network failures, and infrastructure issues. This durability is essential for AI agents that manage long-running, stateful interactions.

**Separation of concerns**: The architecture cleanly separates orchestration logic (Workflows), external interactions (Activities), tool implementations (Python functions), and user interface (React), making the system maintainable and extensible.

**Observability by design**: Every execution step is automatically recorded in Temporal's event history, providing complete visibility into agent behavior, decision-making, and failure patterns without additional instrumentation.

**Flexible tool integration**: The dynamic activity pattern enables adding new tools without modifying the core workflow logic, supporting evolving agent capabilities as requirements change.

### Next steps

Your AI agent system provides a foundation for many enhancements:

**Add more sophisticated tools**: Integrate with real APIs for weather data, calendar systems, payment processing, or domain-specific services your agent needs to access.

**Implement multi-agent patterns**: Create specialized agents for different domains and orchestrate their collaboration through parent workflows that coordinate multiple agent instances.

**Enhance conversation memory**: Add vector databases for semantic search over past conversations, enabling agents to reference previous interactions and learn from history.

**Deploy to production**: Use Temporal Cloud or self-hosted Temporal clusters for production deployment, implementing proper authentication, monitoring, and scaling strategies.

**Optimize language model usage**: Implement caching strategies, prompt compression techniques, and model selection logic to balance cost and performance.

### Production considerations

When deploying your AI agent system to production, consider:

**Security**: Implement proper authentication for the API layer, encrypt sensitive data in workflow state, and follow security best practices for handling user data and API credentials.

**Scalability**: Temporal workflows scale horizontally by adding more workers. Monitor workflow and activity execution times to identify bottlenecks and optimize resource allocation.

**Cost management**: Language model API calls can be expensive. Implement token counting, set up usage alerts, and consider using smaller models for validation tasks.

**Error handling**: Enhance error messages for better user experience, implement circuit breakers for external services, and set up comprehensive monitoring and alerting.

**Compliance**: Ensure your agent system meets relevant compliance requirements for data handling, user consent, and audit trails, leveraging Temporal's built-in event history for audit purposes.

### Resources for continued learning

To deepen your understanding of Temporal and agentic AI:

- Explore the [Temporal documentation](https://docs.temporal.io) for advanced workflow patterns and best practices
- Review the [LiteLLM documentation](https://docs.litellm.ai) for integrating additional language models
- Study [agentic AI patterns](https://www.anthropic.com/research/building-effective-agents) for more sophisticated agent architectures
- Join the [Temporal community](https://temporal.io/slack) for support and to share your experiences

### Final thoughts

You've successfully built a sophisticated AI agent system that combines the power of large language models with the reliability of durable execution. This foundation enables you to create AI agents that can handle complex, multi-step workflows while maintaining the robustness required for production applications.

The combination of Temporal's orchestration capabilities with modern AI technologies opens new possibilities for building intelligent, reliable, and observable agent systems. As you extend and deploy your agent, remember that the patterns you've learned - durability, separation of concerns, proper error handling, and comprehensive observability - will serve you well in building any distributed system.

Continue experimenting, building, and sharing your experiences with the community. The future of AI agents is being written by developers like you who understand how to combine powerful AI capabilities with robust engineering practices.