// Tutorial chapter 3 of 4: Build the agent Workflow and Worker.
// See ../index.js for shared canonical-source notes.

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
  { n: 1, label: "Build the toolkit", href: "/tutorials/ai/durable-ai-agent/" },
  { n: 2, label: "Define agent behavior", href: "/tutorials/ai/durable-ai-agent/agent-behavior/" },
  { n: 3, label: "Workflow & Worker", href: "/tutorials/ai/durable-ai-agent/workflow/" },
  { n: 4, label: "Run and observe", href: "/tutorials/ai/durable-ai-agent/run/" },
];

const TOC_ITEMS = [
  { id: "workflow", label: "Building the agent Workflow" },
  { id: "worker", label: "Building the Temporal Worker" },
];

const WORKFLOW_HELPERS_IMPORTS_PY = `from datetime import timedelta
from typing import Any, Callable, Deque, Dict

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

with workflow.unsafe.imports_passed_through():
    from activities.activities import AgentActivities
    from models.requests import ConversationHistory, ToolData, ToolPromptInput
    from prompts.agent_prompt_generators import (
        generate_missing_args_prompt,
        generate_tool_completion_prompt,
    )`;

const TIMEOUT_CONSTANTS_PY = `TOOL_ACTIVITY_START_TO_CLOSE_TIMEOUT = timedelta(seconds=30)
TOOL_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT = timedelta(minutes=30)
LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT = timedelta(seconds=30)
LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT = timedelta(minutes=30)`;

const HANDLE_TOOL_HEAD_PY = `async def handle_tool_execution(
    current_tool: str,
    tool_data: ToolData,
    add_message_callback: Callable[..., Any],
    prompt_queue: Deque[str],
) -> None:`;

const HANDLE_TOOL_BODY_PY = `    """Execute a tool after confirmation and handle its result."""
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
    prompt_queue.append(generate_tool_completion_prompt(current_tool, dynamic_result))`;

const HANDLE_MISSING_HEAD_PY = `async def handle_missing_args(
    current_tool: str,
    args: Dict[str, Any],
    tool_data: Dict[str, Any],
    prompt_queue: Deque[str],
) -> bool:`;

const HANDLE_MISSING_BODY_PY = `    """Check for missing arguments and handle them if found."""
    missing_args = [key for key, value in args.items() if value is None]

    if missing_args:
        prompt_queue.append(
            generate_missing_args_prompt(current_tool, tool_data, missing_args)
        )
        workflow.logger.info(
            f"Missing arguments for tool: {current_tool}: {' '.join(missing_args)}"
        )
        return True
    return False`;

const FORMAT_HISTORY_PY = `def format_history(conversation_history: ConversationHistory) -> str:
    """Format the conversation history into a single string."""
    return " ".join(str(msg["response"]) for msg in conversation_history["messages"])`;

const PROMPT_SUMMARY_PY = `def prompt_summary_with_history(
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
    return (context_instructions, actual_prompt)`;

const CAN_HEAD_PY = `async def continue_as_new_if_needed(
    conversation_history: ConversationHistory,
    prompt_queue: Deque[str],
    agent_goal: Any,
    max_turns: int,
    add_message_callback: Callable[..., Any],
) -> None:`;

const CAN_BODY_PY = `    """Handle workflow continuation if message limit is reached."""
    if len(conversation_history["messages"]) >= max_turns:
        summary_context, summary_prompt = prompt_summary_with_history(
            conversation_history
        )
        summary_input = ToolPromptInput(
            prompt=summary_prompt, context_instructions=summary_context
        )
        conversation_summary = await workflow.start_activity_method(
            AgentActivities.agent_toolPlanner,
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
        )`;

const IS_USER_PROMPT_PY = `# LLM-tagged prompts start with "###"
# all others are from the user
def is_user_prompt(prompt) -> bool:
    if prompt.startswith("###"):
        return False
    else:
        return True`;

const WORKFLOW_HELPERS_FULL_PY = `from datetime import timedelta
from typing import Any, Callable, Deque, Dict

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

with workflow.unsafe.imports_passed_through():
    from activities.activities import AgentActivities
    from models.requests import ConversationHistory, ToolData, ToolPromptInput
    from prompts.agent_prompt_generators import (
        generate_missing_args_prompt,
        generate_tool_completion_prompt,
    )


TOOL_ACTIVITY_START_TO_CLOSE_TIMEOUT = timedelta(seconds=30)
TOOL_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT = timedelta(minutes=30)
LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT = timedelta(seconds=30)
LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT = timedelta(minutes=30)


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


def format_history(conversation_history: ConversationHistory) -> str:
    """Format the conversation history into a single string."""
    return " ".join(str(msg["response"]) for msg in conversation_history["messages"])


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
            AgentActivities.agent_toolPlanner,
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


# LLM-tagged prompts start with "###"
# all others are from the user
def is_user_prompt(prompt) -> bool:
    if prompt.startswith("###"):
        return False
    else:
        return True`;

const WORKFLOW_IMPORTS_PY = `from collections import deque
from datetime import timedelta
from typing import Any, Deque, Dict, Optional, Union

from temporalio import workflow
from temporalio.common import RetryPolicy

from models.core import AgentGoal
from models.requests import (
    ConversationHistory,
    CurrentTool,
    EnvLookupInput,
    EnvLookupOutput,
    ToolData,
    ValidationInput,
)
from workflows import workflow_helpers as helpers
from workflows.workflow_helpers import (
    LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
    LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
)

with workflow.unsafe.imports_passed_through():
    from activities.activities import AgentActivities
    from models.requests import CombinedInput, ToolPromptInput
    from prompts.agent_prompt_generators import generate_genai_prompt

# Constants
MAX_TURNS_BEFORE_CONTINUE = 250`;

const WORKFLOW_CLASS_INIT_PY = `@workflow.defn
class AgentGoalWorkflow:
    """Workflow that manages tool execution with user confirmation and conversation history."""

    def __init__(self) -> None:
        self.conversation_history: ConversationHistory = {"messages": []}
        self.prompt_queue: Deque[str] = deque()
        self.chat_ended: bool = False
        self.tool_data: Optional[ToolData] = None
        self.goal: Optional[AgentGoal] = None
        self.waiting_for_confirm: bool = False
        self.show_tool_args_confirmation: bool = (
            True  # set from env file in activity lookup_wf_env_settings
        )
        self.confirmed: bool = (
            False  # indicates that we have confirmation to proceed to run tool
        )`;

const RUN_HEAD_PY = `    @workflow.run
    async def run(self, combined_input: CombinedInput) -> str:`;

const RUN_SETUP_PY = `        """Main workflow execution method."""
        # setup phase, starts with blank tool_params and agent_goal prompt as defined in tools/goal_registry.py
        params = combined_input.tool_params
        self.goal = combined_input.agent_goal

        await self.lookup_wf_env_settings()`;

const LOOKUP_ENV_PY = `    # look up env settings in an activity so they're part of history
    async def lookup_wf_env_settings(self) -> None:
        env_lookup_input = EnvLookupInput(
            show_confirm_env_var_name="SHOW_CONFIRM",
            show_confirm_default=True,
        )
        env_output: EnvLookupOutput = await workflow.execute_activity_method(
            AgentActivities.get_wf_env_vars,
            env_lookup_input,
            start_to_close_timeout=LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=5), backoff_coefficient=1
            ),
        )
        self.show_tool_args_confirmation = env_output.show_confirm`;

const RUN_FINISH_INIT_PY = `        if params and params.prompt_queue:
            self.prompt_queue.extend(params.prompt_queue)

        waiting_for_confirm: bool = False
        current_tool: Optional[CurrentTool] = None`;

