// Single-page tutorial: Build an email drip campaign with Java and Spring Boot.

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

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "workflow", label: "Develop the Workflow" },
  { id: "activity", label: "Develop an Activity" },
  { id: "worker", label: "Create the Worker" },
  { id: "api-server", label: "Build the API server" },
  { id: "query", label: "Add a Query" },
  { id: "unsubscribe", label: "Unsubscribe users" },
  { id: "server-app", label: "Build the server app" },
  { id: "integration-test", label: "Create an integration test" },
  { id: "conclusion", label: "Conclusion" },
];

const BUILD_GRADLE_DEPS = `dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    implementation "io.temporal:temporal-spring-boot-starter-alpha:$javaSDKVersion"
}`;

const SETTINGS_GRADLE = `rootProject.name = 'email-subscription'`;

const PROJECT_STRUCTURE = `src
├── main
│   ├── java
│   │   └── subscription
│   │       ├── Controller.java
│   │       ├── Starter.java
│   │       ├── activities
│   │       │   ├── SendEmailActivities.java
│   │       │   └── SendEmailActivitiesImpl.java
│   │       ├── model
│   │       │   ├── Constants.java
│   │       │   ├── EmailDetails.java
│   │       │   ├── Message.java
│   │       │   └── WorkflowData.java
│   │       └── workflows
│   │           ├── SendEmailWorkflow.java
│   │           └── SendEmailWorkflowImpl.java
│   └── resources
│       └── application.yaml
└── test
    └── java
        └── StarterTest.java`;

const CONSTANTS_JAVA = `package subscription.model;

public class Constants {

    public static final String TASK_QUEUE_NAME = "email_subscription";
}`;

const MESSAGE_JAVA = `package subscription.model;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

public class Message {
    public String message;

    public Message() {}

    public Message(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}`;

const EMAIL_DETAILS_JAVA = `package subscription.model;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

public class EmailDetails {
    public String email;
    public String message;
    public int count;
    public boolean subscribed;

    public EmailDetails() {}

    public EmailDetails(String email, String message, int count, boolean subscribed) {
        this.email = email;
        this.message = message;
        this.count = count;
        this.subscribed = subscribed;
    }
}`;

const WORKFLOW_DATA_JAVA = `package subscription.model;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

public class WorkflowData {
    public String email;

    public WorkflowData() {}

    public WorkflowData(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}`;

const SEND_EMAIL_WORKFLOW_INTERFACE = `package subscription.workflows;

import subscription.model.EmailDetails;
import subscription.model.WorkflowData;
import io.temporal.workflow.QueryMethod;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface SendEmailWorkflow {

    @WorkflowMethod
    public void run(WorkflowData data);

    @QueryMethod
    public EmailDetails details();
}`;

const SEND_EMAIL_WORKFLOW_IMPL = `package subscription.workflows;

import io.temporal.spring.boot.WorkflowImpl;
import subscription.activities.SendEmailActivities;
import subscription.model.EmailDetails;
import subscription.model.WorkflowData;
import io.temporal.activity.ActivityOptions;
import io.temporal.failure.CanceledFailure;
import io.temporal.workflow.CancellationScope;
import io.temporal.workflow.Workflow;

import java.time.Duration;

@WorkflowImpl(workers = "send-email-worker")
public class SendEmailWorkflowImpl implements SendEmailWorkflow {

    private EmailDetails emailDetails = new EmailDetails();

    private final ActivityOptions options =
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofSeconds(10))
                    .build();

    private final SendEmailActivities activities =
            Workflow.newActivityStub(SendEmailActivities.class, options);

    @Override
    public void run(WorkflowData data) {

        int duration = 12;
        emailDetails.email = data.email;
        emailDetails.message = "Welcome to our Subscription Workflow!";
        emailDetails.subscribed = true;
        emailDetails.count = 0;

        while (emailDetails.subscribed) {

            emailDetails.count += 1;
            if (emailDetails.count > 1) {
                emailDetails.message = "Thank you for staying subscribed!";
            }

            try {
                activities.sendEmail(emailDetails);
                Workflow.sleep(Duration.ofSeconds(duration));
            }
            catch (CanceledFailure e) {
                emailDetails.subscribed = false;
                emailDetails.message = "Sorry to see you go";
                CancellationScope sendGoodbye =
                        Workflow.newDetachedCancellationScope(() -> activities.sendEmail(emailDetails));
                sendGoodbye.run();
                throw e;
            }
        }
    }

    @Override
    public EmailDetails details() {

        return emailDetails;
    }
}`;

