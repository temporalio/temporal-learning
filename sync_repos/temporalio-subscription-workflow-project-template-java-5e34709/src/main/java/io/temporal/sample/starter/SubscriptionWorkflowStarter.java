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

// @@@SNIPSTART subscription-java-workflow-execution-starter
package io.temporal.sample.starter;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.sample.activities.SubscriptionActivitiesImpl;
import io.temporal.sample.model.Customer;
import io.temporal.sample.model.Subscription;
import io.temporal.sample.workflow.SubscriptionWorkflow;
import io.temporal.sample.workflow.SubscriptionWorkflowImpl;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/** Subscription Workflow starter */
public class SubscriptionWorkflowStarter {

  // Task Queue name
  public static final String TASK_QUEUE = "SubscriptionsTaskQueue";
  // Base Id for all subscription Workflow Ids
  public static final String WORKFLOW_ID_BASE = "SubscriptionsWorkflow";

  /*
   * Define our Subscription
   * Let's say we have a trial period of 10 seconds and a billing period of 10 seconds
   * In real life this would be much longer
   * We also set the max billing periods to 24, and the billing cycle charge to 120
   */
  public static Subscription subscription =
      new Subscription(Duration.ofSeconds(10), Duration.ofSeconds(10), 24, 120);

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

    /*
     * Define the Workflow factory. It is used to create Workflow Workers for a specific Task Queue.
     */
    WorkerFactory factory = WorkerFactory.newInstance(client);

    /*
     * Define the Workflow Worker. Workflow Workers listen to a defined Task Queue and process
     * Workflows and Activities.
     */
    Worker worker = factory.newWorker(TASK_QUEUE);

    /*
     * Register our Workflow implementation with the Worker. Since Workflows are stateful in nature,
     * we need to register our Workflow type.
     */
    worker.registerWorkflowImplementationTypes(SubscriptionWorkflowImpl.class);

    /*
     * Register our Activity implementation with the Worker. Since Activities are
     * stateless and thread-safe, we need to register a shared instance.
     */
    worker.registerActivitiesImplementations(new SubscriptionActivitiesImpl());

    // Start all the Workers registered for a specific Task Queue.
    factory.start();

    // List of our example customers
    List<Customer> customers = new ArrayList<>();

    // Create example customers
    for (int i = 0; i < 5; i++) {
      Customer customer =
          new Customer("First Name" + i, "Last Name" + i, "Id-" + i, "Email" + i, subscription);
      customers.add(customer);
    }

    /*
     * Create and start a new subscription Workflow
     * for each of the example customers
     */
    customers.forEach(
        customer -> {
          // Create our Workflow client stub. It is used to start our Workflow Execution.
          // For sake of the example we set the total Workflow run timeout to 5 minutes
          SubscriptionWorkflow workflow =
              client.newWorkflowStub(
                  SubscriptionWorkflow.class,
                  WorkflowOptions.newBuilder()
                      .setTaskQueue(TASK_QUEUE)
                      .setWorkflowId(WORKFLOW_ID_BASE + customer.getId())
                      .setWorkflowRunTimeout(Duration.ofMinutes(5))
                      .build());

          // Start Workflow Execution (async)
          WorkflowClient.start(workflow::startSubscription, customer);
        });
  }
}
// @@@SNIPEND
