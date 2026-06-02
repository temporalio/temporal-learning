import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import GetHelp from "@site/src/components/hub/GetHelp/GetHelp";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import Quiz from "@site/src/components/hub/Quiz/Quiz";
import styles from "./foundation-complete.module.css";

const KNOW_NOW = [
  {
    title: "Error-handling strategy",
    body: "You can distinguish Platform from Application failures and choose between Retry Policies, non-retryable errors, and the Saga pattern.",
  },
  {
    title: "Signals, Queries, Updates",
    body: "You can send data into a running Workflow with Signals or Updates, and read its state with Queries.",
  },
  {
    title: "Secure payloads",
    body: "You can wire a Custom Data Converter and a Codec Server so inputs and outputs are encrypted in transit and at rest.",
  },
  {
    title: "Workflow Versioning",
    body: "You can patch a running Workflow with the GetVersion API and verify backwards compatibility using the Workflow Replayer.",
  },
];

const QUIZ_QUESTIONS = [
  {
    source: "Error Handling",
    prompt: "Classify this failure: a microservice that fails due to a network outage.",
    options: ["Platform failure", "Application failure"],
    correctIndex: 0,
    reason:
      "The failure is beyond the control of the application logic. The application is unaware of when the network may go out and cannot affect the network. Retries can mitigate it without any knowledge of business logic - so it's a Platform failure.",
  },
  {
    source: "Error Handling",
    prompt: "Classify this failure: order processing fails because the payment card is expired.",
    options: ["Platform failure", "Application failure"],
    correctIndex: 1,
    reason:
      "The failure is within the control of the application logic. The application could notify the user, try an alternative method, or cancel the order - so it's an Application failure.",
  },
  {
    source: "Error Handling",
    prompt: "Classify this failure: a user can't log in due to incorrect credentials.",
    options: ["Platform failure", "Application failure"],
    correctIndex: 1,
    reason:
      "The failure is within the control of the application logic. The application decides what message to display, when to lock the account, and when to prompt with \"Did you forget your password?\" - so it's an Application failure.",
  },
  {
    source: "Error Handling",
    prompt:
      "Classify this failure: a credit card can't be processed because the bank's API is down for maintenance.",
    options: ["Platform failure", "Application failure"],
    correctIndex: 0,
    reason:
      "The failure is beyond the control of the application logic. The application is unaware of when an external dependency may go offline and cannot change that. Retries may mitigate it without knowledge of business logic - so it's a Platform failure.",
  },
  {
    source: "Error Handling",
    prompt: "Which of the following operations is NOT idempotent?",
    options: [
      "Pressing the call button on an elevator",
      "Adding salt to soup",
      "Locking your car doors with your remote",
      "Adding an element to a set",
    ],
    correctIndex: 1,
    reason:
      "Idempotence means subsequent invocations don't change state further. Adding salt to soup keeps changing the state with each invocation. Pressing the elevator call button, locking already-locked doors, or re-adding an element already in a set all leave state unchanged.",
  },
  {
    source: "Error Handling",
    prompt: "Temporal recommends that you implement your Activities as:",
    options: ["Deterministic", "Idempotent", "Non-deterministic", "Non-idempotent"],
    correctIndex: 1,
    reason:
      "Temporal recommends Activities be idempotent, especially if they mutate state. Because Activities can be retried, they may execute more than once - a non-idempotent Activity could duplicate writes to a database or otherwise corrupt state.",
  },
  {
    source: "Error Handling",
    prompt: "Which of the following is NOT retried by default?",
    options: [
      "Workflow Task Failure",
      "Workflow Execution Failure",
      "Activity Failure",
    ],
    correctIndex: 1,
    reason:
      "Workflow Execution Failures are not retried by default. Activities have a default Retry Policy that retries indefinitely; Workflow Task Failures are also retried indefinitely but aren't associated with a Retry Policy.",
  },
  {
    source: "Error Handling",
    prompt:
      "How does the Temporal Service use Timeouts? (Multiple are correct - pick the one you're most sure of.)",
    options: [
      "To detect when a Worker has gone offline.",
      "To report metrics on average time of executions.",
      "For internal performance tuning.",
      "Establish a maximum duration for your business logic.",
    ],
    correctIndex: 0,
    reason:
      "Temporal uses Timeouts to detect when Workers have gone offline so it knows when to reschedule Tasks, and to let developers set maximum durations for business logic. Both A and D are correct from the original assessment.",
  },
  {
    source: "Error Handling",
    prompt: "Which of the following is NOT a purpose of Activity Heartbeats?",
    options: [
      "Progress indication",
      "Worker Health Check",
      "Cancellation Detection",
      "Logging",
    ],
    correctIndex: 3,
    reason:
      "Heartbeats are used to track Activity progress, ensure the health of a Worker running a long Activity, and relay cancellation requests. They are not used for logging.",
  },
  {
    source: "Error Handling",
    prompt: "For an Activity to be cancellable, it must:",
    options: [
      "Implement a default Signal handler for receiving the cancel Signal.",
      "Implement a default Query handler for receiving the request to cancel.",
      "Define a custom Search Attribute that is checked for a cancellation request.",
      "Perform heartbeating to check for a cancellation request.",
    ],
    correctIndex: 3,
    reason:
      "For an Activity to receive cancellation requests, it must perform heartbeating. The cancellation request is communicated via the heartbeat, which tells the Activity it doesn't need to continue and gives it a chance to clean up.",
  },
  {
    source: "Error Handling",
    prompt:
      "Which Activity Timeout are you required to set at least one of? (The original allows two correct answers - pick either.)",
    options: [
      "Start-To-Close",
      "Schedule-To-Close",
      "Schedule-To-Start",
      "Schedule-To-Next-Schedule",
    ],
    correctIndex: 0,
    reason:
      "You're required to set at least one of Start-To-Close or Schedule-To-Close. Temporal recommends Start-To-Close.",
  },
  {
    source: "Error Handling",
    prompt:
      "If a programmer wanted to modify the amount of time between retries of a failing Activity, how would they do so?",
    options: [
      "Implement Timers within the Activity to delay it if a failure was detected.",
      "Implement their own logic within the Workflow to handle custom retry logic.",
      "Define a Retry Policy and attach it to the Activity Execution.",
      "Catch the error in their code and implement a sleep in the error-handling clause.",
    ],
    correctIndex: 2,
    reason:
      "The delay between retries is determined by the Retry Policy. You can modify InitialInterval and BackoffCoefficient to create an increasing backoff, and set MaximumInterval to cap the wait between retries.",
  },
  {
    source: "Error Handling",
    prompt: "Which of the following issues is unlikely to be resolved by a Retry Policy?",
    options: [
      "An external API is temporarily down for maintenance.",
      "User-provided authentication credentials are incorrect.",
      "A backhoe cut a fiber line, and the data center has no network access.",
      "The internal database is being migrated to a larger instance.",
    ],
    correctIndex: 1,
    reason:
      "No amount of retries is going to make an incorrect password correct. This should be a non-retryable error.",
  },
  {
    source: "Error Handling",
    prompt:
      "Classify this failure: a service has been taken offline because the company went out of business.",
    options: ["Transient", "Intermittent", "Permanent"],
    correctIndex: 2,
    reason:
      "Unless you plan on buying the company to bring it back online, this is a Permanent failure.",
  },
  {
    source: "Error Handling",
    prompt:
      "Classify this failure: a major network outage is affecting a datacenter.",
    options: ["Transient", "Intermittent", "Permanent"],
    correctIndex: 1,
    reason:
      "Retries may eventually fix this, but it will be a long outage. A Retry Policy with longer delays is appropriate - this is an Intermittent failure.",
  },
  {
    source: "Error Handling",
    prompt: "Classify this failure: a microservice is down for maintenance.",
    options: ["Transient", "Intermittent", "Permanent"],
    correctIndex: 0,
    reason:
      "Service downtime is usually not very long; retries will fix it and the default Retry Policy is typically enough. This is a Transient issue.",
  },
  {
    source: "Error Handling",
    prompt: "Classify this failure: a credit card is expired.",
    options: ["Transient", "Intermittent", "Permanent"],
    correctIndex: 2,
    reason:
      "You can't go back in time. This is a Permanent issue and will require manual intervention.",
  },
  {
    source: "Error Handling",
    prompt:
      "Classify this failure: the bank is closed on weekends and turns its API off during non-business hours.",
    options: ["Transient", "Intermittent", "Permanent"],
    correctIndex: 1,
    reason:
      "This calls for a longer retry, or perhaps a Timer that waits until the bank reopens. This is an Intermittent failure.",
  },
  {
    source: "Error Handling",
    prompt: "Classify this failure: a router is rebooting.",
    options: ["Transient", "Intermittent", "Permanent"],
    correctIndex: 0,
    reason:
      "Router reboots are typically not very long. Quick retries will soon resolve this - it's a Transient failure.",
  },
  {
    source: "Error Handling",
    prompt:
      "It is possible to have a custom Retry Policy for each different Activity Execution.",
    options: ["True", "False"],
    correctIndex: 0,
    reason:
      "You can have as many custom policies for each Activity as you want. You can even execute an Activity, choose to fail fast, then create a new policy and execute the Activity again with the new policy.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "Why is it important to have a Worker available after your Workflows have completed?",
    options: [
      "So the Worker can respond to Queries.",
      "So you can view the Event History in the Web UI.",
      "So you can view the Event History via the CLI.",
      "So you can respond to Signals.",
    ],
    correctIndex: 0,
    reason:
      "Queries are sent from a Temporal Client to a Workflow Execution and the Client waits for a response. Queries are typically used on running Workflows, but they can also be sent to closed Workflow Executions. Either way, there must be at least one running Worker for the Task Queue.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "When can you set a Custom Search Attribute value? (The original allows two correct answers - pick either.)",
    options: [
      "When you start a Workflow.",
      "By upserting from within that Workflow.",
      "When you start the Temporal Service.",
      "When you create a Namespace.",
    ],
    correctIndex: 0,
    reason:
      "After creating your own Custom Search Attribute, you can set its value either when starting a Workflow (via the Client or Workflow API) or by \"upserting\" from within the Workflow itself - dynamically adding or updating Search Attributes from Workflow code.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "How does canceling a Workflow Execution differ from terminating a Workflow Execution?",
    options: [
      "Canceling allows the Workflow to perform cleanup.",
      "Terminating allows the Workflow to perform cleanup.",
      "Terminating removes the Event History.",
      "Canceling removes the Event History.",
    ],
    correctIndex: 0,
    reason:
      "Canceling is a gentle request for the Workflow to stop and lets it perform cleanup before exiting. Terminating is abrupt - similar to killing a process - and forcefully stops the Workflow with no cleanup or grace period.",
  },
  {
    source: "Interacting with Workflows",
    prompt: "How can you start a Workflow with a Signal?",
    options: [
      "It is not possible to do this.",
      "By using the Workflow's Run ID.",
      "By using Signal-with-Start.",
      "By using semaphore (the flags, not the kernel kind).",
    ],
    correctIndex: 2,
    reason:
      "Signal-with-Start checks if there is currently a running Workflow Execution with the given Workflow ID. If it exists, it is signaled. Otherwise, a new Workflow Execution is started and immediately sent the Signal.",
  },
  {
    source: "Interacting with Workflows",
    prompt: "What is the role of a task token?",
    options: [
      "To perform asynchronous completion of an Activity.",
      "To perform encryption of inputs and outputs.",
      "To create an identifier for a Signal.",
      "To create a permanent identifier for an Activity.",
    ],
    correctIndex: 0,
    reason:
      "Asynchronous Activity Completion uses Task Tokens to track the specific Activity that was executed. Task Tokens are unique identifiers for an Activity Task Execution, passed into the Activity as an argument so Temporal can track the specific Activity instance across machines.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "What is a distinction between Asynchronous Completion Activity and Signals?",
    options: [
      "Signals maintain execution state without heartbeats.",
      "Both approaches require heartbeats for state maintenance.",
      "Heartbeats are only available with Asynchronous Completion Activity.",
      "Neither approach affects execution state persistence.",
    ],
    correctIndex: 2,
    reason:
      "With Asynchronous Completion, the external system informs Temporal directly when it has finished the task. This is ideal for long-running processes because Heartbeats are sent to indicate the ongoing Activity.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "An Activity does not use heartbeating and does not return either a result or an error. It has a one-week Start-To-Close timeout and fails after one minute. What happens?",
    options: [
      "The Activity immediately reports failure and retries.",
      "The Workflow terminates immediately.",
      "The Activity continues waiting until the week-long timeout expires.",
      "The timeout automatically adjusts based on the failure.",
    ],
    correctIndex: 2,
    reason:
      "A long Start-To-Close Timeout lets long-running Activities complete, but it also means actual failures take longer to recognize - the system waits for the timeout to expire before retrying. This is why it's important to use Heartbeats in long-running Activities, so failure is detected quickly.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "When building a system that processes a significant number of orders in a Workflow, which pattern represents the best practice for handling incoming order events?",
    options: [
      "Create a new Signal for each individual order to ensure real-time processing.",
      "Batch related orders together and send a single Signal with multiple orders as a payload.",
      "Process each Signal in its own Workflow.",
      "Use a Query to periodically check for new orders in the Workflow state.",
    ],
    correctIndex: 1,
    reason:
      "If you want to send a large number of outgoing Signals from a Workflow, write your logic to send them as a batch of no more than 2000 with a short pause between batches. Exceeding that limit causes a Workflow Task failure.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "In a long-running Workflow that processes customer data, what is the recommended approach for managing Signal history?",
    options: [
      "Allow the history to grow indefinitely since all data might be important.",
      "Regularly delete old Signals to maintain performance.",
      "Create new Workflows when the Signal count gets too high.",
      "Use Continue-As-New when approaching history size limits and batch Signals where appropriate.",
    ],
    correctIndex: 3,
    reason:
      "Sending a large number of Signals enlarges the Event History size, potentially impacting performance. Continue-As-New helps here. Batching Signals also helps manage history size - e.g. for every ten Signals, combine their payloads into a single Signal.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "When designing a system that tracks progress of long-running operations, which approach aligns with Query best practices?",
    options: [
      "Implement a Query to read current progress and use Signals to provide updated data to a Workflow.",
      "Start a new Workflow instance each time progress needs to be updated.",
      "Store all progress information in external storage.",
      "Use only Activities to track progress.",
    ],
    correctIndex: 0,
    reason:
      "Queries are read-only and must complete synchronously. Signals are useful for Workflows that must react to external events - like waiting for a human to complete a task or providing updated data.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "In a Workflow handling e-commerce order processing, which aspect MOST influences Asynchronous Activity Completion?",
    options: [
      "The number of orders being processed and system throughput.",
      "The reliability of external systems and need for monitoring.",
      "The size of the data payload being transmitted.",
      "The number of Workers available to process orders.",
    ],
    correctIndex: 1,
    reason:
      "A scenario is more suited for asynchronous completion when the external system is unreliable and might fail to Signal - e.g. if it has intermittent connectivity. Asynchronous completion provides a way to complete the Activity later when the system becomes available.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "In a system handling customer orders, when would Signal-with-Start be the MOST appropriate choice?",
    options: [
      "When updating an existing order that's definitely running.",
      "When handling a new order and unsure if a Workflow exists for the customer.",
      "When retrying a failed Signal.",
      "When checking if a Signal has failed or not.",
    ],
    correctIndex: 1,
    reason:
      "Signal-with-Start checks if a running Workflow Execution with the given Workflow ID exists. If it does, it is signaled; otherwise, a new Workflow Execution is started and immediately sent the Signal. This is useful when you want to ensure a Workflow is running and receives specific information right from the start.",
  },
  {
    source: "Interacting with Workflows",
    prompt:
      "In Temporal, what is the recommended way to provide external input to a running Workflow Execution?",
    options: [
      "Restart the Workflow Execution with new input data.",
      "Use a Query to send data into the Workflow.",
      "Use a Signal or Update to send data to the running Workflow.",
      "Modify the Workflow Execution history directly.",
    ],
    correctIndex: 2,
    reason:
      "Signals and Updates are the primary mechanisms for delivering external input to a running Workflow Execution. Signals are asynchronous messages used to influence Workflow state or execution path. Queries, in contrast, are read-only and cannot modify Workflow state.",
  },
  {
    source: "Interacting with Workflows",
    prompt: "True or false: Workflow Tasks also need to send Heartbeats like Activities do.",
    options: ["True", "False"],
    correctIndex: 1,
    reason:
      "Workflow Executions do not send Heartbeats because Workflow Tasks are expected to complete quickly (usually within seconds). Temporal sets a default 10-second timeout on Workflow Tasks, and the Worker is expected to pick up and execute them within that window. Heartbeating is designed for long-running Activities.",
  },
  {
    source: "Interacting with Workflows",
    prompt: "Why are Heartbeats required for Activity cancellation?",
    options: [
      "The Worker checks for cancellation when sending a Heartbeat.",
      "Heartbeats automatically retry failed Activities.",
      "If the Heartbeat Timeout is surpassed, the Activity cancels and gracefully cleans up.",
      "If there is no Heartbeat Timeout set, the Activity cancels and gracefully cleans up.",
    ],
    correctIndex: 0,
    reason:
      "When an Activity sends a Heartbeat, the Worker checks whether a cancellation request has been issued. If so, the Worker brings the cancellation response back to the Activity, enabling it to cancel gracefully and quickly.",
  },
  {
    source: "Versioning Workflows",
    prompt:
      "When do you need to introduce Versioning? (The original allows multiple correct answers - pick the one you're most sure of.)",
    options: [
      "When you make a non-deterministic change to your Workflow code.",
      "When you make a non-deterministic change to your Activity code.",
      "When you change the input parameters passed to a Workflow.",
      "When you rearrange the steps taken within a Workflow.",
    ],
    correctIndex: 0,
    reason:
      "Workflow Executions already in progress will be temporarily interrupted by deployment, which restarts the Workers. They resume via History Replay using the updated Workflow Definition. If that produces a different sequence of Commands than before, you get a non-determinism error. Workflow Versioning lets you safely deploy incompatible changes. (A, C, and D from the original are all correct - C is avoidable; Activity code changes don't require versioning.)",
  },
  {
    source: "Versioning Workflows",
    prompt:
      "How can you identify how many executions there are of a particular Workflow revision, and whether they are running or not?",
    options: [
      "Use a List Filter to search on them.",
      "Check the Worker status page on the Web UI.",
      "Send Queries to each individual Workflow.",
      "Measure server load.",
    ],
    correctIndex: 0,
    reason:
      "The List Filter acts like an SQL-like query, letting you retrieve specific sets of Workflow Executions from the Visibility Store based on defined criteria.",
  },
  {
    source: "Versioning Workflows",
    prompt:
      "How do you test backwards compatibility of a change before deploying it, to avoid non-determinism errors?",
    options: [
      "Deploy it, see if it fails, then redeploy a known good version.",
      "Use the Workflow Replayer with event history JSON.",
      "Run at least two Workers so only one of them will crash.",
      "All changes are backwards compatible.",
    ],
    correctIndex: 1,
    reason:
      "Replay testing takes one or more existing Workflow Histories that ran against a previous version of Workflow code and runs them against your current Workflow code, verifying compatibility with the provided history.",
  },
  {
    source: "Versioning Workflows",
    prompt:
      "What is a valid way of Versioning your Temporal Workflows? (The original allows multiple correct answers - pick any one.)",
    options: [
      "Use the GetVersion/Patching functionality to add branches to your Workflow logic.",
      "Use different Task Queue names for your Workflow revisions.",
      "Use the prerelease Worker Versioning / Safe Deploys feature.",
      "Add semantic versioning to your Workflow code and it will be automatically used.",
    ],
    correctIndex: 0,
    reason:
      "There are three valid approaches to support Workflow Executions started with both old and new versions: using a different Workflow Type, using the GetVersion/Patching API, or using Worker Versioning. Semantic version strings in your code are not auto-detected.",
  },
  {
    source: "Versioning Workflows",
    prompt:
      "What parts of your code are NOT normally re-run during Workflow Replay? (The original allows multiple correct answers - pick any one.)",
    options: ["Logger calls", "Print statements", "Activities", "Sleep calls"],
    correctIndex: 0,
    reason:
      "Temporal's logger is replay-aware, so it suppresses output during replay to avoid duplicate messages. Activities are also not executed again during replay. (Print statements and Sleep calls run as normal code, so they do execute during replay.)",
  },
  {
    source: "Versioning Workflows",
    prompt:
      "What happens on the server when you call the Versioning/Patching APIs? (The original allows multiple correct answers - pick any one.)",
    options: [
      "A marker is recorded to identify this revision on future replays.",
      "A search attribute is added so you can query each revision.",
      "A git diff is run on your Workflow code.",
      "Your code is patched with a needle and thread by little gnomes that live in the computer.",
    ],
    correctIndex: 0,
    reason:
      "When running the code for the first time, a marker is inserted into the Workflow history with a patchId. During replay, if a Worker encounters a version marker, it checks whether the current Workflow code has a corresponding patched call with the same patchId. A search attribute is also added so you can query each revision.",
  },
];

