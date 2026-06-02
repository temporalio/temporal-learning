// Hello World tutorial chapter 1 of 3: Build the Workflow and Activities from scratch.
// Canonical code lives at https://github.com/temporalio/temporal-tutorial-ipgeo-go.
// Update the *_GO constants here when the upstream repo changes.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create a new Go project" },
  { id: "activities", label: "Write the Activities" },
  { id: "workflow", label: "Define the Workflow" },
];

const ACTIVITY_SETUP_GO = `package iplocate

import (
\t"context"
\t"encoding/json"
\t"fmt"
\t"io"
\t"net/http"
\t"strings"
)

type HTTPGetter interface {
\tGet(url string) (*http.Response, error)
}

type IPActivities struct {
\tHTTPClient HTTPGetter
}`;

const ACTIVITY_GETIP_GO = `// GetIP fetches the public IP address.
func (i *IPActivities) GetIP(ctx context.Context) (string, error) {
\tresp, err := i.HTTPClient.Get("https://icanhazip.com")
\tif err != nil {
\t\treturn "", err
\t}
\tdefer resp.Body.Close()

\tbody, err := io.ReadAll(resp.Body)
\tif err != nil {
\t\treturn "", err
\t}

\tip := strings.TrimSpace(string(body))
\treturn ip, nil
}`;

const ACTIVITY_GETLOCATION_GO = `// GetLocationInfo uses the IP address to fetch location information.
func (i *IPActivities) GetLocationInfo(ctx context.Context, ip string) (string, error) {
\turl := fmt.Sprintf("http://ip-api.com/json/%s", ip)
\tresp, err := i.HTTPClient.Get(url)
\tif err != nil {
\t\treturn "", err
\t}
\tdefer resp.Body.Close()

\tbody, err := io.ReadAll(resp.Body)
\tif err != nil {
\t\treturn "", err
\t}

\tvar data struct {
\t\tCity       string \`json:"city"\`
\t\tRegionName string \`json:"regionName"\`
\t\tCountry    string \`json:"country"\`
\t}

\terr = json.Unmarshal(body, &data)
\tif err != nil {
\t\treturn "", err
\t}

\treturn fmt.Sprintf("%s, %s, %s", data.City, data.RegionName, data.Country), nil
}`;

const WORKFLOW_IMPORTS_GO = `package iplocate

import (
\t"fmt"
\t"time"

\t"go.temporal.io/sdk/temporal"
\t"go.temporal.io/sdk/workflow"
)`;

const WORKFLOW_CODE_GO = `// GetAddressFromIP is the Temporal Workflow that retrieves the IP address and location info.
func GetAddressFromIP(ctx workflow.Context, name string) (string, error) {
\t// Define the activity options, including the retry policy
\tao := workflow.ActivityOptions{
\t\tStartToCloseTimeout: time.Minute,
\t\tRetryPolicy: &temporal.RetryPolicy{
\t\t\tInitialInterval:    time.Second, //amount of time that must elapse before the first retry occurs
\t\t\tMaximumInterval:    time.Minute, //maximum interval between retries
\t\t\tBackoffCoefficient: 2,           //how much the retry interval increases
\t\t\t// MaximumAttempts: 5, // Uncomment this if you want to limit attempts
\t\t},
\t}
\tctx = workflow.WithActivityOptions(ctx, ao)

\tvar ipActivities *IPActivities

\tvar ip string
\terr := workflow.ExecuteActivity(ctx, ipActivities.GetIP).Get(ctx, &ip)
\tif err != nil {
\t\treturn "", fmt.Errorf("Failed to get IP: %s", err)
\t}

\tvar location string
\terr = workflow.ExecuteActivity(ctx, ipActivities.GetLocationInfo, ip).Get(ctx, &location)
\tif err != nil {
\t\treturn "", fmt.Errorf("Failed to get location: %s", err)
\t}
\treturn fmt.Sprintf("Hello, %s. Your IP is %s and your location is %s", name, ip, location), nil
}`;

