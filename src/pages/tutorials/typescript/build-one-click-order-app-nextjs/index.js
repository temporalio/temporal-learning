// Single-page tutorial: Build a one-click order application with TypeScript and Next.js.

import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import Admonition from "@theme/Admonition";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import DevEnvironmentToc from "@site/src/components/DevEnvironment/Toc";
import MetaChips from "@site/src/components/DevEnvironment/MetaChips";
import styles from "@site/src/components/DevEnvironment/styles.module.css";

const TOC_ITEMS = [
  { id: "introduction", label: "Introduction" },
  { id: "prerequisites", label: "Prerequisites" },
  { id: "create-project", label: "Create your project" },
  { id: "define-business-logic", label: "Define the business logic" },
  { id: "define-backend-api", label: "Define the back-end API" },
  { id: "build-frontend", label: "Build the front-end interface" },
  { id: "conclusion", label: "Conclusion" },
];

const TSCONFIG_JSON = `{
  "extends": "@tsconfig/node20/tsconfig.json",
  "version": "4.4.2",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "./src",
    "outDir": "./lib"
  },
  "include": ["src/**/*.ts"]
}`;

const ORIGINAL_SCRIPTS = `  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },`;

const NEW_SCRIPTS = `  "scripts": {
    "dev": "npm-run-all -l build:temporal --parallel dev:temporal dev:next start:worker",
    "dev:next": "next dev",
    "dev:temporal": "tsc --build --watch ./temporal/tsconfig.json",
    "build:next": "next build",
    "build:temporal": "tsc --build ./temporal/tsconfig.json",
    "start:worker": "nodemon ./temporal/lib/worker",
    "start": "next start",
    "lint": "eslint ."
  },`;

const ACTIVITIES_TS = `import { activityInfo } from '@temporalio/activity';
export async function purchase(id: string): Promise<string> {
  console.log(\`Purchased \${id}!\`);
  return activityInfo().activityId;
}`;

const WORKFLOWS_TS = `import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { purchase } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function oneClickBuy(id: string): Promise<string> {
  const result = await purchase(id); // calling the activity
  await sleep('10 seconds'); // sleep to simulate a longer response.
  console.log(\`Activity ID: \${result} executed!\`);
  return result;
}`;

const SHARED_TS = `export const TASK_QUEUE_NAME = 'ecommerce-oneclick';`;

const WORKER_TS = `import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { TASK_QUEUE_NAME } from './shared';

run().catch((err) => console.log(err));

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
    // In production, pass options to configure TLS and other settings.
  });
  try {
    const worker = await Worker.create({
      connection,
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue: TASK_QUEUE_NAME
    });
    await worker.run();
  } finally {
    connection.close();
  }
}`;

const CLIENT_TS = `import { Client, Connection } from '@temporalio/client';

const client: Client = makeClient();

function makeClient(): Client {
  const connection = Connection.lazy({
    address: 'localhost:7233',
    // In production, pass options to configure TLS and other settings.
  });
  return new Client({ connection });
}

export function getTemporalClient(): Client {
  return client;
}`;

const API_TS = `import { oneClickBuy } from '../../../temporal/src/workflows';
import { getTemporalClient } from '../../../temporal/src/client';
import { TASK_QUEUE_NAME } from '../../../temporal/src/shared';

export async function POST(req: Request) {
  interface RequestBody {
    itemId: string;
    transactionId: string;
  }

  let body: RequestBody;

  try {
    body = await req.json() as RequestBody;
  } catch (error) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { itemId, transactionId } = body;

  if (!itemId) {
    return new Response("Must send the itemID to buy", { status: 400 });
  }

  await getTemporalClient().workflow.start(oneClickBuy, {
    taskQueue: TASK_QUEUE_NAME,
    workflowId: transactionId,
    args: [itemId],
  });

  return Response.json({ ok: true });
}`;

const ERROR_OUTPUT = `[start:worker] TransportError: tonic::transport::Error(Transport, hyper::Error(Connect,
ConnectError("tcp connect error", Os { code: 61,
kind: ConnectionRefused, message: "Connection refused" })))`;

const CURL_OUTPUT = `[dev:next    ]  POST /api/startBuy 200 in 16ms
[start:worker] Purchased 1!`;

