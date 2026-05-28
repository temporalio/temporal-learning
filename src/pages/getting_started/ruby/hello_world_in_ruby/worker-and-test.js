// Hello World tutorial chapter 2 of 3: Configure a Worker and write tests.
// See ./index.js for shared canonical-source notes.
// Canonical code: https://github.com/temporalio/temporal-tutorial-ipgeo-ruby

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
  { id: "shared", label: "Define the Task Queue name" },
  { id: "worker", label: "Configure and run a Worker" },
  { id: "workflow-test", label: "Write a Workflow test" },
  { id: "activity-tests", label: "Write Activity tests" },
];

const SHARED_RB = `# Load Bundler and load all your gems
require_relative "ip_geolocate/get_ip_activity"
require_relative "ip_geolocate/get_location_activity"
require_relative "ip_geolocate/get_address_from_ip_workflow"

module IPGeolocate
  TASK_QUEUE_NAME = "ip-address-ruby"
end`;

const WORKER_RB = `require_relative 'ip_geolocate'
require 'temporalio/client'
require 'temporalio/worker'

# Create a client
begin
  client = Temporalio::Client.connect('localhost:7233', 'default')
rescue StandardError => e
  puts e.message
  exit 1
end

# Create a worker with the client, activities, and workflows
worker = Temporalio::Worker.new(
  client:,
  task_queue: IPGeolocate::TASK_QUEUE_NAME,
  workflows: [IPGeolocate::GetAddressFromIPWorkflow],
  activities: [IPGeolocate::GetIPActivity, IPGeolocate::GetLocationActivity]
)

# Run the worker until SIGINT. This can be done in many ways, see "Workers" section for details.
worker.run(shutdown_signals: ['SIGINT'])`;

const WORKFLOW_TEST_RB = `require 'test_helper'
require 'securerandom'
require 'temporalio/testing'
require 'temporalio/worker'
require 'ip_geolocate'

class GetAddressFromIPWorkflowTest < Minitest::Test
  class MockGetIPActivity < Temporalio::Activity::Definition
    activity_name :GetIPActivity

    def execute
      "1.1.1.1"
    end
  end

  class MockGetLocationActivity < Temporalio::Activity::Definition
    activity_name :GetLocationActivity

    def execute(ip)
      "Planet Earth"
    end
  end

  def test_gets_location_from_ip_with_mocked_activities
    Temporalio::Testing::WorkflowEnvironment.start_local do |env|
      worker = Temporalio::Worker.new(
        client: env.client,
        task_queue: "test",
        workflows: [IPGeolocate::GetAddressFromIPWorkflow],
        activities: [MockGetIPActivity, MockGetLocationActivity],
        workflow_executor: Temporalio::Worker::WorkflowExecutor::ThreadPool.default
      )
      worker.run do
        result = env.client.execute_workflow(
          IPGeolocate::GetAddressFromIPWorkflow,
          "Testing",
          id: "test-#{SecureRandom.uuid}",
          task_queue: worker.task_queue
        )
        assert_equal 'Hello, Testing. Your IP is 1.1.1.1 and you are located in Planet Earth.', result
      end
    end
  end
end`;

const WORKFLOW_TEST_OUTPUT = `Finished tests in 2.358264s, 0.4240 tests/s, 0.4240 assertions/s.
1 tests, 1 assertions, 0 failures, 0 errors, 0 skips`;

const GET_IP_ACTIVITY_TEST_RB = `require 'test_helper'
require 'securerandom'
require 'temporalio/testing'
require 'ip_geolocate/get_ip_activity'

class GetIPActivityTest < Minitest::Test
  def test_gets_ip
    env = Temporalio::Testing::ActivityEnvironment.new

    Net::HTTP.stub(:get, ->(*) { "1.1.1.1" }) do
      result = env.run(IPGeolocate::GetIPActivity)
      assert_equal "1.1.1.1", result
    end
  end

end`;

const GET_LOCATION_ACTIVITY_TEST_RB = `require "test_helper"
require 'securerandom'
require 'temporalio/testing'
require "ip_geolocate/get_location_activity"

class GetLocationActivityTest < Minitest::Test
  def test_gets_ip
    env = Temporalio::Testing::ActivityEnvironment.new

    fake_location = {
      city: 'Sample City',
      regionName: 'Sample Region',
      country: 'Sample Country'
    }.to_json;

    Net::HTTP.stub(:get, ->(*) { fake_location }) do
      result = env.run(IPGeolocate::GetLocationActivity, "1.1.1.1")
      assert_equal "Sample City, Sample Region, Sample Country", result
    end
  end

end`;

