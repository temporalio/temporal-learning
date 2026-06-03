// Hello World tutorial chapter 2 of 3: Configure a Worker and write tests.
// See ./index.js for shared canonical-source notes.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TUTORIAL_STEPS = [
  {
    n: 1,
    label: "Build the application",
    href: "/getting_started/go/hello_world_in_go/",
  },
  {
    n: 2,
    label: "Test and run a Worker",
    href: "/getting_started/go/hello_world_in_go/worker-and-test/",
  },
  {
    n: 3,
    label: "Run and observe retries",
    href: "/getting_started/go/hello_world_in_go/run/",
  },
];

const TOC_ITEMS = [
  { id: "shared", label: "Define the Task Queue name" },
  { id: "worker", label: "Configure and run a Worker" },
  { id: "workflow-test", label: "Write a Workflow test" },
  { id: "activity-tests", label: "Write Activity tests" },
];

const SHARED_GO = `package iplocate

const TaskQueueName = "ip-address-go"`;

const WORKER_GO = `package main

import (
\t"log"
\t"net/http"

\t"temporal-ip-geolocation/iplocate"

\t"go.temporal.io/sdk/client"
\t"go.temporal.io/sdk/worker"
)

func main() {
\t// Create the Temporal client
\tc, err := client.Dial(client.Options{})
\tif err != nil {
\t\tlog.Fatalln("Unable to create Temporal client", err)
\t}
\tdefer c.Close()

\t// Create the Temporal worker
\tw := worker.New(c, iplocate.TaskQueueName, worker.Options{})

\t// inject HTTP client into the Activities Struct
\tactivities := &iplocate.IPActivities{
\t\tHTTPClient: http.DefaultClient,
\t}

\t// Register Workflow and Activities
\tw.RegisterWorkflow(iplocate.GetAddressFromIP)
\tw.RegisterActivity(activities)

\t// Start the Worker
\terr = w.Run(worker.InterruptCh())
\tif err != nil {
\t\tlog.Fatalln("Unable to start Temporal worker", err)
\t}
}`;

const WORKER_OUTPUT = `2024/12/16 14:32:44 INFO  No logger configured for temporal client. Created default one.
2024/12/16 14:32:44 INFO  Started Worker Namespace default TaskQueue ip-address-go WorkerID 31530@temporal-2.local@`;

const WORKFLOW_TEST_SETUP_GO = `package iplocate_test

import (
\t"testing"

\t"temporal-ip-geolocation/iplocate"

\t"github.com/stretchr/testify/assert"
\t"github.com/stretchr/testify/mock"

\t"go.temporal.io/sdk/testsuite"
)`;

const WORKFLOW_TEST_GO = `func Test_Workflow(t *testing.T) {
\ttestSuite := &testsuite.WorkflowTestSuite{}
\tenv := testSuite.NewTestWorkflowEnvironment()
\tactivities := &iplocate.IPActivities{}

\t// Mock activity implementation
\tenv.OnActivity(activities.GetIP, mock.Anything).Return("1.1.1.1", nil)
\tenv.OnActivity(activities.GetLocationInfo, mock.Anything, "1.1.1.1").Return("Planet Earth", nil)

\tenv.ExecuteWorkflow(iplocate.GetAddressFromIP, "Temporal")

\tvar result string
\tassert.NoError(t, env.GetWorkflowResult(&result))
\tassert.Equal(t, "Hello, Temporal. Your IP is 1.1.1.1 and your location is Planet Earth", result)
}`;

const WORKFLOW_TEST_OUTPUT = `2024/12/17 10:25:15 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 1 ActivityType GetIP
2024/12/17 10:25:15 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 2 ActivityType GetLocationInfo
PASS
ok      iplocate        0.397s`;

const ACTIVITY_TEST_SETUP_GO = `package iplocate_test

import (
\t"io"
\t"net/http"
\t"strings"
\t"testing"

\t"temporal-ip-geolocation/iplocate"

\t"github.com/stretchr/testify/assert"
\t"go.temporal.io/sdk/testsuite"
)

type MockHTTPClient struct {
\tResponse *http.Response
\tErr      error
}

func (m *MockHTTPClient) Get(url string) (*http.Response, error) {
\treturn m.Response, m.Err
}`;

