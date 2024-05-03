---
id: ssn-trace
sidebar_position: 7
keywords: [go, golang, temporal, sdk, tutorial]
title: What does the SSN Trace Workflow Definition look like?
description: The SSN Trace Workflow calls an external API via an Activity Execution and returns the results.
image: /img/temporal-logo-twitter-card.png
---

<!--SNIPSTART background-checks-ssn-trace-workflow-definition-->
[workflows/ssn_trace.go](https://github.com/temporalio/background-checks/blob/master/workflows/ssn_trace.go)
```go

// SSNTrace is a Workflow Definition that calls for the execution of a single Activity.
// This is executed as a Child Workflow by the main Background Check.
func SSNTrace(ctx workflow.Context, input *SSNTraceWorkflowInput) (*SSNTraceWorkflowResult, error) {
	var result activities.SSNTraceResult

	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute,
	})

	f := workflow.ExecuteActivity(ctx, a.SSNTrace, SSNTraceWorkflowInput(*input))

	err := f.Get(ctx, &result)
	r := SSNTraceWorkflowResult(result)
	return &r, err
}

```
<!--SNIPEND-->

![Swim lane diagram of the SSN Trace Child Workflow Execution](images/ssn-trace-flow.svg)
