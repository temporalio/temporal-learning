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
  { id: "install-dotnet", label: "Install .NET" },
  { id: "install-the-temporal-dotnet-sdk", label: "Install the Temporal .NET SDK" },
  { id: "set-up-temporal-service", label: "Set up a local Temporal Service" },
];

export default function DotnetDevEnvironmentPage() {
  return (
    <Layout
      title="Set up a local development environment for Temporal and .NET"
      description="Set up a local development environment for developing Temporal applications using the .NET SDK."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_dotnet.png"
            alt="Temporal .NET SDK"
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
                  { label: ".NET", href: "/getting_started/dotnet" },
                  { label: "Dev environment" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a local development environment for Temporal and .NET
            </h1>

            <MetaChips
              items={["~5 minutes", "Hands-on setup", "Beginner"]}
            />

            <p className={styles.intro}>
              To follow the .NET SDK tutorials and build your own Temporal
              applications, you'll need the{" "}
              <a
                href="https://github.com/temporalio/sdk-dotnet?tab=readme-ov-file#installation"
                target="_blank"
                rel="noopener noreferrer"
              >
                .NET SDK
              </a>{" "}
              and a Temporal Server.
            </p>

            <section className={styles.section} id="install-dotnet">
              <h2 className={styles.sectionTitle}>Install .NET</h2>
              <p>The .NET SDK requires .NET 6.0 or later.</p>
              <p>
                Install .NET by following{" "}
                <a
                  href="https://dotnet.microsoft.com/en-us/download"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the official .NET instructions
                </a>
                .
              </p>
            </section>

            <section
              className={styles.section}
              id="install-the-temporal-dotnet-sdk"
            >
              <h2 className={styles.sectionTitle}>
                Install the Temporal .NET SDK
              </h2>
              <p>
                If you don't already have a .NET project, create one by running
                the following command:
              </p>
              <CodeBlock language="bash">
                dotnet new console -o temporaldotnet
              </CodeBlock>
              <p>Switch to the new directory for your project:</p>
              <CodeBlock language="bash">cd temporaldotnet</CodeBlock>
              <p>
                Then, install the{" "}
                <a
                  href="https://www.nuget.org/packages/Temporalio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal .NET SDK
                </a>
                :
              </p>
              <CodeBlock language="bash">dotnet add package Temporalio</CodeBlock>
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
                <Link to="/getting_started/dotnet/first_program_in_dotnet" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Run your first Temporal application</h3>
                  <p className={styles.nextBody}>
                    Download a small .NET app and watch Temporal recover from failure - in about 10 minutes.
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
