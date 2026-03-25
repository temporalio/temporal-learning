# Tutorial Announcement: Decoupling Temporal Services with Nexus

**Tutorial:** Decoupling Temporal Services with Nexus
**URL:** https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial
**Concepts:** Nexus Service, Nexus Operation, Nexus Endpoint, Nexus Registry, `@Service`/`@Operation`, `@ServiceImpl`/`@OperationImpl`, `WorkflowRunOperation.fromWorkflowHandle`, `OperationHandler.sync`, `Workflow.newNexusServiceStub`, NexusServiceOptions, human-in-the-loop via `@UpdateMethod`
**SDKs:** Java
**Audience:** Intermediate
**Estimated time:** ~45-60 min

---

## External Communications

### Twitter/X - @temporalio (official)

> Your Compliance team ships a bug at 3 AM. Their code crashes. But it runs on the Payments Worker, so Payments goes down too.
>
> New tutorial: split a monolith into two independent services with Temporal Nexus. Same method call, different architecture.
>
> https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial #Temporal #Java

### Twitter/X - Nikolay (personal)

> Just published a hands-on tutorial where you take a monolithic Temporal app and split it into two independent services using Nexus.
>
> The best part? You kill the Compliance Worker mid-operation and watch the Payment Workflow just... wait. No crash, no retry logic. It picks up right where it left off.
>
> https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial @temporalio

### LinkedIn - Temporal (official)

Two teams. One Worker. One blast radius. Compliance ships a bug at 3 AM, and Payments goes down with it.

The obvious fix is microservices with REST calls. But then you're writing retry loops, circuit breakers, and dead letter queues. You've traded one problem for three.

Our new hands-on tutorial walks you through a third option: Temporal Nexus. You start with a monolithic bank payment processing app where Payments and Compliance share a single Worker. Over five steps, you split it into two independently deployable services connected through a durable Nexus boundary.

What you'll build:
- A shared Nexus Service contract with `@Service` and `@Operation`
- Synchronous and workflow-backed Nexus handlers using `@ServiceImpl` and `@OperationImpl`
- A one-line stub swap that replaces a local Activity call with a durable cross-team Nexus call
- A human-in-the-loop review path using `@UpdateMethod` through the Nexus boundary

The durability demo is the highlight: you kill the Compliance Worker mid-operation and watch the Payment Workflow pause. Restart it, and everything resumes automatically. No retry logic. No data loss.

Java SDK, ~45-60 minutes, runs on Temporal's local dev server.

https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

### LinkedIn - Nikolay (personal)

I just published a tutorial I've been working on for a while, and I think it fills an important gap in how we teach Temporal Nexus.

The problem we kept hearing: "I understand what Nexus is, but I don't know how to actually use it to decouple my services." Docs explain the concepts. But developers wanted to feel it - to take a monolith, split it, and see durability work across the boundary.

So that's what this tutorial does. You start with a bank payment app where Payments and Compliance share one Worker. One deployment. One blast radius. Then you split it into two independent services using Nexus - defining a shared contract with `@Service` and `@Operation`, implementing handlers with `fromWorkflowHandle` and `OperationHandler.sync`, and swapping one line in the Workflow to route through Nexus instead of calling a local Activity.

The moment that makes it click: you kill the Compliance Worker mid-operation. The Payment Workflow doesn't crash. It doesn't timeout. It just waits. Restart the Worker, and everything picks up exactly where it left off. Durability across team boundaries.

There's also a human-in-the-loop path where medium-risk transactions pause for manual review via `@UpdateMethod`, routed through the same Nexus boundary. Two handler patterns, one tutorial.

Big thanks to Angela Zhou for editing.

Java SDK, ~45-60 minutes, all local.

https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

### Slack Temporal Community #announcements (Tom Wheeler)

:wave: New tutorial on learn.temporal.io!

**Decoupling Temporal Services with Nexus** walks you through splitting a monolithic bank payment app into two independent services connected through Nexus. You'll define a shared service contract, implement synchronous and workflow-backed handlers, and swap a single line to route calls across the team boundary.

