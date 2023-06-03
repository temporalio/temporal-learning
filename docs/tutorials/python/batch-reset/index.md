---
id: batch-reset
sidebar_position: 3
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-08-01
title: Reset your Workflows in batches
description: You'll implement a Loyalty Points program that rewards customers. You'll use Temporal's batch reset feature to reset the state of your Workflows.
image: /img/temporal-logo-twitter-card.png
---

![Temporal Python SDK](/img/sdk_banners/banner_python.png)

### Introduction

In this tutorial, you'll implement a loyalty points program that rewards customers for their purchases and batch reset your running Workflows based on a condition, reason, and specific task in the Workflow Event History.

The essence of this approach lies in harnessing the power of Temporal's batch reset feature. The batch reset feature allows you to revert the state of multiple Workflows simultaneously, based on predefined conditions.

Batch resetting Workflows offers a more efficient approach than resetting individual Workflows, particularly when you're dealing with thousands or millions of concurrently running Workflows.

In the context of this tutorial, you'll leverage a Flask application to replicate the experience of a customer gaining loyalty points and simulating an unforeseen issue with your customer's points. Following this, you'll use the Temporal CLI to perform a batch reset, reverting the state of the Workflows back to a predetermined point.

By the time you've completed this guide, you will have gained a thorough understanding of how to use Temporal's batch reset feature to efficiently manage and reset the state of your Workflows. This invaluable tool provides a significant boost to your arsenal, aiding you in managing intricate Workflows with ease.

### Prerequisites

Before starting this tutorial:

- Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial
- Upgrade the [Temporal CLI](https://github.com/temporalio/cli) to `0.9.0` or later

## Set up your project

Create a new directory for your project:

```command
mkdir batch-reset
```

Change to the new directory:

```command
cd batch-reset
```

Download and install the Loyalty application from GitHub:

```command
gh repo clone temporalio/loyalty-points-project-python
cd loyalty-points-project-python
```

Start the application:

```command
# terminal one
python app.py
# terminal two
python main.py
```

The application starts a Flask server on port `5000`.

Next, run a Python script that simulates customers making earning their loyalty points.

```command
# terminal three
cd scripts/
python script.py
```

After running this script, you can see the accumulated points of a customer based on a unique identifier to that customer.

In this example, the customer identifier is `123`, is the same as the Workflow ID.

Run the following command to see the points of the customer with the identifier of `123`.

```command
curl -X GET http://localhost:5000/123
```

Expected output:

```output
{
  "points": 500,
  "user_id": 123
}
```

These points are stored in the Workflow's Event History and are attribued to the customer and Workflow ID. A Signal is sent to the Workflow to update the points.
When you run Query the state of the Workflow, it returns a sum of all the points sent to the Workflow.

Now, that you've learned the basics of this application, you're going to simulate an incident that causes the points to reset to 0.

## Reset the state of your Workflows

Imagine that your loyalty program is running for years. Each customer has their own Workflow as specified by their customer identifier, and one day Aaron, an intern, gets access to production. Aaron is still learning the ropes and accidentally sends a Signal that updates the state of every Workflow running, spending their points so that each customer has 0 points.

To simulate this scenario, you're going to run a script that sends a Signal to every Workflow running, spending their points so that each customer has 0 points.

```command
# terminal three
python aaron.py
```

Run a Query to see the state of the Workflow:

```command
curl -X GET http://localhost:5000/123
```

The following output shows that the points are now 0.

```output
{
  "points": 0,
  "user_id": 123
}
```

Because state is stored in the Workflow's Event History, you can reset the Workflow to a previous state, like before Aaron had access to production.

But resetting each individual Workflow can take a long time, and you have hundreds of Workflows to reset.

Luckily, you can use Temporal's batch reset feature to reset the state of your Workflows to a previous state.

You don't have to use individual Workflow IDs to reset the state of the Workflow, like the following example:

```command
temporal workflow reset --workflow-id 1 --reason "Aaron had access to prod" --type LastWorkflowTask
temporal workflow reset --workflow-id 2 --reason "Aaron had access to prod" --type LastWorkflowTask
temporal workflow reset --workflow-id 3 --reason "Aaron had access to prod" --type LastWorkflowTask
# ... and so on
```

Instead, use the Temporal batch reset feature to reset the state of the Workflow based on a specified condition, reason, and a type to reset to.

### Get the condition

You need to specify a condition that Temporal uses to determine which Workflows to reset. You don't want to specify all the Workflow IDs individually because there are hundreds of Workflows. Instead, you'll use a condition that Temporal uses to determine which Workflows to reset.

In this example, all loyalty point Workflows have the Workflow Type of `LoyaltyProgram`. 
You'll use this condition to query the type of Workflows to batch reset.

```output
temporal workflow reset-batch --query "WorkflowType='LoyaltyProgram'"
```

:::note

While this example is simple, you can use any query that's accepted in a [List Filter](https://docs.temporal.io/visibility#list-filter). For example, you can set the condition to reset all Workflows between a certain date range, or all Workflows that have a certain status.

:::

That's great, but you don't want to reset the state of all the Workflows, without specifying a reason and a type because you might need to reference the reset later, and you need to reset to a specific point.

### Specify a reason and a type

You can specify a reason and a type for the reset. This is useful because you can reference the reset later, and you can reset to a specific point.

```output
temporal workflow reset-batch --query "WorkflowType='LoyaltyProgram'" --reason "Sev2: id.1259" --type LastWorkflowTask
```

Your reason can be anything, like `"Aaron had access to prod"`, but for this tutorial, specify a generic reason like the severity level and the ID of the incident.

You can specify the type of reset you want to perform. In this example, you're going to reset the state of the Workflows to the last Workflow Task. This means that the Workflows will be reset to the point before the last Workflow task executed.

Types of resets include:

- `FirstWorkflowTask`: Resets the state of the Workflows to the first Workflow task
- `LastWorkflowTask`: Resets the state of the Workflows to the last Workflow task
- `LastContinuedAsNew`: Resets the state of the Workflows to the last continued as a new point.

Now, before you execute this command in production, test it out. You don't want to make the incident worse.

### Test the reset

You can test the reset with a dry run. This means that you are simulating the reset, but the state of the Workflows won't be changed.

Add the `--dry-run` flag to the command:

```command
temporal workflow reset-batch --query "WorkflowType='LoyaltyProgram'" --reason "Sev2: id.1259" --type LastWorkflowTask --dry-run
```

The output shows the number of Workflows that will be reset.

```output
received:  123 30caf81a-bd6f-41d8-b5cd-a66841714ac4
resetType: LastWorkflowTask
WorkflowTaskFinishEventId for reset: 123 30caf81a-bd6f-41d8-b5cd-a66841714ac4 30caf81a-bd6f-41d8-b5cd-a66841714ac4 20
dry run to reset wid: 123, rid:30caf81a-bd6f-41d8-b5cd-a66841714ac4 to baseRunId:30caf81a-bd6f-41d8-b5cd-a66841714ac4, eventId:20
```

Great, the dry run shows the expected outcome and Workflow IDs that will execute.

Now you can execute the reset command.

```command
temporal workflow reset-batch --query "WorkflowType='LoyaltyProgram'" --reason "Sev2: id.1259" --type WorkflowExecutionSignaled
```

The command resets Workflows that have the Workflow Type of `LoyaltyProgram` to the last Workflow task and adds a reason to the Event ID of the Workflow History. Explore the Web UI to see more information.

## Explore the Web UI

Now that the state of the Workflows has been reset, you can explore the Web UI to see the state of the Workflows.

Open the Web UI in your browser:

```command
open http://localhost:8233/namespaces/default/workflows
```

In the Web UI, select a running Workflow and go to the **Recent Events** section.

The Event History describes all the events in the Workflow History, including the Workflow batch reset.
You should see **WorkflowTaskFailed** and `Failure Message Sev2: id1259` in the Event History.
This is the failure message you sent in the reset command.

Now, query the Workflow, you'll see that the state of the Workflow is reset to the last Workflow Task, which is the point before Aaron had access to production.

```command
curl -X GET http://localhost:5000/123
```

Expected output:

```output
{
  "points": 500,
  "user_id": 123
}
```

That's it! You've successfully reset the state of your Workflows before Aaron had access to production. Now secure your production environment so that your Sev 2 pager doesn't go off again.

## Conclusion

In this tutorial, you used the Temporal CLI to reset the state of your Workflows. You used the batch reset feature, so you can reset multiple Workflows that meet a condition, rather than specifying each Workflow ID individually.

You can use the batch reset feature to reset the state of your Workflows to a previous state. This is useful if you need to reset the state of your Workflows to a specific point, or if you need to reference the reset later.

### Next steps

Learn more about the Workflow batch reset commands, by running the `--help` command:

```command
temporal workflow reset-batch --help
```

Learn more about the Temporal CLI, by reading the [reference documentation](https://docs.temporal.io/cli/).