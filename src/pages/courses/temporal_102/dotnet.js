import React from "react";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TITLE = "Temporal 102: Exploring Durable Execution with .NET";
const DESCRIPTION =
  "Go beyond the basics and gain a deeper understanding of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution.";
const COURSE_URL = "https://temporal.talentlms.com/catalog/info/id:259";

const OUTCOMES = [
  "Apply Temporal best practices for application development",
  "Validate application behavior through automated testing",
  "Evaluate an Event History to debug problems with Workflow Execution",
];

export default function Temporal102DotnetPage() {
  return (
    <Layout title={TITLE} description={DESCRIPTION}>
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_dotnet.png"
            alt="Temporal .NET SDK"
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
                  { label: "Temporal University", href: "/" },
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 102", href: "/courses/temporal_102/" },
                  { label: ".NET" },
                ]}
              />
            </div>

            <h1 className={styles.title}>{TITLE}</h1>

            <MetaChips items={["~4 hours, self-paced", "Free", ".NET"]} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <p>
                In this course, you'll go beyond the basics of Temporal
                application development, acquiring skills that will help you
                on your journey to production deployment. Along the way,
                you'll encounter several common problems faced by Temporal
                developers, find out why they occur, and more importantly,
                how to identify and solve them, as well as how to avoid them
                in the future. By emphasizing key concepts and best
                practices, you'll gain a deeper understanding of how Temporal
                works and how to use it effectively.
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
                applications with the .NET SDK. This includes the ability to
                develop and execute Temporal Workflows and Activities,
                navigate the Web UI, configure and run a Worker, as well as
                an understanding of the high-level interactions between the
                Temporal Application and Temporal Service during Workflow
                Execution. We strongly recommend that you complete Temporal
                101, which covers these topics, before starting this course.
              </p>
              <p>
                Since code used in examples and exercises are written in C#,
                you must also have at least basic proficiency with the C#
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
