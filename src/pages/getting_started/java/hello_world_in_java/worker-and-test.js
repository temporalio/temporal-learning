// Hello World tutorial chapter 2 of 3: Test the Workflow and configure a Worker.
// See ./index.js for shared canonical-source notes.

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
    label: "Build the application",
    href: "/getting_started/java/hello_world_in_java/",
  },
  {
    n: 2,
    label: "Test and run a Worker",
    href: "/getting_started/java/hello_world_in_java/worker-and-test/",
  },
  {
    n: 3,
    label: "Run the application",
    href: "/getting_started/java/hello_world_in_java/run/",
  },
];

const TOC_ITEMS = [
  { id: "test-the-app", label: "Test the app" },
  { id: "configure-worker", label: "Configure a Worker" },
];

const WORKFLOW_TEST_JAVA = `package helloworldapp;

import io.temporal.client.WorkflowOptions;
import io.temporal.testing.TestWorkflowRule;
import org.junit.Rule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.*;

public class HelloWorldWorkflowTest {

    @Rule
    public TestWorkflowRule testWorkflowRule =
            TestWorkflowRule.newBuilder()
                    .setWorkflowTypes(HelloWorldWorkflowImpl.class)
                    .setDoNotStart(true)
                    .build();

    @Test
    public void testIntegrationGetGreeting() {
        testWorkflowRule.getWorker().registerActivitiesImplementations(new HelloWorldActivitiesImpl());
        testWorkflowRule.getTestEnvironment().start();

        HelloWorldWorkflow workflow =
                testWorkflowRule
                        .getWorkflowClient()
                        .newWorkflowStub(
                                HelloWorldWorkflow.class,
                                WorkflowOptions.newBuilder().setTaskQueue(testWorkflowRule.getTaskQueue()).build());
        String greeting = workflow.getGreeting("John");
        assertEquals("Hello John!", greeting);
        testWorkflowRule.getTestEnvironment().shutdown();
    }

    @Test
    public void testMockedGetGreeting() {
        HelloWorldActivities formatActivities = mock(HelloWorldActivities.class, withSettings().withoutAnnotations());
        when(formatActivities.composeGreeting(anyString())).thenReturn("Hello World!");
        testWorkflowRule.getWorker().registerActivitiesImplementations(formatActivities);
        testWorkflowRule.getTestEnvironment().start();

        HelloWorldWorkflow workflow =
                testWorkflowRule
                        .getWorkflowClient()
                        .newWorkflowStub(
                                HelloWorldWorkflow.class,
                                WorkflowOptions.newBuilder().setTaskQueue(testWorkflowRule.getTaskQueue()).build());
        String greeting = workflow.getGreeting("World");
        assertEquals("Hello World!", greeting);
        testWorkflowRule.getTestEnvironment().shutdown();
    }
}`;

const TEST_OUTPUT = `[INFO] Scanning for projects...
[INFO]
[INFO] -------------------------< helloworldapp:app >--------------------------
[INFO] Building app 1.0-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- resources:3.0.2:resources (default-resources) @ app ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] skip non existing resourceDirectory /Users/masonegger/Code/Temporal/tmp/app/src/main/resources
[INFO]
[INFO] --- compiler:3.8.0:compile (default-compile) @ app ---
[INFO] Nothing to compile - all classes are up to date
[INFO]
[INFO] --- resources:3.0.2:testResources (default-testResources) @ app ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] skip non existing resourceDirectory /Users/masonegger/Code/Temporal/tmp/app/src/test/resources
[INFO]
[INFO] --- compiler:3.8.0:testCompile (default-testCompile) @ app ---
[INFO] Nothing to compile - all classes are up to date
[INFO]
[INFO] --- surefire:2.22.1:test (default-test) @ app ---
[WARNING] Parameter 'localRepository' is deprecated core expression; Avoid use of ArtifactRepository type. If you need access to local repository, switch to '\${repositorySystemSession}' expression and get LRM from it instead.
[INFO]
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running helloworldapp.HelloWorldWorkflowTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.975 s - in helloworldapp.HelloWorldWorkflowTest
[INFO]
[INFO] Results:
[INFO]
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  1.959 s
[INFO] Finished at: 2025-11-05T10:58:46-05:00
[INFO] ------------------------------------------------------------------------`;

