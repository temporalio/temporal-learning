---
id: go-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the Go programming language.
keywords: [go, golang, temporal, sdk, development environment]
tags: [Go, SDK, development environment]
last_update:
  date: 2023-03-27
title: Set up a local development environment for Temporal and Go
image: /img/temporal-logo-twitter-card.png
---


![Temporal Go SDK](/img/sdk_banners/banner_go.png)

To follow the Go SDK tutorials we recommend that you have the following environments set up.

## Install Go

Make sure you have [Go](https://golang.org/doc/install) installed. These tutorials were produced using Go 1.18.

Check your version of Go with the following command:

```command
go version
```

This will return your installed Go version:

```
go version go1.18.1 darwin/amd64
```

## Install the Temporal Go SDK

If you are creating a new project using the Temporal Go SDK, you can start by creating a new directory:

```command
mkdir goproject
```

Next, switch to the new directory:

```command
cd goproject
```

Then, initialize a Go project in that directory:

```command
go mod init
```

Finally, install the Temporal SDK with `go get`:

```command
go get go.temporal.io/sdk
```

Next, you'll configure a local Temporal cluster for development.

## Set up a local Temporal development cluster with Temporal CLI

import Cluster from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
