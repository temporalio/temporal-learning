import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/typescript/background-check/",
    eyebrow: "Tutorial · 3 chapters",
    title: "Build a Background Check application with TypeScript",
    body:
      "Learn Temporal's core concepts while building a Background Check application from project setup through durable execution.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/typescript/work-queue-slack-app/",
    eyebrow: "Tutorial · 3 chapters",
    title: "Build a Work Queue Slack App with TypeScript",
    body:
      "Build a Slack work-queue app and deploy it to production on a DigitalOcean Droplet - real-world Workflow patterns and ops.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/typescript/recurring-billing-system/",
    eyebrow: "Tutorial",
    title: "Build a recurring billing subscription system with TypeScript",
    body:
      "Implement a subscription application using Workflows, Activities, Signals, and Queries - cancel or modify the payment flow during execution.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/typescript/build-one-click-order-app-nextjs/",
    eyebrow: "Tutorial",
    title: "Build a one-click order application with TypeScript and Next.js",
    body:
      "Build a one-click buy application with Next.js and integrate Temporal using API routes for a durable order processing backend.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/typescript/build-choose-your-own-adventure-bot/",
    eyebrow: "Tutorial",
    title: "Build a Choose Your Own Adventure Bot in TypeScript",
    body:
      "Integrate all the knowledge from Core and Production APIs into an end-to-end demo application - a stateful adventure bot.",
    cta: "Start the tutorial",
  },
];

export default function TypeScriptTutorialsLanding() {
  return (
    <Layout
      title="TypeScript tutorials"
      description="Build Temporal applications with these TypeScript tutorials."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "TypeScript" },
                ]}
              />
            </div>

            <h1 className={styles.title}>TypeScript tutorials</h1>

            <MetaChips items={["TypeScript SDK", "Project-based", "All levels"]} />

            <p className={styles.intro}>
              TypeScript is a strongly typed programming language that builds
              on JavaScript. Temporal's{" "}
              <a
                href="https://docs.temporal.io/dev-guide/typescript/foundations#add-your-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                TypeScript SDK
              </a>{" "}
              lets you build Node.js applications that take advantage of
              Temporal's features. These tutorials walk you through building
              Temporal applications using TypeScript.
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
