package payments.domain;

/**
 * [GIVEN] Result of a payment workflow execution.
 *
 * status values:
 *   "COMPLETED"           — payment processed successfully
 *   "REJECTED"            — failed payment validation
 *   "DECLINED_COMPLIANCE" — compliance check returned approved=false
 *   "FAILED"              — unexpected error
 */
public class PaymentResult {
    public boolean success;
    public String transactionId;
    public String status;
    public String riskLevel;          // from compliance check: "LOW", "MEDIUM", "HIGH"
    public String explanation;        // from compliance check explanation
    public String confirmationNumber; // set when status = COMPLETED
    public String error;

    public PaymentResult() {}

    public PaymentResult(boolean success, String transactionId, String status,
                         String riskLevel, String explanation,
                         String confirmationNumber, String error) {
        this.success = success;
        this.transactionId = transactionId;
        this.status = status;
        this.riskLevel = riskLevel;
        this.explanation = explanation;
        this.confirmationNumber = confirmationNumber;
        this.error = error;
    }

    public boolean isSuccess()             { return success; }
    public String getTransactionId()       { return transactionId; }
    public String getStatus()              { return status; }
    public String getRiskLevel()           { return riskLevel; }
    public String getExplanation()         { return explanation; }
    public String getConfirmationNumber()  { return confirmationNumber; }
    public String getError()               { return error; }
}
