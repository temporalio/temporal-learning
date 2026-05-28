import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import PathHero from "../PathHero/PathHero";
import CourseCard from "../CourseCard/CourseCard";
import PathBreadcrumb from "../PathBreadcrumb/PathBreadcrumb";
import MagentaCta from "../MagentaCta/MagentaCta";
import NotifyBanner from "../NotifyBanner/NotifyBanner";
import {
  getPathBySlug,
  getCoursesForPath,
  PATHS,
} from "@site/src/data/hub";
import styles from "./styles.module.css";

const TIER_LABEL = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function nextPath(currentSlug) {
  const idx = PATHS.findIndex((p) => p.slug === currentSlug);
  if (idx === -1 || idx === PATHS.length - 1) return null;
  return PATHS[idx + 1];
}

export default function PathDetail({ slug, outcomes, completionLink, nextActions }) {
  const path = getPathBySlug(slug);
  if (!path) {
    return (
      <Layout title="Path not found">
        <div className="nd-hub-page">
          <div className={styles.inner}>
            <h1>Path not found</h1>
          </div>
        </div>
      </Layout>
    );
  }

  const courses = getCoursesForPath(slug);
  const next = nextPath(slug);

  return (
    <Layout title={path.title} description={path.description}>
      <div className="nd-hub-page">
        <PathHero
          eyebrow={`Learn Temporal / Paths / ${TIER_LABEL[path.tier] ?? path.tier}`}
          title={path.title}
          description={path.description}
          level={path.level}
          lessonCount={path.lessonCount}
          outcomes={outcomes}
        />

        <section className={styles.section}>
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Paths", href: "/paths" },
                { label: path.title },
              ]}
            />

            {completionLink && (
              <Link to={completionLink.href} className={styles.completionLink}>
                <span className={styles.completionLabel}>{completionLink.label}</span>
                <span aria-hidden="true" className={styles.completionArrow}>→</span>
              </Link>
            )}

            <h2 className={styles.sectionTitle}>Courses in this path</h2>
            <ol className={styles.list}>
              {courses.map((course, i) => (
                <li key={course.slug} className={styles.listItem}>
                  <div className={styles.stepNumber}>{i + 1}</div>
                  <div className={styles.cardWrap}>
                    <CourseCard course={course} />
                  </div>
                </li>
              ))}
            </ol>

            {nextActions ? (
              <div className={styles.nextSection}>
                <h2 className={styles.sectionTitle}>{nextActions.label ?? "What's next?"}</h2>
                <div className={styles.nextGrid}>
                  {nextActions.items.map((item, i) => {
                    const isExternal = item.href.startsWith("http");
                    const linkProps = isExternal
                      ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                      : { to: item.href };
                    const LinkEl = isExternal ? "a" : Link;
                    return (
                      <LinkEl key={i} {...linkProps} className={styles.nextCard}>
                        {item.eyebrow && (
                          <span className={styles.nextEyebrow}>{item.eyebrow}</span>
                        )}
                        <h3 className={styles.nextTitle}>{item.title}</h3>
                        {item.body && <p className={styles.nextBody}>{item.body}</p>}
                        <span className={styles.nextCta}>
                          {item.cta ?? "Learn more"}
                          <span aria-hidden="true">→</span>
                        </span>
                      </LinkEl>
                    );
                  })}
                </div>
              </div>
            ) : next ? (
              <div className={styles.next}>
                <div className={styles.nextLabel}>Next path</div>
                <MagentaCta to={`/paths/${next.slug}`} variant="button">
                  {next.title}
                </MagentaCta>
              </div>
            ) : null}
          </div>
        </section>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
