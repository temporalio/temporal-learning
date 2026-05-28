import React from "react";
import Layout from "@theme/Layout";
import HubHero from "../HubHero/HubHero";
import NotifyBanner from "../NotifyBanner/NotifyBanner";
import PathBreadcrumb from "../PathBreadcrumb/PathBreadcrumb";
import SdkPicker from "../SdkPicker/SdkPicker";
import styles from "../StepPage/styles.module.css";

export default function CourseLandingPage({
  title,
  description,
  body,
  duration,
  audience,
  sdkTargets,
  pickerSubtitle = "Each course is self-paced and free. Pick your language to enroll.",
  outcomes,
  badge,
}) {
  return (
    <Layout title={title} description={description}>
      <div className="nd-hub-page">
        <HubHero
          title={title}
          body={body}
          showSearch={false}
          eyebrow={badge}
        />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Courses", href: "/courses" },
                { label: title },
              ]}
            />
            {duration && (
              <p className={styles.sectionSub} style={{ marginTop: "12px" }}>
                <strong>Estimated time:</strong> {duration} · <strong>Cost:</strong> Free
              </p>
            )}
          </div>
        </section>

        {sdkTargets && sdkTargets.length > 0 && (
          <section className={styles.section}>
            <div className={styles.inner}>
              <h2 className={styles.sectionTitle}>Pick your SDK</h2>
              {pickerSubtitle && (
                <p className={styles.sectionSub}>{pickerSubtitle}</p>
              )}
              <SdkPicker targets={sdkTargets} />
            </div>
          </section>
        )}

        {outcomes && outcomes.length > 0 && (
          <section className={styles.section}>
            <div className={styles.inner}>
              <h2 className={styles.sectionTitle}>
                What you'll be able to do
              </h2>
              <ul className={styles.outcomesList}>
                {outcomes.map((o, i) => (
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
        )}

        {audience && (
          <section className={styles.section}>
            <div className={styles.inner}>
              <h2 className={styles.sectionTitle}>Audience</h2>
              <p className={styles.sectionSub} style={{ maxWidth: "72ch" }}>
                {audience}
              </p>
            </div>
          </section>
        )}

        <NotifyBanner />
      </div>
    </Layout>
  );
}
