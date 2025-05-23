// @@@SNIPSTART setup-chapter-test-framework
package setup

import (
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"go.temporal.io/sdk/testsuite"

	"background-check-tutorialchapters/setup/activities"
	"background-check-tutorialchapters/setup/workflows"
)

// UnitTestSuite is a struct that wraps around the testing suites
type UnitTestSuite struct {
	// Add testify test suite package
	suite.Suite
	// Add the Temporal Go SDK Workflow test suite
	testsuite.WorkflowTestSuite
}

// Test_BackgroundCheckApplication runs the full set of tests in this application.
func Test_BackgroundCheckApplication(t *testing.T) {
	s := &UnitTestSuite{}
	suite.Run(t, s)
}

// @@@SNIPEND
// @@@SNIPSTART setup-chapter-test-workflow

const ssn string = "555-55-5555"

// Test_BackgroundCheckWorkflow tests the BackgroundCheck Workflow function
func (s *UnitTestSuite) Test_BackgroundCheckWorkflow() {
	// Initialize a Temporal Go SDK Workflow test environment.
	// The best practice is to create a new environment for each Workflow test.
	// Doing so ensures that each test runs in its own isolated sandbox.
	env := s.NewTestWorkflowEnvironment()
	// Mock the Activity Execution for the Workflow
	ssnTraceResult := "pass"
	env.OnActivity(activities.SSNTraceActivity, mock.Anything, ssn).Return(&ssnTraceResult, nil)
	// Run the Workflow in the test environment
	env.ExecuteWorkflow(workflows.BackgroundCheck, ssn)
	// Check that the Workflow reach a completed status
	s.True(env.IsWorkflowCompleted())
	// Check whether the Workflow returned an error
	s.NoError(env.GetWorkflowError())
	// Check that no error is returned while getting the result
	// And check for the expected value of the Workflow result
	var result string
	s.NoError(env.GetWorkflowResult(&result))
	s.Equal(result, ssnTraceResult)
}

// @@@SNIPEND
// @@@SNIPSTART setup-chapter-test-activity

// Test_SSNTraceActivity tests the SSNTraceActivity function
func (s *UnitTestSuite) Test_SSNTraceActivity() {
	// Create a test environment
	env := s.NewTestActivityEnvironment()
	// Register Activity with the enviroment
	env.RegisterActivity(activities.SSNTraceActivity)
	// Run the Activity in the test enviroment
	future, err := env.ExecuteActivity(activities.SSNTraceActivity, ssn)
	// Check there was no error on the call to execute the Activity
	s.NoError(err)
	// Check that there was no error returned from the Activity
	var result string
	s.NoError(future.Get(&result))
	// Check for the expected return value.
	s.Equal("pass", result)
}

// @@@SNIPEND
