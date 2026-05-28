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
  { id: "building-system", label: "Building the invoice system" },
  { id: "test-integration", label: "Test the integration" },
  { id: "youre-done", label: "You're done!" },
];

const ACTIVITIES_PY = `from temporalio import activity

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
    activity.logger.info(f"Processing payment: {item} - \${amount}")

    return f"Processed payment for {item}: \${amount}"`;

const WORKFLOW_IMPORTS_PY = `from temporalio import workflow
from datetime import timedelta`;

const WORKFLOW_IMPORT_ACTIVITY_PY = `# Import Activities using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from activities import process_payment`;

const WORKFLOW_CLASS_STUB_PY = `@workflow.defn
class InvoiceWorkflow:
    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        # Your orchestration logic will go here`;

const WORKFLOW_RUN_PY = `@workflow.defn
class InvoiceWorkflow:
    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        results = []

        for line in invoice.get("lines", []):
            result = await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )
            results.append(result)

        return f"Invoice processed:\\n" + "\\n".join(results)`;

const WORKFLOW_V1_PY = `from temporalio import workflow
from datetime import timedelta

# Import Activities using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from activities import process_payment

@workflow.defn
class InvoiceWorkflow:
    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        results = []

        for line in invoice.get("lines", []):
            result = await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )
            results.append(result)

        return f"Invoice processed:\\n" + "\\n".join(results)`;

const WORKFLOW_INIT_PY = `@workflow.defn
class InvoiceWorkflow:
    def __init__(self) -> None:
        # Track approval state
        self.approved: bool | None = None
        self.status: str = "Processing"`;

const SIGNAL_METHODS_PY = `    @workflow.signal
    async def approve_invoice(self) -> None:
        """Signal to approve the invoice."""
        workflow.logger.info("Invoice approved via signal")
        self.approved = True

    @workflow.signal
    async def reject_invoice(self) -> None:
        """Signal to reject the invoice."""
        workflow.logger.info("Invoice rejected via signal")
        self.approved = False`;

const WAIT_CONDITION_RUN_PY = `    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice with human approval.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        # Step 1: Wait for approval (with a 5-day timeout)
        await workflow.wait_condition(
            lambda: self.approved is not None,
            timeout=timedelta(days=5),
        )

        # Step 2: Auto-reject if no approval happened after 5 days
        if self.approved is None:
            self.approved = False
            return "REJECTED"

        # Step 3: Only process payments if approved
        for line in invoice.get("lines", []):
            await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )

        self.status = "Completed"
        return "COMPLETED"`;

const WORKFLOW_V2_PY = `from temporalio import workflow
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

    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice with human approval.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """

        await workflow.wait_condition(
            lambda: self.approved is not None,
            timeout=timedelta(days=5),
        )

        # Auto-reject if no approval happened after 5 days
        if self.approved is None:
            self.approved = False
            return "REJECTED"

        # Only process payments if approved
        self.status = "Processing payments"

        for line in invoice.get("lines", []):
            await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )

        self.status = "Completed"
        return "COMPLETED"`;

const STATUS_RUN_PY = `    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice with human approval.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        # Step 1: Wait for approval (with a 5-day timeout)
        self.status = "Awaiting approval"  # Update status before waiting

        await workflow.wait_condition(
            lambda: self.approved is not None,
            timeout=timedelta(days=5),
        )

        # Step 2: Auto-reject if no approval happened after 5 days
        if self.approved is None:
            self.approved = False
            self.status = "Approval timeout - invoice rejected"  # Update status on timeout
            return "REJECTED"

        # Step 3: If rejected, update status and return early
        if not self.approved:
            self.status = "Rejected by approver"  # Update status on rejection
            return "REJECTED"

        # Step 4: Only process payments if approved
        self.status = "Processing payments"  # Update status before processing

        for line in invoice.get("lines", []):
            await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )

        self.status = "Completed"  # Update status on completion
        return "COMPLETED"`;

const QUERY_METHOD_PY = `    @workflow.query
    def get_status(self) -> str:
        """Query to get current invoice status."""
        return self.status`;

const WORKFLOW_V3_PY = `from temporalio import workflow
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

    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice with human approval.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        # Step 1: Wait for approval (with a 5-day timeout)
        self.status = "Awaiting approval"

        await workflow.wait_condition(
            lambda: self.approved is not None,
            timeout=timedelta(days=5),
        )

        # Step 2: Auto-reject if no approval happened after 5 days
        if self.approved is None:
            self.approved = False
            self.status = "Approval timeout - invoice rejected"
            return "REJECTED"

        # Step 3: If rejected by human, return early
        if not self.approved:
            self.status = "Rejected by approver"
            return "REJECTED"

        # Step 4: Only process payments if approved
        self.status = "Processing payments"

        for line in invoice.get("lines", []):
            await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )

        self.status = "Completed"
        return "COMPLETED"`;

const DURABLE_TIMER_EXAMPLE_PY = `from temporalio import workflow
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

        # This timer is durable!
        # If the worker crashes during this sleep, it will resume when restarted
        await workflow.sleep(timedelta(seconds=20))

        return "Invoice processed successfully"`;

const WORKFLOW_FINAL_PY = `from temporalio import workflow
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

    @workflow.run
    async def run(self, invoice: dict) -> str:
        """Process an invoice with human approval.

        Args:
            invoice: Dictionary containing invoice lines and metadata
        """
        # Wait for approval (with a 5-day timeout)
        await workflow.wait_condition(
            lambda: self.approved is not None,
            timeout=timedelta(days=5),
        )

        # Auto-reject if no approval happened after 5 days
        if self.approved is None:
            self.approved = False
            return "REJECTED"

        # Only process payments if approved
        self.status = "Processing payments"

        for line in invoice.get("lines", []):
            # Add a durable 2-second delay before processing each payment
            await workflow.sleep(timedelta(seconds=2))

            await workflow.execute_activity(
                process_payment,
                line,
                start_to_close_timeout=timedelta(seconds=30),
            )

        self.status = "Completed"
        return "COMPLETED"`;

