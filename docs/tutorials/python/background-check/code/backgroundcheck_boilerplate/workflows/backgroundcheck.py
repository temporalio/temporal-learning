# @@@SNIPSTART python-project-setup-chapter-backgroundcheck-workflow
from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities.ssntraceactivity_dacx import ssn_trace_activity

@workflow.defn
class BackgroundCheck:
    @workflow.run
    async def run(self, ssn: str) -> str:
        return await workflow.execute_activity(
            ssn_trace_activity,
            ssn,
            schedule_to_close_timeout=timedelta(seconds=5),
        )

# @@@SNIPEND