const SEND_EMAIL_ACTIVITIES_INTERFACE = `package subscription.activities;

import subscription.model.EmailDetails;
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

@ActivityInterface
public interface SendEmailActivities {
    @ActivityMethod
    public String sendEmail(EmailDetails details);
}`;

const SEND_EMAIL_ACTIVITIES_IMPL = `package subscription.activities;

import io.temporal.spring.boot.ActivityImpl;
import org.springframework.stereotype.Component;
import subscription.model.EmailDetails;
import java.text.MessageFormat;

@Component
@ActivityImpl(workers = "send-email-worker")
public class SendEmailActivitiesImpl implements SendEmailActivities {
    @Override
    public String sendEmail(EmailDetails details) {
        String response = MessageFormat.format(
            "Sending email to {0} with message: {1}, count: {2}",
            details.email, details.message, details.count);
        System.out.println(response);
        return "success";
    }
}`;

const APPLICATION_YAML = `spring:
  application:
    name: email-subscription
  temporal:
    namespace: default
    connection:
      target: 127.0.0.1:7233
    workers:
      - name: send-email-worker
        task-queue: email_subscription
    workersAutoDiscovery:
      packages:
        - subscription.workflows
        - subscription.activities`;

const CONTROLLER_HEADER = `package subscription;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import subscription.model.*;
import subscription.workflows.SendEmailWorkflow;

@RestController
public class Controller {

    @Autowired
    WorkflowClient client;
`;

const SUBSCRIBE_ENDPOINT = `    @PostMapping(value = "/subscribe", produces = MediaType.APPLICATION_JSON_VALUE)
    public Message startSubscription(@RequestBody WorkflowData data) {

        WorkflowOptions options = WorkflowOptions.newBuilder()
                .setWorkflowId(data.getEmail())
                .setTaskQueue(Constants.TASK_QUEUE_NAME)
                .build();

        SendEmailWorkflow workflow = client.newWorkflowStub(SendEmailWorkflow.class, options);
        WorkflowClient.start(workflow::run,data);

        return new Message("Resource created successfully");
    }`;

const DETAILS_QUERY = `    @QueryMethod
    public EmailDetails details();`;

const DETAILS_IMPL = `    @Override
    public EmailDetails details() {

        return emailDetails;
    }`;

const GET_DETAILS_ENDPOINT = `    @GetMapping(value = "/get_details", produces = MediaType.APPLICATION_JSON_VALUE)
    public EmailDetails getQuery(@RequestParam String email) {

        SendEmailWorkflow workflow = client.newWorkflowStub(SendEmailWorkflow.class, email);
        return workflow.details();
    }`;

const UNSUBSCRIBE_ENDPOINT = `    @DeleteMapping(value = "/unsubscribe", produces = MediaType.APPLICATION_JSON_VALUE)
    public Message endSubscription(@RequestBody WorkflowData data) {

        SendEmailWorkflow workflow = client.newWorkflowStub(SendEmailWorkflow.class, data.getEmail());
        WorkflowStub workflowStub = WorkflowStub.fromTyped(workflow);
        workflowStub.cancel();

        return new Message("Requesting cancellation");
    }`;

const CANCELLATION_BLOCK = `            try {
                activities.sendEmail(emailDetails);
                Workflow.sleep(Duration.ofSeconds(duration));
            }
            catch (CanceledFailure e) {
                emailDetails.subscribed = false;
                emailDetails.message = "Sorry to see you go";
                CancellationScope sendGoodbye =
                        Workflow.newDetachedCancellationScope(() -> activities.sendEmail(emailDetails));
                sendGoodbye.run();
                throw e;
            }`;

const STARTER_JAVA = `package subscription;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Starter {

    public static void main(String[] args) {

        SpringApplication.run(Starter.class, args);
    }
}`;

