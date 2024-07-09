---
id: subscription-tutorial
sidebar_position: 3
keywords: [Java, temporal, sdk, tutorial, entity workflow, email subscription, sending emails]
tags: [Java, SDK]
last_update:
  date: 2024-06-27
title: Build an email subscription Workflow with Temporal and Java
description: Implement an email subscription application with Temporal's Workflows, Activities, and Queries, and allow users to start  your business logic through a web action.
sidebar_label: Build an email subscription Workflow with Temporal and Java
image: /img/temporal-logo-twitter-card.png
---

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

### Introduction

In this tutorial, you'll build an email subscription web application using Temporal and Java.
You'll create a web server using the Spring Boot framework to handle requests and use Temporal Workflows, Activities, and Queries to build the core of the application.
Your server will handle requests from end users and interact with a Temporal Workflow to manage the email subscription process.
Since you're building the business logic with Temporal's Workflows and Activities, you'll be able to use Temporal to manage each subscription rather than relying on a separate database or Task Queue.
This reduces the complexity of the code you have to write and support.

You'll create an endpoint for users to provide their email address and create a new Workflow execution using that email address.
This will simulate sending an email message at certain intervals.
The user can check on the status of their subscription, which you'll handle using a Query.
They can end the subscription at any time by unsubscribing.
You'll handle this by cancelling the Workflow Execution.
You can view the user's entire process through Temporal's Web UI.
By the end of this tutorial, you'll have a clear understand how to use Temporal to create and manage long-running Workflows within a web application.

:::note

This tutorial simulates sending emails.
You can adapt this example to call a live email service.

:::

