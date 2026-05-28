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
  { id: "challenges-non-durable", label: "Challenges in non-durable HITL" },
  { id: "durable-execution-human", label: "Durable execution for human interaction" },
  { id: "understanding-signals", label: "Understanding Temporal Signals" },
  { id: "signals-architecture", label: "Implementing Signals: architecture" },
  { id: "building-feedback-loop", label: "Building the feedback loop" },
  { id: "define-signal-model", label: "Step 1: Define the Signal data model" },
  { id: "store-signal-state", label: "Step 2: Store Signal state in the Workflow" },
  { id: "define-signal-handler", label: "Step 3: Define a Signal handler" },
  { id: "implement-feedback-loop", label: "Step 4: Implement the feedback loop" },
  { id: "waiting-for-signal", label: "Waiting for a Signal" },
  { id: "sending-signals-client", label: "Sending Signals from the client" },
  { id: "testing-signal", label: "Testing our Signal" },
  { id: "observing-signals-web-ui", label: "Observing Signals in the Web UI" },
  { id: "adding-query-support", label: "Adding Query support" },
  { id: "implementing-query", label: "Implementing a Query" },
  { id: "sending-queries-client", label: "Sending Queries from the client" },
  { id: "combining-signals-queries", label: "Combining Signals and Queries" },
  { id: "complete-example", label: "Complete example" },
  { id: "key-takeaways", label: "Key takeaways" },
  { id: "whats-next", label: "What's next?" },
];

const PSEUDOCODE = `# Continue looping until the user approves the research
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
    user_decision = "WAIT"`;

const SIGNAL_MODEL = `from dataclasses import dataclass
from enum import StrEnum

class UserDecision(StrEnum):
    KEEP = "KEEP"
    EDIT = "EDIT"
    WAIT = "WAIT"

@dataclass
class UserDecisionSignal:
    """A data structure to send user decisions via Temporal Signals"""
    decision: UserDecision
    additional_prompt: str = ""`;

const MODELS_FULL = `from dataclasses import dataclass
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
    prompt: str`;

const WORKFLOW_STATE = `from temporalio import workflow

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
        # Workflow logic continues...`;

const WORKFLOW_AFTER_STATE = `from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call

    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
        UserDecision,
        UserDecisionSignal,
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

        return f"Successfully created research report PDF: {pdf_filename}"`;

const SIGNAL_HANDLER = `from temporalio import workflow

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
        # Workflow logic...`;

const WORKFLOW_AFTER_HANDLER = `from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call

    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
        UserDecision,
        UserDecisionSignal,
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

        return f"Successfully created research report PDF: {pdf_filename}"`;

const FEEDBACK_LOOP = `# Continue looping until the user approves the research
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
                f"{self._current_prompt}\\n\\nAdditional instructions: {self._user_decision.additional_prompt}"
            )
        else:
            workflow.logger.info("No additional instructions provided. Regenerating with original prompt.")
        # Update the Activity input with the modified prompt for the next iteration
        llm_call_input.prompt = self._current_prompt
        self._user_decision = UserDecisionSignal(decision=UserDecision.WAIT)`;

const WORKFLOW_AFTER_LOOP = `from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call

    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
        UserDecision,
        UserDecisionSignal,
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
                        f"{self._current_prompt}\\n\\nAdditional instructions: {self._user_decision.additional_prompt}"
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

        return f"Successfully created research report PDF: {pdf_filename}"`;

const WAIT_CONDITION = `await workflow.wait_condition(
    lambda: self._user_decision.decision != UserDecision.WAIT
)`;

const WORKFLOW_AFTER_WAIT = `from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call

    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
        UserDecision,
        UserDecisionSignal,
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
                        f"{self._current_prompt}\\n\\nAdditional instructions: {self._user_decision.additional_prompt}"
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

        return f"Successfully created research report PDF: {pdf_filename}"`;

const HANDLE_GET = `handle = client.get_workflow_handle(workflow_id)`;

const SIGNAL_SEND = `signal_data = UserDecisionSignal(decision=UserDecision.KEEP)
await handle.signal("user_decision_signal", signal_data)`;

const SEND_USER_DECISION_FUNC = `async def send_user_decision_signal(client: Client, workflow_id: str):
    # Get handle to the Workflow Execution
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\\n" + "=" * 80)
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
                additional_prompt=additional_prompt,
            )
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to regenerate output")

        else:
            print("Please enter either 'keep' or 'edit'")`;

const INVOKE_SIGNAL_FUNC = `signal_task = asyncio.create_task(send_user_decision_signal(client, handle.id))`;

const STARTER_AFTER_SIGNAL = `import asyncio
import uuid

from models import GenerateReportInput, UserDecision, UserDecisionSignal
from temporalio.client import Client  # Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow  # Your Workflow definition

async def send_user_decision_signal(client: Client, workflow_id: str):
    # Get handle to the Workflow Execution
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\\n" + "=" * 80)
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
                additional_prompt=additional_prompt,
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
        GenerateReportWorkflow,  # The Workflow method to execute
        research_input,
        id=f"generate-research-report-workflow-{uuid.uuid4()}",
        task_queue="research",  # task queue your Worker is polling
    )

    signal_task = asyncio.create_task(send_user_decision_signal(client, handle.id))

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())`;

