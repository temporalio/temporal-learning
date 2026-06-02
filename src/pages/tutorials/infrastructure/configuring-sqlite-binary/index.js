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
  { id: "prerequisites", label: "Prerequisites" },
  { id: "obtain-binaries", label: "Obtain the Temporal binaries" },
  { id: "configure-binaries", label: "Configure the binaries" },
  { id: "systemd", label: "Register systemd services" },
  { id: "additional", label: "Additional configuration options" },
  { id: "interact", label: "Interact with the Temporal Service" },
  { id: "conclusion", label: "Conclusion" },
];

const TEMPORAL_SERVER_YAML = `log:
  stdout: true
  level: info

persistence:
  defaultStore: sqlite-default
  visibilityStore: sqlite-visibility
  numHistoryShards: 4
  datastores:
    sqlite-default:
      sql:
        pluginName: "sqlite"
        databaseName: "/etc/temporal/default.db"
        connectAddr: "localhost"
        connectProtocol: "tcp"
        connectAttributes:
          cache: "private"
          setup: true

    sqlite-visibility:
      sql:
        pluginName: "sqlite"
        databaseName: "/etc/temporal/visibility.db"
        connectAddr: "localhost"
        connectProtocol: "tcp"
        connectAttributes:
          cache: "private"
          setup: true

global:
  membership:
    maxJoinDuration: 30s
    broadcastAddress: "127.0.0.1"
  pprof:
    port: 7936

services:
  frontend:
    rpc:
      grpcPort: 7233
      membershipPort: 6933
      bindOnIP: '0.0.0.0'
      httpPort: 7243

  matching:
    rpc:
      grpcPort: 7235
      membershipPort: 6935
      bindOnLocalHost: true

  history:
    rpc:
      grpcPort: 7234
      membershipPort: 6934
      bindOnLocalHost: true

  worker:
    rpc:
      membershipPort: 6939

clusterMetadata:
  enableGlobalNamespace: false
  failoverVersionIncrement: 10
  masterClusterName: "active"
  currentClusterName: "active"
  clusterInformation:
    active:
      enabled: true
      initialFailoverVersion: 1
      rpcName: "frontend"
      rpcAddress: "localhost:7233"
      httpAddress: "localhost:7243"

dcRedirectionPolicy:
  policy: "noop"`;

const TEMPORAL_UI_YAML = `temporalGrpcAddress: 127.0.0.1:7233
host: 0.0.0.0
port: 8233
enableUi: true
cors:
  allowOrigins:
    - http://localhost:8233
defaultNamespace: default`;

const SYSTEMD_TEMPORAL = `[Unit]
Description=Temporal Service
After=network.target

[Service]
User=temporal
Group=temporal
ExecStart=temporal-server -r / -c etc/temporal/ -e temporal-server start

[Install]
WantedBy=multi-user.target`;

const SYSTEMD_UI = `[Unit]
Description=Temporal UI Server
After=network.target

[Service]
User=temporal
Group=temporal
ExecStart=temporal-ui-server -r / -c etc/temporal/ -e temporal-ui-server start

[Install]
WantedBy=multi-user.target`;

const SYSTEMCTL_STATUS_OUTPUT = `● temporal.service - Temporal Service
     Loaded: loaded (/etc/systemd/system/temporal.service; disabled; vendo>
     Active: active (running) since Mon 2024-07-08 11:24:40 PDT; 4s ago
   Main PID: 19925 (temporal-server)
      Tasks: 22 (limit: 18707)
     Memory: 62.7M
     CGroup: /system.slice/temporal.service
             └─19925 temporal-server -r / -c etc/temporal/ -e temporal-server

Jul 08 11:24:42 Omelas temporal-server[19925]: {"level":"info","ts":"2024->
Jul 08 11:24:42 Omelas temporal-server[19925]: {"level":"info","ts":"2024->
Jul 08 11:24:42 Omelas temporal-server[19925]: {"level":"info","ts":"2024-`;

