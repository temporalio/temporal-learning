// Tutorial chapter 1 of 3: Understand the .NET money-transfer application.
// Canonical code: https://github.com/temporalio/money-transfer-project-template-dotnet

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "application-overview", label: "Application overview" },
  { id: "download", label: "Download the example app" },
  { id: "workflow-definition", label: "Workflow Definition" },
  { id: "activity-definition", label: "Activity Definition" },
  { id: "retry-policy", label: "Set the Retry Policy" },
];

const WORKFLOW_CS = `namespace Temporalio.MoneyTransferProject.MoneyTransferWorker;
using Temporalio.MoneyTransferProject.BankingService.Exceptions;
using Temporalio.Workflows;
using Temporalio.Common;
using Temporalio.Exceptions;

[Workflow]
public class MoneyTransferWorkflow
{
    [WorkflowRun]
    public async Task<string> RunAsync(PaymentDetails details)
    {
        var retryPolicy = new RetryPolicy
        {
            InitialInterval = TimeSpan.FromSeconds(1),
            MaximumInterval = TimeSpan.FromSeconds(100),
            BackoffCoefficient = 2,
            MaximumAttempts = 3,
            NonRetryableErrorTypes = new[] { "InvalidAccountException", "InsufficientFundsException" }
        };

        string withdrawResult;
        try
        {
            withdrawResult = await Workflow.ExecuteActivityAsync(
                () => BankingActivities.WithdrawAsync(details),
                new ActivityOptions { StartToCloseTimeout = TimeSpan.FromMinutes(5), RetryPolicy = retryPolicy }
            );
        }
        catch (ApplicationFailureException ex) when (ex.ErrorType == "InsufficientFundsException")
        {
            throw new ApplicationFailureException("Withdrawal failed due to insufficient funds.", ex);
        }

        string depositResult;
        try
        {
            depositResult = await Workflow.ExecuteActivityAsync(
                () => BankingActivities.DepositAsync(details),
                new ActivityOptions { StartToCloseTimeout = TimeSpan.FromMinutes(5), RetryPolicy = retryPolicy }
            );
            return $"Transfer complete (transaction IDs: {withdrawResult}, {depositResult})";
        }
        catch (Exception depositEx)
        {
            try
            {
                string refundResult = await Workflow.ExecuteActivityAsync(
                    () => BankingActivities.RefundAsync(details),
                    new ActivityOptions { StartToCloseTimeout = TimeSpan.FromMinutes(5), RetryPolicy = retryPolicy }
                );
                throw new ApplicationFailureException(
                    $"Failed to deposit money into account {details.TargetAccount}. Money returned to {details.SourceAccount}.", depositEx);
            }
            catch (Exception refundEx)
            {
                throw new ApplicationFailureException(
                    $"Failed to deposit into {details.TargetAccount}. Refund failed: {refundEx.Message}", refundEx);
            }
        }
    }
}`;

const PAYMENT_DETAILS_CS = `namespace Temporalio.MoneyTransferProject.MoneyTransferWorker;

public record PaymentDetails(
    string SourceAccount,
    string TargetAccount,
    int Amount,
    string ReferenceId);`;

const ACTIVITY_WITHDRAW = `namespace Temporalio.MoneyTransferProject.MoneyTransferWorker;
using Temporalio.Activities;
using Temporalio.Exceptions;

public class BankingActivities
{
    [Activity]
    public static async Task<string> WithdrawAsync(PaymentDetails details)
    {
        var bankService = new BankingService("bank1.example.com");
        Console.WriteLine($"Withdrawing \${details.Amount} from account {details.SourceAccount}.");
        try
        {
            return await bankService.WithdrawAsync(details.SourceAccount, details.Amount, details.ReferenceId);
        }
        catch (Exception ex)
        {
            throw new ApplicationFailureException("Withdrawal failed", ex);
        }
    }
}`;

const ACTIVITY_DEPOSIT = `[Activity]
public static async Task<string> DepositAsync(PaymentDetails details)
{
    var bankService = new BankingService("bank2.example.com");
    Console.WriteLine($"Depositing \${details.Amount} into account {details.TargetAccount}.");

    // Uncomment below and comment out the try-catch block below to simulate unknown failure
    /*
    return await bankService.DepositThatFailsAsync(details.TargetAccount, details.Amount, details.ReferenceId);
    */

    try
    {
        return await bankService.DepositAsync(details.TargetAccount, details.Amount, details.ReferenceId);
    }
    catch (Exception ex)
    {
        throw new ApplicationFailureException("Deposit failed", ex);
    }
}`;

