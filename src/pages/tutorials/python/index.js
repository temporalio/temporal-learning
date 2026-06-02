import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/python/background-check/",
    eyebrow: "Tutorial · 3 chapters",
    title: "Temporal Python SDK Background Check tutorial",
    body:
      "Learn Temporal's core concepts while building a Background Check application from project setup through durable execution.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/python/trip-booking-app/",
    eyebrow: "Tutorial",
    title: "Build a trip booking application in Python",
    body:
      "Implement the Saga Pattern in Python using Temporal - coordinate multiple bookings with compensating Activities when something fails.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/python/build-an-email-drip-campaign/",
    eyebrow: "Tutorial",
    title: "Build an email drip campaign with Python",
    body:
      "Implement an email subscription application using Temporal's Workflows, Activities, and Queries, with a web action triggering business logic.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/python/build-a-data-pipeline/",
    eyebrow: "Tutorial",
    title: "Build a data pipeline with Python",
    body:
      "Implement a data pipeline application in Python, using Temporal's Workflows, Activities, and Schedules to orchestrate the pipeline.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/python/geocoding-app/",
    eyebrow: "Tutorial",
    title: "Build a geocoding application with Python",
    body:
      "Implement a geocoding application in Python that gets input from a user and calls a REST API - a friendly introduction to Activities.",
    cta: "Start the tutorial",
  },
];

export default function PythonTutorialsLanding() {
  return (
    <Layout
      title="Python tutorials"
      description="Build Temporal applications with these Python tutorials."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Python" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Python tutorials</h1>

            <MetaChips items={["Python SDK", "Project-based", "All levels"]} />

            <p className={styles.intro}>
              Python is a programming language that lets you work quickly and
              integrate systems more effectively. Temporal's{" "}
              <a
                href="https://docs.temporal.io/dev-guide/python/foundations#add-your-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                Python SDK
              </a>{" "}
              lets you build applications that take advantage of Temporal's
              features. These tutorials walk you through building Temporal
              applications using Python.
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
