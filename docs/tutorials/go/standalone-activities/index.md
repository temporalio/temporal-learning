---
id: standalone-activities-go
title: Build a Job Queue with Standalone Activities
sidebar_position: 1
description: Build a durable webhook delivery service in Go using Temporal's Standalone Activities, Temporal's durable job queue, then run it hands-on in an Instruqt lab.
keywords: [Go, temporal, sdk, tutorial, standalone activities, job queue]
tags:
  - Go
image: /img/temporal-logo-twitter-card.png
last_update:
  date: 2026-07-30
---

import Link from '@docusaurus/Link';

<img className="banner" src="/img/sdk_banners/banner_go.png" alt="Temporal Go SDK" />

### Introduction

_By [Angela Zhou](https://www.linkedin.com/in/zhoua1115/)_, Senior Developer Advocate at Temporal

**Standalone Activities are Temporal's durable job queue.** You write a regular Activity function and submit it with one API call. Temporal persists it, retries it on failure, and makes it visible in the UI, with no broker, scheduler, or result store for you to operate. 

When something happens in your application, such as a payment clearing, an order shipping, or a user signing up, you POST to a URL another team gave you. Doing it durably means three things: retry if the network fails, retry if the receiver returns a 500, and never double-deliver if your service crashes mid-send.


### What you'll learn

By the end you'll be able to:

- Submit an Activity as a durable, addressable job with `client.Client.ExecuteActivity`, and wait for it with the `ActivityHandle` it returns.
- Make retries safe with an idempotency key so a crash can't double-deliver.
- Reject duplicate submissions at the server with `ACTIVITY_ID_CONFLICT_POLICY_USE_EXISTING`.
- Cap dispatch rate with `WorkerActivitiesPerSecond` and prioritize urgent work.
- Heartbeat a long-running Activity and resume it from the last checkpoint after a crash.
- Reuse the exact same Activity as a step inside a Workflow, with no rewrite.

### Prerequisites

- Familiar with Temporal Activities and Workers at the level [Temporal 101 in Go](https://learn.temporal.io/courses/temporal_101/go/) covers.

:::info Public Preview

Standalone Activities arrived in the Temporal Go SDK in version 1.40.0, and the course repo pins `go.temporal.io/sdk` v1.45.0. `Client.ExecuteActivity`, `client.StartActivityOptions`, and `client.ActivityHandle` are all marked Experimental while the feature is in Public Preview, so pin a recent SDK and expect the API to settle further. They also require Temporal Server 1.31 or newer, which ships bundled with Temporal CLI 1.7 and later.

:::

## Run the lab in your browser (recommended)

This tutorial is built as a Free, hands-on Instruqt lab. Nothing to install: the Temporal Service, the Web UI, and a webhook receiver all boot with the sandbox, so you start writing code immediately.

<div style={{textAlign: 'center', marginBottom: '8px'}}>
  <span style={{
    display: 'inline-block',
    background: 'linear-gradient(135deg, #f97316, #fb923c)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '14px',
    padding: '6px 18px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
    boxShadow: '0 0 12px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.2)',
    animation: 'tryMePulse 2s ease-in-out infinite',
  }}>👇 Try the Free Interactive Lab. No setup.</span>
</div>
<style>{`
  @keyframes tryMePulse {
    0%, 100% { box-shadow: 0 0 12px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.2); }
    50% { box-shadow: 0 0 20px rgba(249,115,22,0.8), 0 0 40px rgba(249,115,22,0.4); }
  }
`}</style>

<iframe
    width="100%"
    height="472"
    sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-popups-to-escape-sandbox"
    src="https://play.instruqt.com/embed/temporal/tracks/standalone-activities-go?token=em_mEn4MYsikOZV2XPX"
    style={{border: 0}}
    allowFullScreen
></iframe>

## Run the code locally (optional)

Prefer to run it yourself? Clone the course repo and start the pieces the sandbox normally boots for you:

You'll need a few things installed first:

- [Git](https://git-scm.com/downloads).
- [Go](https://go.dev/dl/) 1.24 or newer, which is what the course module declares.
- The [Temporal CLI](https://docs.temporal.io/cli#install), which provides the local dev server. Use a recent version so the Standalone Activities features (the `Standalone Activities` UI tab, `temporal activity` commands, conflict policies) are available.

```bash
git clone https://github.com/temporalio/edu-standalone-activities.git
cd edu-standalone-activities/go/course-repo
```

Then, in separate terminals:

```bash
# Webhook receiver (records what your Worker delivers)
go run ./server/webhookreceiver

# Temporal dev server + Web UI on http://localhost:8233
temporal server start-dev --ui-port 8233

# A module's Worker
cd exercise/01-durable-job-queue
go run ./worker

# Submit a job (in another terminal, from the same module folder)
go run ./sendstandalone evt_001
curl http://localhost:9000/_received
```

The whole `course-repo` folder is one Go module, with parallel `exercise/<NN>` (starter code with `TODO` markers) and `solution/<NN>` folders. If you get stuck, diff your work against the matching `solution/` folder.

:::caution Running locally is unsupported

You may hit environment setup issues (Go version, module downloads, port conflicts, Temporal CLI installation) that we can't control or support. The Instruqt lab is the supported path. Use localhost only if you're comfortable troubleshooting your own setup.

:::

## Module 1: Submit a durable job with one API call

Running background jobs the traditional way means wiring up several moving parts yourself: a **broker** to hold the jobs until something runs them, a **scheduler** to decide when they run, and **retry logic** re-written in every service. Glue those together and you've built a **Tier-0 system** (one everything depends on, so it can never go down) that someone has to keep alive. Temporal doesn't make those concerns disappear, but it **consolidates** them onto one platform instead of four systems you stitch together. You write a regular Activity function and submit it with a single call; Temporal holds the job, schedules it, and retries it for you:

```go
// DeliverWebhook is a regular Go function; nothing here marks it "standalone".
func DeliverWebhook(ctx context.Context, req WebhookDelivery) (int, error) {
	body, _ := json.Marshal(req.Payload)
	resp, err := http.Post(req.URL, "application/json", bytes.NewReader(body))
	if err != nil {
		return 0, err // a network error returns an error, so Temporal retries
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return 0, fmt.Errorf("HTTP %d", resp.StatusCode) // a 4xx/5xx too, so Temporal retries
	}
	return resp.StatusCode, nil
}
```

```go
handle, err := c.ExecuteActivity(context.Background(), client.StartActivityOptions{
	ID:                  "deliver-" + eventID,
	TaskQueue:           webhook.TaskQueue,
	StartToCloseTimeout: 10 * time.Second,
}, webhook.DeliverWebhook, req)
if err != nil {
	log.Fatalln("Unable to start standalone activity", err)
}

var status int
err = handle.Get(context.Background(), &status) // blocks until the job finishes
```

There's no "standalone" wrapper and no Workflow function. Standalone versus inside-a-Workflow is decided by _how_ the Activity is called, not how it's defined: `DeliverWebhook` is an ordinary function either way.

Worth noting if you've read this tutorial in another language: the Go SDK gives you a single `ExecuteActivity` method rather than a start/execute pair. It returns as soon as the job is durably persisted, and the `ActivityHandle` it hands back is where you wait for the result (`Get`), inspect it (`Describe`), or stop it (`Cancel`, `Terminate`). Skip the `Get` and it's fire-and-forget: your process can exit and Temporal still runs the job to completion.

The job is **addressable** (a stable ID you can query, cancel, or terminate), **durable** (persisted before your Worker sees it), and **observable** in the Temporal UI under the **Standalone Activities** tab:

![Temporal UI showing a completed Standalone Activity in the Standalone Activities tab](https://raw.githubusercontent.com/temporalio/edu-standalone-activities/main/python/diagrams/standalone-activity-ui.png)

To be clear about what _doesn't_ change: your application's own data still lives in your database, and someone still operates Temporal (your team, or Temporal Cloud). What you stop doing is running a separate broker, scheduler, and retry layer and wiring them together.

> **Check your understanding:** your job hits a transient 503 on attempt 1. With Temporal's default retry policy, what happens?

<details>
<summary>Answer</summary>

Temporal sees the returned error, waits the initial retry interval (1s by default), and dispatches the job again with exponential backoff. You wrote no retry code; you configured it on the Activity options. The job stays "Running" in the UI and the attempt counter increments. In a traditional job queue, that retry behavior is something you re-implement per service.

</details>

<div className="card padding--lg margin-vert--lg" style={{textAlign: 'center'}}>
  <h2 className="margin-bottom--sm">Never miss a new tutorial</h2>
  <p className="margin-bottom--md">Be the first to know when we ship new tutorials, courses, and hands-on guides. No spam, unsubscribe anytime.</p>
  <Link className="button button--primary button--lg" to="https://pages.temporal.io/get-updates-education">
    Join the Temporal education list →
  </Link>
    <p className="margin-bottom--md">No spam, unsubscribe anytime.</p>
</div>

## Module 2: Make retries safe with idempotency

Temporal guarantees your Activity runs to completion _at least once_, not exactly once. If the POST lands and then the attempt errors (a 500, a dropped network, a Worker crash after the POST), Temporal retries the whole Activity body and the receiver gets the same delivery twice. The fix is a **stable** idempotency key the receiver dedupes on:

```go
httpReq.Header.Set("Content-Type", "application/json")
// The event id is stable across retries, so every attempt POSTs the same
// logical delivery key and the receiver dedupes the side effect.
httpReq.Header.Set("Idempotency-Key", "webhook:"+req.EventID)
```

The key is derived from the logical event id, so it's identical across every retry of that event. Don't call `uuid.NewString()` inside the Activity: a fresh key per attempt dedupes nothing. At-least-once delivery (Temporal) + idempotency (your Activity and receiver) = effectively-once side effects.

Step through the with/without comparison:

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/idempotency-demo/index.html" width="100%" height="560" frameBorder="0" style={{border: 0, borderRadius: '8px'}}></iframe>

> **Check your understanding:** your Activity builds the `Idempotency-Key` from a `uuid.NewString()` generated inside the Activity. What breaks on retry?

<details>
<summary>Answer</summary>

Each retry generates a _different_ random value, so the key changes per attempt and the receiver accepts every one. Make the key deterministic across retries: derive it from input the caller chose (`req.EventID`), or for workflow-bound Activities combine `WorkflowExecution.RunID` and `ActivityID` from `activity.GetInfo(ctx)`. If you need the random value as part of the side effect, generate it in the caller and pass it in as input.

</details>

## Module 3: Reject duplicate jobs at the platform

Module 2 handled Temporal's _own_ retries. This module handles a different duplicate: your upstream (Stripe, GitHub, a customer's service) sends the same event twice and you call `ExecuteActivity` twice. By default the second call returns an already-started error, because the default `ActivityIDConflictPolicy` is `FAIL`. One field makes the server return a handle to the existing Activity instead:

```go
import enums "go.temporal.io/api/enums/v1"

handle, err := c.ExecuteActivity(ctx, client.StartActivityOptions{
	ID:        "deliver-" + eventID,
	TaskQueue: webhook.TaskQueue,
	// ...
	ActivityIDConflictPolicy: enums.ACTIVITY_ID_CONFLICT_POLICY_USE_EXISTING,
}, webhook.DeliverWebhook, req)
```

Both calls now succeed, `handle.GetRunID()` returns the **same run ID** for each, and the duplicate never reaches a Worker. This is scheduling-layer dedup; it composes with the receiver-side idempotency key from Module 2.

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/conflict-policy-demo/index.html" width="100%" frameBorder="0" style={{border: 0, borderRadius: '8px', height: 'calc(100vh - 120px)', minHeight: '520px'}}></iframe>

> **Check your understanding:** with `USE_EXISTING` set, you submit `ID: "deliver-evt_001"` twice, but the second call arrives 60 seconds _after_ the first one already completed. What happens?

<details>
<summary>Answer</summary>

A **new** execution starts. `ActivityIDConflictPolicy` only governs duplicates while the original is _in flight_. Once it completes, `ActivityIDReusePolicy` takes over, and its default (`ALLOW_DUPLICATE`) accepts a fresh run. For dedup across both windows, also set `ActivityIDReusePolicy: enums.ACTIVITY_ID_REUSE_POLICY_REJECT_DUPLICATE`.

</details>

## Module 4: Cap throughput and prioritize urgent jobs

By default the Worker executes Activities as fast as it can process them, which may be faster than the downstream service allows. If the receiver is rate-limited, you will get a flood of "Too Many Requests" errors and climbing retry counts:

![A rate-limited Standalone Activity in the Temporal UI: status Running, attempt count climbing, last failure HTTP 429](https://raw.githubusercontent.com/temporalio/edu-standalone-activities/main/python/diagrams/rate-limited-activity-running.png)

The problem here isn't one slow job; it's the _combined_ request rate of every delivery hitting a receiver that only allows so many per second. Temporal retries each Activity on its own, which fixes a one-off failure but can't fix a total-rate problem: every retry is just another request piling onto an already-overloaded receiver. The fix is to slow how fast the work goes out. One field on the Worker does it:

```go
w := worker.New(c, webhook.TaskQueue, worker.Options{
	MaxConcurrentActivityExecutionSize: 10,
	WorkerActivitiesPerSecond:          2, // cap how fast this Worker starts Activities
})
w.RegisterActivity(webhook.DeliverWebhook)
```

Excess work waits in the Task Queue on the server, dispatched at the configured rate. Nothing is dropped. The companion control is the `Priority` field on `client.StartActivityOptions`, a `temporal.Priority` with `PriorityKey`, `FairnessKey`, and `FairnessWeight`: a lower `PriorityKey` jumps urgent work ahead of a backlog, and the fairness fields stop one busy tenant from starving the rest. See [Task Queue Priority and Fairness](https://docs.temporal.io/develop/task-queue-priority-fairness).

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/rate-limit-priority-demo/index.html" width="100%" height="540" frameBorder="0" style={{border: 0, borderRadius: '8px'}}></iframe>

> **Check your understanding:** your downstream API allows 100 req/sec. You set `WorkerActivitiesPerSecond: 10` on one Worker. Are you safe?

<details>
<summary>Answer</summary>

For this exact setup, one Worker, yes, but you're only using 10% of the downstream's 100 req/sec headroom. The catch: `WorkerActivitiesPerSecond` is _per Worker_, not global. Add a second Worker and you're at 20/sec; run 11 and you're at 110/sec, past the limit. So "safe" only holds while the Worker count stays fixed. For a cap that holds no matter how many Workers poll the queue, use `TaskQueueActivitiesPerSecond`.

</details>

## Module 5: Heartbeat progress and resume after a crash

A Standalone Activity that processes a batch can run for minutes. If the Worker crashes mid-batch, you don't want the retry to redo everything. Standalone Activities have heartbeats built in: `activity.RecordHeartbeat(ctx, progress)` stores a checkpoint on the server, and the next attempt reads it back:

```go
startIndex := 0
if activity.HasHeartbeatDetails(ctx) {
	var checkpoint int
	if err := activity.GetHeartbeatDetails(ctx, &checkpoint); err == nil {
		startIndex = checkpoint // resume from the last checkpoint
	}
}
// ... deliver items from startIndex, calling activity.RecordHeartbeat(ctx, delivered) after each one
```

Pair it with the `HeartbeatTimeout` field on your submit options so the server detects a dead or stuck attempt in seconds instead of waiting out the full `StartToCloseTimeout`. Heartbeating is also how cancellation reaches a running Activity. No side database required.

> **Check your understanding:** your batch Activity has a 5-second `HeartbeatTimeout` and processes one item per second. Mid-batch the Worker _hangs_ (a deadlock, not a crash) and stops heartbeating. What does Temporal do?

<details>
<summary>Answer</summary>

After 5 seconds with no heartbeat, Temporal treats the attempt as dead, the same as a crash, and schedules a retry on whatever Worker picks it up next. That's the point of `HeartbeatTimeout`: a liveness signal that lets the server route around a stuck Worker quickly, rather than waiting for the much longer `StartToCloseTimeout`.

</details>

## Module 6: Same code runs anywhere

Traditional job queues paint you into a corner: the queue runs jobs, orchestration lives elsewhere, and code gets rewritten when a job becomes multi-step. With Temporal, the exact same Activity runs both ways. Submit `DeliverWebhook` directly _or_ call it as a step inside a Workflow:

```go
// WebhookWorkflow runs the SAME DeliverWebhook Activity as a Workflow step.
func WebhookWorkflow(ctx workflow.Context, req WebhookDelivery) (int, error) {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	})
	var status int
	err := workflow.ExecuteActivity(ctx, DeliverWebhook, req).Get(ctx, &status)
	return status, err
}
```

One Worker hosts both, with `w.RegisterActivity(webhook.DeliverWebhook)` next to `w.RegisterWorkflow(webhook.WebhookWorkflow)`, and the Activity doesn't know whether it was invoked as a Standalone Activity or a Workflow step. That's the differentiator: one tool for jobs and orchestration. With Temporal the same Activity becomes a step in a Workflow on the same platform: same retries, timeouts, and visibility, and no second system to run.

At Replay 2026, Coinbase described migrating their custom Background Jobs Service, which handles 200–600 million jobs per day across 186 namespaces, onto Standalone Activities, letting one platform replace a separate job queue and orchestrator. ([Watch the talk](https://www.youtube.com/watch?v=zsF5Y-IOMOw).)

## Wrap-up

You now know how to use Standalone Activities in Go to:

- **Submit a durable job** with `client.Client.ExecuteActivity` and wait on the returned `ActivityHandle`, no Workflow required.
- **Make retries safe** with a stable idempotency key for external writes.
- **Dedup duplicate submissions** at the server with `ACTIVITY_ID_CONFLICT_POLICY_USE_EXISTING`.
- **Pace and prioritize** with `WorkerActivitiesPerSecond` and `temporal.Priority`.
- **Checkpoint long-running jobs** with `activity.RecordHeartbeat` + `HeartbeatTimeout`.
- **Reuse the same Activity from a Workflow** when the work grows into orchestration.

Temporal lets you start with a job and move to a Workflow when the work grows, and the Activity code comes with you.

Ready to build it for real? Launch the hands-on lab using the sign-up form at the [top of this page](#run-the-lab-in-your-browser-recommended).

📝 **Feedback on this tutorial?** [Share your thoughts in our quick form](https://forms.gle/hbTUjkHB6dkucEg27). It helps us improve.
