package payments.temporal;

import compliance.domain.ComplianceRequest;
import compliance.domain.ComplianceResult;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.NexusOperationOptions;
import io.temporal.workflow.NexusServiceOptions;
import io.temporal.workflow.Workflow;
import payments.domain.PaymentRequest;
import payments.domain.PaymentResult;
import payments.temporal.activity.PaymentActivity;
import shared.nexus.ComplianceNexusService;

import java.time.Duration;

/**
 * DECOUPLED VERSION — compliance check goes through Nexus.
 *
 * The only change from the monolith:
 *   - ComplianceActivity stub → ComplianceNexusService stub
 *   - complianceActivity.checkCompliance() → complianceService.checkCompliance()
 *
 * Same method name. Same input. Same output. Different architecture.
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

    // Nexus service stub replaces the ComplianceActivity stub
    private final ComplianceNexusService complianceService = Workflow.newNexusServiceStub(
            ComplianceNexusService.class,
            NexusServiceOptions.newBuilder()
                    .setOperationOptions(NexusOperationOptions.newBuilder()
                            .setScheduleToCloseTimeout(Duration.ofMinutes(2))
                            .build())
                    .build());

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

            // Step 2: Compliance check via Nexus (Compliance team)
            ComplianceRequest compReq = new ComplianceRequest(
                    request.getTransactionId(), request.getAmount(),
                    request.getSenderCountry(), request.getReceiverCountry(),
                    request.getDescription());

            Workflow.getLogger(PaymentProcessingWorkflowImpl.class)
                    .info("Step 2: calling compliance check via Nexus for " + request.getTransactionId());

            ComplianceResult compliance = complianceService.checkCompliance(compReq);

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
