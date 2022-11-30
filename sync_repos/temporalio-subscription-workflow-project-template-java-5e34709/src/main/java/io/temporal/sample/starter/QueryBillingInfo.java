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

// @@@SNIPSTART subscription-java-query-billing-info-query
package io.temporal.sample.starter;

import io.temporal.client.WorkflowClient;
import io.temporal.sample.workflow.SubscriptionWorkflow;
import io.temporal.serviceclient.WorkflowServiceStubs;

// Allows you to query billing information for an existing customer
public class QueryBillingInfo {

  public static void main(String[] args) {

    /*
     * Define the Workflow service. It is a gRPC stubs wrapper which talks to the docker instance of
     * our locally running Temporal service.
     * Defined here as reused by other starters
     */
    WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();

    /*
     * Define the Workflow client. It is a Temporal service client used to start, Signal, and Query
     * Workflows
     */
    WorkflowClient client = WorkflowClient.newInstance(service);

    // Passed in customer id
    String customerId = args[0];

    // Create a stub that points to an existing subscription Workflow with the given ID
    SubscriptionWorkflow workflow =
        client.newWorkflowStub(
            SubscriptionWorkflow.class, SubscriptionWorkflowStarter.WORKFLOW_ID_BASE + customerId);

    // Print the customer billing info (from Workflow Query methods)
    printCustomerBillingInfo(workflow);
  }

  private static void printCustomerBillingInfo(SubscriptionWorkflow workflow) {
    System.out.println("*****************");
    System.out.println("Customer Id: " + workflow.queryCustomerId());
    System.out.println("Billing Period #: " + workflow.queryBillingPeriodNumber());
    System.out.println("Charge Amount: " + workflow.queryBillingPeriodChargeAmount());
  }
}
// @@@SNIPEND
