import React from "react";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TITLE = "Versioning Workflows with Python";
const DESCRIPTION =
  "In this course, you'll go beyond the fundamentals, learning how to safely evolve your Temporal application code in production. There are three primary approaches to versioning Temporal Workflows.";
const COURSE_URL = "https://temporal.talentlms.com/catalog/info/id:169";

const OUTCOMES = [
  "Apply an appropriate Versioning strategy to modify your Workflows",
  "Implement a Versioned Workflow",
  "Verify correct implementations of Versioning strategies",
];

export default function VersioningPythonPage() {
  return (
    <Layout title={TITLE} description={DESCRIPTION}>
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
            style={{ gridColumn: "1 / -1", maxWidth: "1100px", margin: "0 auto" }}
          >
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Courses", href: "/courses" },
                  { label: "Versioning Workflows", href: "/courses/versioning/" },
                  { label: "Python" },
                ]}
              />
            </div>

            <h1 className={styles.title}>{TITLE}</h1>

            <MetaChips items={["~1.5 hours, self-paced", "Free", "Python"]} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <p>
                In this course, you'll go beyond the fundamentals, learning
                how to safely evolve your Temporal application code in
                production. There are several approaches to versioning
                Temporal Workflows, and this course will cover each of them,
                bookended by examples of how to monitor and test your
                Workflow Execution History, so you can verify that your
                Versioning is working correctly.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>What you'll be able to do</h2>
              <ul>
                {OUTCOMES.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>
                To be successful in this course, you should have an
                understanding of the fundamental concepts, tools, and
                techniques used to develop and execute basic Temporal
                applications with the Python SDK. This includes the ability
                to develop and execute Temporal Workflows and Activities,
                navigate the Web UI, configure and run a Worker, as well as
                an understanding of the high-level interactions between the
                Temporal Application and Temporal Cluster during Workflow
                Execution. We strongly recommend that you complete Temporal
                101 and 102, which cover these topics, before starting this
                course.
              </p>
              <p>
                Since code used in examples and exercises are written in
                Python, you must also have at least basic proficiency with
                the Python programming language.
              </p>
            </section>

            <div style={{ textAlign: "center", padding: "32px 24px 64px" }}>
              <MagentaCta href={COURSE_URL}>Go to course</MagentaCta>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
