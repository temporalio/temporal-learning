---
id: standalone-activities-python
title: Build a Job Queue with Standalone Activities
sidebar_position: 1
description: Build a durable webhook delivery service in Python using Temporal's Standalone Activities, Temporal's durable job queue, then run it hands-on in an Instruqt lab.
keywords: [Python, temporal, sdk, tutorial, standalone activities, job queue]
tags:
- Python
image: /img/temporal-logo-twitter-card.png
last_update:
  date: 2026-06-15
---

import Link from '@docusaurus/Link';

<img className="banner" src="/img/banners/standalone-activities-banner.png" alt="Build a Job Queue with Standalone Activities in Python" />

### Introduction

_By [Nikolay Advolodkin](https://www.linkedin.com/in/nikolayadvolodkin/), Staff Developer Advocate at Temporal_

You're going to build a durable webhook delivery service.

When something happens in your application, such as a payment clearing, an order shipping, or a user signing up, you POST to a URL another team gave you. Doing it durably means: if the network fails, retry. If the receiver returns 500, retry. If your service crashes mid-send, the retry does not double-deliver.

The same `deliver_webhook` Activity runs through every module of this tutorial:

- **Module 1**: Run the Activity directly from a client. Inspect it in the Temporal UI.
- **Module 2**: Make retries safe with an idempotency key.
- **Module 3**: Reject duplicate jobs at the platform level.
- **Module 4**: Cap throughput and prioritize urgent jobs.
- **Module 5**: Long-running jobs that heartbeat progress and resume after a crash.
- **Module 6**: The same Activity, called from a Workflow. Same code, two job types.

**Standalone Activities are Temporal's durable job queue.** You write a regular `@activity.defn` and submit it with one API call. Temporal persists it, retries it on failure, and makes it visible in the UI, with no broker, scheduler, or result store for you to operate.

### What you'll learn

By the end you'll be able to:

- Submit an Activity as a durable, addressable job with `client.execute_activity` / `client.start_activity`.
- Make retries safe with an idempotency key so a crash can't double-deliver.
- Reject duplicate submissions at the server with `ActivityIDConflictPolicy.USE_EXISTING`.
- Cap dispatch rate with `max_activities_per_second` and prioritize urgent work.
- Heartbeat a long-running Activity and resume it from the last checkpoint after a crash.
- Reuse the exact same Activity as a step inside a Workflow, with no rewrite.

### Prerequisites

- Comfortable reading and writing Python (functions, classes, imports).
- Familiar with Temporal Activities and Workers at the level [Temporal 101 in Python](https://learn.temporal.io/courses/temporal_101/python/) covers. If those words are new, take that course first and come back.

## Run the lab in your browser (recommended)

This tutorial is built as a hands-on Instruqt lab. Nothing to install: the Temporal Service, the Web UI, and a webhook receiver all boot with the sandbox, so you start writing code immediately. The modules below are the concept walkthrough; do the actual building in the lab.

Sign up to launch the lab:

<iframe
    width="804"
    height="472"
    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-popups-to-escape-sandbox"
    src="https://play.instruqt.com/embed/temporal/invite/tkjhxj0w55uz"
    style={{border: 0, maxWidth: '100%'}}
    allowFullScreen
></iframe>

## Run the code locally (optional)

Prefer to run it yourself? Clone the course repo and start the pieces the sandbox normally boots for you:

```bash
git clone https://github.com/temporalio/edu-standalone-activities.git
cd edu-standalone-activities/python/course-repo
uv sync
```

Then, in separate terminals:

```bash
# Webhook receiver (records what your Worker delivers)
uv run python server/webhook_receiver.py

# Temporal dev server + Web UI on http://localhost:8233
temporal server start-dev --ui-port 8233

# A module's Worker
cd exercise/01-durable-job-queue
uv run python -m webhooks.worker

# Submit a job (in another terminal, from the same module folder)
uv run python -m webhooks.send_standalone evt_001
curl http://localhost:9000/_received
```

Each module has parallel `exercise/<NN>` (starter code with `TODO` markers) and `solution/<NN>` folders. If you get stuck, diff your work against the matching `solution/` folder.

:::caution Running locally is unsupported

You may hit environment setup issues (Python version, dependencies, port conflicts, Temporal CLI installation) that we can't control or support. The Instruqt lab is the supported path. Use localhost only if you're comfortable troubleshooting your own setup.

:::

## Module 1: Submit a durable job with one API call

Most job queues make you operate the hard parts yourself: a broker, a result store, a scheduler, retry logic re-implemented per service, and a Tier-0 system nobody wants to own. A Standalone Activity is just a regular `@activity.defn` you submit with one call:

```py
response = httpx.post(req.url, json=req.payload, timeout=5.0)
response.raise_for_status()  # a 4xx/5xx raises, so Temporal retries
return response.status_code
```

```py
await client.execute_activity(
    deliver_webhook,
    args=[WebhookDelivery(...)],
    id="deliver-evt_001",
    task_queue=TASK_QUEUE,
    start_to_close_timeout=timedelta(seconds=10),
)
```

There's no "standalone" decorator and no Workflow class. Standalone versus inside-a-Workflow is decided by *how* the Activity is called, not how it's defined. The job is **addressable** (a stable ID you can query, cancel, or terminate), **durable** (persisted before your Worker sees it), and **observable** in the Temporal UI under the **Standalone Activities** tab:

![Temporal UI showing a completed Standalone Activity in the Standalone Activities tab](https://raw.githubusercontent.com/temporalio/edu-standalone-activities/main/python/diagrams/standalone-activity-ui.png)

> **Check your understanding:** your job hits a transient 503 on attempt 1. With Temporal's default retry policy, what happens?

<details>
<summary>Answer</summary>

Temporal sees the exception, waits the initial retry interval (1s by default), and dispatches the job again with exponential backoff. You wrote no retry code; you configured it on the Activity options. The job stays "Running" in the UI and the attempt counter increments. In a traditional job queue, that retry behavior is something you re-implement per service.

</details>

## Module 2: Make retries safe with idempotency

Temporal guarantees your Activity runs to completion *at least once*, not exactly once. If the POST lands and then the attempt errors (a 500, a dropped network, a Worker crash after the POST), Temporal retries the whole Activity body and the receiver gets the same delivery twice. The fix is a **stable** idempotency key the receiver dedupes on:

```py
headers = {"Idempotency-Key": f"webhook:{req.event_id}"}
```

The key is derived from the logical event id, so it's identical across every retry of that event. Don't use `uuid.uuid4()`: a fresh key per attempt dedupes nothing. At-least-once delivery (Temporal) + idempotency (your Activity and receiver) = effectively-once side effects.

Step through the with/without comparison:

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/idempotency-demo/index.html" width="100%" height="560" frameBorder="0" style={{border: 0, borderRadius: '8px'}}></iframe>

> **Check your understanding:** your Activity builds the `Idempotency-Key` from a `random.choice(...)` discount code generated inside the Activity. What breaks on retry?

<details>
<summary>Answer</summary>

Each retry generates a *different* random code, so the key changes per attempt and the receiver accepts every one. Make the key deterministic across retries: derive it from input the caller chose (`req.event_id`), or for workflow-bound Activities use `workflow_run_id + activity_id`. If you need the random value as part of the side effect, generate it in the caller and pass it in as input.

</details>

## Module 3: Reject duplicate jobs at the platform

Module 2 handled Temporal's *own* retries. This module handles a different duplicate: your upstream (Stripe, GitHub, a customer's service) sends the same event twice and you call `start_activity` twice. By default the second call raises `ActivityAlreadyStartedError`. One keyword makes the server return the existing handle instead:

```py
from temporalio.common import ActivityIDConflictPolicy

await client.start_activity(
    deliver_webhook,
    ...,
    id_conflict_policy=ActivityIDConflictPolicy.USE_EXISTING,
)
```

Both calls now succeed with the **same `run_id`**, and the duplicate never reaches a Worker. This is scheduling-layer dedup; it composes with the receiver-side idempotency key from Module 2.

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/conflict-policy-demo/index.html" width="100%" height="520" frameBorder="0" style={{border: 0, borderRadius: '8px'}}></iframe>

> **Check your understanding:** with `USE_EXISTING` set, you call `start_activity(id="evt_001")` twice, but the second call arrives 60 seconds *after* the first one already completed. What happens?

<details>
<summary>Answer</summary>

A **new** execution starts. `id_conflict_policy` only governs duplicates while the original is *in flight*. Once it completes, `id_reuse_policy` takes over, and its default (`ALLOW_DUPLICATE`) accepts a fresh run. For dedup across both windows, also set `id_reuse_policy=ActivityIDReusePolicy.REJECT_DUPLICATE`.

</details>

## Module 4: Cap throughput and prioritize urgent jobs

By default the Worker dispatches Activities as fast as it can pull them, which is often faster than the downstream service allows. Fan out 60 deliveries at a rate-limited receiver and you get a flood of 429s and climbing retry counts:

![A rate-limited Standalone Activity in the Temporal UI: status Running, attempt count climbing, last failure HTTP 429](https://raw.githubusercontent.com/temporalio/edu-standalone-activities/main/python/diagrams/rate-limited-activity-running.png)

Retrying harder can't solve a whole-fleet throughput problem; you have to pace the *dispatch*. One keyword on the Worker does it:

```py
max_activities_per_second=2.0,
```

Excess work waits in the Task Queue on the server, dispatched at the configured rate. Nothing is dropped. The companion control is `Priority(priority_key, fairness_key, fairness_weight)`: a lower `priority_key` jumps urgent work ahead of a backlog, and the fairness fields stop one busy tenant from starving the rest. See [Task Queue Priority and Fairness](https://docs.temporal.io/develop/task-queue-priority-fairness).

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/rate-limit-priority-demo/index.html" width="100%" height="430" frameBorder="0" style={{border: 0, borderRadius: '8px'}}></iframe>

> **Check your understanding:** your downstream API allows 100 req/sec. You set `max_activities_per_second=10` on one Worker. Are you safe?

<details>
<summary>Answer</summary>

Safe but probably underutilizing, only 10% of the headroom. `max_activities_per_second` is *per Worker*, so N Workers aggregate to N × the cap. For a hard, queue-wide cap regardless of Worker count, use `max_task_queue_activities_per_second`.

</details>

## Module 5: Heartbeat progress and resume after a crash

A Standalone Activity that processes a batch can run for minutes. If the Worker crashes mid-batch, you don't want the retry to redo everything. Standalone Activities have heartbeats built in: `activity.heartbeat(progress)` stores a checkpoint on the server, and the next attempt reads it back:

```py
start_index = 0
if info.heartbeat_details:
    start_index = info.heartbeat_details[0]  # resume from the last checkpoint
```

Pair it with `heartbeat_timeout` so the server detects a dead or stuck attempt in seconds instead of waiting out the full `start_to_close_timeout`. Heartbeating is also how cancellation reaches a running Activity. No side database required.

> **Check your understanding:** your batch Activity has `heartbeat_timeout=5s` and processes one item per second. Mid-batch the Worker *hangs* (a deadlock, not a crash) and stops heartbeating. What does Temporal do?

<details>
<summary>Answer</summary>

After 5 seconds with no heartbeat, Temporal treats the attempt as dead, the same as a crash, and schedules a retry on whatever Worker picks it up next. That's the point of `heartbeat_timeout`: a liveness signal that lets the server route around a stuck Worker quickly, rather than waiting for the much longer `start_to_close_timeout`.

</details>

## Module 6: Same code runs anywhere

Traditional job queues paint you into a corner: the queue runs jobs, orchestration lives elsewhere, and code gets rewritten when a job becomes multi-step. With Temporal, the exact same Activity runs both ways. Submit `deliver_webhook` directly *or* call it as a step inside a Workflow:

```py
with workflow.unsafe.imports_passed_through():
    from .activities import deliver_webhook  # the SAME function

@workflow.defn
class WebhookWorkflow:
    @workflow.run
    async def run(self, req: WebhookDelivery) -> int:
        return await workflow.execute_activity(
            deliver_webhook,
            req,
            start_to_close_timeout=timedelta(seconds=10),
        )
```

The Activity doesn't know whether it was invoked as a Standalone Activity or a Workflow step. When "one durable POST" grows into "charge the card, reserve inventory, then notify ops," you compose the Activities you already wrote into a Workflow instead of rewriting them in another tool.

At Replay 2026, Coinbase described migrating their custom Background Jobs Service, which handles 200–600 million jobs per day across 186 namespaces, onto Standalone Activities, letting one platform replace a separate job queue and orchestrator. ([Watch the talk](https://www.youtube.com/watch?v=zsF5Y-IOMOw).)

## Wrap-up

You now know how to use Standalone Activities in Python to:

- **Submit a durable job** with `client.execute_activity` / `client.start_activity`, no Workflow required.
- **Make retries safe** with a stable idempotency key for external writes.
- **Dedup duplicate submissions** at the server with `ActivityIDConflictPolicy.USE_EXISTING`.
- **Pace and prioritize** with `max_activities_per_second` and `Priority`.
- **Checkpoint long-running jobs** with `activity.heartbeat()` + `heartbeat_timeout`.
- **Reuse the same Activity from a Workflow** when the work grows into orchestration.

Temporal lets you start with a job and move to a Workflow when the work grows, and the Activity code comes with you.

Ready to build it for real? Launch the hands-on lab using the sign-up form at the [top of this page](#run-the-lab-in-your-browser-recommended).

📝 **Feedback on this tutorial?** [Share your thoughts in our quick form](https://forms.gle/hbTUjkHB6dkucEg27). It helps us improve.

<div className="card padding--lg margin-vert--lg" style={{textAlign: 'center'}}>
  <h2 className="margin-bottom--sm">Never miss a new tutorial</h2>
  <p className="margin-bottom--md">Be the first to know when we ship new tutorials, courses, and hands-on guides. No spam, unsubscribe anytime.</p>
  <Link className="button button--primary button--lg" to="https://pages.temporal.io/get-updates-education">
    Join the Temporal education list →
  </Link>
</div>
