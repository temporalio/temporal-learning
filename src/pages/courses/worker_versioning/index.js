import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import styles from "@site/src/components/hub/StepPage/styles.module.css";

const TITLE = "Worker Versioning";
const DESCRIPTION =
  "Explain the benefits of Worker Versioning, configure Workers to participate in Worker Versioning, choose Versioning Behavior for Workflows, and use Temporal's routing system to control which Workflows run on which Worker Versions.";
const BODY =
  "Configure Workers to participate in Worker Versioning, evaluate tradeoffs for Versioning Behavior, and use Temporal's routing system to control exactly which Workflows run on which Worker Versions. Explore the drainage process for safely sunsetting old deployment versions plus emergency remediation techniques.";
const COURSE_URL = "https://temporal.talentlms.com/catalog/info/id:272";

export default function WorkerVersioningLandingPage() {
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
              <strong>Estimated time:</strong> 1.5 hours · <strong>Cost:</strong> Free
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>About this course</h2>
            <p className={styles.sectionSub} style={{ maxWidth: "72ch" }}>
              In this course, you'll be able to explain the benefits of Worker
              Versioning, configure Workers to participate in Worker Versioning,
              evaluate tradeoffs to choose Versioning Behavior for Workflows,
              and use Temporal's routing system to control exactly which
              Workflows run on which Worker Versions. Finally, you'll explore
              the drainage process that lets you safely sunset old deployment
              versions by monitoring when all Workflows complete naturally,
              plus emergency remediation techniques for moving Workflows when
              critical issues arise.
            </p>
            <p className={styles.sectionSub} style={{ maxWidth: "72ch" }}>
              Since this course requires a fundamental understanding of
              Temporal and Versioning, we recommend our "Introducing the
              Temporal Platform" course as a prerequisite. It's also important
              to remember that the example code used in this course was
              designed to support learning a specific aspect of Temporal, not
              to serve as a ready-to-use template for implementing a
              production system.
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
