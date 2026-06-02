import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/java/background-check/",
    eyebrow: "Tutorial · 3 chapters",
    title: "Build a Background Check application with Java",
    body:
      "Learn Temporal's core concepts while building a Background Check application from project setup through durable execution.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/java/build-an-email-drip-campaign/",
    eyebrow: "Tutorial",
    title: "Build an email drip campaign with Java and Spring Boot",
    body:
      "Implement an email drip campaign application with Temporal's Workflows, Activities, and Queries, driven by a Spring Boot web action.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/java/audiobook/",
    eyebrow: "Tutorial",
    title: "Create audiobooks from text with OpenAI and Java",
    body:
      "Build audiobooks from text using OpenAI APIs and Temporal. Step-by-step guide for hassle-free MP3 creation with robust failure mitigation.",
    cta: "Start the tutorial",
  },
];

export default function JavaTutorialsLanding() {
  return (
    <Layout
      title="Java tutorials"
      description="Build Temporal applications with these Java tutorials."
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
                  { label: "Java" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Java tutorials</h1>

            <MetaChips items={["Java SDK", "Project-based", "All levels"]} />

            <p className={styles.intro}>
              Java is a high-level, object-oriented language known for its
              platform independence and extensive ecosystem. Temporal's{" "}
              <a
                href="https://docs.temporal.io/dev-guide/java/foundations#add-your-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                Java SDK
              </a>{" "}
              lets you build applications that take advantage of Temporal's
              features. These tutorials walk you through building Temporal
              applications using Java.
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
