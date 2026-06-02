// Single-page tutorial: Build a Choose Your Own Adventure Bot in TypeScript.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "project-requirements", label: "Project Requirements" },
  { id: "overview", label: "Overview" },
];

export default function ChooseYourOwnAdventureBotPage() {
  return (
    <Layout
      title="Build a Choose Your Own Adventure Bot in TypeScript"
      description="Integrate all the knowledge from Core and Production APIs into an end-to-end demo application - a Choose Your Own Adventure game."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  { label: "Choose Your Own Adventure Bot" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Choose Your Own Adventure Bot in TypeScript
            </h1>

            <MetaChips items={["~45 minutes", "TypeScript", "Beginner"]} />

            <Admonition type="warning" title="Outdated">
              <p>
                This tutorial may reference older versions of the SDK or
                supporting tools.
              </p>
            </Admonition>

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                In this tutorial, you'll integrate all the knowledge gained
                from Core and Logging APIs in an end-to-end demo application
                - a Choose Your Own Adventure game that you can play on
                Discord or Slack.
              </p>
              <p>
                This project integrates and gives context to your
                understanding of{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/typescript/foundations//#develop-workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal SDK APIs
                </a>
                : logging with Sinks, Activity dependency injection, Timer
                and <code>Promise.race</code> design patterns, Signals (and
                HTTP Servers for them), Polling patterns, and{" "}
                <code>continueAsNew</code> for indefinitely long running
                Workflows.
              </p>

              <Admonition type="tip" title="Skip ahead">
                <p>
                  View the completed project on GitHub:{" "}
                  <a
                    href="https://github.com/JoshuaKGoldberg/temporal-adventure-bot"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://github.com/JoshuaKGoldberg/temporal-adventure-bot
                  </a>
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  <Link to="/getting_started/typescript/dev_environment/">
                    Set up a local development environment for developing
                    Temporal applications using TypeScript
                  </Link>
                  .
                </li>
                <li>
                  Review the{" "}
                  <Link to="/getting_started/typescript/first_program_in_typescript/">
                    Run your first Temporal application with the TypeScript
                    SDK tutorial
                  </Link>{" "}
                  to understand the basics.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="project-requirements">
              <h2 className={styles.sectionTitle}>Project Requirements</h2>
              <ul>
                <li>
                  On <code>/instructions</code>, posts instructions to
                  Slack/Discord and pins the message.
                </li>
                <li>
                  Continuously runs the game until it reaches an end state:
                  <ul>
                    <li>Every day, post the current entry as a poll.</li>
                    <li>
                      Wait until the earlier of:
                      <ul>
                        <li>
                          Every day, check the poll results
                          <ul>
                            <li>If there is consensus, determine next state.</li>
                            <li>If no consensus, remind people to vote.</li>
                          </ul>
                        </li>
                        <li>
                          Allow an admin to <code>/force</code> a choice at
                          any time.
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>Report important game updates to a specified logger.</li>
              </ul>

              <p>
                Companion video walkthrough:{" "}
                <a
                  href="https://www.youtube.com/watch?v=hGIhc6m2keQ"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </a>
                .
              </p>
              <ul>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=0s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    00:00
                  </a>{" "}
                  Project Intro and Demo
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=210s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    03:30
                  </a>{" "}
                  Temporal Worker - Activity Dependency Injection
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=420s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    07:00
                  </a>{" "}
                  Temporal Sinks for Logging
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=480s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    08:00
                  </a>{" "}
                  Temporal Client
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=650s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    10:50
                  </a>{" "}
                  RunGame Workflow and Game Logic
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=825s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    13:45
                  </a>{" "}
                  Async Race Design Pattern: Timers vs Humans
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=900s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    15:00
                  </a>{" "}
                  Design Pattern: Polling
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=1085s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    18:05
                  </a>{" "}
                  Signals
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=1200s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    20:00
                  </a>{" "}
                  HTTP Server for Signal
                </li>
                <li>
                  <a
                    href="https://youtube.com/watch?v=hGIhc6m2keQ&t=1380s"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    23:00
                  </a>{" "}
                  ContinueAsNew
                </li>
              </ul>
            </section>

            <section className={styles.section} id="overview">
              <h2 className={styles.sectionTitle}>Overview</h2>

              <h3>Worker</h3>
              <p>
                The Temporal Worker is set up in <code>src/worker.ts</code>.
                It uses two common Temporal patterns:
              </p>
              <ul>
                <li>
                  <strong>Dependency Injection</strong>: using the
                  integration object created by <code>createIntegration</code>{" "}
                  to provide APIs for the social platform being targeted
                  (Discord or Slack).
                </li>
                <li>
                  <strong>Logging Sinks</strong>: providing a{" "}
                  <code>logger.sink</code> method for the Workflows to log
                  out to <code>console.log</code>.
                </li>
              </ul>

              <h3>Client</h3>
              <p>
                The client in <code>src/client.ts</code> will ask Temporal
                to run two different Workflows:
              </p>
              <ol>
                <li>
                  <strong>instructions</strong>: Posts instructions to the
                  social platform and pins the message.
                </li>
                <li>
                  <strong>runGame</strong>: Continuously runs the game state
                  until the game is finished.
                </li>
              </ol>

              <h3>runGame</h3>
              <p>Each iteration of the game (daily), <code>runGame</code> goes through these steps:</p>
              <ol>
                <li>If the entry has no options, the game is over.</li>
                <li>Post the current entry as a poll.</li>
                <li>
                  Check and remind people to vote once a day until either:
                  <ul>
                    <li>a choice is made by consensus.</li>
                    <li>an admin forces a choice.</li>
                  </ul>
                </li>
                <li>If the choice was forced by an admin, mention that.</li>
                <li>Continue with that chosen next step in the game.</li>
              </ol>

              <h3>Platforms</h3>
              <p>
                The <code>platformFactory</code> function used in both
                workers and Workflows reads from <code>process.env</code>{" "}
                to return the <code>createIntegration</code> and{" "}
                <code>createServer</code> methods for the social platform
                being targeted.
              </p>

              <h3>Integrations</h3>
              <p>
                <code>createIntegration</code> creates the client API used
                to send messages to the social platform. For example, the
                Slack integration uses the{" "}
                <a
                  href="https://slack.dev/bolt-js"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Slack Bolt SDK
                </a>
                .
              </p>

              <h3>Servers</h3>
              <p>
                <code>createServer</code> creates the (generally Express)
                server that runs locally and receives webhook events from
                the social platform. Both the Discord and Slack servers use
                Ngrok to expose a local port on the public web, so that a{" "}
                <code>/force</code> command configured on the platform can
                Signal to the Workflow.
              </p>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
