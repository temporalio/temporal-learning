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

// @@@SNIPSTART subscription-java-workflow-definition-interface
package io.temporal.sample.workflow;

import io.temporal.sample.model.Customer;
import io.temporal.workflow.QueryMethod;
import io.temporal.workflow.SignalMethod;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/** Subscription Workflow interface */
@WorkflowInterface
public interface SubscriptionWorkflow {
  @WorkflowMethod
  void startSubscription(Customer customer);

  @SignalMethod
  void cancelSubscription();

  @SignalMethod
  void updateBillingPeriodChargeAmount(int billingPeriodChargeAmount);

  @QueryMethod
  String queryCustomerId();

  @QueryMethod
  int queryBillingPeriodNumber();

  @QueryMethod
  int queryBillingPeriodChargeAmount();
}
// @@@SNIPEND