const ACTIVITY_TEST_IP_GO = `// TestGetIP tests the GetIP activity with a mock server.
func TestGetIP(t *testing.T) {
\t// set up test environment
\ttestSuite := &testsuite.WorkflowTestSuite{}
\tenv := testSuite.NewTestActivityEnvironment()

\t// Create a mock response that returns the fake IP address
\tmockResponse := &http.Response{
\t\tStatusCode: 200,
\t\tBody:       io.NopCloser(strings.NewReader("127.0.0.1\\n")),
\t}

\t// load Activities and inject mock response
\tipActivities := &iplocate.IPActivities{
\t\tHTTPClient: &MockHTTPClient{Response: mockResponse},
\t}
\tenv.RegisterActivity(ipActivities)

\t// Call the GetIP function
\tval, err := env.ExecuteActivity(ipActivities.GetIP)
\tif err != nil {
\t\tt.Fatalf("Expected no error, got %v", err)
\t}

\t// get the Activity result
\tvar ip string
\tval.Get(&ip)

\t// Validate the returned IP
\texpectedIP := "127.0.0.1"
\tassert.Equal(t, ip, expectedIP)
}`;

const ACTIVITY_TEST_LOCATION_GO = `// TestGetLocationInfo tests the GetLocationInfo activity with a mock server.
func TestGetLocationInfo(t *testing.T) {
\t// set up test environment
\ttestSuite := &testsuite.WorkflowTestSuite{}
\tenv := testSuite.NewTestActivityEnvironment()

\tmockResponse := &http.Response{
\t\tStatusCode: 200,
\t\tBody: io.NopCloser(strings.NewReader(\`{
            "city": "San Francisco",
            "regionName": "California",
            "country": "United States"
        }\`)),
\t}

\tipActivities := &iplocate.IPActivities{
\t\tHTTPClient: &MockHTTPClient{Response: mockResponse},
\t}

\tenv.RegisterActivity(ipActivities)

\tip := "127.0.0.1"
\tval, err := env.ExecuteActivity(ipActivities.GetLocationInfo, ip)
\tif err != nil {
\t\tt.Fatalf("Expected no error, got %v", err)
\t}

\tvar location string
\tval.Get(&location)

\texpectedLocation := "San Francisco, California, United States"
\tassert.Equal(t, location, expectedLocation)
}`;

const ALL_TESTS_OUTPUT = `=== RUN   TestGetIP
--- PASS: TestGetIP (0.03s)
=== RUN   TestGetLocationInfo
--- PASS: TestGetLocationInfo (0.00s)
=== RUN   Test_Workflow
2024/12/17 10:31:07 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 1 ActivityType GetIP
2024/12/17 10:31:07 DEBUG handleActivityResult: *workflowservice.RespondActivityTaskCompletedRequest. ActivityID 2 ActivityType GetLocationInfo
--- PASS: Test_Workflow (0.00s)
PASS
ok      iplocate        0.395s`;

