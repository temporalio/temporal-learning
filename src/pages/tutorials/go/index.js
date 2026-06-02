import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/go/background-check/",
    eyebrow: "Tutorial · 3 chapters",
    title: "Build a Background Check application with Go",
    body:
      "Learn Temporal's core concepts while building a Background Check application from project setup through durable execution.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/go/build-an-ecommerce-app/",
    eyebrow: "Tutorial",
    title: "Build an eCommerce App with Go",
    body:
      "Four-part walkthrough of building an eCommerce application with Temporal and Go - shopping cart, checkout, and order processing.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/go/build-an-email-drip-campaign/",
    eyebrow: "Tutorial",
    title: "Build an email drip campaign with Go",
    body:
      "Implement an email subscription application using Temporal's Workflows, Activities, and Queries, with a Go web API driving it.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/go/audiobook/",
    eyebrow: "Tutorial",
    title: "Create audiobooks from text with OpenAI and Go",
    body:
      "Build audiobooks from text using OpenAI APIs and Temporal. Step-by-step guide for hassle-free MP3 creation with robust failure mitigation.",
    cta: "Start the tutorial",
  },
];

export default function GoTutorialsLanding() {
  return (
    <Layout
      title="Go tutorials"
      description="Build Temporal applications with these Go tutorials."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Go" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Go tutorials</h1>

            <MetaChips items={["Go SDK", "Project-based", "All levels"]} />

            <p className={styles.intro}>
              Go is an open source programming language that offers built-in
              concurrency and a robust standard library. Temporal's{" "}
              <a
                href="https://docs.temporal.io/dev-guide/go/foundations#add-your-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                Go SDK
              </a>{" "}
              lets you build applications that take advantage of Temporal's
              features. These tutorials walk you through building Temporal
              applications using Go.
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
