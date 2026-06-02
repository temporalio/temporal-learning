// Tutorial chapter 3 of 3: Simulate failures with the TypeScript SDK.

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
  { n: 1, label: "Understand the application", href: "/getting_started/typescript/first_program_in_typescript/" },
  { n: 2, label: "Run the application", href: "/getting_started/typescript/first_program_in_typescript/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/typescript/first_program_in_typescript/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "server-crash", label: "Recover from a server crash" },
  { id: "activity-error", label: "Recover from an Activity error" },
  { id: "conclusion", label: "Conclusion" },
  { id: "further-exploration", label: "Further exploration" },
];

const FAILURE_OUTPUT = `2023-10-11T19:03:25.778Z [INFO] Worker state changed { state: 'RUNNING' }
Withdrawing $400 from account 85-150.

Depositing $400 into account 43-812.

2023-10-11T19:03:29.445Z [WARN] Activity failed {
  attempt: 1,
  activityType: 'deposit',
  taskQueue: 'money-transfer',
  error: Error: This deposit has failed
}
Depositing $400 into account 43-812.

2023-10-11T19:03:30.455Z [WARN] Activity failed {
  attempt: 2,
  activityType: 'deposit',
  error: Error: This deposit has failed
}

...`;

const RECOVERED_OUTPUT = `2023-10-11T19:17:18.918Z [INFO] Worker state changed { state: 'RUNNING' }
Depositing $400 into account 43-812.`;

const FINAL_COMPLETE = `...

Transfer complete (transaction IDs: W3436600150, D9270097234)`;

const IMG_BASE = "/img/getting_started/typescript/first_program_in_typescript";

export default function Chapter3Page() {
  return (
    <Layout
      title="Simulate failures - Run your first Temporal TypeScript app"
      description="Chapter 3: Watch Temporal preserve Workflow state across server crashes and Activity errors."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_typescript.png" alt="Temporal TypeScript SDK" className={styles.heroBannerImg} />
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
                  { label: "TypeScript", href: "/getting_started/typescript" },
                  { label: "First program", href: "/getting_started/typescript/first_program_in_typescript/" },
                  { label: "Simulate failures" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Simulate failures</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              Despite your best efforts, sometimes things go wrong. One of Temporal's most important features is its
              ability to maintain Workflow state when something fails. Simulate some failures and see how Temporal
              responds.
            </p>

            <section className={styles.section} id="server-crash">
              <h2 className={styles.sectionTitle}>Recover from a server crash</h2>
              <p>
                Unlike many modern applications, Temporal automatically preserves the state of your Workflow even if
                the server is down.
              </p>
              <ol>
                <li>Make sure your Worker is stopped. Press <code>CTRL+C</code> in the Worker terminal.</li>
                <li>Switch to the terminal where your Workflow ran. Start the Workflow again with <code>npm run client</code>.</li>
                <li>Verify the Workflow is running in the UI.</li>
                <li>Shut down the Temporal Server with <code>CTRL+C</code>.</li>
                <li>After it stops, restart it with the same database file you used before.</li>
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
                To test this out, simulate a bug in the <code>deposit</code> Activity function. Let your Workflow
                continue to run but don't start the Worker yet.
              </p>
              <p>
                Open <code>activities.ts</code> and switch out the comments on the return statements so the{" "}
                <code>deposit</code> function calls <code>bank2.depositThatFails</code>.
              </p>
              <p>Save your changes and start the Worker again:</p>
              <CodeBlock language="bash">npm run worker</CodeBlock>
              <p>
                You'll see the Worker complete <code>withdraw</code> but error on <code>deposit</code> - and keep
                retrying:
              </p>
              <CodeBlock>{FAILURE_OUTPUT}</CodeBlock>
              <p>
                View more in the <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Web UI</a>:
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
                Your Workflow is running, but only <code>withdraw</code> has succeeded. With Temporal, you can debug
                and fix the issue while the Workflow is running.
              </p>
              <p>
                Pretend that you found a fix. Switch the comments back on the <code>deposit</code> return statements
                and save.
              </p>
              <p>Cancel the Worker with <code>CTRL+C</code>, then restart:</p>
              <CodeBlock language="bash">npm run worker</CodeBlock>
              <p>The Worker picks up right where the Workflow was failing:</p>
              <CodeBlock>{RECOVERED_OUTPUT}</CodeBlock>
              <p>Switch back to where <code>npm run client</code> was running:</p>
              <CodeBlock>{FINAL_COMPLETE}</CodeBlock>
              <p>
                Visit the <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Web UI</a>{" "}
                again and you'll see the Workflow has completed:
              </p>
              <p>
                <img src={`${IMG_BASE}/completed_workflows.png`} alt="Both Workflows completed" className={styles.diagramImage} />
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
            </section>

            <section className={styles.section} id="further-exploration">
              <h2 className={styles.sectionTitle}>Further exploration</h2>
              <ol>
                <li>Change the <code>Amount</code> to <code>1000000</code> in <code>client.ts</code>. Run <code>npm run client</code> and see the <code>withdraw</code> Activity fail.</li>
                <li>Change the <code>targetAccount</code> to an empty string. See the Activity fail and the money go back to the original account.</li>
                <li>Change the retry policy in <code>workflows.ts</code> so it only retries 3 times. Does the Workflow place the money back into the original account?</li>
              </ol>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/getting_started/typescript/hello_world_in_typescript" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Build a Temporal app from scratch in TypeScript</h3>
                  <p className={styles.nextBody}>
                    Write your own Workflow and Activities from the ground up - about 20 minutes.
                  </p>
                  <span className={styles.nextCta}>Build from scratch <span aria-hidden="true">→</span></span>
                </Link>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take Temporal 101 with TypeScript</h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>Start Temporal 101 <span aria-hidden="true">→</span></span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/typescript/first_program_in_typescript/run/" className={styles.chapterNavCard}>
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
