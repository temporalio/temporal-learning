---
id: adding-durability-with-temporal
sidebar_position: 1
keywords: [ai, durable, temporal, workflow, activities, genai, llm]
tags: [AI, durable, temporal, LLM, genai, workflow, activities]
last_update:
  date: 2025-10-15
  author: Angela Zhou
title: "Part 1: Adding Durability to Our Research Application"
description: Learn how to make your GenAI applications durable and resilient to failures using Temporal Workflows and Activities
image: /img/temporal-logo-twitter-card.png
---

# Part 1: Adding Durability to AI Applications with Temporal

By now, you've probably experienced generative AI firsthand. You've used ChatGPT and seen what LLMs can do. They excel at tasks like research, but their real power emerges when we connect them to users and external systems to build advanced applications that go beyond simple chat interfaces.

But building these applications comes with a critical challenge: **durability**. Imagine your application conducts expensive research through an LLM call (costing time and money), but then crashes during PDF generation due to a network outage. When you restart, everything is lost. You're back at the beginning—paying for the same LLM call again, making your users wait, and burning through your API budget.

To begin, let's take a look at this simple chain: using an LLM to generate research, then turning that research into a PDF and see in real-time why durability matters.

Here's a video that introduces the importance of durability and what you'll learn in this tutorial:

<iframe width="1040" height="585" src="https://www.youtube.com/embed/bxpbVUMl7-w?rel=0&iv_load_policy=3&modestbranding=1&showsearch=0&showinfo=0&wmode=transparent" title="Code Walkthrough (Welcome to Temporal 101 - .NET)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

In this tutorial, we'll solve this problem by using Temporal to make your research application durable. You'll learn how to build GenAI applications that survive failures, recover automatically, and never lose progress.

## Prerequisites

Before you begin this tutorial, ensure you have:

