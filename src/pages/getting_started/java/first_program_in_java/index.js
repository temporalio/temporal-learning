// Tutorial chapter 1 of 3: Understand the Java money-transfer application.
// Canonical code: https://github.com/temporalio/money-transfer-project-java

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "application-overview", label: "Application overview" },
  { id: "download", label: "Download the example app" },
  { id: "workflow-definition", label: "Workflow Definition" },
  { id: "activity-definition", label: "Activity Definition" },
  { id: "retry-policy", label: "Set the Retry Policy" },
];

const WORKFLOW_INTERFACE = `package moneytransferapp;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface MoneyTransferWorkflow {
    // The Workflow Execution that starts this method can be initiated from code or
    // from the 'temporal' CLI utility.
    @WorkflowMethod
    void transfer(TransactionDetails transaction);
}`;

const TRANSACTION_DETAILS = `package moneytransferapp;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonDeserialize(as = CoreTransactionDetails.class)
public interface TransactionDetails {
    String getSourceAccountId();
    String getDestinationAccountId();
    String getTransactionReferenceId();
    int getAmountToTransfer();
}`;

const WORKFLOW_IMPL = `package moneytransferapp;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import io.temporal.common.RetryOptions;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

public class MoneyTransferWorkflowImpl implements MoneyTransferWorkflow {
    private static final String WITHDRAW = "Withdraw";

    // RetryOptions specify how to automatically handle retries when Activities fail
    private final RetryOptions retryoptions = RetryOptions.newBuilder()
        .setInitialInterval(Duration.ofSeconds(1)) // Wait 1 second before first retry
        .setMaximumInterval(Duration.ofSeconds(20)) // Do not exceed 20 seconds between retries
        .setBackoffCoefficient(2) // Wait 1 second, then 2, then 4, etc
        .setMaximumAttempts(5000) // Fail after 5000 attempts
        .build();

    // ActivityOptions specify the limits on how long an Activity can execute before
    // being interrupted by the Orchestration service
    private final ActivityOptions defaultActivityOptions = ActivityOptions.newBuilder()
        .setRetryOptions(retryoptions)
        .setStartToCloseTimeout(Duration.ofSeconds(2))
        .setScheduleToCloseTimeout(Duration.ofSeconds(5000))
        .build();

    private final Map<String, ActivityOptions> perActivityMethodOptions = new HashMap<String, ActivityOptions>() {{
        put(WITHDRAW, ActivityOptions.newBuilder().setHeartbeatTimeout(Duration.ofSeconds(5)).build());
    }};

    private final AccountActivity accountActivityStub = Workflow.newActivityStub(
        AccountActivity.class, defaultActivityOptions, perActivityMethodOptions);

    @Override
    public void transfer(TransactionDetails transaction) {
        String sourceAccountId = transaction.getSourceAccountId();
        String destinationAccountId = transaction.getDestinationAccountId();
        String transactionReferenceId = transaction.getTransactionReferenceId();
        int amountToTransfer = transaction.getAmountToTransfer();

        // Stage 1: Withdraw funds from source
        try {
            accountActivityStub.withdraw(sourceAccountId, transactionReferenceId, amountToTransfer);
        } catch (Exception e) {
            System.out.printf("[%s] Withdrawal of $%d from account %s failed", transactionReferenceId, amountToTransfer, sourceAccountId);
            return;
        }

        // Stage 2: Deposit funds to destination
        try {
            accountActivityStub.deposit(destinationAccountId, transactionReferenceId, amountToTransfer);
            System.out.printf("[%s] Transaction succeeded.\\n", transactionReferenceId);
            return;
        } catch (Exception e) {
            System.out.printf("[%s] Deposit of $%d to account %s failed.\\n", transactionReferenceId, amountToTransfer, destinationAccountId);
        }

        // Continue by compensating with a refund
        try {
            accountActivityStub.refund(sourceAccountId, transactionReferenceId, amountToTransfer);
            System.out.printf("[%s] Refund to originating account was successful.\\n", transactionReferenceId);
            return;
        } catch (Exception e) {
            System.out.printf("[%s] Refund failed. Workflow will fail.", transactionReferenceId);
            throw(e);
        }
    }
}`;

