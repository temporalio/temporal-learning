---
id: dotnet-dev-env
title: Set up a local development environment for Temporal and .NET
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the .NET SDK.
keywords: [.NET, dotnet, javascript, temporal, sdk, development environment]
tags: [.NET, SDK, development environment]
last_update:
  date: 2024-03-26
image: /img/temporal-logo-twitter-card.png
---

![Temporal .NET SDK](/img/sdk_banners/banner_dotnet.png)

To follow the .NET SDK tutorials and build your own Temporal applications, you'll need the [.NET SDK](https://github.com/temporalio/sdk-dotnet?tab=readme-ov-file#installation) and a Temporal Server.

## Install .NET

The .NET SDK requires .NET 6.0 or later.

Install .NET by following [the official .NET instructions](https://dotnet.microsoft.com/en-us/download).

## Install the Temporal .NET SDK

If you don't already have a .NET project, create one by running the following command:

```command
dotnet new console -o temporaldotnet
```

Switch to the new directory for your project:

```command
cd temporaldotnet
```

Then, install the [Temporal .NET SDK](https://www.nuget.org/packages/Temporalio):

```command
dotnet add package Temporalio
```

Next, you'll configure a local Temporal Cluster for development.

## Set up a local Temporal development cluster with Temporal CLI

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
