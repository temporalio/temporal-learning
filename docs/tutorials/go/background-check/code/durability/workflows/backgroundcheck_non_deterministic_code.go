// @@@SNIPSTART go-durability-chapter-non-deterministic-workflow
// CAUTION! Do not use this code!
package workflows

import (
	"math/rand"
	"time"

	"go.temporal.io/sdk/workflow"

	"background-check-tutorialchapters/durability/activities"
)

// BackgroundCheckNonDeterministic is an anti-pattern Workflow Definition
func BackgroundCheckNonDeterministic(ctx workflow.Context, param string) (string, error) {
	activityOptions := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	}
	ctx = workflow.WithActivityOptions(ctx, activityOptions)
	var ssnTraceResult string
	// highlight-start
	// CAUTION, the following code is an anti-pattern showing what NOT to do
	num := rand.Intn(100)
	if num > 50 {
		err := workflow.Sleep(ctx, 10*time.Second)
		if err != nil {
			return "", err
		}
	}
	// highlight-end
	err := workflow.ExecuteActivity(ctx, activities.SSNTraceActivity, param).Get(ctx, &ssnTraceResult)
	if err != nil {
		return "", err
	}
	return ssnTraceResult, nil
}

// @@@SNIPEND
