import json
import uuid

import pytest
from temporalio.client import WorkflowHistory
from temporalio.testing import ActivityEnvironment, WorkflowEnvironment
from temporalio.worker import Replayer, Worker

from backgroundcheck_dacx import BackgroundCheck
from ssntraceactivity import ssn_trace_activity


@pytest.mark.asyncio
async def test_ssn_trace_activity() -> str:
    activity_environment = ActivityEnvironment()
    expected_output = "pass"
    assert expected_output == await activity_environment.run(
        ssn_trace_activity, "55-55-555"
    )


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

# @@@SNIPSTART python-durability-chapter-replay-from-file-test
@pytest.mark.asyncio
async def test_replay_workflow_history_from_file():
    async with await WorkflowEnvironment.start_time_skipping():
        with open("tests/backgroundcheck_workflow_history.json", "r") as f:
            history_json = json.load(f)
            await Replayer(workflows=[BackgroundCheck]).replay_workflow(
                WorkflowHistory.from_json("backgroundcheck_workflow", history_json)
            )
# @@@SNIPEND
