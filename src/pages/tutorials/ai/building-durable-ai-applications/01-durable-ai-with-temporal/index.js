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
    label: "Durable AI with Temporal",
    href: "/tutorials/ai/building-durable-ai-applications/01-durable-ai-with-temporal/",
  },
  {
    n: 2,
    label: "Human in the Loop",
    href: "/tutorials/ai/building-durable-ai-applications/02-human-in-the-loop/",
  },
];

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "getting-started", label: "Getting started: clone the template" },
  { id: "introducing-temporal", label: "Introducing Temporal" },
  { id: "define-external-interactions", label: "Define external interactions" },
  { id: "creating-your-first-activities", label: "Create your first Activities" },
  { id: "define-your-application-logic", label: "Define your application logic" },
  { id: "run-your-application", label: "Run your application" },
  { id: "create-your-client", label: "Create your client" },
  { id: "using-the-temporal-web-ui", label: "Using the Temporal Web UI" },
  { id: "experiencing-failure-and-recovery", label: "Optional: experiencing failure and recovery" },
];

const CLONE_REPO = `git clone https://github.com/temporalio/edu-durable-ai-tutorial-template.git
cd edu-durable-ai-tutorial-template`;

const INSTALL_DEPS = `uv sync`;

const ENV_FILE = `LLM_API_KEY=your_openai_api_key_here
LLM_MODEL=openai/gpt-4o`;

const RUN_APP = `uv run app.py`;

const ADD_TEMPORAL = `uv add temporalio`;

const ACTIVITY_IMPORT = `from temporalio import activity`;

const LLM_CALL_ACTIVITY = `@activity.defn
def llm_call(input: LLMCallInput) -> ModelResponse:
    return completion(
        model=LLM_MODEL,
        api_key=LLM_API_KEY,
        messages=[{"content": input.prompt, "role": "user"}],
    )`;

const ACTIVITIES_FULL = `import os
from dotenv import load_dotenv
from litellm import completion
from litellm.types.utils import ModelResponse
from models import LLMCallInput, PDFGenerationInput
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from temporalio import activity

load_dotenv(override=True)  # Reads your .env file and loads your environment variables

# Get LLM_API_KEY environment variable
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o")
LLM_API_KEY = os.getenv("LLM_API_KEY", None)

@activity.defn
def llm_call(input: LLMCallInput) -> ModelResponse:
    return completion(
        model=LLM_MODEL,
        api_key=LLM_API_KEY,
        messages=[{"content": input.prompt, "role": "user"}],
    )

@activity.defn
def create_pdf(input: PDFGenerationInput) -> str:
    doc = SimpleDocTemplate(input.filename, pagesize=letter)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        spaceAfter=30,
        alignment=1,
    )

    story: list[Flowable] = []
    title = Paragraph("Research Report", title_style)
    story.append(title)
    story.append(Spacer(1, 20))

    paragraphs = input.content.split("\\n\\n")
    for para in paragraphs:
        if para.strip():
            p = Paragraph(para.strip(), styles["Normal"])
            story.append(p)
            story.append(Spacer(1, 12))

    doc.build(story)
    return input.filename

# Make the API call
print("Welcome to the Research Report Generator!")
prompt = input("Enter your research topic or question: ")
llm_input = LLMCallInput(prompt=prompt)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
print(content)

pdf_filename = create_pdf(PDFGenerationInput(content=content, filename="research_report.pdf"))`;

const WORKFLOW_IMPORTS = `from datetime import timedelta
from temporalio import workflow`;

const WORKFLOW_IMPORTS_PASSED_THROUGH = `# Import Activities and models using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call
    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
    )`;

const WORKFLOW_CLASS_DEFN = `with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call
    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
    )

@workflow.defn
class GenerateReportWorkflow:
    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        # Your orchestration logic will go here`;

const WORKFLOW_STEP4 = `@workflow.defn
class GenerateReportWorkflow:
    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        llm_call_input = LLMCallInput(prompt=input.prompt)

        # Step 1: Call LLM Activity to generate research
        research_facts = await workflow.execute_activity(
            llm_call,
            llm_call_input,
            start_to_close_timeout=timedelta(seconds=30),
        )

        # Step 2: Create PDF Activity`;

const WORKFLOW_STEP5 = `@workflow.defn
class GenerateReportWorkflow:
    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        llm_call_input = LLMCallInput(prompt=input.prompt)

        # Step 1: Call LLM Activity
        research_facts = await workflow.execute_activity(
            llm_call,
            llm_call_input,
            start_to_close_timeout=timedelta(seconds=30),
        )

        pdf_generation_input = PDFGenerationInput(
            content=research_facts["choices"][0]["message"]["content"]
        )

        # Step 2: Create PDF Activity
        pdf_filename = await workflow.execute_activity(
            create_pdf,
            pdf_generation_input,
            start_to_close_timeout=timedelta(seconds=20),
        )

        return f"Successfully created research report PDF: {pdf_filename}"`;

const WORKFLOW_FULL = `from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call
    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
    )

@workflow.defn
class GenerateReportWorkflow:
    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        llm_call_input = LLMCallInput(prompt=input.prompt)

        # Step 1: Call LLM Activity to generate research
        research_facts = await workflow.execute_activity(
            llm_call,
            llm_call_input,
            start_to_close_timeout=timedelta(seconds=30),
        )

        pdf_generation_input = PDFGenerationInput(
            content=research_facts["choices"][0]["message"]["content"]
        )

        # Step 2: Create PDF Activity
        pdf_filename = await workflow.execute_activity(
            create_pdf,
            pdf_generation_input,
            start_to_close_timeout=timedelta(seconds=20),
        )

        return f"Successfully created research report PDF: {pdf_filename}"`;

