// Single-page tutorial: Build an email drip campaign with Python.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "develop-workflow", label: "Develop the Workflow" },
  { id: "develop-activity", label: "Develop the Activity" },
  { id: "create-worker", label: "Create the Worker" },
  { id: "build-api-server", label: "Build the API server" },
  { id: "add-query", label: "Add a Query" },
  { id: "unsubscribe", label: "Unsubscribe with Cancellation" },
  { id: "integration-test", label: "Create an integration test" },
  { id: "conclusion", label: "Conclusion" },
];

const SHARED_OBJECTS_PY = `from dataclasses import dataclass

task_queue_name = "email_subscription"


@dataclass
class WorkflowOptions:
    email: str


@dataclass
class EmailDetails:
    email: str = ""
    message: str = ""
    count: int = 0
    subscribed: bool = False`;

const WORKFLOWS_PY = `import asyncio
from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities import send_email
    from shared_objects import EmailDetails, WorkflowOptions


@workflow.defn
class SendEmailWorkflow:
    def __init__(self) -> None:
        self.email_details = EmailDetails()

    @workflow.run
    async def run(self, data: WorkflowOptions) -> None:
        duration = 12
        self.email_details.email = data.email
        self.email_details.message = "Welcome to our Subscription Workflow!"
        self.email_details.subscribed = True
        self.email_details.count = 0

        while self.email_details.subscribed:
            self.email_details.count += 1
            if self.email_details.count > 1:
                self.email_details.message = "Thank you for staying subscribed!"

            try:
                await workflow.execute_activity(
                    send_email,
                    self.email_details,
                    start_to_close_timeout=timedelta(seconds=10),
                )
                await asyncio.sleep(duration)

            except asyncio.CancelledError as err:
                # Cancelled by the user. Send them a goodbye message.
                self.email_details.subscribed = False
                self.email_details.message = "Sorry to see you go"
                await workflow.execute_activity(
                    send_email,
                    self.email_details,
                    start_to_close_timeout=timedelta(seconds=10),
                )
                # raise error so workflow shows as cancelled.
                raise err`;

const ACTIVITIES_PY = `from temporalio import activity

from shared_objects import EmailDetails


@activity.defn
async def send_email(details: EmailDetails) -> str:
    print(
        f"Sending email to {details.email} with message: {details.message}, count: {details.count}"
    )
    return "success"`;

const RUN_WORKER_PY = `import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities import send_email
from shared_objects import task_queue_name
from workflows import SendEmailWorkflow


async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue=task_queue_name,
        workflows=[SendEmailWorkflow],
        activities=[send_email],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())`;

const RUN_FLASK_IMPORTS_PY = `# ...
import asyncio

from flask import Flask, current_app, jsonify, make_response, request
from temporalio.client import Client

from run_worker import SendEmailWorkflow
from shared_objects import WorkflowOptions, task_queue_name

app = Flask(__name__)


async def connect_temporal(app):
    client = await Client.connect("localhost:7233")
    app.temporal_client = client


def get_client() -> Client:
    return current_app.temporal_client`;

const RUN_FLASK_SUBSCRIBE_PY = `# ...
@app.route("/subscribe", methods=["POST"])
async def start_subscription():
    client = get_client()

    email: str = str(request.json.get("email"))
    data: WorkflowOptions = WorkflowOptions(email=email)
    await client.start_workflow(
        SendEmailWorkflow.run,
        data,
        id=data.email,
        task_queue=task_queue_name,
    )

    message = jsonify({"message": "Resource created successfully"})
    response = make_response(message, 201)
    return response`;

const QUERY_PY = `# ...
    @workflow.query
    def details(self) -> EmailDetails:
        return self.email_details`;

const RUN_FLASK_GET_DETAILS_PY = `# ...
@app.route("/get_details", methods=["GET"])
async def get_query():
    client = get_client()
    email = request.args.get("email")
    handle = client.get_workflow_handle_for(SendEmailWorkflow.run, email)
    results = await handle.query(SendEmailWorkflow.details)
    message = jsonify(
        {
            "email": results.email,
            "message": results.message,
            "subscribed": results.subscribed,
            "numberOfEmailsSent": results.count,
        }
    )

    response = make_response(message, 200)
    return response`;

