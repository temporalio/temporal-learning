import React from "react";
import Layout from "@theme/Layout";
import HubHero from "../HubHero/HubHero";
import MagentaCta from "../MagentaCta/MagentaCta";
import NotifyBanner from "../NotifyBanner/NotifyBanner";
import PathBreadcrumb from "../PathBreadcrumb/PathBreadcrumb";
import StepProgress from "../StepProgress/StepProgress";
import { FIRST_STEPS } from "@site/src/data/hub";
import styles from "./styles.module.css";

/**
 * Step page that embeds external content (an interactive lab, a docs guide)
 * inside the Learn page chrome. Mirrors StepPage's layout but swaps the
 * "Pick your SDK" section for a free-form children slot.
 */
export default function EmbedStepPage({
  step,
  title,
  body,
  embedTitle,
  embedSub,
  children,
  outcomes,
  nextHref,
  nextLabel,
  breadcrumbSub,
}) {
  const stepData = FIRST_STEPS.find((s) => s.n === step);
  const description = typeof body === "string" ? body : undefined;

  const crumbs = [
    { label: "Temporal University", href: "/" },
    { label: "Start here", href: "/start" },
  ];
  if (breadcrumbSub && stepData) {
    crumbs.push({ label: stepData.title, href: stepData.href });
    crumbs.push({ label: breadcrumbSub });
  } else {
    crumbs.push({ label: stepData ? stepData.title : `Step 0${step}` });
  }

  const docTitle = breadcrumbSub
    ? title.replace(/\.$/, "")
    : stepData
    ? stepData.title
    : title.replace(/\.$/, "");

  return (
    <Layout title={docTitle} description={description}>
      <div className="nd-hub-page">
        <HubHero title={title} body={body} showSearch={false} />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb items={crumbs} />
            <StepProgress current={step} />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            {embedTitle && <h2 className={styles.sectionTitle}>{embedTitle}</h2>}
            {embedSub && <p className={styles.sectionSub}>{embedSub}</p>}
            {children}
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
