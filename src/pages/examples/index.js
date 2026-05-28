import React from "react";
import Layout from "@theme/Layout";
import ArchetypeCard from "@site/src/components/hub/ArchetypeCard/ArchetypeCard";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import SdkLogo from "@site/src/components/hub/SdkLogo/SdkLogo";
import styles from "./examples.module.css";

const REFERENCE_APPS = [
  {
    title: "Background Check Application",
    accent: "durability",
    description:
      "Long-running, human-in-the-loop background check Workflow, fully documented end-to-end. Designed for studying how a real Temporal app fits together.",
    implsLabel: "Read it in",
    impls: [
      { sdk: "go", href: "/examples/go/background-checks/", label: "Go (in-depth docs)" },
    ],
  },
  {
    title: "Order Management System",
    accent: "payments",
    description:
      "Reference architecture for an order-management system. Documented in the GitHub repository.",
    implsLabel: "Read it in",
    impls: [
      {
        sdk: "go",
        href: "https://github.com/temporalio/reference-app-orders-go",
        label: "Go (GitHub)",
      },
    ],
  },
];

const USE_CASES = [
  {
    title: "Order Fulfillment",
    accent: "payments",
    description: (
      <>
        Sample e-commerce order fulfillment Workflow that demonstrates durability and interactive capabilities.{" "}
        <a
          href="https://www.youtube.com/watch?v=dNVmRfWsNkM"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch the demo
        </a>
        .
      </>
    ),
    impls: [
      {
        sdk: "typescript",
        href: "https://github.com/temporal-sa/temporal-order-fulfill-demo",
      },
    ],
  },
  {
    title: "Money Transfer",
    accent: "billing",
    description:
      "A custom UI lets you trigger simulated failure scenarios and exercise Temporal primitives like Signals and Schedules.",
    impls: [
      {
        sdk: "java",
        href: "https://github.com/temporal-sa/temporal-money-transfer-java",
      },
      {
        sdk: "typescript",
        href: "https://github.com/temporal-sa/temporal-money-transfer-typescript",
      },
    ],
  },
  {
    title: "Orchestrate Lambda Functions",
    accent: "data",
    description:
      "A Temporal version of the AWS Step Functions Lambda orchestration example - checks a stock price and produces a buy/sell recommendation.",
    impls: [
      {
        sdk: "typescript",
        href: "https://github.com/temporal-sa/temporal-orchestrate-lambda-functions",
      },
    ],
  },
];

const DESIGN_PATTERNS = [
  {
    title: "Entity Workflow demo",
    accent: "durability",
    description: (
      <>
        Illustrates the Entity Lifecycle Pattern (Entity Workflows) and long-running Workflows.{" "}
        <a
          href="https://docs.google.com/presentation/d/1A2dz4lFiIFz4c_7QlOpahbvesbBY8Y6y65zRrkVgqYE/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
        >
          Companion slide deck
        </a>
        .
      </>
    ),
    impls: [
      {
        sdk: "go",
        href: "https://github.com/temporal-sa/temporal-entity-lifecycle-go",
      },
    ],
  },
  {
    title: "Order Saga sample",
    accent: "saga",
    description: (
      <>
        Demonstrates the Saga pattern - recovery from failed multi-step transactions.{" "}
        <a
          href="https://www.youtube.com/watch?v=uHDQMfOMFD4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch the demo
        </a>
        .
      </>
    ),
    impls: [
      {
        sdk: "java",
        href: "https://github.com/temporal-sa/temporal-order-saga",
      },
    ],
  },
];

const DATA_ENCRYPTION = [
  {
    title: "Codec Server with JWT validation",
    accent: "data",
    description:
      "Uses JSON Web Tokens (JWT) to confirm the authenticity of JWTs issued by Temporal Cloud.",
    impls: [
      {
        sdk: "typescript",
        href: "https://github.com/temporal-sa/temporal-codec-server",
      },
    ],
  },
  {
    title: "Codec CORS credentials",
    accent: "data",
    description:
      "A Codec Server that supports Cross-Origin Resource Sharing (CORS), including requests with credentials.",
    impls: [
      {
        sdk: "go",
        href: "https://github.com/temporal-sa/codec-cors-credentials",
      },
    ],
  },
];

const SDK_SAMPLES = [
  { sdk: "go", label: "Go", href: "https://github.com/temporalio/samples-go" },
  { sdk: "java", label: "Java", href: "https://github.com/temporalio/samples-java" },
  { sdk: "dotnet", label: ".NET", href: "https://github.com/temporalio/samples-dotnet" },
  { sdk: "php", label: "PHP", href: "https://github.com/temporalio/samples-php" },
  { sdk: "python", label: "Python", href: "https://github.com/temporalio/samples-python" },
  { sdk: "ruby", label: "Ruby", href: "https://github.com/temporalio/samples-ruby" },
  { sdk: "typescript", label: "TypeScript", href: "https://github.com/temporalio/samples-typescript" },
];

export default function ExamplesPage() {
  return (
    <Layout
      title="Example Applications"
      description="Reference apps, working demos, and SDK samples for Temporal."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/exampleapplications.png"
            alt="Example Applications"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageInner}>
          <div className={styles.breadcrumbWrap}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Examples" },
              ]}
            />
          </div>

          <p className={styles.intro}>
            Explore example applications and code samples that use Temporal to see how everything fits together.
          </p>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Reference applications</h2>
            <p className={styles.sectionSub}>
              Fully documented, end-to-end solutions for a particular use case. If you're new to Temporal, these are a great place to start.
            </p>
            <div className={styles.grid}>
              {REFERENCE_APPS.map((a) => (
                <ArchetypeCard key={a.title} {...a} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Use cases</h2>
            <p className={styles.sectionSub}>
              Working demos for common Temporal use cases. Not intended for production use, but useful for seeing patterns in action.
            </p>
            <div className={styles.grid}>
              {USE_CASES.map((a) => (
                <ArchetypeCard key={a.title} {...a} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Design patterns</h2>
            <p className={styles.sectionSub}>
              Architectural patterns demonstrated end-to-end.
            </p>
            <div className={styles.grid}>
              {DESIGN_PATTERNS.map((a) => (
                <ArchetypeCard key={a.title} {...a} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Data encryption</h2>
            <p className={styles.sectionSub}>
              See the{" "}
              <a
                href="https://docs.temporal.io/production-deployment/data-encryption"
                target="_blank"
                rel="noopener noreferrer"
              >
                Codec Server documentation
              </a>{" "}
              for context.
            </p>
            <div className={styles.grid}>
              {DATA_ENCRYPTION.map((a) => (
                <ArchetypeCard key={a.title} {...a} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>SDK samples</h2>
            <p className={styles.sectionSub}>
              Smaller examples that showcase a particular Temporal feature or pattern - one repo per SDK.
            </p>
            <div className={styles.sampleChips}>
              {SDK_SAMPLES.map((s) => (
                <a
                  key={s.sdk}
                  href={s.href}
                  className={styles.sampleChip}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SdkLogo sdk={s.sdk} size={24} />
                  {s.label}
                  <span aria-hidden="true" className={styles.sampleChipArrow}>
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </section>

          <p className={styles.footnote}>More examples coming soon.</p>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