- An [OpenAI API key](https://platform.openai.com/api-keys)
- Cloned [this repository](https://github.com/temporalio/edu-durable-ai-tutorial-template) or use [Codespace](https://github.com/temporalio/edu-durable-ai-tutorial-template/blob/main/codespaces.md) if you don't want to clone it.

## Getting Started: Clone the Template Repository

To start, you'll clone a template repository that contains a basic research application. This application uses an LLM to generate research content and creates a PDF report, but it lacks durability - any failure means starting over from scratch.

1. **Clone the repository:**

```bash
git clone https://github.com/temporalio/edu-durable-ai-tutorial-template.git
cd edu-durable-ai-tutorial-template
```

2. **Install dependencies:**

```bash
uv sync
```

3. **Set up your OpenAI API key:**

Create a `.env` file in the project root:

```bash
LLM_API_KEY=your_openai_api_key_here
LLM_MODEL=openai/gpt-4o
```

4. **Review the code:**

Run the basic application to see how it works:

```bash
uv run app.py
```

Enter a research topic when prompted, and you'll see the LLM generate content and create a PDF. This works fine - until something fails.

**The Problem:** If this application crashes after the expensive LLM call but before PDF generation, you lose all progress and have to start over, wasting time and money. Review the video in the beginning of this video to see that in action. Let's fix that with Temporal.

## Introducing Temporal

[Temporal](https://temporal.io/) is an open source platform that ensures the successful completion of long-running processes despite failures or network issues. 

Temporal provides fault tolerance by automatically retrying failed tasks, and ensures durability by persisting Workflow states, allowing them to resume from the last known state after a failure like a network outage.

With Temporal, you get:

* **Crash-proof execution** - Your application survives failures and restarts
* **Automatic retries** - Failed operations retry automatically
* **State persistence** - Progress is saved at each step, so you never lose work even in the case of a network outage or something else 

<details>
<summary>What is Durable Execution?</summary>

Durable Execution ensures that your application behaves correctly despite adverse conditions by guaranteeing that it will run to completion. 

- If an LLM call fails halfway through processing, you **don't lose the work already completed**.
- If a database query times out, you can **retry just that step** without restarting everything.
- If your application crashes, it can **resume from the last successful operation**.
- **Long-running processes** can span hours or days without losing context.

Without durability, every failure means starting over. With durability, failures become recoverable interruptions instead of catastrophic losses. This is especially critical for GenAI applications where LLM calls are expensive, slow, and unpredictable.

### AI Needs Durability

Your research application needs to:
1. Accept user input
   - Possible problems: input validation service, rate limiting
2. Call the LLM for research
   - Possible problems: Internet connection, API down, rate limiting, timeout
3. Generate PDF
   - Possible problems: Memory limits
4. Return success/failure
   - Possible problem: Connection dropped

**This is why durability matters.** Without it, complex workflows become fragile and expensive. With it, failures become manageable interruptions instead of catastrophic losses.

</details>

### Setup

Now let's add Temporal to your application. In your `edu-durable-ai-tutorial-template` directory, add the `temporalio` package:

```bash
uv add temporalio
```

## Define External Interactions

You will now define the functions that handle interactions with external systems. These functions are called [Activities](https://docs.temporal.io/activities).

Activities encapsulate the logic for tasks that interact with external services such as querying a database or calling a third-party API. One of the key benefits of using Activities is their built-in fault tolerance. If an Activity fails, Temporal can automatically retry it until it succeeds or reaches a specified retry limit. This ensures that transient issues, like network glitches or temporary service outages, don't result in data loss or incomplete processes.

Examples:
- **External API calls** - LLM requests, database queries
- **File system operations** - Reading documents, writing reports
- **Network operations** - HTTP requests, email sending

### What Activities Give You

* [**Automatic retries**](https://docs.temporal.io/develop/python/failure-detection#activity-retries) when network outages happen
* [**Timeout handling**](https://docs.temporal.io/develop/python/failure-detection#activity-timeouts) for slow operations and detecting failures
* **Automatic checkpoints** - if your workflow crashes, Activities aren't re-executed. Instead, your Workflow continues from the last known good state

## Creating Your First Activities

The template repository contains an `app.py` file with two functions:
1. `llm_call` - Calls an LLM to generate research
2. `create_pdf` - Takes that research and generates a PDF

Both functions interact with external systems (an LLM API and the file system) that can fail due to network issues, timeouts, or other transient errors. Let's convert them into Temporal Activities.

1. **Rename `app.py` to `activities.py`:**

2. **Add the Temporal activity import** to the top of your `activities.py` file:

```python
from temporalio import activity
```

3. **Turn functions into Activities** by adding the `@activity.defn` decorator above the `llm_call` and `create_pdf` functions:

```python
@activity.defn
def llm_call(input: LLMCallInput) -> ModelResponse:
    return completion(
        model=LLM_MODEL,
        api_key=LLM_API_KEY,
        messages=[{"content": input.prompt, "role": "user"}],
    )
```

<details>
<summary>
Your <code>activities.py</code> should look like the following:
</summary>

```ini
import os
from dotenv import load_dotenv
from litellm import completion
from litellm.types.utils import ModelResponse
from models import LLMCallInput, PDFGenerationInput
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from temporalio import activity 

load_dotenv(override=True) # Reads your .env file and loads your environment variables

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

    paragraphs = input.content.split("\n\n")
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

pdf_filename = create_pdf(PDFGenerationInput(content=content, filename="research_report.pdf"))
```
</details>

As an Activity, your LLM call and PDF generation logic are now:
* Protected against API timeouts
* Automatically retried with backoff
* Observable for debugging

## Define Your Application Logic

Now that you have your functions that can interact with external services, you'll build a Temporal Workflow to orchestrate the LLM call and PDF generation functions to build your application's business logic. This is where a Workflow comes in.

A [Workflow Definition](https://docs.temporal.io/workflow-definition) is essentially a function, which can store state and orchestrates the execution of Activities. Workflows manage the coordination and logic of your application's processes, while Activities perform the tasks which interact with external services or are prone to failure due to their ability to retry.

### Creating the Workflow

Now you'll create a Workflow that orchestrates your two Activities (LLM call and PDF generation) in sequence. Create a file called `workflow.py` to contain your workflow logic.

#### Understanding Workflow Structure

Workflows in Temporal are defined as **asynchronous classes** with these key elements:

1. **Class decorator**: `@workflow.defn` marks the class as a Workflow
2. **Entry point method**: A single `async` method decorated with `@workflow.run`
3. **Activity execution**: Activities are called using `workflow.execute_activity()`

Let's build the Workflow step by step:

#### Step 1: Set Up Your Workflow File

Create `workflow.py` and start with the necessary imports:

```python
from datetime import timedelta
from temporalio import workflow
```

#### Step 2: Import Activities and Models Inside the Workflow

Before you can use your Activities and models, you need to import them inside your Workflow. Temporal requires a special import pattern:

```python
# Import Activities and models using Temporal's safe import pattern
with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call
    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
    )
```

:::note
**Why `workflow.unsafe.imports_passed_through()`?**
Temporal relies on a [Replay mechanism](https://docs.temporal.io/encyclopedia/event-history/event-history-python) to recover from failure .As your program progresses, Temporal saves the input and output from function calls to the history. This allows a failed program to restart right where it left off.

Temporal requires this special import pattern for Workflows for replay. This import pattern tells Temporal: "These imports are safe to use during replay."
:::

#### Step 3: Define the Workflow Class

Create your Workflow class with the required decorators:

```python
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
        # Your orchestration logic will go here
```

#### Step 4: Execute the LLM Activity

Inside the `run` method, call your first Activity to generate research content. Notice how we:
- Prepare the input using the `LLMCallInput` dataclass (which gets data from the Workflow input)
- Use `await workflow.execute_activity()` to execute the `llm_call` Activity
- A [Start-to-Close timeout](https://docs.temporal.io/develop/python/failure-detection#activity-timeouts) is the maximum amount of time a single Activity Execution can take. Temporal recommends to always set this timeout. We will set it to 30 seconds, meaning the `llm_call` Activity has 30 seconds to complete before retrying. This way, if there is a network outage or some other transient issue, the Workflow won't hang indefinitely—it will automatically retry the Activity until it succeeds.

:::note
**Key points about `workflow.execute_activity()`:**
    - First parameter: The Activity function to execute (referenced by name)
    - Second parameter: The input to pass into the Activity
    - Third parameter: The Activity timeout you wish to set 
:::

```python
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

        # Step 2: Create PDF Activity
```

#### Step 5: Execute the PDF Generation Activity

Now add the second Activity to create the PDF. This Activity depends on the output from the first Activity. 

```python
@workflow.defn
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

        return f"Successfully created research report PDF: {pdf_filename}"
```

<details>
<summary>
Your <code>workflow.py</code> should look like the following:
</summary>

```ini
from datetime import timedelta
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

        return f"Successfully created research report PDF: {pdf_filename}"
```
</details>

#### Optional: Adding a Retry Policy

Each Activity has a [default Retry Policy](https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy) that retries, then backs off increasingly to a maximum duration. You can also add a custom Retry Policy to your Activity execution like so:

```python
from temporalio.common import RetryPolicy

pdf_filename: str = await workflow.execute_activity(
    create_pdf,
    pdf_generation_input,
    start_to_close_timeout=timedelta(seconds=20),
    retry_policy=RetryPolicy(
        initial_interval=timedelta(seconds=2),
        maximum_attempts=3,
        backoff_coefficient=3.0,
    ),
)
```

In this example, the PDF generation Activity would include a custom retry policy that controls how failures are handled:
- `initial_interval`: Wait 2 seconds before the first retry
- `maximum_attempts`: Try up to 3 times total
- `backoff_coefficient`: Triple the wait time between each retry (2s → 6s)

This means if PDF generation fails, Temporal will automatically retry with exponential backoff, giving transient issues time to resolve.

## Run Your Application

When you start a Workflow in Temporal, it generates tasks that are placed into a queue called a Task Queue. [Workers](https://docs.temporal.io/workers) continuously poll this queue, pick up available tasks, and execute them. Your Workflow progresses as Workers complete each task. Think of it as the "engine" that powers your Temporal application.

Create a new file called `worker.py` and let's build it step by step:

**Step 1: Import Dependencies**:

```python
import asyncio
import concurrent.futures

from activities import create_pdf, llm_call
from temporalio.client import Client
from temporalio.worker import Worker
from workflow import GenerateReportWorkflow
```

**Step 2: Create the Worker Function**

```python
async def run_worker():
    # Connect to Temporal service
    client = await Client.connect("localhost:7233", namespace="default")
    
    # Create a thread pool for running Activities
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as activity_executor:
        # Configure the Worker
        worker = Worker(
            client,
            task_queue="research", # Task queue that your Worker is listening to.
            workflows=[GenerateReportWorkflow], # Register the Workflow on your Worker
            activities=[llm_call, create_pdf], # Register the Activities on your Worker
            activity_executor=activity_executor # Thread pool that allows Activities to run concurrently
        )

        print(f"Starting the worker....")
        await worker.run()
```

This Worker configuration tells Temporal how your application should execute:

- **`task_queue="research"`** - Specifies which Task Queue the Worker monitors for incoming work. When you start a Workflow using this same Task Queue name, this Worker will pick it up and execute it.
- **`workflows=[GenerateReportWorkflow]`** - Registers your Workflow definition with the Worker, enabling it to execute instances of this Workflow when tasks appear in the queue.
- **`activities=[llm_call, create_pdf]`** - Registers your Activity functions with the Worker, allowing it to execute these Activities when your Workflow calls them.

**Step 3: Add the Entry Point**

```python
if __name__ == "__main__":
    asyncio.run(run_worker())
```

This starts the Worker when you run the file.

<details>
<summary>
Your complete <code>worker.py</code> should look like this:
</summary>

```python
import asyncio
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
            task_queue="durable", # Task queue that your Worker is listening to.
            workflows=[GenerateReportWorkflow], # Register the Workflow on your Worker
            activities=[llm_call, create_pdf], # Register the Activities on your Worker
            activity_executor=activity_executor # Thread pool that allows Activities to run concurrently
        )

        print(f"Starting the worker....")
        await worker.run()


if __name__ == "__main__":
    asyncio.run(run_worker())
```
</details>

### Start Your Application

You've now built the core components of your durable application:
- **Activities** - Your external interactions (LLM call and PDF generation)
- **Workflow** - Your business logic that orchestrates the Activities
- **Worker** - The execution engine that runs your Workflows and Activities

Now it's time to actually start your Research Workflow. To do this, you'll use a [Temporal Client](https://docs.temporal.io/develop/python/temporal-client).

A Temporal Client provides a set of APIs to communicate with a Temporal Service. You can use a Temporal Client in your application to perform various operations such as:

- **Start a Workflow Execution** (like generating a research report)
- **Query the state** of a running Workflow (like checking if the PDF is complete)
- **Send signals** to running Workflows (like updating the research prompt mid-execution)
- **Get results** from completed Workflows (like retrieving the final PDF filename)

Before creating the client, clean up your `activities.py` file. **Remove the script execution code** at the bottom of the file - we'll be starting Workflows through the client instead. This includes:

```python
# Make the API call
print("Welcome to the Research Report Generator!")
prompt = input("Enter your research topic or question: ")
llm_input = LLMCallInput(prompt=prompt)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
print(content)

pdf_filename = create_pdf(PDFGenerationInput(content=content, filename="research_report.pdf"))
```

:::note
**Why remove the execution code?**

The **Activities** file should only contain:
- Activity function definitions
- Business logic for external interactions

Workflow execution logic belongs in separate starter/client files.
:::

Your `activities.py` file should now only contain imports and Activity definitions.

<details>
<summary>
Your <code>activities.py</code> should look like the following:
</summary>

```python
import os
from dotenv import load_dotenv
from litellm import completion
from litellm.types.utils import ModelResponse
from models import LLMCallInput, PDFGenerationInput
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from temporalio import activity 

load_dotenv(override=True) # Reads your .env file and loads your environment variables

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

    paragraphs = input.content.split("\n\n")
    for para in paragraphs:
        if para.strip():
            p = Paragraph(para.strip(), styles["Normal"])
            story.append(p)
            story.append(Spacer(1, 12))

    doc.build(story)
    return input.filename
```
</details>

## Create your Client

Now, let's create a Client to start your `GenerateReportWorkflow`. Create a separate file called `starter.py` and build it step by step:

**Step 1: Set Up Imports and Load Environment Variables**:

```python
import asyncio
import uuid

from models import GenerateReportInput # dataclass for Workflow input
from temporalio.client import Client #  Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow # Your Workflow definition
```

**Step 2: Create the Main Function**

```python
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
```

This sets up the connection to your local Temporal server and gets the research topic from the user.

#### Step 3: Start the Workflow

```python
    # Start the Workflow execution
    handle = await client.start_workflow(
        GenerateReportWorkflow, # The Workflow method to execute
        research_input,
        id=f"generate-researdch-report-workflow-{uuid.uuid4()}",
        task_queue="research", # task queue your Worker is polling
    )

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")
```

The method returns a `handle` that lets you interact with the running Workflow. The `await handle.result()` call blocks until the Workflow completes and returns the final result.

#### Step 4: Add the Entry Point

```python
if __name__ == "__main__":
    asyncio.run(main())
```

This allows you to run the file.

<details>
<summary>
Your <code>starter.py</code> should look like the following:
</summary>

```ini
import asyncio
import uuid

from models import GenerateReportInput # dataclass for Workflow input
from temporalio.client import Client #  Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow # Your Workflow definition

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
        GenerateReportWorkflow, # The Workflow method to execute
        research_input,
        id=f"generate-researdch-report-workflow-{uuid.uuid4()}",
        task_queue="research", # task queue your Worker is polling
    )

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
```
</details>

### Run your Worker and Starter File

With both the Worker and client code ready, let's run your application. We need a few terminal windows running:

1. **Terminal 1 - Make sure your Temporal server is running:**
The first step to run anything in Temporal is to make sure you have a local Temporal Service running. Open a separate terminal window and start the service with `temporal server start-dev`.

As you will see in the command line output, your Temporal Server should now be running on `http://localhost:8233`. When you first access this server, you should see zero Workflows running.

2. **Terminal 2 - Start your Worker:**
   ```bash
   uv run worker.py
   ```
You should see output indicating the Worker has started and is listening on the "research" task queue. **Keep this terminal running** - the Worker needs to be active to execute your Workflows.

3. **Terminal 3** - Execute your Workflow:
   ```bash
   uv run starter.py
   ```

Enter a research topic when prompted, and watch as Temporal orchestrates your LLM call and PDF generation. You should see:
- The Workflow ID printed in your client terminal
- A PDF file created in your project directory

## Using the Temporal Web UI

Temporal provides a robust [Web UI](https://docs.temporal.io/web-ui) for managing Workflow Executions. You can:

- Gain insights like responses from Activities, execution time, and failures
- Debug and understand what's happening during your Workflow Executions

Access the Web UI at `http://localhost:8233` when running the Temporal development server, and you should see that your Workflow Execution has completed successfully.

<a href="https://i.postimg.cc/qR7VQhcv/web-ui-example.png" target="_blank"><img src="https://i.postimg.cc/qR7VQhcv/web-ui-example.png" alt="Temporal Web UI showing completed workflow" /></a>

See if you can you locate the following items on the Web UI:

- The name of the Task Queue
- The name of the two Activities called
- The inputs and outputs of the called Activities
- The inputs and outputs of the Workflow Execution

That's it! You're now done adding durability to your research application. Your workflow now has:

- **Automatic state persistence** - Every completed Activity (LLM call, PDF generation) is saved to Temporal's event history
- **Crash recovery** - If your application crashes at any point, it resumes from the last completed Activity instead of starting over
- **No duplicate LLM calls** - You'll never pay twice for the same API call, even after failures or restarts
- **Built-in retry logic** - Transient failures (network timeouts, API rate limits) are automatically retried with exponential backoff
- **Complete observability** - Every execution is tracked in the Web UI with full input/output history for debugging

Your simple research application has been transformed into a production-ready, fault-tolerant application—without adding complex error handling code or state management logic. Temporal handles all of that for you.

You're now done with the tutorial. Feel free to move on to the [next tutorial in this series](../human-in-the-loop) or continue on to see Temporal's durability in action and experience how it recovers from failures.

## Optional: Experiencing Failure and Recovery

Let's practice experiencing failure and recovery firsthand. We'll add a new feature to our workflow: sending an e-mail before creating the PDF.

This will demonstrate:
* How Activities automatically retry on failure
* How Temporal preserves state across Worker restarts
* How you can fix bugs without losing progress

### Step 1: Create a New Activity with an Intentional Error

We'll create a `send_email` Activity that contains an intentional error to simulate a real-world failure. In our case, this is just an error we are intentionally throwing, but this could just as easily be an internal service that isn't responding, a network outage, an application crashing, or more. Add this code to `activities.py`:

```python
from temporalio.exceptions import ApplicationError

@activity.defn
def send_email() -> str:
    """Simulates sending e-mail"""

    # This simulates a temporary failure - maybe a database is down,
    # or an API is temporarily unavailable
    raise ApplicationError(
        "Simulated failure: Email service temporarily unavailable"
    )

    # This code would run if we remove the error above
    return "Email sent"
```

### Step 2: Update the Workflow to Call the `send_email` Activity

Now modify the Workflow to call the `send_email` Activity after generating the PDF. Try this on your own!

<details>
<summary>
Your <code>workflow.py</code> should look like the following:
</summary>

```ini
from datetime import timedelta
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

        return f"Successfully created research report PDF: {pdf_filename}"
```
</details>

### Step 3: Register the New Activity with the Worker

Update the Worker to register the new `send_email` Activity:

```python
import concurrent.futures

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
            activities=[llm_call, create_pdf_activity, send_email],
            activity_executor=activity_executor
        )

        print(f"Starting the worker with summary Activity registered....")
        await worker.run()
```

### Step 4: Start the Worker and Execute the Workflow

Restart your Worker to register the changes with `uv run worker.py` and start your Workflow with 
`uv run starter.py`. Re-enter your new prompt.

### Step 5: Observe Automatic Retries in the Web UI

Go to your Temporal Web UI at `http://localhost:8233`.

You should see:
1. Your Workflow is **Running** (not Failed)
2. The `llm_call` Activity completed successfully 
3. The `send_email` Activity shows a **Pending Activity** with retry attempts

<a href="https://i.postimg.cc/cLw9VF52/retrying-activity.png" target="_blank"><img src="https://i.postimg.cc/cLw9VF52/retrying-activity.png" alt="Web UI showing activity retrying after failure" /></a>

**Click on the Pending Activity to see:**
- The error message
- The current retry attempt number
- The countdown until the next retry

:::info
Notice that the expensive `llm_call` Activity isn't being re-executed. Temporal saved its result and won't waste money calling the LLM again. Only the failing Activity retries.
:::

In practice, your code will continue retrying until whatever issue the Activity has encountered has resolved itself, whether that is the network coming back online or an internal service starting to respond again. By leveraging the durability of Temporal and out of the box retry capabilities, you have avoided writing retry and timeout logic yourself and saved your downstream services from being unnecessarily overwhelmed.

### Step 6: Fix the Error

Now let's "fix" our simulated failure by removing the error. In a real scenario, this could be:
- A database coming back online
- An API endpoint being fixed
- A network issue being resolved

Update your `send_email` Activity by removing the error and saving the file:

```python
from temporalio import activity
from litellm import completion

@activity.defn
def send_email() -> str:
    """Simulates sending e-mail"""

    return "Email sent"
```

### Step 7: Restart the Worker with Fixed Code

Restart your Worker (`uv run worker.py`) so it picks up the fixed Activity code. The Worker will pick up where it left off.

### Step 8: Observe Successful Completion

Your Web UI will now show:

1. The `send_email` Activity now completes successfully
2. The entire Workflow shows **Completed** status

<a href="https://i.postimg.cc/cJv44bjh/successful-completion.png" target="_blank"><img src="https://i.postimg.cc/cJv44bjh/successful-completion.png" alt="Web UI showing workflow completed successfully" /></a>

**What just happened?**
- Your Workflow **preserved all state** through the failure
- The expensive `llm_call` was **never re-executed** (saving you money)
- When you fixed the bug, Temporal **automatically continued** from where it left off
- No manual intervention needed - just fix the code and restart the Worker

This is the power of Temporal and durable execution - your critical business processes are guaranteed to complete with no manual recovery, no lost data, and no duplicate operations.

## What's Next?

Imagine your research application pausing after generating content, sending you the draft for review, waiting for your edits or approval, and then continuing automatically to create the final PDF—all while maintaining durable execution guarantees. That's the power of adding human-in-the-loop capabilities with fault-tolerant AI workflows.

In the [next tutorial](../human-in-the-loop) in this mini-series, we'll show you how to **add human-in-the-loop capabilities** to your AI workflows.
