package shared.nexus;

import compliance.domain.ComplianceRequest;
import compliance.domain.ComplianceResult;
import io.nexusrpc.Operation;
import io.nexusrpc.Service;

/**
 * Nexus Service Interface — the shared contract between Payments and Compliance teams.
 *
 * Both teams depend on this interface:
 *   - Payments team creates a stub from it (in the workflow)
 *   - Compliance team implements a handler for it (in the worker)
 */
@Service
public interface ComplianceNexusService {

    @Operation
    ComplianceResult checkCompliance(ComplianceRequest request);
}
