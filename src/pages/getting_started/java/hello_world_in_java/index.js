// Hello World tutorial chapter 1 of 3: Build the Workflow and Activities from scratch in Java.
// Canonical code lives at https://github.com/temporalio/hello-world-project-template-java.
// Update the *_JAVA constants here when the upstream repo changes.

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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create a new Java project" },
  { id: "workflow", label: "Create a Workflow" },
  { id: "activity", label: "Create an Activity" },
];

const POM_PROPERTIES_XML = `  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
  </properties>`;

const POM_DEPENDENCIES_XML = `  <dependencies>

    <dependency>
      <groupId>io.temporal</groupId>
      <artifactId>temporal-sdk</artifactId>
      <version>1.31.0</version>
    </dependency>

    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-nop</artifactId>
      <version>2.0.17</version>
    </dependency>

    <dependency>
      <groupId>io.temporal</groupId>
      <artifactId>temporal-testing</artifactId>
      <version>1.31.0</version>
      <scope>test</scope>
    </dependency>

    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13.2</version>
      <scope>test</scope>
    </dependency>

    <dependency>
      <groupId>org.mockito</groupId>
      <artifactId>mockito-core</artifactId>
      <version>5.20.0</version>
      <scope>test</scope>
    </dependency>

  </dependencies>`;

const ARCHETYPE_OUTPUT = `[INFO] Scanning for projects...
[INFO]
[INFO] ------------------< org.apache.maven:standalone-pom >-------------------
[INFO] Building Maven Stub Project (No POM) 1
[INFO] --------------------------------[ pom ]---------------------------------
[INFO]
[INFO] >>> archetype:3.2.1:generate (default-cli) > generate-sources @ standalone-pom >>>
[INFO]
[INFO] <<< archetype:3.2.1:generate (default-cli) < generate-sources @ standalone-pom <<<
[INFO]
[INFO]
[INFO] --- archetype:3.2.1:generate (default-cli) @ standalone-pom ---
[WARNING] Parameter 'localRepository' is deprecated core expression; Avoid use of ArtifactRepository type. If you need access to local repository, switch to '\${repositorySystemSession}' expression and get LRM from it instead.
[INFO] Generating project in Batch mode
[INFO] ----------------------------------------------------------------------------
[INFO] Using following parameters for creating project from Archetype: maven-archetype-quickstart:1.4
[INFO] ----------------------------------------------------------------------------
[INFO] Parameter: groupId, Value: helloworldapp
[INFO] Parameter: artifactId, Value: app
[INFO] Parameter: version, Value: 1.0-SNAPSHOT
[INFO] Parameter: package, Value: helloworldapp
[INFO] Parameter: packageInPathFormat, Value: helloworldapp
[INFO] Parameter: package, Value: helloworldapp
[INFO] Parameter: groupId, Value: helloworldapp
[INFO] Parameter: artifactId, Value: app
[INFO] Parameter: version, Value: 1.0-SNAPSHOT
[INFO] Project created from Archetype in dir: /Users/max/Code/Temporal/hello-world-project-template-java/tmp/app
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  1.037 s
[INFO] Finished at: 2025-11-05T10:05:47-05:00
[INFO] ------------------------------------------------------------------------`;

const COMPILE_OUTPUT = `[INFO] Scanning for projects...
[INFO]
[INFO] -------------------------< helloworldapp:app >--------------------------
[INFO] Building app 1.0-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
Downloading from central: https://repo.maven.apache.org/maven2/org/apache/maven/plugins/maven-resources-plugin/3.0.2/maven-resources-plugin-3.0.2.pom
Downloaded from central: https://repo.maven.apache.org/maven2/org/apache/maven/plugins/maven-resources-plugin/3.0.2/maven-resources-plugin-3.0.2.pom (7.1 kB at 42 kB/s)
...
Downloaded from central: https://repo.maven.apache.org/maven2/org/codehaus/plexus/plexus-compiler-javac/2.8.4/plexus-compiler-javac-2.8.4.jar (21 kB at 453 kB/s)
Downloaded from central: https://repo.maven.apache.org/maven2/com/thoughtworks/qdox/qdox/2.0-M9/qdox-2.0-M9.jar (317 kB at 6.3 MB/s)
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /Users/max/Code/Temporal/tmp/app/target/classes
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  5.973 s
[INFO] Finished at: 2025-11-05T10:47:31-05:00
[INFO] ------------------------------------------------------------------------`;

