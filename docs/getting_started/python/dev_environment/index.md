---
id: python-dev-env
title: Set up a local development environment for Temporal and Python
sidebar_position: 1
description: Set up a local development environment for developing Temporal Applications using the Python programming language.
keywords: [python, temporal, sdk, development environment]
tags: [Python, SDK, development environment]
last_update:
  date: 2023-03-27
image: /img/temporal-logo-twitter-card.png
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<img className="banner" src="/img/sdk_banners/banner_python.png" alt="Temporal Python SDK" />

### Introduction

Follow these instructions to configure a development environment for building Temporal Applications with Python.

## Install Python

Make sure you have [Python](https://www.python.org/downloads/) installed. These tutorials use Python 3.10.

Check your version of Python with the following command:

<Tabs groupId="os" queryString>
  <TabItem value="win" label="Windows">

```command
python -V
```

  </TabItem>
  <TabItem value="mac" label="macOS">

```command
python3 -V
```

  </TabItem>
</Tabs>

You'll see the version printed to the screen:

```
Python 3.13.2
```


## Install the Temporal Python SDK

You should install the Temporal Python SDK in your project using a virtual environment.

Create a directory for your Temporal project:

```command
mkdir temporal-project
```

Switch to the new directory:

```command
cd temporal-project
```

Create a Python virtual environment with `venv`:

<Tabs queryString groupId="os">
  <TabItem value="win" label="Windows">

```command
python -m venv env
```

  </TabItem>
  <TabItem value="mac" label="macOS">

```command
python3 -m venv env
```

  </TabItem>
</Tabs>


Activate the environment:

<Tabs queryString groupId="os">
  <TabItem value="win" label="Windows">

```command
env\Scripts\activate
```

  </TabItem>
  <TabItem value="mac" label="macOS">

```command
source env/bin/activate
```

  </TabItem>
</Tabs>

Then install the Temporal SDK:

```command
python -m pip install temporalio
```

You'll see an output similar to the following:

```output
Successfully installed temporalio-x.y
```

Next, you'll configure a local Temporal Service for development.

## Set up a local Temporal Service for development with Temporal CLI

The fastest way to get a development version of the Temporal Service running on your local machine is to use [Temporal CLI](https://docs.temporal.io/cli).

Temporal CLI is a tool for interacting with the Temporal Service from the command-line interface. It includes a self-contained distribution of the Temporal Service and [Web UI](https://docs.temporal.io/web-ui) as well which you can use for local development.

Install Temporal CLI on your local machine using the following instructions for your platform.

<Tabs groupId="os" queryString>
  <TabItem value="mac" label="macOS">

You can install the latest version with [Homebrew](https://brew.sh) using the following command:

```command
brew install temporal
```

  </TabItem>
  <TabItem value="win" label="Windows">

To install Temporal CLI on Windows, download the version for your architecture:

- [Download Temporal CLI for Windows amd64](https://temporal.download/cli/archive/latest?platform=windows&arch=amd64)
- [Download Temporal CLI for Windows arm64](https://temporal.download/cli/archive/latest?platform=windows&arch=arm64)

Once you've downloaded the file, extract the downloaded archive and add the `temporal.exe` binary to your `PATH`.

  </TabItem>
  <TabItem value="linux" label="Linux">


To install Temporal CLI, download the version for your architecture

- [Download Temporal CLI for Linux amd64](https://temporal.download/cli/archive/latest?platform=linux&arch=amd64)
- [Download Temporal CLI for Linux arm64](https://temporal.download/cli/archive/latest?platform=linux&arch=arm64)

Once you've downloaded the file, extract the downloaded archive and add the `temporal` binary to your `PATH` by copying it to a directory like `/usr/local/bin`.

  </TabItem>
</Tabs>

Once you've installed Temporal CLI and added it to your `PATH`, open a new terminal window in your project directory and run the following command:

```command
temporal server start-dev --db-filename temporal.db
```

This command starts a local Temporal Service and the Web UI, creates the default [Namespace](https://docs.temporal.io/namespaces), and saves Workflow state in a local SQLite file named `temporal.db`.

* The Temporal Service will be available on `localhost:7233`.
* The Temporal Web UI will be available at [`http://localhost:8233`](http://localhost:8233/).

Leave the local Temporal Service running as you work through tutorials and other projects. You can stop it at any time by pressing `CTRL+C`.
When restarting, run the same command from the same directory to reuse the database file and retain your Workflows.
Persistent storage is required for the [server-crash recovery exercise](../first_program_in_python/index.md#recover-from-a-server-crash) in the next tutorial.

:::tip Change the Web UI port

The Temporal Web UI may be on a different port in some examples or tutorials. To change the port for the Web UI, use the `--ui-port` option when starting the server:

```command
temporal server start-dev --db-filename temporal.db --ui-port 8080
```

The Temporal Web UI will now be available at [`http://localhost:8080`](http://localhost:8080/).
:::

If you omit `--db-filename`, the server uses an in-memory database and loses its state when stopped.

Once you have everything installed, you're ready to build Temporal Applications with Python on your local machine.

