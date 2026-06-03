// Hello World in PHP: single-page walkthrough of the SimpleActivity sample.
// Canonical code lives at https://github.com/temporalio/samples-php/tree/master/app/src/SimpleActivity.
// Update the *_PHP constants here when the upstream repo changes.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import { OutdatedNotice } from "@site/src/components";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "download", label: "Downloading the project" },
  { id: "run", label: "Run the application" },
  { id: "client", label: "The Workflow Client" },
  { id: "workflow", label: "Workflow interface and implementation" },
  { id: "activity", label: "Activity interface and implementation" },
  { id: "worker", label: "RoadRunner and Temporal Worker" },
  { id: "conclusion", label: "Conclusion" },
];

const RUN_OUTPUT = `Starting GreetingWorkflow...
Started: WorkflowID=3520711c-7c8b-4d36-bd18-68328e60447b
Result:
Hello Antony`;

const CLIENT_PHP = `class ExecuteCommand extends Command
{
    protected const NAME = 'simple-activity';
    protected const DESCRIPTION = 'Execute SimpleActivity\\GreetingWorkflow';

    public function execute(InputInterface $input, OutputInterface $output): int
    {
        $workflow = $this->workflowClient->newWorkflowStub(
            GreetingWorkflowInterface::class,
            WorkflowOptions::new()->withWorkflowExecutionTimeout(CarbonInterval::minute())
        );

        $output->writeln("Starting <comment>GreetingWorkflow</comment>... ");

        // Start a workflow execution. Usually this is done from another program.
        // Uses task queue from the GreetingWorkflow @WorkflowMethod annotation.
        $run = $this->workflowClient->start($workflow, 'Antony');

        $output->writeln(
            sprintf(
                'Started: WorkflowID=<fg=magenta>%s</fg=magenta>',
                $run->getExecution()->getID(),
            )
        );

        // getResult waits for workflow to complete
        $output->writeln(sprintf("Result:\\n<info>%s</info>", $run->getResult()));

        return self::SUCCESS;
    }
}`;

const WORKFLOW_INTERFACE_PHP = `use Temporal\\Workflow\\WorkflowInterface;
use Temporal\\Workflow\\WorkflowMethod;

#[WorkflowInterface]
interface GreetingWorkflowInterface
{
    /**
     * @param string $name
     * @return string
     */
    #[WorkflowMethod(name: "SimpleActivity.greet")]
    public function greet(
        string $name
    );
}`;

const WORKFLOW_PHP = `class GreetingWorkflow implements GreetingWorkflowInterface
{
    private $greetingActivity;

    public function __construct()
    {
        /**
         * Activity stub implements activity interface and proxies calls to it to Temporal activity
         * invocations. Because activities are reentrant, only a single stub can be used for multiple
         * activity invocations.
         */
        $this->greetingActivity = Workflow::newActivityStub(
            GreetingActivityInterface::class,
            ActivityOptions::new()->withStartToCloseTimeout(CarbonInterval::seconds(2))
        );
    }

    public function greet(string $name): \\Generator
    {
        // This is a blocking call that returns only after the activity has completed.
        return yield $this->greetingActivity->composeGreeting('Hello', $name);
    }
}`;

const ACTIVITY_INTERFACE_PHP = `use Temporal\\Activity\\ActivityInterface;
use Temporal\\Activity\\ActivityMethod;

#[ActivityInterface(prefix: 'SimpleActivity.')]
interface GreetingActivityInterface
{
    #[ActivityMethod(name: "ComposeGreeting")]
    public function composeGreeting(
        string $greeting,
        string $name
    ): string;
}`;

const ACTIVITY_PHP = `class GreetingActivity implements GreetingActivityInterface
{
    public function composeGreeting(string $greeting, string $name): string
    {
        return $greeting . ' ' . $name;
    }
}`;

const WORKER_PHP = `declare(strict_types=1);

use Temporal\\SampleUtils\\DeclarationLocator;
use Temporal\\WorkerFactory;

ini_set('display_errors', 'stderr');
include "vendor/autoload.php";

// finds all available workflows, activity types and commands in a given directory
$declarations = DeclarationLocator::create(__DIR__ . '/src/');

// factory initiates and runs task queue specific activity and workflow workers
$factory = WorkerFactory::create();

// Worker that listens on a task queue and hosts both workflow and activity implementations.
$worker = $factory->newWorker();

foreach ($declarations->getWorkflowTypes() as $workflowType) {
    // Workflows are stateful. So you need a type to create instances.
    $worker->registerWorkflowTypes($workflowType);
}

foreach ($declarations->getActivityTypes() as $activityType) {
    // Activities are stateless and thread safe. So a shared instance is used.
    $worker->registerActivity($activityType);
}

// start primary loop
$factory->run();`;

