package compliance.temporal.activity;

import compliance.domain.ComplianceRequest;
import compliance.domain.ComplianceResult;
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

/**
 * [GIVEN] Compliance activity interface — used in the monolith.
 *
 * In the starting state (Checkpoint 0), the PaymentProcessingWorkflow calls
 * this activity directly. After you add Nexus, this activity stays here but
 * gets called from the Compliance worker's Nexus handler instead.
 */
@ActivityInterface
public interface ComplianceActivity {
    @ActivityMethod
    ComplianceResult checkCompliance(ComplianceRequest request);
}
