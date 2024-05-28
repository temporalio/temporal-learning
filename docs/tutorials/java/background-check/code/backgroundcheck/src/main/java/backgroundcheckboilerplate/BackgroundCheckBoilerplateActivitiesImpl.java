// @@@SNIPSTART java-project-setup-chapter-boilerplate-activity-implementation
package backgroundcheckboilerplate;

public class BackgroundCheckBoilerplateActivitiesImpl implements BackgroundCheckBoilerplateActivities{

  @Override
  public String ssnTraceActivity(String socialSecurityNumber){
    
    // This is where a call to another service would be made to perform the trace
    // We are simulating that the service that does SSNTrace executed successfully
    // with a passing value being returned

    String result = "pass";
    return result;
  }

}
// @@@SNIPEND