const SDK_GET_OUTPUT = `go: downloading go.temporal.io/sdk v1.31.0
go: added go.temporal.io/sdk v1.31.0`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Build the application - Build a Temporal app from scratch in Go"
      description="Chapter 1: Create a Go project, write two Activities, and define the Workflow that orchestrates them."
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
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Go", href: "/getting_started/go" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/go/hello_world_in_go/",
                  },
                  { label: "Build the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Temporal Application from scratch in Go
            </h1>

            <MetaChips
              items={["~20 minutes total", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll build your first Temporal Application
              from scratch using the{" "}
              <a
                href="https://github.com/temporalio/sdk-go"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Go SDK
              </a>
              . You'll develop a small application that asks for your name and
              then uses APIs to get your public IP address and your location
              based on that address. External requests can fail due to rate
              limiting, network interruptions, or other errors. Using Temporal
              for this application will let you automatically recover from these
              and other kinds of failures without having to write explicit
              error-handling code.
            </p>

            <Admonition type="note" title="What you'll build">
              <p>The app will consist of the following pieces:</p>
              <ol>
                <li>
                  Two{" "}
                  <a
                    href="https://docs.temporal.io/activities"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activities
                  </a>
                  : the first gets your IP address, and the second uses that IP
                  to find your location.
                </li>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/workflows"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflow
                  </a>{" "}
                  that calls both Activities, using the result of the first as
                  input to the second.
                </li>
                <li>
                  A{" "}
                  <a
                    href="https://docs.temporal.io/workers"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Worker
                  </a>{" "}
                  to host the Workflow and Activity code.
                </li>
                <li>A client program to start your Workflow.</li>
              </ol>
              <p>You'll also write tests to verify your Workflow runs successfully.</p>
            </Admonition>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before starting this tutorial:</p>
              <ul>
                <li>
                  <Link to="/getting_started/go/dev_environment/">
                    Set up a local development environment for developing
                    Temporal Applications with Go
                  </Link>
                  . Ensure the Temporal Service is running locally and you can
                  access the Web UI on port <code>8233</code> (the default).
                </li>
                <li>
                  Follow the{" "}
                  <Link to="/getting_started/go/first_program_in_go/">
                    Run your first Temporal application with the Go SDK
                  </Link>{" "}
                  tutorial to understand how Temporal's components fit together.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>Create a new Go project</h2>
              <p>
                To get started with the Temporal Go SDK, you'll create a new Go
                project and initialize it as a module, just like any other Go
                program. Then you'll add the Temporal SDK package to your
                project.
              </p>
              <p>
                In a terminal, create a new project directory called{" "}
                <code>temporal-ip-geolocation</code>:
              </p>
              <CodeBlock language="bash">mkdir temporal-ip-geolocation</CodeBlock>
              <p>Switch to the new directory:</p>
              <CodeBlock language="bash">cd temporal-ip-geolocation</CodeBlock>
              <p>
                From the root of your new project directory, initialize a new
                Go module. Make sure the module path matches that of the
                directory in which you are creating the module.
              </p>
              <CodeBlock language="bash">
                go mod init temporal-ip-geolocation/iplocate
              </CodeBlock>
              <p>Then add the Temporal Go SDK as a project dependency:</p>
              <CodeBlock language="bash">go get go.temporal.io/sdk</CodeBlock>
              <p>
                You'll see the following output, indicating that the SDK is now
                a project dependency:
              </p>
              <CodeBlock>{SDK_GET_OUTPUT}</CodeBlock>
              <p>
                With the project created, you'll create the application's core
                logic.
              </p>
            </section>

            <section className={styles.section} id="activities">
              <h2 className={styles.sectionTitle}>
                Write functions to call external services
              </h2>
              <p>
                Your application will make two HTTP requests. The first returns
                your current public IP, while the second uses that IP to
                provide city, state, and country information.
              </p>
              <p>
                You'll use Temporal Activities to make these requests.
                Activities are where you execute{" "}
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  non-deterministic
                </a>{" "}
                code or perform operations that may fail, such as API requests
                or database calls.
              </p>
              <p>
                If an Activity fails, Temporal can automatically retry it until
                it succeeds or reaches a specified retry limit. This ensures
                that transient issues, like network glitches or temporary
                service outages, don't result in data loss or incomplete
                processes.
              </p>
              <p>
                Create the file <code>activities.go</code> in your project root:
              </p>
              <CodeBlock language="bash">touch activities.go</CodeBlock>
              <p>
                Open <code>activities.go</code> in your editor and add the
                following code that imports dependencies and defines a struct
                to hold the Activities:
              </p>
              <CodeBlock language="go" title="activities.go">
                {ACTIVITY_SETUP_GO}
              </CodeBlock>
              <p>
                With the Go SDK, you can define Activities as regular Go
                functions. You can also create them as members of a struct,
                which is necessary to pass shared objects like database
                connections. In this tutorial you'll pass an HTTP client into
                the struct so you can stub out the HTTP client when you write
                tests for your Activities later.
              </p>
              <p>
                Now add the following code to define a Temporal Activity that
                retrieves your IP address from <code>icanhazip.com</code>:
              </p>
              <CodeBlock language="go" title="activities.go">
                {ACTIVITY_GETIP_GO}
              </CodeBlock>
              <p>
                With the Temporal Go SDK, both Activities and Workflows expect
                a Go <code>context</code> as their first argument. This is
                necessary to enable a number of other SDK features.
              </p>
              <p>
                Like other Go functions, Activities should return an{" "}
                <code>error</code> as one of their arguments, so it can be
                checked after the Activity completes. This is because Go does
                not use a <code>try</code>/<code>catch</code> construct like
                other languages.
              </p>
              <p>
                The response from <code>icanhazip.com</code> is plain-text, and
                it includes a newline, so you trim off the newline character
                before returning the result.
              </p>
              <p>
                Notice there's no error-handling code in this function. When
                you build your Workflow, you'll use Temporal's Activity Retry
                policies to retry this code automatically if there's an error.
              </p>
              <p>
                Now add the second Activity that accepts an IP address and
                retrieves location data. In <code>activities.go</code>, add the
                following code to define it:
              </p>
              <CodeBlock language="go" title="activities.go">
                {ACTIVITY_GETLOCATION_GO}
              </CodeBlock>
              <p>
                This Activity follows the same pattern as the <code>GetIP</code>{" "}
                Activity. This time, the service returns JSON data rather than
                text, so you have to define a type to unmarshal the data.
              </p>

              <Admonition type="tip" title="Send a single argument">
                <p>
                  While Activities can accept input arguments, it's a best
                  practice to send a single argument rather than multiple
                  arguments. If you have more than one argument, bundle them
                  up in a serializable object. Later revisions that change the
                  number of arguments sent to a Workflow or Activity can
                  otherwise introduce versioning concerns. Review the{" "}
                  <a
                    href="https://docs.temporal.io/dev-guide/go/foundations#activity-parameters"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activity parameters
                  </a>{" "}
                  section of the Temporal documentation for details.
                </p>
              </Admonition>

              <p>
                You've created your two Activities. Now you'll coordinate them
                using a Temporal Workflow.
              </p>
            </section>

            <section className={styles.section} id="workflow">
              <h2 className={styles.sectionTitle}>
                Control application logic with a Workflow
              </h2>
              <p>
                Workflows are where you configure and organize the execution
                of Activities. You define a Workflow by writing a{" "}
                <em>Workflow Definition</em> using one of the Temporal SDKs.
              </p>
              <p>
                In the Temporal Go SDK, a Workflow Definition is an{" "}
                <a
                  href="https://go.dev/tour/basics/3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  exported function
                </a>{" "}
                with two additional requirements: it must accept{" "}
                <code>workflow.Context</code> as the first input parameter, and
                it must return <code>error</code>. Your Workflow function can
                optionally return another value, which you'll use to return the
                result of the Workflow Execution.
              </p>
              <p>
                Temporal Workflows{" "}
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  must be deterministic
                </a>{" "}
                so that Temporal can replay your Workflow in the event of a
                crash. That's why you call Activities from your Workflow code.
                Activities don't have the same determinism constraints that
                Workflows have.
              </p>
              <p>
                Create the file <code>workflows.go</code> in the root of your
                project:
              </p>
              <CodeBlock language="bash">touch workflows.go</CodeBlock>
              <p>
                Then add the following code to import the Activities and
                configure how the Workflow should handle failures with a{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Retry Policy
                </a>
                .
              </p>
              <CodeBlock language="go" title="workflows.go">
                {WORKFLOW_IMPORTS_GO}
              </CodeBlock>
              <p>
                With the imports in place, you can define the Workflow itself.
                Add the following code to define the{" "}
                <code>GetAddressFromIP</code> Workflow, which calls both
                Activities, using the value of the first as the input to the
                second:
              </p>
              <CodeBlock language="go" title="workflows.go">
                {WORKFLOW_CODE_GO}
              </CodeBlock>
              <p>
                The function accepts a <code>workflow.Context</code> and a
                string value that holds the name. It returns a string value and
                an error, which follows the conventions you'll find in other Go
                programs. Like with Activities, you can send multiple inputs
                into a Workflow, but it's a good practice to combine those into
                a struct.
              </p>
              <p>
                In this example, you've specified that the Start-to-Close
                Timeout for your Activities will be one minute, meaning that
                your Activity has one minute to complete before it times out.
                Of all the Temporal timeout options,{" "}
                <code>StartToCloseTimeout</code> is the one you should always
                set.
              </p>
              <p>
                You also set the Retry Policy for Activities. In this example,
                you're using the default Retry Policy values, so you don't
                need to specify them, but leaving them in gives you a clearer
                picture of what happens. Note that <code>MaximumAttempts</code>{" "}
                is commented out, which means there's no limit to the number
                of times Temporal will retry your Activities if they fail.
              </p>
              <p>
                This code does check for and handle errors, but because you've
                configured unlimited retries, there won't be any exceptions
                caught. However, if you change the Retry Policy's maximum
                retries, or you specify non-retryable exceptions, this code
                will be in place to handle those errors.
              </p>
              <p>
                Next you'll create a Worker that executes the Workflow and
                Activities, and write tests to confirm everything works as
                expected.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/go/first_program_in_go/simulate-failures/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Run your first Temporal Go app
                </span>
              </Link>
              <Link
                to="/getting_started/go/hello_world_in_go/worker-and-test/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: chapter 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Test and run a Worker
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
