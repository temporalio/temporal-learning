// Tutorial chapter 1 of 3: Understand the money-transfer application.
// Canonical code lives at https://github.com/temporalio/money-transfer-project-template-go.
// Update the *_GO constants here when the upstream repo changes.

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "application-overview", label: "Application overview" },
  { id: "download", label: "Download the example app" },
  { id: "explore", label: "Explore the Workflow and Activities" },
];

const WORKFLOW_GO = `func MoneyTransfer(ctx workflow.Context, input PaymentDetails) (string, error) {

\t// RetryPolicy specifies how to automatically handle retries if an Activity fails.
\tretrypolicy := &temporal.RetryPolicy{
\t\tInitialInterval:        time.Second,
\t\tBackoffCoefficient:     2.0,
\t\tMaximumInterval:        100 * time.Second,
\t\tMaximumAttempts:        500, // 0 is unlimited retries
\t\tNonRetryableErrorTypes: []string{"InvalidAccountError", "InsufficientFundsError"},
\t}

\toptions := workflow.ActivityOptions{
\t\t// Timeout options specify when to automatically timeout Activity functions.
\t\tStartToCloseTimeout: time.Minute,
\t\t// Optionally provide a customized RetryPolicy.
\t\t// Temporal retries failed Activities by default.
\t\tRetryPolicy: retrypolicy,
\t}

\t// Apply the options.
\tctx = workflow.WithActivityOptions(ctx, options)

\t// Withdraw money.
\tvar withdrawOutput string

\twithdrawErr := workflow.ExecuteActivity(ctx, Withdraw, input).Get(ctx, &withdrawOutput)

\tif withdrawErr != nil {
\t\treturn "", withdrawErr
\t}

\t// Deposit money.
\tvar depositOutput string

\tdepositErr := workflow.ExecuteActivity(ctx, Deposit, input).Get(ctx, &depositOutput)

\tif depositErr != nil {
\t\t// The deposit failed; put money back in original account.

\t\tvar result string

\t\trefundErr := workflow.ExecuteActivity(ctx, Refund, input).Get(ctx, &result)

\t\tif refundErr != nil {
\t\t\treturn "",
\t\t\t\tfmt.Errorf("Deposit: failed to deposit money into %v: Money returned to %v: %w",
\t\t\t\t\tinput.TargetAccount, input.SourceAccount, refundErr)
\t\t}

\t\treturn "", fmt.Errorf("Deposit: failed to deposit money into %v: Money returned to %v: %w",
\t\t\tinput.TargetAccount, input.SourceAccount, depositErr)
\t}

\tresult := fmt.Sprintf("Transfer complete (transaction IDs: %s, %s)", withdrawOutput, depositOutput)
\treturn result, nil
}`;

const SHARED_GO = `type PaymentDetails struct {
\tSourceAccount string
\tTargetAccount string
\tAmount        int
\tReferenceID   string
}`;

const ACTIVITY_WITHDRAW = `func Withdraw(ctx context.Context, data PaymentDetails) (string, error) {
\tlog.Printf("Withdrawing $%d from account %s.\\n\\n",
\t\tdata.Amount,
\t\tdata.SourceAccount,
\t)

\treferenceID := fmt.Sprintf("%s-withdrawal", data.ReferenceID)
\tbank := BankingService{"bank-api.example.com"}
\tconfirmation, err := bank.Withdraw(data.SourceAccount, data.Amount, referenceID)
\treturn confirmation, err
}`;

const ACTIVITY_DEPOSIT = `func Deposit(ctx context.Context, data PaymentDetails) (string, error) {
\tlog.Printf("Depositing $%d into account %s.\\n\\n",
\t\tdata.Amount,
\t\tdata.TargetAccount,
\t)

\treferenceID := fmt.Sprintf("%s-deposit", data.ReferenceID)
\tbank := BankingService{"bank-api.example.com"}
\t// Uncomment the next line and comment the one after that to simulate an unknown failure
\t// confirmation, err := bank.DepositThatFails(data.TargetAccount, data.Amount, referenceID)
\tconfirmation, err := bank.Deposit(data.TargetAccount, data.Amount, referenceID)
\treturn confirmation, err
}`;

