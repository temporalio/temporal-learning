---
id: python-dev-env
title: Set up a local development environment for Temporal and Python
sidebar_position: 1
description: Set up a local development environment for developing Temporal Applications using the Python programming language.
keywords: [python, temporal, sdk, development environment]
tags: [Python, SDK, development environment]
last_update:
  date: 2021-02-02
sidebar_label: Set up a local development environment
image: /img/temporal-logo-twitter-card.png
draft: true
---

To follow the Python SDK tutorial we recommend that you have the following environments set up.

## Install Python

Make sure you have [Python](https://www.python.org/downloads/) installed. These tutorials were produced using Python 3.10.

Check your version of Python with the following command:

```command
python3 -V
```

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
mkdir temporal-project
```

Create a Python virtual environment with `venv`:

```command
python3 -m venv env
```

Activate the environment:

```command
source env/bin/activate
```

Then install the Temporal SDK:

```command
python -m pip install temporalio
```

You'll see an output similar to the following:

```output
Successfully installed temporalio-x.y
```

Next, you'll configure a local Temporal cluster for development.

## Set up a Temporal development cluster

import Cluster from '@site/docs/getting_started/_temporal_cluster.md'

<Cluster />

Once you have everything installed, you're ready to build apps with Temporal on your local machine.

