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

![Temporal Python SDK](/img/sdk_banners/banner_python.png)
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
Python 3.10.9
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

Next, you'll configure a local Temporal cluster for development.

## Set up a local Temporal development cluster

import Cluster from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build Temporal Applications with Python on your local machine.

