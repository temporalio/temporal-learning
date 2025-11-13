---
id: human-in-the-loop
sidebar_position: 2
keywords: [ai, durable, temporal, signals, queries, human-in-the-loop, hitl]
tags: [AI, durable, temporal, LLM, genai, signals, queries]
last_update:
  date: 2025-11-6
  author: Angela Zhou
title: "Part 2: Adding Durable Human-in-the-Loop to Our Research Application"
description: Learn how to build interactive AI applications that allow humans to provide feedback and make decisions using Temporal Signals and Queries
image: /img/temporal-logo-twitter-card.png
---

# Part 2: Adding Durable Human-in-the-Loop to Our Research Application

Your durable research application now survives crashes and automatically retries failures. But there's a critical gap: **it runs completely autonomously**.

_Imagine this scenario_: Your AI generates research, creates a PDF, and sends it to your client automatically. Then your client calls requesting changes - but your application had no way to pause for approval or feedback.

**Real-world AI applications need human interaction** for feedback, approvals, and clarifications. But adding human input creates challenges: What if the user's browser crashes while reviewing? What if they close the tab and return later? How do you preserve expensive LLM work while waiting for approval?

In this tutorial, you'll solve these problems by adding durable human-in-the-loop capabilities to your application. You'll implement features that let you:

- Approve research results by sending a `keep` signal to continue the workflow
- Request revisions by editing the prompt to regenerate output
- Query the workflow at any time to check the current LLM output

Temporal's durability ensures you maintain control over AI-generated content while reliably handling the human
approval process.


## Prerequisites

This tutorial is part 2 of a Foundartions of Durable AI with Temporal tutorial. Before starting, ensure you have:

* Completed Part 1 of this tutorial: [Adding Durability with Temporal](../durable-ai-with-temporal)
* An [Open AI API key](https://platform.openai.com/api-keys)

## Challenges in Non-Durable Human in the Loop Processes

While human interaction points are valuable for AI applications, implementing them reliably presents significant technical challenges. Without durable execution, human input can be lost during system failures, leading to unpredictable behavior.

**Consider the following scenario:**

- A user needs to approve a transaction
- As they are doing this, the website goes down
- How do you mitigate this?
  - Do we notify the user to approve the payment again? (creating confusion since the user already 'approved')
  - Do we assume approval and risk processing an unauthorized payment?

Without durable processes, you're forced to choose between security, user experience, and reliability.

**It's Distributed System Challenges All Over Again.**

## Durable Execution for Human Interaction

With Temporal's durable execution, the workflow instance **persists throughout the entire human interaction**:

**What this means in practice:**
- **User's approval is durably stored** - When a user clicks "approve", that decision is saved in the workflow history
- **No re-approval needed** - If the website crashes after approval, the workflow resumes with the approval already recorded
- **Automatic recovery** - System failures don't lose progress; the workflow picks up exactly where it left off
- **User can walk away** - Close the browser, shut down the laptop, and the workflow continues running on the server

:::info
Instead of managing complex coordination between services, queues, and databases to handle human input, you write straightforward code that waits for human decisions. Temporal handles all the reliability, state management, and recovery automatically.
:::

## Understanding Temporal Signals

In Temporal, human interaction is achieved through a [Temporal Signal](https://docs.temporal.io/develop/python/message-passing#signals).

A Signal is a:
* Message sent asynchronously to a running Workflow Execution
* Used to change the state and control the flow of a Workflow Execution

### Example Signal Usage

1. The user initiates a workflow with an initial request
2. The workflow processes the request and determines what information or approval is needed
3. The workflow pauses and waits for user input via Signal, such as:
   - Additional information or clarification
   - Permission to proceed with an action
   - Selection between multiple options
4. The user sends a Signal with their response
5. The workflow resumes execution based on the Signal received
6. Steps repeat as needed until the workflow completes its task

### Durably Storing Human Interactions

Let's go back to the user approving a payment example. With Temporal, when the user clicks "approve" in the finance portal, the approval decision gets durably stored.

The user can close the browser, go to lunch, and the Workflow will continue running in the background.

If the payment gateway times out, returns an error or becomes unavailable, Temporal automatically retries the payment step. It does not need to re-ask the user for approval, because that decision is already durably stored in the Workflow state.

- **No duplicate work** (user does not have to re-approve the same expense)
- **No manual intervention** (does not need to manually reconcile failed payments or investigate whether an expense was actually approved)
- **Reliable processing** (business can count on approved expenses being paid)

## Implementing Signals: Architecture Overview

Before we dive into the implementation, let's look at how we'll implement Signals work in a Temporal application from a high-level:

![Signal Architecture](https://i.postimg.cc/fbzbF82b/signal-loop.png)

This diagram shows the complete signal flow:
1. **UI/Client Side**: A Temporal Client invokes a signal handler when the user takes an action (e.g., someone might click "buy item" on the UI and that sends a Signal that a payment has been made)
2. **Signal Handler**: Decorated with `@workflow.signal`, it receives the Signal and updates the workflow's state variables (e.g., the workflow's state variable can change from "waiting for payment" to "paid")
3. **Workflow Main Loop**: Continuously checks state variables and waits for changes, then reacts accordingly (e.g., if the state has changed to "paid", the application can now ship the item)

This architecture enables durable human-in-the-loop interactions where user input is preserved through crashes and the workflow can resume exactly where it left off.

## Building the Feedback Loop

Let's update our research application to give users the ability to review and refine AI-generated research before creating the final PDF.

We'll implement a **feedback loop** where:

1. **LLM generates research** based on the current prompt
2. **Workflow pauses** and waits for the user's decision (Signal)
3. **User reviews** the research and signals their choice:
   - **"Keep"** ➝ Exit the loop and create the PDF
   - **Edit"** ➝ Add instructions, update the prompt, and loop back to step 1

![Signal Goal](https://i.postimg.cc/BZPYWhHZ/signal-goal.png)

### Understanding the Loop Structure

Here's the pseudocode showing the logic we'll implement:

```python
# Continue looping until the user approves the research
while user_has_not_approved:

    # Step 1: Execute the LLM call to generate research based on the current prompt
    research_result = call_llm(current_prompt)

    # Step 2: Wait for user Signal (KEEP or EDIT)
    wait_for_signal()

    # Step 3: React to the Signal
    if user_decision == "KEEP":
        # User approved - exit the loop and proceed to PDF generation
        create_pdf(research_result)
        break  # Exit the loop

    elif user_decision == "EDIT":
        # User wants to modify - update the prompt and loop again
        current_prompt = current_prompt + user_additional_instructions
        # Loop continues with the updated prompt

    # Step 4: Reset the Signal state back to WAIT for the next iteration
    user_decision = "WAIT"
```

Let's go ahead and now implement this.

## Step 1: Define the Signal Data Model

First, create a model for the Signal data to be stored in. Similar to Activities and Workflows, `dataclasses` are recommended. Add this into your `models.py` file.

```python
from dataclasses import dataclass
from enum import StrEnum

class UserDecision(StrEnum):
    KEEP = "KEEP"
    EDIT = "EDIT"
    WAIT = "WAIT"

@dataclass
class UserDecisionSignal:
    """A data structure to send user decisions via Temporal Signals"""
    decision: UserDecision
    additional_prompt: str = ""
```

This defines:
- **UserDecision**: An enum with three states (KEEP, EDIT, WAIT). We will send a `UserDecision` as a Signal to our Research Workflow letting the Workflow know if we want to keep or edit the research or if we want to wait for further decision
- **UserDecisionSignal**: A dataclass that includes the decision and optional additional instructions

<details>
<summary>
Your <code>models.py</code> should look like the following:
</summary>

```ini
from dataclasses import dataclass
from enum import StrEnum

class UserDecision(StrEnum):
    KEEP = "KEEP"
    EDIT = "EDIT"
    WAIT = "WAIT"

@dataclass
class UserDecisionSignal:
    """A data structure to send user decisions via Temporal Signals"""
    decision: UserDecision
    additional_prompt: str = ""

@dataclass
class LLMCallInput:
    prompt: str

@dataclass
class PDFGenerationInput:
    content: str
    filename: str = "research_pdf.pdf"

@dataclass
class GenerateReportInput:
    prompt: str
```
</details>

## Step 2: Store Signal State in the Workflow

The workflow needs a place to remember what Signals it has received. We will use instance variables to persist Signal data across Workflow Execution. Add the following to your `workflow.py` file (and don't forget to add `UserDecision` and `UserDecisionSignal` into your `workflow.unsafe.imports_passed_through`!)

```python
from temporalio import workflow

@workflow.defn
class GenerateReportWorkflow:
    def __init__(self) -> None:
        self._current_prompt: str = ""
        # Instance variable to store Signal data
        self._user_decision: UserDecisionSignal = UserDecisionSignal(
            decision=UserDecision.WAIT
        )

    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        self._current_prompt = input.prompt
        # Workflow logic continues...
```

The instance variable `_user_decision` is initialized with `WAIT` as the default state, indicating "no Signal received yet."

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
        UserDecision,
        UserDecisionSignal
    )

@workflow.defn
class GenerateReportWorkflow:
    def __init__(self) -> None:
        self._current_prompt: str = ""
        # Instance variable to store Signal data
        self._user_decision: UserDecisionSignal = UserDecisionSignal(
            decision=UserDecision.WAIT
        )

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

        return f"Successfully created research report PDF: {pdf_filename}"
```
</details>

## Step 3: Define a Signal Handler

A Signal is defined in your code and handled in your Workflow Definition. To define a Signal, use the `@workflow.signal` decorator.

```python
from temporalio import workflow

@workflow.defn
class GenerateReportWorkflow:
    def __init__(self) -> None:
        self._current_prompt: str = ""
        self._user_decision: UserDecisionSignal = UserDecisionSignal(
            decision=UserDecision.WAIT
        )

    @workflow.signal
    async def user_decision_signal(self, decision_data: UserDecisionSignal) -> None:
        """Signal handler that receives user decisions"""
        self._user_decision = decision_data

    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        # Workflow logic...
```

The `@workflow.signal` decorator turns the `user_decision_signal` method into a Signal handler. Now, when a client sends a Signal to this Workflow (which we'll implement later), this method gets called automatically and receives the data that was sent.

In our case, the method receives a `UserDecisionSignal` object containing the user's decision (KEEP or EDIT) and any additional instructions. The handler's job is simple: take that data and store it in the Workflow's `self._user_decision` instance variable. That's it. 

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
        UserDecision,
        UserDecisionSignal
    )

@workflow.defn
class GenerateReportWorkflow:
    def __init__(self) -> None:
        self._current_prompt: str = ""
        # Instance variable to store Signal data
        self._user_decision: UserDecisionSignal = UserDecisionSignal(
            decision=UserDecision.WAIT
        )

    @workflow.signal
    async def user_decision_signal(self, decision_data: UserDecisionSignal) -> None:
        """Signal handler that receives user decisions"""
        self._user_decision = decision_data

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

        return f"Successfully created research report PDF: {pdf_filename}"
```
</details>

## Step 4: Implement the Feedback Loop

As mentioned early in our psuedocode, we now need to create our loop that reacts to the Signal in Workflow logic.

- If the Workflow receives `KEEP` as the `UserDecision`, then the Workflow exits the research loop and proceeds to PDF generation.
- If the Workflow receives `EDIT` as the `UserDecision`, then the Workflow incorporates any additional feedback into the prompt, updates the research parameters, and resets the Signal state back to `WAIT` so it can loop again to regenerate the research and wait for the next user decision.

Add this loop logic to `workflow.py` after setting the variable definition for `llm_call_input`:

```python
# Continue looping until the user approves the research
continue_user_input_loop = True

# Execute the LLM call to generate research based on the current prompt
while continue_user_input_loop:
    research_facts = await workflow.execute_activity(
        llm_call,
        llm_call_input,
        start_to_close_timeout=timedelta(seconds=30),
    )

    # User approved the research - exit the loop and proceed to PDF generation
    if self._user_decision.decision == UserDecision.KEEP:
        workflow.logger.info("User approved the research. Creating PDF...")
        continue_user_input_loop = False
    # User wants to edit the research - update the prompt and loop again
    elif self._user_decision.decision == UserDecision.EDIT:
        workflow.logger.info("User requested research modification.")
        if self._user_decision.additional_prompt != "":
            # Append the user's additional instructions to the existing prompt
            self._current_prompt = (
                f"{self._current_prompt}\n\nAdditional instructions: {self._user_decision.additional_prompt}"
            )
        else:
            workflow.logger.info("No additional instructions provided. Regenerating with original prompt.")
        # Update the Activity input with the modified prompt for the next iteration
        llm_call_input.prompt = self._current_prompt
        self._user_decision = UserDecisionSignal(decision=UserDecision.WAIT)
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
        UserDecision,
        UserDecisionSignal
    )

@workflow.defn
class GenerateReportWorkflow:
    def __init__(self) -> None:
        self._current_prompt: str = ""
        # Instance variable to store Signal data
        self._user_decision: UserDecisionSignal = UserDecisionSignal(
            decision=UserDecision.WAIT
        )

    @workflow.signal
    async def user_decision_signal(self, decision_data: UserDecisionSignal) -> None:
        """Signal handler that receives user decisions"""
        self._user_decision = decision_data

    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        llm_call_input = LLMCallInput(prompt=input.prompt)

        # Continue looping until the user approves the research
        continue_user_input_loop = True

        # Execute the LLM call to generate research based on the current prompt
        while continue_user_input_loop:
            research_facts = await workflow.execute_activity(
                llm_call,
                llm_call_input,
                start_to_close_timeout=timedelta(seconds=30),
            )

            # User approved the research - exit the loop and proceed to PDF generation
            if self._user_decision.decision == UserDecision.KEEP:
                workflow.logger.info("User approved the research. Creating PDF...")
                continue_user_input_loop = False
            # User wants to edit the research - update the prompt and loop again
            elif self._user_decision.decision == UserDecision.EDIT:
                workflow.logger.info("User requested research modification.")
                if self._user_decision.additional_prompt != "":
                    # Append the user's additional instructions to the existing prompt
                    self._current_prompt = (
                        f"{self._current_prompt}\n\nAdditional instructions: {self._user_decision.additional_prompt}"
                    )
                else:
                    workflow.logger.info("No additional instructions provided. Regenerating with original prompt.")
                # Update the Activity input with the modified prompt for the next iteration
                llm_call_input.prompt = self._current_prompt
                self._user_decision = UserDecisionSignal(decision=UserDecision.WAIT)

        pdf_generation_input = PDFGenerationInput(content=research_facts["choices"][0]["message"]["content"])

        pdf_filename: str = await workflow.execute_activity(
            create_pdf,
            pdf_generation_input,
            start_to_close_timeout=timedelta(seconds=20),
        )

        return f"Successfully created research report PDF: {pdf_filename}"
```
</details>

## Waiting for a Signal

We've now stored our initial Signal state and defined what happens when it comes in. Next, we need a way for the Workflow to pause and wait for that Signal to arrive. This is where `workflow.wait_condition()` comes in.

- Use `workflow.wait_condition()` to pause until Signal is received (user decides the next step)
- Creates a blocking checkpoint where the Workflow stops and waits
- Resumes execution only when specified condition becomes true
- Optionally accepts a timeout parameter: `workflow.wait_condition(lambda: condition, timeout=timedelta(hours=24))` - waits until Signal received OR timeout elapsed, whichever happens first

We'll add this before we enter the loop so that we don't enter it until a Signal has been received:

```python
await workflow.wait_condition(
    lambda: self._user_decision.decision != UserDecision.WAIT
)
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
        UserDecision,
        UserDecisionSignal
    )

@workflow.defn
class GenerateReportWorkflow:
    def __init__(self) -> None:
        self._current_prompt: str = ""
        # Instance variable to store Signal data
        self._user_decision: UserDecisionSignal = UserDecisionSignal(
            decision=UserDecision.WAIT
        )

    @workflow.signal
    async def user_decision_signal(self, decision_data: UserDecisionSignal) -> None:
        """Signal handler that receives user decisions"""
        self._user_decision = decision_data

    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        llm_call_input = LLMCallInput(prompt=input.prompt)

        # Continue looping until the user approves the research
        continue_user_input_loop = True

        # Execute the LLM call to generate research based on the current prompt
        while continue_user_input_loop:
            research_facts = await workflow.execute_activity(
                llm_call,
                llm_call_input,
                start_to_close_timeout=timedelta(seconds=30),
            )
            # Waiting for Signal with user decision
            await workflow.wait_condition(lambda: self._user_decision.decision != UserDecision.WAIT)

            # User approved the research - exit the loop and proceed to PDF generation
            if self._user_decision.decision == UserDecision.KEEP:
                workflow.logger.info("User approved the research. Creating PDF...")
                continue_user_input_loop = False
            # User wants to edit the research - update the prompt and loop again
            elif self._user_decision.decision == UserDecision.EDIT:
                workflow.logger.info("User requested research modification.")
                if self._user_decision.additional_prompt != "":
                    # Append the user's additional instructions to the existing prompt
                    self._current_prompt = (
                        f"{self._current_prompt}\n\nAdditional instructions: {self._user_decision.additional_prompt}"
                    )
                else:
                    workflow.logger.info("No additional instructions provided. Regenerating with original prompt.")
                # Update the Activity input with the modified prompt for the next iteration
                llm_call_input.prompt = self._current_prompt
                self._user_decision = UserDecisionSignal(decision=UserDecision.WAIT)

        pdf_generation_input = PDFGenerationInput(content=research_facts["choices"][0]["message"]["content"])

        pdf_filename: str = await workflow.execute_activity(
            create_pdf,
            pdf_generation_input,
            start_to_close_timeout=timedelta(seconds=20),
        )

        return f"Successfully created research report PDF: {pdf_filename}"
```
</details>

## Sending Signals from the Client

Let's recap what we've built so far:
- **Defined our Signal** with `UserDecisionSignal` to structure the data we'll send
- **Created a Signal handler** that receives incoming Signals and updates the Workflow's state variables (in this case, storing the user's decision)              
- **Implemented the feedback loop** that checks the Signal data and decides whether to keep the research or edit it
- **Added `wait_condition()`** to pause the Workflow until a Signal arrives

We are now ready to send a Signal to our Research Workflow to let it know what to do. To send a Signal with the Temporal Client, we need to get a "handle" to a specific Workflow Execution, which will be used to interact with that Workflow.

We'll do this with the [`get_workflow_handle`](https://docs.temporal.io/develop/python/message-passing#send-messages) method.

```python
handle = client.get_workflow_handle(workflow_id)
```

With the handle on the Workflow Execution we want to Signal, we'll then pass in our Signal:

```python
signal_data = UserDecisionSignal(decision=UserDecision.KEEP)
await handle.signal("user_decision_signal", signal_data)
```

Now let's create a function that prompts the user for their decision and sends the appropriate Signal:
- If the user chooses **"edit"**, we send a Signal with `UserDecision.EDIT` and any additional instructions
- If the user chooses **"keep"**, we send a Signal with `UserDecision.KEEP` to approve the research and proceed to PDF creation

Don't forget to add `UserDecision` and `UserDecisionSignal` into our imports.

Add this function to `starter.py` before our starter code:

```python
async def send_user_decision_signal(client: Client, workflow_id: str):
    # Get handle to the Workflow Execution
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\n" + "=" * 80)
        print("Calling LLM! Check the Web UI for the research output.")
        print("Would you like to keep or edit it?")
        print("1. Type 'keep' to approve the output and create PDF")
        print("2. Type 'edit' to modify the output")
        print("=" * 80)

        decision = input("Your decision (keep/edit): ").strip().lower()

        if decision in {"keep", "1"}:
            signal_data = UserDecisionSignal(decision=UserDecision.KEEP)
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to keep output and create PDF")
            break

        elif decision in {"edit", "2"}:
            additional_prompt = input(
                "Enter additional instructions (optional): "
            ).strip()
            signal_data = UserDecisionSignal(
                decision=UserDecision.EDIT,
                additional_prompt=additional_prompt
            )
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to regenerate output")

        else:
            print("Please enter either 'keep' or 'edit'")
```

We'll now have to invoke this function within our starter code. In `starter.py`, after you start your Workflow, add this line:

```python
signal_task = asyncio.create_task(send_user_decision_signal(client, handle.id))
```

This starts the Signal-sending function in the background while your Workflow runs. Your Workflow will execute the LLM Activity, then pause at `wait_condition()` waiting for a Signal. Meanwhile, this function prompts you for input and sends the appropriate Signal (KEEP or EDIT) to the waiting Workflow based on your decision.

<details>
<summary>
Your <code>starter.py</code> should look like the following:
</summary>

```ini
import asyncio
import uuid

from models import GenerateReportInput, UserDecision, UserDecisionSignal
from temporalio.client import Client #  Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow # Your Workflow definition

async def send_user_decision_signal(client: Client, workflow_id: str):
    # Get handle to the Workflow Execution
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\n" + "=" * 80)
        print("Calling LLM! Check the Web UI for the research output.")
        print("Would you like to keep or edit it?")
        print("1. Type 'keep' to approve the output and create PDF")
        print("2. Type 'edit' to modify the output")
        print("=" * 80)

        decision = input("Your decision (keep/edit): ").strip().lower()

        if decision in {"keep", "1"}:
            signal_data = UserDecisionSignal(decision=UserDecision.KEEP)
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to keep output and create PDF")
            break

        elif decision in {"edit", "2"}:
            additional_prompt = input(
                "Enter additional instructions (optional): "
            ).strip()
            signal_data = UserDecisionSignal(
                decision=UserDecision.EDIT,
                additional_prompt=additional_prompt
            )
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to regenerate output")

        else:
            print("Please enter either 'keep' or 'edit'")

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

    signal_task = asyncio.create_task(send_user_decision_signal(client, handle.id))

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
```
</details>

## Testing Our Signal

With both the Worker and client code ready, let's run your application. We need a few terminal windows running:

1. **Terminal 1 - Make sure your Temporal server is running:**
The first step to run anything in Temporal is to make sure you have a local Temporal Service running. Open a separate terminal window and start the service with `temporal server start-dev`.

2. **Terminal 2 - Start your Worker:**
   ```bash
   uv run worker.py
   ```
You should see output indicating the Worker has started and is listening on the "research" task queue. **Keep this terminal running** - the Worker needs to be active to execute your Workflows.

3. **Terminal 3** - Execute your Workflow:
   ```bash
   uv run starter.py
   ```
  
Here's what will happen: 

1. You'll be prompted to enter a research topic or question.
2. Once you do, you'll be asked if you want to keep the research (and generate a PDF) or edit it (to modify the prompt). Let's check out the outputs in the Web UI before we decide.

## Observing Signals in the Web UI

Now that your Workflow is running, open the Temporal Web UI at `http://localhost:8233` to watch what's happening. Click on your Workflow Execution listed there.

### Viewing the LLM Activity Results

Scroll through the Event History and find the `ActivityTaskCompleted` event. This is where Temporal recorded the completion of your `llm_call` Activity. Click on it to expand the details, and you'll see the research content that the LLM generated in the output field. This is the actual research text that's now waiting for your approval.

<img src="https://i.postimg.cc/Gm3sKn3y/activity-task-completed.png" />

### The Workflow is Waiting

After the Activity completes, notice that your Workflow shows a status of "Running" at the top of the page. This might seem odd since nothing appears to be happening, but this is exactly what we want. The Workflow has reached the `wait_condition()` line in your code and is now paused, waiting for you to send a Signal.

<img src="https://i.postimg.cc/qvtp41jP/workflow-running.png" />

What's important to understand here is that while the Workflow is in a "Running" state, it's _not actually consuming any compute resources_. The Worker isn't sitting there spinning in a loop checking for Signals. Instead, Temporal has durably recorded that this Workflow is waiting for a specific condition (the Signal state to change), and the Workflow will only resume when that Signal arrives. There's no wasted CPU cycles or memory.

### Sending an Edit Signal

Back in your terminal where `starter.py` is running, let's try editing the research. Type `edit` when prompted, and then provide some additional instructions. For example, you might say "turn this into a poem" or "make it more concise" or "add more details about their habitat."

Once you press Enter, switch back to the Web UI and refresh the page. You'll now see a new event in the Event History called `WorkflowExecutionSignaled`. Expand this event and you'll see the Signal name (`user_decision_signal`) and the data you sent (your decision and additional instructions).

<img src="https://i.postimg.cc/Fz7hzGhF/workflow-execution-signaled.png" />

This event marks the exact moment your Signal was received and recorded in the Workflow's history. Once this Signal arrived, the `wait_condition()` unblocked, your Workflow logic checked the decision (EDIT), updated the prompt with your additional instructions, and looped back to call the LLM Activity again with the modified prompt.

You'll see another `ActivityTaskCompleted` appear as the LLM generates new research based on your feedback. The Workflow will then reach `wait_condition()` again, waiting for your next decision.

<img src="https://i.postimg.cc/LsQ9prMv/running-workflow-2.png" />

### Completing the Workflow

When you're satisfied with the research, type `keep` in your terminal. Send that Signal, then refresh the Web UI. You'll see another `WorkflowExecutionSignaled` event, but this time the decision is KEEP. After this Signal, the Workflow exits the loop, executes the `create_pdf` Activity, and completes.

The Workflow status changes to "Completed", and you'll see the final `WorkflowExecutionCompleted` event in the history with the return value: "Successfully created research report PDF: research_pdf.pdf"

<img src="https://i.postimg.cc/Z57tBpDc/workflow-execution-complete.png" />

What you've just witnessed is the complete lifecycle of a durable human-in-the-loop interaction. Every Signal you sent, every Activity execution, and every state change was recorded in the Event History. If your system had crashed at any point during this process, Temporal would replay this entire history when it recovered, restoring the Workflow to its exact state—including remembering all the Signals you sent.

## Adding Query Support

Now let's add **[Query](https://docs.temporal.io/develop/python/message-passing#queries)** support to our Workflow. Queries:

- Extract state to show the user
- Can be done during or even after the Workflow Execution has completed
- Are synchronous operations that retrieve state from a Workflow Execution

### Use Cases for Queries

- **Monitor Progress**: Get updates on long-running workflows (e.g., percentage completed)
- **Retrieve Intermediate Results**: Fetch results of Activities without waiting for the entire Workflow to complete
- **Inspect State**: Check current values of workflow variables for debugging or monitoring

## Implementing a Query

Let's create a Query to allow users to read the current research content from a running Workflow. We need to make three changes to `workflow.py`:

1. **Add a new instance variable** to store the research result in `__init__`:
   ```python
   self._research_result: str = ""
   ```

2. **Define the Query handler** using the `@workflow.query` decorator:
   ```python
   @workflow.query
   def get_research_result(self) -> str:
       """Query to get the current research result"""
       return self._research_result
   ```

   The `@workflow.query` decorator marks this method as a Query handler. Unlike Signals, Queries are synchronous read-only operations. When a client calls this Query, it immediately returns the current value of `self._research_result` without modifying any state. Queries don't create events in the Workflow history because they're just reading data, not changing anything. This means you can Query a Workflow as many times as you want without affecting its execution or cluttering the Event History. You can also Query completed Workflows to retrieve their final state.

3. **Store the research result** after the LLM Activity completes, inside the while loop:
   ```python
   self._research_result = research_facts["choices"][0]["message"]["content"]
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
        UserDecision,
        UserDecisionSignal
    )

@workflow.defn
class GenerateReportWorkflow:
    def __init__(self) -> None:
        self._current_prompt: str = ""
        self._research_result: str = ""
        # Instance variable to store Signal data
        self._user_decision: UserDecisionSignal = UserDecisionSignal(
            decision=UserDecision.WAIT
        )

    @workflow.query
    def get_research_result(self) -> str:
        """Query to get the current research result"""
        return self._research_result

    @workflow.signal
    async def user_decision_signal(self, decision_data: UserDecisionSignal) -> None:
        """Signal handler that receives user decisions"""
        self._user_decision = decision_data

    @workflow.run
    async def run(self, input: GenerateReportInput) -> str:
        llm_call_input = LLMCallInput(prompt=input.prompt)

        # Continue looping until the user approves the research
        continue_user_input_loop = True

        # Execute the LLM call to generate research based on the current prompt
        while continue_user_input_loop:
            research_facts = await workflow.execute_activity(
                llm_call,
                llm_call_input,
                start_to_close_timeout=timedelta(seconds=30),
            )

            # Store the research result for queries
            self._research_result = research_facts["choices"][0]["message"]["content"]

            # Waiting for Signal with user decision
            await workflow.wait_condition(lambda: self._user_decision.decision != UserDecision.WAIT)

            # User approved the research - exit the loop and proceed to PDF generation
            if self._user_decision.decision == UserDecision.KEEP:
                workflow.logger.info("User approved the research. Creating PDF...")
                continue_user_input_loop = False
            # User wants to edit the research - update the prompt and loop again
            elif self._user_decision.decision == UserDecision.EDIT:
                workflow.logger.info("User requested research modification.")
                if self._user_decision.additional_prompt != "":
                    # Append the user's additional instructions to the existing prompt
                    self._current_prompt = (
                        f"{self._current_prompt}\n\nAdditional instructions: {self._user_decision.additional_prompt}"
                    )
                else:
                    workflow.logger.info("No additional instructions provided. Regenerating with original prompt.")
                # Update the Activity input with the modified prompt for the next iteration
                llm_call_input.prompt = self._current_prompt
                self._user_decision = UserDecisionSignal(decision=UserDecision.WAIT)

        pdf_generation_input = PDFGenerationInput(content=research_facts["choices"][0]["message"]["content"])

        pdf_filename: str = await workflow.execute_activity(
            create_pdf,
            pdf_generation_input,
            start_to_close_timeout=timedelta(seconds=20),
        )

        return f"Successfully created research report PDF: {pdf_filename}"
```
</details>

## Sending Queries from the Client

After defining and setting a handler for the Queries in your Workflow, the next step is to send a Query, which is sent from a Temporal Client. To do this, use the `query` method. We will again:

1. Get a handle of the Workflow Execution we will query.
2. Send a query with the query method.

`research_result = await handle.query(GenerateReportWorkflow.get_research_result)`

We'll add this to our `starter.py`:

```python
async def query_research_result(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    try:
        research_result = await handle.query(
            GenerateReportWorkflow.get_research_result
        )
        if research_result:
            print(f"\nResearch Result:\n{research_result}\n")
        else:
            print("Research Result: Not yet available")
    except Exception as e:
        print(f"Query failed: {e}")
```

## Combining Signals and Queries

Now that you've implemented both Signals and Queries separately, let's combine them into a single interactive experience. Users can Query to inspect the current state without changing anything, and they can Signal to provide feedback that modifies the Workflow's behavior.

Let's update our `send_user_decision` function in `starter.py` to support both operations:

```python
async def send_user_decision(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\n" + "=" * 50)
        print("Research is complete!")
        print("1. Type 'query' to view the current research result")
        print("2. Type 'keep' to approve the research and create PDF")
        print("3. Type 'edit' to modify the research")
        print("=" * 50)

        decision = input("Your decision (query/keep/edit): ").strip().lower()
        
        if decision in {"query", "1"}:
            await query_research_result(client, workflow_id)
        elif decision in {"keep", "2"}:
            signal_data = UserDecisionSignal(decision=UserDecision.KEEP)
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to keep research and create PDF")
            break
        elif decision in {"edit", "3"}:
            additional_prompt = input(
                "Enter additional instructions (optional): "
            ).strip()
            signal_data = UserDecisionSignal(
                decision=UserDecision.EDIT,
                additional_prompt=additional_prompt
            )
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to regenerate research")
        else:
            print("Please enter either 'keep', 'edit', or 'query'")
```

This function creates an interactive loop that gives users three options: `query`, `edit`, or `keep`

<details>
<summary>
Your <code>starter.py</code> should look like the following:
</summary>

```ini
import asyncio
import uuid

from models import GenerateReportInput, UserDecision, UserDecisionSignal
from temporalio.client import Client #  Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow # Your Workflow definition

async def query_research_result(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    try:
        research_result = await handle.query(
            GenerateReportWorkflow.get_research_result
        )
        if research_result:
            print(f"\nResearch Result:\n{research_result}\n")
        else:
            print("Research Result: Not yet available")
    except Exception as e:
        print(f"Query failed: {e}")

async def send_user_decision_signal(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\n" + "=" * 50)
        print("Research is complete!")
        print("1. Type 'query' to view the current research result")
        print("2. Type 'keep' to approve the research and create PDF")
        print("3. Type 'edit' to modify the research")
        print("=" * 50)

        decision = input("Your decision (query/keep/edit): ").strip().lower()
        
        if decision in {"query", "1"}:
            await query_research_result(client, workflow_id)
        elif decision in {"keep", "2"}:
            signal_data = UserDecisionSignal(decision=UserDecision.KEEP)
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to keep research and create PDF")
            break
        elif decision in {"edit", "3"}:
            additional_prompt = input(
                "Enter additional instructions (optional): "
            ).strip()
            signal_data = UserDecisionSignal(
                decision=UserDecision.EDIT,
                additional_prompt=additional_prompt
            )
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to regenerate research")
        else:
            print("Please enter either 'keep', 'edit', or 'query'")

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

    signal_task = asyncio.create_task(send_user_decision_signal(client, handle.id))

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
```
</details>

## Complete Example

Here's how to put it all together:

1. **Start the Temporal server**:
   ```bash
   temporal server start-dev
   ```

2. **Run the Worker** (in another terminal): Make sure you restart this to register our new changes.
   ```bash
   uv run worker.py
   ```

3. **Start the Workflow** (in another terminal):
   ```bash
   uv run starter.py
   ```

4. **Interact with the Workflow**:
   - Type `query` to view the current research (_you may have to wait a few seconds first for the LLM call to complete. Watch your Web UI to see when this is done._)
   - Type `edit` to provide feedback and regenerate
   - Type `keep` to approve and generate the PDF

5. **Observe in the Web UI** at `http://localhost:8233`:
   - Notice that Queries don't create events in the history 

## Key Takeaways

You've now built a complete **interactive, durable AI application** with Signals and Queries. Now, when interacting with our research application:

- Users can Query to review AI output
- Users can Signal to approve or request changes
- All interactions are durable through failures
- Workflows maintain complete state across crashes

:::note
Learn more about how Signals and Queries works with our free [Interacting with Workflows course](https://learn.temporal.io/courses/interacting_with_workflows/)
:::

## What's Next?

Your research application can generate content with LLMs, handle failures gracefully, and incorporate human feedback—all while maintaining durability through crashes and retries.

In our next tutorial series, we'll show you how to create an agentic loop with Temporal. You'll learn how to coordinate multiple LLM calls, chain Activities together, and orchestrate complex AI workflows that combine autonomous agent behavior. This is where you'll see the full power of the agentic loop pattern and Temporal. Sign up [here](https://pages.temporal.io/get-updates-education) to get notified when that tutorial gets published.