const LOOP_WAIT_PY = `        while True:
            # wait indefinitely for input from signals - user_prompt, end_chat, or confirm as defined below
            await workflow.wait_condition(
                lambda: bool(self.prompt_queue) or self.chat_ended or self.confirmed
            )

            # handle chat should end. When chat ends, push conversation history to workflow results.
            if self.chat_ended:
                return f"{self.conversation_history}"`;

const LOOP_EXECUTE_TOOL_PY = `            # Execute the tool
            if self.ready_for_tool_execution() and current_tool is not None:
                await self.execute_tool(current_tool)
                continue`;

const READY_FOR_EXECUTION_PY = `    # define if we're ready for tool execution
    def ready_for_tool_execution(self) -> bool:

        return (
            self.confirmed and self.waiting_for_confirm and self.tool_data is not None
        )`;

const EXECUTE_TOOL_PY = `    # execute the tool - set self.waiting_for_confirm to False if we're not waiting for confirm anymore
    # (always the case if it works successfully)
    async def execute_tool(self, current_tool: CurrentTool) -> None:
        workflow.logger.info(
            f"workflow step: user has confirmed, executing the tool {current_tool}"
        )
        self.confirmed = False
        confirmed_tool_data = self.tool_data.copy()
        confirmed_tool_data["next"] = "confirm"
        self.add_message("user_confirmed_tool_run", confirmed_tool_data)

        # execute the tool by key as defined in tools/__init__.py
        await helpers.handle_tool_execution(
            current_tool,
            self.tool_data,
            self.add_message,
            self.prompt_queue,
        )

        self.waiting_for_confirm = False`;

const ADD_MESSAGE_PY = `    def add_message(self, actor: str, response: Union[str, Dict[str, Any]]) -> None:
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
        )`;

const VALIDATE_LOOP_PY = `            # process forward on the prompt queue if any
            if self.prompt_queue:
                # get most recent prompt
                prompt = self.prompt_queue.popleft()
                workflow.logger.info(
                    f"workflow step: processing message on the prompt queue, message is {prompt}"
                )

                # Validate user-provided prompts
                if helpers.is_user_prompt(prompt):
                    self.add_message("user", prompt)

                    # Validate the prompt before proceeding
                    validation_input = ValidationInput(
                        prompt=prompt,
                        conversation_history=self.conversation_history,
                        agent_goal=self.goal,
                    )
                    validation_result = await workflow.execute_activity_method(
                        AgentActivities.agent_validatePrompt,
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
                        continue`;

const GENERATE_PROMPT_LOOP_PY = `                # If valid, proceed with generating the context and prompt
                context_instructions = generate_genai_prompt(
                    agent_goal=self.goal,
                    conversation_history=self.conversation_history,
                    raw_json=self.tool_data,
                )`;

const TOOL_PLANNER_CALL_PY = `                prompt_input = ToolPromptInput(
                    prompt=prompt, context_instructions=context_instructions
                )

                # connect to LLM and execute to get next steps
                tool_data = await workflow.execute_activity_method(
                    AgentActivities.agent_toolPlanner,
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

                workflow.logger.info(
                    f"next_step: {next_step}, current tool is {current_tool}"
                )`;

const NEXT_STEP_DECISION_PY = `                # make sure we're ready to run the tool & have everything we need
                if next_step == "confirm" and current_tool:
                    args = tool_data.get("args", {})
                    # if we're missing arguments, ask for them
                    if await helpers.handle_missing_args(
                        current_tool, args, tool_data, self.prompt_queue
                    ):
                        continue

                    self.waiting_for_confirm = True

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
                    return str(self.conversation_history)`;

const CAN_CALL_PY = `                self.add_message("agent", tool_data)
                await helpers.continue_as_new_if_needed(
                    self.conversation_history,
                    self.prompt_queue,
                    self.goal,
                    MAX_TURNS_BEFORE_CONTINUE,
                    self.add_message,
                )`;

const USER_PROMPT_SIGNAL_PY = `    # Signal that comes from api/main.py via a post to /send-prompt
    @workflow.signal
    async def user_prompt(self, prompt: str) -> None:
        """Signal handler for receiving user prompts."""
        workflow.logger.info(f"signal received: user_prompt, prompt is {prompt}")
        if self.chat_ended:
            workflow.logger.info(f"Message dropped due to chat closed: {prompt}")
            return
        self.prompt_queue.append(prompt)`;

const CONFIRM_SIGNAL_PY = `    # Signal that comes from api/main.py via a post to /confirm
    @workflow.signal
    async def confirm(self) -> None:
        """Signal handler for user confirmation of tool execution."""
        workflow.logger.info("Received user signal: confirmation")
        self.confirmed = True`;

const END_CHAT_SIGNAL_PY = `    # Signal that comes from api/main.py via a post to /end-chat
    @workflow.signal
    async def end_chat(self) -> None:
        """Signal handler for ending the chat session."""
        workflow.logger.info("signal received: end_chat")
        self.chat_ended = True`;

const HISTORY_QUERY_PY = `    @workflow.query
    def get_conversation_history(self) -> ConversationHistory:
        """Query handler to retrieve the full conversation history."""
        return self.conversation_history`;

const TOOL_DATA_QUERY_PY = `    @workflow.query
    def get_latest_tool_data(self) -> Optional[ToolData]:
        """Query handler to retrieve the latest tool data response if available."""
        return self.tool_data`;

const WAIT_SNIPPET_PY = `        while True:
            # wait indefinitely for input from signals - user_prompt, end_chat, or confirm as defined below
            await workflow.wait_condition(
                lambda: bool(self.prompt_queue) or self.chat_ended or self.confirmed
            )`;

