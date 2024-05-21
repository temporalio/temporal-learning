// @@@SNIPSTART java-project-setup-chapter-boilerplate-workflow-implementation
package backgroundcheckboilerplate;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;

public class BackgroundCheckBoilerplateWorkflowImpl implements BackgroundCheckBoilerplateWorkflow {

  // Define the Activity Execution options
  // StartToCloseTimeout or ScheduleToCloseTimeout must be set
  ActivityOptions options = ActivityOptions.newBuilder()
          .setStartToCloseTimeout(Duration.ofSeconds(5))
          .build();

  // Create an client stub to activities that implement the given interface
  private final BackgroundCheckBoilerplateActivities activities =
      Workflow.newActivityStub(BackgroundCheckBoilerplateActivities.class, options);

  @Override
  public String backgroundCheck(String socialSecurityNumber) {
    String ssnTraceResult = activities.ssnTraceActivity(socialSecurityNumber);
    return ssnTraceResult;
  }

}
// @@@SNIPEND
