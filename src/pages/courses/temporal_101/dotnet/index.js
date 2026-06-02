import React from "react";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TITLE = "Temporal 101 with .NET";
const DESCRIPTION =
  "Discover the essentials of Temporal application development in this course, focusing on Workflows, Activities, and the .NET SDK. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively.";
const COURSE_URL = "https://temporal.talentlms.com/catalog/info/id:254";

const OUTCOMES = [
  "Configure an environment for developing Temporal Applications",
  "Use Temporal to describe and implement a business process",
  "Interpret Temporal's Workflow execution model",
  "Use Temporal's tooling to manage the lifecycle of your application",
];

export default function Temporal101DotnetPage() {
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
                  { label: "Temporal 101", href: "/courses/temporal_101/" },
                  { label: ".NET" },
                ]}
              />
            </div>

            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "var(--nd-color-lilac)",
                color: "var(--nd-color-space-black, #141414)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              Preview available
            </span>

            <h1 className={styles.title}>{TITLE}</h1>

            <MetaChips items={["~2 hours, self-paced", "Free", ".NET"]} />

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Description</h2>
              <p>
                In this course, you will explore the basic building blocks of
                Temporal: Workflows and Activities. You'll use these building
                blocks along with Temporal's .NET SDK to develop a small
                application that communicates with an external service.
                You'll see how Temporal helps you recover from failures and
                explore Temporal's execution model and event history. You'll
                use the Temporal Web UI and Temporal's command-line tools to
                explore and interact with your Workflows, and you'll use what
                you've learned to add new features to your existing Workflow.
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
                To be successful in this course, you should have experience
                writing backend applications that rely on external APIs.
              </p>
              <p>
                This course uses the C# programming language. Previous C#
                experience is helpful, but not required.
              </p>
            </section>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap", padding: "32px 24px 64px" }}>
              <MagentaCta to="/courses/temporal_101/dotnet/understanding-workflow-execution/about-this-example/">
                Start the free preview
              </MagentaCta>
              <MagentaCta href={COURSE_URL}>
                Start Free Course
              </MagentaCta>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