const WORKFLOW_FULL_PY = `from collections import deque
from datetime import timedelta
from typing import Any, Deque, Dict, Optional, Union

from temporalio import workflow
from temporalio.common import RetryPolicy

from models.core import AgentGoal
from models.requests import (
    ConversationHistory,
    CurrentTool,
    EnvLookupInput,
    EnvLookupOutput,
    ToolData,
    ValidationInput,
)
from workflows import workflow_helpers as helpers
from workflows.workflow_helpers import (
    LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
    LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
)

with workflow.unsafe.imports_passed_through():
    from activities.activities import AgentActivities
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
        self.chat_ended: bool = False
        self.tool_data: Optional[ToolData] = None
        self.goal: Optional[AgentGoal] = None
        self.waiting_for_confirm: bool = False
        self.show_tool_args_confirmation: bool = (
            True  # set from env file in activity lookup_wf_env_settings
        )
        self.confirmed: bool = (
            False  # indicates that we have confirmation to proceed to run tool
        )

    # see ../api/main.py#temporal_client.start_workflow() for how the input parameters are set
    @workflow.run
    async def run(self, combined_input: CombinedInput) -> str:
        """Main workflow execution method."""
        # setup phase, starts with blank tool_params and agent_goal prompt as defined in tools/goal_registry.py
        params = combined_input.tool_params
        self.goal = combined_input.agent_goal

        await self.lookup_wf_env_settings()

        if params and params.prompt_queue:
            self.prompt_queue.extend(params.prompt_queue)

        current_tool: Optional[CurrentTool] = None

        while True:
            await workflow.wait_condition(
                lambda: bool(self.prompt_queue) or self.chat_ended or self.confirmed
            )

            if self.chat_ended:
                workflow.logger.info("Chat-end signal received. Chat ending.")
                return f"{self.conversation_history}"

            if self.ready_for_tool_execution() and current_tool is not None:
                await self.execute_tool(current_tool)
                continue

            if self.prompt_queue:
                prompt = self.prompt_queue.popleft()
                workflow.logger.info(
                    f"workflow step: processing message on the prompt queue, message is {prompt}"
                )

                if helpers.is_user_prompt(prompt):
                    self.add_message("user", prompt)
                    validation_input = ValidationInput(
                        prompt=prompt,
                        conversation_history=self.conversation_history,
                        agent_goal=self.goal,
                    )
                    validation_result = await workflow.execute_activity_method(
                        AgentActivities.agent_validatePrompt,
                        args=[validation_input],
                        schedule_to_close_timeout=LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
                        start_to_close_timeout=LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
                        retry_policy=RetryPolicy(
                            initial_interval=timedelta(seconds=5), backoff_coefficient=1
                        ),
                    )

                    if not validation_result.validationResult:
                        workflow.logger.warning(
                            f"Prompt validation failed: {validation_result.validationFailedReason}"
                        )
                        self.add_message(
                            "agent", validation_result.validationFailedReason
                        )
                        continue

                context_instructions = generate_genai_prompt(
                    agent_goal=self.goal,
                    conversation_history=self.conversation_history,
                    raw_json=self.tool_data,
                )

                prompt_input = ToolPromptInput(
                    prompt=prompt, context_instructions=context_instructions
                )

                tool_data = await workflow.execute_activity_method(
                    AgentActivities.agent_toolPlanner,
                    prompt_input,
                    schedule_to_close_timeout=LLM_ACTIVITY_SCHEDULE_TO_CLOSE_TIMEOUT,
                    start_to_close_timeout=LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
                    retry_policy=RetryPolicy(
                        initial_interval=timedelta(seconds=5), backoff_coefficient=1
                    ),
                )

                tool_data["force_confirm"] = self.show_tool_args_confirmation
                self.tool_data = ToolData(**tool_data)

                next_step = tool_data.get("next")
                current_tool: Optional[CurrentTool] = tool_data.get("tool")

                workflow.logger.info(
                    f"next_step: {next_step}, current tool is {current_tool}"
                )

                if next_step == "confirm" and current_tool:
                    args = tool_data.get("args", {})
                    if await helpers.handle_missing_args(
                        current_tool, args, tool_data, self.prompt_queue
                    ):
                        continue

                    self.waiting_for_confirm = True

                    if self.show_tool_args_confirmation:
                        self.confirmed = False
                        workflow.logger.info("Waiting for user confirm signal...")
                    else:
                        self.confirmed = True

                elif next_step == "done":
                    self.add_message("agent", tool_data)
                    return str(self.conversation_history)

                self.add_message("agent", tool_data)
                await helpers.continue_as_new_if_needed(
                    self.conversation_history,
                    self.prompt_queue,
                    self.goal,
                    MAX_TURNS_BEFORE_CONTINUE,
                    self.add_message,
                )

    async def lookup_wf_env_settings(self) -> None:
        env_lookup_input = EnvLookupInput(
            show_confirm_env_var_name="SHOW_CONFIRM",
            show_confirm_default=True,
        )
        env_output: EnvLookupOutput = await workflow.execute_activity_method(
            AgentActivities.get_wf_env_vars,
            env_lookup_input,
            start_to_close_timeout=LLM_ACTIVITY_START_TO_CLOSE_TIMEOUT,
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=5), backoff_coefficient=1
            ),
        )
        self.show_tool_args_confirmation = env_output.show_confirm

    def ready_for_tool_execution(self) -> bool:
        return (
            self.confirmed and self.waiting_for_confirm and self.tool_data is not None
        )

    async def execute_tool(self, current_tool: CurrentTool) -> None:
        workflow.logger.info(
            f"workflow step: user has confirmed, executing the tool {current_tool}"
        )
        self.confirmed = False
        confirmed_tool_data = self.tool_data.copy()
        confirmed_tool_data["next"] = "confirm"
        self.add_message("user_confirmed_tool_run", confirmed_tool_data)

        await helpers.handle_tool_execution(
            current_tool,
            self.tool_data,
            self.add_message,
            self.prompt_queue,
        )

        self.waiting_for_confirm = False

    def add_message(self, actor: str, response: Union[str, Dict[str, Any]]) -> None:
        if isinstance(response, dict):
            response_str = str(response)
            workflow.logger.debug(f"Adding {actor} message: {response_str[:100]}...")
        else:
            workflow.logger.debug(f"Adding {actor} message: {response[:100]}...")

        self.conversation_history["messages"].append(
            {"actor": actor, "response": response}
        )

    @workflow.signal
    async def user_prompt(self, prompt: str) -> None:
        workflow.logger.info(f"signal received: user_prompt, prompt is {prompt}")
        if self.chat_ended:
            workflow.logger.info(f"Message dropped due to chat closed: {prompt}")
            return
        self.prompt_queue.append(prompt)

    @workflow.signal
    async def confirm(self) -> None:
        workflow.logger.info("Received user signal: confirmation")
        self.confirmed = True

    @workflow.signal
    async def end_chat(self) -> None:
        workflow.logger.info("signal received: end_chat")
        self.chat_ended = True

    @workflow.query
    def get_conversation_history(self) -> ConversationHistory:
        return self.conversation_history

    @workflow.query
    def get_latest_tool_data(self) -> Optional[ToolData]:
        return self.tool_data`;

const WORKFLOW_TREE = `temporal-ai-agent/
├── .env
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
├── uv.lock
├── activities/
|   ├── __init__.py
|   └── activities.py
├── models/
│   ├── __init__.py
│   ├── core.py
│   └── requests.py
├── prompts/
│   ├── __init__.py
│   ├── agent_prompt_generators.py
│   └── prompts.py
├── scripts/
│   ├── create_invoice_test.py
│   ├── find_events_test.py
│   └── search_flights_test.py
├── tools/
│   ├── __init__.py
│   ├── create_invoice.py
│   ├── find_events.py
│   ├── goal_registry.py
│   ├── search_flights.py
│   ├── tool_registry.py
│   └── data/
|       └── find_events_data.json
└── workflows/
    ├── __init__.py
    ├── agent_goal_workflow.py
    └── workflow_helpers.py`;

const CONFIG_IMPORTS_PY = `import os

from dotenv import load_dotenv
from temporalio.client import Client
from temporalio.service import TLSConfig`;

const CONFIG_ENV_PY = `load_dotenv(override=True)

# Temporal connection settings
TEMPORAL_ADDRESS = os.getenv("TEMPORAL_ADDRESS", "localhost:7233")
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")
TEMPORAL_TASK_QUEUE = os.getenv("TEMPORAL_TASK_QUEUE", "agent-task-queue")

# Authentication settings
TEMPORAL_TLS_CERT = os.getenv("TEMPORAL_TLS_CERT", "")
TEMPORAL_TLS_KEY = os.getenv("TEMPORAL_TLS_KEY", "")
TEMPORAL_API_KEY = os.getenv("TEMPORAL_API_KEY", "")`;

const GET_CLIENT_PY = `async def get_temporal_client() -> Client:
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
            client_key = f.read()
        tls_config = TLSConfig(
            client_cert=client_cert,
            client_private_key=client_key,
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
    )`;

const WORKER_IMPORTS_PY = `import asyncio
import concurrent.futures
import logging
import os

from dotenv import load_dotenv
from temporalio.worker import Worker

from activities.activities import AgentActivities, dynamic_tool_activity
from shared.config import TEMPORAL_TASK_QUEUE, get_temporal_client
from workflows.agent_goal_workflow import AgentGoalWorkflow`;

