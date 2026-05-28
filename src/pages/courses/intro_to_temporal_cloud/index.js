import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import styles from "@site/src/components/hub/StepPage/styles.module.css";

const TITLE = "Introduction to Temporal Cloud";
const DESCRIPTION =
  "Master the essentials of Temporal Cloud. Navigate the Web UI, set up Namespaces, manage users, define custom Search Attributes, and access account- and Namespace-level usage information.";
const BODY =
  "Learn the role of Temporal Cloud, how to log into and navigate its Web UI, and how to perform tasks that new Temporal Cloud users may do in preparation for using this service.";
const COURSE_URL = "https://temporal.talentlms.com/catalog/info/id:144";

const OUTCOMES = [
  "Describe the role of Temporal Cloud within the Temporal Platform",
  "Navigate the Temporal Cloud Web UI",
  "Set up Namespaces within your Temporal Cloud account",
  "Perform user management functions, including assigning appropriate roles and permissions",
  "Define a custom Search Attribute",
  "Create an endpoint for integration with a third-party observability tool",
  "Access both account- and Namespace-level usage information",
];

export default function IntroToTemporalCloudLandingPage() {
  return (
    <Layout title={TITLE} description={DESCRIPTION}>
      <div className="nd-hub-page">
        <HubHero title={TITLE} body={BODY} showSearch={false} />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Courses", href: "/courses" },
                { label: TITLE },
              ]}
            />
            <p className={styles.sectionSub} style={{ marginTop: "12px" }}>
              <strong>Estimated time:</strong> 1 hour · <strong>Cost:</strong> Free
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>What you'll be able to do</h2>
            <ul className={styles.outcomesList}>
              {OUTCOMES.map((o, i) => (
                <li key={i} className={styles.outcomeItem}>
                  <span aria-hidden="true" className={styles.outcomeCheck}>
                    ✓
                  </span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Audience</h2>
            <p className={styles.sectionSub} style={{ maxWidth: "72ch" }}>
              This course is designed for users who are new to Temporal Cloud,
              but have at least a basic understanding of Temporal. Although
              primarily intended to help new Temporal Cloud users with
              onboarding, this course is available to all, and even people who
              are in the earliest stages of evaluating Temporal Cloud should
              find it valuable.
            </p>
          </div>
        </section>

        <div style={{ textAlign: "center", padding: "24px" }}>
          <MagentaCta href={COURSE_URL}>Go to course</MagentaCta>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
