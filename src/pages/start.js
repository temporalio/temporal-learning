import React, { useState, useEffect, useRef } from "react";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import CourseCard from "@site/src/components/hub/CourseCard/CourseCard";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import { FIRST_STEPS, getCourseBySlug } from "@site/src/data/hub";
import styles from "./start.module.css";

const PYTHON_WORKFLOW = `from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy
from activities import withdraw_money, deposit_money

@workflow.defn
class ReimbursementWorkflow:
    @workflow.run
    async def run(self, user_id: str, amount: float) -> str:
        retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=2),
            backoff_coefficient=2.0,
            maximum_interval=timedelta(minutes=1),
            maximum_attempts=100,
        )

        await workflow.execute_activity(
            withdraw_money,
            amount,
            start_to_close_timeout=timedelta(seconds=5),
            retry_policy=retry_policy,
        )

        await workflow.execute_activity(
            deposit_money,
            amount,
            start_to_close_timeout=timedelta(seconds=5),
            retry_policy=retry_policy,
        )

        return f"reimbursement to {user_id} successfully complete"`;

const GO_WORKFLOW = `package reimbursement

import (
    "fmt"
    "time"

    "go.temporal.io/sdk/temporal"
    "go.temporal.io/sdk/workflow"
)

func ReimbursementWorkflow(ctx workflow.Context, userId string, amount float64) (string, error) {
    options := workflow.ActivityOptions{
        StartToCloseTimeout: time.Second * 5,
        RetryPolicy: &temporal.RetryPolicy{
            InitialInterval:    time.Second * 2,
            BackoffCoefficient: 2,
            MaximumInterval:    time.Minute,
            MaximumAttempts:    100,
        },
    }
    ctx = workflow.WithActivityOptions(ctx, options)

    err := workflow.ExecuteActivity(ctx, WithdrawMoney, amount).Get(ctx, nil)
    if err != nil {
        return "", err
    }

    err = workflow.ExecuteActivity(ctx, DepositMoney, amount).Get(ctx, nil)
    if err != nil {
        return "", err
    }
    return fmt.Sprintf("reimbursement to %s successfully complete", userId), nil
}`;

const JAVA_WORKFLOW = `package reimbursementworkflow;

import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;
import java.time.Duration;

public class ReimbursementWorkflowImpl implements ReimbursementWorkflow {

    private final ReimbursementActivities activities = Workflow.newActivityStub(
        ReimbursementActivities.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofSeconds(5))
            .setRetryOptions(RetryOptions.newBuilder()
                .setInitialInterval(Duration.ofSeconds(2))
                .setBackoffCoefficient(2.0)
                .setMaximumInterval(Duration.ofMinutes(1))
                .setMaximumAttempts(100)
                .build())
            .build()
    );

    @Override
    public String processReimbursement(String userId, double amount) {
        activities.withdrawMoney(amount);
        activities.depositMoney(amount);
        return "Reimbursement of $" + amount + " for user " + userId + " processed successfully";
    }
}`;

const DOTNET_WORKFLOW = `namespace Reimbursement;

using Temporalio.Workflows;

[Workflow]
public class ReimbursementWorkflow
{
    [WorkflowRun]
    public async Task<string> RunAsync(string userId, double amount)
    {
        var activityOptions = new ActivityOptions
        {
            StartToCloseTimeout = TimeSpan.FromSeconds(5),
            RetryPolicy = new()
            {
                InitialInterval = TimeSpan.FromSeconds(2),
                BackoffCoefficient = 2,
                MaximumInterval = TimeSpan.FromMinutes(1),
                MaximumAttempts = 100
            }
        };

        await Workflow.ExecuteActivityAsync(
            (Activities act) => act.withdrawMoney(amount),
            activityOptions
        );

        await Workflow.ExecuteActivityAsync(
            (Activities act) => act.depositMoney(amount),
            activityOptions
        );

        return $"reimbursement to {userId} successfully complete";
    }
}`;

