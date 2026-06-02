// Tutorial chapter 2 of 2: Deploy the Slack App to DigitalOcean.

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
  { n: 1, label: "Build the app", href: "/tutorials/typescript/work-queue-slack-app/build/" },
  { n: 2, label: "Deploy to production", href: "/tutorials/typescript/work-queue-slack-app/deploy/" },
];

const TOC_ITEMS = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "prepare-app", label: "Prepare app for Temporal Cloud" },
  { id: "create-droplet", label: "Create and set up Droplet" },
  { id: "configure-app", label: "Configure the app on Droplet" },
  { id: "use-pm2", label: "Use pm2 to run the Worker" },
  { id: "automate-deployment", label: "Automate deployment (Optional)" },
  { id: "conclusion", label: "Conclusion" },
];

const IMG_BUILD_BASE = "/img/tutorials/typescript/work-queue-slack-app/build";

const ENV_VARS = `TEMPORAL_CLOUD_ADDRESS="<your-temporal-cloud-address>"
TEMPORAL_CLOUD_NAMESPACE="<your-temporal-cloud-namespace>"
# Note that you will want to retain the multiline format for the PEM and Private Key
TEMPORAL_CLOUD_PEM="<your-temoral-cloud-namespace-pem>"
TEMPORAL_CLOUD_PRIVATE_KEY="<your-temporal-cloud-namespace-key>"`;

const DEV_CLIENT_TS = `import 'dotenv/config';
import { Client, Connection } from '@temporalio/client';

export let temporalClient: Client;

export async function initializeTemporalClient() {
  const connection = await Connection.connect();

  temporalClient = new Client({
    connection,
    namespace: process.env.TEMPORAL_DEV_NAMESPACE!,
  });
}`;

const CLOUD_CLIENT_TS = `import 'dotenv/config';
import { Client, Connection } from '@temporalio/client';

export let temporalClient: Client;

export async function initializeTemporalClient() {
  const key = Buffer.from(process.env.TEMPORAL_CLOUD_PRIVATE_KEY!, 'utf-8');
  const cert = Buffer.from(process.env.TEMPORAL_CLOUD_PEM!, 'utf-8');
  const address = process.env.TEMPORAL_CLOUD_ADDRESS!;
  const namespace = process.env.TEMPORAL_CLOUD_NAMESPACE!;
  const connection = await Connection.connect({
    address: address,
    tls: {
      clientCertPair: {
        crt: cert,
        key: key,
      },
    },
  });

  temporalClient = new Client({
    connection,
    namespace: namespace,
  });
}`;

const DEV_WORKER_TS = `import 'dotenv/config';
import { NativeConnection, Worker } from '@temporalio/worker';
import path from 'path';

async function run() {
  try {
    const worker = await Worker.create({
      namespace: process.env.TEMPORAL_DEV_NAMESPACE || '',
      workflowsPath: path.resolve(__dirname, './workflows'),
      taskQueue: \`\${process.env.ENV}-temporal-iq-task-queue\`,
    });

    await worker.run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();`;

const CLOUD_WORKER_TS = `import 'dotenv/config';
import { NativeConnection, Worker } from '@temporalio/worker';
import path from 'path';

async function run() {
  try {
    const key = Buffer.from(
      process.env.TEMPORAL_CLOUD_PRIVATE_KEY || '',
      'utf-8',
    );
    const cert = Buffer.from(process.env.TEMPORAL_CLOUD_PEM || '', 'utf-8');
    const connection = await NativeConnection.connect({
      address: process.env.TEMPORAL_CLOUD_ADDRESS || '',
      tls: {
        clientCertPair: {
          crt: cert,
          key: key,
        },
      },
    });

    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_CLOUD_NAMESPACE || '',
      workflowsPath: path.resolve(__dirname, './workflows'),
      taskQueue: \`\${process.env.ENV}-temporal-iq-task-queue\`,
    });

    await worker.run();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();`;