const ACTIVITY_REFUND = `func Refund(ctx context.Context, data PaymentDetails) (string, error) {
\tlog.Printf("Refunding $%v back into account %v.\\n\\n",
\t\tdata.Amount,
\t\tdata.SourceAccount,
\t)

\treferenceID := fmt.Sprintf("%s-refund", data.ReferenceID)
\tbank := BankingService{"bank-api.example.com"}
\tconfirmation, err := bank.Deposit(data.SourceAccount, data.Amount, referenceID)
\treturn confirmation, err
}`;

const RETRY_POLICY_SNIPPET = `// RetryPolicy specifies how to automatically handle retries if an Activity fails.
retrypolicy := &temporal.RetryPolicy{
\tInitialInterval:        time.Second,
\tBackoffCoefficient:     2.0,
\tMaximumInterval:        100 * time.Second,
\tMaximumAttempts:        500, // 0 is unlimited retries
\tNonRetryableErrorTypes: []string{"InvalidAccountError", "InsufficientFundsError"},
}

options := workflow.ActivityOptions{
\t// Timeout options specify when to automatically timeout Activity functions.
\tStartToCloseTimeout: time.Minute,
\t// Optionally provide a customized RetryPolicy.
\t// Temporal retries failed Activities by default.
\tRetryPolicy: retrypolicy,
}`;

const IMG_BASE = "/img/getting_started/go/first_program_in_go";

