// Tutorial chapter 1 of 3: Setting the stage for the deep research agent.
// Canonical code lives at https://github.com/temporalio/edu-deep-research-tutorial-template.
// Update the *_PY constants here when the upstream repo changes.

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "getting-started", label: "Getting started: clone the template" },
  { id: "current-architecture", label: "Understanding the current architecture" },
  { id: "openai-agents-sdk", label: "The OpenAI Agents SDK and Temporal" },
  { id: "setup", label: "Setup" },
];

const CLONE_CMDS = `git clone https://github.com/temporalio/edu-deep-research-tutorial-template.git
cd edu-deep-research-tutorial-template`;

const UV_SYNC = `uv sync`;

const ENV_SETUP = `cp .env-sample .env
# Edit .env and add your OPENAI_API_KEY`;

const RUN_SERVER = `uv run run_server.py`;

const PROJECT_TREE = `├── run_server.py              # Backend API for the chat interface
├── ui/                        # Browser-based chat interface
└── deep_research/
    ├── agents/                # Individual AI agents (OpenAI Agents SDK)
    │   ├── triage_agent.py    # Decides if clarification is needed
    │   ├── clarifying_agent.py# Generates follow-up questions
    │   ├── planner_agent.py   # Creates search strategy
    │   ├── search_agent.py    # Executes web searches
    │   └── writer_agent.py    # Writes final report
    ├── models.py              # Pydantic models for structured outputs
    └── research_manager.py    # Orchestrates agents + manages sessions (NOT durable)`;

const PIPELINE_DIAGRAM = `User Query
    ↓
┌─────────────────┐
│  Triage Agent   │ → Decides: Is this query specific enough?
└─────────────────┘
    ↓ No                          ↓ Yes
┌─────────────────┐               │
│Clarifying Agent │               │
└─────────────────┘               │
    ↓                             │
  User answers questions ←────────┤
    ↓                             │
┌─────────────────┐               │
│ Planner Agent   │ ← ───────────┘
└─────────────────┘
    ↓
┌─────────────────┐
│ Search Agent(s) │ → Runs multiple searches concurrently
└─────────────────┘
    ↓
┌─────────────────┐
│  Writer Agent   │ → Synthesizes results into a report
└─────────────────┘
    ↓
Final Report`;

const AGENT_BASIC_PY = `from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="You help with research.",
    model="gpt-4o-mini",
)
result = await Runner.run(agent, "What is the best spaghetti recipe?")`;

const MULTI_AGENT_PY = `# Agent 1: Plan what to search
planner = Agent(name="Planner", instructions="Create a search plan.")
plan = await Runner.run(planner, "Research best restaurants in North Carolina")

# Agent 2: Execute searches based on the plan
searcher = Agent(name="Searcher", instructions="Search the web.")
results = await Runner.run(searcher, plan.final_output)

# Agent 3: Write a report from search results
writer = Agent(name="Writer", instructions="Write a research report.")
report = await Runner.run(writer, results.final_output)`;

const ADD_TEMPORAL = `uv add 'temporalio[openai-agents]'`;

