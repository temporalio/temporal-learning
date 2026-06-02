import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import GetHelp from "@site/src/components/hub/GetHelp/GetHelp";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import Quiz from "@site/src/components/hub/Quiz/Quiz";
import styles from "./foundation-complete.module.css";

const QUIZ_QUESTIONS = [
  {
    source: "Temporal 101",
    prompt:
      "When your Workflow code makes a call to execute an Activity, how does Temporal handle the execution of the task?",
    options: [
      "Temporal immediately performs the task.",
      "Temporal sends the Command to the Temporal Service, then schedules the execution of the task by adding the task to the Task Queue.",
      "Temporal reruns the task immediately within the same Worker.",
      "Temporal ignores the request.",
    ],
    correctIndex: 1,
    reason:
      "When the Worker encounters certain API calls during a Workflow Execution, such as a call to schedule an Activity, it sends a Command to the Temporal Service. The Temporal Service acts on these Commands, for example, by creating an Activity Task and adding it to the Task Queue where a Worker can then pick up the task.",
  },
  {
    source: "Temporal 101",
    prompt:
      "The Temporal Server consists of several services. What is the purpose of the frontend service?",
    options: [
      "To serve web pages.",
      "As an API gateway for clients.",
      "To manage data storage.",
      "For executing Workflow code.",
    ],
    correctIndex: 1,
    reason:
      "The frontend service acts as an API gateway for Clients. Clients communicate with the Temporal Server by issuing requests to this Frontend Service - such as starting a Workflow Execution. The Frontend Service then communicates with backend services as necessary to fulfill the request, and returns a response to the Client.",
  },
  {
    source: "Temporal 101",
    prompt: "Which of the following components is not part of the Temporal SDK?",
    options: [
      "APIs to develop Workflows.",
      "A common library for code used across Client, Worker, and Workflow.",
      "APIs to author Activities.",
      "A built-in database management system.",
    ],
    correctIndex: 3,
    reason:
      "The Temporal SDK provides a Temporal Client to communicate with a Temporal Service, APIs to develop Workflows, APIs to create and manage Worker Processes, APIs to author Activities, and a common library for code shared across the Client, Worker, and Workflow. It does not ship a database management system.",
  },
  {
    source: "Temporal 101",
    prompt: "Which of the following best describes the process of writing Workflows?",
    options: [
      "Workflows cannot be written using code.",
      "Workflows are developed by writing code that calls Temporal APIs provided by the SDK.",
      "Workflows are developed using a graphical user interface.",
      "Workflows are developed outside the SDK.",
    ],
    correctIndex: 1,
    reason:
      "You develop Temporal Workflows by writing code in a standard programming language, similar to how you'd write any other application. This code makes calls to Temporal APIs, which in turn use a Temporal Client to communicate with the Temporal Service.",
  },
  {
    source: "Temporal 101",
    prompt:
      "If an Activity fails in Temporal, which of the following is a typical behavior?",
    options: [
      "The entire Temporal Server shuts down.",
      "The Workflow retries the Activity based on a predefined or custom retry policy.",
      "The Workflow immediately marks itself as failed and cannot be retried.",
      "The Activity failure is ignored, and the Workflow continues.",
    ],
    correctIndex: 1,
    reason:
      "Temporal's default behavior is to automatically retry an Activity, with a short delay between each attempt, until it either succeeds or is canceled. That behavior isn't always desirable, so Temporal lets you customize it through a custom Retry Policy.",
  },
  {
    source: "Temporal 101",
    prompt:
      "What is a key characteristic of Activities when they fail during a Workflow Execution?",
    options: [
      "They end the entire Workflow.",
      "They are automatically retried.",
      "They are skipped.",
      "They are moved to a different Task Queue.",
    ],
    correctIndex: 1,
    reason:
      "Temporal's default behavior is to automatically retry an Activity, with a short delay between each attempt, until it either succeeds or is canceled. You can customize this behavior through a Retry Policy.",
  },
  {
    source: "Temporal 101",
    prompt: "What might you use the temporal command-line client for?",
    options: [
      "Generating a new Worker.",
      "Kicking off a Workflow, or retrieving Workflow status.",
      "Registering Workflows and Activities to Workers.",
      "Adding login information to your own local cluster.",
    ],
    correctIndex: 1,
    reason:
      "Temporal provides a command-line interface, temporal, which lets you interact with a Temporal Service, start a development server, and more - including starting Workflows and retrieving their status.",
  },
  {
    source: "Temporal 101",
    prompt: "When do you need to restart your Workers?",
    options: [
      "When making code changes, including to the Workers themselves.",
      "When they start to slow down or throttle activity.",
      "When continuing to run an older version of a Workflow.",
      "When they have a labor dispute.",
    ],
    correctIndex: 0,
    reason:
      "Temporal Workers use caching to achieve the best possible performance. A consequence is that the modifications you make to the code won't take effect until you restart the Workers that are running your application.",
  },
  {
    source: "Temporal 101",
    prompt: "What additional parameters must you specify when defining Activities?",
    options: [
      "Retry policy.",
      "A child Workflow.",
      "The Start-to-Close or Schedule-to-Close timeout.",
      "A sticky Worker.",
    ],
    correctIndex: 2,
    reason:
      "Start-to-Close lets the Temporal Service detect a Worker that crashed - in which case it considers that attempt failed and creates another task that a different Worker can pick up. Schedule-to-Close limits the maximum execution time for the entire Activity Execution, including retries.",
  },
  {
    source: "Temporal 101",
    prompt: "How long do Workflows run?",
    options: [
      "Up to an hour.",
      "Up to a week.",
      "Up to a month.",
      "As long as fits your business logic.",
    ],
    correctIndex: 3,
    reason:
      "Workflows are designed to be long-running and can run for weeks, months, or even years - whatever your business logic requires.",
  },
  {
    source: "Temporal 101",
    prompt:
      "How does Temporal recommend structuring input parameters to your Workflows?",
    options: [
      "By bootstrapping environment variables.",
      "By entering them into the web UI.",
      "As multiple arguments provided to a Workflow.",
      "As structs or complex objects in a single argument.",
    ],
    correctIndex: 3,
    reason:
      "Changing the number, position, or type of input parameters can affect backwards compatibility with existing Workflow Executions. It's a best practice to encapsulate all input parameters into a single struct or complex object passed as input to the Workflow or Activity. You can then change the composition of the struct without changing the function signature.",
  },
  {
    source: "Temporal 101",
    prompt: "How can you customize Temporal Activity retries?",
    options: [
      "By assigning more Workers to an Activity.",
      "By defining backoff coefficients, maximum attempts, and so on.",
      "By calling the same Activity from multiple Workflows.",
      "By encouraging the Activity to never give up.",
    ],
    correctIndex: 1,
    reason:
      "Temporal's default behavior is to automatically retry an Activity, with a short delay between each attempt that increases exponentially, until it either succeeds or is canceled. You can customize the retry policy by configuring the initial interval, backoff coefficient, maximum interval, maximum attempts, and non-retryable errors.",
  },
  {
    source: "Temporal 101",
    prompt: "What can you do with the web UI?",
    options: [
      "Monitor current Workflow Executions, event history, and output.",
      "Create and assign new Workers.",
      "Register Workflows and Activities to Workers.",
      "Make remote API calls.",
    ],
    correctIndex: 0,
    reason:
      "The Web UI is a powerful tool for gaining insight into your application. It displays current and recent Workflow Executions and shows their inputs, outputs, and event history.",
  },
  {
    source: "Temporal 101",
    prompt: "How can you use the Temporal CLI and SDKs together?",
    options: [
      "Code your Workers in Python and your Workflows and Activities in TypeScript.",
      "Code your Workers, Workflows, and Activities in Go, and use the CLI to start your Workflows.",
      "Code your Workers, Workflows, and starter all in Java, and do not write any Activities.",
      "All of the above are valid implementations.",
    ],
    correctIndex: 3,
    reason:
      "Temporal provides a command-line interface, temporal, that lets you interact with a cluster, start a development server, and more. You can use it alongside any SDK in any of these combinations.",
  },
  {
    source: "Temporal 102",
    prompt:
      "Temporal guarantees that there can only be a single Workflow Execution of the same Workflow Type with a given Workflow ID running within a Namespace at any point in time.",
    options: ["True", "False"],
    correctIndex: 1,
    reason:
      "Workflow IDs must be unique across all Workflow Types, not just those of the same Workflow Type. For example, if there are two Workflow Types registered within the same Namespace named Greeting and Farewell, and you start a Workflow Execution for Greeting with the Workflow ID bob, then attempt to start another Workflow Execution for Farewell with the Workflow ID bob, the second Workflow Execution will either fail or be ignored (depending on the SDK) due to the Workflow ID collision.",
  },
  {
    source: "Temporal 102",
    prompt:
      "What is the result when there is a mismatch (e.g. a misspelling) between the Task Queue specified in the Worker and the Task Queue specified in the Client? For example, the Worker listens on greeting-tasks and the Client requests execution on greeting-task.",
    options: [
      "An error is thrown by the Worker.",
      "An error is thrown by the Client, stating no Worker is listening on that Task Queue.",
      "Temporal uses fuzzy matching to determine a \"close enough\" match.",
      "Two different Task Queues are created, and no progress is made.",
    ],
    correctIndex: 3,
    reason:
      "Task Queues are dynamically created in Temporal, so a mismatch between the Task Queue specified by the Worker and the Task Queue specified by the Client results in two Task Queues being created. A Task Queue is created for the Worker named greeting-tasks that listens for requests; another is created for the Client named greeting-task where the execution request is placed. The Worker and Client are unaware of each other's queue, so no progress is made and it appears as if nothing is happening.",
  },
  {
    source: "Temporal 102",
    prompt: "What is the purpose of a Durable Timer?",
    options: [
      "A means to measure the amount of time it takes for a single Activity to execute.",
      "A means to measure the amount of time it takes for an entire Workflow to execute.",
      "A means to delay execution of code within a Workflow until a set amount of time passes.",
      "A means to delay execution of code within an Activity until a set amount of time passes.",
    ],
    correctIndex: 2,
    reason:
      "A Durable Timer halts the progress of a Workflow for a specified amount of time. The Timer is maintained by the Temporal Server, so no Worker resources are consumed while it is running. Once the Timer fires, the Workflow resumes execution with the next statement following the Timer.",
  },
  {
    source: "Temporal 102",
    prompt:
      "You start a Timer within your Workflow for 5 minutes after successfully executing two Activities. After 2 minutes and 30 seconds, the Worker is taken offline by a network outage and comes back online 2 minutes later. Assuming only one Worker, what is the correct result when it returns?",
    options: [
      "The Worker restarts the code, re-executing every Activity, then restarts the Timer, waiting the full 5 minutes.",
      "The Worker restarts the code, re-executing every Activity, then pauses the remaining 30 seconds before continuing the Workflow.",
      "After the Timer fires, the Worker replays the code, restoring the state of the program based on the previous results of the Activities, then continues the Workflow.",
      "The Worker replays the code, restoring the state of the program based on the previous results of the Activities, then restarts the Timer, waiting the full 5 minutes.",
    ],
    correctIndex: 2,
    reason:
      "The Timer fires after 5 minutes, regardless of whether a Worker is present. The next Workflow Task is placed on the Sticky Queue that was present prior to the crash. After the 10-second Workflow Task Timeout, the Temporal Service reschedules the Workflow Task on the original queue, where any Worker in the fleet (here, the original Worker) can pick it up. Invalidating the Sticky Queue also invalidates any cached state. The Worker accepts the task, replays the code to restore the state of the program based on the previous Activity results, and continues execution.",
  },
  {
    source: "Temporal 102",
    prompt:
      "You start a Timer within your Workflow for 5 minutes after successfully executing two Activities. After 2 minutes and 45 seconds, the Worker is taken offline by a network outage and comes back online ten minutes later. Assuming only one Worker, what is the correct result when it returns?",
    options: [
      "The Worker restarts the code, re-executing every Activity, then restarts the Timer, waiting the full 5 minutes.",
      "The Worker restarts the code, re-executing every Activity, then immediately continues execution as the Timer has already fired.",
      "The Worker replays the code, restoring the state of the program based on the previous results of the Activities, then immediately continues execution as the Timer has already fired.",
      "The Worker replays the code, restoring the state of the program based on the previous results of the Activities, then restarts the Timer, waiting the full 5 minutes.",
    ],
    correctIndex: 2,
    reason:
      "The Timer fires after 5 minutes regardless of whether a Worker is present. The Temporal Service places the next Workflow Task on the Task Queue, but no Worker is available to execute it. Once the Worker comes back online, it accepts the task, replays the code to restore the state of the program based on the previous Activity results, and continues execution of the Workflow.",
  },
  {
    source: "Temporal 102",
    prompt: "Once a Workflow has closed, it can't be re-opened.",
    options: ["True", "False"],
    correctIndex: 0,
    reason:
      "Workflows that have closed can never be re-opened. They can be reset to a certain point, but that opens a new Workflow Execution with a new Run ID - not the original Workflow Execution.",
  },
  {
    source: "Temporal 102",
    prompt:
      "Which of the following is NOT true about a Workflow Execution History?",
    options: [
      "Represents the source of truth for a Workflow Execution.",
      "Allows for reconstruction of a Workflow state following a crash.",
      "Events can be inserted at any place in the history.",
      "Durably persisted by the Temporal Service.",
    ],
    correctIndex: 2,
    reason:
      "The Workflow History is an append-only record of the events that happened during the execution of a Workflow from the perspective of the Temporal Service. Similar to how you can't go back in time and rewrite history, you cannot go back and rewrite an Event History.",
  },
  {
    source: "Temporal 102",
    prompt:
      "Certain steps within a Workflow - executing an Activity, setting a Timer, or returning a value from the Workflow - involve interaction with the Temporal Service. These are known as:",
    options: ["Directives", "Processors", "Commands", "Orders"],
    correctIndex: 2,
    reason:
      "Workflows communicate with the Temporal Service via Commands. Commands are issued by the Workflow when specific SDK calls are encountered, such as requests to execute Activities, Timers, and other APIs.",
  },
  {
    source: "Temporal 102",
    prompt:
      "When a ScheduleActivityTask Command is sent to the Temporal Service from a Worker, the Temporal Service:",
    options: [
      "Adds an Activity Task to the designated Task Queue and appends the ActivityTaskScheduled Event to the Event History.",
      "Schedules the execution of the next Activity on an available Worker and appends the ActivityTaskScheduled Event to the Event History.",
      "Schedules the Activity for the time specified in the Command, and appends the ActivityTaskScheduled Event to the Event History.",
    ],
    correctIndex: 0,
    reason:
      "The Temporal Service only adds tasks to the Task Queue. It does not directly schedule tasks on an individual Worker or designate when an Activity is to be executed.",
  },
  {
    source: "Temporal 102",
    prompt:
      "Sticky Execution improves the effectiveness of a Worker's caching by giving preference - via Worker-specific Task Queues - for which type of subsequent tasks in the same execution?",
    options: ["Workflows", "Activities", "Workflows and Activities", "Signals"],
    correctIndex: 0,
    reason:
      "Sticky Queues only apply to Workflow Tasks, so they only affect the Workflow. Activities do not have Sticky Queues.",
  },
];

