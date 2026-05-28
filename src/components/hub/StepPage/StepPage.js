import React from "react";
import Layout from "@theme/Layout";
import HubHero from "../HubHero/HubHero";
import MagentaCta from "../MagentaCta/MagentaCta";
import NotifyBanner from "../NotifyBanner/NotifyBanner";
import PathBreadcrumb from "../PathBreadcrumb/PathBreadcrumb";
import StepProgress from "../StepProgress/StepProgress";
import SdkPicker from "../SdkPicker/SdkPicker";
import { FIRST_STEPS } from "@site/src/data/hub";
import styles from "./styles.module.css";

export default function StepPage({
  step,
  title,
  body,
  sdkTargets,
  pickerSubtitle = "Each guide is short and hands-on. Install, verify, done.",
  outcomes,
  nextHref,
  nextLabel,
}) {
  const stepData = FIRST_STEPS.find((s) => s.n === step);
  const description = typeof body === "string" ? body : undefined;

  return (
    <Layout
      title={stepData ? stepData.title : title.replace(/\.$/, "")}
      description={description}
    >
      <div className="nd-hub-page">
        <HubHero title={title} body={body} showSearch={false} />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Start here", href: "/start" },
                { label: stepData ? stepData.title : `Step 0${step}` },
              ]}
            />
            <StepProgress current={step} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Pick your SDK</h2>
            {pickerSubtitle && (
              <p className={styles.sectionSub}>{pickerSubtitle}</p>
            )}
            <SdkPicker targets={sdkTargets} />
          </div>
        </section>

        {outcomes && outcomes.length > 0 && (
          <section className={styles.section}>
            <div className={styles.inner}>
              <h2 className={styles.sectionTitle}>What you'll have when this is done</h2>
              <ul className={styles.outcomesList}>
                {outcomes.map((o, i) => (
                  <li key={i} className={styles.outcomeItem}>
                    <span aria-hidden="true" className={styles.outcomeCheck}>✓</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {nextHref && (
          <div className={styles.bottomCta}>
            <MagentaCta to={nextHref}>{nextLabel}</MagentaCta>
          </div>
        )}

        <NotifyBanner />
      </div>
    </Layout>
  );
}
