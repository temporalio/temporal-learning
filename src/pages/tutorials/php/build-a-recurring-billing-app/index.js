import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";
import { OutdatedNotice } from "@site/src/components";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-the-workflow", label: "Create the Workflow" },
  { id: "start-end-trial", label: "Start/End Trial" },
  { id: "receive-cancellations", label: "Receive Cancellations" },
  { id: "monthly-subscription-handling", label: "Monthly Subscription Handling" },
  { id: "conclusion", label: "Conclusion" },
];

const WORKFLOW_INTERFACE = `#[WorkflowInterface]
interface SubscriptionWorkflowInterface
{
    #[WorkflowMethod]
    public function subscribe(string $userID);
}`;

const SUBSCRIBE_COMMAND = `class SubscribeCommand extends Command
{
    protected const NAME = 'subscribe:start';
    protected const DESCRIPTION = 'Execute Subscription\\SubscriptionWorkflow with custom user ID';

    protected const ARGUMENTS = [
        ['userID', InputArgument::REQUIRED, 'Unique user ID']
    ];

    public function execute(InputInterface $input, OutputInterface $output)
    {
        $userID = $input->getArgument('userID');

        $workflow = $this->workflowClient->newWorkflowStub(
            SubscriptionWorkflowInterface::class,
            WorkflowOptions::new()
                ->withWorkflowId('subscription:' . $userID)
                ->withWorkflowIdReusePolicy(IdReusePolicy::POLICY_ALLOW_DUPLICATE)
        );

        $output->writeln("Start <comment>SubscriptionWorkflow</comment>... ");

        try {
            $run = $this->workflowClient->start($workflow, $userID);
        } catch (WorkflowExecutionAlreadyStartedException $e) {
            $output->writeln('<fg=red>Already running</fg=red>');
            return self::SUCCESS;
        }

        $output->writeln(
            sprintf(
                'Started: WorkflowID=<fg=magenta>%s</fg=magenta>',
                $run->getExecution()->getID(),
            )
        );

        return self::SUCCESS;
    }
}`;

const SUBSCRIPTION_WORKFLOW_SCAFFOLD = `class SubscriptionWorkflow implements SubscriptionWorkflowInterface
{
    private $account;

    public function __construct()
    {
        $this->account = Workflow::newActivityStub(
            AccountActivityInterface::class,
            ActivityOptions::new()
                ->withScheduleToCloseTimeout(CarbonInterval::seconds(2))
        );
    }

    public function subscribe(string $userID)
    {
        // ...
    }
}`;

const SUBSCRIBE_TRIAL_BODY = `public function subscribe(string $userID)
{
    yield $this->account->sendWelcomeEmail($userID);
    yield Workflow::timer(CarbonInterval::month());
    yield $this->account->sendEndOfTrialEmail($userID);
}`;

const CANCEL_COMMAND = `class CancelCommand extends Command
{
    protected const NAME = 'subscribe:cancel';
    protected const DESCRIPTION = 'Cancel Subscription\\SubscriptionWorkflow for user ID';

    protected const ARGUMENTS = [
        ['userID', InputArgument::REQUIRED, 'Unique user ID']
    ];

    public function execute(InputInterface $input, OutputInterface $output)
    {
        $userID = $input->getArgument('userID');
        $workflow = $this->workflowClient->newUntypedRunningWorkflowStub('subscription:' . $userID);

        try {
            $workflow->cancel();
            $output->writeln('Cancelled');
        } catch (WorkflowNotFoundException $e) {
            $output->writeln('<fg=red>Already stopped</fg=red>');
        }

        return self::SUCCESS;
    }
}`;

const SUBSCRIBE_WITH_CANCEL = `public function subscribe(string $userID)
{
    yield $this->account->sendWelcomeEmail($userID);

    try {
        yield Workflow::timer(CarbonInterval::month());
        yield $this->account->sendEndOfTrialEmail($userID);
    } catch (CanceledFailure $exception) {
         yield Workflow::asyncDetached(fn() => $this->account->sendSorryToSeeYouGoEmail($userID));
    }
}`;

const SIGNAL_AWAIT_SNIPPET = `yield Workflow::awaitWithTimeout(
    CarbonInterval::month(),
    fn() => $this->isCancelled
);`;