const KNOW_NOW = [
  {
    title: "Durable execution",
    body: "You can explain why a Workflow survives a Worker crash and where Activities fit into Temporal's execution model.",
  },
  {
    title: "Event history",
    body: "You can read a Workflow's event history in the Web UI and follow exactly what happened.",
  },
  {
    title: "Failure recovery",
    body: "You've watched Temporal retry failed Activities and resume Workflows after a crash, without any custom recovery code.",
  },
  {
    title: "Testing Workflows",
    body: "You know how to write Workflow tests and verify your code paths behave correctly before shipping.",
  },
];

export default function BeginnerCompletePage() {
  return (
    <Layout
      title="Beginner complete"
      description="You've finished the Beginner path on learn.temporal.io."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Beginner complete"
          title="You're a Temporal builder now."
          body="You've finished Temporal 101 and 102. You know how durable execution works, you can read a Workflow's event history, and you've configured retry policies that recover from failure. That's the foundation - everything else builds on it."
          showSearch={false}
        />

        <div className={styles.pageInner}>
          <div className={styles.breadcrumbWrap}>
            <PathBreadcrumb
              items={[
                { label: "Temporal University", href: "/" },
                { label: "Paths", href: "/paths" },
                { label: "Beginner", href: "/paths/beginner" },
                { label: "Complete" },
              ]}
            />
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What you now understand</h2>
            <div className={styles.knowGrid}>
              {KNOW_NOW.map((item) => (
                <div key={item.title} className={styles.knowCard}>
                  <h3 className={styles.knowTitle}>{item.title}</h3>
                  <p className={styles.knowBody}>{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick check: test what you remember</h2>
            <p className={styles.quizIntro}>
              {QUIZ_QUESTIONS.length} questions drawn from Temporal 101 and 102. Pick an
              answer - if you miss it, the explanation appears once you find the right one.
            </p>
            <Quiz questions={QUIZ_QUESTIONS} />
          </section>

          <div className={styles.bottomCta}>
            <MagentaCta to="/paths/intermediate">
              Continue to the Intermediate Learning Path
            </MagentaCta>
          </div>
        </div>

        <GetHelp />

        <NotifyBanner />
      </div>
    </Layout>
  );
}
