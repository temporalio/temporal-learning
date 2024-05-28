// @@@SNIPSTART java-durability-chapter-non-deterministic-workflow-implementation
package backgroundcheckreplay;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;
import java.util.Random;

public class BackgroundCheckReplayNonDeterministicWorkflowImpl implements BackgroundCheckReplayNonDeterministicWorkflow {

  // Define the Activity Execution options
  // StartToCloseTimeout or ScheduleToCloseTimeout must be set
  ActivityOptions options = ActivityOptions.newBuilder()
          .setStartToCloseTimeout(Duration.ofSeconds(5))
          .build();

  // Create an client stub to activities that implement the given interface
  private final BackgroundCheckReplayActivities activities =
      Workflow.newActivityStub(BackgroundCheckReplayActivities.class, options);

  @Override
  public String backgroundCheck(String socialSecurityNumber) {

    // highlight-start
    // CAUTION, the following code is an anti-pattern showing what NOT to do
    Random random = new Random();
    if(random.nextInt(101)>= 50){
      Workflow.sleep(Duration.ofSeconds(60));
    }
    //highlight-end

    // Execute the Activity synchronously (wait for the result before proceeding)
    String ssnTraceResult = activities.ssnTraceActivity(socialSecurityNumber);

    // Make the results of the Workflow available
    return ssnTraceResult;
  }

}
// @@@SNIPEND