The durability demo is worth the time alone: kill the Compliance Worker mid-operation and watch the Payment Workflow wait patiently until it comes back.

Java SDK, ~45-60 minutes, all on the local dev server.

Check it out: https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

Let us know what you think or what Nexus patterns you'd like to see covered next!

### Reddit - r/java

**Title:** [Tutorial] Split a monolithic Temporal app into two independent services with Nexus - Java, ~45 min hands-on

I work on developer education at Temporal. We published a tutorial that walks through a real decoupling exercise: you start with a bank payment processing app where Payments and Compliance share a single Worker, then split it into two independently deployable services using Temporal Nexus.

The exercise has five TODOs:
1. Define a shared Nexus Service contract (`@Service` + `@Operation`)
2. Implement two handler patterns: `WorkflowRunOperation.fromWorkflowHandle` for starting workflows, `OperationHandler.sync` for interacting with running ones
3. Register the Compliance Worker with Nexus handler support
4. Swap one Activity stub for a Nexus stub in the Workflow (literally one line)
5. Map the Nexus Service to an Endpoint in the Payments Worker

The durability demo is the payoff: you kill the Compliance Worker mid-operation and the Payment Workflow just waits. Restart it, everything resumes. No retry logic, no data loss.

Also covers a human-in-the-loop review path where medium-risk transactions pause for manual approval via `@UpdateMethod` through the Nexus boundary.

Runs entirely on Temporal's local dev server. No cloud account needed.

https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

Happy to answer questions about Nexus or the handler patterns here.

### Dev.to

**Title:** Split a Temporal Monolith into Two Services with Nexus (Java, Hands-On)

You work at a bank. Every payment flows through three steps: validate, check compliance, execute. Two teams own this work, but right now both teams' code runs on the same Worker. One process. One deployment. One blast radius.

Compliance ships a bug at 3 AM. Their code crashes. But it's running on the Payments Worker, so Payments goes down too. Same blast radius. Same page. Two teams, one shared fate.

The obvious fix? Microservices with REST calls. But then you're writing retry loops, circuit breakers, and dead letter queues.

This [new tutorial on learn.temporal.io](https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial) walks you through a third option: Temporal Nexus. You take the monolith and split it into two independent services connected through a durable boundary.

**The code change is almost invisible:**

```java
// BEFORE (monolith - direct Activity call):
ComplianceResult compliance = complianceActivity.checkCompliance(compReq);

// AFTER (Nexus - durable cross-team call):
ComplianceResult compliance = complianceService.checkCompliance(compReq);
```

Same method name. Same input. Same output. Completely different architecture.

**What you'll build:**

- A shared Nexus Service contract with `@Service` and `@Operation`
- Two handler patterns: `fromWorkflowHandle` for starting long-running workflows, `OperationHandler.sync` for interacting with running ones
- A human-in-the-loop review path where medium-risk transactions pause for manual approval via `@UpdateMethod`

**The moment it clicks:** You kill the Compliance Worker mid-operation. The Payment Workflow doesn't crash. Doesn't timeout. Just waits. Restart the Worker, and everything picks up exactly where it left off.

Java SDK, ~45-60 minutes, runs entirely on Temporal's local dev server.

**Try it:** https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

### Hacker News

**Title:** Hands-on tutorial: splitting a Temporal monolith into two services with Nexus (Java)

### Newsletter Blurb

Two teams share one Worker. Compliance ships a bug, Payments goes down. New tutorial: take a monolithic bank payment app and split it into two independent services using Temporal Nexus. You'll define a shared contract, implement two handler patterns, swap one line in the Workflow, then kill a Worker mid-operation and watch durability work across the team boundary. Java SDK, ~45-60 minutes, all local.

https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

---

## Internal Communications

### Slack - #topic-signal-boost

:mega: **New Nexus tutorial live. Would love engagement on these posts:**

- **Twitter (official):** [link]
- **Twitter (Nikolay):** [link]
- **LinkedIn (official):** [link]
- **LinkedIn (Nikolay):** [link]
- **Reddit r/java:** [link]
- **Dev.to:** [link]
- **Hacker News:** [link]