const RETRY_POLICY_SNIPPET = `from temporalio.common import RetryPolicy

pdf_filename: str = await workflow.execute_activity(
    create_pdf,
    pdf_generation_input,
    start_to_close_timeout=timedelta(seconds=20),
    retry_policy=RetryPolicy(
        initial_interval=timedelta(seconds=2),
        maximum_attempts=3,
        backoff_coefficient=3.0,
    ),
)`;

const WORKER_IMPORTS = `import asyncio
import concurrent.futures

from activities import create_pdf, llm_call
from temporalio.client import Client
from temporalio.worker import Worker
from workflow import GenerateReportWorkflow`;

const WORKER_FUNC = `async def run_worker():
    # Connect to Temporal service
    client = await Client.connect("localhost:7233", namespace="default")

    # Create a thread pool for running Activities
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as activity_executor:
        # Configure the Worker
        worker = Worker(
            client,
            task_queue="research",  # Task queue that your Worker is listening to.
            workflows=[GenerateReportWorkflow],  # Register the Workflow on your Worker
            activities=[llm_call, create_pdf],  # Register the Activities on your Worker
            activity_executor=activity_executor,  # Thread pool that allows Activities to run concurrently
        )

        print(f"Starting the worker....")
        await worker.run()`;

const WORKER_ENTRY = `if __name__ == "__main__":
    asyncio.run(run_worker())`;

const WORKER_FULL = `import asyncio
import concurrent.futures

from activities import create_pdf, llm_call
from temporalio.client import Client
from temporalio.worker import Worker
from workflow import GenerateReportWorkflow

async def run_worker():
    # Connect to Temporal service
    client = await Client.connect("localhost:7233", namespace="default")

    # Create a thread pool for running Activities
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as activity_executor:
        # Configure the Worker
        worker = Worker(
            client,
            task_queue="research",  # Task queue that your Worker is listening to.
            workflows=[GenerateReportWorkflow],  # Register the Workflow on your Worker
            activities=[llm_call, create_pdf],  # Register the Activities on your Worker
            activity_executor=activity_executor,  # Thread pool that allows Activities to run concurrently
        )

        print(f"Starting the worker....")
        await worker.run()


if __name__ == "__main__":
    asyncio.run(run_worker())`;

const REMOVE_SCRIPT_CODE = `# Make the API call
print("Welcome to the Research Report Generator!")
prompt = input("Enter your research topic or question: ")
llm_input = LLMCallInput(prompt=prompt)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
print(content)

pdf_filename = create_pdf(PDFGenerationInput(content=content, filename="research_report.pdf"))`;

const ACTIVITIES_CLEAN = `import os
from dotenv import load_dotenv
from litellm import completion
from litellm.types.utils import ModelResponse
from models import LLMCallInput, PDFGenerationInput
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from temporalio import activity

load_dotenv(override=True)  # Reads your .env file and loads your environment variables

# Get LLM_API_KEY environment variable
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o")
LLM_API_KEY = os.getenv("LLM_API_KEY", None)

@activity.defn
def llm_call(input: LLMCallInput) -> ModelResponse:
    return completion(
        model=LLM_MODEL,
        api_key=LLM_API_KEY,
        messages=[{"content": input.prompt, "role": "user"}],
    )

@activity.defn
def create_pdf(input: PDFGenerationInput) -> str:
    doc = SimpleDocTemplate(input.filename, pagesize=letter)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        spaceAfter=30,
        alignment=1,
    )

    story: list[Flowable] = []
    title = Paragraph("Research Report", title_style)
    story.append(title)
    story.append(Spacer(1, 20))

    paragraphs = input.content.split("\\n\\n")
    for para in paragraphs:
        if para.strip():
            p = Paragraph(para.strip(), styles["Normal"])
            story.append(p)
            story.append(Spacer(1, 12))

    doc.build(story)
    return input.filename`;

const STARTER_IMPORTS = `import asyncio
import uuid

from models import GenerateReportInput  # dataclass for Workflow input
from temporalio.client import Client  # Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow  # Your Workflow definition`;

const STARTER_MAIN = `async def main():
    # Connect to the Temporal service
    client = await Client.connect("localhost:7233", namespace="default")

    # Get user input for research topic
    print("Welcome to the Research Report Generator!")
    prompt = input("Enter your research topic or question: ").strip()

    if not prompt:
        prompt = "Give me 5 fun and fascinating facts about tardigrades."
        print(f"No prompt entered. Using default: {prompt}")

    # The input data for your Workflow, including the prompt and API key
    research_input = GenerateReportInput(prompt=prompt)`;

const STARTER_START = `    # Start the Workflow execution
    handle = await client.start_workflow(
        GenerateReportWorkflow,  # The Workflow method to execute
        research_input,
        id=f"generate-research-report-workflow-{uuid.uuid4()}",
        task_queue="research",  # task queue your Worker is polling
    )

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")`;

const STARTER_ENTRY = `if __name__ == "__main__":
    asyncio.run(main())`;

const STARTER_FULL = `import asyncio
import uuid

from models import GenerateReportInput  # dataclass for Workflow input
from temporalio.client import Client  # Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow  # Your Workflow definition

async def main():
    # Connect to the Temporal service
    client = await Client.connect("localhost:7233", namespace="default")

    # Get user input for research topic
    print("Welcome to the Research Report Generator!")
    prompt = input("Enter your research topic or question: ").strip()

    if not prompt:
        prompt = "Give me 5 fun and fascinating facts about tardigrades."
        print(f"No prompt entered. Using default: {prompt}")

    # The input data for your Workflow, including the prompt and API key
    research_input = GenerateReportInput(prompt=prompt)

    # Start the Workflow execution
    handle = await client.start_workflow(
        GenerateReportWorkflow,  # The Workflow method to execute
        research_input,
        id=f"generate-research-report-workflow-{uuid.uuid4()}",
        task_queue="research",  # task queue your Worker is polling
    )

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())`;