const RUN_FLASK_UNSUBSCRIBE_PY = `# ...

@app.route("/unsubscribe", methods=["DELETE"])
async def end_subscription():
    client = get_client()
    email: str = str(request.json.get("email"))
    handle = client.get_workflow_handle(
        email,
    )
    await handle.cancel()
    message = jsonify({"message": "Requesting cancellation"})

    # Return 202 because this is a request to cancel and the API has accepted
    # the request but has not processed yet.
    response = make_response(message, 202)
    return response


if __name__ == "__main__":
    # Create Temporal connection.
    asyncio.run(connect_temporal(app))

    # Start API
    app.run(debug=True)`;

const CANCELLED_WORKFLOW_SNIPPET = `# ...
            try:
                await workflow.execute_activity(
                    send_email,
                    self.email_details,
                    start_to_close_timeout=timedelta(seconds=10),
                )
                await asyncio.sleep(duration)

            except asyncio.CancelledError as err:
                # Cancelled by the user. Send them a goodbye message.
                self.email_details.subscribed = False
                self.email_details.message = "Sorry to see you go"
                await workflow.execute_activity(
                    send_email,
                    self.email_details,
                    start_to_close_timeout=timedelta(seconds=10),
                )
                # raise error so workflow shows as cancelled.
                raise err`;

const TEST_RUN_WORKER_PY = `import pytest
from temporalio.client import WorkflowExecutionStatus, WorkflowFailureError
from temporalio.exceptions import CancelledError
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from activities import send_email
from run_worker import SendEmailWorkflow
from shared_objects import EmailDetails


@pytest.mark.asyncio
async def test_create_email() -> None:
    task_queue_name: str = "email_subscription"

    async with await WorkflowEnvironment.start_local() as env:
        data: EmailDetails = EmailDetails(
            email="test@example.com", message="Here's your message!"
        )

        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[SendEmailWorkflow],
            activities=[send_email],
        ):

            handle = await env.client.start_workflow(
                SendEmailWorkflow.run,
                data,
                id=data.email,
                task_queue=task_queue_name,
            )

            assert WorkflowExecutionStatus.RUNNING == (await handle.describe()).status


@pytest.mark.asyncio
async def test_cancel_workflow() -> None:
    task_queue_name: str = "email_subscription"

    async with await WorkflowEnvironment.start_local() as env:
        data: EmailDetails = EmailDetails(
            email="test@example.com", message="Here's your message!"
        )

        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[SendEmailWorkflow],
            activities=[send_email],
        ):

            handle = await env.client.start_workflow(
                SendEmailWorkflow.run,
                data,
                id=data.email,
                task_queue=task_queue_name,
            )

            await handle.cancel()

            # Cancelling a workflow requests cancellation. Need to wait for the
            # workflow to complete.
            with pytest.raises(WorkflowFailureError) as err:
                await handle.result()

            assert isinstance(err.value.cause, CancelledError)

            assert WorkflowExecutionStatus.CANCELED == (await handle.describe()).status`;

const PYTEST_OUTPUT = `============================= test session starts ==============================
platform darwin -- Python 3.11.3, pytest-7.2.2, pluggy-1.0.0
rootdir: email-subscription-project-python, configfile: pyproject.toml
plugins: asyncio-0.20.3, anyio-3.6.2
asyncio: mode=Mode.AUTO
collected 2 items

tests/test_run_worker.py::test_create_email
-------------------------------- live log call ---------------------------------
12:01:12 [    INFO] Beginning worker shutdown, will wait 0:00:00 before cancelling activities (_worker.py:425)
PASSED                                                                   [ 50%]
tests/test_run_worker.py::test_cancel_workflow
-------------------------------- live log call ---------------------------------
12:01:23 [    INFO] Beginning worker shutdown, will wait 0:00:00 before cancelling activities (_worker.py:425)
PASSED                                                                   [100%]

============================== 2 passed in 13.24s ==============================`;

