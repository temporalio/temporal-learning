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
  { id: "install-go", label: "Install Go" },
  { id: "install-the-temporal-go-sdk", label: "Install the Temporal Go SDK" },
  { id: "set-up-temporal-service", label: "Set up a local Temporal Service" },
];

export default function GoDevEnvironmentPage() {
  return (
    <Layout
      title="Set up a local development environment for Temporal and Go"
      description="Set up a local development environment for developing Temporal applications using the Go programming language."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_go.png"
            alt="Temporal Go SDK"
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
                  { label: "Go", href: "/getting_started/go" },
                  { label: "Dev environment" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a local development environment for Temporal and Go
            </h1>

            <MetaChips
              items={["~5 minutes", "Hands-on setup", "Beginner"]}
            />

            <p className={styles.intro}>
              To follow the Go SDK tutorials we recommend that you have the
              following environments set up.
            </p>

            <section className={styles.section} id="install-go">
              <h2 className={styles.sectionTitle}>Install Go</h2>
              <p>
                Make sure you have{" "}
                <a
                  href="https://golang.org/doc/install"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Go
                </a>{" "}
                installed. These tutorials were produced using Go 1.18.
              </p>
              <p>Check your version of Go with the following command:</p>
              <CodeBlock language="bash">go version</CodeBlock>
              <p>This will return your installed Go version:</p>
              <CodeBlock>go version go1.18.1 darwin/amd64</CodeBlock>
            </section>

            <section
              className={styles.section}
              id="install-the-temporal-go-sdk"
            >
              <h2 className={styles.sectionTitle}>
                Install the Temporal Go SDK
              </h2>
              <p>
                If you are creating a new project using the Temporal Go SDK,
                you can start by creating a new directory:
              </p>
              <CodeBlock language="bash">mkdir goproject</CodeBlock>
              <p>Next, switch to the new directory:</p>
              <CodeBlock language="bash">cd goproject</CodeBlock>
              <p>Then, initialize a Go project in that directory:</p>
              <CodeBlock language="bash">go mod init goproject/app</CodeBlock>
              <p>
                Finally, install the Temporal SDK with <code>go get</code>:
              </p>
              <CodeBlock language="bash">go get go.temporal.io/sdk</CodeBlock>
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
                <Link to="/getting_started/go/first_program_in_go" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Run your first Temporal application</h3>
                  <p className={styles.nextBody}>
                    Download a small Go app and watch Temporal recover from failure - in about 10 minutes.
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