const ACTIVITY_INTERFACE = `import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

@ActivityInterface
public interface AccountActivity {
    @ActivityMethod
    void withdraw(String accountId, String referenceId, int amount);

    @ActivityMethod
    void deposit(String accountId, String referenceId, int amount);

    @ActivityMethod
    void refund(String accountId, String referenceId, int amount);
}`;

const ACTIVITY_IMPL = `import io.temporal.activity.*;

public class AccountActivityImpl implements AccountActivity {
    @Override
    public void withdraw(String accountId, String referenceId, int amount) {
        System.out.printf("\\nWithdrawing $%d from account %s.\\n[ReferenceId: %s]\\n", amount, accountId, referenceId);
    }

    @Override
    public void deposit(String accountId, String referenceId, int amount) {
        boolean activityShouldSucceed = true;

        if (!activityShouldSucceed) {
            throw Activity.wrap(new RuntimeException("Simulated Activity error during deposit of funds"));
        }

        System.out.printf("\\nDepositing $%d into account %s.\\n[ReferenceId: %s]\\n", amount, accountId, referenceId);
    }

    @Override
    public void refund(String accountId, String referenceId, int amount) {
        boolean activityShouldSucceed = true;

        if (!activityShouldSucceed) {
            throw Activity.wrap(new RuntimeException("Simulated Activity error during refund to source account"));
        }

        System.out.printf("\\nRefunding $%d to account %s.\\n[ReferenceId: %s]\\n", amount, accountId, referenceId);
    }
}`;

const RETRY_POLICY = `// RetryOptions specify how to automatically handle retries when Activities fail
private final RetryOptions retryoptions = RetryOptions.newBuilder()
    .setInitialInterval(Duration.ofSeconds(1))
    .setMaximumInterval(Duration.ofSeconds(20))
    .setBackoffCoefficient(2)
    .setMaximumAttempts(5000)
    .build();`;

const IMG_BASE = "/img/getting_started/java/first_program_in_java";

