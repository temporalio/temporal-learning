import React, { useState, useEffect, useRef } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import SdkChips from "@site/src/components/hub/SdkChips/SdkChips";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import { COURSES } from "@site/src/data/hub";
import styles from "./ai.module.css";

const AI_TUTORIALS = COURSES.filter(
  (c) => c.kind === "tutorial" && (c.topics ?? []).includes("ai")
);

function TutorialCard({ title, summary, href, sdkLanguages }) {
  return (
    <Link to={href} className={styles.tutorialCard}>
      <h3 className={styles.tutorialCardTitle}>{title}</h3>
      {summary && <p className={styles.tutorialCardSummary}>{summary}</p>}
      {sdkLanguages && sdkLanguages.length > 0 && (
        <div className={styles.tutorialCardSdks}>
          <SdkChips sdks={sdkLanguages} />
        </div>
      )}
      <div className={styles.tutorialCardCta}>
        Read tutorial <span aria-hidden="true" className={styles.tutorialCardArrow}>→</span>
      </div>
    </Link>
  );
}

const COOKBOOK_RECIPES = [
  {
    title: "Hello World",
    summary: "Call an LLM from a Workflow. The Temporal-flavored Hello World - generic Activity, retries handled by Temporal, not the OpenAI client.",
    href: "https://docs.temporal.io/ai-cookbook/hello-world-openai-responses-python",
    tags: ["Foundations", "OpenAI", "Python"],
  },
  {
    title: "Tool calling agent",
    summary: "The foundational tool-calling pattern: LLM decides what tool to invoke, Temporal Activity runs it, result feeds back to the LLM.",
    href: "https://docs.temporal.io/ai-cookbook/tool-call-openai-python",
    tags: ["Tool Calling", "OpenAI", "Python"],
  },
  {
    title: "Agentic loop (OpenAI)",
    summary: "Full agentic loop with dynamic Activities so tools are loosely coupled from agent logic. Conversation history threaded through each turn.",
    href: "https://docs.temporal.io/ai-cookbook/agentic-loop-tool-call-openai-python",
    tags: ["Agents", "Tool Calling", "OpenAI", "Python"],
  },
  {
    title: "Agentic loop (Claude)",
    summary: "Same agentic loop pattern, but with Anthropic's Messages API and Claude's input_schema tool format.",
    href: "https://docs.temporal.io/ai-cookbook/agentic-loop-tool-call-claude-python",
    tags: ["Agents", "Tool Calling", "Anthropic", "Python"],
  },
  {
    title: "OpenAI Agents SDK",
    summary: "Use Temporal's OpenAI Agents SDK integration. Activities become tools via activity_as_tool - no manual LLM Activity required.",
    href: "https://docs.temporal.io/ai-cookbook/openai-agents-sdk-python",
    tags: ["Agents", "OpenAI", "Python"],
  },
  {
    title: "Durable MCP server",
    summary: "Expose Temporal Workflows as MCP tools using FastMCP. Each tool invocation kicks off a durable Workflow.",
    href: "https://docs.temporal.io/ai-cookbook/hello-world-durable-mcp-server",
    tags: ["MCP", "Python"],
  },
  {
    title: "Human-in-the-loop",
    summary: "Pause an agent on risky actions, wait for human approval via Temporal Signal, then continue or cancel. Wait for hours or days with zero compute cost.",
    href: "https://docs.temporal.io/ai-cookbook/human-in-the-loop-python",
    tags: ["Agents", "Signals", "OpenAI", "Python"],
  },
  {
    title: "Claim check pattern",
    summary: "Offload large conversation history to S3 via a PayloadCodec so your Event History stays under the server size limit.",
    href: "https://docs.temporal.io/ai-cookbook/claim-check-pattern-python",
    tags: ["Patterns", "Python"],
  },
  {
    title: "Deep research",
    summary: "Multi-agent research pipeline: planning, query generation, web search, report synthesis. Survives failures across dozens of LLM calls.",
    href: "https://docs.temporal.io/ai-cookbook/basic-openai-python",
    tags: ["Agents", "Deep Research", "OpenAI", "Python"],
  },
];

