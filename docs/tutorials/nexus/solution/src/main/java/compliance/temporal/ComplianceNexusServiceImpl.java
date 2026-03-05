package compliance.temporal;

import compliance.ComplianceChecker;
import compliance.domain.ComplianceRequest;
import compliance.domain.ComplianceResult;
import io.nexusrpc.handler.OperationHandler;
import io.nexusrpc.handler.OperationImpl;
import io.nexusrpc.handler.ServiceImpl;
import io.temporal.nexus.WorkflowClientOperationHandlers;
import shared.nexus.ComplianceNexusService;

/**
 * Nexus service handler — receives cross-team calls from Payments.
 *
 * This is a SYNC handler: runs inline, returns immediately.
 * The ComplianceChecker does the actual rule evaluation.
 */
@ServiceImpl(service = ComplianceNexusService.class)
public class ComplianceNexusServiceImpl {

    private final ComplianceChecker complianceChecker;

    public ComplianceNexusServiceImpl(ComplianceChecker checker) {
        complianceChecker = checker;
    }

    @OperationImpl
    public OperationHandler<ComplianceRequest, ComplianceResult> checkCompliance() {
        return WorkflowClientOperationHandlers.sync(
                (context, details, client, input) -> complianceChecker.checkCompliance(input)
        );
    }
}
