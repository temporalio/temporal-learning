// Tutorial series landing: Build a Background Check application with TypeScript.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const CHAPTERS = [
  {
    href: "/tutorials/typescript/background-check/introduction/",
    eyebrow: "Chapter 1",
    title: "Introduction",
    body:
      "Learn what the Temporal TypeScript SDK provides, the skills useful for working with it, and where to find samples and resources.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/typescript/background-check/project-setup/",
    eyebrow: "Chapter 2",
    title: "Project setup",
    body:
      "Set up a new Temporal Application project in TypeScript, run a Worker, start a Workflow, and add a testing framework.",
    cta: "Continue",
  },
  {
    href: "/tutorials/typescript/background-check/durable-execution/",
    eyebrow: "Chapter 3",
    title: "Develop for durability",
    body:
      "Replay Workflow Executions, identify non-deterministic code, and learn how to evolve Workflow Definitions safely.",
    cta: "Continue",
  },
];

export default function BackgroundCheckLanding() {
  return (
    <Layout
      title="Build a Background Check application with TypeScript"
      description="Learn Temporal and its features while building a Background Check application with the TypeScript SDK."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_typescript.png"
            alt="Temporal TypeScript SDK"
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
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  { label: "Background Check" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Background Check application with TypeScript
            </h1>

            <MetaChips
              items={["~90 minutes total", "3 chapters", "TypeScript", "Intermediate"]}
            />

            <p className={styles.intro}>
              In this tutorial series, you build a Background Check application
              with the Temporal TypeScript SDK and explore how to construct a
              new Temporal Application project and develop applications for
              Durable Execution.
            </p>

            <div className={styles.nextSection} style={{ marginTop: "32px" }}>
              <div className={styles.nextGrid}>
                {CHAPTERS.map((c) => (
                  <Link key={c.href} to={c.href} className={styles.nextCard}>
                    <span className={styles.nextEyebrow}>{c.eyebrow}</span>
                    <h3 className={styles.nextTitle}>{c.title}</h3>
                    <p className={styles.nextBody}>{c.body}</p>
                    <span className={styles.nextCta}>
                      {c.cta} <span aria-hidden="true">→</span>
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
