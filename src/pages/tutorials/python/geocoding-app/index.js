// Single-page tutorial: Build a geocoding application with Python.

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
  { id: "develop-activities", label: "Develop the Activities" },
  { id: "create-worker", label: "Create and run a Worker" },
  { id: "run-workflow", label: "Run the Workflow" },
  { id: "conclusion", label: "Conclusion" },
];

const WORKFLOW_PY = `from datetime import timedelta
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

        return lat_long`;

const ACTIVITIES_INPUT_PY = `from temporalio import activity


# Tells Temporal that this is an Activity
@activity.defn
async def get_api_key_from_user() -> str:
    return input("Please give your API key: ")


# Tells Temporal that this is an Activity
@activity.defn
async def get_address_from_user() -> str:
    return input("Please give an address: ")`;

const ACTIVITIES_REQUEST_PY = `import requests
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

    return lat_long`;

const RUN_WORKER_PY = `import asyncio

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
    asyncio.run(main())`;

const RUN_WORKFLOW_PY = `import asyncio

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
    asyncio.run(main())`;

const WORKER_PROMPT_OUTPUT = `python run_worker.py

Please give your API key: 1234567890abcdefghijklmnopqrstuv`;

const WORKER_PROMPT_OUTPUT_2 = `python run_worker.py

Please give your API key: 1234567890abcdefghijklmnopqrstuv
Please give an address: 1 Arrowhead Dr, Kansas City, MO 64129`;

const WORKFLOW_OUTPUT = `python run_workflow.py

Lat long: [-94.486453, 39.048855]`;

