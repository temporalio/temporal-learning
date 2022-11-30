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

// @@@SNIPSTART subscription-java-tests
package io.temporal.sample;

import static org.junit.Assert.assertEquals;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.sample.activities.SubscriptionActivitiesImpl;
import io.temporal.sample.model.Customer;
import io.temporal.sample.model.Subscription;
import io.temporal.sample.starter.SubscriptionWorkflowStarter;
import io.temporal.sample.workflow.SubscriptionWorkflow;
import io.temporal.sample.workflow.SubscriptionWorkflowImpl;
import io.temporal.testing.TestWorkflowRule;
import java.time.Duration;
import org.junit.Rule;
import org.junit.Test;

/**
 * Unit test for {@link io.temporal.sample.workflow.SubscriptionWorkflow}. Doesn't use an external
 * Temporal service.
 */
public class SubscriptionWorkflowTest {

  @Rule
  public TestWorkflowRule testWorkflowRule =
      TestWorkflowRule.newBuilder()
          .setWorkflowTypes(SubscriptionWorkflowImpl.class)
          .setActivityImplementations(new SubscriptionActivitiesImpl())
          .build();

  @Test
  public void testSubscription() {
    // create a test subscription
    Subscription subscription =
        new Subscription(Duration.ofSeconds(3), Duration.ofSeconds(5), 12, 120);

    // create a test customer
    Customer customer =
        new Customer("Test", "Subscripber", "Id-0", "test@subscriber.io", subscription);

    SubscriptionWorkflow workflow =
        testWorkflowRule
            .getWorkflowClient()
            .newWorkflowStub(
                SubscriptionWorkflow.class,
                WorkflowOptions.newBuilder()
                    .setTaskQueue(testWorkflowRule.getTaskQueue())
                    .setWorkflowId(SubscriptionWorkflowStarter.WORKFLOW_ID_BASE + customer.getId())
                    .setWorkflowRunTimeout(Duration.ofMinutes(5))
                    .build());

    WorkflowClient.start(workflow::startSubscription, customer);

    // test query customer id
    assertEquals("Id-0", workflow.queryCustomerId());

    // test initial billing charge amount
    assertEquals(120, workflow.queryBillingPeriodChargeAmount());

    // test update billing cycle charge
    workflow.updateBillingPeriodChargeAmount(300);

    // test query updated billing charge amount
    assertEquals(300, workflow.queryBillingPeriodChargeAmount());

    // test billing period number
    assertEquals(0, workflow.queryBillingPeriodNumber());

    // stop execution
    workflow.cancelSubscription();
  }
}
// @@@SNIPEND
