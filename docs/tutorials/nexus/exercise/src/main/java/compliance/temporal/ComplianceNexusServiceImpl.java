package compliance.temporal;

// ═══════════════════════════════════════════════════════════════════
//  TODO 2: Implement the Nexus service handler
// ═══════════════════════════════════════════════════════════════════
//
// This is the "controller" that handles incoming Nexus requests.
//
// METAPHOR: Think of a restaurant with a front desk:
//   - ComplianceNexusService (the interface) = the menu
//   - This class                             = the waiter taking orders
//   - ComplianceChecker                      = the chef
//
// This is a SYNC handler — it runs inline and returns immediately.
// No new Temporal workflow is started on the Compliance side.
// (In Exercise 1302 you'll learn about async handlers.)
//
// ── Two new annotations: ────────────────────────────────────────
//   @ServiceImpl(service = ComplianceNexusService.class)  — on the class
//   @OperationImpl                                         — on each handler method
//
// ── What to implement: ──────────────────────────────────────────
//
//   1. Add @ServiceImpl annotation pointing to ComplianceNexusService.class
//   2. Add a ComplianceChecker field, accept it via constructor
//   3. Create a checkCompliance() method that returns:
//      OperationHandler<ComplianceRequest, ComplianceResult>
//   4. Annotate it with @OperationImpl
//   5. Return a sync handler:
//      WorkflowClientOperationHandlers.sync(
//          (context, details, client, input) -> checker.checkCompliance(input)
//      )
//
// IMPORTANT: The method name must EXACTLY match the interface method name.
//   Interface:  checkCompliance(ComplianceRequest)
//   Handler:    checkCompliance()  — same name, but returns OperationHandler
//
// ── Imports you'll need: ────────────────────────────────────────
//   import compliance.ComplianceChecker;
//   import compliance.domain.ComplianceRequest;
//   import compliance.domain.ComplianceResult;
//   import io.nexusrpc.handler.OperationHandler;
//   import io.nexusrpc.handler.OperationImpl;
//   import io.nexusrpc.handler.ServiceImpl;
//   import io.temporal.nexus.WorkflowClientOperationHandlers;
//   import shared.nexus.ComplianceNexusService;

// TODO: Add @ServiceImpl(service = ComplianceNexusService.class)
public class ComplianceNexusServiceImpl {

    // TODO: Add a ComplianceChecker field and constructor

    // TODO: Add @OperationImpl and implement checkCompliance() method
    //       Return: WorkflowClientOperationHandlers.sync(...)
}