const CORS_SNIPPET = `cors:
  allowOrigins:
    - http://localhost:8233`;

const IMG_BASE = "/img/tutorials/infrastructure/configuring-sqlite-binary";

export default function ConfiguringSqliteBinaryPage() {
  return (
    <Layout
      title="Configure a Temporal Service without a Proxy"
      description="Configure a Temporal Service from scratch using the official Server binaries without requiring any additional dependencies."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/infra-tutorials-banner.png"
            alt="Infrastructure tutorials"
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
                  { label: "Infrastructure", href: "/tutorials/infrastructure" },
                  { label: "Configure without a proxy" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              How to configure a Temporal Service without a proxy
            </h1>

            <MetaChips items={["~30 minutes", "Production", "Self-hosted"]} />

            <p className={styles.intro}>
              There are many ways of deploying a Temporal Service. For a
              large-scale deployment, you can use{" "}
              <a
                href="https://github.com/temporalio/docker-compose"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docker
              </a>{" "}
              or{" "}
              <a
                href="https://github.com/temporalio/helm-charts"
                target="_blank"
                rel="noopener noreferrer"
              >
                Kubernetes
              </a>{" "}
              to configure multiple pods with the ability to scale
              horizontally. For local development, you can use the{" "}
              <code>server</code> subcommand of the{" "}
              <a
                href="https://docs.temporal.io/cli/server"
                target="_blank"
                rel="noopener noreferrer"
              >
                Temporal CLI client
              </a>{" "}
              to run a single-user server.
            </p>
            <p>
              If you need a deployment that fits in between these options - for
              example, if you need to scale for multiple users, with
              fine-grained control over your deployment parameters, but without
              the overhead of Kubernetes - you can deploy a Temporal Service
              using the official server binaries.
            </p>
            <p>
              In this tutorial, you'll configure and deploy the two binaries
              needed for a complete Temporal Service (the core server and the
              UI server). You'll create <code>systemd</code> unit files to
              gracefully run and restart the Temporal Service automatically
              upon server startup, and you'll review additional configuration
              parameters for your Temporal Service. This will give you
              everything you need to run a production Temporal Service, and
              evaluate how to scale further or{" "}
              <a
                href="https://temporal.io/cloud"
                target="_blank"
                rel="noopener noreferrer"
              >
                migrate to Temporal Cloud
              </a>
              .
            </p>

            <section className={styles.section} id="prerequisites">
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <ul>
                <li>
                  A Linux server with SSH access. This can be a new Ubuntu
                  server instance with no additional configuration performed.
                </li>
              </ul>
            </section>

            <section className={styles.section} id="obtain-binaries">
              <h2 className={styles.sectionTitle}>Obtain the Temporal binaries</h2>
              <p>You'll begin by downloading and configuring the Temporal Server binaries.</p>
              <p>
                The Temporal Core Server can be obtained from its{" "}
                <a
                  href="https://github.com/temporalio/temporal/releases/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Releases page
                </a>
                . The Temporal Core Server is responsible for orchestrating
                all tasks regarding the execution of Temporal Workflows, such
                as maintaining the Event History, maintaining Task Queues, and
                responding to commands. Download the newest binary for your
                operating system (probably <code>linux_amd64</code>) and
                extract it using <code>curl</code> and <code>tar</code>:
              </p>
              <CodeBlock language="bash">
                {`curl -OL https://github.com/temporalio/temporal/releases/download/v1.24.2/temporal_1.24.2_linux_amd64.tar.gz
tar -xzf temporal_1.24.2_linux_amd64.tar.gz`}
              </CodeBlock>
              <p>
                The extracted binary will be called <code>temporal-server</code>.
                Move it to the <code>/usr/bin/</code> directory on your path
                and make it executable:
              </p>
              <CodeBlock language="bash">
                {`sudo mv temporal-server /usr/bin/temporal-server
sudo chmod +x /usr/bin/temporal-server`}
              </CodeBlock>
              <p>
                You'll also need the Temporal UI server. The Temporal UI
                Server hooks into a Temporal Core Server and provides a
                web-based UI for displaying information about Workflow
                Executions. It is a standalone binary that can also be
                obtained from its{" "}
                <a
                  href="https://github.com/temporalio/ui-server/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Releases page
                </a>
                . Download the latest binary for your operating system and
                extract it:
              </p>
              <CodeBlock language="bash">
                {`curl -OL https://github.com/temporalio/ui-server/releases/download/v2.28.0/ui-server_2.28.0_linux_amd64.tar.gz
tar -xzf ui-server_2.28.0_linux_amd64.tar.gz`}
              </CodeBlock>
              <p>
                The extracted binary will be called <code>ui-server</code>.
                Move it to <code>/usr/bin</code>:
              </p>
              <CodeBlock language="bash">
                {`sudo mv ui-server /usr/bin/temporal-ui-server
sudo chmod +x /usr/bin/temporal-ui-server`}
              </CodeBlock>
              <p>
                At this point, you've downloaded everything you need. The last
                thing to do is create a <code>temporal</code> user on your
                server that has the appropriate permissions to run the
                Temporal Service, and a directory accessible to this user to
                store your data in:
              </p>
              <CodeBlock language="bash">
                {`sudo useradd temporal
sudo mkdir /etc/temporal
sudo chown temporal /etc/temporal`}
              </CodeBlock>
              <p>
                Next, you'll create configuration files for both the Temporal
                Server and the UI Server in <code>/etc/temporal/</code>.
              </p>
            </section>

            <section className={styles.section} id="configure-binaries">
              <h2 className={styles.sectionTitle}>Configure the binaries</h2>
              <p>
                In this tutorial, you'll configure a connection to a SQLite
                database, since it doesn't require any additional
                dependencies. Open a new file at{" "}
                <code>/etc/temporal/temporal-server.yaml</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/temporal/temporal-server.yaml
              </CodeBlock>
              <p>
                Paste the following contents into the file for a starting
                configuration. You can update any of these values later.
              </p>
              <CodeBlock language="yaml" title="/etc/temporal/temporal-server.yaml">
                {TEMPORAL_SERVER_YAML}
              </CodeBlock>
              <p>
                Note <code>localhost:7233</code> in the <code>rpcAddress</code>{" "}
                parameter. If you are using a domain name, update this to
                reflect the URL that the Temporal gRPC API will be available
                on. You may use a subdomain like{" "}
                <code>rpc.my_domain:7233</code>. If you use a port other than
                7233, you should also update the <code>grpcPort: 7233</code>{" "}
                parameter of the frontend service.
              </p>

              <Admonition type="note" title="External access to the Temporal Service">
                <p>
                  The gRPC API frontend configuration in this tutorial uses a
                  default value of <code>bindOnIP: '0.0.0.0'</code>, meaning
                  that the Temporal API will be available globally, without
                  authentication, to anyone who can access this server. This
                  is generally only appropriate if you are otherwise
                  controlling access to this server (e.g. through Kubernetes
                  or by using an external proxy). If you need a self-contained
                  access control solution, refer to our tutorials on{" "}
                  <Link to="/tutorials/infrastructure/nginx-sqlite-binary/">
                    Deploying Temporal with Nginx
                  </Link>{" "}
                  or{" "}
                  <Link to="/tutorials/infrastructure/envoy-sqlite-binary/">
                    Deploying Temporal with Envoy
                  </Link>
                  .
                </p>
              </Admonition>

              <Admonition type="tip">
                <p>
                  Temporal's gRPC API does not use TLS by default; depending
                  on your security envelope, TLS is not always necessary for
                  gRPC endpoints. To configure TLS for your gRPC endpoint,
                  refer to the{" "}
                  <a
                    href="https://docs.temporal.io/references/configuration#tls"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Temporal documentation
                  </a>
                  .
                </p>
              </Admonition>

              <p>
                Save and close the file. Next, create the configuration file
                for the UI Server at{" "}
                <code>/etc/temporal/temporal-ui-server.yaml</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/temporal/temporal-ui-server.yaml
              </CodeBlock>
              <p>Paste the following contents into the file:</p>
              <CodeBlock language="yaml" title="/etc/temporal/temporal-ui-server.yaml">
                {TEMPORAL_UI_YAML}
              </CodeBlock>
              <p>
                As with the gRPC API, this will make the Web UI available
                over HTTP to anyone who can access this server - ensure that
                you do not need a local proxy solution before proceeding.
              </p>
              <p>
                You can now run a Temporal Service on this server. In the
                remainder of this tutorial, you'll configure this server for
                production use.
              </p>
            </section>

            <section className={styles.section} id="systemd">
              <h2 className={styles.sectionTitle}>
                Create and register system services
              </h2>
              <p>
                Because you installed Temporal directly from binaries, you
                need to run it manually from the command line. To run them
                automatically, you'll need to set up your own background
                services.
              </p>
              <p>
                You'll create <code>unit</code> files that can be used by your
                server's <code>init</code> system. On nearly all modern Linux
                distributions, the init system is called <strong>systemd</strong>,
                and you can interact with it by using the{" "}
                <code>systemctl</code> command.
              </p>
              <p>
                Open a new file at <code>/etc/systemd/system/temporal.service</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/systemd/system/temporal.service
              </CodeBlock>
              <p>
                Your unit file needs, at minimum, a <code>[Unit]</code>{" "}
                section, a <code>[Service]</code> section, and an{" "}
                <code>[Install]</code> section:
              </p>
              <CodeBlock title="/etc/systemd/system/temporal.service">
                {SYSTEMD_TEMPORAL}
              </CodeBlock>
              <p>This file can be broken down as follows:</p>
              <ul>
                <li>
                  The <code>[Unit]</code> section contains a plaintext{" "}
                  <code>Description</code> of your new service, as well as an{" "}
                  <code>After</code> hook that specifies when it should be run
                  at system startup - in this case, after your server's
                  networking interfaces have come up.
                </li>
                <li>
                  The <code>[Service]</code> section specifies which command
                  (<code>ExecStart</code>) should run, as well as which{" "}
                  <code>User</code> and <code>Group</code> the command should
                  be running as. You'll use the <code>temporal</code> user you
                  created and the <code>temporal-server</code> command from
                  the previous step.
                </li>
                <li>
                  The <code>[Install]</code> section contains only the{" "}
                  <code>WantedBy=multi-user.target</code> line, which works
                  together with the <code>After</code> line to ensure that
                  the service starts when the server is ready to accept user
                  logins.
                </li>
              </ul>
              <p>
                Save and close the file. You can now <code>start</code> your
                new Temporal service, and <code>enable</code> it to run on
                boot automatically:
              </p>
              <CodeBlock language="bash">
                {`sudo systemctl start temporal
sudo systemctl enable temporal`}
              </CodeBlock>
              <p>
                Use the <code>systemctl</code> command to verify that{" "}
                <code>temporal</code> started successfully. You should receive
                similar output to when you first ran the command in a
                terminal:
              </p>
              <CodeBlock language="bash">
                sudo systemctl status temporal
              </CodeBlock>
              <CodeBlock>{SYSTEMCTL_STATUS_OUTPUT}</CodeBlock>
              <p>
                Next, repeat these steps for the UI server. Open a new file
                at <code>/etc/systemd/system/temporal-ui.service</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/systemd/system/temporal-ui.service
              </CodeBlock>
              <p>Add the following contents:</p>
              <CodeBlock title="/etc/systemd/system/temporal-ui.service">
                {SYSTEMD_UI}
              </CodeBlock>
              <p>
                Save and close the file, then <code>start</code> the UI Server
                service and <code>enable</code> it to run on boot
                automatically:
              </p>
              <CodeBlock language="bash">
                {`sudo systemctl start temporal-ui
sudo systemctl enable temporal-ui`}
              </CodeBlock>
              <p>
                Use the <code>systemctl</code> command to verify that{" "}
                <code>temporal-ui</code> started successfully:
              </p>
              <CodeBlock language="bash">
                sudo systemctl status temporal-ui
              </CodeBlock>
              <p>
                Both services should now be running in the background.
                Navigate to <strong>YOUR_SERVER_IP:8233</strong> in a web
                browser, and you should receive the Temporal Web UI. You now
                have a working Temporal Service. In the next step, you'll
                review some additional configuration options.
              </p>
            </section>

            <section className={styles.section} id="additional">
              <h2 className={styles.sectionTitle}>
                Additional configuration options
              </h2>

              <h3>Other database backends</h3>
              <p>
                This tutorial provides an example of using Temporal with a
                SQLite database backend. Temporal also supports MySQL,
                PostgreSQL, and Cassandra as database backends. Refer to the{" "}
                <a
                  href="https://docs.temporal.io/references/configuration#datastores"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  datastores
                </a>{" "}
                documentation reference to make changes.
              </p>

              <h3>Load balancing</h3>
              <p>
                You may have noticed that the <code>temporal-server.yaml</code>{" "}
                configuration file that you edited earlier also contained
                several other port bindings - for example, the History
                service and the Matching service. This is because most
                components of a Temporal Service can scale horizontally by
                adding additional nodes that can communicate and distribute
                load across a cluster.
              </p>
              <p>
                In this tutorial, you deployed a single, standalone server
                binary. For more information about adding additional nodes,
                refer to{" "}
                <a
                  href="https://temporal.io/blog/scaling-temporal-the-basics"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Scaling Temporal: The Basics
                </a>
                .
              </p>

              <h3>Visibility</h3>
              <p>
                This tutorial actually creates two different SQLite databases
                - one for persisting your Workflow Event Histories, and
                another to act as a Visibility store. A Visibility store is
                required in a Temporal Service setup because it is used for
                querying and filtering your Workflows. Like your primary data
                store, your Visibility store can be configured to use a
                different database backend, and does not need to use the same
                configuration as your primary data store.
              </p>
              <p>
                It is also possible to configure two Visibility stores, called{" "}
                <a
                  href="https://docs.temporal.io/visibility#dual-visibility"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dual Visibility
                </a>
                . This can be useful when preparing to migrate databases, or
                if your deployment is optimized to read from one database and
                write to another. Refer to{" "}
                <a
                  href="https://docs.temporal.io/self-hosted-guide/visibility#dual-visibility"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How to set up Dual Visibility
                </a>{" "}
                for more information.
              </p>

              <h3>CORS</h3>
              <p>
                The Web UI configuration that you supplied in this tutorial
                contained this parameter:
              </p>
              <CodeBlock language="yaml">{CORS_SNIPPET}</CodeBlock>
              <p>
                This means that{" "}
                <a
                  href="https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CORS
                </a>{" "}
                will only work over localhost. If you eventually need to
                configure a{" "}
                <a
                  href="https://docs.temporal.io/production-deployment/data-encryption"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Codec Server
                </a>{" "}
                for your Temporal instance, you will also need to update your{" "}
                <code>allowOrigins</code> list to include every IP that needs
                to perform decoding in the Web UI.
              </p>

              <h3>Dev Ops</h3>
              <p>
                For any parameters not covered in this tutorial, refer to the
                Temporal documentation reference for both the{" "}
                <a
                  href="https://docs.temporal.io/references/configuration"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Server
                </a>{" "}
                (also referred to as a Temporal Cluster) and the{" "}
                <a
                  href="https://docs.temporal.io/references/web-ui-configuration"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Web UI
                </a>
                . There are also dedicated documentation pages for several
                other{" "}
                <a
                  href="https://docs.temporal.io/self-hosted-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  self-hosting topics
                </a>
                .
              </p>
              <p>
                You can also refer to the{" "}
                <a
                  href="https://github.com/temporalio/temporal/blob/main/docker/config_template.yaml"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Docker configuration template
                </a>{" "}
                used by Temporal's{" "}
                <a
                  href="https://hub.docker.com/r/temporalio/auto-setup"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dockerhub images
                </a>
                . If you are using Kubernetes, Temporal's{" "}
                <a
                  href="https://github.com/temporalio/helm-charts"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  helm-charts repo
                </a>{" "}
                contains detailed documentation of the available options. You
                may also be interested in the{" "}
                <a
                  href="https://github.com/alexandrevilain/temporal-operator"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Kubernetes Operator
                </a>
                .
              </p>
              <p>
                At this point, you're finished with configuration. In the
                final step, you'll review the logs generated by your Temporal
                Service, as well as your options for connecting to it from
                the Temporal CLI or SDK.
              </p>
            </section>

            <section className={styles.section} id="interact">
              <h2 className={styles.sectionTitle}>
                Interact with the Temporal Service
              </h2>
              <p>
                You can use <code>journalctl</code> to access logs from the
                Temporal Server. <code>journalctl -u service-name.service</code>{" "}
                allows you to view the full logs of any service running
                through <code>systemd</code>.
              </p>
              <p>
                If you ever need to restart the Temporal Service after making
                a configuration change, use <code>systemctl restart temporal</code>{" "}
                or <code>systemctl restart temporal-ui</code>.
              </p>
              <p>
                Finally, you should now be able to interact with your Temporal
                Service as if it were running locally. Just include{" "}
                <code>--address your_server:7233</code> with your CLI commands
                as needed. The first thing you'll likely need to do is create
                a <code>default</code> namespace, since this is not done
                automatically:
              </p>
              <CodeBlock language="bash">
                temporal --address your_server:7233 operator namespace create default
              </CodeBlock>
              <p>
                After that, you can visit the Web UI to ensure that it loads
                the <code>default</code> namespace correctly by visiting{" "}
                <code>your_server</code> in a browser:
              </p>
              <p>
                <img
                  src={`${IMG_BASE}/default-webui.png`}
                  alt="A screenshot of the Temporal Web UI showing the default namespace"
                  className={styles.diagramImage}
                />
              </p>
              <p>From then on, you can run commands like so:</p>
              <CodeBlock language="bash">
                temporal --address your_server:7233 workflow list
              </CodeBlock>
              <p>
                Refer to the{" "}
                <a
                  href="https://docs.temporal.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal documentation
                </a>{" "}
                for more.
              </p>
            </section>

            <section className={styles.section} id="conclusion">
              <h2 className={styles.sectionTitle}>Conclusion</h2>
              <p>
                In this tutorial, you configured and deployed a baseline
                Temporal Service. Next, you can read about Temporal's{" "}
                <a
                  href="https://docs.temporal.io/visibility"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visibility features
                </a>{" "}
                which require adding ElasticSearch to your deployment. You
                can also{" "}
                <Link to="/courses/">
                  learn more about the Temporal platform by following our
                  self-paced online courses
                </Link>
                , or talk to an expert about{" "}
                <a
                  href="https://temporal.io/cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Temporal Cloud
                </a>
                .
              </p>
            </section>

            <div className={styles.nextSection}>
              <h2 className={styles.nextHeading}>What's next?</h2>
              <div className={styles.nextGrid}>
                <Link
                  to="/tutorials/infrastructure/nginx-sqlite-binary/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Add a proxy</span>
                  <h3 className={styles.nextTitle}>Deploy with Nginx</h3>
                  <p className={styles.nextBody}>
                    Front the Temporal API and Web UI with Nginx for HTTPS
                    and IP-based access control.
                  </p>
                  <span className={styles.nextCta}>
                    Set up Nginx <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/infrastructure/envoy-sqlite-binary/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Add a proxy</span>
                  <h3 className={styles.nextTitle}>Deploy with Envoy</h3>
                  <p className={styles.nextBody}>
                    Use Envoy as an edge proxy with RBAC and CORS - well-suited
                    for load-balanced setups.
                  </p>
                  <span className={styles.nextCta}>
                    Set up Envoy <span aria-hidden="true">→</span>
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
