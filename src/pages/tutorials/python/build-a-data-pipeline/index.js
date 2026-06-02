// Single-page tutorial: Build a data pipeline with Python.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "develop-workflow", label: "Develop the Workflow" },
  { id: "develop-activities", label: "Develop the Activities" },
  { id: "create-worker", label: "Create the Worker" },
  { id: "run-workflow", label: "Run the Workflow" },
  { id: "schedule-workflow", label: "Schedule the Workflow" },
  { id: "delete-schedule", label: "Delete the Schedule" },
  { id: "conclusion", label: "Conclusion" },
];

const WORKFLOW_PY = `from datetime import timedelta
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
        )`;

const ACTIVITIES_PY = `from dataclasses import dataclass
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
    return top_ten`;

const RETRY_DEFAULT = `Initial Interval     = 1 second
Backoff Coefficient  = 2.0
Maximum Interval     = 100 × Initial Interval
Maximum Attempts     = ∞
Non-Retryable Errors = []`;

const RUN_WORKER_PY = `import asyncio

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
    asyncio.run(main())`;

const RUN_WORKFLOW_PY = `import asyncio

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
    asyncio.run(main())`;

const TOP_POSTS_OUTPUT = `Top 10 stories on Temporal Community:
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
[10 rows x 3 columns]`;

const SCHEDULE_WORKFLOW_PY = `import asyncio
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
    asyncio.run(main())`;

const DELETE_SCHEDULE_PY = `import asyncio

from temporalio.client import Client


async def main():
    client = await Client.connect("localhost:7233")
    handle = client.get_schedule_handle(
        "top-stories-every-10-hours",
    )

    await handle.delete()


if __name__ == "__main__":
    asyncio.run(main())`;

const ADD_ACTIVITY_SNIPPET = `    worker = Worker(
        client,
        task_queue=TASK_QUEUE_NAME,
        workflows=[TemporalCommunityWorkflow],
        # tell the Worker of you new Activity
        activities=[top_posts, post_ids, freq_occurring_words], # adding \`freq_occurring_words\`
    )
    await worker.run()`;

const ADD_STEP_SNIPPET = `@workflow.defn
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
        )`;

