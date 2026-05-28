import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIALS = [
  {
    href: "/tutorials/php/build_a_trip_booking_app/",
    eyebrow: "Tutorial",
    title: "Build a trip booking system with PHP",
    body:
      "Explore the components of the Temporal Booking Saga code sample - coordinating multiple services with compensating Activities.",
    cta: "Start the tutorial",
  },
  {
    href: "/tutorials/php/build-a-recurring-billing-app/",
    eyebrow: "Tutorial",
    title: "Build a recurring billing subscription system with PHP",
    body:
      "Build a realistic monthly subscription payments workflow that can be canceled while it runs - long-running Workflows with PHP.",
    cta: "Start the tutorial",
  },
];

export default function PhpTutorialsLanding() {
  return (
    <Layout
      title="PHP tutorials"
      description="Build Temporal applications with these PHP tutorials."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_php.png"
            alt="Temporal PHP SDK"
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
                  { label: "PHP" },
                ]}
              />
            </div>

            <h1 className={styles.title}>PHP tutorials</h1>

            <MetaChips items={["PHP SDK", "Project-based", "All levels"]} />

            <p className={styles.intro}>
              PHP is a popular language for back-end web development that
              powers WordPress, Drupal, and thousands of web applications
              world-wide. Temporal's{" "}
              <a
                href="https://docs.temporal.io/dev-guide/php"
                target="_blank"
                rel="noopener noreferrer"
              >
                PHP SDK
              </a>{" "}
              lets you build applications that take advantage of Temporal's
              features. These tutorials walk you through building Temporal
              applications using PHP.
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
