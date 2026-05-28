// Hello World tutorial chapter 1 of 3: Build the Workflow and Activities from scratch.
// Canonical code lives at https://github.com/temporalio/temporal-tutorial-ipgeo-ts.
// Update the *_TS constants here when the upstream repo changes.

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
    href: "/getting_started/typescript/hello_world_in_typescript/",
  },
  {
    n: 2,
    label: "Test and run a Worker",
    href: "/getting_started/typescript/hello_world_in_typescript/worker-and-test/",
  },
  {
    n: 3,
    label: "Run and observe retries",
    href: "/getting_started/typescript/hello_world_in_typescript/run/",
  },
];

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create a new Temporal TypeScript project" },
  { id: "activities", label: "Write the Activities" },
  { id: "workflow", label: "Define the Workflow" },
];

const CREATE_CMD = `npx @temporalio/create --sample empty temporal-ip-geolocation`;

const CREATE_CONFIRM_OUTPUT = `Need to install the following packages:
@temporalio/create@1.11.5
Ok to proceed? (y) y`;

const CREATE_PROGRESS_OUTPUT = `Creating a new Temporal project in /Users/temporal/temporal-ip-geolocation/

Downloading files for sample empty. This might take a moment.

Installing packages. This might take a couple of minutes.`;

const CREATE_GIT_OUTPUT = `✔ Would you like me to initialize a git repository for the project? … yes
Initialized a git repository.`;

const CREATE_SUCCESS_OUTPUT = `Success! Created project temporal-ip-geolocation at:

/Users/temporal/temporal-ip-geolocation/

To begin development, install the Temporal CLI:

Mac: brew install temporal
Other: Download and extract the latest release from https://github.com/temporalio/cli/releases/latest

Start Temporal Server:

temporal server start-dev

Use Node version 18+ (v22.x is recommended):

Mac: brew install node@22
Other: https://nodejs.org/en/download/`;

const PROJECT_TREE = `├── README.md
├── node_modules
├── package-lock.json
├── package.json
├── src
│   ├── activities.ts
│   ├── client.ts
│   ├── mocha
│   ├── worker.ts
│   └── workflows.ts
└── tsconfig.json`;

const PACKAGE_SCRIPTS = `  "scripts": {
    "build": "tsc --build",
    "build.watch": "tsc --build --watch",
    "lint": "eslint .",
    "start": "ts-node src/worker.ts",
    "start.watch": "nodemon src/worker.ts",
    "workflow": "ts-node src/client.ts",
    "format": "prettier --config .prettierrc 'src/**/*.ts' --write",
    "test": "mocha --exit --require ts-node/register --require source-map-support/register src/mocha/*.test.ts"
  },`;

const PACKAGE_DEPS = `"dependencies": {
  "@temporalio/activity": "^1.11.5",
  "@temporalio/client": "^1.11.5",
  "@temporalio/worker": "^1.11.5",
  "@temporalio/workflow": "^1.11.5",
  "nanoid": "3.x"
},`;

const TSCONFIG_LIB = `"compilerOptions": {
 ...
  "lib": ["es2020","DOM"],
 ...
}`;

const ACTIVITY_GETIP_TS = `// Get the IP address
export async function getIP(): Promise<string> {
  const url = 'https://icanhazip.com';
  const response = await fetch(url);
  const data = await response.text();
  return data.trim();
}`;

const ACTIVITY_GETLOCATION_TS = `// Use the IP address to get the location.
export async function getLocationInfo(ip: string): Promise<string> {
  const url = \`http://ip-api.com/json/\${ip}\`;
  const response = await fetch(url);
  const data = await response.json();
  return \`\${data.city}, \${data.regionName}, \${data.country}\`;
}`;