function RecipeCard({ title, summary, href, tags }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.recipeCard}
    >
      {tags && tags.length > 0 && (
        <div className={styles.recipeTags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.recipeTag} data-tag={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <h3 className={styles.recipeTitle}>{title}</h3>
      <p className={styles.recipeSummary}>{summary}</p>
      <div className={styles.recipeCta}>
        View recipe <span aria-hidden="true" className={styles.recipeArrow}>→</span>
      </div>
    </a>
  );
}

const EXPERT_SESSIONS = [
  {
    videoId: "n__rXmGjwYY",
    title: "Learn to Build AI Agents with Temporal",
    description:
      "Foundational walkthrough of building durable AI agents on Temporal - what Temporal gives you for free and how to wire it into your agent loop.",
  },
  {
    videoId: "LBGeejpKh5o",
    title: "Deep Dive: AI Agent Code Walkthrough with Temporal",
    description:
      "Line-by-line walkthrough of a working durable agent - Activities, Workflows, retries, and how the pieces fit together at runtime.",
  },
  {
    videoId: "eyLf4Kqd6lg",
    title: "Build a Deep Research Agent",
    description:
      "Multi-agent deep research workflow in Python with OpenAI and Temporal. Planning, query generation, web search, report synthesis - end to end.",
  },
];

function VideoCard({ videoId, title, description }) {
  const href = `https://www.youtube.com/watch?v=${videoId}`;
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.videoCard}
    >
      <div className={styles.videoThumbWrap}>
        <img
          src={thumb}
          alt=""
          className={styles.videoThumb}
          loading="lazy"
        />
        <div className={styles.videoPlay} aria-hidden="true">▶</div>
      </div>
      <div className={styles.videoBody}>
        <h3 className={styles.videoTitle}>{title}</h3>
        <p className={styles.videoDescription}>{description}</p>
        <div className={styles.videoCta}>
          Watch on YouTube <span aria-hidden="true" className={styles.videoArrow}>→</span>
        </div>
      </div>
    </a>
  );
}

const AI_TOOLS = [
  {
    label: "SKILL",
    title: "Temporal Developer Skill",
    description:
      "Hands AI coding agents (Claude Code, Cursor, Codex) expert knowledge of determinism rules, Activity patterns, retry policies, testing, versioning, and the pitfalls Temporal devs hit.",
    installLabel: "Claude Code",
    install: "/plugin install temporal@temporal-marketplace",
    href: "https://github.com/temporalio/skill-temporal-developer",
  },
  {
    label: "SKILL",
    title: "Temporal Cloud Skill",
    description:
      "Helps AI agents troubleshoot Temporal Cloud connectivity, authentication, and configuration. Useful when your agent is already writing Cloud-deployed apps.",
    installLabel: "Any agent (npx)",
    install: "npx skills add https://github.com/temporalio/skill-temporal-cloud",
    href: "https://github.com/temporalio/skill-temporal-cloud",
  },
  {
    label: "MCP SERVER",
    title: "Temporal Knowledge Base",
    description:
      "Real-time MCP server compiled from docs, courses, the community forum, and Slack. Your AI assistant queries it for best practices instead of guessing.",
    installLabel: "Claude Code",
    install:
      "claude mcp add --scope user --transport http temporal-docs https://temporal.mcp.kapa.ai",
    href: "https://docs.temporal.io/with-ai",
  },
];

function ToolCard({ tool }) {
  return (
    <article className={styles.toolCard}>
      <div className={styles.toolLabel}>{tool.label}</div>
      <h3 className={styles.toolTitle}>{tool.title}</h3>
      <p className={styles.toolBody}>{tool.description}</p>
      <div className={styles.toolInstall}>
        <span className={styles.toolInstallLabel}>{tool.installLabel}</span>
        <code className={styles.toolCode}>{tool.install}</code>
      </div>
      <a
        href={tool.href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.toolLink}
      >
        Learn more
        <span aria-hidden="true" className={styles.toolArrow}>→</span>
      </a>
    </article>
  );
}

const TOC_ITEMS = [
  { id: "tutorials", label: "Tutorials" },
  { id: "cookbook", label: "AI Cookbook Recipes" },
  { id: "ai-tools", label: "Use AI to write Temporal code" },
  { id: "expert-sessions", label: "Expert sessions" },
];

