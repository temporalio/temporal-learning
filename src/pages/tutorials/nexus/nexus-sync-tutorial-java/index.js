import React, { useEffect } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const IMG_BASE = "/img/tutorials/nexus";

const TOC_ITEMS = [
  { id: "what-youll-learn", label: "What you'll learn" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "scenario", label: "Scenario" },
  { id: "overview", label: "Overview" },
  { id: "checkpoint-0", label: "Checkpoint 0: Run the monolith" },
  { id: "what-were-building", label: "What we're building" },
  { id: "compliance-workflow", label: "The Compliance Workflow" },
  { id: "todo-1", label: "TODO 1: Nexus Service Interface" },
  { id: "todo-2", label: "TODO 2: Nexus Handlers" },
  { id: "todo-3", label: "TODO 3: Compliance Worker" },
  { id: "checkpoint-1", label: "Checkpoint 1: Compliance Worker starts" },
  { id: "checkpoint-1-5", label: "Checkpoint 1.5: Nexus Endpoint" },
  { id: "todo-4", label: "TODO 4: Replace Activity stub" },
  { id: "todo-5", label: "TODO 5: Update Payments Worker" },
  { id: "checkpoint-2", label: "Checkpoint 2: Decoupled end-to-end" },
  { id: "checkpoint-3", label: "Checkpoint 3: Durability" },
  { id: "human-review", label: "Complete the Human Review Path" },
  { id: "quiz", label: "Quiz" },
  { id: "what-you-built", label: "What you built" },
  { id: "whats-next", label: "What's next?" },
];

