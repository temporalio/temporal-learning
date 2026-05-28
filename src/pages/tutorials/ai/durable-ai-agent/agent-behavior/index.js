// Tutorial chapter 2 of 4: Define the agent's behavior.
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
  { id: "agent-goal", label: "Designating the agent's goal" },
  { id: "activities", label: "Building Temporal Activities" },
  { id: "prompts", label: "Developing the necessary prompts" },
];

const AGENT_GOAL_DATACLASS_PY = `@dataclass
class AgentGoal:
    agent_name: str
    tools: List[ToolDefinition]
    description: str
    starter_prompt: str
    example_conversation_history: str`;

const MODELS_CORE_FULL_PY = `from dataclasses import dataclass
from typing import List


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
    )`;

const GOAL_REGISTRY_IMPORTS_PY = `import tools.tool_registry as tool_registry
from models.core import AgentGoal`;

const GOAL_HEAD_PY = `goal_event_flight_invoice = AgentGoal(
    agent_name="North America Event Flight Booking",
    # ...`;

const GOAL_TOOLS_PY = `    # ...
    tools=[
        tool_registry.find_events_tool,
        tool_registry.search_flights_tool,
        tool_registry.create_invoice_tool,
    ],
    # ...`;

const GOAL_DESCRIPTION_PY = `    # ...
    description="Help the user gather args for these tools in order: "
    "1. FindEvents: Find an event to travel to "
    "2. SearchFlights: search for a flight around the event dates "
    "3. CreateInvoice: Create a simple invoice for the cost of that flight ",
    # ...`;

const GOAL_STARTER_PROMPT_PY = `    # ...
    starter_prompt="Welcome me, give me a description of what you can do, then ask me for the details you need to do your job.",
    # ...`;

const GOAL_EXAMPLE_HISTORY_PY = `    # ...
    example_conversation_history="\\n ".join(
        [
            "user: I'd like to travel to an event",
            "agent: Sure! Let's start by finding an event you'd like to attend. I know about events in North American cities. Could you tell me which city and month you're interested in?",
            "user: nyc in may please",
            "agent: Great! Let's find an events in New York City in May.",
            "user_confirmed_tool_run: <user clicks confirm on FindEvents tool>",
            "tool_result: { 'event_name': 'Frieze New York City', 'event_date': '2023-05-01' }",
            "agent: Found an event! There's Frieze New York City on May 1 2025, ending on May 14 2025. Would you like to search for flights around these dates?",
            "user: Yes, please",
            "agent: Let's search for flights around these dates. Could you provide your departure city?",
            "user: San Francisco",
            "agent: Thanks, searching for flights from San Francisco to New York City around 2023-02-25 to 2023-02-28.",
            "user_confirmed_tool_run: <user clicks confirm on SearchFlights tool>"
            'tool_result: results including {"flight_number": "AA101", "return_flight_number": "AA102", "price": 850.0}',
            "agent: Found some flights! The cheapest is AA101 for $850. Would you like to generate an invoice for this flight?",
            "user_confirmed_tool_run: <user clicks confirm on CreateInvoice tool>",
            'tool_result: { "status": "success", "invoice": { "flight_number": "AA101", "amount": 850.0 }, invoiceURL: "https://example.com/invoice" }',
            "agent: Invoice generated! Here's the link: https://example.com/invoice",
        ]
    ),
)`;

const GOAL_REGISTRY_FULL_PY = `import tools.tool_registry as tool_registry
from models.core import AgentGoal

goal_event_flight_invoice = AgentGoal(
    agent_name="North America Event Flight Booking",
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
    example_conversation_history="\\n ".join(
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
            'tool_result: results including {"flight_number": "AA101", "return_flight_number": "AA102", "price": 850.0}',
            "agent: Found some flights! The cheapest is AA101 for $850. Would you like to generate an invoice for this flight?",
            "user_confirmed_tool_run: <user clicks confirm on CreateInvoice tool>",
            'tool_result: { "status": "success", "invoice": { "flight_number": "AA101", "amount": 850.0 }, invoiceURL: "https://example.com/invoice" }',
            "agent: Invoice generated! Here's the link: https://example.com/invoice",
        ]
    ),
)`;

const GOAL_TREE = `temporal-ai-agent/
├── .env
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
├── uv.lock
├── models/
│   ├── __init__.py
│   └── core.py
├── scripts/
│   ├── create_invoice_test.py
│   ├── find_events_test.py
│   └── search_flights_test.py
└── tools/
    ├── __init__.py
    ├── create_invoice.py
    ├── find_events.py
    ├── goal_registry.py
    ├── search_flights.py
    ├── tool_registry.py
    └── data/
        └── find_events_data.json`;

const REQUESTS_IMPORTS_PY = `from dataclasses import dataclass, field
from typing import Any, Deque, Dict, List, Literal, Optional, TypedDict, Union

from models.core import AgentGoal`;

const REQUESTS_ALIASES_PY = `Message = Dict[str, Union[str, Dict[str, Any]]]
ConversationHistory = Dict[str, List[Message]]
NextStep = Literal["confirm", "question", "done"]
CurrentTool = str`;

const REQUESTS_PARAMS_PY = `@dataclass
class AgentGoalWorkflowParams:
    conversation_summary: Optional[str] = None
    prompt_queue: Optional[Deque[str]] = None


@dataclass
class CombinedInput:
    agent_goal: AgentGoal
    tool_params: AgentGoalWorkflowParams`;

const REQUESTS_TOOL_PROMPT_PY = `@dataclass
class ToolPromptInput:
    prompt: str
    context_instructions: str`;

const REQUESTS_VALIDATION_PY = `@dataclass
class ValidationInput:
    prompt: str
    conversation_history: ConversationHistory
    agent_goal: AgentGoal


@dataclass
class ValidationResult:
    validationResult: bool
    validationFailedReason: Dict[str, Any] = field(default_factory=dict)`;

const REQUESTS_ENV_PY = `@dataclass
class EnvLookupInput:
    show_confirm_env_var_name: str
    show_confirm_default: bool


@dataclass
class EnvLookupOutput:
    show_confirm: bool`;

