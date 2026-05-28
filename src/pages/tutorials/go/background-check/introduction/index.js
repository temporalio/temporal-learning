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
  { n: 1, label: "Introduction", href: "/tutorials/go/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/go/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/go/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "why-temporal", label: "Why Temporal?" },
  { id: "audience", label: "Audience" },
  { id: "competencies", label: "Competencies" },
  { id: "not-covered", label: "Not covered" },
  { id: "feedback", label: "Feedback" },
];

export default function IntroductionPage() {
  return (
    <Layout
      title="Introduction - Build a Background Check application with Go"
      description="Chapter 1: Learn why Temporal is a good fit for long-running Go applications and what skills help you succeed with the Go SDK."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Go", href: "/tutorials/go" },
                  { label: "Background Check", href: "/tutorials/go/background-check/" },
                  { label: "Introduction" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Introduction to the Temporal Go SDK Background Check tutorial
            </h1>

            <MetaChips items={["~10 minutes", "Beginner", "Go"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Welcome to the Temporal Go SDK Background Check tutorial. This
              chapter sets the stage for the rest of the series: why Temporal
              might be right for you, who this tutorial is for, what skills
              help you succeed, and what you'll be able to do by the end.
            </p>

            <section className={styles.section} id="why-temporal">
              <h2 className={styles.sectionTitle}>Why Temporal?</h2>
              <p>
                <strong>Why should you use Temporal to build applications?</strong>
              </p>
              <p>
                If you are reading this, chances are you already have some
                notion of why you want to use Temporal. However, if you are
                still unsure, there are three major reasons why Temporal might
                be right for you.
              </p>
              <ol>
                <li>
                  <strong>Reliable execution.</strong> With Temporal, you can
                  rely on your application to work. The design of the system
                  ensures that, once started, an application's main function
                  executes to completion, whether that takes minutes, hours,
                  days, weeks, or even years. Temporal calls this "Durable
                  Execution".
                </li>
                <li>
                  <strong>Code structure.</strong> Temporal's programming model
                  offers developers a way to express their business logic into
                  coherent "Workflows" that are much easier to develop than
                  distributed code bases.
                </li>
                <li>
                  <strong>State visibility.</strong> The Temporal system
                  provides out-of-the-box tooling that enables developers to
                  see the state of their applications whenever they need to.
                </li>
              </ol>
            </section>

            <section className={styles.section} id="audience">
              <h2 className={styles.sectionTitle}>Audience</h2>
              <p>
                <strong>Who is this tutorial for?</strong>
              </p>
              <p>
                This tutorial is for any developer who wants to learn how to
                develop Temporal Applications. It assumes that you have some
                experience with the Go programming language and that you, the
                developer, are ready to build an application to learn Temporal.
              </p>
              <p>
                Temporal enables developers to build a wide range of
                applications that serve a variety of use cases. We recommend
                that developers are equipped with some of the following Go
                programming skills and experiences to develop production-level
                Temporal Applications and to generally succeed with the
                Temporal Go SDK.
              </p>

              <Admonition type="tip" title="Recommended">
                <p>
                  <strong>Core fundamentals:</strong>
                </p>
                <ul>
                  <li>Go syntax and structure</li>
                  <li>Variables, Types, and Structures</li>
                  <li>Control flow: loops, conditionals</li>
                  <li>Slices and Maps</li>
                  <li>Basic I/O operations</li>
                </ul>
                <p>
                  <strong>Go-specific principles:</strong>
                </p>
                <ul>
                  <li>Understanding Goroutines and Channels</li>
                  <li>Error handling in Go</li>
                  <li>Go Modules and Dependency Management</li>
                  <li>Pointers in Go</li>
                  <li>Structs, Interfaces, and Embedding</li>
                  <li>Go Testing and Benchmarking</li>
                </ul>
              </Admonition>

              <Admonition type="info" title="Nice to have">
                <p>
                  <strong>Tools.</strong> We recommend that developers have a
                  beginner to moderate level of experience using a Go IDE, or a
                  preferred editor with Go extensions, such as Visual Studio
                  Code with Go extension.
                </p>
                <p>
                  <strong>Testing.</strong> We recommend that developers have
                  some experience with Go's built-in testing framework.
                </p>
                <p>
                  <strong>Code base version control.</strong> We recommend that
                  developers have some experience using a version control
                  system, such as Git.
                </p>
                <p>
                  <strong>Dependency management.</strong> Being familiar with
                  Go modules for dependency management can be beneficial.
                </p>
                <p>
                  <strong>Listing and sorting.</strong> Understanding SQL-like
                  syntax and CRUD operational concepts can help utilize
                  Temporal's Visibility tools.
                </p>
                <p>
                  <strong>Security.</strong> We recommend having some
                  understanding and experience with TLS, security certificates,
                  and private keys for onboarding with Temporal Cloud or
                  setting up a Self-Hosted Cluster.
                </p>
                <p>
                  <strong>Privacy.</strong> We advise having an understanding
                  and experience with PII and sensitive information encryption
                  for applications that handle user data.
                </p>
              </Admonition>

              <Admonition type="caution" title="Complex and large-scale use cases">
                <p>
                  <strong>Large scale use cases.</strong> For intricate and
                  vast use cases, having some experience with the following
                  could be helpful:
                </p>
                <ul>
                  <li>
                    Deeper Go runtime understanding, including:
                    <ul>
                      <li>Go's memory model</li>
                      <li>Go garbage collection</li>
                    </ul>
                  </li>
                  <li>Design Patterns applicable to Go, such as Singletons or Factories.</li>
                  <li>
                    Distributed system architectures:
                    <ul>
                      <li>
                        Event-driven architectures and how events drive
                        processes in the context of Workflows.
                      </li>
                    </ul>
                  </li>
                  <li>The distinctions between stateful vs. stateless processes.</li>
                  <li>Implications of service scalability on performance and reliability.</li>
                  <li>
                    Ensuring fault tolerance and understanding supervisor
                    systems for progress checks and resumptions.
                  </li>
                </ul>
              </Admonition>
            </section>

            <section className={styles.section} id="competencies">
              <h2 className={styles.sectionTitle}>Competencies</h2>
              <p>
                <strong>What does this tutorial cover?</strong>
              </p>
              <p>
                This tutorial contextualizes the concepts, features, and tools
                that developers encounter on their journey through Temporal
                Application development.
              </p>
              <p>
                It provides focused learning through a specific use case and
                relies on a set of sample applications specifically tailored to
                meet the needs of each chapter. Each application is meant to
                capture the iterative steps, showcase best practices, and
                teach core concepts.
              </p>
              <p>
                Essentially, you will iterate on the application in each
                chapter, learning new things as you go.
              </p>
              <p>
                <strong>What will you learn while you build the application?</strong>
              </p>
              <p>
                By building the application, you will attempt to adopt the
                following competencies, where each competency is supported by
                a set of learning objectives:
              </p>
              <ul>
                <li>
                  <strong>Construct a new Temporal Application project.</strong>
                  <ul>
                    <li>Describe the tools available and recommended to develop Workflows.</li>
                    <li>Describe the code that actually constitutes a Temporal application.</li>
                    <li>Implement an appropriate testing framework.</li>
                  </ul>
                </li>
                <li>
                  <strong>Develop applications for Durable Execution.</strong>
                  <ul>
                    <li>Identify SDK API calls that map to Events.</li>
                    <li>Recognize non-deterministic Workflow code.</li>
                    <li>Explain how Workflow code execution progresses.</li>
                  </ul>
                </li>
              </ul>
              <p>
                There is more to learn beyond these competencies. Once you have
                become comfortable with these, you should be able to build
                Temporal Applications for most use cases.
              </p>
            </section>

            <section className={styles.section} id="not-covered">
              <h2 className={styles.sectionTitle}>Not covered</h2>
              <p>
                <strong>What is not covered in this tutorial?</strong>
              </p>
              <p>
                This tutorial does not cover production level aspects of the
                application and its deployment.
              </p>
              <ul>
                <li>
                  <strong>Data encryption:</strong> While a Background Check
                  application is a good example of an application that handles
                  personal identifiable information (PII), this tutorial does
                  not cover that topic.
                </li>
                <li>
                  <strong>Metrics:</strong> Emitting and monitoring metrics is
                  typically an essential aspect of production level
                  deployments. This tutorial does not cover that topic.
                </li>
                <li>
                  <strong>Performance tuning:</strong> Improving the speed at
                  which a Temporal Worker (your bundled application code) is
                  capable of executing the next step in your application
                  becomes essential for scaled out usage. This tutorial does
                  not cover that topic.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="feedback">
              <h2 className={styles.sectionTitle}>Feedback</h2>
              <p>
                <strong>Where can I get help or provide feedback?</strong>
              </p>
              <p>
                There are multiple places you can go to engage with Temporal
                maintainers and the Temporal community to get help or provide
                feedback.
              </p>
              <ul>
                <li>
                  <em>#go-sdk</em> channel in{" "}
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
                    href="https://community.temporal.io/tag/go-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Community Forum
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/temporalio/sdk-go/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go SDK repository
                  </a>
                </li>
              </ul>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/go/background-check/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &larr;
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Background Check series overview
                </span>
              </Link>
              <Link
                to="/tutorials/go/background-check/project-setup/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    &rarr;
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Project setup
                </span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
