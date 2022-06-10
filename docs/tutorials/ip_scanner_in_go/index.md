---
title: "Build an IP Scanner with Temporal and the Go SDK"
date: 2022-05-12T16:27:28-05:00
draft: false
---

Whether you have one web server or hundreds, it's a good idea to have some monitoring in place to let you know that something's wrong. The checks you can perform can be basic checks to see if the systems respond to connections, or deeper checks where your monitoring tool uses agents running on each node to collect information about memory or CPU usage.  When you find problems on each node, you'll want to take some kind of action. Perhaps you'll notify an administrator with an email, a Slack message, or even trigger another process to attempt to restart a node or even remove the node from a load balancer.

These workflows can be complex to orchestrate, and Temporal's framework makes the orchestration easier to manage. With Temporal, you'll be able to create more complex workflows, automatically retry scans, and run your scans on a schedule.

In this tutorial you'll build a small Go utility that scans IP addresses to see if they're responding. Once you have the basic app running,  you'll use the Temporal SDK to create an [Activity](https://docs.temporal.io/docs/temporal-explained/activities) and [Workflow](https://docs.temporal.io/docs/temporal-explained/workflows) that scans the sites. Then you'll configure the workflow to run on a schedule and record the results of each scan.

When you've completed this tutorial, you'll be able to do the following:

* Apply basic Temporal concepts including Workflows, Activities, and Workers.
  * Create Temporal Activities in Go.
  * Create Temporal Workflows in Go.
  * Create a Worker to manage the workflows and activities in Go.
  * Use the Temporal Client in Go to start, schedule, and stop workflow executions.
  * Use the results of one Activity in another Activity within a Workflow.
  * Capture the results of Temporal Workflow executions to a local log file.
  * Use Temporal's Cron scheduler to run your workflow on a schedule.


[TOC]

## Before You Begin

Before you begin this tutorial, complete the following tasks:

* Install the Go programming language on your computer. This tutorial uses Go 1.18.
* Install or configure a text editor such as Visual Studio Code and its Go extensions.
* Configure and run a local Temporal server using `docker compose` which you can do by following [How to quickly install a Temporal Cluster for testing and local development](https://docs.temporal.io/docs/clusters/quick-install/#docker-compose).

## Step 1: Create the Scanner App

Before you start working with Temporal, you'll build the core functionality for the scanner application. 

Start by creating a new folder for your project called `go-scanner`:

```bash
mkdir go-scanner
```

Switch to this folder. You'll launch various programs and commands in this folder.

```bash
cd go-scanner
```

Use the `go mod` command to create a module called `scanner/app`:

```bash
go mod init scanner/app
```

You'll see this output:

```
go: creating new go.mod: module scanner/app
```

Your program will read IP addresses and ports in from a text file. Create the file `addresses.txt` and add two addresses to the file, along with the ports to test, like the following:

```plain
192.168.1.1:443
192.168.1.2:22
```

Save the `addresses.txt` file 

Create the file `app.go` that contains the `app` package definition and a new Type called `Addresses` which you'll use to hold the collection of addresses to scan. Add the `bufio` and `os` packages as you'll use them to open and read the file:

```go
// app.go
package app

import (
	"bufio"
	"os"
)

type Addresses []string
```

Then create a function called `getAddressesFromFile` that reads the list of addresses from the `addresses.txt` file and pulls them into the `addresses` slice:

```go
// app.go

// GetAddressesFromFile reads IP addresses and ports from the specified file
func GetAddressesFromFile(filename string) (Addresses, error) {

	var addresses Addresses

	file, err := os.Open(filename)

	if err != nil {
		return nil, err
	}

	defer file.Close()

	s := bufio.NewScanner(file)

	for s.Scan() {
		addresses = append(addresses, s.Text())
	}

	return addresses, s.Err()
}
```

Save the file.

Create a new folder called `scan` which will hold a Go program you can use to ensure the basic functionality is working.

```bash
mkdir scan
```

Create the file `scan/main.go` with the usual boilerplate for an executable program. In the `imports` section, include your `scanner/app` module and the `os` module so you can send an exit signal if there's a failure:


```go
// scan/main.go
package main

import (
	"fmt"
	"os"
	"scanner/app"
)
func main() {

}
```

In the `main` function, use the `app.GetAddressesFromFile` function you wrote to read the addresses, and then print the addresses to the screen to ensure your file access works:


```go
// scan/main.go
package main

func main() {

	addresses, err := app.GetAddressesFromFile("addresses.txt")

	if err != nil {
		fmt.Println("Error", err)
		os.Exit(1)
	}

	for _, address := range addresses {
		fmt.Println(address)
	}
}
```


Save the file. 

Now run your `scan/main.go` program: 

```bash
go run scan/main.go
```

You'll see the addresses on the screen, verifying that your program can read the file and display its contents.

```plain
192.168.1.1:443
192.168.1.2:22
```


Next you'll add the code to attempt to connect to the server.

Rather than a simple `ping`, your program will attempt to establish a TCP connection to the server and specified port. To do this, you'll use the `net.Dial` function.

Open`app.go` in your editor and add the `net` package to the `import` section:

```go
// app.go

import (
	"bufio"
	"net"     // new line
	"os"
)

```

Then create a new `connect` function using the `net.Dial` library to connect to the address passed in and return the result:

```go
// app.go

// Connect connects to the given server.
func Connect(address string) (string, error) {
	_, err := net.Dial("tcp", address)
	if err != nil {
		return address + ": failed", err
	}

	return address + ": ok", nil
}
```

This implementation returns a string containing the address and the result of `failed` or `ok`, which is fine for this scenario.

Save the file.

Open `scan/main.go` and change the print statement in the `main` function to call the `app.Connect()` function, printing out the results:

```go
// scan/main.go

	for _, address := range addresses {
		fmt.Println(app.Connect(address))
	}

```

Save the file. Run `scan/main.go` again:

```bash
go run scan/main.go
```

You'll see the results appear in your terminal, although your results may differ based on the IP addresses you chose:

```
192.168.1.1:443: ok
192.168.1.2:22: ok
```

The application works. You can read in addresses from a file and scan them. Now it's time to convert this into an application that uses Temporal to manage the workflows so you can manage more complex workflows.


## Step 2: Create a Temporal Activity and Workflow to ping servers

You can currently scan a list of servers, but eventually you'll want to create some kind of workflow that performs some action when these servers are offline, and you'll want to be able to run this on a schedule. Temporal can help with both of those tasks.

To help you build an understanding of how Temporal works, you'll migrate your existing program so that it uses Temporal Workflows and Activities. You'll start by building a single activity that pings a server by calling your `app.Connect` function. Then you'll create a Workflow that runs this activity. Once this is in place you can add additional Activities to your Workflow.

First, grab the Temporal Go SDK and add it to your project:

```bash
go get -u go.temporal.io/sdk
```


Next, create a new file called `scanner_activity.go` which will hold the definition for your Temporal Activity. Add the following code to define the activity which accepts an address and calls the `connect` function you defined:

```go
// scanner_activity.go
package app

import (
	"context"

	"go.temporal.io/sdk/activity"
)

// ScannerActivity is the temporal activity that connects to the server.
func ScannerActivity(ctx context.Context, address string) (string, error) {
	logger := activity.GetLogger(ctx)
	logger.Info("scanning address", address)
	return Connect(address)
}
```

Activities in Temporal are regular Go functions that take in a context. Activities should return a result and an `error` back to the workflow, and this matches up with what your `connect` function returns. Explore Activity Definitions in more detail in [What Is an Activity Definitions](https://docs.temporal.io/docs/concepts/what-is-an-activity-definition).

Save the file. 

Next, you'll create the workflow definition which will execute the activity and handle its results. Explore this further in [What is a Workflow Definition](https://docs.temporal.io/docs/concepts/what-is-a-workflow-definition).

Create the file `scanner_workflow.go`. Define this as part of the `app` package and import the `temporal` and `workflow` packages from the Temporal Go SDK. as well as the `strings` package:

```go
// scanner_workflow.go
package app

import (
  "strings"
	"time"
	"go.temporal.io/sdk/temporal"
	"go.temporal.io/sdk/workflow"
)
```

Like Activities, Temporal Workflows are regular Go functions that accept a Context. Add the following code to define a `ScannerWorkflow` function which defines how the activity will run, executes it, and handles the results:

```go
// scanner_workflow.go

// ScannerWorkflow is the Temporal workflow for scanning servers.
// This implementation only calls the ScannerActivity.
func ScannerWorkflow(ctx workflow.Context, addresses Addresses) ([]string, error) {

	logger := workflow.GetLogger(ctx)

	retrypolicy := &temporal.RetryPolicy{
		InitialInterval:    time.Second,
		BackoffCoefficient: 2.0,
		MaximumInterval:    time.Second * 100, // 100 * InitialInterval
		MaximumAttempts: 3, // Unlimited
	}

	ao := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
        RetryPolicy: retrypolicy,
	}

	ctx = workflow.WithActivityOptions(ctx, ao)

	var results []string
	var result string

	for _, address := range addresses {
		err := workflow.ExecuteActivity(ctx, ScannerActivity, address).Get(ctx, &result)
		if err != nil {
			logger.Error("Activity failed.", "Error", err)
			result = address + ": error: " + err.Error()
		}
		results = append(results, result)
	}

	logger.Info("Done. ", strings.Join(results, ","))
	return results, nil
}
```

The `ScannerWorkflow` function accepts a collection of `Addresses`, iterates over each one, and invokes the activity. It then appends the result of the activity to the `results` slice. 

But if one of the scans fails, a couple of things are going to happen:

First, by default, if an activity fails, Temporal will retry it indefinitely. In this case, if a server doesn't respond, the activity will keep retrying over and over again. You control this by creating a Retry policy. In this case, Temporal will try the activity three times, which you defined with this code:

```
	retrypolicy := &temporal.RetryPolicy{
		InitialInterval:    time.Second,
		BackoffCoefficient: 2.0,
		MaximumInterval:    time.Second * 100, // 100 * InitialInterval
		MaximumAttempts: 3, // Unlimited
	}
```

Second, if the activity returns an error, the result will be empty. So even though the `connect` function returns a result, Temporal won't make that available to you due to the way the Go SDK handles errors. You could modify the activity so it never returns an error, but then you'd lose out on the ability to let Temporal automatically retry a few times in case there's some network latency. So the easiest solution is to handle the error in the workflow and set the `result` yourself, which is what the function you just wrote does:

```go
		err := workflow.ExecuteActivity(ctx, ScannerActivity, address).Get(ctx, &result)
		if err != nil {
			logger.Error("Activity failed.", "Error", err)
			result = address + ": error: " + err.Error()
		}
```


Once all the scans are complete, the function collects all of the scan results and returns them from the workflow.

The activity and the workflow to run the activity are configured.  Next you'll modify your app to use the workflow you created.

## Step 3: Run the Workflow

The `scan/main.go` file currently runs your scanner locally. Now that you have a workflow created, you'll modify this to run your Temporal workflow instead.

Open `scan/main.go` in your editor. Modify the `imports` section to include the Temporal SDK, the `context` package, the `log` package,  and the `github.com/google/uuid` package, which you'll use to generate a unique workflow ID for each run. Remove the `os` package. Your new `imports` section will look like the following:

```go
// scan/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"scanner/app"

	"github.com/google/uuid"
	"go.temporal.io/sdk/client"
)
```


Next, in the `main` function, after you've read the list of addresses, instead of calling them directly, create an instance of the Temporal client and invoke the `ScannerWorkflow`, passing it the list of addresses:

```go
// scan/main.go

...

	c, err := client.NewClient(client.Options{
		HostPort: client.DefaultHostPort,
	})
	if err != nil {
		log.Fatalln("Unable to create client", err)
	}
	defer c.Close()

	workflowID := "scan_" + uuid.New().String()
	workflowOptions := client.StartWorkflowOptions{
		ID:        workflowID,
		TaskQueue: "scanner",
	}

	we, err := c.ExecuteWorkflow(context.Background(), workflowOptions, app.ScannerWorkflow, addresses)

	if err != nil {
		log.Fatalln("Unable to execute workflow", err)
	}

	log.Println("Started workflow", "WorkflowID", we.GetID(), "RunID", we.GetRunID())
```

To execute the workflow, you need to pass the ID of the workflow and the Task queue it should use. To do this you create an instance of `StartWorkflowOptions` and set the values. In this case you're creating a unique workflow ID and setting the task queue to `scanner`.

You can see all of the options in [How to Set Workflow Options in Go](https://docs.temporal.io/docs/go/how-to-set-startworkflowoptions-in-go).

The `ExecuteWorkflow` function returns a `WorkflowExecution` instance which gives you access to the workflow ID, the Run ID, and the results.

Next, add the code to get the results of the workflow and then print them as you did previously:

```go
// scan/main.go

	var results []string

	err = we.Get(context.Background(), &results)

	if err != nil {
		fmt.Println(err)
	}

	for _, r := range results {
		fmt.Println(r)
	}
```

The `Get` function is a blocking function; it will wait for the results from the workflow. In this case, the workflow will complete quickly. But in some types of applications, workflows may take days or weeks to complete because the workflow may involve manual steps. You'll look into other methods to get workflow results later in this tutorial.

Your completed `scan/main.go` file looks like the following when you're done:

```go
// scan/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"scanner/app"

	"github.com/google/uuid"
	"go.temporal.io/sdk/client"
)

func main() {
	addresses, err := app.GetAddressesFromFile("addresses.txt")

	if err != nil {
		fmt.Println("Error", err)
		os.Exit(1)
	}

	c, err := client.NewClient(client.Options{
		HostPort: client.DefaultHostPort,
	})
	if err != nil {
		log.Fatalln("Unable to create client", err)
	}
	defer c.Close()

	workflowID := "scan_" + uuid.New().String()
	workflowOptions := client.StartWorkflowOptions{
		ID:        workflowID,
		TaskQueue: "scanner",
	}

	we, err := c.ExecuteWorkflow(context.Background(), workflowOptions, app.ScannerWorkflow, addresses)

	if err != nil {
		log.Fatalln("Unable to execute workflow", err)
	}

	log.Println("Started workflow", "WorkflowID", we.GetID(), "RunID", we.GetRunID())

	var results []string

	err = we.Get(context.Background(), &results)

	if err != nil {
		fmt.Println(err)
	}

	for _, r := range results {
		fmt.Println(r)
	}
}
```

Learn more about workflow executions in [How to Spawn a Workflow Execution in Go](https://docs.temporal.io/docs/go/how-to-spawn-a-workflow-execution-in-go).

If you tried to run this program now, it wouldn't do anything yet, because the Temporal Server doesn't actually run the workflows. It schedules the executions and keeps track of workflow history, but Temporal uses a [Worker Process](https://docs.temporal.io/docs/concepts/what-is-a-worker-process) to execute your code. You develop a [Worker Program](https://docs.temporal.io/docs/concepts/what-is-a-worker-program) to define the workflows and activities that the Worker should manage. 

A Worker program makes a connection to the Temporal server and registers the workflow and activity.

Create a new directory called `worker`:

```bash
mkdir worker
```

Now create the file `worker/main.go` and add the following code to define the package and i,ports. Add the `log` package, your `scanner/app` package, and the `client` and `worker` packages from the Temporal SDK:


```go
// worker/main.go
package main

import (
	"log"
	"scanner/app"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
)
```

Then add the `main` function to create an instance of the Temporal client, create a new `Worker` instance, and register the workflow and activity you created:

```go
// worker/main.go


func main() {
	c, err := client.NewClient(client.Options{
		HostPort: client.DefaultHostPort,
	})

	if err != nil {
		log.Fatalln("Unable to create client", err)
	}

	defer c.Close()

	w := worker.New(c, "scanner", worker.Options{})

	w.RegisterWorkflow(app.ScannerWorkflow)
	w.RegisterActivity(app.ScannerActivity)

	err = w.Run(worker.InterruptCh())
	if err != nil {
		log.Fatalln("Unable to start worker", err)
	}
}
```

When you create the worker, you pass it the client, the task queue name, and additional worker options:

```go
	w := worker.New(c, "scanner", worker.Options{})
```

The worker connects to the `scanner` task queue, registers the activity and workflow you created, then starts the process. It'll listen for tasks in the `scanner` task queue and run the workflow the Temporal server tells it to run.

For more details, take a look at [How to create a Worker program in Go](https://docs.temporal.io/docs/go/how-to-develop-a-worker-program-in-go).

Before moving on, execute the following command in your terminal to ensure that you have the `uuid` library installed. since your `scan/main.go` file uses it:


```bash
go get github.com/google/uuid
```

Once it's installed, you can start your worker program and run your scan.

In your terminal, start the worker:

```bash
go run worker/main.go
```

The worker starts and connects to the server:

```
2022/04/04 14:44:32 INFO  No logger configured for temporal client. Created default one.                                               │192.168.1.1:443: ok
2022/04/08 14:44:32 INFO  Started Worker Namespace default TaskQueue scanner WorkerID 84307@temporal.local@
```

In another terminal, change to your `go-scanner` directory:

```bash
cd go-scanner
```

Now run `scan/main.go`:

```bash
go run scan/main.go
```

The program displays the results on the screen:

```
2022/04/04 14:46:00 INFO  No logger configured for temporal client. Created default one.
2022/04/08 14:46:00 Started workflow WorkflowID scan_92b63f8f-0bb0-4b11-9349-8bb2cb030e43 RunID 24ffc1a8-c452-4252-b4e9-2e7fb3d5cd24
192.168.1.1:443: ok
192.168.1.2:22: ok
```

If you switch to the terminal that's running your worker process, you'll see the results there as well:

```
2022/04/08 14:46:00 INFO  Done.  Namespace default TaskQueue scanner WorkerID 44744@temporal.local@ WorkflowType ScannerWorkflow WorkflowID scan_92b63f8f-0bb0-4b11-9349-8bb2cb030e43 RunID 24ffc1a8-c452-4252-b4e9-2e7fb3d5cd24 Attempt 1 192.168.1.1:443: ok,192.168.1.2:22: ok
```

To scan servers again, run `scan/main.go`.

Modify `addresses.txt` to include an address you cannot connect to and observe the results.

Writing the results to the screen is a good first step, but you're most likely going to want to do something with the results, which you can do in a new activity.

## Step 4: Add an Activity to log the results

So far, you're printing the scan results to the screen. But in a real-world scenario, you may want to record the results or act on them by sending an email or a text message.

For this application, you'll add a new activity that writes the results to a local log file. In a real setting, writing to a log file on a disk creates a problem because you may have many workers, you may run out of disk space, and you may have file access issues if multiple workers attempt to write to a single file at the same time. Writing to a log file will work fine for this application, but you'll most likely modify the logic to write to a logging service or database in a production scenario.

Create the file `log_activity.go` and add the following code to define `LogActivity`, which accepts a filename for the log and a slice of strings which contain the results of the `ScannerActivity` you defined previously:

```go
// log_activity.go

package app

import (
	"context"
	"log"
	"os"
	"strings"

	"go.temporal.io/sdk/activity"
)

// LogActivity is the temporal activity that records the result to a file.
// Takes a logfile name and the message to log
func LogActivity(ctx context.Context, logfile string, results []string) (string, error) {
	logger := activity.GetLogger(ctx)

  // Create the file if it doesn't already exist and open it for writing.
	f, err := os.OpenFile(logfile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		logger.Info("Unable to write to log")
		return "", err
	}
	defer f.Close()

	message := strings.Join(results, ",")

	scannerlog := log.New(f, "scanner: ", log.LstdFlags)
	scannerlog.Println(message)
	return message, nil
}
```

The activity uses the filename to open the log file, creating it if it doesn't exist. It then takes the results from the run and turns it into a comma-separated list as a string. It then creates a new Go logger so the entries in the log get a prefix and a  timestamp. This activity then returns the message that was logged.

Save the file.

Now open `scanner_workflow.go` so you can add this new activity to the existing workflow.

First, locate the `for` loop where you ping the servers and collect them into a local slice called `results`:

```go
// scanner_workflow.go
  var results []string     
	var result string

	for _, address := range addresses {
		err := workflow.ExecuteActivity(ctx, ScannerActivity, address).Get(ctx, &result)
		if err != nil {
			logger.Error("Activity failed.", "Error", err)
			result = address + ": failed."
		}
		results = append(results, result)
```

Inside the `for` loop, after you get the results of the scan, add the code to invoke the new activity and log the result. Modify the `for` loop so it looks like the following:

```go
// scanner_workflow.go
	var result string
  var results []string     

	for _, address := range addresses {
		err := workflow.ExecuteActivity(ctx, ScannerActivity, address).Get(ctx, &result)
		if err != nil {
			logger.Error("Activity failed.", "Error", err)
			result = address + ": failed."
		}
		results = append(results, result)
    
		err = workflow.ExecuteActivity(ctx, LogActivity, "log.txt", result).Get(ctx, &result)

		if err != nil {
			logger.Error("LogActivity failed.", "Error", err)
		}

	}
```


Like with the previous activity, you  run the activity, wait for its result, and then check for an error. 

Since you're logging the results to the file, you don't need to return the results from the workflow. Modify the function declaration so it only returns an error:

```go
func ScannerWorkflow(ctx workflow.Context, addresses Addresses) error {
```

Then change the return value at the end of the function so it returns `nill`. Locate these lines:

```go
	logger.Info("Done. ", strings.Join(results, ","))
	return results, nil
```

Change the `return` statement so the code looks like the following:

```go
	logger.Info("Done. ", strings.Join(results, ","))
	return nil
```

Save the file.

Now that you're no longer returning the results from the workflow, you need to change the `scan/main.go` program so that it no longer waits for results. To do so, open the file and remove these lines:

```go
	var results []string
	err = we.Get(context.Background(), &results)

	if err != nil {
		fmt.Println(err)
	}

	for _, r := range results {
		fmt.Println(r)
	}
```

Save the file.

You've created a new activity, so you need to make sure your Worker is aware of it. Now open `worker/main.go` and register this new activity. Locate the lines that register the workflow and activity and add a new line to register the `LogActivity` you just created:

```go
// worker/main.go
...
	w.RegisterWorkflow(app.ScannerWorkflow)
	w.RegisterActivity(app.ScannerActivity)
	w.RegisterActivity(app.LogActivity)    // add this line
...
```

Save the file. Stop the worker with `CTRL+C` and rerun it again:

```bash
go run worker/main.go
```

Then, in a new terminal, switch to your project directory:

```bash
cd go-scanner
```

Then run the starter to kick off the workflow:

```bash
go run start/main.go
```


Now use the `tail` command to look at the `log.txt` file:

```bash
tail -f log.txt
```

You'll see two lines appear in the file, one for each scan:

```
scanner: 2022/05/03 09:43:21 192.168.1.1:443: ok
scanner: 2022/05/03 09:43:24 192.168.1.2:23: failed.
```

Now that you're comfortable working with multiple Activities in a Workflow, let's add a new activity to read in the addresses.

## Step 5: Add an Activity to read the addresses

Currently, your `start/main.go` file reads the addresses into a slice and passes this slice into the workflow. When you have more than a handful of addresses, this isn't going to work well. When you run a Workflow, the inputs and outputs of the Workflow execution are logged to the Event History, and there's a limit to the number of entries that history can contain before you start noticing performance issues. In addition, you may need the flexibility to read the addresses in batches, or even get the addresses from some other service.

Create a new file called `get_addresses_activity.go` and add the following code to define the activity. This will look similar to your `scanner_activity:

```go
// get_addresses_activity.go
package app

import (
	"context"
)

// GetAddressesActivity fetches the addresses from the file
func GetAddressesActivity(ctx context.Context, filename string) ([]string, error) {
	return GetAddressesFromFile(filename)
}
```

The function `GetAddressesActivity` accepts the context and the filename, and returns a slice and an error. It calls the `GetAddressFromFile`function and returns its results.

Save the file.

Open `scan/main.go` , locate the following lines that read the file and remove them:

```go
	addresses, err := app.GetAddressesFromFile("addresses.txt")

	if err != nil {
		fmt.Println("Error", err)
		os.Exit(1)

	}
```

As a result, you won't need the `fmt` or `os` packages anymore, so remove those:

```go
import (
	"context"
	"log"
	"scanner/app"
	"time"

	"go.temporal.io/sdk/client"
)

```

Finally, change the Workflow execution so it sends the filename rather than a slice of addresses:

```go
	we, err := c.ExecuteWorkflow(context.Background(), workflowOptions, app.ScannerWorkflow, "addresses.txt")
```

Save the file.

Now open `scanner_workflow.go` and modify the function signature to accept the filename instead of a slice of addresses:

```go
func ScannerWorkflow(ctx workflow.Context, filename string) error {
```

Then locate the section of the code that sets the context:

```go
	ctx = workflow.WithActivityOptions(ctx, ao)

	var results []string
	var result string

```

In between the context assignment and the variable declarations, add the following code to define the `addresses` variable and execute  `GetAdressesActivity`:

```go
	ctx = workflow.WithActivityOptions(ctx, ao)

	var addresses []string

	err := workflow.ExecuteActivity(ctx, GetAddressesActivity, filename).Get(ctx, &addresses)
	if err != nil {
		logger.Error("GetAddressActivity failed.", "Error", err)
    return err
	}

	var results []string
	var result string
```

Notice a subtle change this time. If an error occurs running the workflow, we're going to return the error from the workflow rather than attempting to continue. This will tell Temporal that the workflow failed, and you'll be able to see that in the console. Temporal will still retry the activity according to the retry policy, but once it's tried three times, it'll return the error and stop the workflow.

Save the file.

Finally, open `worker/main.go` and register  `GetAddressesActivity` as an activity:

```go
// worker/main.go

...

	w.RegisterWorkflow(app.ScannerWorkflow)
	w.RegisterActivity(app.ScannerActivity)
	w.RegisterActivity(app.LogActivity)
	w.RegisterActivity(app.GetAddressesActivity)    // <- Add this line

```

Restart the worker if it's currently running, and then run the activity again. You'll get similar results as before.

But now rename the `addresses.txt` file to `addresses2.txt`:

```
mv addresses.txt addresses2.txt
```

Run the workflow again:

```bash
go run start/main.go
```

This time the workflow won't be able to read the file.

```
2022/05/11 10:45:32 INFO  Started Worker Namespace default TaskQueue scanner WorkerID 85823@temporal.local@
2022/05/11 10:45:35 DEBUG ExecuteActivity Namespace default TaskQueue scanner WorkerID 85823@temporal.local@ WorkflowType ScannerWorkflow WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID dd32ab27-7a8e-4ab5-bd81-918d6a2ff7e5 Attempt 1 ActivityID 5 ActivityType GetAddressesActivity
2022/05/11 10:45:35 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 85823@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID dd32ab27-7a8e-4ab5-bd81-918d6a2ff7e5 ActivityType GetAddressesActivity Attempt 1 Error open addresses.txt: no such file or directory
2022/05/11 10:45:36 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 85823@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID dd32ab27-7a8e-4ab5-bd81-918d6a2ff7e5 ActivityType GetAddressesActivity Attempt 2 Error open addresses.txt: no such file or directory
2022/05/11 10:45:38 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 85823@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID dd32ab27-7a8e-4ab5-bd81-918d6a2ff7e5 ActivityType GetAddressesActivity Attempt 3 Error open addresses.txt: no such file or directory
2022/05/11 10:45:38 ERROR GetAddressActivity failed. Namespace default TaskQueue scanner WorkerID 85823@temporal.local@ WorkflowType ScannerWorkflow WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID dd32ab27-7a8e-4ab5-bd81-918d6a2ff7e5 Attempt 1 Error activity error (type: GetAddressesActivity, scheduledEventID: 5, startedEventID: 6, identity: 85823@temporal.local@): open addresses.txt: no such file or directory (type: PathError, retryable: true): no such file or directory (type: Errno, retryable: true)
```

The workflow will try three times and stop.

Temporal's default behavior is to retry activities indefinitely, but remember that the you limited the retries to three.The retry options you set apply to all of the activities in the Workflow.

To make Temporal continue attempting to read the file indefinitely, change the retry policy for that activity. In `scanner_workflow.go`, rearrange the code like this, so that the Activity Options doesn't specify a retry policy for `GetAddressActivity`, but it does for the other activities:

```go
// scanner_workflow.go

...

	// set the workflow options for the activity that will read the file, using the default retry options.
	ao := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	}

	ctx = workflow.WithActivityOptions(ctx, ao)

	var addresses []string

	err := workflow.ExecuteActivity(ctx, GetAddressesActivity, filename).Get(ctx, &addresses)
	if err != nil {
		logger.Error("GetAddressActivity failed.", "Error", err)
		return err
	}

	// set the workflow options for the next activity, this time using a custom retry policy:
	retrypolicy := &temporal.RetryPolicy{
		InitialInterval:    time.Second,
		BackoffCoefficient: 2.0,
		MaximumInterval:    time.Minute,
		MaximumAttempts:    3,
	}

	ao = workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
		RetryPolicy:         retrypolicy,
	}

	ctx = workflow.WithActivityOptions(ctx, ao)

	var results []string
	var result string

...

```

In this version, the default retry policy works for the activity that reads the file. Temporal will try to read the file for as long as the workflow runs. Then the  activty options get reset to use the retry policy for the scans, which tries only three times and stops.

Save the changes to the workflow. Then restart the worker.

The worker will continue its attempts to read the file. Each attempt will have a little more time between each attempts, called a backoff coefficient.

```
2022/05/11 11:22:18 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 87743@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID 9b217a1c-8787-44da-a6f5-7877247990c7 ActivityType GetAddressesActivity Attempt 1 Error open addresses.txt: no such file or directory
2022/05/11 11:22:19 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 87743@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID 9b217a1c-8787-44da-a6f5-7877247990c7 ActivityType GetAddressesActivity Attempt 2 Error open addresses.txt: no such file or directory
2022/05/11 11:22:21 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 87743@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID 9b217a1c-8787-44da-a6f5-7877247990c7 ActivityType GetAddressesActivity Attempt 3 Error open addresses.txt: no such file or directory
2022/05/11 11:22:25 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 87743@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID 9b217a1c-8787-44da-a6f5-7877247990c7 ActivityType GetAddressesActivity Attempt 4 Error open addresses.txt: no such file or directory
2022/05/11 11:22:33 ERROR Activity error. Namespace default TaskQueue scanner WorkerID 87743@temporal.local@ WorkflowID scan_45ecf307-694e-4715-86aa-576ed0711b58 RunID 9b217a1c-8787-44da-a6f5-7877247990c7 ActivityType GetAddressesActivity Attempt 5 Error open addresses.txt: no such file or directory
....
```

Rename the file back to `addresses.txt`:

```
mv addresses2.txt addresses.txt
```

You'll see the workflow pick up the change after a short while and the activity will complete.

You now have a workflow that checks a set of servers by reading in a file and pinging each server, logging the results to a text file, but you have to run it manually. Next you'll let Temporal run your workflow repeatedly.

## Step 6: Run Workflows periodically

You're most likely going to want to periodically check your servers' uptime. While you could run `scan/main.go` with `cron`, you can let Temporal run the workflow over and over with some small code changes. 

When you execute a workflow, Temporal keeps a history of all the events that happen during that run, including the activities you run and any state you saved. Temporal can replay that history if a worker goes down or an activity fails. However, there's a limit to the size of that event history, and the larger the history gets, the more likely you are to see performance problems.. One way to fill up that history quickly is to do an infinite loop inside of your workflow.  So if you're looking to re-run these scans, writing a loop with a sleep inside isn't the approach you want to take.

Instead, Temporal provides the ability to re-run the workflow again as a new execution. Temporal calls this [Continue-As-New](https://docs.temporal.io/docs/concepts/what-is-continue-as-new/). 

In Go, you return

First, open `scanner_workflow.go` and change the workflow definition so it accepts a new argument for the duration time called `durationInMinutes`:

```go
//scanner_workflow.go

func ScannerWorkflow(ctx workflow.Context, addresses Addresses, durationInMinutes time.Duration) error {
...
}
```

You'll use this `durationInMinutes` variable to tell the workflow how long to sleep.

Now find the `return` statement for your `ScannerWorkflow` function:

```go
//scanner_workflow.go
return nil
```

Remove it and add a line to cause the workflow to sleep for the duration you passed in:

```go
	workflow.Sleep(ctx, (durationInMinutes * time.Minute))
```

Then below that, add a new `return` statement that calls `NewContinueAsNewError`, passing in the arguments to rerun the workflow:

```go
	return workflow.NewContinueAsNewError(ctx, ScannerWorkflow, addresses, durationInMinutes)
```

When the workflow finishes its scan, it will wait for the specified duration and then execute the workflow again using the same workflow ID, but it will be a brand new workflow execution with its own history.

Save the file.



Now open `scan/main.go` and locate the line that sets the `workflowID`:



```go
//scan/main.go
...
	workflowID := "scan_" + uuid.New().String()
```

Instead of assigning a workflow ID that's unique, set the value to `scan_repeat`. This will make it easier to identify this repeating workflow later when you want to stop it.

```go
//scan/main.go
...
  workflowID := "scan_repeat"
```

Next, locate the line that starts the workflow execution:

```go
// scan/main.go
...
	we, err := c.ExecuteWorkflow(context.Background(), workflowOptions, app.ScannerWorkflow, addresses)
```

Add a line to define a `duration` variable of type `time.Duration`, and use that value as an argument to the workflow execution:

```go
// scan/main.go
	var duration time.Duration = 1

	we, err := c.ExecuteWorkflow(context.Background(), workflowOptions, app.ScannerWorkflow, addresses, duration)
```

Save the file.

You changed the workflow, so switch to the window that contains your Worker and stop it with `CTRL-C`. Then start it again:

```bash
go run worker/main.go
```

Then, in a new terminal, switch to your `go-scanner` project:

```bash
cd go-scanner
```

Then run your scanner again:

```bash
go run scan/main.go
```

Now use the `tail` command to look at your log:

```bash
tail -f log.txt
```

You'll see a single line appear:

```
scanner: 2022/04/06 16:00:01 192.168.1.1:443: ok,192.168.1.2:22: ok
```

After a few minutes you'll see two more entries:

```
scanner: 2022/04/06 16:00:01 192.168.1.1:443: ok,192.168.1.2:22: ok
scanner: 2022/04/06 16:02:01 192.168.1.1:443: ok,192.168.1.2:22: ok
scanner: 2022/04/06 16:04:00 192.168.1.1:443: ok,192.168.1.2:22: ok
```

Temporal will continue running this workflow until you terminate it from the Web UI or by sending a message to stop it.

## Step 7: Stop the Workflow

The workflow you defined will run every five minutes until you stop it. You can stop workflows using the Temporal Web UI, but you can also use the Temporal client to stop a workflow.

Create a new folder in your project called `cron_stop` which will hold a program to cancel the scheduled workflow:

```bash
mkdir scan_stop
```

Then create the file `scan_stop/main.go` and add the following code that creates an instance of the Temporal client and stops the workflow using its ID:

```go
// scan_stop/main.go
package main

import (
	"context"
	"log"

	"go.temporal.io/sdk/client"
)

func main() {

	c, err := client.NewClient(client.Options{
		HostPort: client.DefaultHostPort,
	})
	if err != nil {
		log.Fatalln("Unable to create client", err)
	}
	defer c.Close()

	workflowID := "scanner_repeat"

	err = c.TerminateWorkflow(context.Background(), workflowID, "", "Terminated by client")

	if err != nil {
		log.Fatalln("Unable to terminate Workflow Execution", err)
	}
	log.Println("Workflow Execution terminated", "WorkflowID", workflowID)

}
```

The call to `client.TerminateWorkflow` requires the workflow ID and a reason for terminating the workflow. This reason gets stored with the workflow's history which you can view from the Temporal Server UI.

Terminating a workflow abruptly stops the workflow and the running activity. It's the equivalent of forcibly killing a process. It doesn't allow for graceful shutdowns or cleanups. To stop a normal workflow, you'd use the `CancelWorkflow` function instead, which would also give you the ability to respond to the cancel request and do additional work. However, since you're spawning a new workflow, sending a cancel request only cancels the current execution. Another execution will still be scheduled. 

Save this file. Then run it in your terminal to stop the workflow:

```bash
go run scan_stop/main.go
```

The workflow stops. You can verify this by looking at the `log.txt` file you created, as it will no longer populate with results. You can also view the terminated status in the Temporal web UI.

This application currently scans two addresses. Next you'll modify the application so it can handle hundreds or even thousands of scans.

## Step 8: Scale up to handle higher loads

So far you've worked with two addresses, but if you start working with hundreds of servers, you might run into those history limits again.

To handle large volumes of workflows, you'll take the following approach:

1. You'll modify your existing `scanner_workflow` so that it reads the IP addresses from the file in batches.
2. For each address, you'll spawn a Child Workflow that executes the scanning and logging activities, These Child Workflows will run on the interval you specify using Continue-As-New.
3. Once the main workflow has read all of the addresses, it will complete. The Child Workflows you started will run because you will configure them to run independent of the parent workflow.



Before you start, create a new file with lots of IP addresses and ports. For this demo, you'll check port `22` for all the IP addresses in the `192.168.1.1-192.168.1.255` address range. Execute the following command to create this file:

```bash
seq -f "192.168.1.%g:22" 1 255 > addresses.txt
```







Change the `GetAddressesFromFile` function so it reads a range of lines from the file. Add arguments for a starting line and the number of lines to retrieve to the function, and then use those lines to set a start and end point to populate the slice of addresses:

```go
func GetAddressesFromFile(filename string, start int64, lines int64) (Addresses, error) {

	var addresses Addresses

	file, err := os.Open(filename)

	if err != nil {
		return nil, err
	}

	defer file.Close()

	scanner := bufio.NewScanner(file)

	var line int64 = 1
	var end int64 = start + lines

	for scanner.Scan() {
		if line >= start && line < end {
			addresses = append(addresses, scanner.Text())
		}
		line++
	}

	return addresses, scanner.Err()
}
```











## Wrapping Up

In this tutorial, you created a small application that scans servers to see if they're available using Temporal to manage the workflow. You ran single workflows and you created a workflow that ran every five minutes, using a second activity to save the results to a local log file.

Try the following things before moving on:

* Modify the workfllow so that If there are any errors, the workflow runs a new activity that records the errors to `error.log`. 
* Consider how you would redesign the program so that you can send email messages when a server is down. 
  * What changes would you need to make to the program if you had a single email account?
  * What changes would you need to make to the program to assign an email address with each server?

### Further Resources

* TBD













