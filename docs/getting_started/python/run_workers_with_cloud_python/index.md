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

Temporal Cloud oversees the execution process by preserving the source of truth for your Workflow Execution Event Histories.
This independent supervision ensures the durable execution of your distributed applications and services.

In [Run your first Temporal application with the Python SDK](/getting_started/python/first_program_in_python), you started a Worker and ran a Workflow with a local instance of the Temporal Service.

While this setup is suitable for local development and testing, it may not be ideal for production workloads that require scalability and high availability.

In this tutorial, you will migrate your application from a local Temporal Server to a managed Temporal Cloud environment, generate certificates, update your Worker code, and run your Workflow.

### Prerequisites

Before getting started, review the following prerequisites:

- Get access to a [Temporal Cloud account](https://docs.temporal.io/cloud/get-started).
- Complete the [Run your first Temporal application with the Python SDK](/getting_started/python/first_program_in_python/) tutorial.
- Provide a method to generate certificates for your Namespace.

## Generate certificates

Certificates are crucial for securing access and communication with Temporal Cloud.
They are required for configuring mutual Transport Layer Security (mTLS) protocol, which is used to secure Temporal Cloud access.

You have a few options to generate certificates.

- Use existing certificate management infrastructure to generate certificates for your Namespace.
- Use Temporal's built-in certificate generation tool [tcld](https://docs.temporal.io/cloud/tcld).
- Use open-source tools like [certstrap](https://github.com/square/certstrap).

The next step uses [certstrap](https://github.com/square/certstrap) to generate certificates.

**Create a Certificate Authority (CA)**

Create a new Certificate Authority (CA) using Certstrap:

```command
./certstrap init --common-name "Cert"
```

This command creates a self-signed CA certificate named `Cert.crt` in the `out` folder within the Certstrap directory.
This CA certificate will be used to sign and issue end-entity certificates.

**Set the Namespace Name**

Set the Namespace Name as the common name for the end-entity certificate:

<Tabs>
  <TabItem value="macos" label="macOs" default>

For Linux or macOS:

```command
export NAMESPACE_NAME=your-namespace
```

</TabItem>
    <TabItem value="windows" label="Windows" default>

For Windows:

```command
set NAMESPACE_NAME=your-namespace
```

</TabItem>
</Tabs>

Replace `your-namespace` with the name of your Temporal Cloud namespace.

**Request an End-Entity Certificate**

Next, request a certificate with a common name equal to the Namespace Name:

```command
./certstrap request-cert --common-name ${NAMESPACE_NAME}
```

This command creates a Certificate Signing Request (CSR) for an end-entity certificate, but not the actual certificate itself.

**Sign the Certificate Request**

Sign the certificate request and generate the end-entity certificate:

```command
./certstrap sign ${NAMESPACE_NAME} --CA "Cert"
```

This command takes the CSR from the previous step and signs it with your CA (`Cert`).
The result is an end-entity certificate (`your-namespace.crt`) that is now a valid certificate signed by your CA.

**Use the Certificates with Temporal Cloud**

You can now use the generated client certificate (`your-namespace.crt`) and the CA certificate (`Cert.crt`) with Temporal Cloud.
You will upload the contents of the `Cert.crt` file to the **CA Certificates** section of your **Namespace** settings.

1. Sign in to your [Cloud account](https://cloud.temporal.io/).
2. On the left-hand navigation menu, select **Namespaces**.
3. Select your Namespace and then choose **Edit**.
4. Paste your CA Certificate into the **CA Certificates** section.
5. Select **Save** to continue.

:::note

Make note of the Namespace you uploaded your CA certificate to.
You will need it when connecting your Worker to your Namespace and when starting your Workflow.

:::

Now that you have generated your CA certificate and uploaded to your Temporal Namespace, you can update your Worker code.

## Update Worker code to connect to Temporal Cloud

You will build off the code used in the [Run your first Temporal application with the Python SDK](/getting_started/python/first_program_in_python/) tutorial.

When working with Temporal Cloud, you will provide an encrypted connection using Mutual Transport Layer Security (mTLS) to secure the communication between your application and the Temporal Cloud service.

Open the `run_worker.py` file and update your import statements.

Import the [TLSConfig](https://python.temporal.io/temporalio.service.TLSConfig.html) class.
This is used to configure settings used when connecting to Temporal Cloud.

<!--SNIPSTART python-money-transfer-project-template-import-tls-->
<!--SNIPEND-->

Temporal supports mTLS as a way of encrypting network traffic between the services of a cluster and also between application processes and a Cluster.
For more information, see [Security model](https://docs.temporal.io/cloud/security) in Temporal Cloud.

Next, you will make use of the optional `os` module.

To access environment variables for the managed Temporal Cloud environment, use the `os` module.
Add the following import statement at the top of your file:

<!--SNIPSTART python-money-transfer-project-template-import-os-->
<!--SNIPEND-->

You can use any library needed to access your environment variables that is supported in Python.

Next, update the configuration used to make a connection with the Worker Client.

Remove the existing Client configuration and add the following code to connect to a Worker Client instance.

<!--SNIPSTART python-money-transfer-project-template-import-connect-to-cloud-->
<!--SNIPEND-->

This code reads the TLS certificate from environment variables and uses them to configure the `TLSConfig` object.
It also retrieves the host URL and Namespace from environment variables and passes them to the `Client.connect()` method.

Next, you will set the required environment variables.

## Set the required environment variables

Before running your application, set the following environment variables with the appropriate values provided by your managed Temporal Cloud environment:

- `TEMPORAL_MTLS_TLS_CERT`: The path to the `.pem` file with your mTLS x509 Certificate.
- `TEMPORAL_MTLS_TLS_KEY`: The path to the file with your mTLS private key.
- `TEMPORAL_HOST_URL`: The host URL of your managed Temporal Cloud environment.
- `TEMPORAL_NAMESPACE`: The Namespace Name and Account Id associated with your Temporal Cloud environment.

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

Replace `namespace`, `account-id`, and `port` (the default port is `7233`) with the appropriate values for your Temporal Cloud environment.

**What is a Temporal Namespace?**

The `TEMPORAL_NAMESPACE` is the **Cloud Namespace Name Id** and is constructed by concatenating your specified **Namespace name**, a dot (.), and your **Account Id**.

This format, **Namespace name.Account Id**, serves as a globally unique identifier for a Namespace within the Temporal Cloud service.

The **Namespace name** (user-defined) on the left, combined with the **Account Id** (system-assigned) on the right, forms the complete **Cloud Namespace ID**.

The following is an example of a Cloud Namespace Name Id, where `docs-assembly` is the Namespace name and `a2dd6` is the Account Id.

![Cloud Namespace Name Id](namespace-id.png)

The Cloud Namespace Name Id is crucial for deriving the gRPC endpoint needed when configuring a Client to access Temporal Cloud.

## Run your application connected to Temporal Cloud

After completing these steps, your application is ready to connect to Temporal Cloud.

1. Run the `temporal workflow start` command.

```command
temporal workflow start \
 --task-queue money-transfer \
 --type MoneyTransfer \
 --tls-cert-path ${TEMPORAL_MTLS_TLS_CERT} \
 --tls-key-path ${TEMPORAL_MTLS_TLS_KEY} \
 --namespace ${TEMPORAL_NAMESPACE} \
 --address ${TEMPORAL_HOST_URL}
```

Ensure that the certificate path, private key path, Namespace, and address argument values match your project.

2. Sign in to your [Cloud account](http://cloud.temporal.io).
3. Visit the Workflow page of your Cloud Namespace.
The URL will look something like the following:

```text
https://cloud.temporal.io/namespaces/<namespace>.<account-id>/workflows
```

You will see the last run of your Workflow matches the command you ran.

## Conclusion

Migrating your application from a local Temporal Server to a managed Temporal Cloud environment requires setting up your certificates, creating a connection, and running your code.

By leveraging Temporal Cloud, you can focus on developing and deploying your application without the overhead of managing the underlying infrastructure.
Temporal Cloud provides a scalable and reliable platform for running your Workflows and Activities, ensuring the durability and resilience of your application.

By running your application in Temporal Cloud, you can benefit from a robust and efficient environment that supports the execution of your distributed applications and services.
