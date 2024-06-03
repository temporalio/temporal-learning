package backgroundcheckreplay;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;


// BackgroundCheckReplayWorkflowNonDeterministic is an anti-pattern Workflow Definition
@WorkflowInterface
public interface BackgroundCheckReplayNonDeterministicWorkflow {

  // The Workflow Method within the interface must be annotated with @WorkflowMethod
  @WorkflowMethod
  public String backgroundCheck(String socialSecurityNumber);

}
