// @@@SNIPSTART setup-chapter-activity
package activities

import (
	"context"
)

// SSNTraceActivity is your custom Activity Definition.
func SSNTraceActivity(ctx context.Context, param string) (*string, error) {
	// This is where a call to another service is made
	// Here we are pretending that the service that does SSNTrace returned "pass"
	result := "pass"
	return &result, nil
}

// @@@SNIPEND
