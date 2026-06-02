import React, { useState } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import ArchetypeCard from "@site/src/components/hub/ArchetypeCard/ArchetypeCard";
import SdkChips from "@site/src/components/hub/SdkChips/SdkChips";
import CategorySidebar from "@site/src/components/hub/CategorySidebar/CategorySidebar";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import styles from "./tutorials.module.css";

function TutorialCard({ title, summary, href, accent, sdkLanguages }) {
  return (
    <Link to={href} className={styles.card} data-accent={accent}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {summary && <p className={styles.cardSummary}>{summary}</p>}
      {sdkLanguages && sdkLanguages.length > 0 && (
        <div className={styles.cardSdks}>
          <SdkChips sdks={sdkLanguages} />
        </div>
      )}
      <div className={styles.cardCta}>
        Read tutorial <span aria-hidden="true" className={styles.cardArrow}>→</span>
      </div>
    </Link>
  );
}

const AI = [
  {
    title: "Building Durable AI Applications",
    href: "/tutorials/ai/building-durable-ai-applications",
    summary: "Build a durable AI application backed by Temporal's reliable execution model.",
    sdkLanguages: ["python"],
    topics: ["ai"],
    useCases: ["ai", "ai-agents", "human-in-the-loop"],
  },
  {
    title: "Building MCP Tools with Temporal",
    href: "/tutorials/ai/building-mcp-tools-with-temporal",
    summary: "Wrap Temporal Workflows as MCP tools so LLM agents can call them durably.",
    sdkLanguages: ["python"],
    topics: ["ai"],
    useCases: ["ai", "human-in-the-loop"],
  },
  {
    title: "Building Deep Research Agents with the OpenAI Agents SDK",
    href: "/tutorials/ai/deep-research",
    summary: "Build deep-research agents that run for hours and survive failure.",
    sdkLanguages: ["python"],
    topics: ["ai"],
    useCases: ["ai", "ai-agents", "ai-deep-research", "human-in-the-loop"],
  },
  {
    title: "Building a Durable AI Agent",
    href: "/tutorials/ai/durable-ai-agent",
    summary: "Compose Temporal primitives into a long-running agent that picks up where it left off.",
    sdkLanguages: ["python"],
    topics: ["ai"],
    useCases: ["ai", "ai-agents", "human-in-the-loop"],
  },
];

const INFRA = [
  {
    title: "Configuring the Temporal CLI with SQLite",
    href: "/tutorials/infrastructure/configuring-sqlite-binary",
    summary: "Run the Temporal Service against a SQLite backend for development and lightweight production.",
    sdkLanguages: [],
    useCases: ["infrastructure"],
  },
  {
    title: "Running Temporal Behind Envoy",
    href: "/tutorials/infrastructure/envoy-sqlite-binary",
    summary: "Deploy the Temporal Service behind an Envoy reverse proxy with SQLite storage.",
    sdkLanguages: [],
    useCases: ["infrastructure"],
  },
  {
    title: "Running Temporal Behind NGINX",
    href: "/tutorials/infrastructure/nginx-sqlite-binary",
    summary: "Deploy the Temporal Service behind an nginx reverse proxy with SQLite storage.",
    sdkLanguages: [],
    useCases: ["infrastructure"],
  },
];