It's a hands-on decoupling exercise: monolith to two services with Nexus, durability demo where you kill a Worker and watch it recover. Java SDK. Likes, comments, and shares all help!

### Slack - #topic-devrel

:ship: **New Tutorial Published**

**Decoupling Temporal Services with Nexus**
https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

- **Audience:** Intermediate Java developers with Temporal experience
- **Time:** ~45-60 min
- **Concepts:** Nexus Service, Nexus Operation, Nexus Endpoint, Nexus Registry, `fromWorkflowHandle`, `OperationHandler.sync`, NexusServiceOptions, human-in-the-loop via `@UpdateMethod`
- **Author:** Nikolay Advolodkin | **Editor:** Angela Zhou

Learners take a monolithic bank payment app (Payments + Compliance on one Worker) and split it into two independent services connected through a Nexus boundary. Five TODOs, three checkpoints, plus a durability demo where they kill the Compliance Worker mid-operation and watch it recover.

This is the first hands-on Nexus tutorial on learn.temporal.io. Fills the gap between "I read the Nexus docs" and "I know how to decouple with Nexus."

### Slack - #topic-marketing

:mega: **New learn.temporal.io tutorial live**

**Decoupling Temporal Services with Nexus**
https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

Social posts are live on Twitter, LinkedIn, Reddit r/java, Dev.to, and submitted to Hacker News. Newsletter blurb is ready if there's room in the next send.

This is the first hands-on Nexus tutorial. Key selling point: learners kill a Worker mid-operation and watch durability work across the team boundary. Strong demo moment for social clips if video team wants to grab it.

Drafts for all channels available in thread.

### Slack - #private-team-devrel

:white_check_mark: **Shipped: Decoupling Temporal Services with Nexus**

https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial

- **Author:** Nikolay | **Editor:** Angela
- Java SDK, ~45-60 min, intermediate audience
- Covers Nexus Service/Operation/Endpoint/Registry, two handler patterns, human-in-the-loop review via `@UpdateMethod`

This is the first hands-on Nexus tutorial on the learning site. Fills the gap we've been hearing about: developers understand the Nexus concept but don't know how to actually use it to decouple services.

The durability demo (kill Compliance Worker, watch Payment Workflow wait and recover) is the strongest "aha" moment. Could be worth a short video.

Social promotion is live across all channels. Next up: considering additional SDK versions (Go, Python, TypeScript) and an async Nexus Operations tutorial.

Feedback on pacing and checkpoint structure welcome.

### Slack - #topic-ai

Not applicable. This tutorial does not cover AI-related concepts.

### Stakeholder Blurb

We published the first hands-on Nexus tutorial on learn.temporal.io, teaching developers how to split a monolithic Temporal application into two independent services using Nexus. This fills the most common gap we hear from developers adopting Nexus: understanding the concept but not knowing how to implement it. Java SDK, ~45-60 minutes, available at learn.temporal.io.

### Notion Update

| Field        | Value                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| Title        | Decoupling Temporal Services with Nexus                                                                        |
| URL          | https://learn.temporal.io/tutorials/nexus/nexus-sync-tutorial                                                  |
| Publish Date | 2026-03-24                                                                                                     |
| SDKs         | Java                                                                                                           |
| Concepts     | Nexus Service, Nexus Operation, Nexus Endpoint, Nexus Registry, fromWorkflowHandle, OperationHandler.sync, NexusServiceOptions, @UpdateMethod |
| Audience     | Intermediate                                                                                                   |
| Time         | 45-60 min                                                                                                      |
| Series       | First in Nexus tutorial series (standalone, potential for Go/Python/TypeScript versions)                       |
| Status       | Published                                                                                                      |

First hands-on Nexus tutorial on learn.temporal.io. Learners take a monolithic bank payment app and split it into two independent services (Payments and Compliance) connected through a Nexus boundary. Includes a durability demo (kill Worker, watch recovery) and a human-in-the-loop review path using `@UpdateMethod` through Nexus. Five TODOs, three checkpoints.
