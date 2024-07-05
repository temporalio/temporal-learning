---
id: sagas
sidebar_position: 4
keywords: [Python, temporal, sdk, tutorial, saga, saga pattern, rollback, compensating actions]
tags: [Python, SDK]
last_update:
  date: 2024-03-06
title: Build a trip booking application in Python
description: Implement the Saga Pattern in Python using Temporal.
image: /img/temporal-logo-twitter-card.png
---

When dealing with distributed systems, a failure in one service can lead to a domino effect, compromising the entire transaction.
The Saga pattern offers a solution to this problem by allowing distributed transactions to be broken into smaller, manageable transactions, each with its own compensation logic in case of failure.

The Saga pattern is a design pattern that provides a mechanism to manage long-running transactions and ensure data consistency across multiple services.
Instead of a single monolithic transaction, the Saga pattern breaks the transaction into smaller, manageable steps (Activities), each step is executed sequentially, and if a step fails, previous steps are undone with a compensating step.

Temporal orchestrates long-running transactions, automatically compensating for failures.
The compensation, combined with the guarantee that the method will complete execution, makes this method a reliable, long-running transaction.

With this guide, you'll build a Flask API that uses Temporal to manage the booking process for cars, hotels, and flights.
This approach ensures that even if one part of the booking fails, the system can gracefully handle the rollback of previous steps, maintaining data consistency.

When you're finished, you'll be able to handle complex distributed transactions with ease and reliability using Temporal.

## Prerequisites

Before you begin, ensure you have the following:

