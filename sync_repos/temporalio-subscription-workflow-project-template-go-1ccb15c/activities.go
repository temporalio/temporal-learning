// @@@SNIPSTART subscription-go-activities
package subscription

import (
	"context"

	"go.temporal.io/sdk/activity"
)

type Activities struct {
}

func (a *Activities) SendWelcomeEmail(ctx context.Context, customer Customer) (string, error) {
	activity.GetLogger(ctx).Info("sending welcome email to customer", customer.Id)
	return "Sending welcome email completed for " + customer.Id, nil
}

func (a *Activities) SendCancellationEmailDuringTrialPeriod(ctx context.Context, customer Customer) (string, error) {
	activity.GetLogger(ctx).Info("sending cancellation email during trial period to: ", customer.Email)
	return "Sending cancellation email during trial period completed for " + customer.Id, nil
}

func (a *Activities) ChargeCustomerForBillingPeriod(ctx context.Context, customer Customer) (string, error) {
	activity.GetLogger(ctx).Info("charging customer for billing period.")
	return "Charging for billing period completed for: " + customer.Id, nil
}

func (a *Activities) SendCancellationEmailDuringActiveSubscription(ctx context.Context, customer Customer) (string, error) {
	activity.GetLogger(ctx).Info("sending cancellation email during active subscription to: ", customer.Id)
	return "Sending cancellation email during active subscription completed for: " + customer.Id, nil
}

func (a *Activities) SendSubscriptionOverEmail(ctx context.Context, customer Customer) (string, error) {
	activity.GetLogger(ctx).Info("sending subscription over email to: ", customer.Id)
	return "Sending subscription over email completed for: " + customer.Id, nil
}
// @@@SNIPEND
