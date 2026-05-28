import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const CHAPTERS = [
  {
    href: "/tutorials/ai/building-durable-ai-applications/01-durable-ai-with-temporal/",
    eyebrow: "Part 1 · ~45 min",
    title: "Durable AI with Temporal",
    body:
      "Transform a simple LLM app that generates research and PDFs into a resilient system that handles crashes, rate limits, and outages using Temporal Workflows and Activities.",
    cta: "Start Part 1",
  },
  {
    href: "/tutorials/ai/building-durable-ai-applications/02-human-in-the-loop/",
    eyebrow: "Part 2 · ~60 min",
    title: "Human in the Loop",
    body:
      "Add durable human-in-the-loop capabilities to your research application using Temporal Signals and Queries to review, refine, and inspect AI output interactively.",
    cta: "Start Part 2",
  },
];

export default function BuildingDurableAiApplicationsLandingPage() {
  return (
    <Layout
      title="Building Durable AI Applications with Temporal"
      description="A two-part tutorial series on building durable, resilient AI applications with Temporal."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/ai-tutorials-banner.png"
            alt="Building Durable AI Applications with Temporal"
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
                  { label: "Building Durable AI Applications" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Building Durable AI Applications with Temporal
            </h1>

            <MetaChips items={["Series · 2 parts", "AI agents", "Production"]} />

            <p className={styles.intro}>
              This two-part series walks you through building durable AI applications with Temporal.
            </p>

            <ul>
              <li>
                <strong>Part 1</strong> - Transform a simple LLM app (that does
                research then generates PDFs) into a resilient system that
                handles crashes, rate limits, and outages using Temporal
                Workflows.
              </li>
              <li>
                <strong>Part 2</strong> - Add durable human-in-the-loop
                capabilities to your research application to review, refine,
                and query research results interactively.
              </li>
            </ul>

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
