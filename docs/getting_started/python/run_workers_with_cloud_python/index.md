---
title: Run Workers with Temporal Cloud for the Python SDK
id: run-workers-with-cloud-python
sidebar_position: 4
description: In this tutorial, you'll learn how to migrate your Python application from a local Temporal Server to a managed Temporal Cloud environment, leveraging the benefits of a scalable and reliable platform for running your Workflows and Activities.
keywords: [python, temporal, sdk, tutorial, example, workflow, worker, getting started, temporal cloud, managed service, migrating]
tags: [Python, SDK, Temporal Cloud]
last_update:
  date: 2024-01-22
code_repo: https://github.com/temporalio/money-transfer-project-template-python
image: /img/temporal-logo-twitter-card.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Temporal is an open-source service licensed under the MIT License, which means you have the flexibility to run your own Temporal Server and host it yourself.
In the [previous lessons](/getting_started/python/first_program_in_python), you learned how to create a local database using the `temporal server start --db-filename temporal.db` command.
This command starts a Temporal Server instance and stores the data in a local database file on your machine.

While this setup is suitable for local development and testing, it may not be ideal for production workloads that require scalability and high availability.

**What options do I have when running Temporal in production?**

When it comes to running Temporal in production, you have two main options:

- **Temporal self-hosted**: This option involves setting up and managing your own instance of the Temporal Server.
Your Workers and Temporal Application connect directly to this self-hosted instance.
With the self-hosted approach, you have full control over the infrastructure and are responsible for managing the persistence layer, scalability, and availability of the Temporal system.
- **Temporal Cloud**: Temporal Cloud is a fully managed service provided by Temporal.
It offers a hassle-free way to run your Temporal Applications without the need to manage the underlying infrastructure.
Your Workers and Temporal Applications connect to the Temporal Cloud service, which takes care of the persistence layer, scalability, and availability for you.

Temporal Cloud and self-hosted Temporal clusters have some similarities, as both require your Temporal Clients and Workers to establish a connection to the Temporal Cluster.
Additionally, in both cases, you are responsible for managing and hosting your application code and running your Workers.
However, there are key differences between using Temporal Cloud and self-hosting your Temporal cluster.

**Are there additional features of Temporal Cloud?**