const ACTIVITY_TEST_OUTPUT = `Finished tests in 0.000718s, 1392.7570 tests/s, 1392.7570 assertions/s.
1 tests, 1 assertions, 0 failures, 0 errors, 0 skips`;

export default function Chapter2Page() {
  return (
    <Layout
      title="Test and run a Worker - Build a Temporal app from scratch in Ruby"
      description="Chapter 2: Configure a Worker, write a Workflow test, and add Activity tests."
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
                for tasks related to those Workflows and Activities. After the
                Worker runs the code, it communicates the results back to the
                Temporal Service where they're stored in the Event History.
              </p>
              <p>
                In your Worker program, you need to specify the name of the
                Task Queue, which must match the Task Queue name used whenever
                you interact with a Workflow from a client application. The
                Task Queue name is a case-insensitive string - define it as a
                constant so you can reuse it.
              </p>
              <p>
                Create the file <code>ip_geolocate.rb</code> within your{" "}
                <code>lib</code> folder:
              </p>
              <CodeBlock language="bash">touch lib/ip_geolocate.rb</CodeBlock>
              <p>
                This file declares the <code>IPGeolocate</code> module, requires
                all children of the <code>IPGeolocate</code> module, and also
                defines the <code>TASK_QUEUE_NAME</code>. Open the file and add
                the following lines to the file to define the constant for the
                Task Queue:
              </p>
              <CodeBlock language="ruby" title="lib/ip_geolocate.rb">
                {SHARED_RB}
              </CodeBlock>
            </section>

            <section className={styles.section} id="worker">
              <h2 className={styles.sectionTitle}>Configure and run a Worker</h2>
              <p>
                Now you can create the Worker program. Create the file{" "}
                <code>worker.rb</code> in the <code>lib</code> directory:
              </p>
              <CodeBlock language="bash">touch lib/worker.rb</CodeBlock>
              <p>
                Then open <code>worker.rb</code> in your editor and add the
                following code to define the Worker program:
              </p>
              <CodeBlock language="ruby" title="lib/worker.rb">
                {WORKER_RB}
              </CodeBlock>
              <p>
                The code requires the <code>ip_geolocate</code> module, which
                includes your Workflow and Activity Definitions. It also uses
                the <code>TASK_QUEUE_NAME</code> constant.
              </p>
              <p>
                You first create a client, and then you create a Worker that
                uses the client, along with the Task Queue it should listen on.
                By default, the client connects to the Temporal Service running
                at <code>localhost</code> on port <code>7233</code>, and
                connects to the <code>default</code> namespace. You can change
                this by setting values in the Client Options.
              </p>
              <p>
                In this case your Worker will run your Workflow and your two
                Activities, but there are cases where you could configure one
                Worker to run Activities, and another Worker to run the
                Workflows.
              </p>
              <p>
                Now you'll start the Worker. Be sure you have started the local
                Temporal Service and execute the following command to start
                your Worker:
              </p>
              <CodeBlock language="bash">bundle exec ruby lib/worker.rb</CodeBlock>
              <p>
                Your Worker will then begin running and is polling the Temporal
                Service for Workflows to run, but before you start your
                Workflow, you'll write tests to prove it works as expected.
              </p>
            </section>

            <section className={styles.section} id="workflow-test">
              <h2 className={styles.sectionTitle}>Write a Workflow test</h2>
              <p>
                The Temporal Ruby SDK includes methods that help you test your
                Workflow executions. Let's add a basic unit test to the
                application to make sure the Workflow works as expected.
              </p>
              <p>
                You'll use the <code>temporalio/testing</code> package, which
                provides a <code>WorkflowEnvironment</code> that downloads and
                runs a lightweight test server.
              </p>
              <p>Create a test directory:</p>
              <CodeBlock language="bash">mkdir test</CodeBlock>
              <p>
                Then create the file{" "}
                <code>get_address_from_ip_workflow_test.rb</code> within the{" "}
                <code>test</code> directory:
              </p>
              <CodeBlock language="bash">
                touch test/get_address_from_ip_workflow_test.rb
              </CodeBlock>
              <p>
                Add the following code to{" "}
                <code>get_address_from_ip_workflow_test.rb</code> to test the
                Workflow execution:
              </p>
              <CodeBlock language="ruby" title="test/get_address_from_ip_workflow_test.rb">
                {WORKFLOW_TEST_RB}
              </CodeBlock>
              <p>
                <code>WorkflowEnvironment</code> is a runtime environment used
                to test a Workflow. You use it to connect the Client and Worker
                to the test server and interact with the test server. You'll
                use this to register your Workflow Type and access information
                about the Workflow Execution, such as whether it completed
                successfully and the result or error it returned.
              </p>
              <p>
                This test sets up a test environment to run Workflows that uses
                a lightweight Temporal Service specifically for testing. In the
                test itself, you create a Worker that connects to the test
                environment. This should look familiar, as it's similar to the
                code you wrote to define your Worker program.
              </p>
              <p>
                Instead of using your actual Activities, you replace the
                Activities <code>GetIPActivity</code> and{" "}
                <code>GetLocationActivity</code> with methods that return
                hard-coded values. This way you're testing the Workflow's logic
                independently of the Activities. If you wanted to test the
                Activities directly as part of an integration test, you'd
                specify them directly as you did when you wrote the Worker
                program.
              </p>
              <p>Run the test:</p>
              <CodeBlock language="bash">
                bundle exec ruby -Ilib:test test/get_address_from_ip_workflow_test.rb
              </CodeBlock>
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
                With a Workflow test in place, you can write unit tests for the
                Activities.
              </p>
              <p>
                Both of your Activities make external calls to services that
                will change their results based on who runs them. It will be
                challenging to test these Activities reliably. For example, the
                IP address may vary based on your machine's location.
              </p>
              <p>
                To ensure you can test the Activities in isolation, you'll stub
                out the HTTP calls. The{" "}
                <code>ActivityEnvironment</code> from the{" "}
                <code>temporalio/testing</code> package lets you test
                Activities as if they were part of a Temporal Application.
              </p>
              <p>
                Create the file <code>get_ip_activity_test.rb</code>:
              </p>
              <CodeBlock language="bash">
                touch test/get_ip_activity_test.rb
              </CodeBlock>
              <p>
                Next, write the test for the <code>GetIPActivity</code> Activity:
              </p>
              <CodeBlock language="ruby" title="test/get_ip_activity_test.rb">
                {GET_IP_ACTIVITY_TEST_RB}
              </CodeBlock>
              <p>
                Now, create a test file for{" "}
                <code>get_location_activity_test.rb</code>:
              </p>
              <CodeBlock language="bash">
                touch test/get_location_activity_test.rb
              </CodeBlock>
              <p>
                Next, write the test for the <code>GetLocationActivity</code>{" "}
                Activity, using{" "}
                <a
                  href="https://ruby-doc.org/stdlib-2.7.0/libdoc/net/http/rdoc/Net/HTTP.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Net::HTTP
                </a>{" "}
                to stub out actual HTTP calls so your tests are consistent:
              </p>
              <CodeBlock language="ruby" title="test/get_location_activity_test.rb">
                {GET_LOCATION_ACTIVITY_TEST_RB}
              </CodeBlock>
              <p>
                To test the Activity itself, you use the test environment to
                execute the Activity rather than directly calling the{" "}
                <code>GetLocationActivity</code> method. You get the result
                from the Activity Execution and then ensure it matches the
                value you expect.
              </p>
              <p>
                This test looks similar to the previous one; you mock out the
                HTTP client and ensure it returns the expected data, and then
                you execute the Activity in the test environment. Then you
                retrieve the value and ensure it's what you expect.
              </p>
              <p>Run the tests to see them pass:</p>
              <CodeBlock language="bash">
                bundle exec ruby -Ilib:test test/get_ip_activity_test.rb
              </CodeBlock>
              <CodeBlock language="bash">
                bundle exec ruby -Ilib:test test/get_location_activity_test.rb
              </CodeBlock>
              <CodeBlock>{ACTIVITY_TEST_OUTPUT}</CodeBlock>
              <p>
                Now that you have your tests passing, it's time to start a
                Workflow Execution and observe how Temporal handles failures.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/ruby/hello_world_in_ruby/"
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
                to="/getting_started/ruby/hello_world_in_ruby/run/"
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
