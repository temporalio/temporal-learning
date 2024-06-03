// @@@SNIPSTART java-project-setup-chapter-self-hosted-worker
package backgroundcheckboilerplate.workers;

import backgroundcheckboilerplate.BackgroundCheckBoilerplateActivitiesImpl;
import backgroundcheckboilerplate.BackgroundCheckBoilerplateWorkflowImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowClientOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

public class SelfHostedWorker {
  public static void main(String[] args) {

    // Specify the IP address and port for the Service Stubs options
    WorkflowServiceStubsOptions stubsOptions = WorkflowServiceStubsOptions.newBuilder()
            .setTarget("mycluster.example.com:7233")
            .build();

    // Generate the gRPC stubs using the options provided
    WorkflowServiceStubs service = WorkflowServiceStubs.newServiceStubs(stubsOptions);

    // Specify the namespace in the Client options
    WorkflowClientOptions options = WorkflowClientOptions.newBuilder()
            .setNamespace("backgroundcheck_namespace")
            .build();

    // Initialize the Temporal Client, passing in the gRPC stubs and Client optins
    WorkflowClient client = WorkflowClient.newInstance(service, options);

    // Initialize a WorkerFactory, passing in the Temporal Client (WorkflowClient)
    WorkerFactory factory = WorkerFactory.newInstance(client);

    // Create a new Worker
    Worker worker = factory.newWorker("backgroundcheck-tasks");

    // Register the Workflow by passing in the class to the worker
    worker.registerWorkflowImplementationTypes(BackgroundCheckBoilerplateWorkflowImpl.class);

    // Register the Activities by passing in an Activities object used for execution
    worker.registerActivitiesImplementations(new BackgroundCheckBoilerplateActivitiesImpl());

    // Start the Worker
    factory.start();
  }
}

// @@@SNIPEND
