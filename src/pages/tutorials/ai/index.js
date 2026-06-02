import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/ai/building-durable-ai-applications/",
    eyebrow: "Series · 2 parts",
    title: "Building Durable AI Applications",
    body:
      "Transform a simple LLM app into a resilient system that handles crashes, rate limits, and outages - then add durable human-in-the-loop capabilities.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/ai/building-mcp-tools-with-temporal/",
    eyebrow: "Series · 2 parts",
    title: "Building Durable MCP Tools",
    body:
      "Build a weather forecast MCP server for Claude Desktop with Temporal Workflows, then add durable human-in-the-loop to a long-running invoice tool.",
    cta: "Start the MCP series",
  },
  {
    href: "/tutorials/ai/deep-research/",
    eyebrow: "Series · 3 parts",
    title: "Building Deep Research Agents with the OpenAI Agents SDK",
    body:
      "Build a durable, multi-agent deep research application with human-in-the-loop capabilities using Temporal and the OpenAI Agents SDK.",
    cta: "Start the deep research series",
  },
  {
    href: "/tutorials/ai/durable-ai-agent/",
    eyebrow: "Walkthrough · 4 chapters",
    title: "How to Build a Durable AI Agent with Temporal and Python",
    body:
      "Build a durable AI agent from scratch with the Temporal Python SDK. Construct the toolkit, wire up the agent, build the Workflow, and run it end to end.",
    cta: "Build the agent",
  },
];

export default function AiTutorialsLandingPage() {
  return (
    <Layout
      title="AI tutorials"
      description="Learn how to build durable AI applications using Temporal."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="AI tutorials"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <main className={styles.pageMain} style={{ gridColumn: "1 / -1", maxWidth: "1200px", margin: "0 auto" }}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI" },
                ]}
              />
            </div>

            <h1 className={styles.title}>AI tutorials</h1>

            <MetaChips items={["AI agents", "MCP", "Production"]} />

            <p className={styles.intro}>
              Learn how to build durable AI applications using Temporal. These
              tutorials show how to harden LLM-driven systems against the
              real-world failures that make them flaky - network blips, rate
              limits, long human-in-the-loop pauses, and crashes mid-run.
            </p>

            <div className={styles.nextSection} style={{ marginTop: "32px" }}>
              <div className={styles.nextGrid}>
                {TUTORIALS.map((t) => (
                  <Link key={t.href} to={t.href} className={styles.nextCard}>
                    <span className={styles.nextEyebrow}>{t.eyebrow}</span>
                    <h3 className={styles.nextTitle}>{t.title}</h3>
                    <p className={styles.nextBody}>{t.body}</p>
                    <span className={styles.nextCta}>
                      {t.cta} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
