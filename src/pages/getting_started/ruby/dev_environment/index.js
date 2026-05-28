import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import VerifyCard from "@site/src/components/DevEnvironment/VerifyCard";
import TemporalServiceSetup from "@site/src/components/TemporalServiceSetup/TemporalServiceSetup";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "install-ruby", label: "Install Ruby" },
  { id: "install-the-temporal-ruby-sdk", label: "Install the Temporal Ruby SDK" },
  { id: "set-up-temporal-service", label: "Set up a local Temporal Service" },
];

export default function RubyDevEnvironmentPage() {
  return (
    <Layout
      title="Set up a local development environment for Temporal and Ruby"
      description="Set up a local development environment for developing Temporal Applications using the Ruby programming language."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_ruby.png"
            alt="Temporal Ruby SDK"
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Ruby", href: "/getting_started/ruby" },
                  { label: "Dev environment" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a local development environment for Temporal and Ruby
            </h1>

            <MetaChips
              items={["~5 minutes", "Hands-on setup", "Beginner"]}
            />

            <p className={styles.intro}>
              Follow these instructions to configure a development environment
              for building Temporal Applications with Ruby.
            </p>

            <Admonition type="caution">
              <p>
                The Temporal Ruby SDK is only supported on macOS ARM/x64 and
                Linux ARM/x64. The platform-specific gem chosen is based on
                when the gem/bundle install is performed. A source gem is
                published but cannot be used directly and will fail to build if
                tried. MinGW-based Windows is not currently supported. There
                are caveats with the Google Protobuf dependency on musl-based
                Linux. See the{" "}
                <a
                  href="https://github.com/temporalio/sdk-ruby#platform-support"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Platform Support
                </a>{" "}
                section for more information.
              </p>
            </Admonition>

            <section className={styles.section} id="install-ruby">
              <h2 className={styles.sectionTitle}>Install Ruby</h2>
              <p>
                Make sure you have{" "}
                <a
                  href="https://www.ruby-lang.org/en/downloads/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ruby
                </a>{" "}
                installed. These tutorials use Ruby 3.4.3.
              </p>
              <p>Check your version of Ruby with the following command:</p>
              <CodeBlock language="bash">ruby -v</CodeBlock>
              <p>
                You'll see the version printed to the screen, along with other
                data about the version and system architecture:
              </p>
              <CodeBlock>ruby 3.4.3 ...</CodeBlock>
            </section>

            <section
              className={styles.section}
              id="install-the-temporal-ruby-sdk"
            >
              <h2 className={styles.sectionTitle}>
                Install the Temporal Ruby SDK
              </h2>
              <p>
                You should install the Temporal Ruby SDK in your project using
                a virtual environment.
              </p>
              <p>Create a directory for your Temporal project:</p>
              <CodeBlock language="bash">mkdir temporal-project</CodeBlock>
              <p>Switch to the new directory:</p>
              <CodeBlock language="bash">cd temporal-project</CodeBlock>
              <p>
                Create the Gemfile using{" "}
                <a
                  href="https://bundler.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bundler
                </a>
                :
              </p>
              <CodeBlock language="bash">bundle init</CodeBlock>
              <p>Add the Temporal SDK to the Gemfile:</p>
              <CodeBlock language="bash">bundle add temporalio</CodeBlock>
              <p>You'll see an output similar to the following:</p>
              <CodeBlock>{`Fetching gem metadata from https://rubygems.org/.....
Resolving dependencies...`}</CodeBlock>
              <p>Next, install the Temporal SDK from the Gemfile:</p>
              <CodeBlock language="bash">bundle install</CodeBlock>
              <p>You'll see an output similar to the following:</p>
              <CodeBlock>{`Installing temporalio 0.4.0 (arm64-darwin)
Bundle complete! 1 Gemfile dependency, 6 gems now installed.
Use \`bundle info [gemname]\` to see where a bundled gem is installed.`}</CodeBlock>
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
                <Link to="/getting_started/ruby/first_program_in_ruby" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Run your first Temporal application</h3>
                  <p className={styles.nextBody}>
                    Download a small Ruby app and watch Temporal recover from failure - in about 10 minutes.
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
