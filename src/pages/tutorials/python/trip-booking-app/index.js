// Single-page tutorial: Build a trip booking application using the Saga pattern in Python.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-booking-functions", label: "Create the booking functions" },
  { id: "define-compensating-actions", label: "Define compensating actions" },
  { id: "shared-data-classes", label: "Define shared data classes" },
  { id: "define-business-process", label: "Define your business process" },
  { id: "define-worker", label: "Define the Worker" },
  { id: "build-flask-api", label: "Build the Flask API" },
  { id: "start-booking", label: "Start the booking process" },
  { id: "verify-compensations", label: "Verify compensations work" },
  { id: "conclusion", label: "Conclusion" },
];

const ACTIVITIES_IMPORT_PY = `import asyncio

from temporalio import activity

from shared import BookVacationInput`;

const ACTIVITIES_BOOK_PY = `@activity.defn
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
    return f"{book_input.book_flight_id}"`;

const ACTIVITIES_UNDO_PY = `@activity.defn
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
    return f"{book_input.book_flight_id}"`;

const SHARED_PY = `from dataclasses import dataclass


@dataclass
class BookVacationInput:
    attempts: int
    book_user_id: str
    book_car_id: str
    book_hotel_id: str
    book_flight_id: str


TASK_QUEUE_NAME = "saga-task-queue"`;

const WORKFLOWS_IMPORT_PY = `from datetime import timedelta

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
    )`;

const WORKFLOWS_RUN_PY = `@workflow.defn
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
            return {"status": "failure", "message": str(ex)}`;

const WORKER_IMPORT_PY = `import asyncio

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
from workflows import BookingWorkflow`;

const WORKER_LOOP_PY = `interrupt_event = asyncio.Event()


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
    print("\\nWorker started, ctrl+c to exit\\n")
    await worker.run()
    try:
        await interrupt_event.wait()
    finally:
        print("\\nShutting down the worker\\n")


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        print("\\nInterrupt received, shutting down...\\n")
        interrupt_event.set()
        loop.run_until_complete(loop.shutdown_asyncgens())`;

const STARTER_IMPORT_PY = `import asyncio
import uuid

from flask import Flask, jsonify, request
from temporalio.client import Client

from shared import TASK_QUEUE_NAME, BookVacationInput
from workflows import BookingWorkflow`;

const STARTER_INIT_PY = `def create_app(temporal_client: Client):
    app = Flask(__name__)

    def generate_unique_username(name):
        return f'{name.replace(" ", "-").lower()}-{str(uuid.uuid4().int)[:6]}'`;

const STARTER_POST_PY = `    @app.route("/book", methods=["POST"])
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

    return app`;

const STARTER_MAIN_PY = `async def main():
    temporal_client = await Client.connect("localhost:7233")
    app = create_app(temporal_client)
    app.run(host="0.0.0.0", debug=True)


if __name__ == "__main__":
    asyncio.run(main())`;

const REQUEST_BODY_JSON = `{
    "name": "User Name",
    "attempts": 5,
    "car": "valid-car-id",
    "hotel": "valid-hotel-id",
    "flight": "valid-flight-id"
}`;

const SUCCESS_CURL = `# terminal three
curl -X POST http://localhost:3000/book \\
    -H "Content-Type: application/json" \\
        -d '{
        "name": "John Doe",
        "attempts": 5,
        "car": "valid-car-id",
        "hotel": "valid-hotel-id",
        "flight": "valid-flight-id"
    }'`;

const SUCCESS_RESPONSE = `{
  "cancelled": false,
  "car": "Car: valid-car-id",
  "flight": "Flight: valid-flight-id",
  "hotel": "Hotel: valid-hotel-id",
  "result": "Booked car: valid-car-id Booked hotel: valid-hotel-id Booked flight: valid-flight-id",
  "user_id": "john-doe-184942"
}`;

const FAILURE_CURL = `# terminal three
curl -X POST http://localhost:3000/book \\
    -H "Content-Type: application/json" \\
    -d '{
        "name": "Jane Smith",
        "attempts": 3,
        "car": "valid-car-id",
        "hotel": "invalid-hotel-id",
        "flight": "valid-flight-id"
    }'`;

const FAILURE_RESPONSE = `{
  "cancelled": true,
  "result": "Voyage cancelled",
  "user_id": "jane-smith-609592"
}`;

const IMG_BASE = "/img/tutorials/python/trip-booking-app";

