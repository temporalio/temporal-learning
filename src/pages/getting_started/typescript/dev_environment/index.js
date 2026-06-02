import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import VerifyCard from "@site/src/components/DevEnvironment/VerifyCard";
import TemporalServiceSetup from "@site/src/components/TemporalServiceSetup/TemporalServiceSetup";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "install-node", label: "Install Node.js" },
  { id: "set-up-typescript-sdk", label: "Set up the Temporal TypeScript SDK" },
  { id: "set-up-temporal-service", label: "Set up a local Temporal Service" },
];

export default function TypeScriptDevEnvironmentPage() {
  return (
    <Layout
      title="Set up a local development environment for Temporal and TypeScript"
      description="Set up a local development environment for developing Temporal applications using the TypeScript programming language."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_typescript.png"
            alt="Temporal TypeScript SDK"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Temporal University", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "TypeScript", href: "/getting_started/typescript" },
                  { label: "Dev environment" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a local development environment for Temporal and TypeScript
            </h1>

            <MetaChips
              items={["~5 minutes", "Hands-on setup", "Beginner"]}
            />

            <p className={styles.intro}>
              To follow the TypeScript SDK tutorials and build your own Temporal
              applications, you'll need the TypeScript SDK and a Temporal
              server.
            </p>

            <section className={styles.section} id="install-node">
              <h2 className={styles.sectionTitle}>Install Node.js</h2>
              <p>The TypeScript SDK requires Node.js 18 or later.</p>
              <p>
                Install Node.js via your package manager by following{" "}
                <a
                  href="https://nodejs.org/en/download/package-manager/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the official Node.js instructions
                </a>
                .
              </p>
            </section>

            <section className={styles.section} id="set-up-typescript-sdk">
              <h2 className={styles.sectionTitle}>
                Set up the Temporal TypeScript SDK
              </h2>
              <p>You can create a new project with the Temporal SDK:</p>
              <CodeBlock language="bash">
                npx @temporalio/create@latest ./my-app
              </CodeBlock>
              <p>
                You can also add the Temporal TypeScript SDK to an existing
                project with the following command:
              </p>
              <CodeBlock language="bash">
                npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
              </CodeBlock>
              <p>
                Next, you'll configure a local Temporal Service for development.
              </p>
            </section>

            <section className={styles.section} id="set-up-temporal-service">
              <h2 className={styles.sectionTitle}>
                Set up a local Temporal Service for development with Temporal CLI
              </h2>
              <TemporalServiceSetup />
            </section>

            <VerifyCard />

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/getting_started/typescript/first_program_in_typescript" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Run your first Temporal application</h3>
                  <p className={styles.nextBody}>
                    Download a small TypeScript app and watch Temporal recover from failure - in about 10 minutes.
                  </p>
                  <span className={styles.nextCta}>
                    Run your first app <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