const SHARED_JAVA = `package helloworldapp;

public interface Shared {

    // Define the task queue name
    final String HELLO_WORLD_TASK_QUEUE = "HelloWorldTaskQueue";

}`;

const WORKER_JAVA = `package helloworldapp;

import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

public class HelloWorldWorker {

    public static void main(String[] args) {

        // Get a Workflow service stub.
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();

        /*
        * Get a Workflow service client which can be used to start, Signal, and Query Workflow Executions.
        */
        WorkflowClient client = WorkflowClient.newInstance(service);

        /*
        * Define the workflow factory. It is used to create workflow workers that poll specific Task Queues.
        */
        WorkerFactory factory = WorkerFactory.newInstance(client);

        /*
        * Define the workflow worker. Workflow workers listen to a defined task queue and process
        * workflows and activities.
        */
        Worker worker = factory.newWorker(Shared.HELLO_WORLD_TASK_QUEUE);

        /*
        * Register our workflow implementation with the worker.
        * Workflow implementations must be known to the worker at runtime in
        * order to dispatch workflow tasks.
        */
        worker.registerWorkflowImplementationTypes(HelloWorldWorkflowImpl.class);

        /*
        * Register our Activity Types with the Worker. Since Activities are stateless and thread-safe,
        * the Activity Type is a shared instance.
        */
        worker.registerActivitiesImplementations(new HelloWorldActivitiesImpl());

        /*
        * Start all the workers registered for a specific task queue.
        * The started workers then start polling for workflows and activities.
        */
        factory.start();

    }
}`;

const EXTERNAL_CONNECT_JAVA = `WorkflowServiceStubs service =
        WorkflowServiceStubs.newServiceStubs(
            WorkflowServiceStubsOptions.newBuilder().setTarget("host:port").build());

WorkflowClient client =
        WorkflowClient.newInstance(
          service, WorkflowClientOptions.newBuilder().setNamespace("YOUR_NAMESPACE").build());`;

