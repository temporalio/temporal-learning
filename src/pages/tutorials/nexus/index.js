import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

export default function NexusTutorialsLanding() {
  return (
    <Layout
      title="Nexus tutorials"
      description="Learn how to decouple Temporal services with Nexus."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/projectbasedtutorials.png"
            alt="Nexus tutorials"
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
                  { label: "Nexus" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Nexus tutorials</h1>

            <MetaChips items={["Nexus", "Cross-service", "Java"]} />

            <p className={styles.intro}>
              Learn how to decouple teams and services using Temporal Nexus -
              call Workflows that live in different Temporal namespaces or
              services with clean boundaries.
            </p>

            <div className={styles.nextSection} style={{ marginTop: "32px" }}>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/nexus/nexus-sync-tutorial-java/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Tutorial · Java</span>
                  <h3 className={styles.nextTitle}>
                    Decoupling Temporal Services with Nexus and the Java SDK
                  </h3>
                  <p className={styles.nextBody}>
                    Take a monolithic Temporal app and split it into two
                    independently deployable services connected through Nexus -
                    shared service contracts, sync handlers, and decoupled
                    durability.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
