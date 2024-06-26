# @@@SNIPSTART python-project-setup-chapter-backgroundcheck-self-hosted-worker
import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities.ssntraceactivity_dacx import ssn_trace_activity
from workflows.backgroundcheck_dacx import BackgroundCheck

async def main():
    client = await Client.connect(
        "172.18.0.4:7233"  # The IP address of the Temporal Server on your network.
    )

    worker = Worker(
        client,
        task_queue="backgroundcheck-boilerplate-task-queue",
        workflows=[BackgroundCheck],
        activities=[ssn_trace_activity],
    )
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())

# @@@SNIPEND
