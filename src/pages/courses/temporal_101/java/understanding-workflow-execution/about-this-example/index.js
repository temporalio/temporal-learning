// Free preview lesson 1 of 2 for Temporal 101 (Java) - Understanding Workflow Execution.
// Source content mirrors temporalio/edu-101-java-content/understanding-workflow-execution/about-this-example.md.
// Keep the *_JAVA constants below in sync with the upstream course repo.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const LESSONS = [
  {
    n: 1,
    label: "About this example",
    href: "/courses/temporal_101/java/understanding-workflow-execution/about-this-example/",
  },
  {
    n: 2,
    label: "Code walkthrough",
    href: "/courses/temporal_101/java/understanding-workflow-execution/code-walkthrough/",
  },
];

const TOC_ITEMS = [
  { id: "actors", label: "Actors in the scenario" },
  { id: "task-queues", label: "Workers and Task Queues" },
  { id: "commands", label: "Commands and recovery" },
  { id: "activities", label: "Activity Definitions" },
  { id: "workflow", label: "Workflow Definition" },
  { id: "worker", label: "Worker initialization" },
];

const ACTIVITIES_JAVA = `package farewellworkflow;

// non-Temporal imports omitted here for brevity
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.Activity;

@ActivityInterface
public interface GreetingActivities {
    String greetInSpanish(String name);

    String farewellInSpanish(String name);
}

class GreetingActivitiesImpl implements GreetingActivities {

    @Override
    public String greetInSpanish(String name) {
        return callService("get-spanish-greeting", name);
    }

    @Override
    public String farewellInSpanish(String name) {
        return callService("get-spanish-farewell", name);
    }

    String callService(String stem, String name) {
        String baseUrl = "http://localhost:9999/%s?name=%s";

        URL url = null;
        try {
            url = new URL(String.format(baseUrl, stem, URLEncoder.encode(name, "UTF-8")));
        } catch (IOException e) {
            throw Activity.wrap(e);
        }
        // code that uses this URL to call the service has been ommitted here
    }
}`;

const WORKFLOW_JAVA = `package farewellworkflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;

@WorkflowInterface
public interface GreetingWorkflow {

    @WorkflowMethod
    String greetSomeone(String name);

}

class GreetingWorkflowImpl implements GreetingWorkflow {

    private final ActivityOptions options = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofSeconds(5))
        .build();

    private final GreetingActivities activities =
        Workflow.newActivityStub(GreetingActivities.class, options);

    @Override
    public String greetSomeone(String name) {
        String spanishGreeting = activities.greetInSpanish(name);
        String spanishFarewell = activities.farewellInSpanish(name);

        return "\\n" + spanishGreeting + "\\n" + spanishFarewell;
    }
}`;

const WORKER_JAVA = `package farewellworkflow;

import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

public class GreetingWorker {

    public static void main(String[] args) {

        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(service);
        WorkerFactory factory = WorkerFactory.newInstance(client);

        Worker worker = factory.newWorker("greeting-tasks");

        worker.registerWorkflowImplementationTypes(GreetingWorkflowImpl.class);

        worker.registerActivitiesImplementations(new GreetingActivitiesImpl());

        factory.start();
    }
}`;

