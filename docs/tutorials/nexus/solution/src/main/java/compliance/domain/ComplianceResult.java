package compliance.domain;

/**
 * [GIVEN] Result of a compliance check.
 * Returned by the Compliance team to the Payments team.
 *
 * Fields:
 *   approved    — true = proceed with payment, false = block it
 *   riskLevel   — "LOW", "MEDIUM", or "HIGH"
 *   explanation — one-line explanation of the decision
 */
public class ComplianceResult {
    public String transactionId;
    public boolean approved;
    public String riskLevel;    // "LOW", "MEDIUM", "HIGH"
    public String explanation;

    public ComplianceResult() {}

    public ComplianceResult(String transactionId, boolean approved,
                            String riskLevel, String explanation) {
        this.transactionId = transactionId;
        this.approved = approved;
        this.riskLevel = riskLevel;
        this.explanation = explanation;
    }

    public String getTransactionId() { return transactionId; }
    public boolean isApproved()      { return approved; }
    public String getRiskLevel()     { return riskLevel; }
    public String getExplanation()   { return explanation; }

    @Override
    public String toString() {
        return String.format("ComplianceResult{txn=%s, approved=%s, risk=%s, explanation='%s'}",
                transactionId, approved, riskLevel, explanation);
    }
}
