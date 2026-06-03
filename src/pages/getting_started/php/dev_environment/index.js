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
  { id: "install-the-php-sdk", label: "Install the PHP SDK" },
  { id: "download-roadrunner", label: "Download RoadRunner" },
  { id: "set-up-temporal-service", label: "Set up a local Temporal Service" },
];

const ROADRUNNER_YAML = `rpc:
  listen: tcp://127.0.0.1:6001

server:
  command: "php worker.php"

temporal:
  address: "127.0.0.1:7233"

logs:
  level: info`;

export default function PhpDevEnvironmentPage() {
  return (
    <Layout
      title="Set up a local development environment for Temporal and PHP"
      description="Set up a local development environment for developing Temporal applications using the PHP programming language."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_php.png"
            alt="Temporal PHP SDK"
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
                  { label: "Get Started", href: "/start" },
                  { label: "PHP", href: "/getting_started/php" },
                  { label: "Dev environment" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a local development environment for Temporal and PHP
            </h1>

            <MetaChips
              items={["~5 minutes", "Hands-on setup", "Beginner"]}
            />

            <p className={styles.intro}>
              To follow the PHP SDK tutorials and build your own Temporal
              applications with PHP, you'll need the PHP SDK, the{" "}
              <a
                href="https://github.com/roadrunner-server/roadrunner"
                target="_blank"
                rel="noopener noreferrer"
              >
                RoadRunner application server
              </a>
              , and a Temporal development server.
            </p>

            <section className={styles.section} id="install-the-php-sdk">
              <h2 className={styles.sectionTitle}>Install the PHP SDK</h2>
              <p>
                Install the PHP SDK using{" "}
                <a
                  href="http://getcomposer.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Composer
                </a>
                :
              </p>
              <CodeBlock language="bash">composer require temporal/sdk</CodeBlock>
            </section>

            <section className={styles.section} id="download-roadrunner">
              <h2 className={styles.sectionTitle}>Download RoadRunner</h2>
              <p>
                You can download RoadRunner in your project using the following
                command:
              </p>
              <CodeBlock language="bash">vendor/bin/rr get</CodeBlock>
              <p>
                See{" "}
                <a
                  href="https://docs.roadrunner.dev/docs/general/install"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  RoadRunner installation instructions
                </a>{" "}
                to learn about other installation methods.
              </p>
              <p>
                To configure the RoadRunner Temporal plugin, create or open the{" "}
                <code>.rr.yaml</code> file in your project directory and make
                sure it contains the following:
              </p>
              <CodeBlock language="yaml">{ROADRUNNER_YAML}</CodeBlock>
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
                <Link to="/getting_started/php/hello_world_in_php" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Build a Hello World Temporal app</h3>
                  <p className={styles.nextBody}>
                    Write your first Workflow and Activity in PHP - in about 15 minutes.
                  </p>
                  <span className={styles.nextCta}>
                    Build Hello World <span aria-hidden="true">→</span>
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
