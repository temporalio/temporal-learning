// Tutorial chapter 1 of 3: Introduction to the Temporal Python SDK Background Check tutorial.

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
  { n: 1, label: "Introduction", href: "/tutorials/python/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/python/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/python/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "skills", label: "Useful Python skills" },
  { id: "samples", label: "Code samples" },
  { id: "resources", label: "Other learning resources" },
  { id: "python-versions", label: "Supported Python versions" },
  { id: "help", label: "Where to get help" },
  { id: "updates", label: "Following SDK updates" },
];

export default function Chapter1Introduction() {
  return (
    <Layout
      title="Introduction - Temporal Python SDK Background Check tutorial"
      description="Chapter 1: Get oriented with the Temporal Python SDK and the Background Check tutorial."
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
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Python", href: "/tutorials/python" },
                  {
                    label: "Background Check",
                    href: "/tutorials/python/background-check/",
                  },
                  { label: "Introduction" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Introduction to the Temporal Python SDK
            </h1>

            <MetaChips items={["~10 minutes", "Beginner", "Python"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Welcome to the Temporal Python SDK Background Check tutorial.
              This chapter introduces the SDK, the skills that help you get
              the most out of it, and the resources you can lean on while you
              follow the rest of the series.
            </p>

            <Admonition type="info" title="Temporal Python SDK API reference">
              <p>
                <a
                  href="https://python.temporal.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  python.temporal.io
                </a>
              </p>
            </Admonition>

            <p>
              The Temporal Python SDK released on March 18, 2022. The Python
              SDK provides access to the Temporal programming model using
              idiomatic Python programming paradigms.
            </p>

            <section className={styles.section} id="skills">
              <h2 className={styles.sectionTitle}>
                What Python programming skills and experiences are useful when using the Python SDK?
              </h2>
              <p>
                You can start working with the SDK with only Python knowledge.
                Temporal abstracts much of the complexity of distributed
                systems, but to unlock its full potential, having a broad base
                of knowledge will help you design more efficient and resilient
                systems.
              </p>
              <p>
                We recommend that developers have at least a moderate level of
                experience in the following skills to develop production-level
                Temporal Applications:
              </p>

              <h3>Basic knowledge</h3>
              <ul>
                <li>Python syntax and structure</li>
                <li>Data types</li>
                <li>Control statements (loops, conditionals)</li>
                <li>Functions</li>
                <li>Decorators</li>
                <li>
                  <a
                    href="https://docs.python.org/3/library/dataclasses.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Data classes
                  </a>
                </li>
              </ul>

              <h3>Development environment</h3>
              <ul>
                <li>
                  IDE like{" "}
                  <a
                    href="https://www.jetbrains.com/pycharm/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PyCharm
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://code.visualstudio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    VSCode
                  </a>
                </li>
                <li>
                  <a
                    href="https://git-scm.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Git
                  </a>{" "}
                  for version control
                </li>
                <li>
                  <a
                    href="https://pip.pypa.io/en/stable/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pip
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://python-poetry.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Poetry
                  </a>{" "}
                  for package management
                </li>
              </ul>

              <h3>Object-oriented programming</h3>
              <ul>
                <li>Classes and objects</li>
                <li>Inheritance</li>
                <li>Encapsulation</li>
              </ul>

              <p>
                For complex and large-scale use cases, having some experience
                with the following could be helpful:
              </p>

              <h3>Advanced language features</h3>
              <ul>
                <li>
                  <a
                    href="https://docs.python.org/3/library/asyncio.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Asyncio
                  </a>{" "}
                  and a custom <code>asyncio</code> event loop
                </li>
                <li>Exception handling</li>
                <li>List comprehensions</li>
                <li>
                  Type safety (with{" "}
                  <a
                    href="https://peps.python.org/pep-0484/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    type hints
                  </a>{" "}
                  or{" "}
                  <a
                    href="https://peps.python.org/pep-3107/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    annotations
                  </a>
                  )
                </li>
                <li>Threads and concurrency</li>
              </ul>

              <h3>Asynchronous programming</h3>
              <ul>
                <li>
                  <a
                    href="https://docs.python.org/3/library/asyncio-task.html#shielding-from-cancellation"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Shielding from cancellation
                  </a>
                </li>
                <li>
                  Different Activity types:
                  <ul>
                    <li>
                      <a
                        href="https://docs.python.org/3/library/asyncio-eventloop.html#asyncio.loop.run_in_executor"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Run in executor
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://docs.python.org/3/library/concurrent.futures.html#threadpoolexecutor"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ThreadPoolExecutor
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://docs.python.org/3/library/concurrent.futures.html#processpoolexecutor"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ProcessPoolExecutor
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>

              <h3>Testing and debugging</h3>
              <ul>
                <li>
                  <a
                    href="https://pytest.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pytest
                  </a>{" "}
                  or other testing frameworks
                </li>
                <li>Temporal test server</li>
                <li>Basic profiling and debugging</li>
                <li>
                  <a
                    href="https://mypy.readthedocs.io/en/stable/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    MyPy
                  </a>{" "}
                  or other type checkers
                </li>
              </ul>

              <h3>Design patterns</h3>
              <ul>
                <li>Dependency injection</li>
                <li>Sagas</li>
              </ul>

              <h3>Databases</h3>
              <ul>
                <li>Familiarity with SQL or NoSQL databases</li>
                <li>Database connection and queries in Python</li>
              </ul>

              <h3>Software architecture and design</h3>
              <ul>
                <li>Software system design and architecture</li>
                <li>
                  Distributed systems and scalability
                  <ul>
                    <li>Event-driven architectures</li>
                    <li>Stateful vs stateless processes</li>
                    <li>Scalability implications</li>
                    <li>Fault tolerance</li>
                  </ul>
                </li>
              </ul>

              <h3>Security</h3>
              <ul>
                <li>Handling PII and sensitive information</li>
                <li>Encryption and secure coding practices</li>
              </ul>
            </section>

            <section className={styles.section} id="samples">
              <h2 className={styles.sectionTitle}>
                Where can I find code samples?
              </h2>
              <p>
                Code samples are integrated into this tutorial. You can find
                those code samples in the{" "}
                <a
                  href="https://github.com/temporalio/documentation-samples-python"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/documentation-samples-python
                </a>{" "}
                repository on GitHub.
              </p>
              <p>
                Additional Python code samples are in the{" "}
                <a
                  href="https://github.com/temporalio/samples-python"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/samples-python
                </a>{" "}
                repository on GitHub.
              </p>
            </section>

            <section className={styles.section} id="resources">
              <h2 className={styles.sectionTitle}>
                What are other resources for learning how to use the Python SDK?
              </h2>
              <ul>
                <li>
                  <a
                    href="https://learn.temporal.io/courses/temporal_101/python"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal 101 with Python
                  </a>
                </li>
                <li>
                  <Link to="/tutorials/python/">Python tutorials</Link>
                  <ul>
                    <li>
                      <Link to="/tutorials/python/build-a-data-pipeline/">
                        Build a data pipeline Workflow with Temporal and Python
                      </Link>
                    </li>
                    <li>
                      <Link to="/tutorials/python/build-an-email-drip-campaign/">
                        Build an email drip campaign with Python
                      </Link>
                    </li>
                  </ul>
                </li>
                <li>
                  Blog posts
                  <ul>
                    <li>
                      <a
                        href="https://temporal.io/blog/temporal-101-learn-temporal-with-python"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Temporal 101: Learn Temporal with Python
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/durable-distributed-asyncio-event-loop"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Temporal Python 1.0.0 - A Durable, Distributed Asyncio Event Loop
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.io/blog/python-sdk-your-first-application"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Python SDK: Your first Application
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="python-versions">
              <h2 className={styles.sectionTitle}>
                What are the supported Python versions?
              </h2>
              <ul>
                <li>Temporal Python SDK 1.4 supports Python versions 3.7 to 3.11.</li>
                <li>Temporal Python SDK 1.5 and later versions support Python 3.8 and above.</li>
              </ul>
            </section>

            <section className={styles.section} id="help">
              <h2 className={styles.sectionTitle}>
                Where can I get help with using the Python SDK?
              </h2>
              <ul>
                <li>
                  <em>#python-sdk</em> channel in{" "}
                  <a
                    href="https://t.mp/slack"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal Slack
                  </a>
                </li>
                <li>
                  <a
                    href="https://community.temporal.io/tag/python-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Community Forum
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="updates">
              <h2 className={styles.sectionTitle}>
                How to follow updates to the Python SDK
              </h2>
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
                    href="https://github.com/temporalio/sdk-python/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Releases
                  </a>{" "}
                  has all SDK releases. It also has a feed that can be added
                  to a feed reader or{" "}
                  <a
                    href="https://blogtrottr.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    converted to emails
                  </a>
                  : <code>https://github.com/temporalio/sdk-python/releases.atom</code>.
                </li>
              </ul>

              <h3>How to contribute to the Python SDK</h3>
              <p>
                The Temporal Python SDK is MIT licensed, and contributions are
                welcome. Please review the{" "}
                <a
                  href="https://github.com/temporalio/sdk-python#development"
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
                to="/tutorials/python/background-check/"
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
                to="/tutorials/python/background-check/project-setup/"
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
