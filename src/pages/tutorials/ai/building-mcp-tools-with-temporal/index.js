import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/ai/building-mcp-tools-with-temporal/introducing-mcp-temporal/",
    eyebrow: "Part 1 - ~60 min",
    title: "Introducing MCP and Temporal",
    body:
      "Build a weather forecast MCP server that Claude Desktop can use to fetch real-time data from the National Weather Service API. Implement the tool with Temporal Workflows so API calls, retries, and state management are handled automatically.",
    cta: "Start part 1",
  },
  {
    href: "/tutorials/ai/building-mcp-tools-with-temporal/adding-hitl-to-mcp-tools/",
    eyebrow: "Part 2 - ~90 min",
    title: "Adding Human-in-the-Loop to MCP Tools",
    body:
      "Add durable human-in-the-loop capabilities to a long-running invoice processing MCP tool. Use Temporal Signals, Queries, and durable timers to pause for approval, read live state, and survive crashes mid-wait.",
    cta: "Start part 2",
  },
];

export default function BuildingMcpToolsLandingPage() {
  return (
    <Layout
      title="Building Durable MCP Tools with Temporal"
      description="Learn how to build durable MCP (Model Context Protocol) tools using Temporal Workflows for reliable AI integrations."
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
          <main
            className={styles.pageMain}
            style={{ gridColumn: "1 / -1", maxWidth: "1200px", margin: "0 auto" }}
          >
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI", href: "/tutorials/ai" },
                  { label: "Building Durable MCP Tools" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Building Durable MCP Tools with Temporal
            </h1>

            <MetaChips items={["Series - 2 parts", "MCP", "AI agents"]} />

            <p className={styles.intro}>
              Learn how to build durable MCP (Model Context Protocol) tools
              using Temporal Workflows for reliable AI integrations. This
              two-part series shows you how to expose Temporal Workflows as
              MCP tools - first for a simple request-response weather server,
              then for a long-running invoice processor with human-in-the-loop
              approval.
            </p>
            <p>
              In <strong>Part 1</strong>, you'll build a weather forecast MCP
              server that Claude Desktop can use to fetch real-time weather
              data from the National Weather Service API. You'll implement
              the tool using Temporal Workflows, which handle the API calls,
              retries, and state management automatically.
            </p>
            <p>
              In <strong>Part 2</strong>, you'll add durable
              human-in-the-loop capabilities to a long-running invoice
              processing MCP tool with Temporal Signals, Queries, and durable
              timers.
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
