---
id: go-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal applications using the Go programming language.
keywords: [go, golang, temporal, sdk, development environment]
tags: [Go, SDK, development environment]
last_update:
  date: 2021-10-01
title: Set up a local development environment for Temporal and Go
---

To follow the Go SDK tutorials we recommend that you have the following environments set up.

## Install Go

Make sure you have [Go](https://golang.org/doc/install) installed. These tutorials were produced using Go 1.18.

## Set up a Temporal development cluster

Download and install the Temporal development cluster locally using Docker Compose. You'll run this server in the background while you develop your applications.

You must have [Docker](https://docs.docker.com/engine/install) and [Docker Compose](https://docs.docker.com/compose/install) installed.

Then clone the [temporalio/docker-compose](https://github.com/temporalio/docker-compose) repository and run `docker-compose up` from the root of that repository:

```command
git clone https://github.com/temporalio/docker-compose.git
```

```command
cd  docker-compose
```

```command
docker-compose up
```

When the Temporal Cluster is running, the Temporal Web UI becomes available in your browser: [localhost:8080](http://localhost:8080/)

Review other methods in the [Run a dev Cluster](https://docs.temporal.io/application-development/foundations#run-a-dev-cluster) section in Temporal's documentation.

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
