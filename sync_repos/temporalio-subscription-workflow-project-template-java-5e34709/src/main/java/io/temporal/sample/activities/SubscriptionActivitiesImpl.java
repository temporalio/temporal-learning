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

// @@@SNIPSTART subscription-java-activity-definition-implementation
package io.temporal.sample.activities;

import io.temporal.sample.model.Customer;

public class SubscriptionActivitiesImpl implements SubscriptionActivities {
  @Override
  public void sendWelcomeEmail(Customer customer) {
    //    System.out.println(
    //        "** SubscriptionActivities ** sending welcome email to : " + customer.toString());
  }

  @Override
  public void sendCancellationEmailDuringTrialPeriod(Customer customer) {
    //    System.out.println(
    //        "** SubscriptionActivities ** sending cancellation email during trial period to : "
    //            + customer.toString());
  }

  @Override
  public void chargeCustomerForBillingPeriod(Customer customer, int billingPeriodNum) {
    //    System.out.println(
    //        "** SubscriptionActivities ** performing billing for customer: "
    //            + customer.toString()
    //            + " and billing period: "
    //            + billingPeriodNum
    //            + " and amount: "
    //            + customer.getSubscription().getBillingPeriodCharge());
  }

  @Override
  public void sendCancellationEmailDuringActiveSubscription(Customer customer) {
    //    System.out.println(
    //        "** SubscriptionActivities ** sending cancellation email during active subscription
    // period to : "
    //            + customer.toString());
  }

  @Override
  public void sendSubscriptionOverEmail(Customer customer) {
    //    System.out.println(
    //        "** SubscriptionActivities ** sending subscription is over email to : "
    //            + customer.toString());
  }
}
// @@@SNIPEND
