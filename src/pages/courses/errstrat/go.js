import React from "react";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TITLE = "Crafting an Error Handling Strategy with Go";
const DESCRIPTION =
  "In this course, you will design and implement effective error handling strategies that map your business logic to the Temporal platform. You will explore the nature of different types of failures and investigate the support that Temporal provides for addressing them. Along the way, you will learn essential concepts and techniques, such as idempotence, Heartbeating, and the Saga Pattern, which will help you to ensure the correctness and responsiveness of your application.";
const COURSE_URL = "https://temporal.talentlms.com/catalog/info/id:246";

const OUTCOMES = [
  "Recommend an error handling strategy",
  "Implement an error handling strategy",
  "Integrate appropriate mechanisms for handling various types of errors",
];

export default function ErrstratGoPage() {
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
                  { label: "Crafting an Error Handling Strategy", href: "/courses/errstrat/" },
                  { label: "Go" },
                ]}
              />
            </div>

            <h1 className={styles.title}>{TITLE}</h1>

            <MetaChips items={["~2.5 hours, self-paced", "Free", "Go"]} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <p>
                In this course, you will design and implement effective error
                handling strategies that map your business logic to the
                Temporal platform. You will explore the nature of different
                types of failures and investigate the support that Temporal
                provides for addressing them. Along the way, you will learn
                essential concepts and techniques, such as idempotence,
                Heartbeating, and the Saga Pattern, which will help you to
                ensure the correctness and responsiveness of your
                application.
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
                Execution. We strongly recommend that you complete
                Introducing the Temporal Platform (Temporal 101) and
                Exploring Durable Execution (Temporal 102), which cover these
                topics, before starting this course.
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
