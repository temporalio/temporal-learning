# @@@SNIPSTART python-project-setup-chapter-backgroundcheck-activity-test
import pytest
from temporalio.testing import ActivityEnvironment
from activities.ssntraceactivity_dacx import ssn_trace_activity

@pytest.mark.asyncio
async def test_ssn_trace_activity() -> str:
    activity_environment = ActivityEnvironment()
    expected_output = "pass"
    assert expected_output == await activity_environment.run(
        ssn_trace_activity, "55-55-555"
    )

# @@@SNIPEND
