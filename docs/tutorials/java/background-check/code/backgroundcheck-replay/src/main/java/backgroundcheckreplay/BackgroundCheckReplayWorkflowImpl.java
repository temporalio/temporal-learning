// @@@SNIPSTART java-durability-chapter-workflow
package backgroundcheckreplay;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;

public class BackgroundCheckReplayWorkflowImpl implements BackgroundCheckReplayWorkflow {

  public static final Logger logger = Workflow.getLogger(BackgroundCheckReplayWorkflowImpl.class);

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
    // Sleep for 1 minute
    logger.info("Sleeping for 1 minute...");
    Workflow.sleep(Duration.ofSeconds(60));
    logger.info("Finished sleeping");
    //highlight-end

    // Execute the Activity synchronously (wait for the result before proceeding)
    String ssnTraceResult = activities.ssnTraceActivity(socialSecurityNumber);

    // Make the results of the Workflow available
    return ssnTraceResult;
  }

}

// @@@SNIPEND