const RETRY_POLICY = `var retryPolicy = new RetryPolicy
{
    InitialInterval = TimeSpan.FromSeconds(1),
    MaximumInterval = TimeSpan.FromSeconds(100),
    BackoffCoefficient = 2,
    MaximumAttempts = 3,
    NonRetryableErrorTypes = new[] { "InvalidAccountException", "InsufficientFundsException" }
};`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Understand the application - Run your first Temporal .NET app"
      description="Chapter 1: Download and explore the .NET money-transfer Workflow and its Activities."
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
                  { label: "Get Started", href: "/start" },
                  { label: ".NET", href: "/getting_started/dotnet" },
                  { label: "First program", href: "/getting_started/dotnet/first_program_in_dotnet/" },
                  { label: "Understand the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run your first Temporal application with the .NET SDK</h1>

            <MetaChips items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll run your first Temporal Application using the{" "}
              <a href="https://github.com/temporalio/sdk-dotnet" target="_blank" rel="noopener noreferrer">.NET SDK</a>.
              You'll use the Web UI for state visibility, then explore how Temporal helps you recover from common failures.
            </p>

            <Admonition type="note" title="What you'll do">
              <ul>
                <li>Explore Temporal's core terminology and concepts.</li>
                <li>Run a Temporal Workflow Application using a Temporal Cluster and the .NET SDK.</li>
                <li>Practice reviewing the state of the Workflow.</li>
                <li>Understand the inherent reliability of Workflow methods.</li>
              </ul>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li><Link to="/getting_started/dotnet/dev_environment/">Set up a local development environment for developing Temporal Applications with .NET</Link></li>
                <li>Ensure you have Git installed to clone the project.</li>
              </ul>
            </section>

            <section className={styles.section} id="application-overview">
              <h2 className={styles.sectionTitle}>Application overview</h2>
              <p>
                The project simulates a money transfer application: withdrawals, deposits, and refunds. If the
                deposit fails after a successful withdrawal, the money returns to the original account via a
                compensating <code>RefundAsync</code> Activity.
              </p>
              <p>
                Temporal automatically preserves application state when something fails - recovering processes
                where they left off or rolling them back.
              </p>
            </section>

            <section className={styles.section} id="download">
              <h2 className={styles.sectionTitle}>Download the example application</h2>
              <p>
                The source code is available in a{" "}
                <a href="https://github.com/temporalio/money-transfer-project-template-dotnet" target="_blank" rel="noopener noreferrer">GitHub repository</a>. Clone it:
              </p>
              <CodeBlock language="bash">git clone https://github.com/temporalio/money-transfer-project-template-dotnet</CodeBlock>
              <CodeBlock language="bash">cd money-transfer-temporal-template-dotnet</CodeBlock>
            </section>

            <section className={styles.section} id="workflow-definition">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>
                A Workflow Definition in .NET is marked by the <code>[Workflow]</code> attribute on the class. The{" "}
                <code>[WorkflowRun]</code> attribute marks the entry-point method:
              </p>
              <CodeBlock language="csharp" title="MoneyTransferWorker/Workflow.cs">{WORKFLOW_CS}</CodeBlock>
              <p>The input type is a <code>PaymentDetails</code> record:</p>
              <CodeBlock language="csharp" title="MoneyTransferWorker/PaymentDetails.cs">{PAYMENT_DETAILS_CS}</CodeBlock>
              <Admonition type="tip">
                <p>
                  It's a good practice to send a single object into a Workflow as its input, rather than multiple
                  separate input variables.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="activity-definition">
              <h2 className={styles.sectionTitle}>Activity Definition</h2>
              <p>
                Mark a method within a class as an Activity by adding the <code>[Activity]</code> attribute. The{" "}
                <code>WithdrawAsync()</code> Activity calls a service to process the withdrawal:
              </p>
              <CodeBlock language="csharp" title="MoneyTransferWorker/Activities.cs">{ACTIVITY_WITHDRAW}</CodeBlock>
              <p>The <code>DepositAsync()</code> Activity looks almost identical:</p>
              <CodeBlock language="csharp" title="MoneyTransferWorker/Activities.cs">{ACTIVITY_DEPOSIT}</CodeBlock>
              <p>The commented block is what you'll uncomment later to simulate an unknown failure.</p>
              <Admonition type="tip" title="Why you use Activities">
                <p>
                  Temporal Workflows have{" "}
                  <a href="https://docs.temporal.io/workflows#deterministic-constraints" target="_blank" rel="noopener noreferrer">deterministic constraints</a>{" "}
                  and must produce the same output each time, given the same input. Non-deterministic work like file
                  or network access must be done by Activities.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="retry-policy">
              <h2 className={styles.sectionTitle}>Set the Retry Policy</h2>
              <p>
                If an Activity fails, Temporal Workflows automatically retry. The Retry Policy at the top of the
                Workflow customizes how:
              </p>
              <CodeBlock language="csharp" title="MoneyTransferWorker/Workflow.cs">{RETRY_POLICY}</CodeBlock>
              <p>
                In this example, Temporal retries the failed Activity up to 3 times, with exponential backoff. If
                the Workflow encounters <code>InsufficientFundsException</code> or <code>InvalidAccountException</code>,
                it won't retry - and if the deposit fails, the Workflow attempts to refund the money to the source
                account.
              </p>
              <Admonition type="caution" title="This is a simplified example">
                <p>
                  In production you'd add more advanced logic - including a "human in the loop" step where someone
                  is notified of refund issues and can intervene.
                </p>
              </Admonition>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/dotnet/dev_environment/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous
                </span>
                <span className={styles.chapterNavTitle}>Set up your dev environment</span>
              </Link>
              <Link to="/getting_started/dotnet/first_program_in_dotnet/run/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
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
