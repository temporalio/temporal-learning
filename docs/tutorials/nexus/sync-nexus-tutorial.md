---
id: nexus-sync-tutorial
sidebar_position: 1
keywords: [nexus, temporal]
tags: [nexus, temporal]
last_update:
  date: 2026-03-17
  author: Nikolay Advolodkin
  editor: Angela Zhou
title: Decoupling Temporal Services with Nexus
description: Learn how to decouple teams with Temporal Nexus
image: /img/temporal-logo-twitter-card.png
---

# Decoupling Temporal Services with Nexus

##### Author: Nikolay Advolodkin    |   Editor: Angela Zhou

In this walkthrough, you'll take a monolithic Temporal application — where Payments and Compliance share a single Worker — and split it into two independently deployable services connected through [Temporal Nexus](https://docs.temporal.io/nexus). 

You'll define a shared service contract, implement a synchronous Nexus handler, and rewire the caller — all while keeping the exact same business logic and workflow behavior. By the end, you'll understand how Nexus lets teams decouple without sacrificing durability.

## What you'll learn

- Register a Nexus Endpoint using the Temporal CLI
- Define a shared Nexus Service contract between teams with `@Service` and `@Operation`
- Implement a synchronous Nexus handler with `@ServiceImpl` and `@OperationImpl`
- Swap a local Activity call for a durable cross-team Nexus call
- Inspect Nexus operations in the Web UI Event History

## Prerequisites

Before you begin this walkthrough, ensure you have:

- Knowledge of Java
- Knowledge of Temporal including [Workflows](https://docs.temporal.io/workflows), [Activities](https://docs.temporal.io/activities), and [Workers](https://docs.temporal.io/workers)
- Clone this [repository](https://github.com/temporalio/edu-nexus-code/)

## Scenario

You work at a bank where every payment flows through **three steps**:

1. **Validate** the payment (amount, accounts)
2. **Check compliance** (risk assessment, sanctions screening)
3. **Execute** the payment (call the gateway)

Two teams split this work:

<table>
<tr>
<th>Team</th>
<th>Owns</th>
<th>Task Queue</th>
</tr>
<tr>
<td><strong>Payments</strong></td>
<td>Steps 1 &amp; 3 — validate and execute</td>
<td><code>payments-processing</code></td>
</tr>
<tr>
<td><strong>Compliance</strong></td>
<td>Step 2 — risk assessment &amp; regulatory checks</td>
<td><code>compliance-risk</code></td>
</tr>
</table>

### The Problem

Right now, **both teams' code runs on the same Worker**. One process. One deployment. One blast radius. 

Use the interactive diagram below to why this matters:

<iframe src="/html/nexus-decouple.html" width="100%" height="900" style={{border: 'none', borderRadius: '8px'}} title="Interactive: Monolith vs Nexus architecture"></iframe>

That's a problem because the Compliance team deals with sensitive regulatory work — OFAC sanctions screening, anti-money laundering (AML) monitoring, risk decisions — that requires stricter access controls, separate audit trails, and its own release cycle. Payments has none of those constraints. But because both teams share a single process, they're forced into the same failure domain, the same security perimeter, and the same deploy pipeline.

In practice, that shared fate plays out like this: Compliance ships a bug at 3 AM. Their code crashes. But it's running on the Payments Worker — so **Payments goes down too**. Same blast radius. Same 3 AM page. Two teams, one shared fate.

The obvious fix is splitting them into microservices with REST calls. But that introduces a new problem: if Compliance is down when Payments calls it, the request is lost. No retries. No durability. You're writing your own retry loops, circuit breakers, and dead letter queues. You've traded one problem for three.

### The Solution: Temporal Nexus

[**Nexus**](https://docs.temporal.io/nexus) gives you team boundaries **with** durability. Each team gets its own Worker, its own deployment pipeline, its own security perimeter, its own blast radius — while Temporal manages the durable, type-safe calls between them.

The Payments workflow calls the Compliance team through a Nexus operation. If the Compliance Worker goes down mid-call, the payment workflow just...waits. When Compliance comes back, it picks up exactly where it left off. No retry logic. No data loss. No 3am page for the Payments team.

The best part? The code change is almost invisible:

```java
// BEFORE (monolith — direct activity call):
ComplianceResult compliance = complianceActivity.checkCompliance(compReq);

// AFTER (Nexus — durable cross-team call):
ComplianceResult compliance = complianceService.checkCompliance(compReq);
```

Same method name. Same input. Same output. Completely different architecture.

Here's what happens when the Compliance worker goes down mid-call — and why it doesn't matter:

![Nexus Durability svg](./ui/nexus-durability.svg)

<details>
<summary>Why Nexus over REST or a shared Activity?</summary>

You could split Payments and Compliance into microservices with REST calls. But then you'd write your own retry loops, circuit breakers, and dead letter queues. Here's how the options compare:

| | REST / HTTP | Direct Temporal Activity | Temporal Nexus |
|---|---|---|---|
| **Worker goes down** | Request lost, manual retry | Same crash domain | Workflow pauses, auto-resumes |
| **Retry logic** | Write it yourself | Temporal retries within team | Built-in across the boundary |
| **Type safety** | OpenAPI + code gen | Java interface | Shared Java interface |
| **Human review** | Custom callback URLs | Couple teams together | `@UpdateMethod`, durable wait |
| **Team independence** | Shared failure domain | Shared deployment | Separate workers, blast radii |
| **Code change** | Full rewrite | — | One-line stub swap |

</details>

> **New to Nexus?** Try the [Nexus Quick Start](https://docs.temporal.io/nexus) for a faster path. Come back here for the full decoupling exercise.

---

## Overview

![Architecture Overview: Payments and Compliance teams separated by a Nexus security boundary, with animated data flowing through validate, compliance check, and execute steps](./ui/architecture-overview.svg)

_The Payments team owns validation and execution (left). The Compliance team owns risk assessment, isolated behind a Nexus boundary (right). Data flows left-to-right — and if the Compliance side goes down mid-check, the payment resumes when it comes back._

<details><summary>What You'll Build</summary>

You'll start with a monolith where everything — the payment workflow, payment activities, and compliance checks — runs on a single Worker. By the end, you'll have two independent Workers: one for Payments and one for Compliance, communicating through a Nexus boundary. 

```text
BEFORE (Monolith):                    AFTER (Nexus Decoupled):
┌─────────────────────────┐           ┌──────────────┐    ┌──────────────┐
│   Single Worker         │           │  Payments    │    │  Compliance  │
│   ─────────────         │           │  Worker      │    │  Worker      │
│   Workflow              │           │  ──────      │    │  ──────      │
│   PaymentActivity       │    →      │  Workflow    │◄──►│  NexusHandler│
│   ComplianceActivity    │           │  PaymentAct  │    │  Checker     │
│                         │           │              │    │              │
│   ONE blast radius      │           │  Blast #1    │    │  Blast #2    │
└─────────────────────────┘           └──────────────┘    └──────────────┘
                                                   ▲ Nexus ▲
```

</details>

---

## Checkpoint 0: Run the Monolith

:::tip
Don't forget to clone [this repo](https://github.com/temporalio/edu-nexus-code/) for the exercise!
:::

Before changing anything, let's see the system working. You need **3 terminal windows** and a running Temporal server. Navigate into the `java/decouple-monolith/exercise` directory.

**Terminal 0 — Temporal Server** (if not already running):
```bash
temporal server start-dev
```

**Create namespaces** (one-time setup):
```bash
temporal operator namespace create --namespace payments-namespace
temporal operator namespace create --namespace compliance-namespace
```

**Terminal 1 — Start the monolith worker:**
```bash
cd exercise
mvn compile exec:java@payments-worker
```

You should see:
```log
Payments Worker started on: payments-processing
Registered: PaymentProcessingWorkflow, PaymentActivity
            ComplianceActivity (monolith — will decouple)
```

**Terminal 2 — Run the starter:**
```bash
cd exercise
mvn compile exec:java@starter
```

**Change the namespace in Temporal UI**. You'll find this on the top of the Web UI.

![Three transactions with different risk levels: TXN-A approved (low risk), TXN-B approved (medium risk), TXN-C declined (high risk, OFAC-sanctioned)](./ui/new-namespace.png)

**Expected results:**

<table>
<tr>
<th>Transaction</th>
<th>Amount</th>
<th>Route</th>
<th>Risk</th>
<th>Result</th>
</tr>
<tr>
<td><code>TXN-A</code></td>
<td>$250</td>
<td>US &#x2192; US</td>
<td>LOW</td>
<td><code>COMPLETED</code></td>
</tr>
<tr>
<td><code>TXN-B</code></td>
<td>$12,000</td>
<td>US &#x2192; UK</td>
<td>MEDIUM</td>
<td><code>COMPLETED</code></td>
</tr>
<tr>
<td><code>TXN-C</code></td>
<td>$75,000</td>
<td>US &#x2192; US</td>
<td>HIGH</td>
<td><code>DECLINED_COMPLIANCE</code></td>
</tr>
</table>

**Checkpoint 0 passed** if all 3 transactions complete with the expected results. The system works! Now let's decouple it.

> **Stop the Worker** (Ctrl+C in Terminal 1) before continuing.

:::tip
** Are you enjoying this tutorial?** Feel free to leave feedback with the Feedback widget on the side and [sign up here](https://pages.temporal.io/get-updates-education) to get notified when we drop new educational content!
:::

---

<details>
<summary>Nexus Building Blocks</summary>

Before diving into code, here's a quick map of the 4 Nexus concepts you'll encounter:

```text
Service    →    Operation    →    Endpoint      →      Registry
(contract)      (method)          (routing rule)      (directory)
```

- [**Nexus Service**](https://docs.temporal.io/nexus/services) — A named collection of operations — the contract between teams. In this tutorial, that's the `ComplianceNexusService` interface. Think of it like the Activity interface you already have, but shared across services instead of internal to one Worker.
- [**Nexus Operation**](https://docs.temporal.io/nexus/operations) — A single callable method on a Service, marked with `@Operation` (e.g., `checkCompliance`). This is the Nexus equivalent of an Activity method — the actual work the other team exposes.
- [**Nexus Endpoint**](https://docs.temporal.io/nexus/endpoints) — A named routing rule that connects a caller to the right Namespace and Task Queue, so the caller doesn't need to know where the handler lives. You create `compliance-endpoint` and point it at the `compliance-risk` task queue.
- [**Nexus Registry**](https://docs.temporal.io/nexus/registry) — The directory in Temporal where all Endpoints are registered. You register the endpoint once; callers look it up by name.

</details>

<details>
<summary>Quick match — test yourself!</summary>

Can you match each Nexus concept to what it represents in our payments scenario?

<iframe src="/html/nexus-quick-match.html" width="100%" height="680" style={{border: 'none', borderRadius: '8px'}} title="Nexus Building Blocks — Quick Match"></iframe>

</details>

---

<details>
<summary>The TODOs</summary>

> **Pre-provided:** The `ComplianceWorkflow` interface and implementation are already complete in the exercise. They use Temporal patterns you've already seen — `@WorkflowMethod`, `@UpdateMethod`, and `Workflow.await()`. Your work starts at **TODO 1** — the Nexus-specific parts.

| # | File | Action | Key Concept |
|---|---|---|---|
| **1** | `shared/nexus/ComplianceNexusService.java` | Your work | `@Service` + `@Operation` interface |
| **2** | `compliance/temporal/ComplianceNexusServiceImpl.java` | Your work | `fromWorkflowHandle`: link Nexus op to workflow |
| **3** | `compliance/temporal/ComplianceWorkerApp.java` | Your work | Register workflow + Activity + Nexus handler |
| **4** | `payments/temporal/PaymentProcessingWorkflowImpl.java` | Modify | Replace Activity stub → Nexus stub |
| **5** | `payments/temporal/PaymentsWorkerApp.java` | Modify | Add `NexusServiceOptions`, remove `ComplianceActivity` |
| **6a** | `shared/nexus/ComplianceNexusService.java` | Your work | Add `@Operation submitReview(ReviewRequest)` |
| **6b** | `compliance/temporal/ComplianceNexusServiceImpl.java` | Your work | `OperationHandler.sync`: send Update via Nexus |

**Teaching order:** Service interface (1) → Async handler (2) → Worker (3, CLI) → Caller (4-5) → Sync handler (6a-6b).

</details>

---

## What we're building

### Class Interaction Flow

![Class Interaction Flow](./ui/class-interaction.svg)

## The Compliance Workflow (already in the exercise)

**Files:** [`compliance/temporal/workflow/ComplianceWorkflow.java` ](https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/workflow/ComplianceWorkflow.java) and [`ComplianceWorkflowImpl.java`](https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/workflow/ComplianceWorkflowImpl.java)

Open them and read the code - they show the human-in-the-loop pattern you'll wire up through Nexus later. Here's the interface:

```java
@WorkflowInterface
public interface ComplianceWorkflow {

    @WorkflowMethod
    ComplianceResult run(ComplianceRequest request);

    @UpdateMethod
    ComplianceResult review(boolean approved, String explanation);

    @UpdateValidatorMethod(updateName = "review")
    void validateReview(boolean approved, String explanation);
}
```

Let's look at the three methods:

- **`run()`** (`@WorkflowMethod`) - The main entry point. Calls `ComplianceActivity` to score the transaction's risk, then sleeps 10s (for the Checkpoint 3 durability demo). For LOW and HIGH risk, it returns immediately with an auto-approve or auto-deny. For MEDIUM risk, it calls `Workflow.await()` to durably pause until a human reviewer submits a decision.
- **`review()`** ([`@UpdateMethod`](https://www.javadoc.io/doc/io.temporal/temporal-sdk/latest/io/temporal/workflow/UpdateMethod.html)) - Receives the human reviewer's approve/deny decision while the workflow is paused. Stores the result and unblocks `run()`, which then returns the final `ComplianceResult`.
- **`validateReview()`** (`@UpdateValidatorMethod`) - A guard that rejects review Updates that arrive at the wrong time (e.g., before the workflow is waiting for review, or after a decision has already been made).

:::note
**Why a workflow, not just an Activity?** Using a workflow unlocks [`@UpdateMethod`](https://www.javadoc.io/doc/io.temporal/temporal-sdk/latest/io/temporal/workflow/UpdateMethod.html) for MEDIUM-risk transactions - the workflow can pause and wait durably for a human reviewer's decision. A plain Activity can't do that. In the future, simple cases might just use an Activity (see [standalone Activities](https://docs.temporal.io/standalone-activity#standalone-activity)), but a workflow gives you durability and human escalation for free.
:::

> **Your work starts below at TODO 1.**

---

## TODO 1: Create the Nexus Service Interface

**File:** [`shared/nexus/ComplianceNexusService.java`](https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/shared/nexus/ComplianceNexusService.java)

This is the **shared contract** between teams — like an OpenAPI spec, but durable. Both teams depend on this interface.

**What to add for TODO 1:**
1. `@Service` annotation on the interface - this registers the interface as a Nexus Service so Temporal knows it's a cross-team contract, not just a regular Java interface.
2. `@Operation` annotation on `checkCompliance` - this marks the method as a callable Nexus Operation. Without it, the method is just a Java method signature that Temporal won't expose through the Nexus boundary.

> **Note:** You'll also see a `submitReview` method stub in the file — leave it for TODO 6a. For now, just focus on getting `checkCompliance` wired up.

**Pattern to follow:**
```java
@Service
public interface ComplianceNexusService {
    @Operation
    ComplianceResult checkCompliance(ComplianceRequest request);

    // submitReview — add @Operation in TODO 6a
    ComplianceResult submitReview(ReviewRequest request);
}
```

:::tip
Look in the [solution directory](https://github.com/temporalio/edu-nexus-code/tree/main/java/decouple-monolith/solution) of the exercise repository if you need a hint!
:::

---

## TODO 2: Implement the Nexus Handler

**File:** [`compliance/temporal/ComplianceNexusServiceImpl.java`](https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/ComplianceNexusServiceImpl.java)

This handler receives Nexus requests from Payments. Instead of running business logic directly, it uses `WorkflowRunOperation.fromWorkflowHandle()` to start a `ComplianceWorkflow` and return a *handle* that binds the Nexus operation to that workflow's ID. On retries (transient failures), Temporal matches on the handle and reuses the existing workflow instead of starting a duplicate.

![Nexus handle retry diagram: first call starts a workflow and returns a handle, retries reuse the same workflow instead of creating duplicates](./ui/nexus-handle-retry.svg)

**Add two new annotations:**
- `@ServiceImpl(service = ComplianceNexusService.class)` — on the class
- `@OperationImpl` — on each handler method

**What to implement — three steps:**

**Step 1:** Annotate the class with `@ServiceImpl` to link it to the service interface:
```java
@ServiceImpl(service = ComplianceNexusService.class)
public class ComplianceNexusServiceImpl {
```

**Step 2:** Create an `@OperationImpl` method that returns an `OperationHandler`. Use `WorkflowRunOperation.fromWorkflowHandle` - this is the pattern for wiring a Nexus operation to a long-running workflow:
```java
    @OperationImpl
    public OperationHandler<ComplianceRequest, ComplianceResult> checkCompliance() {
        return WorkflowRunOperation.fromWorkflowHandle((ctx, details, input) -> {
```

**Step 3:** Inside the lambda, get a `WorkflowClient` from the Nexus context, create a workflow stub, and return a `WorkflowHandle` that links this Nexus operation to the workflow:
```java
            WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
            ComplianceWorkflow wf = client.newWorkflowStub(
                    ComplianceWorkflow.class,
                    WorkflowOptions.newBuilder()
                            .setTaskQueue("compliance-risk")
                            .setWorkflowId("compliance-" + input.getTransactionId())
                            .build());

            return WorkflowHandle.fromWorkflowMethod(wf::run, input);
        });
    }
```

<details><summary>Full code:</summary>

```java
@ServiceImpl(service = ComplianceNexusService.class)
public class ComplianceNexusServiceImpl {

    @OperationImpl
    public OperationHandler<ComplianceRequest, ComplianceResult> checkCompliance() {
        return WorkflowRunOperation.fromWorkflowHandle((ctx, details, input) -> {
            WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
            ComplianceWorkflow wf = client.newWorkflowStub(
                    ComplianceWorkflow.class,
                    WorkflowOptions.newBuilder()
                            .setTaskQueue("compliance-risk")
                            .setWorkflowId("compliance-" + input.getTransactionId())
                            .build());

            return WorkflowHandle.fromWorkflowMethod(wf::run, input);
        });
    }
}
```
</details>

### Quick Check

<details>
<summary>Q1: What does <code>@ServiceImpl(service = ComplianceNexusService.class)</code> tell Temporal?</summary>
<code>@ServiceImpl</code> links the handler class to its Nexus service interface. Temporal uses this to route incoming Nexus operations to the correct handler.
</details>

<details><summary>Q2: Why does the sync handler start a workflow instead of calling <code>ComplianceChecker.checkCompliance()</code> directly?</summary>
Sync handlers run inside the Nexus request processing path. They should only use Temporal primitives (workflow starts, queries). Business logic belongs in activities, which are invoked by workflows. This keeps the handler thin and the architecture consistent.</details>

---

## TODO 3: Create the Compliance Worker

**File:** [`compliance/temporal/ComplianceWorkerApp.java`](https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/ComplianceWorkerApp.java)

Standard **CRAWL** pattern, but now with **three registrations**. Open the file - you'll see the Connect, Factory, and Launch steps are already written. The registration lines are commented out. **Uncomment the three lines** inside the "Wire" section:

```java
// TODO: W — Register workflow, activity, and Nexus handler
worker.registerWorkflowImplementationTypes(ComplianceWorkflowImpl.class);
worker.registerActivitiesImplementations(new ComplianceActivityImpl(new ComplianceChecker()));
worker.registerNexusServiceImplementation(new ComplianceNexusServiceImpl());
```

The first two are patterns you already know. The third is new - `registerNexusServiceImplementation` registers your Nexus handler so the worker can receive incoming Nexus calls. Same shape, different method name.

**Task queue:** `"compliance-risk"` — must match the `--target-task-queue` from the CLI endpoint creation. The endpoint tells Temporal *where* to route Nexus calls; the worker polls *that same queue* to pick them up. If these don't match, Nexus calls have nowhere to land.

---

## Checkpoint 1: Compliance Worker Starts

```bash
cd exercise
mvn compile exec:java@compliance-worker
```

**Checkpoint 1 passed** if you see:
```log
Compliance Worker started on: compliance-risk
```

:::danger
If it fails to compile, check:
- TODO 1: Does `ComplianceNexusService` have `@Service` and `@Operation`?
- TODO 2: Does `ComplianceNexusServiceImpl` have `@ServiceImpl` and `@OperationImpl`?
- TODO 3: Are you registering the Workflow, Activity, and Nexus service?
:::

> **Keep the compliance worker running** — you'll need it for Checkpoint 2.

---

## Checkpoint 1.5: Create the Nexus Endpoint

Now that the compliance side is built, register the Nexus endpoint with Temporal. This tells Temporal: *"When someone calls `compliance-endpoint`, route it to the `compliance-risk` task queue in `compliance-namespace`."*

```bash
temporal operator nexus endpoint create \
  --name compliance-endpoint \
  --target-namespace compliance-namespace \
  --target-task-queue compliance-risk
```

You should see:
```log
Endpoint compliance-endpoint created.
```

> **Analogy:** This is like adding a contact to your phone. The endpoint name is the contact name; the task queue + namespace is the phone number. You only do this once.

Without this, the Payments worker (TODO 5) won't know where to route `ComplianceNexusService` calls.

---

## TODO 4: Replace Activity Stub with Nexus Stub

**File:** `payments/temporal/PaymentProcessingWorkflowImpl.java`

This is the **key teaching moment**. You're swapping one line of code that changes the entire architecture.

> **Where does the endpoint come from?** Not here! The workflow only knows the **service** (`ComplianceNexusService`). The **endpoint** (`"compliance-endpoint"`) is configured in the worker (TODO 5). This keeps the workflow portable - you can point it at a different endpoint in staging vs production without changing workflow code.

**BEFORE:**
```java
private final ComplianceActivity complianceActivity =
    Workflow.newActivityStub(ComplianceActivity.class, ACTIVITY_OPTIONS);

// In processPayment():
ComplianceResult compliance = complianceActivity.checkCompliance(compReq);
```

**AFTER:**
```java
private final ComplianceNexusService complianceService = Workflow.newNexusServiceStub(
    ComplianceNexusService.class,
    NexusServiceOptions.newBuilder()
        .setOperationOptions(NexusOperationOptions.newBuilder()
            .setScheduleToCloseTimeout(Duration.ofMinutes(10))
            .build())
        .build());

// In processPayment():
ComplianceResult compliance = complianceService.checkCompliance(compReq);
```

**What changed:** Drag each Nexus replacement to its monolith equivalent:

<iframe src="/html/nexus-match-change.html" width="100%" height="900" style={{border: 'none', borderRadius: '8px'}} title="Match the Change — Monolith to Nexus"></iframe>

---

## TODO 5: Update the Payments Worker

**File:** `payments/temporal/PaymentsWorkerApp.java`

Two changes:

**CHANGE 1:** Register both workflows with `NexusServiceOptions` (maps service to endpoint):
```java
worker.registerWorkflowImplementationTypes(
    WorkflowImplementationOptions.newBuilder()
        .setNexusServiceOptions(Collections.singletonMap(
            "ComplianceNexusService",      // interface name (no package)
            NexusServiceOptions.newBuilder()
                .setEndpoint("compliance-endpoint")  // matches CLI endpoint
                .build()))
        .build(),
    PaymentProcessingWorkflowImpl.class,
    ReviewCallerWorkflowImpl.class);       // both workflows use the same Nexus endpoint
```

**CHANGE 2:** Remove `ComplianceActivityImpl` registration:
```java
// DELETE these lines:
ComplianceChecker checker = new ComplianceChecker();
worker.registerActivitiesImplementations(new ComplianceActivityImpl(checker));
```

> **Analogy:** You're removing the compliance department from your building and adding a phone extension to their new office. The workflow dials the same number (`checkCompliance`), but the call now routes across the street.

---

## Checkpoint 2: Decoupled End-to-End (Automated Decisions)

You need **3 terminal windows** now:

**Terminal 0:** Temporal server (already running)

**Terminal 1 — Compliance worker** (already running from Checkpoint 1, or restart):
```bash
cd exercise
mvn compile exec:java@compliance-worker
```

**Terminal 2 — Payments worker** (restart with your changes):
```bash
cd exercise
mvn compile exec:java@payments-worker
```

**Terminal 3 — Starter:**
```bash
cd exercise
mvn compile exec:java@starter
```

TXN-A and TXN-C each take about 10 seconds (the compliance workflow includes a durable sleep to demonstrate Checkpoint 3). TXN-B ($12K, US→UK) is MEDIUM risk - its `ComplianceWorkflow` scores the risk, then calls `Workflow.await()` to **durably pause** until a human reviewer submits a decision via the `@UpdateMethod`. Until that Update arrives, the workflow (and the Nexus operation bound to it) just waits. That's expected - you'll implement the review path in TODO 6.

**Checkpoint 2 passed** if you see these results:

<table>
<tr>
<th>Transaction</th>
<th>Risk</th>
<th>Result</th>
<th>How</th>
</tr>
<tr>
<td><code>TXN-A</code></td>
<td>LOW</td>
<td><code>COMPLETED</code></td>
<td>Auto-approved (~10s)</td>
</tr>
<tr>
<td><code>TXN-B</code></td>
<td>MEDIUM</td>
<td>Waiting</td>
<td>Paused for human review (you'll complete this in TODO 6)</td>
</tr>
<tr>
<td><code>TXN-C</code></td>
<td>HIGH</td>
<td><code>DECLINED_COMPLIANCE</code></td>
<td>Auto-denied (~10s, amount &gt; $50K)</td>
</tr>
</table>

Two workers, two blast radii, two independent teams. The automated compliance path works end-to-end through Nexus.

> **Check the Temporal UI** at http://localhost:8233 — you should see Nexus operations in the workflow Event History!

---

## Checkpoint 3: Durability Across the Boundary

This is where it gets fun. Let's prove that Nexus is **durable**.

Make sure both workers are running and that any previous workflows have completed or been terminated.

**Terminal 3 — Run the starter:**
```bash
cd exercise
mvn compile exec:java@starter
```

The starter runs TXN-A first. TXN-A has a 10-second durable sleep in `ComplianceWorkflowImpl`. **During that 10-second window:**

**Terminal 1 — Kill the compliance worker (Ctrl+C)**

Now watch what happens:

1. **Terminal 3 (starter)** — hangs. It's waiting for the TXN-A result. No crash, no error.
2. **Temporal UI** (http://localhost:8233) — open the `payment-TXN-A` workflow. You'll see the Nexus operation in a **backing off** state. Temporal knows the compliance worker is gone and is waiting for it to come back.

**Terminal 1 — Restart the compliance worker:**
```bash
cd exercise
mvn compile exec:java@compliance-worker
```

Now watch:

3. **Terminal 1 (compliance worker)** — picks up the work immediately. You'll see `[ComplianceChecker] Evaluating TXN-A` in the logs.
4. **Terminal 3 (starter)** — TXN-A completes with `COMPLETED`. The starter moves on to TXN-B and TXN-C as if nothing happened.
5. **Temporal UI** — the Nexus operation shows as completed. No retries of the payment workflow. No duplicate compliance checks. The system just resumed.

**Checkpoint 3 passed** if TXN-A completes successfully after you restart the compliance worker.

**What just happened:** The payment workflow didn't crash. It didn't timeout. It didn't lose data. It didn't need retry logic. It just... waited. When the compliance worker came back, Temporal automatically routed the pending Nexus operation to it. Durability extends across the team boundary — that's the whole point of Nexus.

---

## TODO 6: Send a Workflow Update via Nexus (Sync Handler)

You used `fromWorkflowHandle` in TODO 2 for **starting** a long-running workflow. Now you'll use `OperationHandler.sync` for **interacting** with an already-running workflow.

### TODO 6a: Add `submitReview` to the service interface

**File:** `shared/nexus/ComplianceNexusService.java`

Add a second operation:
```java
@Operation
ComplianceResult submitReview(ReviewRequest request);
```

### TODO 6b: Implement the sync handler

Now that the contract has the new operation, implement the handler that receives it.

**File:** `compliance/temporal/ComplianceNexusServiceImpl.java`

Add a new `@OperationImpl` method using `OperationHandler.sync`:

```java
@OperationImpl
public OperationHandler<ReviewRequest, ComplianceResult> submitReview() {
    return OperationHandler.sync((ctx, details, input) -> {
        WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
        ComplianceWorkflow wf = client.newWorkflowStub(
                ComplianceWorkflow.class,
                "compliance-" + input.getTransactionId());
        return wf.review(input.isApproved(), input.getExplanation());
    });
}
```

<details><summary>Key differences from TODO 2:</summary>

| | TODO 2 (`checkCompliance`) | TODO 6b (`submitReview`) |
|---|---|---|
| Pattern | `fromWorkflowHandle` | `OperationHandler.sync` |
| What it does | Starts a new long-running workflow | Sends Update to an existing workflow |
| Durability | Async — workflow runs independently | Sync — must complete in 10 seconds |
| Client access | `Nexus.getOperationContext().getWorkflowClient()` | `Nexus.getOperationContext().getWorkflowClient()` |
| Retry behavior | Retries reuse the same workflow | Update is idempotent if workflow ID is stable |
</details>

> **`OperationHandler.sync` must complete within 10 seconds.** This is fine here because the `review()` Update returns immediately — it just stores the result and returns. Any slow operation (Activity, sleep, await) must go in a workflow started via `fromWorkflowHandle`.

### Checkpoint: Complete the Human Review Path

After completing TODOs 6a and 6b, make sure both workers are running and TXN-B is still waiting from Checkpoint 2. If you need to restart, run the starter again first.

**Terminal 4 — Approve TXN-B via Nexus:**
```bash
cd exercise
mvn compile exec:java@review-starter
```

This starts a `ReviewCallerWorkflow` in the payments namespace that calls the `submitReview` Nexus operation. The Compliance team's sync handler receives it, looks up the `compliance-TXN-B` workflow, and sends the `review` Update — all through the Nexus boundary, with no direct access to the compliance workflow internals.

> **Want to deny instead?** Edit `ReviewStarter.java`, change `true` to `false`, and re-run.

You should see the review result returned in Terminal 4, and back in Terminal 3, TXN-B completes with `COMPLETED`.

**Checkpoint passed** if TXN-B completes with `COMPLETED` after running the review starter.

---

## Quiz

Test your understanding before moving on:

<details><summary>Q1: Where is the Nexus endpoint name (<code>compliance-endpoint</code>) configured?</summary>
In <code>PaymentsWorkerApp</code>, via <code>NexusServiceOptions</code> → <code>setEndpoint("compliance-endpoint")</code>. The workflow only knows the service interface. The worker knows the endpoint. This separation keeps the workflow portable.
</details>

<details><summary>Q2: What happens if the Compliance worker is down when the Payments workflow calls <code>checkCompliance()</code>?</summary>
The Nexus operation will be retried by Temporal until the <code>scheduleToCloseTimeout</code> expires (10 minutes in our case). If the Compliance worker comes back within that window, the operation completes successfully. The Payment workflow just waits — no crash, no data loss.</details>

<details>
<summary>Q3: What's the difference between <code>@Service</code><code>/</code><code>@Operation</code> and <code>@ServiceImpl</code><code>/</code><code>@OperationImpl</code>?</summary>

<ul>
<li><code>@Service</code> / <code>@Operation</code> go on the interface — the shared contract both teams depend on</li>
<li><code>@ServiceImpl</code> / <code>@OperationImpl</code> go on the handler class — the implementation that only the Compliance team owns</li>
</ul>

Think of it as: the interface is the menu (shared), the handler is the kitchen (private).
</details>

<details><summary>Q4: What's wrong with using <code>OperationHandler.sync()</code> to back a Nexus operation with a long-running workflow?</summary>

<code>sync()</code> starts a workflow and blocks for its result in a single handler call. If the Nexus operation retries (which happens during timeouts or transient failures), the handler runs again from scratch — starting a duplicate workflow each time.

The fix is <code>WorkflowRunOperation.fromWorkflowHandle()</code>, which returns a handle (like a receipt number) binding the Nexus operation to that workflow's ID. On retries, the infrastructure sees the handle and reuses the existing workflow instead of creating a new one.

**Bad (creates duplicates on retry):**
```java
OperationHandler.sync((ctx, details, input) -> {
    WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
    ComplianceWorkflow wf = client.newWorkflowStub(...);
    WorkflowClient.start(wf::run, input);
    return WorkflowStub.fromTyped(wf).getResult(ComplianceResult.class);
});
```

**Good (retries reuse the same workflow):**
```java
WorkflowRunOperation.fromWorkflowHandle((ctx, details, input) -> {
    WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
    ComplianceWorkflow wf = client.newWorkflowStub(...);
    return WorkflowHandle.fromWorkflowMethod(wf::run, input);
});
```

</details>

<details><summary>Q5: Why does the handler start a workflow instead of calling <code>ComplianceChecker.checkCompliance()</code> directly?</summary>

Sync handlers should only contain **Temporal primitives** — workflow starts and queries. Running arbitrary Java code (like <code>ComplianceChecker.checkCompliance()</code>) in a handler bypasses Temporal's durability guarantees.

The handler starts a ComplianceWorkflow and waits for its result. The actual business logic runs inside an Activity within the workflow, where it gets retries, timeouts, and heartbeats for free. Plus, the workflow can pause for human review via <code>@UpdateMethod</code> — something a direct call could never support.

</details>

---

## What You Built

You started with a monolith and ended with two independent services connected through Nexus:

```text
BEFORE (Monolith):                    AFTER (Nexus Decoupled):
┌─────────────────────────┐           ┌──────────────┐    ┌──────────────┐
│   Single Worker         │           │  Payments    │    │  Compliance  │
│   ─────────────         │           │  Worker      │    │  Worker      │
│   Workflow              │           │  ──────      │    │  ──────      │
│   PaymentActivity       │    →      │  Workflow    │◄──►│  NexusHandler│
│   ComplianceActivity    │           │  PaymentAct  │    │  Checker     │
│                         │           │              │    │              │
│   ONE blast radius      │           │  Blast #1    │    │  Blast #2    │
└─────────────────────────┘           └──────────────┘    └──────────────┘
                                                   ▲ Nexus ▲
```

**Key concepts you used:**

| Concept | What you did |
|---|---|
| `@Service` + `@Operation` | Defined the shared contract between teams |
| `@ServiceImpl` + `@OperationImpl` | Implemented the handler on the Compliance side |
| `fromWorkflowHandle` | Backed a Nexus operation with a long-running workflow (retry-safe) |
| `OperationHandler.sync` | Sent a workflow Update through the Nexus boundary |
| `Workflow.newNexusServiceStub` | Replaced the Activity stub with a Nexus stub (one-line swap) |
| `NexusServiceOptions` | Mapped the service interface to the endpoint in the worker |
| Nexus Endpoint (CLI) | Registered the routing rule: endpoint name to namespace + task queue |

The fundamental pattern: **same method call, different architecture**. The workflow still calls `checkCompliance()` - but the call now crosses a team boundary with full durability.

## What's Next?

From here you can explore more advanced patterns - multi-step compliance pipelines, async human escalation chains, or cross-namespace Nexus operations. See the [Nexus documentation](https://docs.temporal.io/nexus) to go deeper.

Don't forget to [sign up here](https://pages.temporal.io/get-updates-education) to get notified when we drop new educational content!