package backgroundcheckreplay.workers;

import backgroundcheckreplay.BackgroundCheckReplayActivitiesImpl;
import backgroundcheckreplay.BackgroundCheckReplayWorkflowImpl;
import backgroundcheckreplay.BackgroundCheckReplayNonDeterministicWorkflowImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

public class DevServerWorker {
  public static void main(String[] args) {

    // Generate the gRPC stubs
    WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();

    // Initialize the Temporal Client, passing in the gRPC stubs
    WorkflowClient client = WorkflowClient.newInstance(service);

    // Initialize a WorkerFactory, passing in the Temporal Client (WorkflowClient)
    WorkerFactory factory = WorkerFactory.newInstance(client);

    // Create a new Worker
    Worker worker = factory.newWorker("backgroundcheck-replay-task-queue-local");

    // Register the Workflow by passing in the class to the worker
    worker.registerWorkflowImplementationTypes(BackgroundCheckReplayWorkflowImpl.class);
    worker.registerWorkflowImplementationTypes(BackgroundCheckReplayNonDeterministicWorkflowImpl.class);

    // Register the Activities by passing in an Activities object used for execution
    worker.registerActivitiesImplementations(new BackgroundCheckReplayActivitiesImpl());

    // Start the Worker
    factory.start();
  }
}