export default function TripBookingAppPage() {
  return (
    <Layout
      title="Build a trip booking application in Python"
      description="Implement the Saga Pattern in Python using Temporal - coordinate multiple bookings with compensating Activities when something fails."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_python.png"
            alt="Temporal Python SDK"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Python", href: "/tutorials/python" },
                  { label: "Build a trip booking app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a trip booking application in Python
            </h1>

            <MetaChips items={["~90 minutes", "Intermediate", "Python"]} />

            <p className={styles.intro}>
              When dealing with distributed systems, a failure in one
              service can lead to a domino effect, compromising the entire
              transaction. The Saga pattern offers a solution to this
              problem by allowing distributed transactions to be broken into
              smaller, manageable transactions, each with its own
              compensation logic in case of failure.
            </p>
            <p>
              The Saga pattern is a design pattern that provides a mechanism
              to manage long-running transactions and ensure data
              consistency across multiple services. Instead of a single
              monolithic transaction, the Saga pattern breaks the
              transaction into smaller, manageable steps (Activities). Each
              step is executed sequentially, and if a step fails, previous
              steps are undone with a compensating step.
            </p>
            <p>
              Temporal orchestrates long-running transactions, automatically
              compensating for failures. The compensation, combined with the
              guarantee that the method will complete execution, makes this
              method a reliable, long-running transaction.
            </p>
            <p>
              With this guide, you'll build a Flask API that uses Temporal
              to manage the booking process for cars, hotels, and flights.
              This approach ensures that even if one part of the booking
              fails, the system can gracefully handle the rollback of
              previous steps, maintaining data consistency.
            </p>
            <p>
              When you're finished, you'll be able to handle complex
              distributed transactions with ease and reliability using
              Temporal.
            </p>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before you begin, ensure you have the following:</p>
              <ul>
                <li>
                  Complete the{" "}
                  <Link to="/getting_started/python/hello_world_in_python/">
                    Hello World
                  </Link>{" "}
                  tutorial
                </li>
                <li>Familiarity with asynchronous programming in Python</li>
                <li>Basic understanding of microservices and distributed systems</li>
                <li>
                  The{" "}
                  <a
                    href="https://flask.palletsprojects.com/en/2.3.x/async-await/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Flask framework with async extras
                  </a>{" "}
                  installed as a dependency of your project, which you can
                  do with <code>pip install flask[async]</code>.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-booking-functions">
              <h2 className={styles.sectionTitle}>
                Create the booking functions
              </h2>
              <p>
                You will start by creating the individual components for the
                booking process. You'll create a Temporal Workflow and a set
                of Activities. Activities let you interact with services,
                and Workflows orchestrate the Activities. These Activities
                form the core tasks your Workflow will perform, including
                interacting with external services and handling potential
                failures.
              </p>
              <p>
                Specifically, you'll create the booking Activities for cars,
                hotels, and flights. These Activities are used to interact
                with external services, but for this tutorial, you will not
                be making any actual service calls. Instead, you will stub
                these out and simulate failures by raising exceptions if a
                service is unavailable.
              </p>
              <p>
                First, create a new file named <code>activities.py</code>.
                This file will contain the definitions of the Activities
                needed for the booking process.
              </p>
              <p>Import the necessary modules:</p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITIES_IMPORT_PY}
              </CodeBlock>
              <p>
                The <code>asyncio</code> library is used for asynchronous
                operations. The <code>activity</code> module from the{" "}
                <code>temporalio</code> library provides decorators and
                functions for defining Activities. You'll use the{" "}
                <code>BookVacationInput</code> data class to pass input data
                to the Activities. You'll define this data class later in
                this tutorial.
              </p>
              <p>
                Next, define the <code>book_car</code>, <code>book_hotel</code>,
                and <code>book_flight</code> Activities. For brevity, these
                Activities will print a message indicating that they were
                invoked; however, in a real-world scenario, they would
                interact with external services to book the vacation.
              </p>
              <p>The function will return a success message if no errors occur.</p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITIES_BOOK_PY}
              </CodeBlock>
              <p>
                The <code>book_car</code> and <code>book_flight</code>{" "}
                functions follow a similar structure.
              </p>
              <p>
                With the main booking Activities in place, it's time to
                define the compensation Activities. These undo actions are
                crucial for maintaining data consistency by rolling back
                successful steps if a subsequent step fails.
              </p>
            </section>

            <section className={styles.section} id="define-compensating-actions">
              <h2 className={styles.sectionTitle}>Define compensating actions</h2>
              <p>
                For every action (<code>book_car</code>, <code>book_hotel</code>,
                and <code>book_flight</code>), you will create a corresponding
                undo action. These Activities will log the undo action and
                return a success message.
              </p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITIES_UNDO_PY}
              </CodeBlock>
              <p>
                For this example, if the number of attempts is less than the
                allowed number of attempts or if the booking ID is invalid,
                the Activity will raise exceptions to simulate failures,
                then run the corresponding undo action.
              </p>
              <p>
                By setting up these compensations, you'll ensure that your
                system can handle failures gracefully. Next, you'll focus on
                defining shared data classes and constants to support your
                Activities and Workflows.
              </p>
            </section>

            <section className={styles.section} id="shared-data-classes">
              <h2 className={styles.sectionTitle}>
                Define shared data classes and constants
              </h2>
              <p>
                Shared data classes and constants are used to pass data
                between Activities and Workflows. Common mistakes include
                using mutable data types such as lists or dictionaries,
                which can cause unexpected behavior.
              </p>
              <p>
                Also, Task Queues are shared resources that can be used by
                multiple Workflows and Workers.
              </p>
              <p>Create a new file named <code>shared.py</code>:</p>
              <CodeBlock language="py" title="shared.py">
                {SHARED_PY}
              </CodeBlock>
              <p>
                These classes and constants will be used throughout
                Activities, Workflows, and Workers.
              </p>
              <p>
                With your Activities and shared data classes defined, the
                next step is to create the Workflow. This Workflow
                coordinates the execution of Activities and handles
                compensations to maintain consistency in case of failure.
              </p>
            </section>

            <section className={styles.section} id="define-business-process">
              <h2 className={styles.sectionTitle}>Define your business process</h2>
              <p>
                In the context of Temporal Workflows, compensation refers to
                the actions taken to roll back a transaction if an error
                occurs. Each step in the Workflow has a corresponding
                compensation step that is executed in reverse order if the
                Workflow encounters an error.
              </p>
              <p>
                This ensures that the system is returned to a consistent
                state, even in the case of partial failures.
              </p>
              <p>
                Create a new file named <code>workflows.py</code>. This file
                will define your Workflow, which is responsible for
                executing your Activities in the correct order and handling
                compensation if necessary.
              </p>
              <p>First, import the necessary modules:</p>
              <CodeBlock language="py" title="workflows.py">
                {WORKFLOWS_IMPORT_PY}
              </CodeBlock>
              <p>
                Next, create the <code>BookWorkflow</code> class and define
                the compensation actions, as well as the functions that
                execute your core logic: <code>book_car</code>,{" "}
                <code>book_hotel</code>, and <code>book_flight</code>.
              </p>
              <p>
                These executions are wrapped in a <code>try</code> and{" "}
                <code>except</code> block to handle any exceptions and
                trigger compensations.
              </p>
              <CodeBlock language="py" title="workflows.py">
                {WORKFLOWS_RUN_PY}
              </CodeBlock>
              <p>
                The <code>compensations</code> list keeps track of the
                actions that need to be undone in case of a failure. Each
                compensation action is appended to this list after its
                corresponding booking action is successfully completed.
              </p>
              <p>
                The <code>try</code> block attempts to execute each booking
                Activity (<code>book_car</code>, <code>book_hotel</code>,{" "}
                <code>book_flight</code>) in sequence. Each Activity
                Execution includes a retry policy to handle transient
                errors. If any Activity fails, the <code>except</code> block
                catches the exception and executes the compensation
                activities in reverse order to undo the previously completed
                steps.
              </p>
              <p>
                This ensures the system returns to a consistent state. The
                retry policy specifies how to handle retries for each
                Activity, including non-retryable error types and retry
                intervals.
              </p>
              <p>
                Having defined the Workflow, you're now ready to set up the
                Worker that will execute these Workflows and Activities.
              </p>
            </section>

            <section className={styles.section} id="define-worker">
              <h2 className={styles.sectionTitle}>Define the Worker</h2>
              <p>
                To make your booking logic, built with Temporal Workflows
                and Activities, functional and integrated into your
                application, you need to set up a Worker. The Worker is
                responsible for executing the defined Workflows and
                Activities, ensuring your system can process tasks
                efficiently and reliably.
              </p>
              <p>Create a new file named <code>run_worker.py</code>.</p>
              <p>
                Import the necessary modules, including the{" "}
                <code>asyncio</code> library, Temporal <code>Client</code>,
                and <code>Worker</code>. You will also import the Activities
                declared in the <code>activities.py</code> file.
              </p>
              <CodeBlock language="py" title="run_worker.py">
                {WORKER_IMPORT_PY}
              </CodeBlock>
              <p>
                In the <code>main()</code> function, you will specify how to
                connect to the Temporal server, create a Worker, and run it.
                This Worker will listen to the specified Task Queue and
                execute the defined Workflows and Activities.
              </p>
              <CodeBlock language="py" title="run_worker.py">
                {WORKER_LOOP_PY}
              </CodeBlock>
              <p>
                The <code>Client.connect()</code> line connects to the
                Temporal server running on <code>localhost</code> at port{" "}
                <code>7233</code>. This can be modified to run a Worker on
                Temporal Cloud.
              </p>
              <p>
                The <code>Worker</code> is initialized with the client, the
                Task Queue name, the list of Workflows, and the list of
                Activities. This setup ensures the Worker knows which tasks
                to listen for and execute. The <code>await worker.run()</code>{" "}
                line starts the Worker, making it ready to receive tasks
                and execute the corresponding Activities and Workflows.
              </p>
              <p>To start the Worker, run the following command in your terminal:</p>
              <CodeBlock language="bash">
                {`# terminal one\npython run_worker.py`}
              </CodeBlock>
              <p>
                Once the Worker is running, it will be ready to execute
                Workflows and Activities as tasks are submitted to the
                specified Task Queue.
              </p>
              <p>
                Now that the Worker is set up and running, you can set up
                the Client to initiate the booking process.
              </p>
            </section>

            <section className={styles.section} id="build-flask-api">
              <h2 className={styles.sectionTitle}>
                Build the Flask API to book trips
              </h2>
              <p>
                To make your booking logic useful, you need to integrate it
                into an application. You will create a Flask endpoint that
                accepts post requests, so you can send data to the Workflow
                to be processed by the Activities.
              </p>
              <p>
                This setup allows you to interact with the Temporal service
                and trigger the booking Workflow through HTTP requests.
              </p>
              <p>Create a new file named <code>starter.py</code>.</p>
              <p>
                Import the necessary modules, including <code>uuid</code>,
                Flask, and Temporal <code>Client</code>.
              </p>
              <CodeBlock language="py" title="starter.py">
                {STARTER_IMPORT_PY}
              </CodeBlock>
              <p>
                The <code>uuid</code> module is used to generate a unique ID
                for each booking. The <code>Flask</code> module is used to
                set up the Flask API. The <code>Client</code> module is
                used to connect to the Temporal Service.
              </p>
              <p>Next, initialize the Flask app and set up the Temporal Client.</p>
              <CodeBlock language="py" title="starter.py">
                {STARTER_INIT_PY}
              </CodeBlock>
              <p>
                The <code>generate_unique_username</code> function takes a
                name as input, replaces spaces with hyphens, converts the
                string to lowercase, and appends a unique identifier
                generated by <code>uuid</code>.
              </p>
              <p>
                Define a route to handle the booking process. This function
                expects to receive a POST request with the following JSON
                body:
              </p>
              <CodeBlock language="json">{REQUEST_BODY_JSON}</CodeBlock>
              <p>
                This route will accept a <code>POST</code> request, extract
                the necessary data from the request, initiate the Workflow,
                and return the result.
              </p>
              <CodeBlock language="py" title="starter.py">
                {STARTER_POST_PY}
              </CodeBlock>
              <p>
                The route extracts the username, number of attempts, car,
                hotel, and flight information from the request JSON.
              </p>
              <p>
                A <code>BookVacationInput</code> object is created with the
                extracted data, which will be passed to the Workflow.
              </p>
              <p>
                The Temporal client is obtained using the{" "}
                <code>get_temporal_client()</code> function.
              </p>
              <p>
                The Workflow is executed using{" "}
                <code>client.execute_workflow()</code>, passing the input
                object and other required parameters. Based on the result
                of the Workflow execution, a response is prepared and
                returned. If the booking process is cancelled, the response
                indicates this. Otherwise, it provides details about the
                booked car, hotel, and flight.
              </p>
              <p>
                Next, create an async function to start the Flask app and
                connect to the Temporal service.
              </p>
              <CodeBlock language="py" title="starter.py">
                {STARTER_MAIN_PY}
              </CodeBlock>
              <p>
                The <code>main</code> function connects to the Temporal
                service and starts the Flask app.
              </p>
              <p>
                Dependency injection for the Temporal Client is used here to
                ensure it is initialized once and reused, avoiding the
                resource-intensive process of repeatedly starting it for
                each booking request. This approach improves performance
                and resource management by maintaining a single, open
                connection for multiple bookings.
              </p>
              <p>Now to start the Client, run the following command in your new terminal:</p>
              <CodeBlock language="bash">
                {`# terminal two\npython3 run_workflow.py`}
              </CodeBlock>
              <p>
                Once the Client is set up, you can start the booking
                process and see the Saga pattern in action.
              </p>
            </section>

            <section className={styles.section} id="start-booking">
              <h2 className={styles.sectionTitle}>Start the booking process</h2>
              <p>
                To run the booking process, you can use the following{" "}
                <code>curl</code> command to send a <code>POST</code>{" "}
                request to the <code>/book</code> endpoint. This request
                will trigger the Workflow, and you will receive a response
                with the booking details or a cancellation message.
              </p>
              <CodeBlock language="bash">{SUCCESS_CURL}</CodeBlock>
              <p>You'll see a JSON response similar to the following:</p>
              <CodeBlock language="json">{SUCCESS_RESPONSE}</CodeBlock>
              <p>
                You've successfully initiated and completed your booking
                process using the Saga pattern with Temporal in Python.
                Next, you'll ensure that you can roll back transactions
                that fail by simulating a failure.
              </p>
            </section>

            <section className={styles.section} id="verify-compensations">
              <h2 className={styles.sectionTitle}>
                Verify compensations work properly
              </h2>
              <p>
                To ensure your implementation can handle failures
                gracefully, you will simulate a booking failure. This step
                will demonstrate how the Saga pattern with Temporal manages
                to roll back in case of errors.
              </p>
              <p>
                To simulate a booking failure, you can use the following{" "}
                <code>curl</code> command. This request includes an invalid
                hotel booking ID, which will cause the booking process to
                fail and trigger the rollback process.
              </p>
              <CodeBlock language="bash">{FAILURE_CURL}</CodeBlock>
              <p>
                The value <code>invalid</code> will trigger an exception,
                causing the booking to rollback.
              </p>
              <p>The output in your terminal will be a JSON response similar to the following:</p>
              <CodeBlock language="json">{FAILURE_RESPONSE}</CodeBlock>
              <p>
                In this case, the booking process was cancelled due to the
                invalid hotel booking ID. The Saga pattern ensures that any
                completed bookings are rolled back, maintaining a
                consistent state.
              </p>
              <p>
                To verify the actions that took place during the booking
                process, you can use the Temporal Web UI.
              </p>
              <p>
                Open your instance of the Temporal Web UI in your browser
                and navigate to the <strong>Workflows</strong> tab.
              </p>

              <Admonition type="note" title="View the Web UI">
                <p>
                  If you are using the Temporal CLI, you can visit{" "}
                  <a
                    href="http://localhost:8233/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    localhost:8233/
                  </a>
                  . If you are using Temporal Cloud, login to{" "}
                  <a
                    href="https://cloud.temporal.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    cloud.temporal.io
                  </a>
                  .
                </p>
              </Admonition>

              <p>
                Select the last completed Workflow, and in the{" "}
                <strong>Timeline</strong> view, you can see the Workflow
                Execution started, an Activity <code>book_car</code>{" "}
                completed, but the <code>book_hotel</code> Activity failed,
                retried, and then executed the <code>undo_book_hotel</code>{" "}
                and <code>undo_book_car</code> Activities.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/rollback-compenstation.png`}
                  alt="View of the timeline actions in the Temporal Web UI"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                This demonstrates how the Saga pattern with Temporal
                handles both successful and failing scenarios in the
                booking process.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You've built a basic trip booking API by using the Saga
                pattern and Temporal to handle distributed transactions for
                booking services. You now have a framework for your
                applications that can gracefully handle failures and ensure
                data consistency across multiple services. You can extend
                this implementation to other use cases where multi-step
                processes need reliable and scalable orchestration.
              </p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/python/build-an-email-drip-campaign/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build an email drip campaign</h3>
                  <p className={styles.nextBody}>
                    Manage long-running email subscriptions with Workflows,
                    Queries, and Cancellation Requests.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/python/build-a-data-pipeline/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build a data pipeline</h3>
                  <p className={styles.nextBody}>
                    Orchestrate steps in a data pipeline and run it on a
                    Schedule.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