export default function AboutThisExamplePage() {
  return (
    <Layout
      title="About this example - Temporal 101 (Java) free preview"
      description="Free preview lesson: learn how Workers, the Temporal Cluster, and a Client Application work together during Workflow Execution."
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
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 101", href: "/courses/temporal_101" },
                  { label: "Java", href: "/courses/temporal_101/java" },
                  { label: "About this example" },
                ]}
              />
            </div>

            <h1 className={styles.title}>About this example</h1>

            <MetaChips items={["Free preview", "Temporal 101", "Java"]} />

            <TutorialStepper steps={LESSONS} currentStep={1} />

            <p className={styles.intro}>
              In a previous exercise, you executed a Workflow with two
              Activities that each called a microservice to provide a
              customized message in Spanish. That exercise demonstrated many of
              the key concepts in this course. Now that you have first-hand
              experience developing and running applications on the Temporal
              Platform, you'll gain a deeper understanding by looking at what
              happens during Workflow Execution.
            </p>

            <section className={styles.section} id="actors">
              <h2 className={styles.sectionTitle}>Actors in the scenario</h2>
              <p>
                Let's begin by identifying the actors in this scenario, which
                reiterates some important concepts.
              </p>
              <p>
                First, the example includes a Worker, which executes the
                Workflow and Activity code and uses a Client to communicate
                with the Cluster.
              </p>
              <p>
                Next, the Temporal Cluster orchestrates the execution of that
                code by coordinating with the Worker, using a shared Task
                Queue.
              </p>
              <p>
                Finally, the program that starts the Workflow - referred to as
                a Client application because it requests Workflow Execution as
                well as the result from the Temporal Cluster - uses a Client
                to do this.
              </p>
              <p>
                <img
                  src="/courses/temporal-101/java/chapter_09/actors-in-scenario.png"
                  alt="Screenshot showing actors in Workflow execution scenario"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="task-queues">
              <h2 className={styles.sectionTitle}>Workers and Task Queues</h2>
              <p>
                The assignment of work is indirect. The Temporal Cluster does
                not assign tasks to a Worker - in fact, the Temporal Cluster
                does not maintain a list of Workers.
              </p>
              <p>
                Instead, Workers continually poll the Temporal Cluster's Task
                Queue and accept tasks when they have spare capacity to
                process them. There are several benefits to this approach,
                but one of them is that tasks will just sit in the queue if
                there aren't enough Workers, which means that you can increase
                throughput and scalability by adding more Workers.
              </p>
              <p>
                <img
                  src="/courses/temporal-101/java/chapter_09/workers-and-tasks.png"
                  alt="Screenshot showing Workers and tasks"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                As you learned earlier, Temporal applications in production
                will typically have multiple Workers; however, this example
                uses a single Worker for the sake of simplicity.
              </p>
            </section>

            <section className={styles.section} id="commands">
              <h2 className={styles.sectionTitle}>Commands and recovery</h2>
              <p>
                Another thing that will help you understand Temporal is the
                role of Commands. When the Worker encounters certain API
                calls during Workflow Execution, such as a call to the
                Workflow's method to execute an Activity, it sends a Command
                to the Temporal Cluster. The Cluster acts on these Commands -
                for example, by creating an Activity Task - but also stores
                them in case of failure.
              </p>
              <p>
                For example, if the Worker crashes, the Temporal Service sends
                the stored information to another Worker to recreate the state
                of the Workflow to what it was immediately before the crash,
                and the new Worker resumes progress from that point. This
                allows you, as a developer, to code as if this type of failure
                wasn't even a possibility.
              </p>
              <p>
                <img
                  src="/courses/temporal-101/java/chapter_09/commands-java.png"
                  alt="Screenshot showing Commands"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>Activity Definitions</h2>
              <p>
                The application defines two Activities, <code>greetInSpanish</code>{" "}
                and <code>farewellInSpanish</code>, plus a utility method that
                both Activities use to call the translation service.
              </p>
              <CodeBlock language="java" title="GreetingActivities.java">
                {ACTIVITIES_JAVA}
              </CodeBlock>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Workflow Definition</h2>
              <p>
                The Workflow Definition executes those two Activities and
                returns a String created from their output.
              </p>
              <CodeBlock language="java" title="GreetingWorkflow.java">
                {WORKFLOW_JAVA}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Worker initialization</h2>
              <p>
                And here's the Worker initialization code, which registers the
                Workflow and Activity Definitions.
              </p>
              <CodeBlock language="java" title="GreetingWorker.java">
                {WORKER_JAVA}
              </CodeBlock>

              <Admonition type="note" title="What's next">
                <p>
                  In this course, you saw how the parts of a Temporal
                  Application - a Worker, the Temporal Cluster, and the Client
                  Application - work together during a Workflow Execution. In
                  the next video, you'll see how all the parts work together
                  via a code walkthrough.
                </p>
              </Admonition>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/java/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Back to course overview
                </span>
              </Link>
              <Link
                to="/courses/temporal_101/java/understanding-workflow-execution/code-walkthrough/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: lesson 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Code Walkthrough
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
