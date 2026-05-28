import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import FilterSortRow from "@site/src/components/hub/FilterSortRow/FilterSortRow";
import CourseCard from "@site/src/components/hub/CourseCard/CourseCard";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import { COURSES } from "@site/src/data/hub";
import styles from "./catalog.module.css";

const CATALOG_COURSES = COURSES.filter((c) => c.kind === "course");

export default function Catalog() {
  return (
    <Layout title="Course library" description="Browse all Temporal courses and tutorials">
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Learn Temporal / Course library"
          title="Course library."
          body="Every course and tutorial we publish, in one place. Filters and grouped categories land in Phase 3 of the redesign."
          compact
        />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Course library" },
              ]}
            />

            <FilterSortRow count={CATALOG_COURSES.length} label="courses" />

            <div className={styles.grid}>
              {CATALOG_COURSES.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>

            <div className={styles.loadMoreWrap}>
              <MagentaCta variant="button">Load more</MagentaCta>
            </div>
          </div>
        </section>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
