import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const CHAPTERS = [
  {
    href: "/tutorials/go/background-check/introduction/",
    eyebrow: "Chapter 1 - ~10 min",
    title: "Introduction",
    body:
      "Learn why Temporal is a strong fit for long-running, durable applications, and review the prerequisites for building one in Go.",
    cta: "Start Chapter 1",
  },
  {
    href: "/tutorials/go/background-check/project-setup/",
    eyebrow: "Chapter 2 - ~45 min",
    title: "Project setup",
    body:
      "Install the Temporal CLI, choose a development Cluster, scaffold a Go project, run a Worker, and add a testing framework.",
    cta: "Start Chapter 2",
  },
  {
    href: "/tutorials/go/background-check/durable-execution/",
    eyebrow: "Chapter 3 - ~30 min",
    title: "Develop for durability",
    body:
      "Retrieve Event Histories, add a Replay test, and learn how non-deterministic code breaks Workflows so you can avoid it.",
    cta: "Start Chapter 3",
  },
];

export default function BackgroundCheckLandingPage() {
  return (
    <Layout
      title="Build a Background Check application with Go"
      description="Learn Temporal and its features while building a Background Check application with the Go SDK."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_go.png"
            alt="Temporal Go SDK"
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
                  { label: "Go", href: "/tutorials/go" },
                  { label: "Background Check" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Background Check application with Go
            </h1>

            <MetaChips items={["Series - 3 chapters", "Beginner to intermediate", "Go"]} />

            <p className={styles.intro}>
              Welcome to the Temporal Go SDK Background Check tutorial. Across
              three chapters you'll build a Background Check application using
              the Temporal Go SDK, learning how to construct a new Temporal
              Application project and develop applications for Durable Execution.
            </p>

            <ul>
              <li>
                <strong>Chapter 1: Introduction</strong> - Understand why
                Temporal fits long-running applications and what skills help
                you succeed with the Go SDK.
              </li>
              <li>
                <strong>Chapter 2: Project setup</strong> - Install the
                Temporal CLI, choose a development Cluster, build a Worker, and
                add a testing framework.
              </li>
              <li>
                <strong>Chapter 3: Develop for durability</strong> - Inspect
                Event Histories, add a Replay test, and learn what makes
                Workflow code non-deterministic.
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