const REQUESTS_TOOL_DATA_PY = `class ToolData(TypedDict, total=False):
    next: NextStep
    tool: str
    response: str
    args: Dict[str, Any]
    force_confirm: bool`;

const REQUESTS_FULL_PY = `from dataclasses import dataclass, field
from typing import Any, Deque, Dict, List, Literal, Optional, TypedDict, Union

from models.core import AgentGoal

# Common type aliases

Message = Dict[str, Union[str, Dict[str, Any]]]
ConversationHistory = Dict[str, List[Message]]
NextStep = Literal["confirm", "question", "pick-new-goal", "done"]
CurrentTool = str


class ToolData(TypedDict, total=False):
    next: NextStep
    tool: str
    response: str
    args: Dict[str, Any]
    force_confirm: bool


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
`;

const ACTIVITIES_IMPORTS_PY = `import inspect
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

load_dotenv(override=True)`;

const AGENT_ACTIVITIES_INIT_PY = `class AgentActivities:
    def __init__(self):
        """Initialize LLM client using LiteLLM."""
        self.llm_model = os.environ.get("LLM_MODEL", "openai/gpt-4")
        self.llm_key = os.environ.get("LLM_KEY")
        self.llm_base_url = os.environ.get("LLM_BASE_URL")
        activity.logger.info(
            f"Initializing AgentActivities with LLM model: {self.llm_model}"
        )
        if self.llm_base_url:
            activity.logger.info(f"Using custom base URL: {self.llm_base_url}")`;

const SANITIZE_JSON_PY = `    def sanitize_json_response(self, response_content: str) -> str:
        """
        Sanitizes the response content to ensure it's valid JSON.
        """
        # Remove any markdown code block markers
        response_content = response_content.replace("\`\`\`json", "").replace("\`\`\`", "")

        # Remove any leading/trailing whitespace
        response_content = response_content.strip()

        return response_content`;

const PARSE_JSON_PY = `    def parse_json_response(self, response_content: str) -> dict:
        """
        Parses the JSON response content and returns it as a dictionary.
        """
        try:
            data = json.loads(response_content)
            return data
        except json.JSONDecodeError as e:
            activity.logger.error(f"Invalid JSON: {e}")
            raise`;

const TOOL_PLANNER_HEAD_PY = `    @activity.defn
    async def agent_toolPlanner(self, input: ToolPromptInput) -> dict:`;

const TOOL_PLANNER_MESSAGES_PY = `        messages = [
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
        ]`;

const TOOL_PLANNER_TRY_PY = `        try:
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
            raise`;

const TOOL_PLANNER_FULL_PY = `    @activity.defn
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
            raise`;

const VALIDATE_PROMPT_HEAD_PY = `    @activity.defn
    async def agent_validatePrompt(
        self, validation_input: ValidationInput
    ) -> ValidationResult:
        """
        Validates the prompt in the context of the conversation history and agent goal.
        Returns a ValidationResult indicating if the prompt makes sense given the context.
        """`;

const VALIDATE_TOOLS_DESC_PY = `        # Create simple context string describing tools and goals
        tools_description = []
        for tool in validation_input.agent_goal.tools:
            tool_str = f"Tool: {tool.name}\\n"
            tool_str += f"Description: {tool.description}\\n"
            tool_str += "Arguments: " + ", ".join(
                [f"{arg.name} ({arg.type})" for arg in tool.arguments]
            )
            tools_description.append(tool_str)
        tools_str = "\\n".join(tools_description)`;

const VALIDATE_HISTORY_PY = `        # Convert conversation history to string
        history_str = json.dumps(validation_input.conversation_history, indent=2)

        # Create context instructions
        context_instructions = f"""The agent goal and tools are as follows:
            Description: {validation_input.agent_goal.description}
            Available Tools:
            {tools_str}
            The conversation history to date is:
            {history_str}"""`;

const VALIDATE_PROMPT_TEXT_PY = `        # Create validation prompt
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
            """`;

const VALIDATE_CALL_PY = `        # Call the LLM with the validation prompt
        prompt_input = ToolPromptInput(
            prompt=validation_prompt, context_instructions=context_instructions
        )

        result = await self.agent_toolPlanner(prompt_input)

        return ValidationResult(
            validationResult=result.get("validationResult", False),
            validationFailedReason=result.get("validationFailedReason", {}),
        )`;

const VALIDATE_FULL_PY = `@activity.defn
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
            tool_str = f"Tool: {tool.name}\\n"
            tool_str += f"Description: {tool.description}\\n"
            tool_str += "Arguments: " + ", ".join(
                [f"{arg.name} ({arg.type})" for arg in tool.arguments]
            )
            tools_description.append(tool_str)
        tools_str = "\\n".join(tools_description)

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
        )`;

const ENV_VARS_PY = `    @activity.defn
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

        return output`;

const DYNAMIC_TOOL_PY = `@activity.defn(dynamic=True)
async def dynamic_tool_activity(args: Sequence[RawValue]) -> dict:
    from tools.tool_registry import get_handler

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
    return result`;

const ACTIVITIES_FULL_PY = `import inspect
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


class AgentActivities:
    def __init__(self):
        """Initialize LLM client using LiteLLM."""
        self.llm_model = os.environ.get("LLM_MODEL", "openai/gpt-4")
        self.llm_key = os.environ.get("LLM_KEY")
        self.llm_base_url = os.environ.get("LLM_BASE_URL")
        activity.logger.info(
            f"Initializing AgentActivities with LLM model: {self.llm_model}"
        )
        if self.llm_base_url:
            activity.logger.info(f"Using custom base URL: {self.llm_base_url}")

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
            tool_str = f"Tool: {tool.name}\\n"
            tool_str += f"Description: {tool.description}\\n"
            tool_str += "Arguments: " + ", ".join(
                [f"{arg.name} ({arg.type})" for arg in tool.arguments]
            )
            tools_description.append(tool_str)
        tools_str = "\\n".join(tools_description)

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

    def sanitize_json_response(self, response_content: str) -> str:
        """
        Sanitizes the response content to ensure it's valid JSON.
        """
        # Remove any markdown code block markers
        response_content = response_content.replace("\`\`\`json", "").replace("\`\`\`", "")

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


@activity.defn(dynamic=True)
async def dynamic_tool_activity(args: Sequence[RawValue]) -> dict:
    from tools.tool_registry import get_handler

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
    return result`;