export default function BuildADataPipelinePage() {
  return (
    <Layout
      title="Build a data pipeline with Python"
      description="Implement a data pipeline application in Python using Temporal's Workflows, Activities, and Schedules to orchestrate and run the steps in your pipeline."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_python.png"
            alt="Temporal Python SDK"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Python", href: "/tutorials/python" },
                  { label: "Build a data pipeline" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Build a data pipeline with Python</h1>

            <MetaChips items={["~45 minutes", "Beginner", "Python"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                When it comes to building data pipelines, choosing the right
                workflow model is crucial for achieving reliability,
                scalability, and maintainability. Temporal makes writing data
                pipelines less complex with Workflows and Activities.
              </p>
              <p>
                With Temporal, you can retrieve data from a source, process
                the information with steps, and output the flow of
                information to a destination, all using code. This means you
                can implement, test, and execute all your developer best
                practices as required. Furthermore, Temporal offers built-in
                resilience and fault tolerance features that can handle
                unexpected failures and issues seamlessly.
              </p>
              <p>
                In this tutorial you'll build a data pipeline with Temporal,
                where you'll leverage its features to build robust, scalable,
                and maintainable pipelines, by retrieving the latest{" "}
                <a
                  href="https://community.temporal.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Community
                </a>{" "}
                posts, processing them based on their post identifier, and
                then returning a list of the top 10 most recently viewed
                posts.
              </p>
              <p>
                Then, to improve your understanding, you'll schedule your
                Workflows on an interval timer to automate the execution of
                these steps.
              </p>
              <p>
                By the end of this tutorial, you'll have a comprehensive
                understanding of how to implement code-based data pipelines
                using Temporal's features, such as Retries, Timeouts, and
                Schedules to ensure your pipeline's resilience and fault
                tolerance.
              </p>
              <p>
                You can find the completed application on GitHub in the{" "}
                <a
                  href="https://github.com/temporalio/data-pipeline-project-python"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  data-pipeline-project-python
                </a>{" "}
                repository.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li>
                  Complete the{" "}
                  <Link to="/getting_started/python/hello_world_in_python/">
                    Hello World
                  </Link>{" "}
                  tutorial
                </li>
                <li>
                  Install{" "}
                  <a
                    href="https://pandas.pydata.org"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pandas
                  </a>{" "}
                  (tested with version 2.0.1)
                </li>
                <li>
                  Install{" "}
                  <a
                    href="https://docs.aiohttp.org/en/stable/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    aiohttp
                  </a>{" "}
                  (tested with version 3.8.4)
                </li>
              </ul>
              <CodeBlock language="bash">pip install pandas aiohttp</CodeBlock>
              <p>
                Now that you've installed the required libraries, develop your
                Workflow Definition and get started with building a
                fault-tolerant data pipeline.
              </p>
            </section>

            <section className={styles.section} id="develop-workflow">
              <h2 className={styles.sectionTitle}>
                Develop a Workflow to orchestrate your data pipeline
              </h2>
              <p>
                Use Workflows to orchestrate the execution of your data
                pipeline's steps. The Workflow will be responsible for
                executing the Activities, or steps, in your data pipeline,
                and handle any failures that may occur using retries and
                timeouts.
              </p>
              <p>
                Create a new file called <code>your_workflow.py</code> and
                add the following code:
              </p>
              <CodeBlock language="py" title="your_workflow.py">
                {WORKFLOW_PY}
              </CodeBlock>
              <p>
                The <code>TemporalCommunityWorkflow</code> class is decorated
                with the <code>@workflow.defn</code> which must be set on any
                registered Workflow class.
              </p>
              <p>
                The <code>async def run()</code> function is decorated with
                the <code>@workflow.run</code> which is set on the one
                asynchronous method on the same class as the{" "}
                <code>@workflow.defn</code>.
              </p>
              <p>
                There are two Activities being executed, <code>post_ids</code>{" "}
                and <code>top_posts</code>. These Activities are defined in
                the <code>activities.py</code> file, which will be explained
                later.
              </p>
              <p>
                Inside the <code>workflow.execute_activity()</code> function,
                pass the reference of Activity Definition, or step in your
                data pipeline. If that step takes an argument, then use the
                second positional argument for that name, as shown in the
                second <code>execute_activity()</code> function.
              </p>
              <p>
                You must set either a Start-To-Close or Schedule-To-Close
                Activity Timeout.
              </p>
              <p>
                Now that the Workflow is explained, develop your Activities
                to handle the logic of your data pipeline.
              </p>
            </section>

            <section className={styles.section} id="develop-activities">
              <h2 className={styles.sectionTitle}>
                Develop Activities to process your data
              </h2>
              <p>
                Think of the Activities as steps in your data pipeline. Each
                Activity should handle something that you want executed. The
                Workflow will handle the execution of each step.
              </p>
              <p>
                In the <code>activities.py</code> file, write out each step
                in the data processing pipeline.
              </p>
              <p>
                In this example, establish a connection to the{" "}
                <code>aiohttp</code>'s{" "}
                <a
                  href="https://docs.aiohttp.org/en/stable/client_reference.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Client Session
                </a>
                . The{" "}
                <a
                  href="https://docs.aiohttp.org/en/stable/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  aiohttp
                </a>{" "}
                library is recommended instead of{" "}
                <a
                  href="https://requests.readthedocs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  requests
                </a>
                , because it avoids making blocking calls.
              </p>
              <p>
                The <code>post_ids()</code> function gets the top 10 Temporal
                Community posts while <code>top_posts()</code> gets items
                based on the post's identifier.
              </p>
              <p>
                Create a new file called <code>activities.py</code> and add
                the following code:
              </p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITIES_PY}
              </CodeBlock>

              <Admonition type="note">
                <p>
                  The Temporal Community posts are built off of the{" "}
                  <a
                    href="https://docs.discourse.org/#tag/Posts"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Discourse
                  </a>{" "}
                  API.
                </p>
              </Admonition>

              <p>
                Each function contains an <code>activity.defn</code>{" "}
                decorator that ensures that function is durably backed by
                Temporal. The Retry Policy defined in the{" "}
                <code>TemporalCommunityWorkflow</code> class contains
                information needed to retry in case the API endpoint is down.
              </p>
              <p>By default, the Retry Policy is:</p>
              <CodeBlock>{RETRY_DEFAULT}</CodeBlock>
              <p>
                The first step of the data pipeline checks if the status of
                the endpoint returns a 200 response, if it doesn't, it will
                raise a <code>RuntimeError</code>, otherwise, it will
                continue processing the post identifiers. The last step of
                the data pipeline returns the results, which will be
                processed in your <code>run_workflow.py</code> file.
              </p>
              <p>
                Now that you've defined the steps in your data pipeline,
                create a Worker that will host the Workflow and Activities.
              </p>
            </section>

            <section className={styles.section} id="create-worker">
              <h2 className={styles.sectionTitle}>
                Create the Worker to host your Workflow and Activities
              </h2>
              <p>
                The Worker component plays a crucial role in your data
                pipeline by hosting and executing Workflows and Activities.
                It serves as the backbone of the execution process,
                responsible for listening to Task Queues and performing the
                necessary actions in response to incoming tasks.
              </p>
              <p>
                To enable the execution of your Workflows and Activities,
                you need to set up a Worker. Start by creating a new file
                called <code>run_worker.py</code> and add the following code.
                This code will define the Worker's behavior, allowing it to
                host and execute the Workflows and/or Activities associated
                with your application.
              </p>
              <CodeBlock language="py" title="run_worker.py">
                {RUN_WORKER_PY}
              </CodeBlock>
              <p>
                To run a Worker, you create an instance of the same Client
                that's used to start the Workflow. You must set the Worker to
                the same Task Queue name and specify your Workflow and
                Activity names in a list.
              </p>
              <p>
                The Worker needs to know which Workflows and Activities it
                should execute in response to incoming tasks on the Task
                Queue. So by specifying the names of the Workflows and
                Activities, the Worker knows which code to run when it
                receives a task from the Task Queue.
              </p>
              <p>
                Then run the Worker with the{" "}
                <a
                  href="https://docs.python.org/3/library/asyncio-runner.html#asyncio.run"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  asyncio.run()
                </a>{" "}
                function.
              </p>
              <p>
                The Worker listens and polls on a single Task Queue. A Worker
                Entity contains both a Workflow Worker and an Activity Worker
                so that it may make progress of either a Workflow Execution
                or an Activity Execution.
              </p>
              <p>Now that you've developed a Worker, run the Workflow.</p>
            </section>

            <section className={styles.section} id="run-workflow">
              <h2 className={styles.sectionTitle}>
                Run the Workflow to execute the data pipeline
              </h2>
              <p>
                The <code>run_workflow.py</code> file serves as a program
                that facilitates the execution of the Workflow associated
                with our data pipeline. While you can run the Client through
                the CLI, this example processes and initiates the data
                processing logic programmatically.
              </p>
              <p>
                Connecting and running the Workflow programmatically offers
                more flexibility and control over the execution process, like
                the ability to test, integrate, and execute based on your own
                business logic.
              </p>
              <p>
                The Workflow is executed by the Temporal Client, which is
                connected to an instance of the Temporal Server.
              </p>
              <p>
                Create a new file called <code>run_workflow.py</code> and add
                the following code:
              </p>
              <CodeBlock language="py" title="run_workflow.py">
                {RUN_WORKFLOW_PY}
              </CodeBlock>
              <p>
                The <code>Client.connect()</code> connects to an instance of
                the Temporal Client. Since it's running locally, it's
                connected to <code>localhost:7233</code>.
              </p>
              <p>
                The <code>execute_workflow()</code> function is set on the{" "}
                <code>client</code> to execute the Workflow, by passing the
                name of the Workflow run method, a Workflow Id, and a Task
                Queue name.
              </p>
              <p>
                This will execute the steps defined in your Workflow, which
                will then return the results of <code>stories</code>. For
                this example, <code>stories</code> is processed by a{" "}
                <a
                  href="https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pandas Data Frame
                </a>
                .
              </p>
              <p>
                The code runs in an <code>asyncio</code> event loop.
              </p>
              <p>To run your code, open two terminal windows.</p>
              <p>In the first terminal, run this command to start the worker:</p>
              <CodeBlock language="bash">python run_worker.py</CodeBlock>
              <p>In the second terminal, run this command to start the workflow:</p>
              <CodeBlock language="bash">python run_workflow.py</CodeBlock>
              <p>You'll see an output similar to the following in your terminal:</p>
              <CodeBlock>{TOP_POSTS_OUTPUT}</CodeBlock>
              <p>
                Now go to your running instance of the{" "}
                <a
                  href="http://localhost:8233/namespaces/default/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Web UI
                </a>
                , to see how the information is persisted in history.
              </p>
              <ol>
                <li>
                  Select the most recently running Workflow by Workflow Id,
                  for example <code>temporal-community-workflow</code>{" "}
                  followed by a timestamp.
                </li>
                <li>
                  Open the <strong>Input and results</strong> pane to see
                  what was entered and returned to the Workflow.
                </li>
                <li>
                  Under <strong>Recent Events</strong>, you can observe every
                  step and task created by the data pipeline. This
                  information is persisted in History, meaning that if any
                  point a failure is created in your data pipeline, you can
                  resume from that point in the history, rather than starting
                  over from the beginning.
                </li>
              </ol>
              <p>
                You've successfully run your Workflow and explored the Event
                History; now schedule your Workflow.
              </p>
            </section>

            <section className={styles.section} id="schedule-workflow">
              <h2 className={styles.sectionTitle}>
                Schedule a Workflow to run on a specific interval
              </h2>
              <p>
                You just built and ran a Workflow that returns information
                from your data pipeline. Now, you'll run this Workflow on a
                schedule.
              </p>
              <p>
                Cron jobs have a reputation for fragility because they run
                commands in a different environment than the user's shell,
                which can lead to configuration management issues and random
                machine failures. Additionally, cron errors are not always
                directed to live email, making it hard to know when things go
                wrong. While newer systems like systemd timers and Kubernetes
                cron jobs fix some of these issues, there is still a reliance
                on the archaic five-field string syntax for specifying times.
                Fortunately, Temporal provides an alternative solution for
                scheduling workflows that doesn't require configuring
                additional dependencies or worrying about system alerts.
              </p>
              <p>
                Temporal provides a{" "}
                <a
                  href="https://docs.temporal.io/workflows#schedule"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule Workflow
                </a>{" "}
                function, in which you can start, backfill, delete, describe,
                list, pause, trigger, and update a Schedule. Instead of
                relying on machine-level cron jobs, you can define your tasks
                as Workflows in Temporal and schedule them to run on a
                specified schedule, interval, calendar, or event trigger.
              </p>
              <p>For this example, you'll schedule the Workflow to run every 10 hours.</p>
              <p>
                Create a new file called <code>schedule_workflow.py</code>{" "}
                and add the following code:
              </p>
              <CodeBlock language="py" title="schedule_workflow.py">
                {SCHEDULE_WORKFLOW_PY}
              </CodeBlock>
              <p>
                Set the <code>create_schedule()</code> function on the Client
                and pass a unique identifier for the Schedule. You can use
                the unique identifier as a business process identifier, for
                example <code>temporal-community-workflow</code>. It is
                crucial for each Schedule to have a unique identifier to
                avoid conflicts and ensure clear identification. The unique
                identifier ensures unambiguous identification and
                distinguishes one Schedule from another, avoiding potential
                errors.
              </p>
              <p>
                Then use the{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.Schedule.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule
                </a>{" "}
                class on the Client to set the Schedule{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.Schedule.html#action"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  action
                </a>{" "}
                and{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.Schedule.html#spec"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  spec
                </a>
                .
              </p>
              <p>
                The <code>Schedule</code> provides a solution to running your
                actions periodically. The <code>spec</code> determines when
                the action is taken.
              </p>
              <p>
                In this example, the Action specifies the Workflow run,{" "}
                <code>TemporalCommunityWorkflow</code>, the Workflow Id,{" "}
                <code>temporal-community-workflow</code>, and the Task Queue
                name.
              </p>
              <p>
                Then in the{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.ScheduleSpec.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ScheduleSpec
                </a>{" "}
                set an interval timer, for example{" "}
                <code>every=timedelta(hours=10)</code>.
              </p>
              <p>
                While this tutorial uses an interval timer, you can set a{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.ScheduleSpec.html#cron_expressions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cron_expressions
                </a>
                ,{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.ScheduleSpec.html#calendars"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  calendars
                </a>
                , and more to run your Workflow.
              </p>

              <Admonition type="note">
                <p>
                  Modify the interval timer from <code>hours=10</code> to{" "}
                  <code>minutes=1</code> to see the Schedule Workflow execute
                  more frequently.
                </p>
              </Admonition>

              <p>Run the following command to start the Schedule.</p>
              <CodeBlock language="bash">python schedule_workflow.py</CodeBlock>
              <p>
                Now go to your running instance of the{" "}
                <a
                  href="http://localhost:8233/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Web UI
                </a>
                .
              </p>
              <ol>
                <li>Select the <strong>Schedules</strong> from the left-hand navigation.</li>
                <li>Choose the Schedule and see a list of upcoming runs.</li>
              </ol>
              <p>
                After a few runs, you can see the <strong>Recent Runs</strong>{" "}
                fill up with previously run Workflows, or go back to the{" "}
                <strong>Recent Workflows</strong> page and see the Workflows
                populate there.
              </p>
              <p>
                Now that you've scheduled your Workflow, let's add the
                ability to delete the Schedule.
              </p>
            </section>

            <section className={styles.section} id="delete-schedule">
              <h2 className={styles.sectionTitle}>Delete the Schedule</h2>
              <p>
                Create a new file called <code>delete_schedule.py</code> and
                add the following code:
              </p>
              <CodeBlock language="py" title="delete_schedule.py">
                {DELETE_SCHEDULE_PY}
              </CodeBlock>
              <p>Run the following command to delete the Schedule.</p>
              <CodeBlock language="bash">
                {`# terminal two\npython delete_schedule.py`}
              </CodeBlock>
              <p>
                This sets the Schedule Id and then deletes the Schedule with
                the{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.ScheduleHandle.html#delete"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  delete()
                </a>{" "}
                method on the Workflow handle.
              </p>
              <p>Alternatively, you can delete a Schedule from the CLI.</p>
              <p>Run the following command to delete the Schedule.</p>
              <CodeBlock language="bash">
                temporal schedule delete --schedule-id workflow-schedule-id
              </CodeBlock>
              <p>You've successfully deleted a running Schedule.</p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You have built and processed data with a data pipeline that's
                durably backed by Temporal and scheduled a Workflow.
              </p>
              <p>
                With Temporal, you have insight into your data pipelines. You
                can see every point in History and have the ability to
                resume from a failure or retry, and ensure that your
                Workflows execute on a scheduled interval.
              </p>

              <h3>Next steps</h3>
              <p>
                Now on your own, write another Activity, or step in your
                data pipeline, that extracts the most frequently occurring
                words or topics in the story title.
              </p>

              <details>
                <summary>How do you tell the Worker to process another Activity?</summary>
                <p>
                  Add the reference to the Activity name to the list of
                  Activities processed by the Worker.
                </p>
                <CodeBlock language="python">{ADD_ACTIVITY_SNIPPET}</CodeBlock>
              </details>

              <details>
                <summary>How does the Workflow know to process that step?</summary>
                <p>In your Workflow, add an extra step to execute that Activity.</p>
                <CodeBlock language="python">{ADD_STEP_SNIPPET}</CodeBlock>
              </details>

              <details>
                <summary>What's returned by the Workflow Execution?</summary>
                <p>The most frequently occurring words are returned by the Workflow Execution.</p>
                <p>
                  The file, <code>run_workflow.py</code> can process or
                  present that information any way it likes. For example,
                  creating a Word Cloud with that information.
                </p>
              </details>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/python/build-an-email-drip-campaign/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build an email drip campaign</h3>
                  <p className={styles.nextBody}>
                    Manage long-running email subscriptions with Workflows,
                    Queries, and Cancellation Requests.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/python/trip-booking-app/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build a trip booking app</h3>
                  <p className={styles.nextBody}>
                    Apply the Saga pattern to roll back partial bookings with
                    compensating Activities.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
