// Series landing for the Python Background Check tutorial.
// Chapter sources live under docs/tutorials/python/background-check/.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const CHAPTERS = [
  {
    href: "/tutorials/python/background-check/introduction/",
    eyebrow: "Chapter 1",
    title: "Introduction",
    body:
      "Learn what the Temporal Python SDK is, what Python skills help, and where to find code samples and supporting resources.",
    cta: "Start the chapter",
  },
  {
    href: "/tutorials/python/background-check/project-setup/",
    eyebrow: "Chapter 2",
    title: "Project setup",
    body:
      "Install the Temporal CLI, choose a development Cluster, write a single Activity Workflow, run a Worker, and add a testing framework.",
    cta: "Set up the project",
  },
  {
    href: "/tutorials/python/background-check/durable-execution/",
    eyebrow: "Chapter 3",
    title: "Develop for durability",
    body:
      "Retrieve Event Histories, add a Replay test, and learn the patterns that keep Workflow Definitions deterministic.",
    cta: "Develop for durability",
  },
];

export default function BackgroundCheckSeriesLanding() {
  return (
    <Layout
      title="Temporal Python SDK Background Check tutorial"
      description="Learn Temporal and its features by building a Background Check application with the Python SDK."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_python.png"
            alt="Temporal Python SDK"
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
                  { label: "Python", href: "/tutorials/python" },
                  { label: "Background Check" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Temporal Python SDK Background Check tutorial
            </h1>

            <MetaChips
              items={["3 chapters", "Beginner", "Python"]}
            />

            <p className={styles.intro}>
              In this tutorial, you'll build a Background Check application
              using the Temporal Python SDK and explore how to construct a new
              Temporal Application project and develop applications for
              Durable Execution. The tutorial is laid out as a series of
              chapters that you can follow in order.
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
