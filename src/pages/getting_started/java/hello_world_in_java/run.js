// Hello World tutorial chapter 3 of 3: Start the Workflow Execution and run the app.
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
  { id: "start-workflow", label: "Write code to start a Workflow Execution" },
  { id: "run-the-app", label: "Run the application" },
  { id: "conclusion", label: "Conclusion" },
];

const INITIATE_JAVA = `package helloworldapp;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import io.temporal.serviceclient.WorkflowServiceStubs;

public class InitiateHelloWorld {

    public static void main(String[] args) throws Exception {

        // This gRPC stubs wrapper talks to the local docker instance of the Temporal service.
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();

        // WorkflowClient can be used to start, signal, query, cancel, and terminate Workflows.
        WorkflowClient client = WorkflowClient.newInstance(service);

        // Define our workflow unique id
        final String WORKFLOW_ID = "HelloWorldWorkflowID";

        /*
         * Set Workflow options such as WorkflowId and Task Queue so the worker knows where to list and which workflows to execute.
         */
        WorkflowOptions options = WorkflowOptions.newBuilder()
                    .setWorkflowId(WORKFLOW_ID)
                    .setTaskQueue(Shared.HELLO_WORLD_TASK_QUEUE)
                    .build();

        // Create the workflow client stub. It is used to start our workflow execution.
        HelloWorldWorkflow workflow = client.newWorkflowStub(HelloWorldWorkflow.class, options);

        /*
         * Execute our workflow and wait for it to complete. The call to our getGreeting method is
         * synchronous.
         *
         * Replace the parameter "World" in the call to getGreeting() with your name.
         */
        String greeting = workflow.getGreeting("World");

        String workflowId = WorkflowStub.fromTyped(workflow).getExecution().getWorkflowId();
        // Display workflow execution results
        System.out.println(workflowId + " " + greeting);
        System.exit(0);
    }
}`;

const WORKER_RUN_OUTPUT = `[INFO] Scanning for projects...
[INFO]
[INFO] -------------------------< helloworldapp:app >--------------------------
[INFO] Building app 1.0-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- exec:3.1.0:java (default-cli) @ app ---`;

const INITIATE_RUN_OUTPUT = `[INFO] Scanning for projects...
[INFO]
[INFO] -------------------------< helloworldapp:app >--------------------------
[INFO] Building app 1.0-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- exec:3.1.0:java (default-cli) @ app ---
HelloWorldWorkflowID Hello World!`;