export default function GeocodingAppPage() {
  return (
    <Layout
      title="Build a geocoding application with Python"
      description="Implement a geocoding application in Python that gets input from a user and calls a REST API."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Python", href: "/tutorials/python" },
                  { label: "Build a geocoding application" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a geocoding application with Python
            </h1>

            <MetaChips items={["~30 minutes", "Beginner", "Python"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                When it comes to building business process applications,
                coordinating all parts of the application from user
                interaction to API calls can be complex. Temporal shields you
                from these issues by providing reliability and operability.
              </p>
              <p>
                In this tutorial, you'll build an application that does
                standard business tasks, such as getting input from a user
                and querying an API. Specifically, the application will ask
                the user for an API key and an address, then it will geocode
                the address using Geoapify.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial, complete the following 5 steps:</p>
              <ol>
                <li>
                  Complete the tutorial to{" "}
                  <Link to="/getting_started/python/dev_environment/">
                    Set up a local development environment
                  </Link>
                  .
                </li>
                <li>
                  Complete the{" "}
                  <Link to="/getting_started/python/hello_world_in_python/">
                    Hello World
                  </Link>{" "}
                  tutorial.
                </li>
                <li>
                  Install{" "}
                  <a
                    href="https://requests.readthedocs.io/en/latest/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    requests
                  </a>{" "}
                  (tested with version 2.32.3).
                  <CodeBlock language="bash">pip install requests</CodeBlock>
                </li>
                <li>
                  Get a{" "}
                  <a
                    href="https://www.geoapify.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Geoapify
                  </a>{" "}
                  API key.
                </li>
                <li>
                  Be sure the Temporal Service is running. If it isn't, run{" "}
                  <code>temporal server start-dev</code> to start the Temporal
                  Service.
                </li>
              </ol>
              <p>
                Now that you have your environment ready, it's time to build
                an invincible geocoder.
              </p>
            </section>

            <section className={styles.section} id="develop-workflow">
              <h2 className={styles.sectionTitle}>
                Develop a Workflow to orchestrate your interactions with the user and the API
              </h2>
              <p>
                In this application, the Workflow coordinates the Activities
                of getting information from the user and querying the API.
              </p>
              <p>
                Create a new file called <code>workflow.py</code> and add the
                following code:
              </p>
              <CodeBlock language="py" title="workflow.py">
                {WORKFLOW_PY}
              </CodeBlock>
              <p>
                In this code snippet, you decorated the <code>GeoCode</code>{" "}
                class with <code>@workflow.defn</code>, which tells Temporal
                that the class is a Workflow.
              </p>
              <p>
                You decorated the <code>run()</code> method with{" "}
                <code>@workflow.run</code>, which tells Temporal that this
                method is the Workflow's run method. As mentioned in the code
                comment, you apply this decorator to exactly one method in
                the Workflow.
              </p>
              <p>
                You passed the Activities into the calls to{" "}
                <code>workflow.execute_activity(activity)</code>. If the
                Activities need arguments, pass them in after the Activity
                using <code>workflow.execute_activity(activity, args*, ...)</code>
                , as shown in <code>get_lat_long()</code>. It's recommended
                to collapse multiple arguments into a single argument using a
                dataclass, which you did here with <code>QueryParams</code>.
              </p>
              <p>With the skeleton in place, you can now develop the Activities.</p>
            </section>

            <section className={styles.section} id="develop-activities">
              <h2 className={styles.sectionTitle}>
                Develop Activities to interact with the user and the API
              </h2>
              <p>
                In this section, you'll implement the Activities that
                interact with the outside world. The Workflow is doing the
                orchestration, and the Activities are doing the atomic
                actions.
              </p>
              <p>
                Add the following to a new file called{" "}
                <code>activities.py</code>:
              </p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITIES_INPUT_PY}
              </CodeBlock>
              <p>
                The <code>@activity.defn</code> decorator tells Temporal that
                this function is an Activity.
              </p>
              <p>
                You call these Activities in the Workflow you made earlier.
                After the Workflow calls them, it has the user's API key and
                address. Next, it calls an Activity called{" "}
                <code>get_lat_long</code>, with an argument of type{" "}
                <code>QueryParams</code>. You'll implement that next.
              </p>
              <p>
                Add the following to the end of the <code>activities.py</code>{" "}
                file that you just made:
              </p>
              <CodeBlock language="py" title="activities.py">
                {ACTIVITIES_REQUEST_PY}
              </CodeBlock>
              <p>
                As mentioned before, condense the arguments to Activities into
                a dataclass. In this case, the Activity is an API call that
                needs the user's location and API key, so you'll bundle those
                as a data class. That's <code>QueryParams</code>.
              </p>
              <p>
                Now that you have the Workflow and Actions, you need to run
                them. In the next section, you'll begin that process by making
                and running a Worker.
              </p>
            </section>

            <section className={styles.section} id="create-worker">
              <h2 className={styles.sectionTitle}>
                Create and run a Worker to host your Workflow and Activities
              </h2>
              <p>
                The Worker is the process that connects to the Temporal
                Service and listens on a Task Queue. Here is how you can make
                and run a Worker.
              </p>
              <p>
                Make a new file called <code>run_worker.py</code> and enter
                the following:
              </p>
              <CodeBlock language="py" title="run_worker.py">
                {RUN_WORKER_PY}
              </CodeBlock>
              <p>
                This snippet connects to the Temporal Service using{" "}
                <code>Client.connect()</code>. For this to work, the Temporal
                Service needs to be running, as mentioned in the prerequisites.
              </p>
              <p>The arguments to the Worker constructor are the following:</p>
              <ul>
                <li><code>client</code> - the connection to the Temporal Service.</li>
                <li>
                  <code>task_queue</code> - the Task Queue that the Worker
                  listens on (later, when you run the Workflow, you'll put
                  items on that Task Queue).
                </li>
                <li><code>workflows</code> - the list of Workflows it can process.</li>
                <li><code>activities</code> - a list of Activities that it can process.</li>
              </ul>
              <p>
                The last step is to await the Worker's <code>.run()</code>{" "}
                method. This is what makes the Worker run and start listening
                for work on the Task Queue. You will run it now:
              </p>
              <ol>
                <li>Open a new terminal (keep the service running in a different terminal).</li>
                <li>
                  Navigate to the project directory, and run the following
                  command (it won't output anything yet).
                </li>
              </ol>
              <CodeBlock language="bash">python run_worker.py</CodeBlock>
              <p>
                It will start listening, but it has nothing to do yet because
                there is nothing on the queue. You will fix that in the next
                section by running the Workflow.
              </p>
            </section>

            <section className={styles.section} id="run-workflow">
              <h2 className={styles.sectionTitle}>
                Run the Workflow to execute the application
              </h2>
              <p>The last piece is executing the Workflow.</p>
              <p>
                Enter the following code in a new file called{" "}
                <code>run_workflow.py</code>.
              </p>
              <CodeBlock language="py" title="run_workflow.py">
                {RUN_WORKFLOW_PY}
              </CodeBlock>
              <p>
                In this piece, you connect to the service, then call{" "}
                <code>execute_workflow()</code>. Its arguments are the
                following:
              </p>
              <ul>
                <li>
                  The Workflow method that you decorated with{" "}
                  <code>@workflow.defn</code>.
                </li>
                <li>The ID for the Workflow.</li>
                <li>The Task Queue.</li>
              </ul>
              <p>You're ready to run the code. Do the following 4 steps:</p>
              <ol>
                <li>Open a third terminal (the other two processes should still be running).</li>
                <li>Navigate to the project directory, and run the following command:</li>
              </ol>
              <CodeBlock language="bash">python run_workflow.py</CodeBlock>
              <p>
                At this point, the application is running. If you look at the
                terminal that's running the Worker (not the terminal that's
                running the Workflow), it should be asking you for your API
                key.
              </p>
              <ol start={3}>
                <li>Enter the Geoapify API key mentioned in the prerequisites:</li>
              </ol>
              <CodeBlock language="txt">{WORKER_PROMPT_OUTPUT}</CodeBlock>
              <p>Next, it will ask you for an address.</p>
              <ol start={4}>
                <li>Enter an address:</li>
              </ol>
              <CodeBlock language="txt">{WORKER_PROMPT_OUTPUT_2}</CodeBlock>
              <p>
                It will query Geoapify to geocode the address, and it will
                print the latitude and longitude to the terminal running the
                Workflow:
              </p>
              <CodeBlock language="txt">{WORKFLOW_OUTPUT}</CodeBlock>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You have built a business process application that runs
                invincibly with Temporal.
              </p>
              <p>
                For more detail on how Temporal can help business process
                applications, see Temporal's Chief Product Officer's
                discussion in{" "}
                <a
                  href="https://www.youtube.com/watch?v=eMf1fk9RmhY&t=299s"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  The Top 3 Use Cases for Temporal (ft. Temporal PMs)
                </a>
                .
              </p>

              <h3>Next steps</h3>
              <p>Try defining a Retry Policy and applying it to the Activities.</p>

              <details>
                <summary>
                  What does Temporal recommend to do in Activities instead of
                  in Workflows? Which ones did you do in this tutorial?
                </summary>
                <p>
                  Activities perform anything that may be non-deterministic,
                  may fail, or may have side effects. This could be writing
                  to disk, reading from a database, or getting information
                  from a user. In this Activity, you got input from the user
                  via the command line, and you queried a REST API.
                </p>
              </details>

              <details>
                <summary>
                  What pieces of information does a Worker need when
                  instantiated? This example had four.
                </summary>
                <ul>
                  <li>A client/connection to the Temporal Service.</li>
                  <li>A Task Queue.</li>
                  <li>A list of Workflows.</li>
                  <li>A list of Activities.</li>
                </ul>
              </details>

              <details>
                <summary>How do you denote that a piece of Python code is a Workflow?</summary>
                <p>
                  You decorate a class with the <code>@workflow.defn</code>{" "}
                  decorator, and you decorate exactly one of its methods with{" "}
                  <code>@workflow.run</code>.
                </p>
              </details>
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
                    Build a long-running email subscription Workflow with
                    Queries and Cancellation Requests.
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
