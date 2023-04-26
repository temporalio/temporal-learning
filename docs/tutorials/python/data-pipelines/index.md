---
id: data-pipeline-tutorial
sidebar_position: 3
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-03-01
title: Build a data pipeline Workflow with Temporal and Python
description: This tutorial teaches you how to implement a data pipeline application with Temporal's Workflows, Activities, and Schedules; however, the key learning allows users to orchestrate steps in their data pipeline and allow Temporal to run it.
image: /img/temporal-logo-twitter-card.png
---

Temporal makes writing data pipelines easy with Workflows and Activities.

You can create a source, process the step or steps, and output the flow of information to a destination with just code. Meaning all of your developer best practices can be implemented, tested, and ran as needed.

That data that enters a Workflow is handled by Activities, while the Workflow orchestrates the execution of those steps.
You can ensure that Temporal handles all actions and executes it observably once, all in Python code.

In this tutorial, you'll learn to build a data pipeline that gets the top 10 Hacker New stories and processes the items based on the story ID.
If the API endpoint is down, the default behavior of the Retry Policy is to retry indefinitely.

You'll then implement a Schedule to Schedule Workflows on an interval to leverage the automation of running Workflow Executions.

## Step 0: Prerequisites

* Python >= 3.7
* [Poetry](https://python-poetry.org)
* [Local Temporal server running](https://docs.temporal.io/application-development/foundations#run-a-development-cluster)

With this repository cloned, run the following at the root of the directory:

```bash
poetry install
```

## Step 1: Workflow Definition

Write a Workflow Definition file that contains the steps that you want to execute.

```python
# your_workflow.py
from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import hackernews_top_stories, hackernews_top_story_ids


@workflow.defn
class HackerNewsWorkflow:
    @workflow.run
    async def run(self) -> list:
        news_id = await workflow.execute_activity(
            hackernews_top_story_ids,
            start_to_close_timeout=timedelta(seconds=15),
        )
        return await workflow.execute_activity(
            hackernews_top_stories,
            news_id,
            start_to_close_timeout=timedelta(seconds=15),
        )
```

The `HackerNewsWorkflow` class is decorated with the `@workflow.defn` which must be set on any registered workflow class.

The `async def run()` function is decorated with the `@workflow.run` which is set on the one asynchronous method on the same class as the `@workflow.defn`.

There are two Activities being executed, `hackernews_top_story_ids` and `hackernews_top_stories`.
These Activities are defined in the `activities.py` file, which will be explained later.

Inside the `workflow.execute_activity()` function, pass the reference of Activity Definition, function, or step in your data pipeline.
If that step takes an argument, then use the second positional argument for that name, as shown in the second `execute_activity()` function.

You must set either a Start-To-Close or Schedule-To-Close Activity Timeout.

Now, write out the Activity.

## Step 2: Write your Activities Definition

Think of the Activities as steps in your data pipeline. Each Activity should handle some thing that you want executed.
The Workflow will handle the execution of each step.

In the `activities.py` file, write out each step in the data processing pipeline.

For example, `hackernews_top_story_ids()` gets the top 10 stories from Hacker News while, `hackernews_top_stories()` gets items based on the stories ID.

Use the `aiohttp` library instead of `requests` to avoid making blocking calls.

```python
# activities.py
from dataclasses import dataclass

import aiohttp
from temporalio import activity

TASK_QUEUE_NAME = "hackernews-task-queue"


async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()


@activity.defn
async def hackernews_top_story_ids() -> list[int]:
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json"
        ) as response:
            top_story_ids = await response.json()
    return top_story_ids[:10]


@activity.defn
async def hackernews_top_stories(hackernews_top_story_ids) -> list[list[str]]:
    results = []
    async with aiohttp.ClientSession() as session:
        for item_id in hackernews_top_story_ids:
            try:
                item = await fetch(
                    session,
                    f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json",
                )
                results.append([item["title"], item["by"], item["url"]])
            except KeyError:
                print(f"Error processing item {item_id}: {item}")
    return results
```

Each function contains an `activity.defn` decorator that ensures that function is durably backed by Temporal.
The Retry Policy defined in the `HackerNewsWorkflow` class contains information needed to retry in case the API endpoint is down.

By default, the Retry Policy is:

```output
Initial Interval     = 1 second
Backoff Coefficient  = 2.0
Maximum Interval     = 100 × Initial Interval
Maximum Attempts     = ∞
Non-Retryable Errors = []
```

The last step of the data pipeline returns the results.

## Step 3: Run Worker

In the `run_worker.py` file, set the Worker to host the Workflows and/or Activities.

```python
# run_worker.py
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import TASK_QUEUE_NAME, hackernews_top_stories, hackernews_top_story_ids
from your_workflow import HackerNewsWorkflow


async def main():
    client = await Client.connect("localhost:7233")
    worker = Worker(
        client,
        task_queue=TASK_QUEUE_NAME,
        workflows=[HackerNewsWorkflow],
        activities=[hackernews_top_stories, hackernews_top_story_ids],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

This Worker run creates and uses the same Client used for starting the Workflow, `localhost:7233`.
The Worker must be set to the same Task Queue name, then specify your Workflows and Activities names in a list.

Then run the Worker with the [asyncio.run()](https://docs.python.org/3/library/asyncio-runner.html#asyncio.run) function.

## Step 4: Run your Workflow

The file `run_workflow.py` processes the Execution of the Workflow.
To start, you connect to an instance of the Temporal Client. Since it is running locally, it is connected to `localhost:7233`.

Then it executes the Workflow, by passing the name of the Workflow, a Workflow ID, and a Task Queue name.

```python
# run_workflow.py
import asyncio

import pandas as pd
from temporalio.client import Client

from activities import TASK_QUEUE_NAME
from your_workflow import HackerNewsWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    data = await client.execute_workflow(
        HackerNewsWorkflow.run,
        id="hackernews-workflow",
        task_queue=TASK_QUEUE_NAME,
    )

    df = pd.DataFrame(data)
    print(df)
    return df


if __name__ == "__main__":
    asyncio.run(main())
```

When the Workflow process it steps, it will finally return the `data` variable. For this example, `data` is processed by a Pandas Data frame.

The code is run in the `asyncio` event loop.

### Results

To run your code, open two terminal windows and run the following:

```bash
# terminal one
poetry run python run_worker.py
# terminal two
poetry run python run_workflow.py
```

You should see something similar to the following in your terminal.

```output
                                                   0  ...                                                  2
0  Could we stop Yellowstone from erupting with a...  ...  https://constructionphysics.substack.com/p/cou...
1  Sandy Munro Talks Battery Battles, Calls Solid...  ...  https://www.sae.org/blog/sandy-munro-live-sae-wcx
2  Microsoft Edge is leaking the sites you visit ...  ...  https://www.theverge.com/2023/4/25/23697532/mi...
3  Commercial lunar lander presumed lost after mo...  ...  https://www.cnn.com/2023/04/25/world/lunar-lan...
4                Fun with Kermit and ZMODEM over SSH  ...  https://www.cambus.net/fun-with-kermit-and-zmo...
5  Smartphones with Qualcomm chip secretly send p...  ...  https://www.nitrokey.com/news/2023/smartphones...
6       A non-technical explanation of deep learning  ...  https://www.parand.com/a-completely-non-techni...
7    Use Gröbner bases to solve polynomial equations  ...    https://jingnanshi.com/blog/groebner_basis.html
8                        Eww: ElKowars wacky widgets  ...                     https://github.com/elkowar/eww
9  FSF Call on the IRS to provide libre tax-filin...  ...  https://www.fsf.org/blogs/community/call-on-th...
[10 rows x 3 columns]
```

Now go to your running instance of the [Temporal Web UI](http://localhost:8233/namespaces/default/workflows), to see how the information is persisted in history.

1. Select the most recently running Workflow by Workflow ID, for example `hackernews-workflow`.
2. Open the **Input and results** pane to see what was entered and returned to the Workflow.
3. Under **Recent Events,** you can observe every step and task created by the data pipeline.
    This information is persisted in History, meaning that if any point a failure is created in your data pipeline, you can resume from that point in the history, rather than starting over from the beginning.

## Step 6: Schedule a Workflow

We just demonstrated how to start a Worker and run a Workflow, which returns information from our data pipeline. What if we want to run this on a schedule?
Historically, you could write a cron job and have that fire once a day, but cron jobs are fragile. They break easily and knowing when they go down or why they didn't fire can be frustrating.

Temporal provides a Schedule Workflow, in which you can start, backfill, delete, describe, list, pause, trigger, and update as you would any other Workflow.

Let's build a Schedule Workflow to fire once an hour and return the results of our `HackerNewsWorkflow`.

Create a file called `schedule_workflow.py`.

```python
import asyncio
from datetime import timedelta

from temporalio.client import (
    Client,
    Schedule,
    ScheduleActionStartWorkflow,
    ScheduleIntervalSpec,
    ScheduleSpec,
    ScheduleState,
)

from activities import TASK_QUEUE_NAME
from your_workflow import HackerNewsWorkflow


async def main():
    client = await Client.connect("localhost:7233")
    await client.create_schedule(
        "workflow-schedule-id",
        Schedule(
            action=ScheduleActionStartWorkflow(
                HackerNewsWorkflow.run,
                id="hackernews-workflow",
                task_queue=TASK_QUEUE_NAME,
            ),
            spec=ScheduleSpec(
                intervals=[ScheduleIntervalSpec(every=timedelta(hour=1))]
            ),
            state=ScheduleState(note="Getting top stories every hour."),
        ),
    )


if __name__ == "__main__":
    asyncio.run(main())
```

Set the `create_schedule()` function on the Client and pass a unique identifier for the Schedule.

Then [Schedule](https://python.temporal.io/temporalio.client.Schedule.html) your Action.
In this example, the Action specifies the Workflow run, `HackerNewsWorkflow`, the Workflow Id, `hackernews-workflow`, and the Task Queue name.

Then in the [ScheduleSpec](https://python.temporal.io/temporalio.client.ScheduleSpec.html) set an interval timer, for example `every=timedelta(hour=1)`.

:::note

Modify the interval timer from `hours=1` to `minutes=1` to see the Schedule Workflow execute faster.

:::

### Run the Schedule

Then run the following:

```bash
# terminal two
poetry run python schedule_workflow.py
```

Now go to your running instance of the [Temporal Web UI](http://localhost:8233/).

1. Select the **Schedules** from the left-hand navigation.
2. Choose the Schedule and see a list of upcoming runs.

After a few runs, you can see the **Recent Runs** fill up with previously run Workflows, or go back to the **Recent Workflows** page and see the Workflows populate there.

### Delete the Schedule

When you delete the Schedule, you're sending a termination Signal to the Schedule. 
You can write code to give a condition to cancel the Schedule.

```python
import asyncio

from temporalio.client import Client


async def main():
    client = await Client.connect("localhost:7233")
    handle = client.get_schedule_handle(
        "workflow-schedule-id",
    )

    await handle.delete()


if __name__ == "__main__":
    asyncio.run(main())
```

This sets the Schedule Id and then deletes the Schedule with the [delete()](https://python.temporal.io/temporalio.client.ScheduleHandle.html#delete) method on the handle.

Alternatively, you can delete a Schedule with the CLI.

```bash
temporal schedule delete --schedule-id=workflow-schedule-id
```

## Conclusion

You have learned how to create and process data with a data pipeline that's durably backed by Temporal and schedule a Workflow.

With Temporal, you have insight into your data pipelines. You can see every point in History and have the ability to resume from a failure or retry, and ensure that your Workflows execute on a scheduled interval.

### Next steps

Now on your own, write another Activity, or step in your data pipeline, that extracts the most frequently occurring words or topics in the story title.

* How do you tell the Worker to process that information?
* How does the Workflow know to process that step?
* What is returned by the Workflow Execution?