const FULL_SUBSCRIBE = `public function subscribe(string $userID)
{
    yield $this->account->sendWelcomeEmail($userID);

    try {
        $isTrialPeriod = true;
        while (true) {
            yield Workflow::timer(CarbonInterval::month());
            yield $this->account->chargeMonthlyFee($userID);

            if ($isTrialPeriod === true) {
                yield $this->account->sendEndOfTrialEmail($userID);
                $isTrialPeriod = false;
                continue;
            }

            yield $this->account->sendMonthlyChargeEmail($userID);
        }
    } catch (CanceledFailure $exception) {
        yield $this->account->sendSorryToSeeYouGoEmail($userID);
    }
}`;

const ACCOUNT_ACTIVITY = `class AccountActivity implements AccountActivityInterface
{
    private LoggerInterface $logger;

    public function __construct()
    {
        $this->logger = new Logger();
    }

    public function sendWelcomeEmail(string $userID): void
    {
        $this->log('Send welcome email to %s', $userID);
    }

    public function chargeMonthlyFee(string $userID): void
    {
        $this->log('Charge %s of monthly fee', $userID);
    }

    public function sendEndOfTrialEmail(string $userID): void
    {
        $this->log('Send %s end of trial email', $userID);
    }

    public function sendMonthlyChargeEmail(string $userID): void
    {
        $this->log('Send %s monthly charge email', $userID);
    }

    public function sendSorryToSeeYouGoEmail(string $userID): void
    {
        $this->log('Send %s sorry to see you go email', $userID);
    }

    public function processSubscriptionCancellation(string $userID): void
    {
        $this->log('Cancel subscription for %s', $userID);
    }

    /**
     * @param string $message
     * @param mixed ...$arg
     */
    private function log(string $message, ...$arg)
    {
        // by default all error logs are forwarded to the application server log and docker log
        $this->logger->debug(sprintf($message, ...$arg));
    }
}`;

