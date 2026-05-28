// Tutorial chapter 1 of 3: Understand the Python money-transfer application.
// Canonical code: https://github.com/temporalio/money-transfer-project-template-python

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "application-overview", label: "Application overview" },
  { id: "download", label: "Download the example app" },
  { id: "workflow-definition", label: "Workflow Definition" },
  { id: "activity-definition", label: "Activity Definition" },
  { id: "retry-policy", label: "Set the Retry Policy" },
];

const WORKFLOWS_PY = `from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.exceptions import ActivityError

with workflow.unsafe.imports_passed_through():
    from activities import BankingActivities
    from shared import PaymentDetails


@workflow.defn
class MoneyTransfer:
    @workflow.run
    async def run(self, payment_details: PaymentDetails) -> str:
        retry_policy = RetryPolicy(
            maximum_attempts=3,
            maximum_interval=timedelta(seconds=2),
            non_retryable_error_types=["InvalidAccountError", "InsufficientFundsError"],
        )

        # Withdraw money
        withdraw_output = await workflow.execute_activity_method(
            BankingActivities.withdraw,
            payment_details,
            start_to_close_timeout=timedelta(seconds=5),
            retry_policy=retry_policy,
        )

        # Deposit money
        try:
            deposit_output = await workflow.execute_activity_method(
                BankingActivities.deposit,
                payment_details,
                start_to_close_timeout=timedelta(seconds=5),
                retry_policy=retry_policy,
            )

            result = f"Transfer complete (transaction IDs: {withdraw_output}, {deposit_output})"
            return result
        except ActivityError as deposit_err:
            workflow.logger.error(f"Deposit failed: {deposit_err}")
            try:
                refund_output = await workflow.execute_activity_method(
                    BankingActivities.refund,
                    payment_details,
                    start_to_close_timeout=timedelta(seconds=5),
                    retry_policy=retry_policy,
                )
                workflow.logger.info(f"Refund successful. Confirmation ID: {refund_output}")
                raise deposit_err
            except ActivityError as refund_error:
                workflow.logger.error(f"Refund failed: {refund_error}")
                raise refund_error`;

const SHARED_PY = `from dataclasses import dataclass

@dataclass
class PaymentDetails:
    source_account: str
    target_account: str
    amount: int
    reference_id: str`;

const ACTIVITY_WITHDRAW = `@activity.defn
async def withdraw(self, data: PaymentDetails) -> str:
    reference_id = f"{data.reference_id}-withdrawal"
    try:
        confirmation = await asyncio.to_thread(
            self.bank.withdraw, data.source_account, data.amount, reference_id
        )
        return confirmation
    except InvalidAccountError:
        raise
    except Exception:
        activity.logger.exception("Withdrawal failed")
        raise`;

const ACTIVITY_DEPOSIT = `@activity.defn
async def deposit(self, data: PaymentDetails) -> str:
    reference_id = f"{data.reference_id}-deposit"
    try:
        confirmation = await asyncio.to_thread(
            self.bank.deposit, data.target_account, data.amount, reference_id
        )
        """
        confirmation = await asyncio.to_thread(
            self.bank.deposit_that_fails,
            data.target_account,
            data.amount,
            reference_id,
        )
        """
        return confirmation
    except InvalidAccountError:
        raise
    except Exception:
        activity.logger.exception("Deposit failed")
        raise`;

const RETRY_POLICY = `retry_policy = RetryPolicy(
    maximum_attempts=3,
    maximum_interval=timedelta(seconds=2),
    non_retryable_error_types=["InvalidAccountError", "InsufficientFundsError"],
)`;

const IMG_BASE = "/img/getting_started/python/first_program_in_python";

