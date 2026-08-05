---
id: standalone-activities-java
title: Build a Job Queue with Standalone Activities
sidebar_position: 1
description: Build a durable webhook delivery service in Java using Temporal's Standalone Activities, Temporal's durable job queue, then run it hands-on in an Instruqt lab.
keywords: [Java, temporal, sdk, tutorial, standalone activities, job queue]
tags:
  - Java
image: /img/temporal-logo-twitter-card.png
last_update:
  date: 2026-07-30
---

import Link from '@docusaurus/Link';

<img className="banner" src="/img/sdk_banners/banner_java.png" alt="Temporal Java SDK" />

### Introduction

_By [Angela Zhou](https://www.linkedin.com/in/zhoua1115/)_, Senior Developer Advocate at Temporal

You're going to build a durable webhook delivery service.

When something happens in your application, such as a payment clearing, an order shipping, or a user signing up, you POST to a URL another team gave you. Doing it durably means three things: retry if the network fails, retry if the receiver returns a 500, and never double-deliver if your service crashes mid-send.

**Standalone Activities are Temporal's durable job queue.** You write a regular `@ActivityInterface` method and submit it with one API call. Temporal persists it, retries it on failure, and makes it visible in the UI, with no broker, scheduler, or result store for you to operate.

### What you'll learn

By the end you'll be able to:

- Submit an Activity as a durable, addressable job with `ActivityClient.execute` / `ActivityClient.start`.
- Make retries safe with an idempotency key so a crash can't double-deliver.
- Reject duplicate submissions at the server with `ActivityIdConflictPolicy.ACTIVITY_ID_CONFLICT_POLICY_USE_EXISTING`.
- Cap dispatch rate with `setMaxWorkerActivitiesPerSecond` and prioritize urgent work.
- Heartbeat a long-running Activity and resume it from the last checkpoint after a crash.
- Reuse the exact same Activity as a step inside a Workflow, with no rewrite.

### Prerequisites

- Familiar with Temporal Activities and Workers at the level [Temporal 101 in Java](https://learn.temporal.io/courses/temporal_101/java/) covers.

:::info Public Preview

Standalone Activities arrived in the Temporal Java SDK in version 1.35.0, and the course repo pins 1.36.1. `ActivityClient`, `StartActivityOptions`, and `ActivityHandle` are annotated `@Experimental` while the feature is in Public Preview, so pin a recent SDK and expect the API to settle further. They also require Temporal Server 1.31 or newer, which ships bundled with Temporal CLI 1.7 and later.

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
    src="https://play.instruqt.com/embed/temporal/tracks/standalone-activities-java"
    style={{border: 0}}
    allowFullScreen
></iframe>

## Run the code locally (optional)

Prefer to run it yourself? Clone the course repo and start the pieces the sandbox normally boots for you:

You'll need a few things installed first:

- [Git](https://git-scm.com/downloads).
- A [JDK](https://adoptium.net/temurin/releases/) 21 or newer. Each module declares a Java 21 Gradle toolchain.
- [Gradle](https://gradle.org/install/). The modules are plain Gradle projects with no wrapper checked in, so you run them with an installed `gradle`.
- [Python](https://www.python.org/downloads/) 3. The webhook receiver is a shared, standard-library-only script reused across the language tracks, so it isn't vendored into the Java folder.
- The [Temporal CLI](https://docs.temporal.io/cli#install), which provides the local dev server. Use a recent version so the Standalone Activities features (the `Standalone Activities` UI tab, `temporal activity` commands, conflict policies) are available.

```bash
git clone https://github.com/temporalio/edu-standalone-activities.git
cd edu-standalone-activities/java
```

Then, in separate terminals:

```bash
# Webhook receiver (records what your Worker delivers)
python3 ../shared/webhook-receiver/webhook_receiver.py

# Temporal dev server + Web UI on http://localhost:8233
temporal server start-dev --ui-port 8233

# A module's Worker
cd course-repo/exercise/01-durable-job-queue
gradle -q execute -PmainClass=webhook.Worker

# Submit a job (in another terminal, from the same module folder)
gradle -q execute -PmainClass=webhook.SendStandalone -PappArgs=evt_001
curl http://localhost:9000/_received
```

Each module has parallel `course-repo/exercise/<NN>` (starter code with `TODO` markers) and `course-repo/solution/<NN>` folders, and each one is a self-contained Gradle project. If you get stuck, diff your work against the matching `solution/` folder.

:::caution Running locally is unsupported

You may hit environment setup issues (JDK version, Gradle installation, dependency downloads, port conflicts, Temporal CLI installation) that we can't control or support. The Instruqt lab is the supported path. Use localhost only if you're comfortable troubleshooting your own setup.

:::

## Module 1: Submit a durable job with one API call

Running background jobs the traditional way means wiring up several moving parts yourself: a **broker** to hold the jobs until something runs them, a **scheduler** to decide when they run, and **retry logic** re-written in every service. Glue those together and you've built a **Tier-0 system** (one everything depends on, so it can never go down) that someone has to keep alive. Temporal doesn't make those concerns disappear, but it **consolidates** them onto one platform instead of four systems you stitch together. You write a regular Activity and submit it with a single call; Temporal holds the job, schedules it, and retries it for you:

```java
// A regular annotated interface; nothing here marks it "standalone".
@ActivityInterface
public interface WebhookActivities {
    int deliverWebhook(WebhookDelivery request);
}
```

```java
public class WebhookActivitiesImpl implements WebhookActivities {
    private static final HttpClient httpClient = HttpClient.newHttpClient();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public int deliverWebhook(WebhookDelivery request) {
        try {
            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(request.getUrl()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            objectMapper.writeValueAsString(request.getPayload())))
                    .build();
            HttpResponse<String> response =
                    httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new RuntimeException("HTTP " + response.statusCode()); // a 4xx/5xx throws, so Temporal retries
            }
            return response.statusCode();
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e); // a network error throws too, so Temporal retries
        }
    }
}
```

Submitting it is one call on an `ActivityClient`, the job-queue sibling of the `WorkflowClient` you already know:

```java
ActivityClient client = ActivityClient.newInstance(
        service, ActivityClientOptions.newBuilder().setNamespace("default").build());

StartActivityOptions options = StartActivityOptions.newBuilder()
        .setId("deliver-" + eventId)
        .setTaskQueue(Webhook.TASK_QUEUE)
        .setStartToCloseTimeout(Duration.ofSeconds(10))
        .build();

int status = client.execute(
        WebhookActivities.class, WebhookActivities::deliverWebhook, options, request);
```

There's no "standalone" annotation and no Workflow interface. Standalone versus inside-a-Workflow is decided by _how_ the Activity is called, not how it's defined: the same `@ActivityInterface` method reference works either way. The job is **addressable** (a stable ID you can query, cancel, or terminate), **durable** (persisted before your Worker sees it), and **observable** in the Temporal UI under the **Standalone Activities** tab:

![Temporal UI showing a completed Standalone Activity in the Standalone Activities tab](https://raw.githubusercontent.com/temporalio/edu-standalone-activities/main/python/diagrams/standalone-activity-ui.png)

To be clear about what _doesn't_ change: your application's own data still lives in your database, and someone still operates Temporal (your team, or Temporal Cloud). What you stop doing is running a separate broker, scheduler, and retry layer and wiring them together.

> **Check your understanding:** your job hits a transient 503 on attempt 1. With Temporal's default retry policy, what happens?

<details>
<summary>Answer</summary>

Temporal sees the thrown exception, waits the initial retry interval (1s by default), and dispatches the job again with exponential backoff. You wrote no retry code; you configured it on the Activity options. The job stays "Running" in the UI and the attempt counter increments. In a traditional job queue, that retry behavior is something you re-implement per service.

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

```java
HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(request.getUrl()))
        .header("Content-Type", "application/json")
        // The event id is stable across retries, so every attempt POSTs the same
        // logical delivery key and the receiver dedupes the side effect.
        .header("Idempotency-Key", "webhook:" + request.getEventId())
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
```

The key is derived from the logical event id, so it's identical across every retry of that event. Don't use `UUID.randomUUID()`: a fresh key per attempt dedupes nothing. At-least-once delivery (Temporal) + idempotency (your Activity and receiver) = effectively-once side effects.

Step through the with/without comparison:

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/idempotency-demo/index.html" width="100%" height="560" frameBorder="0" style={{border: 0, borderRadius: '8px'}}></iframe>

> **Check your understanding:** your Activity builds the `Idempotency-Key` from a `UUID.randomUUID()` generated inside the Activity. What breaks on retry?

<details>
<summary>Answer</summary>

Each retry generates a _different_ random value, so the key changes per attempt and the receiver accepts every one. Make the key deterministic across retries: derive it from input the caller chose (`request.getEventId()`), or for workflow-bound Activities combine `getWorkflowRunId()` and `getActivityId()` from `Activity.getExecutionContext().getInfo()`. If you need the random value as part of the side effect, generate it in the caller and pass it in as input.

</details>

## Module 3: Reject duplicate jobs at the platform

Module 2 handled Temporal's _own_ retries. This module handles a different duplicate: your upstream (Stripe, GitHub, a customer's service) sends the same event twice and you call `ActivityClient.start` twice. By default the second call with the same Activity ID errors out. One option makes the server return a handle to the existing Activity instead:

```java
import io.temporal.api.enums.v1.ActivityIdConflictPolicy;

StartActivityOptions options = StartActivityOptions.newBuilder()
        .setId("deliver-" + eventId)
        // ...
        .setIdConflictPolicy(ActivityIdConflictPolicy.ACTIVITY_ID_CONFLICT_POLICY_USE_EXISTING)
        .build();

ActivityHandle<Integer> handle = client.start(
        WebhookActivities.class, WebhookActivities::deliverWebhook, options, request);
```

Both calls now return a handle for the **same running Activity**, and the duplicate never reaches a Worker. This is scheduling-layer dedup; it composes with the receiver-side idempotency key from Module 2.

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/conflict-policy-demo/index.html" width="100%" frameBorder="0" style={{border: 0, borderRadius: '8px', height: 'calc(100vh - 120px)', minHeight: '520px'}}></iframe>

> **Check your understanding:** with `USE_EXISTING` set, you call `client.start` with `setId("deliver-evt_001")` twice, but the second call arrives 60 seconds _after_ the first one already completed. What happens?

<details>
<summary>Answer</summary>

A **new** execution starts. The ID conflict policy only governs duplicates while the original is _in flight_. Once it completes, the ID reuse policy takes over, and its default (`ACTIVITY_ID_REUSE_POLICY_ALLOW_DUPLICATE`) accepts a fresh run. For dedup across both windows, also set `.setIdReusePolicy(ActivityIdReusePolicy.ACTIVITY_ID_REUSE_POLICY_REJECT_DUPLICATE)`.

</details>

## Module 4: Cap throughput and prioritize urgent jobs

By default the Worker executes Activities as fast as it can process them, which may be faster than the downstream service allows. If the receiver is rate-limited, you will get a flood of "Too Many Requests" errors and climbing retry counts:

![A rate-limited Standalone Activity in the Temporal UI: status Running, attempt count climbing, last failure HTTP 429](https://raw.githubusercontent.com/temporalio/edu-standalone-activities/main/python/diagrams/rate-limited-activity-running.png)

The problem here isn't one slow job; it's the _combined_ request rate of every delivery hitting a receiver that only allows so many per second. Temporal retries each Activity on its own, which fixes a one-off failure but can't fix a total-rate problem: every retry is just another request piling onto an already-overloaded receiver. The fix is to slow how fast the work goes out. One option on the Worker does it:

```java
WorkerOptions options = WorkerOptions.newBuilder()
        .setMaxConcurrentActivityExecutionSize(10)
        .setMaxWorkerActivitiesPerSecond(2) // cap how fast this Worker starts Activities
        .build();

var worker = factory.newWorker(Webhook.TASK_QUEUE, options);
worker.registerActivitiesImplementations(new WebhookActivitiesImpl());
```

Excess work waits in the Task Queue on the server, dispatched at the configured rate. Nothing is dropped. The companion control is `StartActivityOptions.setPriority`, which takes a `Priority` built from `setPriorityKey`, `setFairnessKey`, and `setFairnessWeight`: a lower priority key jumps urgent work ahead of a backlog, and the fairness fields stop one busy tenant from starving the rest. See [Task Queue Priority and Fairness](https://docs.temporal.io/develop/task-queue-priority-fairness).

<iframe src="https://raw.githack.com/temporalio/edu-standalone-activities/main/docs/rate-limit-priority-demo/index.html" width="100%" height="540" frameBorder="0" style={{border: 0, borderRadius: '8px'}}></iframe>

> **Check your understanding:** your downstream API allows 100 req/sec. You set `setMaxWorkerActivitiesPerSecond(10)` on one Worker. Are you safe?

<details>
<summary>Answer</summary>

For this exact setup, one Worker, yes, but you're only using 10% of the downstream's 100 req/sec headroom. The catch: `setMaxWorkerActivitiesPerSecond` is _per Worker_, not global. Add a second Worker and you're at 20/sec; run 11 and you're at 110/sec, past the limit. So "safe" only holds while the Worker count stays fixed. For a cap that holds no matter how many Workers poll the queue, use `setMaxTaskQueueActivitiesPerSecond`.

</details>

## Module 5: Heartbeat progress and resume after a crash

A Standalone Activity that processes a batch can run for minutes. If the Worker crashes mid-batch, you don't want the retry to redo everything. Standalone Activities have heartbeats built in: `context.heartbeat(progress)` stores a checkpoint on the server, and the next attempt reads it back:

```java
ActivityExecutionContext context = Activity.getExecutionContext();

int startIndex = 0;
Optional<Integer> checkpoint = context.getHeartbeatDetails(Integer.class);
if (checkpoint.isPresent()) {
    startIndex = checkpoint.get(); // resume from the last checkpoint
}
// ... deliver items from startIndex, calling context.heartbeat(delivered) after each one
```

Pair it with `.setHeartbeatTimeout(Duration.ofSeconds(5))` on the submit call so the server detects a dead or stuck attempt in seconds instead of waiting out the full start-to-close timeout. Heartbeating is also how cancellation reaches a running Activity. No side database required.

> **Check your understanding:** your batch Activity has a 5-second heartbeat timeout and processes one item per second. Mid-batch the Worker _hangs_ (a deadlock, not a crash) and stops heartbeating. What does Temporal do?

<details>
<summary>Answer</summary>

After 5 seconds with no heartbeat, Temporal treats the attempt as dead, the same as a crash, and schedules a retry on whatever Worker picks it up next. That's the point of the heartbeat timeout: a liveness signal that lets the server route around a stuck Worker quickly, rather than waiting for the much longer start-to-close timeout.

</details>

## Module 6: Same code runs anywhere

Traditional job queues paint you into a corner: the queue runs jobs, orchestration lives elsewhere, and code gets rewritten when a job becomes multi-step. With Temporal, the exact same Activity runs both ways. Submit `deliverWebhook` directly _or_ call it as a step inside a Workflow:

```java
public class WebhookWorkflowImpl implements WebhookWorkflow {
    private final WebhookActivities activities = Workflow.newActivityStub(
            WebhookActivities.class, // the SAME interface
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofSeconds(10))
                    .build());

    @Override
    public int run(WebhookDelivery request) {
        return activities.deliverWebhook(request);
    }
}
```

The same Worker registers both, and the Activity doesn't know whether it was invoked as a Standalone Activity or a Workflow step. That's the differentiator: one tool for jobs and orchestration. With Temporal the same Activity becomes a step in a Workflow on the same platform: same retries, timeouts, and visibility, and no second system to run.

At Replay 2026, Coinbase described migrating their custom Background Jobs Service, which handles 200–600 million jobs per day across 186 namespaces, onto Standalone Activities, letting one platform replace a separate job queue and orchestrator. ([Watch the talk](https://www.youtube.com/watch?v=zsF5Y-IOMOw).)

## Wrap-up

You now know how to use Standalone Activities in Java to:

- **Submit a durable job** with `ActivityClient.execute` / `ActivityClient.start`, no Workflow required.
- **Make retries safe** with a stable idempotency key for external writes.
- **Dedup duplicate submissions** at the server with `ActivityIdConflictPolicy.ACTIVITY_ID_CONFLICT_POLICY_USE_EXISTING`.
- **Pace and prioritize** with `setMaxWorkerActivitiesPerSecond` and `StartActivityOptions.setPriority`.
- **Checkpoint long-running jobs** with `context.heartbeat()` + a heartbeat timeout.
- **Reuse the same Activity from a Workflow** when the work grows into orchestration.

Temporal lets you start with a job and move to a Workflow when the work grows, and the Activity code comes with you.

Ready to build it for real? Launch the hands-on lab using the sign-up form at the [top of this page](#run-the-lab-in-your-browser-recommended).

📝 **Feedback on this tutorial?** [Share your thoughts in our quick form](https://forms.gle/hbTUjkHB6dkucEg27). It helps us improve.
