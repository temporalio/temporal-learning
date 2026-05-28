/**
 * Hand-typed learning hub data. Mirrors the manifest plugin shape from plan.md §5.
 * Replace with generated `static/learning-manifest.json` once the plugin lands.
 */

export const TOPICS = {
  ai: { label: "AI", slug: "ai" },
  "async-activity-completion": {
    label: "Asynchronous Activity Completion",
    slug: "async-activity-completion",
  },
  "codec-server": { label: "Codec Server", slug: "codec-server" },
  "data-encryption": { label: "Data Encryption", slug: "data-encryption" },
  deployment: { label: "Deployment", slug: "deployment" },
  determinism: { label: "Determinism", slug: "determinism" },
  "error-handling": { label: "Error handling", slug: "error-handling" },
  "event-history": { label: "Event History", slug: "event-history" },
  idempotence: { label: "Idempotence", slug: "idempotence" },
  infrastructure: { label: "Infrastructure", slug: "infrastructure" },
  namespaces: { label: "Namespaces", slug: "namespaces" },
  nexus: { label: "Nexus", slug: "nexus" },
  "non-retryable-errors": {
    label: "Non-Retryable Errors",
    slug: "non-retryable-errors",
  },
  queries: { label: "Queries", slug: "queries" },
  replay: { label: "Replay", slug: "replay" },
  "resetting-workflow": {
    label: "Resetting a Workflow",
    slug: "resetting-workflow",
  },
  "retry-policy": { label: "Retry Policy", slug: "retry-policy" },
  sagas: { label: "Sagas", slug: "sagas" },
  "schedules-timers": { label: "Schedules & timers", slug: "schedules-timers" },
  "search-attributes": { label: "Search Attributes", slug: "search-attributes" },
  security: { label: "Security", slug: "security" },
  signals: { label: "Signals", slug: "signals" },
  cloud: { label: "Temporal Cloud", slug: "cloud" },
  terminating: { label: "Terminating", slug: "terminating" },
  testing: { label: "Testing", slug: "testing" },
  timeouts: { label: "Timeouts", slug: "timeouts" },
  timers: { label: "Timers", slug: "timers" },
  versioning: { label: "Versioning", slug: "versioning" },
  "web-integration": { label: "Web app integration", slug: "web-integration" },
  "workflow-cancellations": {
    label: "Workflow Cancellations",
    slug: "workflow-cancellations",
  },
  "workflow-id": { label: "Workflow ID", slug: "workflow-id" },
  "workflow-id-reuse": {
    label: "Workflow ID Reuse",
    slug: "workflow-id-reuse",
  },
};

export const PERSONAS = [
  {
    slug: "developer",
    title: "Software Developer",
    description: "Build, ship, and evolve production Temporal apps.",
    pathSlug: "Production-Grade-developer",
  },
  {
    slug: "ai",
    title: "AI Developer",
    description: "Durable agents, MCP tools, long-running LLM workflows.",
    pathSlug: "ai",
  },
];

export const PATHS = [
  {
    slug: "foundation",
    tier: "foundation",
    title: "Foundation",
    description:
      "Understand durable execution, write your first Workflow and Activity, and explore the Temporal Web UI and CLI.",
    level: "essential",
    lessonCount: 15,
    thumbnail: "/img/banners/getstarted.png",
    courses: ["temporal-101", "temporal-102"],
  },
  {
    slug: "intermediate",
    tier: "intermediate",
    title: "Building Resilient Applications",
    description:
      "Handle errors with confidence, interact with running Workflows, secure your payloads end-to-end, and safely evolve Workflows in production.",
    level: "practical",
    lessonCount: 17,
    courses: ["errstrat", "interacting-with-workflows", "appdatasec", "versioning"],
  },
  {
    slug: "Production-Grade-developer",
    tier: "advanced",
    persona: "developer",
    title: "Production-Grade Temporal",
    description:
      "Roll out Worker versions safely and operate your application against Temporal Cloud.",
    level: "production",
    lessonCount: 8,
    courses: ["worker-versioning", "intro-to-temporal-cloud"],
  },
];

const ALL_SDKS = ["go", "java", "dotnet", "python", "ruby", "typescript"];

