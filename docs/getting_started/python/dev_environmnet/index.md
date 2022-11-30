---
id: python-dev-env
sidebar_position: 1
description: Set up a local development environment for developing Temporal Applications using the Python programming language.
keywords: [python, temporal, sdk, development environment]
tags: [Python, SDK, development environment]
last_update:
  date: 2021-12-01
title: Set up a local development environment for Temporal and Python
sidebar_label: Set up a local development environment
image: /img/temporal-logo-twitter-card.png
---

To follow the Python SDK tutorial we recommend that you have the following environments set up.

## Install Python

Make sure you have [Python](https://www.python.org/downloads/) installed. These tutorials were produced using Python 3.10.

## Install the Temporal Python SDK

Install the Temporal Python SDK.

```command
python -m pip install temporalio
```

You should see an output similar to the following.

```output
Successfully installed temporalio-x.y
```

## Set up a Temporal development cluster

Download and install the Temporal development cluster locally using Docker Compose. You'll run this server in the background while you develop your applications.

You must have [Docker](https://docs.docker.com/engine/install) and [Docker Compose](https://docs.docker.com/compose/install) installed.

Then clone the [temporalio/docker-compose](https://github.com/temporalio/docker-compose) repository and run `docker compose up` from the root of that repository:

```command
git clone https://github.com/temporalio/docker-compose.git
cd  docker-compose
docker compose up
```

When the Temporal Cluster is running, the Temporal Web UI becomes available in your browser: [localhost:8080](http://localhost:8080/).

Review other methods in the [Run a dev Cluster](https://docs.temporal.io/application-development/foundations#run-a-development-cluster) section in Temporal's documentation.

Once you have everything installed, you're ready to build apps with Temporal on your local machine.
