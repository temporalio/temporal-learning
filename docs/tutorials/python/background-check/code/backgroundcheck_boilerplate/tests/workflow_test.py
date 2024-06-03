# @@@SNIPSTART python-project-setup-chapter-backgroundcheck-workflow-test
import uuid

import pytest

from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from activities.ssntraceactivity_dacx import ssn_trace_activity
from workflows.backgroundcheck_dacx import BackgroundCheck

@pytest.mark.asyncio
async def test_execute_workflow():
    task_queue_name = str(uuid.uuid4())
    async with await WorkflowEnvironment.start_time_skipping() as env:
        async with Worker(
            env.client,
            task_queue=task_queue_name,
            workflows=[BackgroundCheck],
            activities=[ssn_trace_activity],
        ):
            assert "pass" == await env.client.execute_workflow(
                BackgroundCheck.run,
                "555-55-5555",
                id=str(uuid.uuid4()),
                task_queue=task_queue_name,
            )

# @@@SNIPEND