const PAGE_START_TSX = `'use client'
import Head from 'next/head';
import React, { useState, useRef } from 'react';
import { v4 as uuid4 } from 'uuid';`;

const PAGE_VARS_TSX = `
interface ProductProps {
  product: {
    id: number;
    name: string;
    price: string;
  };
}

const products = [
  {
    id: 1,
    name: 'PDF Book',
    price: '$49',
  },
  {
    id: 2,
    name: 'Kindle Book',
    price: '$49',
  },
];

type ITEMSTATE = 'NEW' | 'ORDERING' |  'ORDERED' | 'ERROR';`;

const PAGE_PRODUCT_TSX = `const Product: React.FC<ProductProps> = ({ product }) => {
  const itemId = product.id;
  const [state, setState] = useState<ITEMSTATE>('NEW');
  const [transactionId, setTransactionId] = React.useState(uuid4());

  const buyProduct = () => {
    setState('ORDERING');
    fetch('/api/startBuy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, transactionId }),
    })
      .then(() => {
        setState('ORDERED');
      })
      .catch(() => {
        setState('ERROR');
      });
  };

  const buyStyle = "w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center";
  const orderingStyle = "w-full bg-yellow-500 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center";
  const orderStyle = "w-full bg-green-500 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center";
  const errorStyle = "w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center";

  return (
    <div key={product.id} className="relative group">
      <div className="mt-4 flex items-center justify-between text-base font-medium text-gray-900 space-x-8">
        <h3>{product.name}</h3>
        <p>{product.price}</p>
      </div>
      <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100">
        <div className="flex items-end p-4" aria-hidden="true">
          {
            {
              NEW:     ( <button onClick={buyProduct} className={buyStyle}> Buy Now </button> ),
              ORDERING: ( <div className={orderingStyle}>Orderering</div> ),
              ORDERED: ( <div className={orderStyle}>Ordered</div> ),
              ERROR:   ( <button onClick={buyProduct} className={errorStyle}>Error! Click to Retry </button> ),
            }[state]
          }
        </div>
      </div>
    </div>
  );
};`;

const PAGE_LIST_TSX = `const ProductList: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-4">
          {products.map((product) => (
            <Product product={product} key={product.id} />
          ))}
        </div>
      </div>
    </div>
  );
};`;

const PAGE_HOME_TSX = `const Home: React.FC = () => {
  return (
    <div className="pt-8 pb-80 sm:pt-12 sm:pb-40 lg:pt-24 lg:pb-48">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
        <Head>
          <title>Temporal + Next.js One-Click Purchase</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <header className="relative overflow-hidden">
          <div className="sm:max-w-lg">
            <h1 className="text-4xl font font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Temporal.io + Next.js One Click Purchase
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Click on the item to buy it now.
            </p>
          </div>
        </header>
        <ProductList />
      </div>
    </div>
  );
};

export default Home;`;

const PROD_WORKER_SNIPPET = `const connection = await NativeConnection.connect({
  address,
  tls: {
    clientCertPair: {
      crt: fs.readFileSync(clientCertPath),
      key: fs.readFileSync(clientKeyPath),
    },
  },
});`;

const PROD_CLIENT_SNIPPET = `function makeClient(): Client {
  const connection = Connection.lazy({
    address: 'localhost:7233',
    tls: {
      clientCertPair: {
        crt: fs.readFileSync(clientCertPath),
        key: fs.readFileSync(clientKeyPath),
      },
    },
  });
  return new Client({ connection });
}`;

