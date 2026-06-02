// Tutorial chapter 2 of 3: Build the research manager and Temporal Workflow.
// See ./index.js for shared canonical-source notes.

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
    label: "Setting the Stage",
    href: "/tutorials/ai/deep-research/01-setting-the-stage/",
  },
  {
    n: 2,
    label: "Creating the Workflow",
    href: "/tutorials/ai/deep-research/02-creating-the-workflow/",
  },
  {
    n: 3,
    label: "Running Your Application",
    href: "/tutorials/ai/deep-research/03-running-your-deep-agent/",
  },
];

const TOC_ITEMS = [
  { id: "create-manager", label: "Step 1: Create the Research Manager" },
  { id: "create-workflow", label: "Step 2: Create the Research Workflow" },
  { id: "clean-up", label: "Step 3: Clean up the old manager" },
];

const MANAGER_FLOW_DIAGRAM = `                        User Query
                             │
                             ▼
               ┌─────────────────────────┐
               │      Triage Agent       │
               │  "Is this specific?"    │
               └─────────────────────────┘
                      │           │
                 No   │           │  Yes
                      ▼           ▼
         ┌────────────────┐    ┌─────────────────────────────────┐
         │ Clarify Agent  │    │      Research Pipeline          │
         │ (ask questions)│    │  Plan → Search → Write Report   │
         └────────────────┘    └─────────────────────────────────┘
                 │                           │
                 ▼                           ▼
         Return questions            Return completed report
         (wait for user)`;

const MKDIR_CMD = `mkdir -p deep_research/workflows`;

const MANAGER_IMPORTS = `from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional

from agents import Runner

from deep_research.agents.triage_agent import new_triage_agent
from deep_research.agents.clarifying_agent import new_clarifying_agent
from deep_research.agents.planner_agent import new_planner_agent
from deep_research.agents.search_agent import new_search_agent
from deep_research.agents.writer_agent import new_writer_agent
from deep_research.models import (
    ReportData,
    WebSearchPlan,
    TriageResult,
    ClarificationQuestions,
)`;

const CLARIFICATION_RESULT_PY = `@dataclass
class ClarificationResult:
    """Result from initial clarification check."""
    needs_clarifications: bool
    questions: Optional[list[str]] = None
    report_data: Optional[ReportData] = None`;

const MANAGER_CLASS_INIT = `class InteractiveResearchManager:
    """
    Orchestrates the multi-agent research pipeline.

    All LLM calls are automatically durable via the OpenAI Agents SDK
    Temporal integration - no manual Activity wrapping needed.
    """

    def __init__(self):
        self.triage_agent = new_triage_agent()
        self.clarifying_agent = new_clarifying_agent()
        self.planner_agent = new_planner_agent()
        self.search_agent = new_search_agent()
        self.writer_agent = new_writer_agent()`;

const HELPER_METHODS_PY = `    async def _plan_searches(self, query: str) -> WebSearchPlan:
        """Use the planner agent to create a search strategy."""
        result = await Runner.run(
            self.planner_agent,
            f"Create a search plan for: {query}",
        )
        return result.final_output_as(WebSearchPlan)

    async def _perform_searches(self, search_plan: WebSearchPlan) -> list[str]:
        """Execute all searches concurrently."""
        async def search(item) -> str:
            prompt = f"Search for: {item.query}\\nReason: {item.reason}"
            result = await Runner.run(
                self.search_agent,
                prompt,
            )
            return str(result.final_output)

        tasks = [search(item) for item in search_plan.searches]
        return await asyncio.gather(*tasks)

    async def _write_report(self, query: str, search_results: list[str]) -> ReportData:
        """Use the writer agent to synthesize results into a report."""
        prompt = f"Original query: {query}\\nSearch results: {search_results}"
        result = await Runner.run(
            self.writer_agent,
            prompt,
        )
        return result.final_output_as(ReportData)`;

const RESEARCH_PIPELINE_PY = `    async def _run_research_pipeline(self, query: str) -> ReportData:
        """Execute the full research pipeline: plan → search → write."""
        # Plan searches
        print(f"Planning searches for: {query[:50]}...")
        search_plan = await self._plan_searches(query)

        # Execute searches concurrently
        print(f"Executing {len(search_plan.searches)} searches...")
        search_results = await self._perform_searches(search_plan)

        # Write report
        print("Writing research report...")
        report = await self._write_report(query, search_results)

        return report`;

const RUN_WITH_CLARIFICATIONS_COMPLETE_PY = `    async def run_with_clarifications_complete(
        self,
        original_query: str,
        questions: list[str],
        responses: list[str],
    ) -> ReportData:
        """Complete research using clarification responses."""
        context = "\\n".join(f"- {q}: {a}" for q, a in zip(questions, responses))
        enriched_query = f"{original_query}\\n\\nClarifications:\\n{context}"
        return await self._run_research_pipeline(enriched_query)`;

