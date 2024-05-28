# @@@SNIPSTART python-project-setup-chapter-backgroundcheck-activity
from temporalio import activity

@activity.defn
async def ssn_trace_activity(ssn) -> str:
    return "pass"

# @@@SNIPEND