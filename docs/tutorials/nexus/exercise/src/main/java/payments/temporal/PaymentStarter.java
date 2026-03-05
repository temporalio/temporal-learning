package payments.temporal;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;
import payments.Shared;
import payments.domain.PaymentRequest;
import payments.domain.PaymentResult;

/**
 * [GIVEN] Starts 3 payment workflows sequentially.
 *
 * This file is the same for both the monolith and the Nexus-decoupled version.
 * The starter doesn't know (or care) whether compliance runs locally or via Nexus.
 * That's the beauty of the decoupling — the caller is unchanged.
 */
public class PaymentStarter {

    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println("  PAYMENT STARTER — Exercise 1300a: Nexus Sync");
        System.out.println("  Running 3 transactions through Temporal");
        System.out.println("==========================================================\n");

        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClient client = WorkflowClient.newInstance(service);

        PaymentRequest[] transactions = {
                new PaymentRequest("TXN-A", 250.00, "USD", "US", "US",
                        "Routine supplier payment", "ACC-001", "ACC-002"),
                new PaymentRequest("TXN-B", 12000.00, "USD", "US", "UK",
                        "International consulting fee", "ACC-003", "ACC-004"),
                new PaymentRequest("TXN-C", 75000.00, "USD", "US", "North Korea",
                        "Business consulting services", "ACC-005", "ACC-006"),
        };

        for (PaymentRequest txn : transactions) {
            String workflowId = "payment-" + txn.getTransactionId();

            PaymentProcessingWorkflow workflow = client.newWorkflowStub(
                    PaymentProcessingWorkflow.class,
                    WorkflowOptions.newBuilder()
                            .setTaskQueue(Shared.TASK_QUEUE)
                            .setWorkflowId(workflowId)
                            .build());

            System.out.println("──────────────────────────────────────────────────");
            System.out.println("  Starting: " + workflowId);
            System.out.println("  Amount: $" + String.format("%.2f", txn.getAmount())
                    + " | Route: " + txn.getSenderCountry() + " → " + txn.getReceiverCountry());
            System.out.println("──────────────────────────────────────────────────");

            PaymentResult result = workflow.processPayment(txn);

            System.out.println("\n  Result: " + result.getStatus());
            System.out.println("  Risk:   " + (result.getRiskLevel() != null ? result.getRiskLevel() : "N/A"));
            System.out.println("  Reason: " + (result.getExplanation() != null ? result.getExplanation() : "N/A"));
            if (result.getConfirmationNumber() != null) {
                System.out.println("  Conf#:  " + result.getConfirmationNumber());
            }
            if (result.getError() != null) {
                System.out.println("  Error:  " + result.getError());
            }
            System.out.println();
        }

        System.out.println("==========================================================");
        System.out.println("  All 3 transactions processed!");
        System.out.println("  Check Temporal UI: http://localhost:8233");
        System.out.println("==========================================================");

        System.exit(0);
    }
}