export default function Chapter2Page() {
  return (
    <Layout
      title="Test and run a Worker - Build a Temporal app from scratch in Go"
      description="Chapter 2: Configure a Worker, write a Workflow test, and add Activity tests."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_go.png"
            alt="Temporal Go SDK"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <DevEnvironmentToc items={TOC_ITEMS} />
          </aside>

          <main className={styles.pageMain}>
            <div className={styles.breadcrumbWrap}>
              <PathBreadcrumb
                items={[
                  { label: "Temporal University", href: "/" },
                  { label: "Get Started", href: "/start" },
                  { label: "Go", href: "/getting_started/go" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/go/hello_world_in_go/",
                  },
                  { label: "Test and run a Worker" },
                ]}
              />
            </div>

            <h1 className={styles.title}>Test and run a Worker</h1>

            <MetaChips
              items={["~10 minutes", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              Now that the Workflow and Activities are in place, you'll
              configure a Worker to host them and write tests to verify they
              behave as expected. The Worker polls a Task Queue and runs your
              code when work arrives.
            </p>

            <section className={styles.section} id="shared">
              <h2 className={styles.sectionTitle}>Define the Task Queue name</h2>
              <p>
                When you start a Temporal Workflow, the Workflow and its
                Activities get scheduled on the Temporal Service's{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-task-queue"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Task Queue
                </a>
                . A{" "}
                <a
                  href="https://docs.temporal.io/concepts/what-is-a-worker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Worker
                </a>{" "}
                hosts Workflow and Activity functions and polls the Task Queue
                for tasks. The Task Queue name is a case-insensitive string -
                define it as a constant so you can reuse it.
              </p>
              <p>
                Create the file <code>shared.go</code>:
              </p>
              <CodeBlock language="bash">touch shared.go</CodeBlock>
              <p>
                Open the file and add the following lines to define the
                constant for the Task Queue:
              </p>
              <CodeBlock language="go" title="shared.go">
                {SHARED_GO}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Configure and run a Worker</h2>
              <p>
                Create a new directory called <code>worker</code> which will
                hold the Worker program:
              </p>
              <CodeBlock language="bash">mkdir worker</CodeBlock>
              <p>
                Now create the file <code>main.go</code> in that directory:
              </p>
              <CodeBlock language="bash">touch worker/main.go</CodeBlock>
              <p>
                Then open <code>worker/main.go</code> in your editor and add
                the following code to define the Worker program:
              </p>
              <CodeBlock language="go" title="worker/main.go">
                {WORKER_GO}
              </CodeBlock>
              <p>
                The code imports the <code>iplocate</code> package, which
                includes your Workflow and Activity Definitions. It defines a{" "}
                <code>main</code> function that creates and runs a Worker.
              </p>
              <p>
                You first create a client, and then you create a Worker that
                uses the client, along with the Task Queue it should listen
                on. By default, the client connects to the Temporal Cluster
                running at <code>localhost</code> on port <code>7233</code>,
                and connects to the <code>default</code> namespace. You can
                change this by setting values in <code>client.Options</code>.
              </p>
              <p>
                Then you register your Workflow and Activities with the
                Worker. Since you defined your Activities as a struct, you use
                that instead of referencing your Activities directly. This is
                also where you inject the HTTP client so your Activities can
                access it.
              </p>
              <p>
                In this case your Worker will run your Workflow and your two
                Activities, but there are cases where you could configure one
                Worker to run Activities, and another Worker to run the
                Workflows.
              </p>
              <p>
                Now you'll start the Worker. Be sure you have started the
                local Temporal Service and execute the following command to
                start your Worker:
              </p>
              <CodeBlock language="bash">go run worker/main.go</CodeBlock>
              <p>The Worker runs and you see the following output:</p>
              <CodeBlock>{WORKER_OUTPUT}</CodeBlock>
              <p>
                Your Worker is running and is polling the Temporal Service for
                Workflows to run, but before you start your Workflow, you'll
                write tests to prove it works as expected.
              </p>
            </section>

            <section className={styles.section} id="workflow-test">
              <h2 className={styles.sectionTitle}>Write a Workflow test</h2>
              <p>
                The Temporal Go SDK includes functions that help you test your
                Workflow executions. Let's add a basic unit test to the
                application to make sure the Workflow works as expected.
              </p>
              <p>
                You'll use the{" "}
                <a
                  href="https://github.com/stretchr/testify"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  testify
                </a>{" "}
                package to build your test cases and mock the Activity so you
                can test the Workflow in isolation.
              </p>
              <p>
                Add the <code>testify/mock</code> and <code>testify/assert</code>{" "}
                packages to your project by running the following commands in
                your terminal:
              </p>
              <CodeBlock language="bash">
                go get github.com/stretchr/testify/mock
              </CodeBlock>
              <CodeBlock language="bash">
                go get github.com/stretchr/testify/assert
              </CodeBlock>
              <CodeBlock language="bash">go mod tidy</CodeBlock>
              <p>
                Now create a file to hold the test for your Workflow. Create
                the file <code>workflows_test.go</code> in your project root:
              </p>
              <CodeBlock language="bash">touch workflows_test.go</CodeBlock>
              <p>Add the following code to set up the testing environment:</p>
              <CodeBlock language="go" title="workflows_test.go">
                {WORKFLOW_TEST_SETUP_GO}
              </CodeBlock>
              <p>Add the following code to test the Workflow execution:</p>
              <CodeBlock language="go" title="workflows_test.go">
                {WORKFLOW_TEST_GO}
              </CodeBlock>
              <p>
                This test creates a test execution environment to run the
                Workflow.
              </p>
              <p>
                Instead of using your actual Activities, you replace the
                Activities <code>GetIP</code> and <code>GetLocationInfo</code>{" "}
                with mocks that return hard-coded values. This way you're
                testing the Workflow's logic independently of the Activities.
                Since each Activity accepts a <code>context</code> as its
                first argument, you use <code>mock.Anything</code> as a
                substitute for the context since it isn't required for this
                test.
              </p>
              <p>
                The test then executes the Workflow in the test environment
                and checks for a successful execution. Finally, the test
                ensures the Workflow's return value matches the expected
                value.
              </p>
              <p>
                Ensure you've saved all your files and execute your tests with
                the following command:
              </p>
              <CodeBlock language="bash">go test</CodeBlock>
              <p>
                The test environment starts, spins up a Worker, and executes
                the Workflow in the test environment. At the end, you'll see
                that your test passes:
              </p>
              <CodeBlock>{WORKFLOW_TEST_OUTPUT}</CodeBlock>
            </section>

            <section className={styles.section} id="activity-tests">
              <h2 className={styles.sectionTitle}>Write Activity tests</h2>
              <p>
                With a Workflow test in place, you can write unit tests for
                the Activities.
              </p>
              <p>
                Both of your Activities make external calls to services that
                will change their results based on who runs them. It will be
                challenging to test these Activities reliably. For example,
                the IP address may vary based on your machine's location.
              </p>
              <p>
                To ensure you can test the Activities in isolation, you'll
                stub out the HTTP calls.
              </p>
              <p>
                Create the file <code>activities_test.go</code>:
              </p>
              <CodeBlock language="bash">touch activities_test.go</CodeBlock>
              <p>
                Add the following code to import the testing libraries and
                Activities you'll use, and then define types for your mock
                HTTP client and mock response:
              </p>
              <CodeBlock language="go" title="activities_test.go">
                {ACTIVITY_TEST_SETUP_GO}
              </CodeBlock>
              <p>
                To ensure you don't make real HTTP requests, you define a mock
                HTTP client struct with a <code>Get</code> function. When you
                write your tests you'll inject this mocked client into the
                Activity so you can control the response.
              </p>
              <p>
                Next, write the test for the <code>GetIP</code> Activity, using
                your mocked HTTP client to stub out actual HTTP calls so your
                tests are consistent. Notice that the mock response adds the
                newline character so it replicates the actual response:
              </p>
              <CodeBlock language="go" title="activities_test.go">
                {ACTIVITY_TEST_IP_GO}
              </CodeBlock>
              <p>
                Like in your Worker, you inject the HTTP client into the
                Activities struct and then register the Activities with the
                test environment.
              </p>
              <p>
                To test the Activity itself, you use the test environment to
                execute the Activity rather than directly calling the{" "}
                <code>GetIP</code> function. You get the result from the
                Activity Execution and then ensure it matches the value you
                expect.
              </p>
              <p>
                To test the <code>GetLocationInfo</code> Activity, you use a
                similar approach. Add the following code to the{" "}
                <code>activities_test.go</code> file:
              </p>
              <CodeBlock language="go" title="activities_test.go">
                {ACTIVITY_TEST_LOCATION_GO}
              </CodeBlock>
              <p>
                This test looks similar to the previous one; you mock out the
                HTTP client and ensure it returns the expected data, and then
                you execute the Activity in the test environment. Then you
                retrieve the value and ensure it's what you expect.
              </p>
              <p>
                Run the tests again to see them pass. Use the <code>-v</code>{" "}
                option to see verbose output so you can see that all the tests
                ran:
              </p>
              <CodeBlock language="bash">go test -v</CodeBlock>
              <CodeBlock>{ALL_TESTS_OUTPUT}</CodeBlock>
              <p>
                Now that you have your tests passing, it's time to start a
                Workflow Execution and observe how Temporal handles failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/go/hello_world_in_go/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>
                  Build the application
                </span>
              </Link>
              <Link
                to="/getting_started/go/hello_world_in_go/run/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 3{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Run and observe retries
                </span>
              </Link>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