export default function OneClickOrderAppNextjsPage() {
  return (
    <Layout
      title="Build a one-click order application with TypeScript and Next.js"
      description="Build a One-Click Buy application with Next.js and integrate Temporal using API routes for a durable order processing backend."
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
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  { label: "One-click order app with Next.js" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Build a one-click order application with TypeScript and Next.js
            </h1>

            <MetaChips items={["~60 minutes", "TypeScript", "Intermediate"]} />

            <section className={styles.section} id="introduction">
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p>
                When you're building an e-commerce application, you want
                to give customers a great user experience. You also need to
                make sure that any calls to external services - like
                databases, payment gateways, and other tools - are reliable.
              </p>
              <p>
                <a
                  href="https://nextjs.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Next.js
                </a>{" "}
                is a popular choice for building full-stack web
                applications using Node.js and React. You can deliver a
                great experience across the stack by integrating a Temporal
                Workflow with Next.js. Temporal provides fault tolerance
                and ensures that long-running processes and background
                tasks complete successfully, even in the event of failures.
              </p>
              <p>
                In this tutorial you'll build a back-end API using Next API
                Routes that starts a Temporal Workflow. Then you'll build a
                quick user interface with React and Tailwind to call that
                API.
              </p>
            </section>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  <Link to="/getting_started/typescript/dev_environment/">
                    Set up a local development environment for developing
                    Temporal applications using TypeScript
                  </Link>
                  .
                </li>
                <li>
                  Ensure you have a local Temporal Service running, and
                  that you can access the Temporal Web UI from port{" "}
                  <code>8233</code>.
                </li>
                <li>
                  Review the{" "}
                  <Link to="/getting_started/typescript/first_program_in_typescript/">
                    Run your first Temporal application with the TypeScript
                    SDK tutorial
                  </Link>{" "}
                  to understand the basics.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="create-project">
              <h2 className={styles.sectionTitle}>Create your project</h2>
              <p>
                Create a new Next.js project with{" "}
                <code>create-next-app</code>. Call the project{" "}
                <code>nextjs-temporal</code>:
              </p>
              <CodeBlock language="bash">
                npx create-next-app@latest nextjs-temporal
              </CodeBlock>
              <p>
                Accept the default values for each option. When dependencies
                install, switch to the new project's root directory:
              </p>
              <CodeBlock language="bash">cd nextjs-temporal</CodeBlock>

              <p>
                Install <code>@tsconfig/node20</code> as a developer
                dependency:
              </p>
              <CodeBlock language="bash">
                npm install --save-dev @tsconfig/node20
              </CodeBlock>

              <p>
                Install{" "}
                <a
                  href="https://nodemon.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nodemon
                </a>
                :
              </p>
              <CodeBlock language="bash">
                npm install --save-dev nodemon
              </CodeBlock>

              <p>Install Temporal and its dependencies:</p>
              <CodeBlock language="bash">
                npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
              </CodeBlock>

              <p>Create a directory to hold Temporal Workflows and Activities:</p>
              <CodeBlock language="bash">mkdir -p temporal/src</CodeBlock>

              <p>
                Configure TypeScript to compile from <code>temporal/src</code>{" "}
                to <code>temporal/lib</code> by adding a new{" "}
                <code>tsconfig.json</code> in the <code>temporal/src</code>{" "}
                folder:
              </p>
              <CodeBlock language="bash">touch temporal/tsconfig.json</CodeBlock>
              <p>Add the following configuration:</p>
              <CodeBlock language="json" title="temporal/tsconfig.json">
                {TSCONFIG_JSON}
              </CodeBlock>

              <p>Set up scripts. Add <code>npm-run-all</code>:</p>
              <CodeBlock language="bash">
                npm install npm-run-all --save-dev
              </CodeBlock>

              <p>
                Locate your existing <code>scripts</code> section:
              </p>
              <CodeBlock language="json">{ORIGINAL_SCRIPTS}</CodeBlock>
              <p>Change to:</p>
              <CodeBlock language="json">{NEW_SCRIPTS}</CodeBlock>
              <p>These scripts let you run with a single <code>npm run dev</code> command:</p>
              <ul>
                <li>build Temporal once.</li>
                <li>start Next.js locally.</li>
                <li>start a Temporal Worker.</li>
                <li>rebuild Temporal files when they change.</li>
              </ul>
            </section>

            <section className={styles.section} id="define-business-logic">
              <h2 className={styles.sectionTitle}>
                Define the business logic using Temporal
              </h2>
              <p>
                You'll use a Temporal Workflow to represent each order.
                Workflows orchestrate{" "}
                <a
                  href="https://docs.temporal.io/activities"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Activities
                </a>
                , which is how you interact with the outside world in
                Temporal. The Workflow you'll create will have a single
                Activity, <code>purchase</code>.
              </p>
              <p>Create <code>temporal/src/activities.ts</code>:</p>
              <CodeBlock language="bash">touch temporal/src/activities.ts</CodeBlock>
              <CodeBlock language="ts" title="temporal/src/activities.ts">
                {ACTIVITIES_TS}
              </CodeBlock>
              <p>
                The function prints a message and returns the Activity ID.
                In a real application, this would interact with a payment
                API.
              </p>

              <p>
                Define the <code>oneClickBuy</code> Workflow. Create{" "}
                <code>temporal/src/workflows.ts</code>:
              </p>
              <CodeBlock language="bash">touch temporal/src/workflows.ts</CodeBlock>
              <CodeBlock language="ts" title="temporal/src/workflows.ts">
                {WORKFLOWS_TS}
              </CodeBlock>
              <p>
                This Workflow calls the <code>purchase</code> Activity and
                then uses <code>await sleep()</code> to create an artificial
                delay.
              </p>
              <p>
                <a
                  href="https://docs.temporal.io/workflows#deterministic-constraints"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Workflows must be deterministic
                </a>
                , so you perform non-deterministic work in Activities. The
                TypeScript SDK bundles Workflow code and runs it inside a{" "}
                <a
                  href="https://docs.temporal.io/develop/typescript/core-application#workflow-logic-requirements"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  deterministic sandbox
                </a>
                . This sandbox can help detect if you're using
                nondeterministic code.
              </p>

              <p>
                Create a shared constant. Create{" "}
                <code>temporal/src/shared.ts</code>:
              </p>
              <CodeBlock language="bash">touch temporal/src/shared.ts</CodeBlock>
              <CodeBlock language="ts" title="temporal/src/shared.ts">
                {SHARED_TS}
              </CodeBlock>

              <p>Define the Worker program. Create <code>temporal/src/worker.ts</code>:</p>
              <CodeBlock language="bash">touch temporal/src/worker.ts</CodeBlock>
              <CodeBlock language="ts" title="temporal/src/worker.ts">
                {WORKER_TS}
              </CodeBlock>

              <p>Run your Worker:</p>
              <CodeBlock language="bash">
                npm run build:temporal && npm run start:worker
              </CodeBlock>
              <p>
                The Worker runs but won't have any tasks to perform because
                you haven't started a Workflow yet.
              </p>
            </section>

            <section className={styles.section} id="define-backend-api">
              <h2 className={styles.sectionTitle}>Define the back-end API</h2>
              <p>
                You'll use Next.js API routes to expose a serverless
                endpoint. Create a function that creates a new Temporal
                Client or returns the existing one. Add{" "}
                <code>temporal/src/client.ts</code>:
              </p>
              <CodeBlock language="bash">touch temporal/src/client.ts</CodeBlock>
              <CodeBlock language="ts" title="temporal/src/client.ts">
                {CLIENT_TS}
              </CodeBlock>

              <p>
                Build out the API route. Add a new <code>app/api/startBuy</code>{" "}
                folder:
              </p>
              <CodeBlock language="bash">mkdir -p app/api/startBuy</CodeBlock>
              <CodeBlock language="bash">touch app/api/startBuy/route.ts</CodeBlock>
              <CodeBlock language="ts" title="app/api/startBuy/route.ts">
                {API_TS}
              </CodeBlock>

              <p>
                <code>workflow.start</code> sends a request to the Temporal
                Service to start a Workflow Execution. The actual Workflow
                doesn't run until a Worker sees the Workflow Task in the
                Task Queue. This API endpoint immediately returns a
                response, even though the Workflow has a 10-second delay.
                If you change this to <code>workflow.execute</code>, the
                call will block until the Workflow finishes.
              </p>

              <p>Start Next.js and the Temporal Worker:</p>
              <CodeBlock language="bash">npm run dev</CodeBlock>

              <Admonition type="info" title="Connection issues">
                <p>If you receive an error like the following:</p>
                <CodeBlock>{ERROR_OUTPUT}</CodeBlock>
                <p>
                  This means the Temporal Client can't connect to the
                  Temporal Service. Open a separate terminal window and
                  start the service with <code>temporal server start-dev</code>.
                </p>
              </Admonition>

              <p>
                In another terminal, use <code>curl</code> to make a
                request:
              </p>
              <CodeBlock language="bash">
                {`curl -d '{"itemId":"1", "transactionId":"abc123"}' \\
     -H "Content-Type: application/json" \\
     -X POST http://localhost:3000/api/startBuy`}
              </CodeBlock>
              <p>You'll see:</p>
              <CodeBlock>{CURL_OUTPUT}</CodeBlock>
            </section>

            <section className={styles.section} id="build-frontend">
              <h2 className={styles.sectionTitle}>
                Build the front-end interface
              </h2>
              <p>
                Use React components with Next.js to make a request to the
                API you created. To call the API Route from the frontend,
                use the <code>fetch</code> API to make a request to{" "}
                <code>/api/startbuy</code> when a button is clicked.
              </p>
              <p>
                Open <code>app/page.tsx</code> and remove the generated
                contents. At the top, add directives and imports:
              </p>
              <CodeBlock language="tsx" title="app/page.tsx">
                {PAGE_START_TSX}
              </CodeBlock>

              <p>
                Define a TypeScript Interface for the Product's properties,
                a Type to define states for the purchase, and a collection
                of Products:
              </p>
              <CodeBlock language="tsx" title="app/page.tsx">
                {PAGE_VARS_TSX}
              </CodeBlock>

              <p>Define a <code>Product</code> component:</p>
              <CodeBlock language="tsx" title="app/page.tsx">
                {PAGE_PRODUCT_TSX}
              </CodeBlock>
              <p>
                The <code>buyProduct</code> function makes the call to
                start the Temporal Workflow. Based on the order state, the
                component renders different controls. Tailwind styles
                control the appearance.
              </p>

              <p>Add a <code>ProductList</code> component:</p>
              <CodeBlock language="tsx" title="app/page.tsx">
                {PAGE_LIST_TSX}
              </CodeBlock>

              <p>Add the <code>Home</code> component:</p>
              <CodeBlock language="tsx" title="app/page.tsx">
                {PAGE_HOME_TSX}
              </CodeBlock>

              <p>
                Visit <code>http://localhost:3000</code> in your browser
                and you'll see two products. Click their buttons to execute
                the Temporal Workflows. Log into the local Temporal Web UI
                running on <code>http://localhost:8233</code> to see the
                entire Workflow Execution.
              </p>

              <p>
                When moving from your local machine to either{" "}
                <a
                  href="https://temporal.io/cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Cloud
                </a>{" "}
                or a self-hosted Temporal Service, configure Temporal
                Clients and Workers to communicate with the remote
                service using mTLS. Change{" "}
                <code>temporal/src/worker.ts</code> to add certificate
                information:
              </p>
              <CodeBlock language="ts">{PROD_WORKER_SNIPPET}</CodeBlock>
              <p>
                Update the <code>makeClient</code> function in{" "}
                <code>temporal/src/client.ts</code>:
              </p>
              <CodeBlock language="ts">{PROD_CLIENT_SNIPPET}</CodeBlock>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You have a working full stack example of a Temporal
                Workflow running inside your Next.js app. From here you
                can add more Activities, or use this project as the basis
                for a different application that needs long-running
                processes.
              </p>
              <p>
                You can use{" "}
                <a
                  href="https://docs.temporal.io/develop/typescript#signals"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Signals
                </a>{" "}
                to send asynchronous data to running Workflows, and{" "}
                <a
                  href="https://docs.temporal.io/develop/typescript#queries"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Queries
                </a>{" "}
                to check the state of a Workflow.
              </p>
              <p>
                For a more detailed example, see the Next.js E-Commerce
                One-Click example in the{" "}
                <a
                  href="https://github.com/temporalio/samples-typescript/tree/main/nextjs-ecommerce-oneclick"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  samples-TypeScript repository
                </a>
                .
              </p>
              <p>
                You can deploy your Next.js app, including Next.js API
                Routes with Temporal Clients in them, anywhere you can
                deploy Next.js applications. However, you{" "}
                <strong>must deploy your Temporal Workers in
                traditional environments</strong>, such as EC2, DigitalOcean,
                or Render. They won't work in a serverless environment.
              </p>
              <ul>
                <li>
                  <a
                    href="https://docs.temporal.io/develop/typescript/data-encryption"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Securing your data
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/develop/typescript/testing-suite"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Testing your Workflows
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/develop/typescript/versioning"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Versioning your Workflows
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/develop/typescript/observability"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Observability
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.temporal.io/production-deployment"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Production Deployment
                  </a>
                </li>
              </ul>
            </section>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
