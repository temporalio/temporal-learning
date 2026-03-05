package payments.temporal.activity;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;
import payments.domain.PaymentRequest;

@ActivityInterface
public interface PaymentActivity {
    @ActivityMethod
    boolean validatePayment(PaymentRequest request);

    @ActivityMethod
    String executePayment(PaymentRequest request);
}
