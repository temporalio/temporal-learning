import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import { ReimbursementCarousel } from "../start";
import styles from "../start.module.css";

export default function InActionPage() {
  return (
    <Layout
      title="See Temporal in Action"
      description="Watch a Workflow break on purpose and recover automatically - in your language."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Learn Temporal / Start here / In action"
          title="See Temporal in Action."
          body="Walk through a Workflow that breaks on purpose and recovers automatically. Five steps with real code and the Temporal Web UI - pick your language at the top."
          showSearch={false}
        />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Start here", href: "/start" },
                { label: "In action" },
              ]}
            />

            <p className={`${styles.sectionSub} ${styles.demoIntro}`}>
              In any complex system, failures happen - machines crash, networks go down. Normally you write retry loops and recovery code. Temporal makes your code durable by default.
            </p>
            <p className={`${styles.sectionSub} ${styles.demoIntro}`}>
              Take a reimbursement: withdraw from one account, deposit into another. What if the withdrawal succeeds but the network drops before the deposit?
            </p>
            <p className={`${styles.sectionSub} ${styles.demoIntro}`}>
              Walk through it in five steps below. Inject a failure, Temporal retries, fix the bug, the Workflow completes.
            </p>

            <ReimbursementCarousel />
          </div>
        </section>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
