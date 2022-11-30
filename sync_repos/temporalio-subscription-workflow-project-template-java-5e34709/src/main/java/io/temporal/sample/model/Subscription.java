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

// @@@SNIPSTART subscription-java-subscription-model
package io.temporal.sample.model;

import java.time.Duration;

// The subscription model
public class Subscription {
  // defines the duration of subscription trial period
  private Duration trialPeriod;
  // defines the duration of subscription billing period
  private Duration billingPeriod;
  // defines the max billing periods for this subscription
  private int maxBillingPeriods;
  // defines the per-billing period charge
  private int billingPeriodCharge;

  public Subscription() {}

  public Subscription(
      Duration trialPeriod,
      Duration billingPeriod,
      int maxBillingPeriods,
      int billingPeriodCharge) {
    this.trialPeriod = trialPeriod;
    this.billingPeriod = billingPeriod;
    this.maxBillingPeriods = maxBillingPeriods;
    this.billingPeriodCharge = billingPeriodCharge;
  }

  public Duration getTrialPeriod() {
    return trialPeriod;
  }

  public void setTrialPeriod(Duration trialPeriod) {
    this.trialPeriod = trialPeriod;
  }

  public Duration getBillingPeriod() {
    return billingPeriod;
  }

  public void setBillingPeriod(Duration billingPeriod) {
    this.billingPeriod = billingPeriod;
  }

  public int getMaxBillingPeriods() {
    return maxBillingPeriods;
  }

  public void setMaxBillingPeriods(int maxBillingPeriods) {
    this.maxBillingPeriods = maxBillingPeriods;
  }

  public int getBillingPeriodCharge() {
    return billingPeriodCharge;
  }

  public void setBillingPeriodCharge(int billingPeriodCharge) {
    this.billingPeriodCharge = billingPeriodCharge;
  }

  @Override
  public String toString() {
    return "Subscription{"
        + "trialPeriod="
        + trialPeriod
        + ", billingPeriod="
        + billingPeriod
        + ", maxBillingPeriods="
        + maxBillingPeriods
        + ", billingPeriodCharge="
        + billingPeriodCharge
        + '}';
  }
}
// @@@SNIPEND