const RUN_WITH_CLARIFICATIONS_START_PY = `    async def run_with_clarifications_start(self, query: str) -> ClarificationResult:
        """
        Start research and determine if clarifications are needed.

        Returns whether clarifications are needed and either:
        - The clarification questions (if needed)
        - The completed report (if query was specific enough)
        """
        # Step 1: Check if clarifications are needed
        triage_result = await Runner.run(
            self.triage_agent,
            query,
        )
        needs_clarification = triage_result.final_output_as(TriageResult)

        if needs_clarification.needs_clarification:
            # Step 2a: Generate clarifying questions
            clarify_result = await Runner.run(
                self.clarifying_agent,
                f"Generate clarifying questions for: {query}",
            )
            questions = clarify_result.final_output_as(ClarificationQuestions)
            return ClarificationResult(
                needs_clarifications=True,
                questions=questions.questions,
            )
        else:
            # Step 2b: Query is specific enough, run research directly
            report = await self._run_research_pipeline(query)
            return ClarificationResult(
                needs_clarifications=False,
                report_data=report,
            )`;

const FULL_MANAGER_PY = `"""
Interactive Research Manager - Orchestrates the multi-agent research pipeline.

This is a plain Python class - no Temporal imports needed. Durability comes from:
1. Being called from within a Temporal Workflow
2. The Worker's OpenAIAgentsPlugin intercepting Runner.run() calls
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Optional

from agents import Runner

from deep_research.agents.triage_agent import new_triage_agent
from deep_research.agents.clarifying_agent import new_clarifying_agent
from deep_research.agents.planner_agent import new_planner_agent
from deep_research.agents.search_agent import new_search_agent
from deep_research.agents.writer_agent import new_writer_agent
from deep_research.models import (
    ReportData,
    WebSearchPlan,
    TriageResult,
    ClarificationQuestions,
)


@dataclass
class ClarificationResult:
    """Result from initial clarification check."""
    needs_clarifications: bool
    questions: Optional[list[str]] = None
    report_data: Optional[ReportData] = None


class InteractiveResearchManager:
    """
    Orchestrates the multi-agent research pipeline.

    All LLM calls are automatically durable via the OpenAI Agents SDK
    Temporal integration - no manual Activity wrapping needed.
    """

    def __init__(self):
        self.triage_agent = new_triage_agent()
        self.clarifying_agent = new_clarifying_agent()
        self.planner_agent = new_planner_agent()
        self.search_agent = new_search_agent()
        self.writer_agent = new_writer_agent()

    async def run_with_clarifications_start(self, query: str) -> ClarificationResult:
        """
        Start research and determine if clarifications are needed.

        Returns whether clarifications are needed and either:
        - The clarification questions (if needed)
        - The completed report (if query was specific enough)
        """
        # Check if clarifications are needed
        triage_result = await Runner.run(
            self.triage_agent,
            query,
        )
        needs_clarification = triage_result.final_output_as(TriageResult)

        if needs_clarification.needs_clarification:
            # Generate clarifying questions
            clarify_result = await Runner.run(
                self.clarifying_agent,
                f"Generate clarifying questions for: {query}",
            )
            questions = clarify_result.final_output_as(ClarificationQuestions)
            return ClarificationResult(
                needs_clarifications=True,
                questions=questions.questions,
            )
        else:
            # Query is specific enough, run research directly
            report = await self._run_research_pipeline(query)
            return ClarificationResult(
                needs_clarifications=False,
                report_data=report,
            )

    async def run_with_clarifications_complete(
        self,
        original_query: str,
        questions: list[str],
        responses: list[str],
    ) -> ReportData:
        """Complete research using clarification responses."""
        context = "\\n".join(f"- {q}: {a}" for q, a in zip(questions, responses))
        enriched_query = f"{original_query}\\n\\nClarifications:\\n{context}"
        return await self._run_research_pipeline(enriched_query)

    async def _run_research_pipeline(self, query: str) -> ReportData:
        """Execute the full research pipeline: plan → search → write."""
        # Plan searches
        print(f"Planning searches for: {query[:50]}...")
        search_plan = await self._plan_searches(query)

        # Execute searches concurrently
        print(f"Executing {len(search_plan.searches)} searches...")
        search_results = await self._perform_searches(search_plan)

        # Write report
        print("Writing research report...")
        report = await self._write_report(query, search_results)

        return report

    async def _plan_searches(self, query: str) -> WebSearchPlan:
        """Use the planner agent to create a search strategy."""
        result = await Runner.run(
            self.planner_agent,
            f"Create a search plan for: {query}",
        )
        return result.final_output_as(WebSearchPlan)

    async def _perform_searches(self, search_plan: WebSearchPlan) -> list[str]:
        """Execute all searches concurrently."""
        async def search(item) -> str:
            prompt = f"Search for: {item.query}\\nReason: {item.reason}"
            result = await Runner.run(
                self.search_agent,
                prompt,
            )
            return str(result.final_output)

        tasks = [search(item) for item in search_plan.searches]
        return await asyncio.gather(*tasks)

    async def _write_report(self, query: str, search_results: list[str]) -> ReportData:
        """Use the writer agent to synthesize results into a report."""
        prompt = f"Original query: {query}\\nSearch results: {search_results}"
        result = await Runner.run(
            self.writer_agent,
            prompt,
        )
        return result.final_output_as(ReportData)`;

