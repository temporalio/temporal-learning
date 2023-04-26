---
id: data-pipeline-tutorial
sidebar_position: 3
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-05-01
title: Build a data pipeline Workflow with Temporal and Python
description: This tutorial teaches you how to implement a data pipeline application with Temporal's Workflows, Activities, and Schedules; however, the key learning allows users to orchestrate steps in their data pipeline and allow Temporal to run it.
image: /img/temporal-logo-twitter-card.png
---

![Temporal Python SDK](/img/sdk_banners/banner_python.png)

### Introduction

Temporal makes writing data pipelines easy with Workflows and Activities.

You can create a source, process the step or steps, and output the flow of information to a destination with just code. Meaning all your developer best practices can be implemented, tested, and ran as needed.

That data that enters a Workflow is handled by Activities, while the Workflow orchestrates the execution of those steps.
You can ensure that Temporal handles all actions and executes it observably once.

In this tutorial, you'll learn to build a data pipeline that gets the top 10 Hacker New stories and processes the items based on the story identifier.
If the API endpoint is down, the default behavior of the Retry Policy is to retry indefinitely.

You'll then Schedule the execution of your Workflow to leverage the automation of running Workflow Executions.

## Working sample

All the code for this tutorial is stored on GitHub in the [data-pipeline-project-python](https://github.com/temporalio/email-subscription-project-python) repository.

## Prerequisites

Before starting this tutorial:

- Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial
- Install Pandas (tested with version 2.0.1)
- Install aiohttp (tested with version 3.8.4)

```bash
pip install pandas aiohttp
```

Now that you've installed the required libraries, develop your Workflow Definition.

## Develop Workflow

Write a Workflow Definition file that contains the steps that you want to execute.

```python
# your_workflow.py
from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import story_ids, top_stories


@workflow.defn
class HackerNewsWorkflow:
    @workflow.run
    async def run(self) -> list:
        news_id = await workflow.execute_activity(
            story_ids,
            start_to_close_timeout=timedelta(seconds=15),
        )
        return await workflow.execute_activity(
            top_stories,
            news_id,
            start_to_close_timeout=timedelta(seconds=15),
        )
```

The `HackerNewsWorkflow` class is decorated with the `@workflow.defn` which must be set on any registered Workflow class.

The `async def run()` function is decorated with the `@workflow.run` which is set on the one asynchronous method on the same class as the `@workflow.defn`.

There are two Activities being executed, `story_ids` and `top_stories`.
These Activities are defined in the `activities.py` file, which will be explained later.

Inside the `workflow.execute_activity()` function, pass the reference of Activity Definition, function, or step in your data pipeline.
If that step takes an argument, then use the second positional argument for that name, as shown in the second `execute_activity()` function.

You must set either a Start-To-Close or Schedule-To-Close Activity Timeout.

Now, that the Workflow is explained, develop your Activities to handle the logic of your data pipeline.

## Develop your Activities

Think of the Activities as steps in your data pipeline. Each Activity should handle something that you want executed.
The Workflow will handle the execution of each step.

In the `activities.py` file, write out each step in the data processing pipeline.

In this example, establish a connection to the `aiohttp`'s [Client Session](https://docs.aiohttp.org/en/stable/client_reference.html).
The [aiohttp](https://docs.aiohttp.org/en/stable/index.html) library is recommended instead of [requests](https://requests.readthedocs.io), because it avoids making blocking calls.

The `story_ids()` function gets the top 10 stories from Hacker News while, `top_stories()` gets items based on the stories identifier.

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
async def story_ids() -> list[int]:
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json"
        ) as response:
            story_ids = await response.json()
    return story_ids[:10]


@activity.defn
async def top_stories(story_ids) -> list[list[str]]:
    results = []
    async with aiohttp.ClientSession() as session:
        for item_id in story_ids:
            try:
                item = await fetch(
                    session,
                    f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json",
                )
                results.append([item["title"], item["by"], item["url"]])
            except KeyError:
                # For hiring posts where there is no URLs
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

The last step of the data pipeline returns the results, which will be processed in your `run_workflow.py` file.

Now that you've defined the steps in your data pipeline, learn to create a Worker that will host the Workflow and Activities.

## Run the Worker

In the `run_worker.py` file, set the Worker to host the Workflows and/or Activities.

```python
# run_worker.py
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import TASK_QUEUE_NAME, top_stories, story_ids
from your_workflow import HackerNewsWorkflow


async def main():
    client = await Client.connect("localhost:7233")
    worker = Worker(
        client,
        task_queue=TASK_QUEUE_NAME,
        workflows=[HackerNewsWorkflow],
        activities=[top_stories, story_ids],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

This Worker run creates and uses the same Client used for starting the Workflow, `localhost:7233`.
The Worker must be set to the same Task Queue name, then specify your Workflows and Activities names in a list.

Then run the Worker with the [asyncio.run()](https://docs.python.org/3/library/asyncio-runner.html#asyncio.run) function.

The Worker listens and polls on a single Task Queue. A Worker Entity contains both a Workflow Worker and an Activity Worker so that it may make progress of either a Workflow Execution or an Activity Execution.

Now that you've developed a Worker, run the Workflow.

## Run your Workflow

The file `run_workflow.py` processes the Execution of the Workflow.
To start, you connect to an instance of the Temporal Client. Since it's running locally, it's connected to `localhost:7233`.

Then it executes the Workflow, by passing the name of the Workflow, a Workflow Id, and a Task Queue name.

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

When the Workflow process it steps, it will finally return the `data` variable.

For this example, `data` is processed by a [Pandas Data Frame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html).

The code is run in the `asyncio` event loop.

### Results

To run your code, open two terminal windows and run the following:

```bash
# terminal one
python run_worker.py
# terminal two
python run_workflow.py
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

1. Select the most recently running Workflow by Workflow Id, for example `hackernews-workflow`.
2. Open the **Input and results** pane to see what was entered and returned to the Workflow.
3. Under **Recent Events,** you can observe every step and task created by the data pipeline.
    This information is persisted in History, meaning that if any point a failure is created in your data pipeline, you can resume from that point in the history, rather than starting over from the beginning.

You've successfully run your Workflow and explored the Event History, now learn to Schedule your Workflow.

## Schedule a Workflow

We just demonstrated how to start a Worker and run a Workflow, which returns information from your data pipeline. What if we want to run this on a schedule?
Historically, you could write a cron job and have that fire once a day, but cron jobs are fragile. They break easily and knowing when they go down or why they didn't fire can be frustrating.

Temporal provides a Schedule Workflow, in which you can start, backfill, delete, describe, list, pause, trigger, and update as you would any other Workflow.

Build a Schedule Workflow to fire once every 10 hours and return the results of `HackerNewsWorkflow`.

Create a file called `schedule_workflow.py`.

```python
# schedule_workflow.py
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
                intervals=[ScheduleIntervalSpec(every=timedelta(hours=10))]
            ),
            state=ScheduleState(note="Getting top stories every 10 hours."),
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

Modify the interval timer from `hours=10` to `minutes=1` to see the Schedule Workflow execute faster.

:::

### Run the Schedule

Then run the following:

```bash
# terminal two
python schedule_workflow.py
```

Now go to your running instance of the [Temporal Web UI](http://localhost:8233/).

1. Select the **Schedules** from the left-hand navigation.
2. Choose the Schedule and see a list of upcoming runs.

After a few runs, you can see the **Recent Runs** fill up with previously run Workflows, or go back to the **Recent Workflows** page and see the Workflows populate there.

### Delete the Schedule

When you delete a Schedule, you're sending a termination Signal to the Schedule.
You can write code to give delete the Schedule or use the CLI.

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
# terminal two
temporal schedule delete --schedule-id=workflow-schedule-id
```

**Results**: You've successfully deleted a running Schedule.

Read through the conclusion section to recap what was accomplished and to learn how to extend your understanding.

## Conclusion

You have learned how to create and process data with a data pipeline that's durably backed by Temporal and schedule a Workflow.

With Temporal, you have insight into your data pipelines. You can see every point in History and have the ability to resume from a failure or retry, and ensure that your Workflows execute on a scheduled interval.

### Next steps

Now on your own, write another Activity, or step in your data pipeline, that extracts the most frequently occurring words or topics in the story title.

<details>
<summary>
How do you tell the Worker to process another Activity?
</summary>
Add the reference to the Activity name to the list of Activities processed by the Worker.

```python
    worker = Worker(
        client,
        task_queue=TASK_QUEUE_NAME,
        workflows=[HackerNewsWorkflow],
        # tell the Worker of you new Activity
        activities=[top_stories, story_ids, freq_occurring_words],
    )
    await worker.run()
```

</details>

<details>
<summary>
How does the Workflow know to process that step?
</summary>
In your Workflow, add an extra step to execute that Activity.

```python
@workflow.defn
class HackerNewsWorkflow:
    @workflow.run
    async def run(self) -> list:
        news_id = await workflow.execute_activity(
            story_ids,
            start_to_close_timeout=timedelta(seconds=15),
        )
        top_stories = await workflow.execute_activity(
            top_stories,
            news_id,
            start_to_close_timeout=timedelta(seconds=15),
        )
        # Add a step to your data pipeline
        return await workflow.execute_activity(
            freq_occurring_words,
            top_stories,
            start_to_close_timeout=timedelta(seconds=15),
        )
```

</details>

<details>
<summary>
What's returned by the Workflow Execution?
</summary>
The most frequently occurring words are returned by the Workflow Execution.

The file, `run_workflow.py` can process or present that information anyway it likes.
For example, creating a Word Cloud with that information.
</details>