const ARCHETYPES = [
  {
    title: "Building a Background Check Application",
    accent: "durability",
    useCases: ["customer-onboarding", "human-in-the-loop"],
    description:
      "Build a long-running, human-in-the-loop application that survives restarts - a hands-on intro to durable execution.",
    impls: [
      { sdk: "go", href: "/tutorials/go/background-check" },
      { sdk: "java", href: "/tutorials/java/background-check" },
      { sdk: "python", href: "/tutorials/python/background-check" },
      { sdk: "typescript", href: "/tutorials/typescript/background-check" },
    ],
  },
  {
    title: "Processing Orders",
    accent: "payments",
    useCases: ["order-management", "payment-processing"],
    description:
      "Charge cards, manage inventory, handle refunds. Sagas that compensate when something goes wrong mid-checkout.",
    impls: [
      { sdk: "go", href: "/tutorials/go/build-an-ecommerce-app", topics: ["signals", "queries", "schedules-timers"] },
      { sdk: "typescript", href: "/tutorials/typescript/build-one-click-order-app-nextjs", label: "TypeScript + Next.js", topics: ["web-integration"] },
    ],
  },
  {
    title: "Building Subscription Billing",
    accent: "billing",
    useCases: ["payment-processing"],
    topics: ["signals", "schedules-timers"],
    description:
      "Recurring charges, retries, dunning, and graceful cancellation - durable across restarts and deploys.",
    impls: [
      { sdk: "php", href: "/tutorials/php/build-a-recurring-billing-app" },
      { sdk: "typescript", href: "/tutorials/typescript/recurring-billing-system" },
    ],
  },
  {
    title: "Building Email Drip Campaigns",
    accent: "email",
    useCases: ["communications-marketing"],
    topics: ["queries", "schedules-timers"],
    description:
      "Multi-message sequences scheduled over hours, days, or weeks. Each step survives Worker restarts.",
    impls: [
      { sdk: "go", href: "/tutorials/go/build-an-email-drip-campaign" },
      { sdk: "java", href: "/tutorials/java/build-an-email-drip-campaign" },
      { sdk: "python", href: "/tutorials/python/build-an-email-drip-campaign" },
    ],
  },
  {
    title: "Building Trip Booking Sagas",
    accent: "saga",
    useCases: ["order-management"],
    topics: ["sagas"],
    description:
      "Compose flights, hotels, and cars into one Workflow that rolls back cleanly when any step fails.",
    impls: [
      { sdk: "php", href: "/tutorials/php/build_a_trip_booking_app" },
      { sdk: "python", href: "/tutorials/python/trip-booking-app" },
    ],
  },
  {
    title: "Building a Data Pipeline",
    accent: "data",
    useCases: ["data-pipelines"],
    description:
      "Move data through extract / transform / load steps in a durable Workflow that survives restarts.",
    impls: [
      { sdk: "python", href: "/tutorials/python/build-a-data-pipeline", topics: ["schedules-timers"] },
    ],
  },
  {
    title: "Building a Geocoding API",
    accent: "data",
    useCases: ["data-pipelines"],
    description:
      "Wrap a third-party API in a durable Workflow with caching and retries.",
    impls: [
      { sdk: "python", href: "/tutorials/python/geocoding-app", topics: [] },
    ],
  },
  {
    title: "Generating Media",
    accent: "media",
    description:
      "Generate audiobooks, branching narratives, and other long-running media workflows that combine LLMs with reliable execution.",
    impls: [
      { sdk: "go", href: "/tutorials/go/audiobook" },
      { sdk: "java", href: "/tutorials/java/audiobook" },
    ],
  },
  {
    title: "Building a Choose-Your-Own-Adventure Bot",
    accent: "ai",
    topics: ["ai", "signals", "schedules-timers"],
    description:
      "Maintain conversation state across turns in a bot powered by LLMs - Signals route player choices, Timers pace the story.",
    impls: [
      { sdk: "typescript", href: "/tutorials/typescript/build-choose-your-own-adventure-bot" },
    ],
  },
  {
    title: "Building a Slack Work Queue App",
    accent: "data",
    useCases: ["communications-marketing"],
    topics: ["web-integration", "cloud"],
    description:
      "Build a Slack app that turns slash commands into durable Workflows, then deploy the whole thing to DigitalOcean with Temporal Cloud.",
    impls: [
      { sdk: "typescript", href: "/tutorials/typescript/work-queue-slack-app" },
    ],
  },
  {
    title: "Connecting Services with Nexus",
    accent: "nexus",
    useCases: ["financial-services", "payment-processing", "human-in-the-loop"],
    topics: ["nexus"],
    description:
      "Use Nexus to call Workflows that live in different Temporal namespaces or services - clean boundaries between teams.",
    implsLabel: "Build it in",
    impls: [
      { sdk: "java", href: "/tutorials/nexus/nexus-sync-tutorial-java/", label: "Java" },
    ],
  },
];