export const COURSES = [
  {
    slug: "temporal-101",
    title: "Temporal 101: Introducing the Temporal Platform",
    label: "TEMPORAL 101",
    url: "/courses/temporal_101",
    kind: "course",
    tier: "foundation",
    thumbnail: "/courses/temporal-101/course-icons/t101.png",
    topics: ["event-history", "timeouts", "retry-policy", "determinism", "replay"],
    level: "essential",
    durationMinutes: 120,
    sdkLanguages: ALL_SDKS,
    lessonCount: 6,
    summary:
      "Explore the basic building blocks of Temporal: Workflows and Activities. Build a small app, see Temporal recover from failure, and use the Web UI and CLI.",
  },
  {
    slug: "temporal-102",
    title: "Temporal 102: Exploring Durable Execution",
    label: "TEMPORAL 102",
    url: "/courses/temporal_102",
    kind: "course",
    tier: "foundation",
    thumbnail: "/courses/temporal-102/course-icons/t102.png",
    topics: [
      "event-history",
      "terminating",
      "deployment",
      "workflow-id",
      "workflow-id-reuse",
      "determinism",
      "replay",
      "timers",
      "resetting-workflow",
      "testing",
    ],
    level: "essential",
    durationMinutes: 240,
    sdkLanguages: ALL_SDKS,
    lessonCount: 8,
    summary:
      "Go beyond the basics. Test, debug, and deploy Temporal applications and learn why common pitfalls happen and how to avoid them.",
  },
  {
    slug: "errstrat",
    title: "Crafting an Error Handling Strategy",
    label: "ERROR HANDLING",
    url: "/courses/errstrat",
    kind: "course",
    tier: "intermediate",
    thumbnail: "/courses/errors/course-icons/errors.png",
    topics: [
      "timeouts",
      "terminating",
      "workflow-cancellations",
      "resetting-workflow",
      "sagas",
      "non-retryable-errors",
      "idempotence",
    ],
    level: "practical",
    durationMinutes: 150,
    sdkLanguages: ["go", "java", "dotnet", "python", "typescript"],
    lessonCount: 7,
    summary:
      "Design and implement error-handling strategies. Cover idempotence, heartbeating, the Saga pattern, and Temporal's failure model.",
  },
  {
    slug: "interacting-with-workflows",
    title: "Interacting with Workflows",
    label: "INTERACTING",
    url: "/courses/interacting_with_workflows",
    kind: "course",
    tier: "intermediate",
    thumbnail: "/courses/interacting-with-workflows/course-icons/interactingwworkflows.png",
    topics: [
      "async-activity-completion",
      "signals",
      "queries",
      "search-attributes",
      "workflow-cancellations",
    ],
    level: "practical",
    durationMinutes: 180,
    sdkLanguages: ["go", "java", "python", "typescript"],
    lessonCount: 6,
    summary:
      "Make Workflows dynamic by interacting with them and responding to external stimuli with Signals and Queries.",
  },
  {
    slug: "appdatasec",
    title: "Securing Application Data",
    label: "SECURITY",
    url: "/courses/appdatasec",
    kind: "course",
    tier: "intermediate",
    thumbnail: "/courses/codec-server/typescript/course-icons/appdata.png",
    topics: ["data-encryption", "codec-server"],
    level: "practical",
    durationMinutes: 120,
    sdkLanguages: ["go", "java", "python", "typescript"],
    lessonCount: 5,
    summary:
      "Implement Custom Data Conversion and a Codec Server. Address user management, encryption standards, and key rotation.",
  },
  {
    slug: "versioning",
    title: "Versioning Workflows",
    label: "VERSIONING",
    url: "/courses/versioning",
    kind: "course",
    tier: "advanced",
    persona: "developer",
    thumbnail: "/courses/versioning/course-icons/versioningowkrflows.png",
    topics: [
      "event-history",
      "search-attributes",
      "testing",
      "versioning",
      "deployment",
      "determinism",
    ],
    level: "production",
    durationMinutes: 90,
    sdkLanguages: ["go", "java", "python", "typescript"],
    lessonCount: 5,
    summary:
      "Safely evolve Temporal application code in production using the three primary versioning approaches.",
  },
  {
    slug: "worker-versioning",
    title: "Worker Versioning",
    label: "WORKER VERSIONING",
    url: "/courses/worker_versioning",
    kind: "course",
    tier: "advanced",
    persona: "developer",
    thumbnail: "/courses/worker-versioning/course-icons/workerversioning.png",
    topics: ["versioning", "deployment", "determinism"],
    level: "production",
    durationMinutes: 60,
    sdkLanguages: ALL_SDKS,
    lessonCount: 3,
    summary:
      "Tag your Workers and roll them out in versioned deployments. Old Workers run old code paths; new Workers run new ones.",
  },
  {
    slug: "intro-to-temporal-cloud",
    title: "Introduction to Temporal Cloud",
    label: "TEMPORAL CLOUD",
    url: "/courses/intro_to_temporal_cloud",
    kind: "course",
    tier: "advanced",
    persona: "platform",
    thumbnail: "/courses/intro-to-temporal-cloud/course-icons/Temporal-Cloud.png",
    topics: ["search-attributes", "namespaces", "cloud"],
    level: "practical",
    durationMinutes: 60,
    lessonCount: 6,
    summary:
      "Log into Temporal Cloud, navigate its Web UI, and perform the tasks new Cloud users handle first.",
  },
  {
    slug: "building-durable-ai-applications",
    title: "Building Durable AI Applications with Temporal",
    label: "DURABLE AI",
    url: "/tutorials/ai/building-durable-ai-applications",
    kind: "tutorial",
    tier: "advanced",
    persona: "ai",
    topics: ["ai"],
    sdkLanguages: ["python"],
    level: "practical",
    durationMinutes: 60,
    lessonCount: 1,
    summary:
      "Build a durable AI application backed by Temporal's reliable execution model.",
  },
  {
    slug: "building-mcp-tools-with-temporal",
    title: "Building Durable MCP Tools with Temporal",
    label: "MCP",
    url: "/tutorials/ai/building-mcp-tools-with-temporal",
    kind: "tutorial",
    tier: "advanced",
    persona: "ai",
    topics: ["ai"],
    sdkLanguages: ["python"],
    level: "practical",
    durationMinutes: 45,
    lessonCount: 1,
    summary:
      "Wrap Temporal Workflows as MCP tools so LLM agents can call them durably.",
  },
  {
    slug: "deep-research",
    title: "Building Deep Research Agents with the OpenAI Agents SDK",
    label: "DEEP RESEARCH",
    url: "/tutorials/ai/deep-research",
    kind: "tutorial",
    tier: "advanced",
    persona: "ai",
    topics: ["ai"],
    sdkLanguages: ["python"],
    level: "production",
    durationMinutes: 90,
    lessonCount: 1,
    summary:
      "Use Temporal and the OpenAI Agents SDK to build deep-research agents that run for hours and survive failure.",
  },
  {
    slug: "durable-ai-agent",
    title: "Build a Durable AI Agent",
    label: "AGENTIC",
    url: "/tutorials/ai/durable-ai-agent",
    kind: "tutorial",
    tier: "advanced",
    persona: "ai",
    topics: ["ai"],
    sdkLanguages: ["python"],
    level: "practical",
    durationMinutes: 60,
    lessonCount: 1,
    summary:
      "Compose Temporal primitives into a long-running agent that picks up where it left off.",
  },
  {
    slug: "subscription-billing",
    title: "Building Subscription Billing",
    label: "BILLING",
    url: "/tutorials/typescript/recurring-billing-system/",
    kind: "tutorial",
    tier: "advanced",
    topics: ["signals", "schedules-timers"],
    sdkLanguages: ["typescript"],
    level: "practical",
    durationMinutes: 60,
    lessonCount: 1,
    summary:
      "Recurring charges, retries, dunning, and graceful cancellation - durable across restarts and deploys.",
  },
  {
    slug: "nexus",
    title: "Connecting Services with Nexus",
    label: "NEXUS",
    url: "/tutorials/nexus/nexus-sync-tutorial-java/",
    kind: "tutorial",
    tier: "advanced",
    topics: ["nexus"],
    sdkLanguages: ["java"],
    level: "practical",
    durationMinutes: 60,
    lessonCount: 1,
    summary:
      "Use Nexus to call Workflows that live in different Temporal namespaces or services - clean boundaries between teams.",
  },
];

