---
id: hello-world-tutorial-go
title: Build a Temporal Application from scratch in Go
sidebar_position: 3
description: In this tutorial you will build a Temporal Application using the Go SDK. You'll write a Workflow, an Activity, tests, and define a Worker.
keywords: [golang,go,temporal,sdk,tutorial, hello world, temporal application, workflow, activity]
last_update:
  date: 2023-03-03
tags:
  - go
  - sdk
  - tutorial
image: /img/temporal-logo-twitter-card.png
pagination_next: courses/temporal_101/go
---

![Temporal Go SDK](/img/sdk_banners/banner_go.png)

:::note Tutorial information

- **Level:** ⭐ Temporal beginner
- **Time:** ⏱️ ~10 minutes
- **Goals:** 🙌
  - Set up, build, and test a Temporal Application project from scratch using the [Go SDK](https://github.com/temporalio/sdk-go).
  - Identify the four parts of a Temporal Application.
  - Describe how the Temporal Server gets information to the Worker.
  - Explain how to define Workflow Definitions with the Temporal Go SDK.

:::


### Introduction

Creating reliable applications is a difficult task.  [Temporal](https://temporal.io) lets you create fault-tolerant resilient applications using programming languages you already know, so you can build complex applications that execute successfully and recover from failures.

In this tutorial, you will build your first [Temporal Application](https://docs.temporal.io/temporal#temporal-application) from scratch using the [Temporal Go SDK](https://github.com/temporalio/go-sdk). The Temporal Application will consist of the following pieces:

1. A [Workflow](https://docs.temporal.io/workflows): Workflows are functions that define the overall flow of the application and represent the orchestration aspect of the business logic.
2. An [Activity](https://docs.temporal.io/activities): Activities are functions called during Workflow Execution and represent the execution aspect of your business logic. The Workflow you'll create executes a single Activity, which takes a string from the Workflow as input and returns a formatted version of this string to the Workflow.
3. A [Worker](https://docs.temporal.io/workers): Workers host the Activity and Workflow code and execute the code piece by piece.
4. An initiator: To start a Workflow, you need to send a message to the Temporal server to tell it to track the state of the Workflow. You'll write a separate program to do this.

You'll also write a unit test to ensure your Workflow executes successfully.

When you're done, you'll have a basic application and a clear understanding of how to build out the components you'll need in future Temporal Applications.

The code in this tutorial is available in the [hello-world Go template](https://github.com/temporalio/hello-world-project-template-go) repository.

## Prerequisites

Before starting this tutorial:

- [Set up a local development environment for developing Temporal Applications using the Go programming language](/getting_started/go/dev_environment/index.md)
- Follow the tutorial [Run your first Temporal application with the Go SDK](/getting_started/go/first_program_in_go/index.md) to gain a better understanding of what Temporal is and how its components fit together.

## ![](/img/icons/harbor-crane.png) Create a new Go project

To get started with the Temporal Go SDK, you'll create a new Go project and initialize it as a module, just like any other Go program you're creating. Then you'll add the Temporal SDK package to your project.

In a terminal, create a new project directory called `hello-world-temporal`:

```command
mkdir hello-world-temporal
```

Switch to the new directory:

```command
cd hello-world-temporal
```

From the root of your new project directory, initialize a new Go module. Make sure the module path (for example, `hello-world-temporal`) matches that of the directory in which you are creating the module. 


```command
go mod init hello-world-temporal/app
```

Then add the Temporal Go SDK as a project dependency:

```command
go get go.temporal.io/sdk
```

You'll see the following output, indicating that the SDK is now a project dependency:

```
go: added go.temporal.io/sdk v1.17.0
```

With your project workspace configured, you're ready to create your first Temporal Activity and Workflow. You'll start with the Workflow.

## Create a Workflow

Workflows are where you configure and organize the execution of Activities. You write a Workflow using one of the programming languages supported by a Temporal SDK. This code is known as a *Workflow Definition*. 

In the Temporal Go SDK, a Workflow Definition is an [exported function](https://go.dev/tour/basics/3) with two additional requirements: it must accept `workflow.Context` as the first input parameter, and it must return `error`. Your Workflow function can optionally return another value, which you'll use to return the result of the Workflow Execution. You can learn more in the [Workflow parameters](https://docs.temporal.io/dev-guide/go/foundations#workflow-parameters) section of the Temporal documentation.

Create the file `workflow.go` in the root of your project and add the following code to create a `GreetingWorkflow` function to define the Workflow:

<!--SNIPSTART hello-world-project-template-go-workflow-->
[workflow.go](https://github.com/temporalio/hello-world-project-template-go/blob/master/workflow.go)
```go
package app

import (
	"time"

	"go.temporal.io/sdk/workflow"
)

func GreetingWorkflow(ctx workflow.Context, name string) (string, error) {
	options := workflow.ActivityOptions{
		StartToCloseTimeout: time.Second * 5,
	}

	ctx = workflow.WithActivityOptions(ctx, options)

	var result string
	err := workflow.ExecuteActivity(ctx, ComposeGreeting, name).Get(ctx, &result)

	return result, err
}

```
<!--SNIPEND-->

The `GreetingWorkflow` function accepts a `workflow.Context` and a string value that holds the name. It returns a string value and an error, which follows the conventions you'll find in other Go programs. You can learn more in the [Workflow parameters](https://docs.temporal.io/dev-guide/go/foundations#workflow-parameters) section of the Temporal documentation.

:::tip

You can pass multiple inputs to a Workflow, but it's a good practice to send a single input. If you have several values you want to send, you should define a Struct and pass that into the Workflow instead.

:::

The function defines the options to execute an Activity, and then executes an Activity called `ComposeGreeting`, which you'll define next. The function returns the result of the Activity.

With your Workflow Definition created, you're ready to create the `ComposeGreeting` Activity.

## Create an Activity

In a Temporal Application, Activities are where you execute [non-deterministic](https://docs.temporal.io/workflows#deterministic-constraints) code or perform operations that may fail, such as API requests or database calls. Your Workflow Definitions call Activities and process the results. Complex Temporal Applications have Workflows that invoke many Activities, using the results of one Activity to execute another.

For this tutorial, your Activity won't be complex; you'll create an Activity that takes a string as input and uses it to create a new string as output, which is then returned to the Workflow. This will let you see how Workflows and Activities work together without building something complicated.

With the Temporal Go SDK, you define Activities similarly to how you define Workflows: using a regular exportable Go function.

Create the file `activity.go` in the project root and add the following code to define a `ComposeGreeting` function:

<!--SNIPSTART hello-world-project-template-go-activity-->
[activity.go](https://github.com/temporalio/hello-world-project-template-go/blob/master/activity.go)
```go
package app

import (
	"context"
	"fmt"
)

func ComposeGreeting(ctx context.Context, name string) (string, error) {
	greeting := fmt.Sprintf("Hello %s!", name)
	return greeting, nil
}

```
<!--SNIPEND-->

The `ComposeGreeting` Activity Definition also accepts a `Context` . This parameter is optional for Activity Definitions, but it's recommended because you may need it for other Go SDK features as your application evolves.

The logic within the `ComposeGreeting` function creates the string and returns the greeting, along with `nil` for the error. In a more complex case, you can return an error from your Activity and then configure your Workflow to handle the error.

Your [Activity Definition](https://docs.temporal.io/activities#activity-definition) can accept input parameters just like Workflow Definitions. Review the [Activity parameters](https://docs.temporal.io/dev-guide/go/foundations#activity-parameters) section of the Temporal documentation for more details, as there are some limitations you'll want to be aware of when running more complex applications.

Like Workflow Definitions, if you have more than one parameter for an Activity, you should bundle the data into a struct rather than sending multiple input parameters. This will make future updates easier.


You've completed the logic for the application; you have a Workflow and an Activity defined. Before moving on, you'll write a unit test for your Workflow.

## ![](/img/icons/check.png) Add a unit test

The Temporal Go SDK includes functions that help you test your Workflow executions. Let's add a basic unit test to the application to make sure the Workflow works as expected. 

You'll use the [testify](https://github.com/stretchr/testify) package to build your test cases and mock the Activity so you can test the Workflow in isolation.


Add the required `testify` packages to your project by running the following commands in your terminal:

```command
go get github.com/stretchr/testify/mock
```
```command
go get github.com/stretchr/testify/require
```
```command
go mod tidy
```

Now create the file  `workflow_test.go` and add the following code to the file to define the Workflow test:


<!--SNIPSTART hello-world-project-template-go-workflow-test-->
[workflow_test.go](https://github.com/temporalio/hello-world-project-template-go/blob/master/workflow_test.go)
```go
package app

import (
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.temporal.io/sdk/testsuite"
)

func Test_Workflow(t *testing.T) {
	// Set up the test suite and testing execution environment
	testSuite := &testsuite.WorkflowTestSuite{}
	env := testSuite.NewTestWorkflowEnvironment()

	// Mock activity implementation
	env.OnActivity(ComposeGreeting, mock.Anything, "World").Return("Hello World!", nil)

	env.ExecuteWorkflow(GreetingWorkflow, "World")
	require.True(t, env.IsWorkflowCompleted())
	require.NoError(t, env.GetWorkflowError())

	var greeting string
	require.NoError(t, env.GetWorkflowResult(&greeting))
	require.Equal(t, "Hello World!", greeting)
}

```
<!--SNIPEND-->

This test creates a test execution environment and then mocks the Activity implementation so it returns a successful execution. The test then executes the Workflow in the test environment and checks for a successful execution. Finally, the test ensures the Workflow's return value returns the expected value.

Run the following command from the project root to execute the unit tests:

```command
go test
```

You'll see output similar to the following from your test run indicating that the test was successful:

```
2022/09/28 16:16:32 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 1 ActivityType ComposeGreeting
PASS
ok      hello-world-temporal/app        0.197s
```

You have a working application and a test to ensure the Workflow executes as expected. Next, you'll configure a Worker to execute your Workflow.

## Configure a Worker

A [Worker](https://docs.temporal.io/concepts/what-is-a-worker) hosts Workflow and Activity functions and executes them one at a time. The Temporal Server tells the Worker to execute a specific function from information it pulls from the [Task Queue](https://docs.temporal.io/concepts/what-is-a-task-queue). After the Worker runs the code, it communicates the results back to the Temporal Server.

When you start a Workflow, you tell the server which Task Queue the Workflow and Activities use. A Worker listens and polls on the Task Queue, looking for work to do.

To configure a Worker process using the Go SDK, you create an instance of `Worker` and give it the name of the Task Queue to poll. 

You'll connect to the Temporal Cluster using a Temporal Client, which provides a set of APIs to communicate with a Temporal Cluster. You'll use Clients to interact with existing Workflows or to start new ones.

Since you'll use the Task Queue name in multiple places in your project, create the file `shared.go` and define the Task Queue name there:

<!--SNIPSTART hello-world-project-template-go-shared-->
[shared.go](https://github.com/temporalio/hello-world-project-template-go/blob/master/shared.go)
```go
package app

const GreetingTaskQueue = "GREETING_TASK_QUEUE"
```
<!--SNIPEND-->

Now you'll create the Worker process. In this tutorial you'll create a small standalone Worker program so you can see how all of the components work together. 

Create a new directory called `worker` which will hold the program you'll create:

```command
mkdir worker
```

Then create the file `worker/main.go` and add the following code to connect to the Temporal Server, instantiate the Worker, and register the Workflow and Activity:

<!--SNIPSTART hello-world-project-template-go-worker-->
[worker/main.go](https://github.com/temporalio/hello-world-project-template-go/blob/master/worker/main.go)
```go
package main

import (
	"hello-world-temporal/app"
	"log"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)

func main() {
	// Create the client object just once per process
	c, err := client.Dial(client.Options{})
	if err != nil {
		log.Fatalln("unable to create Temporal client", err)
	}
	defer c.Close()

	// This worker hosts both Workflow and Activity functions
	w := worker.New(c, app.GreetingTaskQueue, worker.Options{})
	w.RegisterWorkflow(app.GreetingWorkflow)
	w.RegisterActivity(app.ComposeGreeting)

	// Start listening to the Task Queue
	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("unable to start Worker", err)
	}
}

```
<!--SNIPEND-->

This program uses `client.Dial` to connect to the Temporal server, and then uses `worker.New` to instantiate the Worker. You register the Workflow and Activity with the Worker and then use `Run` to start the Worker.

By default, the client connects to the Temporal Cluster running at `localhost` on port `7233`, and connects to the `default` namespace. You can change this by setting values in `client.Options`.

You've created a program that instantiates a Worker to process the Workflow. Now you need to start the Workflow.

## Write code to start a Workflow Execution

You can start a Workflow Execution by using the Temporal CLI or by writing code using the Temporal SDK. In this tutorial, you'll use the Temporal SDK to start the Workflow, which is how most real-world applications work. 

Starting a Workflow Execution using the Temporal SDK involves connecting to the Temporal Server, configuring the Task Queue the Workflow should use, and starting the Workflow with the input parameters it expects. In a real application, you may invoke this code when someone submits a form, presses a button, or visits a certain URL. In this tutorial, you'll create a small command-line program that starts the Workflow Execution.

Create a new directory called `start` to hold the program:

```command
mkdir start
```

Then create the file `start/main.go` and add the following code to the file to connect to the server and start the Workflow:

<!--SNIPSTART hello-world-project-template-go-start-workflow-->
[start/main.go](https://github.com/temporalio/hello-world-project-template-go/blob/master/start/main.go)
```go
package main

import (
	"context"
	"fmt"
	"hello-world-temporal/app"
	"log"

	"go.temporal.io/sdk/client"
)

func main() {

	// Create the client object just once per process
	c, err := client.Dial(client.Options{})
	if err != nil {
		log.Fatalln("unable to create Temporal client", err)
	}
	defer c.Close()

	options := client.StartWorkflowOptions{
		ID:        "greeting-workflow",
		TaskQueue: app.GreetingTaskQueue,
	}

	// Start the Workflow
	name := "World"
	we, err := c.ExecuteWorkflow(context.Background(), options, app.GreetingWorkflow, name)
	if err != nil {
		log.Fatalln("unable to complete Workflow", err)
	}

	// Get the results
	var greeting string
	err = we.Get(context.Background(), &greeting)
	if err != nil {
		log.Fatalln("unable to get Workflow result", err)
	}

	printResults(greeting, we.GetID(), we.GetRunID())
}

func printResults(greeting string, workflowID, runID string) {
	fmt.Printf("\nWorkflowID: %s RunID: %s\n", workflowID, runID)
	fmt.Printf("\n%s\n\n", greeting)
}

```
<!--SNIPEND-->

Like the Worker you created, this program uses `client.Dial` to connect to the Temporal server. It then specifies a [Workflow ID](https://docs.temporal.io/dev-guide/go/foundations/#workflow-id) for the Workflow, as well as the Task Queue. The Worker you configured is looking for tasks on that Task Queue.

:::tip Specify a Workflow ID

You don't need to specify a Workflow ID, as Temporal will generate one for you, but defining the Workflow ID yourself makes it easier for you to find it later in logs or interact with a running Workflow in the future. 

Using a Workflow ID that reflects some business process or entity is a good practice. For example, you might use a customer identifier or email address as part of the Workflow ID  if you ran one Workflow per customer. This would make it easier to find all the Workflow Executions related to that customer later.

:::

You can [get the results](https://docs.temporal.io/dev-guide/go/foundations/#get-workflow-results) from your Workflow right away, or you can get the results at a later time. This implementation attempts to get the results immediately by calling  `we.Get`, which blocks the program's execution until the Workflow Execution completes.

You have a Workflow, an Activity, a Worker, and a way to start a Workflow Execution. It's time to run the Workflow.

## ![](/img/icons/run.png) Run the application

To run your Temporal Application, you need to start the Workflow and the Worker. You can start these in any order, but you'll need to run each command from a separate terminal window, as the Worker needs to be constantly running to look for tasks to execute.

First, ensure that your local Temporal Cluster is running. 

To start the Worker, run this command from the project root:

```command
go run worker/main.go
```

You'll see output like the following in your terminal, indicating that the Worker has started and has connected to the Task Queue:

```
2022/09/30 13:57:56 INFO  No logger configured for temporal client. Created default one.
2022/09/30 13:57:56 INFO  Started Worker Namespace default TaskQueue GREETING_TASK_QUEUE WorkerID 45122@temporal.local@
```

Leave this program running.

To start the Workflow, open a new terminal window and switch to your project root:

```command
cd hello-world-temporal
```

Then run `start/main.go` from the project root to start the Workflow Execution:

```command
go run start/main.go
```

The program runs and returns the result:

```
2022/09/30 14:00:07 INFO  No logger configured for temporal client. Created default one.

WorkflowID: greeting-workflow RunID: 0c189fd9-57aa-4155-8b1e-cd6c50cf1761

Hello World!
```

Switch to the terminal window that's running the Worker and you'll see that its output updated to show that it executed the Workflow and the Activity:

```
2022/09/30 14:00:07 DEBUG ExecuteActivity Namespace default TaskQueue GREETING_TASK_QUEUE WorkerID 46038@temporal.local@ WorkflowType GreetingWorkflow WorkflowID greeting-workflow RunID 0c189fd9-57aa-4155-8b1e-cd6c50cf1761 Attempt 1 ActivityID 5 ActivityType ComposeGreeting

```

You can stop the Worker with `CTRL-C`.

You have successfully built a Temporal application from scratch.

## Conclusion

You now know how to build a Temporal Workflow application using the Go SDK.

### Review

Answer the following questions to see if you remember some of the more important concepts from this tutorial:

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

**How does the Temporal server get information to the Worker?**

</summary>

It adds the information to a Task Queue.

</details>

<details>
<summary>

**True or false, with the Temporal Go SDK, you define Activities and Workflows by writing Go functions?**

</summary>

True. Workflows and Activities are Go functions that must be exportable.

</details>