const RUBY_WORKFLOW = `require 'temporalio/workflow'
require_relative 'activities'

class ReimbursementWorkflow < Temporalio::Workflow::Definition
  def execute(user_id, amount)
    retry_policy = Temporalio::RetryPolicy.new(
      initial_interval: 2,
      backoff_coefficient: 2,
      max_interval: 60,
      max_attempts: 100
    )

    Temporalio::Workflow.execute_activity(
      WithdrawMoneyActivity,
      amount,
      start_to_close_timeout: 5,
      retry_policy: retry_policy
    )

    Temporalio::Workflow.execute_activity(
      DepositMoneyActivity,
      amount,
      start_to_close_timeout: 5,
      retry_policy: retry_policy
    )

    "reimbursement to #{user_id} successfully complete"
  end
end`;

const TYPESCRIPT_WORKFLOW = `import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { withdrawMoney, depositMoney } = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumInterval: '1m',
    maximumAttempts: 100,
  },
  startToCloseTimeout: '5s',
});

export async function reimbursementWorkflow(userId: string, amount: number): Promise<string> {
  await withdrawMoney(amount);
  await depositMoney(amount);
  return \`reimbursement to \${userId} successfully complete\`;
}`;

const PYTHON_ACTIVITIES_BUG = `from temporalio import activity

@activity.defn
async def withdraw_money(amount: float) -> bool:
    raise Exception('Bank service temporarily unavailable')
    print(f"Successfully withdrawn \${amount}")
    return True

@activity.defn
async def deposit_money(amount: float) -> bool:
    print(f"Successfully deposited \${amount}")
    return True`;

const PYTHON_ACTIVITIES_FIX = `from temporalio import activity

@activity.defn
async def withdraw_money(amount: float) -> bool:
    # raise Exception('Bank service temporarily unavailable')
    print(f"Successfully withdrawn \${amount}")
    return True

@activity.defn
async def deposit_money(amount: float) -> bool:
    print(f"Successfully deposited \${amount}")
    return True`;

const GO_ACTIVITIES_BUG = `package reimbursement

import (
    "context"
    "fmt"
)

func WithdrawMoney(ctx context.Context, amount float64) (bool, error) {
    return false, fmt.Errorf("Bank Service temporarily unavailable")
    fmt.Printf("Successfully withdrawn $%.2f\\n", amount)
    return true, nil
}

func DepositMoney(ctx context.Context, amount float64) (bool, error) {
    fmt.Printf("Successfully deposited $%.2f\\n", amount)
    return true, nil
}`;

const GO_ACTIVITIES_FIX = `package reimbursement

import (
    "context"
    "fmt"
)

func WithdrawMoney(ctx context.Context, amount float64) (bool, error) {
    // return false, fmt.Errorf("Bank Service temporarily unavailable")
    fmt.Printf("Successfully withdrawn $%.2f\\n", amount)
    return true, nil
}

func DepositMoney(ctx context.Context, amount float64) (bool, error) {
    fmt.Printf("Successfully deposited $%.2f\\n", amount)
    return true, nil
}`;

const JAVA_ACTIVITIES_BUG = `package reimbursementworkflow;

public class ReimbursementActivitiesImpl implements ReimbursementActivities {

    @Override
    public boolean withdrawMoney(double amount) {
        throw new RuntimeException("Bank service temporarily unavailable");
        System.out.println("Successfully withdrawn $" + amount);
        return true;
    }

    @Override
    public boolean depositMoney(double amount) {
        System.out.println("Successfully deposited $" + amount);
        return true;
    }
}`;

const JAVA_ACTIVITIES_FIX = `package reimbursementworkflow;

public class ReimbursementActivitiesImpl implements ReimbursementActivities {

    @Override
    public boolean withdrawMoney(double amount) {
        // throw new RuntimeException("Bank service temporarily unavailable");
        System.out.println("Successfully withdrawn $" + amount);
        return true;
    }

    @Override
    public boolean depositMoney(double amount) {
        System.out.println("Successfully deposited $" + amount);
        return true;
    }
}`;

