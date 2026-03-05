package compliance.domain;

/**
 * [GIVEN] Input to the compliance check.
 * Sent by the Payments team to the Compliance team.
 */
public class ComplianceRequest {
    public String transactionId;
    public double amount;
    public String senderCountry;
    public String receiverCountry;
    public String description;

    public ComplianceRequest() {}

    public ComplianceRequest(String transactionId, double amount,
                             String senderCountry, String receiverCountry,
                             String description) {
        this.transactionId = transactionId;
        this.amount = amount;
        this.senderCountry = senderCountry;
        this.receiverCountry = receiverCountry;
        this.description = description;
    }

    public String getTransactionId() { return transactionId; }
    public double getAmount()        { return amount; }
    public String getSenderCountry() { return senderCountry; }
    public String getReceiverCountry() { return receiverCountry; }
    public String getDescription()   { return description; }
}
