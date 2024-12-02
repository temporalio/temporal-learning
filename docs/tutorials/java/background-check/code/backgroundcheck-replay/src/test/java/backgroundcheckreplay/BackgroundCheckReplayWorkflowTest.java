// @@@SNIPSTART java-durability-chapter-replay-test
package backgroundcheckreplay;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.withSettings;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import java.io.File;


import io.temporal.testing.TestWorkflowEnvironment;
import io.temporal.testing.TestWorkflowExtension;
import io.temporal.worker.Worker;
import io.temporal.testing.WorkflowReplayer;

public class BackgroundCheckReplayWorkflowTest {

  // Use JUnit Extensions to simplify the creation of the test environment.
  // This creates an environment and registers the Workflow to a Worker for testing.
  // If you would rather set this up yourself, look into TestWorkflowEnvironment
  @RegisterExtension
  public static final TestWorkflowExtension testWorkflowExtension = TestWorkflowExtension
      .newBuilder().setWorkflowTypes(BackgroundCheckReplayWorkflowImpl.class)
      .setDoNotStart(true).build();

  @Test
  public void testSuccessfulBackgroundCheckBoilerplateWithMocks(TestWorkflowEnvironment testEnv,
      Worker worker, BackgroundCheckReplayWorkflow workflow) {
    
    // Create a mock object of your Activities
    BackgroundCheckReplayActivities mockedActivities =
        mock(BackgroundCheckReplayActivities.class, withSettings().withoutAnnotations());

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

  @Test
  public void testSuccessfulReplayFromFile(BackgroundCheckReplayWorkflow workflow) throws Exception {

    File eventHistoryFile = new File("backgroundcheck_workflow_event_history.json");

    assertDoesNotThrow(() -> WorkflowReplayer.replayWorkflowExecution(eventHistoryFile,
        BackgroundCheckReplayWorkflowImpl.class));

  }
}

// @@@SNIPEND