const DOTNET_ACTIVITIES_BUG = `namespace Reimbursement;

using Temporalio.Activities;

public class Activities
{
    [Activity]
    public Task<bool> withdrawMoney(double amount)
    {
        throw new Exception("Bank service temporarily unavailable");
        Console.WriteLine($"Successfully withdrawn \${amount}");
        return Task.FromResult(true);
    }

    [Activity]
    public Task<bool> depositMoney(double amount)
    {
        Console.WriteLine($"Successfully deposited \${amount}");
        return Task.FromResult(true);
    }
}`;

const DOTNET_ACTIVITIES_FIX = `namespace Reimbursement;

using Temporalio.Activities;

public class Activities
{
    [Activity]
    public Task<bool> withdrawMoney(double amount)
    {
        // throw new Exception("Bank service temporarily unavailable");
        Console.WriteLine($"Successfully withdrawn \${amount}");
        return Task.FromResult(true);
    }

    [Activity]
    public Task<bool> depositMoney(double amount)
    {
        Console.WriteLine($"Successfully deposited \${amount}");
        return Task.FromResult(true);
    }
}`;

const RUBY_ACTIVITIES_BUG = `require 'temporalio/activity'

class WithdrawMoneyActivity < Temporalio::Activity::Definition
  def execute(amount)
    raise StandardError, 'Bank service temporarily unavailable'
    puts "Successfully withdrawn $#{amount}"
    true
  end
end

class DepositMoneyActivity < Temporalio::Activity::Definition
  def execute(amount)
    puts "Successfully deposited $#{amount}"
    true
  end
end`;

const RUBY_ACTIVITIES_FIX = `require 'temporalio/activity'

class WithdrawMoneyActivity < Temporalio::Activity::Definition
  def execute(amount)
    # raise StandardError, 'Bank service temporarily unavailable'
    puts "Successfully withdrawn $#{amount}"
    true
  end
end

class DepositMoneyActivity < Temporalio::Activity::Definition
  def execute(amount)
    puts "Successfully deposited $#{amount}"
    true
  end
end`;

const TYPESCRIPT_ACTIVITIES_BUG = `export async function withdrawMoney(amount: number): Promise<boolean> {
  throw new Error('Bank service temporarily unavailable');
  console.log(\`Successfully withdrawn $\${amount}\`);
  return true;
}

export async function depositMoney(amount: number): Promise<boolean> {
  console.log(\`Successfully deposited $\${amount}\`);
  return true;
}`;

const TYPESCRIPT_ACTIVITIES_FIX = `export async function withdrawMoney(amount: number): Promise<boolean> {
  // throw new Error('Bank service temporarily unavailable');
  console.log(\`Successfully withdrawn $\${amount}\`);
  return true;
}

export async function depositMoney(amount: number): Promise<boolean> {
  console.log(\`Successfully deposited $\${amount}\`);
  return true;
}`;

const SOURCE_BASE = "https://github.com/temporalio/edu-get-started-flow/tree/main";

const LANGUAGES = [
  { id: "go", label: "Go", codeLang: "go", folder: "go" },
  { id: "java", label: "Java", codeLang: "java", folder: "java" },
  { id: "dotnet", label: ".NET", codeLang: "csharp", folder: "dotnet" },
  { id: "python", label: "Python", codeLang: "python", folder: "python" },
  { id: "ruby", label: "Ruby", codeLang: "ruby", folder: "ruby" },
  { id: "typescript", label: "TypeScript", codeLang: "typescript", folder: "typescript" },
];

const WORKFLOW_BY_LANG = {
  go: GO_WORKFLOW,
  java: JAVA_WORKFLOW,
  dotnet: DOTNET_WORKFLOW,
  python: PYTHON_WORKFLOW,
  ruby: RUBY_WORKFLOW,
  typescript: TYPESCRIPT_WORKFLOW,
};

const ACTIVITIES_BUG_BY_LANG = {
  go: GO_ACTIVITIES_BUG,
  java: JAVA_ACTIVITIES_BUG,
  dotnet: DOTNET_ACTIVITIES_BUG,
  python: PYTHON_ACTIVITIES_BUG,
  ruby: RUBY_ACTIVITIES_BUG,
  typescript: TYPESCRIPT_ACTIVITIES_BUG,
};

