// @@@SNIPSTART java-project-setup-chapter-boilerplate-activities-interface
package backgroundcheckboilerplate;

import io.temporal.activity.ActivityInterface;

// Activity Interfaces must be annotated with @ActivityInterface
@ActivityInterface
// BackgroundCheckActivities is the interface that contains your Activity Definitions
public interface BackgroundCheckBoilerplateActivities {

  // ssnTraceActivity is your custom Activity Definition
  public String ssnTraceActivity(String socialSecurityNumber);

}
// @@@SNIPEND
