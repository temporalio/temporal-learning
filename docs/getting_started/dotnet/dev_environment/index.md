---
id: dotnet-dev-env
title: Set up a local development environment for Temporal and .NET
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the .NET SDK.
keywords: [.NET, dotnet, javascript, js, temporal, sdk, development environment]
tags: [.NET, SDK, development environment]
last_update:
  date: 2024-02-22
image: /img/temporal-logo-twitter-card.png
---

![Temporal .NET SDK](/img/sdk_banners/banner_dotnet.png)

To follow the .NET SDK tutorials and build your own Temporal applications, you'll need the .NET SDK and a Temporal server.

## Install .NET

The .NET SDK requires .NET 6.0 or later.

Install .NET by following [the official .NET instructions](https://dotnet.microsoft.com/en-us/download).

## Set up the Temporal .NET SDK

Add the Temporalio package from [NuGet](https://www.nuget.org/packages/Temporalio). For example, using the dotnet CLI:

```command
dotnet add package Temporalio
```

Next, you'll configure a local Temporal cluster for development.

## Set up a local Temporal development cluster with Temporal CLI

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