const REGISTER_WORKFLOW_PHP = `$worker->registerWorkflowTypes(HelloWorldWorkflow::class);`;

const REGISTER_ACTIVITY_PHP = `$worker->registerActivity(MyActivity::class);`;

export default function HelloWorldInPhpPage() {
  return (
    <Layout
      title="Run a Temporal Application in PHP"
      description="Explore the components that make up a Temporal project in PHP."
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
                  { label: "Get Started", href: "/start" },
                  { label: "PHP", href: "/getting_started/php" },
                  { label: "Hello World in PHP" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Run a Temporal Application in PHP
            </h1>

            <MetaChips
              items={["~10 minutes", "Temporal beginner", "Walkthrough"]}
            />

            <p className={styles.intro}>
              In this tutorial, you'll explore the different components that
              make up a Temporal project using the PHP SDK, including: Temporal
              Client, Workflow and Activity Code, Temporal Worker (running with{" "}
              <a
                href="https://roadrunner.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                RoadRunner
              </a>
              ).
            </p>

            <OutdatedNotice />

            <p>
              All the code on this page is included in the{" "}
              <a
                href="https://github.com/temporalio/samples-php/tree/master/app/src/SimpleActivity"
                target="_blank"
                rel="noopener noreferrer"
              >
                SimpleActivity
              </a>{" "}
              sample, from our{" "}
              <a
                href="https://github.com/temporalio/samples-php"
                target="_blank"
                rel="noopener noreferrer"
              >
                Samples repository
              </a>
              .
            </p>

            <section className={styles.section} id="download">
              <h2 className={styles.sectionTitle}>Downloading the project</h2>
              <p>
                Clone the project repository and navigate to the project
                directory:
              </p>
              <CodeBlock language="bash">
                git clone git@github.com:temporalio/samples-php.git
              </CodeBlock>
              <CodeBlock language="bash">cd samples-php</CodeBlock>
              <p>Start the Temporal Server and application containers:</p>
              <CodeBlock language="bash">docker-compose up</CodeBlock>
              <p>
                This starts Temporal Server with the{" "}
                <a
                  href="https://github.com/temporalio/samples-php/blob/master/docker-compose.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  docker-compose.yml
                </a>{" "}
                that ships with the <code>samples-php</code> repository. When
                it's live, you can access{" "}
                <a
                  href="https://docs.temporal.io/web-ui"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Web
                </a>{" "}
                at <code>http://localhost:8080</code> although you won't see
                any Workflows run yet.
              </p>
            </section>

            <section className={styles.section} id="run">
              <h2 className={styles.sectionTitle}>Run the application</h2>
              <p>
                The program you'll run is a console command that starts a
                workflow, prints its IDs, and then waits for its result.
              </p>
              <p>Execute the following command to run the program:</p>
              <CodeBlock language="bash">
                docker-compose exec app php app.php simple-activity
              </CodeBlock>
              <p>
                This prints the Workflow ID (and corresponding Run ID) that is
                started, and you'll see it reflected in the Temporal Web UI.
              </p>
              <p>At the end it will log the result:</p>
              <CodeBlock language="bash">{RUN_OUTPUT}</CodeBlock>
              <p>
                Let's explore each piece of the code and how it works with
                Temporal.
              </p>
            </section>

            <section className={styles.section} id="client">
              <h2 className={styles.sectionTitle}>The Workflow Client</h2>
              <p>
                In the following snippet, <code>WorkflowClientInterface</code>{" "}
                is the entry point to get access to workflows. When you need to
                create, retrieve, or start a workflow you'll use an instance of{" "}
                <code>WorkflowClientInterface</code>.
              </p>
              <p>
                Here we create an instance of{" "}
                <code>GreetingWorkflowInterface</code> with execution timeout
                of 1 minute. Then we print some information and start the
                workflow.
              </p>
              <CodeBlock language="php" title="app/src/SimpleActivity/ExecuteCommand.php">
                {CLIENT_PHP}
              </CodeBlock>
              <p>Now let's look at the workflow.</p>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>
                Workflow interface and implementation
              </h2>
              <p>
                With the PHP SDK, you define an interface and an
                implementation.
              </p>
              <p>First, let's take a look at the workflow interface:</p>
              <CodeBlock
                language="php"
                title="app/src/SimpleActivity/GreetingWorkflowInterface.php"
              >
                {WORKFLOW_INTERFACE_PHP}
              </CodeBlock>
              <p>
                The important thing here are attributes{" "}
                <code>#[WorkflowInterface]</code> and{" "}
                <code>#[WorkflowMethod]</code>. Both of them define the
                "workflow". The first one marks the class/interface, the
                second one marks the method in the class/interface.
              </p>
              <p>
                In our case the workflow is the method that accepts string{" "}
                <code>$name</code>. To see what it actually does, look at the
                implementation in the class <code>GreetingWorkflow</code>:
              </p>
              <CodeBlock
                language="php"
                title="app/src/SimpleActivity/GreetingWorkflow.php"
              >
                {WORKFLOW_PHP}
              </CodeBlock>
              <p>
                This is the implementation of our workflow. It communicates
                with one activity and delegates all the work to it.
              </p>
              <p>
                In the constructor we create an instance of the{" "}
                <code>GreetingActivityInterface</code> with maximum execution
                time of 2 seconds.
              </p>
              <p>
                In method <code>greet()</code> we call our activity.
              </p>
              <p>
                Here the workflow pauses and waits until the activity is done
                and only then returns the result.
              </p>
              <p>
                It is achieved with a call to <code>yield</code>.
              </p>
              <p>
                To instantiate an instance of the activity we use a static
                helper <code>Workflow::newActivityStub()</code>.
              </p>
            </section>

            <section className={styles.section} id="activity">
              <h2 className={styles.sectionTitle}>
                Activity interface and implementation
              </h2>
              <p>
                And at last we arrive at the activity code. Consider it as a
                particular task in the business logic. As you have noticed we
                again use an interface to instantiate an object:
              </p>
              <CodeBlock
                language="php"
                title="app/src/SimpleActivity/GreetingActivityInterface.php"
              >
                {ACTIVITY_INTERFACE_PHP}
              </CodeBlock>
              <p>
                Activities and workflow classes in PHP are marked with special
                attributes. For activity, we use{" "}
                <code>#[ActivityInterface]</code> and{" "}
                <code>#[ActivityMethod]</code>. The first on marks this
                class/interface as an activity, the second one marks the
                activity method. Our activity consists of one method, which
                accepts two string arguments. The implementation of this
                interface is a very straight forward - just compose a new
                string of provided arguments:
              </p>
              <CodeBlock
                language="php"
                title="app/src/SimpleActivity/GreetingActivity.php"
              >
                {ACTIVITY_PHP}
              </CodeBlock>
              <p>
                Both workflow and activity code in our example have both
                interface and implementation. But we could skip interfaces and
                just mark classes with corresponding attributes and everything
                will continue working. But how does the workflow client know
                about interface implementations? How does Temporal know what
                PHP class should be executed?
              </p>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>
                RoadRunner and Temporal Worker
              </h2>
              <p>
                To answer this question we need to take a look at how an
                instance of <code>WorkflowClientInterface</code> is created.
                This is the part where{" "}
                <a
                  href="https://roadrunner.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  RoadRunner
                </a>{" "}
                comes into a play.
              </p>
              <p>
                In our example under the hood RoadRunner executes{" "}
                <code>worker.php</code> script:
              </p>
              <CodeBlock language="php" title="worker.php">
                {WORKER_PHP}
              </CodeBlock>
              <p>
                You may consider this script as a bridge between your PHP
                application and Temporal. Temporal needs to know about our
                activity and workflow implementations. Thus, they need to be
                registered within the worker with{" "}
                <code>registerWorkflowTypes()</code> and{" "}
                <code>registerActivity()</code>. The first one registers
                workflows and accepts a list of classes:
              </p>
              <CodeBlock language="php">{REGISTER_WORKFLOW_PHP}</CodeBlock>
              <p>
                The second one registers activities and accepts a list of
                activity classes, e.g.:
              </p>
              <CodeBlock language="php">{REGISTER_ACTIVITY_PHP}</CodeBlock>
              <p>
                On the last line of the <em>worker script</em> we start the
                worker. From now, it starts communication with Temporal:
                receiving and sending data.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>Let's recap what was done in this "Hello world" example:</p>
              <ol>
                <li>
                  The main script, that instantiates an instance of{" "}
                  <code>WorkflowClientInterface</code>, creates a workflow and
                  starts it.
                </li>
                <li>Workflow code.</li>
                <li>Activity code.</li>
                <li>
                  Worker code with{" "}
                  <a
                    href="https://roadrunner.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    RoadRunner
                  </a>
                  , that instantiates the worker, registers workflow types and
                  activity implementations.
                </li>
              </ol>
              <p>These reflect the 4 main APIs of Temporal's PHP SDK.</p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/paths/beginner" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Next step</span>
                  <h3 className={styles.nextTitle}>
                    Explore the Beginner path
                  </h3>
                  <p className={styles.nextBody}>
                    Go deeper into Temporal fundamentals - Workflows,
                    Activities, Workers, and more.
                  </p>
                  <span className={styles.nextCta}>
                    Beginner path <span aria-hidden="true">→</span>
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
