---
id: hello-world-tutorial
title: Build a Temporal Application from scratch in Java
sidebar_position: 3
description: In this tutorial you will build your first Temporal app using the Java SDK
keywords: [Java,java,temporal,sdk,tutorial,hello world]
last_update:
  date: 2025-11-05
tags:
  - helloworld
  - java
  - sdk
  - tutorial
image: /img/temporal-logo-twitter-card.png
code_repo: https://github.com/temporalio/hello-world-project-template-java
code_notes: branch 'main' has Gradle snipsync source, branch 'maven' has Maven
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem'; 

<img className="banner" src="/img/sdk_banners/banner_java.png" alt="Temporal Java SDK" />

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
4. A client: Client code that triggers the execution of the workflow on the Temporal Server. The Client used to start the Workflow submits a request to the Temporal Service, which then queues a Task that the Worker will pick up, and the Worker will begin executing the code in the Workflow Definition.

You'll also write a unit test to ensure your Workflow executes successfully.

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal applications.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal applications using the Java programming language](/getting_started/java/dev_environment/index.md)
- Follow the tutorial [Run your first Temporal application with the Java SDK](/getting_started/java/first_program_in_java/index.md) to gain a better understanding of what Temporal is and how its components fit together.
- Ensure the build tool [Maven](https://maven.apache.org/install.html) is installed and ready to use to create a Java project.

## ![](/img/icons/harbor-crane.png) Create a new Java project

To get started with the Temporal Java SDK, you'll create a new Java application, just like any other Java program you're creating. Then you'll add the Temporal SDK package to your project.

In a terminal, create a new project directory called `hello-world-temporal`:

```command
mkdir hello-world-temporal
```

Switch to the new directory:

```command
cd hello-world-temporal
```

Create a new Java project with Maven by running the following command:

```command
mvn -B archetype:generate \
-DgroupId=helloworldapp \
-DartifactId=app \
-DarchetypeArtifactId=maven-archetype-quickstart \
-DarchetypeVersion=1.4
```

This command creates a directory name `app` that contains your Java application named `helloworldapp`.

Your output will be similar to this:

```
[INFO] Scanning for projects...
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
[WARNING] Parameter 'localRepository' is deprecated core expression; Avoid use of ArtifactRepository type. If you need access to local repository, switch to '${repositorySystemSession}' expression and get LRM from it instead.
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
[INFO] ------------------------------------------------------------------------
```

Next you will need to ensure that the Java version Maven is compiling against supports building Temporal Applications. Temporal requires a minimum version of Java 1.8. Open the Maven configuration file at `app/pom.xml` and locate the `<properties>` tag that contains the `<maven.compiler.source>` and `<maven.compiler.target>` tags. Update these two property tags with `1.8`.

<!--SNIPSTART hello-world-project-template-java-maven-version-->
[app/pom.xml](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/pom.xml)
```xml
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>1.8</maven.compiler.source>
    <maven.compiler.target>1.8</maven.compiler.target>
  </properties>
```
<!--SNIPEND-->

Next you will add the Temporal SDK as a dependency, along with a handful of other libraries for testing and logging. In `pom.xml` replace the generated `<dependencies>` section in the file with the following:

<!--SNIPSTART hello-world-project-template-java-maven-dependencies-->
[app/pom.xml](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/pom.xml)
```xml
  <dependencies>

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
  
  </dependencies>
```
<!--SNIPEND-->

Below is a more detailed explanation about the dependencies you will be installing:

- `temporal-sdk`
  - The Temporal SDK for use in your application.
- `slf4j-nop`
  - A NOOP logging package to suppress logging warnings. **This is not intended for production use and a proper logger should be implemented.**
- `temporal-testing`
  - The necessary packages for testing a Temporal application.
- `junit`
  - The core Java Unit Testing framework. 
- `mockito-core`
  - A mocking framework in Java to be used during testing.

Once you have added the build dependencies, perform a test build on your application.

Change directory into the app directory:

```command
cd app
```

From the `app` directory of your project that contains the `pom.xml` execute the following command:

```command
mvn compile
```

You will see output similar to this if your build was successful. If it is your first time running mvn compile you may see more output of the dependencies being downloaded:

```
[INFO] Scanning for projects...
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
[INFO] ------------------------------------------------------------------------
```

Finally, your build tool may have created a default `App.java` file. You won't need this file for this tutorial, so delete it.

```command
rm -f app/src/main/java/helloworldapp/App.java
```

With your project workspace configured, you're ready to create your first Temporal Activity and Workflow. You'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities.  You write a Workflow using one of the programming languages supported by a Temporal SDK. This code is known as a *Workflow Definition*. 

In the Temporal Java SDK, a Workflow Definition is made of two parts:

* A [Workflow Interface](https://docs.temporal.io/dev-guide/java/foundations#develop-workflows), which is an interface annotated with `@WorkflowInterface`. This interface contains a single method signature annotated with `@WorkflowMethod`. 
* A class that implements the interface, providing the code that runs when the Workflow is executed

Create `HelloWorldWorkflow.java` in the source code location of your project at `app/src/main/java/helloworldapp/` and add the following code to create a `HelloWorldWorkflow` interface that defines the expected functionality of your workflow:

<!--SNIPSTART hello-world-project-template-java-workflow-interface-->
[app/src/main/java/helloworldapp/HelloWorldWorkflow.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/main/java/helloworldapp/HelloWorldWorkflow.java)
```java
package helloworldapp;

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
}
```
<!--SNIPEND-->

The `HelloWorldWorkflow` interface is annotated with `@WorkflowInterface`, signifying that the interface is a Temporal Workflow. Within this interface is a single method `getGreeting(String name)` that takes a single String parameter, `name`, and is annotated with `@WorkflowMethod`. This annotation denotes the starting point of Workflow execution and execution completes when this method returns.

Next, create `HelloWorldWorkflowImpl.java` and add the following code to implement the Workflow and define its methods:

<!--SNIPSTART hello-world-project-template-java-workflow-->
[app/src/main/java/helloworldapp/HelloWorldWorkflowImpl.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/main/java/helloworldapp/HelloWorldWorkflowImpl.java)
```java
package helloworldapp;

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
}
```
<!--SNIPEND-->

In this implementation, you have specified that the Start-to-Close Timeout for your Activity will be one minute, meaning that your Activity has one minute to begin before it times out. Of all the Temporal timeout options, startToCloseTimeOut is the one you should always set. In this implementation you create a `HelloWorldActivities` stub that will act as a proxy for activity invocations. 

:::note
Notice that `Workflow.newActivityStub()` uses an interface of `HelloWorldActivities` to create the activity stub, not the Activity implementation. The workflow communicates with an Activity through its public interface and is not aware of its implementation.

:::

Finally `HelloWorldWorkflowImpl` implements the `getGreeting` Workflow Method from the Workflow Interface. The method returns the result of the Activity.

With your Workflow Definition created, you're ready to create the `composeGreeting` Activity.

## Create an Activity

In a Temporal Application, Activities are where you execute any operation that is prone to failure or access external services or systems, such as API requests or database calls. Your Workflow Definitions call Activities and process the results. Complex Temporal Applications have Workflows that invoke many Activities, using the results of one Activity to execute another.

For this tutorial, your Activity won't be complex; you'll create an Activity that takes a string as input and uses it to create a new string as output, which is then returned to the Workflow. This will let you see how Workflows and Activities work together without building something complicated.

With the Temporal Java SDK, you define Activities similarly to how you define Workflows: using an interface and an implementation.

Create the file `HelloWorldActivities.java` in `app/src/main/java/helloworldapp/` and add the following code to define the `HelloWorldActivities` interface:

<!--SNIPSTART hello-world-project-template-java-activity-interface-->
[app/src/main/java/helloworldapp/HelloWorldActivities.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/main/java/helloworldapp/HelloWorldActivities.java)
```java
package helloworldapp;

import io.temporal.activity.ActivityInterface;

@ActivityInterface
public interface HelloWorldActivities {

    // Define your activity methods which can be called during workflow execution
    String composeGreeting(String name);
    
}
```
<!--SNIPEND-->

The `HelloWorldActivities` interface is annotated with `@ActivityInterface`, signifying that the interface is a Temporal Activity. Within this interface is a single method signature, `composeGreeting(String name)`. Activity Interfaces can have multiple methods, but for this example you'll have just the one.

Next, create `HelloWorldActivitiesImpl.java` in `app/src/main/java/helloworldapp/` and add the following code to implement the Activity and define its methods:

<!--SNIPSTART hello-world-project-template-java-activity-->
[app/src/main/java/helloworldapp/HelloWorldActivitiesImpl.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/main/java/helloworldapp/HelloWorldActivitiesImpl.java)
```java
package helloworldapp;

public class HelloWorldActivitiesImpl implements HelloWorldActivities {

    @Override
    public String composeGreeting(String name) {
        return "Hello " + name + "!";
    }

}
```
<!--SNIPEND-->

This class implements the single method from the interface named `composeGreeting` to compose a String that returns a standard "Hello World!" message using the passed in parameter. 

Your [Activity Definition](https://docs.temporal.io/activities#activity-definition) can accept input parameters just like Workflow Definitions. Review the [Activity parameters](https://docs.temporal.io/dev-guide/java/foundations#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

You've completed the logic for the application; you have a Workflow and an Activity defined. Before moving on to configuring your Worker, you'll write a unit test for your Workflow.

## ![](/img/icons/check.png) Test the app

The Temporal Java SDK includes classes and methods that help you test your Workflow executions. Let's add a basic unit test to the application to make sure the Workflow works as expected.

You'll use [JUnit 4](https://junit.org/junit4/) build your test cases to test your Workflow and Activity. You'll test the integration of the Activity and the Workflow by using Temporal's built in Test Environment. You'll then mock the Activity so you can test the Workflow in isolation.

Let's add a few unit tests to our application to make sure things are working as expected. Test code lives in `app/src/test/java/helloworldapp`. Your build tool generates a default `AppTest.java` in that location. Delete it:

```command
rm -f app/src/test/java/helloworldapp/AppTest.java
```

Create a new file called `HelloWorldWorkflowTest.java` that contains the following code:

<!--SNIPSTART hello-world-project-template-java-workflow-test-->
[app/src/test/java/helloworldapp/HelloWorldWorkflowTest.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/test/java/helloworldapp/HelloWorldWorkflowTest.java)
```java
package helloworldapp;

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
}
```
<!--SNIPEND-->

The first test, `testIntegrationGetGreeting`, creates a test execution environment to test the integration between the Activity and the Workflow. The second test, `testMockedGetGreeting`, mocks the Activity implementation so it returns a successful execution. The test then executes the Workflow in the test environment and checks for a successful execution. Finally, the tests ensures the Workflow's return value returns the expected value.

Run the following command from the project root to execute the unit tests:

```command
mvn compile test
```

You'll see output similar to the following from your test run indicating that the test was successful. If this is your first time running the test, it may take longer and you may see the output of mvn downloading the testing dependencies:

```
[INFO] Scanning for projects...
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
[WARNING] Parameter 'localRepository' is deprecated core expression; Avoid use of ArtifactRepository type. If you need access to local repository, switch to '${repositorySystemSession}' expression and get LRM from it instead.
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
[INFO] ------------------------------------------------------------------------
```

You have a working application and a test to ensure the Workflow executes as expected. Next, you'll configure a Worker to execute your Workflow.


## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity methods and executes the code in the Workflow Definition. The Temporal Service orchestrates the execution of code in a Workflow Definition or Activity Definition by adding Tasks to a [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue), which Workers poll. When a Worker accepts a Task, it will execute the necessary code, and report the result (or error) back to the Temporal Service. After the Worker runs the code, it communicates the results back to the Temporal Server.

When you start a Workflow, you specify which Task Queue the Workflow uses. A Worker listens and polls on the Task Queue, looking for work to do.

To configure a Worker process using the Java SDK, you create an instance of `Worker` and give it the name of the Task Queue to poll. 

You'll connect to the Temporal Service using a Temporal Client, which provides a set of APIs to communicate with a Temporal Service. You'll use Clients to interact with existing Workflows or to start new ones.

Since you'll use the Task Queue name in multiple places in your project, create the file `Shared.java` in `app/src/main/java/helloworldapp` and define the Task Queue name there:

<!--SNIPSTART hello-world-project-template-java-shared-constants-->
[app/src/main/java/helloworldapp/Shared.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/main/java/helloworldapp/Shared.java)
```java
package helloworldapp;

public interface Shared {

    // Define the task queue name
    final String HELLO_WORLD_TASK_QUEUE = "HelloWorldTaskQueue";

}
```
<!--SNIPEND-->

Now you'll create the Worker process. In this tutorial you'll create a small standalone Worker program so you can see how all of the components work together. 

Create the file `HelloWorldWorker.java` in `app/src/main/java/helloworldapp` and add the following code to connect to the Temporal Server, instantiate the Worker, and register the workflow and activities:

<!--SNIPSTART hello-world-project-template-java-worker-->
[app/src/main/java/helloworldapp/HelloWorldWorker.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/main/java/helloworldapp/HelloWorldWorker.java)
```java
package helloworldapp;

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
}
```
<!--SNIPEND-->

This program first implements a service stub to be used when instantiating the client. The code first instantiates a factory and then creates a new worker that listens on a Task Queue. This worker will only process workflows and activities from this Task Queue. You register the Workflow and Activity with the Worker and then start the worker using `factory.start()`.


:::tip

By default, the client connects to the `default` namespace of the Temporal Service running at `localhost` on port `7233` by using the `newLocalServiceStubs()` method. If you want to connect to an external Temporal Service you would use the following code:

```java
WorkflowServiceStubs service =
        WorkflowServiceStubs.newServiceStubs(
            WorkflowServiceStubsOptions.newBuilder().setTarget("host:port").build());

WorkflowClient client = 
        WorkflowClient.newInstance(
          service, WorkflowClientOptions.newBuilder().setNamespace("YOUR_NAMESPACE").build());
```

:::

You've created a program that instantiates a Worker to process the Workflow. Now you need to start the Workflow.

### Write code to start a Workflow Execution

You can start a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. In this tutorial, you'll use the Temporal SDK to start the Workflow, which is how most real-world applications work. 

Starting a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, specifying the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL. In this tutorial, you'll create a separate Java class that starts the Workflow Execution.

Create `InitiateHelloWorld.java` in `app/src/main/java/helloworldapp/` and add the following code to the file to connect to the server and start the Workflow:

<!--SNIPSTART hello-world-project-template-java-workflow-initiator-->
[app/src/main/java/helloworldapp/InitiateHelloWorld.java](https://github.com/temporalio/hello-world-project-template-java/blob/main/app/src/main/java/helloworldapp/InitiateHelloWorld.java)
```java
package helloworldapp;

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
}
```
<!--SNIPEND-->

Like the Worker you created, this program uses stubs and a client to connect to the Temporal server. It then specifies a [Workflow ID](https://docs.temporal.io/dev-guide/java/foundations/#workflow-id) for the Workflow, as well as the Task Queue. The Worker you configured is looking for tasks on that Task Queue.

:::tip Specify a Workflow ID

A Workflow Id is unique in a namespace and is used for deduplication. Using an identifier that reflects some business process or entity is a good practice. For example, you might use a customer identifier as part of the Workflow Id if you run one Workflow per customer. This would make it easier to find all of the Workflow Executions related to that customer later.

:::

The program then creates a stubbed instance of your Workflow, `workflow`, taking the interface class of your workflow along with the options you have set as parameters. This stub looks like an implementation of the interface, but is used to communicate with the Temporal Server under the hood.

:::note
Notice that an interface of `HelloWorldWorkflow` is used to create the Workflow stub, not the Workflow implementation.The workflow communicates with a Workflow through its public interface and is not aware of its implementation.

:::

You can [get the results](https://docs.temporal.io/dev-guide/java/foundations/#get-workflow-results) from your Workflow right away, or you can get the results at a later time. This implementation stores the results in the `greeting` variable after the `getGreeting()` method is called, which blocks the program's execution until the Workflow Execution completes.

You have a Workflow, an Activity, a Worker, and a way to start a Workflow Execution. It's time to run the Workflow.

## ![](/img/icons/run.png) Run the application

To run your Temporal Application, you need to start the Workflow and the Worker. You can start these in any order, but you'll need to run each command from a separate terminal window, as the Worker needs to be constantly running to look for tasks to execute.

First, ensure that your local Temporal Service is running. 

To start the Worker, run this command from the project root:

```command
mvn compile exec:java -Dexec.mainClass="helloworldapp.HelloWorldWorker"
```

You will see similar output from Maven:
```
[INFO] Scanning for projects...
[INFO]
[INFO] -------------------------< helloworldapp:app >--------------------------
[INFO] Building app 1.0-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- exec:3.1.0:java (default-cli) @ app ---
```

:::note

Based on the output above, it may appear that your application is stuck or non-responsive. This is not the case. Your Worker is running and ready to accept Workflows to be executed. Leave this program running and proceed to the next step.

:::

To start the Workflow, open a new terminal window and switch to your project root:

```command
cd hello-world-temporal
```

Run the following command to start the Workflow Execution:

```command
mvn exec:java -Dexec.mainClass="helloworldapp.InitiateHelloWorld"
```

The program runs and returns the result:

```
[INFO] Scanning for projects...
[INFO]
[INFO] -------------------------< helloworldapp:app >--------------------------
[INFO] Building app 1.0-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO]
[INFO] --- exec:3.1.0:java (default-cli) @ app ---
HelloWorldWorkflowID Hello World!
```

You can switch back to the terminal running the Worker and stop it with `CTRL-C`.

You have successfully built a Temporal application from scratch.

## Conclusion

You now know how to build a Temporal Workflow application using the Java SDK. All of the code in this tutorial is available in the [hello-world Java template](https://github.com/temporalio/hello-world-project-template-java) repository.

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

**True or false, with the Temporal Java SDK, you define Activities and Workflows by writing an Interface to create a definition and implementation of this interface that gets executed by the Workers?**

</summary>

True. Workflows and Activities are defined as interfaces and their implementations will implement the interface.

</details>

