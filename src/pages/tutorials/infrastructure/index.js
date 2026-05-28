import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/infrastructure/configuring-sqlite-binary/",
    eyebrow: "Baseline deployment",
    title: "Configure a Temporal Service without a Proxy",
    body:
      "Set up the core server and UI from official binaries, with a SQLite backend and systemd unit files. The fastest path to a self-hosted Temporal Service.",
    cta: "Start the baseline tutorial",
  },
  {
    href: "/tutorials/infrastructure/nginx-sqlite-binary/",
    eyebrow: "With Nginx",
    title: "Deploy with an Nginx reverse proxy",
    body:
      "Front the Temporal API and Web UI with Nginx for HTTPS, SSL termination, and IP-based access control on a public domain.",
    cta: "Set up Nginx",
  },
  {
    href: "/tutorials/infrastructure/envoy-sqlite-binary/",
    eyebrow: "With Envoy",
    title: "Deploy with an Envoy edge proxy",
    body:
      "Use Envoy to expose gRPC and HTTP traffic with RBAC rules and CORS handling - well-suited for load-balanced and multi-cluster setups.",
    cta: "Set up Envoy",
  },
];

export default function InfrastructureLandingPage() {
  return (
    <Layout
      title="Infrastructure tutorials"
      description="Deploy and maintain a Temporal Service with these tutorials."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/infra-tutorials-banner.png"
            alt="Infrastructure tutorials"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <main className={styles.pageMain} style={{ gridColumn: "1 / -1", maxWidth: "1200px", margin: "0 auto" }}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Infrastructure" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Infrastructure tutorials</h1>

            <MetaChips items={["Self-hosted", "Production", "DevOps"]} />

            <p className={styles.intro}>
              These tutorials walk you through deploying and maintaining a
              Temporal Service. Start with the baseline binary setup, then add
              an Nginx or Envoy proxy in front of it when you're ready to
              expose the Service externally.
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
