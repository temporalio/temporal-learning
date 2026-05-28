// Chapter 2 of 3: Set up a Temporal Application project with Java.

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
  { n: 1, label: "Introduction", href: "/tutorials/java/background-check/introduction/" },
  { n: 2, label: "Project setup", href: "/tutorials/java/background-check/project-setup/" },
  { n: 3, label: "Durable execution", href: "/tutorials/java/background-check/durable-execution/" },
];

const TOC_ITEMS = [
  { id: "install-cli", label: "Install the Temporal CLI" },
  { id: "choose-dev-cluster", label: "Choose a development Cluster" },
  { id: "boilerplate-project", label: "Boilerplate Temporal Application project code" },
  { id: "start-workflow", label: "Start a Workflow with the Temporal CLI" },
  { id: "test-framework", label: "Add a testing framework" },
];

const IMG_BASE = "/img/tutorials/java/background-check";

const POM_PROPERTIES = `<properties>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  <maven.compiler.source>1.8</maven.compiler.source>
  <maven.compiler.target>1.8</maven.compiler.target>
</properties>`;

const POM_DEPENDENCY = `<dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-sdk</artifactId>
    <version>1.31.0</version>
</dependency>`;

const GRADLE_DEPENDENCY = `dependencies {
    implementation group: 'io.temporal', name: 'temporal-sdk', version: '1.31.0'
}`;

const MONOREPO_STRUCTURE = `/monorepo
    /src
        /main
            /java
                /sharedactivities
                    | PaymentActivities.java
                    | PaymentActivitiesImpl.java
                    | SendEmailActivities.java
                    | SendEmailActivitiesImpl.java
                /backgroundcheck
                    /workflows
                        | BackgroundCheckWorkflow.java
                        | BackgroundCheckWorkflowImpl.java
                    /activities
                        | SsnTraceActivities.java
                        | SsnTraceActivitiesImpl.java
                    /worker
                        | BackgroundCheckWorker.java
                /loanapplication
                    /workflows
                        | LoanApplicationWorkflow.java
                        | LoanApplicationWorkflowImpl.java
                    /activities
                        | CreditCheckActivities.java
                        | CreditCheckActivitiesImpl.java
                    /worker
                        | LoanApplicationWorker.java
            /resources
                | logback.xml
        /test
            /java
                /sharedactivities
                    | PaymentActivitiesTest.java
                    | SendEmailActivitiesTest.java
                /backgroundcheck
                    /workflows
                        | BackgroundCheckWorkflowTest.java
                        | BackgroundCheckWorkflowIntegrationTest.java
                    /activities
                        | SsnTraceActivitiesTest.java
                /loanapplication
                    /workflows
                        | LoanApplicationWorkflowTest.java
                        | LoanApplicationWorkflowIntegrationTest.java
                    /activities
                        | CreditCheckActivitiesTest.java`;

const PROJECT_STRUCTURE = `backgroundcheck
└── src
    ├── main
    │   └── java
    │       └── backgroundcheckboilerplate
    │           ├── BackgroundCheckBoilerplateActivities.java
    │           ├── BackgroundCheckBoilerplateActivitiesImpl.java
    │           ├── BackgroundCheckBoilerplateWorkflow.java
    │           ├── BackgroundCheckBoilerplateWorkflowImpl.java
    │           └── workers
    │               ├── CloudWorker.java
    │               ├── DevServerWorker.java
    │               └── SelfHostedWorker.java
    └── test
        └── java
            └── backgroundcheckboilerplate
                ├── BackgroundCheckBoilerplateActivitiesTest.java
                ├── BackgroundCheckBoilerplateWorkflowIntegrationTest.java
                └── BackgroundCheckBoilerplateWorkflowTest.java`;

const WORKFLOW_INTERFACE = `package backgroundcheckboilerplate;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

// Workflow Interfaces must be annotated with @WorkflowInterface
@WorkflowInterface
public interface BackgroundCheckBoilerplateWorkflow {

  // The Workflow Method within the interface must be annotated with @WorkflowMethod
  @WorkflowMethod
  public String backgroundCheck(String socialSecurityNumber);

}`;

const WORKFLOW_IMPL = `package backgroundcheckboilerplate;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;

public class BackgroundCheckBoilerplateWorkflowImpl implements BackgroundCheckBoilerplateWorkflow {

  // Define the Activity Execution options
  // StartToCloseTimeout or ScheduleToCloseTimeout must be set
  ActivityOptions options = ActivityOptions.newBuilder()
          .setStartToCloseTimeout(Duration.ofSeconds(5))
          .build();

  // Create an client stub to activities that implement the given interface
  private final BackgroundCheckBoilerplateActivities activities =
      Workflow.newActivityStub(BackgroundCheckBoilerplateActivities.class, options);

  @Override
  public String backgroundCheck(String socialSecurityNumber) {
    String ssnTraceResult = activities.ssnTraceActivity(socialSecurityNumber);
    return ssnTraceResult;
  }

}`;

const ACTIVITIES_INTERFACE = `package backgroundcheckboilerplate;

import io.temporal.activity.ActivityInterface;

// Activity Interfaces must be annotated with @ActivityInterface
@ActivityInterface
// BackgroundCheckActivities is the interface that contains your Activity Definitions
public interface BackgroundCheckBoilerplateActivities {

  // ssnTraceActivity is your custom Activity Definition
  public String ssnTraceActivity(String socialSecurityNumber);

}`;