const ALL_TUTORIALS = [
  ...AI.map((t) => ({ ...t, type: "single", topics: t.topics ?? ["ai"], accent: "ai" })),
  ...INFRA.map((t) => ({ ...t, type: "single", topics: ["infrastructure"], accent: "infrastructure" })),
  ...ARCHETYPES.map((a) => ({
    type: "archetype",
    title: a.title,
    description: a.description,
    accent: a.accent,
    impls: a.impls,
    implsLabel: a.implsLabel,
    topics: a.topics ?? [...new Set(a.impls.flatMap((i) => i.topics ?? []))],
    useCases: a.useCases ?? [],
    sdkLanguages: [...new Set(a.impls.map((i) => i.sdk).filter(Boolean))],
  })),
];

function matchesFilters(tutorial, filters) {
  const { topics, sdks, personas, useCases } = filters;
  if (topics.size > 0 && !(tutorial.topics ?? []).some((t) => topics.has(t))) return false;
  if (sdks.size > 0 && !(tutorial.sdkLanguages ?? []).some((s) => sdks.has(s))) return false;
  if (useCases.size > 0 && !(tutorial.useCases ?? []).some((u) => useCases.has(u))) return false;
  if (personas.size > 0) return false;
  return true;
}

export default function TutorialsPage() {
  const [filters, setFilters] = useState({
    topics: new Set(),
    sdks: new Set(),
    personas: new Set(),
    useCases: new Set(),
  });

  const hasFilters =
    filters.topics.size + filters.sdks.size + filters.useCases.size > 0;
  const matched = ALL_TUTORIALS.filter((t) => matchesFilters(t, filters));

  return (
    <Layout
      title="Project-based tutorials"
      description="Build real apps with Temporal - end-to-end."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Learn Temporal / Tutorials"
          title="Project-based tutorials."
          body="Concept courses teach you the primitives. Tutorials teach you how the primitives compose into something real - an e-commerce checkout, an AI agent, a trip-booking saga."
          showSearch={false}
        />

        <div className={styles.pageLayout}>
          <div className={styles.pageSidebar}>
            <CategorySidebar
              items={ALL_TUTORIALS}
              filters={filters}
              onChange={setFilters}
            />
          </div>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials" },
                ]}
              />
            </div>

            {hasFilters ? (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {matched.length} matching {matched.length === 1 ? "tutorial" : "tutorials"}
                </h2>
                <p className={styles.sectionSub}>
                  Tutorials that match your filters.
                </p>
                {matched.length > 0 ? (
                  <div className={styles.matchedGrid}>
                    {matched.map((t) =>
                      t.type === "archetype" ? (
                        <ArchetypeCard
                          key={t.title}
                          title={t.title}
                          description={t.description}
                          accent={t.accent}
                          impls={t.impls}
                          implsLabel={t.implsLabel}
                        />
                      ) : (
                        <TutorialCard key={t.href} {...t} />
                      )
                    )}
                  </div>
                ) : (
                  <p className={styles.empty}>
                    No tutorials match your filters. Try clearing some.
                  </p>
                )}
              </section>
            ) : (
              <>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Build AI Agents</h2>
                  <p className={styles.sectionSub}>
                  Long-running agents need durable state, tool-call retries, and the ability to resume mid-conversation when a Worker crashes. Follow these tutorials to learn how to add Temporal to your applications.
                  </p>
                  <div className={styles.grid} data-columns={3}>
                    {AI.map((item) => (
                      <TutorialCard key={item.href} {...item} accent="ai" />
                    ))}
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>What do you want to build?</h2>
                  <div className={styles.archetypeGrid}>
                    {ARCHETYPES.map((a) => (
                      <ArchetypeCard
                        key={a.title}
                        title={a.title}
                        description={a.description}
                        accent={a.accent}
                        impls={a.impls}
                        implsLabel={a.implsLabel}
                      />
                    ))}
                  </div>
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Infrastructure Tutorials</h2>
                  <p className={styles.sectionSub}>
                  These tutorials will walk you through deploying and maintaining a Temporal Service.
                  </p>
                  <div className={styles.grid} data-columns={3}>
                    {INFRA.map((item) => (
                      <TutorialCard key={item.href} {...item} accent="infrastructure" />
                    ))}
                  </div>
                </section>
              </>
            )}

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
              <MagentaCta to="/courses">Take a free course</MagentaCta>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
