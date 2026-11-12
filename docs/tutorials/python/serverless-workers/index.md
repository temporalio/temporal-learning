---
id: index
title: Deploy Temporal Serverless Workers to AWS Lambda
sidebar_label: Deploy Temporal Serverless Workers to AWS Lambda
description: Run one of your Temporal Workers serverlessly on AWS Lambda, end to end, on your own accounts, using the Python SDK.
keywords: [temporal, serverless workers, aws lambda, python, worker versioning, worker controller instance]
tags: [serverless-workers, aws-lambda, python]
draft: true
last_update:
  date: 2026-11-03
  author: Angela Zhou
---

<!-- VIDEO (lead, ~90s): the ticket-drop problem shown as a traffic graph, then how
     Temporal scales Workers on demand and back to zero. The "why," before any code.
     Publish on YouTube and embed here. -->

A ticketing startup runs its registration Workflow on a fleet of always-on Temporal Workers. Most of the day, a handful of registrations trickle in per minute. Then tickets for a hot show drop, thousands of fans hit **Register** in the first few minutes, and the fleet has to keep up, or registrations back up and fans are left waiting right when they most want a ticket.

A fleet built for the on-sale peak sits mostly idle between drops, billing around the clock for capacity nobody is using, and a fleet built for the quiet days can't take the peak. There's no single fixed size that's right for a workload that's quiet most of the time and enormous in short bursts. And however we size it, someone still has to own that fleet, which means provisioning it, tuning its autoscaling, keeping it updated, and monitoring it.

[Serverless Workers](https://docs.temporal.io/serverless-workers) take the sizing question away. Temporal starts Workers on demand and scales them to match the work, from one or two during the trickle to many at once during a drop, and back to zero when it clears. We pay only for the time those Workers run.

## What we'll build

We'll take that registration Workflow, run it the ordinary way on our own machine first, and then deploy it as a Serverless Worker on our own AWS Lambda and Temporal Cloud accounts. 

By the end, starting a registration makes Temporal invoke a real Lambda function on demand, run the Workflow across as many invocations as it needs, and scale back to nothing when the work drains. Then we'll ship a new version safely and tear everything down.

<details>
<summary>What's a Lambda function?</summary>

[AWS Lambda](https://docs.aws.amazon.com/lambda/) is Amazon's service for running code without managing a server. A Lambda function is the code we upload to it. AWS stores the code and runs it only when something triggers it, such as an HTTP request, a new file in a storage bucket, or, in this tutorial, Temporal. 

Each run is called an invocation: AWS starts a short-lived environment, calls one function in our code (the handler), and shuts the environment down once it's no longer needed. We pay only for the time it runs, and each invocation can last at most 15 minutes.

</details>

## Prerequisites

This tutorial assumes you already work with Temporal and are comfortable with Workflows, Activities, Workers, Task Queues, and Signals. 

We'll deploy on our own accounts, so you need:

- A [**Temporal Cloud Namespace hosted on AWS**](https://docs.temporal.io/cloud/namespaces#create-a-namespace), and an [API key](https://docs.temporal.io/cloud/api-keys) for it. The Namespace's cloud provider has to match the compute provider, so an AWS-hosted Namespace is required. 
- An [**AWS account**](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-creating.html) with permission to create and invoke Lambda functions and create [Identity and Access Management (IAM) roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html), and the [`aws` CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) installed and signed in.
- [uv](https://docs.astral.sh/uv/), which fetches a suitable Python for you.
- The [`temporal` CLI](https://docs.temporal.io/cli), v1.7.0 or later

:::caution This tutorial creates real, billable resources
The deploy sections create a Lambda function, IAM roles, a CloudFormation stack, and a log group in your AWS account, and they cost money for as long as they exist. The [last chapter](./08-operate-and-tear-down/index.md) walks through tearing everything down, so follow it when you're done.
:::

With that in place, we'll start by [meeting the Workflow and running it the old way](./01-run-it-the-old-way/index.md).