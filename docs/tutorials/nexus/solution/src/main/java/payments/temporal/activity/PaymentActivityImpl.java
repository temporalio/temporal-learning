package payments.temporal.activity;

import payments.PaymentGateway;
import payments.domain.PaymentRequest;

/**
 * [GIVEN] Payment activity implementation — thin wrapper around PaymentGateway.
 */
public class PaymentActivityImpl implements PaymentActivity {
    private final PaymentGateway paymentGateway;

    public PaymentActivityImpl(PaymentGateway gateway) {
        paymentGateway = gateway;
    }

    @Override
    public boolean validatePayment(PaymentRequest request) {
        return paymentGateway.validatePayment(request);
    }

    @Override
    public String executePayment(PaymentRequest request) {
        return paymentGateway.executePayment(request);
    }
}