const WORKER_MAIN_INIT_PY = `async def main():
    # Load environment variables
    load_dotenv(override=True)

    # Print LLM configuration info
    llm_model = os.environ.get("LLM_MODEL", "openai/gpt-4")
    print(f"Worker will use LLM model: {llm_model}")

    # Create the client
    client = await get_temporal_client()

    # Initialize the activities class
    activities = AgentActivities()
    print(f"AgentActivities initialized with LLM model: {llm_model}")

    print("Worker ready to process tasks!")
    logging.basicConfig(level=logging.WARN)`;

const WORKER_RUN_PY = `    # Run the worker
    with concurrent.futures.ThreadPoolExecutor(max_workers=100) as activity_executor:
        worker = Worker(
            client,
            task_queue=TEMPORAL_TASK_QUEUE,
            workflows=[AgentGoalWorkflow],
            activities=[
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
    asyncio.run(main())`;

const TEMPORAL_START_OUTPUT = `CLI 1.1.1 (Server 1.25.1, UI 2.31.2)

Server:  localhost:7233
UI:      http://localhost:8233
Metrics: http://localhost:53697/metrics`;

const WORKER_OUTPUT = `Worker will use LLM model: openai/gpt-4o
Address: localhost:7233, Namespace default
(If unset, then will try to connect to local server)
AgentActivities initialized with LLM model: openai/gpt-4o
Worker ready to process tasks!
Starting worker, connecting to task queue: agent-task-queue
Ready to begin processing...`;

const WORKER_TREE = `temporal-ai-agent/
├── .env
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
├── uv.lock
├── activities/
|   ├── __init__.py
|   └── activities.py
├── models/
│   ├── __init__.py
│   ├── core.py
│   └── requests.py
├── prompts/
│   ├── __init__.py
│   ├── agent_prompt_generators.py
│   └── prompts.py
├── scripts/
│   ├── create_invoice_test.py
│   ├── find_events_test.py
│   └── search_flights_test.py
├── tools/
│   ├── __init__.py
│   ├── create_invoice.py
│   ├── find_events.py
│   ├── goal_registry.py
│   ├── search_flights.py
│   ├── tool_registry.py
│   └── data/
|       └── find_events_data.json
├── worker/
│   └── worker.py
└── workflows/
    ├── __init__.py
    ├── agent_goal_workflow.py
    └── workflow_helpers.py`;