const ACTIVITIES_IMPL = `package backgroundcheckboilerplate;

public class BackgroundCheckBoilerplateActivitiesImpl implements BackgroundCheckBoilerplateActivities{

  @Override
  public String ssnTraceActivity(String socialSecurityNumber){

    // This is where a call to another service would be made to perform the trace
    // We are simulating that the service that does SSNTrace executed successfully
    // with a passing value being returned

    String result = "pass";
    return result;
  }

}`;

const DEV_WORKER = `package backgroundcheckboilerplate.workers;

import backgroundcheckboilerplate.BackgroundCheckBoilerplateActivitiesImpl;
import backgroundcheckboilerplate.BackgroundCheckBoilerplateWorkflowImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
public class DevServerWorker {
  public static void main(String[] args) {

    // Generate the gRPC stubs
    WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();

    // Initialize the Temporal Client, passing in the gRPC stubs
    WorkflowClient client = WorkflowClient.newInstance(service);

    // Initialize a WorkerFactory, passing in the Temporal Client (WorkflowClient)
    WorkerFactory factory = WorkerFactory.newInstance(client);

    // Create a new Worker
    Worker worker = factory.newWorker("backgroundcheck-tasks");

    // Register the Workflow by passing in the class to the worker
    worker.registerWorkflowImplementationTypes(BackgroundCheckBoilerplateWorkflowImpl.class);

    // Register the Activities by passing in an Activities object used for execution
    worker.registerActivitiesImplementations(new BackgroundCheckBoilerplateActivitiesImpl());

    // Start the Worker
    factory.start();
  }
}`;

const CLOUD_WORKER = `package backgroundcheckboilerplate.workers;

import java.io.FileInputStream;
import java.io.InputStream;
import io.grpc.netty.shaded.io.netty.handler.ssl.SslContext;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowClientOptions;
import io.temporal.serviceclient.SimpleSslContextBuilder;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import java.lang.System;
import backgroundcheckboilerplate.BackgroundCheckBoilerplateActivitiesImpl;
import backgroundcheckboilerplate.BackgroundCheckBoilerplateWorkflowImpl;
import java.io.IOException;

public class CloudWorker {
  public static void main(String[] args) throws IOException{

    // Get the key and certificate from your environment or local machine
    String clientCertFile = "./certificate.pem";
    String clientCertPrivateKey = "./private.key";

    // Open the key and certificate as Input Streams
    InputStream clientCertInputStream = new FileInputStream(clientCertFile);
    InputStream clientKeyInputStream = new FileInputStream(clientCertPrivateKey);

    // Generate the sslContext using the Client Cert and Key
    SslContext sslContext = SimpleSslContextBuilder.forPKCS8(clientCertInputStream, clientKeyInputStream).build();

    // Specify the host and port of your Temporal Cloud Namespace
    // Host and port format: namespace.unique_id.tmprl.cloud:port
    String namespace = System.getenv("TEMPORAL_CLOUD_NAMESPACE");
    String port = System.getenv("TEMPORAL_CLOUD_PORT");
    String hostPort = namespace + ".tmprl.cloud:" + port;

    // Specify the IP address, port, and SSL Context for the Service Stubs options
    WorkflowServiceStubsOptions stubsOptions = WorkflowServiceStubsOptions.newBuilder()
            .setSslContext(sslContext)
            .setTarget(hostPort)
            .build();

    // Generate the gRPC stubs using the options provided
    WorkflowServiceStubs service = WorkflowServiceStubs.newServiceStubs(stubsOptions);

    // Specify the namespace in the Client options
    WorkflowClientOptions options = WorkflowClientOptions.newBuilder()
            .setNamespace(namespace)
            .build();

    // Initialize the Temporal Client, passing in the gRPC stubs and Client options
    WorkflowClient client = WorkflowClient.newInstance(service, options);

    // Initialize a WorkerFactory, passing in the Temporal Client (WorkflowClient)
    WorkerFactory factory = WorkerFactory.newInstance(client);

    // Create a new Worker
    Worker worker = factory.newWorker("backgroundcheck-tasks");

    // Register the Workflow by passing in the class to the worker
    worker.registerWorkflowImplementationTypes(BackgroundCheckBoilerplateWorkflowImpl.class);

    // Register the Activities by passing in an Activities object used for execution
    worker.registerActivitiesImplementations(new BackgroundCheckBoilerplateActivitiesImpl());

    // Start the Worker
    factory.start();
  }
}`;

