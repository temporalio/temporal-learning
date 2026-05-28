// Tutorial chapter 3 of 3: Simulate failures with the Python SDK.

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
  { n: 1, label: "Understand the application", href: "/getting_started/python/first_program_in_python/" },
  { n: 2, label: "Run the application", href: "/getting_started/python/first_program_in_python/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/python/first_program_in_python/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "server-crash", label: "Recover from a server crash" },
  { id: "activity-error", label: "Recover from an Activity error" },
  { id: "conclusion", label: "Conclusion" },
  { id: "further-exploration", label: "Further exploration" },
];

const FAILURE_OUTPUT = `2024/02/12 10:59:09 INFO  Started Worker
2024/02/12 10:59:09 Withdrawing $250 from account 85-150.

2024/02/12 10:59:09 Depositing $250 into account 43-812.

2024/02/12 10:59:09 ERROR Activity error. ActivityType Deposit Attempt 1 Error This deposit has failed.
2024/02/12 10:59:10 Depositing $250 into account 43-812.

2024/02/12 10:59:10 ERROR Activity error. ActivityType Deposit Attempt 2 Error This deposit has failed.
2024/02/12 10:59:12 Depositing $250 into account 43-812.

2024/02/12 10:59:12 ERROR Activity error. ActivityType Deposit Attempt 3 Error This deposit has failed.

...`;

const FINAL_OUTPUT = `Transfer complete.
Withdraw: {'amount': 250, 'receiver': '43-812', 'reference_id': '1f35f7c6-4376-4fb8-881a-569dfd64d472', 'sender': '85-150'}
Deposit: {'amount': 250, 'receiver': '43-812', 'reference_id': '1f35f7c6-4376-4fb8-881a-569dfd64d472', 'sender': '85-150'}`;

const IMG_BASE = "/img/getting_started/python/first_program_in_python";

export default function Chapter3Page() {
  return (
    <Layout
      title="Simulate failures - Run your first Temporal Python app"
      description="Chapter 3: Watch Temporal preserve Workflow state across server crashes and Activity errors."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_python.png" alt="Temporal Python SDK" className={styles.heroBannerImg} />
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
                  { label: "Python", href: "/getting_started/python" },
                  { label: "First program", href: "/getting_started/python/first_program_in_python/" },
                  { label: "Simulate failures" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Simulate failures</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              Despite your best efforts, sometimes things go wrong - a network glitch, a server going offline, or a
              new bug. One of Temporal's most important features is its ability to maintain Workflow state when
              something fails. Simulate some failures and see how Temporal responds.
            </p>

            <section className={styles.section} id="server-crash">
              <h2 className={styles.sectionTitle}>Recover from a server crash</h2>
              <p>
                Unlike many modern applications that require complex processes and external databases to handle
                failure, Temporal automatically preserves the state of your Workflow even if the server is down.
              </p>
              <ol>
                <li>Make sure your Worker is stopped. Press <code>CTRL+C</code> in the Worker terminal.</li>
                <li>Switch back to the terminal where your Workflow ran. Start the Workflow again with <code>python run_workflow.py</code>.</li>
                <li>Verify the Workflow is running in the UI.</li>
                <li>Shut down the Temporal Server by pressing <code>CTRL+C</code> in the server terminal.</li>
                <li>After the Cluster has stopped, restart it and reload the UI.</li>
              </ol>
              <p>Your Workflow is still listed:</p>
              <p>
                <img src={`${IMG_BASE}/second_workflow.png`} alt="The Workflow appears in the list" className={styles.diagramImage} />
              </p>
              <p>If the Temporal Cluster goes offline, you can pick up where you left off when it comes back online.</p>
            </section>

            <section className={styles.section} id="activity-error">
              <h2 className={styles.sectionTitle}>Recover from an unknown error in an Activity</h2>
              <p>
                This demo makes a call to an external service in an Activity. If that call fails due to a bug, the
                Activity produces an error.
              </p>
              <p>
                To test this out, simulate a bug in the <code>deposit()</code> Activity method. Let your Workflow
                continue to run but don't start the Worker yet.
              </p>
              <ol>
                <li>Open the <code>activities.py</code> file and switch out the comments on the <code>return</code> statements so that the <code>deposit()</code> method calls <code>self.bank.deposit_that_fails</code>.</li>
                <li>Save your changes and switch to the Worker terminal.</li>
                <li>Start the Worker again:</li>
              </ol>
              <CodeBlock language="bash">python run_worker.py</CodeBlock>
              <p>
                You'll see the Worker complete <code>withdraw()</code> but error on <code>deposit()</code> - and keep retrying:
              </p>
              <CodeBlock>{FAILURE_OUTPUT}</CodeBlock>
              <p>The Workflow keeps retrying using the <code>RetryPolicy</code> defined earlier.</p>
              <p>
                View more in the <a href="http://localhost:8233" target="_blank" rel="noopener noreferrer">Web UI</a>:
              </p>
              <p>
                <img src={`${IMG_BASE}/activity_failure.png`} alt="The next Activity" className={styles.diagramImage} />
              </p>
              <Admonition type="note">
                <p>
                  Traditionally, you'd implement timeout and retry logic in your service code itself. With Temporal,
                  you specify timeout configurations in the Workflow code as Activity options.
                </p>
              </Admonition>
              <p>
                Your Workflow is running, but only <code>withdraw()</code> has succeeded. In any other application,
                the whole process would be abandoned. With Temporal, you can debug and fix the issue while the
                Workflow is running.
              </p>
              <p>
                Pretend that you found a fix. Switch the comments back on the <code>return</code> statements of the{" "}
                <code>deposit()</code> method and save your changes.
              </p>
              <p>To restart the Worker, cancel it with <code>CTRL+C</code>, then restart:</p>
              <CodeBlock language="bash">python run_worker.py</CodeBlock>
              <p>
                On the next scheduled attempt, the Worker picks up right where the Workflow was failing and executes
                the fixed <code>deposit()</code> Activity:
              </p>
              <CodeBlock>{FINAL_OUTPUT}</CodeBlock>
              <p>
                Visit the <a href="http://localhost:8233" target="_blank" rel="noopener noreferrer">Web UI</a>{" "}
                again and you'll see the Workflow has completed:
              </p>
              <p>
                <img src={`${IMG_BASE}/completed_workflows.png`} alt="Both Workflows completed successfully" className={styles.diagramImage} />
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
                <li>Change the Retry Policy in <code>workflows.py</code> so it only retries 1 time. Then change the <code>deposit()</code> Activity in <code>activities.py</code> so it uses the <code>refund()</code> method. Does the Workflow place the money back into the original account?</li>
              </ul>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/getting_started/python/hello_world_in_python" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Build a Temporal app from scratch in Python</h3>
                  <p className={styles.nextBody}>
                    Write your own Workflow and Activities from the ground up - about 20 minutes.
                  </p>
                  <span className={styles.nextCta}>Build from scratch <span aria-hidden="true">→</span></span>
                </Link>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take Temporal 101 with Python</h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>Start Temporal 101 <span aria-hidden="true">→</span></span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/python/first_program_in_python/run/" className={styles.chapterNavCard}>
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