const DEPLOY_SCRIPT = `#!/bin/bash

set -e

# The URL of your git repository
REPO_URL="https://github.com/<your-org>/<your-repo>"

# The directory you want to clone into
CLONE_DIR="your-workqueue-slack-app"

# Environment variables
SLACK_SIGNING_SECRET="<your-slack-signing-secret"
SLACK_BOT_TOKEN="<your-slack-bot-token>"
SLACK_APP_TOKEN="<your-slack-app-token>"
ENV="prod"
TEMPORAL_CLOUD_ADDRESS="<your-temporal-cloud-address>"
TEMPORAL_CLOUD_NAMESPACE="<your-temporal-cloud-namespace>"
# Note that you will want to retain the multiline format for the PEM and Private Key
TEMPORAL_CLOUD_PEM="<your-temoral-cloud-namespace-pem>"
TEMPORAL_CLOUD_PRIVATE_KEY="<your-temporal-cloud-namespace-key>"

# Remove directory if it exists
rm -rf $CLONE_DIR

# Clone the repository
git clone $REPO_URL $CLONE_DIR

# Kill all the current processes
pm2 kill

# Move into the temporal-application directory
cd $CLONE_DIR/temporal-application

# Create the .env file and populate it with the environment variables
echo "ENV=$ENV" > .env
echo "TEMPORAL_CLOUD_NAMESPACE=$TEMPORAL_CLOUD_NAMESPACE" >> .env
echo "TEMPORAL_CLOUD_ADDRESS=$TEMPORAL_CLOUD_ADDRESS" >> .env
echo "TEMPORAL_CLOUD_PEM=\\"$TEMPORAL_CLOUD_PEM\\"" >> .env
echo "TEMPORAL_CLOUD_PRIVATE_KEY=\\"$TEMPORAL_CLOUD_PRIVATE_KEY\\"" >> .env

npm install

pm2 start  ./api_server.js
# Sleep provides a delay to ensure the process is started before saving
sleep 1
pm2 save
sleep 1

cd ..

cd bot

# Create the .env file and populate it with the environment variables
echo "ENV=$ENV" > .env
echo "SLACK_SIGNING_SECRET=$SLACK_SIGNING_SECRET" >> .env
echo "SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN" >> .env
echo "SLACK_APP_TOKEN=$SLACK_APP_TOKEN" >> .env
echo "TEMPORAL_CLOUD_NAMESPACE=$TEMPORAL_CLOUD_NAMESPACE" >> .env
echo "TEMPORAL_CLOUD_ADDRESS=$TEMPORAL_CLOUD_ADDRESS" >> .env
echo "TEMPORAL_CLOUD_PEM=\\"$TEMPORAL_CLOUD_PEM\\"" >> .env
echo "TEMPORAL_CLOUD_PRIVATE_KEY=\\"$TEMPORAL_CLOUD_PRIVATE_KEY\\"" >> .env

npm install

pm2 start ./slack_bot.js
sleep 1
pm2 save

echo "The repository has been cloned, .env files have been created successfully, and processes have been started."`;

