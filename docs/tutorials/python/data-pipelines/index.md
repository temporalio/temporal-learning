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

When it comes to building data pipelines, choosing the right workflow model is crucial for achieving reliability, scalability, and maintainability.
Temporal makes writing data pipelines easy with Workflows and Activities.

With Temporal, you can retrieve data from a source, process the information with steps, and output the flow of information to a destination with just code. Meaning all of your developer best practices can be implemented, tested, and ran as needed.
Furthermore, Temporal offers built-in resilience and fault tolerance features that can handle unexpected failures and issues seamlessly.

In this tutorial, you'll learn the process of building a data pipeline with Temporal, where you'll leverage its features to build robust, scalable, and maintainable pipelines, by retrieving the latest [Temporal Community](https://community.temporal.io) posts, processing them based on their post identifier, and then return a list of the top 10 most recently viewed posts.

Then, to improve your understanding, you'll learn to schedule your Workflows on an interval timer to automate the execution of these steps.

By the end of this tutorial, you'll have a comprehensive understanding of how to implement Workflow as code-based data pipelines using Temporal's features; such as retries, timeouts, and schedules to ensure your pipeline's resilience and fault tolerance.

## Working sample

All the code for this tutorial is stored on GitHub in the [data-pipeline-project-python](https://github.com/rachfop/data-pipeline) repository.

## Prerequisites

Before starting this tutorial:

- Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial
- Install [Pandas](https://pandas.pydata.org) (tested with version 2.0.1)
- Install [aiohttp](https://docs.aiohttp.org/en/stable/) (tested with version 3.8.4)

```bash
pip install pandas aiohttp
```

Now that you've installed the required libraries, develop your Workflow Definition.

## Develop Workflow

Write a Workflow Definition file that contains the steps that you want to execute.

<!--SNIPSTART data-pipeline-your-workflow-python-->
[your_workflow.py](https://github.com/rachfop/data-pipeline/blob/master/your_workflow.py)
```py
from datetime import timedelta
from typing import Any, List

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from activities import TemporalCommunityPosts, post_ids, top_posts


@workflow.defn
class TemporalCommunityWorkflow:
    @workflow.run
    async def run(self) -> List[TemporalCommunityPosts]:
        news_ids: List[str] = await workflow.execute_activity(
            post_ids,
            start_to_close_timeout=timedelta(seconds=15),
            retry_policy=RetryPolicy(
                non_retryable_error_types=["Exception"],
            ),
        )
        return await workflow.execute_activity(
            top_posts,
            news_ids,
            start_to_close_timeout=timedelta(seconds=15),
        )


```
<!--SNIPEND-->

The `TemporalCommunityWorkflow` class is decorated with the `@workflow.defn` which must be set on any registered Workflow class.

The `async def run()` function is decorated with the `@workflow.run` which is set on the one asynchronous method on the same class as the `@workflow.defn`.

There are two Activities being executed, `post_ids` and `top_posts`.
These Activities are defined in the `activities.py` file, which will be explained later.

Inside the `workflow.execute_activity()` function, pass the reference of Activity Definition, or step in your data pipeline.
If that step takes an argument, then use the second positional argument for that name, as shown in the second `execute_activity()` function.

You must set either a Start-To-Close or Schedule-To-Close Activity Timeout.

Now, that the Workflow is explained, develop your Activities to handle the logic of your data pipeline.

## Develop your Activities

Think of the Activities as steps in your data pipeline. Each Activity should handle something that you want executed.
The Workflow will handle the execution of each step.

In the `activities.py` file, write out each step in the data processing pipeline.

In this example, establish a connection to the `aiohttp`'s [Client Session](https://docs.aiohttp.org/en/stable/client_reference.html).
The [aiohttp](https://docs.aiohttp.org/en/stable/index.html) library is recommended instead of [requests](https://requests.readthedocs.io), because it avoids making blocking calls.

The `post_ids()` function gets the top 10 Temporal Community posts while, `top_posts()` gets items based on the post's identifier. 

<!--SNIPSTART data-pipeline-activity-python-->
[activities.py](https://github.com/rachfop/data-pipeline/blob/master/activities.py)
```py
from dataclasses import dataclass
from typing import Any, List

import aiohttp
from temporalio import activity

TASK_QUEUE_NAME = "temporal-community-task-queue"


@dataclass
class TemporalCommunityPosts:
    title: str
    url: str
    views: int


async def fetch(session: aiohttp.ClientSession, url: str) -> dict:
    async with session.get(url) as response:
        return await response.json()


@activity.defn
async def post_ids() -> List[str]:
    async with aiohttp.ClientSession() as session:
        async with session.get("https://community.temporal.io/latest.json") as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch top stories: {response.status}")
            post_ids = await response.json()

    return [str(topic["id"]) for topic in post_ids["topic_list"]["topics"]]


@activity.defn
async def top_posts(post_ids: List[Any]) -> List[TemporalCommunityPosts]:
    results = []
    async with aiohttp.ClientSession() as session:
        for item_id in post_ids:
            try:
                async with session.get(
                    f"https://community.temporal.io/t/{item_id}.json"
                ) as response:
                    item = await response.json()
                    slug = item["slug"]
                    url = f"https://community.temporal.io/t/{slug}/{item_id}"
                    community_post = TemporalCommunityPosts(
                        title=item["title"], url=url, views=item["views"]
                    )
                    results.append(community_post)
                if response.status != 200:
                    activity.logger.error(f"Status: {response.status}")
            except KeyError:
                activity.logger.error(f"Error processing item {item_id}: {item}")
    results.sort(key=lambda x: x.views, reverse=True)
    top_ten = results[:10]
    return top_ten


```
<!--SNIPEND-->

:::note

The Temporal Community posts are built off of the [Discourse](https://docs.discourse.org/#tag/Posts) API.

:::

Each function contains an `activity.defn` decorator that ensures that function is durably backed by Temporal.
The Retry Policy defined in the `TemporalCommunityWorkflow` class contains information needed to retry in case the API endpoint is down.

By default, the Retry Policy is:

```output
Initial Interval     = 1 second
Backoff Coefficient  = 2.0
Maximum Interval     = 100 × Initial Interval
Maximum Attempts     = ∞
Non-Retryable Errors = []
```

The first step of the data pipeline checks if the status of the endpoint returns a 200 response, if it doesn't, it will raise an `Exception` error, otherwise, it will continue processing the post identifiers.
The last step of the data pipeline returns the results, which will be processed in your `run_workflow.py` file.

Now that you've defined the steps in your data pipeline, learn to create a Worker that will host the Workflow and Activities.

## Run the Worker

In the `run_worker.py` file, set the Worker to host the Workflows and/or Activities.

<!--SNIPSTART data-pipeline-run-worker-python-->
[run_worker.py](https://github.com/rachfop/data-pipeline/blob/master/run_worker.py)
```py
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import TASK_QUEUE_NAME, post_ids, top_posts
from your_workflow import TemporalCommunityWorkflow


async def main():
    client = await Client.connect("localhost:7233")
    worker = Worker(
        client,
        task_queue=TASK_QUEUE_NAME,
        workflows=[TemporalCommunityWorkflow],
        activities=[top_posts, post_ids],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

This Worker creates and uses the same Client used for starting the Workflow, `localhost:7233`.
The Worker must be set to the same Task Queue name, then specify your Workflows and Activities names in a list.

Then run the Worker with the [asyncio.run()](https://docs.python.org/3/library/asyncio-runner.html#asyncio.run) function.

The Worker listens and polls on a single Task Queue. A Worker Entity contains both a Workflow Worker and an Activity Worker so that it may make progress of either a Workflow Execution or an Activity Execution.

Now that you've developed a Worker, run the Workflow.

## Run your Workflow

The file `run_workflow.py` processes the Execution of the Workflow.
To start, connect to an instance of the Temporal Client. Since it's running locally, it's connected to `localhost:7233`.

The `execute_workflow()` function is set on the `client` to execute the Workflow, by passing the name of the Workflow run method, a Workflow Id, and a Task Queue name.

<!--SNIPSTART data-pipeline-run-workflow-python-->
[run_workflow.py](https://github.com/rachfop/data-pipeline/blob/master/run_workflow.py)
```py
import asyncio

import pandas as pd
from temporalio.client import Client

from activities import TASK_QUEUE_NAME
from your_workflow import TemporalCommunityWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    stories = await client.execute_workflow(
        TemporalCommunityWorkflow.run,
        id="temporal-community-workflow",
        task_queue=TASK_QUEUE_NAME,
    )
    df = pd.DataFrame(stories)
    df.columns = ["Title", "URL", "Views"]
    print("Top 10 stories on Temporal Community:")
    print(df)
    return df


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

This will execute the steps defined in your Workflow, which will then return the results of `stories`.
For this example, `stories` is processed by a [Pandas Data Frame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html).

The code is run in an `asyncio` event loop.

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
Top 10 stories on Temporal Community:
                                                                                 Title  ... Views
0  Jest has detected the following 1 open handle potentially keeping Jest from exiting  ...  1103
1                                                     Welcome to community.temporal.io  ...   842
2                                              Java SDK support for Reactive framework  ...   739
3                                                  History Mem Usage, Cache Size & TTL  ...   496
4                                   How to stop non-deterministic error retry forever?  ...   482
5                                          Workflows Not Showing on temporal ui-server  ...   106
6                        Custom Search Attributes not appearing post upgrade to 1.20.1  ...    74
7                                       Temporal Sleep feature for scheduled date time  ...    68
8                                                                  Java-SDK SpringBoot  ...    61
9                                     Addition of new activity impacting old workflows  ...    58
[10 rows x 3 columns]
```

Now go to your running instance of the [Temporal Web UI](http://localhost:8233/namespaces/default/workflows), to see how the information is persisted in history.

1. Select the most recently running Workflow by Workflow Id, for example `temporal-community-workflow`.
2. Open the **Input and results** pane to see what was entered and returned to the Workflow.
3. Under **Recent Events,** you can observe every step and task created by the data pipeline.
    This information is persisted in History, meaning that if any point a failure is created in your data pipeline, you can resume from that point in the history, rather than starting over from the beginning.

You've successfully run your Workflow and explored the Event History, now learn to Schedule your Workflow.

## Schedule a Workflow

We just demonstrated how to start a Worker and run a Workflow, which returns information from your data pipeline. What if we want to run this on a schedule?
Historically, you could write a cron job and have that fire once a day, but cron jobs are fragile. They break easily and knowing when they go down or why they didn't fire can be frustrating.

Temporal provides a [Schedule Workflow](https://python.temporal.io/temporalio.client.Client.html#create_schedule) function, in which you can start, backfill, delete, describe, list, pause, trigger, and update a Schedule.

Build a scheduler to fire once every 10 hours and return the results of `TemporalCommunityWorkflow`.

Create a file called `schedule_workflow.py`.

<!--SNIPSTART data-pipeline-schedule-workflow-python-->
[schedule_workflow.py](https://github.com/rachfop/data-pipeline/blob/master/schedule_workflow.py)
```py
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
from your_workflow import TemporalCommunityWorkflow


async def main():
    client = await Client.connect("localhost:7233")
    await client.create_schedule(
        "workflow-schedule-id",
        Schedule(
            action=ScheduleActionStartWorkflow(
                TemporalCommunityWorkflow.run,
                id="temporal-community-workflow",
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
<!--SNIPEND-->

Set the `create_schedule()` function on the Client and pass a unique identifier for the Schedule.

Then [Schedule](https://python.temporal.io/temporalio.client.Schedule.html) your Action.
In this example, the Action specifies the Workflow run, `TemporalCommunityWorkflow`, the Workflow Id, `temporal-community-workflow`, and the Task Queue name.

Then in the [ScheduleSpec](https://python.temporal.io/temporalio.client.ScheduleSpec.html) set an interval timer, for example `every=timedelta(hours=10)`.

:::note

Modify the interval timer from `hours=10` to `minutes=1` to see the Schedule Workflow execute more frequently.

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

<!--SNIPSTART data-pipeline-delete-schedule-python-->
[delete_schedule.py](https://github.com/rachfop/data-pipeline/blob/master/delete_schedule.py)
```py
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
<!--SNIPEND-->

Then run the following.

```bash
# terminal two
python delete_schedule.py
```

This sets the Schedule Id and then deletes the Schedule with the [delete()](https://python.temporal.io/temporalio.client.ScheduleHandle.html#delete) method on the Workflow handle.

<details>
<summary>
Alternatively, you can delete a Schedule from the CLI.
</summary>

```bash
# terminal two
temporal schedule delete --schedule-id workflow-schedule-id
```

</details>

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
        workflows=[TemporalCommunityWorkflow],
        # tell the Worker of you new Activity
        activities=[top_posts, post_ids, freq_occurring_words], # adding `freq_occurring_words`
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
class TemporalCommunityWorkflow:
    @workflow.run
    async def run(self) -> list:
        news_id = await workflow.execute_activity(
            post_ids,
            start_to_close_timeout=timedelta(seconds=15),
        )
        top_posts = await workflow.execute_activity(
            top_posts,
            news_id,
            start_to_close_timeout=timedelta(seconds=15),
        )
        # Add a step to your data pipeline
        return await workflow.execute_activity(
            freq_occurring_words,
            top_posts,
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