// Auto-resizes iframes when they post a height message to the parent window.
function IframeAutoResize() {
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "iframeResize" && typeof e.data.height === "number") {
        document.querySelectorAll("iframe").forEach((iframe) => {
          try {
            if (iframe.contentWindow === e.source) {
              iframe.style.setProperty("height", e.data.height + "px", "important");
            }
          } catch (err) {}
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);
  return null;
}

const NEXUS_CODE_DIFF = `// BEFORE (monolith — direct activity call):
ComplianceResult compliance = complianceActivity.checkCompliance(compReq);

// AFTER (Nexus — durable cross-team call):
ComplianceResult compliance = complianceService.checkCompliance(compReq);`;

const ARCHITECTURE_DIAGRAM = `BEFORE (Monolith):                    AFTER (Nexus Decoupled):
┌─────────────────────────┐           ┌──────────────┐    ┌──────────────┐
│   Single Worker         │           │  Payments    │    │  Compliance  │
│   ─────────────         │           │  Worker      │    │  Worker      │
│   Workflow              │           │  ──────      │    │  ──────      │
│   PaymentActivity       │    →      │  Workflow    │◄──►│  NexusHandler│
│   ComplianceActivity    │           │  PaymentAct  │    │  Checker     │
│                         │           │              │    │              │
│   ONE blast radius      │           │  Blast #1    │    │  Blast #2    │
└─────────────────────────┘           └──────────────┘    └──────────────┘
                                                   ▲ Nexus ▲`;

const START_DEV_SERVER = `temporal server start-dev`;

const CREATE_NAMESPACES = `temporal operator namespace create --namespace payments-namespace
temporal operator namespace create --namespace compliance-namespace`;

const START_MONOLITH_WORKER = `mvn compile exec:java@payments-worker`;

const MONOLITH_WORKER_LOG = `Payments Worker started on: payments-processing
Registered: PaymentProcessingWorkflow, PaymentActivity
            ComplianceActivity (monolith — will decouple)`;

const RUN_STARTER = `mvn compile exec:java@starter`;

const NEXUS_BUILDING_BLOCKS_DIAGRAM = `Service    →    Operation    →    Endpoint      →      Registry
(contract)      (method)          (routing rule)      (directory)`;

const COMPLIANCE_WORKFLOW_IMPL = `public class ComplianceWorkflowImpl implements ComplianceWorkflow {

    @Override
    public ComplianceResult run(ComplianceRequest request) {
        // Step 1: Run automated compliance check
        autoResult = complianceActivity.checkCompliance(request);

        // 10s durable sleep — gives you a window to test Nexus durability (Checkpoint 3)
        Workflow.sleep(Duration.ofSeconds(10));

        // Step 2: LOW or HIGH risk → return immediately
        if (!"MEDIUM".equals(autoResult.getRiskLevel())) {
            return autoResult;
        }

        // Step 3: MEDIUM risk → wait for human review via Update
        Workflow.await(() -> reviewResult != null);
        return reviewResult;
    }

    @Override
    public ComplianceResult review(boolean approved, String explanation) {
        // Stores the decision and unblocks run()
        this.reviewResult = new ComplianceResult(..., approved, "MEDIUM", explanation);
        return reviewResult;
    }

    @Override
    public void validateReview(boolean approved, String explanation) {
        // Rejects reviews that arrive at the wrong time
        if (autoResult == null || !"MEDIUM".equals(autoResult.getRiskLevel()))
            throw new IllegalStateException("Workflow is not awaiting review");
        if (reviewResult != null)
            throw new IllegalStateException("Review already submitted");
    }
}`;

const NEXUS_SERVICE_INTERFACE = `@Service
public interface ComplianceNexusService {
    @Operation
    ComplianceResult checkCompliance(ComplianceRequest request);

    @Operation
    ComplianceResult submitReview(ReviewRequest request);
}`;

const NEXUS_SERVICE_IMPL = `@ServiceImpl(service = ComplianceNexusService.class)
public class ComplianceNexusServiceImpl {

    @OperationImpl
    public OperationHandler<ComplianceRequest, ComplianceResult> checkCompliance() {
        return WorkflowRunOperation.fromWorkflowHandle((ctx, details, input) -> {
            WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
            ComplianceWorkflow wf = client.newWorkflowStub(
                    ComplianceWorkflow.class,
                    WorkflowOptions.newBuilder()
                            .setTaskQueue("compliance-risk")
                            .setWorkflowId("compliance-" + input.getTransactionId())
                            .build());

            return WorkflowHandle.fromWorkflowMethod(wf::run, input);
        });
    }

    @OperationImpl
    public OperationHandler<ReviewRequest, ComplianceResult> submitReview() {
        return OperationHandler.sync((ctx, details, input) -> {
            WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
            ComplianceWorkflow wf = client.newWorkflowStub(
                    ComplianceWorkflow.class,
                    "compliance-" + input.getTransactionId());
            return wf.review(input.isApproved(), input.getExplanation());
        });
    }
}`;

const CRWL_PATTERN = `C — Connect to Temporal
R — Create factory and Worker on "compliance-risk"
W — Wire:
    1. worker.registerWorkflowImplementationTypes(ComplianceWorkflowImpl.class)
    2. worker.registerActivitiesImplementations(new ComplianceActivityImpl(new ComplianceChecker()))
    3. worker.registerNexusServiceImplementation(new ComplianceNexusServiceImpl())
L — Launch`;

const REGISTER_LINES = `// TODO: W — Register workflow, activity, and Nexus handler
worker.registerWorkflowImplementationTypes(ComplianceWorkflowImpl.class);
worker.registerActivitiesImplementations(new ComplianceActivityImpl(new ComplianceChecker()));
worker.registerNexusServiceImplementation(new ComplianceNexusServiceImpl());`;

const START_COMPLIANCE_WORKER = `mvn compile exec:java@compliance-worker`;

const COMPLIANCE_WORKER_LOG = `Compliance Worker started on: compliance-risk`;

const CREATE_NEXUS_ENDPOINT = `temporal operator nexus endpoint create \\
  --name compliance-endpoint \\
  --target-namespace compliance-namespace \\
  --target-task-queue compliance-risk`;

const ENDPOINT_CREATED_LOG = `Endpoint compliance-endpoint created.`;

const ACTIVITY_STUB_BEFORE = `private final ComplianceActivity complianceActivity =
    Workflow.newActivityStub(ComplianceActivity.class, ACTIVITY_OPTIONS);

// In processPayment():
ComplianceResult compliance = complianceActivity.checkCompliance(compReq);`;

const NEXUS_STUB_AFTER = `private final ComplianceNexusService complianceService = Workflow.newNexusServiceStub(
    ComplianceNexusService.class,
    NexusServiceOptions.newBuilder()
        .setOperationOptions(NexusOperationOptions.newBuilder()
            .setScheduleToCloseTimeout(Duration.ofMinutes(10))
            .build())
        .build());

// In processPayment():
ComplianceResult compliance = complianceService.checkCompliance(compReq);`;

const PAYMENTS_WORKER_REGISTER = `worker.registerWorkflowImplementationTypes(
    WorkflowImplementationOptions.newBuilder()
        .setNexusServiceOptions(Collections.singletonMap(
            "ComplianceNexusService",      // interface name (no package)
            NexusServiceOptions.newBuilder()
                .setEndpoint("compliance-endpoint")  // matches CLI endpoint
                .build()))
        .build(),
    PaymentProcessingWorkflowImpl.class,
    ReviewCallerWorkflowImpl.class);       // both workflows use the same Nexus endpoint`;

const PAYMENTS_WORKER_DELETE = `// DELETE these lines:
ComplianceChecker checker = new ComplianceChecker();
worker.registerActivitiesImplementations(new ComplianceActivityImpl(checker));`;

const PAYMENTS_WORKER_APP_FULL = `package payments.temporal;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowClientOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import io.temporal.worker.WorkflowImplementationOptions;
import io.temporal.workflow.NexusServiceOptions;
import payments.PaymentGateway;
import payments.Shared;
import payments.temporal.activity.PaymentActivityImpl;

import java.util.Collections;

/**
 * DECOUPLED VERSION — Payments worker with Nexus endpoint mapping.
 *
 * Changes from monolith:
 *   1. Workflow registered with NexusServiceOptions (endpoint mapping)
 *   2. ComplianceActivityImpl registration removed (lives on compliance worker now)
 */
public class PaymentsWorkerApp {

    public static void main(String[] args) {
        // C — Connect to Temporal (payments-namespace)
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        WorkflowClientOptions clientOptions = WorkflowClientOptions.newBuilder()
                .setNamespace("payments-namespace")
                .build();
        WorkflowClient client = WorkflowClient.newInstance(service, clientOptions);

        // R — Register with Nexus endpoint mapping
        WorkerFactory factory = WorkerFactory.newInstance(client);
        Worker worker = factory.newWorker(Shared.TASK_QUEUE);

        worker.registerWorkflowImplementationTypes(
                WorkflowImplementationOptions.newBuilder()
                        .setNexusServiceOptions(Collections.singletonMap(
                                "ComplianceNexusService",
                                NexusServiceOptions.newBuilder()
                                        .setEndpoint("compliance-endpoint")
                                        .build()))
                        .build(),
                PaymentProcessingWorkflowImpl.class,
                ReviewCallerWorkflowImpl.class);

        // A — Activities (payment only — compliance moved to its own worker)
        PaymentGateway gateway = new PaymentGateway();
        worker.registerActivitiesImplementations(new PaymentActivityImpl(gateway));

        // L — Launch
        factory.start();

        System.out.println("=========================================================");
        System.out.println("  Payments Worker started on: " + Shared.TASK_QUEUE);
        System.out.println("  Namespace: payments-namespace");
        System.out.println("  Registered: PaymentProcessingWorkflow, ReviewCallerWorkflow, PaymentActivity");
        System.out.println("  Nexus: ComplianceNexusService → compliance-endpoint");
        System.out.println("=========================================================");
    }
}`;

const REVIEW_STARTER_SNIPPET = `ReviewRequest request = new ReviewRequest("TXN-B", true, "Approved after manual review");
ReviewCallerWorkflow workflow = client.newWorkflowStub(ReviewCallerWorkflow.class, workflowOptions);
ComplianceResult result = workflow.submitReview(request);`;

const REVIEW_CALLER_WORKFLOW_SNIPPET = `public ComplianceResult submitReview(ReviewRequest request) {
    return complianceService.submitReview(request);  // Nexus call
}`;

const REVIEW_STARTER_CMD = `mvn compile exec:java@review-starter`;

const BAD_SYNC_HANDLER = `OperationHandler.sync((ctx, details, input) -> {
    WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
    ComplianceWorkflow wf = client.newWorkflowStub(...);
    WorkflowClient.start(wf::run, input);
    return WorkflowStub.fromTyped(wf).getResult(ComplianceResult.class);
});`;

const GOOD_HANDLE_HANDLER = `WorkflowRunOperation.fromWorkflowHandle((ctx, details, input) -> {
    WorkflowClient client = Nexus.getOperationContext().getWorkflowClient();
    ComplianceWorkflow wf = client.newWorkflowStub(...);
    return WorkflowHandle.fromWorkflowMethod(wf::run, input);
});`;

const TRY_ME_KEYFRAMES = `@keyframes tryMePulse {
    0%, 100% { box-shadow: 0 0 12px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.2); }
    50% { box-shadow: 0 0 20px rgba(249,115,22,0.8), 0 0 40px rgba(249,115,22,0.4); }
  }
  @media (max-width: 768px) {
    iframe[title*="Match the Change"],
    iframe[title*="Quick Match"] { display: none !important; }
  }`;

export default function NexusSyncTutorialJavaPage() {
  return (
    <Layout
      title="Decoupling Temporal Services with Nexus and the Java SDK"
      description="Learn how to decouple Temporal services with Nexus and the Java SDK"
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_java.png"
            alt="Decoupling Temporal Services with Nexus and the Java SDK"
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
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Nexus", href: "/tutorials/nexus" },
                  { label: "Decoupling with Nexus and Java" },
                ]}
              />
            </div>

            <IframeAutoResize />

            <p style={{ fontSize: "14px" }}>
              <span style={{ color: "#fff" }}>Author:</span>{" "}
              <img
                src="https://cdn-icons-png.flaticon.com/16/3536/3536505.png"
                alt="LinkedIn"
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  margin: "0 4px 0 0",
                }}
              />
              <a
                href="https://www.linkedin.com/in/nikolayadvolodkin/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Nikolay Advolodkin
              </a>
              {"  "}
              <span style={{ color: "#fff" }}>&nbsp;|&nbsp;</span>
              {"  "}
              <span style={{ color: "#fff" }}>Editor:</span>{" "}
              <img
                src="https://cdn-icons-png.flaticon.com/16/3536/3536505.png"
                alt="LinkedIn"
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  margin: "0 4px 0 0",
                }}
              />
              <a
                href="https://www.linkedin.com/in/zhoua1115/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Angela Zhou
              </a>
            </p>

            <h1 className={styles.title}>
              Decoupling Temporal Services with Nexus and the Java SDK
            </h1>

            <MetaChips items={["~60 minutes", "Intermediate", "Java", "Nexus"]} />

            <p className={styles.intro}>
              In this walkthrough, you'll take a monolithic Temporal application
              - where Payments and Compliance share a single namespace - and
              split it into two independently deployable services connected
              through{" "}
              <a
                href="https://docs.temporal.io/nexus"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal Nexus
              </a>
              .
            </p>
            <p>
              You'll define a shared service contract, implement a synchronous
              Nexus handler, and rewire the caller - all while keeping the exact
              same business logic and workflow behavior. By the end, you'll
              understand how Nexus lets teams decouple without sacrificing
              durability.
            </p>

            <section className={styles.section} id="what-youll-learn">
              <h2 className={styles.sectionTitle}>What you'll learn</h2>
              <ul>
                <li>Register a Nexus Endpoint using the Temporal CLI</li>
                <li>
                  Define a shared Nexus Service contract between teams with{" "}
                  <code>@Service</code> and <code>@Operation</code>
                </li>
                <li>
                  Implement a synchronous Nexus handler with{" "}
                  <code>@ServiceImpl</code> and <code>@OperationImpl</code>
                </li>
                <li>Swap an Activity call for a durable cross-team Nexus call</li>
                <li>Inspect Nexus operations in the Web UI Event History</li>
              </ul>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <p>Before you begin this walkthrough, ensure you have:</p>
              <ul>
                <li>Knowledge of Java</li>
                <li>
                  Knowledge of Temporal including{" "}
                  <a
                    href="https://docs.temporal.io/workflows"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workflows
                  </a>
                  ,{" "}
                  <a
                    href="https://docs.temporal.io/activities"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Activities
                  </a>
                  , and{" "}
                  <a
                    href="https://docs.temporal.io/workers"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Workers
                  </a>
                </li>
                <li>
                  Clone this{" "}
                  <a
                    href="https://github.com/temporalio/edu-nexus-code/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    repository
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="scenario">
              <h2 className={styles.sectionTitle}>Scenario</h2>
              <p>You work at a bank where every payment flows through <strong>three steps</strong>:</p>
              <ol>
                <li><strong>Validate</strong> the payment (amount, accounts)</li>
                <li>
                  <strong>Check compliance</strong> (risk assessment, sanctions
                  screening) - <strong>must pass before payment can execute</strong>
                </li>
                <li><strong>Execute</strong> the payment (call the gateway)</li>
              </ol>
              <p>Two teams split this work:</p>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Owns</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Payments</strong></td>
                    <td>Steps 1 &amp; 3 - validate and execute</td>
                  </tr>
                  <tr>
                    <td><strong>Compliance</strong></td>
                    <td>Step 2 - risk assessment &amp; regulatory checks</td>
                  </tr>
                </tbody>
              </table>

              <h3>The Problem</h3>
              <p>
                Right now, <strong>both teams' code runs on the same Worker</strong>.
                One process. One deployment. One blast radius.
              </p>

              <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #f97316, #fb923c)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "14px",
                    padding: "6px 18px",
                    borderRadius: "20px",
                    letterSpacing: "0.5px",
                    boxShadow:
                      "0 0 12px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.2)",
                    animation: "tryMePulse 2s ease-in-out infinite",
                  }}
                >
                  TRY ME - This diagram is interactive!
                </span>
              </div>
              <style>{TRY_ME_KEYFRAMES}</style>

              <iframe
                src="/html/nexus-decouple.html"
                width="100%"
                height="500"
                scrolling="no"
                style={{ border: "none", borderRadius: "8px", overflow: "hidden" }}
                title="Interactive: Monolith vs Nexus architecture"
              ></iframe>

              <p>
                Compliance isn't optional - every payment must pass risk
                assessment before execution. This hard dependency is dangerous: a
                bug in compliance code at 3 AM crashes payments too, because they
                share the same namespace and blast radius. The obvious fix is to
                split into separate namespaces and use an Activity to call across
                the boundary - wrapping an HTTP client or starting a remote
                Workflow. But then you're managing HTTP clients, routing, error
                mapping, and callback infrastructure yourself.
              </p>

              <h3>The Solution: Temporal Nexus</h3>
              <p>
                <a
                  href="https://docs.temporal.io/nexus"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>Nexus</strong>
                </a>{" "}
                gives you team boundaries <strong>with</strong> durability. Each
                team gets its own Worker, deployment pipeline, and security
                perimeter - while Temporal manages durable, type-safe calls
                between them through a global gateway that handles discovery and
                routing. If the Compliance Worker goes down mid-call, the payment
                workflow just waits. When Compliance comes back, it picks up
                exactly where it left off - no retry logic, no data loss, no 3 AM
                page for the Payments team.
              </p>

              <Admonition type="tip" title="Namespaces and Nexus are architectural decisions">
                <p>
                  The decision to create separate namespaces and whether to use
                  Nexus is a decision of architecture and context, not solely
                  team boundaries. Teams may share a namespace, or a single team
                  may use multiple namespaces. Decide primarily based on
                  isolation requirements, blast radius, and security boundaries -
                  not just org chart lines. For production namespace strategies,
                  see{" "}
                  <a
                    href="https://docs.temporal.io/best-practices/managing-namespace"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Managing Namespaces Best Practices
                  </a>
                  .
                </p>
              </Admonition>

              <p>The best part? The code change is almost invisible:</p>
              <CodeBlock language="java">{NEXUS_CODE_DIFF}</CodeBlock>
              <p>
                Same method name. Same input. Same output. Completely different
                architecture.
              </p>
              <p>
                Here's what happens when the Compliance Worker goes down
                mid-call - and why it doesn't matter:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/nexus-durability.svg`}
                  alt="Nexus Durability svg"
                  className={styles.diagramImage}
                />
              </p>

              <details>
                <summary>
                  Why Nexus over an Activity-wrapped HTTP call or a shared
                  Activity?
                </summary>
                <p>
                  You could split Payments and Compliance into separate
                  namespaces and use an Activity to call across the boundary -
                  wrapping an HTTP client or starting a remote Workflow. But then
                  you're managing HTTP clients, routing, error mapping, and
                  callback infrastructure yourself. With a shared Activity, the
                  Compliance team must ship their code into the Payments Worker -
                  creating governance, versioning, and access control challenges.
                  Think of a Nexus Operation as a built-in system Activity that
                  handles routing, permissions, and efficiently getting responses
                  from long-running operations. Here's how the options compare:
                </p>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Activity wrapping HTTP call</th>
                      <th>Shared Activity (same namespace)</th>
                      <th>Temporal Nexus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Worker goes down</strong></td>
                      <td>Activity retries the HTTP call</td>
                      <td>Same crash domain</td>
                      <td>
                        Other replicas continue; if all down, workflow pauses
                        and auto-resumes
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Retry logic</strong></td>
                      <td>Activity retry policy + HTTP errors</td>
                      <td>Temporal retries within team</td>
                      <td>Built-in across namespace boundary</td>
                    </tr>
                    <tr>
                      <td><strong>Routing</strong></td>
                      <td>You manage service discovery + URLs</td>
                      <td>N/A (same namespace)</td>
                      <td>Built-in, Temporal routes to target namespace</td>
                    </tr>
                    <tr>
                      <td><strong>Permissions</strong></td>
                      <td>Custom auth between services</td>
                      <td>Shared namespace access</td>
                      <td>Scoped cross-namespace permissions</td>
                    </tr>
                    <tr>
                      <td><strong>Type safety</strong></td>
                      <td>OpenAPI + code gen</td>
                      <td>Java interface</td>
                      <td>Shared Java interface</td>
                    </tr>
                    <tr>
                      <td><strong>Human review</strong></td>
                      <td>Custom callback URLs</td>
                      <td>Couples teams together</td>
                      <td>
                        <code>@UpdateMethod</code> on the underlying workflow
                        (async updates not yet supported across Nexus)
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Code independence</strong></td>
                      <td>Separate repos, custom contracts</td>
                      <td>Must ship code into shared Worker</td>
                      <td>
                        Components deploy independently with clear separation of
                        concerns
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Team isolation</strong></td>
                      <td>Separate services, shared API contract</td>
                      <td>Same namespace, shared access</td>
                      <td>Separate namespaces, scoped access</td>
                    </tr>
                    <tr>
                      <td><strong>Code change</strong></td>
                      <td>Update HTTP client + server</td>
                      <td>-</td>
                      <td>
                        One-line stub swap, also{" "}
                        <a
                          href="https://github.com/nexus-rpc/nexus-rpc-gen/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          nexus-rpc-gen
                        </a>{" "}
                        generates code automatically
                      </td>
                    </tr>
                  </tbody>
                </table>
              </details>

              <Admonition type="tip" title="New to Nexus?">
                <p>
                  Try the{" "}
                  <a
                    href="https://docs.temporal.io/nexus"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Nexus Quick Start
                  </a>{" "}
                  for a faster path. Come back here for the full decoupling
                  exercise.
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="overview">
              <h2 className={styles.sectionTitle}>Overview</h2>
              <p>
                <img
                  src={`${IMG_BASE}/architecture-overview.svg`}
                  alt="Architecture Overview: Payments and Compliance teams separated by a Nexus security boundary, with animated data flowing through validate, compliance check, and execute steps"
                  className={styles.diagramImage}
                />
              </p>
              <p>
                <em>
                  The Payments team owns validation and execution (left). The
                  Compliance team owns risk assessment, isolated behind a Nexus
                  boundary (right). Data flows left-to-right - and if the
                  Compliance side goes down mid-check, the payment resumes when
                  it comes back.
                </em>
              </p>

              <details>
                <summary>What You'll Build</summary>
                <p>
                  You'll start with a monolith where everything - the payment
                  workflow, payment activities, and compliance checks - runs on a
                  single Worker. By the end, you'll have two independent Workers:
                  one for Payments and one for Compliance, communicating through
                  a Nexus boundary.
                </p>
                <CodeBlock language="text">{ARCHITECTURE_DIAGRAM}</CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="checkpoint-0">
              <h2 className={styles.sectionTitle}>Checkpoint 0: Run the Monolith</h2>

              <Admonition type="tip">
                <p>
                  Don't forget to clone{" "}
                  <a
                    href="https://github.com/temporalio/edu-nexus-code/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    this repository
                  </a>{" "}
                  for the exercise!
                </p>
              </Admonition>

              <p>
                Before changing anything, let's see the system working. You need{" "}
                <strong>3 terminal windows</strong> and a running Temporal
                server. Navigate into the{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/tree/main/java/decouple-monolith/exercise"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>java/decouple-monolith/exercise</code>
                </a>{" "}
                directory in each terminal.
              </p>

              <p>
                <strong>Terminal 0 - Temporal Server</strong> (if not already
                running):
              </p>
              <CodeBlock language="bash">{START_DEV_SERVER}</CodeBlock>

              <p>
                <strong>Terminal 1 - Create namespaces</strong> (one-time setup):
              </p>
              <CodeBlock language="bash">{CREATE_NAMESPACES}</CodeBlock>

              <p><strong>Terminal 1 - Start the monolith Worker:</strong></p>
              <CodeBlock language="bash">{START_MONOLITH_WORKER}</CodeBlock>

              <p>You should see:</p>
              <CodeBlock language="log">{MONOLITH_WORKER_LOG}</CodeBlock>

              <p><strong>Terminal 2 - Run the starter:</strong></p>
              <CodeBlock language="bash">{RUN_STARTER}</CodeBlock>

              <p>
                <strong>
                  Switch to <code>payments-namespace</code> in the{" "}
                  <a
                    href="http://localhost:8233"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal UI
                  </a>
                </strong>{" "}
                using the namespace selector at the top of the Web UI.
              </p>

              <p>
                <img
                  src={`${IMG_BASE}/new-namespace.png`}
                  alt="Three transactions with different risk levels: TXN-A approved (low risk), TXN-B approved (medium risk), TXN-C declined (high risk, OFAC-sanctioned)"
                  className={styles.diagramImage}
                />
              </p>

              <Admonition type="tip" title="Navigating the Temporal UI across namespaces">
                <p>
                  You created two namespaces earlier. Right now everything runs
                  in <code>payments-namespace</code>, but once you decouple the
                  system, your workflows will span both:
                </p>
                <ul>
                  <li>
                    <strong><code>payments-namespace</code></strong> - where the
                    payment workflows run.
                  </li>
                  <li>
                    <strong><code>compliance-namespace</code></strong> - where
                    the compliance workflows will run after decoupling.
                  </li>
                </ul>
                <p>
                  Use the namespace selector at the top of the{" "}
                  <a
                    href="http://localhost:8233"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal UI
                  </a>{" "}
                  to switch between them. You'll need to check both namespaces
                  throughout the rest of this tutorial.
                </p>
              </Admonition>

              <p><strong>Expected results:</strong></p>
              <table>
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Route</th>
                    <th>Risk</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>TXN-A</code></td>
                    <td>$250</td>
                    <td>US → US</td>
                    <td>LOW</td>
                    <td><code>COMPLETED</code></td>
                  </tr>
                  <tr>
                    <td><code>TXN-B</code></td>
                    <td>$12,000</td>
                    <td>US → UK</td>
                    <td>MEDIUM</td>
                    <td><code>COMPLETED</code></td>
                  </tr>
                  <tr>
                    <td><code>TXN-C</code></td>
                    <td>$75,000</td>
                    <td>US → US</td>
                    <td>HIGH</td>
                    <td><code>DECLINED_COMPLIANCE</code></td>
                  </tr>
                </tbody>
              </table>

              <p>
                <strong>Checkpoint 0 passed</strong> if all 3 transactions
                complete with the expected results. The system works! Now let's
                decouple it.
              </p>

              <Admonition type="warning" title="Stop before continuing">
                <p>
                  <strong>Stop the monolith Worker</strong> by pressing Ctrl+C
                  in <strong>Terminal 1</strong>. The starter in Terminal 2
                  should have already exited on its own.
                </p>
              </Admonition>

              <details>
                <summary>Nexus Building Blocks</summary>
                <p>
                  Before diving into code, here's a quick map of the 4 Nexus
                  concepts you'll encounter:
                </p>
                <CodeBlock language="text">{NEXUS_BUILDING_BLOCKS_DIAGRAM}</CodeBlock>
                <ul>
                  <li>
                    <a
                      href="https://docs.temporal.io/nexus/services"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <strong>Nexus Service</strong>
                    </a>{" "}
                    - A named collection of operations - the contract between
                    teams. In this tutorial, that's the{" "}
                    <code>ComplianceNexusService</code> interface. Think of it
                    like the Activity interface you already have, but shared
                    across services instead of internal to one Worker.
                  </li>
                  <li>
                    <a
                      href="https://docs.temporal.io/nexus/operations"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <strong>Nexus Operation</strong>
                    </a>{" "}
                    - A single callable method on a Service, marked with{" "}
                    <code>@Operation</code> (e.g., <code>checkCompliance</code>).
                    This is the Nexus equivalent of an Activity method - the
                    actual work the other team exposes.
                  </li>
                  <li>
                    <a
                      href="https://docs.temporal.io/nexus/endpoints"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <strong>Nexus Endpoint</strong>
                    </a>{" "}
                    - A named routing rule that connects a caller to the right
                    Namespace and Task Queue, so the caller doesn't need to know
                    where the handler lives. You create{" "}
                    <code>compliance-endpoint</code> and point it at the{" "}
                    <code>compliance-risk</code> task queue.
                  </li>
                  <li>
                    <a
                      href="https://docs.temporal.io/nexus/registry"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <strong>Nexus Registry</strong>
                    </a>{" "}
                    - The directory in Temporal where all Endpoints are
                    registered. You register the endpoint once; callers look it
                    up by name.
                  </li>
                </ul>
              </details>

              <details>
                <summary>Quick match - test yourself!</summary>
                <p>
                  Can you match each Nexus concept to what it represents in our
                  payments scenario?
                </p>
                <iframe
                  src="/html/nexus-quick-match.html"
                  width="100%"
                  height="580"
                  style={{ border: "none", borderRadius: "8px" }}
                  title="Nexus Building Blocks - Quick Match"
                ></iframe>
              </details>

              <details>
                <summary>The TODOs</summary>
                <p>
                  <strong>Pre-provided:</strong> The{" "}
                  <a
                    href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/workflow/ComplianceWorkflow.java"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>ComplianceWorkflow</code>
                  </a>{" "}
                  interface and{" "}
                  <a
                    href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/workflow/ComplianceWorkflowImpl.java"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    implementation
                  </a>{" "}
                  are already complete in the exercise. They use Temporal
                  patterns you've already seen -{" "}
                  <code>@WorkflowMethod</code>, <code>@UpdateMethod</code>, and{" "}
                  <code>Workflow.await()</code>. Your work starts at{" "}
                  <strong>TODO 1</strong> - the Nexus-specific parts.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>File</th>
                      <th>Operation</th>
                      <th>Key Concept</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>1</strong></td>
                      <td>
                        <a
                          href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/shared/nexus/ComplianceNexusService.java"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <code>shared/nexus/ComplianceNexusService.java</code>
                        </a>
                      </td>
                      <td>Your work</td>
                      <td>
                        <code>@Service</code> + <code>@Operation</code> on both
                        operations
                      </td>
                    </tr>
                    <tr>
                      <td><strong>2</strong></td>
                      <td>
                        <a
                          href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/ComplianceNexusServiceImpl.java"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <code>compliance/temporal/ComplianceNexusServiceImpl.java</code>
                        </a>
                      </td>
                      <td>Your work</td>
                      <td>
                        <code>fromWorkflowHandle</code> (async) +{" "}
                        <code>OperationHandler.sync</code> (sync)
                      </td>
                    </tr>
                    <tr>
                      <td><strong>3</strong></td>
                      <td>
                        <a
                          href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/ComplianceWorkerApp.java"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <code>compliance/temporal/ComplianceWorkerApp.java</code>
                        </a>
                      </td>
                      <td>Your work</td>
                      <td>Register workflow + Activity + Nexus handler</td>
                    </tr>
                    <tr>
                      <td><strong>4</strong></td>
                      <td>
                        <a
                          href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/payments/temporal/PaymentProcessingWorkflowImpl.java"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <code>payments/temporal/PaymentProcessingWorkflowImpl.java</code>
                        </a>
                      </td>
                      <td>Modify</td>
                      <td>Replace Activity stub → Nexus stub</td>
                    </tr>
                    <tr>
                      <td><strong>5</strong></td>
                      <td>
                        <a
                          href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/payments/temporal/PaymentsWorkerApp.java"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <code>payments/temporal/PaymentsWorkerApp.java</code>
                        </a>
                      </td>
                      <td>Modify</td>
                      <td>
                        Add <code>NexusServiceOptions</code>, remove{" "}
                        <code>ComplianceActivity</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  You'll work through these files in order: define the service
                  interface (1), implement the handlers (2), register everything
                  in the Worker (3), then update the caller to use Nexus instead
                  of a direct Activity (4-5). After that, you'll run the full
                  system end-to-end.
                </p>
              </details>
            </section>

            <section className={styles.section} id="what-were-building">
              <h2 className={styles.sectionTitle}>What we're building</h2>
              <h3>Class Interaction Flow</h3>
              <p>
                <img
                  src={`${IMG_BASE}/class-interaction.svg`}
                  alt="Class Interaction Flow"
                  className={styles.diagramImage}
                />
              </p>
            </section>

            <section className={styles.section} id="compliance-workflow">
              <h2 className={styles.sectionTitle}>
                The Compliance Workflow (already in the exercise)
              </h2>
              <p>
                <strong>Files:</strong>{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/workflow/ComplianceWorkflow.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>compliance/temporal/workflow/ComplianceWorkflow.java</code>
                </a>{" "}
                and{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/workflow/ComplianceWorkflowImpl.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>ComplianceWorkflowImpl.java</code>
                </a>
              </p>

              <details>
                <summary><code>ComplianceWorkflowImpl</code> (condensed)</summary>
                <CodeBlock language="java">{COMPLIANCE_WORKFLOW_IMPL}</CodeBlock>
              </details>

              <p>
                Read the code - you'll see the human-in-the-loop pattern you'll
                wire up through Nexus later. The three methods:
              </p>
              <ul>
                <li>
                  <strong><code>run()</code></strong> - Scores risk via Activity,
                  sleeps 10s (for the durability demo), then either auto-decides
                  (LOW/HIGH) or durably waits for human review (MEDIUM).
                </li>
                <li>
                  <strong><code>review()</code></strong> - Receives the
                  reviewer's approve/deny decision, stores it, and unblocks{" "}
                  <code>run()</code>.
                </li>
                <li>
                  <strong><code>validateReview()</code></strong> - Guards against
                  reviews arriving before the workflow is waiting or after a
                  decision was already made.
                </li>
              </ul>

              <Admonition type="note">
                <p>
                  <strong>Why a workflow, not just an Activity?</strong> Using a
                  workflow unlocks{" "}
                  <a
                    href="https://www.javadoc.io/doc/io.temporal/temporal-sdk/latest/io/temporal/workflow/UpdateMethod.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>@UpdateMethod</code>
                  </a>{" "}
                  for MEDIUM-risk transactions - the workflow can wait durably
                  for a human reviewer's decision. A plain Activity can't do
                  that. In the future, simple cases might just use an Activity,
                  but a workflow gives you durability and human escalation for
                  free.
                </p>
              </Admonition>

              <blockquote>
                <p><strong>Your work starts below at TODO 1.</strong></p>
              </blockquote>
            </section>

            <section className={styles.section} id="todo-1">
              <h2 className={styles.sectionTitle}>
                TODO 1: Create the Nexus Service Interface
              </h2>
              <p>
                <strong>File:</strong>{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/shared/nexus/ComplianceNexusService.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>shared/nexus/ComplianceNexusService.java</code>
                </a>
              </p>
              <p>
                This is the <strong>shared contract</strong> between teams -
                like an OpenAPI spec, but durable. Both teams depend on this
                interface.
              </p>

              <p><strong>What to add for TODO 1:</strong></p>
              <ol>
                <li>
                  <code>@Service</code> annotation on the interface - this
                  registers the interface as a Nexus Service so Temporal knows
                  it's a cross-team contract, not just a regular Java interface.
                </li>
                <li>
                  <code>@Operation</code> annotation on <strong>both</strong>{" "}
                  methods - this marks each method as a callable Nexus
                  Operation. Without it, the method is just a Java method
                  signature that Temporal won't expose through the Nexus
                  boundary.
                </li>
              </ol>

              <Admonition type="warning">
                <p>
                  The Nexus runtime validates <strong>all</strong> methods in a{" "}
                  <code>@Service</code> interface at Worker startup. Every
                  method must have <code>@Operation</code> - even ones you won't
                  call right away - or the Worker will fail with{" "}
                  <code>Missing @Operation annotation</code>.
                </p>
              </Admonition>

              <p><strong>Pattern to follow:</strong></p>
              <CodeBlock language="java">{NEXUS_SERVICE_INTERFACE}</CodeBlock>

              <Admonition type="tip">
                <p>
                  Look in the{" "}
                  <a
                    href="https://github.com/temporalio/edu-nexus-code/tree/main/java/decouple-monolith/solution"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    solution directory
                  </a>{" "}
                  of the exercise repository if you need a hint!
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="todo-2">
              <h2 className={styles.sectionTitle}>
                TODO 2: Implement the Nexus Handlers
              </h2>
              <p>
                <strong>File:</strong>{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/ComplianceNexusServiceImpl.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>compliance/temporal/ComplianceNexusServiceImpl.java</code>
                </a>
              </p>
              <p>
                This class implements <strong>both</strong> Nexus operations.
                You'll use two different handler patterns - one for starting a
                long-running workflow, one for interacting with an
                already-running workflow.
              </p>

              <Admonition type="warning">
                <p>
                  Just like the interface needs <code>@Operation</code> on every
                  method, the handler class needs an <code>@OperationImpl</code>{" "}
                  method for every operation - or the Worker will fail at
                  startup with <code>Missing handlers for service operations</code>.
                </p>
              </Admonition>

              <p><strong>What to add for TODO 2:</strong></p>
              <ol>
                <li>
                  <code>@ServiceImpl(service = ComplianceNexusService.class)</code>{" "}
                  on the class - this links the handler to its service interface
                  so Temporal can route incoming Nexus operations to the correct
                  implementation.
                </li>
                <li>
                  <code>@OperationImpl</code> on each handler method - this
                  marks the method as the handler for a specific Nexus
                  operation. Without it, Temporal won't know which method
                  handles which operation.
                </li>
              </ol>

              <details>
                <summary>
                  Complete implementation of <code>ComplianceNexusServiceImpl.java</code>
                </summary>
                <CodeBlock language="java">{NEXUS_SERVICE_IMPL}</CodeBlock>
              </details>

              <p>This class has two handlers that use different patterns:</p>
              <ul>
                <li>
                  <strong><code>checkCompliance</code></strong> - Uses{" "}
                  <code>WorkflowRunOperation.fromWorkflowHandle</code> to start a
                  long-running workflow. The handle binds the Nexus operation to
                  a workflow ID, so retries reuse the existing workflow instead
                  of creating duplicates.
                </li>
                <li>
                  <strong><code>submitReview</code></strong> - Uses{" "}
                  <code>OperationHandler.sync</code> to interact with an
                  already-running workflow. It looks up{" "}
                  <code>compliance-{"{transactionId}"}</code> and sends a review
                  Update. Sync handlers must complete within 10 seconds.
                </li>
              </ul>

              <Admonition type="info" title="Signal vs Update for Human Review">
                <p>
                  This tutorial uses an <code>@UpdateMethod</code> for{" "}
                  <code>submitReview</code> because it returns the compliance
                  result synchronously - the caller gets the answer immediately.
                </p>
                <p>
                  However, an <code>@UpdateMethod</code> requires the Worker to
                  be running at the time of the call; if the Worker is down, the
                  Update will fail. An alternative is to use a{" "}
                  <a
                    href="https://docs.temporal.io/workflows#signal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Signal
                  </a>{" "}
                  instead, which is delivered to the workflow's Event History
                  even when the Worker is offline. The trade-off: Signals are
                  fire-and-forget - the caller doesn't get a return value, so
                  you'd need a separate mechanism (e.g., a Query or another
                  Nexus operation) to retrieve the result.
                </p>
              </Admonition>

              <p>
                <img
                  src={`${IMG_BASE}/nexus-handle-retry.svg`}
                  alt="Nexus handle retry diagram: first call starts a workflow and returns a handle, retries reuse the same workflow instead of creating duplicates"
                  className={styles.diagramImage}
                />
              </p>

              <details>
                <summary>Key differences between the two handlers:</summary>
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th><code>checkCompliance</code></th>
                      <th><code>submitReview</code></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Pattern</td>
                      <td><code>fromWorkflowHandle</code></td>
                      <td><code>OperationHandler.sync</code></td>
                    </tr>
                    <tr>
                      <td>What it does</td>
                      <td>Starts a new long-running workflow</td>
                      <td>Sends Update to an existing workflow</td>
                    </tr>
                    <tr>
                      <td>Durability</td>
                      <td>Async - workflow runs independently</td>
                      <td>Sync - must complete in 10 seconds</td>
                    </tr>
                    <tr>
                      <td>Retry behavior</td>
                      <td>Retries reuse the same workflow</td>
                      <td>Update is idempotent if workflow ID is stable</td>
                    </tr>
                  </tbody>
                </table>
              </details>

              <h3>Quick Check</h3>

              <details>
                <summary>
                  Q1: What does{" "}
                  <code>@ServiceImpl(service = ComplianceNexusService.class)</code>{" "}
                  tell Temporal?
                </summary>
                <p>
                  <code>@ServiceImpl</code> links the handler class to its Nexus
                  service interface. Temporal uses this to route incoming Nexus
                  operations to the correct handler.
                </p>
              </details>

              <details>
                <summary>
                  Q2: Why does the handler start a workflow instead of calling{" "}
                  <code>ComplianceChecker.checkCompliance()</code> directly?
                </summary>
                <p>
                  Handlers should only use Temporal primitives (workflow starts,
                  queries, updates). Business logic belongs in activities, which
                  are invoked by workflows. This keeps the handler thin and the
                  architecture consistent.
                </p>
              </details>
            </section>

            <section className={styles.section} id="todo-3">
              <h2 className={styles.sectionTitle}>
                TODO 3: Create the Compliance Worker
              </h2>
              <p>
                <strong>File:</strong>{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/compliance/temporal/ComplianceWorkerApp.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>compliance/temporal/ComplianceWorkerApp.java</code>
                </a>
              </p>
              <p>
                Standard <strong>CRWL</strong> pattern, but now with{" "}
                <strong>three registrations</strong>. Open the file - you'll see
                the Connect, Factory, and Launch steps are already written. The
                registration lines are commented out.
              </p>
              <CodeBlock language="text">{CRWL_PATTERN}</CodeBlock>

              <p>
                <strong>Uncomment the three lines</strong> inside the "Wire"
                section:
              </p>
              <CodeBlock language="java">{REGISTER_LINES}</CodeBlock>

              <p>
                The first two are patterns you already know. The third is new -{" "}
                <code>registerNexusServiceImplementation</code> registers your
                Nexus handler so the Worker can receive incoming Nexus calls.
                Same shape, different method name.
              </p>
              <p>
                The <strong>task queue name</strong> is{" "}
                <code>compliance-risk</code> - remember this value. You'll use
                it again in Checkpoint 1.5 when you create the Nexus endpoint.
                The endpoint routes incoming Nexus calls to a task queue; the
                Worker polls that same queue to pick them up. They must match.
              </p>
            </section>

            <section className={styles.section} id="checkpoint-1">
              <h2 className={styles.sectionTitle}>
                Checkpoint 1: Compliance Worker Starts
              </h2>

              <p><strong>Terminal 1 - Start the Compliance Worker:</strong></p>
              <CodeBlock language="bash">{START_COMPLIANCE_WORKER}</CodeBlock>

              <p><strong>Checkpoint 1 passed</strong> if you see:</p>
              <CodeBlock language="log">{COMPLIANCE_WORKER_LOG}</CodeBlock>

              <blockquote>
                <p>
                  <strong>Keep the compliance Worker running</strong> - you'll
                  need it for Checkpoint 2.
                </p>
              </blockquote>

              <Admonition type="tip">
                <p>
                  <strong>Are you enjoying this tutorial?</strong>{" "}
                  <a
                    href="https://pages.temporal.io/get-updates-education"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sign up here
                  </a>{" "}
                  to get notified when we drop new educational content!
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="checkpoint-1-5">
              <h2 className={styles.sectionTitle}>
                Checkpoint 1.5: Create the Nexus Endpoint
              </h2>
              <p>
                Now that the compliance side is built, register the Nexus
                endpoint with Temporal. This tells Temporal:{" "}
                <em>
                  "When someone calls <code>compliance-endpoint</code>, route it
                  to the <code>compliance-risk</code> task queue in{" "}
                  <code>compliance-namespace</code>."
                </em>
              </p>

              <CodeBlock language="bash">{CREATE_NEXUS_ENDPOINT}</CodeBlock>

              <p>You should see:</p>
              <CodeBlock language="log">{ENDPOINT_CREATED_LOG}</CodeBlock>

              <blockquote>
                <p>
                  <strong>Analogy:</strong> This is like adding a contact to
                  your phone. The endpoint name is the contact name; the task
                  queue + namespace is the phone number. You only do this once.
                </p>
              </blockquote>

              <p>
                Without this, the Payments Worker (TODO 5) won't know where to
                route <code>ComplianceNexusService</code> calls.
              </p>
            </section>

            <section className={styles.section} id="todo-4">
              <h2 className={styles.sectionTitle}>
                TODO 4: Replace Activity Stub with Nexus Stub
              </h2>
              <p>
                <strong>File:</strong>{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/payments/temporal/PaymentProcessingWorkflowImpl.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>payments/temporal/PaymentProcessingWorkflowImpl.java</code>
                </a>
              </p>
              <p>
                You're replacing the Activity stub with a Nexus stub - same
                method call, but it now crosses a namespace boundary. The
                compliance check is a blocking dependency - the workflow cannot
                proceed to <code>executePayment</code> until{" "}
                <code>checkCompliance</code> returns a passing result. With
                Nexus, this dependency is preserved with full durability across
                the team boundary.
              </p>

              <p><strong>What to change for TODO 4:</strong></p>
              <ol>
                <li>
                  Replace the <code>ComplianceActivity</code> Activity stub with
                  a <code>ComplianceNexusService</code> Nexus stub - this swaps
                  the Activity call for a durable cross-namespace Nexus call.
                  The stub uses <code>Workflow.newNexusServiceStub</code>{" "}
                  instead of <code>Workflow.newActivityStub</code>.
                </li>
                <li>
                  Rename the variable: <code>compliance<strong>Activity</strong></code>{" "}
                  becomes <code>compliance<strong>Service</strong></code> - so{" "}
                  <code>complianceActivity.checkCompliance(compReq)</code>{" "}
                  becomes{" "}
                  <code>complianceService.checkCompliance(compReq)</code>. Same
                  method name, same input, same output.
                </li>
              </ol>

              <p><strong>BEFORE:</strong></p>
              <CodeBlock language="java">{ACTIVITY_STUB_BEFORE}</CodeBlock>

              <p><strong>AFTER:</strong></p>
              <CodeBlock language="java">{NEXUS_STUB_AFTER}</CodeBlock>

              <ul>
                <li>
                  <code>Workflow.newNexusServiceStub</code> replaces{" "}
                  <code>Workflow.newActivityStub</code> - the workflow now makes
                  a durable Nexus call across the namespace boundary.
                </li>
                <li>
                  <code>NexusServiceOptions</code> with{" "}
                  <code>scheduleToCloseTimeout</code> replaces{" "}
                  <code>ActivityOptions</code> with{" "}
                  <code>startToCloseTimeout</code> - same idea (how long to
                  wait), different scope (cross-namespace vs same namespace).
                </li>
                <li>
                  The method call (<code>checkCompliance</code>) stays identical
                  - the workflow doesn't know or care that the implementation
                  moved to a different Worker.
                </li>
              </ul>

              <p>
                <strong>What changed:</strong> Drag each Nexus replacement to
                its monolith equivalent:
              </p>

              <iframe
                src="/html/nexus-match-change.html"
                width="100%"
                height="680"
                style={{ border: "none", borderRadius: "8px" }}
                title="Match the Change - Monolith to Nexus"
              ></iframe>

              <Admonition type="tip">
                <p>
                  <strong>Your feedback shapes what we make next</strong>. Use
                  the Feedback widget on the side to tell us what's working and
                  what's missing!
                </p>
              </Admonition>
            </section>

            <section className={styles.section} id="todo-5">
              <h2 className={styles.sectionTitle}>
                TODO 5: Update the Payments Worker
              </h2>
              <p>
                <strong>File:</strong>{" "}
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/payments/temporal/PaymentsWorkerApp.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code>payments/temporal/PaymentsWorkerApp.java</code>
                </a>
              </p>

              <p><strong>What to change for TODO 5:</strong></p>
              <ol>
                <li>
                  Replace the simple{" "}
                  <code>registerWorkflowImplementationTypes</code> call with one
                  that includes <code>NexusServiceOptions</code> - this maps the{" "}
                  <code>ComplianceNexusService</code> interface to the{" "}
                  <code>compliance-endpoint</code> you created in Checkpoint
                  1.5, so the Worker knows where to route Nexus calls. Register
                  both <code>PaymentProcessingWorkflowImpl</code> and{" "}
                  <code>ReviewCallerWorkflowImpl</code> in the same call.
                </li>
                <li>
                  Delete the <code>ComplianceActivityImpl</code> registration -
                  compliance now runs on its own Worker via Nexus, so the
                  Payments Worker no longer needs it.
                </li>
              </ol>

              <p>
                <strong>CHANGE 1:</strong> Register both workflows with{" "}
                <code>NexusServiceOptions</code> (maps service to endpoint):
              </p>
              <CodeBlock language="java">{PAYMENTS_WORKER_REGISTER}</CodeBlock>

              <p>
                Notice the workflow (TODO 4) never references this endpoint -
                only the Worker does. This keeps the workflow portable: you can
                point it at a different endpoint in staging vs production
                without changing workflow code.
              </p>

              <p>
                <strong>CHANGE 2:</strong> Remove{" "}
                <code>ComplianceActivityImpl</code> registration:
              </p>
              <CodeBlock language="java">{PAYMENTS_WORKER_DELETE}</CodeBlock>

              <blockquote>
                <p>
                  <strong>Analogy:</strong> You're removing the compliance
                  department from your building and adding a phone extension to
                  their new office. The workflow dials the same number (
                  <code>checkCompliance</code>), but the call now routes across
                  the street.
                </p>
              </blockquote>

              <details>
                <summary>
                  New <code>PaymentsWorkerApp.java</code> Code
                </summary>
                <CodeBlock language="java">{PAYMENTS_WORKER_APP_FULL}</CodeBlock>
              </details>
            </section>

            <section className={styles.section} id="checkpoint-2">
              <h2 className={styles.sectionTitle}>
                Checkpoint 2: Decoupled End-to-End (Automated Decisions)
              </h2>
              <p>You need <strong>4 terminal windows</strong> now:</p>

              <p><strong>Terminal 1:</strong> Temporal server (already running)</p>

              <p>
                <strong>Terminal 2 - Compliance Worker</strong> (already running
                from Checkpoint 1, or restart):
              </p>
              <CodeBlock language="bash">{START_COMPLIANCE_WORKER}</CodeBlock>

              <p>
                <strong>Terminal 3 - Payments Worker</strong> (restart with your
                changes):
              </p>
              <CodeBlock language="bash">{START_MONOLITH_WORKER}</CodeBlock>

              <p><strong>Terminal 4 - Starter:</strong></p>
              <CodeBlock language="bash">{RUN_STARTER}</CodeBlock>

              <ul>
                <li>
                  <strong>TXN-A and TXN-C</strong> take ~10 seconds each (the
                  compliance workflow includes a durable sleep for the
                  Checkpoint 3 demo).
                </li>
                <li>
                  <strong>TXN-B</strong> is MEDIUM risk - its workflow durably
                  waits (<code>Workflow.await()</code>) until a human reviewer
                  submits a decision. It will stay waiting until you complete
                  the human review path after Checkpoint 3.
                </li>
              </ul>

              <p>
                The starter runs transactions in series, so{" "}
                <strong>TXN-B will block the terminal</strong> while it waits
                for human review. This is expected - TXN-C won't start yet.
              </p>

              <p>
                <img
                  src={`${IMG_BASE}/human-in-the-loop.svg`}
                  alt="TXN-B human-in-the-loop flow: Payment workflow calls compliance via Nexus, compliance scores MEDIUM and durably waits, human reviewer approves via Nexus Update, workflow resumes"
                  className={styles.diagramImage}
                />
              </p>

              <p>
                Verify in the{" "}
                <a
                  href="http://localhost:8233"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal UI
                </a>
                : switch to <strong><code>payments-namespace</code></strong>{" "}
                and <strong><code>compliance-namespace</code></strong> to
                confirm the following. <strong>Checkpoint 2 passed</strong> if
                you see:
              </p>
              <ol>
                <li>
                  <strong>TXN-A</strong> completes with <code>COMPLETED</code>{" "}
                  (~10s, auto-approved).
                </li>
                <li>
                  <strong>TXN-B</strong> is running - the starter hangs, waiting
                  for a human review decision. This is correct. Leave it
                  running. In <code>compliance-namespace</code>, you'll see the
                  corresponding compliance workflow waiting too.
                </li>
                <li>
                  <strong>TXN-C</strong> has not started yet - it will run after
                  TXN-B completes.
                </li>
              </ol>
              <p>
                Two Workers, two blast radii, two independent teams. The
                automated compliance path works end-to-end through Nexus.
              </p>
            </section>

            <section className={styles.section} id="checkpoint-3">
              <h2 className={styles.sectionTitle}>
                Checkpoint 3: Durability Across the Boundary
              </h2>
              <p>
                This is where it gets fun. Let's prove that Nexus is{" "}
                <strong>durable</strong>.
              </p>

              <blockquote>
                <p>
                  <strong>Note:</strong> In this tutorial, you run a single
                  Worker replica, so killing it stops all compliance processing.
                  In production, you'd run multiple replicas across hosts - if
                  one goes down, the others keep processing. This checkpoint
                  demonstrates the worst case: <em>all</em> replicas are gone.
                  Even then, no data is lost.
                </p>
              </blockquote>

              <Admonition type="warning" title="Clean up before starting">
                <p>
                  Terminate any running workflows from Checkpoint 2 - including
                  TXN-B, which is still waiting for human review. You must
                  terminate it in <strong>both</strong>{" "}
                  <code>payments-namespace</code> and{" "}
                  <code>compliance-namespace</code>. Then stop both Workers
                  (Ctrl+C in Terminals 2 and 3).
                </p>
              </Admonition>

              <p>
                <strong>Read this section fully before starting</strong> -
                you'll have a ~10-second window to kill a Worker mid-flight, so
                know the plan before you run the starter.
              </p>

              <p>
                <strong>The plan:</strong> Start both Workers, run the starter,
                then kill the compliance Worker during TXN-A's 10-second
                durable sleep. This proves that Nexus operations survive a
                Worker outage.
              </p>

              <p><strong>Terminal 1:</strong> Temporal server (already running)</p>

              <p><strong>Terminal 2 - Start the Compliance Worker:</strong></p>
              <CodeBlock language="bash">{START_COMPLIANCE_WORKER}</CodeBlock>

              <p><strong>Terminal 3 - Start the Payments Worker:</strong></p>
              <CodeBlock language="bash">{START_MONOLITH_WORKER}</CodeBlock>

              <p><strong>Terminal 4 - Run the starter:</strong></p>
              <CodeBlock language="bash">{RUN_STARTER}</CodeBlock>

              <p>
                The starter runs TXN-A first. TXN-A has a 10-second durable
                sleep in <code>ComplianceWorkflowImpl</code>.{" "}
                <strong>During that 10-second window:</strong>
              </p>

              <p><strong>Terminal 2 - Kill the compliance Worker (Ctrl+C)</strong></p>

              <p>Now watch what happens:</p>
              <ol>
                <li>
                  <strong>Terminal 3 (starter)</strong> - hangs. It's waiting for
                  the TXN-A result. No crash, no error.
                </li>
                <li>
                  <strong>Temporal UI</strong> (<code>http://localhost:8233</code>)
                  - in <strong><code>payments-namespace</code></strong>, open
                  the <code>payment-TXN-A</code> workflow. You'll see a{" "}
                  <strong>Pending Nexus Operation</strong> event with a{" "}
                  <strong>Started</strong> badge and an increasing attempt
                  count. Temporal knows the compliance Worker is gone and is
                  retrying until it comes back.
                </li>
              </ol>

              <p>
                <a
                  href={`${IMG_BASE}/backing-off-nexus-operation.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`${IMG_BASE}/backing-off-nexus-operation.png`}
                    alt="Temporal UI showing Nexus operation in backing off state after compliance Worker is killed"
                    width="100%"
                  />
                </a>
              </p>

              <p><strong>Terminal 2 - Restart the compliance Worker:</strong></p>
              <CodeBlock language="bash">{START_COMPLIANCE_WORKER}</CodeBlock>

              <p>Now watch:</p>
              <ol start={3}>
                <li>
                  <strong>Terminal 2 (compliance Worker)</strong> - picks up the
                  work immediately. You'll see{" "}
                  <code>[ComplianceChecker] Evaluating TXN-A</code> in the logs.
                </li>
                <li>
                  <strong>Terminal 3 (starter)</strong> - TXN-A completes with{" "}
                  <code>COMPLETED</code>. The starter moves on to TXN-B and
                  TXN-C as if nothing happened.
                </li>
                <li>
                  <strong>Temporal UI</strong> - check both namespaces. In{" "}
                  <code>payments-namespace</code>, the Nexus operation shows as
                  completed. In <code>compliance-namespace</code>, the
                  compliance workflow completed successfully. No retries of the
                  payment workflow. No duplicate compliance checks. The system
                  just resumed.
                </li>
              </ol>

              <blockquote>
                <p>
                  <strong>Checkpoint 3 passed</strong> if TXN-A completes
                  successfully after you restart the compliance Worker.
                </p>
              </blockquote>

              <p>
                <strong>What just happened:</strong> The payment workflow didn't
                crash, timeout, or lose data - it just waited. When the
                compliance Worker came back, Temporal automatically routed the
                pending Nexus operation to it. Durability extends across the
                team boundary - that's the whole point of Nexus. With multiple
                replicas, another instance would pick up the work immediately
                with no visible interruption.
              </p>
            </section>

            <section className={styles.section} id="human-review">
              <h2 className={styles.sectionTitle}>
                Complete the Human Review Path
              </h2>
              <p>
                You already implemented both handlers in TODO 2 -{" "}
                <code>checkCompliance</code> (async,{" "}
                <code>fromWorkflowHandle</code>) and <code>submitReview</code>{" "}
                (sync, <code>OperationHandler.sync</code>). Now let's use{" "}
                <code>submitReview</code> to approve TXN-B's MEDIUM-risk
                transaction.
              </p>

              <h3>How the review path works</h3>
              <p>
                Three pre-provided files work together to send a human review
                decision through the Nexus boundary:
              </p>

              <p>
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/payments/temporal/ReviewStarter.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong><code>payments/temporal/ReviewStarter.java</code></strong>
                </a>{" "}
                - Client code that starts the review workflow:
              </p>
              <CodeBlock language="java">{REVIEW_STARTER_SNIPPET}</CodeBlock>

              <p>
                <a
                  href="https://github.com/temporalio/edu-nexus-code/blob/main/java/decouple-monolith/exercise/src/main/java/payments/temporal/ReviewCallerWorkflowImpl.java"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <strong>
                    <code>payments/temporal/ReviewCallerWorkflowImpl.java</code>
                  </strong>
                </a>{" "}
                - A thin workflow that calls <code>submitReview</code> through
                the Nexus stub:
              </p>
              <CodeBlock language="java">{REVIEW_CALLER_WORKFLOW_SNIPPET}</CodeBlock>

              <p>
                <strong>
                  Why a workflow instead of calling{" "}
                  <code>temporal workflow update</code> directly?
                </strong>{" "}
                Team boundaries. The Payments team doesn't need to know the
                Compliance team's workflow IDs or internal method names. The
                review goes through the same Nexus endpoint as{" "}
                <code>checkCompliance</code> - the Compliance team controls
                what's exposed.
              </p>

              <p>The full flow:</p>
              <ol>
                <li>
                  <code>ReviewStarter</code> starts a{" "}
                  <code>ReviewCallerWorkflow</code> in the{" "}
                  <strong>payments</strong> namespace
                </li>
                <li>
                  The workflow calls{" "}
                  <code>complianceService.submitReview()</code> via the Nexus
                  stub
                </li>
                <li>
                  Nexus routes to the Compliance team's sync handler (TODO 2b)
                </li>
                <li>
                  The handler looks up the <code>compliance-TXN-B</code>{" "}
                  workflow and sends the <code>review()</code> Update
                </li>
                <li>
                  The <code>ComplianceWorkflow</code> unblocks, returns the
                  result back through Nexus
                </li>
              </ol>

              <h3>Checkpoint: Approve TXN-B via Nexus</h3>
              <p>
                Make sure both Workers are running and TXN-B is still waiting
                from Checkpoint 2. If you need to restart, run the starter
                again first.
              </p>

              <p><strong>Terminal 4 - Approve TXN-B via Nexus:</strong></p>
              <CodeBlock language="bash">{REVIEW_STARTER_CMD}</CodeBlock>

              <blockquote>
                <p>
                  <strong>Want to deny instead?</strong> Edit{" "}
                  <code>ReviewStarter.java</code>, change <code>true</code> to{" "}
                  <code>false</code>, and re-run.
                </p>
              </blockquote>

              <p>
                You should see the review result returned in Terminal 4, and
                back in Terminal 3, TXN-B completes with <code>COMPLETED</code>.
              </p>

              <p>
                <strong>Checkpoint passed</strong> if TXN-B completes with{" "}
                <code>COMPLETED</code> after running the review starter.
              </p>
            </section>

            <section className={styles.section} id="quiz">
              <h2 className={styles.sectionTitle}>Quiz</h2>
              <p>Test your understanding before moving on:</p>

              <details>
                <summary>
                  Q1: Where is the Nexus endpoint name (
                  <code>compliance-endpoint</code>) configured?
                </summary>
                <p>
                  In <code>PaymentsWorkerApp</code>, via{" "}
                  <code>NexusServiceOptions</code> →{" "}
                  <code>setEndpoint("compliance-endpoint")</code>. The workflow
                  only knows the service interface. The Worker knows the
                  endpoint. This separation keeps the workflow portable.
                </p>
              </details>

              <details>
                <summary>
                  Q2: What happens if the Compliance Worker is down when the
                  Payments workflow calls <code>checkCompliance()</code>?
                </summary>
                <p>
                  The Nexus operation will be retried by Temporal until the{" "}
                  <code>scheduleToCloseTimeout</code> expires (10 minutes in our
                  case). If the Compliance Worker comes back within that window,
                  the operation completes successfully. The Payment workflow
                  just waits - no crash, no data loss.
                </p>
              </details>

              <details>
                <summary>
                  Q3: What's the difference between <code>@Service</code>
                  <code>/</code>
                  <code>@Operation</code> and <code>@ServiceImpl</code>
                  <code>/</code>
                  <code>@OperationImpl</code>?
                </summary>
                <ul>
                  <li>
                    <code>@Service</code> / <code>@Operation</code> go on the
                    interface - the shared contract both teams depend on
                  </li>
                  <li>
                    <code>@ServiceImpl</code> / <code>@OperationImpl</code> go
                    on the handler class - the implementation that only the
                    Compliance team owns
                  </li>
                </ul>
                <p>
                  Think of it as: the interface is the menu (shared), the
                  handler is the kitchen (private).
                </p>
              </details>

              <details>
                <summary>
                  Q4: What's wrong with using <code>OperationHandler.sync()</code>{" "}
                  to back a Nexus operation with a long-running workflow?
                </summary>
                <p>
                  <code>sync()</code> starts a workflow and blocks for its
                  result in a single handler call. If the Nexus operation
                  retries (which happens during timeouts or transient failures),
                  the handler runs again from scratch - starting a duplicate
                  workflow each time.
                </p>
                <p>
                  The fix is{" "}
                  <code>WorkflowRunOperation.fromWorkflowHandle()</code>, which
                  returns a handle (like a receipt number) binding the Nexus
                  operation to that workflow's ID. On retries, the
                  infrastructure sees the handle and reuses the existing
                  workflow instead of creating a new one.
                </p>
                <p><strong>Bad (creates duplicates on retry):</strong></p>
                <CodeBlock language="java">{BAD_SYNC_HANDLER}</CodeBlock>
                <p><strong>Good (retries reuse the same workflow):</strong></p>
                <CodeBlock language="java">{GOOD_HANDLE_HANDLER}</CodeBlock>
              </details>

              <details>
                <summary>
                  Q5: Why does the handler start a workflow instead of calling{" "}
                  <code>ComplianceChecker.checkCompliance()</code> directly?
                </summary>
                <p>
                  Sync handlers should only contain{" "}
                  <strong>Temporal primitives</strong> - workflow starts and
                  queries. Running arbitrary Java code (like{" "}
                  <code>ComplianceChecker.checkCompliance()</code>) in a handler
                  bypasses Temporal's durability guarantees.
                </p>
                <p>
                  The handler starts a ComplianceWorkflow and waits for its
                  result. The actual business logic runs inside an Activity
                  within the workflow, where it gets retries, timeouts, and
                  heartbeats for free. Plus, the workflow can wait durably for
                  human review via <code>@UpdateMethod</code> - something a
                  direct call could never support.
                </p>
              </details>
            </section>

            <section className={styles.section} id="what-you-built">
              <h2 className={styles.sectionTitle}>What You Built</h2>
              <p>
                You started with a monolith and ended with two independent
                services connected through Nexus:
              </p>
              <CodeBlock language="text">{ARCHITECTURE_DIAGRAM}</CodeBlock>

              <p><strong>Key concepts you used:</strong></p>
              <table>
                <thead>
                  <tr>
                    <th>Concept</th>
                    <th>What you did</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>@Service</code> + <code>@Operation</code></td>
                    <td>Defined the shared contract between teams</td>
                  </tr>
                  <tr>
                    <td>
                      <code>@ServiceImpl</code> + <code>@OperationImpl</code>
                    </td>
                    <td>Implemented the handler on the Compliance side</td>
                  </tr>
                  <tr>
                    <td><code>fromWorkflowHandle</code></td>
                    <td>
                      Backed a Nexus operation with a long-running workflow
                      (retry-safe)
                    </td>
                  </tr>
                  <tr>
                    <td><code>OperationHandler.sync</code></td>
                    <td>Sent a workflow Update through the Nexus boundary</td>
                  </tr>
                  <tr>
                    <td><code>Workflow.newNexusServiceStub</code></td>
                    <td>
                      Replaced the Activity stub with a Nexus stub (one-line
                      swap)
                    </td>
                  </tr>
                  <tr>
                    <td><code>NexusServiceOptions</code></td>
                    <td>
                      Mapped the service interface to the endpoint in the Worker
                    </td>
                  </tr>
                  <tr>
                    <td>Nexus Endpoint (CLI)</td>
                    <td>
                      Registered the routing rule: endpoint name to namespace +
                      task queue
                    </td>
                  </tr>
                </tbody>
              </table>

              <p>
                The fundamental pattern:{" "}
                <strong>same method call, different architecture</strong>. The
                workflow still calls <code>checkCompliance()</code> - but the
                call now crosses a team boundary with full durability. Each team
                can now modify, test, and deploy their service independently -
                that's the primary win.
              </p>
            </section>

            <section className={styles.section} id="whats-next">
              <h2 className={styles.sectionTitle}>What's Next?</h2>
              <p>
                From here you can explore more advanced patterns - multi-step
                compliance pipelines, async human escalation chains, or
                cross-namespace Nexus operations. See the{" "}
                <a
                  href="https://docs.temporal.io/nexus"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nexus documentation
                </a>{" "}
                to learn more.
              </p>
              <p>
                Don't forget to{" "}
                <a
                  href="https://pages.temporal.io/get-updates-education"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sign up here
                </a>{" "}
                to get notified when we drop new educational content!
              </p>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