Based on the open-source Temporal Server software, Temporal Cloud offers comparable features without the overhead of setting up and managing a production-level Temporal Cluster.
It provides units of [isolation called Namespaces](https://docs.temporal.io/cloud/security#namespace-isolation), which you can provision for different environments such as development, testing, integration, staging, and production.

Temporal Cloud provides additional features and benefits, such as:

- [Globally available](https://docs.temporal.io/cloud/service-availability): Temporal Cloud is compatible with applications deployed in various cloud environments or data centers and operates globally.
- [History Export](https://docs.temporal.io/cloud/export): Temporal Cloud allows you to export your Workflow Execution Event Histories for long-term storage, auditing, or analysis purposes.
- [RBAC](https://docs.temporal.io/cloud/saml): Temporal Cloud provides RBAC which supports SAML Single Sign-On (SSO) authentication. This provides a secure and seamless way for users to access Temporal Cloud resources using their organization's credentials, simplifying user management and enhancing security.
- [Support](https://docs.temporal.io/cloud/support): Temporal Cloud includes the support, services and training needed to onboard you successfully, design and deploy your application efficiently and scale. Our team has extensive knowledge of the Temporal project, and a broad set of skills to help you succeed with any project.
- [Consumption based pricing](https://docs.temporal.io/cloud/pricing): Temporal Cloud is a consumption-based service; you pay only for what you need when you need it. Our pricing derives from your use of actions, storage, and support. Pricing is flexible, transparent, and predictable, so you know your costs and never pay for unused capacity.

For information on Temporal Cloud release stages, see [Temporal product release stages guide](https://docs.temporal.io/temporal/release-stages).

<!--
   - Terraform Provider: Temporal Cloud integrates with Terraform, enabling you to define and manage your Temporal resources using infrastructure as code.
-->

**How do I choose between self-hosted and Temporal Cloud?**

The choice between self-hosted and Temporal Cloud depends on your specific requirements, resources, and expertise.
If you have the necessary infrastructure and expertise to manage the Temporal system yourself, self-hosting can provide you with more control and flexibility.
On the other hand, if you want to focus on building your application without worrying about the underlying infrastructure, then Temporal Platform handles these types of problems, allowing you to focus on the business logic, instead of writing application code to detect and recover from failures.

In this lesson, you will learn how to migrate your code from the Money Transfer application, which connected to a local instance of the Temporal Service, to Temporal Cloud to take advantage of its managed infrastructure and durability guarantees.

### Prerequisites

- You must have access to a [Temporal Cloud account](https://docs.temporal.io/cloud/get-started).
- You must have completed the [Run your first Temporal application with the Python SDK](/getting_started/python/first_program_in_python/) tutorial.

## Worker code

You will build off the code used in the [Run your first Temporal application with the Python SDK](/docs/getting_started/python/first_program_in_python/) tutorial.

This tutorial will modify your Worker code created in the previous tutorial and start your Workflow using the CLI.

### Update the Temporal SDK import statements

Open the `run_worker.py` file and update your import statements.

Import the [TLSConfig](https://python.temporal.io/temporalio.service.TLSConfig.html) class.
This is used to configure settings used when connecting to Temporal Cloud.

```diff
- from temporalio.client import Client
+ from temporalio.client import Client, TLSConfig
```

With your development server, you made a local connection.
Temporal supports Mutual Transport Layer Security (mTLS) as a way of encrypting network traffic between the services of a cluster and also between application processes and a Cluster.
For more information, see [Security model](https://docs.temporal.io/cloud/security) in Temporal Cloud.

Next, you will make use of the optional `os` module.

#### Import the `os` module

To access environment variables for the managed Temporal Cloud environment, use the `os` module.
Add the following import statement at the top of your file:

```diff
+ import os
```

You can use any library needed to access your environment variables that is supported in Python.

Next, update the configuration used to make a connection with the Worker Client.

### Update the Client call

Remove the existing Client call and add the following code to connect to a Worker Client instance.

```diff
- client: Client = await Client.connect("localhost:7233", namespace="default")
+ with open(os.getenv("TEMPORAL_MTLS_TLS_CERT"), "rb") as f:
+     client_cert = f.read()
+
+ with open(os.getenv("TEMPORAL_MTLS_TLS_KEY"), "rb") as f:
+     client_key = f.read()
+
+ client: Client = await Client.connect(
+     os.getenv("TEMPORAL_HOST_URL"),
+     namespace=os.getenv("TEMPORAL_NAMESPACE"),
+     tls=TLSConfig(
+         client_cert=client_cert,
+         client_private_key=client_key,
+     ),
+ )
```

This code reads the TLS certificate and private key from environment variables and uses them to configure the `TLSConfig` object.
It also retrieves the host URL and namespace from environment variables and passes them to the `Client.connect()` method.

### Set the required environment variables

Before running your application, set the following environment variables with the appropriate values provided by your managed Temporal Cloud environment:

- `TEMPORAL_MTLS_TLS_CERT`: Path to the TLS certificate file.
- `TEMPORAL_MTLS_TLS_KEY`: Path to the TLS private key file.
- `TEMPORAL_HOST_URL`: The host URL of your managed Temporal Cloud environment.
- `TEMPORAL_NAMESPACE`: The namespace associated with your Temporal Cloud environment.

**What is a Temporal Namespace?**

The `TEMPORAL_NAMESPACE` is the **Cloud Namespace Name Id** and is constructed by concatenating your specified **Namespace name**, a dot (.), and your **Account Id**.

This format, **</Namespace name>.</Account id>**, serves as a globally unique identifier for a Namespace within the Temporal Cloud service.

The **Namespace name** (user-defined) on the left, combined with the **Account Id** (system-assigned) on the right, forms the complete **Cloud Namespace ID**.

The following is an example of a Cloud Namepace Name Id, where `docs-assembly` is the Namespace name and `a2dd6` is the Account Id.

![Cloud Namepace Name Id](namespace-id.png)

The Cloud Namespace Name Id is crucial for deriving the gRPC endpoint needed when configuring a Client to access Temporal Cloud.

### Set your environment variables

In this step, you'll set up environment variables to store configuration values that may differ between environments.

**Understanding Namespaces**

Within your Account ID, you can create multiple Namespaces.
A Namespace is a logical separation of resources and configurations.
This allows you to maintain different settings for various purposes, such as:

- Separate environments (testing and production)
- Different types of workloads or microservices (authentication and data processing)

By using Namespaces, you can keep your configurations organized and avoid conflicts between different environments or applications.

To implement best practices for organization and programming, it's recommended to use environment variables for values that change per environment.
Environment variables provide a way to store configuration settings outside of your codebase, making it easier to manage and deploy your application across different environments.

You can set these environment variables using the following commands in your terminal or by configuring them in your application's deployment environment:

<Tabs>
  <TabItem value="macos" label="MacOS">

```bash
export TEMPORAL_MTLS_TLS_CERT=/path/to/tls/cert.pem
export TEMPORAL_MTLS_TLS_KEY=/path/to/tls/key.pem
export TEMPORAL_HOST_URL=https://namespace.account-id.tmprl.cloud:port
export TEMPORAL_NAMESPACE=namespace.account-id
```

  </TabItem>
  <TabItem value="windows" label="Windows">

```bash
set TEMPORAL_MTLS_TLS_CERT=C:\path\to\tls\cert.pem
set TEMPORAL_MTLS_TLS_KEY=C:\path\to\tls\key.pem
set TEMPORAL_HOST_URL=https://namespace.account-id.tmprl.cloud:port
set TEMPORAL_NAMESPACE=namespace.account-id
```

  </TabItem>
</Tabs>

Replace `namespace`, `account-id`, and `port` (The default port is `7233`) with the appropriate values for your Temporal Cloud environment.

Ensure you have the path to your certificates set up correctly.
For information on setting up certificates, see [Certificate management](https://docs.temporal.io/cloud/certificates).

### Run your application

After completing the above steps, your Python application should be ready to connect to the managed Temporal Cloud environment.

1. Run the `temporal workflow start` command, and make sure to specify the certificate and private key arguments.

```bash
temporal workflow start \
 --task-queue money-transfer \
 --type MoneyTransfer \
 --tls-cert-path $TEMPORAL_MTLS_TLS_CERT \
 --tls-key-path $TEMPORAL_MTLS_TLS_KEY \
 --namespace $TEMPORAL_NAMESPACE \
 --address $TEMPORAL_HOST_URL
```

Make sure that the certificate path, private key path, Namespace, and address argument values match your project.

2. Sign in to your [Cloud account](http://cloud.temporal.io).
3. Visit the Workflow page of your Cloud Namespace.
The URL will look something like the following:

```text
https://cloud.temporal.io/namespaces/<namespace>.<account-id>/workflows
```
You will see the last run of your Workflow matches the command you ran.

## Conclusion

Migrating your Python application from a local Temporal Server to a managed Temporal Cloud environment offers several benefits.
By leveraging Temporal Cloud, you can focus on developing and deploying your application without the overhead of managing the underlying infrastructure.
Temporal Cloud provides a scalable and reliable platform for running your Workflows and Activities, ensuring the durability and resilience of your application.

With Temporal Cloud, you can take advantage of features like automatic scaling, high availability, and secure connections.
The managed service abstracts away the complexities of setting up and maintaining a production-grade Temporal Cluster, allowing you to concentrate on building your application logic.
Additionally, Temporal Cloud offers advanced capabilities such as History Export, Terraform Provider, and OAuth integration, enabling you to streamline your development and deployment processes.
By running your application in Temporal Cloud, you can benefit from a robust and efficient environment that supports the execution of your distributed applications and services.
