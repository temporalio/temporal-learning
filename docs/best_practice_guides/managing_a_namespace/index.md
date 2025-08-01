---
title: "Managing a Namespace"
sidebar_position: 1
public: false
draft: false
tags: [Best Practices, namespace]
keywords: [Temporal, Workflows, Activities, Workers, Task Queues, Best Practices, namespace]
custom_edit_url: null
hide_table_of_contents: true
last_update:
  date: 2025-07-28
image: /img/temporal-logo-twitter-card.png
---

import Link from '@docusaurus/Link';

## What is a Namespace?

A [namespace](https://docs.temporal.io/namespaces) is a unit of isolation within the Temporal platform. It ensures that workflow executions, task queues, and resources are logically separated, preventing any conflicts and enabling safe multi-tenant usage.

Namespaces are created on the Temporal Service, and one namespace will not impact another on the same Temporal Service. However, a single namespace can be multi-tenant, and they act solely as a logical separation. 

If you are running Temporal on your own, you might be familiar with services within a cluster, such as the front-end, backend, matching service, and more. In Temporal Cloud all of these services are managed by us, so you don’t have to worry about managing them at all!

## How to Register a Namespace

[Registering a Namespace](https://docs.temporal.io/namespaces#registration) creates the Namespace on the Temporal Service. You’re also required to set the retention period when creating the namespace. 

On Temporal Cloud, use the Temporal Cloud UI or `tcld` commands to create and manage Namespaces. If no other Namespace is specified, the Temporal Service uses the Namespace `default` for all Temporal SDKs and the Temporal CLI. 

Temporal Cloud enforces limits on Namespace count and workflow execution size. You are allowed up to **10 Namespaces by default**. Exceeding this limit requires a support ticket. 

When it comes to naming namespaces for your team, we recommend grouping them by factors such as teams, products or lines of business. You’ll also likely want to distinguish between dev and prod environments in the naming convention.

Each namespace in Temporal Cloud runs in a specific region, which determines where your workflows and data are hosted. Temporal Cloud currently runs on AWS and GCP, with support for other clouds planned for the future. 

While your cloud infrastructure might be limited to a single region, Temporal Cloud supports multiple regions, and you’ll have access to a full list of available regions during namespace creation. To view the current list of supported regions and their operational status, visit: https://status.temporal.io

## Best Practices:

#### 1. Use lowercase and hyphens for namespace names: Temporal Cloud treats namespace names as case-insensitive. To maintain consistency and avoid potential issues, use lowercase letters and hyphen (-) as separators. Example: `payment-checkout-prd`

#### 2. Use domain, service, and environment to name namespaces
Use the following pattern to name Temporal namespaces: `<use-case>-<domain>-<region>-<environment>`
    
  The following rules ensure that the namespace name doesn’t exceed [39 characters](https://docs.temporal.io/cloud/namespaces#temporal-cloud-namespace-name):
  - Use at most 10 characters for `use case` (e.g. `payments`, `fulfill`)
  - Use at most 10 character for `domain` (e.g. `checkout`, `notify`)
  - Use at most 5 characters for `region` (e.g. `aps1`, `apse1`)
  - Use at most 3 characters for `environment` (e.g. `dev`, `prd`)

  Examples: `payments-checkout-dev`, `payments-checkout-prd`, `fulfill-notify-prd`

**Why this pattern?**
- Simple and easy to understand.
- Complies to [Temporal Cloud namespace requirements](https://docs.temporal.io/cloud/namespaces#temporal-cloud-namespace-name)
- Clearly separates environments (e.g., `dev`, `prod`)
- Groups related services under domains that organization has defined
- Allows for platform teams to implement chargeback to application teams, given most domains are owned by separate teams within organizations 
- Namespace level [system limits](https://docs.temporal.io/cloud/limits#namespace-level) are isolated between different services and environments.
- Multiple workflows that are part of the same use case need to communicate with each other via Signals or by starting Child Workflows.

  Note: [A Temporal Cloud account can have up to 100 namespaces](https://docs.temporal.io/cloud/limits#namespaces) (soft limit).

#### 3. When selecting a region for your namespace, choose one that aligns with your application's latency, compliance, and data residency requirements (use https://status.temporal.io/ to identify the right region for you).

  Check out some more best practices for configuring namespaces in [our documentation](https://docs.temporal.io/cloud/namespaces#general-guidance). 

## Manage Namespaces

With Temporal, it’s important to be able to configure your namespaces as well as see details for them. Whether you’re self-hosting or using Temporal Cloud, you’re able to get details for your Namespaces, update Namespace configuration, and deprecate or delete your Namespaces.

On Temporal Cloud, use the Temporal Cloud UI or `tcld` commands to manage Namespaces. We provide [guidance for both methods](https://docs.temporal.io/cloud/namespaces#manage-namespaces) in our docs that you can reference. 

Regardless of how you run Temporal, you must register a Namespace with the Temporal Service before setting it in the Temporal Client. 

We recommend you use a custom [Authorizer](https://docs.temporal.io/self-hosted-guide/security#authorizer-plugin) on your Frontend Service in the Temporal Service to set restrictions on who can create, update, or deprecate Namespaces. If an Authorizer is not set in the server options, Temporal uses the nopAuthority authorizer that unconditionally allows all API calls to pass through.

### Best practices: 

#### 1. Enable deletion protection for `prd` namespaces: [Prevent accidental deletion](https://docs.temporal.io/cloud/namespaces#delete-protection) of production namespaces.

#### 2. Enable multi-region replication for business critical use cases: For many organizations, ensuring high availability (HA) is required because of strict uptime requirements, compliance, and regulatory needs. 

  For these critical use cases, enable High Availability features for specific namespaces for a [99.99% contractual SLA](https://docs.temporal.io/cloud/high-availability#high-availability-features). When choosing between [same-region and multi-region replication](https://docs.temporal.io/cloud/high-availability/how-it-works#deployment-options), favor multi-region replication to optimize reliability over proximity.

  By default, Temporal Cloud provides a [99.9% contractual SLA](https://docs.temporal.io/cloud/high-availability) guarantee against service errors for all namespaces. 

  Note: [enabling HA features for namespaces will 2x the consumption cost](https://docs.temporal.io/cloud/pricing#high-availability-features).

#### 3. Use Terraform to manage namespaces:
Use [Temporal Cloud Terraform provider](https://docs.temporal.io/production-deployment/cloud/terraform-provider) to manage Temporal Cloud namespaces. This allows us to maintain documentation that outlines the purpose of each namespace and their owners. In addition, Terraform enables us to prevent infrastructure drift (e.g. someone accidentally deletes a namespace). 

  Use `prevent_destroy = true` to prevent Terraform from destroying the namespace. 

  Reference: https://github.com/kawofong/temporal-terraform 

## Setting

Temporal Cloud provides a few configurable parameters associated with a Namespace, client, or service that determines how Temporal behaves for that scope. You can configure many of these settings when creating or editing a Namespace via the UI or CLI (`tcld`).

You must also set Namespaces in your SDK Client to isolate your Workflow Executions to the Namespace. If you do not set a Namespace, all Workflow Executions started using the Client will be associated with the `default` Namespace. This means, you must have a default Namespace called `default` registered with your Temporal Service.

Here are some of the typical namespace settings you’re able to configure:

| Setting | Description |
|---------|-------------|
| `namespace` (SDK/client) | The name of the Namespace your client is scoped to |
| `retention` | How long workflow execution history is kept |
| `certificate` | The client certificate used for mTLS authentication |
| `codec_server_endpoint` | URL to a Codec Server for decrypting encrypted payloads in the UI |
| `default_task_queue` | The task queue used if none is specified in the workflow code |
| `search_attributes` | Custom fields that allow filtering and querying workflow executions |
| `data_converter` | Used to serialize/deserialize and encrypt/decrypt workflow payloads |
| `visibility settings` | Controls how workflow status data is indexed and queried |








