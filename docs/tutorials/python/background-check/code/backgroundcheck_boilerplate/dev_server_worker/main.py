# @@@SNIPSTART python-project-setup-chapter-dev-service-worker
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities.ssntraceactivity_dacx import ssn_trace_activity
from workflows.backgroundcheck_dacx import BackgroundCheck

async def main():
    client = await Client.connect("localhost:7233", namespace="backgroundcheck_namespace")

    worker = Worker(
        client,
        namespace="backgroundcheck_namespace",
        task_queue="backgroundcheck-boilerplate-task-queue",
        workflows=[BackgroundCheck],
        activities=[ssn_trace_activity],
    )

    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())

# @@@SNIPEND