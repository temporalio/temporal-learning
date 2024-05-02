---
id: federal-criminal-search
sidebar_position: 8
keywords: [go, golang, temporal, sdk, tutorial]
title: What does the Federal Criminal Search Workflow Definition look like?
description: The Federal Criminal Search Workflow calls an external API via an Activity Execution and returns the results.
image: /img/temporal-logo-twitter-card.png

---

<!--SNIPSTART background-checks-federal-criminal-workflow-definition-->
[workflows/federal_criminal_search.go](https://github.com/temporalio/background-checks/blob/master/workflows/federal_criminal_search.go)
```go
func FederalCriminalSearch(ctx workflow.Context, input *FederalCriminalSearchWorkflowInput) (*FederalCriminalSearchWorkflowResult, error) {
	var result activities.FederalCriminalSearchResult

	name := input.FullName
	var address string
	if len(input.KnownAddresses) > 0 {
		address = input.KnownAddresses[0]
	}
	var crimes []string

	activityInput := activities.FederalCriminalSearchInput{
		FullName: name,
		Address:  address,
	}
	var activityResult activities.FederalCriminalSearchResult

	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{
		StartToCloseTimeout: time.Minute,
	})

	federalcheck := workflow.ExecuteActivity(ctx, a.FederalCriminalSearch, activityInput)

	err := federalcheck.Get(ctx, &activityResult)
	if err == nil {
		crimes = append(crimes, activityResult.Crimes...)
	}
	result.Crimes = crimes

	r := FederalCriminalSearchWorkflowResult(result)
	return &r, nil
}

```
<!--SNIPEND-->

![Swim lane diagram of the Federal Criminal Search Child Workflow Execution](images/federal-criminal-search-flow.svg)
