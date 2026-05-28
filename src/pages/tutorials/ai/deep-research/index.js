import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const CHAPTERS = [
  {
    href: "/tutorials/ai/deep-research/01-setting-the-stage/",
    eyebrow: "Part 1 · ~20 min",
    title: "Setting the Stage",
    body:
      "Clone the template repository for a non-durable research agent, run it, and understand how the multi-agent pipeline works.",
    cta: "Start Part 1",
  },
  {
    href: "/tutorials/ai/deep-research/02-creating-the-workflow/",
    eyebrow: "Part 2 · ~60 min",
    title: "Creating the Workflow",
    body:
      "Build the research manager to orchestrate agents and the Temporal Workflow to manage state and human-in-the-loop interactions.",
    cta: "Start Part 2",
  },
  {
    href: "/tutorials/ai/deep-research/03-running-your-deep-agent/",
    eyebrow: "Part 3 · ~30 min",
    title: "Running Your Application",
    body:
      "Create the Temporal Worker with the OpenAI Agents plugin, run the application end to end, and test durability by surviving crashes.",
    cta: "Start Part 3",
  },
];

export default function DeepResearchLandingPage() {
  return (
    <Layout
      title="Building Deep Research Agents with the OpenAI Agents SDK"
      description="A three-part tutorial series on building a durable, multi-agent deep research application with human-in-the-loop capabilities using Temporal and the OpenAI Agents SDK."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="Building Deep Research Agents with the OpenAI Agents SDK"
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "AI", href: "/tutorials/ai" },
                  { label: "Deep Research" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Building Deep Research Agents with the OpenAI Agents SDK
            </h1>

            <MetaChips items={["Series · 3 parts", "OpenAI", "AI agents"]} />

            <p className={styles.intro}>
              This three-part tutorial series walks you through building a
              durable, multi-agent deep research application with
              human-in-the-loop capabilities using Temporal and the OpenAI
              Agents SDK.
            </p>

            <ul>
              <li>
                <strong>Part 1: Setting the Stage</strong> - Clone the template
                repository (a non-durable research agent), run it, and
                understand how the multi-agent pipeline works.
              </li>
              <li>
                <strong>Part 2: Creating the Workflow</strong> - Build the
                research manager to orchestrate agents and the Workflow to
                manage state and human-in-the-loop interactions.
              </li>
              <li>
                <strong>Part 3: Running Your Application</strong> - Create the
                Temporal Worker with the OpenAI Agents plugin, and test
                durability by surviving crashes.
              </li>
            </ul>

            <Admonition type="tip">
              <p>
                <a
                  href="https://pages.temporal.io/get-updates-education"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sign up here
                </a>{" "}
                to get notified when we drop new educational content.
              </p>
            </Admonition>

            <div className={styles.nextSection} style={{ marginTop: "32px" }}>
              <div className={styles.nextGrid}>
                {CHAPTERS.map((c) => (
                  <Link key={c.href} to={c.href} className={styles.nextCard}>
                    <span className={styles.nextEyebrow}>{c.eyebrow}</span>
                    <h3 className={styles.nextTitle}>{c.title}</h3>
                    <p className={styles.nextBody}>{c.body}</p>
                    <span className={styles.nextCta}>
                      {c.cta} <span aria-hidden="true">&rarr;</span>
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
