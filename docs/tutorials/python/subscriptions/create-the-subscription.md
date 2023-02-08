---
id: create-the-subscription
sidebar_position: 4
keywords: [Python, temporal, sdk, tutorial]
tags: [Python, SDK]
last_update:
  date: 2023-03-01
title: Create the Subscription Application
description: Develop Activities, Workflows, Bundle and Run the Worker.
image: /img/temporal-logo-twitter-card.png
---

## Define Dataclass

To get started, define the data objects that are going to be passed.

Temporal strongly encourages the use of a single dataclass for parameters and return types, so fields with defaults can be added without breaking compatibility.

In the following example, set the `ComposeEmail` dataclass and define the necessary parameters.

For this tutorial, write an `email`, `message`, and `count` parameter.

<!--SNIPSTART run_worker {"selectedLines": ["10-14"]}-->
[run_worker.py](https://github.com/rachfop/test-flask/blob/master/run_worker.py)
```py
// ...
@dataclass
class ComposeEmail:
    email: str
    message: str
    count: int = 0
```
<!--SNIPEND-->

## Develop Activity

An Activity is a normal function or method execution that's intended to execute a single, well-defined action (either short or long-running).

Develop an Activity Definition by using the `@activity.defn` decorator and write a function that mocks sending an email.

In the following example, the `send_email` function takes in the data class `ComposeEmail`, and pass the `email`, `message`, and `count` objects.

<!--SNIPSTART run_worker {"selectedLines": ["17-22"]}-->
[run_worker.py](https://github.com/rachfop/test-flask/blob/master/run_worker.py)
```py
// ...
@activity.defn
async def send_email(details: ComposeEmail) -> str:
    print(
        f"Sending email to {details.email} with message: {details.message}, count: {details.count}"
    )
    return "success"
```
<!--SNIPEND-->


## Develop Workflow

Workflows are fundamental units of a Temporal Application and orchestrate the execution of Activities.

In the Temporal Python SDK, Workflow Definitions contain the `@workflow.defn` decorator and the method invoked for the Workflow is decorated with `@workflow.run`.

Create a `SendEmailWorkflow` class, and define the attributes that we want to pass to the class.

<!--SNIPSTART run_worker {"selectedLines": ["25-31"]}-->
[run_worker.py](https://github.com/rachfop/test-flask/blob/master/run_worker.py)
```py
// ...
@workflow.defn
class SendEmailWorkflow:
    def __init__(self) -> None:
        self._email: str = "<no email>"
        self._message: str = "<no message>"
        self._subscribed: bool = False
        self._count: int = 0
```
<!--SNIPEND-->

In the Workflow method, create a loop that checks if `_subscribed` is `True`. If it is set to `True`, start the Activity.

<!--SNIPSTART run_worker {"selectedLines": ["33-49"]}-->
[run_worker.py](https://github.com/rachfop/test-flask/blob/master/run_worker.py)
```py
// ...
    @workflow.run
    async def run(self, email, message):
        self._email = f"{email}"
        self._message = "Here's your message!"
        self._subscribed = True
        self._count = 0

        while self._subscribed is True:
            self._count += 1
            await workflow.start_activity(
                send_email,
                ComposeEmail(self._email, self._message, self._count),
                start_to_close_timeout=timedelta(seconds=10),
            )
            await asyncio.sleep(3)

        return ComposeEmail(self._email, self._message, self._count)
```
<!--SNIPEND-->

## Bundle and run it with the Worker

Now that the Activity Definition and Workflow Definition are written, run the Worker process.
The Worker Process is where the Workflow Functions and Activity Functions are executed.

Start by connecting to the Temporal Client, defining the Worker and its arguments, then run the Worker.

<!--SNIPSTART run_worker {"selectedLines": ["64-77"]}-->
[run_worker.py](https://github.com/rachfop/test-flask/blob/master/run_worker.py)
```py
// ...
async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="hello-activity-task-queue",
        workflows=[SendEmailWorkflow],
        activities=[send_email],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
```
<!--SNIPEND-->

Workers can specify multiple Workflows and Activities in a list.

## Build the gateway

### Global Client

Use `before_first_request()` to register the Temporal Client function to run before the first request to this instance of the application.

<!--SNIPSTART run_flask {"selectedLines": ["11-14"]}-->
[run_flask.py](https://github.com/rachfop/test-flask/blob/master/run_flask.py)
```py
// ...
@app.before_first_request
async def startup():
    global client
    client = await Client.connect("localhost:7233")
```
<!--SNIPEND-->

A Temporal Client enables you to communicate with the Temporal Cluster.
Communication with a Temporal Cluster includes, but isn't limited to, the following:

- Starting Workflow Executions.
- Sending Queries to Workflow Executions.
- Getting the results of a Workflow Execution.

### Build the first endpoint

In the `run_flask.py` file, write the `/subscribe/` endpoint as an asynchronous function.

In the `start_workflow` function, pass the name of the Workflow run method, arguments to be passed to the Workflow Execution, the Workflow Id, and the Task Queue name.

<!--SNIPSTART run_flask {"selectedLines": ["17-25"]}-->
[run_flask.py](https://github.com/rachfop/test-flask/blob/master/run_flask.py)
```py
// ...
@app.route("/subscribe/", methods=["POST"])
async def start_subscription() -> str:

    await client.start_workflow(
        SendEmailWorkflow.run,
        args=(request.form["email"], request.form["message"]),
        id="send-email-activity",
        task_queue="hello-activity-task-queue",
    )
```
<!--SNIPEND-->


## Add a Query

Add Query methods to your Workflow.

In this example, write 3 queries to return the `email` passed, the `message`, and how many emails were sent.

<!--SNIPSTART run_worker {"selectedLines": ["51-61"]}-->
[run_worker.py](https://github.com/rachfop/test-flask/blob/master/run_worker.py)
```py
// ...
    @workflow.query
    def greeting(self) -> str:
        return self._email

    @workflow.query
    def message(self) -> str:
        return self._message

    @workflow.query
    def count(self) -> int:
        return self._count
```
<!--SNIPEND-->

- [@workflow.query](https://python.temporal.io/temporalio.workflow.html#query) is a decorator for a Workflow Query method.

----

Now tell the Flask endpoint to query the Workflow's `count` and `email` string name and return it in a JSON response.

<!--SNIPSTART run_flask {"selectedLines": ["26-32"]}-->
[run_flask.py](https://github.com/rachfop/test-flask/blob/master/run_flask.py)
```py
// ...
    handle = client.get_workflow_handle(
        "send-email-activity",
    )
    emails_sent: int = await handle.query(SendEmailWorkflow.count)
    email: str = await handle.query(SendEmailWorkflow.greeting)

    return jsonify({"status": "ok", "email": email, "emails_sent": emails_sent})
```
<!--SNIPEND-->

- [query()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#query) will query the Workflow.

----

Add additional Queries to the Flask routes.

In this example, when you land on `/get-details/`, the `get_query` function will return the `status`, number of emails sent, and the original email.
<!--SNIPSTART run_flask {"selectedLines": ["36-52"]}-->
[run_flask.py](https://github.com/rachfop/test-flask/blob/master/run_flask.py)
```py
// ...
@app.route("/get-details/", methods=["GET"])
async def get_query() -> Dict[str, Any]:
    handle = client.get_workflow_handle(
        "send-email-activity",
    )
    count: int = await handle.query(SendEmailWorkflow.count)
    greeting: str = await handle.query(SendEmailWorkflow.greeting)
    message: str = await handle.query(SendEmailWorkflow.message)

    return jsonify(
        {
            "status": "ok",
            "numberOfEmailsSent": count,
            "email": greeting,
            "message": message,
        }
    )
```
<!--SNIPEND-->


## Add the Cancellation

To send a cancellation notice to an endpoint, use the HTTP `DELETE` method to return a `cancel()` method on the Workflow's handle.

<!--SNIPSTART run_flask {"selectedLines": ["56-62"]}-->
[run_flask.py](https://github.com/rachfop/test-flask/blob/master/run_flask.py)
```py
// ...
@app.route("/unsubscribe/", methods=["DELETE"])
async def end_subscription():
    handle = client.get_workflow_handle(
        "send-email-activity",
    )
    await handle.cancel()
    return jsonify({"status": "ok"})
```
<!--SNIPEND-->

- [get_workflow_handle](https://python.temporal.io/temporalio.client.Client.html#get_workflow_handle_for) gets a Workflow handle to an existing Workflow by its ID.
- [cancel()](https://python.temporal.io/temporalio.client.WorkflowHandle.html#cancel) cancels the Workflow.

## Writing tests

## Conclusion

