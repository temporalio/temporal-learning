package shared.nexus;

// ═══════════════════════════════════════════════════════════════════
//  TODO 1: Create the Nexus service interface (the shared contract)
// ═══════════════════════════════════════════════════════════════════
//
// This is the first file to implement because BOTH teams depend on it.
// Think of it as an API contract — like an OpenAPI spec, but durable.
//
// METAPHOR: When two apartments share a lobby, the lobby door is the
// interface. Both sides agree on the door shape. Neither side owns it.
//
// ── What to add: ────────────────────────────────────────────────
//
//   1. Add @Service annotation to the interface (from io.nexusrpc)
//   2. Add one method: checkCompliance(ComplianceRequest) → ComplianceResult
//   3. Mark that method with @Operation (from io.nexusrpc)
//
// ── Template: ───────────────────────────────────────────────────
//
//   @Service
//   public interface ComplianceNexusService {
//       @Operation
//       ComplianceResult checkCompliance(ComplianceRequest request);
//   }
//
// ── Imports you'll need: ────────────────────────────────────────
//   import compliance.domain.ComplianceRequest;
//   import compliance.domain.ComplianceResult;
//   import io.nexusrpc.Operation;
//   import io.nexusrpc.Service;
//
// After this: implement TODO 2 (the handler) and TODO 3 (the worker).

// TODO: Replace this placeholder with the @Service interface above.
//       Delete this comment block when done.
//
// CHECKPOINT: This file won't compile on its own — that's fine.
//             It compiles once TODOs 2-5 reference it correctly.
public interface ComplianceNexusService {
}