export default function Chapter2Page() {
  return (
    <Layout
      title="Test and run a Worker - Build a Temporal app from scratch in Java"
      description="Chapter 2: Write a JUnit test for your Workflow and configure a Worker that polls a Task Queue."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_java.png"
            alt="Temporal Java SDK"
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
                  { label: "Java", href: "/getting_started/java" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/java/hello_world_in_java/",
                  },
                  { label: "Test and run a Worker" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Test and run a Worker</h1>

            <MetaChips
              items={["~10 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Now that the Workflow and Activity are defined, you'll add a
              JUnit test that exercises them together and then configure a
              Worker to host them. The Worker polls a Task Queue and runs your
              code when work arrives.
            </p>

            <section className={styles.section} id="test-the-app">
              <h2 className={styles.sectionTitle}>Test the app</h2>
              <p>
                The Temporal Java SDK includes classes and methods that help
                you test your Workflow executions. Let's add a basic unit test
                to the application to make sure the Workflow works as
                expected.
              </p>
              <p>
                You'll use{" "}
                <a
                  href="https://junit.org/junit4/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JUnit 4
                </a>{" "}
                build your test cases to test your Workflow and Activity.
                You'll test the integration of the Activity and the Workflow
                by using Temporal's built in Test Environment. You'll then
                mock the Activity so you can test the Workflow in isolation.
              </p>
              <p>
                Let's add a few unit tests to our application to make sure
                things are working as expected. Test code lives in{" "}
                <code>app/src/test/java/helloworldapp</code>. Your build tool
                generates a default <code>AppTest.java</code> in that
                location. Delete it:
              </p>
              <CodeBlock language="bash">
                rm -f app/src/test/java/helloworldapp/AppTest.java
              </CodeBlock>
              <p>
                Create a new file called <code>HelloWorldWorkflowTest.java</code>{" "}
                that contains the following code:
              </p>
              <CodeBlock
                language="java"
                title="app/src/test/java/helloworldapp/HelloWorldWorkflowTest.java"
              >
                {WORKFLOW_TEST_JAVA}
              </CodeBlock>
              <p>
                The first test, <code>testIntegrationGetGreeting</code>,
                creates a test execution environment to test the integration
                between the Activity and the Workflow. The second test,{" "}
                <code>testMockedGetGreeting</code>, mocks the Activity
                implementation so it returns a successful execution. The test
                then executes the Workflow in the test environment and checks
                for a successful execution. Finally, the tests ensures the
                Workflow's return value returns the expected value.
              </p>
              <p>
                Run the following command from the project root to execute
                the unit tests:
              </p>
              <CodeBlock language="bash">mvn compile test</CodeBlock>
              <p>
                You'll see output similar to the following from your test run
                indicating that the test was successful. If this is your
                first time running the test, it may take longer and you may
                see the output of mvn downloading the testing dependencies:
              </p>
              <CodeBlock>{TEST_OUTPUT}</CodeBlock>
              <p>
                You have a working application and a test to ensure the
                Workflow executes as expected. Next, you'll configure a
                Worker to execute your Workflow.
              </p>
            </section>

            <section className={styles.section} id="configure-worker">
              <h2 className={styles.sectionTitle}>Configure a Worker</h2>
              <p>
                A{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-worker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker
                </a>{" "}
                hosts Workflow and Activity methods and executes the code in
                the Workflow Definition. The Temporal Service orchestrates
                the execution of code in a Workflow Definition or Activity
                Definition by adding Tasks to a{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-task-queue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queue
                </a>
                , which Workers poll. When a Worker accepts a Task, it will
                execute the necessary code, and report the result (or error)
                back to the Temporal Service. After the Worker runs the code,
                it communicates the results back to the Temporal Server.
              </p>
              <p>
                When you start a Workflow, you specify which Task Queue the
                Workflow uses. A Worker listens and polls on the Task Queue,
                looking for work to do.
              </p>
              <p>
                To configure a Worker process using the Java SDK, you create
                an instance of <code>Worker</code> and give it the name of
                the Task Queue to poll.
              </p>
              <p>
                You'll connect to the Temporal Service using a Temporal
                Client, which provides a set of APIs to communicate with a
                Temporal Service. You'll use Clients to interact with
                existing Workflows or to start new ones.
              </p>
              <p>
                Since you'll use the Task Queue name in multiple places in
                your project, create the file <code>Shared.java</code> in{" "}
                <code>app/src/main/java/helloworldapp</code> and define the
                Task Queue name there:
              </p>
              <CodeBlock
                language="java"
                title="app/src/main/java/helloworldapp/Shared.java"
              >
                {SHARED_JAVA}
              </CodeBlock>
              <p>
                Now you'll create the Worker process. In this tutorial you'll
                create a small standalone Worker program so you can see how
                all of the components work together.
              </p>
              <p>
                Create the file <code>HelloWorldWorker.java</code> in{" "}
                <code>app/src/main/java/helloworldapp</code> and add the
                following code to connect to the Temporal Server, instantiate
                the Worker, and register the Workflow and Activities:
              </p>
              <CodeBlock
                language="java"
                title="app/src/main/java/helloworldapp/HelloWorldWorker.java"
              >
                {WORKER_JAVA}
              </CodeBlock>
              <p>
                This program first implements a service stub to be used when
                instantiating the client. The code first instantiates a
                factory and then creates a new worker that listens on a Task
                Queue. This worker will only process workflows and activities
                from this Task Queue. You register the Workflow and Activity
                with the Worker and then start the worker using{" "}
                <code>factory.start()</code>.
              </p>

              <Admonition type="tip">
                <p>
                  By default, the client connects to the <code>default</code>{" "}
                  namespace of the Temporal Service running at{" "}
                  <code>localhost</code> on port <code>7233</code> by using
                  the <code>newLocalServiceStubs()</code> method. If you want
                  to connect to an external Temporal Service you would use
                  the following code:
                </p>
                <CodeBlock language="java">{EXTERNAL_CONNECT_JAVA}</CodeBlock>
              </Admonition>

              <p>
                You've created a program that instantiates a Worker to
                process the Workflow. Now you need to start the Workflow.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/java/hello_world_in_java/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Build the application
                </span>
              </Link>
              <Link
                to="/getting_started/java/hello_world_in_java/run/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
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
