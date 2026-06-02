import React from "react";
import Link from "@docusaurus/Link";
import HubHero from "../HubHero/HubHero";
import SectionRail from "../SectionRail/SectionRail";
import StepCard from "../StepCard/StepCard";
import MagentaCta from "../MagentaCta/MagentaCta";
import NotifyBanner from "../NotifyBanner/NotifyBanner";
import { COURSES, FIRST_STEPS, getCourseBySlug } from "@site/src/data/hub";
import styles from "./styles.module.css";

const EXPLORE = [
  {
    title: "Example Applications",
    description:
      "Deep reference apps you can study end-to-end",
    href: "/examples",
    cta: "Browse examples",
  },
  {
    title: "Zines",
    description:
      "Comic-style explainers for visual learners. Short, fun, and informative",
    href: "/zines",
    cta: "Read the zines",
  },
];

const PROJECT_TUTORIAL_SLUGS = [
  "building-durable-ai-applications",
  "nexus",
  "subscription-billing",
];
const FEATURED_SLUGS = ["temporal-101", "temporal-102"];
const AI_TOPIC = "ai";

function bySlugs(slugs) {
  return slugs.map(getCourseBySlug).filter(Boolean);
}

function byTopic(topic, limit = 3) {
  return COURSES.filter((c) => (c.topics ?? []).includes(topic)).slice(0, limit);
}

export default function Home() {
  return (
    <div className="nd-hub-page">
      <HubHero
        title="Temporal University"
        body={
          <>
            Temporal is a developer-first, open source platform that ensures the successful execution of services and applications. Build your next application with Temporal with free, hands-on tutorials and courses.
          </>
        }
        showSearch={false}
      />

      <section>
        <div className={styles.container}>
          <SectionRail
            title="New to Temporal? Start here"
            titleHref="/start"
          >
            <p className={styles.demoNudge}>
              Want to see the power of Temporal in action first?{" "}
              <Link to="/start/in-action" className={styles.demoNudgeLink}>
                Try the walkthrough <span aria-hidden="true">→</span>
              </Link>
            </p>
            <div className={styles.stepsGrid}>
              {FIRST_STEPS.map((step) => (
                <StepCard
                  key={step.n}
                  n={String(step.n).padStart(2, "0")}
                  duration={step.duration}
                  title={step.title}
                  description={step.description}
                  href={step.href}
                />
              ))}
            </div>
          </SectionRail>

          <SectionRail
            title="Project-based tutorials"
            titleHref="/tutorials"
            seeAllHref="/tutorials"
            courses={bySlugs(PROJECT_TUTORIAL_SLUGS)}
            columns={3}
          />

          <SectionRail
            title="Free, Hands-On Courses"
            titleHref="/courses"
            seeAllHref="/courses"
            courses={bySlugs(FEATURED_SLUGS)}
            columns={2}
          />

          <SectionRail
            title="AI"
            titleHref="/ai"
            seeAllHref="/ai"
            courses={byTopic(AI_TOPIC, 3)}
            columns={3}
          />

          <section className={styles.exploreSection}>
            <h2 className={styles.exploreHeading}>More to explore</h2>
            <p className={styles.exploreSub}>
              Other ways to dig in - reference code and fun comics!
            </p>
            <div className={styles.exploreGrid}>
              {EXPLORE.map((item) => (
                <Link key={item.href} to={item.href} className={styles.exploreCard}>
                  <h3 className={styles.exploreTitle}>{item.title}</h3>
                  <p className={styles.exploreDescription}>{item.description}</p>
                  <div className={styles.exploreCta}>
                    {item.cta}
                    <span aria-hidden="true" className={styles.exploreArrow}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.ctaWrap}>
          <MagentaCta to="/courses">Explore the whole course library</MagentaCta>
        </div>

        <NotifyBanner />
      </section>
    </div>
  );
}
