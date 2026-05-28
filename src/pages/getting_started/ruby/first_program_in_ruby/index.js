// Tutorial chapter 1 of 3: Understand the Ruby money-transfer application.
// Canonical code: https://github.com/temporalio/money-transfer-project-template-ruby

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
  { n: 1, label: "Understand the application", href: "/getting_started/ruby/first_program_in_ruby/" },
  { n: 2, label: "Run the application", href: "/getting_started/ruby/first_program_in_ruby/run/" },
  { n: 3, label: "Simulate failures", href: "/getting_started/ruby/first_program_in_ruby/simulate-failures/" },
];

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "application-overview", label: "Application overview" },
  { id: "download", label: "Download the example app" },
  { id: "workflow-definition", label: "Workflow Definition" },
  { id: "activity-definition", label: "Activity Definition" },
];

const WORKFLOW_RB = `require_relative 'activities'
require_relative 'shared'
require 'temporalio/retry_policy'
require 'temporalio/workflow'

module MoneyTransfer
  class MoneyTransferWorkflow < Temporalio::Workflow::Definition
    def execute(details)
      retry_policy = Temporalio::RetryPolicy.new(
        max_interval: 10,
        non_retryable_error_types: [
          'InvalidAccountError',
          'InsufficientFundsError'
        ]
      )

      Temporalio::Workflow.logger.info("Starting workflow (#{details})")

      withdraw_result = Temporalio::Workflow.execute_activity(
        BankActivities::Withdraw,
        details,
        start_to_close_timeout: 5,
        retry_policy: retry_policy
      )

      begin
        deposit_result = Temporalio::Workflow.execute_activity(
          BankActivities::Deposit,
          details,
          start_to_close_timeout: 5,
          retry_policy: retry_policy
        )

        "Transfer complete (transaction IDs: #{withdraw_result}, #{deposit_result})"
      rescue Temporalio::Error::ActivityError => e
        # Since the deposit failed, attempt to recover by refunding the withdrawal
        refund_result = Temporalio::Workflow.execute_activity(
          BankActivities::Refund,
          details,
          start_to_close_timeout: 5,
          retry_policy: retry_policy
        )
        "Transfer complete (transaction IDs: #{withdraw_result}, #{refund_result})"
      end
    end
  end
end`;

const SHARED_RB = `TransferDetails = Struct.new(:source_account, :target_account, :amount, :reference_id) do
  def to_s
    "TransferDetails { #{source_account}, #{target_account}, #{amount}, #{reference_id} }"
  end
end`;