export default function IntermediateCompletePage() {
  return (
    <Layout
      title="Intermediate path complete"
      description="You've finished the Intermediate path on learn.temporal.io."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Intermediate complete"
          title="You build resilient Temporal applications."
          body="You've finished the Intermediate path. You can design error-handling strategies, interact with running Workflows with Signals, Queries, and Updates, secure payloads end-to-end, and version your Workflow code safely - everything you need to ship Temporal applications that survive real production."
          showSearch={false}
        />

        <div className={styles.pageInner}>
          <div className={styles.breadcrumbWrap}>
            <PathBreadcrumb
              items={[
                { label: "Temporal University", href: "/" },
                { label: "Paths", href: "/paths" },
                { label: "Intermediate", href: "/paths/intermediate" },
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
              {QUIZ_QUESTIONS.length} questions drawn from Error Handling, Interacting with
              Workflows, and Versioning Workflows. Pick an answer - if you miss it, the
              explanation appears once you find the right one.
            </p>
            <Quiz questions={QUIZ_QUESTIONS} />
          </section>

          <div className={styles.bottomCta}>
            <MagentaCta to="/paths/advanced">
              Continue to the Advanced Learning Path
            </MagentaCta>
          </div>
        </div>

        <GetHelp />

        <NotifyBanner />
      </div>
    </Layout>
  );
}
