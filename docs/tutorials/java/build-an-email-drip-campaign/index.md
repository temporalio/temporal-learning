---
id: subscription-tutorial
sidebar_position: 3
keywords: [Java, Spring Boot, temporal, sdk, tutorial, entity workflow, email drip campaign, email subscription, sending emails]
tags: [Java, SDK]
last_update:
  date: 2024-06-27
title: Build an email drip campaign with Java and Spring Boot
description: Implement an email drip campaign application with Temporal's Workflows, Activities, and Queries, and allow users to start your business logic through a web action.
image: /img/temporal-logo-twitter-card.png
---

![Temporal Java SDK](/img/sdk_banners/banner_java.png)

## External to Temporal

* YES <a href="https://github.com/temporalio/build-audiobook-go">HREF External Working</a>
* YES <a href="https://github.com/temporalio/build-audiobook-go#setup">HREF External Working w anchor</a>
* YES <a href="https://github.com/temporalio/build-audiobook-go?tab=readme-ov-file#setup">HREF External Working w anchor and query</a>
* 404 <a href="https://github.com/temporalio/build-audiobook-nogo">HREF External Broken</a>
* TOP OF PAGE <a href="https://github.com/temporalio/build-audiobook-go#setupdoesnotexist">HREF External w/ broken anchor</a>
* TOP OF PAGE <a href="https://github.com/temporalio/build-audiobook-go?tab=readme-ov-file#setupdoesnotexist">HREF External w query and broken anchor</a>
* YES [Markdown External Working](https://github.com/temporalio/build-audiobook-go)
* YES [Markdown External Working w anchor](https://github.com/temporalio/build-audiobook-go#setup)
* YES [Markdown External Working w anchor and query](https://github.com/temporalio/build-audiobook-go?tab=readme-ov-file#setup)
* 404 [Markdown anchor External Broken](https://github.com/temporalio/build-audiobook-go-nogo)
* TOP OF PAGE [Markdown External w broken anchor](https://github.com/temporalio/build-audiobook-go#setupdoesnotexist)
* TOP OF PAGE [Markdown External w broken anchor and query](https://github.com/temporalio/build-audiobook-go?tab=readme-ov-file#setupdoesnotexist)

## Internal to this page

* YES [Relative anchor](#prerequisites)
* YES [Page ref on page](/tutorials/java/build-an-email-drip-campaign/#prerequisites)
* N/A Cannot test fully specified URL  as that will go to real site (https://learn.temporal.io/tutorials/java/build-an-email-drip-campaign/#prerequisites)

### Broken versions

* NO ACTION [Relative anchor](#prerequisitesxx)
* NO ACTION [Page ref on page](/tutorials/java/build-an-email-drip-campaign/#prerequisitesxx)
* Cannot test fully specified URL  as that will go to real site 

## Internal to learn site

* YES [Page ref on page](/tutorials/python/build-an-email-drip-campaign/#prerequisites)
* N/A Cannot test fully specified URL  as that will go to real site (https://learn.temporal.io/tutorials/python/build-an-email-drip-campaign/#prerequisites)

### Broken versions

* RANDOM ON PAGE [Page ref on page](/tutorials/python/build-an-email-drip-campaign/#prerequisitesxx)
* RANDOM ON PAGE [Page ref on page](/tutorials/python/build-an-email-drip-campaign/#doesntexist)
* Cannot test fully specified URL  as that will go to real site 

## External over to the docs site 

We don't cross reference, so treated as external site like github.

### Introduction

In this tutorial, you'll build an email drip campaign and a subscription web application in Java.
You'll create a web server using the [Spring Boot](https://spring.io/projects/spring-boot) framework to handle requests and use Temporal Workflows, Activities, and Queries to build the core of the application.
Your web server will handle requests from the end user and interact with a Temporal Workflow to manage the email subscription process.
Since you're building the business logic with Temporal's Workflows and Activities, you'll be able to use Temporal to manage each subscription rather than relying on a separate database or Task Queue.
This reduces the complexity of the code you have to write and support.

You'll create an endpoint for users to give their email address, and then create a new Workflow execution using that email address which will simulate sending an email message at certain intervals.
The user can check on the status of their subscription, which you'll handle using a Query, and they can end the subscription at any time by unsubscribing, which you'll handle by cancelling the Workflow Execution.
You can view the user's entire process through Temporal's Web UI.
For this tutorial, you'll simulate sending emails, but you can adapt this example to call a live email service in the future.

By the end of this tutorial, you'll have a clear understand how to use Temporal to create and manage long-running Workflows within a web application.

You'll find the code for this tutorial on GitHub in the [email-drip-campaign-project-java](https://github.com/temporalio/email-drip-campaign-project-java) repository.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for Temporal and Java](https://learn.temporal.io/getting_started/java/dev_environment/).
- Complete the [Hello World](https://learn.temporal.io/getting_started/java/hello_world_in_java/) tutorial to ensure you understand the basics of creating Workflows and Activities with Temporal.
- This application uses Gradle build automation.
  Make sure you have installed [Gradle](https://gradle.org/install/).
- You'll use [Spring Initializer](https://start.spring.io/) to generate a project with a `build.gradle` file for Java.
  Add Spring Web dependencies before generating the project.
  After creating the `build.gradle` file, add your temporal-sdk and temporal-spring-boot dependencies.

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

## Develop the Workflow

A Workflow defines a sequence of steps defined by writing code, known as a Workflow Definition, and is carried out by running that code, which results in a Workflow Execution.

The Temporal Java SDK recommends the use of a single data class for parameters and return types.
This lets you add fields without breaking compatibility.
Before writing the Workflow Definition, you'll define the data objects used by the Workflow Definitions.
You'll also define the Task Queue name you'll use in your Worker.

Create the package directories for this project:

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

Build the model files, which will:

1. Set the Task Queue field to `email_subscription`.
1. Add `Message`, `WorkflowData`, and `EmailDetails` data classes.

Create a new file called `Constants.java` in `src/main/java/subscription/model`.
Define a public string field `TASK_QUEUE_NAME` in `Constants.java` and set it to `"email_subscription"`.

<!--SNIPSTART email-drip-campaign-java-send-email-shared-constants-->
[src/main/java/subscription/model/Constants.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/model/Constants.java)
```java
package subscription.model;

public class Constants {

    public static final String TASK_QUEUE_NAME = "email_subscription";
}
```
<!--SNIPEND-->

Create a new file called `Message.java` in `src/main/java/subscription/model`:

<!--SNIPSTART email-drip-campaign-java-send-email-message-data-class-->
[src/main/java/subscription/model/Message.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/model/Message.java)
```java
package subscription.model;

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
}
```
<!--SNIPEND-->

Create a new file called `EmailDetails.java` in `src/main/java/subscription/model`:

<!--SNIPSTART email-drip-campaign-java-send-email-subscriber-details-data-class-->
[src/main/java/subscription/model/EmailDetails.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/model/EmailDetails.java)
```java
package subscription.model;

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
}
```
<!--SNIPEND-->

Create a new file called `WorkflowData.java` in `src/main/java/subscription/model`:

<!--SNIPSTART email-drip-campaign-java-send-email-workflow-data-class-->
[src/main/java/subscription/model/WorkflowData.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/model/WorkflowData.java)
```java
package subscription.model;

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
}
```
<!--SNIPEND-->

The following describes each data class and their objects.

- `WorkflowData`: this data class starts the Workflow Execution.
  - It will contain the following field:
    - `email`: a string to pass the user's email
- `EmailDetails`: this data class holds data about the current state of the subscription.
  - It will contain the following field:
    - `email`: as a string to pass a user's email
    - `message`: as a string to pass a message to the user
    - `count`: as an integer to track the number of emails sent
    - `subscribed`: as a boolean to track whether the user is currently subscribed
- `Message`: this data class holds data for a single message.
  - It will contain the following field:
    - `message`: a string to pass a message to the user

When you Query your Workflow to retrieve the current statue of the Workflow, you'll use the `EmailDetails` data class.

Now that you have the Task Queue and the data classes defined, you can write the Workflow Definition.

To create a new Workflow Definition, create a new file called `SendEmailWorkflow.java` and `SendEmailWorkflowImpl.java`.
These files will contain the `SendEmailWorkflow` class, attributes, and implementation.

Use the `SendEmailWorkflowImpl.java` file to write deterministic logic inside your Workflow Definition and to execute the Activity.

Add the following code to define the Workflow:

<!--SNIPSTART email-drip-campaign-java-send-email-subscription-workflow-interface-->
[src/main/java/subscription/workflows/SendEmailWorkflow.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/workflows/SendEmailWorkflow.java)
```java
package subscription.workflows;

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
}
```
<!--SNIPEND-->

<!--SNIPSTART email-drip-campaign-java-send-email-subscription-workflow-implementation-->
[src/main/java/subscription/workflows/SendEmailWorkflowImpl.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/workflows/SendEmailWorkflowImpl.java)
```java
package subscription.workflows;

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
}
```
<!--SNIPEND-->

The `run()` method, annotated with `@WorkflowMethod`, takes in the email address as an argument.
This method initializes the `email`, `message`, `subscribed`, and `count` fields of the `emailDetails` instance.

The `SendEmailWorkflow` class has a loop that checks if the subscription is active by checking if `emailDetails.subscribed` is true.
If it is, it starts the `sendEmail()` Activity.

The while loop increments the `count` and calls the `sendEmail()` Activity with the current `EmailDetails` object.
The loop continues as long as `emailDetails.subscribed` is true.

The `run` method executes the `sendEmail()` Activity with the following parameters:

- The `EmailDetails` data class

A `start_to_close_timeout` parameter tells the Temporal Server to time out the Activity 10 seconds from when the Activity starts.

The loop also includes a `Workflow.sleep()` statement that causes the Workflow to pause for a set amount of time between emails.
You can define this in seconds, days, months, or even years, depending on your business logic.

If there's a cancellation request, the request throws a `CanceledFailure` error, which you can catch and respond.
In this application, you'll use cancellation requests to unsubscribe users.
You'll send one last email when they unsubscribe, before completing the Workflow Execution.

Since the user's email address is set to the Workflow Id, attempting to subscribe with the same email address twice will result in a `Workflow Execution already started` error and prevent the Workflow Execution from spawning again.

Therefore, only one running Workflow Execution per email address can exist within the associated Namespace.
This ensures that the user won't receive multiple email subscriptions.
This also helps reduce the complexity of the code you have to write and maintain.

With this Workflow Definition in place, you can now develop an Activity to send emails.

## Develop an Activity

You'll need an Activity to send the email to the subscriber so you can handle failures.

Create `SendEmailActivities.java` and `SendEmailActivitiesImpl.java` in `src/main/java/subscription/activities`:

<!--SNIPSTART email-drip-campaign-java-send-email-activities-interface-->
[src/main/java/subscription/activities/SendEmailActivities.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/activities/SendEmailActivities.java)
```java
package subscription.activities;

import subscription.model.EmailDetails;
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

@ActivityInterface
public interface SendEmailActivities {
    @ActivityMethod
    public String sendEmail(EmailDetails details);
}
```
<!--SNIPEND-->

<!--SNIPSTART email-drip-campaign-java-send-email-activities-implementation-->
[src/main/java/subscription/activities/SendEmailActivitiesImpl.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/activities/SendEmailActivitiesImpl.java)
```java
package subscription.activities;

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
}
```
<!--SNIPEND-->

This implementation only prints a message, but you could replace the implementation with one that uses an email API.

Each iteration of the Workflow loop will execute this Activity, which simulates sending a message to the user.

Now that you have the Activity Definition and Workflow Definition, it's time to write the Worker.

## Create the Worker to handle the Workflow and Activity Executions

Temporal's Java SDK [Spring Boot integration package](https://github.com/temporalio/sdk-java/tree/master/temporal-spring-boot-autoconfigure-alpha) let you write a Worker process for your Workflows and Activities without a dedicated Worker class.
This simplifies the steps needed to run your Temporal Spring Boot application.
Your Worker will start automatically by running your Spring Boot application.
Create a new file in the `src/main/resources` directory called `application.yml` and provide the specifications of your application.

[application.yaml](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/resources/application.yaml)
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

For a Spring-integrated Worker to run your Workflows and Activities, you must use the `@WorkflowImpl(workers = "send-email-worker")` and `@ActivityImpl(workers = "send-email-worker")` annotations in your Workflow and Activity implementation classes.

Now that you've written the logic to execute the Workflow and Activity Definitions, try to build the gateway.

## Build the API server to handle subscription requests

This tutorial uses the Spring Boot web framework to build a web server that acts as the entry point for initiating Workflow Execution and communicating with the `subscribe`, `get-details`, and `unsubscribe` routes.
The web server will handle HTTP requests and perform the appropriate operations with the Workflow.

Create `Controller.java` in `src/main/java/subscription` to develop your SpringBoot endpoints.

First, register the Temporal Client method to run before the first request to this instance of the application.
A Temporal Client enables you to communicate with the Temporal Cluster.
Communication with a Temporal Cluster includes, but isn't limited to, the following:

- Starting Workflow Executions
- Sending Queries to Workflow Executions
- Getting the results of a Workflow Execution

Add the following code to import your libraries and connect to the Temporal Server:

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-headers-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/Controller.java)
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

Initialize `WorkflowClient` private variable `client` with `@Autowired`.
This lets the Temporal `WorkflowClient` use the specifications in `application.yml`.
You'll use the client in your endpoints.

First, build the `/subscribe` endpoint.

In the `Controller.java` file, define a `/subscribe` endpoint so that users can subscribe to the emails:

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-subscribe-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
    @PostMapping(value = "/subscribe", produces = MediaType.APPLICATION_JSON_VALUE)
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

In the `startSubscription()` method, use the `WorkflowClient` instance to start your Workflow Execution.
The `WorkflowData` object is used to pass the email address given by the user to the Workflow Execution and sets the Workflow Id.
This ensures that the email is unique across all Workflows so that the user can't sign up multiple times, only receive the emails they've subscribed to, and when they cancel; they cancel the Workflow run.

With this endpoint in place, you can now send a POST request to `/subscribe` with an email address in the request body to start a new Workflow that sends an email to that address.

But how would you get details about the subscription? In the next section, you'll query your Workflow to get back information on the state of things in the next section.

## Add a Query

Now create a method in which a user can get information about their subscription details.
Add a new method called `details()` to the `SendEmailWorkflow` class and use the `@QueryMethod` annotation.

To allow users to retrieve information about their subscription details, add a new method called `details()` in the `SendEmailWorkflow` class
Annotate this method with `@QueryMethod`.


```java
    @QueryMethod
    public EmailDetails details();
```

Add the implementation to the `SendEmailWorkflowImpl` class implementation:

```java
    @Override
    public EmailDetails details() {

        return emailDetails;
    }
```

The emailDetails object is an instance of `EmailDetails`.
Queries can be used even if after the Workflow completes, which is useful for when the user unsubscribes but still wants to retrieve information about their subscription.

Queries should never mutate anything in the Workflow.

Now that you've added the ability to Query your Workflow, add the ability to Query from the Spring Boot application.

To enable users to query the Workflow from the Spring Boot application, add a new endpoint called `/get_details` to the `Controller.java` file.

Use the `client.newWorkflowStub()` method to return a Workflow by a Workflow Id.

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-details-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
    @GetMapping(value = "/get_details", produces = MediaType.APPLICATION_JSON_VALUE)
    public EmailDetails getQuery(@RequestParam String email) {

        SendEmailWorkflow workflow = client.newWorkflowStub(SendEmailWorkflow.class, email);
        return workflow.details();
    }
```
<!--SNIPEND-->

Using the Workflow, call the `details()` Query method to get the value of the variables.
This method enables you to return all the information about the user's email subscription that's declared in the Workflow.

Now that users can subscribe and view the details of their subscription, you need to provide them with a way to unsubscribe.

## Unsubscribe users with a Workflow Cancellation Request

Users will want to unsubscribe from the email list at some point, so give them a way to do that.

You cancel a Workflow by sending a cancellation request to the Workflow Execution.
Your Workflow code can respond to this cancellation and perform additional operations in response.
This is how you will handle unsubscribe requests.

With the `Controller.java` file open, add a new endpoint called `/unsubscribe` to the Spring Boot application.

To send a cancellation notice to an endpoint, use the HTTP `DELETE` method on the `unsubscribe` endpoint to `cancel()` the Workflow:

<!--SNIPSTART email-drip-campaign-java-send-email-constroller-for-services-unsubscribe-->
[src/main/java/subscription/Controller.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/Controller.java)
```java
    @DeleteMapping(value = "/unsubscribe", produces = MediaType.APPLICATION_JSON_VALUE)
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

With this endpoint in place, users can send a `DELETE` request to `unsubscribe` with an email address in the request body to cancel the Workflow associated with that email address.
This allows users to unsubscribe from the email list and prevent any further emails from sending.

Now that you've added the ability to unsubscribe from the email list, build your server app.

## Build the server app

Create `Starter.java` in the subscription directory.
It will run your Spring Boot app:

<!--SNIPSTART email-drip-campaign-java-send-email-starter-entry-point-app-->
[src/main/java/subscription/Starter.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/main/java/subscription/Starter.java)
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

To set up the test environment, create a file in the `src/test/java` directory called `StarterTest.java`.

The Temporal Java SDK includes classes and methods that help you test your Workflow Executions.
In this section, you will import the necessary modules and classes to test the cancellation of a Workflow.

In this code, you are defining two test methods `testCreateEmail()` and `testCancelWorkflow()` that use the Temporal SDK to create and cancel a Workflow Execution.

<!--SNIPSTART email-drip-campaign-java-send-email-tests-->
[src/test/java/StarterTest.java](https://github.com/temporalio/email-drip-campaign-project-java/blob/main/src/test/java/StarterTest.java)
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

The `testCreateEmail()` method creates a Workflow Execution by starting the `SendEmailWorkflow` with some test data.
The method then asserts that the status of the Workflow Execution is `RUNNING`.

The `testCancelWorkflow()` method also starts a Workflow Execution, but it then immediately cancels it using the `cancel()` method on the `WorkflowStub`.
It then waits for the Workflow Execution to complete and asserts that the status is `CANCELED`.
Finally, the method checks that the Workflow Execution was cancelled due to a `CancelledError`.

Now that you've created a test method for the Workflow Cancellation, run the test to see if that works.


To test the method, run `./gradlew test --info` from the command line to automatically discover and execute tests.

```output
BUILD SUCCESSFUL in 5s
4 actionable tasks: 4 executed
```

You've successfully written, executed, and passed a Cancellation Workflow test, just as you would any other code written in Java.
Temporal's Java SDK provides a number of classes and methods that help you test your Workflow Executions.
By following the best practices for testing your code, you can be confident that your Workflows are reliable and performant.

## Conclusion

This tutorial demonstrates how to build an email subscription web application using Temporal, Java, Spring Boot, and Gradle.
By leveraging Temporal's Workflows, Activities, and Queries, the tutorial shows how to create a web server that interacts with Temporal to manage the email subscription process.

With this knowledge, you will be able to take on more complex Workflows and Activities to create even stronger applications.
