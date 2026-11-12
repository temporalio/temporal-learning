---
id: run-it-the-old-way
title: Meet the Workflow and run it the old way
sidebar_label: Run it the old way
description: Run the ticket registration Workflow as an ordinary long-lived Worker so you have a working baseline before going serverless.
keywords: [temporal, python, worker, serverless, signal, workflow]
tags: [serverless-workers, aws-lambda, python]
draft: true
last_update:
  date: 2026-11-03
  author: Angela Zhou
---

If you run Temporal in production, you probably already have Workers like the one we're about to start: long-lived processes that connect to Temporal and poll their Task Queues around the clock. That setup is easy to reason about, and when traffic is steady it works well.

But plenty of workloads aren't steady, like ticket registrations that trickle in most of the day and flood in when a show goes on sale. Each registration reserves a seat almost immediately, then waits for the fan's payment, and needs no Worker at all while it waits.

[Serverless Workers](https://docs.temporal.io/evaluate/features/serverless-workers) let Temporal start Workers when there's work and stop them when it drains. Steady, high-volume load, and Activities that run longer than Lambda's 15-minute limit, are still better on long-lived Workers, and we'll weigh that tradeoff once we've seen a Serverless Worker run.

Before we change anything, though, we'll run the registration Workflow the way you run Workers today, with a normal long-lived Worker against a local dev server and no AWS involved.

## Get the sample code

All the code in this tutorial lives in the [companion repo](https://github.com/temporalio/edu-serverless-workers/):

```bash
git clone https://github.com/temporalio/edu-serverless-workers.git
cd edu-serverless-workers/serverless-workers/python
```

Run every command in this tutorial from that folder.

## The Workflow

Each registration represents one fan trying to get a ticket for a drop. The Workflow reserves a seat for them, then waits until their payment clears before it sends a confirmation.

```python title="workflows.py"
from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import reserve_seat, send_confirmation


@workflow.defn
class TicketRegistrationWorkflow:
    def __init__(self) -> None:
        self._paid = False

    @workflow.signal
    def payment_confirmed(self) -> None:
        # A Signal delivers the "payment cleared" event from outside the Workflow.
        self._paid = True

    @workflow.run
    async def run(self, fan: str) -> str:
        await workflow.execute_activity(
            reserve_seat, fan, start_to_close_timeout=timedelta(seconds=10)
        )
        # Pause here until the payment_confirmed Signal arrives. This wait can last
        # a few hours, and it's the reason one registration will later span
        # more than one Lambda invocation: nothing runs while it waits.
        await workflow.wait_condition(lambda: self._paid)
        return await workflow.execute_activity(
            send_confirmation, fan, start_to_close_timeout=timedelta(seconds=10)
        )
```

The Activities are stubs: in a real app, `reserve_seat` would hold a seat in your inventory system and `send_confirmation` would send an email or a text. Each one writes a log line, which we'll use later to spot the Activities running inside Lambda.

```python title="activities.py"
from temporalio import activity


@activity.defn
async def reserve_seat(fan: str) -> str:
    activity.logger.info(f"Reserving a seat for {fan}")
    return f"seat held for {fan}"


@activity.defn
async def send_confirmation(fan: str) -> str:
    activity.logger.info(f"Sending confirmation to {fan}")
    return f"confirmation sent to {fan}"
```

Notice there's no [versioning](https://docs.temporal.io/worker-versioning) behavior on the Workflow. Versioning tells Temporal what to do with a Workflow that's still running when we deploy new code: keep it on the build it started on, or move it to the new one. Ordinary Workers don't need one. Serverless Workers do, because Temporal can only start a Serverless Worker through Worker Versioning, and once versioning is on, every Workflow needs a behavior. We'll look at why in the next chapter.

## Run it

The Worker lives in `worker.py`, an ordinary long-lived Worker that registers the Workflow and both Activities on the `registrations` Task Queue, then polls until we stop it. We'll put it side by side with the Lambda handler in the next chapter.

<details>
<summary>What's in <code>worker.py</code></summary>

```python title="worker.py"
"""Run the ticket registration Worker the ordinary way.

This is a normal long-lived Worker, the "old way" of running Temporal. Use it to
develop and test the Workflow before you package it for Lambda. With no configuration
it connects to a local dev server at localhost:7233. Set the standard TEMPORAL_*
environment variables to point it at Temporal Cloud instead.
"""

import asyncio

from temporalio.client import Client
from temporalio.envconfig import ClientConfig
from temporalio.worker import Worker

from activities import reserve_seat, send_confirmation
from shared import TASK_QUEUE
from workflows import TicketRegistrationWorkflow


async def main() -> None:
    client = await Client.connect(**ClientConfig.load_client_connect_config())
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[TicketRegistrationWorkflow],
        activities=[reserve_seat, send_confirmation],
    )
    print(f"Worker polling task queue '{TASK_QUEUE}'. Press Ctrl-C to stop.")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```

</details>

Start a local dev server in one terminal:

```bash
temporal server start-dev
```

Open a second terminal in the `edu-serverless-workers/serverless-workers/python` folder, then install the dependencies and run the Worker. With no configuration it connects to the local dev server:

```bash
uv sync
uv run python worker.py
```

**Expected output:**

```
Worker polling task queue 'registrations'. Press Ctrl-C to stop.
```

In a third terminal, start a registration and confirm its payment. `start_registration.py` starts a `TicketRegistrationWorkflow` with the Workflow ID `reg-1` for a fan named `ada`. 

```bash
uv run python start_registration.py reg-1 ada
```

**Expected output:**

```
Started registration 'reg-1' for ada.
```

The Worker picks it up, reserves a seat, and waits for payment. Kick off `send_payment.py` to send the `payment_confirmed` Signal to `reg-1`, the way a payment provider would once the charge goes through, and the Workflow sends the confirmation and finishes:

```bash
uv run python send_payment.py reg-1
```

**Expected output:**

```
Payment confirmed for 'reg-1'.
```

## Look at what happened

Open the Web UI at [http://localhost:8233](http://localhost:8233) and find the `reg-1` Workflow. 

![The reg-1 Workflow in the local Web UI, Completed on the registrations Task Queue, with its Event History ending in the payment_confirmed Signal, send_confirmation, and Workflow Execution Completed](/img/local-reg-1-event-history.png)

See if you can find these in its details and Event History:

- The Task Queue the registration ran on.
- The input the Workflow started with, and the result it returned.
- The event where the payment Signal arrived.
- The stretch where the Workflow was waiting for payment.

<details>
<summary>Answers</summary>

- The Task Queue is `registrations`, shown in the Workflow's summary at the top of the page.
- The input is `"ada"`, recorded on the `WorkflowExecutionStarted` event, and the result is `"confirmation sent to ada"`, recorded on `WorkflowExecutionCompleted`.
- The Signal is the `WorkflowExecutionSignaled` event, carrying the name `payment_confirmed`.
- The wait sits between the `ActivityTaskCompleted` event for `reserve_seat` and the `WorkflowExecutionSignaled` event, and it lasted as long as you took to run `send_payment.py`. The Workflow was alive and holding its place that whole time, but no Worker was doing any work for it.

</details>

## Stop the Worker mid-registration

Between `reserve_seat` finishing and the Signal arriving, `reg-1` only waited as long as it took us to run `send_payment.py`. A real fan might not pay for hours. Maybe they step away to find their card, or their bank holds the charge for review. The Workflow stays running the whole time, but there's nothing for a Worker to do until the payment shows up. Our Worker would spend those hours polling the `registrations` Task Queue anyway, and on a quiet night with only a handful of registrations, that waiting is most of what a fleet of long-lived Workers does.

So does a waiting Workflow need a Worker running at all? We can test that on our own machine by stopping the Worker partway through a registration.

With the Worker still running, start a second registration:

```bash
uv run python start_registration.py reg-2 grace
```

**Expected output:**

```
Started registration 'reg-2' for grace.
```

Stop the Worker with Ctrl-C in its terminal, then send the payment while no Worker is running:

```bash
uv run python send_payment.py reg-2
```

**Expected output:**

```
Payment confirmed for 'reg-2'.
```

> **Predict:** before you restart the Worker, what state will `reg-2` be in? Open it in the Web UI and check your guess.

<details>
<summary>Answer</summary>

It's still Running, and its Event History shows `reserve_seat` completed and the `payment_confirmed` Signal recorded, with the Workflow stopped at that point. Nothing was lost, because Temporal accepted the Signal and saved it, and the registration is waiting for a Worker to come back and run the next step.

![The reg-2 Workflow in the local Web UI, Running with no result, showing a Workflow Task Timed Out banner and the payment_confirmed Signal in its Event History](/img/local-reg-2-stuck.png)

We'll probably also see a **Workflow Task Timed Out** banner, and it's expected. When the payment arrived, Temporal first offered the next step to the Worker that had been running `reg-2`, on a queue only that Worker polls, because that Worker usually still has the Workflow's state in memory and can pick up where it left off fastest. That Worker was gone, so after about 10 seconds the task timed out (`SCHEDULE_TO_START`), and Temporal put it back on the shared `registrations` queue, where any Worker can take it.

</details>

Now restart the Worker:

```bash
uv run python worker.py
```

Once it starts polling, it picks up `reg-2` and sends the confirmation, and the Web UI shows the Workflow as Completed with the result `confirmation sent to grace`.

![The reg-2 Workflow in the local Web UI, Completed with the result confirmation sent to grace](/img/local-reg-2-completed.png)

This works because the Workflow's state lives in Temporal, and a Worker only has to exist while there's a step to run. In a later chapter, we'll create the same gap on purpose, except nobody restarts a Worker by hand, because Temporal starts one when the payment Signal arrives.

Next, we'll look at [how Temporal starts a Worker on its own](../02-make-it-a-lambda-handler/index.md) and turn ours into a Lambda function it can invoke.