const WORKFLOW_IMPORTS = `from dataclasses import dataclass, field

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from deep_research.workflows.research_manager import InteractiveResearchManager
    from deep_research.models import ReportData`;

const WORKFLOW_DATACLASSES = `@dataclass
class UserQueryInput:
    """Input for starting research."""
    query: str


@dataclass
class SingleClarificationInput:
    """Input for providing a single clarification answer."""
    answer: str


@dataclass
class ResearchStatus:
    """Current status of the research workflow."""
    original_query: str | None
    clarification_questions: list[str]
    clarification_responses: list[str]
    status: str


@dataclass
class InteractiveResearchResult:
    """Final result from the research workflow."""
    short_summary: str
    markdown_report: str
    follow_up_questions: list[str]`;

const WORKFLOW_CLASS_INIT = `@workflow.defn
class InteractiveResearchWorkflow:
    """
    Long-running workflow for interactive research with clarifying questions.

    The workflow:
    1. Waits for research to be started via update
    2. If clarifications needed, waits for each answer via updates
    3. Once all answers collected, completes research
    4. Returns the final report
    """

    def __init__(self) -> None:
        self.research_manager = InteractiveResearchManager()

        # State that persists across crashes
        self.original_query: str | None = None
        self.clarification_questions: list[str] = []
        self.clarification_responses: list[str] = []
        self.report_data: ReportData | None = None
        self.research_initialized: bool = False`;

const BUILD_RESULT_HELPER = `    def _build_result(
        self,
        summary: str,
        report: str,
        questions: list[str],
    ) -> InteractiveResearchResult:
        """Helper to build the result object."""
        return InteractiveResearchResult(
            short_summary=summary,
            markdown_report=report,
            follow_up_questions=questions,
        )`;

const COMMS_DIAGRAM = `┌─────────────┐         ┌─────────────┐         ┌─────────────────────┐
│   Browser   │         │   FastAPI   │         │   Temporal Workflow │
│     UI      │         │   Server    │         │                     │
└──────┬──────┘         └──────┬──────┘         └──────────┬──────────┘
       │                       │                           │
       │  Submit query         │                           │
       │──────────────────────►│  start_research (Update)  │
       │                       │──────────────────────────►│
       │                       │                           │ Process query,
       │                       │                           │ generate questions
       │                       │◄──────────────────────────│
       │  Return questions     │  Return status            │
       │◄──────────────────────│                           │
       │                       │                           │
       │       · · ·           │       · · ·               │ WAITING
       │   (user thinking)     │                           │ (zero cost)
       │       · · ·           │       · · ·               │
       │                       │                           │
       │  Submit answer        │                           │
       │──────────────────────►│  provide_clarification    │
       │                       │  (Update)                 │
       │                       │──────────────────────────►│
       │                       │◄──────────────────────────│ RESUME
       │◄──────────────────────│                           │
       │                       │                           │`;

const GET_STATUS_PY = `    @workflow.query
    def get_status(self) -> ResearchStatus:
        """Get current research status."""
        if self.report_data:
            status = "completed"
        elif self.clarification_questions and len(self.clarification_responses) < len(self.clarification_questions):
            status = "awaiting_clarification"
        elif self.original_query:
            status = "researching"
        else:
            status = "pending"

        return ResearchStatus(
            original_query=self.original_query,
            clarification_questions=self.clarification_questions,
            clarification_responses=self.clarification_responses,
            status=status,
        )`;

const START_RESEARCH_PY = `    @workflow.update
    async def start_research(self, input: UserQueryInput) -> ResearchStatus:
        """Start a new research session."""
        workflow.logger.info(f"Starting research for: '{input.query}'")
        self.original_query = input.query

        # Check if clarifications are needed (calls the manager)
        result = await self.research_manager.run_with_clarifications_start(self.original_query)

        if result.needs_clarifications:
            self.clarification_questions = result.questions
        else:
            self.report_data = result.report_data

        self.research_initialized = True
        return self.get_status()`;

const PROVIDE_CLARIFICATION_PY = `    @workflow.update
    async def provide_clarification(self, input: SingleClarificationInput) -> ResearchStatus:
        """Provide an answer to the current clarification question."""
        self.clarification_responses.append(input.answer)
        return self.get_status()`;

const RUN_METHOD_PY = `    @workflow.run
    async def run(self) -> InteractiveResearchResult:
        """Waits for research to start and complete."""
        # Wait for research to be initialized via the start_research Update
        await workflow.wait_condition(lambda: self.research_initialized)

        # If clarifications needed, wait for all answers
        if self.clarification_questions:
            await workflow.wait_condition(
                lambda: len(self.clarification_responses) >= len(self.clarification_questions)
            )
            # Complete research with the enriched query
            self.report_data = await self.research_manager.run_with_clarifications_complete(
                self.original_query,
                self.clarification_questions,
                self.clarification_responses,
            )

        # Return the final report
        return self._build_result(
            self.report_data.short_summary,
            self.report_data.markdown_report,
            self.report_data.follow_up_questions,
        )`;

