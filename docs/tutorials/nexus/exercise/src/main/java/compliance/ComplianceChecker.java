package compliance;

import compliance.domain.ComplianceRequest;
import compliance.domain.ComplianceResult;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * [GIVEN] Rule-based compliance checker — deterministic, no API keys needed.
 *
 * Deterministic, rule-based compliance checker — no external API calls needed.
 * Same interface whether used as an Activity or behind a Nexus handler.
 *
 * Rules:
 *   - OFAC sanctioned countries (North Korea, Iran, Cuba, Syria, Venezuela) → HIGH risk, blocked
 *   - Amount > $50,000 → HIGH risk, blocked
 *   - Amount > $10,000 or international to unusual jurisdiction → MEDIUM risk, approved with note
 *   - Everything else → LOW risk, approved
 *
 * Students use this class as-is — focus is on the Nexus boundary, not compliance logic.
 */
public class ComplianceChecker {

    private static final Set<String> SANCTIONED_COUNTRIES = new HashSet<>(Arrays.asList(
            "North Korea", "Iran", "Cuba", "Syria", "Venezuela"
    ));

    private static final Set<String> COMMON_COUNTRIES = new HashSet<>(Arrays.asList(
            "US", "UK", "Canada", "Germany", "France", "Japan", "Australia"
    ));

    public ComplianceResult checkCompliance(ComplianceRequest request) {
        System.out.println("[ComplianceChecker] Evaluating " + request.getTransactionId()
                + " | $" + String.format("%.2f", request.getAmount())
                + " | " + request.getSenderCountry() + " -> " + request.getReceiverCountry());

        // Simulate processing time — slow enough to test the Victory Lap
        // (kill the compliance worker while this is running to see Nexus durability)
        System.out.println("[ComplianceChecker] Processing " + request.getTransactionId() + " (10s delay)...");
        try {
            Thread.sleep(10_000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Rule 1: Sanctioned country → HIGH risk, blocked
        if (SANCTIONED_COUNTRIES.contains(request.getReceiverCountry())
                || SANCTIONED_COUNTRIES.contains(request.getSenderCountry())) {
            return new ComplianceResult(
                    request.getTransactionId(),
                    false,
                    "HIGH",
                    "Destination/source country is OFAC-sanctioned. Transaction blocked per regulatory requirements."
            );
        }

        // Rule 2: Very high amount → HIGH risk, blocked
        if (request.getAmount() > 50000) {
            return new ComplianceResult(
                    request.getTransactionId(),
                    false,
                    "HIGH",
                    "Transaction amount exceeds $50,000 threshold. Requires enhanced due diligence review."
            );
        }

        // Rule 3: International transfer > $10K or unusual jurisdiction → MEDIUM risk
        boolean isInternational = !request.getSenderCountry().equals(request.getReceiverCountry());
        boolean isUnusualJurisdiction = isInternational
                && !COMMON_COUNTRIES.contains(request.getReceiverCountry());

        if (request.getAmount() > 10000 || isUnusualJurisdiction) {
            return new ComplianceResult(
                    request.getTransactionId(),
                    true,
                    "MEDIUM",
                    "International transfer above $10K threshold. Approved with AML monitoring note."
            );
        }

        // Rule 4: Low risk — routine transaction
        return new ComplianceResult(
                request.getTransactionId(),
                true,
                "LOW",
                "Routine domestic/standard international transfer. No regulatory concerns."
        );
    }
}
