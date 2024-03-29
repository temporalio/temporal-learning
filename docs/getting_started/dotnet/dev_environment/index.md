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

If you are creating a new project using the Temporal .NET SDK, you can start by creating a new directory:

```command
mkdir dotnetproject
```

Next, switch to the new directory:

```command
cd dotnetproject
```

Then, initialize a .NET project in that directory:

```command
dotnet new console
```

Finally, install the Temporal .NET SDK.

Add the Temporalio package from [NuGet](https://www.nuget.org/packages/Temporalio). For example, using the dotnet CLI:

```command
dotnet add package Temporalio
```

Next, you'll configure a local Temporal Cluster for development.

## Set up a local Temporal development cluster with Temporal CLI

import Cluster  from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
