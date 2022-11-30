// @@@SNIPSTART subscription-go-workflow-definition
package subscription

import (
	"log"
	"time"

	"go.temporal.io/sdk/workflow"
)

func SubscriptionWorkflow(ctx workflow.Context, customer Customer) (string, error) {
	workflowCustomer := customer
	subscriptionCancelled := false
	billingPeriodNum := 0
	actResult := ""

	QueryCustomerIdName := "customerid"
	QueryBillingPeriodNumberName := "billingperiodnumber"
	QueryBillingPeriodChargeAmountName := "billingperiodchargeamount"

	logger := workflow.GetLogger(ctx)

	// Define query handlers
	// Register query handler to return trip count
	err := workflow.SetQueryHandler(ctx, QueryCustomerIdName, func() (string, error) {
		return workflowCustomer.Id, nil
	})
	if err != nil {
		logger.Info("QueryCustomerIdName handler failed.", "Error", err)
		return "Error", err
	}

	err = workflow.SetQueryHandler(ctx, QueryBillingPeriodNumberName, func() (int, error) {
		return billingPeriodNum, nil
	})
	if err != nil {
		logger.Info("QueryBillingPeriodNumberName handler failed.", "Error", err)
		return "Error", err
	}

	err = workflow.SetQueryHandler(ctx, QueryBillingPeriodChargeAmountName, func() (int, error) {
		return workflowCustomer.Subscription.BillingPeriodCharge, nil
	})
	if err != nil {
		logger.Info("QueryBillingPeriodChargeAmountName handler failed.", "Error", err)
		return "Error", err
	}
	// end defining query handlers

	// Define signal channels
	// 1) billing period charge change signal
	chargeSelector := workflow.NewSelector(ctx)
	signalCh := workflow.GetSignalChannel(ctx, "billingperiodcharge")
	chargeSelector.AddReceive(signalCh, func(ch workflow.ReceiveChannel, _ bool) {
		var chargeSignal int
		ch.Receive(ctx, &chargeSignal)
		workflowCustomer.Subscription.BillingPeriodCharge = chargeSignal
	})
	// 2) cancel subscription signal
	cancelSelector := workflow.NewSelector(ctx)
	cancelCh := workflow.GetSignalChannel(ctx, "cancelsubscription")
	cancelSelector.AddReceive(cancelCh, func(ch workflow.ReceiveChannel, _ bool) {
		var cancelSubSignal bool
		ch.Receive(ctx, &cancelSubSignal)
		subscriptionCancelled = cancelSubSignal
	})
	// end defining signal channels

	ao := workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute * 5,
	}

	ctx = workflow.WithActivityOptions(ctx, ao)
	logger.Info("Subscription workflow started for: " + customer.Id)

	var activities *Activities

	// Send welcome email to customer
	err = workflow.ExecuteActivity(ctx, activities.SendWelcomeEmail, workflowCustomer).Get(ctx, &actResult)
	if err != nil {
		log.Fatalln("Failure executing SendWelcomeEmail", err)
	}

	// Start the free trial period. User can still cancel subscription during this time
	workflow.AwaitWithTimeout(ctx, workflowCustomer.Subscription.TrialPeriod, func() bool {
		return subscriptionCancelled == true
	})

	// If customer cancelled their subscription during trial period, send notification email
	if subscriptionCancelled == true {
		err = workflow.ExecuteActivity(ctx, activities.SendCancellationEmailDuringTrialPeriod, workflowCustomer).Get(ctx, &actResult)
		if err != nil {
			log.Fatalln("Failure executing SendCancellationEmailDuringTrialPeriod", err)
		}
		// We have completed subscription for this customer.
		// Finishing workflow execution
		return "Subscription finished for: " + workflowCustomer.Id, err
	}

	// Trial period is over, start billing until
	// we reach the max billing periods for the subscription
	// or sub has been cancelled
	for {
		if billingPeriodNum >= workflowCustomer.Subscription.MaxBillingPeriods {
			break
		}

		// Charge customer for the billing period
		err = workflow.ExecuteActivity(ctx, activities.ChargeCustomerForBillingPeriod, workflowCustomer).Get(ctx, &actResult)
		if err != nil {
			log.Fatalln("Failure executing ChargeCustomerForBillingPeriod", err)
		}
		// Wait 1 billing period to charge customer or if they cancel subscription
		// whichever comes first
		workflow.AwaitWithTimeout(ctx, workflowCustomer.Subscription.BillingPeriod, cancelSelector.HasPending)

		if subscriptionCancelled {
			err = workflow.ExecuteActivity(ctx, activities.SendCancellationEmailDuringActiveSubscription, workflowCustomer).Get(ctx, &actResult)
			if err != nil {
				log.Fatalln("Failure executing SendCancellationEmailDuringActiveSubscription", err)
			}
			break
		}

		billingPeriodNum++

		for chargeSelector.HasPending() {
			chargeSelector.Select(ctx)
		}
	}

	// if we get here the subscription period is over
	// notify the customer to buy a new subscription
	if !subscriptionCancelled {
		err = workflow.ExecuteActivity(ctx, activities.SendSubscriptionOverEmail, workflowCustomer).Get(ctx, &actResult)
		if err != nil {
			log.Fatalln("Failure executing SendSubscriptionOverEmail", err)
		}
	}

	return "Completed Subscription Workflow", err
}
// @@@SNIPEND
