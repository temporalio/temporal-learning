import React from "react";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TITLE = "Temporal 102: Exploring Durable Execution with Go";
const DESCRIPTION =
  "Go beyond the basics and gain a deeper understanding of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution.";
const COURSE_URL = "https://temporal.talentlms.com/catalog/info/id:208";

const OUTCOMES = [
  "Apply Temporal best practices for application development",
  "Validate application behavior through automated testing",
  "Evaluate an Event History to debug problems with Workflow Execution",
];

export default function Temporal102GoPage() {
  return (
    <Layout title={TITLE} description={DESCRIPTION}>
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
            style={{ gridColumn: "1 / -1", maxWidth: "1100px", margin: "0 auto" }}
          >
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 102", href: "/courses/temporal_102/" },
                  { label: "Go" },
                ]}
              />
            </div>

            <h1 className={styles.title}>{TITLE}</h1>

            <MetaChips items={["~4 hours, self-paced", "Free", "Go"]} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <p>
                In this course, you will go beyond the basics of Temporal
                application development. You will acquire skills necessary to
                use Temporal throughout the full development lifecycle by
                learning how to test, debug, deploy, and update applications.
                You'll encounter several common problems faced by Temporal
                developers, understand why they occur, and how to identify,
                solve, and avoid them. Through heavy emphasis on key concepts
                and best practices, you'll gain a deeper understanding of how
                Temporal works and how to use it effectively.
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
                applications with the Go SDK. This includes the ability to
                develop and execute Temporal Workflows and Activities,
                navigate the Web UI, configure and run a Worker, as well as
                an understanding of the high-level interactions between the
                Temporal Application and Temporal Cluster during Workflow
                Execution. We strongly recommend that you complete Temporal
                101, which covers these topics, before starting this course.
              </p>
              <p>
                Since code used in examples and exercises are written in Go,
                you must also have at least basic proficiency with the Go
                programming language.
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