function AiToc() {
  const [activeId, setActiveId] = useState(TOC_ITEMS[0].id);
  const observerRef = useRef(null);

  useEffect(() => {
    const targets = TOC_ITEMS
      .map((i) => document.getElementById(i.id))
      .filter(Boolean);
    if (targets.length === 0) return undefined;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.offsetTop - b.target.offsetTop);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );

    targets.forEach((t) => observerRef.current.observe(t));
    return () => observerRef.current && observerRef.current.disconnect();
  }, []);

  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
    if (history.replaceState) history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav className={styles.toc} aria-label="On this page">
      <div className={styles.tocLabel}>On this page</div>
      <ol className={styles.tocList}>
        {TOC_ITEMS.map((item, i) => {
          const n = String(i + 1).padStart(2, "0");
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ""}`}
                aria-current={isActive ? "true" : undefined}
              >
                <span className={styles.tocNum}>{n}</span>
                <span className={styles.tocText}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function AiPage() {
  return (
    <Layout
      title="Temporal + AI"
      description="Build Durable AI Agents with Temporal, or use AI tools to write better Temporal code."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Temporal University / AI"
          title="Temporal + AI."
          body="Build Durable AI Agents that survive failures mid-conversation, or hand your AI coding assistant deep Temporal expertise."
          showSearch={false}
        />

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <AiToc />
          </aside>
          <main className={styles.pageMain}>

        <section className={styles.section} id="tutorials">
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Temporal University", href: "/" },
                { label: "AI" },
              ]}
            />

            <h2 className={styles.sectionTitle}>Build Durable AI Applications with these Tutorials</h2>
            <p className={styles.sectionSub}>
              Long-running agents need durable state, tool-call retries, and the ability to resume mid-conversation when a Worker crashes. Follow these tutorials to learn how to add Temporal to your applications.
            </p>
            {AI_TUTORIALS.length > 0 ? (
              <div className={styles.tutorialGrid}>
                {AI_TUTORIALS.map((course) => (
                  <TutorialCard
                    key={course.slug}
                    title={course.title}
                    summary={course.summary}
                    href={course.url}
                    sdkLanguages={course.sdkLanguages}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No AI tutorials in the manifest yet.</p>
            )}
          </div>
        </section>

        <section className={styles.section} id="cookbook">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>AI Cookbook Recipes</h2>
            <p className={styles.sectionSub}>
              Bite-sized Python recipes you can copy into a project today. Each one shows a single pattern - calling an LLM, looping with tool calls, signaling for human approval - and explains the Temporal design decisions behind it.
            </p>
            <div className={styles.recipeGrid}>
              {COOKBOOK_RECIPES.map((recipe) => (
                <RecipeCard key={recipe.href} {...recipe} />
              ))}
            </div>
            <p className={styles.toolFooter}>
              See the full library at{" "}
              <a
                href="https://docs.temporal.io/ai-cookbook"
                target="_blank"
                rel="noopener noreferrer"
              >
                docs.temporal.io/ai-cookbook
              </a>
              .
            </p>
          </div>
        </section>

        <section className={styles.section} id="ai-tools">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Use AI to Write Temporal Code</h2>
            <p className={styles.sectionSub}>
              Install Temporal-aware skills and an MCP server into your AI coding assistant.
            </p>
            <div className={styles.toolGrid}>
              {AI_TOOLS.map((tool) => (
                <ToolCard key={tool.title} tool={tool} />
              ))}
            </div>
            <p className={styles.toolFooter}>
              Setup instructions for Cursor, Codex, Claude Desktop, and manual installs live at{" "}
              <a
                href="https://docs.temporal.io/with-ai"
                target="_blank"
                rel="noopener noreferrer"
              >
                docs.temporal.io/with-ai
              </a>
              .
            </p>
          </div>
        </section>

        <section className={styles.section} id="expert-sessions">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Expert sessions</h2>
            <p className={styles.sectionSub}>
            Explore architecture, patterns, and lessons for building durable agents.
            </p>
            <div className={styles.videoGrid}>
              {EXPERT_SESSIONS.map((video) => (
                <VideoCard key={video.videoId} {...video} />
              ))}
            </div>
          </div>
        </section>

            <div className={styles.bottomCta}>
              <MagentaCta href="https://temporal.io/solutions/ai">
                Explore Temporal for AI
              </MagentaCta>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
