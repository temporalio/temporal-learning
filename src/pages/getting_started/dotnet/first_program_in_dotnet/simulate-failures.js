// Tutorial chapter 3 of 3: Simulate failures with the .NET SDK.

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
  { n: 1, label: "Understand the application", href: "/getting_started/dotnet/first_program_in_dotnet/" },
  { n: 2, label: "Run the application", href: "/getting_started/dotnet/first_program_in_dotnet/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/dotnet/first_program_in_dotnet/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "server-crash", label: "Recover from a server crash" },
  { id: "activity-error", label: "Recover from an Activity error" },
  { id: "conclusion", label: "Conclusion" },
  { id: "further-exploration", label: "Further exploration" },
];

const IMG_BASE = "/img/getting_started/dotnet/first_program_in_dotnet";

export default function Chapter3Page() {
  return (
    <Layout
      title="Simulate failures - Run your first Temporal .NET app"
      description="Chapter 3: Watch Temporal preserve Workflow state across server crashes and Activity errors."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_dotnet.png" alt="Temporal .NET SDK" className={styles.heroBannerImg} />
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
                  { label: ".NET", href: "/getting_started/dotnet" },
                  { label: "First program", href: "/getting_started/dotnet/first_program_in_dotnet/" },
                  { label: "Simulate failures" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Simulate failures</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              One of Temporal's most important features is its ability to maintain Workflow state when something
              fails. Simulate some failures and see how Temporal responds.
            </p>

            <section className={styles.section} id="server-crash">
              <h2 className={styles.sectionTitle}>Recover from a server crash</h2>
              <p>
                Unlike many modern applications, Temporal automatically preserves the state of your Workflow even
                if the server is down.
              </p>
              <ol>
                <li>Stop your Worker with <code>CTRL+C</code>.</li>
                <li>Start the Workflow again with <code>dotnet run --project MoneyTransferClient</code>.</li>
                <li>Verify the Workflow is running in the UI.</li>
                <li>Shut down the Temporal Server with <code>CTRL+C</code>.</li>
                <li>Restart it and reload the UI.</li>
              </ol>
              <p>Your Workflow is still listed:</p>
              <p>
                <img src={`${IMG_BASE}/second_workflow.png`} alt="The Workflow still appears" className={styles.diagramImage} />
              </p>
              <p>If the Temporal Cluster goes offline, you can pick up where you left off when it comes back online.</p>
            </section>

            <section className={styles.section} id="activity-error">
              <h2 className={styles.sectionTitle}>Recover from an unknown error in an Activity</h2>
              <p>
                To test this out, simulate a bug in the <code>DepositAsync()</code> Activity method. Let your
                Workflow continue to run but don't start the Worker yet.
              </p>
              <p>
                Open <code>MoneyTransferWorker/Activities.cs</code> and uncomment the line that calls{" "}
                <code>DepositThatFailsAsync</code> in <code>DepositAsync</code>. Comment out the try-catch block
                below it.
              </p>
              <p>Save your changes and start the Worker again:</p>
              <CodeBlock language="bash">dotnet run --project MoneyTransferWorker</CodeBlock>
              <p>
                You'll see the Worker complete <code>WithdrawAsync()</code> but error on{" "}
                <code>DepositAsync()</code> - and keep retrying using the <code>RetryPolicy</code>:
              </p>
              <p>
                <img src={`${IMG_BASE}/activity_failure.png`} alt="The Activity failing" className={styles.diagramImage} />
              </p>
              <Admonition type="note">
                <p>
                  Traditionally, you'd implement timeout and retry logic in your service code itself. With Temporal,
                  you specify timeout configurations in the Workflow code as Activity options.
                </p>
              </Admonition>
              <p>
                Your Workflow is running, but only <code>WithdrawAsync()</code> has succeeded. With Temporal, you
                can debug and fix the issue while the Workflow is running.
              </p>
              <p>
                Pretend that you found a fix. Switch the comments back so <code>DepositAsync()</code> calls the
                regular <code>bankService.DepositAsync</code>. Save your changes.
              </p>
              <p>Stop the Worker with <code>CTRL+C</code>, then restart it:</p>
              <CodeBlock language="bash">dotnet run --project MoneyTransferWorker</CodeBlock>
              <p>
                The Worker picks up right where the Workflow was failing and executes the fixed{" "}
                <code>DepositAsync()</code> Activity. Visit the{" "}
                <a href="http://localhost:8233" target="_blank" rel="noopener noreferrer">Web UI</a> again and
                you'll see the Workflow has completed:
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
              <p>Try the following before moving on:</p>
              <ul>
                <li>Change the Retry Policy so it only retries 1 time. Does the Workflow place the money back into the original account?</li>
              </ul>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take Temporal 101 with .NET</h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>Start Temporal 101 <span aria-hidden="true">→</span></span>
                </Link>
                <a href="https://github.com/temporalio/samples-dotnet" target="_blank" rel="noopener noreferrer" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Explore</span>
                  <h3 className={styles.nextTitle}>.NET SDK samples</h3>
                  <p className={styles.nextBody}>
                    Smaller examples that showcase particular features or common patterns.
                  </p>
                  <span className={styles.nextCta}>Browse samples <span aria-hidden="true">→</span></span>
                </a>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/dotnet/first_program_in_dotnet/run/" className={styles.chapterNavCard}>
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