const ACTIVITIES_RB = `require_relative 'shared'
require 'temporalio/activity'

module MoneyTransfer
  module BankActivities
    class Withdraw < Temporalio::Activity::Definition
      def execute(details)
        puts("Doing a withdrawal from #{details.source_account} for #{details.amount}")
        raise InsufficientFundsError, 'Transfer amount too large' if details.amount > 1000

        # Uncomment to expose a bug and cause the Activity to fail
        # x = details.amount / 0

        "OKW-#{details.amount}-#{details.source_account}"
      end
    end

    class Deposit < Temporalio::Activity::Definition
      def execute(details)
        puts("Doing a deposit into #{details.target_account} for #{details.amount}")
        raise InvalidAccountError, 'Invalid account number' if details.target_account == 'B5555'

        "OKD-#{details.amount}-#{details.target_account}"
      end
    end

    class Refund < Temporalio::Activity::Definition
      def execute(details)
        puts("Refunding #{details.amount} back to account #{details.source_account}")
        "OKR-#{details.amount}-#{details.source_account}"
      end
    end
  end
end`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Understand the application - Run your first Temporal Ruby app"
      description="Chapter 1: Download and explore the Ruby money-transfer Workflow and its Activities."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Ruby", href: "/getting_started/ruby" },
                  { label: "First program", href: "/getting_started/ruby/first_program_in_ruby/" },
                  { label: "Understand the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run your first Temporal application with the Ruby SDK</h1>

            <MetaChips items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll run your first Temporal Application using the{" "}
              <a href="https://github.com/temporalio/sdk-ruby" target="_blank" rel="noopener noreferrer">Ruby SDK</a>.
              You'll use the Web UI for state visibility, then explore how Temporal helps you recover from common failures.
            </p>

            <Admonition type="note" title="What you'll do">
              <ul>
                <li>Explore Temporal's core terminology and concepts.</li>
                <li>Run a Temporal Workflow Application using a Temporal Service and the Ruby SDK.</li>
                <li>Practice reviewing the state of the Workflow.</li>
                <li>Understand the inherent reliability of Workflow methods.</li>
              </ul>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li><Link to="/getting_started/ruby/dev_environment/">Set up a local development environment for developing Temporal Applications with Ruby</Link></li>
                <li>Ensure you have Git installed to clone the project.</li>
              </ul>
            </section>

            <section className={styles.section} id="application-overview">
              <h2 className={styles.sectionTitle}>Application overview</h2>
              <p>
                The project simulates a money transfer application: withdrawals, deposits, and refunds. Money comes
                out of one account and goes into another. If the deposit fails after a successful withdrawal, the
                money returns to the original account via a compensating <code>Refund</code> Activity (a classic
                saga pattern).
              </p>
              <p>
                Temporal automatically preserves application state when something fails - recovering processes where
                they left off or rolling them back.
              </p>
            </section>

            <section className={styles.section} id="download">
              <h2 className={styles.sectionTitle}>Download the example application</h2>
              <p>
                The source code is available in a{" "}
                <a href="https://github.com/temporalio/money-transfer-project-template-ruby/" target="_blank" rel="noopener noreferrer">GitHub repository</a>. Clone it:
              </p>
              <CodeBlock language="bash">git clone https://github.com/temporalio/money-transfer-project-template-ruby/</CodeBlock>
              <CodeBlock language="bash">cd money-transfer-project-template-ruby</CodeBlock>
            </section>

            <section className={styles.section} id="workflow-definition">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>
                In the Ruby SDK, a Workflow Definition is a class that extends{" "}
                <code>Temporalio::Workflow::Definition</code>. The <code>execute</code> method is its entry point:
              </p>
              <CodeBlock language="ruby" title="workflow.rb">{WORKFLOW_RB}</CodeBlock>
              <p>
                The Workflow's <code>execute</code> method is passed a <code>TransferDetails</code> struct:
              </p>
              <CodeBlock language="ruby" title="shared.rb">{SHARED_RB}</CodeBlock>
              <p>
                The Retry Policy defined at the top of the Workflow limits the delay between retry attempts to 10
                seconds and marks <code>InvalidAccountError</code> and <code>InsufficientFundsError</code> as
                non-retryable.
              </p>
              <Admonition type="caution" title="This is a simplified example">
                <p>
                  This tutorial doesn't handle every possible situation - including failure of the refund operation,
                  which might involve a human-in-the-loop step.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="activity-definition">
              <h2 className={styles.sectionTitle}>Activity Definition</h2>
              <p>
                Activities derive from <code>Temporalio::Activity::Definition</code> and define an{" "}
                <code>execute</code> method. The <code>Withdraw</code>, <code>Deposit</code>, and{" "}
                <code>Refund</code> Activities each simulate calls to a banking service:
              </p>
              <CodeBlock language="ruby" title="activities.rb">{ACTIVITIES_RB}</CodeBlock>
              <p>
                The <code>Withdraw</code> Activity fails with <code>InsufficientFundsError</code> if the amount
                exceeds $1000 - a non-retryable error that fails the Workflow. The <code>Deposit</code> Activity
                fails with <code>InvalidAccountError</code> if the target is <code>B5555</code>, which is caught
                generically as <code>Temporalio::Error::ActivityError</code> and triggers a <code>Refund</code>.
              </p>
              <Admonition type="tip" title="Why you use Activities">
                <p>
                  Workflows have{" "}
                  <a href="https://docs.temporal.io/workflow-definition#deterministic-constraints" target="_blank" rel="noopener noreferrer">deterministic constraints</a>{" "}
                  - operations that interact with external systems go in Activities. Use Activities for business
                  logic and Workflows to orchestrate them.
                </p>
              </Admonition>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/ruby/dev_environment/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous
                </span>
                <span className={styles.chapterNavTitle}>Set up your dev environment</span>
              </Link>
              <Link to="/getting_started/ruby/first_program_in_ruby/run/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
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
