// Tutorial chapter 1 of 3: Understand the TypeScript money-transfer application.
// Canonical code: https://github.com/temporalio/money-transfer-project-template-ts

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "application-overview", label: "Application overview" },
  { id: "download", label: "Download the example app" },
  { id: "workflow-definition", label: "Workflow Definition" },
  { id: "activity-definition", label: "Activity Definition" },
  { id: "retry-policy", label: "Set the Retry Policy" },
];

const WORKFLOWS_TS = `import { proxyActivities } from '@temporalio/workflow';
import { ApplicationFailure } from '@temporalio/common';

import type * as activities from './activities';
import type { PaymentDetails } from './shared';

export async function moneyTransfer(details: PaymentDetails): Promise<string> {
  const { withdraw, deposit, refund } = proxyActivities<typeof activities>({
    retry: {
      initialInterval: '1 second',
      maximumInterval: '1 minute',
      backoffCoefficient: 2,
      maximumAttempts: 500,
      nonRetryableErrorTypes: ['InvalidAccountError', 'InsufficientFundsError'],
    },
    startToCloseTimeout: '1 minute',
  });

  let withdrawResult: string;
  try {
    withdrawResult = await withdraw(details);
  } catch (withdrawErr) {
    throw new ApplicationFailure(\`Withdrawal failed. Error: \${withdrawErr}\`);
  }

  let depositResult: string;
  try {
    depositResult = await deposit(details);
  } catch (depositErr) {
    let refundResult;
    try {
      refundResult = await refund(details);
      throw ApplicationFailure.create({
        message: \`Failed to deposit into account \${details.targetAccount}. Money returned to \${details.sourceAccount}.\`,
      });
    } catch (refundErr) {
      throw ApplicationFailure.create({
        message: \`Failed to deposit into account \${details.targetAccount}. Refund failed.\`,
      });
    }
  }
  return \`Transfer complete (transaction IDs: \${withdrawResult}, \${depositResult})\`;
}`;

const SHARED_TS = `export type PaymentDetails = {
  amount: number;
  sourceAccount: string;
  targetAccount: string;
  referenceId: string;
};`;

const ACTIVITY_WITHDRAW = `import type { PaymentDetails } from './shared';
import { BankingService } from './banking-client';

export async function withdraw(details: PaymentDetails): Promise<string> {
  console.log(\`Withdrawing $\${details.amount} from account \${details.sourceAccount}.\\n\\n\`);
  const bank1 = new BankingService('bank1.example.com');
  return await bank1.withdraw(
    details.sourceAccount,
    details.amount,
    details.referenceId
  );
}`;

const ACTIVITY_DEPOSIT = `export async function deposit(details: PaymentDetails): Promise<string> {
  console.log(\`Depositing $\${details.amount} into account \${details.targetAccount}.\\n\\n\`);
  const bank2 = new BankingService('bank2.example.com');
  // Uncomment lines 25-29 and comment lines 30-34 to simulate an unknown failure
  // return await bank2.depositThatFails(
  //   details.targetAccount,
  //   details.amount,
  //   details.referenceId
  // );
  return await bank2.deposit(
    details.targetAccount,
    details.amount,
    details.referenceId
  );
}`;

const RETRY_POLICY = `const { withdraw, deposit, refund } = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second',
    maximumInterval: '1 minute',
    backoffCoefficient: 2,
    maximumAttempts: 500,
    nonRetryableErrorTypes: ['InvalidAccountError', 'InsufficientFundsError'],
  },
  startToCloseTimeout: '1 minute',
});`;

const IMG_BASE = "/img/getting_started/typescript/first_program_in_typescript";