export default function WorkQueueDeployPage() {
  return (
    <Layout
      title="Deploy to production - Work Queue Slack App with TypeScript"
      description="Deploy your TypeScript and Temporal-based Slack App to production on a DigitalOcean Droplet using Temporal Cloud."
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
                  { label: "Temporal University", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "TypeScript", href: "/tutorials/typescript" },
                  {
                    label: "Work Queue Slack App",
                    href: "/tutorials/typescript/work-queue-slack-app/",
                  },
                  { label: "Deploy to production" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              Deploy a TypeScript Slack App to DigitalOcean using Temporal Cloud
            </h1>

            <MetaChips items={["~60 minutes", "TypeScript", "Production"]} />

            <TutorialStepper steps={TUTORIAL_STEPS} currentStep={2} />

            <p className={styles.intro}>
              When you are ready to deploy your TypeScript Slack App to
              production, you need a server to host it. You also need to
              connect to a Temporal Service to orchestrate and supervise
              your Temporal Application. In production you'll want a
              Temporal Service that can handle scale, like Temporal Cloud.
            </p>

            <p>
              <img
                src={`${IMG_BUILD_BASE}/temporal-slack-app-dev-vs-prod.svg`}
                alt="Temporal development vs production"
                className={styles.diagramImage}
              />
            </p>

            <p>
              DigitalOcean provides flexible Cloud servers called Droplets
              that you can use to host your Slack bot and Temporal
              Application. In this tutorial you'll deploy your
              Temporal-backed Slack App to a DigitalOcean Droplet while
              using Temporal Cloud as your orchestrator.
            </p>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  Complete the{" "}
                  <Link to="/tutorials/typescript/work-queue-slack-app/build/">
                    Build a Work Queue Slack App with TypeScript and Temporal
                  </Link>{" "}
                  tutorial.
                </li>
                <li>
                  A{" "}
                  <a
                    href="https://cloud.digitalocean.com/login"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    DigitalOcean account
                  </a>{" "}
                  to create a Droplet.
                </li>
                <li>
                  A domain name (you need a valid SSL certificate for the
                  Temporal Application to communicate with Temporal Cloud).
                </li>
                <li>
                  A{" "}
                  <a
                    href="https://cloud.temporal.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal Cloud account
                  </a>{" "}
                  from which to create a Namespace.
                </li>
                <li>
                  A Temporal Cloud{" "}
                  <a
                    href="https://docs.temporal.io/cloud/namespaces#create-a-namespace"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Namespace
                  </a>
                  .
                </li>
                <li>
                  A Temporal Cloud Namespace Certificate. You can use
                  tcld to generate the certificate. Follow the{" "}
                  <a
                    href="https://docs.temporal.io/cloud/tcld#install-tcld"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    steps to install tcld
                  </a>{" "}
                  then the{" "}
                  <a
                    href="https://docs.temporal.io/cloud/certificates#use-tcld-to-generate-certificates"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    steps to generate a Temporal Cloud certificate
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section className={styles.section} id="prepare-app">
              <h2 className={styles.sectionTitle}>
                Prepare your app for Temporal Cloud
              </h2>
              <p>
                Update each of your <code>.env</code> files with your
                Temporal Cloud credentials so you can test locally with
                Temporal Cloud. Add your PEM (certificate), Private Key,
                Temporal Address, and Temporal Cloud Namespace:
              </p>
              <CodeBlock>{ENV_VARS}</CodeBlock>

              <p>
                Then, update your code to use Temporal Cloud. Connecting to
                Temporal Cloud requires a few changes to your Temporal
                Client and Worker. When developing locally, your Temporal
                Client looks like this:
              </p>
              <CodeBlock language="ts" title="bot/modules/dev-temporal-client.ts">
                {DEV_CLIENT_TS}
              </CodeBlock>

              <p>
                To use Temporal Cloud, change the Temporal Client code to
                read your Namespace certificate key and PEM env variables,
                and change the connection object to include the Namespace
                and certificate information:
              </p>
              <CodeBlock language="ts" title="bot/modules/cloud-temporal-client.ts">
                {CLOUD_CLIENT_TS}
              </CodeBlock>

              <p>
                Update the Temporal Worker. When developing locally:
              </p>
              <CodeBlock language="ts" title="temporal-application/src/dev-worker.ts">
                {DEV_WORKER_TS}
              </CodeBlock>
              <p>To use Temporal Cloud, alter <code>worker.ts</code>:</p>
              <CodeBlock language="ts" title="temporal-application/src/cloud-worker.ts">
                {CLOUD_WORKER_TS}
              </CodeBlock>

              <p>
                Run your application locally to ensure it works with
                Temporal Cloud. If it does, move on to setting up your
                Droplet.
              </p>
            </section>

            <section className={styles.section} id="create-droplet">
              <h2 className={styles.sectionTitle}>Create and set up Droplet</h2>
              <p>
                Create a new Droplet and choose the Ubuntu 20.04 image or
                Ubuntu 22.04 image. Once created, ensure the domain's A
                record points to the droplet's IP address.
              </p>
              <p>Then set up:</p>
              <ul>
                <li>Configure SSH</li>
                <li>Install Node.js</li>
                <li>Install TypeScript and TS Node</li>
                <li>Set up Nginx as a reverse proxy</li>
                <li>Create a domain certificate</li>
              </ul>

              <p>
                First, set up SSH following the{" "}
                <a
                  href="https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add SSH Key to Droplet tutorial
                </a>
                . If you already have a private key on your local machine
                and need to force SSH to use the new key:
              </p>
              <CodeBlock language="bash">
                ssh -i ~/.ssh/id_rsa_digitalocean root@your-droplet-ip
              </CodeBlock>

              <p>Install Node.js. On Ubuntu:</p>
              <CodeBlock language="bash">
                {`sudo apt update
sudo apt install nodejs`}
              </CodeBlock>
              <p>This installs the newest stable version from Ubuntu sources. For different versions:</p>
              <ul>
                <li>
                  <a
                    href="https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How To Install Node.js on Ubuntu 20.04
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How To Install Node.js on Ubuntu 22.04
                  </a>
                </li>
              </ul>

              <p>
                Install the <code>typescript</code> and <code>ts-node</code>{" "}
                packages globally:
              </p>
              <CodeBlock language="bash">
                sudo npm install -g typescript ts-node
              </CodeBlock>

              <p>
                We strongly recommend using Nginx as a reverse proxy. Node
                applications typically bind to <code>localhost</code>, so
                an Nginx reverse proxy isolates the application server
                from direct internet access. Follow these tutorials:
              </p>
              <ul>
                <li>
                  <a
                    href="https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Set up Nginx for Ubuntu 20.04
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-reverse-proxy-on-ubuntu-22-04"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Set up Nginx for Ubuntu 22.04
                  </a>
                </li>
              </ul>

              <p>
                Use <strong>Let's Encrypt certbot</strong> to create a
                certificate for your domain:
              </p>
              <ul>
                <li>
                  <a
                    href="https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How To Secure Nginx with Let's Encrypt on Ubuntu 20.04
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How To Secure Nginx with Let's Encrypt on Ubuntu 22.04
                  </a>
                </li>
              </ul>
            </section>

            <section className={styles.section} id="configure-app">
              <h2 className={styles.sectionTitle}>
                Configure your Slack App on the Droplet
              </h2>
              <p>Using Git, clone the repo and install the dependencies:</p>
              <CodeBlock language="bash">
                {`git clone <your-repo>
cd <your-repo>/temporal-application
npm install
cd ..
cd <your-repo>/bot
npm install`}
              </CodeBlock>

              <Admonition type="note" title="Private repos require an access token">
                <p>
                  If your repo is public these steps work as-is. If
                  private, use an access token to clone the repo.
                </p>
              </Admonition>

              <p>
                Since your <code>.env</code> files should be in your{" "}
                <code>.gitignore</code>, create new ones on the Droplet.
                Copy and paste the information from your local{" "}
                <code>.env</code> files into the respective files on the
                Droplet.
              </p>
              <p>
                Now run your application on the Droplet. Start the slack
                bot and the Temporal Worker. Go to your Slack workspace
                and test your Slack App. If everything is running as
                expected, move on to starting everything with{" "}
                <code>pm2</code>.
              </p>
            </section>

            <section className={styles.section} id="use-pm2">
              <h2 className={styles.sectionTitle}>
                Use pm2 to run your Worker
              </h2>
              <p>
                <code>pm2</code> is a process manager for Node.js
                applications that ensures your TypeScript application runs
                continuously on your Droplet.
              </p>
              <CodeBlock language="bash">sudo npm install -g pm2</CodeBlock>

              <p>
                Change directory into your project and run your Temporal
                Worker with <code>pm2</code>:
              </p>
              <CodeBlock language="bash">
                pm2 start &lt;your-app-entry&gt;.ts --interpreter ts-node
              </CodeBlock>

              <Admonition type="tip" title="Use the pm2 startup script to ensure your application starts on boot">
                <p>
                  Use{" "}
                  <a
                    href="https://pm2.keymetrics.io/docs/usage/startup/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    the pm2 startup command
                  </a>{" "}
                  to generate a script that will start <code>pm2</code> on
                  boot. This ensures your application starts if your
                  Droplet restarts.
                </p>
              </Admonition>

              <p>
                Review your application logs with the <code>pm2 logs</code>{" "}
                command.
              </p>
            </section>

            <section className={styles.section} id="automate-deployment">
              <h2 className={styles.sectionTitle}>
                Optional - Automate deployment with a shell script
              </h2>
              <p>
                Automate the deployment of your application to your
                Droplet by creating a shell script that clones your repo,
                installs dependencies, and starts your application with{" "}
                <code>pm2</code>:
              </p>
              <CodeBlock language="bash">{DEPLOY_SCRIPT}</CodeBlock>
              <p>
                Run the script with <code>./&lt;your-script&gt;.sh</code>.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                You now have a TypeScript-based Temporal Application and
                Slack bot running on a DigitalOcean Droplet using Temporal
                Cloud as your Temporal Application's orchestrator.
              </p>
            </section>

            <div className={styles.chapterNav}>
              <Link
                to="/tutorials/typescript/work-queue-slack-app/build/"
                className={styles.chapterNavCard}
              >
                <span className={styles.chapterNavEyebrow}>
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    ←
                  </span>{" "}
                  Previous: chapter 1
                </span>
                <span className={styles.chapterNavTitle}>Build the app</span>
              </Link>
              <Link
                to="/tutorials/typescript"
                className={`${styles.chapterNavCard} ${styles.chapterNavCardNext}`}
              >
                <span className={styles.chapterNavEyebrow}>
                  Back to TypeScript tutorials{" "}
                  <span aria-hidden="true" className={styles.chapterNavArrow}>
                    →
                  </span>
                </span>
                <span className={styles.chapterNavTitle}>
                  All TypeScript tutorials
                </span>
              </Link>
            </div>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/typescript/background-check/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Tutorial series</span>
                  <h3 className={styles.nextTitle}>
                    Build a Background Check application
                  </h3>
                  <p className={styles.nextBody}>
                    Learn Temporal's core concepts while building a
                    Background Check application from project setup through
                    durable execution.
                  </p>
                  <span className={styles.nextCta}>
                    Start the series <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/typescript/recurring-billing-system/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Tutorial</span>
                  <h3 className={styles.nextTitle}>
                    Build a recurring billing subscription system
                  </h3>
                  <p className={styles.nextBody}>
                    Implement a subscription application using Workflows,
                    Activities, Signals, and Queries.
                  </p>
                  <span className={styles.nextCta}>
                    Start the tutorial <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </main>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