const ACTIVITIES_TREE = `temporal-ai-agent/
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
├── scripts/
│   ├── create_invoice_test.py
│   ├── find_events_test.py
│   └── search_flights_test.py
└── tools/
    ├── __init__.py
    ├── create_invoice.py
    ├── find_events.py
    ├── goal_registry.py
    ├── search_flights.py
    ├── tool_registry.py
    └── data/
        └── find_events_data.json`;

const PROMPTS_IMPORT_PY = `from jinja2 import Template`;

const GENAI_PROMPT_PART1_PY = `GENAI_PROMPT = Template(
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
"""`;

const GENAI_PROMPT_PART2_PY = `"""
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
"""`;

const GENAI_PROMPT_PART3_PY = `"""
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
2) ALWAYS ask a question in your response if next='question'.
3) ALWAYS set next='confirm' if you have arguments
 And respond with "let's proceed with <tool> (and any other useful info)"
 DON'T set next='confirm' if you have a question to ask.
EXAMPLE: If you have a question to ask, set next='question' and ask the user.
4) You can carry over arguments from one tool to another.
 EXAMPLE: If you asked for an account ID, then use the conversation history to infer that argument going forward.
5) If ListAgents in the conversation history is force_confirm='False', you MUST check if the current tool contains userConfirmation. If it does, please ask the user to confirm details with the user. userConfirmation overrides force_confirm='False'.
EXAMPLE: (force_confirm='False' AND userConfirmation exists on tool) Would you like me to <run tool> with the following details: <details>?
"""`;

const GENAI_PROMPT_VALIDATION_PY = `"""
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
)`;

const TOOL_COMPLETION_PROMPT_PY = `TOOL_COMPLETION_PROMPT = """### The '{current_tool}' tool completed successfully
with {dynamic_result}.
INSTRUCTIONS: Parse this tool result as plain text, and use the system prompt
containing the list of tools in sequence and the conversation history (and
previous tool_results) to figure out next steps, if any.
You will need to use the tool_results to auto-fill arguments for subsequent
tools and also to figure out if all tools have been run.
{{"next": "<question|confirm|pick-new-goal|done>", "tool": "<tool_name or null>", "args": {{"<arg1>": "<value1 or null>", "<arg2>": "<value2 or null>"}}, "response": "<plain text (can include \\\\n line breaks)>"}}
ONLY return those json keys (next, tool, args, response), nothing else.
Next should be "question" if the tool is not the last one in the sequence.
Next should be "done" if the user is asking to be done with the chat."""`;

const MISSING_ARGS_PROMPT_PY = `MISSING_ARGS_PROMPT = """### INSTRUCTIONS set next='question', combine
this response response='{response}' and following missing arguments for tool
{current_tool}: {missing_args}. Only provide a valid JSON response without any
comments or metadata."""`;

const TOOLCHAIN_COMPLETE_PY = `TOOLCHAIN_COMPLETE_GUIDANCE_PROMPT = "If no more tools are needed (user_confirmed_tool_run has been run for all), set next='done' and tool=''."`;

const PROMPTS_FULL_PY = `from jinja2 import Template

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
  "next": "<question|confirm|done>",
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
{{"next": "<question|confirm|done>", "tool": "<tool_name or null>", "args": {{"<arg1>": "<value1 or null>", "<arg2>": "<value2 or null>"}}, "response": "<plain text (can include \\\\n line breaks)>"}}
ONLY return those json keys (next, tool, args, response), nothing else.
Next should be "question" if the tool is not the last one in the sequence.
Next should be "done" if the user is asking to be done with the chat."""


MISSING_ARGS_PROMPT = """### INSTRUCTIONS set next='question', combine
this response response='{response}' and following missing arguments for tool
{current_tool}: {missing_args}. Only provide a valid JSON response without any
comments or metadata."""

TOOLCHAIN_COMPLETE_GUIDANCE_PROMPT = "If no more tools are needed (user_confirmed_tool_run has been run for all), set next='done' and tool=''."`;

const PROMPT_GEN_IMPORTS_PY = `import json
from typing import Optional

from models.core import AgentGoal
from models.requests import ConversationHistory, ToolData
from prompts.prompts import (
    GENAI_PROMPT,
    MISSING_ARGS_PROMPT,
    TOOL_COMPLETION_PROMPT,
    TOOLCHAIN_COMPLETE_GUIDANCE_PROMPT,
)
`;

const GENERATE_GENAI_PROMPT_PY = `def generate_genai_prompt(
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
        "toolchain_complete_guidance": TOOLCHAIN_COMPLETE_GUIDANCE_PROMPT,
        "raw_json": raw_json,
        "raw_json_str": (
            json.dumps(raw_json, indent=2) if raw_json is not None else None
        ),
    }

    return GENAI_PROMPT.render(**template_vars)`;

const GENERATE_TOOL_COMPLETION_PY = `def generate_tool_completion_prompt(current_tool: str, dynamic_result: dict) -> str:
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
    )`;

const GENERATE_MISSING_ARGS_PY = `def generate_missing_args_prompt(
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
    )`;

const PROMPT_GEN_FULL_PY = `import json
from typing import Optional

from models.core import AgentGoal
from models.requests import ConversationHistory, ToolData
from prompts.prompts import (
    GENAI_PROMPT,
    MISSING_ARGS_PROMPT,
    TOOL_COMPLETION_PROMPT,
    TOOLCHAIN_COMPLETE_GUIDANCE_PROMPT,
)


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
        "toolchain_complete_guidance": TOOLCHAIN_COMPLETE_GUIDANCE_PROMPT,
        "raw_json": raw_json,
        "raw_json_str": (
            json.dumps(raw_json, indent=2) if raw_json is not None else None
        ),
    }

    return GENAI_PROMPT.render(**template_vars)


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
    )`;

const PROMPTS_TREE = `temporal-ai-agent/
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
└── tools/
    ├── __init__.py
    ├── create_invoice.py
    ├── find_events.py
    ├── goal_registry.py
    ├── search_flights.py
    ├── tool_registry.py
    └── data/
        └── find_events_data.json`;

