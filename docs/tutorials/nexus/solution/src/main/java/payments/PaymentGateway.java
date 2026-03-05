package payments;

import payments.domain.PaymentRequest;

/**
 * [GIVEN] Simulated payment gateway for executing transactions.
 * In production this would call Stripe, PayPal, SWIFT, etc.
 *
 * Students use this class as-is — focus on Temporal integration, not payment logic.
 */
public class PaymentGateway {

    public boolean validatePayment(PaymentRequest request) {
        if (request.getAmount() <= 0) {
            System.out.println("[PaymentGateway] REJECTED: Invalid amount for " + request.getTransactionId());
            return false;
        }
        if (request.getSenderAccount() == null || request.getReceiverAccount() == null) {
            System.out.println("[PaymentGateway] REJECTED: Missing account info for " + request.getTransactionId());
            return false;
        }
        System.out.println("[PaymentGateway] Validation passed for " + request.getTransactionId());
        return true;
    }

    public String executePayment(PaymentRequest request) {
        System.out.println("[PaymentGateway] Processing " + request.getTransactionId()
                + " | $" + String.format("%.2f", request.getAmount())
                + " | " + request.getSenderCountry() + " -> " + request.getReceiverCountry());

        // Simulate processing time
        try {
            Thread.sleep(500 + (long) (Math.random() * 500));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Simulate occasional gateway failures (10% chance) — Temporal retries automatically
        if (Math.random() < 0.10) {
            throw new RuntimeException("Payment gateway timeout for " + request.getTransactionId()
                    + " — connection to banking network failed");
        }

        String confirmationNumber = "CONF-" + request.getTransactionId() + "-" + System.currentTimeMillis();
        System.out.println("[PaymentGateway] Payment executed: " + confirmationNumber);
        return confirmationNumber;
    }
}