export default function Chapter1Page() {
  return (
    <Layout
      title="Understand the application - Run your first Temporal Python app"
      description="Chapter 1: Download and explore the Python money-transfer Workflow and its Activities."
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
                  { label: "Understand the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run your first Temporal application with the Python SDK</h1>

            <MetaChips items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll run your first Temporal Application using the{" "}
              <a href="https://github.com/temporalio/sdk-python" target="_blank" rel="noopener noreferrer">Python SDK</a>.
              You'll use the Web UI for state visibility, then explore how Temporal helps you recover from common failures.
            </p>

            <Admonition type="note" title="What you'll do">
              <ul>
                <li>Explore Temporal's core terminology and concepts.</li>
                <li>Run a Temporal Workflow Application using a Temporal Cluster and the Python SDK.</li>
                <li>Practice reviewing the state of the Workflow.</li>
                <li>Understand the inherent reliability of Workflow methods.</li>
              </ul>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li><Link to="/getting_started/python/dev_environment/">Set up a local development environment for developing Temporal Applications with Python</Link></li>
                <li>Ensure you have Git installed to clone the project.</li>
              </ul>
            </section>

            <section className={styles.section} id="application-overview">
              <h2 className={styles.sectionTitle}>Application overview</h2>
              <p>
                This project simulates a money transfer application: withdrawals, deposits, and refunds. Money comes
                out of one account and goes into another. If the withdrawal succeeds but the deposit fails, the money
                needs to go back to the original account.
              </p>
              <p>
                Temporal automatically maintains application state when something fails - recovering processes where
                they left off or rolling them back. You focus on business logic instead of writing recovery code.
              </p>
              <p>The following diagram illustrates what happens when you start the Workflow:</p>
              <p>
                <img src="https://raw.githubusercontent.com/temporalio/documentation-images/main/static/temporal-high-level-application-design.png" alt="High level project design" className={styles.diagramImage} />
              </p>
              <p>
                None of your application code runs on the Temporal Server. Your Worker, Workflow, and Activity run on
                your infrastructure, along with the rest of your applications.
              </p>
            </section>

            <section className={styles.section} id="download">
              <h2 className={styles.sectionTitle}>Download the example application</h2>
              <p>
                The application is available in a{" "}
                <a href="https://github.com/temporalio/money-transfer-project-template-python" target="_blank" rel="noopener noreferrer">GitHub repository</a>. Clone it:
              </p>
              <CodeBlock language="bash">git clone https://github.com/temporalio/money-transfer-project-template-python</CodeBlock>
              <CodeBlock language="bash">cd money-transfer-project-template-python</CodeBlock>
              <Admonition type="tip">
                <p>
                  The repository is a GitHub Template, so you can clone it to your own account and use it as the
                  foundation for your own Temporal application.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="workflow-definition">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>
                A Workflow Definition in Python uses the <code>@workflow.defn</code> decorator on the Workflow class.
                Here's what the Workflow Definition looks like:
              </p>
              <CodeBlock language="python" title="workflows.py">{WORKFLOWS_PY}</CodeBlock>
              <p>
                The <code>MoneyTransfer</code> class takes transaction details, executes Activities to withdraw and
                deposit, and returns results. The <code>run</code> method takes a <code>PaymentDetails</code> input:
              </p>
              <CodeBlock language="python" title="shared.py">{SHARED_PY}</CodeBlock>
              <Admonition type="tip">
                <p>
                  It's a good practice to send a single data class object into a Workflow as its input, rather than
                  multiple separate arguments.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="activity-definition">
              <h2 className={styles.sectionTitle}>Activity Definition</h2>
              <p>
                In the Python SDK, you define an Activity by decorating a method with <code>@activity.defn</code>.
                The <code>withdraw()</code> Activity takes transfer details and calls a service:
              </p>
              <CodeBlock language="python" title="activities.py">{ACTIVITY_WITHDRAW}</CodeBlock>
              <p>The <code>deposit()</code> method looks almost identical:</p>
              <CodeBlock language="python" title="activities.py">{ACTIVITY_DEPOSIT}</CodeBlock>
              <p>The commented block in <code>deposit()</code> is what you'll uncomment later to simulate a failure.</p>
              <Admonition type="tip" title="Why you use Activities">
                <p>
                  Temporal Workflows have <a href="https://docs.temporal.io/workflows#deterministic-constraints" target="_blank" rel="noopener noreferrer">deterministic constraints</a>{" "}
                  and must produce the same output each time, given the same input. Non-deterministic work like file
                  or network access must be done by Activities. Use Activities for business logic and Workflows to
                  coordinate.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="retry-policy">
              <h2 className={styles.sectionTitle}>Set the Retry Policy</h2>
              <p>
                If an Activity fails, Temporal Workflows automatically retry. At the top of the{" "}
                <code>MoneyTransfer</code> Workflow, you'll see a Retry Policy:
              </p>
              <CodeBlock language="python" title="workflows.py">{RETRY_POLICY}</CodeBlock>
              <p>
                By default, Temporal retries failed Activities forever, but you can specify non-retryable error types
                and maximum attempts. This example retries up to 3 times.
              </p>
              <Admonition type="caution" title="This is a simplified example">
                <p>
                  Transferring money is tricky and this tutorial doesn't cover all edge cases. In production you'd
                  add more advanced logic - including a "human in the loop" step where someone is notified of refund
                  issues and can intervene.
                </p>
              </Admonition>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/python/dev_environment/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous
                </span>
                <span className={styles.chapterNavTitle}>Set up your dev environment</span>
              </Link>
              <Link to="/getting_started/python/first_program_in_python/run/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2 <span aria-hidden="true" className={styles.chapterNavArrow}>→</span>
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
