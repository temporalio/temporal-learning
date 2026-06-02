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
  { id: "install-the-java-jdk", label: "Install the Java JDK" },
  { id: "add-temporal-java-sdk-dependencies", label: "Add Temporal Java SDK dependencies" },
  { id: "set-up-temporal-service", label: "Set up a local Temporal Service" },
];

const MAVEN_POM = `<dependencies>
  <!--
    Temporal dependencies needed to compile, build,
    test, and run Temporal's Java SDK
  -->

  <!--
    SDK
  -->
  <dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-sdk</artifactId>
    <version>1.31.0</version>
  </dependency>

  <dependency>
    <!--
      Testing
    -->
    <groupId>io.temporal</groupId>
    <artifactId>temporal-testing</artifactId>
    <version>1.31.0</version>
    <scope>test</scope>
  </dependency>
</dependencies>`;

const GRADLE_DEPS = `implementation 'io.temporal:temporal-sdk:1.31.0'
testImplementation 'io.temporal:temporal-testing:1.31.0'`;

export default function JavaDevEnvironmentPage() {
  return (
    <Layout
      title="Set up a local development environment for Temporal and Java"
      description="Set up a local development environment for developing Temporal applications using the Java programming language."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_java.png"
            alt="Temporal Java SDK"
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
                  { label: "Java", href: "/getting_started/java" },
                  { label: "Dev environment" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a local development environment for Temporal and Java
            </h1>

            <MetaChips
              items={["~10 minutes", "Hands-on setup", "Beginner"]}
            />

            <p className={styles.intro}>
              You'll need a{" "}
              <a
                href="https://www.oracle.com/java/technologies/downloads/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Java Development Kit
              </a>{" "}
              (JDK), the{" "}
              <a
                href="https://github.com/temporalio/sdk-java"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Java SDK
              </a>
              , and a build tool such as{" "}
              <a
                href="https://maven.apache.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apache Maven
              </a>{" "}
              or{" "}
              <a
                href="https://gradle.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gradle
              </a>
              .
            </p>

            <section className={styles.section} id="install-the-java-jdk">
              <h2 className={styles.sectionTitle}>Install the Java JDK</h2>
              <p>
                If you haven't done so already, install a JDK. Either download
                a copy directly from{" "}
                <a
                  href="https://www.oracle.com/java/technologies/downloads"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Oracle
                </a>{" "}
                or select an{" "}
                <a
                  href="https://adoptium.net/marketplace/?os=any&arch=any&package=jdk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenJDK distribution
                </a>{" "}
                from your preferred vendor.
              </p>
              <p>
                Check the version of your current JDK installation by executing{" "}
                <code>java --version</code> at a command prompt. These Java
                tutorials were developed and tested with Java 21, but they
                should work with JDKs version 8 or higher.
              </p>
            </section>

            <section
              className={styles.section}
              id="add-temporal-java-sdk-dependencies"
            >
              <h2 className={styles.sectionTitle}>
                Add Temporal Java SDK dependencies
              </h2>
              <p>
                The Java tutorials use{" "}
                <a
                  href="https://maven.apache.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apache Maven
                </a>{" "}
                to manage dependencies and build applications. You can also use{" "}
                <a
                  href="https://gradle.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gradle
                </a>{" "}
                or other build automation tools.
              </p>
              <p>Follow these steps to configure Maven or Gradle for Temporal.</p>

              <Tabs groupId="build-tool" queryString>
                <TabItem value="maven" label="Maven">
                  <p>
                    To install{" "}
                    <a
                      href="https://maven.apache.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apache Maven
                    </a>
                    ,{" "}
                    <a
                      href="https://maven.apache.org/download.cgi"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      download a copy
                    </a>{" "}
                    and follow the{" "}
                    <a
                      href="https://maven.apache.org/install.html"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      instructions
                    </a>{" "}
                    at Apache.org.
                  </p>
                  <p>
                    Add the following dependencies to your Maven Project Object
                    Model (POM) configuration file (<code>pom.xml</code>) to
                    compile, build, test, and run a Temporal Application in
                    Java.
                  </p>
                  <CodeBlock language="xml">{MAVEN_POM}</CodeBlock>
                </TabItem>
                <TabItem value="gradle" label="Gradle">
                  <p>
                    The{" "}
                    <a
                      href="https://gradle.org"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Gradle
                    </a>{" "}
                    build tool is bundled with{" "}
                    <a
                      href="https://www.jetbrains.com/idea/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      IntelliJ IDEA
                    </a>
                    . To download and install it separately, follow the{" "}
                    <a
                      href="https://gradle.org/install/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      instructions
                    </a>{" "}
                    at Gradle.org.
                  </p>
                  <p>
                    Add the following lines to <code>build.gradle</code>, your
                    Gradle configuration file, so it works with the Temporal
                    SDK:
                  </p>
                  <CodeBlock language="groovy">{GRADLE_DEPS}</CodeBlock>
                </TabItem>
              </Tabs>

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
                <Link to="/getting_started/java/first_program_in_java" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Run your first Temporal application</h3>
                  <p className={styles.nextBody}>
                    Download a small Java app and watch Temporal recover from failure - in about 10 minutes.
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
