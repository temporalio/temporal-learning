import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import PathCard from "@site/src/components/hub/PathCard/PathCard";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import GetHelp from "@site/src/components/hub/GetHelp/GetHelp";
import { PATHS } from "@site/src/data/hub";
import styles from "./paths.module.css";

export default function PathsLanding() {
  return (
    <Layout title="Learning paths" description="Find your Temporal learning path">
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Temporal University / Paths"
          title="Find your path."
          body="Three sequenced tracks - from your first Workflow through running Temporal in production. Pick one and follow it through, or jump straight to the level that matches where you are."
          freeBadge
          showSearch={false}
        />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Temporal University", href: "/" },
                { label: "Paths" },
              ]}
            />
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

        <GetHelp />

        <NotifyBanner />
      </div>
    </Layout>
  );
}
