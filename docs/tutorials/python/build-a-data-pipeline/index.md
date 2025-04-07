---
id: build-a-data-pipeline-python
title: Build a data pipeline with Python
sidebar_position: 3
description: You'll implement a data pipeline application in Python, using Temporal's Workflows, Activities, and Schedules to orchestrate and run the steps in your pipeline.
keywords: [Python, temporal, sdk, tutorial]
tags:
- Python
image: /img/temporal-logo-twitter-card.png
last_update:
  date: 2023-05-01
---

<img className="banner" src="/img/sdk_banners/banner_python.png" alt="Temporal Python SDK" />

### Introduction

When it comes to building data pipelines, choosing the right workflow model is crucial for achieving reliability, scalability, and maintainability.
Temporal makes writing data pipelines less complex  with Workflows and Activities.

With Temporal, you can retrieve data from a source, process the information with steps, and output the flow of information to a destination, all using code. This means you can implement, test, and execute all your developer best practices as required. Furthermore, Temporal offers built-in resilience and fault tolerance features that can handle unexpected failures and issues seamlessly.

In this tutorial you'll build a data pipeline with Temporal, where you'll leverage its features to build robust, scalable, and maintainable pipelines, by retrieving the latest [Temporal Community](https://community.temporal.io) posts, processing them based on their post identifier, and then return a list of the top 10 most recently viewed posts.

Then, to improve your understanding, you'll schedule your Workflows on an interval timer to automate the execution of these steps.

By the end of this tutorial, you'll have a comprehensive understanding of how to implement code-based data pipelines using Temporal's features, such as Retries, Timeouts, and Schedules to ensure your pipeline's resilience and fault tolerance.

You can find the completed application on GitHub in the [data-pipeline-project-python](https://github.com/temporalio/data-pipeline-project-python) repository.

## Prerequisites

Before starting this tutorial:

- Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial
- Install [Pandas](https://pandas.pydata.org) (tested with version 2.0.1)
- Install [aiohttp](https://docs.aiohttp.org/en/stable/) (tested with version 3.8.4)

```command
pip install pandas aiohttp
```

Now that you've installed the required libraries, develop your Workflow Definition and get started with building a fault-tolerant data pipeline.

## Develop a Workflow to orchestrate your data pipeline

Use Workflows to orchestrate the execution of your data pipeline's steps.
The Workflow will be responsible for executing the Activities, or steps, in your data pipeline, and handle any failures that may occur using retries and timeouts.

Create a new file called `your_workflow.py` and add the following code:

<!--SNIPSTART data-pipeline-your-workflow-python-->
[your_workflow.py](https://github.com/temporalio/data-pipeline-project-python/blob/main/your_workflow.py)
```py
from datetime import timedelta
from typing import Any, List

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import TemporalCommunityPost, post_ids, top_posts


@workflow.defn
class TemporalCommunityWorkflow:
    @workflow.run
    async def run(self) -> List[TemporalCommunityPost]:
        news_ids = await workflow.execute_activity(
            post_ids,
            start_to_close_timeout=timedelta(seconds=15),
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

## Develop Activities to process your data

Think of the Activities as steps in your data pipeline. Each Activity should handle something that you want executed.
The Workflow will handle the execution of each step.

In the `activities.py` file, write out each step in the data processing pipeline.

In this example, establish a connection to the `aiohttp`'s [Client Session](https://docs.aiohttp.org/en/stable/client_reference.html).
The [aiohttp](https://docs.aiohttp.org/en/stable/index.html) library is recommended instead of [requests](https://requests.readthedocs.io), because it avoids making blocking calls.

The `post_ids()` function gets the top 10 Temporal Community posts while, `top_posts()` gets items based on the post's identifier.

Create a new file called `activities.py` and add the following code:

<!--SNIPSTART data-pipeline-activity-python-->
[activities.py](https://github.com/temporalio/data-pipeline-project-python/blob/main/activities.py)
```py
from dataclasses import dataclass
from typing import Any, List

import aiohttp
from temporalio import activity

TASK_QUEUE_NAME = "temporal-community-task-queue"


@dataclass
class TemporalCommunityPost:
    title: str
    url: str
    views: int


@activity.defn
async def post_ids() -> List[str]:
    async with aiohttp.ClientSession() as session:
        async with session.get("https://community.temporal.io/latest.json") as response:
            if not 200 <= int(response.status) < 300:
                raise RuntimeError(f"Status: {response.status}")
            post_ids = await response.json()

    return [str(topic["id"]) for topic in post_ids["topic_list"]["topics"]]


@activity.defn
async def top_posts(post_ids: List[str]) -> List[TemporalCommunityPost]:
    results: List[TemporalCommunityPost] = []
    async with aiohttp.ClientSession() as session:
        for item_id in post_ids:
            async with session.get(
                f"https://community.temporal.io/t/{item_id}.json"
            ) as response:
                if response.status < 200 or response.status >= 300:
                    raise RuntimeError(f"Status: {response.status}")
                item = await response.json()
                slug = item["slug"]
                url = f"https://community.temporal.io/t/{slug}/{item_id}"
                community_post = TemporalCommunityPost(
                    title=item["title"], url=url, views=item["views"]
                )
                results.append(community_post)
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

The first step of the data pipeline checks if the status of the endpoint returns a 200 response, if it doesn't, it will raise a `RuntimeError`, otherwise, it will continue processing the post identifiers.
The last step of the data pipeline returns the results, which will be processed in your `run_workflow.py` file.

Now that you've defined the steps in your data pipeline, create a Worker that will host the Workflow and Activities.

## Create the Worker to host your Workflow and Activities

The Worker component plays a crucial role in your data pipeline by hosting and executing Workflows and Activities. It serves as the backbone of the execution process, responsible for listening to Task Queues and performing the necessary actions in response to incoming tasks.

To enable the execution of your Workflows and Activities, you need to set up a Worker. Start by creating a new file called `run_worker.py` and add the following code. This code will define the Worker's behavior, allowing it to host and execute the Workflows and/or Activities associated with your application.

<!--SNIPSTART data-pipeline-run-worker-python-->
[run_worker.py](https://github.com/temporalio/data-pipeline-project-python/blob/main/run_worker.py)
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

To run a Worker, you create an instance of the same Client that's used to start the Workflow.
You must set the Worker to the same Task Queue name and specify your Workflow and Activity names in a list.

The Worker need to know which Workflows and Activities it should execute in response to incoming tasks on the Task Queue.
So by specifying the names of the Workflows and Activities, the Worker knows which code to run when it receives a task from the Task Queue.

Then run the Worker with the [asyncio.run()](https://docs.python.org/3/library/asyncio-runner.html#asyncio.run) function.

The Worker listens and polls on a single Task Queue. A Worker Entity contains both a Workflow Worker and an Activity Worker so that it may make progress of either a Workflow Execution or an Activity Execution.

Now that you've developed a Worker, run the Workflow.

## Run the Workflow to execute the data pipeline

The `run_workflow.py` file serves as a program that facilitates the execution of the Workflow associated with our data pipeline.
While you can run the Client through the CLI, this example process and initiates the data processing logic programmatically.

Connecting and running the Workflow programmatically offers more flexibility and control over the execution process, like the ability to test, integrate, and execute based on your own business logic.

The Workflow is executed by the Temporal Client, which is connected to an instance of the Temporal Server.

Create a new file called `run_workflow.py` and add the following code:

<!--SNIPSTART data-pipeline-run-workflow-python-->
[run_workflow.py](https://github.com/temporalio/data-pipeline-project-python/blob/main/run_workflow.py)
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

The `Client.connect()` connects to an instance of the Temporal Client. Since it's running locally, it's connected to `localhost:7233`.

The `execute_workflow()` function is set on the `client` to execute the Workflow, by passing the name of the Workflow run method, a Workflow Id, and a Task Queue name.

This will execute the steps defined in your Workflow, which will then return the results of `stories`.
For this example, `stories` is processed by a [Pandas Data Frame](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html).

The code runs in an `asyncio` event loop.

To run your code, open two terminal windows.

In the first terminal, run this command to start the worker:

```command
python run_worker.py
```


In the second terminal, run this command to start the workflow:

```command
python run_workflow.py
```

You'll see an output similar to the following in your terminal:

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

1. Select the most recently running Workflow by Workflow Id, for example `temporal-community-workflow` followed by a timestamp.
2. Open the **Input and results** pane to see what was entered and returned to the Workflow.
3. Under **Recent Events,** you can observe every step and task created by the data pipeline.
    This information is persisted in History, meaning that if any point a failure is created in your data pipeline, you can resume from that point in the history, rather than starting over from the beginning.

You've successfully run your Workflow and explored the Event History, now schedule your Workflow.

## Schedule a Workflow to run on a specific interval

You just built and ran a Workflow, that returns information from your data pipeline. Now, you'll run this Workflow on a schedule.

Cron jobs have a reputation for fragility because they run commands in a different environment than the user's shell, which can lead to configuration management issues and random machine failures.
Additionally, cron errors are not always directed to live email, making it hard to know when things go wrong.
While newer systems like systemd timers and Kubernetes cron jobs fix some of these issues, there is still a reliance on the archaic five-field string syntax for specifying times.
Fortunately, Temporal provides an alternative solution for scheduling workflows that doesn't require configuring additional dependencies or worrying about system alerts.

Temporal provides a [Schedule Workflow](https://docs.temporal.io/workflows#schedule) function, in which you can start, backfill, delete, describe, list, pause, trigger, and update a Schedule.
Instead of relying on machine-level cron jobs, you can define your tasks as Workflows in Temporal and schedule them to run on a specified schedule, interval, calendar, or event trigger.

For this example, you'll schedule the Workflow to run every 10 hours.

Create a new file called `schedule_workflow.py` and add the following code:

<!--SNIPSTART data-pipeline-schedule-workflow-python-->
[schedule_workflow.py](https://github.com/temporalio/data-pipeline-project-python/blob/main/schedule_workflow.py)
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
        "top-stories-every-10-hours",
        Schedule(
            action=ScheduleActionStartWorkflow(
                TemporalCommunityWorkflow.run,
                id="temporal-community-workflow",
                task_queue=TASK_QUEUE_NAME,
            ),
            spec=ScheduleSpec(
                intervals=[ScheduleIntervalSpec(every=timedelta(hours=10))]
            ),
        ),
    )


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

Set the `create_schedule()` function on the Client and pass a unique identifier for the Schedule. You can use the unique identifier as a business process identifier, for example `temporal-community-workflow`. It is crucial for each Schedule to have a unique identifier to avoid conflicts and ensure clear identification. The unique identifier ensures unambiguous identification and distinguishes one Schedule from another, avoiding potential errors.

Then use the [Schedule](https://python.temporal.io/temporalio.client.Schedule.html) class on the Client to set the Schedule [action](https://python.temporal.io/temporalio.client.Schedule.html#action) and [spec](https://python.temporal.io/temporalio.client.Schedule.html#spec).

The `Schedule` provides a solution to running your actions periodically. The `spec` determines when the action is taken.

In this example, the Action specifies the Workflow run, `TemporalCommunityWorkflow`, the Workflow Id, `temporal-community-workflow`, and the Task Queue name.

Then in the [ScheduleSpec](https://python.temporal.io/temporalio.client.ScheduleSpec.html) set an interval timer, for example `every=timedelta(hours=10)`.

While this tutorial uses an interval timer, you can set a [cron_expressions](https://python.temporal.io/temporalio.client.ScheduleSpec.html#cron_expressions), [calendars](https://python.temporal.io/temporalio.client.ScheduleSpec.html#calendars), and more to run your Workflow.

:::note

Modify the interval timer from `hours=10` to `minutes=1` to see the Schedule Workflow execute more frequently.

:::

Run the following command to start the Schedule.

```command
python schedule_workflow.py
```

Now go to your running instance of the [Temporal Web UI](http://localhost:8233/).

1. Select the **Schedules** from the left-hand navigation.
2. Choose the Schedule and see a list of upcoming runs.

After a few runs, you can see the **Recent Runs** fill up with previously run Workflows, or go back to the **Recent Workflows** page and see the Workflows populate there.

Now that you've scheduled your Workflow, let's add the ability to delete the Schedule.

## Delete the Schedule

Create a new file called `delete_schedule.py` and add the following code:

<!--SNIPSTART data-pipeline-delete-schedule-python-->
[delete_schedule.py](https://github.com/temporalio/data-pipeline-project-python/blob/main/delete_schedule.py)
```py
import asyncio

from temporalio.client import Client


async def main():
    client = await Client.connect("localhost:7233")
    handle = client.get_schedule_handle(
        "top-stories-every-10-hours",
    )

    await handle.delete()


if __name__ == "__main__":
    asyncio.run(main())

```
<!--SNIPEND-->

Run the following command to delete the Schedule.

```command
# terminal two
python delete_schedule.py
```

This sets the Schedule Id and then deletes the Schedule with the [delete()](https://python.temporal.io/temporalio.client.ScheduleHandle.html#delete) method on the Workflow handle.

Alternatively, you can delete a Schedule from the CLI.

Run the following command to delete the Schedule.

```command
temporal schedule delete --schedule-id workflow-schedule-id
```

You've successfully deleted a running Schedule.

## Conclusion

You have built and processed data with a data pipeline that's durably backed by Temporal and schedule a Workflow.

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