export default function Chapter1Page() {
  return (
    <Layout
      title="Understand the application - Run your first Temporal TypeScript app"
      description="Chapter 1: Download and explore the TypeScript money-transfer Workflow and its Activities."
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
                  { label: "Understand the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run your first Temporal application with the TypeScript SDK</h1>

            <MetaChips items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll run your first Temporal Application using the{" "}
              <a href="https://github.com/temporalio/sdk-typescript" target="_blank" rel="noopener noreferrer">TypeScript SDK</a>.
              You'll use the Web UI for state visibility, then explore how Temporal helps you recover from common failures.
            </p>

            <Admonition type="note" title="What you'll do">
              <ul>
                <li>Explore Temporal's core terminology and concepts.</li>
                <li>Run a Temporal Workflow Application using a Temporal Cluster and the TypeScript SDK.</li>
                <li>Practice reviewing the state of the Workflow.</li>
                <li>Understand the inherent reliability of Workflow functions.</li>
              </ul>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li><Link to="/getting_started/typescript/dev_environment/">Set up a local development environment for developing Temporal Applications with TypeScript</Link></li>
                <li>Ensure you have Git installed to clone the project.</li>
              </ul>
            </section>

            <section className={styles.section} id="application-overview">
              <h2 className={styles.sectionTitle}>Application overview</h2>
              <p>
                The project simulates a money transfer application: withdrawals, deposits, and refunds. Money comes
                out of one account and goes into another. If the withdrawal succeeds but the deposit fails, the money
                needs to go back to the original account.
              </p>
              <p>The following diagram illustrates what happens when you start the Workflow:</p>
              <p>
                <img src={`${IMG_BASE}/temporal-high-level-application-design.png`} alt="High level project design" className={styles.diagramImage} />
              </p>
              <p>
                The Temporal Server doesn't run your code. Your Worker, Workflow, and Activity run on your
                infrastructure, along with the rest of your applications.
              </p>
            </section>

            <section className={styles.section} id="download">
              <h2 className={styles.sectionTitle}>Download the example application</h2>
              <p>
                The application is available in a{" "}
                <a href="https://github.com/temporalio/money-transfer-project-template-ts/" target="_blank" rel="noopener noreferrer">GitHub repository</a>. Clone it:
              </p>
              <CodeBlock language="bash">git clone https://github.com/temporalio/money-transfer-project-template-ts/</CodeBlock>
              <CodeBlock language="bash">cd money-transfer-project-template-ts</CodeBlock>
              <Admonition type="tip">
                <p>The repository is a GitHub Template, so you can clone it to your own account and use it as the foundation for your own Temporal application.</p>
              </Admonition>
            </section>

            <section className={styles.section} id="workflow-definition">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>A Workflow Definition in TypeScript is a regular TypeScript function that accepts some input values:</p>
              <CodeBlock language="typescript" title="src/workflows.ts">{WORKFLOWS_TS}</CodeBlock>
              <p>
                The <code>moneyTransfer</code> function takes transaction details, executes Activities, and returns
                the result. The <code>PaymentDetails</code> input type is defined in <code>shared.ts</code>:
              </p>
              <CodeBlock language="typescript" title="src/shared.ts">{SHARED_TS}</CodeBlock>
              <Admonition type="tip">
                <p>It's a good practice to send a single, serializable data structure into a Workflow as its input.</p>
              </Admonition>
            </section>

            <section className={styles.section} id="activity-definition">
              <h2 className={styles.sectionTitle}>Activity Definition</h2>
              <p>
                Activities are where you perform the business logic. The <code>withdraw</code> Activity calls a
                service to process the withdrawal:
              </p>
              <CodeBlock language="typescript" title="src/activities.ts">{ACTIVITY_WITHDRAW}</CodeBlock>
              <p>The <code>deposit</code> Activity looks almost identical:</p>
              <CodeBlock language="typescript" title="src/activities.ts">{ACTIVITY_DEPOSIT}</CodeBlock>
              <p>The commented lines are what you'll use later to simulate a failure.</p>
              <Admonition type="tip" title="Why you use Activities">
                <p>
                  Temporal Workflows have{" "}
                  <a href="https://docs.temporal.io/workflows#deterministic-constraints" target="_blank" rel="noopener noreferrer">deterministic constraints</a>{" "}
                  - they need to be replayable. Use Activities for business logic and Workflows to coordinate.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="retry-policy">
              <h2 className={styles.sectionTitle}>Set the Retry Policy</h2>
              <p>
                If an Activity fails, Temporal Workflows automatically retry. At the top of the Workflow you'll see
                a Retry Policy:
              </p>
              <CodeBlock language="typescript" title="src/workflows.ts">{RETRY_POLICY}</CodeBlock>
              <p>
                By default, Temporal retries failed Activities forever. This example sets a max of 500 attempts and
                marks <code>InvalidAccountError</code> and <code>InsufficientFundsError</code> as non-retryable.
              </p>
              <Admonition type="caution" title="This is a simplified example">
                <p>
                  In production you'd add more advanced logic - including a "human in the loop" step where someone
                  is notified of refund issues and can intervene.
                </p>
              </Admonition>
            </section>

            <div className={styles.chapterNav}>
              <Link to="/getting_started/typescript/dev_environment/" className={styles.chapterNavCard}>
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>←</span> Previous
                </span>
                <span className={styles.chapterNavTitle}>Set up your dev environment</span>
              </Link>
              <Link to="/getting_started/typescript/first_program_in_typescript/run/" className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}>
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
