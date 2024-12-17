---
id: hello-world-php
sidebar_position: 1
keywords: [PHP, temporal, sdk, tutorial]
tags: [PHP, SDK]
last_update:
  date: 2021-10-01
title: Run a Temporal Application in PHP
description: Explore the components that make up a Temporal project in PHP. 
image: /img/temporal-logo-twitter-card.png
---

![Temporal PHP SDK](/img/sdk_banners/banner_php.png)

import { OutdatedNotice } from '@site/src/components'

<OutdatedNotice />

In this tutorial, you'll explore the different components that make up a Temporal project using the PHP SDK, including:

- Temporal Client
- Workflow and Activity Code
- Temporal Worker (running with [RoadRunner](https://roadrunner.dev))

All the code on this page is included in the [SimpleActivity](https://github.com/temporalio/samples-php/tree/master/app/src/SimpleActivity) sample,
from our [Samples repository](https://github.com/temporalio/samples-php).

## Downloading the project

Clone the project repository and navigate to the project directory:

```command
git clone git@github.com:temporalio/samples-php.git
```

```command
cd samples-php
```

Start the Temporal Server and application containers:

```command
docker-compose up
```

This starts Temporal Server with the [docker-compose.yml](https://github.com/temporalio/samples-php/blob/master/docker-compose.yml) that ships with the `samples-php` repository.
When it's live, you can access [Temporal Web](https://docs.temporal.io/web-ui) at `http://localhost:8080` although you won't see any Workflows run yet.

## Run the application

The program you'll run is a console command that starts a workflow, prints its IDs, and then waits for its result.

Execute the following command to run the program:

```command
docker-compose exec app php app.php simple-activity
```

This prints the Workflow ID (and corresponding Run ID) that is started, and you'll see it reflected in the Temporal Web UI.

At the end it will log the result:

```bash
Starting GreetingWorkflow...
Started: WorkflowID=3520711c-7c8b-4d36-bd18-68328e60447b
Result:
Hello Antony
```

Let's explore each piece of the code and how it works with Temporal.

## The Workflow Client

In the following snippet,  `WorkflowClientInterface` is the entry point to get access to workflows. When you need to create, retrieve, or start a workflow you'll use an instance of `WorkflowClientInterface`.

Here we create an instance of `GreetingWorkflowInterface` with execution timeout of 1 minute. Then we print some information and start the workflow.

<!--SNIPSTART php-hello-client {"enable_source_link": true}-->
[app/src/SimpleActivity/ExecuteCommand.php](https://github.com/temporalio/samples-php/blob/master/app/src/SimpleActivity/ExecuteCommand.php)
```php
class ExecuteCommand extends Command
{
    protected const NAME = 'simple-activity';
    protected const DESCRIPTION = 'Execute SimpleActivity\GreetingWorkflow';

    public function execute(InputInterface $input, OutputInterface $output): int
    {
        $workflow = $this->workflowClient->newWorkflowStub(
            GreetingWorkflowInterface::class,
            WorkflowOptions::new()->withWorkflowExecutionTimeout(CarbonInterval::minute())
        );

        $output->writeln("Starting <comment>GreetingWorkflow</comment>... ");

        // Start a workflow execution. Usually this is done from another program.
        // Uses task queue from the GreetingWorkflow @WorkflowMethod annotation.
        $run = $this->workflowClient->start($workflow, 'Antony');

        $output->writeln(
            sprintf(
                'Started: WorkflowID=<fg=magenta>%s</fg=magenta>',
                $run->getExecution()->getID(),
            )
        );

        // getResult waits for workflow to complete
        $output->writeln(sprintf("Result:\n<info>%s</info>", $run->getResult()));

        return self::SUCCESS;
    }
}
```
<!--SNIPEND-->

Now let's look at the workflow.

## Workflow interface and implementation

With the PHP SDK, you define an interface and an implementation.

First, let's take a look at the workflow interface:

<!--SNIPSTART php-hello-workflow-interface {"enable_source_link": true}-->
[app/src/SimpleActivity/GreetingWorkflowInterface.php](https://github.com/temporalio/samples-php/blob/master/app/src/SimpleActivity/GreetingWorkflowInterface.php)
```php
use Temporal\Workflow\WorkflowInterface;
use Temporal\Workflow\WorkflowMethod;

#[WorkflowInterface]
interface GreetingWorkflowInterface
{
    /**
     * @param string $name
     * @return string
     */
    #[WorkflowMethod(name: "SimpleActivity.greet")]
    public function greet(
        string $name
    );
}
```
<!--SNIPEND-->

The important thing here are attributes `#[WorkflowInterface]` and `#[WorkflowMethod]`.  Both of them define the "workflow".
The first one marks the class/interface, the second one marks the method in the class/interface.

In our case the workflow is the method that accepts string `$name`.  To see what it actually does, look at the implementation in the class `GreetingWorkflow`:

<!--SNIPSTART php-hello-workflow {"enable_source_link": true}-->
[app/src/SimpleActivity/GreetingWorkflow.php](https://github.com/temporalio/samples-php/blob/master/app/src/SimpleActivity/GreetingWorkflow.php)
```php
class GreetingWorkflow implements GreetingWorkflowInterface
{
    private $greetingActivity;

    public function __construct()
    {
        /**
         * Activity stub implements activity interface and proxies calls to it to Temporal activity
         * invocations. Because activities are reentrant, only a single stub can be used for multiple
         * activity invocations.
         */
        $this->greetingActivity = Workflow::newActivityStub(
            GreetingActivityInterface::class,
            ActivityOptions::new()
                ->withStartToCloseTimeout(CarbonInterval::seconds(2))
                ->withRetryOptions(RetryOptions::new()->withMaximumAttempts(1))
        );
    }

    public function greet(string $name): \Generator
    {
        // This is a blocking call that returns only after the activity has completed.
        return yield $this->greetingActivity->composeGreeting('Hello', $name);
    }
}
```
<!--SNIPEND-->

This is the implementation of our workflow.  It communicates with one activity and delegates all the work to it.

In the constructor we create an instance of the `GreetingActivityInterface` with maximum execution time of 2 seconds.

In method `greet()` we call our activity.

Here the workflow pauses and waits until the activity is done and only then returns the result.

It is achieved with a call to `yield`.

To instantiate an instance of the activity we use a static helper `Workflow::newActivityStub()`.

### Activity interface and implementation

And at last we arrive at the activity code. Consider it as a particular task in the business logic. As you have noticed we again use an interface to instantiate an object:

<!--SNIPSTART php-hello-activity-interface {"enable_source_link": true}-->
[app/src/SimpleActivity/GreetingActivityInterface.php](https://github.com/temporalio/samples-php/blob/master/app/src/SimpleActivity/GreetingActivityInterface.php)
```php
use Temporal\Activity\ActivityInterface;
use Temporal\Activity\ActivityMethod;

#[ActivityInterface(prefix: 'SimpleActivity.')]
interface GreetingActivityInterface
{
    #[ActivityMethod(name: "ComposeGreeting")]
    public function composeGreeting(
        string $greeting,
        string $name
    ): string;
}
```
<!--SNIPEND-->

Activities and workflow classes in PHP are marked with special attributes.
For activity, we use `#[ActivityInterface]` and `#[ActivityMethod]`.
The first on marks this class/interface as an activity, the second one marks the activity method.
Our activity consists of one method, which accepts two string arguments.
The implementation of this interface is a very straight forward - just compose a new string of provided arguments:

<!--SNIPSTART php-hello-activity {"enable_source_link": true}-->
[app/src/SimpleActivity/GreetingActivity.php](https://github.com/temporalio/samples-php/blob/master/app/src/SimpleActivity/GreetingActivity.php)
```php
class GreetingActivity implements GreetingActivityInterface
{
    public function composeGreeting(string $greeting, string $name): string
    {
        return $greeting . ' ' . $name;
    }
}
```
<!--SNIPEND-->

Both workflow and activity code in our example have both interface and implementation.
But we could skip interfaces and just mark classes with corresponding attributes and everything will continue working.
But how does the workflow client know about interface implementations?
How does Temporal know what PHP class should be executed?

### Roadrunner and Temporal Worker

To answer this question we need to take a look at how an instance of `WorkflowClientInterface` is created.
This is the part where [RoadRunner](https://roadrunner.dev) comes into a play.

In our example under the hood RoadRunner executes `worker.php` script:

```php
declare(strict_types=1);

use Temporal\SampleUtils\DeclarationLocator;
use Temporal\WorkerFactory;

ini_set('display_errors', 'stderr');
include "vendor/autoload.php";

// finds all available workflows, activity types and commands in a given directory
$declarations = DeclarationLocator::create(__DIR__ . '/src/');

// factory initiates and runs task queue specific activity and workflow workers
$factory = WorkerFactory::create();

// Worker that listens on a task queue and hosts both workflow and activity implementations.
$worker = $factory->newWorker();

foreach ($declarations->getWorkflowTypes() as $workflowType) {
    // Workflows are stateful. So you need a type to create instances.
    $worker->registerWorkflowTypes($workflowType);
}

foreach ($declarations->getActivityTypes() as $activityType) {
    // Activities are stateless and thread safe. So a shared instance is used.
    $worker->registerActivity($activityType);
}

// start primary loop
$factory->run();
```

You may consider this script as a bridge between your PHP application and Temporal.  Temporal needs to know about our activity and workflow implementations. Thus, they need to be registered within the worker with `registerWorkflowTypes()` and `registerActivity()`.  The first one registers workflows and accepts a list of classes:

```php
$worker->registerWorkflowTypes(HelloWorldWorkflow::class);
```

The second one registers activities and accepts a list of activity classes, e.g.:

```php
$worker->registerActivity(MyActivity::class);
```

On the last line of the _worker script_ we start the worker.  From now, it starts communication with Temporal: receiving and sending data.


## Conclusion

Let's recap what was done in this "Hello world" example:

1. The main script, that instantiates an instance of `WorkflowClientInterface`, creates a workflow and starts it.
2. Workflow code.
3. Activity code.
4. Worker code with [RoadRunner](https://roadrunner.dev), that instantiates the worker, registers workflow types and activity implementations.

These reflect the 4 main APIs of Temporal's PHP SDK.

