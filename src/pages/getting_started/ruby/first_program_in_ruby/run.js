// Tutorial chapter 2 of 3: Run the Ruby money-transfer application.

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
  { id: "start-the-service", label: "Start the Temporal Service" },
  { id: "launch-the-worker", label: "Launch the Worker" },
  { id: "start-the-workflow", label: "Start the Workflow Execution" },
  { id: "view-the-state", label: "View the state in the Web UI" },
];

const WORKER_RB = `require_relative 'activities'
require_relative 'shared'
require_relative 'workflow'
require 'logger'
require 'temporalio/client'
require 'temporalio/worker'

client = Temporalio::Client.connect(
  'localhost:7233',
  'default',
  logger: Logger.new($stdout, level: Logger::INFO)
)

worker = Temporalio::Worker.new(
  client:,
  task_queue: MoneyTransfer::TASK_QUEUE_NAME,
  workflows: [MoneyTransfer::MoneyTransferWorkflow],
  activities: [MoneyTransfer::BankActivities::Withdraw,
               MoneyTransfer::BankActivities::Deposit,
               MoneyTransfer::BankActivities::Refund]
)

puts 'Starting Worker (press Ctrl+C to exit)'
worker.run(shutdown_signals: ['SIGINT'])`;

const STARTER_RB = `require_relative 'shared'
require_relative 'workflow'
require 'securerandom'
require 'temporalio/client'

client = Temporalio::Client.connect('localhost:7233', 'default')

details = MoneyTransfer::TransferDetails.new('A1001', 'B2002', 100, SecureRandom.uuid)
details.source_account = ARGV[0] if ARGV.length >= 1
details.target_account = ARGV[1] if ARGV.length >= 2
details.amount = ARGV[2].to_i if ARGV.length >= 3
details.reference_id = ARGV[3] if ARGV.length >= 4

handle = client.start_workflow(
  MoneyTransfer::MoneyTransferWorkflow,
  details,
  id: "moneytransfer-#{details.reference_id}",
  task_queue: MoneyTransfer::TASK_QUEUE_NAME
)

puts "Initiated transfer of $#{details.amount} from #{details.source_account} to #{details.target_account}"
puts "Workflow ID: #{handle.id}"

begin
  puts "Workflow result: #{handle.result}"
rescue Temporalio::Error::RPCError
  puts 'Temporal Service unavailable while awaiting result'
  retry
end`;

const IMG_BASE = "/img/getting_started/ruby/first_program_in_ruby";

export default function Chapter2Page() {
  return (
    <Layout
      title="Run the application - Run your first Temporal Ruby app"
      description="Chapter 2: Start the Temporal Service, launch a Worker, and run a Workflow Execution."
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
                  { label: "Run the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run the application</h1>

            <MetaChips items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Now that you understand the Workflow and Activities, run the application. You'll start a local
              Temporal Service, launch a Worker, then submit a Workflow Execution request.
            </p>

            <section className={styles.section} id="start-the-service">
              <h2 className={styles.sectionTitle}>Start a local Temporal Service</h2>
              <p>
                Run the following command to start the Temporal Service with a persistent database file and the Web
                UI on port 8080:
              </p>
              <CodeBlock language="bash">temporal server start-dev --db-filename temporal.db --ui-port 8080</CodeBlock>
              <p>
                The <code>--db-filename</code> option ensures records persist when you restart the service, as
                they would in a production deployment. Be sure to specify the same path each time.
              </p>
            </section>

            <section className={styles.section} id="launch-the-worker">
              <h2 className={styles.sectionTitle}>Launch a Worker</h2>
              <p>Open a new terminal and change to the project directory:</p>
              <CodeBlock language="bash">cd money-transfer-project-template-ruby</CodeBlock>
              <p>Launch a Worker by running:</p>
              <CodeBlock language="bash">bundle exec ruby worker.rb</CodeBlock>
              <p>You'll see:</p>
              <CodeBlock>Starting Worker (press Ctrl+C to exit)</CodeBlock>
              <p>
                The Worker is now polling the Task Queue, but no Workflow Execution requests have been submitted
                yet. Here's how the Worker is configured:
              </p>
              <CodeBlock language="ruby" title="worker.rb">{WORKER_RB}</CodeBlock>
            </section>

            <section className={styles.section} id="start-the-workflow">
              <h2 className={styles.sectionTitle}>Start the Workflow Execution</h2>
              <p>Open another terminal, change to the project directory, and submit a Workflow Execution request:</p>
              <CodeBlock language="bash">bundle exec ruby starter.rb</CodeBlock>
              <p>The <code>starter.rb</code> program connects to the Temporal Service, submits the request, and waits for the result:</p>
              <CodeBlock language="ruby" title="starter.rb">{STARTER_RB}</CodeBlock>
              <p>You'll see output indicating that the transfer was initiated and the Workflow completed:</p>
              <CodeBlock>{`Initiated transfer of $100 from A1001 to B2002
Workflow ID: moneytransfer-...
Workflow result: Transfer complete (transaction IDs: OKW-100-A1001, OKD-100-B2002)`}</CodeBlock>
            </section>

            <section className={styles.section} id="view-the-state">
              <h2 className={styles.sectionTitle}>View the state in the Web UI</h2>
              <p>
                Visit the{" "}
                <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer">Temporal Web UI</a>{" "}
                where you'll see your Workflow listed:
              </p>
              <p>
                <img src={`${IMG_BASE}/web-ui-main-page.png`} alt="The Workflow listed in the main page" className={styles.diagramImage} />
              </p>
              <p>Click the Workflow ID to see details, inputs, attempts, and history:</p>
              <p>
                <img src={`${IMG_BASE}/web-ui-detail-page-workflow-completed.png`} alt="Workflow completed view" className={styles.diagramImage} />
              </p>
              <p>
                You just ran a Temporal Workflow application and saw how Workflows, Activities, and Workers
                interact. Next you'll explore how Temporal handles failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/ruby/first_program_in_ruby/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Understand the application</span>
              </Link>
              <Link to="/getting_started/ruby/first_program_in_ruby/simulate-failures/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3 <span aria-hidden="true" className={styles.chapterNavArrow}>→</span>
                </span>
                <span className={styles.chapterNavTitle}>Simulate failures</span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
