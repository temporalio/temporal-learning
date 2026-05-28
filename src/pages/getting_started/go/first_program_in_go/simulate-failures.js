// Tutorial chapter 3 of 3: Simulate failures and watch Temporal recover.
// See ./index.js for shared canonical-source notes.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIAL_STEPS = [
  {
    n: 1,
    label: "Understand the application",
    href: "/getting_started/go/first_program_in_go/",
  },
  {
    n: 2,
    label: "Run the application",
    href: "/getting_started/go/first_program_in_go/run/",
  },
  {
    n: 3,
    label: "Simulate failures",
    href: "/getting_started/go/first_program_in_go/simulate-failures/",
  },
];

const TOC_ITEMS = [
  { id: "server-crash", label: "Recover from a server crash" },
  { id: "activity-error", label: "Recover from an Activity error" },
  { id: "conclusion", label: "Conclusion" },
  { id: "further-exploration", label: "Further exploration" },
];

const FAILURE_OUTPUT = `2022/11/14 10:59:09 INFO  Started Worker
2022/11/14 10:59:09 Withdrawing $250 from account 85-150.

2022/11/14 10:59:09 Depositing $250 into account 43-812.

2022/11/14 10:59:09 ERROR Activity error. ActivityType Deposit Attempt 1 Error This deposit has failed.
2022/11/14 10:59:10 Depositing $250 into account 43-812.

2022/11/14 10:59:10 ERROR Activity error. ActivityType Deposit Attempt 2 Error This deposit has failed.
2022/11/14 10:59:12 Depositing $250 into account 43-812.

2022/11/14 10:59:12 ERROR Activity error. ActivityType Deposit Attempt 3 Error This deposit has failed.

...`;

const RECOVERED_OUTPUT = `2022/11/14 11:01:28 INFO  No logger configured for temporal client. Created default one.
2022/11/14 11:01:28 INFO  Started Worker
2022/11/14 11:01:28 Depositing $250 into account 43-812.`;

const FINAL_COMPLETE_OUTPUT = `...

2022/11/14 11:01:28 Transfer complete (transaction IDs: W1779185060, D1779185060)`;

const IMG_BASE = "/img/getting_started/go/first_program_in_go";