const SELFHOSTED_WORKER = `package backgroundcheckboilerplate.workers;

import backgroundcheckboilerplate.BackgroundCheckBoilerplateActivitiesImpl;
import backgroundcheckboilerplate.BackgroundCheckBoilerplateWorkflowImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowClientOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

public class SelfHostedWorker {
  public static void main(String[] args) {

    // Specify the IP address and port for the Service Stubs options
    WorkflowServiceStubsOptions stubsOptions = WorkflowServiceStubsOptions.newBuilder()
            .setTarget("mycluster.example.com:7233")
            .build();

    // Generate the gRPC stubs using the options provided
    WorkflowServiceStubs service = WorkflowServiceStubs.newServiceStubs(stubsOptions);

    // Specify the namespace in the Client options
    WorkflowClientOptions options = WorkflowClientOptions.newBuilder()
            .setNamespace("backgroundcheck_namespace")
            .build();

    // Initialize the Temporal Client, passing in the gRPC stubs and Client options
    WorkflowClient client = WorkflowClient.newInstance(service, options);

    // Initialize a WorkerFactory, passing in the Temporal Client (WorkflowClient)
    WorkerFactory factory = WorkerFactory.newInstance(client);

    // Create a new Worker
    Worker worker = factory.newWorker("backgroundcheck-tasks");

    // Register the Workflow by passing in the class to the worker
    worker.registerWorkflowImplementationTypes(BackgroundCheckBoilerplateWorkflowImpl.class);

    // Register the Activities by passing in an Activities object used for execution
    worker.registerActivitiesImplementations(new BackgroundCheckBoilerplateActivitiesImpl());

    // Start the Worker
    factory.start();
  }
}`;

const DOCKER_COMPOSE_SNIPPET = `services:
  # ...
  temporal:
    container_name: temporal
    # ...
    networks:
      - temporal-network
    ports:
      - 7233:7233
    # ...
  # ...`;

const DOCKER_NETWORK_OUTPUT = `[
  {
    "Name": "temporal-network",
    // ...
    "Containers": {
      // ...
      "53cf62f0cc6cfd2a9627a2b5a4c9f48ffe5a858f0ef7b2eaa51bf7ea8fd0e86f": {
        "Name": "temporal",
        // ...
        "IPv4Address": "172.18.0.4/16"
        // ...
      }
      // ...
    }
    // ...
  }
]`;

const DOCKERFILE = `# Use an official image of OpenJDK as the base image
FROM openjdk:11-jre-slim

# Set the working directory in the container
WORKDIR /app

# Copy the Maven project files to the container
COPY src src/
COPY pom.xml .

# Build the Maven project to a JAR file
RUN apt-get update && \\
    apt-get install -y maven && \\
    mvn clean compile

# Set the entry point for the application
CMD ["mvn", "exec:java", "-Dexec.mainClass='backgroundcheck.workers.SelfHostedWorker']`;

const WORKFLOW_START_LOCAL = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue \\
 --type BackgroundCheckBoilerplateWorkflow \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace`;

const WORKFLOW_LIST_LOCAL = `temporal workflow list \\
 --namespace backgroundcheck_namespace`;

const WORKFLOW_START_CLOUD = `temporal workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-cloud \\
 --type BackgroundCheckBoilerplateWorkflow \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key \\
 --input '"555-55-5555"' \\
 --namespace <namespace>.<account-id> \\
 --address <namespace>.<account-id>.tmprl.cloud:<port>`;

const ENV_SETUP = `# set Cloud env variables
temporal env set cloud.namespace <namespace>.<account-id>
temporal env set cloud.address <namespace>.<account-id>.tmprl.cloud:<port>
temporal env set cloud.tls-cert-path ca.pem
temporal env set cloud.tls-key-path ca.key
# set local env variables
temporal env set local.namespace <namespace>`;

const ENV_USE = `temporal workflow start \\
 # ...
 --env cloud \\
 # ...`;

const WORKFLOW_LIST_CLOUD = `temporal workflow list \\
 --tls-cert-path ca.pem \\
 --tls-key-path ca.key \\
 --namespace <namespace>.<account-id> \\
 --address <namespace>.<account-id>.tmprl.cloud:<port>`;

const WORKFLOW_START_SELFHOSTED = `temporal_docker workflow start \\
 --task-queue backgroundcheck-boilerplate-task-queue-self-hosted \\
 --type BackgroundCheckBoilerplateWorkflow \\
 --input '"555-55-5555"' \\
 --namespace backgroundcheck_namespace`;

const WORKFLOW_LIST_SELFHOSTED = `temporal_docker workflow list \\
 --namespace backgroundcheck_namespace`;

const TEST_MAVEN = `<dependency>
    <groupId>io.temporal</groupId>
    <artifactId>temporal-testing</artifactId>
    <version>1.31.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.14.1</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.20.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.20.0</version>
    <scope>test</scope>
</dependency>`;

const TEST_GRADLE = `testImplementation group: 'io.temporal', name: 'temporal-testing', version: '1.31.0'
testImplementation group: 'junit', name: 'junit-jupiter', version: '5.14.1'
testImplementation group: 'org.mockito', name: 'mockito-core', version: '5.20.0'
testImplementation group: 'org.mockito', name: 'mockito-junit-jupiter', version: '5.20.0'`;

const ACTIVITIES_TEST = `import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import io.temporal.testing.TestActivityExtension;



public class BackgroundCheckBoilerplateActivitiesTest {

  // Use JUnit Extensions to simplify the creation of the test environment.
  // This creates an environment and registers Activities to a Worker for testing.
  // If you would rather set this up yourself, look into TestActivityEnvironment
  @RegisterExtension
  public static final TestActivityExtension activityExtension = TestActivityExtension.newBuilder()
      .setActivityImplementations(new BackgroundCheckBoilerplateActivitiesImpl()).build();

  // Test the Activity in isolation from the Workflow
  @Test
  public void testSsnTraceActivity(BackgroundCheckBoilerplateActivities activities) {
    String socialSecurityNumber = "111-22-3333";

    // Run the Activity in the test environment
    String result = activities.ssnTraceActivity(socialSecurityNumber);

    // Check for the expected return value
    assertEquals("pass", result);
  }

}`;