const QUERY_INIT = `self._research_result: str = ""`;

const QUERY_HANDLER = `@workflow.query
def get_research_result(self) -> str:
    """Query to get the current research result"""
    return self._research_result`;

const STORE_RESULT = `self._research_result = research_facts["choices"][0]["message"]["content"]`;

const WORKFLOW_WITH_QUERY = `from datetime import timedelta
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import create_pdf, llm_call

    from models import (
        GenerateReportInput,
        LLMCallInput,
        PDFGenerationInput,
        UserDecision,
        UserDecisionSignal,
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
                        f"{self._current_prompt}\\n\\nAdditional instructions: {self._user_decision.additional_prompt}"
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

        return f"Successfully created research report PDF: {pdf_filename}"`;

const QUERY_SNIPPET = `research_result = await handle.query(GenerateReportWorkflow.get_research_result)`;

const QUERY_FUNC = `async def query_research_result(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    try:
        research_result = await handle.query(
            GenerateReportWorkflow.get_research_result
        )
        if research_result:
            print(f"\\nResearch Result:\\n{research_result}\\n")
        else:
            print("Research Result: Not yet available")
    except Exception as e:
        print(f"Query failed: {e}")`;

const COMBINED_DECISION_FUNC = `async def send_user_decision(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\\n" + "=" * 50)
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
                additional_prompt=additional_prompt,
            )
            await handle.signal("user_decision_signal", signal_data)
            print("Signal sent to regenerate research")
        else:
            print("Please enter either 'keep', 'edit', or 'query'")`;

const STARTER_COMBINED_FULL = `import asyncio
import uuid

from models import GenerateReportInput, UserDecision, UserDecisionSignal
from temporalio.client import Client  # Connects to the Temporal service to start Workflows
from workflow import GenerateReportWorkflow  # Your Workflow definition

async def query_research_result(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    try:
        research_result = await handle.query(
            GenerateReportWorkflow.get_research_result
        )
        if research_result:
            print(f"\\nResearch Result:\\n{research_result}\\n")
        else:
            print("Research Result: Not yet available")
    except Exception as e:
        print(f"Query failed: {e}")

async def send_user_decision_signal(client: Client, workflow_id: str):
    handle = client.get_workflow_handle(workflow_id)

    while True:
        print("\\n" + "=" * 50)
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
                additional_prompt=additional_prompt,
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
        GenerateReportWorkflow,  # The Workflow method to execute
        research_input,
        id=f"generate-research-report-workflow-{uuid.uuid4()}",
        task_queue="research",  # task queue your Worker is polling
    )

    signal_task = asyncio.create_task(send_user_decision_signal(client, handle.id))

    print(f"Started workflow. Workflow ID: {handle.id}, RunID {handle.result_run_id}")
    result = await handle.result()
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())`;