export default function Chapter3Page() {
  return (
    <Layout
      title="Simulate failures - Run your first Temporal Go app"
      description="Chapter 3: Watch Temporal preserve Workflow state across server crashes and Activity errors."
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
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Go", href: "/getting_started/go" },
                  {
                    label: "First program",
                    href: "/getting_started/go/first_program_in_go/",
                  },
                  { label: "Simulate failures" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Simulate failures</h1>

            <MetaChips
              items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              Despite your best efforts, there's going to be a time when
              something goes wrong - a network glitch, a server goes offline,
              or you introduce a bug. One of Temporal's most important
              features is its ability to maintain the state of a Workflow when
              something fails. Simulate some failures and see how Temporal
              responds.
            </p>

            <section className={styles.section} id="server-crash">
              <h2 className={styles.sectionTitle}>
                Recover from a server crash
              </h2>
              <p>
                Unlike many modern applications that require complex leader
                election processes and external databases to handle failure,
                Temporal automatically preserves the state of your Workflow
                even if the server is down. You can test this by stopping the
                local Temporal Cluster while a Workflow is running.
              </p>
              <ol>
                <li>
                  Make sure your Worker is stopped before proceeding so your
                  Workflow doesn't finish. Press <code>CTRL+C</code> in the
                  Worker terminal.
                </li>
                <li>
                  Switch back to the terminal where your Workflow ran. Start
                  the Workflow again with <code>go run start/main.go</code>.
                </li>
                <li>Verify the Workflow is running in the UI.</li>
                <li>
                  Shut down the Temporal Server by pressing <code>CTRL+C</code>{" "}
                  in the terminal window running the server.
                </li>
                <li>
                  After the Temporal Cluster has stopped, restart it with the
                  same database file you used previously.
                </li>
              </ol>
              <p>Visit the UI. Your Workflow is still listed:</p>
              <p>
                <img
                  src={`${IMG_BASE}/second_workflow.png`}
                  alt="The second Workflow appears in the list of Workflows"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                If the Temporal Cluster goes offline, you can pick up where
                you left off when it comes back online again.
              </p>
            </section>

            <section className={styles.section} id="activity-error">
              <h2 className={styles.sectionTitle}>
                Recover from an unknown error in an Activity
              </h2>
              <p>
                This demo application makes a call to an external service in
                an Activity. If that call fails due to a bug in your code, the
                Activity produces an error.
              </p>
              <p>
                To test this out, simulate a bug in the <code>Deposit()</code>{" "}
                Activity function. Let your Workflow continue to run but
                don't start the Worker yet.
              </p>
              <p>
                Open the <code>activity.go</code> file and switch out the
                comments on the <code>return</code> statements so that the{" "}
                <code>Deposit()</code> function returns an error. Ensure
                you're calling <code>bank.DepositThatFails</code>.
              </p>
              <p>
                Save your changes and switch to the terminal that was running
                your Worker. Start the Worker again:
              </p>
              <CodeBlock language="bash">go run worker/main.go</CodeBlock>
              <p>
                You will see the Worker complete the <code>Withdraw()</code>{" "}
                Activity function, but it errors when it attempts{" "}
                <code>Deposit()</code>. The important thing to note: the
                Worker keeps retrying:
              </p>
              <CodeBlock>{FAILURE_OUTPUT}</CodeBlock>
              <p>
                The Workflow keeps retrying using the <code>RetryPolicy</code>{" "}
                specified when the Workflow first executes the Activity.
              </p>
              <p>
                View more in the{" "}
                <a
                  href="http://localhost:8080"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Web UI
                </a>
                . Click the Workflow to see the state, the number of attempts,
                and the next scheduled run time:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/activity_failure.png`}
                  alt="The next Activity"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                Your Workflow is running, but only the <code>Withdraw()</code>{" "}
                Activity has succeeded. In any other application, the whole
                process would likely be abandoned and rolled back. With
                Temporal, you can debug and fix the issue while the Workflow
                is running.
              </p>
              <p>
                Pretend that you found a fix. Switch the comments back on the{" "}
                <code>return</code> statements of the <code>Deposit()</code>{" "}
                function in <code>activity.go</code> and save your changes.
              </p>
              <p>
                How can you update a Workflow that's already halfway complete?
                You restart the Worker.
              </p>
              <p>
                First, cancel the currently running worker with{" "}
                <code>CTRL+C</code>. Then restart it:
              </p>
              <CodeBlock language="bash">go run worker/main.go</CodeBlock>
              <p>
                On the next scheduled attempt, the Worker picks up right where
                the Workflow was failing and successfully executes the newly
                compiled <code>Deposit()</code> Activity function:
              </p>
              <CodeBlock>{RECOVERED_OUTPUT}</CodeBlock>
              <p>
                Switch back to the terminal where your{" "}
                <code>start/main.go</code> program is running, and you'll see
                it complete:
              </p>
              <CodeBlock>{FINAL_COMPLETE_OUTPUT}</CodeBlock>
              <p>
                Visit the{" "}
                <a
                  href="http://localhost:8080"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Web UI
                </a>{" "}
                again, and you'll see the Workflow has completed:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/completed_workflows.png`}
                  alt="Both Workflows completed successfully"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                You just fixed a bug in a running application without losing
                the state of the Workflow or restarting the transaction.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You now know how to run a Temporal Workflow and understand
                some of the value Temporal offers. You explored Workflows and
                Activities, you started a Workflow Execution, and you ran a
                Worker to handle that execution. You also saw how Temporal
                recovers from failures and how it retries Activities.
              </p>
            </section>

            <section className={styles.section} id="further-exploration">
              <h2 className={styles.sectionTitle}>Further exploration</h2>
              <p>
                Try the following before moving on:
              </p>
              <ol>
                <li>
                  Verify that the Workflow fails with insufficient funds.
                  Open <code>start/main.go</code> and change the{" "}
                  <code>Amount</code> to <code>1000000</code>. Run{" "}
                  <code>start/main.go</code> and see the <code>Withdraw</code>{" "}
                  Activity fail.
                </li>
                <li>
                  Verify that the Workflow fails with an invalid account
                  number. Open <code>start/main.go</code> and change the{" "}
                  <code>TargetAccount</code> number to an empty string. Run{" "}
                  <code>start/main.go</code> and see the Activity fail and
                  that it puts the money back in the original account.
                </li>
                <li>
                  Change the retry policy in <code>workflow.go</code> so it
                  only retries 3 times. Then change the <code>Deposit</code>{" "}
                  Activity in <code>activities.go</code> so it uses the{" "}
                  <code>DepositThatFails</code> function. Does the Workflow
                  place the money back into the original account?
                </li>
              </ol>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/getting_started/go/hello_world_in_go"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>
                    Build a Temporal app from scratch in Go
                  </h3>
                  <p className={styles.nextBody}>
                    Write your own Workflow and Activities from the ground up,
                    with tests - about 20 minutes.
                  </p>
                  <span className={styles.nextCta}>
                    Build from scratch <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take Temporal 101 with Go</h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks -
                    Workflows and Activities - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>
                    Start Temporal 101 <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/go/first_program_in_go/run/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 2
                </span>
                <span className={styles.chapterNavTitle}>
                  Run the application
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
