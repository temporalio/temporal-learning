// Tutorial chapter 1 of 3: Introduction to the Temporal TypeScript SDK.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIAL_STEPS = [
  { n: 1, label: "Introduction", href: "/tutorials/typescript/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/typescript/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/typescript/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "skills", label: "Useful programming skills" },
  { id: "samples", label: "Where to find code samples" },
  { id: "resources", label: "Other learning resources" },
  { id: "help", label: "Where to get help" },
  { id: "updates", label: "Follow SDK updates" },
  { id: "contribute", label: "Contribute" },
];

export default function IntroductionPage() {
  return (
    <Layout
      title="Introduction - Background Check tutorial with TypeScript"
      description="Learn what the Temporal TypeScript SDK provides and the skills useful for working with it."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  {
                    label: "Background Check",
                    href: "/tutorials/typescript/background-check/",
                  },
                  { label: "Introduction" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Introduction to the Temporal TypeScript SDK
            </h1>

            <MetaChips items={["~10 minutes", "TypeScript", "Beginner"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Welcome to the Temporal TypeScript SDK Background Check tutorial.
              The Temporal TypeScript SDK released on July 26, 2022 and
              provides access to the Temporal programming model using idiomatic
              JavaScript and TypeScript paradigms. The Temporal TypeScript SDK
              supports the Node.js runtime environment.
            </p>

            <Admonition type="info" title="Temporal TypeScript SDK API reference">
              <p>
                <a
                  href="https://typescript.temporal.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  typescript.temporal.io
                </a>
              </p>
            </Admonition>

            <section className={styles.section} id="skills">
              <h2 className={styles.sectionTitle}>
                Useful programming skills and experiences
              </h2>
              <p>
                You can start working with the SDK with only TypeScript
                knowledge. Temporal abstracts much of the complexity of
                distributed systems, but a broad base of knowledge helps you
                design more efficient and resilient systems.
              </p>

              <h3>Core JavaScript or TypeScript knowledge</h3>
              <p>Required:</p>
              <ul>
                <li>
                  JavaScript syntax and structure, including variable
                  declarations using <code>let</code>, <code>const</code>, and{" "}
                  <code>var</code>.
                </li>
                <li>
                  Basic data types, such as <code>number</code>,{" "}
                  <code>string</code>, <code>boolean</code>, <code>null</code>,
                  and <code>undefined</code>.
                </li>
                <li>Operators and control statements.</li>
                <li>Basic input/output (I/O).</li>
                <li>
                  Familiarity with defining classes, constructors, properties,
                  and methods.
                </li>
                <li>
                  Knowledge of how to use <code>import</code> and{" "}
                  <code>export</code> for module-based development.
                </li>
                <li>
                  Familiarity with function declarations, arrow functions, and
                  function types.
                </li>
                <li>
                  Understanding of modern ECMAScript features such as promises
                  and async/await.
                </li>
                <li>
                  Knowledge of how to configure TypeScript projects using{" "}
                  <code>tsconfig.json</code>.
                </li>
              </ul>
              <p>Useful:</p>
              <ul>
                <li>
                  Proficiency in TypeScript, including type annotations,
                  interfaces, and generics.
                </li>
                <li>
                  Familiarity with object-oriented programming concepts like
                  inheritance, encapsulation, and polymorphism.
                </li>
                <li>
                  Understanding of composite types like <code>Array&lt;T&gt;</code>,{" "}
                  <code>Promise&lt;T&gt;</code>, and{" "}
                  <code>{"{ [key: string]: T }"}</code>.
                </li>
                <li>Basic understanding of decorators.</li>
                <li>Familiarity with Node.js, the SDK runtime.</li>
              </ul>

              <h3>Tools</h3>
              <p>Required:</p>
              <ul>
                <li>Package managers, such as npm, pnpm, or yarn.</li>
                <li>
                  An IDE such as Visual Studio Code (VS Code) or WebStorm.
                </li>
              </ul>
              <p>Useful:</p>
              <ul>
                <li>Testing tools, such as Jest or Mocha and Chai.</li>
                <li>
                  Source control systems (such as Git) and source control
                  platforms (such as GitHub, GitLab, or Bitbucket).
                </li>
              </ul>

              <h3>Other useful knowledge</h3>
              <ul>
                <li>
                  Testing and production: unit testing, integration testing,
                  debugging, performance profiling, and CI/CD practices.
                </li>
                <li>
                  Distributed systems: event-driven architecture, eventual
                  consistency, partitioning, replication, and stateful vs
                  stateless processes.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="samples">
              <h2 className={styles.sectionTitle}>Where to find code samples</h2>
              <p>
                Code samples are integrated into this tutorial. You can find
                those code samples in the{" "}
                <a
                  href="https://github.com/temporalio/documentation-samples-typescript"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/documentation-samples-typescript
                </a>{" "}
                repository on GitHub.
              </p>
              <p>
                Additional TypeScript code samples are in the{" "}
                <a
                  href="https://github.com/temporalio/samples-typescript"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/samples-typescript
                </a>{" "}
                repository.
              </p>
            </section>

            <section className={styles.section} id="resources">
              <h2 className={styles.sectionTitle}>Other learning resources</h2>
              <ul>
                <li>
                  <a
                    href="https://t.mp/ts-101"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal 101
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://t.mp/ts-102"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal 102
                  </a>{" "}
                  - free introductory courses.
                </li>
                <li>
                  <a
                    href="https://temporal.io/blog/building-reliable-distributed-systems-in-node"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Building Reliable Distributed Systems in Node.js
                  </a>{" "}
                  - an introduction to Temporal through a sample web app.
                </li>
                <li>
                  The{" "}
                  <a
                    href="https://www.youtube.com/playlist?list=PLl9kRkvFJrlTavecydpk9r6cF7qBmQJvb"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    TypeScript SDK
                  </a>{" "}
                  YouTube playlist.
                </li>
                <li>
                  Tutorials:
                  <ul>
                    <li>
                      <Link to="/tutorials/typescript/recurring-billing-system/">
                        Build a recurring billing subscription system with
                        TypeScript
                      </Link>
                    </li>
                    <li>
                      <Link to="/tutorials/typescript/build-choose-your-own-adventure-bot/">
                        Choose Your Own Adventure Bot walkthrough in TypeScript
                      </Link>
                    </li>
                  </ul>
                </li>
                <li>
                  Blog posts:
                  <ul>
                    <li>
                      <a
                        href="https://temporal.io/blog/building-reliable-distributed-systems-in-node-js-part-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        How Durable Execution Works
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/temporal-for-vs-code"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Temporal for VS Code
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/using-temporal-as-a-node-task-queue"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Using Temporal as a Node.js Task Queue
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/caching-api-requests-with-long-lived-workflows"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Caching API Requests with Long-Lived Workflows
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/temporal-rest"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        REST APIs for every Temporal Workflow in one line of
                        code
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/typescript-1-0-0"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        1.0.0 release of the Temporal TypeScript SDK
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/intro-to-isolated-vm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        How we use V8 isolates to enforce Workflow determinism
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="help">
              <h2 className={styles.sectionTitle}>Where to get help</h2>
              <ul>
                <li>
                  <em>#typescript-sdk</em> channel in{" "}
                  <a
                    href="https://t.mp/slack"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Slack
                  </a>
                  .
                </li>
                <li>
                  <a
                    href="https://community.temporal.io/tag/typescript-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Community Forum
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section className={styles.section} id="updates">
              <h2 className={styles.sectionTitle}>Follow SDK updates</h2>
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
                    href="https://github.com/temporalio/sdk-typescript/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Releases
                  </a>{" "}
                  has all SDK releases. The releases feed can be added to a
                  feed reader or{" "}
                  <a
                    href="https://blogtrottr.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    converted to emails
                  </a>
                  :{" "}
                  <code>
                    https://github.com/temporalio/sdk-typescript/releases.atom
                  </code>
                  .
                </li>
              </ul>
            </section>

            <section className={styles.section} id="contribute">
              <h2 className={styles.sectionTitle}>Contribute to the SDK</h2>
              <p>
                The Temporal TypeScript SDK is MIT licensed, and contributions
                are welcome. Review the{" "}
                <a
                  href="https://github.com/temporalio/sdk-typescript/blob/main/CONTRIBUTING.md"
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
                to="/tutorials/typescript/background-check/"
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
                to="/tutorials/typescript/background-check/project-setup/"
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
