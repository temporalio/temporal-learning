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

![Image of an astronaut in space holding the Java logo](/img/sdk_banners/banner_java.png)

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

Creating reliable applications is a difficult task.  [Temporal](https://temporal.io) lets you create fault-tolerant, resilient applications using programming languages you already know, so you can build complex applications that execute successfully and recover from failures.

In this tutorial, you will build your first [Temporal Application](https://docs.temporal.io/temporal#temporal-application) from scratch using the [Temporal Java SDK](https://github.com/temporalio/java-sdk). The Temporal Application will consist of the following pieces:

1. A [Workflow](https://docs.temporal.io/workflows): A workflow defines a sequence of steps. With Temporal, those steps are defined by writing code, known as a Workflow Definition, and are carried out by running that code, which results in a Workflow Execution.
2. An [Activity](https://docs.temporal.io/activities): Activities are methods called during Workflow Execution and represent the execution aspect of your business logic. The Workflow you'll create executes a single Activity, which takes a string from the Workflow as input and returns a formatted version of this string to the Workflow.
3. A [Worker](https://docs.temporal.io/workers): Workers host the Activity and Workflow code and are responsible for processing Workflow and Activity Tasks.
4. A client: Client code that triggers the execution of the workflow on the Temporal Server. The Client used to start the Workflow submits a request to the Temporal Cluster, which then queues a Task that the Worker will pick up, and the Worker will begin executing the code in the Workflow Definition.

You'll also write a unit test to ensure your Workflow executes successfully.

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal applications.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal applications using the Java programming language](/getting_started/java/dev_environment/index.md)
- Follow the tutorial [Run your first Temporal application with the Java SDK](/getting_started/java/first_program_in_java/index.md) to gain a better understanding of what Temporal is and how its components fit together.
- Ensure [Gradle](https://gradle.org/install/) is installed and ready to use to create a Java project.

## ![Clip art image of a crane](/img/icons/harbor-crane.png) Create a new Java project

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

```
Starting a Gradle Daemon (subsequent builds will be faster)

Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 2
```

Next, select the default option `3: Java` to specify Java as the language of your application:

```
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

```
Split functionality across multiple subprojects?:
  1: no - only one application project
  2: yes - application and library projects
Enter selection (default: no - only one application project) [1..2] 1
```

You'll use [Groovy](https://groovy-lang.org/) as the build script DSL, so select `1: Groovy`:

```
Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Groovy) [1..2] 1
```

Select `no` when asked to generate build using new APIs and behavior:

```
Generate build using new APIs and behavior (some features may change in the next minor release)? (default: no) [yes, no] no
```

Select `1: JUnit 4` as the test framework for this application:

```
Select test framework:
  1: JUnit 4
  2: TestNG
  3: Spock
  4: JUnit Jupiter
Enter selection (default: JUnit Jupiter) [1..4] 1
```

Name your project the same as the directory you are currently in, `hello-world-temporal`:

```
Project name (default: hello-world-temporal): hello-world-temporal
```

Finally, name your source package `helloworldapp`:

```
Source package (default: hello.world.temporal): helloworldapp
```

Once you've done this you should see the following output informing you of the success of your project's creation:

```
> Task :init
Get more help with your project: https://docs.gradle.org/8.0/samples/sample_building_java_applications.html

BUILD SUCCESSFUL in 19s
2 actionable tasks: 2 executed
```

Once you have finished scaffolding your Java project you will need to add the Temporal SDK as a dependency, along with a handful of other libraries for testing and logging. Open the Gradle build configuration file at `app/build.gradle` and replace the current contents of the `dependencies` block with the following: 

<!--SNIPSTART hello-world-project-template-java-gradle-dependencies-->
<!--SNIPEND-->

Below is a more detailed explanation about the dependencies you will be installing:

- `implementation group: 'io.temporal', name: 'temporal-sdk', version: '1.18.2'` 
  - The Temporal SDK for use in your application.
- `implementation group: 'org.slf4j',  name: 'slf4j-nop', version: '2.0.6'` 
  - A NOOP logging package to suppress logging warnings. **This is not intended for production use and a proper logger should be implemented.**
- `testImplementation group: 'io.temporal', name: 'temporal-testing', version: '1.18.2'` 
  - The necessary packages for testing a Temporal application.
- `testImplementation group: 'junit', name: 'junit', version: '4.13.2'` 
  - The core Java Unit Testing framework. 
- `testImplementation group: 'org.mockito', name: 'mockito-core', version: '5.1.1'`
  - A mocking framework in Java to be used during testing.

Once you have added the build dependencies, perform a test build on your application. From the root directory of your project execute the following command:

```command
./gradlew build
```

You will see output similar to this if your build was successful:

```command
BUILD SUCCESSFUL in 28s
7 actionable tasks: 6 executed, 1 up-to-date
```

Finally, Gradle creates a default `App.java` file that you won't need for this tutorial, so delete it.

```command
rm -f app/src/main/java/helloworldapp/App.java
```

With your project workspace configured, you're ready to create your first Temporal Activity and Workflow. You'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities.  You write a Workflow using one of the programming languages supported by a Temporal SDK. This code is known as a *Workflow Definition*. 

In the Temporal Java SDK, a Workflow Definition is made of two parts:

* A [Workflow Interface](https://docs.temporal.io/application-development/foundations?lang=java#develop-workflows), which is an interface annotated with `@WorkflowInterface`. This interface contains a single method signature annotated with `@WorkflowMethod`. 
* A class that implements the interface, providing the code that runs when the Workflow is executed

Create `HelloWorldWorkflow.java` in the source code location of your project at `app/src/main/java/helloworldapp/` and add the following code to create a `HelloWorldWorkflow` interface that defines the expected functionality of your workflow:

<!--SNIPSTART hello-world-project-template-java-workflow-interface-->
<!--SNIPEND-->

The `HelloWorldWorkflow` interface is annotated with `@WorkflowInterface`, signifying that the interface is a Temporal Workflow. Within this interface is a single method `getGreeting(String name)` that takes a single String parameter, `name`, and is annotated with `@WorkflowMethod`. This annotation denotes the starting point of Workflow execution and execution completes when this method returns.

Next, create `HelloWorldWorkflowImpl.java` and add the following code to implement the Workflow and define its methods:

<!--SNIPSTART hello-world-project-template-java-workflow-->
<!--SNIPEND-->

In this implementation, you have specified that the Start-to-Close Timeout for your Activity will be one minute, meaning that your Activity has one minute to begin before it times out. Of all the Temporal timeout options, startToCloseTimeOut is the one you should always set. In this implementation you create a `HelloWorldActivity` stub that will act as a proxy for activity invocations. 

:::note
Notice that `Workflow.newActivityStub()` uses an interface of `HelloWorldActivity` to create the activity stub, not the Activity implementation. The workflow communicates with an Activity through its public interface and is not aware of its implementation.

:::

Finally `HelloWorldWorkflowImpl` implements the `getGreeting` Workflow Method from the Workflow Interface. The method returns the result of the Activity.

With your Workflow Definition created, you're ready to create the `ComposeGreeting` Activity.

## Create an Activity

In a Temporal Application, Activities are where you execute any operation that is prone to failure or access external services or systems, such as API requests or database calls. Your Workflow Definitions call Activities and process the results. Complex Temporal Applications have Workflows that invoke many Activities, using the results of one Activity to execute another.

For this tutorial, your Activity won't be complex; you'll create an Activity that takes a string as input and uses it to create a new string as output, which is then returned to the Workflow. This will let you see how Workflows and Activities work together without building something complicated.

With the Temporal Java SDK, you define Activities similarly to how you define Workflows: using an interface and an implementation.

Create the file `HelloWorldActivity.java` in `app/src/main/java/helloworldapp/` and add the following code to define the `HelloWorldActivity` interface:

<!--SNIPSTART hello-world-project-template-java-activity-interface-->
<!--SNIPEND-->

The `HelloWorldActivity` interface is annotated with `@ActivityInterface`, signifying that the interface is a Temporal Activity. Within this interface is a single method `composeGreeting(String name)` and is annotated with `@WorkflowMethod`. This annotation denotes the starting point of Activity execution which will be called during the Workflow execution.

Next, create `HelloWorldActivityImpl.java` in `app/src/main/java/helloworldapp/` and add the following code to implement the Activity and define its methods:

<!--SNIPSTART hello-world-project-template-java-activity-->
<!--SNIPEND-->

This class implements the single method from the interface named `composeGreeting` to compose a String that returns a standard "Hello World!" message using the passed in parameter. 

Your [Activity Definition](https://docs.temporal.io/activities#activity-definition) can accept input parameters just like Workflow Definitions. Review the [Activity parameters](https://docs.temporal.io/application-development/foundations?lang=java#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

You've completed the logic for the application; you have a Workflow and an Activity defined. Before moving on to configuring your Worker, you'll write a unit test for your Workflow.

## ![](/img/icons/check.png) Test the app

The Temporal Java SDK includes classes and methods that help you test your Workflow executions. Let's add a basic unit test to the application to make sure the Workflow works as expected.

You'll use [JUnit 4](https://junit.org/junit4/) build your test cases to test your Workflow and Activity. You'll test the integration of the Activity and the Workflow by using Temporal's built in Test Environment. You'll then mock the Activity so you can test the Workflow in isolation.

Let's add a simple unit test to our application to make sure things are working as expected. Test code lives in `app/src/test/java/helloworldapp`. Gradle generates a default `AppTest.java` in that location. Delete it:

```command
rm -f app/src/test/java/helloworldapp/AppTest.java
```

Create a new file called `HelloWorldWorkflowTest.java` that contains the following code:

<!--SNIPSTART hello-world-project-template-java-workflow-test-->
<!--SNIPEND-->

The first test, `testIntegrationGetGreeting`, creates a test execution environment to test the integration between the Activity and the Workflow. The second test, `testMockGetGreeting`, mocks the Activity implementation so it returns a successful execution. The test then executes the Workflow in the test environment and checks for a successful execution. Finally, the tests ensures the Workflow's return value returns the expected value.

Run the following command from the project root to execute the unit tests:

```command
./gradlew test
```
You'll see output similar to the following from your test run indicating that the test was successful
```
BUILD SUCCESSFUL in 317ms
3 actionable tasks: 2 executed, 1 up-to-date
```

You have a working application and a test to ensure the Workflow executes as expected. Next, you'll configure a Worker to execute your Workflow.


## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity methods and executes the code in the Workflow Definition. The Temporal Cluster orchestrates the execution of code in a Workflow Definition or Activity Definition by adding Tasks to a [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue), which Workers poll. When a Worker accepts a Task, it will execute the necessary code, and report the result (or error) back to the Temporal Cluster. After the Worker runs the code, it communicates the results back to the Temporal Server.

When you start a Workflow, you specify which Task Queue the Workflow uses. A Worker listens and polls on the Task Queue, looking for work to do.

To configure a Worker process using the Java SDK, you create an instance of `Worker` and give it the name of the Task Queue to poll. 

You'll connect to the Temporal Cluster using a Temporal Client, which provides a set of APIs to communicate with a Temporal Cluster. You'll use Clients to interact with existing Workflows or to start new ones.

Since you'll use the Task Queue name in multiple places in your project, create the file `Shared.java` in `app/src/main/java/helloworldapp`and define the Task Queue name there:

<!--SNIPSTART hello-world-project-template-java-shared-constants-->
<!--SNIPEND-->

Now you'll create the Worker process. In this tutorial you'll create a small standalone Worker program so you can see how all of the components work together. 

Create the file `HelloWorldWorker.java` in `app/src/main/java/helloworldapp` and add the following code to connect to the Temporal Server, instantiate the Worker, and register 1the:

<!--SNIPSTART hello-world-project-template-java-worker-->
<!--SNIPEND-->

This program first implements a service stub to be used when instantiating the client. The code first instantiates a factory and then creates a new worker that listens on a Task Queue. This worker will only process workflows and activities from this Task Queue. You register the Workflow and Activity with the Worker and then start the worker using `factory.start()`.


:::tip

By default, the client connects to the `default` namespace of the Temporal Cluster running at `localhost` on port `7233` by using the `newLocalServiceStubs()` method. If you want to connect to an external Temporal Cluster you would use the following code:

```java
WorkflowServiceStubs service =
        WorkflowServiceStubs.newServiceStubs(
            WorkflowServiceStubsOptions.newBuilder().setTarget("host:port").build());

WorkflowClient client = 
        WorkflowClient.newInstance(service, WorkflowClientOptions.newBuilder()
                                            .setNamespace("YOUR_NAMESPACE")
                                            .build());
```

:::

You've created a program that instantiates a Worker to process the Workflow. Now you need to start the Workflow.

### Write code to start a Workflow Execution

You can start a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. In this tutorial, you'll use the Temporal SDK to start the Workflow, which is how most real-world applications work. 

Starting a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, specifying the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL. In this tutorial, you'll create a separate Java class that starts the Workflow Execution.

Create `InitiateHelloWorld.java` in `app/src/main/java/helloworldapp/` and add the following code to the file to connect to the server and start the Workflow:

<!--SNIPSTART hello-world-project-template-java-workflow-initiator-->
<!--SNIPEND-->

Like the Worker you created, this program uses stubs and a client to connect to the Temporal server. It then specifies a [Workflow ID](https://docs.temporal.io/application-development/foundations/?lang=java#workflow-id) for the Workflow, as well as the Task Queue. The Worker you configured is looking for tasks on that Task Queue.

:::tip Specify a Workflow ID

A Workflow Id is unique in a namespace and is used for deduplication. Using an identifier that reflects some business process or entity is a good practice. For example, you might use a customer identifier as part of the Workflow Id if you run one Workflow per customer. This would make it easier to find all of the Workflow Executions related to that customer later.

:::

The program then creates a stubbed instance of your Workflow, `workflow`, taking the interface class of your workflow along with the options you have set as parameters. This stub looks like an implementation of the interface, but is used to communicate with the Temporal Server under the hood.

:::note
Notice that an interface of `HelloWorldWorkflow` is used to create the Workflow stub, not the Workflow implementation.The workflow communicates with an Workflow through its public interface and is not aware of its implementation.

:::

You can [get the results](https://docs.temporal.io/application-development/foundations/?lang=java#get-workflow-results) from your Workflow right away, or you can get the results at a later time. This implementation stores the results in the `greeting` variable after the `getGreeting()` method is called, which blocks the program's execution until the Workflow Execution completes.

You have a Workflow, an Activity, a Worker, and a way to start a Workflow Execution. It's time to run the Workflow.

## ![](/img/icons/run.png) Run the application

To run your Temporal Application, you need to start the Workflow and the Worker. You can start these in any order, but you'll need to run each command from a separate terminal window, as the Worker needs to be constantly running to look for tasks to execute.

First, open the file `app/build.gradle` and add the following commands to the end of the file in order to define tasks for Gradle to execute your Worker and Client application:

<!--SNIPSTART hello-world-project-template-java-gradle-tasks-->
<!--SNIPEND-->

Next, ensure that your local Temporal Cluster is running. 

To start the Worker, run this command from the project root:

```command
./gradlew startWorker
```

You should see similar following output from Gradle:

```
<=========----> 75% EXECUTING [0h 0m 42s]
> :app:startWorker
```

:::note

Observe that Gradle is reporting that the application is executing but appears to be stuck at 75%. Since the worker is an application that runs indefinitely, Gradle will not report it as running at 100% completion. This is expected and if you see this, your application is running and ready to accept Workflows to be executed. Leave this program running and proceed to the next step.

:::

To start the Workflow, open a new terminal window and switch to your project root:

```command
cd hello-world-temporal
```

Then run the following command to start the Workflow Execution:

```command
./gradlew sayHello
```

The program runs and returns the result:

```
> Task :app:sayHello
HelloWorldWorkflowID Hello World!

BUILD SUCCESSFUL in 1s
2 actionable tasks: 1 executed, 1 up-to-date
```

You can switch back to the terminal running the Worker and stop it with `CTRL-C`.

You have successfully built a Temporal application from scratch.

## Conclusion

You now know how to build a Temporal Workflow application using the Java SDK and Gradle. All of the code in this tutorial is available in the [hello-world Java template](https://github.com/temporalio/hello-world-project-template-java) repository.

### Review

Let's do a quick review to make sure you remember some of the more important pieces.

<details>
<summary>

**What are the minimum four pieces of a Temporal Workflow application?**

</summary>

1. An Activity function.
2. A Workflow function.
3. A Worker to host the Activity and Workflow code.
4. Some way to start the Workflow.

</details>

<details>
<summary>

**How does the Worker know which Activity to execute and when to do so?**

</summary>

Each Worker is configured to poll a specified Task Queue, whose name is specified when the Worker is created. The Temporal Server adds tasks to this queue, specifying the details about the Workflows and Activities that the Worker should execute.

</details>

<details>
<summary>

**True or false, with the Temporal Java SDK, you define Activities and Workflows by writing an Interface to create a definition and and implementation of this interface that gets executed by the Workers?**

</summary>

True. Workflows and Activities are defined as interfaces and their implementations will implement the interface.

</details>

