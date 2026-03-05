package payments.temporal;

import compliance.domain.ComplianceRequest;
import compliance.domain.ComplianceResult;
import compliance.temporal.activity.ComplianceActivity;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;
import payments.domain.PaymentRequest;
import payments.domain.PaymentResult;
import payments.temporal.activity.PaymentActivity;

import java.time.Duration;

/**
 * ═══════════════════════════════════════════════════════════════════
 *  MONOLITH VERSION — This works! Run it at Checkpoint 0.
 * ═══════════════════════════════════════════════════════════════════
 *
 * This workflow orchestrates 3 steps using activity stubs:
 *   Step 1: validatePayment   (PaymentActivity)
 *   Step 2: checkCompliance   (ComplianceActivity) ← will become Nexus
 *   Step 3: executePayment    (PaymentActivity)
 *
 * ── TODO 4: Replace the compliance ACTIVITY stub with a Nexus SERVICE stub ──
 *
 * After completing TODOs 1-3 (creating the Nexus service, handler, and worker),
 * come back here and make ONE change:
 *
 *   BEFORE: ComplianceActivity complianceActivity = Workflow.newActivityStub(...)
 *           compliance = complianceActivity.checkCompliance(compReq)
 *
 *   AFTER:  ComplianceNexusService complianceService = Workflow.newNexusServiceStub(...)
 *           compliance = complianceService.checkCompliance(compReq)
 *
 * That's it. Same method name. Same input. Same output. Different architecture.
 *
 * The Nexus stub needs:
 *   - The service interface class: ComplianceNexusService.class
 *   - NexusServiceOptions with a scheduleToCloseTimeout (e.g., 2 minutes)
 *
 * The endpoint mapping ("where is this service?") is NOT set here.
 * It's set in PaymentsWorkerApp (TODO 5). This keeps the workflow portable.
 *
 * METAPHOR: Think of it like changing a restaurant order from
 * "cook it yourself in the kitchen" to "order it from the restaurant next door."
 * Same menu item, different kitchen, same plate comes back.
 *
 * Imports you'll need:
 *   import shared.nexus.ComplianceNexusService;
 *   import io.temporal.workflow.NexusServiceOptions;
 *   import io.temporal.workflow.NexusOperationOptions;
 */
public class PaymentProcessingWorkflowImpl implements PaymentProcessingWorkflow {

    private static final ActivityOptions ACTIVITY_OPTIONS = ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(30))
            .setRetryOptions(RetryOptions.newBuilder()
                    .setInitialInterval(Duration.ofSeconds(1))
                    .setBackoffCoefficient(2)
                    .build())
            .build();

    private final PaymentActivity paymentActivity =
            Workflow.newActivityStub(PaymentActivity.class, ACTIVITY_OPTIONS);

    // ┌─────────────────────────────────────────────────────────────┐
    // │ TODO 4: Replace this activity stub with a Nexus service    │
    // │ stub. Delete the two lines below and create:               │
    // │                                                            │
    // │   private final ComplianceNexusService complianceService = │
    // │       Workflow.newNexusServiceStub(                        │
    // │           ComplianceNexusService.class,                    │
    // │           NexusServiceOptions.newBuilder()                 │
    // │               .setOperationOptions(                        │
    // │                   NexusOperationOptions.newBuilder()       │
    // │                       .setScheduleToCloseTimeout(          │
    // │                           Duration.ofMinutes(2))           │
    // │                       .build())                            │
    // │               .build());                                   │
    // │                                                            │
    // │ Then update step 2 below to call:                          │
    // │   complianceService.checkCompliance(compReq)               │
    // │ instead of:                                                │
    // │   complianceActivity.checkCompliance(compReq)              │
    // └─────────────────────────────────────────────────────────────┘
    private final ComplianceActivity complianceActivity =
            Workflow.newActivityStub(ComplianceActivity.class, ACTIVITY_OPTIONS);

    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        try {
            // Step 1: Validate payment (Payments team)
            boolean valid = paymentActivity.validatePayment(request);
            if (!valid) {
                return new PaymentResult(false, request.getTransactionId(), "REJECTED",
                        null, null, null, "Payment validation failed");
            }
            Workflow.getLogger(PaymentProcessingWorkflowImpl.class)
                    .info("Step 1 passed: validation OK for " + request.getTransactionId());

            // Step 2: Compliance check
            ComplianceRequest compReq = new ComplianceRequest(
                    request.getTransactionId(), request.getAmount(),
                    request.getSenderCountry(), request.getReceiverCountry(),
                    request.getDescription());

            Workflow.getLogger(PaymentProcessingWorkflowImpl.class)
                    .info("Step 2: calling compliance check for " + request.getTransactionId());

            // ┌─────────────────────────────────────────────────────┐
            // │ TODO 4: Change this line from:                      │
            // │   complianceActivity.checkCompliance(compReq)       │
            // │ to:                                                 │
            // │   complianceService.checkCompliance(compReq)        │
            // └─────────────────────────────────────────────────────┘
            ComplianceResult compliance = complianceActivity.checkCompliance(compReq);

            Workflow.getLogger(PaymentProcessingWorkflowImpl.class)
                    .info("Compliance result: " + compliance.getRiskLevel()
                            + " | approved=" + compliance.isApproved());

            if (!compliance.isApproved()) {
                return new PaymentResult(false, request.getTransactionId(), "DECLINED_COMPLIANCE",
                        compliance.getRiskLevel(), compliance.getExplanation(), null, null);
            }

            // Step 3: Execute payment (only if compliance approved)
            Workflow.getLogger(PaymentProcessingWorkflowImpl.class)
                    .info("Step 3: executing payment for " + request.getTransactionId());
            String confirmation = paymentActivity.executePayment(request);

            return new PaymentResult(true, request.getTransactionId(), "COMPLETED",
                    compliance.getRiskLevel(), compliance.getExplanation(),
                    confirmation, null);

        } catch (Exception e) {
            Workflow.getLogger(PaymentProcessingWorkflowImpl.class)
                    .error("Workflow failed: " + e.getMessage());
            return new PaymentResult(false, request.getTransactionId(), "FAILED",
                    null, null, null, e.getMessage());
        }
    }
}
