# Subscription Workflow Project Template in Java
<!-- @@@SNIPSTART subscription-java-readme -->
This project template illustrates the design pattern for subscription style business logic.

**Setup**

Build the project:

```bash
./gradlew build
```

Run the Temporal Server in another terminal:

```bash
git clone https://github.com/temporalio/docker-compose.git
cd docker-compose
docker-compose up
```

**Start**

Start the Workflow Executions:

```bash
./gradlew -q execute -PmainClass=io.temporal.sample.starter.SubscriptionWorkflowStarter
```

This will start Workflow Executions for 5 customers with the following Ids:

```text
Id-0
Id-1
Id-2
Id-3
Id-4
```

**Get billing info**

You can Query the Workflow Executions and get the billing information of a specific customer.
Pass in an Id of an existing subscription customer (e.g. "Id-0").

```bash
./gradlew -q execute -PmainClass=io.temporal.sample.starter.QueryBillingInfo --args="Id-0"
```

**Update billing**

You can send a Signal a Workflow Execution to update the billing cycle cost for a specific customer.
Pass in the customer Id and the amount (e.g. "Id-0 300").

```bash
./gradlew -q execute -PmainClass=io.temporal.sample.starter.UpdateBillingCycleCharge --args="Id-0 300"
```

**Cancel subscription**

You can send a Signal to Workflow Execution to cancel the subscription for a specific customer.
Pass in the customer Id (e.g. "Id-0").

```bash
./gradlew -q execute -PmainClass=io.temporal.sample.starter.CancelSubscription --args="Id-0"
```
<!-- @@@SNIPEND -->