const SEND_EMAIL_ACTIVITY = `from temporalio.exceptions import ApplicationError

@activity.defn
def send_email() -> str:
    """Simulates sending e-mail"""

    # This simulates a temporary failure - maybe a database is down,
    # or an API is temporarily unavailable
    raise ApplicationError(
        "Simulated failure: Email service temporarily unavailable"
    )

    # This code would run if we remove the error above
    return "Email sent"`;

const WORKFLOW_WITH_EMAIL = `from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call, send_email

    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
    )

@workflow.defn
class GenerateReportWorkflow:
    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        llm_call_input = LLMCallInput(prompt=input.prompt)

        research_facts = await workflow.execute_activity(
            llm_call,
            llm_call_input,
            start_to_close_timeout=timedelta(seconds=30),
        )

        pdf_generation_input = PDFGenerationInput(content=research_facts["choices"][0]["message"]["content"])

        pdf_filename = await workflow.execute_activity(
            create_pdf,
            pdf_generation_input,
            start_to_close_timeout=timedelta(seconds=20),
        )

        # Adding a new Activity that has a simulated failure
        email_sent = await workflow.execute_activity(
            send_email,
            start_to_close_timeout=timedelta(seconds=20),
        )

        return f"Successfully created research report PDF: {pdf_filename}"`;

const WORKER_WITH_EMAIL = `import concurrent.futures

from activities import create_pdf, llm_call, send_email
from temporalio.client import Client
from temporalio.worker import Worker
from workflow import GenerateReportWorkflow

async def run_worker():
    client = await Client.connect("localhost:7233", namespace="default")

    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as activity_executor:
        worker = Worker(
            client,
            task_queue="research",
            workflows=[GenerateReportWorkflow],
            activities=[llm_call, create_pdf, send_email],
            activity_executor=activity_executor,
        )

        print(f"Starting the worker with summary Activity registered....")
        await worker.run()`;

const SEND_EMAIL_FIXED = `from temporalio import activity
from litellm import completion

@activity.defn
def send_email() -> str:
    """Simulates sending e-mail"""

    return "Email sent"`;

