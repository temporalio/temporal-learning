import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import VerifyCard from "@site/src/components/DevEnvironment/VerifyCard";
import TemporalServiceSetup from "@site/src/components/TemporalServiceSetup/TemporalServiceSetup";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "install-python", label: "Install Python" },
  { id: "install-the-temporal-python-sdk", label: "Install the Temporal Python SDK" },
  { id: "set-up-temporal-service", label: "Set up a local Temporal Service" },
];

export default function PythonDevEnvironmentPage() {
  return (
    <Layout
      title="Set up a local development environment for Temporal and Python"
      description="Set up a local development environment for developing Temporal Applications using the Python programming language."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_python.png"
            alt="Temporal Python SDK"
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
                  { label: "Python", href: "/getting_started/python" },
                  { label: "Dev environment" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a local development environment for Temporal and Python
            </h1>

            <MetaChips
              items={["~5 minutes", "Hands-on setup", "Beginner"]}
            />

            <p className={styles.intro}>
              Follow these instructions to configure a development environment
              for building Temporal Applications with Python.
            </p>

            <section className={styles.section} id="install-python">
              <h2 className={styles.sectionTitle}>Install Python</h2>
              <p>
                Make sure you have{" "}
                <a
                  href="https://www.python.org/downloads/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Python
                </a>{" "}
                installed. These tutorials use Python 3.10.
              </p>
              <p>Check your version of Python with the following command:</p>

              <Tabs groupId="os" queryString>
                <TabItem value="win" label="Windows">
                  <CodeBlock language="bash">python -V</CodeBlock>
                </TabItem>
                <TabItem value="mac" label="macOS">
                  <CodeBlock language="bash">python3 -V</CodeBlock>
                </TabItem>
              </Tabs>

              <p>You'll see the version printed to the screen:</p>
              <CodeBlock>Python 3.10.9</CodeBlock>
            </section>

            <section
              className={styles.section}
              id="install-the-temporal-python-sdk"
            >
              <h2 className={styles.sectionTitle}>
                Install the Temporal Python SDK
              </h2>
              <p>
                You should install the Temporal Python SDK in your project
                using a virtual environment.
              </p>
              <p>Create a directory for your Temporal project:</p>
              <CodeBlock language="bash">mkdir temporal-project</CodeBlock>
              <p>Switch to the new directory:</p>
              <CodeBlock language="bash">cd temporal-project</CodeBlock>
              <p>
                Create a Python virtual environment with <code>venv</code>:
              </p>

              <Tabs groupId="os" queryString>
                <TabItem value="win" label="Windows">
                  <CodeBlock language="bash">python -m venv env</CodeBlock>
                </TabItem>
                <TabItem value="mac" label="macOS">
                  <CodeBlock language="bash">python3 -m venv env</CodeBlock>
                </TabItem>
              </Tabs>

              <p>Activate the environment:</p>

              <Tabs groupId="os" queryString>
                <TabItem value="win" label="Windows">
                  <CodeBlock language="bash">{`env\\Scripts\\activate`}</CodeBlock>
                </TabItem>
                <TabItem value="mac" label="macOS">
                  <CodeBlock language="bash">source env/bin/activate</CodeBlock>
                </TabItem>
              </Tabs>

              <p>Then install the Temporal SDK:</p>
              <CodeBlock language="bash">
                python -m pip install temporalio
              </CodeBlock>
              <p>You'll see an output similar to the following:</p>
              <CodeBlock>Successfully installed temporalio-x.y</CodeBlock>
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
                <Link to="/getting_started/python/first_program_in_python" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Run your first Temporal application</h3>
                  <p className={styles.nextBody}>
                    Download a small Python app and watch Temporal recover from failure - in about 10 minutes.
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
