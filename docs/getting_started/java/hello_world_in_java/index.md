---
id: hello-world-tutorial
title: Build a Temporal "Hello World!" app from scratch in Java
sidebar_position: 3
description: In this tutorial you will build your first Temporal app using the Java SDK
keywords: [Java,java,temporal,sdk,tutorial,hello world]
last_update:
  date: 2023-03-03
tags:
  - helloworld
  - java
  - sdk
  - tutorial
image: /img/temporal-logo-twitter-card.png
---

![Image of an astronaut in space holding the Java logo](images/banner.jpg)

:::note Tutorial information

- **Level:** ⭐ Temporal beginner
- **Time:** ⏱️ ~20 minutes
- **Goals:** 🙌
  - Set up, build, and test a Temporal application project from scratch using the [Java SDK](https://github.com/temporalio/java-sdk).
  - Identify the four parts of a Temporal Workflow application.
  - Describe how the Temporal Server gets information to the Worker.
  - Explain how to define Workflow Definitions with the Temporal Java SDK.

:::

### Introduction

Creating reliable applications is a difficult task.  [Temporal](https://temporal.io) lets you create fault-tolerant resiliant applications using programming languages you already know, so you can build complex applications that execute successfully and recover from failures.

In this tutorial, you will build your first [Temporal Application](https://docs.temporal.io/temporal#temporal-application) from scratch using the [Temporal Java SDK](https://github.com/temporalio/java-sdk). The Temporal Application will consist of the following pieces:

1. A [Workflow](https://docs.temporal.io/workflows): Workflows are functions that define the overall flow of the application and represent the orchestration aspect of the business logic.
2. An [Activity](https://docs.temporal.io/activities): Activities are functions called during Workflow Execution and represent the execution aspect of your business logic. The Workflow you'll create executes a single Activity, which takes a string from the Workflow as input and returns a formatted version of this string to the Workflow.
3. A [Worker](https://docs.temporal.io/workers): Workers host the Activity and Workflow code and execute the code piece by piece.
4. An initiator: To start a Workflow, you need to send a signal to the Temporal server to tell it to track the state of the Workflow. You'll write a separate program to do this.

You'll also write a unit test to ensure your Workflow executes successfully.

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal applications.

All of the code in this tutorial is available in the [hello-world Java template](https://github.com/temporalio/hello-world-project-template-java) repository.


## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal applications using the Java programming language](/getting_started/java/dev_environment/index.md)
- Follow the tutorial [Run your first Temporal application with the Java SDK](/getting_started/java/first_program_in_java/index.md) to gain a better understanding of what Temporal is and how its components fit together.
- Ensure [Gradle](https://gradle.org/install/) is installed and ready to use to create a Java project.

## ![Clip art image of a crane](/img/icons/harbor-crane.png) Create a new project Java project

To get started with the Temporal Java SDK, you'll create a new Java application, just like any other Java program you're creating. Then you'll add the Temporal SDK package to your project.

In a terminal, create a new project directory called `hello-world-temporal`:

```command
mkdir hello-world-temporal
```

Switch to the new directory:

```command
cd hello-world-temporal
```

In this tutorial you'll use [Gradle](https://gradle.org/install/) and the command line to build, manage, and run your Java project. 

Create a new Java project with Gradle by running the following command:

```command
gradle init
```

This command will begin the process of creating a Java project by asking you a series of questions. When asked what type of project to generate, select `2: application`:

```command
Starting a Gradle Daemon (subsequent builds will be faster)

Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 2
```

Next, select the default option `3: Java` to specify Java as the language of your application:

```command
Select implementation language:
  1: C++
  2: Groovy
  3: Java
  4: Kotlin
  5: Scala
  6: Swift
Enter selection (default: Java) [1..6] 3
```

Your Hello World application will be contained within a single application library, so select `1: no - only one application project` to keep your application in a single project:

```command
Split functionality across multiple subprojects?:
  1: no - only one application project
  2: yes - application and library projects
Enter selection (default: no - only one application project) [1..2] 1
```

You'll use [Groovy](https://groovy-lang.org/) as the build script DSL, so select `1: Groovy`:

```command
Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Groovy) [1..2] 1
```

Select `no` when asked to generate build using new APIs and behavior:

```command
Generate build using new APIs and behavior (some features may change in the next minor release)? (default: no) [yes, no] no
```

Select `1: JUnit 4` as the test framework for this application:

```command
Select test framework:
  1: JUnit 4
  2: TestNG
  3: Spock
  4: JUnit Jupiter
Enter selection (default: JUnit Jupiter) [1..4] 1
```

Name your project the same as the directory you are currently in, `hello-world-temporal`:

```command
Project name (default: hello-world-temporal): hello-world-temporal
```

Finally, name your source package `helloworldapp`:

```command
Source package (default: hello.world.temporal): helloworldapp
```

Once you've done this you should see the following output informing you of the success of your project's creation:

```command
> Task :init
Get more help with your project: https://docs.gradle.org/8.0/samples/sample_building_java_applications.html

BUILD SUCCESSFUL in 19s
2 actionable tasks: 2 executed
```

Once you have finished scaffolding your Java project you will need to add the Temporal SDK as a dependency, along with a handful of other libraries for testing and logging. Open the Gradle build configuration file at `app/build.gradle` and add the following dependencies: 

<!--SNIPSTART hello-world-project-template-java-gradle-dependencies-->
<!--SNIPEND-->

Below is a more detailed explanation about the dependencies you will be installing:

- `implementation group: 'io.temporal', name: 'temporal-sdk', version: '1.18.2'` Installs the Temporal SDK for use in your application.
- `implementation group: 'org.slf4j',  name: 'slf4j-nop', version: '2.0.6'` Installs a NOOP logging package to supress logging warnings. **This is not intended for production use and a proper logger should be implemented.**
- `testImplementation group: 'io.temporal', name: 'temporal-testing', version: '1.18.2'` Install the necessary packages for testing a Temporal application.
- `testImplementation group: 'junit', name: 'junit', version: '4.13.2'` Installs the core Java Unit Testing framework.
- `testImplementation group: 'org.mockito', name: 'mockito-core', version: '5.1.1'` Installs a mocking framework in Java to be used during testing.

Once you have added the build dependencies, perform a test build on your application. From the root directory of your project execute the following command:

```command
./gradlew build
```

If your build was succesful you should see the following output

```command
BUILD SUCCESSFUL in 2s
7 actionable tasks: 6 executed, 1 up-to-date
```

Finally, Gradle creates a default `App.java` file that you won't need for this tutorial, so delete it.

```command
rm app/src/main/java/helloworldapp/App.java
```

With your project workspace configured, you're ready to create your first Temporal Activity and Workflow. You'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities.  You write a Workflow using one of the programming languages supported by a Temporal SDK. This code is known as a *Workflow Definition*. 

In the Temporal Java SDK, a Workflow Definition is made of two parts:

* An [interface](https://docs.oracle.com/javase/tutorial/java/concepts/interface.html) that contains annotated methods with empty bodies 
* A class that implements the interface and defines all methods declared by the interface.

Create `HelloWorldWorkflow.java` in the source code location of your project at `app/src/main/java/helloworldapp/` and add the following code to create a `HelloWorldWorkflow` interface that defines the expected functionality of your workflow:

<!--SNIPSTART hello-world-project-template-java-workflow-interface-->
<!--SNIPEND-->

The `HelloWorldWorkflow` interface is annotated with `@WorkflowInterface`, signifying that the interface is a Temporal Workflow. Within this interface is a single method `getGreeting(String name)` that takes a single String parameter, `name`, and is annotated with `@WorkflowMethod`. This annotation denotes the starting point of Workflow execution and execution completes when this method returns.

Next, create `HelloWorldWorkflowImpl.java` and add the following code to implement the Workflow and define its methods:

<!--SNIPSTART hello-world-project-template-java-workflow-->
<!--SNIPEND-->

The implmementation defines the options to execute an Activity, in this case setting `StartToCloseTimeout` to 2 seconds. The implementation then creates a `HelloWorldActivity` stub that will act as a proxy for activity invocations. 

:::note
Notice that an interface of `HelloWorldActivity` is used to create the stub, not the implementation of the interface. The workflow is only aware of the Activity through its public interface, not the Activity implementation.

:::

Finally the implementation overrides the `getGreeting` implementation from the `HelloWorldWorkflow` interface and executes an Activity called `composeGreeting`, which you'll define next. The function returns the result of the Activity.

With your Workflow Definition created, you're ready to create the `ComposeGreeting` Activity.

## Create an Activity

In a Temporal Application, Activities are where you execute [non-deterministic](https://docs.temporal.io/workflows#deterministic-constraints) code or perform operations that may fail, such as API requests or database calls. Your Workflow Definitions call Activities and process the results. Complex Temporal Applications have Workflows that invoke many Activities, using the results of one Activity to execute another.

With the Temporal Java SDK, you define Activities similarly to how you define Workflows: using an interface and an implementation.

Create the file `HelloWorldActivity.java` in `app/src/main/java/helloworldapp/` and add the following code to define the `HelloWorldActivity` interface:

<!--SNIPSTART hello-world-project-template-java-activity-interface-->
<!--SNIPEND-->

The `HelloWorldActivity` interface is annotated with `@ActivityInterface`, signifying that the interface is a Temporal Activity. Within this interface is a single method `composeGreeting(String name)` that takes a single String parameter, `name`, and is annotated with `@WorkflowMethod`. This annotation denotes the starting point of Activity execution which will be called during the Workflow execution.

Next, create `HelloWorldActivityImpl.java` and add the following code to implement the Activity and define its methods:

<!--SNIPSTART hello-world-project-template-java-activity-->
<!--SNIPEND-->



### Task Queues

[Task Queues](https://docs.temporal.io/concepts/what-is-a-task-queue) are how the Temporal server supplies information to Workers. When you start a Workflow, you tell the server which Task Queue the Workflow and/or Activities use as an information queue. We will configure our Worker to listen to the same Task Queue that our Workflow and Activities use. Since the Task Queue name is used by multiple things, let's create Shared.java and define our Task Queue name there:

<!--SNIPSTART hello-world-project-template-java-shared-constants-->
<!--SNIPEND-->

### Define the Worker

Our [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity functions and executes them one at a time. The Worker is instructed to execute the specific functions via information it gets from the Task Queue, and after execution, it communicates results back to the server.

Create `HelloWorldWorker.java` and define the Worker:

<!--SNIPSTART hello-world-project-template-java-worker-->
<!--SNIPEND-->

### Workflow initiator

There are two ways to start a Workflow, via the Temporal CLI or Temporal SDK. In this tutorial we will use the SDK to start the Workflow which is how most Workflows are started in live environments. Additionally, the call to the Temporal server can be made [synchronously or asynchronously](https://docs.temporal.io/java/workflows). Here we do it synchronously, so you will see the caller wait for the result of the Workflow.

Create `InitiateHelloWorld.java` and use the SDK to define the start of the Workflow:

<!--SNIPSTART hello-world-project-template-java-workflow-initiator-->
<!--SNIPEND-->

## ![](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/check.png) Test the app

Let's add a simple unit test to our application to make sure things are working as expected. Test code lives in `src/test/java/helloworldapp`. If you don't see the `helloworldapp` directory, go ahead and create it yourself. Gradle might have generated a default AppTest.java in that location. If AppTest.java is there, remove that file. 

Create a new class called `HelloWorldWorkflowTest.java` that contains the following code:

<!--SNIPSTART hello-world-project-template-java-workflow-test-->
<!--SNIPEND-->

Now run the test:

**Terminal**

From the root of the project, run this command:

```command
./gradlew test
```

**IntelliJ**

From within IntelliJ, right click on HelloWorldWorkflowTest and select Run.

Look for "BUILD SUCCESSFUL" in the output to confirm.

## ![](https://raw.githubusercontent.com/temporalio/documentation-images/main/static/running.png) Run the app

To run the app we need to start the Workflow and the Worker. You can start them in any order. Make sure you have the Temporal development cluster running in a terminal and have the [Temporal Web UI](localhost:8080) open in your browser:

If you are using the terminal, add tasks to the `build.gradle` file so that you can run the main methods from there.

<!--SNIPSTART hello-world-project-template-java-gradle-tasks-->
<!--SNIPEND-->

**Terminal**

To start the Worker, run this command from the project root:

```command
./gradlew startWorker
```

To start the Workflow, run this command from the project root:

```command
./gradlew sayHello
```

**IntelliJ**

To start the Worker from within IntelliJ, right click on HelloWorldWorker and select Run.

To start the Workflow from Within IntelliJ, right click on InitiateHelloWorld and select Run.

<br/>

<img alt="Celebratory confetti" class="docs-image-centered docs-image-max-width-20" src="https://raw.githubusercontent.com/temporalio/documentation-images/main/static/confetti.png" />

You have successfully built a Temporal application from scratch.

## Conclusion

You now know how to build a Temporal Workflow application using the Java SDK and Gradle. 

### Review

Let's do a quick review to make sure you remember some of the more important pieces.

<details>
<summary>

**What are the minimum four pieces of a Temporal Workflow application?**

</summary>

1. An Activity function.
2. A Workflow function.
3. A Worker to host the Activity and Workflow code.
4. A frontend to start the Workflow.

</details>

<details>
<summary>

**How does the Temporal server get information to the Worker?**

</summary>

It adds the information to a Task Queue.

</details>

<details>
<summary>

What makes Temporal Activity and Workflow objects different from any other Java object?

</summary>

The only difference is the interfaces have Temporal decorators.

</details>