export const FEATURED_HOME_COURSES = [
  "temporal-101",
  "temporal-102",
  "errstrat",
  "building-durable-ai-applications",
  "building-mcp-tools-with-temporal",
  "deep-research",
];

export function getCourseBySlug(slug) {
  return COURSES.find((c) => c.slug === slug);
}

export function getCoursesForPath(pathSlug) {
  const path = PATHS.find((p) => p.slug === pathSlug);
  if (!path) return [];
  return path.courses.map(getCourseBySlug).filter(Boolean);
}

export function getPathBySlug(slug) {
  return PATHS.find((p) => p.slug === slug);
}

export function getFeaturedCourses() {
  return FEATURED_HOME_COURSES.map(getCourseBySlug).filter(Boolean);
}

export const FIRST_STEPS = [
  {
    n: 1,
    duration: "~5 min",
    title: "Set up your dev environment",
    shortLabel: "Set up dev env",
    description: "Install the SDK, the CLI, and verify your machine is ready.",
    href: "/start/dev-environment",
  },
  {
    n: 2,
    duration: "~20 min",
    title: "Run a Temporal application",
    shortLabel: "Run a Temporal app",
    description: "Download a small app and watch Temporal handle failures.",
    href: "/start/run-an-app",
  },
  {
    n: 3,
    duration: "~20 min",
    title: "Build one from scratch",
    shortLabel: "Build from scratch",
    description: "Write your own Workflow and Activity from the ground up.",
    href: "/start/build-from-scratch",
  },
];
