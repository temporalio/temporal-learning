// Chapter 1 of 3: Introduction to the Temporal Java SDK.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIAL_STEPS = [
  { n: 1, label: "Introduction", href: "/tutorials/java/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/java/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/java/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "supported-runtimes", label: "Supported runtimes" },
  { id: "build-configuration", label: "Build configuration" },
  { id: "expected-skills", label: "Expected skills and experiences" },
  { id: "additional-resources", label: "Code samples and resources" },
  { id: "updates", label: "Updates" },
  { id: "contribution", label: "Contribution" },
];

const POM_XML = `<dependency>
  <groupId>io.temporal</groupId>
  <artifactId>temporal-sdk</artifactId>
  <version>N.N.N</version>
</dependency>`;

const BUILD_GRADLE = `compile group: 'io.temporal', name: 'temporal-sdk', version: 'N.N.N'`;

export default function IntroductionChapter() {
  return (
    <Layout
      title="Introduction - Build a Background Check application with Java"
      description="Chapter 1: Learn about the Temporal Java SDK, supported runtimes, and build configuration."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Java", href: "/tutorials/java" },
                  {
                    label: "Background Check",
                    href: "/tutorials/java/background-check/",
                  },
                  { label: "Introduction" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Introduction to the Temporal Java SDK
            </h1>

            <MetaChips items={["~10 minutes", "Beginner", "Java"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Welcome to the Temporal Java SDK Background Check tutorial. The
              Temporal Java SDK Background Check tutorial documents the
              concepts, features, and tools that you'll use to create, test,
              and execute Temporal applications in Java.
            </p>

            <Admonition type="info" title="Temporal Java SDK API reference">
              <p>
                <a
                  href="https://www.javadoc.io/doc/io.temporal/temporal-sdk/latest/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  javadoc.io/doc/io.temporal/temporal-sdk
                </a>
              </p>
              <p>
                Short link:{" "}
                <a
                  href="https://t.mp/java-api"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  t.mp/java-api
                </a>
              </p>
            </Admonition>

            <p>
              The{" "}
              <a
                href="https://github.com/temporalio/sdk-java"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Java SDK
              </a>{" "}
              released on March 28, 2020.
            </p>

            <section className={styles.section} id="supported-runtimes">
              <h2 className={styles.sectionTitle}>Supported runtimes</h2>
              <p>
                Developing applications with the Temporal Java SDK requires
                Java 1.8 or later.
              </p>
            </section>

            <section className={styles.section} id="build-configuration">
              <h2 className={styles.sectionTitle}>Build configuration</h2>
              <p>
                <a
                  href="https://search.maven.org/artifact/io.temporal/temporal-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find the latest release
                </a>{" "}
                of the Temporal Java SDK at Maven Central.
              </p>
              <p>
                Add <code>temporal-sdk</code> as a dependency to your{" "}
                <code>pom.xml</code>:
              </p>
              <CodeBlock language="xml" title="pom.xml">
                {POM_XML}
              </CodeBlock>
              <p>
                Or to <code>build.gradle</code>:
              </p>
              <CodeBlock language="groovy" title="build.gradle">
                {BUILD_GRADLE}
              </CodeBlock>
            </section>

            <section className={styles.section} id="expected-skills">
              <h2 className={styles.sectionTitle}>
                Expected skills and experiences
              </h2>
              <p>
                The Temporal Platform enables developers to build a wide range
                of applications that serve a variety of use cases. The following
                skills will help you succeed with the Java SDK at production
                scale.
              </p>

              <Admonition type="tip" title="Recommended">
                <p>
                  <strong>Core fundamentals:</strong>
                </p>
                <ul>
                  <li>Java syntax and structure</li>
                  <li>Data types</li>
                  <li>Operators</li>
                  <li>Control statements: loops, conditionals</li>
                  <li>Basic Input/Output</li>
                  <li>Understanding of Java Virtual Machine (JVM)</li>
                </ul>
                <p>
                  <strong>Object-oriented programming:</strong>
                </p>
                <ul>
                  <li>Classes and objects</li>
                  <li>Interfaces</li>
                  <li>Inheritance</li>
                  <li>Encapsulation</li>
                  <li>Polymorphism</li>
                </ul>
                <p>
                  <strong>Java language features:</strong>
                </p>
                <ul>
                  <li>Annotations</li>
                  <li>Exception handling</li>
                  <li>Collections Framework</li>
                  <li>Java Stream API</li>
                  <li>Lambdas and functional interfaces</li>
                  <li>Threads and concurrency</li>
                </ul>
              </Admonition>

              <Admonition type="info" title="Nice to have">
                <p>
                  <strong>Tools:</strong> beginner to moderate experience using
                  a Java IDE, such as IntelliJ IDEA or Eclipse.
                </p>
                <p>
                  <strong>Testing:</strong> experience with a testing library
                  and framework such as JUnit or Mockito.
                </p>
                <p>
                  <strong>Code base version control:</strong> experience using
                  a version control system, such as Git.
                </p>
                <p>
                  <strong>Dependency management:</strong> experience using a
                  dependency management system such as Maven or Gradle.
                </p>
                <p>
                  <strong>Listing and sorting:</strong> experience with
                  SQL-like syntax and CRUD operational concepts to make use of
                  Temporal's Visibility tools.
                </p>
                <p>
                  <strong>Security:</strong> to onboard with Temporal Cloud or
                  set up a self-hosted Cluster, you should have some
                  understanding and experience with TLS, security certificates,
                  and private keys.
                </p>
                <p>
                  <strong>Privacy:</strong> for applications that process any
                  amount of user data, you should have some understanding and
                  experience with PII and sensitive information encryption.
                </p>
              </Admonition>

              <Admonition type="caution" title="Complex and large scale use cases">
                <p>
                  For complex and large-scale use cases, at least some
                  experience with the following can be helpful:
                </p>
                <ul>
                  <li>
                    Deeper JVM understanding: memory management, garbage
                    collection, JIT compilation.
                  </li>
                  <li>
                    Design patterns: singleton, factory, strategy, observer.
                  </li>
                  <li>
                    Distributed system architectures: event-driven
                    architectures, stateful vs stateless processes,
                    scalability, fault tolerance.
                  </li>
                </ul>
              </Admonition>
            </section>

            <section className={styles.section} id="additional-resources">
              <h2 className={styles.sectionTitle}>
                Code samples and resources
              </h2>
              <p>Where to find code samples and other resources for the Java SDK:</p>
              <ul>
                <li>Continue reading this tutorial.</li>
                <li>
                  Temporal 101 course in Java -{" "}
                  <a
                    href="https://t.mp/java-101"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    t.mp/java-101
                  </a>
                </li>
                <li>
                  Temporal 102 course in Java -{" "}
                  <a
                    href="https://t.mp/java-102"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    t.mp/java-102
                  </a>
                </li>
                <li>
                  Documentation samples repository -{" "}
                  <a
                    href="https://github.com/temporalio/documentation-samples-java"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    temporalio/documentation-samples-java
                  </a>
                </li>
                <li>
                  Java SDK samples repository -{" "}
                  <a
                    href="https://github.com/temporalio/samples-java"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    temporalio/samples-java
                  </a>
                </li>
                <li>
                  Java SDK workshops -{" "}
                  <a
                    href="https://www.youtube.com/playlist?list=PLl9kRkvFJrlSNuTvL0dl3VE5GEe1HFtjf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    YouTube playlist
                  </a>
                </li>
                <li>
                  Java SDK tutorials -{" "}
                  <Link to="/getting_started/java/">
                    learn.temporal.io/getting_started/java/
                  </Link>
                </li>
              </ul>
              <p>Where to get help with the Java SDK:</p>
              <ul>
                <li>
                  The <code>#java-sdk</code> channel in{" "}
                  <a
                    href="https://t.mp/slack"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Slack
                  </a>
                </li>
                <li>
                  <a
                    href="https://community.temporal.io/tag/java-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Community Forum
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="updates">
              <h2 className={styles.sectionTitle}>Updates</h2>
              <p>How to follow updates to the Java SDK:</p>
              <ul>
                <li>
                  The{" "}
                  <a
                    href="https://t.mp/news"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal newsletter
                  </a>{" "}
                  includes major SDK updates.
                </li>
                <li>
                  <a
                    href="https://github.com/temporalio/sdk-java/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Releases
                  </a>{" "}
                  has all SDK releases. The release feed can be added to a feed
                  reader or{" "}
                  <a
                    href="https://blogtrottr.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    converted to emails
                  </a>
                  :{" "}
                  <code>
                    https://github.com/temporalio/sdk-java/releases.atom
                  </code>
                  .
                </li>
              </ul>
            </section>

            <section className={styles.section} id="contribution">
              <h2 className={styles.sectionTitle}>Contribution</h2>
              <p>
                The Temporal Java SDK is Apache 2.0 licensed, and contributions
                are welcome. Review the{" "}
                <a
                  href="https://github.com/temporalio/sdk-java/blob/master/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  contribution guidelines
                </a>
                .
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/java/background-check/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Series overview
                </span>
                <span className={styles.chapterNavTitle}>
                  Background Check tutorial
                </span>
              </Link>
              <Link
                to="/tutorials/java/background-check/project-setup/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>Project setup</span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