export default function Chapter3Page() {
  return (
    <Layout
      title="Build the agent Workflow and Worker - Build a durable AI agent"
      description="Chapter 3: Build the Temporal Workflow that orchestrates the agent and run a Worker to execute it."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="Build a durable AI agent with Temporal"
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
                  { label: "Durable AI Agent", href: "/tutorials/ai/durable-ai-agent/" },
                  { label: "Workflow & Worker" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Build the agent Workflow and Worker</h1>

            <MetaChips items={["~60 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              With your goal, Activities, and prompts in place, you'll now
              build the Temporal Workflow that orchestrates the agent's
              multi-turn conversation, then set up a Worker to execute it.
            </p>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Building the agent Workflow</h2>
              <p>
                Agents need to manage conversations that involve multiple
                turns including user interaction, tool execution, and state
                management. The challenge is maintaining coherence across
                these sessions while handling failures, retries, and
                long-running interactions. Your agent must coordinate several
                concurrent concerns such as validating user input against
                conversation context, determining when to execute tools,
                managing user input for tool execution, and maintaining
                conversation history that persists in the event of system
                failures. A traditional application would lose conversation
                state during failures, but Temporal Workflows provide durable
                execution that preserves context through any system
                interruption.
              </p>
              <p>
                In this step, you will create the Temporal Workflow that
                orchestrates your agent's conversation loop. This Workflow
                handles user interactions, validates prompts, manages tool
                execution, and maintains conversation state, all while
                providing durability to the agent.
              </p>

              <h3>Creating the workflows submodule</h3>
              <p>First, create the directory structure for your Workflow implementations:</p>
              <CodeBlock language="bash">mkdir workflows</CodeBlock>

              <p>
                Next, create an empty <code>__init__.py</code> file in the
                directory to enable it as a submodule:
              </p>
              <CodeBlock language="bash">touch workflows/__init__.py</CodeBlock>

              <p>
                Now that your <code>workflows</code> directory is a
                submodule, you will create a few helper functions for your
                Workflow.
              </p>

              <h3>Implementing a few Workflow helper functions</h3>
              <p>
                Before implementing the Workflow, you will implement a few
                helper functions that perform repetitive operations like
                tool execution, argument validation, and conversation
                continuation.
              </p>
              <p>
                First, create <code>workflows/workflow_helpers.py</code> and
                add the following import statements:
              </p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {WORKFLOW_HELPERS_IMPORTS_PY}
              </CodeBlock>
              <p>
                Like previous <code>import</code> statements, this section
                includes libraries from the Python standard library and
                Temporal libraries. However, there are also libraries being
                imported with the{" "}
                <code>with workflow.unsafe.imports_passed_through()</code>{" "}
                statement. This statement is necessary when importing
                third-party libraries, including ones you implement, into a
                Workflow (or in this case, imported into a file that will be
                imported by the Workflow). This is done for performance and
                determinism safety reasons, which you can read more about{" "}
                <a
                  href="https://docs.temporal.io/develop/python/python-sdk-sandbox#passthrough-modules"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  in the Temporal documentation
                </a>
                .
              </p>

              <p>Next, declare the following timeout constants:</p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {TIMEOUT_CONSTANTS_PY}
              </CodeBlock>
              <p>
                These timeout constants set sensible limits for tool
                execution and LLM calls, ensuring the calls have enough time
                to respond, but that the Workflow detects a failure within a
                reasonable amount of time.
              </p>

              <h4>Defining the tool execution Activity invocation function</h4>
              <p>
                The first function you'll implement is the{" "}
                <code>handle_tool_execution</code> function. Add the method
                header to the file:
              </p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {HANDLE_TOOL_HEAD_PY}
              </CodeBlock>
              <p>
                This function takes in the current tool to execute, the tool
                data, a callback that stores the conversation history, and a
                queue for prompts that the agent will execute later to
                continue its goal. The function executes the tool as a
                dynamic Activity, and processes the results for the LLM to
                handle.
              </p>

              <p>Add the code to invoke the Activity and process the results:</p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {HANDLE_TOOL_BODY_PY}
              </CodeBlock>
              <p>
                It executes the tool by calling the name of the tool, which
                gets handled by the dynamic Activity you implemented. When
                calling the Activity, you specify the Activity timeouts
                using the constants you defined earlier. Whether the
                Activity succeeds or fails, the result is stored to the
                conversation history using the{" "}
                <code>add_message_callback</code> that was passed in. Then,
                the method invokes the{" "}
                <code>generate_tool_completion_prompt</code> function with
                the <code>current_tool</code> and result of the tool
                execution to create a prompt and add it to the{" "}
                <code>prompt_queue</code>, which the agent will handle on
                its next iteration.
              </p>

              <h4>Defining the missing argument handler function</h4>
              <p>
                Next you'll create the function that checks and handles
                missing tool arguments. Add the function header with the
                following arguments:
              </p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {HANDLE_MISSING_HEAD_PY}
              </CodeBlock>
              <p>
                This function takes in the <code>current_tool</code>, the{" "}
                <code>args</code> that were passed to the tool, the{" "}
                <code>tool_data</code> containing all data related to the
                tool, and the <code>prompt_queue</code> containing prompts
                the LLM still needs to act on.
              </p>

              <p>Add the remaining code to check for any missing arguments:</p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {HANDLE_MISSING_BODY_PY}
              </CodeBlock>
              <p>
                The tool arguments are checked, and if any are missing, the{" "}
                <code>generate_missing_args_prompt</code> is invoked and the
                result is added to the <code>prompt_queue</code> for the
                agent to execute on its next turn. The function then returns{" "}
                <code>True</code>. Otherwise, no arguments were missing and
                the function returns <code>False</code>.
              </p>

              <h4>Defining the history formatting function</h4>
              <p>Next you'll define functions for formatting the conversation history.</p>
              <p>Add the following function to your code:</p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {FORMAT_HISTORY_PY}
              </CodeBlock>
              <p>
                This function compacts responses from every message in the
                conversation history and returns it as a single string.
              </p>

              <h4>Defining the history summarization prompt function</h4>
              <p>
                Now you'll use the previous function to generate a prompt for
                the LLM to summarize the conversation.
              </p>
              <p>Add the following function to your code:</p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {PROMPT_SUMMARY_PY}
              </CodeBlock>
              <p>
                The code calls the <code>format_history</code> function,
                then creates two variables, one containing the history and
                another containing the prompt. It then returns both
                variables as a tuple.
              </p>

              <h4>Defining the function to handle long Event Histories</h4>
              <p>
                Temporal Workflows have a limit on the length and size of a
                single Workflow Execution's Event History. A Temporal
                Workflow will{" "}
                <a
                  href="https://docs.temporal.io/workflow-execution/continue-as-new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>Continue-As-New</code>
                </a>{" "}
                when the Event History reaches these limits, and will{" "}
                <em>continue</em> the execution in a <em>new</em> Workflow
                Execution, which in turn creates new Event History. Due to
                the length of LLM responses, you will implement a function
                to determine if a <code>Continue-As-New</code> is needed.
              </p>

              <p>First, define the function header:</p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {CAN_HEAD_PY}
              </CodeBlock>
              <p>
                The function receives the <code>conversation_history</code>{" "}
                as your custom type, the <code>prompt_queue</code> as the
                pass-by-object <code>Deque</code> used to control the flow
                of prompts, the agent's goal, how many turns the
                conversation should last for, and a function callback to add
                this interaction to the conversation history.
              </p>

              <p>Next, add the function implementation:</p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {CAN_BODY_PY}
              </CodeBlock>
              <p>
                The function first checks if the conversation history's
                length is greater than or equal to the maximum number of
                turns specified. If this evaluates to <code>true</code>, the
                function proceeds with its <code>Continue-As-New</code>{" "}
                process. First it calls{" "}
                <code>prompt_summary_with_history</code> to create a summary
                and prompt context using the current history. It then uses
                this output to create an input type,{" "}
                <code>ToolPromptInput</code>, based off of this summary for
                the agent to process. Next it calls the{" "}
                <code>agent_toolPlanner</code> Activity with this input to
                invoke the LLM with this summarized context. It then calls
                the <code>add_message_callback</code> function, which adds
                this event to the conversation history. Finally, it invokes{" "}
                <code>workflow.continue_as_new</code> to perform the{" "}
                <code>Continue-As-New</code> operation, which results in a
                new Workflow Execution starting at this point in the Event
                History, and the current Workflow Execution closing.
              </p>

              <h4>Defining the prompt entity identification function</h4>
              <p>
                Finally, add a function that returns a boolean indicating
                whether the prompt came from a user or not:
              </p>
              <CodeBlock language="python" title="workflows/workflow_helpers.py">
                {IS_USER_PROMPT_PY}
              </CodeBlock>
              <p>
                LLM prompts start with <code>###</code>, so any prompt that
                doesn't begin with that character sequence is a user prompt.
              </p>

              <details>
                <summary>
                  The <code>workflows/workflow_helpers.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="workflows/workflow_helpers.py">
                  {WORKFLOW_HELPERS_FULL_PY}
                </CodeBlock>
              </details>

              <p>
                Now that you have built out the supporting functions, you
                can build the agent Workflow.
              </p>

              <h3>Preparing the core agent Workflow</h3>
              <p>
                The core agent Workflow is the primary driver of your agent.
                It orchestrates LLM and tool execution, maintains
                conversation state, and makes decisions about what step to
                take next. The Workflow will consist of the primary Workflow
                class and method, as well as a few Signals, Queries, and
                class methods.
              </p>
              <p>
                First, create <code>workflows/agent_goal_workflow.py</code>,
                and add the necessary imports:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {WORKFLOW_IMPORTS_PY}
              </CodeBlock>
              <p>
                These imports bring in the necessary types, helper
                functions, and constants you have defined so far, as well as
                libraries from the Temporal and Python standard library.
                You also added the <code>MAX_TURNS_BEFORE_CONTINUE</code>{" "}
                constant, and set the value to <code>250</code>. The agent
                will use this value with the{" "}
                <code>continue_as_new_if_needed</code> helper function you
                implemented to decide if it should{" "}
                <a
                  href="https://docs.temporal.io/workflow-execution/continue-as-new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>Continue-As-New</code>
                </a>
                . For the sake of this agent and its goal, <code>250</code>{" "}
                turns should be an adequate number.
              </p>

              <h4>Defining the agent class and constructor</h4>
              <p>
                You define a Temporal Workflow by creating a Python class.
                Create the <code>AgentGoalWorkflow</code> class, decorate it
                with <code>@workflow.defn</code>, and define the{" "}
                <code>__init__</code> method:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {WORKFLOW_CLASS_INIT_PY}
              </CodeBlock>
              <p>
                Your Workflow must be decorated with the{" "}
                <code>@workflow.defn</code> decorator. This is what
                distinguishes it as a Temporal Workflow. While a Workflow
                isn't required to have a <code>__init__</code> method, your
                agent will benefit from instance variables.
              </p>

              <table>
                <thead>
                  <tr><th>Variable</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>conversation_history</code></td><td>A record of the entire chat conversation history</td></tr>
                  <tr><td><code>prompt_queue</code></td><td>A queue maintaining tasks left for the agent to process</td></tr>
                  <tr><td><code>chat_ended</code></td><td>A boolean to determine if the chat has ended or not</td></tr>
                  <tr><td><code>tool_data</code></td><td>A record of the current tool data</td></tr>
                  <tr><td><code>goal</code></td><td>The agent's goal</td></tr>
                  <tr><td><code>waiting_for_confirm</code></td><td>A boolean signifying if the agent is ready to execute the tool</td></tr>
                  <tr><td><code>show_tool_args_confirmation</code></td><td>A boolean to determine if extra confirmation is necessary before executing tools</td></tr>
                  <tr><td><code>confirmed</code></td><td>A boolean for determining if the agent is confirmed to proceed</td></tr>
                </tbody>
              </table>

              <p>Next, you'll begin implementing the main Workflow method.</p>

              <h4>Defining the agent control variables</h4>
              <p>
                Every Temporal Workflow has a singular entry point, also
                known as the Workflow method. This method is decorated with
                the <code>@workflow.run</code> decorator. Your Workflow
                method will contain the primary business logic for your
                agent.
              </p>

              <p>Declare the method header for your agent's Workflow method:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {RUN_HEAD_PY}
              </CodeBlock>
              <p>
                The Workflow method must be decorated with the{" "}
                <code>@workflow.run</code> decorator, and must be
                implemented using Python's <code>asyncio</code> library.
                This method takes in one argument, a type you defined named{" "}
                <code>CombinedInput</code>, and returns a <code>str</code>.
                Recall that <code>CombinedInput</code> contains the{" "}
                <code>AgentGoal</code> and{" "}
                <code>AgentGoalWorkflowParams</code> types.
              </p>

              <p>
                Add the next few lines of code to the <code>run</code>{" "}
                method to assign values to a few parameters:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {RUN_SETUP_PY}
              </CodeBlock>
              <p>
                The last line calls a method,{" "}
                <code>lookup_wf_env_settings</code>, that hasn't been
                defined yet, so define that as a method within the{" "}
                <code>AgentGoalWorkflow</code> class but not within the
                scope of your <code>run</code> method:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {LOOKUP_ENV_PY}
              </CodeBlock>
              <p>
                This method invokes the <code>get_wf_env_vars</code>{" "}
                Activity to read the environment variables and store them
                appropriately.
              </p>

              <p>
                Next, add the final lines of code to finish instantiating the
                instance and local variables within the <code>run</code>{" "}
                method:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {RUN_FINISH_INIT_PY}
              </CodeBlock>
              <p>
                If the parameters include a prompt, they are added to the{" "}
                <code>prompt_queue</code> for the agent to process. The{" "}
                <code>prompt_queue</code> is the source of truth for tasks
                that the agent needs to execute to complete its goal. Tasks
                will be added throughout the lifecycle, which will drive
                execution forward.
              </p>
              <p>
                Finally, you set the waiting for confirmation variable to
                false and the current tool to None. These variables will
                change as the agent processes the various tasks to complete
                its goal.
              </p>
              <p>
                Now that you've defined the class and instantiated the
                control variables, you can build the core agent loop.
              </p>

              <h3>Implementing the core agent loop</h3>
              <p>
                The core of the agent's logic, processing, and validation
                takes place within a single main loop. Every iteration of
                the loop is considered a turn. The agent may perform an
                action in a turn, or set up an action to be performed on the
                next turn, and <code>continue</code> the loop to end its
                turn. This loop will run indefinitely until the agent
                determines it achieved its goal and returns the final
                result.
              </p>

              <h4>Handling the await conditions and exit condition</h4>
              <p>
                The first step is to create the loop and handle the await
                and exit conditions. Add the following lines of code within
                the run method directly following the{" "}
                <code>{`await self.lookup_wf_env_settings()`}</code> line:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {LOOP_WAIT_PY}
              </CodeBlock>
              <p>
                This section creates the loop, and then immediately awaits
                for a condition to become true so it can proceed. The
                conditions it's waiting on are for either something to be
                added to the <code>prompt_queue</code> so the agent has
                something to process, the chat ending either later in the
                loop or via Signal, or for the user to confirm execution.
                Once any of these three conditions is met, it continues
                execution. The agent then checks to see if the{" "}
                <code>self.chat_ended</code> instance variable is{" "}
                <code>True</code>, indicating that the agent can halt
                execution. If so, the agent will return the conversation
                history stored in the <code>self.conversation</code>{" "}
                instance variable, and the Workflow Execution will close.
              </p>

              <h4>Executing the tool</h4>
              <p>
                Next, your agent will determine if it is appropriate to
                execute a tool, and if it is, invoke an Activity to do so.
              </p>
              <p>Continue by adding the following code to execute the tool:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {LOOP_EXECUTE_TOOL_PY}
              </CodeBlock>
              <p>
                Before the agent executes a tool, the agent confirms that
                the tool meets the requirements for execution and that the
                current tool is not <code>None</code>. If both of these
                checks evaluate to <code>True</code>, the agent executes the
                tool. Once the tool has completed execution, it{" "}
                <code>continue</code>s the loop, meaning it skips all
                further execution and returns to the top of the loop, ready
                to begin another iteration.
              </p>

              <h4>Adding in a few more helper methods</h4>
              <p>
                Next, implement three helper methods that the tool execution
                code block called, but had not yet implemented.
              </p>
              <p>
                The first checks if the tool is ready for execution. Leave
                the <code>run</code> and append this new method to your
                class:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {READY_FOR_EXECUTION_PY}
              </CodeBlock>
              <p>
                This method checks if the user confirmed execution via{" "}
                <code>self.confirmed</code>, if the agent has confirmed it
                has the data it needs to execute via{" "}
                <code>self.waiting_for_confirm</code>, and if{" "}
                <code>self.tool_data</code> is set. If this evaluates to{" "}
                <code>True</code>, the tool is ready for execution and the
                method returns <code>True</code>.
              </p>

              <p>
                The second method executes the tool. Leave the{" "}
                <code>run</code> and append this new method to your class:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {EXECUTE_TOOL_PY}
              </CodeBlock>
              <p>
                This method resets the <code>self.confirmed</code> variable,
                makes a copy of the tool data to then modify, and adds a
                message to the conversation history with this modified tool
                data. It then uses the <code>handle_tool_execution</code>{" "}
                function to invoke the tool as an Activity. Once the
                Activity has completed, it returns the{" "}
                <code>waiting_for_confirm</code> variable. On a successful
                execution, the <code>self.waiting_for_confirm</code>{" "}
                instance variable is set to <code>False</code>, resetting
                it and preparing the agent for its next turn in the
                conversation.
              </p>

              <p>
                And finally, the <code>execute_tool</code> helper method
                called yet another helper method, the{" "}
                <code>add_message</code> method. This method adds messages
                to the conversation history.
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {ADD_MESSAGE_PY}
              </CodeBlock>
              <p>
                The method checks to see if the <code>response</code>{" "}
                parameter passed in is a <code>dict</code> or{" "}
                <code>str</code>. It then removes the first 100 characters,
                which contain boilerplate LLM response, and adds the
                message to the <code>self.conversation_history</code>{" "}
                instance variable.
              </p>

              <h4>Validating user prompts</h4>
              <p>
                Before processing any input from the user, the agent needs
                to validate it. You defined Activities in a prior section to
                validate the data, and now your Workflow will invoke them.
              </p>
              <p>Continue by adding the prompt processing logic within the core agent loop:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {VALIDATE_LOOP_PY}
              </CodeBlock>
              <p>
                The validation code first checks to see if there are any
                prompts in the queue. If so, it removes the most recent
                prompt for processing. Next it calls the{" "}
                <code>is_user_prompt</code> helper function you defined
                earlier to determine who the author of the prompt is. If
                the prompt is from the agent, the validation step is
                skipped. However, if the prompt is from a user, it is
                validated. The agent creates a <code>ValidationInput</code>{" "}
                variable containing the prompt, the conversation history,
                and the agent's goal. The agent then executes the{" "}
                <code>agent_validatePrompt</code> Activity, passing the{" "}
                <code>ValidationInput</code> variable as input. If the
                validation passes, the Workflow proceeds execution. However,
                if the validation fails, the agent logs the error, adds it
                to conversation history and resets to the beginning using{" "}
                <code>continue</code>, where it will inform the user of the
                error and await a response.
              </p>
              <p>
                It's important to recall that within{" "}
                <code>agent_validatePrompt</code>, regardless of success
                the Activity calls the <code>agent_toolPlanner</code>{" "}
                method. This provides a reason why the validation failed,
                if necessary.
              </p>

              <h4>Generating a context-aware prompt</h4>
              <p>
                Upon successful validation, the Workflow invokes another
                Activity to generate a context-aware prompt for the LLM to
                use.
              </p>
              <p>
                Continue by adding the call to the{" "}
                <code>generate_genai_prompt</code> function you implemented
                in the <code>prompts</code> submodule to your code:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {GENERATE_PROMPT_LOOP_PY}
              </CodeBlock>
              <p>
                This function call takes the agent's goal, the current
                conversation history, and the tool's data as input to
                generate the prompt. Recall that the tool data may be
                blank, for example, on the first iteration as a tool hasn't
                been selected. The prompt template handles this and only
                renders the data if it exists.
              </p>

              <h4>Executing the tool planner</h4>
              <p>
                Now that the prompt is constructed, you can use the LLM to
                plan which tool to use.
              </p>
              <p>
                Add the following code to call the{" "}
                <code>agent_toolPlanner</code> Activity and process the
                results:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {TOOL_PLANNER_CALL_PY}
              </CodeBlock>
              <p>
                Before the agent executes the Activity, it creates a
                variable using your type <code>ToolPromptInput</code> that
                contains the prompt and context. It then invokes the{" "}
                <code>agent_toolPlanner</code> Activity, passing in this
                variable. The Activity makes a call to the LLM with the
                prompt to determine what tool the agent should use to
                proceed with the next step of its goal, and returns the
                response as a <code>dict</code>. If the{" "}
                <code>SHOW_CONFIRM</code> environment variable was set to{" "}
                <code>True</code>, then the <code>force_confirm</code> key
                is also set to <code>True</code>. Next, the{" "}
                <code>self.tool_data</code> instance variable is updated
                with the data returned from the Activity execution. It then
                sets the <code>next_step</code> and{" "}
                <code>current_tool</code> variables to prepare for the next
                phase of execution.
              </p>

              <h4>Determining the <code>next_step</code></h4>
              <p>
                The <code>next_step</code> variable contains the next
                action the LLM decided the agent should take to achieve its
                goal. This variable can only contain the value{" "}
                <code>question</code>, <code>confirm</code>, and{" "}
                <code>done</code>, which the agent interprets and acts on.
                When the value is <code>question</code>, the agent asks a
                clarifying question of the user, such as requesting a
                missing parameter. This is handled automatically via the
                prompt. However, <code>confirm</code> and <code>done</code>{" "}
                require custom logic.
              </p>
              <p>Add the following code to implement the path for these options:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {NEXT_STEP_DECISION_PY}
              </CodeBlock>
              <p>
                If <code>next_step</code> is set to <code>confirm</code>,
                then the user confirmed their choice and the LLM has chosen
                to continue executing. If both <code>confirm</code> and{" "}
                <code>current_tool</code> have something assigned to them,
                the agent checks for missing arguments using the{" "}
                <code>handle_missing_args</code> function. Remember that if
                the <code>handle_missing_args</code> function determines an
                argument is missing, it adds a new prompt to the{" "}
                <code>prompt_queue</code> so the agent asks the user on the
                next turn. If an argument is missing, the prompt is added
                and the agent <code>continue</code>s, leading to the user
                being asked for the missing argument. If no argument is
                missing, then <code>self.waiting_for_confirm</code> is set
                to <code>True</code>, which indicates that the agent is
                ready to execute the tool.
              </p>
              <p>
                It then checks if <code>self.show_tools_args_confirmation</code>{" "}
                was set. If so, <code>self.confirmed</code> is set to{" "}
                <code>False</code>, forcing the user to confirm again on
                the next turn. Otherwise, <code>self.confirmed</code> is
                set to <code>True</code>, and the user approved the tool
                execution on the next turn.
              </p>
              <p>
                However, if <code>next_step</code> is set to{" "}
                <code>done</code>, the LLM determined that the goal is
                complete, and no more work is necessary. The agent wraps up
                by adding a final message to the conversation history, and
                then returns the conversation history, closing the Workflow
                Execution.
              </p>

              <h4>Handling a long running execution</h4>
              <p>
                The final segment of the agent loop handles long running
                execution. Temporal Workflows have a limit on the size of a
                single Workflow Execution's Event History. If the Event
                History is too long, then the agent should perform a{" "}
                <a
                  href="https://docs.temporal.io/workflow-execution/continue-as-new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>Continue-As-New</code>
                </a>{" "}
                operation to prevent a potential failure.
              </p>
              <p>
                Add the following code to check and execute a{" "}
                <code>Continue-As-New</code> if necessary:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {CAN_CALL_PY}
              </CodeBlock>
              <p>
                First, the current tool data is added to the conversation
                history. Before, you defined a helper function{" "}
                <code>continue_as_new_if_needed</code> to determine if the
                Workflow should perform the <code>Continue-As-New</code>{" "}
                operation. This function makes its decision based on the
                number of turns the agent completed prior to calling the
                function. If it is greater, then the agent performs the{" "}
                <code>Continue-As-New</code> operation.
              </p>

              <p>
                Finally, you are going to implement a method for external
                Temporal Clients to send and retrieve information to and
                from the Workflow Execution while it's running.
              </p>

              <h3>Communicating with the Workflow</h3>
              <p>
                Temporal Workflows allow data to be sent and retrieved
                during a running execution. These features are known as{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/workflow-message-passing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Signals and Queries
                </a>
                .
              </p>
              <p>
                Look back at the core event loop in the Workflow,
                specifically the <code>await</code> line at the very top of
                the loop:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {WAIT_SNIPPET_PY}
              </CodeBlock>
              <p>
                You may have noticed the <code>chat_ended</code> variable
                was never changed, or the user's input was never added to
                the <code>prompt_queue</code>. This is done via sending
                Signals to your running Workflow Execution.
              </p>

              <h4>Accepting the user's input</h4>
              <p>
                To accept user input and add it to the{" "}
                <code>prompt_queue</code>, define a Signal handler as a
                method within your <code>agent_goal_workflow.py</code>{" "}
                file, outside of the <code>run</code> function, and
                underneath your other helper functions.
              </p>
              <p>Add the Signal handler to your code:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {USER_PROMPT_SIGNAL_PY}
              </CodeBlock>
              <p>
                A Signal handler is an <code>async</code> method that is
                decorated with the <code>@workflow.signal</code> decorator.
                When the Signal is received, it is logged, and then the
                agent checks to see if the chat has ended. If it has, the
                Signal is dropped as no more processing work should take
                place. This is important, as it handles the edge case of
                the small amount of time between when the agent finishes,
                but prior to the Workflow Execution closing. Then the
                prompt is added to the end of the <code>prompt_queue</code>{" "}
                for the agent to eventually process.
              </p>

              <h4>Confirming the user's request</h4>
              <p>
                Another Signal to implement is the user confirming the use
                of a tool, specifically when <code>SHOW_CONFIRM</code> is
                set to <code>True</code>.
              </p>
              <p>Add the following Signal handler to the bottom of your file:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {CONFIRM_SIGNAL_PY}
              </CodeBlock>
              <p>
                This code implements the Signal handler method, decorates
                it with <code>@workflow.signal</code>, and logs that the
                Signal was received. It then sets the{" "}
                <code>self.confirmed</code> instance variable to{" "}
                <code>True</code>, which will unblock the main agent loop.
              </p>

              <h4>Ending the chat</h4>
              <p>
                The last Signal handler your agent needs is to allow the
                user to end the chat.
              </p>
              <p>Add the following Signal handler to the bottom of your file:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {END_CHAT_SIGNAL_PY}
              </CodeBlock>
              <p>
                Similar to the previous Signal handler, this is a decorated
                method that sets an instance variable to <code>True</code>,
                in this case the <code>self.chat_ended</code> variable.
              </p>
              <p>
                Sending information to a Workflow may not be the only
                action you want to do. You may also want to retrieve some
                information during its execution. Temporal provides this
                capability with <code>Queries</code>.
              </p>

              <h4>Retrieving the conversation history</h4>
              <p>
                Implementing a Query is similar to implementing a Signal:
                You define a method and decorate it. However, the method
                can't be <code>async</code>, and the decorator is{" "}
                <code>@workflow.query</code>.
              </p>
              <p>
                Add the following Query to the bottom of your file, to
                retrieve the conversation history:
              </p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {HISTORY_QUERY_PY}
              </CodeBlock>
              <p>
                This Query returns the current conversation history that is
                stored in the <code>self.conversation_history</code>{" "}
                instance variable.
              </p>

              <h4>Retrieving the latest tool data</h4>
              <p>The final Query returns the latest tool data.</p>
              <p>Add the following code to the bottom of your file to implement it:</p>
              <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                {TOOL_DATA_QUERY_PY}
              </CodeBlock>
              <p>
                This Query returns the current tool data, if available,
                that is stored in the <code>self.tool_data</code> instance
                variable.
              </p>
              <p>
                Your Workflow now has the necessary Signals and Queries for
                a client API to properly communicate with it and implement
                a user interface on top of it.
              </p>

              <details>
                <summary>
                  The <code>workflows/agent_goal_workflow.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="workflows/agent_goal_workflow.py">
                  {WORKFLOW_FULL_PY}
                </CodeBlock>
              </details>

              <p>
                This Workflow demonstrates the key patterns for building
                durable AI agents. It is event-driven, handling interactions
                with Signals and Queries, it validates user prompts and
                implements guardrails, it requires confirmation for tool
                execution, it maintains state and context across failures,
                and it's observable. The duration of the Workflow Execution
                is irrelevant. Thanks to Temporal, the session could go on
                for minutes, hours, days, or even weeks.
              </p>

              <details>
                <summary>Before moving on to the next section, verify your files and directory structure is correct.</summary>
                <CodeBlock>{WORKFLOW_TREE}</CodeBlock>
              </details>

              <p>
                In the next section, you will implement the Temporal
                Worker, which is responsible for executing your Workflow
                and Activities.
              </p>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Building the Temporal Worker</h2>
              <p>
                Temporal Workflows are not run by executing the{" "}
                <code>agent_goal_workflow.py</code> file. Workflows,
                Activities, Signal and Query handling, and all Temporal
                operations are handled by Temporal{" "}
                <a
                  href="https://docs.temporal.io/workers#worker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workers
                </a>
                .
              </p>

              <h3>Creating the Temporal client</h3>
              <p>
                A Worker uses a Temporal client to communicate with the
                Temporal service to coordinate execution. A Temporal client
                is also used to request execution of Temporal Workflows.
                Since this application will require multiple Temporal
                clients, you will implement a <code>shared</code> submodule
                that others can call to create a Temporal client. This
                reduces the need for duplicate code and potentially
                incorrectly setting the Task Queue.
              </p>
              <p>
                First, create the <code>shared</code> directory and a blank{" "}
                <code>__init__.py</code> file to create the submodule:
              </p>
              <CodeBlock language="bash">{`mkdir shared
touch shared/__init__.py`}</CodeBlock>

              <p>
                Next, create the file <code>config.py</code> within the{" "}
                <code>shared</code> directory and add the following{" "}
                <code>import</code> statements:
              </p>
              <CodeBlock language="python" title="shared/config.py">
                {CONFIG_IMPORTS_PY}
              </CodeBlock>

              <p>
                You'll then load in the environment variables you specified
                earlier. If you are running this tutorial using the local
                development server, these are commented out in your{" "}
                <code>.env</code> file and will use the default settings.
              </p>
              <CodeBlock language="python" title="shared/config.py">
                {CONFIG_ENV_PY}
              </CodeBlock>

              <p>Finally, add the code to configure a Temporal client:</p>
              <CodeBlock language="python" title="shared/config.py">
                {GET_CLIENT_PY}
              </CodeBlock>
              <p>
                This code checks whether or not you configured TLS certs for
                secure connection or a Temporal API key for connection to
                Temporal Cloud. It then returns a configured Temporal
                client, ready to communicate with the Temporal service.
              </p>

              <h3>Configuring the Worker</h3>
              <p>
                Now that you have a reusable way of creating a Temporal
                client, you can use that to configure your Temporal Worker.
              </p>
              <p>Start by creating the <code>worker</code> directory:</p>
              <CodeBlock language="bash">mkdir worker</CodeBlock>

              <p>
                Then, create the file <code>worker.py</code> in the{" "}
                <code>worker</code> directory and add the following{" "}
                <code>import</code> statements:
              </p>
              <CodeBlock language="python" title="worker/worker.py">
                {WORKER_IMPORTS_PY}
              </CodeBlock>
              <p>
                These <code>import</code> statements include libraries from
                the standard library, third-party packages such as{" "}
                <code>dotenv</code> and the <code>temporalio.worker</code>{" "}
                library, as well as a few of the libraries you implemented.
                A Worker must register the Workflows and Activities it
                intends to execute, so it must import them, as well as the
                function for creating the Temporal client.
              </p>

              <p>
                Next, create the <code>main</code> method and add the code
                responsible for initializing a few variables, including
                creating the Temporal client and creating an instance of
                your <code>AgentActivities</code> class.
              </p>
              <CodeBlock language="python" title="worker/worker.py">
                {WORKER_MAIN_INIT_PY}
              </CodeBlock>
              <p>
                This code loads in the environment variables from your{" "}
                <code>.env</code> file. It uses the <code>LLM_MODEL</code>{" "}
                environment variable to print which model the agent will
                call, defaulting to OpenAI's GPT-4 if none is set. It then
                creates a Temporal client, and an instance of your{" "}
                <code>AgentActivities</code> class before setting the log
                level to <code>WARN</code>.
              </p>

              <p>Finally, add the code to configure and start your Worker:</p>
              <CodeBlock language="python" title="worker/worker.py">
                {WORKER_RUN_PY}
              </CodeBlock>
              <p>
                The code creates a <code>ThreadPoolExecutor</code> for the
                Worker to use as the <code>activity_executor</code>. Since
                an agent's tools can be either <code>async</code> or not,
                you must use one of the synchronous safe methods for
                Activity execution. You can read more about this in{" "}
                <a
                  href="https://docs.temporal.io/develop/python/python-sdk-sync-vs-async"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the Python SDK documentation
                </a>
                .
              </p>
              <p>
                Next, the Worker object is created, passing in the{" "}
                <code>client</code>, the <code>task_queue</code>, the{" "}
                <code>activity_executor</code>, and then registering the
                individual Workflows and Activities the Worker can execute.
                The Worker is then started with{" "}
                <code>await worker.run()</code>, which creates a
                long-running process that will poll the Temporal service,
                executing Workflow and Activities when they are requested.
              </p>
              <p>
                Finally, the standard{" "}
                <code>{`if __name__ == "__main__"`}</code> calls the main
                function when you run <code>worker.py</code>, starting the
                Worker.
              </p>
              <p>Now that you have implemented your Worker, verify that it runs.</p>

              <h3>Testing the Worker</h3>
              <p>
                Before starting the Worker, you need to start a Temporal
                service. To start the local development server, open a
                terminal and run the following command:
              </p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                This starts a local Temporal service running on port 7233
                with the web UI running on port 8233. The output of this
                command should resemble (the exact version numbers may not
                match):
              </p>
              <CodeBlock>{TEMPORAL_START_OUTPUT}</CodeBlock>

              <p>Next, open another terminal and run your Worker:</p>
              <CodeBlock language="bash">uv run worker/worker.py</CodeBlock>

              <p>Your Worker should start, and the output should be:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>

              <p>
                The command will not exit, but will persist; this is
                expected. It is waiting for Workflows and Activity tasks
                to execute. If your Worker is running successfully, that's
                as much as you can test for the moment. Kill both the
                worker and Temporal service by pressing{" "}
                <code>CTRL-C</code> in each terminal.
              </p>

              <details>
                <summary>Before moving on to the next section, verify that your files and directory structure are correct.</summary>
                <CodeBlock>{WORKER_TREE}</CodeBlock>
              </details>

              <p>
                Next, you will implement a REST API that will serve as the
                backend service for invoking your agent.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/durable-ai-agent/agent-behavior/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 2
                </span>
                <span className={styles.chapterNavTitle}>
                  Define the agent's behavior
                </span>
              </Link>
              <Link
                to="/tutorials/ai/durable-ai-agent/run/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 4{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Run and observe the agent
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