const STARTER_TEST = `import subscription.activities.SendEmailActivitiesImpl;
import subscription.workflows.SendEmailWorkflow;
import subscription.workflows.SendEmailWorkflowImpl;
import subscription.model.WorkflowData;
import io.temporal.api.common.v1.WorkflowExecution;
import io.temporal.api.enums.v1.WorkflowExecutionStatus;
import io.temporal.api.workflowservice.v1.DescribeWorkflowExecutionRequest;
import io.temporal.api.workflowservice.v1.DescribeWorkflowExecutionResponse;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowStub;
import io.temporal.testing.TestWorkflowEnvironment;
import io.temporal.testing.TestWorkflowExtension;
import io.temporal.worker.Worker;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import static org.junit.jupiter.api.Assertions.assertEquals;


public class StarterTest {

    @RegisterExtension
    public static final TestWorkflowExtension testWorkflowExtension =
            TestWorkflowExtension.newBuilder()
                    .setWorkflowTypes(SendEmailWorkflowImpl.class)
                    .setDoNotStart(true)
                    .build();

    @Test
    public void testCreateEmail(TestWorkflowEnvironment testEnv, Worker worker, SendEmailWorkflow workflow) {

        WorkflowClient client = testEnv.getWorkflowClient();
        worker.registerActivitiesImplementations(new SendEmailActivitiesImpl());
        testEnv.start();

        WorkflowData data = new WorkflowData("test@example.com");

        WorkflowExecution execution = WorkflowClient.start(workflow::run,data);

        DescribeWorkflowExecutionResponse response = client.getWorkflowServiceStubs().blockingStub().describeWorkflowExecution(
                DescribeWorkflowExecutionRequest.newBuilder()
                        .setNamespace(testEnv.getNamespace())
                        .setExecution(execution)
                        .build()
        );

        WorkflowExecutionStatus status = response.getWorkflowExecutionInfo().getStatus();

        assertEquals(WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_RUNNING, status);
        testEnv.close();
    }

    @Test
    public void testCancelWorkflow (TestWorkflowEnvironment testEnv, Worker worker, SendEmailWorkflow workflow) {

        WorkflowClient client = testEnv.getWorkflowClient();
        worker.registerActivitiesImplementations(new SendEmailActivitiesImpl());
        testEnv.start();

        WorkflowData data = new WorkflowData("test@example.com");

        WorkflowExecution execution = WorkflowClient.start(workflow::run,data);

        WorkflowStub workflowStub = client.newUntypedWorkflowStub(execution.getWorkflowId());
        workflowStub.cancel();

        DescribeWorkflowExecutionResponse response;
        WorkflowExecutionStatus status;
        do {
             response = client.getWorkflowServiceStubs().blockingStub().describeWorkflowExecution(
                    DescribeWorkflowExecutionRequest.newBuilder()
                            .setNamespace(testEnv.getNamespace())
                            .setExecution(execution)
                            .build()
            );

             status = response.getWorkflowExecutionInfo().getStatus();
        }
        while (status != WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_CANCELED);

        assertEquals(WorkflowExecutionStatus.WORKFLOW_EXECUTION_STATUS_CANCELED, status);
        testEnv.close();
    }
}`;

const TEST_OUTPUT = `BUILD SUCCESSFUL in 5s
4 actionable tasks: 4 executed`;

