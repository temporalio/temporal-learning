---
id: candidate-acceptance
sidebar_position: 6
keywords: [go, golang, temporal, sdk, tutorial]
title: What does the Candidate Acceptance Workflow Definition look like?
description: The Candidate Acceptance Workflow sends email to the Candidate via an Activity Execution and waits on a Signal.
image: /img/temporal-logo-twitter-card.png
---

<!--SNIPSTART background-checks-accept-workflow-definition-->
[workflows/accept.go](https://github.com/temporalio/background-checks/blob/main/workflows/accept.go)
```go
func Accept(ctx workflow.Context, input *AcceptWorkflowInput) (*AcceptWorkflowResult, error) {
	err := emailCandidate(ctx, input)
	if err != nil {
		return &AcceptWorkflowResult{}, err
	}

	submission, err := waitForSubmission(ctx)

	result := AcceptWorkflowResult(*submission)
	return &result, err
}

```
<!--SNIPEND-->

![Swim lane diagram of the Candidate Acceptance Child Workflow Execution](images/candidate-accept-flow.svg)
