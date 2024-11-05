---
title: "Example applications"
hide_title: true
sidebar_position: 5
hide_table_of_contents: true
pagination_next: null
image: /img/temporal-logo-twitter-card.png
---

![Example Applications](/img/banners/exampleapplications.png)

Explore example applications that use Temporal and gain a clearer understanding of how everything fits together.

# Reference Applications
Reference Applications are fully documented, end-to-end solutions that show how to use Temporal for a particular use case. If you're new to Temporal, these are a great place to start to understand its capabilities.

* [Background Check Application in Go](go/background-checks/index.md)
* [Order Management System in Go](https://github.com/temporalio/reference-app-orders-go)

# Example applications
While not intended for production use, Example Applications can nonetheless be useful for seeing Temporal in action for particular use cases and architectural design patterns.

## Use cases
* **Order Fulfillment** [[TypeScript]](https://github.com/temporal-sa/temporal-order-fulfill-demo) A Temporal workflow for a sample e-commerce order fulfillment use case. This demo showcases Temporal's powerful durability and interactive capabilities. See companion [video](https://www.youtube.com/watch?v=dNVmRfWsNkM).
* **Money Transfer** [[Java]](https://github.com/temporal-sa/temporal-money-transfer-java) [[TypeScript]](https://github.com/temporal-sa/temporal-money-transfer-typescript) demonstrates core value propositions of Temporal. A custom UI allows users to choose from a number of simulated failure scenarios and use of Temporal primitives such as signals and schedules.
* **Orchestrate Lambda Functions** [[TypeScript]](https://github.com/temporal-sa/temporal-orchestrate-lambda-functions) A Temporal version of the [AWS Step Functions: Lambda orchestration example](https://docs.aws.amazon.com/step-functions/latest/dg/sample-lambda-orchestration.html) which uses Lambda functions to check a stock price and determine a buy or sell trading recommendation.

## Design patterns
* **Entity Workflow demo** [[Go]](https://github.com/temporal-sa/temporal-entity-lifecycle-go) The purpose of this demo is to illustrate some of the interesting properties of the Entity Lifecycle Pattern (aka Entity Workflows). See companion slide deck on [Long-running workflows](https://docs.google.com/presentation/d/1A2dz4lFiIFz4c_7QlOpahbvesbBY8Y6y65zRrkVgqYE/edit?usp=sharing).
* **Order Saga sample** [[Java]](https://github.com/temporal-sa/temporal-order-saga) Demonstrates Temporal's enhanced support for the Saga pattern, supporting recovery from failed transactions. See this  [companion video](https://www.youtube.com/watch?v=uHDQMfOMFD4) to see a demonstration of the example.

## Data encryption
See the [Temporal Platform Feature Guide](https://docs.temporal.io/production-deployment/data-encryption) for more information on the purpose of Temporal Codec Servers.
* **Codec Server with JWT validation** [[TypeScript]](https://github.com/temporal-sa/temporal-codec-server) The codec server uses JSON Web Tokens (JWT) to confirm the authenticity of JWTs issued by Temporal Cloud.
* **Codec CORS Credentials** [[Go]](https://github.com/temporal-sa/codec-cors-credentials) An implementation of a Temporal [Codec Server](https://docs.temporal.io/dataconversion#codec-server) that supports Cross-Origin Resource Sharing (CORS), and specifically CORS Requests with credentials.

# Samples
Samples are more targeted examples that showcase particular features of Temporal and/or support for various language features.

* [Go SDK Samples](https://github.com/temporalio/samples-go)
* [Java SDK Samples](https://github.com/temporalio/samples-java)
* [Python SDK Samples](https://github.com/temporalio/samples-python)
* [TypeScript SDK Samples](https://github.com/temporalio/samples-typescript)
* [.NET SDK Samples](https://github.com/temporalio/samples-dotnet)

More examples coming soon.