const WORKFLOW_TEST = `import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import io.temporal.testing.TestWorkflowEnvironment;
import io.temporal.testing.TestWorkflowExtension;
import io.temporal.worker.Worker;


public class BackgroundCheckBoilerplateWorkflowTest {

  // Use JUnit Extensions to simplify the creation of the test environment.
  // This creates an environment and registers the Workflow to a Worker for testing.
  // If you would rather set this up yourself, look into TestWorkflowEnvironment
  @RegisterExtension
  public static final TestWorkflowExtension testWorkflowExtension = TestWorkflowExtension
      .newBuilder().setWorkflowTypes(BackgroundCheckBoilerplateWorkflowImpl.class)
      .setDoNotStart(true).build();

  @Test
  public void testSuccessfulBackgroundCheckBoilerplateWithMocks(TestWorkflowEnvironment testEnv,
      Worker worker, BackgroundCheckBoilerplateWorkflow workflow) {

    // Create a mock object of your Activities
    BackgroundCheckBoilerplateActivities mockedActivities =
        mock(BackgroundCheckBoilerplateActivities.class, withSettings().withoutAnnotations());

    // Specify what value should be returned when a specific Activity is invoked.
    // Your Activity must have the same method name here as it would within your Workflow
    when(mockedActivities.ssnTraceActivity("555-55-5555")).thenReturn("pass");

    // Register the Workflow's Activities with the Worker provided by the Extension
    worker.registerActivitiesImplementations(mockedActivities);

    // Start the test environment
    testEnv.start();

    // Request execution of the backgroundCheck Workflow
    // This will execute your Workflow, calling the Mocked Activities in place
    // of your actual implementation of the Activities.
    String pass_output = workflow.backgroundCheck("555-55-5555");

    assertEquals("pass", pass_output);

  }
}`;

const WORKFLOW_INTEGRATION_TEST = `import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import io.temporal.testing.TestWorkflowEnvironment;
import io.temporal.testing.TestWorkflowExtension;
import io.temporal.worker.Worker;



public class BackgroundCheckBoilerplateWorkflowIntegrationTest {

  // Use JUnit Extensions to simplify the creation of the test environment.
  // This creates an environment and registers the Workflow to a Worker for testing.
  // If you would rather set this up yourself, look into TestWorkflowEnvironment
  @RegisterExtension
  public static final TestWorkflowExtension testWorkflowExtension = TestWorkflowExtension
      .newBuilder().setWorkflowTypes(BackgroundCheckBoilerplateWorkflowImpl.class).setDoNotStart(true).build();

  @Test
  public void testSuccessfulBackgroundCheckBoilerplate(TestWorkflowEnvironment testEnv, Worker worker,
      BackgroundCheckBoilerplateWorkflow workflow) {

    // Register the Workflow's Activities with the Worker provided by the Extension
    worker.registerActivitiesImplementations(new BackgroundCheckBoilerplateActivitiesImpl());

    // Start the test environment
    testEnv.start();

    // Request execution of the backgroundCheck Workflow
    // This will execute your entire Workflow, along with every Activity the
    // Workflow calls
    String output = workflow.backgroundCheck("555-22-3333");

    // Check for the expected return value
    assertEquals("pass", output);
  }
}`;