- Complete the [Hello World](/getting_started/python/hello_world_in_python/index.md) tutorial
- Familiarity with asynchronous programming in Python
- Basic understanding of microservices and distributed systems
- The [Flask framework with async extras](https://flask.palletsprojects.com/en/2.3.x/async-await/) installed as a dependency of your project, which you can do with `pip install flask[async]`.

## Create the booking functions

You will start by creating the Activities for the booking process.
These Activities form the core tasks your Workflow will perform, including interacting with external services and handling potential failures.
Specifically, you'll create the booking Activities for cars, hotels, and flights.
These Activities are used to interact with external services, but for this tutorial, you will not be making any actual service calls.
Instead, you will stub these out and simulate failures by raising exceptions if a service is unavailable.
First, create a new file named `activities.py`.
This file will contain the definitions of the Activities needed for the booking process.

Import the necessary modules:

<!--SNIPSTART saga-py-activities-import-->
[activities.py](https://github.com/rachfop/saga-2/blob/main/activities.py)
```py
import asyncio

from temporalio import activity

from shared import BookVacationInput

```
<!--SNIPEND-->

The `asyncio` library is used for asynchronous operations.
The `activity` module from the `temporalio` library provides decorators and functions for defining Activities.
The `BookVacationInput` data class will be used to pass input data to the Activities.


Next, define the `book_car`, `book_hotel`, and `book_flight` Activities.
For brevity, these Activities will print a message indicating that they were invoked; however, in a real-world scenario, they would interact with external services to book the vacation.

The function will return a success message if no errors occur.

<!--SNIPSTART saga-py-activities-book-hotel-->
[activities.py](https://github.com/rachfop/saga-2/blob/main/activities.py)
```py
@activity.defn
async def book_hotel(book_input: BookVacationInput) -> str:
    """
    Books a hotel.

    Args:
        book_input (BookVacationInput): Input data for booking the hotel.

    Returns:
        str: Confirmation message.
    """
    await asyncio.sleep(1)
    attempt_info = f"Invoking activity, attempt number {activity.info().attempt}"
    if activity.info().attempt < 2:
        activity.heartbeat(attempt_info)
        await asyncio.sleep(1)
        raise RuntimeError("Hotel service is down. Retrying...")

    if "invalid" in book_input.book_hotel_id:
        raise ValueError("Invalid hotel booking, rolling back!")

    print(f"Booking hotel: {book_input.book_hotel_id}")
    return f"{book_input.book_hotel_id}"


```
<!--SNIPEND-->

The `book_car` and `book_flight` functions follow a similar structure:

<!--SNIPSTART saga-py-activities-book-car-->
[activities.py](https://github.com/rachfop/saga-2/blob/main/activities.py)
```py
@activity.defn
async def book_car(book_input: BookVacationInput) -> str:
    """
    Books a car.

    Args:
        book_input (BookVacationInput): Input data for booking the car.

    Returns:
        str: Confirmation message.
    """
    print(f"Booking car: {book_input.book_car_id}")
    return f"{book_input.book_car_id}"


```
<!--SNIPEND-->
<!--SNIPSTART saga-py-activities-book-flight-->
[activities.py](https://github.com/rachfop/saga-2/blob/main/activities.py)
```py
@activity.defn
async def book_flight(book_input: BookVacationInput) -> str:
    """
    Books a flight.

    Args:
        book_input (BookVacationInput): Input data for booking the flight.

    Returns:
        str: Confirmation message.
    """
    print(f"Booking flight: {book_input.book_flight_id}")
    return f"{book_input.book_flight_id}"


```
<!--SNIPEND-->

With the main booking Activities in place, it's time to define the compensation Activities.
These undo actions are crucial for maintaining data consistency by rolling back successful steps if a subsequent step fails.

## Define compensation actions

For every action (`book_car`, `book_hotel`, and `book_flight`), you will create a corresponding undo action.
These Activities will log the undo action and return a success message.


<!--SNIPSTART saga-py-activities-undo-book-->
[activities.py](https://github.com/rachfop/saga-2/blob/main/activities.py)
```py
@activity.defn
async def undo_book_car(book_input: BookVacationInput) -> str:
    """
    Undoes the car booking.

    Args:
        book_input (BookVacationInput): Input data for undoing the car booking.

    Returns:
        str: Confirmation message.
    """
    print(f"Undoing booking of car: {book_input.book_car_id}")
    return f"{book_input.book_car_id}"


@activity.defn
async def undo_book_hotel(book_input: BookVacationInput) -> str:
    """
    Undoes the hotel booking.

    Args:
        book_input (BookVacationInput): Input data for undoing the hotel booking.

    Returns:
        str: Confirmation message.
    """
    print(f"Undoing booking of hotel: {book_input.book_hotel_id}")
    return f"{book_input.book_hotel_id}"


@activity.defn
async def undo_book_flight(book_input: BookVacationInput) -> str:
    """
    Undoes the flight booking.

    Args:
        book_input (BookVacationInput): Input data for undoing the flight booking.

    Returns:
        str: Confirmation message.
    """
    print(f"Undoing booking of flight: {book_input.book_flight_id}")
    return f"{book_input.book_flight_id}"


```
<!--SNIPEND-->

For this example, if the number of attempts is less than the allowed number of attempts or if the booking ID is invalid, the Activity will raise exceptions to simulate failures, then run the corresponding undo action.

By setting up these compensations, you'll ensure that your system can handle failures gracefully.
Next, you'll focus on defining shared data classes and constants to support your Activities and Workflows.

## Define Shared Data Classes and Constants

Shared data classes and constants are used to pass data between Activities and Workflows.
Common mistakes include using mutable data types such as lists or dictionaries, which can cause unexpected behavior.

Also, Task Queues are shared resources that can be used by multiple Workflows and Workers.

Create a new file named `shared.py`:

<!--SNIPSTART saga-py-shared-->
[shared.py](https://github.com/rachfop/saga-2/blob/main/shared.py)
```py
from dataclasses import dataclass


@dataclass
class BookVacationInput:
    attempts: int
    book_user_id: str
    book_car_id: str
    book_hotel_id: str
    book_flight_id: str


TASK_QUEUE_NAME = "saga-task-queue"
```
<!--SNIPEND-->


These classes and constants will be used throughout Activities, Workflows, and Workers.

With your Activities and shared data classes defined, the next step is to create the Workflow.
This Workflow coordinates the execution of Activities and handles compensations to maintain consistency in case of failure.

## Define your business process

In the context of Temporal Workflows, compensation refers to the actions taken to roll back a transaction if an error occurs.
Each step in the Workflow has a corresponding compensation step that is executed in reverse order if the Workflow encounters an error.

This ensures that the system is returned to a consistent state, even in the case of partial failures.

Create a new file named `workflows.py`.
This file will define your Workflow, which is responsible for executing your Activities in the correct order and handling compensation if necessary.

First, import the necessary modules:

<!--SNIPSTART saga-py-workflows-import-->
[workflows.py](https://github.com/rachfop/saga-2/blob/main/workflows.py)
```py
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from activities import (
        BookVacationInput,
        book_car,
        book_flight,
        book_hotel,
        undo_book_car,
        undo_book_flight,
        undo_book_hotel,
    )


```
<!--SNIPEND-->

Next, create the `BookWorkflow` class and define the compensation actions, as well as the functions that execute your core logic: `book_car`, `book_hotel`, and `book_flight`.

These executions are wrapped in a `try` and `except` block to handle any exceptions and trigger compensations.

<!--SNIPSTART saga-py-workflows-run-->
[workflows.py](https://github.com/rachfop/saga-2/blob/main/workflows.py)
```py
@workflow.defn
class BookingWorkflow:
    """
    Workflow class for booking a vacation.
    """

    @workflow.run
    async def run(self, book_input: BookVacationInput):
        """
        Executes the booking workflow.

        Args:
            book_input (BookVacationInput): Input data for the workflow.

        Returns:
            str: Workflow result.
        """
        compensations = []
        results = {}
        try:
            compensations.append(undo_book_car)
            car_result = await workflow.execute_activity(
                book_car,
                book_input,
                start_to_close_timeout=timedelta(seconds=10),
            )
            results["booked_car"] = car_result

            # Book hotel
            compensations.append(undo_book_hotel)
            hotel_result = await workflow.execute_activity(
                book_hotel,
                book_input,
                start_to_close_timeout=timedelta(seconds=10),
                maximum_attempts=book_input.attempts,
                retry_policy=RetryPolicy(non_retryable_error_types=["ValueError"]),
            )
            results["booked_hotel"] = hotel_result

            # Book flight
            compensations.append(undo_book_flight)
            flight_result = await workflow.execute_activity(
                book_flight,
                book_input,
                start_to_close_timeout=timedelta(seconds=10),
                retry_policy=RetryPolicy(
                    initial_interval=timedelta(seconds=1),
                    maximum_interval=timedelta(seconds=1),
                ),
            )
            results["booked_flight"] = flight_result

            return {"status": "success", "message": results}

        except Exception as ex:
            for compensation in reversed(compensations):
                await workflow.execute_activity(
                    compensation,
                    book_input,
                    start_to_close_timeout=timedelta(seconds=10),
                )
            return {"status": "failure", "message": str(ex)}


```
<!--SNIPEND-->

The `compensations` list keeps track of the actions that need to be undone in case of a failure.
Each compensation action is appended to this list after its corresponding booking action is successfully completed.
The `try` block attempts to execute each booking Activity (`book_car`, `book_hotel`, `book_flight`) in sequence.
Each Activity Execution includes a retry policy to handle transient errors.
If any Activity fails, the `except` block catches the exception and executes the compensation activities in reverse order to undo the previously completed steps.
This ensures the system returns to a consistent state. The retry policy specifies how to handle retries for each Activity, including non-retryable error types and retry intervals.

Having defined the Workflow, you're now ready to set up the Worker that will execute these Workflows and Activities.

## Define the Worker

To make your booking logic, built with Temporal Workflows and Activities, functional and integrated into your application, you need to set up a Worker.
The Worker is responsible for executing the defined Workflows and Activities, ensuring your system can process tasks efficiently and reliably.

Create a new file named `run_worker.py`.

Import the necessary modules, including the `asyncio` library, Temporal `Client`, and `Worker`.
You will also import the Activities declared in the `activities.py` file.

<!--SNIPSTART saga-py-worker-import-->
[run_worker.py](https://github.com/rachfop/saga-2/blob/main/run_worker.py)
```py
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import (
    book_car,
    book_flight,
    book_hotel,
    undo_book_car,
    undo_book_flight,
    undo_book_hotel,
)
from shared import TASK_QUEUE_NAME
from workflows import BookingWorkflow

```
<!--SNIPEND-->

In the `main()` function, you will specify how to connect to the Temporal server, create a Worker, and run it.
This Worker will listen to the specified Task Queue and execute the defined Workflows and Activities.

<!--SNIPSTART saga-py-worker-loop-->
[run_worker.py](https://github.com/rachfop/saga-2/blob/main/run_worker.py)
```py
interrupt_event = asyncio.Event()


async def main():
    """
    Main function to start the worker.
    """
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue=TASK_QUEUE_NAME,
        workflows=[BookingWorkflow],
        activities=[
            book_car,
            book_hotel,
            book_flight,
            undo_book_car,
            undo_book_hotel,
            undo_book_flight,
        ],
    )
    print("\nWorker started, ctrl+c to exit\n")
    await worker.run()
    try:
        await interrupt_event.wait()
    finally:
        print("\nShutting down the worker\n")


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        print("\nInterrupt received, shutting down...\n")
        interrupt_event.set()
        loop.run_until_complete(loop.shutdown_asyncgens())
```
<!--SNIPEND-->

The `Client.connect()` line connects to the Temporal server running on `localhost` at port `7233`.
This can be modified to run a Worker on Temporal Cloud.

The `Worker` is initialized with the client, the Task Queue name, the list of Workflows, and the list of Activities.
This setup ensures the Worker knows which tasks to listen for and execute.
The `await worker.run()` line starts the Worker, making it ready to receive tasks and execute the corresponding Activities and Workflows.

To start the Worker, run the following command in your terminal:

```bash
# terminal one
python run_worker.py
```

Once the Worker is running, it will be ready to execute Workflows and Activities as tasks are submitted to the specified Task Queue.

Now that the Worker is set up and running, you can set up the Client to initiate the booking process.

## Build the Flask API to book trips

To make your booking logic useful, you need to integrate it into an application.
You will create a Flask endpoint that accepts posts requests, so you can send data to the Workflow to be processed by the Activities.

This setup allows you to interact with the Temporal service and trigger the booking Workflow through HTTP requests.

Create a new file named `starter.py`.

Import the necessary modules, including `uuid`, Flask, and Temporal `Client`.

<!--SNIPSTART saga-py-starter-import-->
[starter.py](https://github.com/rachfop/saga-2/blob/main/starter.py)
```py
import asyncio
import uuid

from flask import Flask, jsonify, request
from temporalio.client import Client

from shared import TASK_QUEUE_NAME, BookVacationInput
from workflows import BookingWorkflow


```
<!--SNIPEND-->

The `uuid` module is used to generate a unique ID for each booking.
The `Flask` module is used to set up the Flask API.
The `Client` module is used to connect to the Temporal Service.

Next, initialize the Flask app and set up the Temporal Client.

<!--SNIPSTART saga-py-starter-initialize-->
[starter.py](https://github.com/rachfop/saga-2/blob/main/starter.py)
```py
def create_app(temporal_client: Client):
    app = Flask(__name__)

    def generate_unique_username(name):
        return f'{name.replace(" ", "-").lower()}-{str(uuid.uuid4().int)[:6]}'

```
<!--SNIPEND-->

The `generate_unique_username` function takes a name as input, replaces spaces with hyphens, converts the string to lowercase, and appends a unique identifier generated by `uuid`.

Define a route to handle the booking process.
This function expects to receive a POST request with the following JSON body:

```json
{
    "name": "User Name",
    "attempts": 5,
    "car": "valid-car-id",
    "hotel": "valid-hotel-id",
    "flight": "valid-flight-id"
}
```

This route will accept a `POST` request, extract the necessary data from the request, initiate the Workflow, and return the result.

<!--SNIPSTART saga-py-starter-post-->
[starter.py](https://github.com/rachfop/saga-2/blob/main/starter.py)
```py
    @app.route("/book", methods=["POST"])
    async def book_vacation():
        """
        Endpoint to book a vacation.

        Returns:
            Response: JSON response with booking details or error message.
        """
        user_id = generate_unique_username(request.json.get("name"))
        attempts = request.json.get("attempts")
        car = request.json.get("car")
        hotel = request.json.get("hotel")
        flight = request.json.get("flight")

        input_data = BookVacationInput(
            attempts=int(attempts),
            book_user_id=user_id,
            book_car_id=car,
            book_hotel_id=hotel,
            book_flight_id=flight,
        )

        result = await temporal_client.execute_workflow(
            BookingWorkflow.run,
            input_data,
            id=user_id,
            task_queue=TASK_QUEUE_NAME,
        )

        response = {"user_id": user_id, "result": result}

        if result == "Voyage cancelled":
            response["cancelled"] = True

        return jsonify(response)

    return app


async def main():
    temporal_client = await Client.connect("localhost:7233")
    app = create_app(temporal_client)
    app.run(host="0.0.0.0", debug=True)


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

The route extracts the username, number of attempts, car, hotel, and flight information from the request JSON.

A `BookVacationInput` object is created with the extracted data, which will be passed to the Workflow.

The Temporal client is obtained using the `get_temporal_client()` function.

The Workflow is executed using `client.execute_workflow()`, passing the input object and other required parameters.
Based on the result of the Workflow execution, a response is prepared and returned.
If the booking process is cancelled, the response indicates this. Otherwise, it provides details about the booked car, hotel, and flight.

Next, create an async function to start the Flask app and connect to the Temporal service.

<!--SNIPSTART saga-py-starter-main-->
<!--SNIPEND-->
The `main` function connects to the Temporal service and starts the Flask app.

Dependency injection for the Temporal Client is used here to ensure it is initialized once and reused, avoiding the resource-intensive process of repeatedly starting it for each booking request.
This approach improves performance and resource management by maintaining a single, open connection for multiple bookings.

Now to start the Client, run the following command in your new terminal:

```bash
# terminal two
python3 run_workflow.py
```

Once the Client is set up, you can start the booking process and see the Saga pattern in action.

## Start the booking process

To run the booking process, you can use the following `curl` command to send a `POST` request to the `/book` endpoint.
This request will trigger the Workflow, and you will receive a response with the booking details or a cancellation message.

```bash
# terminal three
curl -X POST http://localhost:3002/book \
-H "Content-Type: application/json" \
-d '{
    "name": "John Doe",
    "attempts": 5,
    "car": "valid-car-id",
    "hotel": "valid-hotel-id",
    "flight": "valid-flight-id"
}'
```


You'll see a JSON response similar to the following:

```json
{
  "cancelled": false,
  "car": "Car: valid-car-id",
  "flight": "Flight: valid-flight-id",
  "hotel": "Hotel: valid-hotel-id",
  "result": "Booked car: valid-car-id Booked hotel: valid-hotel-id Booked flight: valid-flight-id",
  "user_id": "john-doe-184942"
}
```


You've successfully initiated and completed your booking process using the Saga pattern with Temporal in Python.
Next, you'll learn how to simulate errors to test the robustness of your implementation.

## Simulate an error

To ensure your implementation can handle failures gracefully, you will simulate a booking failure.
This step will demonstrate how the Saga pattern with Temporal manages to roll back in case of errors.

To simulate a booking failure, you can use the following `curl` command.
This request includes an invalid hotel booking ID, which will cause the booking process to fail and trigger the rollback process.

```bash
# terminal three
curl -X POST http://localhost:3002/book \
-H "Content-Type: application/json" \
-d '{
    "name": "Jane Smith",
    "attempts": 3,
    "car": "valid-car-id",
    "hotel": "invalid-hotel-id",
    "flight": "valid-flight-id"
}'
```

The value `invalid` will trigger an exception, causing the booking to rollback.


The output in your terminal will be a JSON response similar to the following:

```json
{
  "cancelled": true,
  "result": "Voyage cancelled",
  "user_id": "jane-smith-609592"
}
```

In this case, the booking process was cancelled due to the invalid hotel booking ID.
The Saga pattern ensures that any completed bookings are rolled back, maintaining a consistent state.

To verify the actions that took place during the booking process, you can use the Temporal Web UI.

Open your instance of the Temporal Web UI in your browser and navigate to the **Workflows** tab.

:::note View the Web UI

If you are using the Temporal CLI, you can visit [localhost:8233/](http://localhost:8233/).
If you are using Temporal Cloud, login to [cloud.temporal.io](https://cloud.temporal.io).

:::

Select the last completed Workflow, and in the **Timeline** view, you can see the Workflow Execution started, an Activity `book_car` completed, but the `book_hotel` Activity failed, retired, and then executed the `undo_book_hotel` and `undo_book_car` Activities.

![View of the timeline actions in the Temporal Web UI](rollback-compenstation.png)

This demonstrates how the Saga pattern with Temporal handles both successful and failing scenarios in the booking process.

## Conclusion

With this guide, you have implemented the Saga pattern using Temporal in Python to handle distributed transactions for booking services.
By following this guide, you now have a framework for your applications that can gracefully handle failures and ensure data consistency across multiple services.
You can extend this implementation to other use cases where multi-step processes need reliable and scalable orchestration.
