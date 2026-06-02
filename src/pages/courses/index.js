import React, { useState } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import SdkChips from "@site/src/components/hub/SdkChips/SdkChips";
import CategorySidebar from "@site/src/components/hub/CategorySidebar/CategorySidebar";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import { COURSES } from "@site/src/data/hub";
import styles from "./courses.module.css";

function CourseCard({ course }) {
  const { url, title, summary, sdkLanguages, tier, slug } = course;
  const hasFreePreview = slug === "temporal-101";
  return (
    <Link to={url} className={styles.card} data-tier={tier}>
      {hasFreePreview && (
        <span className={styles.freePreviewBadge}>Free preview</span>
      )}
      <h3 className={styles.cardTitle}>{title}</h3>
      {summary && <p className={styles.cardSummary}>{summary}</p>}
      {sdkLanguages && sdkLanguages.length > 0 && (
        <div className={styles.cardSdks}>
          <SdkChips sdks={sdkLanguages} />
        </div>
      )}
      <div className={styles.cardCta}>
        {hasFreePreview ? "Start the free preview or free course" : "Take the course"}{" "}
        <span aria-hidden="true" className={styles.cardArrow}>→</span>
      </div>
    </Link>
  );
}

const FAQ = [
  {
    q: "Are the courses free?",
    a: "Yes - every course is free, self-paced, and runs in your own development environment.",
  },
  {
    q: "Do I have to take the courses in order?",
    a: (
      <>
        Temporal 101 is the only real prerequisite for everything else. After that, pick by what you're building. The{" "}
        <Link to="/paths">learning paths</Link> above are useful templates, not mandates.
      </>
    ),
  },
  {
    q: "How long does each course take?",
    a: "Most courses run 1-4 hours of self-paced work. Each course page shows its estimated time.",
  },
  {
    q: "Where can I ask questions about a course?",
    a: (
      <>
        You can send a message to the Temporal Education Team from the course page once you've enrolled in one of the courses. You can also post in the{" "}
        <a
          href="https://community.temporal.io/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Temporal community forum
        </a>
        . Other learners and the Temporal team answer questions there - searching past threads often finds your answer before you have to ask.
      </>
    ),
  },
];

const ALL_COURSES = COURSES.filter((c) => c.kind === "course");

function matchesFilters(course, filters) {
  const { topics, sdks, personas, useCases } = filters;
  if (topics.size > 0 && !(course.topics ?? []).some((t) => topics.has(t))) return false;
  if (sdks.size > 0 && !(course.sdkLanguages ?? []).some((s) => sdks.has(s))) return false;
  if (personas.size > 0 && !(course.persona && personas.has(course.persona))) return false;
  if (useCases.size > 0 && !(course.useCases ?? []).some((u) => useCases.has(u))) return false;
  return true;
}