Find the code for this tutorial on GitHub at the [email-subscription-project-java](https://github.com/temporalio/email-subscription-project-java) repository.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and Java](https://learn.temporal.io/getting_started/java/dev_environment/).
- Complete the [Hello World](https://learn.temporal.io/getting_started/java/hello_world_in_java/) tutorial to ensure you understand the basics of creating Workflows and Activities with Temporal.
- This application uses Gradle build automation.
  Make sure you have installed [Gradle](https://gradle.org/install/).
- You'll use [Spring Initializer](https://start.spring.io/) to generate a project with a `build.gradle` file for Java.
  Add Spring Web dependencies before generating the project.
  After creating the `build.gradle` file, add your temporal-sdk and temporal-spring-boot dependencies.

### Set up

Your `build.gradle` dependencies section should look like this:

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
    implementation "io.temporal:temporal-spring-boot-starter-alpha:$javaSDKVersion"
}
```

Create `settings.gradle` in the root of your directory with the following line:

```gradle
rootProject.name = 'email-subscription'
```

With the Gradle configurations complete, you're ready to code a Spring Boot web application.

### Build your file structure

A Workflow defines a sequence of steps defined by writing code, known as a [Workflow Definition](https://docs.temporal.io/workflows#workflow-definition).
These steps are carried out by running that code, which results in a Workflow Execution.

The Temporal Java SDK recommends the use of a single class for parameters and return types.
This lets you add class field members without breaking compatibility.

Before writing the Workflow Definition, you'll define classes used by your Workflow Definitions.
You'll also define a shared utility class to hold the Task Queue name you'll use when starting Workflows and a data class to hold a message that Spring Boot can return in json format through your web service.

Create a new package called `subscription` in the `src/main/java` directory.
This package contains the code used for this application.
Update the `group` variable in your `build.gradle` to `'subscription'`.

Your complete project will look like this:

```
src
├── main
│   ├── java
│   │   └── subscription
│   │       ├── Controller.java
│   │       ├── Starter.java
│   │       ├── activities
│   │       │   ├── SendEmailActivities.java
│   │       │   └── SendEmailActivitiesImpl.java
│   │       ├── model
│   │       │   ├── Constants.java
│   │       │   ├── EmailDetails.java
│   │       │   ├── Message.java
│   │       │   └── WorkflowData.java
│   │       └── workflows
│   │           ├── SendEmailWorkflow.java
│   │           └── SendEmailWorkflowImpl.java
│   └── resources
│       └── application.yaml
└── test
    └── java
        └── StarterTest.java
```

Create the intermediate package directories.
With your project structure mocked up, you're ready to start adding content.

## Build your model content

In this sections, you'll populate the `model` directory.
You'll create a shared string constant class and three data classes: messages, email details, and Workflow details.

**Create Constants.java for shared string constants**

Define a public string variable `TASK_QUEUE_NAME` in `Constants.java` and set it to `"email_subscription"`.

<!--SNIPSTART email-drip-campaign-java-send-email-shared-constants-->
[src/main/java/subscription/model/Constants.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/model/Constants.java)
```java
package subscription.model;

public class Constants {

    public static final String TASK_QUEUE_NAME = "email_subscription";
}
```
<!--SNIPEND-->

**Create Message.java, a message data class**

The message class stores message data to return using the Spring Boot web service:

<!--SNIPSTART email-drip-campaign-java-send-email-message-data-class-->
[src/main/java/subscription/model/Message.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/model/Message.java)
```java
package subscription.model;

public class Message {
    public String message;

    public Message(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
```
<!--SNIPEND-->

**Create EmailDetails.java, a subscription data class**

The email data class stores several members:

  - email: as a string to pass a user's email
  - message: as a string to pass a message to the user
  - count: as an integer to track the number of emails sent
  - subscribed: as a boolean to track whether the user is currently subscribed

<!--SNIPSTART email-drip-campaign-java-send-email-subscriber-details-data-class-->
[src/main/java/subscription/model/EmailDetails.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/model/EmailDetails.java)
```java
package subscription.model;

public class EmailDetails {
    public String email;
    public String message;
    public int count;
    public boolean subscribed;

    public EmailDetails() { }

    public EmailDetails(String email, String message, int count, boolean subscribed) {
        this.email = email;
        this.message = message;
        this.count = count;
        this.subscribed = subscribed;
    }
}
```
<!--SNIPEND-->

When you query your Workflow to retrieve the current Workflow status, you'll use the `EmailDetails` class.

**Create WorkflowData.java, a Workflow initialization data class**

The Workflow data class stores the information needed to create a new subscription [Workflow](https://docs.temporal.io/workflow).
For this sample, it stores one data field member:
  - email: a string to pass the user's email
  
Looking at this, you might ask why this type exists, when the `EmailDetails` class already has the same field.
The answer is that this is the starting data that initiates the Workflow.
It does not and should not have any knowledge of the internal Workflow state, which is what the other type defines.

<!--SNIPSTART email-drip-campaign-java-send-email-workflow-data-class-->
[src/main/java/subscription/model/WorkflowData.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/model/WorkflowData.java)
```java
package subscription.model;

public class WorkflowData {
    public String email;

    public WorkflowData(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
```
<!--SNIPEND-->

With the Task Queue and the data classes defined, you're ready to write your subscription Workflow Definition.

## Create a Workflow Definition

Follow the steps in this section the build the code that allows your Workflow to manage each user subscription.

### Setup the Workflow Definition files.

Create a new package directory in `src/main/java/subscription` called `workflows`.
Establish two news file called `SendEmailWorkflow.java` and `SendEmailWorkflowImpl.java`.
These files provide the interface and implementation for your Workflow methods.
Add the following code to the files to define your Workflow.

**Create the Workflow Definition Interface**

The interface `SendEmailWorkflow`, annotated with `@WorkflowInterface`, defines the `run()` method entry point for the Workflow.
The `run()` method, annotated with `@WorkflowMethod`, accepts the email address as an argument:

<!--SNIPSTART email-drip-campaign-java-send-email-subscription-workflow-interface-->
[src/main/java/subscription/workflows/SendEmailWorkflow.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/workflows/SendEmailWorkflow.java)
```java
@WorkflowInterface
public interface SendEmailWorkflow {

    @WorkflowMethod
    public void run(WorkflowData data);

    @QueryMethod
    public EmailDetails details();
}
```
<!--SNIPEND-->

**Create the Workflow Definition Implementation**

Add your `SendEmailWorkflow` implementation to `SendEmailWorkflowImpl.java`.
This code implements the Workflow Definition used by `SendEmailWorkflow` Executions.

<!--SNIPSTART email-drip-campaign-java-send-email-subscription-workflow-implementation-->
[src/main/java/subscription/workflows/SendEmailWorkflowImpl.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/workflows/SendEmailWorkflowImpl.java)
```java
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
}
```
<!--SNIPEND-->

The `run()` method initializes the email, message, subscribed, and count attributes of the private variable `emailDetails` for a `SendEmailWorkflowImpl` instance.
The `SendEmailWorkflowImpl` class uses a loop to checks if the subscription is still active by checking if `emailDetails.subscribed` is still true.
If so, it increments the count and starts the `sendEmail()` Activity with the current object.

The `activities` variable is initialized with the `SendEmailActivities` definition and `ActivityOptions`.
The options specify a start to close timeout of 10 seconds.
This tells the Temporal Server to time out the Activity 10 seconds from when the Activity starts.

The loop also includes a `Workflow.sleep()` statement that causes the Workflow to pause for a set amount of time between email.
You can define this in seconds, days, months, or even years, depending on your business logic.

If there's a cancellation request, the request throws a `CanceledFailure` error which you can catch and respond.

In this application, you use cancellation requests to unsubscribe users.
By using a detached cancellation scope, the Workflow can call the `sendEmail()` Activity to send one last email when users unsubscribe, before completing the Workflow Execution.

The user's email address is set to the Workflow Id.
Attempting to subscribe with the same email address twice results in a Workflow Execution already started error.
This prevents the Workflow Execution from spawning again.
Only one running Workflow Execution per email address can exist within the associated Namespace.
This also helps reduce the complexity of the code you have to write and maintain.

With this Workflow Definition in place, you can now develop an Activity to send emails.

## Develop an email-sending Activity

You'll need an Activity to send the email to the subscriber so you can handle failures.
Create a new package directory in the `src/main/java/subscription` directory called `activities`.
There, create your Java interface and implementation source pair.
Name the files `SendEmailActivities.java` and `SendEmailActivitiesImpl.java`.

**Create the Activity interface**

Add the following code to `SendEmailActivities.java`:

<!--SNIPSTART email-drip-campaign-java-send-email-activities-interface-->
[src/main/java/subscription/activities/SendEmailActivities.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/activities/SendEmailActivities.java)
```java
@ActivityInterface
public interface SendEmailActivities {
    @ActivityMethod
    public String sendEmail(EmailDetails details);
}
```
<!--SNIPEND-->

**Create the Activity implementation**

Add the following code to `SendEmailActivitiesImpl.java`:

<!--SNIPSTART email-drip-campaign-java-send-email-activities-implementation-->
[src/main/java/subscription/activities/SendEmailActivitiesImpl.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/activities/SendEmailActivitiesImpl.java)
```java
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
}
```
<!--SNIPEND-->

This implementation only prints a message, but you could replace the implementation with one that uses an email API.
Each iteration of the Workflow loop will execute this Activity, which simulates sending a message to the user.

Now that you have the Activity Definition and Workflow Definition, it's time to write the Worker process.

## Create your Temporal Worker

Gradle and Temporal's' Java SDK [Spring Boot integration package](https://github.com/temporalio/sdk-java/tree/master/temporal-spring-boot-autoconfigure-alpha) let you write a Worker process for your Workflows and Activities without a dedicated Worker class.
This simplifies the steps needed to run your Temporal Spring Boot application.
Your Worker will start automatically by running your Spring Boot application.
Create a new file in the `src/main/resources` directory called `application.yml` and provide the specifications of your application.

[application.yaml](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/resources/application.yaml)
```yml
spring:
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
        - subscription.activities
```

Specify `rootProject.name = 'email-subscription` in `settings.gradle` to link the `application.yml` file.
Hand-match the `task-queue:` string to the `TASK_QUEUE_NAME` defined in `Constants.java`.
Since this implementation uses Spring Boot, the Java and YAML sources cannot share the string constant.
Both the Workflows and Activities packages must be specified separately under `packages:`.

For a Spring-integrated Worker to run your Workflows and Activities, you must use the `@WorkflowImpl(workers = "send-email-worker")` and `@ActivityImpl(workers = "send-email-worker")` decorations in your Workflow and Activity implementation classes.

Now that you've written the logic to execute the Workflow and Activity Definitions, build the gateway and your subscriber endpoints.

## Build the API server

This tutorial uses the Spring Boot web framework to build a web server.
The server is the entry point for initiating Workflow Execution and communicating with the subscribe, get-details, and unsubscribe routes.
It handles HTTP requests and performs the appropriate operations with the Workflow.
Create `Controller.java` in Subscriptions.
Add the necessary headers:

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-headers-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
package subscription;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import subscription.model.*;
import subscription.workflows.SendEmailWorkflow;
```
<!--SNIPEND-->

This code registers the Temporal Client to run before the first request to this instance of the application.
A Temporal Client enables you to communicate with the Temporal Service.
Communication with a Temporal Service includes, but isn't limited to, the following:

* Starting a Workflow Execution: This initiates a business process
* Getting the Result of Workflow Execution: This allows you to retrieve the outcome of a business process
* Listing Workflow Executions: This enables you to view all the business processes or entities
* Querying a Workflow Execution: This allows you to check the state of your business process
* Signalling a Workflow Execution: This enables you to send data into a running business process

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-responder-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
@RestController
public class Controller {

    @Autowired
    WorkflowClient client;

```
<!--SNIPEND-->

Initialize `WorkflowClient` private variable `client` with `@Autowired`.
This lets the Temporal WorkflowClient use the specifications in `application.yml`.
Each endpoint uses the `client` to handle actions like starting, querying, and cancelling the Workflow.

### Build the subscription endpoint
Now that your connection to the Temporal Server is open, define a `/subscribe` endpoint as function, so that users can subscribe to the emails.

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-subscribe-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
    @PostMapping(value = "/subscribe", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Message startSubscription(@RequestBody WorkflowData data) {

        WorkflowOptions options = WorkflowOptions.newBuilder()
                .setWorkflowId(data.getEmail())
                .setTaskQueue(Constants.TASK_QUEUE_NAME)
                .build();

        SendEmailWorkflow workflow = client.newWorkflowStub(SendEmailWorkflow.class, options);
        WorkflowClient.start(workflow::run,data);

        return new Message("Resource created successfully");
    }
```
<!--SNIPEND-->

In the `startSubscription()` function, use the `WorkflowClient` to start our Workflow Execution asynchronously.
The `WorkflowData` object is used to pass the email address given by the user to the Workflow Execution and sets the Workflow ID in our `WorkflowOptions`.
This ensures that the email is unique across all Workflows so that the user can't sign up multiple times, only receive the emails they've subscribed to, and when they cancel; they cancel the Workflow run.
With this endpoint in place, users can send a `POST` request to `/subscribe` with an email address in the request body to start a new Workflow that sends an email to that address.
But how would you get details about the subscription?

In the next section, you'll query your Workflow to get back information on the state of things in the next section.

### Add a Query

A Query method let users get information about their subscription details.
Queries can be used even after the Workflow completes, which is useful for when the user unsubscribes but still wants to retrieve information about their subscription.
Queries should never mutate anything in the Workflow.

This method is declared using the `@QueryMethod` annotation in the Workflow interface.

```java
    @QueryMethod
    public EmailDetails details();
```

The `details()` Query method allows users to retrieve information about their subscription details:

```java
    @Override
    public EmailDetails details() {

        return emailDetails;
    }
```

The `emailDetails` object is an instance of `EmailDetails`.

```java
private EmailDetails emailDetails = new EmailDetails();
```

Now that you've added the ability to Query your Workflow, add the ability to initiate your Query from the Spring Boot application.

### Add a details endpoint

To enable users to query the Workflow from the Spring Boot application, add a new endpoint called `/get_details` to the `Controller.java` file.
Use the `client.newWorkflowStub()` function to return a `SendEmailWorkflow` object by a Workflow Id.

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-details-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
    @GetMapping(value = "/get_details", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public EmailDetails getQuery(@RequestParam String email) {

        SendEmailWorkflow workflow = client.newWorkflowStub(SendEmailWorkflow.class, email);
        return workflow.details();
    }
```
<!--SNIPEND-->

Using `client.newWorkflowStub()` retrieves a `SendEmailWorkflow` object that can be have the Query method called on it to get the value of the its variables.

This object enables you to return all the information about the user's email subscription that's declared in the Workflow.

Now that users can subscribe and view the details of their subscription, you need to provide them with a way to unsubscribe.

### Add an unsubscribe option

Users will want to unsubscribe from the email list at some point, so give them a way to do that.
You cancel a Workflow by sending a cancellation request to the Workflow Execution.
Your Workflow code can respond to this cancellation and perform additional operations in response.
This is how you will handle unsubscribe requests.

With the `Controller.java` file open, add a new endpoint called `/unsubscribe` to the Spring Boot application.
To send a cancellation notice to an endpoint, use the HTTP `DELETE` method on the unsubscribe endpoint to instruct a given email's workflow to be cancelled.

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-unsubscribe-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
    @DeleteMapping(value = "/unsubscribe", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Message endSubscription(@RequestBody WorkflowData data) {

        SendEmailWorkflow workflow = client.newWorkflowStub(SendEmailWorkflow.class, data.getEmail());
        WorkflowStub workflowStub = WorkflowStub.fromTyped(workflow);
        workflowStub.cancel();

        return new Message("Requesting cancellation");
    }
```
<!--SNIPEND-->

The `workflowStub.cancel()` method sends a cancellation request to the Workflow Execution that was started with the `/subscribe` endpoint.

When the Temporal Service receives the cancellation request, it will cancel the Workflow Execution and throw a `CanceledFailure` error to the Workflow Execution, which your Workflow Definition already handles in the try/catch block.

Here's the relevant section as a reminder:

```java
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
```

With this code in place, users can send a `DELETE` request to the unsubscribe endpoint to cancel a Workflow.
This allows users to unsubscribe from the email list and prevent any further unwanted emails.

Now that you've added the ability to unsubscribe from the email list, your API server is complete, and you only need to add a class to run the server.

## Build the server app

Create `Starter.java` in the subscription directory.
It will run your Spring Boot app:

<!--SNIPSTART email-drip-campaign-java-send-email-starter-entry-point-app-->
[src/main/java/subscription/Starter.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/main/java/subscription/Starter.java)
```java
package subscription;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Starter {

    public static void main(String[] args) {

        SpringApplication.run(Starter.class, args);
    }
}
```
<!--SNIPEND-->

Next, test your application code to ensure it works as expected.

## Create an integration test

Integration testing is an essential part of software development that helps ensure that different components of an application work together correctly.
The Temporal Java SDK includes classes and methods that help you test your Workflow Executions.
Workflow testing can be done in an integration test fashion against a test server or from a given Client.

In this section, you'll write an integration test using the Temporal Java SDK to test the cancellation of a Workflow.
Now, add tests to the application to ensure the Cancellation works as expected.

To set up the test environment, create a file in the `src/test/java` directory called `StarterTest.java`
The Temporal Java SDK includes classes and methods that help you test your Workflow Executions.
In this section, you will import the necessary modules and classes to test the cancellation of a Workflow.

In this code, you are defining two test functions `testCreateEmail()` and `testCancelWorkflow()` that use the Temporal SDK to create and cancel a Workflow Execution.

<!--SNIPSTART email-drip-campaign-java-send-email-tests-->
[src/test/java/StarterTest.java](https://github.com/temporalio/email-subscription-project-java/blob/main/src/test/java/StarterTest.java)
```java
import subscription.activities.SendEmailActivitiesImpl;
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
}
```
<!--SNIPEND-->

The `testCreateEmail()` function creates a Workflow Execution by starting the `SendEmailWorkflow` with some test data.
The function then asserts that the status of the Workflow Execution is `RUNNING`.
The `testCancelWorkflow()` function also starts a Workflow Execution, but it then immediately cancels it using the `cancel()` method on the `WorkflowStub`.
It then enters a while loop to repeatedly get the status of the Workflow Execution until the status is returned as `CANCELED`.

Now that you've created a test function for the Workflow Cancellation, run the test to see if that works.
Run `./gradlew test --info` from the command line to execute your tests and view the info on your test's execution.

Gradle will automatically run your tests without displaying execution information every time you run `gradle build`. 
Use this command as an alternative if you are only interested in the successful result of the tests.

Congratulations!
You've successfully written, executed, and passed a Cancellation Workflow test, just as you would any other code written in Java.
Temporal's Java SDK provides a number of classes and methods that help you test your Workflow Executions.
By following the best practices for testing your code, you can be confident that your Workflows are reliable and performant.

## Conclusion

This tutorial demonstrated how to build an email subscription web application using Temporal, Java, Spring Boot, and Gradle.
By leveraging Temporal's Workflows, Activities, and Queries, the tutorial showed how to create a web server that interacts with Temporal to manage the email subscription process.
With this knowledge, you will be able to take on more complex Workflows and Activities to create even stronger applications.