export default function Chapter1Page() {
  return (
    <Layout
      title="Understand the application - Run your first Temporal Go app"
      description="Chapter 1: Download and explore the money-transfer Workflow and its Activities."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Go", href: "/getting_started/go" },
                  {
                    label: "First program",
                    href: "/getting_started/go/first_program_in_go/",
                  },
                  { label: "Understand the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Run your first Temporal application with the Go SDK
            </h1>

            <MetaChips
              items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper
              steps={TUTORIAL_STEPS}
              currentStep={1}
            />

            <p className={styles.intro}>
              In this tutorial, you'll run your first Temporal Application and
              explore how Workflows and Activities work together. You'll use
              the Temporal Web UI to see how Temporal executed your Workflow,
              and explore how Temporal helps you recover from common failures.
            </p>

            <Admonition type="note" title="What you'll do">
              <ul>
                <li>Explore Temporal's core terminology and concepts.</li>
                <li>
                  Run a Temporal Workflow Application using a Temporal Cluster
                  and the{" "}
                  <a
                    href="https://github.com/temporalio/go-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go SDK
                  </a>
                  .
                </li>
                <li>Practice reviewing the state of the Workflow.</li>
                <li>Understand the inherent reliability of Workflow functions.</li>
              </ul>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li>
                  <Link to="/getting_started/go/dev_environment/">
                    Set up a local development environment for developing
                    Temporal Applications with Go
                  </Link>
                </li>
                <li>Ensure you have Git installed to clone the project.</li>
              </ul>
            </section>

            <section className={styles.section} id="application-overview">
              <h2 className={styles.sectionTitle}>Application overview</h2>
              <p>
                The project in this tutorial mimics a "money transfer"
                application that has a single{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/go/foundations/#develop-workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow function
                </a>{" "}
                that orchestrates the execution of <code>Withdraw()</code> and{" "}
                <code>Deposit()</code> functions, representing a transfer of
                money from one account to another. Temporal calls these
                particular functions{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/go/foundations/#activity-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity functions
                </a>
                .
              </p>
              <p>To run the application, you do the following:</p>
              <ol>
                <li>
                  Send a message to the Temporal Cluster to start the money
                  transfer. The Temporal Server tracks the progress of your
                  Workflow function execution.
                </li>
                <li>
                  Run a Worker. A Worker is a wrapper around your compiled
                  Workflow and Activity code. A Worker's only job is to execute
                  the Activity and Workflow functions and communicate the
                  results back to the Temporal Server.
                </li>
              </ol>
              <p>
                The following diagram illustrates what happens when you start
                the Workflow:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/temporal-high-level-application-design.png`}
                  alt="High level project design"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                The Temporal Server doesn't run your code. Your Worker,
                Workflow, and Activity run on your infrastructure, along with
                the rest of your applications.
              </p>
            </section>

            <section className={styles.section} id="download">
              <h2 className={styles.sectionTitle}>
                Download the example application
              </h2>
              <p>
                The application you'll use in this tutorial is available in a{" "}
                <a
                  href="https://github.com/temporalio/money-transfer-project-template-go"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub repository
                </a>
                . Open a new terminal window and use <code>git</code> to clone
                the repository:
              </p>
              <CodeBlock language="bash">
                git clone https://github.com/temporalio/money-transfer-project-template-go
              </CodeBlock>
              <p>Once you have the repository cloned, change to the project directory:</p>
              <CodeBlock language="bash">cd money-transfer-project-template-go</CodeBlock>

              <Admonition type="tip">
                <p>
                  The repository is a GitHub Template, so you can clone it to
                  your own account and use it as the foundation for your own
                  Temporal application. If you do, change the project name in{" "}
                  <code>go.mod</code> to reflect the new repository name.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="explore">
              <h2 className={styles.sectionTitle}>
                Explore the Workflow and Activity Definitions
              </h2>
              <p>
                A Temporal Application is a set of Temporal{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-execution"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Executions
                </a>
                , which are reliable, durable function executions. These
                Workflow Executions orchestrate the execution of{" "}
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>
                , which execute a single, well-defined action (calling a
                service, transcoding a file, sending an email).
              </p>
              <p>
                The sample app models a money transfer between two accounts.
                Money comes out of one account and goes into another. If the
                withdrawal fails, there's no need to attempt a deposit. But if
                the withdrawal works but the deposit fails, the money needs to
                go back to the original account.
              </p>
              <p>This is what the Workflow Definition looks like:</p>
              <CodeBlock language="go" title="workflow.go" showLineNumbers>
                {WORKFLOW_GO}
              </CodeBlock>
              <p>
                The <code>MoneyTransfer</code> function takes in the
                transaction details, executes Activities to withdraw and
                deposit the money, and returns the results.
              </p>
              <p>
                It accepts an <code>input</code> variable of type{" "}
                <code>PaymentDetails</code>, defined in <code>shared.go</code>:
              </p>
              <CodeBlock language="go" title="shared.go">
                {SHARED_GO}
              </CodeBlock>
              <p>
                It's a good practice to send a single, serializable data
                structure into a Workflow as its input, rather than multiple
                separate input variables.
              </p>
              <p>
                The <code>Withdraw</code> Activity takes the transfer details
                and calls a service to process the withdrawal:
              </p>
              <CodeBlock language="go" title="activity.go">
                {ACTIVITY_WITHDRAW}
              </CodeBlock>
              <p>
                The <code>Deposit</code> Activity function looks almost
                identical:
              </p>
              <CodeBlock language="go" title="activity.go">
                {ACTIVITY_DEPOSIT}
              </CodeBlock>
              <p>
                There's a commented line you'll use later in the tutorial to
                simulate an error.
              </p>
              <p>
                If the <code>Deposit</code> Activity fails, the money needs to
                go back to the original account, so a third Activity called{" "}
                <code>Refund</code> does exactly that:
              </p>
              <CodeBlock language="go" title="activity.go">
                {ACTIVITY_REFUND}
              </CodeBlock>

              <Admonition type="tip" title="Why you use Activities">
                <p>
                  Temporal Workflows have certain{" "}
                  <a
                    href="https://docs.temporal.io/workflows#deterministic-constraints"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    deterministic constraints
                  </a>{" "}
                  - they need to be replayable, and that makes them awkward
                  for arbitrary business logic. Use Activities for business
                  logic, and Workflows to coordinate the Activities.
                </p>
              </Admonition>

              <p>
                Temporal Workflows automatically retry Activities that fail by
                default, but you can customize how. At the top of the{" "}
                <code>MoneyTransfer</code> Workflow you'll see a Retry Policy:
              </p>
              <CodeBlock language="go" title="workflow.go">
                {RETRY_POLICY_SNIPPET}
              </CodeBlock>
              <p>
                By default, Temporal retries failed Activities forever, but
                you can specify non-retryable errors. In this example there
                are two: invalid account number, and insufficient funds.
              </p>

              <Admonition type="caution" title="This is a simplified example">
                <p>
                  Transferring money is a tricky subject, and this tutorial
                  doesn't cover all the edge cases. In production, you'd add
                  more advanced logic - including a "human in the loop" step
                  where someone is notified of refund issues and can intervene.
                </p>
              </Admonition>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/go/dev_environment/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Set up your dev environment
                </span>
              </Link>
              <Link
                to="/getting_started/go/first_program_in_go/run/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
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
