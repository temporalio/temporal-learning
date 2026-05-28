import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import PathCard from "@site/src/components/hub/PathCard/PathCard";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import { PATHS } from "@site/src/data/hub";
import styles from "./paths.module.css";

export default function PathsLanding() {
  return (
    <Layout title="Learning paths" description="Find your Temporal learning path">
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Learn Temporal / Paths"
          title="Find your path."
          body="Pick the journey that matches what you're building. Foundation gets you durable; Intermediate makes you resilient; Advanced branches by role."
          showSearch={false}
        />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Paths" },
              ]}
            />

            <h2 className={styles.sectionTitle}>All paths</h2>
            <p className={styles.sectionSub}>
              Foundation gets you durable, Intermediate makes you resilient, Advanced branches by role.
            </p>
            <div className={styles.grid3}>
              {PATHS.map((path) => (
                <PathCard
                  key={path.slug}
                  href={`/paths/${path.slug}`}
                  tier={path.tier}
                  title={path.title}
                  description={path.description}
                  thumbnail={path.thumbnail}
                  level={path.level}
                  lessonCount={path.lessonCount}
                />
              ))}
            </div>
          </div>
        </section>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
