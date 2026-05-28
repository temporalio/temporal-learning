import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import TutorialStepper from "@site/src/components/DevEnvironment/TutorialStepper";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const LESSONS = [
  {
    n: 1,
    label: "About this example",
    href: "/courses/temporal_101/ruby/understanding-workflow-execution/about-this-example/",
  },
  {
    n: 2,
    label: "Code walkthrough",
    href: "/courses/temporal_101/ruby/understanding-workflow-execution/code-walkthrough/",
  },
];

const TOC_ITEMS = [
  { id: "actors", label: "Actors in the scenario" },
  { id: "workers-and-tasks", label: "Workers and tasks" },
  { id: "commands", label: "Commands" },
  { id: "definitions", label: "Workflow and Activity Definitions" },
];

const ACTIVITIES_RB = `# frozen_string_literal: true

require 'temporalio/activity'
require 'net/http'

class GreetInSpanish < Temporalio::Activity::Definition
  def execute(name)
    call_service('get-spanish-greeting', name)
  end
end

class FarewellInSpanish < Temporalio::Activity::Definition
  def execute(name)
    call_service('get-spanish-farewell', name)
  end
end

# Utility method for making calls to the microservices
def call_service(stem, name)
  base = "http://localhost:9999/#{stem}"
  url = "#{base}?name=#{name}"
  response = Net::HTTP.get_response(URI(url))
  response.body
end`;

const WORKFLOW_RB = `# frozen_string_literal: true

require 'temporalio/workflow'
require_relative 'activities'

class GreetSomeone < Temporalio::Workflow::Definition
  def execute(name)
    greeting = Temporalio::Workflow.execute_activity(
      GreetInSpanish,
      name,
      start_to_close_timeout: 5
    )

    farewell = Temporalio::Workflow.execute_activity(
      FarewellInSpanish,
      name,
      start_to_close_timeout: 5
    )

    "#{greeting}\\n#{farewell}"
  end
end`;

const WORKER_RB = `# frozen_string_literal: true

require_relative 'workflow'
require_relative 'activities'
require 'temporalio/client'
require 'temporalio/worker'

# Create a Temporal client
client = Temporalio::Client.connect(
  'localhost:7233',
  'default',
)

# Create worker with the activities and workflow
worker = Temporalio::Worker.new(
  client:,
  task_queue: 'greeting-tasks',
  workflows: [GreetSomeone],
  activities: [GreetInSpanish, FarewellInSpanish]
)

# Run the worker until SIGINT
puts 'Starting worker (ctrl+c to exit)'
worker.run(shutdown_signals: ['SIGINT'])`;

const IMG_BASE = "/courses/temporal-101";

export default function AboutThisExamplePage() {
  return (
    <Layout
      title="About this example - Understanding Workflow Execution (Ruby)"
      description="Identify the actors in a Temporal Application and review the Ruby Workflow and Activity Definitions used in the Workflow Execution walkthrough."
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
                  { label: "Courses", href: "/courses" },
                  { label: "Temporal 101", href: "/courses/temporal_101" },
                  { label: "Ruby", href: "/courses/temporal_101/ruby" },
                  { label: "About this example" },
                ]}
              />
            </div>

            <h1 className={styles.title}>About this example</h1>

            <MetaChips items={["Free preview", "Temporal 101", "Ruby"]} />

            <TutorialStepper steps={LESSONS} currentStep={1} />

            <p className={styles.intro}>
              During the previous exercise, you executed a Workflow that
              included two Activities, both of which made a call to a
              microservice that provided a customized message in Spanish. That
              exercise demonstrates many of the key concepts you've learned
              during this course. Although you now have first-hand experience
              with developing and running applications on the Temporal
              Platform, you'll gain a deeper understanding of how Temporal
              works by looking at what happens during Workflow Execution.
            </p>

            <section className={styles.section} id="actors">
              <h2 className={styles.sectionTitle}>Actors in the scenario</h2>
              <p>
                Let's begin by identifying the actors in this scenario, which
                will help to reiterate some important concepts.
              </p>
              <p>
                First, the example includes a Worker, which executes the
                Workflow and Activity code, and uses a Client to communicate
                with the Service.
              </p>
              <p>
                Next, the Temporal Service orchestrates the execution of that
                code by coordinating with the Worker, using a shared task
                queue.
              </p>
              <p>
                Finally, the program that starts the Workflow, which will be
                referred to as a Client application because it requests
                Workflow Execution as well as the result from the Temporal
                Service, uses a Client to do this.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/common/chapter_09/actors-in-scenario.png`}
                  alt="Screenshot showing actors in Workflow execution scenario"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="workers-and-tasks">
              <h2 className={styles.sectionTitle}>Workers and tasks</h2>
              <p>
                The assignment of work is indirect. The Temporal Service does
                not assign tasks to a Worker (in fact, the Temporal Service
                does not maintain a list of Workers).
              </p>
              <p>
                Instead, the Workers continually poll the Temporal Service's
                Task Queue and accept tasks when they have spare capacity to
                process them. There are several benefits to this approach, but
                one of them is that tasks will just sit in the queue if there
                aren't enough Workers, which means that you can increase
                throughput and scalability by adding more Workers.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/common/chapter_09/workers-and-tasks.png`}
                  alt="Screenshot showing Workers and tasks"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                As you learned earlier, Temporal applications in production
                will typically have multiple Workers; however, this example
                uses a single Worker for the sake of simplicity.
              </p>
            </section>

            <section className={styles.section} id="commands">
              <h2 className={styles.sectionTitle}>Commands</h2>
              <p>
                Another thing that will help you understand Temporal is the
                role of Commands. When the Worker encounters certain API calls
                during a Workflow Execution, such as a call to the Workflow's{" "}
                <code>execute_activity</code> method, it sends a Command to
                the Temporal Service. The Service acts on these Commands, for
                example, by creating an Activity Task, but also stores them in
                case of failure.
              </p>
              <p>
                For example, if the Worker crashes, the Temporal Service uses
                this information to recreate the state of the Workflow to what
                it was immediately before the crash and then resumes progress
                from that point. This allows you, as a developer, to code as
                if this type of failure wasn't even a possibility.
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/ruby/chapter_09/workers-and-tasks.png`}
                  alt="Screenshot showing Commands"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="definitions">
              <h2 className={styles.sectionTitle}>
                Workflow and Activity Definitions
              </h2>
              <p>
                The application defines two Activities:{" "}
                <code>GreetInSpanish</code> and <code>FarewellInSpanish</code>.
              </p>
              <CodeBlock language="rb" title="activities.rb">
                {ACTIVITIES_RB}
              </CodeBlock>
              <p>
                The Workflow Definition executes those two Activities and
                returns a string created from their output.
              </p>
              <CodeBlock language="rb" title="workflow.rb">
                {WORKFLOW_RB}
              </CodeBlock>
              <p>
                Here's the Worker initialization code, which registers the
                Workflow and Activity Definitions.
              </p>
              <CodeBlock language="rb" title="worker.rb">
                {WORKER_RB}
              </CodeBlock>
              <p>
                In this course, you saw how the parts of a Temporal Application
                - a Worker, the Temporal Service and the Client Application -
                work together during a Workflow Execution.
              </p>
              <p>
                In the next video, you will see how all the parts work together
                via a code walkthrough.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/courses/temporal_101/ruby/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Temporal 101 with Ruby
                </span>
              </Link>
              <Link
                to="/courses/temporal_101/ruby/understanding-workflow-execution/code-walkthrough/"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Next: lesson 2{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  Code walkthrough
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