const COMPONENTS_DIAGRAM = `Browser UI ──► Workflow ──► Manager ──► OpenAI API
                  │            │
                  │            └── calls Runner.run() for each agent to make LLM calls durable
                  │
                  └── tracks state (query, questions, answers)`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Part 1: Setting the Stage - Deep Research Agent"
      description="Clone the template repository, run the non-durable research agent, and understand how the multi-agent pipeline works."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI", href: "/tutorials/ai" },
                  {
                    label: "Deep Research",
                    href: "/tutorials/ai/deep-research/",
                  },
                  { label: "Part 1: Setting the Stage" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Part 1: Setting the Stage for Your Deep Research Agent
            </h1>

            <MetaChips items={["~20 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Deep research agents orchestrate multiple LLM calls - triaging
              queries, asking clarifying questions, planning searches,
              gathering information, and writing reports. But there's a catch:{" "}
              <strong>what happens when an agent fails halfway through?</strong>
            </p>

            <p>Consider this scenario. Your research agent has already:</p>
            <ol>
              <li>Determined your query needs clarification</li>
              <li>Generated three clarifying questions</li>
              <li>Collected your answers to two of them</li>
            </ol>

            <p>
              Then your server crashes. Without durability, you're back to
              square one - losing the LLM calls you've already paid for and
              forcing your user to start over.
            </p>

            <p>
              This challenge becomes especially important with multi-agent
              architectures where <em>agents call other agents</em>, creating
              deep call stacks where a failure at any level can cascade and
              lose significant work.
            </p>

            <p>
              In this tutorial, you'll transform a working (but non-durable)
              deep research agent into a production-ready application using{" "}
              <a
                href="https://temporal.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal
              </a>{" "}
              and the{" "}
              <a
                href="https://openai.github.io/openai-agents-python/"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAI Agents SDK
              </a>
              . By the end, your agent will:
            </p>

            <ul>
              <li>
                <strong>Survive failures</strong> at any step without losing
                progress
              </li>
              <li>
                <strong>Wait indefinitely</strong> for human input while
                maintaining state
              </li>
              <li>
                <strong>Automatically retry</strong> failed LLM calls with
                exponential backoff
              </li>
              <li>
                <strong>Resume seamlessly</strong> after crashes or restarts
              </li>
            </ul>

            <p>
              You use the OpenAI Agents SDK in this tutorial because it
              provides a clean, minimal abstraction for building multi-agent
              systems - and because Temporal has a built-in integration that
              makes every agent call automatically durable.
            </p>

            <h3>Video version of this tutorial</h3>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
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
                src="https://www.youtube.com/embed/eyLf4Kqd6lg?rel=0&iv_load_policy=3&modestbranding=1&showinfo=0&wmode=transparent"
                title="Build a Deep Research Agent Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial, you should have:</p>
              <ul>
                <li>
                  Beginner knowledge of Temporal including{" "}
                  <a
                    href="https://docs.temporal.io/workflows"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflows
                  </a>
                  ,{" "}
                  <a
                    href="https://docs.temporal.io/activities"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activities
                  </a>
                  , and{" "}
                  <a
                    href="https://docs.temporal.io/workers"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workers
                  </a>
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
                <li>
                  Cloned{" "}
                  <a
                    href="https://github.com/temporalio/edu-deep-research-tutorial-template"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    the template repository
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="getting-started">
              <h2 className={styles.sectionTitle}>
                Getting started: clone the template repository
              </h2>
              <p>
                The{" "}
                <a
                  href="https://github.com/temporalio/edu-deep-research-tutorial-template"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  template repository
                </a>{" "}
                contains a fully functional deep research agent - but{" "}
                <strong>without any durability</strong>. Get it running first
                so you can see what you're working with.
              </p>
              <p>
                You can follow along with the solution{" "}
                <a
                  href="https://github.com/temporalio/edu-deep-research-tutorial-template/tree/video_tutorial"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
                .
              </p>

              <ol>
                <li>
                  <p>
                    <strong>Clone the repository:</strong>
                  </p>
                  <CodeBlock language="bash">{CLONE_CMDS}</CodeBlock>
                </li>
                <li>
                  <p>
                    <strong>Install dependencies:</strong>
                  </p>
                  <CodeBlock language="bash">{UV_SYNC}</CodeBlock>
                </li>
                <li>
                  <p>
                    <strong>Set up your OpenAI API key:</strong>
                  </p>
                  <CodeBlock language="bash">{ENV_SETUP}</CodeBlock>
                  <p>
                    Skip this step if you already have{" "}
                    <code>OPENAI_API_KEY</code> exported in your shell profile
                    (for example, <code>.zshrc</code> or <code>.bashrc</code>).
                  </p>
                </li>
                <li>
                  <p>
                    <strong>Run the application:</strong>
                  </p>
                  <CodeBlock language="bash">{RUN_SERVER}</CodeBlock>
                </li>
                <li>
                  <p>
                    <strong>Open your browser</strong> and navigate to{" "}
                    <strong>http://localhost:8234</strong>
                  </p>
                </li>
              </ol>

              <p>
                Try entering a research query like{" "}
                <em>"what is the best spaghetti recipe?"</em> The agent will
                ask clarifying questions, then conduct research and generate a
                report.
              </p>

              <Admonition type="note">
                <p>
                  <strong>Optional - Observe the problem:</strong> While this
                  works, try stopping the server (Ctrl+C) mid-research. When
                  you restart, all the context is gone. Your agent has no
                  memory of what you last asked and you need to start from
                  scratch. Let's fix that.
                </p>
              </Admonition>

              <details>
                <summary>
                  With Temporal, your agents can handle real-world production
                  challenges:
                </summary>
                <ul>
                  <li>
                    <strong>Rate-limited LLMs?</strong> Automatic retries with
                    backoff until capacity returns
                  </li>
                  <li>
                    <strong>Network issues?</strong> Retries until requests
                    succeed
                  </li>
                  <li>
                    <strong>Application crashes?</strong> Temporal resumes from
                    the last checkpoint, saving you compute and token costs
                  </li>
                  <li>
                    <strong>Found a bug mid-execution?</strong> Fix it and
                    continue running Workflows
                  </li>
                </ul>
              </details>
            </section>

            <section className={styles.section} id="current-architecture">
              <h2 className={styles.sectionTitle}>
                Understanding the current architecture
              </h2>
              <p>Before adding Temporal, understand the existing structure:</p>
              <CodeBlock>{PROJECT_TREE}</CodeBlock>

              <h3>How the agent pipeline works</h3>
              <p>
                When a user submits a research query, it flows through this
                pipeline:
              </p>
              <CodeBlock>{PIPELINE_DIAGRAM}</CodeBlock>

              <p>
                The <code>research_manager.py</code> file orchestrates this
                pipeline and tracks session state in memory. If the server
                restarts, <em>all that state is lost</em>.{" "}
                <strong>
                  You'll replace this with a Temporal Workflow that persists
                  state durably and can wait indefinitely for human input
                </strong>
                .
              </p>
            </section>

            <section className={styles.section} id="openai-agents-sdk">
              <h2 className={styles.sectionTitle}>
                The OpenAI Agents SDK and Temporal
              </h2>
              <p>
                Before diving into the implementation, understand how the
                OpenAI Agents SDK works and how Temporal integrates with it.
              </p>
              <p>
                The{" "}
                <a
                  href="https://openai.github.io/openai-agents-python/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenAI Agents SDK
                </a>{" "}
                provides primitives for building AI agents. An{" "}
                <strong>Agent</strong> combines an LLM with instructions and
                tools. A <strong>Runner</strong> executes those agents:
              </p>
              <CodeBlock language="python">{AGENT_BASIC_PY}</CodeBlock>

              <p>
                You can chain agents together - use one agent's output as
                input to the next - to build complex multi-agent systems like
                the deep research agent in this tutorial:
              </p>
              <CodeBlock language="python">{MULTI_AGENT_PY}</CodeBlock>

              <h3>Making agents durable with Temporal</h3>
              <p>
                The OpenAI Agents SDK has a{" "}
                <strong>built-in Temporal integration</strong> via the{" "}
                <a
                  href="https://python.temporal.io/temporalio.contrib.openai_agents.OpenAIAgentsPlugin.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>OpenAIAgentsPlugin</code>
                </a>
                .
              </p>
              <p>
                Without the plugin, <code>Runner.run()</code> calls the LLM
                directly - if it fails or your app crashes, the work is lost.
                With the plugin, each <code>Runner.run()</code> call is
                recorded in Temporal's{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/event-history/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  event history
                </a>
                . This means:
              </p>
              <ul>
                <li>
                  <strong>If an LLM call fails</strong>, Temporal automatically
                  retries it (with backoff you configure)
                </li>
                <li>
                  <strong>If your Worker crashes mid-research</strong>,
                  Temporal knows which <code>Runner.run()</code> calls already
                  completed and skips them on restart - you don't pay for the
                  same LLM calls twice
                </li>
                <li>
                  <strong>Your code stays clean</strong> - you write normal{" "}
                  <code>Runner.run()</code> calls, no special wrappers needed
                </li>
              </ul>
              <p>
                You code the happy path; Temporal handles the rest. Let's go
                ahead and try it out.
              </p>
            </section>

            <section className={styles.section} id="setup">
              <h2 className={styles.sectionTitle}>Setup</h2>
              <p>Add the Temporal SDK with the OpenAI Agents integration:</p>
              <CodeBlock language="bash">{ADD_TEMPORAL}</CodeBlock>

              <p>Now you'll create these components:</p>
              <ol>
                <li>
                  <strong>InteractiveResearchManager</strong> - A class that{" "}
                  <strong>orchestrates the multi-agent pipeline</strong>:
                  triaging queries, generating clarifying questions, planning
                  searches, executing them, and writing the final report. It
                  calls <code>Runner.run()</code> for each agent. Because it
                  runs inside a Workflow with the OpenAI Agents plugin, every
                  LLM call is automatically durable.
                </li>
                <li>
                  <strong>InteractiveResearchWorkflow</strong> - The Temporal
                  Workflow that{" "}
                  <strong>manages the research session</strong>. It tracks
                  state (original query, clarification questions, user
                  answers), exposes Updates for the UI to start research and
                  submit answers, and pauses indefinitely while waiting for
                  human input - without consuming resources.
                </li>
                <li>
                  <strong>Worker</strong> - The process that{" "}
                  <strong>executes your Workflow and Activities</strong>.
                  You'll configure it with <code>OpenAIAgentsPlugin</code>,
                  which is what makes all those <code>Runner.run()</code>{" "}
                  calls inside the Workflow automatically become durable
                  Activities.
                </li>
              </ol>

              <p>Here's how these components fit together:</p>
              <CodeBlock>{COMPONENTS_DIAGRAM}</CodeBlock>

              <p>
                Now that you've set the stage by exploring the template's
                architecture and how Temporal makes <code>Runner.run()</code>{" "}
                calls durable, build these components in Part 2: Creating the
                Workflow.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/ai/deep-research/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Deep Research series overview
                </span>
              </Link>
              <Link
                to="/tutorials/ai/deep-research/02-creating-the-workflow/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: Part 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &rarr;
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Creating the Workflow
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
