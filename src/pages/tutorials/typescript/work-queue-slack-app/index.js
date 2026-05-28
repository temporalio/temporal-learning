// Tutorial series landing: Build a Work Queue Slack App with TypeScript.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const CHAPTERS = [
  {
    href: "/tutorials/typescript/work-queue-slack-app/build/",
    eyebrow: "Chapter 1",
    title: "Build the app",
    body:
      "Build a Slash Command Slack App using Temporal to manage work queues without a traditional database. Implement an entity Workflow pattern with Signals and Queries.",
    cta: "Start the series",
  },
  {
    href: "/tutorials/typescript/work-queue-slack-app/deploy/",
    eyebrow: "Chapter 2",
    title: "Deploy to production",
    body:
      "Deploy your TypeScript Slack App to a DigitalOcean Droplet using Temporal Cloud, Nginx, and pm2.",
    cta: "Continue",
  },
];

export default function WorkQueueSlackAppLanding() {
  return (
    <Layout
      title="Build a Work Queue Slack App with TypeScript"
      description="Build a Slash Command Slack App with TypeScript and Temporal, then deploy it to a DigitalOcean Droplet using Temporal Cloud."
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
                  { label: "Work Queue Slack App" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Work Queue Slack App with TypeScript
            </h1>

            <MetaChips
              items={["~3 hours total", "2 chapters", "TypeScript", "Intermediate"]}
            />

            <p className={styles.intro}>
              When you build a TypeScript application, you typically build
              it locally - testing functionality first - then deploy it to
              a public cloud provider for production use. In this two-part
              tutorial, you first build a Work Queue Slack App with
              TypeScript and Temporal locally on your machine using the
              Temporal CLI, then you deploy it to production on a
              DigitalOcean Droplet using Temporal Cloud.
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