export default function DurableAiChapter1Page() {
  return (
    <Layout
      title="Part 1: Durable AI with Temporal"
      description="Transform a simple LLM research app into a resilient, fault-tolerant system using Temporal Workflows and Activities."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="Building Durable AI Applications"
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
                    label: "Building Durable AI Applications",
                    href: "/tutorials/ai/building-durable-ai-applications/",
                  },
                  { label: "Part 1: Durable AI" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Part 1: Adding Durability to AI Applications with Temporal
            </h1>

            <MetaChips items={["~45 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              By now, you've probably experienced generative AI firsthand.
              You've used ChatGPT and seen what LLMs can do. They excel at
              tasks like research, but their real power emerges when we
              connect them to users and external systems to build advanced
              applications that go beyond simple chat interfaces.
            </p>

            <p>
              But building these applications comes with a critical challenge:{" "}
              <strong>durability</strong>. Imagine your application conducts
              expensive research through an LLM call (costing time and money),
              but then crashes during PDF generation due to a network outage.
              When you restart, everything is lost. You're back at the
              beginning - paying for the same LLM call again, making your
              users wait, and burning through your API budget.
            </p>

            <p>
              To begin, let's take a look at this simple chain: using an LLM
              to generate research, then turning that research into a PDF and
              see in real-time why durability matters.
            </p>

            <p>
              Here's a video that introduces the importance of durability and
              what you'll learn in this tutorial:
            </p>

            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                maxWidth: "100%",
                margin: "24px 0",
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
                src="https://www.youtube.com/embed/bxpbVUMl7-w?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0&wmode=transparent"
                title="Adding Durability to AI Applications with Temporal"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <p>
              In this tutorial, you'll solve this problem by using Temporal to
              make your research application durable. You'll learn how to
              build GenAI applications that survive failures, recover
              automatically, and never lose progress.
            </p>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before you begin this tutorial, ensure you have:</p>
              <ul>
                <li>
                  An{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenAI API key
                  </a>
                </li>
                <li>
                  Cloned{" "}
                  <a
                    href="https://github.com/temporalio/edu-durable-ai-tutorial-template"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    this repository
                  </a>{" "}
                  or use{" "}
                  <a
                    href="https://github.com/temporalio/edu-durable-ai-tutorial-template/blob/main/codespaces.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Codespace
                  </a>{" "}
                  if you don't want to clone it.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="getting-started">
              <h2 className={styles.sectionTitle}>
                Getting started: clone the template repository
              </h2>
              <p>
                To start, you'll clone a template repository that contains a
                basic research application. This application uses an LLM to
                generate research content and creates a PDF report, but it
                lacks durability - any failure means starting over from
                scratch.
              </p>
              <p>
                <strong>1. Clone the repository:</strong>
              </p>
              <CodeBlock language="bash">{CLONE_REPO}</CodeBlock>
              <p>
                <strong>2. Install dependencies:</strong>
              </p>
              <CodeBlock language="bash">{INSTALL_DEPS}</CodeBlock>
              <p>
                <strong>3. Set up your OpenAI API key:</strong>
              </p>
              <p>
                Create a <code>.env</code> file in the project root:
              </p>
              <CodeBlock language="bash">{ENV_FILE}</CodeBlock>
              <p>
                <strong>4. Review the code:</strong>
              </p>
              <p>Run the basic application to see how it works:</p>
              <CodeBlock language="bash">{RUN_APP}</CodeBlock>
              <p>
                Enter a research topic when prompted, and you'll see the LLM
                generate content and create a PDF. This works fine - until
                something fails.
              </p>
              <p>
                <strong>The Problem:</strong> If this application crashes
                after the expensive LLM call but before PDF generation, you
                lose all progress and have to start over, wasting time and
                money. Review the video at the beginning of this tutorial to
                see that in action. Let's fix that with Temporal.
              </p>
            </section>

            <section className={styles.section} id="introducing-temporal">
              <h2 className={styles.sectionTitle}>Introducing Temporal</h2>
              <p>
                <a
                  href="https://temporal.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal
                </a>{" "}
                is an open source platform that ensures the successful
                completion of long-running processes despite failures or
                network issues.
              </p>
              <p>
                Temporal provides fault tolerance by automatically retrying
                failed tasks, and ensures durability by persisting Workflow
                states, allowing them to resume from the last known state
                after a failure like a network outage.
              </p>
              <p>With Temporal, you get:</p>
              <ul>
                <li>
                  <strong>Crash-proof execution</strong> - Your application
                  survives failures and restarts
                </li>
                <li>
                  <strong>Automatic retries</strong> - Failed operations retry
                  automatically
                </li>
                <li>
                  <strong>State persistence</strong> - Progress is saved at
                  each step, so you never lose work even in the case of a
                  network outage or something else
                </li>
              </ul>

              <details>
                <summary>What is Durable Execution?</summary>
                <p>
                  Durable Execution ensures that your application behaves
                  correctly despite adverse conditions by guaranteeing that it
                  will run to completion.
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
                    <strong>Long-running processes</strong> can span hours or
                    days without losing context.
                  </li>
                </ul>
                <p>
                  Without durability, every failure means starting over. With
                  durability, failures become recoverable interruptions
                  instead of catastrophic losses. This is especially critical
                  for GenAI applications where LLM calls are expensive, slow,
                  and unpredictable.
                </p>
                <h4>AI needs durability</h4>
                <p>Your research application needs to:</p>
                <ol>
                  <li>
                    Accept user input
                    <ul>
                      <li>
                        Possible problems: input validation service, rate
                        limiting
                      </li>
                    </ul>
                  </li>
                  <li>
                    Call the LLM for research
                    <ul>
                      <li>
                        Possible problems: internet connection, API down, rate
                        limiting, timeout
                      </li>
                    </ul>
                  </li>
                  <li>
                    Generate PDF
                    <ul>
                      <li>Possible problems: memory limits</li>
                    </ul>
                  </li>
                  <li>
                    Return success/failure
                    <ul>
                      <li>Possible problem: connection dropped</li>
                    </ul>
                  </li>
                </ol>
                <p>
                  <strong>This is why durability matters.</strong> Without it,
                  complex workflows become fragile and expensive. With it,
                  failures become manageable interruptions instead of
                  catastrophic losses.
                </p>
              </details>

              <h3 className={styles.subsectionTitle}>Setup</h3>
              <p>
                Now let's add Temporal to your application. In your{" "}
                <code>edu-durable-ai-tutorial-template</code> directory, add
                the <code>temporalio</code> package:
              </p>
              <CodeBlock language="bash">{ADD_TEMPORAL}</CodeBlock>
            </section>

            <section className={styles.section} id="define-external-interactions">
              <h2 className={styles.sectionTitle}>
                Define external interactions
              </h2>
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
                Activities encapsulate the logic for tasks that interact with
                external services such as querying a database or calling a
                third-party API. One of the key benefits of using Activities
                is their built-in fault tolerance. If an Activity fails,
                Temporal can automatically retry it until it succeeds or
                reaches a specified retry limit. This ensures that transient
                issues, like network glitches or temporary service outages,
                don't result in data loss or incomplete processes.
              </p>
              <p>Examples:</p>
              <ul>
                <li>
                  <strong>External API calls</strong> - LLM requests, database
                  queries
                </li>
                <li>
                  <strong>File system operations</strong> - Reading documents,
                  writing reports
                </li>
                <li>
                  <strong>Network operations</strong> - HTTP requests, email
                  sending
                </li>
              </ul>
              <h3 className={styles.subsectionTitle}>
                What Activities give you
              </h3>
              <ul>
                <li>
                  <a
                    href="https://docs.temporal.io/develop/python/failure-detection#activity-retries"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>Automatic retries</strong>
                  </a>{" "}
                  when network outages happen
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/develop/python/failure-detection#activity-timeouts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>Timeout handling</strong>
                  </a>{" "}
                  for slow operations and detecting failures
                </li>
                <li>
                  <strong>Automatic checkpoints</strong> - if your workflow
                  crashes, Activities aren't re-executed. Instead, your
                  Workflow continues from the last known good state
                </li>
              </ul>
            </section>

            <section
              className={styles.section}
              id="creating-your-first-activities"
            >
              <h2 className={styles.sectionTitle}>
                Create your first Activities
              </h2>
              <p>
                The template repository contains an <code>app.py</code> file
                with two functions:
              </p>
              <ol>
                <li>
                  <code>llm_call</code> - Calls an LLM to generate research
                </li>
                <li>
                  <code>create_pdf</code> - Takes that research and generates
                  a PDF
                </li>
              </ol>
              <p>
                Both functions interact with external systems (an LLM API and
                the file system) that can fail due to network issues,
                timeouts, or other transient errors. Let's convert them into
                Temporal Activities.
              </p>
              <p>
                <strong>1. Rename <code>app.py</code> to{" "}
                <code>activities.py</code>.</strong>
              </p>
              <p>
                <strong>2. Add the Temporal activity import</strong> to the
                top of your <code>activities.py</code> file:
              </p>
              <CodeBlock language="python">{ACTIVITY_IMPORT}</CodeBlock>
              <p>
                <strong>3. Turn functions into Activities</strong> by adding
                the <code>@activity.defn</code> decorator above the{" "}
                <code>llm_call</code> and <code>create_pdf</code> functions:
              </p>
              <CodeBlock language="python">{LLM_CALL_ACTIVITY}</CodeBlock>

              <details>
                <summary>
                  Your <code>activities.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="activities.py">
                  {ACTIVITIES_FULL}
                </CodeBlock>
              </details>

              <p>
                As an Activity, your LLM call and PDF generation logic are
                now:
              </p>
              <ul>
                <li>Protected against API timeouts</li>
                <li>Automatically retried with backoff</li>
                <li>Observable for debugging</li>
              </ul>
            </section>

            <section
              className={styles.section}
              id="define-your-application-logic"
            >
              <h2 className={styles.sectionTitle}>
                Define your application logic
              </h2>
              <p>
                Now that you have your functions that can interact with
                external services, you'll build a Temporal Workflow to
                orchestrate the LLM call and PDF generation functions to
                build your application's business logic. This is where a
                Workflow comes in.
              </p>
              <p>
                A{" "}
                <a
                  href="https://docs.temporal.io/workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definition
                </a>{" "}
                is essentially a function, which can store state and
                orchestrates the execution of Activities. Workflows manage
                the coordination and logic of your application's processes,
                while Activities perform the tasks which interact with
                external services or are prone to failure due to their
                ability to retry.
              </p>

              <h3 className={styles.subsectionTitle}>Creating the Workflow</h3>
              <p>
                Now you'll create a Workflow that orchestrates your two
                Activities (LLM call and PDF generation) in sequence. Create
                a file called <code>workflow.py</code> to contain your
                workflow logic.
              </p>

              <h3 className={styles.subsectionTitle}>
                Understanding Workflow structure
              </h3>
              <p>
                Workflows in Temporal are defined as{" "}
                <strong>asynchronous classes</strong> with these key elements:
              </p>
              <ol>
                <li>
                  <strong>Class decorator</strong>: <code>@workflow.defn</code>{" "}
                  marks the class as a Workflow
                </li>
                <li>
                  <strong>Entry point method</strong>: A single{" "}
                  <code>async</code> method decorated with{" "}
                  <code>@workflow.run</code>
                </li>
                <li>
                  <strong>Activity execution</strong>: Activities are called
                  using <code>workflow.execute_activity()</code>
                </li>
              </ol>
              <p>Let's build the Workflow step by step:</p>

              <h3 className={styles.subsectionTitle}>
                Step 1: Set up your Workflow file
              </h3>
              <p>
                Create <code>workflow.py</code> and start with the necessary
                imports:
              </p>
              <CodeBlock language="python">{WORKFLOW_IMPORTS}</CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 2: Import Activities and models inside the Workflow
              </h3>
              <p>
                Before you can use your Activities and models, you need to
                import them inside your Workflow. Temporal requires a special
                import pattern:
              </p>
              <CodeBlock language="python">
                {WORKFLOW_IMPORTS_PASSED_THROUGH}
              </CodeBlock>

              <Admonition type="note">
                <p>
                  <strong>
                    Why <code>workflow.unsafe.imports_passed_through()</code>?
                  </strong>
                </p>
                <p>
                  Temporal relies on a{" "}
                  <a
                    href="https://docs.temporal.io/encyclopedia/event-history/event-history-python"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Replay mechanism
                  </a>{" "}
                  to recover from failure. As your program progresses,
                  Temporal saves the input and output from function calls to
                  the history. This allows a failed program to restart right
                  where it left off.
                </p>
                <p>
                  Temporal requires this special import pattern for Workflows
                  for replay. This import pattern tells Temporal: "These
                  imports are safe to use during replay."
                </p>
              </Admonition>

              <h3 className={styles.subsectionTitle}>
                Step 3: Define the Workflow class
              </h3>
              <p>Create your Workflow class with the required decorators:</p>
              <CodeBlock language="python">{WORKFLOW_CLASS_DEFN}</CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 4: Execute the LLM Activity
              </h3>
              <p>
                Inside the <code>run</code> method, call your first Activity
                to generate research content. Notice how we:
              </p>
              <ul>
                <li>
                  Prepare the input using the <code>LLMCallInput</code>{" "}
                  dataclass (which gets data from the Workflow input)
                </li>
                <li>
                  Use <code>await workflow.execute_activity()</code> to
                  execute the <code>llm_call</code> Activity
                </li>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/failure-detection#activity-timeouts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Start-to-Close timeout
                  </a>{" "}
                  is the maximum amount of time a single Activity Execution
                  can take. Temporal recommends always setting this timeout.
                  We'll set it to 30 seconds, meaning the{" "}
                  <code>llm_call</code> Activity has 30 seconds to complete
                  before retrying. This way, if there is a network outage or
                  some other transient issue, the Workflow won't hang
                  indefinitely - it will automatically retry the Activity
                  until it succeeds.
                </li>
              </ul>

              <Admonition type="note">
                <p>
                  <strong>
                    Key points about <code>workflow.execute_activity()</code>:
                  </strong>
                </p>
                <ul>
                  <li>First parameter: The Activity function to execute (referenced by name)</li>
                  <li>Second parameter: The input to pass into the Activity</li>
                  <li>Third parameter: The Activity timeout you wish to set</li>
                </ul>
              </Admonition>

              <CodeBlock language="python">{WORKFLOW_STEP4}</CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 5: Execute the PDF generation Activity
              </h3>
              <p>
                Now add the second Activity to create the PDF. This Activity
                depends on the output from the first Activity.
              </p>
              <CodeBlock language="python">{WORKFLOW_STEP5}</CodeBlock>

              <details>
                <summary>
                  Your <code>workflow.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="workflow.py">
                  {WORKFLOW_FULL}
                </CodeBlock>
              </details>

              <h3 className={styles.subsectionTitle}>
                Optional: Adding a Retry Policy
              </h3>
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
              <CodeBlock language="python">{RETRY_POLICY_SNIPPET}</CodeBlock>
              <p>
                In this example, the PDF generation Activity would include a
                custom retry policy that controls how failures are handled:
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
                  between each retry (2s &rarr; 6s)
                </li>
              </ul>
              <p>
                This means if PDF generation fails, Temporal will
                automatically retry with exponential backoff, giving
                transient issues time to resolve.
              </p>
            </section>

            <section className={styles.section} id="run-your-application">
              <h2 className={styles.sectionTitle}>Run your application</h2>
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
                Create a new file called <code>worker.py</code> and let's
                build it step by step:
              </p>

              <p>
                <strong>Step 1: Import dependencies</strong>
              </p>
              <CodeBlock language="python">{WORKER_IMPORTS}</CodeBlock>

              <p>
                <strong>Step 2: Create the Worker function</strong>
              </p>
              <CodeBlock language="python">{WORKER_FUNC}</CodeBlock>

              <p>
                This Worker configuration tells Temporal how your application
                should execute:
              </p>
              <ul>
                <li>
                  <code>task_queue="research"</code> - Specifies which Task
                  Queue the Worker monitors for incoming work. When you start
                  a Workflow using this same Task Queue name, this Worker
                  will pick it up and execute it.
                </li>
                <li>
                  <code>workflows=[GenerateReportWorkflow]</code> - Registers
                  your Workflow definition with the Worker, enabling it to
                  execute instances of this Workflow when tasks appear in the
                  queue.
                </li>
                <li>
                  <code>activities=[llm_call, create_pdf]</code> - Registers
                  your Activity functions with the Worker, allowing it to
                  execute these Activities when your Workflow calls them.
                </li>
              </ul>

              <p>
                <strong>Step 3: Add the entry point</strong>
              </p>
              <CodeBlock language="python">{WORKER_ENTRY}</CodeBlock>
              <p>This starts the Worker when you run the file.</p>

              <details>
                <summary>
                  Your complete <code>worker.py</code> should look like this:
                </summary>
                <CodeBlock language="python" title="worker.py">
                  {WORKER_FULL}
                </CodeBlock>
              </details>

              <h3 className={styles.subsectionTitle}>Start your application</h3>
              <p>
                You've now built the core components of your durable
                application:
              </p>
              <ul>
                <li>
                  <strong>Activities</strong> - Your external interactions
                  (LLM call and PDF generation)
                </li>
                <li>
                  <strong>Workflow</strong> - Your business logic that
                  orchestrates the Activities
                </li>
                <li>
                  <strong>Worker</strong> - The execution engine that runs
                  your Workflows and Activities
                </li>
              </ul>
              <p>
                Now it's time to actually start your Research Workflow. To do
                this, you'll use a{" "}
                <a
                  href="https://docs.temporal.io/develop/python/temporal-client"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Client
                </a>
                .
              </p>
              <p>
                A Temporal Client provides a set of APIs to communicate with
                a Temporal Service. You can use a Temporal Client in your
                application to perform various operations such as:
              </p>
              <ul>
                <li>
                  <strong>Start a Workflow Execution</strong> (like
                  generating a research report)
                </li>
                <li>
                  <strong>Query the state</strong> of a running Workflow
                  (like checking if the PDF is complete)
                </li>
                <li>
                  <strong>Send signals</strong> to running Workflows (like
                  updating the research prompt mid-execution)
                </li>
                <li>
                  <strong>Get results</strong> from completed Workflows (like
                  retrieving the final PDF filename)
                </li>
              </ul>
              <p>
                Before creating the client, clean up your{" "}
                <code>activities.py</code> file.{" "}
                <strong>Remove the script execution code</strong> at the
                bottom of the file - we'll be starting Workflows through the
                client instead. This includes:
              </p>
              <CodeBlock language="python">{REMOVE_SCRIPT_CODE}</CodeBlock>

              <Admonition type="note">
                <p>
                  <strong>Why remove the execution code?</strong>
                </p>
                <p>The Activities file should only contain:</p>
                <ul>
                  <li>Activity function definitions</li>
                  <li>Business logic for external interactions</li>
                </ul>
                <p>
                  Workflow execution logic belongs in separate starter/client
                  files.
                </p>
              </Admonition>

              <p>
                Your <code>activities.py</code> file should now only contain
                imports and Activity definitions.
              </p>

              <details>
                <summary>
                  Your <code>activities.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="activities.py">
                  {ACTIVITIES_CLEAN}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="create-your-client">
              <h2 className={styles.sectionTitle}>Create your client</h2>
              <p>
                Now, let's create a Client to start your{" "}
                <code>GenerateReportWorkflow</code>. Create a separate file
                called <code>starter.py</code> and build it step by step:
              </p>

              <p>
                <strong>
                  Step 1: Set up imports and load environment variables
                </strong>
              </p>
              <CodeBlock language="python">{STARTER_IMPORTS}</CodeBlock>

              <p>
                <strong>Step 2: Create the main function</strong>
              </p>
              <CodeBlock language="python">{STARTER_MAIN}</CodeBlock>
              <p>
                This sets up the connection to your local Temporal server and
                gets the research topic from the user.
              </p>

              <p>
                <strong>Step 3: Start the Workflow</strong>
              </p>
              <CodeBlock language="python">{STARTER_START}</CodeBlock>
              <p>
                The method returns a <code>handle</code> that lets you
                interact with the running Workflow. The{" "}
                <code>await handle.result()</code> call blocks until the
                Workflow completes and returns the final result.
              </p>

              <p>
                <strong>Step 4: Add the entry point</strong>
              </p>
              <CodeBlock language="python">{STARTER_ENTRY}</CodeBlock>
              <p>This allows you to run the file.</p>

              <details>
                <summary>
                  Your <code>starter.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="starter.py">
                  {STARTER_FULL}
                </CodeBlock>
              </details>

              <h3 className={styles.subsectionTitle}>
                Run your Worker and starter file
              </h3>
              <p>
                With both the Worker and client code ready, let's run your
                application. We need a few terminal windows running:
              </p>
              <p>
                <strong>1. Terminal 1 - Make sure your Temporal server is
                running.</strong>
              </p>
              <p>
                The first step to run anything in Temporal is to make sure
                you have a local Temporal Service running. Open a separate
                terminal window and start the service with{" "}
                <code>temporal server start-dev</code>.
              </p>
              <p>
                As you'll see in the command line output, your Temporal
                Server should now be running on{" "}
                <code>http://localhost:8233</code>. When you first access
                this server, you should see zero Workflows running.
              </p>
              <p>
                <strong>2. Terminal 2 - Start your Worker:</strong>
              </p>
              <CodeBlock language="bash">uv run worker.py</CodeBlock>
              <p>
                You should see output indicating the Worker has started and
                is listening on the "research" task queue.{" "}
                <strong>Keep this terminal running</strong> - the Worker
                needs to be active to execute your Workflows.
              </p>
              <p>
                <strong>3. Terminal 3 - Execute your Workflow:</strong>
              </p>
              <CodeBlock language="bash">uv run starter.py</CodeBlock>
              <p>
                Enter a research topic when prompted, and watch as Temporal
                orchestrates your LLM call and PDF generation. You should
                see:
              </p>
              <ul>
                <li>The Workflow ID printed in your client terminal</li>
                <li>A PDF file created in your project directory</li>
              </ul>
            </section>

            <section className={styles.section} id="using-the-temporal-web-ui">
              <h2 className={styles.sectionTitle}>
                Using the Temporal Web UI
              </h2>
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
                  Debug and understand what's happening during your Workflow
                  Executions
                </li>
              </ul>
              <p>
                Access the Web UI at <code>http://localhost:8233</code> when
                running the Temporal development server, and you should see
                that your Workflow Execution has completed successfully.
              </p>
              <p>
                <a
                  href="https://i.postimg.cc/qR7VQhcv/web-ui-example.png"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://i.postimg.cc/qR7VQhcv/web-ui-example.png"
                    alt="Temporal Web UI showing completed workflow"
                    className={styles.diagramImage}
                  />
                </a>
              </p>
              <p>See if you can locate the following items on the Web UI:</p>
              <ul>
                <li>The name of the Task Queue</li>
                <li>The name of the two Activities called</li>
                <li>The inputs and outputs of the called Activities</li>
                <li>The inputs and outputs of the Workflow Execution</li>
              </ul>
              <p>
                That's it! You're now done adding durability to your research
                application. Your workflow now has:
              </p>
              <ul>
                <li>
                  <strong>Automatic state persistence</strong> - Every
                  completed Activity (LLM call, PDF generation) is saved to
                  Temporal's event history
                </li>
                <li>
                  <strong>Crash recovery</strong> - If your application
                  crashes at any point, it resumes from the last completed
                  Activity instead of starting over
                </li>
                <li>
                  <strong>No duplicate LLM calls</strong> - You'll never pay
                  twice for the same API call, even after failures or
                  restarts
                </li>
                <li>
                  <strong>Built-in retry logic</strong> - Transient failures
                  (network timeouts, API rate limits) are automatically
                  retried with exponential backoff
                </li>
                <li>
                  <strong>Complete observability</strong> - Every execution
                  is tracked in the Web UI with full input/output history for
                  debugging
                </li>
              </ul>
              <p>
                Your simple research application has been transformed into a
                production-ready, fault-tolerant application - without
                adding complex error handling code or state management
                logic. Temporal handles all of that for you.
              </p>
              <p>
                You're now done with the tutorial. Feel free to move on to
                the{" "}
                <Link to="/tutorials/ai/building-durable-ai-applications/02-human-in-the-loop/">
                  next tutorial in this series
                </Link>{" "}
                or continue on to see Temporal's durability in action and
                experience how it recovers from failures.
              </p>
            </section>

            <section
              className={styles.section}
              id="experiencing-failure-and-recovery"
            >
              <h2 className={styles.sectionTitle}>
                Optional: Experiencing failure and recovery
              </h2>
              <p>
                Let's practice experiencing failure and recovery firsthand.
                We'll add a new feature to our workflow: sending an email
                before creating the PDF.
              </p>
              <p>This will demonstrate:</p>
              <ul>
                <li>How Activities automatically retry on failure</li>
                <li>How Temporal preserves state across Worker restarts</li>
                <li>How you can fix bugs without losing progress</li>
              </ul>

              <h3 className={styles.subsectionTitle}>
                Step 1: Create a new Activity with an intentional error
              </h3>
              <p>
                We'll create a <code>send_email</code> Activity that contains
                an intentional error to simulate a real-world failure. In our
                case, this is just an error we're intentionally throwing, but
                this could just as easily be an internal service that isn't
                responding, a network outage, an application crashing, or
                more. Add this code to <code>activities.py</code>:
              </p>
              <CodeBlock language="python">{SEND_EMAIL_ACTIVITY}</CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 2: Update the Workflow to call the{" "}
                <code>send_email</code> Activity
              </h3>
              <p>
                Now modify the Workflow to call the <code>send_email</code>{" "}
                Activity after generating the PDF. Try this on your own.
              </p>

              <details>
                <summary>
                  Your <code>workflow.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="workflow.py">
                  {WORKFLOW_WITH_EMAIL}
                </CodeBlock>
              </details>

              <h3 className={styles.subsectionTitle}>
                Step 3: Register the new Activity with the Worker
              </h3>
              <p>
                Update the Worker to register the new <code>send_email</code>{" "}
                Activity:
              </p>
              <CodeBlock language="python" title="worker.py">
                {WORKER_WITH_EMAIL}
              </CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 4: Start the Worker and execute the Workflow
              </h3>
              <p>
                Restart your Worker to register the changes with{" "}
                <code>uv run worker.py</code> and start your Workflow with{" "}
                <code>uv run starter.py</code>. Re-enter your new prompt.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 5: Observe automatic retries in the Web UI
              </h3>
              <p>
                Go to your Temporal Web UI at{" "}
                <code>http://localhost:8233</code>.
              </p>
              <p>You should see:</p>
              <ol>
                <li>
                  Your Workflow is <strong>Running</strong> (not Failed)
                </li>
                <li>
                  The <code>llm_call</code> Activity completed successfully
                </li>
                <li>
                  The <code>send_email</code> Activity shows a{" "}
                  <strong>Pending Activity</strong> with retry attempts
                </li>
              </ol>
              <p>
                <a
                  href="https://i.postimg.cc/cLw9VF52/retrying-activity.png"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://i.postimg.cc/cLw9VF52/retrying-activity.png"
                    alt="Web UI showing activity retrying after failure"
                    className={styles.diagramImage}
                  />
                </a>
              </p>
              <p>
                <strong>Click on the Pending Activity to see:</strong>
              </p>
              <ul>
                <li>The error message</li>
                <li>The current retry attempt number</li>
                <li>The countdown until the next retry</li>
              </ul>

              <Admonition type="info">
                <p>
                  Notice that the expensive <code>llm_call</code> Activity
                  isn't being re-executed. Temporal saved its result and
                  won't waste money calling the LLM again. Only the failing
                  Activity retries.
                </p>
              </Admonition>

              <p>
                In practice, your code will continue retrying until whatever
                issue the Activity has encountered has resolved itself,
                whether that is the network coming back online or an
                internal service starting to respond again. By leveraging
                the durability of Temporal and out-of-the-box retry
                capabilities, you have avoided writing retry and timeout
                logic yourself and saved your downstream services from being
                unnecessarily overwhelmed.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 6: Fix the error
              </h3>
              <p>
                Now let's "fix" our simulated failure by removing the error.
                In a real scenario, this could be:
              </p>
              <ul>
                <li>A database coming back online</li>
                <li>An API endpoint being fixed</li>
                <li>A network issue being resolved</li>
              </ul>
              <p>
                Update your <code>send_email</code> Activity by removing the
                error and saving the file:
              </p>
              <CodeBlock language="python">{SEND_EMAIL_FIXED}</CodeBlock>

              <h3 className={styles.subsectionTitle}>
                Step 7: Restart the Worker with fixed code
              </h3>
              <p>
                Restart your Worker (<code>uv run worker.py</code>) so it
                picks up the fixed Activity code. The Worker will pick up
                where it left off.
              </p>

              <h3 className={styles.subsectionTitle}>
                Step 8: Observe successful completion
              </h3>
              <p>Your Web UI will now show:</p>
              <ol>
                <li>
                  The <code>send_email</code> Activity now completes
                  successfully
                </li>
                <li>
                  The entire Workflow shows <strong>Completed</strong> status
                </li>
              </ol>
              <p>
                <a
                  href="https://i.postimg.cc/cJv44bjh/successful-completion.png"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="https://i.postimg.cc/cJv44bjh/successful-completion.png"
                    alt="Web UI showing workflow completed successfully"
                    className={styles.diagramImage}
                  />
                </a>
              </p>
              <p>
                <strong>What just happened?</strong>
              </p>
              <ul>
                <li>
                  Your Workflow <strong>preserved all state</strong> through
                  the failure
                </li>
                <li>
                  The expensive <code>llm_call</code> was{" "}
                  <strong>never re-executed</strong> (saving you money)
                </li>
                <li>
                  When you fixed the bug, Temporal{" "}
                  <strong>automatically continued</strong> from where it left
                  off
                </li>
                <li>
                  No manual intervention needed - just fix the code and
                  restart the Worker
                </li>
              </ul>
              <p>
                This is the power of Temporal and durable execution - your
                critical business processes are guaranteed to complete with
                no manual recovery, no lost data, and no duplicate
                operations.
              </p>

              <h3 className={styles.subsectionTitle}>What's next?</h3>
              <p>
                Imagine your research application pausing after generating
                content, sending you the draft for review, waiting for your
                edits or approval, and then continuing automatically to
                create the final PDF - all while maintaining durable
                execution guarantees. That's the power of adding
                human-in-the-loop capabilities with fault-tolerant AI
                workflows.
              </p>
              <p>
                In the{" "}
                <Link to="/tutorials/ai/building-durable-ai-applications/02-human-in-the-loop/">
                  next tutorial
                </Link>{" "}
                in this mini-series, we'll show you how to{" "}
                <strong>add human-in-the-loop capabilities</strong> to your
                AI workflows.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/building-durable-ai-applications/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Series overview
                </span>
              </Link>
              <Link
                to="/tutorials/ai/building-durable-ai-applications/02-human-in-the-loop/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: Part 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &rarr;
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Human in the Loop
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
