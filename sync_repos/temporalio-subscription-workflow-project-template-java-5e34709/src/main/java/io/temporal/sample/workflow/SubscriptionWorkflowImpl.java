/*
 *  Copyright (c) 2020 Temporal Technologies, Inc. All Rights Reserved
 *
 *  Copyright 2012-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Modifications copyright (C) 2017 Uber Technologies, Inc.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not
 *  use this file except in compliance with the License. A copy of the License is
 *  located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 *  or in the "license" file accompanying this file. This file is distributed on
 *  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *  express or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */

// @@@SNIPSTART subscription-java-workflow-definition-implementation
package io.temporal.sample.workflow;

import io.temporal.activity.ActivityOptions;
import io.temporal.sample.activities.SubscriptionActivities;
import io.temporal.sample.model.Customer;
import io.temporal.workflow.Workflow;
import java.time.Duration;

/** Subscription Workflow implementation. Note this is just a POJO. */
public class SubscriptionWorkflowImpl implements SubscriptionWorkflow {

  private int billingPeriodNum;
  private boolean subscriptionCancelled;
  private Customer customer;

  /*
   * Define our Activity options:
   * setStartToCloseTimeout: maximum Activity Execution time after it was sent to a Worker
   */
  private final ActivityOptions activityOptions =
      ActivityOptions.newBuilder().setStartToCloseTimeout(Duration.ofSeconds(5)).build();

  // Define subscription Activities stub
  private final SubscriptionActivities activities =
      Workflow.newActivityStub(SubscriptionActivities.class, activityOptions);

  @Override
  public void startSubscription(Customer customer) {
    // Set the Workflow customer
    this.customer = customer;

    // Send welcome email to customer
    activities.sendWelcomeEmail(customer);

    // Start the free trial period. User can still cancel subscription during this time
    Workflow.await(customer.getSubscription().getTrialPeriod(), () -> subscriptionCancelled);

    // If customer cancelled their subscription during trial period, send notification email
    if (subscriptionCancelled) {
      activities.sendCancellationEmailDuringTrialPeriod(customer);
      // We have completed subscription for this customer.
      // Finishing Workflow Execution
      return;
    }

    // Trial period is over, start billing until
    // we reach the max billing periods for the subscription
    // or sub has been cancelled
    while (billingPeriodNum < customer.getSubscription().getMaxBillingPeriods()) {

      // Charge customer for the billing period
      activities.chargeCustomerForBillingPeriod(customer, billingPeriodNum);

      // Wait 1 billing period to charge customer or if they cancel subscription
      // whichever comes first
      Workflow.await(customer.getSubscription().getBillingPeriod(), () -> subscriptionCancelled);

      // If customer cancelled their subscription send notification email
      if (subscriptionCancelled) {
        activities.sendCancellationEmailDuringActiveSubscription(customer);

        // We have completed subscription for this customer.
        // Finishing Workflow Execution
        break;
      }

      billingPeriodNum++;
    }

    // if we get here the subscription period is over
    // notify the customer to buy a new subscription
    if (!subscriptionCancelled) {
      activities.sendSubscriptionOverEmail(customer);
    }
  }

  @Override
  public void cancelSubscription() {
    subscriptionCancelled = true;
  }

  @Override
  public void updateBillingPeriodChargeAmount(int billingPeriodChargeAmount) {
    customer.getSubscription().setBillingPeriodCharge(billingPeriodChargeAmount);
  }

  @Override
  public String queryCustomerId() {
    return customer.getId();
  }

  @Override
  public int queryBillingPeriodNumber() {
    return billingPeriodNum;
  }

  @Override
  public int queryBillingPeriodChargeAmount() {
    return customer.getSubscription().getBillingPeriodCharge();
  }
}
// @@@SNIPEND
