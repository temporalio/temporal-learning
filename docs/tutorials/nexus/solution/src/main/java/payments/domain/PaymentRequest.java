package payments.domain;

/**
 * [GIVEN] A payment transaction to be processed.
 */
public class PaymentRequest {
    public String transactionId;
    public double amount;
    public String currency;
    public String senderCountry;
    public String receiverCountry;
    public String description;
    public String senderAccount;
    public String receiverAccount;

    public PaymentRequest() {}

    public PaymentRequest(String transactionId, double amount, String currency,
                          String senderCountry, String receiverCountry,
                          String description, String senderAccount, String receiverAccount) {
        this.transactionId = transactionId;
        this.amount = amount;
        this.currency = currency;
        this.senderCountry = senderCountry;
        this.receiverCountry = receiverCountry;
        this.description = description;
        this.senderAccount = senderAccount;
        this.receiverAccount = receiverAccount;
    }

    public String getTransactionId()   { return transactionId; }
    public double getAmount()          { return amount; }
    public String getCurrency()        { return currency; }
    public String getSenderCountry()   { return senderCountry; }
    public String getReceiverCountry() { return receiverCountry; }
    public String getDescription()     { return description; }
    public String getSenderAccount()   { return senderAccount; }
    public String getReceiverAccount() { return receiverAccount; }
}