export default function CoursesPage() {
  const [filters, setFilters] = useState({
    topics: new Set(),
    sdks: new Set(),
    personas: new Set(),
    useCases: new Set(),
  });

  const hasFilters =
    filters.topics.size +
      filters.sdks.size +
      filters.personas.size +
      filters.useCases.size >
    0;

  const matchedCourses = ALL_COURSES.filter((c) => matchesFilters(c, filters));

  return (
    <Layout
      title="Temporal courses"
      description="Free, self-paced courses covering Temporal from foundations to production."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Learn Temporal / Courses"
          title="Free, self-paced courses."
          body="Concept-focused, hands-on Temporal courses you can complete in an afternoon. Pick by skill area below, or follow one of the learning paths."
          showSearch={false}
        />

        <div className={styles.pageLayout}>
          <div className={styles.pageSidebar}>
            <CategorySidebar
              items={ALL_COURSES}
              filters={filters}
              onChange={setFilters}
            />
          </div>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Courses" },
                ]}
              />
            </div>

            <section className={styles.section}>
              <Link to="/paths" className={styles.pathsTeaser}>
                <span className={styles.pathsTeaserStripe} aria-hidden="true" />
                <div className={styles.pathsTeaserCopy}>
                  <span className={styles.pathsTeaserEyebrow}>Paths</span>
                  <h2 className={styles.pathsTeaserTitle}>
                    Find your learning path
                  </h2>
                  <p className={styles.pathsTeaserBody}>
                  Three sequenced tracks - from your first Workflow through running Temporal in production. Pick one and follow it through, or jump straight to the level that matches where you are.
                  </p>
                  <span className={styles.pathsTeaserCta}>
                    Browse all paths
                    <span aria-hidden="true" className={styles.pathsTeaserArrow}>
                      →
                    </span>
                  </span>
                </div>
                <div className={styles.pathsTeaserVisual} aria-hidden="true">
                  <div className={styles.pathStep}>
                    <span
                      className={`${styles.pathStepDot} ${styles.pathStepDotFront}`}
                    />
                    <div className={styles.pathStepBody}>
                      <span className={styles.pathStepLabel}>Beginner</span>
                      <span className={styles.pathStepMeta}>
                        2 tracks
                      </span>
                    </div>
                  </div>
                  <div className={styles.pathStep}>
                    <span
                      className={`${styles.pathStepDot} ${styles.pathStepDotMid}`}
                    />
                    <div className={styles.pathStepBody}>
                      <span className={styles.pathStepLabel}>Intermediate</span>
                      <span className={styles.pathStepMeta}>
                        4 tracks
                      </span>
                    </div>
                  </div>
                  <div className={styles.pathStep}>
                    <span
                      className={`${styles.pathStepDot} ${styles.pathStepDotBack}`}
                    />
                    <div className={styles.pathStepBody}>
                      <span className={styles.pathStepLabel}>Advanced</span>
                      <span className={styles.pathStepMeta}>
                        2 tracks
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {hasFilters
                  ? `${matchedCourses.length} matching ${matchedCourses.length === 1 ? "course" : "courses"}`
                  : "All courses"}
              </h2>
              <p className={styles.sectionSub}>
                {hasFilters
                  ? "Courses that match your filters."
                  : "Free, self-paced courses on Temporal concepts and patterns."}
              </p>

              {hasFilters && matchedCourses.length === 0 ? (
                <p className={styles.empty}>
                  No courses match your filters. Try clearing some.
                </p>
              ) : (
                <div className={styles.coursesGrid}>
                  {matchedCourses.map((course) => (
                    <CourseCard key={course.slug} course={course} />
                  ))}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Common questions</h2>
              <div className={styles.faq}>
                {FAQ.map((item, i) => (
                  <details key={i} className={styles.faqItem}>
                    <summary className={styles.faqQ}>{item.q}</summary>
                    <p className={styles.faqA}>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Get Help</h2>
              <div className={styles.helpGrid}>
                <a href="https://temporal.io/slack" className={styles.helpCard}>
                  <h3 className={styles.helpTitle}>
                    <img
                      src="https://docs.temporal.io/img/icons/slack-dark-mode-24x24.svg"
                      alt=""
                      className={styles.helpIcon}
                      width={24}
                      height={24}
                    />
                    Community Slack
                  </h3>
                  <p className={styles.helpBody}>
                    Ask questions and chat with thousands of Temporal developers.
                  </p>
                </a>
                <a href="https://community.temporal.io/" className={styles.helpCard}>
                  <h3 className={styles.helpTitle}>
                    <img
                      src="https://docs.temporal.io/img/icons/forum-dark-mode-24x24.svg"
                      alt=""
                      className={styles.helpIcon}
                      width={24}
                      height={24}
                    />
                    Developer Forum
                  </h3>
                  <p className={styles.helpBody}>
                    Search past questions or post your own to the Temporal community.
                  </p>
                </a>
                <a href="https://docs.temporal.io" className={styles.helpCard}>
                  <h3 className={styles.helpTitle}>
                    <img
                      src="https://docs.temporal.io/img/icons/learn-dark-mode-24x24.svg"
                      alt=""
                      className={styles.helpIcon}
                      width={24}
                      height={24}
                    />
                    Documentation
                  </h3>
                  <p className={styles.helpBody}>
                    The full reference - concepts, SDKs, deployment, troubleshooting.
                  </p>
                </a>
              </div>
            </section>

            <div className={styles.bottomCta}>
              <MagentaCta to="/tutorials">Browse project tutorials</MagentaCta>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