const WORKFLOW_INTERFACE_JAVA = `package helloworldapp;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface HelloWorldWorkflow {

    /**
     * This is the method that is executed when the Workflow Execution is started. The Workflow
     * Execution completes when this method finishes execution.
     */
    @WorkflowMethod
    String getGreeting(String name);
}`;

const WORKFLOW_IMPL_JAVA = `package helloworldapp;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;

public class HelloWorldWorkflowImpl implements HelloWorldWorkflow {

    /*
     * At least one of the following options needs to be defined:
     * - setStartToCloseTimeout
     * - setScheduleToCloseTimeout
     */
    ActivityOptions options = ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(60))
            .build();

    /*
     * Define the HelloWorldActivity stub. Activity stubs are proxies for activity invocations that
     * are executed outside of the workflow thread on the activity worker, that can be on a
     * different host. Temporal is going to dispatch the activity results back to the workflow and
     * unblock the stub as soon as activity is completed on the activity worker.
     *
     * The activity options that were defined above are passed in as a parameter.
     */
    private final HelloWorldActivities activity = Workflow.newActivityStub(HelloWorldActivities.class, options);

    // This is the entry point to the Workflow.
    @Override
    public String getGreeting(String name) {

        /**
         * If there were other Activity methods they would be orchestrated here or from within other Activities.
         * This is a blocking call that returns only after the activity has completed.
         */
        return activity.composeGreeting(name);
    }
}`;

const ACTIVITY_INTERFACE_JAVA = `package helloworldapp;

import io.temporal.activity.ActivityInterface;

@ActivityInterface
public interface HelloWorldActivities {

    // Define your activity methods which can be called during workflow execution
    String composeGreeting(String name);

}`;