const WORKFLOW_IMPORTS_TS = `import * as workflow from '@temporalio/workflow';

// Only import the activity types
import type * as activities from './activities';

// Load Activities and assign the Retry Policy
const { getIP, getLocationInfo} = workflow.proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second', // amount of time that must elapse before the first retry occurs.
    maximumInterval: '1 minute', // maximum interval between retries.
    backoffCoefficient: 2, // how much the retry interval increases.
    // maximumAttempts: 5, // maximum number of execution attempts. Unspecified means unlimited retries.
  },
  startToCloseTimeout: '1 minute', // maximum time allowed for a single Activity Task Execution.
});`;

const WORKFLOW_CODE_TS = `// The Temporal Workflow.
// Just a TypeScript function.
export async function getAddressFromIP(name: string): Promise<string> {

  try {
    const ip = await getIP();
    try {
      const location = await getLocationInfo(ip);
      return \`Hello, \${name}. Your IP is \${ip} and your location is \${location}\`;
    } catch (e) {
      throw new workflow.ApplicationFailure("Failed to get location");
    }
  } catch (e) {
    throw new workflow.ApplicationFailure("Failed to get IP");
  }

}`;

export default function Chapter1Page() {
  return (
    <Layout
      title="Build the application - Build a Temporal app from scratch in TypeScript"
      description="Chapter 1: Create a TypeScript project, write two Activities, and define the Workflow that orchestrates them."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/sdk_banners/banner_typescript.png"
            alt="Temporal TypeScript SDK"
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
                  { label: "TypeScript", href: "/getting_started/typescript" },
                  {
                    label: "Build from scratch",
                    href: "/getting_started/typescript/hello_world_in_typescript/",
                  },
                  { label: "Build the app" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a Temporal Application from scratch in TypeScript
            </h1>

            <MetaChips
              items={["~15 minutes total", "Temporal beginner", "Hands-on tutorial"]}
            />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={1} />

            <p className={styles.intro}>
              In this tutorial, you'll build your first Temporal Application
              from scratch using the{" "}
              <a
                href="https://github.com/temporalio/sdk-typescript"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal TypeScript SDK
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
                  <Link to="/getting_started/typescript/dev_environment/">
                    Set up a local development environment for developing
                    Temporal Applications using Node.js and TypeScript
                  </Link>
                  . Ensure the Temporal Service is running locally and you can
                  access the Web UI on port <code>8233</code> (the default).
                </li>
                <li>
                  Follow the{" "}
                  <Link to="/getting_started/typescript/first_program_in_typescript/">
                    Run your first Temporal application with the TypeScript SDK
                  </Link>{" "}
                  tutorial to understand how Temporal's components fit together.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>
                Create a new Temporal TypeScript project
              </h2>
              <p>
                While you could create a new directory, initialize a TypeScript
                project, and configure things manually, the TypeScript SDK
                offers a project creation tool you can use to create a project
                folder and set up dependencies.
              </p>
              <p>Run the following command in your shell:</p>
              <CodeBlock language="bash">{CREATE_CMD}</CodeBlock>
              <p>
                The command will ask you to confirm if you want to install{" "}
                <code>@temporalio/create</code>:
              </p>
              <CodeBlock>{CREATE_CONFIRM_OUTPUT}</CodeBlock>
              <p>
                Enter <code>y</code> to continue. The process will then create
                your app:
              </p>
              <CodeBlock>{CREATE_PROGRESS_OUTPUT}</CodeBlock>
              <p>It'll ask you if you'd like to create a Git repository:</p>
              <CodeBlock>{CREATE_GIT_OUTPUT}</CodeBlock>
              <p>
                Then it'll give you further instructions, including how to set
                up and start a local Temporal Service and install a compatible
                version of Node.js:
              </p>
              <CodeBlock>{CREATE_SUCCESS_OUTPUT}</CodeBlock>
              <p>
                Finally, you'll see how to run the Worker and Workflow, but
                don't do that yet.
              </p>
              <p>
                Once the command completes, switch to the{" "}
                <code>temporal-ip-geolocation</code> folder:
              </p>
              <CodeBlock language="bash">cd temporal-ip-geolocation</CodeBlock>
              <p>The generator created the following files and folders:</p>
              <CodeBlock>{PROJECT_TREE}</CodeBlock>
              <p>Here's what each file does:</p>
              <ul>
                <li>
                  The <code>package.json</code> file holds the project
                  dependencies and a handful of scripts you'll use to run
                  Workflows, tests, and other tasks like linting and formatting
                  your code.
                </li>
                <li>
                  The <code>tsconfig.json</code> file holds the TypeScript
                  configuration designed for working with Temporal's SDK.
                </li>
                <li>
                  The <code>src/activities.ts</code> file is where you can
                  define Activities.
                </li>
                <li>
                  The <code>src/client.ts</code> file has the code for a small
                  CLI program to execute a Workflow. You won't use this
                  directly in this guide.
                </li>
                <li>
                  The <code>src/mocha</code> folder is where you'll place your
                  tests. We recommend using{" "}
                  <a
                    href="https://mochajs.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mocha
                  </a>{" "}
                  to test your Temporal Workflows and Activities.
                </li>
                <li>
                  The <code>src/workflows.ts</code> file is where you can
                  define Workflows.
                </li>
                <li>
                  The <code>src/worker.ts</code> file has the code to configure
                  and run your Worker process, which executes your Workflows
                  and Activities.
                </li>
              </ul>
              <p>
                You should review a few parts of the <code>package.json</code>{" "}
                before moving on.
              </p>
              <p>
                First, review the <code>scripts</code> section. These are the{" "}
                <code>npm</code> commands you'll use to build, lint, test, and
                start your application code:
              </p>
              <CodeBlock language="json" title="package.json">
                {PACKAGE_SCRIPTS}
              </CodeBlock>
              <p>
                Next, examine the packages listed as dependencies. These are
                the packages that compose the Temporal TypeScript SDK, and each
                package maps to the four parts of a Temporal application: an
                Activity, Client, Worker, and Workflow. There is also{" "}
                <a
                  href="https://npmjs.com/package/nanoid"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nanoid
                </a>
                , an <code>npm</code> package which you'll use to generate a
                unique identifier for your Workflow.
              </p>
              <CodeBlock language="json" title="package.json">
                {PACKAGE_DEPS}
              </CodeBlock>
              <p>
                You'll use Node.js's built-in <code>fetch</code> library in
                your application. To use it with TypeScript, open the file{" "}
                <code>tsconfig.json</code> and locate the <code>"lib"</code>{" "}
                key under <code>"compilerOptions"</code> and add the{" "}
                <code>DOM</code> library to the array:
              </p>
              <CodeBlock language="json" title="tsconfig.json">
                {TSCONFIG_LIB}
              </CodeBlock>
              <p>
                This ensures that <code>fetch</code> will be available as a
                global module.
              </p>
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
                Your application will make two HTTP requests. The first request
                will return your current public IP, while the second request
                will use that IP to provide city, state, and country
                information.
              </p>
              <p>
                You'll use Temporal Activities to make these requests. You use
                Activities in your Temporal Applications to execute{" "}
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  non-deterministic
                </a>{" "}
                code or perform operations that may fail.
              </p>
              <p>
                If an Activity fails, Temporal can automatically retry it until
                it succeeds or reaches a specified retry limit. This ensures
                that transient issues, like network glitches or temporary
                service outages, don't result in data loss or incomplete
                processes.
              </p>
              <p>
                Open <code>src/activities.ts</code> and remove all the existing
                code in the file. You'll replace it with your own.
              </p>
              <p>
                Add the following code to define a Temporal Activity that
                retrieves your IP address from <code>icanhazip.com</code>:
              </p>
              <CodeBlock language="ts" title="src/activities.ts">
                {ACTIVITY_GETIP_TS}
              </CodeBlock>
              <p>
                This function looks like a regular TypeScript function. With
                the Temporal TypeScript SDK, you define Activities using an
                exportable TypeScript module.
              </p>
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
                retrieves location data. In <code>src/activities.ts</code>,
                add the following code to define it:
              </p>
              <CodeBlock language="ts" title="src/activities.ts">
                {ACTIVITY_GETLOCATION_TS}
              </CodeBlock>
              <p>
                This Activity follows the same pattern as the <code>getIP</code>{" "}
                Activity. It's an exported async function that uses{" "}
                <code>fetch</code> to call a remote service. This time, the
                service returns JSON data rather than text.
              </p>

              <Admonition type="tip" title="Send a single argument">
                <p>
                  While Activities can accept input arguments, it's a best
                  practice to send a single argument rather than multiple
                  arguments. In this case you only have a single string. If you
                  have more than one argument, bundle them up in a
                  serializable object. Review the{" "}
                  <a
                    href="https://docs.temporal.io/dev-guide/typescript/foundations/#activity-parameters"
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
                Workflows are where you configure and organize the execution of
                Activities. You define a Workflow by writing a{" "}
                <em>Workflow Definition</em> using one of the Temporal SDKs.
                Review the{" "}
                <a
                  href="https://docs.temporal.io/develop/typescript/core-application#develop-workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Develop Workflows
                </a>{" "}
                section of the Temporal documentation for more about Workflows
                in TypeScript.
              </p>
              <p>
                Open the file <code>src/workflows.ts</code> and remove the code
                in the file since you'll add your own. Then add the following
                code to import the Activities and configure how the Workflow
                should handle failures with a{" "}
                <a
                  href="https://docs.temporal.io/encyclopedia/retry-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Retry Policy
                </a>
                .
              </p>
              <CodeBlock language="ts" title="src/workflows.ts">
                {WORKFLOW_IMPORTS_TS}
              </CodeBlock>
              <p>
                The Temporal TypeScript SDK requires that Workflows and
                Activities run in separate environments. Temporal Workflows{" "}
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  must be deterministic
                </a>{" "}
                so that Temporal can replay your Workflow in the event of a
                crash, and the TypeScript SDK runs Workflows in a sandbox that
                checks code for determinism to enforce this.
              </p>
              <p>
                Since you run your non-deterministic operations in Activities,
                you configure your Workflow to call Activities through a proxy.
                That's why you import their types rather than the functions
                themselves.
              </p>
              <p>
                The <code>proxyActivities</code> method is also where you set
                options for how Temporal works with Activities. In this
                example, you have specified that the Start-to-Close Timeout for
                your Activity will be one minute, meaning that your Activity
                has one minute to complete before it times out. Of all the
                Temporal timeout options, <code>startToCloseTimeout</code> is
                the one you should always set.
              </p>
              <p>
                You also set the Retry Policy for Activities this way. In this
                example, you're using the default Retry Policy values, so you
                don't need to specify the values, but leaving them in gives you
                a clearer picture of what happens. Note that{" "}
                <code>maximumAttempts</code> is commented out, which means
                there's no limit to the number of times Temporal will retry
                your Activities if they fail.
              </p>
              <p>
                With the imports and options in place, you can define the
                Workflow itself. In the TypeScript SDK, you implement a
                Workflow the same way you define an Activity: using an
                exportable async TypeScript function. Add the following code to
                call both Activities, using the value of the first as the input
                to the second:
              </p>
              <CodeBlock language="ts" title="src/workflows.ts">
                {WORKFLOW_CODE_TS}
              </CodeBlock>
              <p>
                This code uses a <code>try/catch</code> block, but because
                you've configured unlimited retries, there won't be any
                exceptions caught. However, if you change the Retry Policy's
                maximum retries, or you specify non-retryable exceptions, this
                code will be in place to handle those errors.
              </p>
              <p>
                Next you'll create a Worker that executes the Workflow and
                Activities, and write tests to confirm everything works as
                expected.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/getting_started/typescript/first_program_in_typescript/simulate-failures/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous
                </span>
                <span className={styles.chapterNavTitle}>
                  Run your first Temporal TypeScript app
                </span>
              </Link>
              <Link
                to="/getting_started/typescript/hello_world_in_typescript/worker-and-test/"
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
