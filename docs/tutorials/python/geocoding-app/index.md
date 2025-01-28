---
id: build-a-geocoding-application-python
title: Build a geocoding applicaton with Python
sidebar_position: 5
description: You will implement a geocoding application in Python that gets input from a user and calls a Rest API.
keywords: [Python, temporal, sdk, tutorial]
tags:
- Python
image: /img/temporal-logo-twitter-card.png
last_update:
  date: 2024-08-15
---

![Temporal Python SDK](/img/sdk_banners/banner_python.png)

### Introduction

When it comes to building business process applications, coordinating
all parts of the application from user interaction to API calls can be
complex.
Temporal shields you from these issues by providing
reliability and operability.

In this tutorial, you'll build an application
that does standard business tasks, such as getting input from a user and querying an API.
Specifically, the application will ask the user for an API key and an address, then
it will geocode the address using Geoapify.

## Prerequisites

Before starting this tutorial, complete the following 5 steps:

1. Complete the tutorial to [Set up a local development environment](/getting_started/python/dev_environment/index.md).
2. Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial.
3. Install [requests](https://requests.readthedocs.io/en/latest/) (tested with version 2.32.3).

```command
pip install requests
```

4. Get a [Geoapify](https://www.geoapify.com) API key.
5. Be sure the Temporal Service is running. If it isn't, run `temporal server start-dev` to start the Temporal Service.

Now that you have your environment ready, it's time to build an
invincible geocoder.

## Develop a Workflow to orchestrate your interactions with the user and the API

In this application, the Workflow coordinates the Activities of
getting information from the user and querying the API.

Create a new file called `workflow.py` and add
the following code:

<!--SNIPSTART python-geocode-tutorial-workflow-->
[workflow.py](https://github.com/GSmithApps/temporal-project-tutorial/blob/master/workflow.py)
```py
from datetime import timedelta
from temporalio import workflow

# Import activity, passing it through the sandbox without reloading the module
with workflow.unsafe.imports_passed_through():
    from activities import (
        get_address_from_user,
        get_api_key_from_user,
        get_lat_long,
        QueryParams,
    )

_TIMEOUT_5_MINS = 5 * 60

# Decorator for the workflow class.
# This must be set on any registered workflow class.
@workflow.defn
class GeoCode:
    """The Workflow. Orchestrates the Activities."""

    # Decorator for the workflow run method.
    # This must be set on one and only one async method defined on the same class as @workflow.defn
    @workflow.run
    async def run(self) -> list:
        """The run method of the Workflow."""

        api_key_from_user = await workflow.execute_activity(
            get_api_key_from_user,
            start_to_close_timeout=timedelta(seconds=_TIMEOUT_5_MINS),
        )

        address_from_user = await workflow.execute_activity(
            get_address_from_user,
            start_to_close_timeout=timedelta(seconds=_TIMEOUT_5_MINS),
        )

        query_params = QueryParams(api_key=api_key_from_user, address=address_from_user)

        lat_long = await workflow.execute_activity(
            get_lat_long,
            query_params,
            start_to_close_timeout=timedelta(seconds=_TIMEOUT_5_MINS),
        )

        return lat_long


```
<!--SNIPEND-->

In this code snippet, you decorated the `GeoCode` class with `@workflow.defn`, which
tells Temporal that the class is a Workflow.

You decorated the `run()` method with `@workflow.run`, which tells
Temporal that this method is the Workflow's run method. As mentioned in the code comment,
you apply this decorator to exactly one method in the Workflow.

You passed the Activities into the calls to `workflow.execute_activity(activity)`.
If the Activities need arguments, pass them in after the Activity using
`workflow.execute_activity(activity, args*, ...)`, as shown in `get_lat_long()`. It's
recommended to collapse multiple arguments into a single argument using a dataclass,
which you did here with `QueryParams`.

With the skeleton in place, you can now develop the Activities.

## Develop Activities to interact with the user and the API

In this section, you'll implement the Activities that interact
with the outside world. The Workflow is doing the orchestration,
and the Activities are doing the atomic actions.

Add the following to a new file called `activities.py`:

<!--SNIPSTART python-geocode-tutorial-activity-1-->
[activities.py](https://github.com/GSmithApps/temporal-project-tutorial/blob/master/activities.py)

```py
from temporalio import activity


# Tells Temporal that this is an Activity
@activity.defn
async def get_api_key_from_user() -> str:
    return input("Please give your API key: ")


# Tells Temporal that this is an Activity
@activity.defn
async def get_address_from_user() -> str:
    return input("Please give an address: ")


```
<!--SNIPEND-->

The `@activity.defn` decorator tells Temporal
that this function is an Activity.

You call these Activities in the Workflow you made earlier. After the Workflow
calls them, it has the user's API key and address. Next,
it calls an Activity called `get_lat_long`, with an argument of
type `QueryParams`. You'll implement that next.

Add the following
to the end of the `activities.py` file that you just made:

<!--SNIPSTART python-geocode-tutorial-activity-2-->
[activities.py](https://github.com/GSmithApps/temporal-project-tutorial/blob/master/activities.py)
```py
import requests
from dataclasses import dataclass

@dataclass
class QueryParams:
    api_key: str
    address: str

@activity.defn
async def get_lat_long(query_params: QueryParams) -> list:
    base_url = "https://api.geoapify.com/v1/geocode/search"

    params = {
        "text": query_params.address,
        "apiKey": query_params.api_key
    }

    response = requests.get(base_url, params=params, timeout=1000)

    response_json = response.json()

    lat_long = response_json['features'][0]['geometry']['coordinates']

    return lat_long
```
<!--SNIPEND-->

As mentioned before, condense the arguments to Activities into a
dataclass. In this case, the Activity is
an API call that needs the user's location and API key, so you'll
bundle those as a data class. That's `QueryParams`.

Now that you have the Workflow and Actions, you need to run them. In
the next section, you'll begin that process by making and running a Worker.

## Create and run a Worker to host your Workflow and Activities

The Worker
is the process that connects to the Temporal Service and listens
on a Task Queue. Here is how you can make
and run a Worker.

Make a new file called `run_worker.py` and
enter the following:

<!--SNIPSTART python-geocode-tutorial-run-worker-->
[run_worker.py](https://github.com/GSmithApps/temporal-project-tutorial/blob/master/run_worker.py)
```py
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import get_address_from_user, get_api_key_from_user, get_lat_long
from workflow import GeoCode


async def main():

    client = await Client.connect("localhost:7233", namespace="default")

    worker = Worker(
        client,
        task_queue="geocode-task-queue",
        workflows=[GeoCode],
        activities=[get_address_from_user, get_api_key_from_user, get_lat_long],
    )

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

This snippet connects to the Temporal Service using `Client.connect()`.
For this to work, the Temporal Service
needs to be running, as mentioned in the prerequisites.

The arguments to the Worker constructor are the following:

- `client` - the connection to the Temporal Service.
- `task_queue` - the Task Queue that the Worker listens on (later,
when you run the Workflow, you'll put items on that Task Queue).
- `workflows` - the list of Workflows it can process.
- `activities` - a list of Activities that it can process.

The last step is to await the Worker's `.run()` method. This is what makes the Worker run
and start listening for work on the Task Queue. You will run it now:

1. Open a new terminal (keep the service running
   in a different terminal).
2. Navigate to the project directory, and run
   the following command (it won't output anything yet).

```command
python run_worker.py
```

It will start listening, but it has nothing
to do yet because there is nothing on the queue. You will
fix that in the next section by running the Workflow.

## Run the Workflow to execute the application

The last piece is executing the Workflow. 

Enter the following code in a new file called `run_workflow.py`.

<!--SNIPSTART python-geocode-tutorial-run-workflow-->
[run_workflow.py](https://github.com/GSmithApps/temporal-project-tutorial/blob/master/run_workflow.py)
```py
import asyncio

from workflow import GeoCode
from temporalio.client import Client


async def main():
    # Create a client connected to the server at the given address
    client = await Client.connect("localhost:7233")

    # Execute a workflow
    lat_long = await client.execute_workflow(
        GeoCode.run, id="geocode-workflow", task_queue="geocode-task-queue"
    )

    print(f"Lat long: {lat_long}")


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

In this piece, you connect to the service, then call `execute_workflow()`.
Its arguments are the following:

- The Workflow method that you decorated with `@workflow.defn`.
- The ID for the Workflow.
- The Task Queue.

You're ready to run the code. Do the following 4 steps:

1. Open a third terminal (the other
   two processes should still be running).
2. Navigate to the project
   directory, and run the following command:
  
```command
python run_workflow.py
```
  
At this point, the
application is running. If you look at the terminal
that's running the Worker (not the terminal that's running the Workflow),
it should be asking you for your
API key.

3. Enter the Geoapify API key mentioned in the prerequisites:

```txt
python run_worker.py

Please give your API key: 1234567890abcdefghijklmnopqrstuv
```

Next, it will ask you for an address.

4. Enter an address:

```txt
python run_worker.py

Please give your API key: 1234567890abcdefghijklmnopqrstuv
Please give an address: 1 Arrowhead Dr, Kansas City, MO 64129
```

It will query Geoapify to
geocode the address, and it will print the latitude and longitude
to the terminal running the Workflow:

```txt
python run_workflow.py

Lat long: [-94.486453, 39.048855]
```

## Conclusion

You have built a business process application that
runs invincibly with Temporal.

For more detail on how Temporal can help business process
applications, please see Temporal's Chief Product Officer's discussion
in [The Top 3 Use Cases for Temporal (ft. Temporal PMs)](https://www.youtube.com/watch?v=eMf1fk9RmhY&t=299s).

### Next Steps

Try defining a Retry Policy and applying it to the Activities.

<details>
<summary>
What does Temporal recommend to do in Activities instead of in
Workflows? Which ones did you do in this tutorial?
</summary>
Activities perform anything that may be non-deterministic, may fail,
or may have side effects. This could be writing to
disk, reading from a database, or getting information
from a user. In this Activity, you got input from the user via
the command line, and you queried a REST API.

</details>

<details>
<summary>
What pieces of information does a Worker need when instantiated? This
example had four.
</summary>
<ul>
    <li>A client/connection to the Temporal Service.</li>
    <li>A Task Queue.</li>
    <li>A list of Workflows.</li>
    <li>A list of Activities.</li>
</ul>

</details>

<details>
<summary>
How do you denote that a piece of Python code is a Workflow?
</summary>
You decorate a class with the <code>@workflow.defn</code> decorator, and you decorate exactly one of its methods
with <code>@workflow.run</code>.
</details>