const ACTIVITIES_FIX_BY_LANG = {
  go: GO_ACTIVITIES_FIX,
  java: JAVA_ACTIVITIES_FIX,
  dotnet: DOTNET_ACTIVITIES_FIX,
  python: PYTHON_ACTIVITIES_FIX,
  ruby: RUBY_ACTIVITIES_FIX,
  typescript: TYPESCRIPT_ACTIVITIES_FIX,
};

// Per-language line ranges for the Workflow's execute-activity calls.
const WORKFLOW_HIGHLIGHTS = {
  go: "23,28",
  java: "25,26",
  dotnet: "23-26,28-31",
  python: "17-22,24-29",
  ruby: "13-18,20-25",
  typescript: "15,16",
};

// Per-language line for the raise/throw exception (same line is the commented form in the fix).
const EXCEPTION_LINE_HIGHLIGHTS = {
  go: "9",
  java: "7",
  dotnet: "10",
  python: "5",
  ruby: "5",
  typescript: "2",
};

function LangPicker({ value, onChange }) {
  return (
    <div className={styles.langPicker} role="tablist" aria-label="SDK">
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          type="button"
          role="tab"
          aria-selected={value === l.id}
          onClick={() => onChange(l.id)}
          className={value === l.id ? styles.langTabActive : styles.langTab}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function CodeSlide({ lang, code, sourceUrl, highlight }) {
  return (
    <SourceCodeBlock
      language={lang.codeLang}
      sdkLabel={lang.label}
      sourceUrl={sourceUrl}
      highlight={highlight}
    >
      {code}
    </SourceCodeBlock>
  );
}

function ImageSlide({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className={styles.carouselImg}
      loading="lazy"
    />
  );
}

export function ReimbursementCarousel() {
  const [lang, setLang] = useState("go");
  const [index, setIndex] = useState(0);
  const langInfo = LANGUAGES.find((l) => l.id === lang);
  const total = 5;
  const last = total - 1;
  const goPrev = () => setIndex((i) => (i === 0 ? last : i - 1));
  const goNext = () => setIndex((i) => (i === last ? 0 : i + 1));

  const slides = [
    {
      step: 1,
      heading: "Meet the Workflow",
      body: (
        <>
          <p>
            An{" "}
            <a
              href="https://docs.temporal.io/activities"
              target="_blank"
              rel="noopener noreferrer"
            >
              Activity
            </a>{" "}
            is a function for a single fallible operation - an API call, database write, network request. Temporal retries failed Activities automatically.
          </p>
          <p>
            A{" "}
            <a
              href="https://docs.temporal.io/workflows"
              target="_blank"
              rel="noopener noreferrer"
            >
              Workflow
            </a>{" "}
            orchestrates Activities and runs durably: if the application crashes, Temporal recreates its pre-failure state and continues right where it left off. The Workflow below orchestrates two Activities: withdraw, then deposit.
          </p>
        </>
      ),
      content: (
        <CodeSlide
          lang={langInfo}
          code={WORKFLOW_BY_LANG[lang]}
          sourceUrl={`${SOURCE_BASE}/${langInfo.folder}`}
          highlight={WORKFLOW_HIGHLIGHTS[lang]}
        />
      ),
    },
    {
      step: 2,
      heading: "Inject a failure",
      body: (
        <>
          <p>We'll now look at how Temporal retries your code. We'll intentionally raise an error in the <code>withdrawMoney</code> Activity code.</p>
          <p>In our case, this is just an error we are intentionally raising, but this could just as easily be an internal service that isn't responding, a network outage, an application crashing, or more.</p>
        </>
      ),
      content: (
        <CodeSlide
          lang={langInfo}
          code={ACTIVITIES_BUG_BY_LANG[lang]}
          sourceUrl={`${SOURCE_BASE}/${langInfo.folder}`}
          highlight={EXCEPTION_LINE_HIGHLIGHTS[lang]}
        />
      ),
    },
    {
      step: 3,
      heading: "Observe the retries",
      body: (
        <>
          The <code>withdrawMoney</code> Activity retries over and over - until it succeeds or hits the configured 100-attempt cap. You wrote no retry code; Temporal scheduled every attempt.
        </>
      ),
      content: (
        <ImageSlide
          src="/img/see-temporal-in-action/error-state.png"
          alt="Temporal Web UI showing withdrawMoney retrying"
        />
      ),
    },
    {
      step: 4,
      heading: "Fix the exception",
      body: (
        <>
          <p>Let's fix the exception by removing it or commenting it out.</p>
          <p>In practice, retries continue until the underlying issue resolves itself - the network reconnects, an internal service starts responding. Temporal's built-in retries spare you from writing recovery logic.</p>
        </>
      ),
      content: (
        <CodeSlide
          lang={langInfo}
          code={ACTIVITIES_FIX_BY_LANG[lang]}
          sourceUrl={`${SOURCE_BASE}/${langInfo.folder}`}
          highlight={EXCEPTION_LINE_HIGHLIGHTS[lang]}
        />
      ),
    },
    {
      step: 5,
      heading: "Workflow completes",
      body: (
        <>
          <p>The Workflow Execution completes successfully. Temporal preserved its state through the failures and continued exactly where it left off - no lost data, no duplicate operations.</p>
          <div className={styles.callout}>
            <strong>This is the power of Temporal:</strong> your critical business processes are guaranteed to complete - even across crashes, restarts, and network outages. You write the business logic; Temporal handles the durability.
          </div>
        </>
      ),
      content: (
        <ImageSlide
          src="/img/see-temporal-in-action/workflow-complete.png"
          alt="Temporal Web UI showing the reimbursement Workflow completed"
        />
      ),
    },
  ];

  const slide = slides[index];

  return (
    <div className={styles.carouselWrapper}>
      <LangPicker value={lang} onChange={setLang} />
      <div className={styles.carousel}>
        <div className={styles.carouselSlide} key={index}>
          <div className={styles.slideHeader}>
            <span className={styles.slideStep}>
              Step {slide.step} of {total}
            </span>
            <h3 className={styles.slideHeading}>{slide.heading}</h3>
          </div>
          <div className={styles.slideBody}>{slide.content}</div>
          <div className={styles.slideCaption}>{slide.body}</div>
        </div>
        <button
          type="button"
          className={`${styles.carouselArrow} ${styles.carouselArrowPrev}`}
          onClick={goPrev}
          aria-label="Previous slide"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          className={`${styles.carouselArrow} ${styles.carouselArrowNext}`}
          onClick={goNext}
          aria-label="Next slide"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className={styles.carouselDots} role="tablist" aria-label="Demo steps">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Step ${i + 1} of ${total}`}
            className={i === index ? styles.dotActive : styles.dot}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

function SourceCodeBlock({ language, sourceUrl, sdkLabel, highlight, children }) {
  return (
    <div className={styles.sourceCodeWrap}>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.sourceLink}
        aria-label={`View ${sdkLabel} source on GitHub`}
        title={`View ${sdkLabel} source on GitHub`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.69-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18.92-.26 1.9-.39 2.88-.39s1.96.13 2.88.39c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.07.78 2.16v3.2c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
        </svg>
      </a>
      <CodeBlock
        language={language}
        metastring={highlight ? `{${highlight}}` : undefined}
      >
        {children}
      </CodeBlock>
    </div>
  );
}

const STEPS = FIRST_STEPS.map((s) => ({
  n: String(s.n).padStart(2, "0"),
  title: s.title,
  description: s.description,
  duration: s.duration,
  href: s.href,
}));

const CONCEPTS = [
  {
    title: "Workflow",
    body: "A function that orchestrates work. Reliably executes to completion, even across failures or restarts.",
    href: "https://docs.temporal.io/workflows",
  },
  {
    title: "Activity",
    body: "A unit of work called from a Workflow. Activities can talk to the outside world (databases, APIs, anything that might fail).",
    href: "https://docs.temporal.io/activities",
  },
  {
    title: "Worker",
    body: "A process you run that executes Workflow and Activity code. Workers pull tasks from a Task Queue.",
    href: "https://docs.temporal.io/workers",
  },
  {
    title: "Task Queue",
    body: "Where the Temporal Service hands tasks to Workers. You name it; Workers listen on it.",
    href: "https://docs.temporal.io/workers#task-queue",
  },
];

const FAQ = [
  {
    q: "What is Durable Execution?",
    a: "Temporal makes it easier for developers to build and operate reliable, scalable applications without sacrificing productivity. The design of the system ensures that, once started, an application's main function executes to completion - whether that takes minutes, hours, days, weeks, or even years.",
  },
  {
    q: "What happens when a Workflow fails halfway through?",
    a: "Temporal records the steps your code takes as it runs. If the process crashes or restarts, your code replays through the recorded steps to recover its state, then continues from where it left off - no manual recovery code needed.",
  },
  {
    q: "Do I need to run my own Temporal Service?",
    a: "For local development you can spin one up with the Temporal CLI in seconds. In production you can self-host or use Temporal Cloud.",
  },
];

const TOC_ITEMS = [
  { id: "see-temporal-in-action", label: "See Temporal in Action", href: "/start/in-action", anchor: false },
  { id: "dev-environment", label: "Set up dev environment", href: "/start/dev-environment", anchor: false },
  { id: "run-an-app", label: "Run a Temporal app", href: "/start/run-an-app", anchor: false },
  { id: "build-from-scratch", label: "Build one from scratch", href: "/start/build-from-scratch", anchor: false },
  { id: "take-a-course", label: "Take a free course", anchor: true },
  { id: "concepts", label: "Concepts to know", anchor: true },
  { id: "common-questions", label: "Common questions", anchor: true },
];

function StartToc() {
  const [activeId, setActiveId] = useState("see-temporal-in-action");
  const observerRef = useRef(null);

  useEffect(() => {
    const anchors = TOC_ITEMS.filter((i) => i.anchor);
    const targets = anchors
      .map((i) => document.getElementById(i.id))
      .filter(Boolean);
    if (targets.length === 0) return undefined;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.offsetTop - b.target.offsetTop);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );

    targets.forEach((t) => observerRef.current.observe(t));
    return () => observerRef.current && observerRef.current.disconnect();
  }, []);

  const handleAnchorClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: "smooth" });
    if (history.replaceState) history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav className={styles.toc} aria-label="On this page">
      <div className={styles.tocLabel}>On this page</div>
      <ol className={styles.tocList}>
        {TOC_ITEMS.map((item, i) => {
          const n = String(i + 1).padStart(2, "0");
          const isActive = item.anchor && item.id === activeId;
          if (item.anchor) {
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleAnchorClick(e, item.id)}
                  className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ""}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span className={styles.tocNum}>{n}</span>
                  <span className={styles.tocText}>{item.label}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={item.id}>
              <a href={item.href} className={styles.tocLink}>
                <span className={styles.tocNum}>{n}</span>
                <span className={styles.tocText}>{item.label}</span>
                <span aria-hidden="true" className={styles.tocExternal}>↗</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function StartPage() {
  const t101 = getCourseBySlug("temporal-101");
  const t102 = getCourseBySlug("temporal-102");

  return (
    <Layout
      title="New to Temporal? Start here"
      description="Set up your environment, build your first Workflow, and learn how Temporal handles failures."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Learn Temporal / Start here"
          title="New to Temporal? Start here."
          body="Temporal makes long-running, multi-step work reliable - even when servers crash, networks blink, or downstream services time out. In about an hour you can have your first Workflow running, then go deeper through the courses."
          showSearch={false}
        />

        <div className={styles.pageLayout}>
          <aside className={styles.pageSidebar}>
            <StartToc />
          </aside>
          <main className={styles.pageMain}>

        <section className={styles.section} id="see-temporal-in-action">
          <div className={styles.inner}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Start here" },
              ]}
            />

            <a href="/start/in-action" className={styles.demoTeaser}>
              <div className={styles.demoTeaserContent}>
                <div className={styles.demoTeaserLabel}>5-step walkthrough</div>
                <h2 className={styles.demoTeaserTitle}>Watch Temporal recover from a failure</h2>
                <p className={styles.demoTeaserBody}>
                  See a Workflow break on purpose and recover automatically - in your language. Code, inject an error, watch retries, fix the bug, and see the Workflow complete.
                </p>
                <div className={styles.demoTeaserCta}>
                  Start the walkthrough <span aria-hidden="true" className={styles.demoTeaserArrow}>→</span>
                </div>
              </div>
              <div className={styles.demoTeaserVisual}>
                <img
                  src="/img/see-temporal-in-action/error-state.png"
                  alt=""
                  loading="lazy"
                />
              </div>
            </a>
          </div>
        </section>

        <section className={styles.section} id="first-hour">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Your first hour</h2>
            <p className={styles.sectionSub}>
              Three short steps. Each links to the per-SDK guide; pick your language there.
            </p>
            <ol className={styles.steps}>
              {STEPS.map((step) => (
                <li key={step.n} className={styles.step}>
                  <a href={step.href} className={styles.stepLink}>
                    <div className={styles.stepNumber}>{step.n}</div>
                    <div className={styles.stepBody}>
                      <h3 className={styles.stepTitle}>{step.title}</h3>
                      <p className={styles.stepDescription}>{step.description}</p>
                      <div className={styles.stepMeta}>{step.duration}</div>
                    </div>
                    <span aria-hidden="true" className={styles.stepArrow}>→</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.section} id="take-a-course">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Then go deeper</h2>
            <p className={styles.sectionSub}>
              Once your first Workflow is running, take one of our free, foundational courses.
            </p>
            <div className={styles.grid2}>
              <CourseCard course={t101} size="lg" />
              <CourseCard course={t102} size="lg" />
            </div>
          </div>
        </section>

        <section className={styles.section} id="concepts">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Concepts to know</h2>
            <p className={styles.sectionSub}>
              The vocabulary you'll see across the docs and courses.
            </p>
            <div className={styles.conceptGrid}>
              {CONCEPTS.map((c) => (
                <a key={c.title} href={c.href} className={styles.concept}>
                  <h3 className={styles.conceptTitle}>{c.title}</h3>
                  <p className={styles.conceptBody}>{c.body}</p>
                  <div className={styles.conceptLink}>
                    Read the docs <span aria-hidden="true">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} id="common-questions">
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Common questions</h2>
            <div className={styles.faq}>
              {FAQ.map((item, i) => (
                <details key={i} className={styles.faqItem}>
                  <summary className={styles.faqQ}>{item.q}</summary>
                  <p className={styles.faqA}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Get Help</h2>
            <div className={styles.helpGrid}>
              <a href="https://temporal.io/slack" className={styles.helpCard}>
                <h3 className={styles.helpTitle}>
                  <img
                    src="https://docs.temporal.io/img/icons/slack-dark-mode-24x24.svg"
                    alt=""
                    className={styles.helpIcon}
                    width={24}
                    height={24}
                  />
                  Community Slack
                </h3>
                <p className={styles.helpBody}>
                  Ask questions and chat with thousands of Temporal developers.
                </p>
              </a>
              <a href="https://community.temporal.io/" className={styles.helpCard}>
                <h3 className={styles.helpTitle}>
                  <img
                    src="https://docs.temporal.io/img/icons/forum-dark-mode-24x24.svg"
                    alt=""
                    className={styles.helpIcon}
                    width={24}
                    height={24}
                  />
                  Developer Forum
                </h3>
                <p className={styles.helpBody}>
                  Search past questions or post your own to the Temporal community.
                </p>
              </a>
              <a href="https://docs.temporal.io" className={styles.helpCard}>
                <h3 className={styles.helpTitle}>
                  <img
                    src="https://docs.temporal.io/img/icons/learn-dark-mode-24x24.svg"
                    alt=""
                    className={styles.helpIcon}
                    width={24}
                    height={24}
                  />
                  Documentation
                </h3>
                <p className={styles.helpBody}>
                  The full reference - concepts, SDKs, deployment, troubleshooting.
                </p>
              </a>
            </div>
          </div>
        </section>

            <div className={styles.bottomCta}>
              <MagentaCta to="/paths/foundation">
                Take the Foundation path
              </MagentaCta>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
