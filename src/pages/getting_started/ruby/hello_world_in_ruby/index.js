// Hello World tutorial chapter 1 of 3: Build the Workflow and Activities from scratch.
// Canonical code lives at https://github.com/temporalio/temporal-tutorial-ipgeo-ruby.
// Update the *_RB constants here when the upstream repo changes.

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
    href: "/getting_started/ruby/hello_world_in_ruby/",
  },
  {
    n: 2,
    label: "Test and run a Worker",
    href: "/getting_started/ruby/hello_world_in_ruby/worker-and-test/",
  },
  {
    n: 3,
    label: "Run and observe retries",
    href: "/getting_started/ruby/hello_world_in_ruby/run/",
  },
];

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create a new Ruby project" },
  { id: "activities", label: "Write the Activities" },
  { id: "workflow", label: "Define the Workflow" },
];

const GET_IP_ACTIVITY_RB = `require 'json'
require 'net/http'
require 'uri'
require 'temporalio/activity'

module IPGeolocate
  class GetIPActivity < Temporalio::Activity::Definition
    def execute
      url = URI('https://icanhazip.com')

      # Create an HTTP session that can be reused
      http = Net::HTTP.new(url.host, url.port)
      http.use_ssl = (url.scheme == 'https')

      # Start a session
      http.start do |session|
        # Make the request within the session
        request = Net::HTTP::Get.new(url.request_uri)
        response = session.request(request)

        # Return the response body with whitespace removed
        response.body.strip
      end
    end
  end
end`;

const GET_LOCATION_ACTIVITY_RB = `require 'temporalio/activity'
require 'net/http'
require 'uri'
require 'json'

module IPGeolocate
  class GetLocationActivity < Temporalio::Activity::Definition
    # Use the IP address to get the location
    def execute(ip)
      url = URI("http://ip-api.com/json/#{ip}")
      response = Net::HTTP.get(url)
      data = JSON.parse(response)
      "#{data['city']}, #{data['regionName']}, #{data['country']}"
    end
  end
end`;

const WORKFLOW_RB = `require 'temporalio/workflow'
require 'temporalio/retry_policy'

require_relative 'get_ip_activity'
require_relative 'get_location_activity'

module IPGeolocate
  class GetAddressFromIPWorkflow < Temporalio::Workflow::Definition
    def execute(name)
      ip = Temporalio::Workflow.execute_activity(
        GetIPActivity,
        start_to_close_timeout: 300,
        retry_policy: Temporalio::RetryPolicy.new(
          initial_interval: 2.0,      # amount of time that must elapse before the first retry occurs
          backoff_coefficient: 1.5,   # Coefficient used to calculate the next retry interval
          max_interval: 30.0          # maximum interval between retries
          # max_attempts: 5,          # Uncomment this if you want to limit attempts
          # non_retryable_error_types: # Defines non-retryable error types
        )
      )

      location = Temporalio::Workflow.execute_activity(
        GetLocationActivity,
        ip,
        schedule_to_close_timeout: 300
      )

      "Hello, #{name}. Your IP is #{ip} and you are located in #{location}."
    end
  end
end`;

const BUNDLE_ADD_OUTPUT = `Fetching gem metadata from https://rubygems.org/.....
Resolving dependencies...`;