export default function BuildRecurringBillingAppPage() {
  return (
    <Layout
      title="Build a recurring billing subscription system with PHP"
      description="Build a realistic monthly subscription payments workflow that can be canceled while it runs."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_php.png"
            alt="Temporal PHP SDK"
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
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "PHP", href: "/tutorials/php" },
                  { label: "Build a recurring billing subscription system" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a recurring billing subscription system with PHP
            </h1>

            <MetaChips items={["~45 minutes", "Beginner", "PHP"]} />

            <p className={styles.intro}>
              In this tutorial you'll build a realistic monthly subscription
              payments workflow that can be canceled while it runs. You'll
              combine timers, cancellation handling, and detached coroutines
              to model a long-running subscription as a single, durable
              Workflow.
            </p>

            <OutdatedNotice />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                In this tutorial you'll build a realistic monthly subscription
                payments workflow that can be canceled while it runs.
              </p>
              <p>
                Our task is to write a Workflow for a limited time
                Subscription (eg a 12-month Phone plan) that satisfies the
                following conditions:
              </p>
              <ol>
                <li>
                  When the user signs up,{" "}
                  <strong>send a welcome email</strong> and start a free trial
                  for <code>TrialPeriod</code>.
                </li>
                <li>
                  When the <code>TrialPeriod</code> expires: charge a monthly
                  fee.
                </li>
                <li>When charging a fee send a corresponding email.</li>
                <li>
                  At any point while subscription (or trial) is ongoing, be
                  able to cancel subscription with sending a{" "}
                  <strong>cancellation email</strong>.
                </li>
              </ol>
              <p>
                Of course, this all has to be fault-tolerant, scalable to
                millions of customers, testable, maintainable, observable -
                and so on.
              </p>
              <p>
                <strong>
                  To skip straight to a fully working example, you can check
                  out the{" "}
                  <a
                    href="https://github.com/temporalio/samples-php/tree/master/app/src/Subscription"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Subscription Workflow repo
                  </a>
                  .
                </strong>
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  <Link to="/getting_started/php/dev_environment/">
                    Set up a local development environment for developing
                    Temporal applications using PHP
                  </Link>
                  .
                </li>
                <li>
                  Review the{" "}
                  <Link to="/getting_started/php/hello_world_in_php/">
                    Hello World in PHP tutorial
                  </Link>{" "}
                  and understand the basics of getting a Temporal PHP SDK
                  project up and running.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-the-workflow">
              <h2 className={styles.sectionTitle}>Create the Workflow</h2>
              <p>
                The whole process of <em>"creating a subscription"</em> is too
                complicated; we need to break it into small manageable pieces
                and build it up incrementally.
              </p>
              <p>
                We can start building the whole thing step by step. Start
                with subscribing a user (<code>subscribe($userId)</code>):
              </p>
              <CodeBlock language="php">{WORKFLOW_INTERFACE}</CodeBlock>
              <p>
                Having this interface we can start building our app. First, we
                need a console command - a PHP script that takes some input
                and starts the workflow.
              </p>
              <CodeBlock language="php">{SUBSCRIBE_COMMAND}</CodeBlock>
              <p>
                In the snippet above we grab userId as an input and use it to
                start the workflow. Also, userId is used as a workflow
                identifier (<code>'subscription:' . $userID</code>). Later it
                will be used to cancel the subscription. Now, let's implement
                the workflow - a long-running process that represents user
                subscription business process.
              </p>
            </section>

            <section className={styles.section} id="start-end-trial">
              <h2 className={styles.sectionTitle}>Start/End Trial</h2>
              <p>
                The first requirement is about starting trial period and
                sending emails: when the trial period starts and ends. We
                don't have any activities yet, but we can start coding and
                think about the interface. Assume that we have{" "}
                <code>AccountActivityInterface</code> which handles all the
                subscription components:
              </p>
              <CodeBlock language="php">
                {SUBSCRIPTION_WORKFLOW_SCAFFOLD}
              </CodeBlock>

              <Admonition type="info" title="Activity implementation">
                <p>
                  We consider activity implementation as an implementation
                  detail, so it is out of scope. When building this
                  subscription workflow we will walk through the business
                  process and use only activity interfaces. It is up to you
                  to implement all other details.
                </p>
              </Admonition>

              <p>
                The method <code>subscribe(string $userID)</code> contains all
                the business logic. First, we send an email that the trial
                period has started. Then we start a trial for (let's say) 30
                days. Once the period ends, we send a corresponding email:
              </p>
              <CodeBlock language="php">{SUBSCRIBE_TRIAL_BODY}</CodeBlock>
              <p>
                As you can see, we delegate email sending to the activity and
                use timer to wait for a trial period to finish.
              </p>
              <ul>
                <li>
                  In other words, what happens here? The workflow sends the
                  first email, then it <em>sleeps</em> for 30 days, and then
                  sends one more email. Looks very elegant, right?
                </li>
                <li>
                  It looks like a regular PHP <code>sleep()</code> call. But
                  inside the workflow we cannot use any functions that may
                  cause side effects, thus we use <code>Workflow::timer</code>{" "}
                  here.
                </li>
              </ul>

              <Admonition type="note" title="Comparing Temporal's Timer vs PHP's sleep()">
                <p>
                  Using <code>Workflow::timer</code> is safer because it is
                  persisted to Temporal Server with a server-side timer. If
                  any part of your system (App, Worker, even Temporal Server
                  itself) crashes, then after restart it will continue right
                  from the crash and not from scratch. It means that if the
                  workflow has been waiting for 29 days and then crashes, it
                  will be able to recover and continue from where it left off.
                  This is not possible when using native PHP{" "}
                  <code>sleep()</code> function.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="receive-cancellations">
              <h2 className={styles.sectionTitle}>Receive Cancellations</h2>
              <p>
                Per Requirement 4, users can cancel during the trial. Once the
                trial period or subscription is cancelled, we should email
                the user.
              </p>
              <p>
                How can we implement subscription cancellation? There are
                several ways to do it, but the simplest is just to use
                Temporal's API to cancel the entire workflow. We will need a
                separate console command for cancellation:
              </p>
              <CodeBlock language="php">{CANCEL_COMMAND}</CodeBlock>
              <p>
                This command accepts <code>$userId</code> as an input
                argument, then fetches the workflow with id of{" "}
                <code>subscription:$userID</code> and tries to cancel it.
              </p>
              <p>
                Next, we can handle cancellation within the running workflow.
                Once the running workflow is cancelled{" "}
                <code>CancelledFailure</code> exception is thrown. We can
                catch it and send an email like this:
              </p>
              <CodeBlock language="php">{SUBSCRIBE_WITH_CANCEL}</CodeBlock>
              <p>
                Here we catch <code>CanceledFailure</code> and continue with
                activity to send a cancellation email.
              </p>
              <p>
                Why do we use Temporal's <code>Workflow::asyncDetached()</code>{" "}
                instead of plain PHP <code>yield</code>? We are using "native
                way" to cancel a business process (a workflow) here. When a
                workflow is cancelled, all internal coroutines will be also
                cancelled.{" "}
                <strong>
                  The email should be sent even if the main workflow is
                  already closed.
                </strong>{" "}
                Thus, we need to run it into a detached coroutine, that
                doesn't belong to the workflow.
              </p>
              <p>
                <code>Workflow::asyncDetached()</code> does this job:
                everything inside the callback will be executed inside the
                detached coroutine, that doesn't belong to the calling
                workflow. Exactly what we need here. Having that actually we
                can handle any cancellations: trial or monthly subscription.
                So, let's continue and finally implement subscription
                workflow.
              </p>

              <Admonition type="info" title="Why not use a Signal?">
                <p>
                  Another way to cancel the subscription is to send a{" "}
                  <a
                    href="https://docs.temporal.io/dev-guide/php/features#signals"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    signal
                  </a>{" "}
                  to the workflow. For example, we can wait with condition:
                </p>
                <CodeBlock language="php">{SIGNAL_AWAIT_SNIPPET}</CodeBlock>
                <p>
                  It is a valid approach, but cancelling the workflow with{" "}
                  <code>cancel()</code> method we may be 100% sure that all
                  internal processes and activities will be gracefully shut
                  down.
                </p>
              </Admonition>
            </section>

            <section
              className={styles.section}
              id="monthly-subscription-handling"
            >
              <h2 className={styles.sectionTitle}>
                Monthly Subscription Handling
              </h2>
              <p>
                At this moment we have a working trial period that can be
                cancelled. To finish our workflow we need to add several
                steps:
              </p>
              <ul>
                <li>charge a monthly fee</li>
                <li>send monthly charged email</li>
                <li>process subscription cancellation</li>
              </ul>
              <p>
                If we assume that the subscription period is 30 days, and it
                should last until it is manually cancelled, then we can use
                an infinite loop here (subject to{" "}
                <a
                  href="https://docs.temporal.io/workflows/#event-history"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event History Limits
                </a>
                , but don't worry about that for a monthly workflow). We
                "endlessly" wait for 30 days and charge monthly fee. Also,
                don't forget about the trial period at the beginning.
              </p>
              <CodeBlock language="php">{FULL_SUBSCRIBE}</CodeBlock>
              <p>
                In the snippet above we have a new flag{" "}
                <code>$isTrialPeriod = true</code>. After the first loop
                iteration we finish the trial:
              </p>
              <ul>
                <li>charge monthly fee</li>
                <li>
                  change <code>$isTrialPeriod</code> flag to <code>false</code>
                </li>
                <li>a corresponding email is sent</li>
                <li>move to the next loop iteration</li>
              </ul>
              <p>
                On the next iteration we again wait for 30 days, charge
                monthly fee and send email. The last thing we need to do is
                to handle subscription cancellation, where we just send our
                cancellation email, but you can do whatever other cleanup
                tasks you want.
              </p>
              <p>
                If you want to test things you can use this "dummy" activity
                implementation that logs each step to the screen:
              </p>
              <CodeBlock language="php">{ACCOUNT_ACTIVITY}</CodeBlock>
              <p>Register this Activity and add it to your workflow.</p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You have created a complete subscription workflow that can:
              </p>
              <ul>
                <li>handle trial periods</li>
                <li>charge monthly fee every N days</li>
                <li>handle subscription cancellations</li>
              </ul>
              <p>
                With Temporal, you can write a relatively complex business
                process with fewer lines of code, and the Workflow code
                provides you with a high-level view of the business process
                without digging into deeper details.
              </p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/php/build_a_trip_booking_app/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Next tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Build a trip booking system with PHP
                  </h3>
                  <p className={styles.nextBody}>
                    Explore the Temporal Booking Saga code sample and learn
                    how to coordinate distributed transactions with
                    compensations.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link to="/tutorials/php/" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>All PHP tutorials</span>
                  <h3 className={styles.nextTitle}>Back to PHP tutorials</h3>
                  <p className={styles.nextBody}>
                    Browse the rest of the PHP tutorials and continue building
                    Temporal applications with PHP.
                  </p>
                  <span className={styles.nextCta}>
                    View tutorials <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