export default function Chapter1Page() {
  return (
    <Layout
      title="Understand the application - Run your first Temporal Java app"
      description="Chapter 1: Download and explore the Java money-transfer Workflow and its Activities."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Java", href: "/getting_started/java" },
                  { label: "First program", href: "/getting_started/java/first_program_in_java/" },
                  { label: "Understand the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run your first Temporal application with the Java SDK</h1>

            <MetaChips items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll run your first Temporal Application using the{" "}
              <a href="https://github.com/temporalio/sdk-java" target="_blank" rel="noopener noreferrer">Java SDK</a>.
              You'll use the Web UI for state visibility, then explore how Temporal helps you recover from common failures.
            </p>

            <Admonition type="note" title="What you'll do">
              <ul>
                <li>Explore Temporal's core terminology and concepts.</li>
                <li>Run a Temporal Workflow Application using a Temporal Cluster and the Java SDK.</li>
                <li>Practice reviewing the state of the Workflow.</li>
                <li>Understand the inherent reliability of Workflow methods.</li>
              </ul>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li><Link to="/getting_started/java/dev_environment/">Set up a local development environment for developing Temporal Applications with Java</Link></li>
                <li>Ensure you have Git installed to clone the project.</li>
              </ul>
              <Admonition type="note" title="Package Management">
                <p>This tutorial uses the Maven package manager.</p>
              </Admonition>
            </section>

            <section className={styles.section} id="application-overview">
              <h2 className={styles.sectionTitle}>Application overview</h2>
              <p>
                This project simulates a money transfer application, focusing on essential transactions: withdrawals,
                deposits, and refunds. Money comes out of one account and goes into another. If the withdrawal succeeds
                but the deposit fails, the money needs to go back to the original account.
              </p>
              <p>
                One of Temporal's most important features is its ability to maintain the application state when
                something fails - it recovers processes where they left off or rolls them back correctly. You focus
                on business logic instead of writing recovery code.
              </p>
              <p>The following diagram illustrates what happens when you start the Workflow:</p>
              <p>
                <img src={`${IMG_BASE}/temporal-high-level-application-design.png`} alt="High level project design" className={styles.diagramImage} />
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
                <a href="https://github.com/temporalio/money-transfer-project-java" target="_blank" rel="noopener noreferrer">GitHub repository</a>.
                Clone it:
              </p>
              <CodeBlock language="bash">git clone https://github.com/temporalio/money-transfer-project-java</CodeBlock>
              <CodeBlock language="bash">cd money-transfer-project-java</CodeBlock>
            </section>

            <section className={styles.section} id="workflow-definition">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>
                In the Temporal Java SDK, a Workflow Definition is marked by the <code>@WorkflowInterface</code>{" "}
                attribute placed above the class interface. The <code>@WorkflowMethod</code> attribute is placed on
                the <code>transfer</code> method - the entry point for the Workflow:
              </p>
              <CodeBlock language="java" title="MoneyTransferWorkflow.java">{WORKFLOW_INTERFACE}</CodeBlock>
              <p>
                The <code>transfer</code> method takes a <code>TransactionDetails</code> instance as input:
              </p>
              <CodeBlock language="java" title="TransactionDetails.java">{TRANSACTION_DETAILS}</CodeBlock>
              <Admonition type="tip">
                <p>
                  It's a good practice to send a single object into a Workflow as its input, rather than multiple
                  separate arguments. Using a single argument makes it easier to evolve long-running Workflows.
                </p>
              </Admonition>
              <p>The <code>MoneyTransferWorkflowImpl</code> implements the transfer logic:</p>
              <CodeBlock language="java" title="MoneyTransferWorkflowImpl.java">{WORKFLOW_IMPL}</CodeBlock>
            </section>

            <section className={styles.section} id="activity-definition">
              <h2 className={styles.sectionTitle}>Activity Definition</h2>
              <p>
                Mark a method within a class as an Activity by adding the <code>@ActivityMethod</code> attribute.
                Mark an interface as an Activity Interface by adding <code>@ActivityInterface</code>:
              </p>
              <CodeBlock language="java" title="AccountActivity.java">{ACTIVITY_INTERFACE}</CodeBlock>
              <p>
                Activities are where you perform the business logic. The <code>withdraw</code>, <code>deposit</code>,
                and <code>refund</code> Activity methods call services to process money movements:
              </p>
              <CodeBlock language="java" title="AccountActivityImpl.java">{ACTIVITY_IMPL}</CodeBlock>
              <Admonition type="tip" title="Why you use Activities">
                <p>
                  Temporal Workflows have{" "}
                  <a href="https://docs.temporal.io/workflows#deterministic-constraints" target="_blank" rel="noopener noreferrer">deterministic constraints</a>{" "}
                  - they must produce the same output given the same input. Non-deterministic work like file or
                  network access must be done by Activities. Use Activities for business logic and Workflows to
                  coordinate them.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="retry-policy">
              <h2 className={styles.sectionTitle}>Set the Retry Policy</h2>
              <p>
                If an Activity fails, Temporal Workflows automatically retry it by default. You can customize how
                through the Retry Policy:
              </p>
              <CodeBlock language="java" title="MoneyTransferWorkflowImpl.java">{RETRY_POLICY}</CodeBlock>
              <p>
                In this example, Temporal will retry the failed Activity up to 5000 attempts, with backoff. If the
                deposit Activity fails, the Workflow attempts to refund the money to the source account.
              </p>
              <Admonition type="caution" title="This is a simplified example">
                <p>
                  Transferring money is a tricky subject, and this tutorial doesn't cover all the edge cases. In
                  production you'd add more advanced logic - including a "human in the loop" step where someone is
                  notified of refund issues and can intervene.
                </p>
              </Admonition>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/java/dev_environment/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous
                </span>
                <span className={styles.chapterNavTitle}>Set up your dev environment</span>
              </Link>
              <Link to="/getting_started/java/first_program_in_java/run/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
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