const MCP_INIT_PY = `from temporalio.client import Client
from fastmcp import FastMCP
from workflow import InvoiceWorkflow

# Initialize FastMCP server with a name
mcp = FastMCP("invoice-processor")`;

const PROCESS_INVOICE_TOOL_PY = `@mcp.tool()
async def process_invoice(invoice_data: dict) -> str:
    """Start processing an invoice with the given data.

    Args:
        invoice_data: Dictionary containing:
            - id: Unique invoice identifier
            - lines: List of line items with item, amount, description

    Returns:
        Workflow ID for tracking
    """
    # Step 1: Connect to the Temporal Service
    client = await Client.connect("localhost:7233")

    # Step 2: Extract the invoice ID
    invoice_id = invoice_data.get("id", "unknown")

    # Step 3: Start the workflow execution
    handle = await client.start_workflow(
        InvoiceWorkflow.run,
        invoice_data,
        id=f"invoice-{invoice_id}",
        task_queue="invoice-task-queue",
    )

    # Step 4: Return the workflow ID for tracking
    return f"Started processing invoice {invoice_id}. Workflow ID: invoice-{invoice_id}"`;

const APPROVE_TOOL_PY = `@mcp.tool()
async def approve_invoice(invoice_id: str) -> str:
    """Approve a pending invoice.

    Args:
        invoice_id: The invoice identifier
    """
    # Step 1: Connect to the Temporal Service
    client = await Client.connect("localhost:7233")

    # Step 2: Get a handle to the existing workflow
    handle = client.get_workflow_handle(f"invoice-{invoice_id}")

    # Step 3: Send the approval signal
    await handle.signal(InvoiceWorkflow.approve_invoice)

    # Step 4: Confirm the signal was sent
    return f"Sent approval signal for invoice {invoice_id}"`;

const REJECT_TOOL_PY = `@mcp.tool()
async def reject_invoice(invoice_id: str) -> str:
    """Reject a pending invoice.

    Args:
        invoice_id: The invoice identifier
    """
    # Step 1: Connect to the Temporal Service
    client = await Client.connect("localhost:7233")

    # Step 2: Get a handle to the existing workflow
    handle = client.get_workflow_handle(f"invoice-{invoice_id}")

    # Step 3: Send the rejection signal
    await handle.signal(InvoiceWorkflow.reject_invoice)

    # Step 4: Confirm the signal was sent
    return f"Sent rejection signal for invoice {invoice_id}"`;

const STATUS_TOOL_PY = `@mcp.tool()
async def get_invoice_status(invoice_id: str) -> str:
    """Get the current status of an invoice.

    Args:
        invoice_id: The invoice identifier
    """
    # Step 1: Connect to the Temporal Service
    client = await Client.connect("localhost:7233")

    # Step 2: Get a handle to the existing workflow
    handle = client.get_workflow_handle(f"invoice-{invoice_id}")

    # Step 3: Query the workflow for its current status
    status = await handle.query(InvoiceWorkflow.get_status)

    # Step 4: Return the status to the user
    return f"Invoice {invoice_id} status: {status}"`;

const MCP_RUN_PY = `if __name__ == "__main__":
    # Initialize and run the server using stdio transport
    mcp.run(transport='stdio')`;

const INVOICE_SERVER_COMPLETE_PY = `from temporalio.client import Client
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
    mcp.run(transport='stdio')`;

const WORKER_IMPORTS_PY = `import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from activities import process_payment
from workflow import InvoiceWorkflow`;

const WORKER_MAIN_PY = `async def main():
    # Connect to Temporal service
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="invoice-task-queue",
        workflows=[InvoiceWorkflow],
        activities=[process_payment],
    )

    print("Worker started. Listening for invoice workflows...")
    await worker.run()`;

const WORKER_ENTRY_PY = `if __name__ == "__main__":
    asyncio.run(main())`;

const WORKER_COMPLETE_PY = `import asyncio
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
    asyncio.run(main())`;

const CLAUDE_CONFIG_JSON = `{
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
  }`;

const INVOICE_INPUT_JSON = `Process this invoice:
{
  "id": "INV-001",
  "lines": [
    {"item": "Web Development", "amount": 5000.00, "description": "Frontend work"},
    {"item": "Design Services", "amount": 2000.00, "description": "UI/UX design"}
  ]
}`;