export default function HumanInTheLoopChapter2Page() {
  return (
    <Layout
      title="Part 2: Human in the Loop"
      description="Add durable human-in-the-loop capabilities to your AI research application using Temporal Signals and Queries."
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
                  { label: "Part 2: Human in the Loop" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Part 2: Adding Durable Human-in-the-Loop to Our Research Application
            </h1>

            <MetaChips items={["~60 minutes", "Intermediate", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Your durable research application now survives crashes and
              automatically retries failures. But there's a critical gap:{" "}
              <strong>it runs completely autonomously</strong>.
            </p>

            <p>
              <em>Imagine this scenario</em>: Your AI generates research,
              creates a PDF, and sends it to your client automatically. Then
              your client calls requesting changes - but your application
              had no way to pause for approval or feedback.
            </p>

            <p>
              <strong>Real-world AI applications need human interaction</strong>{" "}
              for feedback, approvals, and clarifications. But adding human
              input creates challenges: What if the user's browser crashes
              while reviewing? What if they close the tab and return later?
              How do you preserve expensive LLM work while waiting for
              approval?
            </p>

            <p>
              In this tutorial, you'll solve these problems by adding durable
              human-in-the-loop capabilities to your application. You'll
              implement features that let you:
            </p>
            <ul>
              <li>
                Approve research results by sending a <code>keep</code>{" "}
                signal to continue the workflow
              </li>
              <li>Request revisions by editing the prompt to regenerate output</li>
              <li>
                Query the workflow at any time to check the current LLM
                output
              </li>
            </ul>

            <p>
              Temporal's durability ensures you maintain control over
              AI-generated content while reliably handling the human
              approval process.
            </p>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>
                This tutorial is part 2 of the Building Durable AI
                Applications with Temporal series. Before starting, ensure
                you have:
              </p>
              <ul>
                <li>
                  Completed Part 1 of this tutorial:{" "}
                  <Link to="/tutorials/ai/building-durable-ai-applications/01-durable-ai-with-temporal/">
                    Adding Durability with Temporal
                  </Link>
                </li>
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
              </ul>
            </section>

            <section className={styles.section} id="challenges-non-durable">
              <h2 className={styles.sectionTitle}>
                Challenges in non-durable human-in-the-loop processes
              </h2>
              <p>
                While human interaction points are valuable for AI
                applications, implementing them reliably presents significant
                technical challenges. Without durable execution, human input
                can be lost during system failures, leading to unpredictable
                behavior.
              </p>
              <p>
                <strong>Consider the following scenario:</strong>
              </p>
              <ul>
                <li>A user needs to approve a transaction</li>
                <li>As they are doing this, the website goes down</li>
                <li>
                  How do you mitigate this?
                  <ul>
                    <li>
                      Do we notify the user to approve the payment again?
                      (creating confusion since the user already 'approved')
                    </li>
                    <li>
                      Do we assume approval and risk processing an
                      unauthorized payment?
                    </li>
                  </ul>
                </li>
              </ul>
              <p>
                Without durable processes, you're forced to choose between
                security, user experience, and reliability.
              </p>
              <p>
                <strong>
                  It's distributed system challenges all over again.
                </strong>
              </p>
            </section>

            <section className={styles.section} id="durable-execution-human">
              <h2 className={styles.sectionTitle}>
                Durable execution for human interaction
              </h2>
              <p>
                With Temporal's durable execution, the workflow instance{" "}
                <strong>
                  persists throughout the entire human interaction
                </strong>
                :
              </p>
              <p>
                <strong>What this means in practice:</strong>
              </p>
              <ul>
                <li>
                  <strong>User's approval is durably stored</strong> - When a
                  user clicks "approve", that decision is saved in the
                  workflow history
                </li>
                <li>
                  <strong>No re-approval needed</strong> - If the website
                  crashes after approval, the workflow resumes with the
                  approval already recorded
                </li>
                <li>
                  <strong>Automatic recovery</strong> - System failures don't
                  lose progress; the workflow picks up exactly where it left
                  off
                </li>
                <li>
                  <strong>User can walk away</strong> - Close the browser,
                  shut down the laptop, and the workflow continues running
                  on the server
                </li>
              </ul>

              <Admonition type="info">
                <p>
                  Instead of managing complex coordination between services,
                  queues, and databases to handle human input, you write
                  straightforward code that waits for human decisions.
                  Temporal handles all the reliability, state management,
                  and recovery automatically.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="understanding-signals">
              <h2 className={styles.sectionTitle}>
                Understanding Temporal Signals
              </h2>
              <p>
                In Temporal, human interaction is achieved through a{" "}
                <a
                  href="https://docs.temporal.io/develop/python/message-passing#signals"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Signal
                </a>
                .
              </p>
              <p>A Signal is a:</p>
              <ul>
                <li>
                  Message sent asynchronously to a running Workflow Execution
                </li>
                <li>
                  Used to change the state and control the flow of a Workflow
                  Execution
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>Example Signal usage</h3>
              <ol>
                <li>The user initiates a workflow with an initial request</li>
                <li>
                  The workflow processes the request and determines what
                  information or approval is needed
                </li>
                <li>
                  The workflow pauses and waits for user input via Signal,
                  such as:
                  <ul>
                    <li>Additional information or clarification</li>
                    <li>Permission to proceed with an action</li>
                    <li>Selection between multiple options</li>
                  </ul>
                </li>
                <li>The user sends a Signal with their response</li>
                <li>The workflow resumes execution based on the Signal received</li>
                <li>
                  Steps repeat as needed until the workflow completes its task
                </li>
              </ol>

              <h3 className={styles.subsectionTitle}>
                Durably storing human interactions
              </h3>
              <p>
                Let's go back to the user approving a payment example. With
                Temporal, when the user clicks "approve" in the finance
                portal, the approval decision gets durably stored.
              </p>
              <p>
                The user can close the browser, go to lunch, and the
                Workflow will continue running in the background.
              </p>
              <p>
                If the payment gateway times out, returns an error or
                becomes unavailable, Temporal automatically retries the
                payment step. It does not need to re-ask the user for
                approval, because that decision is already durably stored in
                the Workflow state.
              </p>
              <ul>
                <li>
                  <strong>No duplicate work</strong> (user does not have to
                  re-approve the same expense)
                </li>
                <li>
                  <strong>No manual intervention</strong> (does not need to
                  manually reconcile failed payments or investigate whether
                  an expense was actually approved)
                </li>
                <li>
                  <strong>Reliable processing</strong> (business can count
                  on approved expenses being paid)
                </li>
              </ul>
            </section>

            <section className={styles.section} id="signals-architecture">
              <h2 className={styles.sectionTitle}>
                Implementing Signals: architecture overview
              </h2>
              <p>
                Before we dive into the implementation, let's look at how
                Signals work in a Temporal application from a high level:
              </p>
              <p>
                <img
                  src="https://i.postimg.cc/fbzbF82b/signal-loop.png"
                  alt="Signal Architecture"
                  className={styles.diagramImage}
                />
              </p>
              <p>This diagram shows the complete signal flow:</p>
              <ol>
                <li>
                  <strong>UI/Client side</strong>: A Temporal Client invokes
                  a signal handler when the user takes an action (e.g.,
                  someone might click "buy item" on the UI and that sends a
                  Signal that a payment has been made)
                </li>
                <li>
                  <strong>Signal handler</strong>: Decorated with{" "}
                  <code>@workflow.signal</code>, it receives the Signal and
                  updates the workflow's state variables (e.g., the
                  workflow's state variable can change from "waiting for
                  payment" to "paid")
                </li>
                <li>
                  <strong>Workflow main loop</strong>: Continuously checks
                  state variables and waits for changes, then reacts
                  accordingly (e.g., if the state has changed to "paid",
                  the application can now ship the item)
                </li>
              </ol>
              <p>
                This architecture enables durable human-in-the-loop
                interactions where user input is preserved through crashes
                and the workflow can resume exactly where it left off.
              </p>
            </section>

            <section className={styles.section} id="building-feedback-loop">
              <h2 className={styles.sectionTitle}>
                Building the feedback loop
              </h2>
              <p>
                Let's update our research application to give users the
                ability to review and refine AI-generated research before
                creating the final PDF.
              </p>
              <p>
                We'll implement a <strong>feedback loop</strong> where:
              </p>
              <ol>
                <li>
                  <strong>LLM generates research</strong> based on the current
                  prompt
                </li>
                <li>
                  <strong>Workflow pauses</strong> and waits for the user's
                  decision (Signal)
                </li>
                <li>
                  <strong>User reviews</strong> the research and signals their
                  choice:
                  <ul>
                    <li>
                      <strong>"Keep"</strong> &rarr; Exit the loop and create
                      the PDF
                    </li>
                    <li>
                      <strong>"Edit"</strong> &rarr; Add instructions, update
                      the prompt, and loop back to step 1
                    </li>
                  </ul>
                </li>
              </ol>
              <p>
                <img
                  src="https://i.postimg.cc/BZPYWhHZ/signal-goal.png"
                  alt="Signal Goal"
                  className={styles.diagramImage}
                />
              </p>

              <h3 className={styles.subsectionTitle}>
                Understanding the loop structure
              </h3>
              <p>
                Here's the pseudocode showing the logic we'll implement:
              </p>
              <CodeBlock language="python">{PSEUDOCODE}</CodeBlock>
              <p>Let's go ahead and now implement this.</p>
            </section>

            <section className={styles.section} id="define-signal-model">
              <h2 className={styles.sectionTitle}>
                Step 1: Define the Signal data model
              </h2>
              <p>
                First, create a model for the Signal data to be stored in.
                Similar to Activities and Workflows, <code>dataclasses</code>{" "}
                are recommended. Add this into your <code>models.py</code>{" "}
                file.
              </p>
              <CodeBlock language="python">{SIGNAL_MODEL}</CodeBlock>
              <p>This defines:</p>
              <ul>
                <li>
                  <strong>UserDecision</strong>: An enum with three states
                  (KEEP, EDIT, WAIT). We'll send a <code>UserDecision</code>{" "}
                  as a Signal to our Research Workflow letting the Workflow
                  know if we want to keep or edit the research or if we want
                  to wait for further decision
                </li>
                <li>
                  <strong>UserDecisionSignal</strong>: A dataclass that
                  includes the decision and optional additional instructions
                </li>
              </ul>

              <details>
                <summary>
                  Your <code>models.py</code> should look like the following:
                </summary>
                <CodeBlock language="python" title="models.py">
                  {MODELS_FULL}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="store-signal-state">
              <h2 className={styles.sectionTitle}>
                Step 2: Store Signal state in the Workflow
              </h2>
              <p>
                The workflow needs a place to remember what Signals it has
                received. We will use instance variables to persist Signal
                data across Workflow Execution. Add the following to your{" "}
                <code>workflow.py</code> file (and don't forget to add{" "}
                <code>UserDecision</code> and <code>UserDecisionSignal</code>{" "}
                into your <code>workflow.unsafe.imports_passed_through</code>):
              </p>
              <CodeBlock language="python">{WORKFLOW_STATE}</CodeBlock>
              <p>
                The instance variable <code>_user_decision</code> is
                initialized with <code>WAIT</code> as the default state,
                indicating "no Signal received yet."
              </p>

              <details>
                <summary>
                  Your <code>workflow.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="workflow.py">
                  {WORKFLOW_AFTER_STATE}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="define-signal-handler">
              <h2 className={styles.sectionTitle}>
                Step 3: Define a Signal handler
              </h2>
              <p>
                A Signal is defined in your code and handled in your Workflow
                Definition. To define a Signal, use the{" "}
                <code>@workflow.signal</code> decorator.
              </p>
              <CodeBlock language="python">{SIGNAL_HANDLER}</CodeBlock>
              <p>
                The <code>@workflow.signal</code> decorator turns the{" "}
                <code>user_decision_signal</code> method into a Signal
                handler. Now, when a client sends a Signal to this Workflow
                (which we'll implement later), this method gets called
                automatically and receives the data that was sent.
              </p>
              <p>
                In our case, the method receives a{" "}
                <code>UserDecisionSignal</code> object containing the user's
                decision (KEEP or EDIT) and any additional instructions. The
                handler's job is simple: take that data and store it in the
                Workflow's <code>self._user_decision</code> instance
                variable. That's it.
              </p>

              <details>
                <summary>
                  Your <code>workflow.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="workflow.py">
                  {WORKFLOW_AFTER_HANDLER}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="implement-feedback-loop">
              <h2 className={styles.sectionTitle}>
                Step 4: Implement the feedback loop
              </h2>
              <p>
                As mentioned earlier in our pseudocode, we now need to create
                our loop that reacts to the Signal in Workflow logic.
              </p>
              <ul>
                <li>
                  If the Workflow receives <code>KEEP</code> as the{" "}
                  <code>UserDecision</code>, then the Workflow exits the
                  research loop and proceeds to PDF generation.
                </li>
                <li>
                  If the Workflow receives <code>EDIT</code> as the{" "}
                  <code>UserDecision</code>, then the Workflow incorporates
                  any additional feedback into the prompt, updates the
                  research parameters, and resets the Signal state back to{" "}
                  <code>WAIT</code> so it can loop again to regenerate the
                  research and wait for the next user decision.
                </li>
              </ul>
              <p>
                Add this loop logic to <code>workflow.py</code> after setting
                the variable definition for <code>llm_call_input</code>:
              </p>
              <CodeBlock language="python">{FEEDBACK_LOOP}</CodeBlock>

              <details>
                <summary>
                  Your <code>workflow.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="workflow.py">
                  {WORKFLOW_AFTER_LOOP}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="waiting-for-signal">
              <h2 className={styles.sectionTitle}>Waiting for a Signal</h2>
              <p>
                We've now stored our initial Signal state and defined what
                happens when it comes in. Next, we need a way for the
                Workflow to pause and wait for that Signal to arrive. This is
                where <code>workflow.wait_condition()</code> comes in.
              </p>
              <ul>
                <li>
                  Use <code>workflow.wait_condition()</code> to pause until
                  Signal is received (user decides the next step)
                </li>
                <li>
                  Creates a blocking checkpoint where the Workflow stops and
                  waits
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
                  - waits until Signal received OR timeout elapsed, whichever
                  happens first
                </li>
              </ul>
              <p>
                We'll add this before we enter the loop so that we don't
                enter it until a Signal has been received:
              </p>
              <CodeBlock language="python">{WAIT_CONDITION}</CodeBlock>

              <details>
                <summary>
                  Your <code>workflow.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="workflow.py">
                  {WORKFLOW_AFTER_WAIT}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="sending-signals-client">
              <h2 className={styles.sectionTitle}>
                Sending Signals from the client
              </h2>
              <p>Let's recap what we've built so far:</p>
              <ul>
                <li>
                  <strong>Defined our Signal</strong> with{" "}
                  <code>UserDecisionSignal</code> to structure the data we'll
                  send
                </li>
                <li>
                  <strong>Created a Signal handler</strong> that receives
                  incoming Signals and updates the Workflow's state variables
                  (in this case, storing the user's decision)
                </li>
                <li>
                  <strong>Implemented the feedback loop</strong> that checks
                  the Signal data and decides whether to keep the research or
                  edit it
                </li>
                <li>
                  <strong>Added <code>wait_condition()</code></strong> to
                  pause the Workflow until a Signal arrives
                </li>
              </ul>
              <p>
                We are now ready to send a Signal to our Research Workflow to
                let it know what to do. To send a Signal with the Temporal
                Client, we need to get a "handle" to a specific Workflow
                Execution, which will be used to interact with that Workflow.
              </p>
              <p>
                We'll do this with the{" "}
                <a
                  href="https://docs.temporal.io/develop/python/message-passing#send-messages"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>get_workflow_handle</code>
                </a>{" "}
                method.
              </p>
              <CodeBlock language="python">{HANDLE_GET}</CodeBlock>
              <p>
                With the handle on the Workflow Execution we want to Signal,
                we'll then pass in our Signal:
              </p>
              <CodeBlock language="python">{SIGNAL_SEND}</CodeBlock>
              <p>
                Now let's create a function that prompts the user for their
                decision and sends the appropriate Signal:
              </p>
              <ul>
                <li>
                  If the user chooses <strong>"edit"</strong>, we send a
                  Signal with <code>UserDecision.EDIT</code> and any
                  additional instructions
                </li>
                <li>
                  If the user chooses <strong>"keep"</strong>, we send a
                  Signal with <code>UserDecision.KEEP</code> to approve the
                  research and proceed to PDF creation
                </li>
              </ul>
              <p>
                Don't forget to add <code>UserDecision</code> and{" "}
                <code>UserDecisionSignal</code> into our imports.
              </p>
              <p>
                Add this function to <code>starter.py</code> before our
                starter code:
              </p>
              <CodeBlock language="python">{SEND_USER_DECISION_FUNC}</CodeBlock>
              <p>
                We'll now have to invoke this function within our starter
                code. In <code>starter.py</code>, after you start your
                Workflow, add this line:
              </p>
              <CodeBlock language="python">{INVOKE_SIGNAL_FUNC}</CodeBlock>
              <p>
                This starts the Signal-sending function in the background
                while your Workflow runs. Your Workflow will execute the LLM
                Activity, then pause at <code>wait_condition()</code>{" "}
                waiting for a Signal. Meanwhile, this function prompts you
                for input and sends the appropriate Signal (KEEP or EDIT) to
                the waiting Workflow based on your decision.
              </p>

              <details>
                <summary>
                  Your <code>starter.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="starter.py">
                  {STARTER_AFTER_SIGNAL}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="testing-signal">
              <h2 className={styles.sectionTitle}>Testing our Signal</h2>
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
              <p>Here's what will happen:</p>
              <ol>
                <li>You'll be prompted to enter a research topic or question.</li>
                <li>
                  Once you do, you'll be asked if you want to keep the
                  research (and generate a PDF) or edit it (to modify the
                  prompt). Let's check out the outputs in the Web UI before
                  we decide.
                </li>
              </ol>
            </section>

            <section className={styles.section} id="observing-signals-web-ui">
              <h2 className={styles.sectionTitle}>
                Observing Signals in the Web UI
              </h2>
              <p>
                Now that your Workflow is running, open the Temporal Web UI
                at <code>http://localhost:8233</code> to watch what's
                happening. Click on your Workflow Execution listed there.
              </p>

              <h3 className={styles.subsectionTitle}>
                Viewing the LLM Activity results
              </h3>
              <p>
                Scroll through the Event History and find the{" "}
                <code>ActivityTaskCompleted</code> event. This is where
                Temporal recorded the completion of your <code>llm_call</code>{" "}
                Activity. Click on it to expand the details, and you'll see
                the research content that the LLM generated in the output
                field. This is the actual research text that's now waiting
                for your approval.
              </p>
              <p>
                <img
                  src="https://i.postimg.cc/Gm3sKn3y/activity-task-completed.png"
                  alt="Activity task completed in the Web UI"
                  className={styles.diagramImage}
                />
              </p>

              <h3 className={styles.subsectionTitle}>The Workflow is waiting</h3>
              <p>
                After the Activity completes, notice that your Workflow
                shows a status of "Running" at the top of the page. This
                might seem odd since nothing appears to be happening, but
                this is exactly what we want. The Workflow has reached the{" "}
                <code>wait_condition()</code> line in your code and is now
                paused, waiting for you to send a Signal.
              </p>
              <p>
                <img
                  src="https://i.postimg.cc/qvtp41jP/workflow-running.png"
                  alt="Workflow shown as Running while waiting for a Signal"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                What's important to understand here is that while the
                Workflow is in a "Running" state, it's{" "}
                <em>not actually consuming any compute resources</em>. The
                Worker isn't sitting there spinning in a loop checking for
                Signals. Instead, Temporal has durably recorded that this
                Workflow is waiting for a specific condition (the Signal
                state to change), and the Workflow will only resume when
                that Signal arrives. There's no wasted CPU cycles or
                memory.
              </p>

              <h3 className={styles.subsectionTitle}>Sending an edit Signal</h3>
              <p>
                Back in your terminal where <code>starter.py</code> is
                running, let's try editing the research. Type{" "}
                <code>edit</code> when prompted, and then provide some
                additional instructions. For example, you might say "turn
                this into a poem" or "make it more concise" or "add more
                details about their habitat."
              </p>
              <p>
                Once you press Enter, switch back to the Web UI and refresh
                the page. You'll now see a new event in the Event History
                called <code>WorkflowExecutionSignaled</code>. Expand this
                event and you'll see the Signal name (
                <code>user_decision_signal</code>) and the data you sent
                (your decision and additional instructions).
              </p>
              <p>
                <img
                  src="https://i.postimg.cc/Fz7hzGhF/workflow-execution-signaled.png"
                  alt="Workflow execution signaled event in the Web UI"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                This event marks the exact moment your Signal was received
                and recorded in the Workflow's history. Once this Signal
                arrived, the <code>wait_condition()</code> unblocked, your
                Workflow logic checked the decision (EDIT), updated the
                prompt with your additional instructions, and looped back to
                call the LLM Activity again with the modified prompt.
              </p>
              <p>
                You'll see another <code>ActivityTaskCompleted</code> appear
                as the LLM generates new research based on your feedback.
                The Workflow will then reach <code>wait_condition()</code>{" "}
                again, waiting for your next decision.
              </p>
              <p>
                <img
                  src="https://i.postimg.cc/LsQ9prMv/running-workflow-2.png"
                  alt="Workflow running and waiting again after the edit Signal"
                  className={styles.diagramImage}
                />
              </p>

              <h3 className={styles.subsectionTitle}>Completing the Workflow</h3>
              <p>
                When you're satisfied with the research, type{" "}
                <code>keep</code> in your terminal. Send that Signal, then
                refresh the Web UI. You'll see another{" "}
                <code>WorkflowExecutionSignaled</code> event, but this time
                the decision is KEEP. After this Signal, the Workflow exits
                the loop, executes the <code>create_pdf</code> Activity, and
                completes.
              </p>
              <p>
                The Workflow status changes to "Completed", and you'll see
                the final <code>WorkflowExecutionCompleted</code> event in
                the history with the return value: "Successfully created
                research report PDF: research_pdf.pdf"
              </p>
              <p>
                <img
                  src="https://i.postimg.cc/Z57tBpDc/workflow-execution-complete.png"
                  alt="Workflow execution complete event in the Web UI"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                What you've just witnessed is the complete lifecycle of a
                durable human-in-the-loop interaction. Every Signal you
                sent, every Activity execution, and every state change was
                recorded in the Event History. If your system had crashed at
                any point during this process, Temporal would replay this
                entire history when it recovered, restoring the Workflow to
                its exact state - including remembering all the Signals you
                sent.
              </p>
            </section>

            <section className={styles.section} id="adding-query-support">
              <h2 className={styles.sectionTitle}>Adding Query support</h2>
              <p>
                Now let's add{" "}
                <a
                  href="https://docs.temporal.io/develop/python/message-passing#queries"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>Query</strong>
                </a>{" "}
                support to our Workflow. Queries:
              </p>
              <ul>
                <li>Extract state to show the user</li>
                <li>
                  Can be done during or even after the Workflow Execution has
                  completed
                </li>
                <li>
                  Are synchronous operations that retrieve state from a
                  Workflow Execution
                </li>
              </ul>

              <h3 className={styles.subsectionTitle}>Use cases for Queries</h3>
              <ul>
                <li>
                  <strong>Monitor progress</strong>: Get updates on
                  long-running workflows (e.g., percentage completed)
                </li>
                <li>
                  <strong>Retrieve intermediate results</strong>: Fetch
                  results of Activities without waiting for the entire
                  Workflow to complete
                </li>
                <li>
                  <strong>Inspect state</strong>: Check current values of
                  workflow variables for debugging or monitoring
                </li>
              </ul>
            </section>

            <section className={styles.section} id="implementing-query">
              <h2 className={styles.sectionTitle}>Implementing a Query</h2>
              <p>
                Let's create a Query to allow users to read the current
                research content from a running Workflow. We need to make
                three changes to <code>workflow.py</code>:
              </p>
              <p>
                <strong>
                  1. Add a new instance variable to store the research
                  result in <code>__init__</code>:
                </strong>
              </p>
              <CodeBlock language="python">{QUERY_INIT}</CodeBlock>
              <p>
                <strong>
                  2. Define the Query handler using the{" "}
                  <code>@workflow.query</code> decorator:
                </strong>
              </p>
              <CodeBlock language="python">{QUERY_HANDLER}</CodeBlock>
              <p>
                The <code>@workflow.query</code> decorator marks this method
                as a Query handler. Unlike Signals, Queries are synchronous
                read-only operations. When a client calls this Query, it
                immediately returns the current value of{" "}
                <code>self._research_result</code> without modifying any
                state. Queries don't create events in the Workflow history
                because they're just reading data, not changing anything.
                This means you can Query a Workflow as many times as you
                want without affecting its execution or cluttering the
                Event History. You can also Query completed Workflows to
                retrieve their final state.
              </p>
              <p>
                <strong>
                  3. Store the research result after the LLM Activity
                  completes, inside the while loop:
                </strong>
              </p>
              <CodeBlock language="python">{STORE_RESULT}</CodeBlock>

              <details>
                <summary>
                  Your <code>workflow.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="workflow.py">
                  {WORKFLOW_WITH_QUERY}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="sending-queries-client">
              <h2 className={styles.sectionTitle}>
                Sending Queries from the client
              </h2>
              <p>
                After defining and setting a handler for the Queries in your
                Workflow, the next step is to send a Query, which is sent
                from a Temporal Client. To do this, use the{" "}
                <code>query</code> method. We will again:
              </p>
              <ol>
                <li>Get a handle of the Workflow Execution we will query.</li>
                <li>Send a query with the query method.</li>
              </ol>
              <CodeBlock language="python">{QUERY_SNIPPET}</CodeBlock>
              <p>
                We'll add this to our <code>starter.py</code>:
              </p>
              <CodeBlock language="python">{QUERY_FUNC}</CodeBlock>
            </section>

            <section className={styles.section} id="combining-signals-queries">
              <h2 className={styles.sectionTitle}>
                Combining Signals and Queries
              </h2>
              <p>
                Now that you've implemented both Signals and Queries
                separately, let's combine them into a single interactive
                experience. Users can Query to inspect the current state
                without changing anything, and they can Signal to provide
                feedback that modifies the Workflow's behavior.
              </p>
              <p>
                Let's update our <code>send_user_decision</code> function in{" "}
                <code>starter.py</code> to support both operations:
              </p>
              <CodeBlock language="python">{COMBINED_DECISION_FUNC}</CodeBlock>
              <p>
                This function creates an interactive loop that gives users
                three options: <code>query</code>, <code>edit</code>, or{" "}
                <code>keep</code>.
              </p>

              <details>
                <summary>
                  Your <code>starter.py</code> should look like the
                  following:
                </summary>
                <CodeBlock language="python" title="starter.py">
                  {STARTER_COMBINED_FULL}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="complete-example">
              <h2 className={styles.sectionTitle}>Complete example</h2>
              <p>Here's how to put it all together:</p>
              <p>
                <strong>1. Start the Temporal server:</strong>
              </p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>

              <p>
                <strong>2. Run the Worker</strong> (in another terminal):
                Make sure you restart this to register our new changes.
              </p>
              <CodeBlock language="bash">uv run worker.py</CodeBlock>

              <p>
                <strong>3. Start the Workflow</strong> (in another terminal):
              </p>
              <CodeBlock language="bash">uv run starter.py</CodeBlock>

              <p>
                <strong>4. Interact with the Workflow:</strong>
              </p>
              <ul>
                <li>
                  Type <code>query</code> to view the current research (
                  <em>
                    you may have to wait a few seconds first for the LLM
                    call to complete. Watch your Web UI to see when this is
                    done.
                  </em>
                  )
                </li>
                <li>
                  Type <code>edit</code> to provide feedback and regenerate
                </li>
                <li>
                  Type <code>keep</code> to approve and generate the PDF
                </li>
              </ul>

              <p>
                <strong>5. Observe in the Web UI</strong> at{" "}
                <code>http://localhost:8233</code>:
              </p>
              <ul>
                <li>Notice that Queries don't create events in the history</li>
              </ul>
            </section>

            <section className={styles.section} id="key-takeaways">
              <h2 className={styles.sectionTitle}>Key takeaways</h2>
              <p>
                You've now built a complete{" "}
                <strong>interactive, durable AI application</strong> with
                Signals and Queries. Now, when interacting with our research
                application:
              </p>
              <ul>
                <li>Users can Query to review AI output</li>
                <li>Users can Signal to approve or request changes</li>
                <li>All interactions are durable through failures</li>
                <li>Workflows maintain complete state across crashes</li>
              </ul>

              <Admonition type="note">
                <p>
                  Learn more about how Signals and Queries work with our free{" "}
                  <a
                    href="https://learn.temporal.io/courses/interacting_with_workflows/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Interacting with Workflows course
                  </a>
                  .
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="whats-next">
              <h2 className={styles.sectionTitle}>What's next?</h2>
              <p>
                Your research application can generate content with LLMs,
                handle failures gracefully, and incorporate human feedback -
                all while maintaining durability through crashes and
                retries.
              </p>
              <p>
                In our next tutorial series, we'll show you how to create an
                agentic loop with Temporal. You'll learn how to coordinate
                multiple LLM calls, chain Activities together, and
                orchestrate complex AI workflows that combine autonomous
                agent behavior. This is where you'll see the full power of
                the agentic loop pattern and Temporal. Sign up{" "}
                <a
                  href="https://pages.temporal.io/get-updates-education"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>{" "}
                to get notified when that tutorial gets published.
              </p>

              <div className={styles.nextSection} style={{ marginTop: "32px" }}>
                <div className={styles.nextGrid}>
                  <Link
                    to="/tutorials/ai/building-durable-ai-applications/"
                    className={styles.nextCard}
                  >
                    <span className={styles.nextEyebrow}>Series overview</span>
                    <h3 className={styles.nextTitle}>
                      Building Durable AI Applications
                    </h3>
                    <p className={styles.nextBody}>
                      Return to the series landing page to revisit either
                      chapter or explore other AI tutorials.
                    </p>
                    <span className={styles.nextCta}>
                      Back to overview <span aria-hidden="true">&rarr;</span>
                    </span>
                  </Link>
                  <a
                    href="https://learn.temporal.io/courses/interacting_with_workflows/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.nextCard}
                  >
                    <span className={styles.nextEyebrow}>Free course</span>
                    <h3 className={styles.nextTitle}>
                      Interacting with Workflows
                    </h3>
                    <p className={styles.nextBody}>
                      Go deeper on Signals, Queries, and Updates with a
                      hands-on, self-paced course from Temporal.
                    </p>
                    <span className={styles.nextCta}>
                      Take the course <span aria-hidden="true">&rarr;</span>
                    </span>
                  </a>
                </div>
              </div>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/building-durable-ai-applications/01-durable-ai-with-temporal/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous: Part 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Durable AI with Temporal
                </span>
              </Link>
              <Link
                to="/tutorials/ai/building-durable-ai-applications/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &rarr;
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Back to series overview
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
