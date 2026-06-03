import React, { useState, useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import CourseCard from "@site/src/components/hub/CourseCard/CourseCard";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import { FIRST_STEPS, getCourseBySlug } from "@site/src/data/hub";
import styles from "./start.module.css";

const STEPS = FIRST_STEPS.map((s) => ({
  n: String(s.n).padStart(2, "0"),
  title: s.title,
  description: s.description,
  duration: s.duration,
  href: s.href,
}));

const CONCEPTS = [
  {
    title: "Workflow",
    body: "A function that orchestrates work. Reliably executes to completion, even across failures or restarts.",
    href: "https://docs.temporal.io/workflows",
  },
  {
    title: "Activity",
    body: "A unit of work called from a Workflow. Activities can talk to the outside world (databases, APIs, anything that might fail).",
    href: "https://docs.temporal.io/activities",
  },
  {
    title: "Worker",
    body: "A process you run that executes Workflow and Activity code. Workers pull tasks from a Task Queue.",
    href: "https://docs.temporal.io/workers",
  },
  {
    title: "Task Queue",
    body: "Where the Temporal Service hands tasks to Workers. You name it; Workers listen on it.",
    href: "https://docs.temporal.io/workers#task-queue",
  },
];

const FAQ = [
  {
    q: "What is Durable Execution?",
    a: "Temporal makes it easier for developers to build and operate reliable, scalable applications without sacrificing productivity. The design of the system ensures that, once started, an application's main function executes to completion - whether that takes minutes, hours, days, weeks, or even years.",
  },
  {
    q: "What happens when a Workflow fails halfway through?",
    a: "Temporal records the steps your code takes as it runs. If the process crashes or restarts, your code replays through the recorded steps to recover its state, then continues from where it left off - no manual recovery code needed.",
  },
  {
    q: "Do I need to run my own Temporal Service?",
    a: "For local development you can spin one up with the Temporal CLI in seconds. In production you can self-host or use Temporal Cloud.",
  },
];

const TOC_ITEMS = [
  { id: "run-a-transfer", label: "See the power of Temporal", href: "/start/run-a-transfer", anchor: false },
  { id: "dev-environment", label: "Set up dev environment", href: "/start/dev-environment", anchor: false },
  { id: "build-from-scratch", label: "Build an application from scratch", href: "/start/build-from-scratch", anchor: false },
  { id: "take-a-course", label: "Take a free course", anchor: true },
  { id: "concepts", label: "Concepts to know", anchor: true },
  { id: "common-questions", label: "Common questions", anchor: true },
];

function StartToc() {
  const [activeId, setActiveId] = useState("");
  const observerRef = useRef(null);

  useEffect(() => {
    const anchors = TOC_ITEMS.filter((i) => i.anchor);
    const targets = anchors
      .map((i) => document.getElementById(i.id))
      .filter(Boolean);
    if (targets.length === 0) return undefined;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.offsetTop - b.target.offsetTop);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );

    targets.forEach((t) => observerRef.current.observe(t));
    return () => observerRef.current && observerRef.current.disconnect();
  }, []);

  const handleAnchorClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
    if (history.replaceState) history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav className={styles.toc} aria-label="On this page">
      <div className={styles.tocLabel}>On this page</div>
      <ol className={styles.tocList}>
        {TOC_ITEMS.map((item, i) => {
          const n = String(i + 1).padStart(2, "0");
          const isActive = item.anchor && item.id === activeId;
          if (item.anchor) {
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleAnchorClick(e, item.id)}
                  className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ""}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className={styles.tocNum}>{n}</span>
                  <span className={styles.tocText}>{item.label}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={item.id}>
              <a href={item.href} className={styles.tocLink}>
                <span className={styles.tocNum}>{n}</span>
                <span className={styles.tocText}>{item.label}</span>
                <span aria-hidden="true" className={styles.tocExternal}>↗</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function StartPage() {
  const t101 = getCourseBySlug("temporal-101");
  const t102 = getCourseBySlug("temporal-102");

  return (
    <Layout
      title="New to Temporal? Start here"
      description="Set up your environment, build your first Workflow, and learn how Temporal handles failures."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Temporal University / Start here"
          title="New to Temporal? Start here."
          body="Temporal makes long-running, multi-step work reliable - even when servers crash, networks blink, or downstream services time out. In about an hour you can have your first Workflow running, then go deeper through the courses."
          showSearch={false}
        />

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <StartToc />
          </aside>
          <main className={styles.pageMain}>

        <section className={styles.section} id="first-hour">
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Temporal University", href: "/" },
                { label: "Start here" },
              ]}
            />
            <h2 className={styles.sectionTitle}>Your first hour</h2>
            <p className={styles.sectionSub}>
              Three short steps. Run a Workflow in a live lab, set up your machine, then build your own.
            </p>
            <ol className={styles.steps}>
              {STEPS.map((step) => (
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

        <section className={styles.section} id="take-a-course">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Then go deeper</h2>
            <p className={styles.sectionSub}>
              Once your first Workflow is running, take one of our free, foundational courses.
            </p>
            <div className={styles.grid2}>
              <CourseCard course={t101} size="lg" ctaLabel="Start preview or take the free course" />
              <CourseCard course={t102} size="lg" />
            </div>
          </div>
        </section>

        <section className={styles.section} id="concepts">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Concepts to know</h2>
            <p className={styles.sectionSub}>
              The vocabulary you'll see across the docs and courses.
            </p>
            <div className={styles.conceptGrid}>
              {CONCEPTS.map((c) => (
                <a key={c.title} href={c.href} className={styles.concept}>
                  <h3 className={styles.conceptTitle}>{c.title}</h3>
                  <p className={styles.conceptBody}>{c.body}</p>
                  <div className={styles.conceptLink}>
                    Read the docs <span aria-hidden="true">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} id="common-questions">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Common questions</h2>
            <div className={styles.faq}>
              {FAQ.map((item, i) => (
                <details key={i} className={styles.faqItem}>
                  <summary className={styles.faqQ}>{item.q}</summary>
                  <p className={styles.faqA}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
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
          </div>
        </section>

            <div className={styles.bottomCta}>
              <MagentaCta to="/paths/beginner">
                Take the Beginner path
              </MagentaCta>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
