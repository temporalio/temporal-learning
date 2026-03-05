package compliance.temporal.activity;

import compliance.ComplianceChecker;
import compliance.domain.ComplianceRequest;
import compliance.domain.ComplianceResult;

/**
 * [GIVEN] Compliance activity implementation — wraps the ComplianceChecker.
 *
 * In the monolith (Checkpoint 0), this runs on the Payments worker.
 * After decoupling, the ComplianceChecker is called from the Nexus handler instead.
 */
public class ComplianceActivityImpl implements ComplianceActivity {
    private final ComplianceChecker complianceChecker;

    public ComplianceActivityImpl(ComplianceChecker checker) {
        complianceChecker = checker;
    }

    @Override
    public ComplianceResult checkCompliance(ComplianceRequest request) {
        return complianceChecker.checkCompliance(request);
    }
}
