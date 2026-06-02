import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import { FIRST_STEPS } from "@site/src/data/hub";
import { ReimbursementCarousel } from "../start";
import styles from "../start.module.css";

const NEXT_STEPS = FIRST_STEPS.map((s) => ({
  n: String(s.n).padStart(2, "0"),
  title: s.title,
  description: s.description,
  duration: s.duration,
  href: s.href,
}));

export default function InActionPage() {
  return (
    <Layout
      title="See Temporal in Action"
      description="Watch a Workflow break on purpose and recover automatically - in your language."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Temporal University / Start here / In action"
          title="See Temporal in Action."
          body="Walk through a Workflow that breaks on purpose and recovers automatically. Five steps with real code and the Temporal Web UI - pick your language at the top."
          showSearch={false}
        />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Temporal University", href: "/" },
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
              Walk through it in five steps below. See the Workflow, inject a failure, watch Temporal retry, fix the bug, and the Workflow completes.
            </p>

            <ReimbursementCarousel />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>What's next</h2>
            <ol className={styles.steps}>
              {NEXT_STEPS.map((step) => (
                <li key={step.n} className={styles.step}>
                  <a href={step.href} className={styles.stepLink}>
                    <div className={styles.stepNumber}>{step.n}</div>
                    <div className={styles.stepBody}>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                      <p className={styles.stepDescription}>{step.description}</p>
                      <div className={styles.stepMeta}>{step.duration}</div>
                    </div>
                    <span aria-hidden="true" className={styles.stepArrow}>→</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
