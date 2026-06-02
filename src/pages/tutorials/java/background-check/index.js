// Series landing page for the Java Background Check tutorial.
// Chapters live in ./introduction/, ./project-setup/, and ./durable-execution/.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const CHAPTERS = [
  {
    href: "/tutorials/java/background-check/introduction/",
    eyebrow: "Chapter 1 - ~10 minutes",
    title: "Introduction",
    body:
      "Learn about the Temporal Java SDK, the supported runtimes, and the build configuration you'll use throughout the tutorial.",
    cta: "Start chapter 1",
  },
  {
    href: "/tutorials/java/background-check/project-setup/",
    eyebrow: "Chapter 2 - ~50 minutes",
    title: "Project setup",
    body:
      "Construct a new Temporal Application project: write Workflows and Activities, run a Worker, start Workflows from the CLI, and add a testing framework.",
    cta: "Start chapter 2",
  },
  {
    href: "/tutorials/java/background-check/durable-execution/",
    eyebrow: "Chapter 3 - ~30 minutes",
    title: "Develop for durability",
    body:
      "Retrieve Event Histories, add Replay tests, recognize non-deterministic code, and reset Workflows when things go wrong.",
    cta: "Start chapter 3",
  },
];

export default function BackgroundCheckSeriesLanding() {
  return (
    <Layout
      title="Build a Background Check application with Java"
      description="Learn Temporal and its features while building a Background Check application with the Temporal Java SDK."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_java.png"
            alt="Temporal Java SDK"
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
                  { label: "Java", href: "/tutorials/java" },
                  { label: "Background Check" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Background Check application with Java
            </h1>

            <MetaChips items={["~90 minutes total", "3 chapters", "Java"]} />

            <p className={styles.intro}>
              Welcome to the Temporal Java SDK Background Check tutorial. Across
              three chapters, you'll build a Background Check application using
              the Temporal Java SDK and explore how to construct a new Temporal
              Application project and develop applications for Durable
              Execution.
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