const FULL_WORKFLOW_PY = `"""
Interactive Research Workflow - Manages state and human-in-the-loop.
"""

from dataclasses import dataclass, field

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from deep_research.workflows.research_manager import InteractiveResearchManager
    from deep_research.models import ReportData


@dataclass
class UserQueryInput:
    """Input for starting research."""
    query: str


@dataclass
class SingleClarificationInput:
    """Input for providing a single clarification answer."""
    answer: str


@dataclass
class ResearchStatus:
    """Current status of the research workflow."""
    original_query: str | None
    clarification_questions: list[str]
    clarification_responses: list[str]
    status: str


@dataclass
class InteractiveResearchResult:
    """Final result from the research workflow."""
    short_summary: str
    markdown_report: str
    follow_up_questions: list[str]


@workflow.defn
class InteractiveResearchWorkflow:
    """Workflow for interactive research with clarifying questions."""

    def __init__(self) -> None:
        self.research_manager = InteractiveResearchManager()
        self.original_query: str | None = None
        self.clarification_questions: list[str] = []
        self.clarification_responses: list[str] = []
        self.report_data: ReportData | None = None
        self.research_initialized: bool = False

    def _build_result(
        self,
        summary: str,
        report: str,
        questions: list[str],
    ) -> InteractiveResearchResult:
        return InteractiveResearchResult(
            short_summary=summary,
            markdown_report=report,
            follow_up_questions=questions,
        )

    @workflow.run
    async def run(self) -> InteractiveResearchResult:
        """Main workflow loop - waits for research to start and complete."""
        await workflow.wait_condition(lambda: self.research_initialized)

        if self.clarification_questions:
            await workflow.wait_condition(
                lambda: len(self.clarification_responses) >= len(self.clarification_questions)
            )
            self.report_data = await self.research_manager.run_with_clarifications_complete(
                self.original_query,
                self.clarification_questions,
                self.clarification_responses,
            )

        return self._build_result(
            self.report_data.short_summary,
            self.report_data.markdown_report,
            self.report_data.follow_up_questions,
        )

    @workflow.query
    def get_status(self) -> ResearchStatus:
        """Get current research status."""
        if self.report_data:
            status = "completed"
        elif self.clarification_questions and len(self.clarification_responses) < len(self.clarification_questions):
            status = "awaiting_clarification"
        elif self.original_query:
            status = "researching"
        else:
            status = "pending"

        return ResearchStatus(
            original_query=self.original_query,
            clarification_questions=self.clarification_questions,
            clarification_responses=self.clarification_responses,
            status=status,
        )

    @workflow.update
    async def start_research(self, input: UserQueryInput) -> ResearchStatus:
        """Start a new research session."""
        self.original_query = input.query
        result = await self.research_manager.run_with_clarifications_start(self.original_query)

        if result.needs_clarifications:
            self.clarification_questions = result.questions
        else:
            self.report_data = result.report_data

        self.research_initialized = True
        return self.get_status()

    @workflow.update
    async def provide_clarification(self, input: SingleClarificationInput) -> ResearchStatus:
        """Provide an answer to the current clarification question."""
        self.clarification_responses.append(input.answer)
        return self.get_status()`;

const DELETE_OLD_MANAGER = `rm deep_research/research_manager.py`;