const BUNDLE_INSTALL_OUTPUT = `Installing temporalio 0.4.0 (arm64-darwin)
Bundle complete! 1 Gemfile dependency, 6 gems now installed.
Use \`bundle info [gemname]\` to see where a bundled gem is installed.`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Build the application - Build a Temporal app from scratch in Ruby"
      description="Chapter 1: Create a Ruby project, write two Activities, and define the Workflow that orchestrates them."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_ruby.png"
            alt="Temporal Ruby SDK"
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Get Started", href: "/getting_started" },
                  { label: "Ruby", href: "/getting_started/ruby" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/ruby/hello_world_in_ruby/",
                  },
                  { label: "Build the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Temporal Application from scratch in Ruby
            </h1>

            <MetaChips
              items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll build your first Temporal Application
              from scratch using the{" "}
              <a
                href="https://github.com/temporalio/sdk-ruby"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Ruby SDK
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
                  <Link to="/getting_started/ruby/dev_environment/">
                    Set up a local development environment for developing
                    Temporal Applications with Ruby
                  </Link>
                  . Ensure the Temporal Service is running locally and you can
                  access the Web UI on port <code>8233</code> (the default).
                </li>
                <li>
                  Follow the{" "}
                  <Link to="/getting_started/ruby/first_program_in_ruby/">
                    Run your first Temporal application with the Ruby SDK
                  </Link>{" "}
                  tutorial to understand how Temporal's components fit together.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>
                Create a new Temporal Ruby project
              </h2>
              <p>
                To get started with the Temporal Ruby SDK, you'll create a new
                Bundler project, just like any other Ruby program you're
                creating. Then you'll add the Temporal SDK package to your
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
                From the root of your new project directory, set up a Bundler
                project. This creates a Gemfile in the current directory.
              </p>
              <CodeBlock language="bash">bundle init</CodeBlock>
              <p>Then add the Temporal Ruby SDK to the Gemfile:</p>
              <CodeBlock language="bash">bundle add temporalio</CodeBlock>
              <p>
                You'll see the following output, indicating that the SDK is now
                a project dependency:
              </p>
              <CodeBlock>{BUNDLE_ADD_OUTPUT}</CodeBlock>
              <p>Next, install the Temporal SDK from the Gemfile:</p>
              <CodeBlock language="bash">bundle install</CodeBlock>
              <p>You'll see an output similar to the following:</p>
              <CodeBlock>{BUNDLE_INSTALL_OUTPUT}</CodeBlock>
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
              <p>Create a new folder which will hold your Temporal logic:</p>
              <CodeBlock language="bash">mkdir -p lib</CodeBlock>
              <p>
                Within <code>lib</code>, create another folder -{" "}
                <code>ip_geolocate</code> - which will contain your Workflow and
                Activity logic.
              </p>
              <CodeBlock language="bash">mkdir -p lib/ip_geolocate</CodeBlock>
              <p>
                Create the file <code>get_ip_activity.rb</code> which will
                return your current public IP:
              </p>
              <CodeBlock language="bash">
                touch lib/ip_geolocate/get_ip_activity.rb
              </CodeBlock>
              <p>
                With the Ruby SDK, you can define Activities as regular Ruby
                methods. Open the file <code>get_ip_activity.rb</code> in your
                editor and add the following code to define a Temporal Activity
                that retrieves your IP address from <code>icanhazip.com</code>:
              </p>
              <CodeBlock language="ruby" title="lib/ip_geolocate/get_ip_activity.rb">
                {GET_IP_ACTIVITY_RB}
              </CodeBlock>
              <p>
                The response from <code>icanhazip.com</code> is plain-text, and
                it includes a newline, so you trim off the newline character
                before returning the result.
              </p>
              <p>
                Notice that there's no error-handling code in this function.
                When you build your Workflow, you'll use Temporal's Activity
                Retry policies to retry this code automatically if there's an
                error.
              </p>
              <p>
                Now add the second Activity that accepts an IP address and
                retrieves location data. Create the file{" "}
                <code>get_location_activity.rb</code> which will return your
                current location:
              </p>
              <CodeBlock language="bash">
                touch lib/ip_geolocate/get_location_activity.rb
              </CodeBlock>
              <p>
                Now add the following code to{" "}
                <code>get_location_activity.rb</code>:
              </p>
              <CodeBlock language="ruby" title="lib/ip_geolocate/get_location_activity.rb">
                {GET_LOCATION_ACTIVITY_RB}
              </CodeBlock>
              <p>
                This Activity follows the same pattern as the{" "}
                <code>GetIPActivity</code> Activity. It's a method that calls a
                remote service. This time, the service returns JSON data rather
                than text.
              </p>

              <Admonition type="tip" title="Send a single argument">
                <p>
                  While Activities can accept input arguments, it's a best
                  practice to send a single argument rather than multiple
                  arguments. In this case you only have a single string. If you
                  have more than one argument, bundle them up in a serializable
                  object. Review the{" "}
                  <a
                    href="https://docs.temporal.io/develop/ruby/core-application#develop-activity"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activity parameters
                  </a>{" "}
                  section of the Temporal documentation for more details.
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
                Workflows are where you configure and organize the execution of
                Activities. You define a Workflow by writing a{" "}
                <em>Workflow Definition</em> using one of the Temporal SDKs.
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
                Create the file <code>get_address_from_ip_workflow.rb</code> in
                the <code>ip_geolocate</code> folder:
              </p>
              <CodeBlock language="bash">
                touch lib/ip_geolocate/get_address_from_ip_workflow.rb
              </CodeBlock>
              <p>
                In the Ruby SDK, you implement a Workflow the same way you
                define an Activity; using a method. Add the following code to
                import the Activities, configure how the Workflow should handle
                failures with a{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Retry Policy
                </a>
                , and define the <code>GetAddressFromIPWorkflow</code> Workflow,
                which calls both Activities, using the value of the first as the
                input to the second:
              </p>
              <CodeBlock language="ruby" title="lib/ip_geolocate/get_address_from_ip_workflow.rb">
                {WORKFLOW_RB}
              </CodeBlock>
              <p>
                In this example, you've specified that the Start-to-Close
                Timeout for your Activities will be five minutes, meaning that
                your Activity has five minutes to complete before it times out.
                Of all the Temporal timeout options,{" "}
                <code>start_to_close_timeout</code> is the one you should always
                set.
              </p>
              <p>
                Temporal's default behavior is to automatically retry an
                Activity that fails, which means that transient or intermittent
                failures require no action on your part. This behavior is
                defined by the Retry Policy. If you don't specify the values on
                your Retry Policy, you will automatically use Temporal's{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies#default-values-for-retry-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  default Retry Policy values
                </a>
                . Note that <code>max_attempts</code> is commented out, which
                means there's no limit to the number of times Temporal will
                retry your Activities if they fail. The{" "}
                <code>non_retryable_error_types</code> field is also commented
                out, meaning that Temporal will retry all error types.
              </p>
              <p>
                Next you'll create a Worker that executes the Workflow and
                Activities, and write tests to confirm everything works as
                expected.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/ruby/first_program_in_ruby/simulate-failures/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Run your first Temporal Ruby app
                </span>
              </Link>
              <Link
                to="/getting_started/ruby/hello_world_in_ruby/worker-and-test/"
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
