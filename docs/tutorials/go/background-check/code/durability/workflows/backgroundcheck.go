// @@@SNIPSTART durability-chapter-workflow
package workflows

import (
	"time"

	"go.temporal.io/sdk/workflow"

	"background-check-tutorialchapters/durability/activities"
)

// BackgroundCheck is your custom Workflow Definition.
func BackgroundCheck(ctx workflow.Context, param string) (string, error) {
	// highlight-start
	// Sleep for 1 minute
	workflow.GetLogger(ctx).Info("Sleeping for 1 minute...")
	err := workflow.Sleep(ctx, 60*time.Second)
	if err != nil {
		return "", err
	}
	workflow.GetLogger(ctx).Info("Finished sleeping")
	// highlight-end
	// Define the Activity Execution options
	// StartToCloseTimeout or ScheduleToCloseTimeout must be set
	activityOptions := workflow.ActivityOptions{
		StartToCloseTimeout: 10 * time.Second,
	}
	ctx = workflow.WithActivityOptions(ctx, activityOptions)
	// Execute the Activity synchronously (wait for the result before proceeding)
	var ssnTraceResult string
	err = workflow.ExecuteActivity(ctx, activities.SSNTraceActivity, param).Get(ctx, &ssnTraceResult)
	if err != nil {
		return "", err
	}
	// Make the results of the Workflow available
	return ssnTraceResult, nil
}

// @@@SNIPEND