export default function Chapter2Page() {
  return (
    <Layout
      title="Part 2: Creating the Workflow - Deep Research Agent"
      description="Build the research manager and Temporal Workflow that make your deep research agent durable."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="Deep Research Agent tutorial"
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI", href: "/tutorials/ai" },
                  {
                    label: "Deep Research",
                    href: "/tutorials/ai/deep-research/",
                  },
                  { label: "Part 2: Creating the Workflow" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Part 2: Creating the Workflow for Your Deep Research Agent
            </h1>

            <MetaChips items={["~60 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              In{" "}
              <Link to="/tutorials/ai/deep-research/01-setting-the-stage/">
                Part 1
              </Link>
              , you set up the template repository and learned how the agent
              pipeline works. Now you'll add Temporal to make it durable.
            </p>

            <p>You'll create three components:</p>
            <ol>
              <li>
                <strong>InteractiveResearchManager</strong> - Orchestrates the
                multi-agent pipeline
              </li>
              <li>
                <strong>InteractiveResearchWorkflow</strong> - Manages state
                and human-in-the-loop
              </li>
              <li>
                <strong>Worker</strong> - Executes Workflows with the OpenAI
                Agents plugin
              </li>
            </ol>

            <p>Let's start building.</p>

            <section className={styles.section} id="create-manager">
              <h2 className={styles.sectionTitle}>
                Step 1: Create the Interactive Research Manager
              </h2>
              <p>
                The manager orchestrates the multi-agent research pipeline. It
                runs inside the Workflow, and thanks to the OpenAI Agents
                integration, all its <code>Runner.run()</code> calls are
                automatically durable.
              </p>

              <p>Here's the flow the manager implements:</p>
              <CodeBlock>{MANAGER_FLOW_DIAGRAM}</CodeBlock>

              <p>
                When the user provides answers, the manager enriches the
                original query with their responses and runs the research
                pipeline.
              </p>

              <p>Create the directory structure:</p>
              <CodeBlock language="bash">{MKDIR_CMD}</CodeBlock>

              <p>
                Now create{" "}
                <code>deep_research/workflows/research_manager.py</code> and
                build it step by step.
              </p>

              <h3>Set up imports</h3>
              <p>Start with the necessary imports:</p>
              <CodeBlock language="python">{MANAGER_IMPORTS}</CodeBlock>

              <Admonition type="note" title="No Temporal imports here">
                <p>
                  Notice this file doesn't import anything from Temporal. The
                  manager is just a plain Python class that calls{" "}
                  <code>Runner.run()</code>. So where does durability come
                  from?
                </p>
                <p>The durability happens because:</p>
                <ol>
                  <li>
                    The Interactive Research Workflow that you create imports
                    this Research manager
                  </li>
                  <li>
                    The Worker is configured with the{" "}
                    <code>OpenAIAgentsPlugin</code>
                  </li>
                  <li>
                    When <code>Runner.run()</code> is called from within a
                    Workflow, the plugin intercepts it and executes it as a
                    durable Activity
                  </li>
                </ol>
                <p>
                  This separation keeps the manager simple and testable - it
                  doesn't need to know about Temporal at all.
                </p>
              </Admonition>

              <h3>Define the result type</h3>
              <p>
                The manager needs to communicate whether clarifications are
                needed. Create a dataclass for this:
              </p>
              <CodeBlock language="python">{CLARIFICATION_RESULT_PY}</CodeBlock>
              <p>This result tells the Workflow one of two things:</p>
              <ul>
                <li>
                  <strong>Clarifications needed</strong>: Returns the questions
                  to ask the user
                </li>
                <li>
                  <strong>No clarifications needed</strong>: Returns the
                  completed report directly
                </li>
              </ul>

              <h3>Create the manager class</h3>
              <p>
                Now create the <code>InteractiveResearchManager</code> class.
                Start with initialization:
              </p>
              <CodeBlock language="python">{MANAGER_CLASS_INIT}</CodeBlock>

              <p>
                The manager initializes all five agents from your existing
                agent files:
              </p>
              <ul>
                <li>
                  <strong>Triage Agent</strong>: Decides if the query needs
                  clarification
                </li>
                <li>
                  <strong>Clarifying Agent</strong>: Generates follow-up
                  questions
                </li>
                <li>
                  <strong>Planner Agent</strong>: Creates a search strategy
                </li>
                <li>
                  <strong>Search Agent</strong>: Executes web searches
                </li>
                <li>
                  <strong>Writer Agent</strong>: Synthesizes results into a
                  report
                </li>
              </ul>

              <h3>Add the helper methods</h3>
              <p>
                Now add the individual pipeline steps. These are the building
                blocks that the rest of the manager will use:
              </p>

              <Admonition type="info" title="Automatic Durability">
                <p>
                  Every <code>Runner.run()</code> call is automatically a
                  durable Temporal Activity. If a call fails due to rate
                  limiting, Temporal retries it. If the Worker crashes
                  mid-pipeline, Temporal remembers which calls succeeded and
                  resumes from there.
                </p>
              </Admonition>

              <CodeBlock language="python">{HELPER_METHODS_PY}</CodeBlock>

              <p>
                Notice how <code>_perform_searches</code> uses{" "}
                <code>asyncio.gather</code> to run multiple Search Agent calls
                concurrently. The Planner Agent doesn't just generate one
                search - it creates a comprehensive search plan with multiple
                queries to cover different angles of the topic. For example, a
                question about "production AI best practices" might generate
                searches for error handling, cost optimization, monitoring,
                rate limiting, and more. Running these in parallel is faster
                than sequential execution, and gives the Writer Agent richer
                material to synthesize into the final report.
              </p>

              <h3>Add the research pipeline</h3>
              <p>
                Now that the helper methods exist, add the method that
                orchestrates them:
              </p>
              <CodeBlock language="python">{RESEARCH_PIPELINE_PY}</CodeBlock>

              <p>The pipeline follows three steps:</p>
              <ol>
                <li>
                  <strong>Plan</strong>: The planner agent creates a list of
                  searches to perform
                </li>
                <li>
                  <strong>Search</strong>: All searches run concurrently for
                  speed
                </li>
                <li>
                  <strong>Write</strong>: The writer agent synthesizes
                  everything into a report
                </li>
              </ol>

              <h3>Add the public methods</h3>
              <p>
                Finally, add the two public methods that the Workflow will
                call. First, the completion method (simpler of the two):
              </p>
              <CodeBlock language="python">
                {RUN_WITH_CLARIFICATIONS_COMPLETE_PY}
              </CodeBlock>

              <p>
                Next, the main entry point that triages the query and either
                asks for clarifications or runs research directly:
              </p>
              <CodeBlock language="python">
                {RUN_WITH_CLARIFICATIONS_START_PY}
              </CodeBlock>

              <h3>What you built</h3>
              <p>
                The <code>InteractiveResearchManager</code> provides two entry
                points that the Workflow will call:
              </p>

              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>When it's called</th>
                    <th>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>run_with_clarifications_start()</code>
                    </td>
                    <td>User submits initial query</td>
                    <td>
                      Triages query, returns questions OR completed report
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>run_with_clarifications_complete()</code>
                    </td>
                    <td>User answers all questions</td>
                    <td>
                      Enriches query with answers, runs full research pipeline
                    </td>
                  </tr>
                </tbody>
              </table>

              <p>
                The manager handles all the LLM orchestration - the Workflow
                just needs to call these methods and manage the
                waiting-for-humans part.
              </p>

              <details>
                <summary>
                  Your complete <code>research_manager.py</code> should look
                  like this
                </summary>
                <CodeBlock
                  language="python"
                  title="deep_research/workflows/research_manager.py"
                >
                  {FULL_MANAGER_PY}
                </CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="create-workflow">
              <h2 className={styles.sectionTitle}>
                Step 2: Create the Interactive Research Workflow
              </h2>
              <p>
                Now bring in Temporal. The manager handles LLM orchestration,
                but it can't:
              </p>
              <ul>
                <li>
                  <strong>Persist state</strong> across server restarts
                </li>
                <li>
                  <strong>Wait for humans</strong> without consuming resources
                </li>
                <li>
                  <strong>Resume from failures</strong> without re-running
                  completed work
                </li>
              </ul>
              <p>
                That's what the Workflow provides. It wraps the manager,
                tracks state (query, questions, answers), and uses Temporal's
                primitives to wait indefinitely for human input while
                remaining fully durable.
              </p>

              <p>
                Create <code>deep_research/workflows/research_workflow.py</code>
                .
              </p>

              <h3>Understanding the Workflow structure</h3>
              <p>Here's what this Workflow needs to do:</p>
              <ol>
                <li>
                  <strong>Wait for research to start</strong> via an{" "}
                  <a
                    href="https://docs.temporal.io/develop/python/message-passing#send-update-from-client"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Update
                  </a>{" "}
                  from the UI
                </li>
                <li>
                  <strong>Determine if clarifications are needed</strong> by
                  calling the manager
                </li>
                <li>
                  <strong>Wait for human answers</strong> (can wait
                  indefinitely - hours, days, weeks)
                </li>
                <li>
                  <strong>Complete research</strong> when all answers are
                  collected
                </li>
                <li>
                  <strong>Return the final report</strong>
                </li>
              </ol>

              <h3>Set up imports and data classes</h3>
              <p>Start with the imports:</p>
              <CodeBlock language="python">{WORKFLOW_IMPORTS}</CodeBlock>

              <Admonition type="note">
                <p>
                  <strong>
                    Why <code>workflow.unsafe.imports_passed_through()</code>?
                  </strong>{" "}
                  Temporal relies on a{" "}
                  <a
                    href="https://docs.temporal.io/encyclopedia/event-history/event-history-python"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Replay mechanism
                  </a>{" "}
                  to recover from failure. As your program progresses, Temporal
                  saves the input and output from function calls to the
                  history. This allows a failed program to restart right where
                  it left off.
                </p>
                <p>
                  Temporal requires this special import pattern for Workflows
                  for replay. This import pattern tells Temporal:{" "}
                  <em>"These imports are safe to use during replay."</em>
                </p>
              </Admonition>

              <p>
                Next, define the data classes that the Workflow uses to
                communicate with the outside world:
              </p>
              <CodeBlock language="python">{WORKFLOW_DATACLASSES}</CodeBlock>

              <p>These data classes serve specific purposes:</p>
              <ul>
                <li>
                  <strong>
                    <code>UserQueryInput</code>
                  </strong>
                  : What the UI sends when starting research
                </li>
                <li>
                  <strong>
                    <code>SingleClarificationInput</code>
                  </strong>
                  : What the UI sends when answering a question
                </li>
                <li>
                  <strong>
                    <code>ResearchStatus</code>
                  </strong>
                  : What the UI polls to show progress
                </li>
                <li>
                  <strong>
                    <code>InteractiveResearchResult</code>
                  </strong>
                  : The final output when research completes
                </li>
              </ul>

              <h3>Define the Workflow class</h3>
              <p>
                Now create the main Workflow class. Start with the class
                definition and initialization:
              </p>
              <CodeBlock language="python">{WORKFLOW_CLASS_INIT}</CodeBlock>

              <Admonition
                type="tip"
                title="Why you create the manager inside the Workflow"
              >
                <p>
                  Notice that <code>InteractiveResearchManager()</code> is
                  instantiated inside the Workflow. This is the key to making
                  your LLM calls durable.
                </p>
                <p>
                  When the Workflow calls{" "}
                  <code>
                    self.research_manager.run_with_clarifications_start()
                  </code>
                  , that method calls <code>Runner.run()</code> internally.
                  Because this happens inside a Workflow context, the OpenAI
                  Agents plugin intercepts those calls and executes them as
                  durable Activities.
                </p>
                <p>
                  The manager itself has no Temporal code - it's plain Python.
                  The durability comes from <em>where</em> it runs (inside a
                  Workflow) and the plugin configuration (on the{" "}
                  <a
                    href="https://docs.temporal.io/workers"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Worker
                  </a>
                  , which you configure in the next part).
                </p>
              </Admonition>

              <p>Add a helper method for building results:</p>
              <CodeBlock language="python">{BUILD_RESULT_HELPER}</CodeBlock>

              <h3>Adding human in the loop</h3>
              <p>
                Let's understand how the UI communicates with the Workflow to
                enable human-in-the-loop interactions.
              </p>

              <p>The research Workflow follows this pattern:</p>
              <ol>
                <li>
                  <strong>Workflow starts</strong> and immediately waits for
                  the user's research query
                </li>
                <li>
                  <strong>User submits query</strong> → Workflow processes it,
                  may generate clarifying questions
                </li>
                <li>
                  <strong>Workflow pauses</strong> and waits for the user to
                  answer (can wait indefinitely - hours, days, weeks)
                </li>
                <li>
                  <strong>User submits answers</strong> → Workflow resumes and
                  completes the research
                </li>
                <li>
                  <strong>Workflow returns</strong> the final report
                </li>
              </ol>

              <p>
                Unlike a traditional server that would timeout or consume
                resources while waiting,{" "}
                <strong>
                  Temporal Workflows can pause indefinitely at zero cost
                </strong>
                . The Workflow state is durably persisted, and it resumes
                instantly when input arrives.
              </p>

              <p>Here's how the UI, server, and Workflow communicate:</p>
              <CodeBlock>{COMMS_DIAGRAM}</CodeBlock>

              <p>
                The Workflow exposes three types of handlers for this
                communication:
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Handler</th>
                    <th>Type</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>get_status()</code>
                    </td>
                    <td>Query</td>
                    <td>
                      Read current state (questions, answers, status)
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>start_research()</code>
                    </td>
                    <td>Update</td>
                    <td>
                      Send query, receive status with any clarification
                      questions
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>provide_clarification()</code>
                    </td>
                    <td>Update</td>
                    <td>Send answer, receive updated status</td>
                  </tr>
                </tbody>
              </table>

              <p>Now implement each of these handlers.</p>

              <h3>Add the Query handler</h3>
              <p>
                Before adding the handlers that modify state, add a method to
                read state. The <code>get_status</code> method serves two
                purposes:
              </p>
              <ol>
                <li>
                  <strong>As a Query handler</strong> - Clients can call it
                  directly to check the Workflow's current state
                </li>
                <li>
                  <strong>As a helper</strong> - The Update handlers (which
                  you'll add next) call it to return status after modifying
                  state
                </li>
              </ol>
              <p>
                <a
                  href="https://docs.temporal.io/encyclopedia/workflow-message-passing#sending-queries"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Queries
                </a>{" "}
                are read-only - they can inspect Workflow state but cannot
                modify it. The server's <code>/api/status</code> endpoint
                calls this Query to get the current state: What's the original
                query? Are there clarification questions? How many have been
                answered?
              </p>
              <CodeBlock language="python">{GET_STATUS_PY}</CodeBlock>

              <h3>Add the Update handlers</h3>
              <p>
                Now add the handlers that receive input and modify state.
                That's where{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/workflow-message-passing#sending-updates"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Updates
                </a>{" "}
                come in.
              </p>

              <details>
                <summary>What is an Update?</summary>
                <p>
                  Temporal provides three ways to communicate with a running
                  Workflow:
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Direction</th>
                      <th>Can modify state?</th>
                      <th>Returns response?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>
                          <a
                            href="https://docs.temporal.io/develop/python/message-passing#send-query"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Query
                          </a>
                        </strong>
                      </td>
                      <td>Client → Workflow</td>
                      <td>No (read-only)</td>
                      <td>Yes</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>
                          <a
                            href="https://docs.temporal.io/develop/python/message-passing#send-signal-from-client"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Signal
                          </a>
                        </strong>
                      </td>
                      <td>Client → Workflow</td>
                      <td>Yes</td>
                      <td>No</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>
                          <a
                            href="https://docs.temporal.io/sending-messages#sending-updates"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Update
                          </a>
                        </strong>
                      </td>
                      <td>Client → Workflow</td>
                      <td>Yes</td>
                      <td>Yes</td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  An{" "}
                  <a
                    href="https://docs.temporal.io/encyclopedia/workflow-message-passing#sending-updates"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Update
                  </a>{" "}
                  combines the best of both: it can modify Workflow state like
                  a Signal, but also returns a response like a Query. This
                  makes it perfect for this use case - the UI sends a research
                  query and immediately gets back the status (including any
                  clarification questions).
                </p>
              </details>

              <p>First, add the Update that starts research:</p>
              <CodeBlock language="python">{START_RESEARCH_PY}</CodeBlock>

              <p>
                This Update calls the manager to check if clarifications are
                needed, stores the result, then sets{" "}
                <code>research_initialized = True</code>. It returns the
                current status (using the <code>get_status</code> Query you
                just defined) so the UI knows immediately whether to show
                clarification questions.
              </p>

              <p>Next, add the Update that accepts clarification answers:</p>
              <CodeBlock language="python">
                {PROVIDE_CLARIFICATION_PY}
              </CodeBlock>

              <p>
                Each time the user answers a question, this Update appends
                their answer to <code>clarification_responses</code>.
              </p>

              <h3>Add the main run method</h3>
              <p>
                Now that you've created handlers for receiving input (Updates)
                and checking state (Queries), add the main <code>run</code>{" "}
                method that coordinates everything.
              </p>
              <p>
                The <code>run</code> method needs to wait for external input -
                first for the user's query, then potentially for their answers
                to clarification questions. This is where{" "}
                <a
                  href="https://python.temporal.io/temporalio.workflow.html#wait_condition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>workflow.wait_condition()</code>
                </a>{" "}
                comes in:
              </p>
              <ul>
                <li>Pauses the Workflow until a condition becomes true</li>
                <li>
                  Consumes <strong>zero resources</strong> while waiting - no
                  polling, no timers
                </li>
                <li>Resumes instantly when an Update modifies state</li>
                <li>
                  Optionally accepts a timeout:{" "}
                  <code>
                    workflow.wait_condition(lambda: condition,
                    timeout=timedelta(hours=24))
                  </code>
                </li>
              </ul>
              <CodeBlock language="python">{RUN_METHOD_PY}</CodeBlock>

              <p>Here's how the pieces connect:</p>
              <ol>
                <li>
                  The <code>run</code> method starts and waits for{" "}
                  <code>research_initialized</code> to become <code>True</code>
                </li>
                <li>
                  When the UI calls <code>start_research</code>, that Update
                  sets <code>research_initialized = True</code>
                </li>
                <li>
                  The first <code>wait_condition</code> wakes up and the
                  Workflow continues
                </li>
                <li>
                  If clarifications are needed, it waits for all answers to be
                  collected
                </li>
                <li>
                  When <code>provide_clarification</code> adds the final
                  answer, the second <code>wait_condition</code> wakes up
                </li>
                <li>
                  The Workflow completes the research and returns the report
                </li>
              </ol>

              <details>
                <summary>
                  Your complete <code>research_workflow.py</code> should look
                  like this
                </summary>
                <CodeBlock
                  language="python"
                  title="deep_research/workflows/research_workflow.py"
                >
                  {FULL_WORKFLOW_PY}
                </CodeBlock>
              </details>

              <h3>What you built</h3>
              <p>
                The Workflow exposes three interfaces for external
                communication:
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Interface</th>
                    <th>Type</th>
                    <th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>get_status()</code>
                    </td>
                    <td>Query</td>
                    <td>UI polls for current state (read-only)</td>
                  </tr>
                  <tr>
                    <td>
                      <code>start_research()</code>
                    </td>
                    <td>Update</td>
                    <td>
                      UI sends query, receives status (may include questions)
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <code>provide_clarification()</code>
                    </td>
                    <td>Update</td>
                    <td>UI sends answer, receives updated status</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className={styles.section} id="clean-up">
              <h2 className={styles.sectionTitle}>
                Step 3: Clean up the old manager
              </h2>
              <p>
                The template's original{" "}
                <code>deep_research/research_manager.py</code> managed sessions
                in memory without durability. Now that you've created the
                durable <code>InteractiveResearchManager</code> in{" "}
                <code>deep_research/workflows/research_manager.py</code>, the
                old file is no longer needed.
              </p>
              <p>Delete it:</p>
              <CodeBlock language="bash">{DELETE_OLD_MANAGER}</CodeBlock>
              <p>
                Your new Workflow and Manager handle everything the old file
                did - but durably.
              </p>
              <p>
                Now that you've created the Workflow, Manager, and data
                classes, run everything and see durability in action in{" "}
                <Link to="/tutorials/ai/deep-research/03-running-your-deep-agent/">
                  Part 3: Running Your Application
                </Link>
                .
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/deep-research/01-setting-the-stage/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous: Part 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Setting the Stage
                </span>
              </Link>
              <Link
                to="/tutorials/ai/deep-research/03-running-your-deep-agent/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: Part 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &rarr;
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Running Your Application
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
