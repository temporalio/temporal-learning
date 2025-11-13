---
id: long-running-mcp-hitl
sidebar_position: 2
keywords: [temporal, mcp, model context protocol, ai, durability, workflows, human-in-the-loop, signals, queries]
tags: [temporal, mcp, ai, workflows, human-in-the-loop]
last_update:
  date: 2025-11-13
  author: Angela Zhou
title: "Part 2: Building Long-Running MCP Tools with Human-in-the-Loop"
description: Learn how to build long-running MCP tools with Temporal's signals and queries to implement human-in-the-loop patterns that can wait for human approval while maintaining durability.
image: /img/temporal-logo-twitter-card.png
---

# Building Long-Running MCP Tools with Human-in-the-Loop

In the [previous tutorial](/docs/tutorials/ai/building-mcp-tools-with-temporal/introducing-mcp-temporal/), you built a weather MCP server that demonstrated how Temporal makes tools durable and fault-tolerant. But what about operations that need to wait for human input? What if your AI tool needs to pause and wait for approval before proceeding?

Many real-world workflows require human oversight. Consider an invoice processing system—you might want an AI agent to prepare invoices automatically, but you still want human approval before actually charging a customer. Or imagine a content moderation system that flags questionable content for human review before taking action.

Traditional approaches to human-in-the-loop (HITL) systems face significant challenges:

- **Maintaining state during long waits** - If your process crashes while waiting for approval, you lose all context
- **Timeout handling** - What happens if a human never responds?
- **Querying current status** - How do you check if approval is still pending?
- **Coordinating signals** - How do you safely route approval/rejection signals to the right workflow instance?

Temporal solves these problems with **signals** and **queries**. Signals allow you to send data to running workflows, while queries let you safely read workflow state. Combined with Temporal's durability guarantees, you can build HITL systems that wait indefinitely for human input without consuming resources or risking data loss.

In this tutorial, you'll build an invoice processing MCP tool that demonstrates human-in-the-loop patterns. The tool will process invoices automatically but pause to wait for human approval before finalizing payments—and it will use Temporal's durable timers to handle approval deadlines.

## Prerequisites

Before you begin, you'll need:

- [Claude Desktop](https://www.claude.com/download)
- Python with uv installed
- Completion of [Part 1: Creating a Durable Weather MCP Server](/docs/tutorials/ai/building-mcp-tools-with-temporal/introducing-mcp-temporal/)
- Familiarity with MCP and Temporal basics

## What You'll Learn

By the end of this tutorial, you'll understand:

- How to use Temporal's durable timers for long-running operations
- How to implement signals to send data to running workflows
- How to implement queries to safely read workflow state
- How to debug and monitor MCP tools using Temporal Web UI
- How to build production-ready human-in-the-loop patterns

## Understanding Durable Timers

Before diving into signals and queries, let's understand one of Temporal's most powerful features: **durable timers**.

Traditional async timers (`asyncio.sleep()` in Python) have a critical flaw—they're lost when your process crashes or restarts. If your application is waiting for 5 days and crashes on day 3, you lose all progress.

**Temporal's durable timers survive crashes and restarts.** When you use `workflow.sleep()`, Temporal records the timer in the workflow's event history. If your worker crashes, when it restarts, Temporal replays the workflow and reinstates the timer exactly where it left off.

Even better, **during waiting periods, the workflow instance is not consuming CPU or memory**. The workflow is persisted in Temporal's database, and the worker can process other tasks. When the timer completes, Temporal reactivates the workflow automatically.

### Example: A Simple Durable Timer

```python
from temporalio import workflow
from datetime import timedelta

@workflow.defn
class InvoiceWorkflow:
    @workflow.run
    async def run(self, invoice: dict) -> str:
        # Process invoice line items
        for line in invoice.get("lines", []):
            await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )

        # Wait for 20 seconds - this timer is durable!
        # If the worker crashes during this sleep, it will resume when restarted
        await workflow.sleep(timedelta(seconds=20))

        return "Invoice processed successfully"
```

In this example, if your worker process crashes during the 20-second sleep, when it restarts, Temporal will replay the workflow and continue the timer from where it left off. The invoice processing logic won't be re-executed because Temporal knows it already completed.

## Building the Invoice Processing System

Let's build a complete invoice processing system that demonstrates human-in-the-loop patterns with Temporal. The system will:

1. Accept invoice data from an MCP tool
2. Process payment line items automatically
3. Wait for human approval (with a timeout)
4. Allow humans to query the current status
5. Handle both approval and rejection signals

### Project Setup

First, create a new directory for this project:

```bash
mkdir invoice-mcp-tutorial
cd invoice-mcp-tutorial
```

Initialize a new Python project with `uv`:

```bash
uv init
```

Add the required dependencies:

```bash
uv add temporalio fastmcp
```

### Step 1: Define the Invoice Activities

Create a file called `activities.py` that defines the payment processing logic:

```python
from temporalio import activity

@activity.defn
async def process_payment(line_item: dict) -> str:
    """Process a single invoice line item payment.

    Args:
        line_item: Dictionary containing item, amount, and description
    """
    item = line_item.get("item", "Unknown")
    amount = line_item.get("amount", 0.0)

    # In a real system, this would call a payment gateway
    # For this tutorial, we'll simulate processing
    activity.logger.info(f"Processing payment: {item} - ${amount}")

    return f"Processed payment for {item}: ${amount}"
```

This Activity simulates calling a payment gateway. In production, this would be where you interact with Stripe, PayPal, or another payment processor.

### Step 2: Create the Invoice Workflow with Signals and Queries

Now let's build the workflow that orchestrates invoice processing and implements human-in-the-loop approval. Create a file called `workflow.py`:

```python
from temporalio import workflow
from datetime import timedelta

# Import Activities using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from activities import process_payment

@workflow.defn
class InvoiceWorkflow:
    def __init__(self) -> None:
        # Track approval state
        self.approved: bool | None = None
        self.status: str = "Processing"

    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice with human approval.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        # Step 1: Process each line item
        self.status = "Processing payments"
        results = []

        for line in invoice.get("lines", []):
            result = await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )
            results.append(result)

        # Step 2: Wait for approval (with a 5-day timeout)
        self.status = "Awaiting approval"

        try:
            await workflow.wait_condition(
                lambda: self.approved is not None,
                timeout=timedelta(days=5)
            )
        except TimeoutError:
            self.status = "Approval timeout - invoice rejected"
            return "Invoice rejected: approval timeout after 5 days"

        # Step 3: Process based on approval decision
        if self.approved:
            self.status = "Approved and finalized"
            return f"Invoice approved and processed:\n" + "\n".join(results)
        else:
            self.status = "Rejected by approver"
            return "Invoice rejected by approver"

    @workflow.signal
    async def approve_invoice(self) -> None:
        """Signal to approve the invoice."""
        workflow.logger.info("Invoice approved via signal")
        self.approved = True

    @workflow.signal
    async def reject_invoice(self) -> None:
        """Signal to reject the invoice."""
        workflow.logger.info("Invoice rejected via signal")
        self.approved = False

    @workflow.query
    def get_status(self) -> str:
        """Query to get current invoice status."""
        return self.status
```

Let's break down the key concepts:

#### Workflow State

```python
def __init__(self) -> None:
    self.approved: bool | None = None
    self.status: str = "Processing"
```

The workflow maintains state using instance variables. This state is automatically persisted by Temporal and survives crashes.

#### Signals: Sending Data to Running Workflows

```python
@workflow.signal
async def approve_invoice(self) -> None:
    """Signal to approve the invoice."""
    workflow.logger.info("Invoice approved via signal")
    self.approved = True
```

Signals allow external systems to send input to running workflows. When someone approves an invoice, they send an `approve_invoice` signal that sets `self.approved = True`. Signals can:

- Modify workflow state
- Trigger conditional logic
- Unblock waiting conditions
- Carry data payloads

#### Queries: Reading Workflow State

```python
@workflow.query
def get_status(self) -> str:
    """Query to get current invoice status."""
    return self.status
```

Queries let you safely read workflow state without modifying it. They're synchronous operations that return immediately. Queries are perfect for:

- Checking current status
- Retrieving partial results
- Building dashboards and monitoring tools
- Providing real-time feedback to users

#### Wait Conditions: Pausing Until Signals Arrive

```python
await workflow.wait_condition(
    lambda: self.approved is not None,
    timeout=timedelta(days=5)
)
```

This is the heart of the human-in-the-loop pattern. The workflow pauses here and waits until either:

1. A signal changes `self.approved` from `None` to `True` or `False`
2. The 5-day timeout expires

During this wait:
- The workflow is not consuming CPU or memory
- The workflow state is persisted in Temporal
- The worker can process other workflows
- If the worker crashes, the wait continues after restart

### Step 3: Create the MCP Server with Multiple Tools

Now let's create an MCP server that exposes four tools for interacting with invoice workflows. Create a file called `invoice_server.py`:

```python
from temporalio.client import Client
from fastmcp import FastMCP
from workflow import InvoiceWorkflow

# Initialize FastMCP server
mcp = FastMCP("invoice-processor")

@mcp.tool()
async def process_invoice(invoice_data: dict) -> str:
    """Start processing an invoice with the given data.

    Args:
        invoice_data: Dictionary containing:
            - id: Unique invoice identifier
            - lines: List of line items with item, amount, description

    Returns:
        Workflow ID for tracking
    """
    client = await Client.connect("localhost:7233")

    invoice_id = invoice_data.get("id", "unknown")

    handle = await client.start_workflow(
        InvoiceWorkflow.run,
        invoice_data,
        id=f"invoice-{invoice_id}",
        task_queue="invoice-task-queue",
    )

    return f"Started processing invoice {invoice_id}. Workflow ID: invoice-{invoice_id}"

@mcp.tool()
async def approve_invoice(invoice_id: str) -> str:
    """Approve a pending invoice.

    Args:
        invoice_id: The invoice identifier
    """
    client = await Client.connect("localhost:7233")

    handle = client.get_workflow_handle(f"invoice-{invoice_id}")
    await handle.signal(InvoiceWorkflow.approve_invoice)

    return f"Sent approval signal for invoice {invoice_id}"

@mcp.tool()
async def reject_invoice(invoice_id: str) -> str:
    """Reject a pending invoice.

    Args:
        invoice_id: The invoice identifier
    """
    client = await Client.connect("localhost:7233")

    handle = client.get_workflow_handle(f"invoice-{invoice_id}")
    await handle.signal(InvoiceWorkflow.reject_invoice)

    return f"Sent rejection signal for invoice {invoice_id}"

@mcp.tool()
async def get_invoice_status(invoice_id: str) -> str:
    """Get the current status of an invoice.

    Args:
        invoice_id: The invoice identifier
    """
    client = await Client.connect("localhost:7233")

    handle = client.get_workflow_handle(f"invoice-{invoice_id}")
    status = await handle.query(InvoiceWorkflow.get_status)

    return f"Invoice {invoice_id} status: {status}"

if __name__ == "__main__":
    mcp.run(transport='stdio')
```

This MCP server provides four tools:

1. **process_invoice** - Starts a new invoice workflow
2. **approve_invoice** - Sends an approval signal to a running workflow
3. **reject_invoice** - Sends a rejection signal to a running workflow
4. **get_invoice_status** - Queries the current status of a workflow

Notice how we interact with running workflows:

- `client.get_workflow_handle(workflow_id)` - Gets a handle to an existing workflow
- `handle.signal(method)` - Sends a signal to the workflow
- `handle.query(method)` - Queries the workflow state

### Step 4: Create the Worker

Create a file called `worker.py` that runs your workflows and activities:

```python
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from activities import process_payment
from workflow import InvoiceWorkflow

async def main():
    # Connect to Temporal service
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="invoice-task-queue",
        workflows=[InvoiceWorkflow],
        activities=[process_payment],
    )

    print("Worker started. Listening for invoice workflows...")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### Step 5: Configure Claude Desktop

Create a `claude_desktop_config.json` file:

```json
{
    "mcpServers": {
      "invoice-processor": {
        "command": "uv",
        "args": [
          "--directory",
          "/Users/yourname/path/to/invoice-mcp-tutorial",
          "run",
          "invoice_server.py"
        ]
      }
    }
  }
```

Replace the path with your actual project directory, then copy it to Claude's config directory:

```bash
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Completely quit and restart Claude Desktop.

### Step 6: Run Your Application

You need three terminal windows running:

#### Terminal 1 - Start the Temporal Server

```bash
temporal server start-dev
```

This starts the Temporal service on `localhost:8233`.

#### Terminal 2 - Start Your Worker

```bash
uv run worker.py
```

You should see: "Worker started. Listening for invoice workflows..."

#### Terminal 3 - (Optional) Monitor Temporal Web UI

Open your browser and navigate to `http://localhost:8233` to access the Temporal Web UI where you can observe workflow executions in real-time.

## Testing the Human-in-the-Loop Pattern

Now let's test the complete invoice approval workflow with Claude Desktop.

### Step 1: Process an Invoice

Open Claude Desktop and ask:

```
Process this invoice:
{
  "id": "INV-001",
  "lines": [
    {"item": "Web Development", "amount": 5000.00, "description": "Frontend work"},
    {"item": "Design Services", "amount": 2000.00, "description": "UI/UX design"}
  ]
}
```

Claude will use the `process_invoice` tool and return a workflow ID. At this point:

- The workflow has processed the payment line items
- It's now waiting for approval
- The workflow will wait for up to 5 days

### Step 2: Check the Status

Ask Claude:

```
What's the status of invoice INV-001?
```

Claude will use the `get_invoice_status` tool and should return: "Awaiting approval"

### Step 3: Observe in Temporal Web UI

Navigate to `http://localhost:8233` and find your workflow. You should see:

- The workflow status is "Running"
- The activities for processing payments have completed
- The workflow is currently waiting at the `wait_condition`
- The event history shows all the signals and activities

### Step 4: Approve or Reject

To approve the invoice, ask Claude:

```
Approve invoice INV-001
```

Or to reject it:

```
Reject invoice INV-001
```

Claude will send the appropriate signal, and the workflow will immediately proceed based on the decision.

### Step 5: Verify Completion

Check the status again or look at the Temporal Web UI. You should see:

- The workflow has completed
- The final status is either "Approved and finalized" or "Rejected by approver"
- The complete event history showing all signals, activities, and state changes

## Debugging with Temporal Web UI

The Temporal Web UI is invaluable for debugging MCP tools. For your invoice workflow, you can see:

### Event History

Every action in your workflow is recorded:
- **WorkflowExecutionStarted** - When the workflow began
- **ActivityTaskScheduled** - When each payment activity was queued
- **ActivityTaskCompleted** - When each payment processed
- **WorkflowExecutionSignaled** - When approval/rejection signals arrived
- **WorkflowExecutionCompleted** - The final result

### Input and Output

- Click on any event to see its input parameters
- View activity results and return values
- Inspect signal payloads
- See the workflow's final output

### Timeline View

- Visual representation of your workflow's execution
- See how long each activity took
- Identify where the workflow is currently waiting
- Understand the sequence of events

### Stack Trace

If your workflow encounters an error:
- See the exact line of code that failed
- View the full stack trace
- Access activity error messages
- Understand retry attempts

## Testing Durability with Long Timeouts

Let's demonstrate that workflows truly wait for days without consuming resources.

### Modify the Timeout

In `workflow.py`, change the approval timeout to something observable:

```python
# Change from 5 days to 2 minutes for testing
await workflow.wait_condition(
    lambda: self.approved is not None,
    timeout=timedelta(minutes=2)
)
```

Restart your worker to load the changes.

### Start a Workflow Without Approving

1. Ask Claude to process a new invoice
2. Check the status - it should say "Awaiting approval"
3. Wait 2 minutes without approving or rejecting
4. After 2 minutes, check the status again

You'll see the workflow automatically completed with "Approval timeout - invoice rejected". During those 2 minutes:

- The workflow wasn't consuming CPU or memory
- Your worker could process other workflows
- If you had restarted the worker, the timeout would continue exactly where it left off

In production, you could set this timeout to days or weeks. The workflow would reliably wait without any resource consumption.

## What You've Learned

You've now built a production-ready human-in-the-loop system using MCP and Temporal. The key takeaways:

### Durable Timers
- `workflow.sleep()` persists across crashes and restarts
- Workflows don't consume resources while waiting
- Perfect for long approval windows

### Signals
- Send data to running workflows
- Trigger conditional logic
- Unblock wait conditions
- Can be called multiple times

### Queries
- Safely read workflow state without modification
- Return immediately (synchronous)
- Perfect for status checks and monitoring
- Don't affect workflow execution

### Temporal Web UI
- Complete visibility into workflow execution
- Debug with event history and stack traces
- Monitor long-running operations
- Understand signal and activity timing

## Real-World Applications

The patterns you've learned apply to many scenarios:

- **Content Moderation** - AI flags content, humans review and approve/reject
- **Financial Approvals** - Automated expense reports with manager approval
- **Compliance Reviews** - AI drafts documents, legal team reviews
- **Customer Support** - Chatbots escalate to humans when needed
- **Order Processing** - Automated ordering with manual verification steps

In all these cases, Temporal ensures:
- No lost approvals due to system crashes
- Reliable timeout handling
- Complete audit trail of decisions
- Scalable to thousands of concurrent approvals

## What's Next?

You've completed the human-in-the-loop tutorial! You now understand how to build durable, long-running MCP tools that can safely wait for human input.

To continue learning:

- Explore the complete code in the [GitHub repository](https://github.com/temporalio/edu-ai-workshop-mcp)
- Take the [Temporal 102 course](https://learn.temporal.io/courses/temporal_102/) to learn more about durable timers
- Check out the [Temporal documentation](https://docs.temporal.io) for advanced patterns
- Join the [Temporal community](https://temporal.io/community) to share what you're building

Sign up [here](https://pages.temporal.io/get-updates-education) to get notified about new tutorials and educational content.
