package compliance.temporal;

import compliance.ComplianceChecker;
import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

/**
 * Compliance team's worker — handles Nexus requests from Payments.
 * Task queue: "compliance-risk"
 */
public class ComplianceWorkerApp {

    public static void main(String[] args) {
        // C — Connect to Temporal
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(service);

        // R — Create factory and worker
        WorkerFactory factory = WorkerFactory.newInstance(client);
        Worker worker = factory.newWorker("compliance-risk");

        // W — Wire Nexus service implementation
        ComplianceChecker checker = new ComplianceChecker();
        worker.registerNexusServiceImplementation(new ComplianceNexusServiceImpl(checker));

        // L — Launch
        factory.start();

        System.out.println("=========================================================");
        System.out.println("  Compliance Worker started on: compliance-risk");
        System.out.println("  Registered: ComplianceNexusServiceImpl (sync handler)");
        System.out.println("  Waiting for Nexus requests from Payments team...");
        System.out.println("=========================================================");
    }
}
