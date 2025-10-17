---
id: foundations-durable-ai
sidebar_position: 1
keywords: [ai, durable, temporal, llm, genai, agents, workflow]
tags: [AI, Series]
last_update:
  date: 2025-10-15
  author: Temporal Team
title: "Part 1: Foundations of Durable AI with a Research Application"
description: "Learn the fundamentals of building durable GenAI applications with Temporal by creating a research-to-PDF application"
image: /img/temporal-logo-twitter-card.png
---

# Part 1: Foundations of Durable AI with a Research Application

This tutorial introduces you to the importance of durability in GenAI applications. In the next tutorial, you'll learn how to use Temporal to add durability to your applications and handle failures gracefully.

By now, you've probably experienced generative AI firsthand. You've probably used ChatGPT and seen what LLMs can do. They excel at tasks like research, but their real power emerges when we connect them with users and other actions to build more advanced applications that go beyond simple chat interfaces.

In this series, we'll build toward creating AI agents, but let's start with a simple chain:

Use an LLM to generate research ➝ then produce a PDF from that research.

### What are GenAI Applications?

At their core, GenAI applications use an LLM as one component among many. The LLM isn't the application itself. Take ChatGPT as an example - it's an application that wraps an LLM, not an LLM itself. Even this seemingly simple chat interface does much more than just call an LLM:

- Displays responses to the user
- Captures user input
- Maintains conversation history
- Orchestrates each subsequent LLM call

Applications can look like many different formats. We will start with something like a chain workflow where a series of LLM calls, actions, and user interactions are strung together:

![Chain Workflow](https://images.ctfassets.net/0uuz8ydxyd9p/70SBemKQHnqfLxoHgPovQX/33f3a0b6cfc96eae2d17d1a463079560/Screenshot_2025-07-08_at_10.26.26%C3%A2__AM.png)

Applications can also be agentic, where the path through the business logic isn't predetermined. AI agents are GenAI applications where the LLM has agency over the functionality and flow of the application.

<img src="https://i.postimg.cc/zv5W9VkH/Screenshot-2025-10-07-at-7-48-20-PM.png" alt="Agentic Flow" width="40%" />

We'll first look at applications that look like a chain workflow.

### Prerequisites

1. You need an [Open AI API key](https://platform.openai.com/api-keys) for this tutorial.
2. Install [`uv`](https://docs.astral.sh/uv/getting-started/installation/#pypi), a Python package manager, on your machine.

### Setting Up Your Environment

In this tutorial, you'll create a Research application that makes a call to the OpenAI API, conducts research on a topic of your choice, and generates a PDF report from that research. Let's start by setting up your environment.

First, create your project:

1. Create your project: `uv init temporal-agentic-loop-tutorial`
2. Open your `temporal-agentic-loop-tutorial` project.
3. Install the packages you will need for this tutorial: `uv add python-dotenv litellm`.

### Create an `.env` File

Next you'll create a `.env` file to store your API keys. Create a new file named `.env` in your project directory and add the following:

```
LLM_API_KEY=YOUR_API_KEY
LLM_MODEL=openai/gpt-4o
```

By default this tutorial uses OpenAI's GPT-4o. If you want to use a different LLM provider, look up the appropriate model name [in the LiteLLM documentation](https://docs.litellm.ai/docs/providers) and change the `LLM_MODEL` field and provide your API key.

Replace `YOUR_API_KEY` with your actual API key. Make sure you add `.env` in your `.gitignore` so that you don't accidentally commit your API Key.

## Packaging Inputs and Outputs

Before we create our application, we need to define the data structures that will be passed in.

Create a file called `models.py` and add the following contents:

```python
from dataclasses import dataclass

@dataclass
class LLMCallInput:
    prompt: str
    llm_api_key: str
    llm_model: str

@dataclass
class PDFGenerationInput:
    content: str
    filename: str = "research_pdf.pdf"

@dataclass
class GenerateReportInput:
    prompt: str
    llm_api_key: str
    llm_research_model: str = "openai/gpt-4o"
    llm_image_model: str = "dall-e-3"
```

### Prompting the LLM

Now let's set up the code to make LLM calls. Our application will use LLM calls to process information and generate research content.

We use `litellm` here, which is a unified interface for over 100+ LLM providers. This means that the same code works with different models - you only need to change the model string.

Create an `app.py` and add the following code. The code does two main things:
1. Loads environment variables and configures LLM settings
2. The `llm_call` function calls [`completion()`](https://docs.litellm.ai/docs/completion/usage#quick-start) which:
    - Sends your prompt to the specified LLM model 
    - Includes the API key for authentication
    - Formats the prompt as a message with role "user" (as LLMs expect a conversation format)

```python
import os
from dotenv import load_dotenv
from litellm import completion
from litellm.types.utils import ModelResponse
from models import LLMCallInput

load_dotenv(override=True) # Reads your .env file and loads your environment variables

# Get LLM_API_KEY environment variable
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o")
LLM_API_KEY = os.getenv("LLM_API_KEY", None)

def llm_call(input: LLMCallInput) -> ModelResponse:
    return completion(
        model=input.llm_model,
        api_key=input.llm_api_key,
        messages=[{"content": input.prompt, "role": "user"}],
    )
```

Let's test this with a simple prompt. Add the following code to `app.py`:

```python
prompt = "Give me 5 facts about elephants."
llm_input = LLMCallInput(prompt=prompt, llm_api_key=LLM_API_KEY, llm_model=LLM_MODEL)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
print(content)
```

Now run this file with `uv run app.py`. 
You should see your output from your LLM in your terminal window!

### Making It Interactive

Great! You've successfully made your first LLM call with a hardcoded prompt. Now, let's transform this into an interactive research assistant that will perform research on any topic of your choosing.

Remove your hardcoded prompt:

```python
prompt = "Give me 5 facts about elephants."
llm_input = LLMCallInput(prompt=prompt, llm_api_key=LLM_API_KEY, llm_model=LLM_MODEL)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
print(content)
```

And replace it with your interactive research assistant code:

```python
# Make the API call
print("Welcome to the Research Report Generator!")
prompt = input("Enter your research topic or question: ")
llm_input = LLMCallInput(prompt=prompt, llm_api_key=LLM_API_KEY, llm_model=LLM_MODEL)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
print(content)
```

<details>

<summary>
Your <code>app.py</code> should look like the following:
</summary>

```ini
import os
from dotenv import load_dotenv
from litellm import completion
from litellm.types.utils import ModelResponse
from models import LLMCallInput

load_dotenv(override=True) # Reads your .env file and loads your environment variables

# Get LLM_API_KEY environment variable
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o")
LLM_API_KEY = os.getenv("LLM_API_KEY", None)

def llm_call(input: LLMCallInput) -> ModelResponse:
    return completion(
        model=input.llm_model,
        api_key=input.llm_api_key,
        messages=[{"content": input.prompt, "role": "user"}],
    )

# Make the API call
print("Welcome to the Research Report Generator!")
prompt = input("Enter your research topic or question: ")
llm_input = LLMCallInput(prompt=prompt, llm_api_key=LLM_API_KEY, llm_model=LLM_MODEL)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
print(content)
```
</details>

Now try it out! Run this file with `uv run app.py`, enter your prompt in the command-line, then see your response.

### From Prompts to Actions

So far, we've only returned the response from the LLM to the user. But our LLM can only generate text responses - it thinks and responds, but it can't *do* anything in the real world.

What if we want our LLM to:
- Search the web for the latest information?
- Save the research report to a file?
- Send the results via email?
- Query a database or call an API?

This is where **actions** come in.

### What is an Action?

An action is an external function that performs specific tasks beyond just generating text.

Examples:
- Information retrieval (web search, database query, file reading)
- Communication tools (sending emails, post to Slack, sending text messages or notifications)
- Data analysis tools (run calculations, generate charts and graphs)
- Creative tools (image generation, document creation)

### Building Your First Action

Let's enhance our research application by adding an action that saves the results to a PDF.

First, install the package `reportlab`. Run `uv add reportlab`.

Let's create our PDF generation action. This function takes text content and formats it into a professional-looking PDF document. Take this code and add it into `app.py` so that your `create_pdf` function comes after the `llm_call` function but before you make the API call:

```python
from models import LLMCallInput, PDFGenerationInput
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

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

Now test the PDF generation. At the end of the file add:

```python
pdf_filename = create_pdf(PDFGenerationInput(content=content, filename="research_report.pdf"))
```

<details>
<summary>
Your <code>app.py</code> should look like the following:
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

load_dotenv(override=True) # Reads your .env file and loads your environment variables

# Get LLM_API_KEY environment variable
LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-4o")
LLM_API_KEY = os.getenv("LLM_API_KEY", None)

def llm_call(input: LLMCallInput) -> ModelResponse:
    return completion(
        model=input.llm_model,
        api_key=input.llm_api_key,
        messages=[{"content": input.prompt, "role": "user"}],
    )

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
llm_input = LLMCallInput(prompt=prompt, llm_api_key=LLM_API_KEY, llm_model=LLM_MODEL)
result = llm_call(llm_input)

# Extract the text content
content = result.choices[0].message.content
pdf_filename = create_pdf(PDFGenerationInput(content=content, filename="research_report.pdf"))
```
</details>

Run `uv run app.py` again. You should see not only the output appear but also you should see a `research_report.pdf` appear in your file explorer. Open it to verify that your output has been generated into a PDF.

See how neat this is? Instead of just printing text to the console, your application now creates a tangible deliverable. You ask a question, get a response, and walk away with a professional PDF report.

### The Foundations of a Chain Workflow

You now have the foundations of a chain workflow application. We chained an LLM call (`llm_call`) and action together (`create_pdf`) in a defined order (user input ➝ LLM call ➝ PDF generation).

However, now that you've built a working chain workflow, let's examine the challenges that arise when deploying these applications in the real world.

### Challenges of GenAI Applications

Although our research-to-PDF application works smoothly in this tutorial, production environments present significant obstacles.

When you combine LLMs with other actions, calling external APIs, querying databases, processing files, you're coordinating multiple services across network boundaries.

Challenges that can happen:

- Networks can be flaky
- LLMs are often rate limited
- Tool resources (APIs and databases) go down
- LLMs are inherently non-deterministic
- How do we scale these applications?
- What happens when they take a long time to finish?

### Try it Out!

Let's see this problem in action. Run `uv run app.py` and enter a research topic when prompted. While the LLM is generating the response, press `CTRL-C` to interrupt the process.

Now run `uv run app.py` again. What happens? **You're back at the beginning**—all progress lost.

This might seem like a minor inconvenience with our simple two-step application, but imagine a real-world production scenario:

1. Research Agent runs (costs $2.50 in API calls, takes 30 seconds)
2. Summary Agent runs (costs $0.75, takes 15 seconds)
3. Image Generator creates visuals (costs $0.40, takes 45 seconds)
4. PDF Generator compiles everything
5. Email service sends to client
6. **Network outage occurs**

Without durability, you're forced to restart from step 1—re-running the research, re-generating the summary, re-creating images. You're paying for the same API calls twice (or three times, or more). Your users are frustrated by the delays. Your costs increase.

**This is the core problem: GenAI applications are distributed systems, and distributed systems need resilience.** In the next tutorial, we'll show you how to make these applications durable using Temporal.

### Distributed System Issues

When workflows get even more sophisticated, they evolve into **agentic systems** - where the LLM makes decisions about which actions to take next, potentially calling other specialized agents that themselves have complex workflows.

Increasingly, we are seeing agents calling agents, which are calling other agents.

For example, your research application might:
- Call a "Web Scraper" agent to gather sources (scrapes 5 research websites)
- Call a "Fact Checker" agent to verify claims (validates statistics against government data)
- Call a "PDF Generator" agent (what you built!)

Each agent has its own event loop **(Plan ➝ Execute ➝ Observe)**:

For example: Research Agent ➝ Executes web search ➝ Observes results ➝ Decides if it needs more data ➝ Executes another search or moves to analysis ➝ Observes ➝ Decides next step ➝ etc.

<img src="https://i.postimg.cc/sXRCCrG1/agents-calling-agents.png" alt="Agentic Flow" width="40%" />

### This Means Your "Simple" Research Request Triggers a Complex Orchestration

<img src="https://i.postimg.cc/SKdfkLJW/agent-orchestration.png" alt="Agent Orchestratio" width="50%" />

### Now Overlay What Can Go Wrong

Network partitions, timeouts, and service failures at any step can break the chain anywhere!

<img src="https://i.postimg.cc/9MftM49H/agent-orchestration-problems.png" alt="Agent Orchestration Problems" width="50%" />

The bottom line: **What looks like one AI task is actually a distributed system challenge!**

### Agents Are Distributed Systems!

**This is why durability matters.** Without it, complex workflows become fragile and expensive. With it, failures become manageable interruptions instead of catastrophic losses.

## What Does Durability Mean?

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

Each step can fail. Each step might need different agents. This is a **workflow** - and workflows need orchestration.

### What's Next?

This tutorial introduced you to the importance of durability in GenAI applications. In the next tutorial, you'll learn how to use Temporal to add durability to your applications and handle failures gracefully.