// @@@SNIPSTART subscription-go-subscription-struct
package subscription

import "time"

type Subscription struct {
	TrialPeriod         time.Duration
	BillingPeriod       time.Duration
	MaxBillingPeriods   int
	BillingPeriodCharge int
}
// @@@SNIPEND
