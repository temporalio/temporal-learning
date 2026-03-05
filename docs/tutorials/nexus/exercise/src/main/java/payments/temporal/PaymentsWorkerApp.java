package payments.temporal;

import compliance.ComplianceChecker;
import compliance.temporal.activity.ComplianceActivityImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import payments.PaymentGateway;
import payments.Shared;
import payments.temporal.activity.PaymentActivityImpl;

/**
 * ═══════════════════════════════════════════════════════════════════
 *  MONOLITH VERSION — This works! Run it at Checkpoint 0.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Currently this single worker handles EVERYTHING:
 *   - PaymentProcessingWorkflow
 *   - PaymentActivity (validate + execute)
 *   - ComplianceActivity (compliance check)  ← will move to its own worker
 *
 * All on one task queue: "payments-processing"
 *
 * ── TODO 5: Add Nexus endpoint mapping + remove ComplianceActivity ──
 *
 * After completing TODOs 1-4, come back here and make TWO changes:
 *
 * CHANGE 1: Register the workflow with NexusServiceOptions
 *   Currently:   worker.registerWorkflowImplementationTypes(PaymentProcessingWorkflowImpl.class)
 *   Change to:   worker.registerWorkflowImplementationTypes(
 *                    WorkflowImplementationOptions.newBuilder()
 *                        .setNexusServiceOptions(Collections.singletonMap(
 *                            "ComplianceNexusService",
 *                            NexusServiceOptions.newBuilder()
 *                                .setEndpoint("compliance-endpoint")
 *                                .build()))
 *                        .build(),
 *                    PaymentProcessingWorkflowImpl.class);
 *
 * CHANGE 2: Remove ComplianceActivityImpl registration
 *   The compliance check now runs on the Compliance worker via Nexus.
 *   Delete the line that registers ComplianceActivityImpl.
 *   Also remove the ComplianceChecker import and instantiation.
 *
 * Imports you'll need:
 *   import io.temporal.worker.WorkflowImplementationOptions;
 *   import io.temporal.workflow.NexusServiceOptions;
 *   import java.util.Collections;
 *
 * ANALOGY: Like removing a department from your building and setting up
 * a phone extension to their new office across the street.
 */
public class PaymentsWorkerApp {

    public static void main(String[] args) {
        // C — Connect to Temporal
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(service);

        // R — Register
        WorkerFactory factory = WorkerFactory.newInstance(client);
        Worker worker = factory.newWorker(Shared.TASK_QUEUE);

        // ┌─────────────────────────────────────────────────────────────┐
        // │ TODO 5 (CHANGE 1): Replace this simple registration with   │
        // │ WorkflowImplementationOptions that map                     │
        // │ "ComplianceNexusService" to "compliance-endpoint"          │
        // └─────────────────────────────────────────────────────────────┘
        worker.registerWorkflowImplementationTypes(PaymentProcessingWorkflowImpl.class);

        // A — Activities
        PaymentGateway gateway = new PaymentGateway();
        worker.registerActivitiesImplementations(new PaymentActivityImpl(gateway));

        // ┌─────────────────────────────────────────────────────────────┐
        // │ TODO 5 (CHANGE 2): Delete these two lines after adding     │
        // │ Nexus. Compliance now runs on its own worker.              │
        // └─────────────────────────────────────────────────────────────┘
        ComplianceChecker checker = new ComplianceChecker();
        worker.registerActivitiesImplementations(new ComplianceActivityImpl(checker));

        // L — Launch
        factory.start();

        System.out.println("=========================================================");
        System.out.println("  Payments Worker started on: " + Shared.TASK_QUEUE);
        System.out.println("  Registered: PaymentProcessingWorkflow, PaymentActivity");
        System.out.println("              ComplianceActivity (monolith — will decouple)");
        System.out.println("=========================================================");
    }
}