export default function Chapter2Page() {
  return (
    <Layout
      title="Define the agent's behavior - Build a durable AI agent"
      description="Chapter 2: Designate the agent goal, build Temporal Activities, and develop the prompt templates."
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
                  { label: "Define agent behavior" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Define the agent's behavior</h1>

            <MetaChips items={["~45 minutes", "Intermediate", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Now that the agent toolkit is in place, you'll define what the
              agent should do with those tools. In this chapter you'll
              designate the agent's goal, build the Temporal Activities that
              handle LLM calls and tool execution, and develop the prompt
              templates that drive the agent's decisions.
            </p>

            <section className={styles.section} id="agent-goal">
              <h2 className={styles.sectionTitle}>Designating the agent's goal</h2>
              <p>
                An agent's goal is the definition of the task it's trying to
                achieve. It achieves this goal by executing tools, analyzing
                the results, and using an LLM to decide what to do next. In
                this tutorial you will define the goal as a combination of
                several fields, including a description, a starter prompt, an
                example conversation history, and the list of tools the agent
                can use to achieve its goal. Now that you've defined the{" "}
                <code>ToolDefinition</code> that will be available for your
                agent, you can define the <code>AgentGoal</code> type and
                create your agent's goal.
              </p>

              <h3>Defining the <code>AgentGoal</code> type</h3>
              <p>
                To define the <code>AgentGoal</code> type, open{" "}
                <code>models/core.py</code> and add the following code:
              </p>
              <CodeBlock language="python" title="models/core.py">
                {AGENT_GOAL_DATACLASS_PY}
              </CodeBlock>

              <p>
                This <code>dataclass</code> defines your{" "}
                <code>AgentGoal</code> as a combination of a few attributes:
              </p>
              <ul>
                <li><code>agent_name</code> - A human readable name for the agent</li>
                <li><code>tools</code> - A list of tools, defined as <code>ToolDefinition</code> types, that the agent can use to achieve its goal</li>
                <li><code>description</code> - A description of the goal, in a bulleted list format specifying how to achieve it.</li>
                <li><code>starter_prompt</code> - A starter prompt for the AI agent to run</li>
                <li><code>example_conversation_history</code> - A sample conversation history of what a successful interaction with this agent would look like</li>
              </ul>

              <details>
                <summary>
                  The <code>models/core.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="models/core.py">
                  {MODELS_CORE_FULL_PY}
                </CodeBlock>
              </details>

              <p>
                Now that you have the type available to define the goal, you
                will implement the goal for your agent.
              </p>

              <h3>Implementing the goal registry</h3>
              <p>
                Similar to implementing the <code>tool_registry</code>, next
                you will implement a <code>goal_registry</code> to define
                your agent's goal and make it available to the Workflow. You
                will do this by creating an instance of your{" "}
                <code>AgentGoal</code> type for every goal you wish to
                implement. For this tutorial you will only implement a single
                goal, named <code>goal_event_flight_invoice</code>, but you
                may want to use this framework going forward to create your
                own agent goals at a later date.
              </p>
              <p>
                To implement your agent's goal, create the file{" "}
                <code>tools/goal_registry.py</code> and add the following
                imports to the file:
              </p>
              <CodeBlock language="python" title="tools/goal_registry.py">
                {GOAL_REGISTRY_IMPORTS_PY}
              </CodeBlock>

              <p>
                To create the goal, first create an instance of the{" "}
                <code>AgentGoal</code> <code>dataclass</code> and add the
                first parameter, <code>agent_name</code>, to identify the
                goal:
              </p>
              <CodeBlock language="python" title="tools/goal_registry.py">
                {GOAL_HEAD_PY}
              </CodeBlock>

              <p>
                Next, pass in the <code>ToolDefinition</code>s that the agent
                is allowed to use to accomplish its goal to the{" "}
                <code>tools</code> parameter. Add the following code as the
                next parameter:
              </p>
              <CodeBlock language="python" title="tools/goal_registry.py">
                {GOAL_TOOLS_PY}
              </CodeBlock>

              <p>
                The following parameter defines a detailed description of what
                the goal is and the ideal path for the agent to take to
                achieve its goal. Add the following code to the file:
              </p>
              <CodeBlock language="python" title="tools/goal_registry.py">
                {GOAL_DESCRIPTION_PY}
              </CodeBlock>

              <p>
                The next parameter provides a starter prompt for the agent,
                detailing how it should begin its interaction with every user.
                A starter prompt is the first prompt an agent sees, and gives
                the initial set of instructions. Think of this as an
                initialization function for the conversation. A common format
                is to provide a greeting, explain your purpose, and prompt the
                user for information the agent needs to succeed.
              </p>
              <p>Add the following code to define your prompt:</p>
              <CodeBlock language="python" title="tools/goal_registry.py">
                {GOAL_STARTER_PROMPT_PY}
              </CodeBlock>

              <p>
                Finally, draft an example conversation of a successful
                interaction with your agent to pass in. LLMs perform better
                when they have an example of expected output, so providing
                this aids the LLM in its goal. Since this is a{" "}
                <code>str</code> type, but the conversation is long, you will
                define each statement as a line in a list and then use{" "}
                <code>{`"\\n ".join()`}</code> to create a string from your
                conversation. Add the conversation as the final parameter.
              </p>
              <CodeBlock language="python" title="tools/goal_registry.py">
                {GOAL_EXAMPLE_HISTORY_PY}
              </CodeBlock>

              <details>
                <summary>
                  The <code>tools/goal_registry.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="tools/goal_registry.py">
                  {GOAL_REGISTRY_FULL_PY}
                </CodeBlock>
              </details>

              <p>
                Now that you have defined your agent's goal, you can begin
                implementing the Activities.
              </p>

              <details>
                <summary>Before moving on to the next section, verify your files and directory structure is correct.</summary>
                <CodeBlock>{GOAL_TREE}</CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>
                Building Temporal Activities to execute non-deterministic agent code
              </h2>
              <p>
                Now that you have built the agent's goal, and the tools it
                needs to achieve it, you can start building the agent code. In
                this step, you will create Activities that execute code in
                your AI agent that can behave non-deterministically, such as
                making the LLM calls or calling tools. Because tools can call
                out to external services, have the possibility to fail, be
                rate limited, or perform other non-deterministic operations,
                it's safer to always call them in an Activity. When an
                Activity fails, it's automatically retried by default until
                it succeeds or is canceled.
              </p>
              <p>
                Another added benefit of executing your tool as an Activity is
                that after the Activity completes, the result is saved to an
                Event History managed by Temporal. If your application were
                to then crash after executing a few tools, it could
                reconstruct the state of the execution and use the previous
                execution's results, without having to re-execute the tools.
                This provides durability to your agent for intermittent
                issues, which are common in distributed systems.
              </p>
              <p>
                Before you can proceed to creating the Activities, however,
                you need to create the custom types that you'll use for
                Activity communication. Recall that Workflow and Activity
                best practices recommend only passing a single{" "}
                <code>dataclass</code> parameter. This helps with the
                evolution of parameters as well as ensuring type safety.
              </p>

              <h3>Creating the <code>requests</code> data models</h3>
              <p>
                Your agent will require specific types for input and output
                for both the Activities and the Workflow. You will put all
                request-based models in a new file in the models directory
                named <code>requests.py</code>.
              </p>
              <p>
                First, open <code>models/requests.py</code> and add the
                following import statements:
              </p>
              <CodeBlock language="python" title="models/requests.py">
                {REQUESTS_IMPORTS_PY}
              </CodeBlock>
              <p>
                You will use these when creating the new types for your
                agent.
              </p>

              <p>
                Next, add the following single attribute data types to the
                file:
              </p>
              <CodeBlock language="python" title="models/requests.py">
                {REQUESTS_ALIASES_PY}
              </CodeBlock>
              <p>
                These types are used to compose other, multi-attribute{" "}
                <code>dataclass</code> types, or sent as a single parameter.
                They are used in the following context of the agent:
              </p>
              <ul>
                <li><code>Message</code> - A nested dictionary that represents one turn of a conversation between the LLM and the user</li>
                <li><code>ConversationHistory</code> - A dictionary containing an <code>str</code> key and a <code>List</code> of <code>Messages</code> that keeps track of the conversation between the LLM and the user</li>
                <li><code>NextStep</code> - A <code>Literal</code> containing three options, picked by the agent to decide the next action to take and interpreted by the Workflow</li>
                <li><code>CurrentTool</code> - An <code>str</code> representation of the current tool the agent is using</li>
              </ul>

              <p>
                Next, add the following <code>dataclass</code>es for handling
                the primary agent parameters:
              </p>
              <CodeBlock language="python" title="models/requests.py">
                {REQUESTS_PARAMS_PY}
              </CodeBlock>
              <p>
                The <code>AgentWorkflowParams</code> type contains a summary
                of the conversation and a queue of prompts that the agent
                needs to process via the LLM. The <code>CombinedInput</code>{" "}
                type contains the agent's goal and the parameters. This type
                is the input that is passed to the main agent Workflow and
                is used to start the initial Workflow Execution.
              </p>

              <p>
                Next, add the <code>dataclass</code> that handles the input
                for calling the LLM for tool planning:
              </p>
              <CodeBlock language="python" title="models/requests.py">
                {REQUESTS_TOOL_PROMPT_PY}
              </CodeBlock>
              <p>
                <code>ToolPromptInput</code> contains the prompt the Activity
                will issue to the LLM, along with any context that the LLM
                needs when executing the prompt.
              </p>

              <p>
                To go along with this type, you need to add types that store
                the results of validation of the prompt:
              </p>
              <CodeBlock language="python" title="models/requests.py">
                {REQUESTS_VALIDATION_PY}
              </CodeBlock>
              <p>
                The <code>ValidationInput</code> type contains the prompt
                given by the user, the conversation history, and the agent's
                goal. An Activity will use this type as input and validate
                the prompt against the agent's goal. Conversely, the{" "}
                <code>ValidationResult</code> type will contain the results
                of this validation Activity and will return a boolean
                signifying if the prompt passed or failed, and if it did fail
                a reason why.
              </p>

              <p>
                Next, add two more <code>dataclass</code>es for handling the
                input and output of reading environment variables into the
                Workflow:
              </p>
              <CodeBlock language="python" title="models/requests.py">
                {REQUESTS_ENV_PY}
              </CodeBlock>
              <p>
                Since reading from the filesystem is a non-deterministic
                operation, this action must be done from an Activity, so it
                is best practice to define types to handle this in case you
                ever need to add more environment variables. Your environment
                variables will contain things such as your API keys, agent
                configurations, timeouts, and other settings.
              </p>

              <p>
                Finally, add the class that will contain the next step the
                agent should take and the data the tool needs to execute:
              </p>
              <CodeBlock language="python" title="models/requests.py">
                {REQUESTS_TOOL_DATA_PY}
              </CodeBlock>
              <p>
                <code>ToolData</code> contains the <code>NextStep</code> that
                the agent should take, along with the tool that should be
                used, the arguments for the tool, the response from the LLM,
                and a <code>force_confirm</code> boolean. You may notice this
                type is different from the previous types, as it is a
                subclass of <code>TypedDict</code> and not a{" "}
                <code>dataclass</code>. This is done to handle converting the
                type to JSON for use in the API later, because{" "}
                <code>dataclass</code>es don't support conversion of nested
                custom types to JSON.
              </p>

              <details>
                <summary>
                  The <code>models/requests.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="models/requests.py">
                  {REQUESTS_FULL_PY}
                </CodeBlock>
              </details>

              <p>
                Now that you have your custom types defined for Activity
                communication, you can implement the Activities.
              </p>

              <h3>Creating the Activities submodule</h3>
              <p>
                First, create the directory structure for your Activities and
                make it a module:
              </p>
              <CodeBlock language="bash">{`mkdir activities
touch activities/__init__.py`}</CodeBlock>

              <p>
                Next, create the file <code>activities/activities.py</code>{" "}
                and add the necessary <code>import</code> statements and a
                statement to load the environment variables:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {ACTIVITIES_IMPORTS_PY}
              </CodeBlock>
              <p>
                This imports various system packages, Temporal libraries, the{" "}
                <code>litellm</code> package for making LLM calls, the{" "}
                <code>dotenv</code> package for loading environment
                variables, and a number of custom types you defined in{" "}
                <code>models/requests.py</code>.
              </p>
              <p>
                Next, you'll create the <code>AgentActivities</code> class,
                which contains activities the agent will call to achieve its
                goal.
              </p>

              <h3>Constructing the <code>AgentActivities</code> Class</h3>
              <p>
                The <code>AgentActivities</code> class enables the Workflow
                to plan which tools to use, validate prompts, read in
                environment variables, and more.
              </p>
              <p>
                To implement it, open <code>activities/activities.py</code>{" "}
                and create the class and define the <code>__init__</code>{" "}
                method:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {AGENT_ACTIVITIES_INIT_PY}
              </CodeBlock>
              <p>
                Temporal Activities can be implemented as either a function
                or a class and method. As the agent requires a persistent
                object for communication, in this case, communicating to the
                LLM, it's good practice to use a class and set the parameters
                as part of the initialization of the Activity, so to not
                waste resources re-initializing the object for every LLM
                call. The <code>__init__</code> method reads the LLM
                configuration from environment variables and assigns the
                values to instance variables.
              </p>

              <h4>Implementing various helper methods</h4>
              <p>Before you implement the Activities, implement the following helper functions:</p>
              <p>
                The first method sanitizes the JSON response you get from the
                LLM into a proper JSON string. The LLM may return a string
                with extra whitespace, or formatted as markdown, so
                sanitizing the string is necessary before parsing it.
              </p>
              <p>
                Add the following helper method to the bottom of your{" "}
                <code>activities.py</code> file:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {SANITIZE_JSON_PY}
              </CodeBlock>

              <p>
                The second helper function takes a string as input and
                returns a dictionary after attempting to parse the string as
                valid JSON. Add this method to the bottom of your{" "}
                <code>activities.py</code> file:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {PARSE_JSON_PY}
              </CodeBlock>

              <p>
                Now that you have the helper methods implemented, you can
                implement the Activity responsible for making LLM calls.
              </p>

              <h4>Implementing the Activity for making LLM calls</h4>
              <p>
                The <code>agent_toolPlanner</code> Activity handles all
                interactions with your chosen LLM. It makes the call to the
                LLM, parses the response and returns JSON on success, and
                raises an Exception on failure.
              </p>
              <p>
                Add the method header with the appropriate decorator to your{" "}
                <code>activities.py</code> file, underneath the{" "}
                <code>__init__</code> method:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {TOOL_PLANNER_HEAD_PY}
              </CodeBlock>

              <p>
                Next, create the <code>messages</code> list, which contains
                various dictionaries with the data necessary to perform an
                LLM prompt. This format is specifically OpenAI's format,
                which you can use for any LLM, because you are using{" "}
                <code>LiteLLM</code> as your{" "}
                <a
                  href="https://docs.litellm.ai/docs/anthropic_unified#litellm-python-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LLM abstraction library
                </a>
                .
              </p>
              <p>Add the following code to craft the <code>messages</code> list:</p>
              <CodeBlock language="python" title="activities/activities.py">
                {TOOL_PLANNER_MESSAGES_PY}
              </CodeBlock>
              <p>
                The <code>agent_toolPlanner</code> Activity constructs
                standard OpenAI-format messages with system context and user
                input. It automatically includes the current date, which
                helps the language model provide accurate responses for
                time-sensitive queries.
              </p>

              <p>Continue the method with the LLM call implementation:</p>
              <CodeBlock language="python" title="activities/activities.py">
                {TOOL_PLANNER_TRY_PY}
              </CodeBlock>
              <p>
                This call is wrapped in a <code>try/except</code> statement
                to handle a potential failure. It creates a dictionary
                containing the arguments for calling the LLM, including the
                model choice, the messages, the API key, and a custom base
                URL if set. Next it performs the call to the LLM using the{" "}
                <code>completion</code> function, passing in the arguments
                dictionary. It then extracts the message you want from the
                response content, sanitizes the JSON and returns it as
                properly parsed JSON upon success. Upon failure, it will
                raise an exception.
              </p>

              <p>The complete implementation of <code>agent_toolPlanner</code> is as follows:</p>
              <CodeBlock language="python" title="activities/activities.py">
                {TOOL_PLANNER_FULL_PY}
              </CodeBlock>

              <p>
                Now that you have implemented the Activity to call the LLM,
                you will implement the Activity to validate the user's
                prompts.
              </p>

              <h4>Implementing the Activity for prompt validation</h4>
              <p>
                It is important to not let the user take your agent off on a
                tangent, sending prompts that are not related to the goal.
                To do this, you must validate the prompt against your
                agent's goal and context prior to executing the LLM with the
                user's input.
              </p>
              <p>
                Next, create the <code>agent_validatePrompt</code> Activity
                to validate any prompt sent to the LLM in the context of the
                conversation history and agent goal.
              </p>
              <p>
                Within the <code>AgentActivities</code> class, add the
                following method header:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {VALIDATE_PROMPT_HEAD_PY}
              </CodeBlock>
              <p>
                This Activity takes in a single argument, using the custom{" "}
                <code>ValidationInput</code> type you specified, and returns
                a single value, <code>ValidationResult</code>, in accordance
                with Temporal best practices.
              </p>

              <p>
                Next, add the following code to iterate over the tools
                specified in the agent's goal and add them to a list.
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {VALIDATE_TOOLS_DESC_PY}
              </CodeBlock>
              <p>
                By doing this, you are creating a string the LLM can use as
                context to validate against. This context helps the LLM
                understand what capabilities are available to the agent, and
                whether or not the prompt the user sent makes sense.
              </p>

              <p>Continue the validation method by adding conversation context:</p>
              <CodeBlock language="python" title="activities/activities.py">
                {VALIDATE_HISTORY_PY}
              </CodeBlock>
              <p>
                This section gathers the past conversation history and
                concatenates it with the available tool context, creating a
                complete context for the LLM.
              </p>

              <p>Next, add the following prompt for the LLM to use to validate the prompt:</p>
              <CodeBlock language="python" title="activities/activities.py">
                {VALIDATE_PROMPT_TEXT_PY}
              </CodeBlock>

              <p>
                Finally, instantiate a <code>ToolPromptInput</code> object
                and pass that to <code>agent_toolPlanner</code> to execute:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {VALIDATE_CALL_PY}
              </CodeBlock>

              <p>The complete implementation of <code>agent_validatePrompt</code> is as follows:</p>
              <CodeBlock language="python" title="activities/activities.py">
                {VALIDATE_FULL_PY}
              </CodeBlock>

              <p>
                Calling an Activity within another Activity won't invoke
                that Activity, but will call the method like a typical
                Python method. The Activity then returns a{" "}
                <code>ValidationResult</code> for the agent to interpret and
                continue with its execution.
              </p>

              <h4>Implementing the Activity for retrieving environment variables</h4>
              <p>
                The final Activity within the <code>AgentActivities</code>{" "}
                class is the <code>get_wf_env_vars</code> Activity. This
                Activity reads certain environment variables that need to be
                known within the Workflow. Since reading from the file
                system is a potentially non-deterministic operation, this
                must happen within an Activity.
              </p>
              <p>
                Add the following code within the <code>AgentActivities</code>{" "}
                class to implement the Activity:
              </p>
              <CodeBlock language="python" title="activities/activities.py">
                {ENV_VARS_PY}
              </CodeBlock>
              <p>
                This Activity reads the environment variables and ensures
                that <code>show_confirm_value</code> is set, returning your
                custom <code>EnvLookupOutput</code> type. While this type
                may only contain one value at the moment, having it designed
                with this custom type allows you to expand this method
                later if necessary.
              </p>

              <p>
                You have implemented all Activities within the{" "}
                <code>AgentActivities</code> class, but there is still one
                Activity left to implement, the Activity for executing the
                tools.
              </p>

              <h3>Implementing dynamic tool execution</h3>
              <p>
                The final Activity enables runtime execution of any tool from
                your registry. To enable this, you must use{" "}
                <a
                  href="https://docs.temporal.io/develop/python/message-passing#set-a-dynamic-activity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dynamic Activities
                </a>
                , which are necessary when you request execution of an
                Activity with an unknown{" "}
                <a
                  href="https://docs.temporal.io/activity-definition#activity-type"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity Type
                </a>
                . Since your tools are loaded in dynamically, this is a
                perfect example of when to use Temporal's Dynamic Activities.
              </p>
              <p>
                This Activity will <strong>not</strong> be implemented as a
                method within the class, but rather a function within the
                same <code>activities.py</code> file.
              </p>
              <p>Add this function outside the class definition:</p>
              <CodeBlock language="python" title="activities/activities.py">
                {DYNAMIC_TOOL_PY}
              </CodeBlock>
              <p>
                This dynamic Activity uses Temporal's runtime information to
                determine which tool to execute. It retrieves the tool name
                from the Activity type and loads arguments from the payload.
                It then inspects the handler to determine if the
                implementation of the tool is an asynchronous Python
                function. If it is, it <code>await</code>s its execution,
                otherwise it directly invokes the function. This means the
                Activity handles both synchronous and asynchronous tool
                functions.
              </p>

              <details>
                <summary>
                  The <code>activities/activities.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="activities/activities.py">
                  {ACTIVITIES_FULL_PY}
                </CodeBlock>
              </details>

              <p>
                The Activities you implemented handle LLM communication, user
                input validation, environment configuration, and dynamic
                tool execution.
              </p>

              <details>
                <summary>Before moving on to the next section, verify your files and directory structure is correct.</summary>
                <CodeBlock>{ACTIVITIES_TREE}</CodeBlock>
              </details>

              <p>
                In the next step, you will create a submodule that stores and
                renders the main prompts the agent uses to communicate with
                the LLM.
              </p>
            </section>

            <section className={styles.section} id="prompts">
              <h2 className={styles.sectionTitle}>Developing the necessary prompts</h2>
              <p>
                Your agent communicates with an LLM to determine what steps
                it should take and which tool it should use. However, LLM
                output is non-deterministic, so how do you ensure that you
                receive data that you can rely on so your agent can interpret
                it and continue execution? To do this, you need to carefully
                craft a prompt explicitly stating what the LLM should do and
                what format it should return. These prompts can often be
                complex, and since your agent dynamically loads tools, will
                also need to be dynamically generated. In this section, you
                will implement the code to generate these prompts.
              </p>

              <h3>Creating the submodule</h3>
              <p>First, create a new directory named <code>prompts</code>:</p>
              <CodeBlock language="bash">mkdir prompts</CodeBlock>

              <p>
                Then create the <code>__init__.py</code> file in the{" "}
                <code>prompts</code> directory to make it a submodule:
              </p>
              <CodeBlock language="bash">touch prompts/__init__.py</CodeBlock>

              <p>
                Next, you'll craft your prompt templates that the LLM will
                use.
              </p>

              <h3>Crafting the prompts templates</h3>
              <p>
                The prompts templates you create will vary in the amount of
                customization they allow. For templates with minimal
                customization, for example, templates that only require a
                few variable substitutions, Python's string formatting syntax
                will suffice. However, if your template requires iteration,
                conditional logic, or variable interpolation, you should use
                a more advanced templating system, such as{" "}
                <code>Jinja2</code>.
              </p>

              <h4>Defining the primary context prompt</h4>
              <p>
                The primary context that the LLM uses to determine the next
                action requires multiple steps, conditionals, and loops to
                implement, so you will implement it using <code>Jinja2</code>.
              </p>
              <p>
                Create the file <code>prompts/prompts.py</code> and add the
                import for <code>Jinja2</code>:
              </p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {PROMPTS_IMPORT_PY}
              </CodeBlock>

              <p>
                Next, add the first part of the primary prompt, which you'll
                name <code>GENAI_PROMPT</code>:
              </p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {GENAI_PROMPT_PART1_PY}
              </CodeBlock>
              <p>
                This section of the prompt sets the primary role for the
                LLM, provides the current conversation history for the LLM
                to analyze, and if an example conversation was provided,
                provides that as an example for the LLM to use as well.
              </p>

              <p>Continue adding this prompt by adding the following lines:</p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {GENAI_PROMPT_PART2_PY}
              </CodeBlock>
              <p>
                The segment of the prompt definitions section lists the
                agent's goal and the available tools with their descriptions
                and argument specifications. This provides the LLM with
                information about what the agent is attempting to accomplish,
                and its capabilities and constraints.
              </p>

              <p>
                Next, it's vital that the LLM provides its response in a
                consistent way that your agent can parse. Add the following
                instructions for output formatting and guardrails:
              </p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {GENAI_PROMPT_PART3_PY}
              </CodeBlock>
              <p>
                This segment provides strict rules on the exact format the
                LLM should respond with, as well as guardrails to ensure
                that fields are set properly. The guardrails section is
                particularly important as it provides detailed behavioral
                constraints that enable consistent responses. These rules
                prevent issues such as asking questions while proposing tool
                execution or forgetting to use the conversation history for
                argument inference.
              </p>

              <p>Finally, complete the template with a validation prompt:</p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {GENAI_PROMPT_VALIDATION_PY}
              </CodeBlock>
              <p>
                The validation section enables the template to handle both
                correct and incorrectly JSON formatted strings. If the JSON
                is improperly formatted, the LLM is prompted to correct it
                before continuing with its other tasks.
              </p>

              <p>Next, you'll create the prompt that will determine the next steps for your agent to take.</p>

              <h4>Defining the tool completion prompt</h4>
              <p>
                The <code>TOOL_COMPLETION_PROMPT</code> instructs the LLM to
                analyze the successful tool results and determine the
                appropriate next steps. This prompt only requires minimal
                substitution, so a Python string formatting will suffice.
              </p>
              <p>
                Add the following constant to your{" "}
                <code>prompts/prompts.py</code> file:
              </p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {TOOL_COMPLETION_PROMPT_PY}
              </CodeBlock>
              <p>
                This template handles successful tool completion scenarios,
                instructing the LLM to use the results of the execution when
                determining the next step. It also gives explicit
                instructions on exactly how to respond, which keys should be
                present, and the format of the output.
              </p>

              <p>Next, you'll implement the prompt for handling missing user arguments.</p>

              <h4>Defining the missing arguments prompt</h4>
              <p>
                If the user doesn't provide enough information to the agent,
                the agent needs to detect this and set the next action to
                prompt the user for the missing arguments. This prompt only
                has a few variable substitutions, so a Python string
                formatting will suffice.
              </p>
              <p>
                Add the missing arguments template to your{" "}
                <code>prompts/prompts.py</code> file:
              </p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {MISSING_ARGS_PROMPT_PY}
              </CodeBlock>
              <p>
                This template provides the response, sets the next key to{" "}
                <code>question</code> to instruct the agent to prompt the
                user for more information, and specifies which tool is
                missing which argument.
              </p>

              <h4>Defining the toolchain complete prompt</h4>
              <p>
                Finally, define the prompt that details what the LLM should
                do if no more tools are needed to complete the agent's goal.
              </p>
              <CodeBlock language="python" title="prompts/prompts.py">
                {TOOLCHAIN_COMPLETE_PY}
              </CodeBlock>

              <details>
                <summary>
                  The <code>prompts/prompts.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="prompts/prompts.py">
                  {PROMPTS_FULL_PY}
                </CodeBlock>
              </details>

              <p>
                Next, you'll build the functions that use these prompt
                templates to generate the actual prompts.
              </p>

              <h3>Building the prompt generation functions</h3>
              <p>
                Now that you have the prompt templates built, you need to
                implement functions the agent can call to render them.
              </p>
              <p>
                First, create{" "}
                <code>prompts/agent_prompt_generators.py</code> and add the
                following imports:
              </p>
              <CodeBlock language="python" title="prompts/agent_prompt_generators.py">
                {PROMPT_GEN_IMPORTS_PY}
              </CodeBlock>

              <p>Next, create the function to render the <code>GENAI_PROMPT</code>:</p>
              <CodeBlock language="python" title="prompts/agent_prompt_generators.py">
                {GENERATE_GENAI_PROMPT_PY}
              </CodeBlock>
              <p>
                This function creates the <code>template_vars</code>{" "}
                dictionary, assigns the parameters to the appropriate
                template variables, and then renders the{" "}
                <code>Jinja2</code> template, passing in the dictionary as{" "}
                <code>kwargs</code> to the <code>render</code> function.
              </p>

              <p>Next, add the tool completion prompt generator:</p>
              <CodeBlock language="python" title="prompts/agent_prompt_generators.py">
                {GENERATE_TOOL_COMPLETION_PY}
              </CodeBlock>
              <p>
                This function takes in the current tool, along with the
                dynamic result system prompt and returns the formatted{" "}
                <code>TOOL_COMPLETION_PROMPT</code> using the{" "}
                <code>.format</code> function.
              </p>

              <p>Finally, add the prompt for handling missing arguments:</p>
              <CodeBlock language="python" title="prompts/agent_prompt_generators.py">
                {GENERATE_MISSING_ARGS_PY}
              </CodeBlock>
              <p>
                This function gets the response from the current tool, and
                the arguments missing, then returns the formatted{" "}
                <code>MISSING_ARGS_PROMPT</code>.
              </p>

              <details>
                <summary>
                  The <code>prompts/agent_prompt_generators.py</code> is complete and will need no more revisions. You can review the complete file and copy the code here.
                </summary>
                <CodeBlock language="python" title="prompts/agent_prompt_generators.py">
                  {PROMPT_GEN_FULL_PY}
                </CodeBlock>
              </details>

              <details>
                <summary>Before moving on to the next section, verify your files and directory structure is correct.</summary>
                <CodeBlock>{PROMPTS_TREE}</CodeBlock>
              </details>

              <p>
                Now that you have the prompt rendering submodule implemented,
                you can implement the main agent Workflow.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/durable-ai-agent/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Build the toolkit
                </span>
              </Link>
              <Link
                to="/tutorials/ai/durable-ai-agent/workflow/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Build the Workflow and Worker
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