export default function EmailDripCampaignPage() {
  return (
    <Layout
      title="Build an email drip campaign with Python"
      description="Implement an email subscription application with Temporal's Workflows, Activities, and Queries, and start your business logic through a web action."
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
                  { label: "Build an email drip campaign" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build an email drip campaign with Python
            </h1>

            <MetaChips items={["~60 minutes", "Intermediate", "Python"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                In this tutorial, you'll build an email subscription web
                application using Temporal and Python. You'll create a web
                server using the{" "}
                <a
                  href="https://flask.palletsprojects.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Flask
                </a>{" "}
                framework to handle requests and use Temporal Workflows,
                Activities, and Queries to build the core of the application.
                Your web server will handle requests from the end user and
                interact with a Temporal Workflow to manage the email
                subscription process. Since you're building the business
                logic with Temporal's Workflows and Activities, you'll be
                able to use Temporal to manage each subscription rather than
                relying on a separate database or task queue. This reduces
                the complexity of the code you have to write and support.
              </p>
              <p>
                You'll create an endpoint for users to give their email
                address, and then create a new Workflow execution using that
                email address which will simulate sending an email message at
                certain intervals. The user can check on the status of their
                subscription, which you'll handle using a Query, and they can
                end the subscription at any time by unsubscribing, which
                you'll handle by cancelling the Workflow Execution. You can
                view the user's entire process through Temporal's Web UI. For
                this tutorial, you'll simulate sending emails, but you can
                adapt this example to call a live email service in the
                future.
              </p>
              <p>
                By the end of this tutorial, you'll have a clear
                understanding of how to use Temporal to create and manage
                long-running Workflows within a web application.
              </p>
              <p>
                You'll find the code for this tutorial on GitHub in the{" "}
                <a
                  href="https://github.com/temporalio/email-subscription-project-python"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  email-subscription-project-python
                </a>{" "}
                repository.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li>
                  <Link to="/getting_started/python/dev_environment/">
                    Set up a local development environment for Temporal and
                    Python
                  </Link>
                  .
                </li>
                <li>
                  Complete the{" "}
                  <Link to="/getting_started/python/hello_world_in_python/">
                    Hello World
                  </Link>{" "}
                  tutorial to ensure you understand the basics of creating
                  Workflows and Activities with Temporal.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="develop-workflow">
              <h2 className={styles.sectionTitle}>Develop the Workflow</h2>
              <p>
                A Workflow defines a sequence of steps defined by writing
                code, known as a Workflow Definition, and is carried out by
                running that code, which results in a Workflow Execution.
              </p>
              <p>
                The Temporal Python SDK recommends the use of a single{" "}
                <a
                  href="https://docs.python.org/3/library/dataclasses.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  data class
                </a>{" "}
                for parameters and return types. This lets you add fields
                without breaking compatibility. Before writing the Workflow
                Definition, you'll define the data objects used by the
                Workflow Definitions. You'll also define the Task Queue name
                you'll use in your Worker.
              </p>
              <p>
                Create a new file called <code>shared_objects.py</code> in
                your project directory.
              </p>
              <p>
                Add the following code to the <code>shared_objects.py</code>{" "}
                file which will:
              </p>
              <ol>
                <li>
                  Import the <code>dataclasses</code> library.
                </li>
                <li>
                  Set the Task Queue variable name to{" "}
                  <code>email_subscription</code>.
                </li>
                <li>
                  Add <code>WorkflowOptions</code> and <code>EmailDetails</code>{" "}
                  data classes.
                </li>
              </ol>
              <CodeBlock language="py" title="shared_objects.py">
                {SHARED_OBJECTS_PY}
              </CodeBlock>
              <p>The following describes each data class and their objects.</p>
              <ul>
                <li>
                  <code>WorkflowOptions</code>: this data class starts the
                  Workflow Execution. It will contain the following field:
                  <ul>
                    <li><code>email</code>: a string to pass the user's email</li>
                  </ul>
                </li>
                <li>
                  <code>EmailDetails</code>: this data class holds data about
                  the current state of the subscription. It will contain the
                  following fields:
                  <ul>
                    <li><code>email</code>: as a string to pass a user's email</li>
                    <li><code>message</code>: as a string to pass a message to the user</li>
                    <li><code>count</code>: as an integer to track the number of emails sent</li>
                    <li>
                      <code>subscribed</code>: as a boolean to track whether
                      the user is currently subscribed
                    </li>
                  </ul>
                </li>
              </ul>
              <p>
                When you Query your Workflow to retrieve the current state of
                the Workflow, you'll use the <code>EmailDetails</code> data
                class.
              </p>
              <p>
                Now that you have the Task Queue and the data classes
                defined, you can write the Workflow Definition.
              </p>
              <p>
                To create a new Workflow Definition, create a new file called{" "}
                <code>workflows.py</code>. This file will contain the{" "}
                <code>SendEmailWorkflow</code> class and its attributes.
              </p>
              <p>
                Use the <code>workflows.py</code> file to write deterministic
                logic inside your Workflow Definition and to{" "}
                <a
                  href="https://python.temporal.io/temporalio.workflow.html#execute_activity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  execute the Activity
                </a>
                .
              </p>
              <p>Add the following code to define the Workflow:</p>
              <CodeBlock language="py" title="workflows.py">
                {WORKFLOWS_PY}
              </CodeBlock>
              <p>
                The <code>run()</code> method, decorated with{" "}
                <code>@workflow.run</code>, takes in the email address as an
                argument. This method initializes the <code>_email</code>,{" "}
                <code>_message</code>, <code>_subscribed</code>, and{" "}
                <code>_count</code> attributes of the{" "}
                <code>SendEmailWorkflow</code> instance.
              </p>
              <p>
                The <code>SendEmailWorkflow</code> class has a loop that
                checks if the subscription is active by checking if{" "}
                <code>self.email_details.subscribed</code> is True. If it is,
                it starts the <code>send_email()</code> Activity.
              </p>
              <p>
                The while loop increments the{" "}
                <code>self.email_details.count</code> attribute and calls the{" "}
                <code>send_email()</code> Activity with the current{" "}
                <code>EmailDetails</code> object. The loop continues as long
                as the <code>self.email_details.subscribed</code> attribute
                is true.
              </p>
              <p>
                The <code>execute_activity()</code> method executes the{" "}
                <code>send_email()</code> Activity with the following
                parameters:
              </p>
              <ul>
                <li>The <code>send_email()</code> Activity Definition</li>
                <li>The <code>EmailDetails</code> data class</li>
                <li>
                  A <code>start_to_close_timeout</code> parameter, which
                  tells the Temporal Server to time out the Activity 10
                  seconds from when the Activity starts
                </li>
              </ul>
              <p>
                The loop also includes an <code>asyncio.sleep()</code>{" "}
                statement that causes the Workflow to pause for a set amount
                of time between emails. You can define this in seconds,
                days, months, or even years, depending on your business
                logic.
              </p>
              <p>
                If there's a cancellation request, the request raises{" "}
                <code>asyncio.CancelledError</code>, which you can catch and
                respond to. In this application, you'll use cancellation
                requests to unsubscribe users. You'll send one last email
                when they unsubscribe, before completing the Workflow
                Execution.
              </p>
              <p>
                Since the user's email address is set to the Workflow Id,
                attempting to subscribe with the same email address twice
                will result in a <code>Workflow Execution already started</code>{" "}
                error and prevent the Workflow Execution from spawning again.
              </p>
              <p>
                Therefore, only one running Workflow Execution per email
                address can exist within the associated Namespace. This
                ensures that the user won't receive multiple email
                subscriptions. This also helps reduce the complexity of the
                code you have to write and maintain.
              </p>
              <p>
                With this Workflow Definition in place, you can now develop
                an Activity to send emails.
              </p>
            </section>

            <section className={styles.section} id="develop-activity">
              <h2 className={styles.sectionTitle}>Develop an Activity</h2>
              <p>
                You'll need an Activity to send the email to the subscriber
                so you can handle failures.
              </p>
              <p>
                Create a new file called <code>activities.py</code> and add
                the following code to define the asynchronous Activity
                Definition:
              </p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITIES_PY}
              </CodeBlock>
              <p>
                This implementation only prints a message, but you could
                replace the implementation with one that uses an email API.
              </p>
              <p>
                Each iteration of the Workflow loop will execute this
                Activity, which simulates sending a message to the user.
              </p>
              <p>
                Now that you have the Activity Definition and Workflow
                Definition, it's time to write the Worker process.
              </p>
            </section>

            <section className={styles.section} id="create-worker">
              <h2 className={styles.sectionTitle}>
                Create the Worker to handle the Workflow and Activity Executions
              </h2>
              <p>
                Create a new file called <code>run_worker.py</code> and
                develop the Worker process to execute your Workflow and
                Activity Definitions.
              </p>
              <CodeBlock language="py" title="run_worker.py">
                {RUN_WORKER_PY}
              </CodeBlock>
              <p>
                Now that you've written the logic to execute the Workflow
                and Activity Definitions, try to build the gateway.
              </p>
            </section>

            <section className={styles.section} id="build-api-server">
              <h2 className={styles.sectionTitle}>
                Build the API server to handle subscription requests
              </h2>
              <p>
                This tutorial uses the Flask web framework to build a web
                server that acts as the entry point for initiating Workflow
                Execution and communicating with the <code>subscribe</code>,{" "}
                <code>get-details</code>, and <code>unsubscribe</code>{" "}
                routes. The web server will handle HTTP requests and perform
                the appropriate operations with the Workflow.
              </p>
              <p>
                Create a new file called <code>run_flask.py</code> to develop
                your Flask endpoints.
              </p>
              <p>
                First, register the Temporal Client function to run before
                the first request to this instance of the application. A
                Temporal Client enables you to communicate with the Temporal
                Cluster. Communication with a Temporal Cluster includes, but
                isn't limited to, the following:
              </p>
              <ul>
                <li>Starting Workflow Executions</li>
                <li>Sending Queries to Workflow Executions</li>
                <li>Getting the results of a Workflow Execution</li>
              </ul>
              <p>
                Add the following code to import your libraries and connect
                to the Temporal Server.
              </p>
              <CodeBlock language="py" title="run_flask.py">
                {RUN_FLASK_IMPORTS_PY}
              </CodeBlock>
              <p>
                The <code>get_client()</code> function retrieves the Client
                connection from the Flask app once it's initialized. You'll
                use this in your endpoints.
              </p>
              <p>
                Now that your connection to the Temporal Server is open,
                define your first Flask endpoint.
              </p>
              <p>First, build the <code>/subscribe</code> endpoint.</p>
              <p>
                In the <code>run_flask.py</code> file, define a{" "}
                <code>/subscribe</code> endpoint as an asynchronous function,
                so that users can subscribe to the emails.
              </p>
              <CodeBlock language="py" title="run_flask.py">
                {RUN_FLASK_SUBSCRIBE_PY}
              </CodeBlock>
              <p>
                In the <code>start_subscription()</code> function, get the
                Temporal Server connection from the Flask application. The{" "}
                <code>WorkflowOptions</code> object is used to pass the
                email address given by the user to the Workflow Execution
                and sets the Workflow Id. This ensures that the email is
                unique across all Workflows so that the user can't sign up
                multiple times, only receive the emails they've subscribed
                to, and when they cancel; they cancel the Workflow run.
              </p>
              <p>
                With this endpoint in place, you can now send a POST request
                to <code>/subscribe</code> with an email address in the
                request body to start a new Workflow that sends an email to
                that address.
              </p>
              <p>
                But how would you get details about the subscription? In the
                next section, you'll query your Workflow to get back
                information on the state of things.
              </p>
            </section>

            <section className={styles.section} id="add-query">
              <h2 className={styles.sectionTitle}>Add a Query</h2>
              <p>
                Now create a method in which a user can get information
                about their subscription details. Add a new method called{" "}
                <code>details()</code> to the <code>SendEmailWorkflow</code>{" "}
                class and use the <code>@workflow.query</code> decorator.
              </p>
              <p>
                To allow users to retrieve information about their
                subscription details, add a new method called{" "}
                <code>details()</code> to the <code>SendEmailWorkflow</code>{" "}
                class in the <code>workflows.py</code> file. Decorate this
                method with <code>@workflow.query</code>.
              </p>
              <CodeBlock language="py" title="workflows.py">
                {QUERY_PY}
              </CodeBlock>
              <p>
                The <code>email_details</code> object is an instance of{" "}
                <code>EmailDetails</code>. Queries can be used even after the
                Workflow completes, which is useful for when the user
                unsubscribes but still wants to retrieve information about
                their subscription.
              </p>
              <p>Queries should never mutate anything in the Workflow.</p>
              <p>
                Now that you've added the ability to Query your Workflow,
                add the ability to Query from the Flask application.
              </p>
              <p>
                To enable users to query the Workflow from the Flask
                application, add a new endpoint called{" "}
                <code>/get_details</code> to the <code>run_flask.py</code>{" "}
                file.
              </p>
              <p>
                Use the{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  get_workflow_handle()
                </a>{" "}
                function to return a Workflow handle by a Workflow Id.
              </p>
              <CodeBlock language="py" title="run_flask.py">
                {RUN_FLASK_GET_DETAILS_PY}
              </CodeBlock>
              <p>
                Using <code>handle.query()</code> creates a Handle on the
                Workflow and calls the Query method on the handle to get the
                value of the variables. This function enables you to return
                all the information about the user's email subscription
                that's declared in the Workflow.
              </p>
              <p>
                Now that users can subscribe and view the details of their
                subscription, you need to provide them with a way to
                unsubscribe.
              </p>
            </section>

            <section className={styles.section} id="unsubscribe">
              <h2 className={styles.sectionTitle}>
                Unsubscribe users with a Workflow Cancellation Request
              </h2>
              <p>
                Users will want to unsubscribe from the email list at some
                point, so give them a way to do that.
              </p>
              <p>
                You cancel a Workflow by sending a cancellation request to
                the Workflow Execution. Your Workflow code can respond to
                this cancellation and perform additional operations in
                response. This is how you will handle unsubscribe requests.
              </p>
              <p>
                With the <code>run_flask.py</code> file open, add a new
                endpoint called <code>/unsubscribe</code> to the Flask
                application.
              </p>
              <p>
                To send a cancellation notice to an endpoint, use the HTTP{" "}
                <code>DELETE</code> method on the <code>unsubscribe</code>{" "}
                endpoint to return a{" "}
                <a
                  href="https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cancel()
                </a>{" "}
                method on the Workflow's handle.
              </p>
              <CodeBlock language="py" title="run_flask.py">
                {RUN_FLASK_UNSUBSCRIBE_PY}
              </CodeBlock>
              <p>
                The <code>handle.cancel()</code> method sends a cancellation
                request to the Workflow Execution that was started with the{" "}
                <code>/subscribe</code> endpoint.
              </p>
              <p>
                When the Temporal Service receives the cancellation request,
                it will cancel the Workflow Execution and return a{" "}
                <code>CancelledError</code> to the Workflow Execution, which
                your Workflow Definition already handles in the{" "}
                <code>try/except</code> block. Here's the relevant section
                as a reminder:
              </p>
              <CodeBlock language="py" title="workflows.py">
                {CANCELLED_WORKFLOW_SNIPPET}
              </CodeBlock>
              <p>
                With this endpoint in place, users can send a{" "}
                <code>DELETE</code> request to <code>/unsubscribe</code>{" "}
                with an email address in the request body to cancel the
                Workflow associated with that email address. This allows
                users to unsubscribe from the email list and prevent any
                further emails from sending.
              </p>
              <p>
                Now that you've added the ability to unsubscribe from the
                email list, test your application code to ensure it works as
                expected.
              </p>
            </section>

            <section className={styles.section} id="integration-test">
              <h2 className={styles.sectionTitle}>Create an integration test</h2>
              <p>
                Integration testing is an essential part of software
                development that helps ensure that different components of
                an application work together correctly.
              </p>
              <p>
                The Temporal Python SDK includes functions that help you
                test your Workflow Executions.
              </p>
              <p>
                Workflow testing can be done in an integration test fashion
                against a{" "}
                <a
                  href="https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#start_local"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  test server
                </a>{" "}
                or from a{" "}
                <a
                  href="https://python.temporal.io/temporalio.testing.WorkflowEnvironment.html#from_client"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  given Client
                </a>
                .
              </p>
              <p>
                In this section, you'll write an integration test using the
                Temporal Python SDK to test the cancellation of a Workflow.
                Now, you can add tests to the application to ensure the
                Cancellation works as expected.
              </p>
              <p>
                To set up the test environment, create two new files called{" "}
                <code>test_run_worker.py</code> and <code>__init__.py</code>{" "}
                in the <code>tests</code> directory.
              </p>
              <p>
                The Temporal Python SDK includes functions that help you
                test your Workflow Executions. In this section, you will
                import the necessary modules and classes to test the
                cancellation of a Workflow.
              </p>
              <p>
                In this code, you are defining two test functions{" "}
                <code>test_create_email()</code> and{" "}
                <code>test_cancel_workflow()</code> that use the Temporal SDK
                to create and cancel a Workflow Execution.
              </p>
              <CodeBlock language="py" title="tests/test_run_worker.py">
                {TEST_RUN_WORKER_PY}
              </CodeBlock>
              <p>
                The <code>test_create_email()</code> function creates a
                Workflow Execution by starting the{" "}
                <code>SendEmailWorkflow</code> with some test data. The
                function then asserts that the status of the Workflow
                Execution is <code>RUNNING</code>.
              </p>
              <p>
                The <code>test_cancel_workflow()</code> function also starts
                a Workflow Execution, but it then immediately cancels it
                using the <code>cancel()</code> method on the Workflow's
                handle. It then waits for the Workflow Execution to complete
                and asserts that the status is <code>CANCELED</code>.
                Finally, the function checks that the Workflow Execution
                was cancelled due to a <code>CancelledError</code>.
              </p>
              <p>
                Now that you've created a test function for the Workflow
                Cancellation, run <code>pytest</code> to see if that works.
              </p>
              <p>
                To test the function, run <code>pytest</code> from the
                command line to automatically discover and execute tests.
              </p>
              <CodeBlock>{PYTEST_OUTPUT}</CodeBlock>
              <p>
                You've successfully written, executed, and passed a
                Cancellation Workflow test, just as you would any other code
                written in Python. Temporal's Python SDK provides a number
                of functions that help you test your Workflow Executions.
                By following the best practices for testing your code, you
                can be confident that your Workflows are reliable and
                performant.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                This tutorial demonstrates how to build an email
                subscription web application using Temporal and Python. By
                leveraging Temporal's Workflows, Activities, and Queries,
                the tutorial shows how to create a web server that interacts
                with Temporal to manage the email subscription process.
              </p>
              <p>
                With this knowledge, you will be able to take on more
                complex Workflows and Activities to create even stronger
                applications.
              </p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
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
                <Link
                  to="/tutorials/python/trip-booking-app/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Python tutorial</span>
                  <h3 className={styles.nextTitle}>Build a trip booking app</h3>
                  <p className={styles.nextBody}>
                    Apply the Saga pattern with compensating Activities to
                    roll back partial bookings.
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
