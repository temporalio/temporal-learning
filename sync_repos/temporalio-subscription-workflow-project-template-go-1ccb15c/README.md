# Temporal Subscription Workflow Template in Go
<!-- @@@SNIPSTART subscription-go-readme -->
This project template illustrates the design pattern for subscription style business logic.

**Setup**

Run the Temporal Server:

```bash
git clone https://github.com/temporalio/docker-compose.git
cd docker-compose
docker-compose up
```

**Start**

Start the Worker:

```bash
go run worker/main.go
```

Start the Workflow Executions:

```bash
go run starter/main.go
```

This will start the Workflow Executions for 5 customers with the following Ids:

```text
Id-0
Id-1
Id-2
Id-3
Id-4
```

**Get billing info**

You can Query the Workflow Executions and get the billing information for each customer.

```bash
go run querybillinginfo/main.go    
```

Run this multiple times to see the billing period number increase during the executions or see the billing cycle cost.

**Update billing**

You can send a Signal a Workflow Execution to update the billing cycle cost to 300 for all customers.

```bash
go run updatechargeamount/main.go
```

**Cancel subscription**

You can send a Signal to all Workflow Executions to cancel the subscription for all customers.
Workflow Executions will complete after the currently executing billing period.

```bash
go run cancelsubscription/main.go
```

After running this, check out the [Temporal Web UI](localhost://8088) and see that all subscription Workflow Executions have a "Completed" status.
<!-- @@@@SNIPEND -->