const ACTIVITY_IMPL_JAVA = `package helloworldapp;

public class HelloWorldActivitiesImpl implements HelloWorldActivities {

    @Override
    public String composeGreeting(String name) {
        return "Hello " + name + "!";
    }

}`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Build the application - Build a Temporal app from scratch in Java"
      description="Chapter 1: Create a Java project with Maven, write a Workflow, and implement an Activity using the Temporal Java SDK."
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
                  { label: "Build the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Temporal Application from scratch in Java
            </h1>

            <MetaChips
              items={["~20 minutes total", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              Creating reliable applications is a difficult task.{" "}
              <a
                href="https://temporal.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal
              </a>{" "}
              lets you create fault-tolerant, resilient applications using
              programming languages you already know, so you can build complex
              applications that execute successfully and recover from failures.
              In this tutorial, you'll build your first Temporal Application
              from scratch using the{" "}
              <a
                href="https://github.com/temporalio/java-sdk"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Java SDK
              </a>
              .
            </p>

            <Admonition type="note" title="What you'll build">
              <p>The Temporal Application will consist of the following pieces:</p>
              <ol>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/workflows"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflow
                  </a>
                  : a Workflow defines a sequence of steps. With Temporal,
                  those steps are defined by writing code, known as a Workflow
                  Definition, and are carried out by running that code, which
                  results in a Workflow Execution.
                </li>
                <li>
                  An{" "}
                  <a
                    href="https://docs.temporal.io/activities"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activity
                  </a>
                  : Activities are methods called during Workflow Execution and
                  represent the execution aspect of your business logic. The
                  Workflow you'll create executes a single Activity, which
                  takes a string from the Workflow as input and returns a
                  formatted version of this string to the Workflow.
                </li>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/workers"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Worker
                  </a>
                  : Workers host the Activity and Workflow code and are
                  responsible for processing Workflow and Activity Tasks.
                </li>
                <li>
                  A client: code that triggers the execution of the Workflow on
                  the Temporal Server.
                </li>
              </ol>
              <p>
                You'll also write a unit test to ensure your Workflow executes
                successfully.
              </p>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li>
                  <Link to="/getting_started/java/dev_environment/">
                    Set up a local development environment for developing
                    Temporal applications using the Java programming language
                  </Link>
                  .
                </li>
                <li>
                  Follow the tutorial{" "}
                  <Link to="/getting_started/java/first_program_in_java/">
                    Run your first Temporal application with the Java SDK
                  </Link>{" "}
                  to gain a better understanding of what Temporal is and how
                  its components fit together.
                </li>
                <li>
                  Ensure the build tool{" "}
                  <a
                    href="https://maven.apache.org/install.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Maven
                  </a>{" "}
                  is installed and ready to use to create a Java project.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>Create a new Java project</h2>
              <p>
                To get started with the Temporal Java SDK, you'll create a new
                Java application, just like any other Java program you're
                creating. Then you'll add the Temporal SDK package to your
                project.
              </p>
              <p>
                In a terminal, create a new project directory called{" "}
                <code>hello-world-temporal</code>:
              </p>
              <CodeBlock language="bash">mkdir hello-world-temporal</CodeBlock>
              <p>Switch to the new directory:</p>
              <CodeBlock language="bash">cd hello-world-temporal</CodeBlock>
              <p>
                Create a new Java project with Maven by running the following
                command:
              </p>
              <CodeBlock language="bash">{`mvn -B archetype:generate \\
-DgroupId=helloworldapp \\
-DartifactId=app \\
-DarchetypeArtifactId=maven-archetype-quickstart \\
-DarchetypeVersion=1.4`}</CodeBlock>
              <p>
                This command creates a directory name <code>app</code> that
                contains your Java application named{" "}
                <code>helloworldapp</code>.
              </p>
              <p>Your output will be similar to this:</p>
              <CodeBlock>{ARCHETYPE_OUTPUT}</CodeBlock>
              <p>
                Next you will need to ensure that the Java version Maven is
                compiling against supports building Temporal Applications.
                Temporal requires a minimum version of Java 1.8. Open the
                Maven configuration file at <code>app/pom.xml</code> and
                locate the <code>&lt;properties&gt;</code> tag that contains
                the <code>&lt;maven.compiler.source&gt;</code> and{" "}
                <code>&lt;maven.compiler.target&gt;</code> tags. Update these
                two property tags with <code>1.8</code>.
              </p>
              <CodeBlock language="xml" title="app/pom.xml">
                {POM_PROPERTIES_XML}
              </CodeBlock>
              <p>
                Next you will add the Temporal SDK as a dependency, along with
                a handful of other libraries for testing and logging. In{" "}
                <code>pom.xml</code> replace the generated{" "}
                <code>&lt;dependencies&gt;</code> section in the file with the
                following:
              </p>
              <CodeBlock language="xml" title="app/pom.xml">
                {POM_DEPENDENCIES_XML}
              </CodeBlock>
              <p>
                Below is a more detailed explanation about the dependencies
                you will be installing:
              </p>
              <ul>
                <li>
                  <code>temporal-sdk</code>
                  <ul>
                    <li>The Temporal SDK for use in your application.</li>
                  </ul>
                </li>
                <li>
                  <code>slf4j-nop</code>
                  <ul>
                    <li>
                      A NOOP logging package to suppress logging warnings.{" "}
                      <strong>
                        This is not intended for production use and a proper
                        logger should be implemented.
                      </strong>
                    </li>
                  </ul>
                </li>
                <li>
                  <code>temporal-testing</code>
                  <ul>
                    <li>
                      The necessary packages for testing a Temporal
                      application.
                    </li>
                  </ul>
                </li>
                <li>
                  <code>junit</code>
                  <ul>
                    <li>The core Java Unit Testing framework.</li>
                  </ul>
                </li>
                <li>
                  <code>mockito-core</code>
                  <ul>
                    <li>A mocking framework in Java to be used during testing.</li>
                  </ul>
                </li>
              </ul>
              <p>
                Once you have added the build dependencies, perform a test
                build on your application.
              </p>
              <p>
                Change directory into the <code>app</code> directory:
              </p>
              <CodeBlock language="bash">cd app</CodeBlock>
              <p>
                From the <code>app</code> directory of your project that
                contains the <code>pom.xml</code> execute the following
                command:
              </p>
              <CodeBlock language="bash">mvn compile</CodeBlock>
              <p>
                You will see output similar to this if your build was
                successful. If it is your first time running{" "}
                <code>mvn compile</code> you may see more output of the
                dependencies being downloaded:
              </p>
              <CodeBlock>{COMPILE_OUTPUT}</CodeBlock>
              <p>
                Finally, your build tool may have created a default{" "}
                <code>App.java</code> file. You won't need this file for this
                tutorial, so delete it.
              </p>
              <CodeBlock language="bash">
                rm -f app/src/main/java/helloworldapp/App.java
              </CodeBlock>
              <p>
                With your project workspace configured, you're ready to create
                your first Temporal Activity and Workflow. You'll start with
                the Workflow.
              </p>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Create a Workflow</h2>
              <p>
                Workflows are where you configure and organize the execution
                of Activities. You write a Workflow using one of the
                programming languages supported by a Temporal SDK. This code
                is known as a <em>Workflow Definition</em>.
              </p>
              <p>
                In the Temporal Java SDK, a Workflow Definition is made of two
                parts:
              </p>
              <ul>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/dev-guide/java/foundations#develop-workflows"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflow Interface
                  </a>
                  , which is an interface annotated with{" "}
                  <code>@WorkflowInterface</code>. This interface contains a
                  single method signature annotated with{" "}
                  <code>@WorkflowMethod</code>.
                </li>
                <li>
                  A class that implements the interface, providing the code
                  that runs when the Workflow is executed.
                </li>
              </ul>
              <p>
                Create <code>HelloWorldWorkflow.java</code> in the source code
                location of your project at{" "}
                <code>app/src/main/java/helloworldapp/</code> and add the
                following code to create a <code>HelloWorldWorkflow</code>{" "}
                interface that defines the expected functionality of your
                workflow:
              </p>
              <CodeBlock
                language="java"
                title="app/src/main/java/helloworldapp/HelloWorldWorkflow.java"
              >
                {WORKFLOW_INTERFACE_JAVA}
              </CodeBlock>
              <p>
                The <code>HelloWorldWorkflow</code> interface is annotated
                with <code>@WorkflowInterface</code>, signifying that the
                interface is a Temporal Workflow. Within this interface is a
                single method <code>getGreeting(String name)</code> that takes
                a single String parameter, <code>name</code>, and is annotated
                with <code>@WorkflowMethod</code>. This annotation denotes the
                starting point of Workflow execution and execution completes
                when this method returns.
              </p>
              <p>
                Next, create <code>HelloWorldWorkflowImpl.java</code> and add
                the following code to implement the Workflow and define its
                methods:
              </p>
              <CodeBlock
                language="java"
                title="app/src/main/java/helloworldapp/HelloWorldWorkflowImpl.java"
              >
                {WORKFLOW_IMPL_JAVA}
              </CodeBlock>
              <p>
                In this implementation, you have specified that the
                Start-to-Close Timeout for your Activity will be one minute,
                meaning that your Activity has one minute to begin before it
                times out. Of all the Temporal timeout options,{" "}
                <code>startToCloseTimeOut</code> is the one you should always
                set. In this implementation you create a{" "}
                <code>HelloWorldActivities</code> stub that will act as a
                proxy for activity invocations.
              </p>

              <Admonition type="note">
                <p>
                  Notice that <code>Workflow.newActivityStub()</code> uses an
                  interface of <code>HelloWorldActivities</code> to create the
                  activity stub, not the Activity implementation. The workflow
                  communicates with an Activity through its public interface
                  and is not aware of its implementation.
                </p>
              </Admonition>

              <p>
                Finally <code>HelloWorldWorkflowImpl</code> implements the{" "}
                <code>getGreeting</code> Workflow Method from the Workflow
                Interface. The method returns the result of the Activity.
              </p>
              <p>
                With your Workflow Definition created, you're ready to create
                the <code>composeGreeting</code> Activity.
              </p>
            </section>

            <section className={styles.section} id="activity">
              <h2 className={styles.sectionTitle}>Create an Activity</h2>
              <p>
                In a Temporal Application, Activities are where you execute
                any operation that is prone to failure or access external
                services or systems, such as API requests or database calls.
                Your Workflow Definitions call Activities and process the
                results. Complex Temporal Applications have Workflows that
                invoke many Activities, using the results of one Activity to
                execute another.
              </p>
              <p>
                For this tutorial, your Activity won't be complex; you'll
                create an Activity that takes a string as input and uses it to
                create a new string as output, which is then returned to the
                Workflow. This will let you see how Workflows and Activities
                work together without building something complicated.
              </p>
              <p>
                With the Temporal Java SDK, you define Activities similarly to
                how you define Workflows: using an interface and an
                implementation.
              </p>
              <p>
                Create the file <code>HelloWorldActivities.java</code> in{" "}
                <code>app/src/main/java/helloworldapp/</code> and add the
                following code to define the{" "}
                <code>HelloWorldActivities</code> interface:
              </p>
              <CodeBlock
                language="java"
                title="app/src/main/java/helloworldapp/HelloWorldActivities.java"
              >
                {ACTIVITY_INTERFACE_JAVA}
              </CodeBlock>
              <p>
                The <code>HelloWorldActivities</code> interface is annotated
                with <code>@ActivityInterface</code>, signifying that the
                interface is a Temporal Activity. Within this interface is a
                single method signature,{" "}
                <code>composeGreeting(String name)</code>. Activity Interfaces
                can have multiple methods, but for this example you'll have
                just the one.
              </p>
              <p>
                Next, create <code>HelloWorldActivitiesImpl.java</code> in{" "}
                <code>app/src/main/java/helloworldapp/</code> and add the
                following code to implement the Activity and define its
                methods:
              </p>
              <CodeBlock
                language="java"
                title="app/src/main/java/helloworldapp/HelloWorldActivitiesImpl.java"
              >
                {ACTIVITY_IMPL_JAVA}
              </CodeBlock>
              <p>
                This class implements the single method from the interface
                named <code>composeGreeting</code> to compose a String that
                returns a standard "Hello World!" message using the passed in
                parameter.
              </p>
              <p>
                Your{" "}
                <a
                  href="https://docs.temporal.io/activities#activity-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity Definition
                </a>{" "}
                can accept input parameters just like Workflow Definitions.
                Review the{" "}
                <a
                  href="https://docs.temporal.io/dev-guide/java/foundations#activity-parameters"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity parameters
                </a>{" "}
                section of the Temporal documentation for more details, as
                there are some limitations you'll want to be aware of when
                running more complex applications.
              </p>
              <p>
                You've completed the logic for the application; you have a
                Workflow and an Activity defined. Before moving on to
                configuring your Worker, you'll write a unit test for your
                Workflow.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/java/first_program_in_java/simulate-failures/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Run your first Temporal Java app
                </span>
              </Link>
              <Link
                to="/getting_started/java/hello_world_in_java/worker-and-test/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
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