export default function AddingHitlToMcpToolsPage() {
  return (
    <Layout
      title="Part 2: Building Long-Running MCP Tools with Human-in-the-Loop"
      description="Learn how to build long-running MCP tools with Temporal's signals and queries to implement human-in-the-loop patterns that can wait for human approval while maintaining durability."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI", href: "/tutorials/ai" },
                  {
                    label: "Building Durable MCP Tools",
                    href: "/tutorials/ai/building-mcp-tools-with-temporal/",
                  },
                  { label: "Part 2: Adding HITL" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Building Long-Running MCP Tools with Human-in-the-Loop
            </h1>

            <MetaChips items={["~90 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              In the{" "}
              <Link to="/tutorials/ai/building-mcp-tools-with-temporal/introducing-mcp-temporal/">
                previous tutorial
              </Link>
              , you built a weather MCP server that demonstrated how
              Temporal makes tools durable and fault-tolerant. But what
              about operations that need to wait for human input? What if
              your AI tool needs to pause and wait for approval before
              proceeding?
            </p>
            <p>
              <strong>
                Real-world AI applications need human interaction
              </strong>{" "}
              for feedback, approvals, and clarifications. Consider an
              invoice processing system - you might want an AI agent to
              prepare invoices automatically, but you still want human
              approval before actually charging a customer. Or imagine a
              content moderation system that flags questionable content
              for human review before taking action.
            </p>
            <p>
              <a
                href="https://temporal.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal
              </a>{" "}
              makes human-in-the-loop patterns reliable by preserving
              workflow state during long waiting periods - whether that's
              minutes, hours, or days. If users close their browser,
              restart their application, or the system crashes while
              waiting for approval, Temporal automatically resumes exactly
              where it left off without losing any progress or requiring
              retry logic.
            </p>
            <p>
              In this tutorial, you'll build an invoice processing MCP
              tool that demonstrates human-in-the-loop patterns. The tool
              will process invoices automatically but pause to wait for
              human approval before finalizing payments - and it will use
              Temporal's durable timers to handle approval deadlines.
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
                <li>
                  A basic understanding of MCP
                  <ul>
                    <li>
                      Check out the{" "}
                      <a href="#mcp-key-concepts">MCP key concepts</a>{" "}
                      section below if you'd like to learn more, or
                    </li>
                    <li>
                      Check out the{" "}
                      <Link to="/tutorials/ai/building-mcp-tools-with-temporal/introducing-mcp-temporal/">
                        first MCP tutorial
                      </Link>{" "}
                      which builds a request-response MCP server without
                      human-in-the-loop capabilities.
                    </li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="what-youll-learn">
              <h2 className={styles.sectionTitle}>What you'll learn</h2>
              <p>By the end of this tutorial, you'll understand:</p>
              <ul>
                <li>
                  How to use Temporal's durable timers for long-running
                  operations
                </li>
                <li>
                  How to implement Signals to send data to running
                  workflows
                </li>
                <li>How to implement Queries to safely read workflow state</li>
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
                  <strong>everywhere</strong>.
                </li>
                <li>
                  <strong>Open-source MCP servers</strong> - Leverage other
                  open-source MCP servers. If you make an MCP Client, it
                  will allow your application to connect to other MCP
                  servers developed by third parties.
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                MCP primitives: prompts, resources, and tools
              </h3>
              <p>
                MCP primitives are the things you interact with through
                MCP:
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
                window:{" "}
                <strong>user prompt + injected resources + available tools</strong>{" "}
                = LLM decision-making.
              </p>

              <h3 className={styles.subsectionTitle}>
                MCP client-server architecture
              </h3>
              <p>
                MCP establishes a client-server communication model where
                the client and server exchange messages:
              </p>
              <ul>
                <li>
                  <strong>MCP Clients</strong> - Embedded in AI
                  applications
                </li>
                <li>
                  <strong>MCP Servers</strong> - Provide tools and
                  resources
                </li>
                <li>
                  <strong>Transport Protocol</strong> - Communication
                  layer between them
                </li>
              </ul>
              <p>
                <strong>MCP Server.</strong> A system that data owners
                create to make their systems accessible to AI applications.
                It operates independently from the AI application, listens
                for requests from MCP Clients and responds accordingly,
                and provides tools, resources, and capabilities.
              </p>
              <p>
                <strong>MCP Client.</strong> AI applications that connect
                to MCP Servers to access external data and tools. When you
                use Claude Desktop, the MCP Client is a{" "}
                <strong>component inside</strong> the AI application, not
                a separate service.
              </p>
              <p>
                When you build <strong>one MCP Server</strong>, it
                instantly works with all MCP-compatible applications -
                Claude Desktop, Cursor, Windsurf, Zed, and custom apps. You
                don't need custom integrations per platform.
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
                (SSE) over HTTP. Ideal for cloud deployments,
                microservices, and scenarios where multiple clients need
                to access the same MCP server from different machines.
              </p>

              <Admonition type="info" title="Why Temporal for MCP?">
                <p>
                  MCP enables powerful tool integrations, but the protocol
                  itself doesn't provide durability. MCP servers need to
                  orchestrate complex, multi-step operations that interact
                  with external systems. With Temporal:
                </p>
                <ul>
                  <li>Your MCP tool can run for hours, days, or even months</li>
                  <li>
                    The tool keeps running even if the MCP server process
                    crashes or restarts
                  </li>
                  <li>State is preserved across failures automatically</li>
                  <li>
                    When an external API is temporarily down, Temporal
                    retries automatically
                  </li>
                </ul>
              </Admonition>
            </section>

            <section className={styles.section} id="building-system">
              <h2 className={styles.sectionTitle}>
                Building the invoice processing system
              </h2>
              <p>
                In this tutorial, you will build a complete invoice
                processing system that demonstrates human-in-the-loop
                patterns. The system will:
              </p>
              <ol>
                <li>Accept invoice data from an MCP tool</li>
                <li>Process payment line items automatically</li>
                <li>Wait for human approval (with a timeout)</li>
                <li>Allow humans to query the current status</li>
                <li>Handle both approval and rejection signals</li>
              </ol>

              <h3 className={styles.subsectionTitle}>Project setup</h3>
              <p>First, create a new directory for this project:</p>
              <CodeBlock language="bash">{`mkdir invoice-mcp-tutorial
cd invoice-mcp-tutorial`}</CodeBlock>
              <p>
                Initialize a new Python project with <code>uv</code>:
              </p>
              <CodeBlock language="bash">uv init</CodeBlock>
              <p>Add the required dependencies:</p>
              <CodeBlock language="bash">uv add temporalio fastmcp</CodeBlock>

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
                Activities in Temporal encapsulate code that interacts with
                external systems - like payment gateways, databases, or
                third-party APIs. The key benefit is{" "}
                <strong>built-in fault tolerance</strong>: if an Activity
                fails due to a network issue or temporary service outage,
                Temporal automatically retries it with configurable backoff
                strategies. You simply write the business logic (like
                calling a payment API), and Temporal handles retries,
                timeouts, and error tracking.
              </p>
              <p>
                For this invoice system, you need to process payments for
                each line item. Payment processing is inherently
                unreliable - payment gateways can be temporarily
                unavailable, networks can fail, or rate limits might be
                hit. Making this an Activity ensures these operations are
                automatically retried until they succeed.
              </p>
              <p>
                Create a file called <code>activities.py</code> that
                defines the payment processing logic:
              </p>
              <CodeBlock language="python" title="activities.py">
                {ACTIVITIES_PY}
              </CodeBlock>
              <p>
                The code extracts the item name and amount from the line
                item dictionary, logs the payment processing (in
                production, this is where you'd call Stripe, PayPal, or
                another payment processor), and returns a confirmation
                message.
              </p>
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
                Step 2: Create the invoice Workflow
              </h3>
              <p>
                Now you'll create a Workflow that orchestrates your
                Activity (processing payments) to handle invoice line
                items. Create a file called <code>workflow.py</code> to
                contain your workflow logic.
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
                the coordination and logic of your application's
                processes, while Activities perform the tasks that
                interact with external services or are prone to failure.
              </p>

              <h4>Step 2.1: Set up your Workflow file</h4>
              <p>
                Create <code>workflow.py</code> and start with the
                necessary imports:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_IMPORTS_PY}
              </CodeBlock>

              <h4>Step 2.2: Import Activity inside the Workflow</h4>
              <p>
                Before you can use your Activities, you need to import
                them inside your Workflow. Temporal requires a special
                import pattern:
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
                  Workflows for replay. This import pattern tells
                  Temporal: "These imports are safe to use during replay."
                </p>
              </Admonition>

              <h4>Step 2.3: Define the Workflow class</h4>
              <p>Create your Workflow class with the required decorators:</p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_CLASS_STUB_PY}
              </CodeBlock>

              <h4>Step 2.4: Execute Activities for each line item</h4>
              <p>
                Inside the <code>run</code> method, process each invoice
                line item by calling your <code>process_payment</code>{" "}
                Activity. Notice how you:
              </p>
              <ul>
                <li>
                  Use <code>await workflow.execute_activity()</code> to
                  execute the <code>process_payment</code> Activity
                </li>
                <li>
                  Set a{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/failure-detection#activity-timeouts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Start-to-Close timeout
                  </a>{" "}
                  of 30 seconds, which is the maximum amount of time a
                  single Activity Execution can take before retrying
                </li>
              </ul>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_RUN_PY}
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

              <p>
                Your <code>workflow.py</code> should look like this:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_V1_PY}
              </CodeBlock>

              <p>
                So far, you've created a payment processing Activity and
                an Invoice Workflow that automatically processes all
                invoice line items. This Workflow is now durable.
              </p>

              <Admonition type="info" title="More on Durable Execution">
                <p>
                  Durable Execution ensures that your application behaves
                  correctly despite adverse conditions by guaranteeing
                  that it will run to completion. In your invoice
                  processing workflow:
                </p>
                <ul>
                  <li>
                    If a payment API call fails after processing 3 out of
                    5 line items, you{" "}
                    <strong>don't lose the work already completed</strong>{" "}
                    - only the failed payment is retried.
                  </li>
                  <li>
                    If the payment gateway times out on one transaction,
                    you can <strong>retry just that payment</strong>{" "}
                    without reprocessing the ones that already succeeded.
                  </li>
                  <li>
                    If your process crashes mid-execution, it can{" "}
                    <strong>resume from the last successful payment</strong>{" "}
                    without double-charging customers.
                  </li>
                  <li>
                    <strong>Long-running approval workflows</strong> can
                    wait for hours or days for human input without losing
                    context or consuming resources.
                  </li>
                </ul>
                <p>
                  Without durability, every failure means starting over -
                  risking duplicate charges or lost progress. With
                  durability, failures become recoverable interruptions
                  instead of catastrophic losses.
                </p>
              </Admonition>

              <p>
                Now you'll add <strong>human-in-the-loop capabilities</strong>{" "}
                so the Workflow waits for approval before processing
                payments.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 3: Adding Signals for human approval
              </h3>

              <h4>Understanding the human-in-the-loop pattern</h4>
              <p>
                The human-in-the-loop pattern enables applications to
                pause execution and wait for user input before proceeding.
                This is essential for scenarios where:
              </p>
              <ul>
                <li>
                  <strong>Human judgment is required</strong> - Decisions
                  that need expertise, context, or ethical considerations
                  (like approving large invoices)
                </li>
                <li>
                  <strong>Verification is needed</strong> - Confirming
                  that automated work meets expectations before proceeding
                </li>
                <li>
                  <strong>Interactive refinement</strong> - Allowing users
                  to review, edit, and iterate on AI-generated or
                  automated content
                </li>
              </ul>

              <h4>What are Signals?</h4>
              <p>
                <a
                  href="https://docs.temporal.io/develop/python/message-passing#send-signal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>Signals</strong>
                </a>{" "}
                allow external systems to send data to running workflows,
                enabling human interaction during Workflow Execution.
                Think of them as named methods that can be called from
                outside the Workflow while it's running. They allow you to:
              </p>
              <ul>
                <li>
                  <strong>Modify workflow state</strong> - Update variables
                  that control Workflow logic
                </li>
                <li>
                  <strong>Trigger conditional logic</strong> - Change the
                  execution path based on the Signal data
                </li>
                <li>
                  <strong>Unblock waiting conditions</strong> - Resume a
                  paused Workflow that's waiting for input
                </li>
              </ul>
              <p>
                Signals are asynchronous - when you send a Signal, it gets
                queued and processed by the Workflow, but the sender
                doesn't wait for the Workflow to handle it.
              </p>
              <p>
                In the invoice system, you'll use Signals to handle
                approval and rejection decisions from humans. When a human
                clicks "approve" or "reject" in the interface, that action
                sends a Signal to the running workflow.
              </p>

              <h4>Adding Workflow state</h4>
              <p>
                First, add an <code>__init__</code> method to track
                approval state:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_INIT_PY}
              </CodeBlock>
              <p>
                This state is automatically persisted by Temporal and
                survives crashes. If your process crashes while waiting
                for approval, when it restarts, the Workflow will resume
                with the exact same state - it remembers whether it was
                approved, rejected, or still waiting.
              </p>

              <h4>Defining Signal methods</h4>
              <p>
                Add two signal methods to your workflow class - to approve
                and reject the invoice:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {SIGNAL_METHODS_PY}
              </CodeBlock>
              <p>
                The <code>@workflow.signal</code> decorator marks these
                methods as signal handlers. When someone approves or
                rejects an invoice, they send the appropriate signal that
                updates the <code>self.approved</code> field.
              </p>

              <h4>Using wait conditions to pause execution</h4>
              <p>
                You've now stored your initial Signal state and defined
                what happens when it comes in. Next, you need a way for
                the Workflow to pause and wait for that Signal to arrive.
                This is where <code>workflow.wait_condition()</code> comes
                in.
              </p>
              <ul>
                <li>
                  Use <code>workflow.wait_condition()</code> to pause
                  until Signal is received (user decides the next step)
                </li>
                <li>
                  Creates a blocking checkpoint where the Workflow stops
                  and waits
                </li>
                <li>
                  Resumes execution only when specified condition becomes
                  true
                </li>
                <li>
                  Optionally accepts a timeout parameter:{" "}
                  <code>
                    workflow.wait_condition(lambda: condition,
                    timeout=timedelta(hours=24))
                  </code>{" "}
                  waits until Signal received OR timeout elapsed,
                  whichever happens first
                </li>
              </ul>
              <p>
                Update your <code>run</code> method to wait for approval{" "}
                <em>before</em> processing payments. The{" "}
                <code>workflow.wait_condition()</code> method creates a{" "}
                <strong>blocking checkpoint</strong> where the workflow
                stops and waits for a specific condition to become true.
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WAIT_CONDITION_RUN_PY}
              </CodeBlock>
              <p>This line pauses the workflow until either:</p>
              <ol>
                <li>
                  <strong>The condition becomes true</strong> - A signal
                  changes <code>self.approved</code> from{" "}
                  <code>None</code> to <code>True</code> or{" "}
                  <code>False</code>
                </li>
                <li>
                  <strong>The timeout expires</strong> - After 5 days,
                  control returns to the workflow (but{" "}
                  <code>self.approved</code> is still <code>None</code>)
                </li>
              </ol>
              <p>
                This pattern ensures that payment processing only happens
                after explicit human approval, preventing accidental
                charges.
              </p>

              <p>
                Your <code>workflow.py</code> should look like this:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_V2_PY}
              </CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 4: Adding Queries to check status
              </h3>
              <p>
                <a
                  href="https://docs.temporal.io/sending-messages#sending-queries"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Queries
                </a>{" "}
                let you safely read workflow state without modifying it.
                They're synchronous operations that return immediately,
                making them perfect for status checks and monitoring.
              </p>

              <h4>What are Queries?</h4>
              <p>
                Queries are read-only methods on your Workflow class that
                external systems can call to inspect the workflow's
                current state. They can be used for:
              </p>
              <ul>
                <li>Checking current status</li>
                <li>Retrieving partial results</li>
                <li>Building dashboards and monitoring tools</li>
                <li>Providing real-time feedback to users</li>
              </ul>

              <h4>Tracking status in your Workflow</h4>
              <p>
                Before you can query the workflow status, you need to
                track it throughout the workflow's execution. Update your
                workflow's <code>run</code> method to set{" "}
                <code>self.status</code> at key points:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {STATUS_RUN_PY}
              </CodeBlock>
              <p>
                Notice how <code>self.status</code> is updated at each
                stage. These status updates provide visibility into where
                the workflow is in its lifecycle, which external systems
                can query at any time.
              </p>

              <h4>Defining a Query method</h4>
              <p>
                Now add a query method to your workflow class that returns
                the current status:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {QUERY_METHOD_PY}
              </CodeBlock>
              <p>
                The <code>@workflow.query</code> decorator marks this
                method as a query handler. External systems can call this
                query at any time to check the invoice status without
                affecting the workflow's execution. The query simply
                returns the current value of <code>self.status</code>,
                which is being updated as the workflow progresses.
              </p>

              <p>
                Your <code>workflow.py</code> should look like this:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_V3_PY}
              </CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 5: Understanding durable timers
              </h3>
              <p>
                Now that you've built a workflow with signals and queries,
                let's understand a critical concept that makes the
                approval waiting period possible:{" "}
                <strong>durable timers</strong>.
              </p>
              <p>
                Traditional async timers (<code>asyncio.sleep()</code> in
                Python) are lost when your process crashes or restarts.
                If your application is waiting for 5 days and crashes on
                day 3, you lose all progress.
              </p>
              <p>
                <strong>
                  Temporal's durable timers survive crashes and restarts.
                </strong>{" "}
                When you use <code>workflow.sleep()</code>, and if your
                process crashes, when it restarts, Temporal replays the
                Workflow and reinstates the timer exactly where it left
                off.
              </p>
              <p>
                <strong>Example: a durable timer:</strong>
              </p>
              <CodeBlock language="python">{DURABLE_TIMER_EXAMPLE_PY}</CodeBlock>
              <p>
                In this example, if your process crashes during the
                20-second sleep, when it restarts, Temporal will continue
                the timer from where it left off. The invoice processing
                logic won't be re-executed because Temporal knows it
                already completed.
              </p>

              <h4>Adding a durable timer to your invoice Workflow</h4>
              <p>
                Add a practical use of durable timers to your invoice
                workflow. You'll add a 2-second delay between processing
                each invoice line item to simulate rate limiting or pacing
                payment processing.
              </p>
              <p>
                Update your workflow's <code>run</code> method to include
                a durable sleep before processing each payment.
              </p>
              <p>
                Your <code>workflow.py</code> should look like this:
              </p>
              <CodeBlock language="python" title="workflow.py">
                {WORKFLOW_FINAL_PY}
              </CodeBlock>
              <p>
                This durable timer ensures that even if your Worker
                crashes during the delay, when it restarts, it will
                continue from exactly where it left off - without
                reprocessing payments that were already completed.
              </p>

              <Admonition type="tip" title="What you've built so far">
                <p>
                  Before wiring everything together with the MCP server,
                  let's recap the workflow components you've created:
                </p>
                <ol>
                  <li>
                    <strong>Payment processing Activity</strong> -{" "}
                    <code>process_payment</code> handles external payment
                    gateway interactions with automatic retry capabilities.
                  </li>
                  <li>
                    <strong>Invoice Workflow with human-in-the-loop</strong>{" "}
                    - Your <code>InvoiceWorkflow</code> class waits for
                    approval, auto-rejects after timeout, processes
                    payments only after explicit approval, and tracks
                    status throughout the lifecycle.
                  </li>
                  <li>
                    <strong>Signals for human interaction</strong> -{" "}
                    <code>approve_invoice()</code> and{" "}
                    <code>reject_invoice()</code> handle approval and
                    rejection from any external system.
                  </li>
                  <li>
                    <strong>Queries for status monitoring</strong> -{" "}
                    <code>get_status()</code> allows external systems to
                    check current status without modifying state.
                  </li>
                  <li>
                    <strong>Durable waiting</strong> -{" "}
                    <code>workflow.wait_condition()</code> with a timeout
                    survives crashes and consumes no resources while
                    waiting.
                  </li>
                </ol>
              </Admonition>

              <p>
                Next, you'll create an MCP server that exposes these
                Workflow capabilities as tools that Claude Desktop (or any
                MCP Client) can use to start Workflows, send Signals, and
                Query status.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 6: Create the MCP server with multiple tools
              </h3>
              <p>
                Now you'll create an MCP server that exposes your invoice
                processing capabilities as tools that Claude Desktop (or
                any MCP client) can use. The MCP server acts as a{" "}
                <strong>Temporal Client</strong>, providing the interface
                between AI applications and your durable workflows.
              </p>

              <h4>Understanding the Temporal Client</h4>
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
                Service. In this application, your MCP server uses a
                Temporal Client to perform several key operations:
              </p>
              <ul>
                <li>
                  <strong>Start Workflow Executions</strong> - Begin
                  processing new invoices
                </li>
                <li>
                  <strong>Send Signals to running Workflows</strong> -
                  Approve or reject invoices that are waiting for human
                  input
                </li>
                <li>
                  <strong>Query Workflow state</strong> - Check the
                  current status of any invoice without modifying it
                </li>
                <li>
                  <strong>Get Workflow results</strong> - Retrieve the
                  final outcome when processing completes
                </li>
              </ul>
              <p>
                The client connects to your Temporal Service (running on{" "}
                <code>localhost:7233</code>) and coordinates all
                interactions with your Workflows. Each MCP tool you
                create will use the client in different ways.
              </p>

              <h4>Creating the MCP server file</h4>
              <p>
                Create a new file called <code>invoice_server.py</code>{" "}
                and build each tool step by step.
              </p>

              <h4>Step 6.1: Set up imports and initialize the server</h4>
              <CodeBlock language="python" title="invoice_server.py">
                {MCP_INIT_PY}
              </CodeBlock>
              <p>
                The <code>FastMCP</code> initialization creates an MCP
                server named "invoice-processor". This name will appear
                in Claude Desktop when you connect to the server.
              </p>

              <h4>Step 6.2: Create the tool to start invoice processing</h4>
              <p>
                The first tool allows users to start processing a new
                invoice. This tool uses the Temporal Client to{" "}
                <strong>start a workflow execution</strong>:
              </p>
              <CodeBlock language="python" title="invoice_server.py">
                {PROCESS_INVOICE_TOOL_PY}
              </CodeBlock>
              <p>
                <strong>What happens when this tool is called:</strong>
              </p>
              <ol>
                <li>
                  <strong>Client connection</strong> - Connects to the
                  Temporal Service at <code>localhost:7233</code>
                </li>
                <li>
                  <strong>Workflow start</strong> - Calls{" "}
                  <code>client.start_workflow()</code> to begin a new{" "}
                  <code>InvoiceWorkflow</code> execution
                </li>
                <li>
                  <strong>Workflow handle</strong> - Returns a handle that
                  can be used to interact with the running workflow later
                </li>
                <li>
                  <strong>User feedback</strong> - Returns a message with
                  the workflow ID so users can track this invoice
                </li>
              </ol>
              <p>
                After this tool completes, the workflow is running and
                waiting for approval - but the MCP tool returns
                immediately. The workflow continues running independently.
              </p>

              <h4>Step 6.3: Create the tool to approve invoices</h4>
              <p>
                The second tool sends an approval signal to a running
                workflow. This demonstrates how to use the Temporal Client
                to <strong>interact with running workflows</strong>:
              </p>
              <CodeBlock language="python" title="invoice_server.py">
                {APPROVE_TOOL_PY}
              </CodeBlock>
              <p>When this tool is called, it sends a Signal:</p>
              <ul>
                <li>
                  Calls <code>handle.signal()</code> to send the approval
                  signal to the workflow
                </li>
                <li>
                  The signal is delivered asynchronously - this method
                  returns immediately
                </li>
                <li>
                  The workflow receives the signal and updates its state
                  accordingly
                </li>
                <li>
                  If the workflow is waiting at{" "}
                  <code>workflow.wait_condition()</code>, this signal will
                  unblock it
                </li>
              </ul>
              <p>
                The workflow immediately processes the signal, sets{" "}
                <code>self.approved = True</code>, and proceeds to process
                payments.
              </p>

              <h4>Step 6.4: Create the tool to reject invoices</h4>
              <p>
                The rejection tool works exactly like the approval tool
                but sends a different signal:
              </p>
              <CodeBlock language="python" title="invoice_server.py">
                {REJECT_TOOL_PY}
              </CodeBlock>
              <p>The flow is identical to the approval tool, but:</p>
              <ul>
                <li>
                  It calls <code>InvoiceWorkflow.reject_invoice</code>{" "}
                  instead
                </li>
                <li>
                  The workflow sets <code>self.approved = False</code>
                </li>
                <li>
                  The workflow skips payment processing and completes
                  with "REJECTED" status
                </li>
              </ul>

              <h4>Step 6.5: Create the tool to query invoice status</h4>
              <p>
                The final tool queries the current state of a workflow
                without modifying it:
              </p>
              <CodeBlock language="python" title="invoice_server.py">
                {STATUS_TOOL_PY}
              </CodeBlock>
              <p>
                This tool calls <code>handle.query()</code> to read the
                workflow's current state. Queries are{" "}
                <strong>synchronous and read-only</strong> - they return
                immediately with the current value. They don't modify the
                workflow or send any signals. They can be called at any
                time, even while the workflow is running.
              </p>
              <p>
                Unlike Signals, Queries return a value immediately and
                don't change the Workflow's state.
              </p>

              <h4>Step 6.6: Configure the server transport</h4>
              <p>
                Finally, add the code to run the MCP server when the
                script is executed:
              </p>
              <CodeBlock language="python" title="invoice_server.py">
                {MCP_RUN_PY}
              </CodeBlock>
              <p>
                The <code>transport='stdio'</code> configuration runs the
                MCP server as a subprocess using standard input/output,
                which is ideal for local integrations with Claude Desktop.
              </p>

              <p>
                Your complete <code>invoice_server.py</code> should look
                like this:
              </p>
              <CodeBlock language="python" title="invoice_server.py">
                {INVOICE_SERVER_COMPLETE_PY}
              </CodeBlock>

              <Admonition type="info" title="Summary: how the Client works">
                <p>
                  Your MCP server acts as a Temporal Client with three
                  distinct interaction patterns:
                </p>
                <ol>
                  <li>
                    <strong>
                      Starting Workflows (<code>client.start_workflow()</code>)
                    </strong>{" "}
                    - Creates a new workflow execution, returns
                    immediately with a workflow handle, and the workflow
                    continues running independently.
                  </li>
                  <li>
                    <strong>
                      Sending Signals (<code>handle.signal()</code>)
                    </strong>{" "}
                    - Sends data to a running workflow, changes workflow
                    state asynchronously, used for human decisions like
                    approval/rejection.
                  </li>
                  <li>
                    <strong>
                      Querying state (<code>handle.query()</code>)
                    </strong>{" "}
                    - Reads workflow state synchronously, returns
                    immediately with current values, doesn't modify the
                    workflow.
                  </li>
                </ol>
              </Admonition>

              <h3 className={styles.subsectionTitle}>
                Step 7: Create the Worker
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
                continuously poll this queue, pick up available tasks,
                and execute them. Your Workflow progresses as Workers
                complete each task. Think of it as the "engine" that
                powers your Temporal application.
              </p>
              <p>
                Create a file called <code>worker.py</code> that runs
                your workflows and activities:
              </p>

              <h4>Step 7.1: Import dependencies</h4>
              <CodeBlock language="python" title="worker.py">
                {WORKER_IMPORTS_PY}
              </CodeBlock>

              <h4>Step 7.2: Create the Worker function</h4>
              <CodeBlock language="python" title="worker.py">
                {WORKER_MAIN_PY}
              </CodeBlock>

              <h4>Step 7.3: Add the entry point</h4>
              <CodeBlock language="python" title="worker.py">
                {WORKER_ENTRY_PY}
              </CodeBlock>

              <p>
                Your complete <code>worker.py</code> should look like
                this:
              </p>
              <CodeBlock language="python" title="worker.py">
                {WORKER_COMPLETE_PY}
              </CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 8: Configure Claude Desktop
              </h3>
              <p>
                Claude Desktop has a built-in MCP Client. Once you've
                connected your MCP server, Claude Desktop can discover
                the tools you've made available. To connect Claude Desktop
                to your MCP server, set up a{" "}
                <code>claude_desktop_config.json</code> file.
              </p>
              <p>
                Create a <code>claude_desktop_config.json</code> file:
              </p>
              <CodeBlock language="json" title="claude_desktop_config.json">
                {CLAUDE_CONFIG_JSON}
              </CodeBlock>
              <ol>
                <li>Replace the path with your actual project directory.</li>
                <li>
                  Copy this config file to Claude Desktop's configuration
                  directory:
                  <CodeBlock language="bash">{`cp claude_desktop_config.json ~/Library/Application\\ Support/Claude/claude_desktop_config.json`}</CodeBlock>
                  Or on Windows:
                  <CodeBlock language="bash">{`copy claude_desktop_config.json %APPDATA%\\Claude\\claude_desktop_config.json`}</CodeBlock>
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
                Step 9: Run your application
              </h3>
              <p>
                You are now ready to run your application. You need two
                terminal windows running.
              </p>

              <h4>Terminal 1 - Start the Temporal Server</h4>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                This starts the Temporal service on{" "}
                <code>localhost:8233</code>.
              </p>

              <h4>Terminal 2 - Start your Worker</h4>
              <CodeBlock language="bash">uv run worker.py</CodeBlock>
              <p>
                You should see: "Worker started. Listening for invoice
                workflows..."
              </p>
            </section>

            <section className={styles.section} id="test-integration">
              <h2 className={styles.sectionTitle}>Test the integration</h2>
              <p>
                Now test the complete invoice workflow with Claude Desktop.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 1: Process an invoice
              </h3>
              <ol>
                <li>Open Claude Desktop</li>
                <li>
                  Click on the icon to the right of the plus sign button.
                  You should now see your configured MCP server (e.g.{" "}
                  <code>invoice-processor</code>) on your Claude Desktop
                  and the blue toggle should be switched on.
                </li>
              </ol>
              <p>Ask it something like:</p>
              <CodeBlock>{INVOICE_INPUT_JSON}</CodeBlock>
              <p>
                Claude will ask to use the <code>process_invoice</code>{" "}
                tool. Allow it do so. Claude will then use the{" "}
                <code>process_invoice</code> tool and return a workflow
                ID. At this point:
              </p>
              <ul>
                <li>The workflow has processed the payment line items</li>
                <li>It's now waiting for approval</li>
                <li>The workflow will wait for up to 5 days</li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                Step 2: Monitor your Temporal Web UI
              </h3>
              <p>
                Temporal provides a robust Web UI for managing Workflow
                Executions. With this Web UI, you can:
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
                see that your Workflow Execution is currently running.
              </p>
              <p>
                If you click on that Workflow Execution, you'll be able
                to see the details. Notice that there is currently a
                running timer for five days, waiting for approval for the
                invoice.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 3: Approve or reject
              </h3>
              <p>To approve the invoice, ask Claude:</p>
              <CodeBlock>Approve invoice INV-001</CodeBlock>
              <p>Or to reject it:</p>
              <CodeBlock>Reject invoice INV-001</CodeBlock>
              <p>
                Approve the invoice and you'll see Claude will send the
                appropriate Signal, and the Workflow will immediately
                proceed based on the decision. In the Web UI, observe
                that the Workflow Execution has completed successfully.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 4: Check the status
              </h3>
              <p>
                Test the <code>get_invoice_status</code> Query tool. Ask
                Claude:
              </p>
              <CodeBlock>What's the status of invoice INV-001?</CodeBlock>
              <p>
                Claude will use the <code>get_invoice_status</code> tool
                and should return something like: "Invoice INV-001 status
                is Completed. The invoice has been fully processed and
                approved, moving through the entire workflow
                successfully."
              </p>

              <h3 className={styles.subsectionTitle}>
                Optional: Testing durability - Quit Claude Desktop during execution
              </h3>
              <p>
                Let's demonstrate Temporal's durability by showing that
                Workflows continue running even when the client
                disconnects.
              </p>

              <h4>Step 1: Process a new invoice</h4>
              <ol>
                <li>
                  In Claude Desktop, ask something like:{" "}
                  <code>
                    Process this invoice: {`{"id": "INV-002", "lines": [...]}`}
                  </code>
                </li>
                <li>
                  Click <strong>"Allow"</strong> when prompted to use the
                  tool
                </li>
                <li>
                  Claude will show that it's waiting for the tool response
                </li>
              </ol>

              <h4>Step 2: Quit Claude Desktop while the Workflow is running</h4>
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

              <h4>Step 3: Observe the Workflow still running</h4>
              <p>Notice the following:</p>
              <ul>
                <li>
                  <strong>Status</strong>: The Workflow is still "Running"
                </li>
                <li>
                  <strong>Event History</strong>: Shows the Workflow timer
                  started
                </li>
              </ul>
              <p>
                Even though Claude Desktop quit and the MCP server
                disconnected,{" "}
                <strong>
                  the Workflow continues executing in Temporal
                </strong>
                . The Worker is still processing it.
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
                Re-open Claude Desktop and approve the invoice. You'll
                see that the Workflow Execution will complete successfully
                where it left off.
              </p>
            </section>

            <section className={styles.section} id="youre-done">
              <h2 className={styles.sectionTitle}>You're done!</h2>
              <p>
                You've now completed this tutorial and seen the power of
                durable MCP tools with Temporal. Check out the{" "}
                <a
                  href="https://github.com/temporalio/edu-durable-mcp-hitl-tutorial"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  tutorial repository
                </a>{" "}
                that includes all the code used for it.
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
                to get notified about new tutorials and educational
                content.
              </p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/ai/building-mcp-tools-with-temporal/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Series overview</span>
                  <h3 className={styles.nextTitle}>
                    Building Durable MCP Tools
                  </h3>
                  <p className={styles.nextBody}>
                    Revisit the two-part series landing page to compare
                    the weather and invoice tutorials side by side.
                  </p>
                  <span className={styles.nextCta}>
                    Back to series <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <a
                  href="https://docs.temporal.io/develop/python/message-passing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Docs deep dive</span>
                  <h3 className={styles.nextTitle}>
                    Signals, Queries, and Updates
                  </h3>
                  <p className={styles.nextBody}>
                    Read the Temporal Python message-passing guide for
                    advanced patterns - validation, idempotency, and
                    update handlers.
                  </p>
                  <span className={styles.nextCta}>
                    Read the guide <span aria-hidden="true">→</span>
                  </span>
                </a>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/building-mcp-tools-with-temporal/introducing-mcp-temporal/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: part 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Introducing MCP and Temporal
                </span>
              </Link>
              <Link
                to="/tutorials/ai/building-mcp-tools-with-temporal/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Series overview{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Building Durable MCP Tools
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
