package backgroundcheckreplay;

import io.temporal.activity.ActivityInterface;

// Activity Interfaces must be annotated with @ActivityInterface
@ActivityInterface
// BackgroundCheckActivities is the interface that contains your Activity Definitions
public interface BackgroundCheckReplayActivities {

  // ssnTraceActivity is your custom Activity Definition
  public String ssnTraceActivity(String socialSecurityNumber);

}