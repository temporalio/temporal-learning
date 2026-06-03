// Tutorial chapter 3 of 3: Simulate failures with the Ruby SDK.

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
  { n: 1, label: "Understand the application", href: "/getting_started/ruby/first_program_in_ruby/" },
  { n: 2, label: "Run the application", href: "/getting_started/ruby/first_program_in_ruby/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/ruby/first_program_in_ruby/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "insufficient-funds", label: "Insufficient funds (non-retryable)" },
  { id: "invalid-account", label: "Invalid account (saga refund)" },
  { id: "unexpected-bug", label: "Recover from an unexpected bug" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BASE = "/img/getting_started/ruby/first_program_in_ruby";

export default function Chapter3Page() {
  return (
    <Layout
      title="Simulate failures - Run your first Temporal Ruby app"
      description="Chapter 3: Watch Temporal handle non-retryable errors, saga compensation, and live bug fixes."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img src="/img/sdk_banners/banner_ruby.png" alt="Temporal Ruby SDK" className={styles.heroBannerImg} />
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
                  { label: "Get Started", href: "/start" },
                  { label: "Ruby", href: "/getting_started/ruby" },
                  { label: "First program", href: "/getting_started/ruby/first_program_in_ruby/" },
                  { label: "Simulate failures" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Simulate failures</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              The money-transfer app already has three failure scenarios built in. Trigger each one to see how
              Temporal handles non-retryable errors, automatic refunds, and live bug fixes.
            </p>

            <section className={styles.section} id="insufficient-funds">
              <h2 className={styles.sectionTitle}>Insufficient funds (non-retryable error)</h2>
              <p>
                The <code>Withdraw</code> Activity raises <code>InsufficientFundsError</code> if the amount is over
                $1000. This error type is marked non-retryable in the Workflow's Retry Policy, so the Workflow
                fails immediately.
              </p>
              <p>Try it by passing a large amount as the third positional argument:</p>
              <CodeBlock language="bash">bundle exec ruby starter.rb A1001 B2002 5000</CodeBlock>
              <p>
                Open the <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Web UI</a> and
                you'll see the Workflow failed - no retry attempts beyond the first.
              </p>
            </section>

            <section className={styles.section} id="invalid-account">
              <h2 className={styles.sectionTitle}>Invalid account (saga refund)</h2>
              <p>
                The <code>Deposit</code> Activity raises <code>InvalidAccountError</code> if the target account is{" "}
                <code>B5555</code>. This is also non-retryable - but the Workflow catches it with a generic{" "}
                <code>rescue Temporalio::Error::ActivityError</code> block and invokes the <code>Refund</code>{" "}
                Activity to return the withdrawn money. This is the saga pattern in action.
              </p>
              <p>Try it:</p>
              <CodeBlock language="bash">bundle exec ruby starter.rb A1001 B5555 100</CodeBlock>
              <p>
                In the Web UI, you'll see Withdraw succeed, Deposit fail, then Refund execute. The final result is
                "Transfer complete" - because from the Workflow's perspective, the saga completed:
              </p>
              <p>
                <img src={`${IMG_BASE}/web-ui-detail-refund-complete.png`} alt="Refund completes successfully" className={styles.diagramImage} />
              </p>
            </section>

            <section className={styles.section} id="unexpected-bug">
              <h2 className={styles.sectionTitle}>Recover from an unexpected bug</h2>
              <p>
                Real bugs aren't always anticipated. Open <code>activities.rb</code> and uncomment the line that
                causes a division-by-zero in <code>Withdraw</code>:
              </p>
              <CodeBlock language="ruby">{`# Uncomment to expose a bug and cause the Activity to fail
x = details.amount / 0`}</CodeBlock>
              <p>Stop the Worker (<code>CTRL+C</code>) and restart it:</p>
              <CodeBlock language="bash">bundle exec ruby worker.rb</CodeBlock>
              <p>Submit a transfer:</p>
              <CodeBlock language="bash">bundle exec ruby starter.rb</CodeBlock>
              <p>
                The Workflow attempts the Withdraw, fails, and Temporal keeps retrying using the default policy.
                In the Web UI you'll see the attempts piling up - but the state is preserved.
              </p>
              <p>
                <img src={`${IMG_BASE}/web-ui-detail-page-failing-activity.png`} alt="Activity failing in the Web UI" className={styles.diagramImage} />
              </p>
              <p>
                Now fix the bug by commenting the division line back out. Stop and restart the Worker. The Worker
                picks up right where the Workflow left off, runs the (now-working) Withdraw, then Deposit, and the
                Workflow completes successfully - without losing state or restarting the transaction.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You now know how to run a Temporal Workflow with the Ruby SDK and how Temporal recovers from
                non-retryable errors, retryable failures, the saga pattern, and live bug fixes. Key advantages:
              </p>
              <ol>
                <li>Temporal gives you <strong>full visibility</strong> into the state of your Workflow.</li>
                <li>Temporal <strong>maintains state</strong> through server outages and errors.</li>
                <li>Temporal lets you <strong>time out and retry Activity code</strong> outside your business logic.</li>
                <li>Temporal enables <strong>live debugging</strong> of business logic while the Workflow runs.</li>
              </ol>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/getting_started/ruby/hello_world_in_ruby" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>Build a Temporal app from scratch in Ruby</h3>
                  <p className={styles.nextBody}>
                    Write your own Workflow and Activities from the ground up - about 20 minutes.
                  </p>
                  <span className={styles.nextCta}>Build from scratch <span aria-hidden="true">→</span></span>
                </Link>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>Take Temporal 101</h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>Start Temporal 101 <span aria-hidden="true">→</span></span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/ruby/first_program_in_ruby/run/" className={styles.chapterNavCard}>
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