export default function EmailDripCampaignTutorial() {
  return (
    <Layout
      title="Build an email drip campaign with Java and Spring Boot"
      description="Implement an email drip campaign application with Temporal's Workflows, Activities, and Queries, driven by a Spring Boot web action."
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
                  { label: "Build an email drip campaign" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build an email drip campaign with Java and Spring Boot
            </h1>

            <MetaChips items={["~60 minutes", "Beginner", "Java"]} />

            <p className={styles.intro}>
              Build an email drip campaign and a subscription web application
              in Java. You'll create a web server using the{" "}
              <a
                href="https://spring.io/projects/spring-boot"
                target="_blank"
                rel="noopener noreferrer"
              >
                Spring Boot
              </a>{" "}
              framework to handle requests and use Temporal Workflows,
              Activities, and Queries to build the core of the application.
            </p>

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                Your web server will handle requests from the end user and
                interact with a Temporal Workflow to manage the email
                subscription process. Since you're building the business
                logic with Temporal's Workflows and Activities, you'll be
                able to use Temporal to manage each subscription rather than
                relying on a separate database or Task Queue. This reduces
                the complexity of the code you have to write and support.
              </p>
              <p>
                You'll create an endpoint for users to give their email
                address, and then create a new Workflow execution using that
                email address which will simulate sending an email message at
                certain intervals. The user can check on the status of their
                subscription, which you'll handle using a Query, and they
                can end the subscription at any time by unsubscribing, which
                you'll handle by cancelling the Workflow Execution.
              </p>
              <p>
                By the end of this tutorial, you'll have a clear understanding
                of how to use Temporal to create and manage long-running
                Workflows within a web application.
              </p>
              <p>
                You'll find the code for this tutorial on GitHub in the{" "}
                <a
                  href="https://github.com/temporalio/email-drip-campaign-project-java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  email-drip-campaign-project-java
                </a>{" "}
                repository.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li>
                  <Link to="/getting_started/java/dev_environment/">
                    Set up a local development environment for Temporal and
                    Java
                  </Link>
                  .
                </li>
                <li>
                  Complete the{" "}
                  <Link to="/getting_started/java/hello_world_in_java/">
                    Hello World
                  </Link>{" "}
                  tutorial to ensure you understand the basics of creating
                  Workflows and Activities with Temporal.
                </li>
                <li>
                  This application uses Gradle build automation. Make sure
                  you have installed{" "}
                  <a
                    href="https://gradle.org/install/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gradle
                  </a>
                  .
                </li>
                <li>
                  You'll use{" "}
                  <a
                    href="https://start.spring.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Spring Initializer
                  </a>{" "}
                  to generate a project with a <code>build.gradle</code> file
                  for Java. Add Spring Web dependencies before generating the
                  project. After creating the <code>build.gradle</code> file,
                  add your <code>temporal-sdk</code> and{" "}
                  <code>temporal-spring-boot</code> dependencies.
                </li>
              </ul>
              <p>
                Your <code>build.gradle</code> dependencies section should
                look like this:
              </p>
              <CodeBlock language="groovy">{BUILD_GRADLE_DEPS}</CodeBlock>
              <p>
                Create <code>settings.gradle</code> in the root of your
                directory with the following line:
              </p>
              <CodeBlock language="groovy" title="settings.gradle">
                {SETTINGS_GRADLE}
              </CodeBlock>
              <p>
                With the Gradle configurations complete, you're ready to code
                a Spring Boot web application.
              </p>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>Develop the Workflow</h2>
              <p>
                A Workflow defines a sequence of steps defined by writing
                code, known as a Workflow Definition, and is carried out by
                running that code, which results in a Workflow Execution.
              </p>
              <p>
                The Temporal Java SDK recommends the use of a single data
                class for parameters and return types. This lets you add
                fields without breaking compatibility. Before writing the
                Workflow Definition, you'll define the data objects used by
                the Workflow Definitions, and the Task Queue name you'll use
                in your Worker.
              </p>
              <p>Create the package directories for this project:</p>
              <CodeBlock>{PROJECT_STRUCTURE}</CodeBlock>
              <p>Build the model files, which will:</p>
              <ol>
                <li>
                  Set the Task Queue field to <code>email_subscription</code>.
                </li>
                <li>
                  Add <code>Message</code>, <code>WorkflowData</code>, and{" "}
                  <code>EmailDetails</code> data classes.
                </li>
              </ol>
              <p>
                Create a new file called <code>Constants.java</code> in{" "}
                <code>src/main/java/subscription/model</code>:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/model/Constants.java"
              >
                {CONSTANTS_JAVA}
              </CodeBlock>
              <p>
                Create a new file called <code>Message.java</code> in{" "}
                <code>src/main/java/subscription/model</code>:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/model/Message.java"
              >
                {MESSAGE_JAVA}
              </CodeBlock>
              <p>
                Create a new file called <code>EmailDetails.java</code> in{" "}
                <code>src/main/java/subscription/model</code>:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/model/EmailDetails.java"
              >
                {EMAIL_DETAILS_JAVA}
              </CodeBlock>
              <p>
                Create a new file called <code>WorkflowData.java</code> in{" "}
                <code>src/main/java/subscription/model</code>:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/model/WorkflowData.java"
              >
                {WORKFLOW_DATA_JAVA}
              </CodeBlock>
              <p>The following describes each data class:</p>
              <ul>
                <li>
                  <code>WorkflowData</code>: starts the Workflow Execution.
                  Contains <code>email</code>: a string to pass the user's
                  email.
                </li>
                <li>
                  <code>EmailDetails</code>: holds data about the current
                  state of the subscription.
                  <ul>
                    <li>
                      <code>email</code>: a string to pass a user's email.
                    </li>
                    <li>
                      <code>message</code>: a string to pass a message to the
                      user.
                    </li>
                    <li>
                      <code>count</code>: an integer to track the number of
                      emails sent.
                    </li>
                    <li>
                      <code>subscribed</code>: a boolean to track whether the
                      user is currently subscribed.
                    </li>
                  </ul>
                </li>
                <li>
                  <code>Message</code>: holds data for a single message.
                  Contains <code>message</code>: a string to pass a message to
                  the user.
                </li>
              </ul>
              <p>
                When you Query your Workflow to retrieve the current state of
                the Workflow, you'll use the <code>EmailDetails</code> data
                class.
              </p>
              <p>
                Now that you have the Task Queue and the data classes
                defined, you can write the Workflow Definition. Create new
                files called <code>SendEmailWorkflow.java</code> and{" "}
                <code>SendEmailWorkflowImpl.java</code>:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/workflows/SendEmailWorkflow.java"
              >
                {SEND_EMAIL_WORKFLOW_INTERFACE}
              </CodeBlock>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/workflows/SendEmailWorkflowImpl.java"
              >
                {SEND_EMAIL_WORKFLOW_IMPL}
              </CodeBlock>
              <p>
                The <code>run()</code> method, annotated with{" "}
                <code>@WorkflowMethod</code>, takes in the email address as
                an argument. This method initializes the <code>email</code>,{" "}
                <code>message</code>, <code>subscribed</code>, and{" "}
                <code>count</code> fields of the <code>emailDetails</code>{" "}
                instance.
              </p>
              <p>
                The <code>SendEmailWorkflow</code> class has a loop that
                checks if the subscription is active by checking if{" "}
                <code>emailDetails.subscribed</code> is true. If it is, it
                starts the <code>sendEmail()</code> Activity.
              </p>
              <p>
                The while loop increments the <code>count</code> and calls
                the <code>sendEmail()</code> Activity with the current{" "}
                <code>EmailDetails</code> object. The loop continues as long
                as <code>emailDetails.subscribed</code> is true. A{" "}
                <code>start_to_close_timeout</code> parameter tells the
                Temporal Server to time out the Activity 10 seconds from when
                the Activity starts.
              </p>
              <p>
                The loop also includes a <code>Workflow.sleep()</code>{" "}
                statement that causes the Workflow to pause for a set amount
                of time between emails. You can define this in seconds,
                days, months, or even years, depending on your business
                logic.
              </p>
              <p>
                If there's a cancellation request, the request throws a{" "}
                <code>CanceledFailure</code> error, which you can catch and
                respond to. You'll use cancellation requests to unsubscribe
                users, sending one last email before completing the Workflow
                Execution.
              </p>
              <p>
                Since the user's email address is set to the Workflow Id,
                attempting to subscribe with the same email address twice
                will result in a <code>Workflow Execution already started</code>{" "}
                error, ensuring only one running Workflow Execution per email
                address.
              </p>
            </section>

            <section className={styles.section} id="activity">
              <h2 className={styles.sectionTitle}>Develop an Activity</h2>
              <p>
                You'll need an Activity to send the email to the subscriber
                so you can handle failures. Create{" "}
                <code>SendEmailActivities.java</code> and{" "}
                <code>SendEmailActivitiesImpl.java</code> in{" "}
                <code>src/main/java/subscription/activities</code>:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/activities/SendEmailActivities.java"
              >
                {SEND_EMAIL_ACTIVITIES_INTERFACE}
              </CodeBlock>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/activities/SendEmailActivitiesImpl.java"
              >
                {SEND_EMAIL_ACTIVITIES_IMPL}
              </CodeBlock>
              <p>
                This implementation only prints a message, but you could
                replace the implementation with one that uses an email API.
                Each iteration of the Workflow loop will execute this
                Activity, which simulates sending a message to the user.
              </p>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>
                Create the Worker to handle the Workflow and Activity Executions
              </h2>
              <p>
                Temporal's Java SDK{" "}
                <a
                  href="https://github.com/temporalio/sdk-java/tree/master/temporal-spring-boot-autoconfigure"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Spring Boot integration package
                </a>{" "}
                lets you write a Worker process for your Workflows and
                Activities without a dedicated Worker class. Your Worker will
                start automatically by running your Spring Boot application.
              </p>
              <p>
                Create a new file in the <code>src/main/resources</code>{" "}
                directory called <code>application.yml</code>:
              </p>
              <CodeBlock language="yaml" title="src/main/resources/application.yml">
                {APPLICATION_YAML}
              </CodeBlock>
              <p>
                Specify <code>rootProject.name = 'email-subscription'</code>{" "}
                in <code>settings.gradle</code> to link the{" "}
                <code>application.yml</code> file. Hand-match the{" "}
                <code>task-queue:</code> string to the{" "}
                <code>TASK_QUEUE_NAME</code> defined in{" "}
                <code>Constants.java</code>. Since this implementation uses
                Spring Boot, the Java and YAML sources cannot share the
                string constant. Both the Workflows and Activities packages
                must be specified separately under <code>packages:</code>.
              </p>
              <p>
                For a Spring-integrated Worker to run your Workflows and
                Activities, you must use the{" "}
                <code>@WorkflowImpl(workers = "send-email-worker")</code> and{" "}
                <code>@ActivityImpl(workers = "send-email-worker")</code>{" "}
                annotations in your implementation classes.
              </p>
            </section>

            <section className={styles.section} id="api-server">
              <h2 className={styles.sectionTitle}>
                Build the API server to handle subscription requests
              </h2>
              <p>
                This tutorial uses the Spring Boot web framework to build a
                web server that acts as the entry point for initiating
                Workflow Execution and communicating with the{" "}
                <code>subscribe</code>, <code>get-details</code>, and{" "}
                <code>unsubscribe</code> routes.
              </p>
              <p>
                Create <code>Controller.java</code> in{" "}
                <code>src/main/java/subscription</code>. First, register the
                Temporal Client method to run before the first request. A
                Temporal Client enables you to communicate with the Temporal
                Cluster:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/Controller.java"
              >
                {CONTROLLER_HEADER}
              </CodeBlock>
              <p>
                Initialize <code>WorkflowClient</code> private variable{" "}
                <code>client</code> with <code>@Autowired</code>. This lets
                the Temporal <code>WorkflowClient</code> use the
                specifications in <code>application.yml</code>.
              </p>
              <p>
                In the <code>Controller.java</code> file, define a{" "}
                <code>/subscribe</code> endpoint so that users can subscribe
                to the emails:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/Controller.java"
              >
                {SUBSCRIBE_ENDPOINT}
              </CodeBlock>
              <p>
                In the <code>startSubscription()</code> method, use the{" "}
                <code>WorkflowClient</code> instance to start your Workflow
                Execution. The <code>WorkflowData</code> object is used to
                pass the email address given by the user to the Workflow
                Execution and sets the Workflow Id.
              </p>
              <p>
                With this endpoint in place, you can now send a POST request
                to <code>/subscribe</code> with an email address in the
                request body to start a new Workflow.
              </p>
            </section>

            <section className={styles.section} id="query">
              <h2 className={styles.sectionTitle}>Add a Query</h2>
              <p>
                Now create a method in which a user can get information about
                their subscription details. Add a new method called{" "}
                <code>details()</code> to the <code>SendEmailWorkflow</code>{" "}
                class and use the <code>@QueryMethod</code> annotation:
              </p>
              <CodeBlock language="java">{DETAILS_QUERY}</CodeBlock>
              <p>
                Add the implementation to the <code>SendEmailWorkflowImpl</code>{" "}
                class:
              </p>
              <CodeBlock language="java">{DETAILS_IMPL}</CodeBlock>
              <p>
                The <code>emailDetails</code> object is an instance of{" "}
                <code>EmailDetails</code>. Queries can be used even after the
                Workflow completes. Queries should never mutate anything in
                the Workflow.
              </p>
              <p>
                To enable users to query the Workflow from the Spring Boot
                application, add a new endpoint called{" "}
                <code>/get_details</code> to the <code>Controller.java</code>{" "}
                file:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/Controller.java"
              >
                {GET_DETAILS_ENDPOINT}
              </CodeBlock>
              <p>
                Using the Workflow, call the <code>details()</code> Query
                method to get the value of the variables. This method
                enables you to return all the information about the user's
                email subscription that's declared in the Workflow.
              </p>
            </section>

            <section className={styles.section} id="unsubscribe">
              <h2 className={styles.sectionTitle}>
                Unsubscribe users with a Workflow Cancellation Request
              </h2>
              <p>
                Users will want to unsubscribe from the email list at some
                point, so give them a way to do that. You cancel a Workflow
                by sending a cancellation request to the Workflow Execution.
                Your Workflow code can respond to this cancellation and
                perform additional operations in response.
              </p>
              <p>
                With the <code>Controller.java</code> file open, add a new
                endpoint called <code>/unsubscribe</code>. Use the HTTP{" "}
                <code>DELETE</code> method on the <code>unsubscribe</code>{" "}
                endpoint to <code>cancel()</code> the Workflow:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/Controller.java"
              >
                {UNSUBSCRIBE_ENDPOINT}
              </CodeBlock>
              <p>
                The <code>workflowStub.cancel()</code> method sends a
                cancellation request to the Workflow Execution that was
                started with the <code>/subscribe</code> endpoint.
              </p>
              <p>
                When the Temporal Service receives the cancellation request,
                it will cancel the Workflow Execution and throw a{" "}
                <code>CanceledFailure</code> error to the Workflow Execution,
                which your Workflow Definition already handles in the
                try/catch block:
              </p>
              <CodeBlock language="java">{CANCELLATION_BLOCK}</CodeBlock>
              <p>
                With this endpoint in place, users can send a{" "}
                <code>DELETE</code> request to <code>unsubscribe</code> with
                an email address in the request body to cancel the Workflow
                associated with that email address.
              </p>
            </section>

            <section className={styles.section} id="server-app">
              <h2 className={styles.sectionTitle}>Build the server app</h2>
              <p>
                Create <code>Starter.java</code> in the subscription
                directory. It will run your Spring Boot app:
              </p>
              <CodeBlock
                language="java"
                title="src/main/java/subscription/Starter.java"
              >
                {STARTER_JAVA}
              </CodeBlock>
              <p>
                Next, test your application code to ensure it works as
                expected.
              </p>
            </section>

            <section className={styles.section} id="integration-test">
              <h2 className={styles.sectionTitle}>
                Create an integration test
              </h2>
              <p>
                Integration testing is an essential part of software
                development that helps ensure that different components of an
                application work together correctly.
              </p>
              <p>
                The Temporal Java SDK includes classes and methods that help
                you test your Workflow Executions. Workflow testing can be
                done in an integration test fashion against a test server or
                from a given Client.
              </p>
              <p>
                Create a file in the <code>src/test/java</code> directory
                called <code>StarterTest.java</code>:
              </p>
              <CodeBlock language="java" title="src/test/java/StarterTest.java">
                {STARTER_TEST}
              </CodeBlock>
              <p>
                The <code>testCreateEmail()</code> method creates a Workflow
                Execution by starting the <code>SendEmailWorkflow</code> with
                some test data. The method then asserts that the status of
                the Workflow Execution is <code>RUNNING</code>.
              </p>
              <p>
                The <code>testCancelWorkflow()</code> method also starts a
                Workflow Execution, but it then immediately cancels it using
                the <code>cancel()</code> method on the{" "}
                <code>WorkflowStub</code>. It then waits for the Workflow
                Execution to complete and asserts that the status is{" "}
                <code>CANCELED</code>.
              </p>
              <p>
                To test the method, run <code>./gradlew test --info</code>{" "}
                from the command line to automatically discover and execute
                tests.
              </p>
              <CodeBlock>{TEST_OUTPUT}</CodeBlock>
              <p>
                You've successfully written, executed, and passed a
                Cancellation Workflow test, just as you would any other code
                written in Java.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                This tutorial demonstrates how to build an email subscription
                web application using Temporal, Java, Spring Boot, and
                Gradle. By leveraging Temporal's Workflows, Activities, and
                Queries, the tutorial shows how to create a web server that
                interacts with Temporal to manage the email subscription
                process.
              </p>
              <p>
                With this knowledge, you will be able to take on more complex
                Workflows and Activities to create even stronger applications.
              </p>

              <Admonition type="info" title="What's next?">
                <p>
                  Continue exploring with other{" "}
                  <Link to="/tutorials/java/">Temporal Java tutorials</Link>{" "}
                  or learn more by taking our{" "}
                  <Link to="/courses">free self-paced courses</Link>.
                </p>
              </Admonition>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
