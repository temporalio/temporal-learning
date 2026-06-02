// Tutorial chapter 3 of 3: Simulate failures with the Java SDK.

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
  { n: 1, label: "Understand the application", href: "/getting_started/java/first_program_in_java/" },
  { n: 2, label: "Run the application", href: "/getting_started/java/first_program_in_java/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/java/first_program_in_java/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "server-crash", label: "Recover from a server crash" },
  { id: "activity-error", label: "Recover from an Activity error" },
  { id: "conclusion", label: "Conclusion" },
  { id: "further-exploration", label: "Further exploration" },
];

const FAILURE_OUTPUT = `Withdrawing $32 from account 612849675.
[ReferenceId: d3d9bcf0-a897-4326]
Deposit failed
Deposit failed
Deposit failed
Deposit failed`;

const RECOVERED_OUTPUT = `Depositing $32 into account 872878204.
[ReferenceId: d3d9bcf0-a897-4326]
[d3d9bcf0-a897-4326] Transaction succeeded.`;

const RESTART_WORKER = `mvn clean install \\
    -Dorg.slf4j.simpleLogger.defaultLogLevel=info 2>/dev/null
mvn compile exec:java \\
    -Dexec.mainClass="moneytransferapp.MoneyTransferWorker" \\
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn`;

const IMG_BASE = "/img/getting_started/java/first_program_in_java";

export default function Chapter3Page() {
  return (
    <Layout
      title="Simulate failures - Run your first Temporal Java app"
      description="Chapter 3: Watch Temporal preserve Workflow state across server crashes and Activity errors."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_java.png" alt="Temporal Java SDK" className={styles.heroBannerImg} />
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
                  { label: "First program", href: "/getting_started/java/first_program_in_java/" },
                  { label: "Simulate failures" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Simulate failures</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              Despite your best efforts, sometimes things go wrong - a network glitch, a server going offline, or a
              new bug in your code. One of Temporal's most important features is its ability to maintain Workflow
              state when something fails. Simulate some failures and see how Temporal responds.
            </p>

            <section className={styles.section} id="server-crash">
              <h2 className={styles.sectionTitle}>Recover from a server crash</h2>
              <p>
                Unlike many modern applications that require complex processes and external databases to handle
                failure, Temporal automatically preserves the state of your Workflow even if the server is down.
              </p>
              <ol>
                <li>Make sure your Worker is stopped before proceeding. Press <code>CTRL+C</code> in the Worker terminal.</li>
                <li>Verify the Workflow is running in the <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Web UI</a>. If finished, restart it with the Maven command.</li>
                <li>Shut down the Temporal Server with <code>CTRL+C</code> in the server terminal.</li>
                <li>After it stops, restart it with <code>temporal server start-dev</code> and reload the UI.</li>
              </ol>
              <p>Your Workflow is still listed and running:</p>
              <p>
                <img src={`${IMG_BASE}/still-running.png`} alt="The Workflow still appears in the list" className={styles.diagramImage} />
              </p>
              <p>If the Temporal Cluster goes offline, you can pick up where you left off when it comes back online.</p>
            </section>

            <section className={styles.section} id="activity-error">
              <h2 className={styles.sectionTitle}>Recover from an unknown error in an Activity</h2>
              <p>
                This demo application makes a call to an external service in an Activity. If that call fails due to a
                bug in your code, the Activity produces an error.
              </p>
              <p>
                To test this out, simulate a bug in the <code>deposit</code> Activity method:
              </p>
              <ol>
                <li>Stop the Worker by pressing <code>CTRL+C</code> in its terminal.</li>
                <li>Open <code>AccountActivityImpl</code> and modify the <code>deposit</code> method so <code>activityShouldSucceed</code> is set to <code>false</code>.</li>
                <li>Save your changes and switch back to the Worker terminal.</li>
                <li>Verify the Workflow is running in the Web UI. If finished, restart it with the Maven command.</li>
                <li>Start the Worker again:</li>
              </ol>
              <CodeBlock language="bash">{RESTART_WORKER}</CodeBlock>
              <p>
                Note that you must restart the Worker every time the code changes. You'll see the Worker complete the{" "}
                <code>withdraw</code> Activity but error on <code>deposit</code> - and keep retrying:
              </p>
              <CodeBlock>{FAILURE_OUTPUT}</CodeBlock>
              <p>
                The Workflow keeps retrying using the <code>RetryPolicy</code> defined earlier. View progress in the{" "}
                <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Web UI</a>:
              </p>
              <Admonition type="note">
                <p>
                  Traditionally, you'd implement timeout and retry logic in your service code itself - repetitive and
                  error-prone. With Temporal, you specify timeout configurations in the Workflow code as Activity
                  options.
                </p>
              </Admonition>
              <p>
                Your Workflow is running, but only the <code>withdraw</code> Activity has succeeded. In any other
                application, the whole process would be abandoned and rolled back. With Temporal, you can debug and
                resolve the issue while the Workflow is running.
              </p>
              <p>
                Pretend that you found a fix. Switch <code>activityShouldSucceed</code> back to <code>true</code>{" "}
                and save your changes.
              </p>
              <p>
                How can you update a Workflow that's already halfway complete? You restart the Worker. Cancel the
                Worker with <code>CTRL+C</code>, then restart it:
              </p>
              <CodeBlock language="bash">{RESTART_WORKER}</CodeBlock>
              <p>
                On the next scheduled attempt, the Worker picks up right where the Workflow was failing and
                successfully executes the newly compiled <code>deposit</code> Activity:
              </p>
              <CodeBlock>{RECOVERED_OUTPUT}</CodeBlock>
              <p>
                Visit the{" "}
                <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Web UI</a>{" "}
                again and you'll see the Workflow has completed.
              </p>
              <p>
                You have just fixed a bug in a running application without losing the state of the Workflow or
                restarting the transaction.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You now know how to run a Temporal Workflow and understand some of the value Temporal offers. You
                explored Workflows and Activities, you started a Workflow Execution, and you ran a Worker. You also
                saw how Temporal recovers from failures and retries Activities.
              </p>
              <p>Key advantages Temporal offers:</p>
              <ol>
                <li>Temporal gives you <strong>full visibility</strong> in the state of your Workflow and code execution.</li>
                <li>Temporal <strong>maintains the state</strong> of your Workflow, even through server outages and errors.</li>
                <li>Temporal lets you <strong>time out and retry Activity code</strong> using options that exist outside your business logic.</li>
                <li>Temporal enables you to <strong>perform "live debugging"</strong> of your business logic while the Workflow is running.</li>
              </ol>
            </section>

            <section className={styles.section} id="further-exploration">
              <h2 className={styles.sectionTitle}>Further exploration</h2>
              <p>Try the following before moving on:</p>
              <ul>
                <li>Change the Retry Policy so it only retries 1 time. Does the Workflow place the money back into the original account?</li>
              </ul>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/getting_started/java/hello_world_in_java" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Build a Temporal app from scratch in Java</h3>
                  <p className={styles.nextBody}>
                    Write your own Workflow and Activities from the ground up, with tests - about 20 minutes.
                  </p>
                  <span className={styles.nextCta}>Build from scratch <span aria-hidden="true">→</span></span>
                </Link>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take Temporal 101 with Java</h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks - Workflows and Activities - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>Start Temporal 101 <span aria-hidden="true">→</span></span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/java/first_program_in_java/run/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous: chapter 2
                </span>
                <span className={styles.chapterNavTitle}>Run the application</span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