export default function ProjectSetupChapter() {
  return (
    <Layout
      title="Project setup - Build a Background Check application with Java"
      description="Chapter 2: Construct a Temporal Application project with the Java SDK, run a Worker, start Workflows, and add a testing framework."
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
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Java", href: "/tutorials/java" },
                  {
                    label: "Background Check",
                    href: "/tutorials/java/background-check/",
                  },
                  { label: "Project setup" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Set up a Temporal Application project
            </h1>

            <MetaChips items={["~50 minutes", "Beginner", "Java"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              This chapter covers how to use a terminal, a code editor, and a
              development Cluster to create a Namespace, write a
              single-Activity Workflow, run a Worker that talks to your
              development Cluster, run a Workflow using the Temporal CLI, add a
              testing framework, and view Workflows in the Web UI.
            </p>

            <Admonition type="note" title="Construct a new Temporal Application project">
              <p>
                This chapter covers the minimum set of concepts and
                implementation details needed to build and run a Temporal
                Application using Java. By the end of this chapter you will
                know how to construct a new Temporal Application project.
              </p>
            </Admonition>

            <Admonition type="info" title="Choose your development environment">
              <p>There are three ways to follow this guide:</p>
              <ul>
                <li>
                  <a href="#choose-dev-cluster">Use a local dev server</a>
                </li>
                <li>
                  <a href="#choose-dev-cluster">Use Temporal Cloud</a>
                </li>
                <li>
                  <a href="#choose-dev-cluster">
                    Use a self-hosted environment such as Docker
                  </a>
                </li>
              </ul>
            </Admonition>

            <section className={styles.section} id="install-cli">
              <h2 className={styles.sectionTitle}>Install the Temporal CLI</h2>
              <p>
                The Temporal CLI is available on macOS, Windows, and Linux. See
                the{" "}
                <a
                  href="https://docs.temporal.io/cli"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  documentation
                </a>{" "}
                for detailed install information.
              </p>

              <h3>Install via download</h3>
              <ol>
                <li>
                  Download the version for your OS and architecture:
                  <ul>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=linux&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Linux amd64
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=linux&arch=arm64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Linux arm64
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=darwin&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        macOS amd64
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=darwin&arch=arm64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        macOS arm64
                      </a>{" "}
                      (Apple silicon)
                    </li>
                    <li>
                      <a
                        href="https://temporal.download/cli/archive/latest?platform=windows&arch=amd64"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Windows amd64
                      </a>
                    </li>
                  </ul>
                </li>
                <li>Extract the downloaded archive.</li>
                <li>
                  Add the <code>temporal</code> binary to your{" "}
                  <code>PATH</code> (<code>temporal.exe</code> for Windows).
                </li>
              </ol>

              <h3>Install via Homebrew</h3>
              <CodeBlock language="bash">brew install temporal</CodeBlock>

              <h3>Build the Temporal CLI</h3>
              <ol>
                <li>
                  Install{" "}
                  <a
                    href="https://go.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Go
                  </a>
                </li>
                <li>Clone the repository</li>
                <li>
                  Switch to the cloned directory and run{" "}
                  <code>go build ./cmd/temporal</code>
                </li>
              </ol>

              <Admonition type="note">
                <p>
                  The executable will be at <code>temporal</code> (
                  <code>temporal.exe</code> for Windows). See the{" "}
                  <a
                    href="https://docs.temporal.io/cli"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    documentation
                  </a>{" "}
                  for detailed usage information.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="choose-dev-cluster">
              <h2 className={styles.sectionTitle}>
                Choose a development Cluster
              </h2>
              <p>
                Choose a development environment based on your requirements.
                The Temporal Server source is MIT-licensed and can be run in
                many ways, but for most developers the choices below are the
                best starting points:
              </p>
              <ul>
                <li>Local development server</li>
                <li>Temporal Cloud</li>
                <li>Self-hosted Temporal Cluster</li>
              </ul>

              <Admonition type="info" title="Temporal does not directly run your code">
                <p>
                  In every scenario, the "Temporal Platform" does not host and
                  run your Workers (application code). It is up to you, the
                  developer, to host your application code. The Temporal
                  Platform ensures that properly written code durably executes
                  in the face of platform-level failures.
                </p>
              </Admonition>

              <h3>Local dev server</h3>
              <p>
                Use the local development server if you are new to Temporal,
                want to start from scratch, and don't have a self-hosted
                environment or a Temporal Cloud account. The Temporal CLI
                comes bundled with a development server and provides a fast way
                to start running Temporal Applications. Note that the local
                development server does not emit metrics, so for performance
                tuning use a self-hosted Cluster or Temporal Cloud.
              </p>
              <p>
                Open a new terminal and run the following command to start the
                dev server:
              </p>
              <CodeBlock language="bash">temporal server start-dev</CodeBlock>
              <p>
                This automatically starts the Temporal Web UI at{" "}
                <a
                  href="http://localhost:8233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233
                </a>
                , creates a default Namespace, and creates an in-memory
                database. For more details, see the{" "}
                <a
                  href="https://docs.temporal.io/cli/server#start-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CLI reference
                </a>
                .
              </p>
              <p>
                The development server creates a default Namespace named "
                <code>default</code>", but it's a good idea to practice creating
                a custom one. Use{" "}
                <code>temporal operator namespace create</code>:
              </p>
              <CodeBlock language="bash">
                temporal operator namespace create backgroundcheck_namespace
              </CodeBlock>

              <h3>Temporal Cloud</h3>
              <p>
                If you do not have a Temporal Cloud account, you can request
                one using the link on the{" "}
                <a
                  href="https://docs.temporal.io/cloud/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Started with Temporal Cloud
                </a>{" "}
                guide. Start with Temporal Cloud if you already have a
                production use case or need to move a scalable proof of concept
                into production.
              </p>
              <p>
                To create a Namespace in Temporal Cloud, follow the
                instructions in{" "}
                <a
                  href="https://docs.temporal.io/cloud/namespaces#create-a-namespace"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to create a Namespace
                </a>
                .
              </p>

              <Admonition type="info" title="Safely store your certificate and private key">
                <p>
                  Store certificates and private keys generated for your
                  Namespace as files or environment variables in your project.
                  You need access to your certificate and key to run your
                  Workers and start Workflows. For more, see{" "}
                  <a
                    href="https://docs.temporal.io/cloud/certificates"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How to manage certificates in Temporal Cloud
                  </a>
                  .
                </p>
              </Admonition>

              <h3>Self-hosted Temporal Cluster</h3>
              <p>
                Use a self-hosted environment if you need production-level
                features but don't yet need or want to pay for Temporal Cloud.
                Running a self-hosted Cluster lets you try different databases,
                view Cluster metrics, use custom{" "}
                <a
                  href="https://docs.temporal.io/visibility#search-attribute"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Search Attributes
                </a>
                , and use the{" "}
                <a
                  href="https://docs.temporal.io/clusters#archival"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Archival
                </a>{" "}
                feature.
              </p>
              <p>To follow along with self-hosted parts of this guide, install:</p>
              <ul>
                <li>
                  <a
                    href="https://docs.docker.com/engine/install"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docker
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.docker.com/compose/install"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docker Compose
                  </a>
                </li>
              </ul>
              <p>
                Clone the{" "}
                <a
                  href="https://github.com/temporalio/docker-compose.git"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporalio/docker-compose
                </a>{" "}
                repository, change into its root, and run{" "}
                <code>docker compose up</code>:
              </p>
              <CodeBlock language="bash">
                {`git clone https://github.com/temporalio/docker-compose.git
cd  docker-compose
docker compose up`}
              </CodeBlock>
              <p>Create a command alias for the Temporal CLI:</p>
              <CodeBlock language="bash">
                alias temporal_docker="docker exec temporal-admin-tools temporal"
              </CodeBlock>
              <p>Create a Namespace:</p>
              <CodeBlock language="bash">
                temporal_docker operator namespace create backgroundcheck_namespace
              </CodeBlock>
            </section>

            <section className={styles.section} id="boilerplate-project">
              <h2 className={styles.sectionTitle}>
                Boilerplate Temporal Application project code
              </h2>
              <p>
                Start with a single-Activity Workflow and register those
                functions with a Worker. After the Worker is running and you've
                started a Workflow Execution, add a testing framework.
              </p>

              <h3>Project structure</h3>
              <p>
                You can organize Temporal Application code to suit various
                needs in a way that aligns with your language's idiomatic
                style. The best practice is to group Workflows together,
                Activities together, and separate your Worker process into a
                standalone file.
              </p>
              <p>
                For monorepo-style organization, consider a designated Workflow
                directory per use case and a dedicated place for shared
                Activities:
              </p>
              <CodeBlock>{MONOREPO_STRUCTURE}</CodeBlock>
              <p>
                If you are following along with this guide, your project will
                look like this:
              </p>
              <CodeBlock>{PROJECT_STRUCTURE}</CodeBlock>

              <h3>Initialize a Java project with Maven</h3>
              <p>
                If you are using Maven, ensure your <code>pom.xml</code> sets{" "}
                <code>compiler.source</code> and <code>compiler.target</code>{" "}
                to at least <code>1.8</code>:
              </p>
              <CodeBlock language="xml">{POM_PROPERTIES}</CodeBlock>
              <p>
                Include the Temporal SDK and testing packages in the{" "}
                <code>dependencies</code> section:
              </p>
              <CodeBlock language="xml">{POM_DEPENDENCY}</CodeBlock>
              <p>
                Then run <code>mvn clean compile</code> to perform the first
                compilation and pull in the dependencies.
              </p>

              <h3>Initialize a Java project with Gradle</h3>
              <p>
                If you are using Gradle, add the Temporal SDK to the{" "}
                <code>dependencies</code> section of your{" "}
                <code>build.gradle</code> file:
              </p>
              <CodeBlock language="groovy">{GRADLE_DEPENDENCY}</CodeBlock>
              <p>
                Then run <code>./gradlew build</code> to perform a test build
                and download the dependencies.
              </p>

              <h3>Boilerplate Workflow code</h3>
              <p>
                A{" "}
                <a
                  href="https://docs.temporal.io/workflows#workflow-definition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflow Definition
                </a>{" "}
                in the Temporal Java SDK is an interface and its
                implementation.
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckboilerplate/BackgroundCheckBoilerplateWorkflow.java"
              >
                {WORKFLOW_INTERFACE}
              </CodeBlock>
              <p>
                Annotate the interface declaration with{" "}
                <code>@WorkflowInterface</code> and the Workflow Method with{" "}
                <code>@WorkflowMethod</code>. There can only be one Workflow
                Method per Workflow Definition.
              </p>
              <p>Now define the implementation:</p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckboilerplate/BackgroundCheckBoilerplateWorkflowImpl.java"
              >
                {WORKFLOW_IMPL}
              </CodeBlock>
              <p>
                To have a Workflow call Activities, instantiate an object
                representing those Activities. Temporal requires that you set
                either <code>StartToCloseTimeout</code> or{" "}
                <code>ScheduleToCloseTimeout</code> when creating your
                Activities stub. See the{" "}
                <a
                  href="https://docs.temporal.io/activities#start-to-close-timeout"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  documentation
                </a>{" "}
                for more on these options.
              </p>
              <p>
                Workflow Methods support parameters like regular Java methods,
                but all Workflow Definition parameters must be serializable
                (using the Jackson JSON Payload Converter). To request the
                execution of an{" "}
                <a
                  href="https://docs.temporal.io/activities#activity-execution"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activity Execution
                </a>
                , call the Activity Method from within the Workflow Method
                using the <code>activities</code> object.
              </p>

              <h3>Boilerplate Activity code</h3>
              <p>
                An Activity is also defined as an interface and its
                implementation.
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckboilerplate/BackgroundCheckBoilerplateActivities.java"
              >
                {ACTIVITIES_INTERFACE}
              </CodeBlock>
              <p>
                Annotate the interface with <code>@ActivityInterface</code>.
                Designate methods within the interface as Activity Methods by
                annotating them with <code>@ActivityMethod</code>. There can be
                multiple Activity Methods per Activity Definition.
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckboilerplate/BackgroundCheckBoilerplateActivitiesImpl.java"
              >
                {ACTIVITIES_IMPL}
              </CodeBlock>

              <h3>Run your Workflow and Activities using a Worker</h3>
              <p>
                The Worker establishes a persistent connection to the Temporal
                Cluster and begins polling a Task Queue, seeking work to
                perform. To run a Worker with a local development server,
                generate gRPC stubs, initialize a Temporal Client, build a
                WorkerFactory, register the Workflow and Activities, and start
                the Worker.
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckboilerplate/workers/DevServerWorker.java"
              >
                {DEV_WORKER}
              </CodeBlock>

              <h4>Run a Temporal Cloud Worker</h4>
              <p>
                A Temporal Cloud Worker requires the Cloud Namespace, address,
                and the certificate and private key associated with the
                Namespace:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckboilerplate/workers/CloudWorker.java"
              >
                {CLOUD_WORKER}
              </CodeBlock>
              <p>
                Copy the Namespace Id and the gRPC endpoint from the Namespace
                detail page on{" "}
                <a
                  href="https://cloud.temporal.io/namespaces"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Cloud Namespaces
                </a>
                .
              </p>

              <h4>Run a Self-hosted Worker</h4>
              <p>
                To deploy a self-hosted Worker to your Docker environment,
                configure your Worker with the appropriate IP address and
                port. The default <code>docker-compose.yml</code> file in the{" "}
                <code>temporalio/docker-compose</code> repo has the Temporal
                Server exposed on port <code>7233</code> on the{" "}
                <code>temporal-network</code>:
              </p>
              <CodeBlock language="yaml">{DOCKER_COMPOSE_SNIPPET}</CodeBlock>
              <p>You can see the available networks with:</p>
              <CodeBlock language="bash">docker network ls</CodeBlock>
              <p>Inspect the network to find the Temporal container's IP address:</p>
              <CodeBlock language="bash">
                docker network inspect temporal-network
              </CodeBlock>
              <CodeBlock language="json">{DOCKER_NETWORK_OUTPUT}</CodeBlock>
              <p>
                Set the IP address and port in the Service Stubs options and
                the Namespace in the Temporal Client options:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/backgroundcheckboilerplate/workers/SelfHostedWorker.java"
              >
                {SELFHOSTED_WORKER}
              </CodeBlock>
              <p>
                Add a Docker file named <code>dockerfile</code> with the
                following contents to the root of your project:
              </p>
              <CodeBlock language="dockerfile" title="dockerfile">
                {DOCKERFILE}
              </CodeBlock>

              <Admonition type="info">
                <p>
                  Make sure the Java version matches the one you used when
                  developing your application and is version <code>1.8</code>{" "}
                  or greater.
                </p>
              </Admonition>

              <p>Build the Docker image:</p>
              <CodeBlock language="bash">
                docker build . -t backgroundcheck-worker-image:latest
              </CodeBlock>
              <p>Run the Worker on the same network as the Temporal Cluster:</p>
              <CodeBlock language="bash">
                docker run --network temporal-network backgroundcheck-worker-image:latest
              </CodeBlock>
            </section>

            <section className={styles.section} id="start-workflow">
              <h2 className={styles.sectionTitle}>
                Start a Workflow with the Temporal CLI
              </h2>
              <p>
                You can use the Temporal CLI to start a Workflow whether you
                are using a local development server, Temporal Cloud, or a
                self-hosted environment. The command takes additional options
                for Temporal Cloud and self-hosted environments.
              </p>

              <h3>Local dev server</h3>
              <p>
                Use <code>temporal workflow start</code> to start your
                Workflow:
              </p>
              <CodeBlock language="bash">{WORKFLOW_START_LOCAL}</CodeBlock>
              <p>
                For more details, see the{" "}
                <a
                  href="https://docs.temporal.io/cli/workflow#start"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  temporal workflow start
                </a>{" "}
                command reference.
              </p>
              <p>List all Workflows in the Namespace:</p>
              <CodeBlock language="bash">{WORKFLOW_LIST_LOCAL}</CodeBlock>
              <p>
                The local development server starts the Web UI at{" "}
                <a
                  href="http://localhost:8233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:8233
                </a>
                . Use the Namespace dropdown to select the project Namespace
                you created earlier.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/web-ui-namespace-selection.png`}
                  alt="Web UI Namespace selection"
                  className={styles.diagramImage}
                />
              </p>

              <h3>Temporal Cloud</h3>
              <p>
                Make sure to specify the certificate and private key arguments:
              </p>
              <CodeBlock language="bash">{WORKFLOW_START_CLOUD}</CodeBlock>
              <p>
                Make sure the certificate path, private key path, Namespace,
                and address match your project.
              </p>

              <Admonition type="info" title="Use environment variables">
                <p>
                  Use environment variables to quickly switch between a local
                  dev server and Temporal Cloud. You can customize the
                  environment names:
                </p>
                <CodeBlock language="bash">{ENV_SETUP}</CodeBlock>
                <p>
                  Then provide a single <code>--env</code> option:
                </p>
                <CodeBlock language="bash">{ENV_USE}</CodeBlock>
              </Admonition>

              <p>List Workflows in Temporal Cloud:</p>
              <CodeBlock language="bash">{WORKFLOW_LIST_CLOUD}</CodeBlock>
              <p>
                Visit the Workflows page of your Cloud Namespace at
                <code>
                  {" "}
                  https://cloud.temporal.io/namespaces/&lt;namespace&gt;.&lt;account-id&gt;/workflows
                </code>
                :
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/cloud-view-workflows.png`}
                  alt="View Workflows in the Cloud UI"
                  className={styles.diagramImage}
                />
              </p>

              <h3>Self-hosted</h3>
              <p>Use your Temporal CLI alias to start the Workflow:</p>
              <CodeBlock language="bash">
                {WORKFLOW_START_SELFHOSTED}
              </CodeBlock>
              <p>List Workflow Executions within the Namespace:</p>
              <CodeBlock language="bash">{WORKFLOW_LIST_SELFHOSTED}</CodeBlock>
              <p>
                Use the Namespace dropdown in the Web UI to select the project
                Namespace you created earlier.
              </p>
            </section>

            <section className={styles.section} id="test-framework">
              <h2 className={styles.sectionTitle}>Add a testing framework</h2>
              <p>
                The Temporal Java SDK provides a test framework to facilitate
                Workflow unit and integration testing. The framework provides
                the <code>TestWorkflowEnvironment</code> and{" "}
                <code>TestActivityEnvironment</code> classes, which include an
                in-memory implementation of the Temporal service with
                automatic time skipping. This lets you easily test
                long-running Workflows in seconds.
              </p>
              <p>
                You can use the testing environments with any Java unit testing
                framework. This guide uses JUnit 5.
              </p>

              <h3>Set up testing dependencies</h3>
              <p>
                Add{" "}
                <a
                  href="https://search.maven.org/artifact/io.temporal/temporal-testing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>io.temporal:temporal-testing</code>
                </a>{" "}
                as a dependency to your project.
              </p>
              <p>
                <strong>Apache Maven:</strong>
              </p>
              <CodeBlock language="xml">{TEST_MAVEN}</CodeBlock>
              <p>
                <strong>Gradle Groovy DSL:</strong>
              </p>
              <CodeBlock language="groovy">{TEST_GRADLE}</CodeBlock>
              <p>
                Set the version that matches your dependency version of the{" "}
                <a
                  href="https://github.com/temporalio/sdk-java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Java SDK
                </a>
                .
              </p>

              <h3>Testing Activities</h3>
              <p>
                Temporal provides <code>TestActivityEnvironment</code> and{" "}
                <code>TestActivityExtension</code> classes to test Activities
                outside the scope of a Workflow. Testing Activities is similar
                to testing non-Temporal Java code. Some examples of what to
                test:
              </p>
              <ul>
                <li>Exceptions thrown when invoking the Activity Execution</li>
                <li>
                  Exceptions thrown when checking for the result of the
                  Activity Execution
                </li>
                <li>Activity return values</li>
              </ul>
              <p>
                The following example asserts that the expected value was
                returned by invoking the Activity:
              </p>
              <CodeBlock
                language="java"
                title="src/test/java/backgroundcheckboilerplate/BackgroundCheckBoilerplateActivitiesTest.java"
              >
                {ACTIVITIES_TEST}
              </CodeBlock>

              <h3>Testing Workflows</h3>
              <p>
                Temporal provides <code>TestWorkflowEnvironment</code> and{" "}
                <code>TestWorkflowExtension</code> classes for Workflow
                testing. You can either test the Workflow code without invoking
                real Activities by mocking the Workflow's Activities, or test
                the Workflow and its Activities together. This section covers
                the first scenario.
              </p>
              <CodeBlock
                language="java"
                title="src/test/java/backgroundcheckboilerplate/BackgroundCheckBoilerplateWorkflowTest.java"
              >
                {WORKFLOW_TEST}
              </CodeBlock>
              <p>
                First, register your Workflow with the{" "}
                <code>TestWorkflowExtension</code>. To test using mocked
                Activities, create a mock object of your Activity class. Mock
                the Activity method so that when a specific value is passed it
                returns a specific result. Then register the mocked Activities
                with the Worker, start the test environment, invoke your
                Workflow, and assert that the results are what you expected.
              </p>

              <h3>Testing Workflow and Activity together (Integration Testing)</h3>
              <p>
                This example tests a complete Workflow by invoking the
                Activities the Workflow calls - it is, in reality, an
                integration test. Integration testing is useful for ensuring
                the complete success of your entire Workflow, but any
                downstream dependencies of the Activities must be online for
                the testing.
              </p>
              <CodeBlock
                language="java"
                title="src/test/java/backgroundcheckboilerplate/BackgroundCheckBoilerplateWorkflowIntegrationTest.java"
              >
                {WORKFLOW_INTEGRATION_TEST}
              </CodeBlock>
              <p>
                We recommend either having an entirely separate testing
                environment for testing your Workflows, or testing your
                Workflow and Activity code in isolation, as detailed above.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/java/background-check/introduction/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Introduction</span>
              </Link>
              <Link
                to="/tutorials/java/background-check/durable-execution/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Develop for durability
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
