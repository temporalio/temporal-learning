package backgroundcheckboilerplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import io.temporal.testing.TestWorkflowEnvironment;
import io.temporal.testing.TestWorkflowExtension;
import io.temporal.worker.Worker;

public class BackgroundCheckBoilerplateWorkflowTest {

  // Use JUnit Extensions to simplify the creation of the test environment.
  // This creates an environment and registers the Workflow to a Worker for testing.
  // If you would rather set this up yourself, look into TestWorkflowEnvironment
  @RegisterExtension
  public static final TestWorkflowExtension testWorkflowExtension = TestWorkflowExtension
      .newBuilder().setWorkflowTypes(BackgroundCheckBoilerplateWorkflowImpl.class)
      .setDoNotStart(true).build();

  @Test
  public void testSuccessfulBackgroundCheckBoilerplateWithMocks(TestWorkflowEnvironment testEnv,
      Worker worker, BackgroundCheckBoilerplateWorkflow workflow) {
    
    // Create a mock object of your Activities
    BackgroundCheckBoilerplateActivities mockedActivities =
        mock(BackgroundCheckBoilerplateActivities.class, withSettings().withoutAnnotations());

    // Specify what value should be returned when a specific Activity is invoked.
    // Your Activity must have the same method name here as it would within your Workflow
    when(mockedActivities.ssnTraceActivity("555-55-5555")).thenReturn("pass");

    // Register the Workflow's Activities with the Worker provided by the Extension
    worker.registerActivitiesImplementations(mockedActivities);

    // Start the test environment
    testEnv.start();

    // Request execution of the backgroundCheck Workflow
    // This will execute your Workflow, calling the Mocked Activities in place
    // of your actual implementation of the Activities.
    String pass_output = workflow.backgroundCheck("555-55-5555");
  
    assertEquals("pass", pass_output);
  
  }
}