export default function Chapter3Page() {
  return (
    <Layout
      title="Run the application - Build a Temporal app from scratch in Java"
      description="Chapter 3: Write a client to start the Workflow Execution, then run the Worker and Workflow together."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Java", href: "/getting_started/java" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/java/hello_world_in_java/",
                  },
                  { label: "Run the application" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Run the application</h1>

            <MetaChips
              items={["~5 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={3} />

            <p className={styles.intro}>
              With your Workflow, Activity, and Worker in place, you'll now
              write a small client program to start the Workflow Execution,
              then run the Worker and client together to see Temporal
              orchestrate everything end to end.
            </p>

            <section className={styles.section} id="start-workflow">
              <h2 className={styles.sectionTitle}>
                Write code to start a Workflow Execution
              </h2>
              <p>
                You can start a Workflow Execution by using the Temporal CLI
                or by writing code using the Temporal SDK. In this tutorial,
                you'll use the Temporal SDK to start the Workflow, which is
                how most real-world applications work.
              </p>
              <p>
                Starting a Workflow Execution using the Temporal SDK involves
                connecting to the Temporal Server, specifying the Task Queue
                the Workflow should use, and starting the Workflow with the
                input parameters it expects. In a real application, you may
                invoke this code when someone submits a form, presses a
                button, or visits a certain URL. In this tutorial, you'll
                create a separate Java class that starts the Workflow
                Execution.
              </p>
              <p>
                Create <code>InitiateHelloWorld.java</code> in{" "}
                <code>app/src/main/java/helloworldapp/</code> and add the
                following code to the file to connect to the server and start
                the Workflow:
              </p>
              <CodeBlock
                language="java"
                title="app/src/main/java/helloworldapp/InitiateHelloWorld.java"
              >
                {INITIATE_JAVA}
              </CodeBlock>
              <p>
                Like the Worker you created, this program uses stubs and a
                client to connect to the Temporal server. It then specifies a{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/java/foundations/#workflow-id"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow ID
                </a>{" "}
                for the Workflow, as well as the Task Queue. The Worker you
                configured is looking for tasks on that Task Queue.
              </p>

              <Admonition type="tip" title="Specify a Workflow ID">
                <p>
                  A Workflow Id is unique in a namespace and is used for
                  deduplication. Using an identifier that reflects some
                  business process or entity is a good practice. For example,
                  you might use a customer identifier as part of the Workflow
                  Id if you run one Workflow per customer. This would make it
                  easier to find all of the Workflow Executions related to
                  that customer later.
                </p>
              </Admonition>

              <p>
                The program then creates a stubbed instance of your Workflow,{" "}
                <code>workflow</code>, taking the interface class of your
                workflow along with the options you have set as parameters.
                This stub looks like an implementation of the interface, but
                is used to communicate with the Temporal Server under the
                hood.
              </p>

              <Admonition type="note">
                <p>
                  Notice that an interface of <code>HelloWorldWorkflow</code>{" "}
                  is used to create the Workflow stub, not the Workflow
                  implementation. The workflow communicates with a Workflow
                  through its public interface and is not aware of its
                  implementation.
                </p>
              </Admonition>

              <p>
                You can{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/java/foundations/#get-workflow-results"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  get the results
                </a>{" "}
                from your Workflow right away, or you can get the results at
                a later time. This implementation stores the results in the{" "}
                <code>greeting</code> variable after the{" "}
                <code>getGreeting()</code> method is called, which blocks the
                program's execution until the Workflow Execution completes.
              </p>
              <p>
                You have a Workflow, an Activity, a Worker, and a way to
                start a Workflow Execution. It's time to run the Workflow.
              </p>
            </section>

            <section className={styles.section} id="run-the-app">
              <h2 className={styles.sectionTitle}>Run the application</h2>
              <p>
                To run your Temporal Application, you need to start the
                Workflow and the Worker. You can start these in any order,
                but you'll need to run each command from a separate terminal
                window, as the Worker needs to be constantly running to look
                for tasks to execute.
              </p>
              <p>First, ensure that your local Temporal Service is running.</p>
              <p>To start the Worker, run this command from the project root:</p>
              <CodeBlock language="bash">
                mvn compile exec:java -Dexec.mainClass="helloworldapp.HelloWorldWorker"
              </CodeBlock>
              <p>You will see similar output from Maven:</p>
              <CodeBlock>{WORKER_RUN_OUTPUT}</CodeBlock>

              <Admonition type="note">
                <p>
                  Based on the output above, it may appear that your
                  application is stuck or non-responsive. This is not the
                  case. Your Worker is running and ready to accept Workflows
                  to be executed. Leave this program running and proceed to
                  the next step.
                </p>
              </Admonition>

              <p>
                To start the Workflow, open a new terminal window and switch
                to your project root:
              </p>
              <CodeBlock language="bash">cd hello-world-temporal</CodeBlock>
              <p>Run the following command to start the Workflow Execution:</p>
              <CodeBlock language="bash">
                mvn exec:java -Dexec.mainClass="helloworldapp.InitiateHelloWorld"
              </CodeBlock>
              <p>The program runs and returns the result:</p>
              <CodeBlock>{INITIATE_RUN_OUTPUT}</CodeBlock>
              <p>
                You can switch back to the terminal running the Worker and
                stop it with <code>CTRL-C</code>.
              </p>
              <p>You have successfully built a Temporal application from scratch.</p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You now know how to build a Temporal Workflow application
                using the Java SDK. All of the code in this tutorial is
                available in the{" "}
                <a
                  href="https://github.com/temporalio/hello-world-project-template-java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  hello-world Java template
                </a>{" "}
                repository.
              </p>
              <p>
                Let's do a quick review to make sure you remember some of the
                more important pieces.
              </p>

              <details>
                <summary>
                  <strong>
                    What are the minimum four pieces of a Temporal Workflow
                    application?
                  </strong>
                </summary>
                <ol>
                  <li>An Activity function.</li>
                  <li>A Workflow function.</li>
                  <li>A Worker to host the Activity and Workflow code.</li>
                  <li>Some way to start the Workflow.</li>
                </ol>
              </details>

              <details>
                <summary>
                  <strong>
                    How does the Worker know which Activity to execute and
                    when to do so?
                  </strong>
                </summary>
                <p>
                  Each Worker is configured to poll a specified Task Queue,
                  whose name is specified when the Worker is created. The
                  Temporal Server adds tasks to this queue, specifying the
                  details about the Workflows and Activities that the Worker
                  should execute.
                </p>
              </details>

              <details>
                <summary>
                  <strong>
                    True or false, with the Temporal Java SDK, you define
                    Activities and Workflows by writing an Interface to
                    create a definition and implementation of this interface
                    that gets executed by the Workers?
                  </strong>
                </summary>
                <p>
                  True. Workflows and Activities are defined as interfaces
                  and their implementations will implement the interface.
                </p>
              </details>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link to="/courses/temporal_101" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Go deeper</span>
                  <h3 className={styles.nextTitle}>
                    Take Temporal 101 with Java
                  </h3>
                  <p className={styles.nextBody}>
                    A free, self-paced course on Temporal's building blocks -
                    Workflows and Activities - about 2 hours.
                  </p>
                  <span className={styles.nextCta}>
                    Start Temporal 101 <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link to="/paths/foundation" className={styles.nextCard}>
                  <span className={styles.nextEyebrow}>Keep building</span>
                  <h3 className={styles.nextTitle}>
                    Explore the Foundation path
                  </h3>
                  <p className={styles.nextBody}>
                    Continue along the Foundation learning path with more
                    tutorials and courses.
                  </p>
                  <span className={styles.nextCta}>
                    Browse Foundation <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/java/hello_world_in_java/worker-and-test/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 2
                </span>
                <span className={styles.chapterNavTitle}>
                  Test and run a Worker
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
