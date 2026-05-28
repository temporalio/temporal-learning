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
  { id: "nginx", label: "Deploy an Nginx reverse proxy" },
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
      grpcPort: 7236
      membershipPort: 6933
      bindOnLocalHost: true
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
      rpcAddress: "localhost:7236"
      httpAddress: "localhost:7243"

dcRedirectionPolicy:
  policy: "noop"`;

const TEMPORAL_UI_YAML = `temporalGrpcAddress: 127.0.0.1:7236
host: 127.0.0.1
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

const CERTBOT_LS_OUTPUT = `README  cert.pem  chain.pem  fullchain.pem  privkey.pem`;

const NGINX_UI_CONFIG = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name YOUR_DOMAIN www.YOUR_DOMAIN

    access_log /var/log/nginx/temporal.access.log;
    error_log /var/log/nginx/temporal.error.log;

    location / {
        proxy_pass http://127.0.0.1:8233;
        proxy_http_version 1.1;
        proxy_read_timeout 300;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Real-PORT $remote_port;
        allow YOUR_IP_ADDRESSES;
        deny all;
    }

    listen 443 ssl;
    # RSA certificate
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;

    # Redirect non-https traffic to https
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}`;

const NGINX_TEMPORAL_CONFIG = `server {
    listen 7233 http2;
    listen [::]:7233 http2;
    server_name YOUR_DOMAIN

    http2 on;

    location / {
        grpc_pass localhost:7236;
        allow YOUR_CLIENT_IP_ADDRESS;
        deny all;
    }
}`;

const IMG_BASE = "/img/tutorials/infrastructure/nginx-sqlite-binary";

export default function NginxSqliteBinaryPage() {
  return (
    <Layout
      title="Deploy a Temporal Service with an SQLite Backend and Nginx"
      description="Deploy a Temporal Service from scratch using our Server Binaries using an Nginx reverse proxy."
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
                  { label: "Learn Temporal", href: "/" },
                  { label: "Tutorials", href: "/tutorials" },
                  { label: "Infrastructure", href: "/tutorials/infrastructure" },
                  { label: "Deploy with Nginx" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              How to Deploy a Temporal Service using an SQLite Backend with Nginx
            </h1>

            <MetaChips items={["~45 minutes", "Production", "Self-hosted"]} />

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
              upon server startup, and you'll deploy an Nginx reverse proxy to
              handle web traffic ingress. This will give you everything you
              need to run a production Temporal Service, and evaluate how to
              scale further or{" "}
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
                  A Linux server with SSH access and the Nginx web server
                  installed. This can be a new Ubuntu server instance with no
                  additional configuration performed. However, you will need a
                  version of Nginx built with HTTP/2 support (at least version
                  1.25.1), which may not be available by default in some
                  environments. On Ubuntu, you can use{" "}
                  <a
                    href="https://launchpad.net/~ondrej/+archive/ubuntu/nginx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    this PPA
                  </a>{" "}
                  to install a compatible Nginx.
                </li>
                <li>
                  To enable HTTPS in the browser, you will need SSL
                  certificates and your own domain name pointing to the server.
                  You can create a standalone certificate using{" "}
                  <a
                    href="https://www.digitalocean.com/community/tutorials/how-to-use-certbot-standalone-mode-to-retrieve-let-s-encrypt-ssl-certificates-on-ubuntu-20-04"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    these instructions
                  </a>
                  .
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
                If you are using your own domain name, replace{" "}
                <code>localhost</code> in the <code>allowOrigins</code>{" "}
                property. Then save and close the file.
              </p>
              <p>
                You can now run a Temporal Service on this server. However,
                you aren't ready to handle external connections yet - at this
                point, your Temporal Service is only available on{" "}
                <code>localhost</code>, meaning it is not scalable or
                accessible outside the localhost network. In the remainder of
                this tutorial, you'll configure this server for production
                use.
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
              <p>Both services should now be running in the background.</p>
            </section>

            <section className={styles.section} id="nginx">
              <h2 className={styles.sectionTitle}>
                Deploy an Nginx reverse proxy with an SSL certificate
              </h2>
              <p>
                To complete this step, you should have already obtained your
                own domain name and SSL certificates. One way to do that is
                by using{" "}
                <a
                  href="https://certbot.eff.org/instructions?ws=other&os=ubuntufocal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  certbot
                </a>
                . While your Temporal Service is currently running, it is
                still only available on the internal <code>localhost</code>{" "}
                network. Next you'll make it available externally and secure
                connections to it.
              </p>
              <p>
                When <code>certbot</code> retrieves certificates, by default,
                it stores them in{" "}
                <code>/etc/letsencrypt/live/YOUR_DOMAIN</code>. Check to make
                sure that you have them:
              </p>
              <CodeBlock language="bash">
                sudo ls /etc/letsencrypt/live/YOUR_DOMAIN
              </CodeBlock>
              <CodeBlock>{CERTBOT_LS_OUTPUT}</CodeBlock>
              <p>
                Now, you can configure an Nginx <em>reverse proxy</em> to
                expose your Temporal Service to external connections. Putting
                a web server such as Nginx in front of other web-facing
                applications can improve performance and reduce the complexity
                of securing a site. Nginx can take care of restricting access
                and securely handling requests from your clients to Temporal.
                You'll configure the UI server first, which uses regular HTTP
                (web) traffic.
              </p>
              <p>
                Nginx allows you to add per-site configurations to individual
                files in a subdirectory called <code>sites-available/</code>.
                Create a new Nginx configuration at{" "}
                <code>/etc/nginx/sites-available/temporal-ui</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/nginx/sites-available/temporal-ui
              </CodeBlock>
              <p>
                Paste the following into the new configuration file, being
                sure to replace <code>YOUR_DOMAIN</code> with your domain
                name.
              </p>
              <CodeBlock language="nginx" title="/etc/nginx/sites-available/temporal-ui">
                {NGINX_UI_CONFIG}
              </CodeBlock>
              <p>
                You can read this configuration as having three main "blocks"
                to it. The first block, coming before the{" "}
                <code>location /</code> line, contains a boilerplate Nginx
                configuration for serving a website on the default HTTP port,
                80. The <code>location /</code> block contains a configuration
                for proxying incoming connections to the Temporal Web UI,
                running on port 8233 internally, while preserving SSL. The
                configuration at the end of the file, after the{" "}
                <code>location /</code> block, loads your LetsEncrypt SSL
                keypairs and redirects HTTP connections to HTTPS.
              </p>
              <p>
                Note the <code>allow YOUR_IP_ADDRESSES;</code> line. You
                should replace this with the IP address that you'll need to
                access the Temporal Web UI from. You can add additional
                addresses in the same range using{" "}
                <a
                  href="https://www.digitalocean.com/community/tutorials/understanding-ip-addresses-subnets-and-cidr-notation-for-networking"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CIDR notation
                </a>
                , or add additional consecutive <code>allow</code> lines for
                multiple IPs. The <code>deny all;</code> on the following line
                will block traffic to all but the specified IPs. Because
                Temporal does not use any kind of authentication by default,
                restricting traffic by IP address is the least complex way of
                providing secure access.
              </p>
              <p>
                Save and close the file. Next, you'll need to activate this
                new configuration. Nginx's convention is to create symbolic
                links (like shortcuts) from files in <code>sites-available/</code>{" "}
                to another folder called <code>sites-enabled/</code> as you
                decide to enable or disable them. Using full paths for
                clarity, make that link:
              </p>
              <CodeBlock language="bash">
                sudo ln -s /etc/nginx/sites-available/temporal-ui /etc/nginx/sites-enabled/temporal-ui
              </CodeBlock>
              <p>
                By default, Nginx includes another configuration file at{" "}
                <code>/etc/nginx/sites-available/default</code>, linked to{" "}
                <code>/etc/nginx/sites-enabled/default</code>, which also
                serves its default index page. You'll need to disable that
                rule by removing it from <code>/sites-enabled</code>, because
                it conflicts with your new Temporal configuration:
              </p>
              <CodeBlock language="bash">
                sudo rm /etc/nginx/sites-enabled/default
              </CodeBlock>
              <p>
                Before reloading Nginx with this new configuration, you'll
                create another reverse proxy for gRPC API connections to
                Temporal itself. Create another Nginx configuration at{" "}
                <code>/etc/nginx/sites-available/temporal</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/nginx/sites-available/temporal
              </CodeBlock>
              <p>
                Paste the following into the new configuration file, being
                sure to replace <code>YOUR_DOMAIN</code> with your domain
                name.
              </p>
              <CodeBlock language="nginx" title="/etc/nginx/sites-available/temporal">
                {NGINX_TEMPORAL_CONFIG}
              </CodeBlock>
              <p>
                This configuration is shorter than the previous one, because
                Nginx only needs to use the <code>grpc_pass</code> directive
                to send gRPC traffic to the server. Again, don't forget the{" "}
                <code>allow YOUR_CLIENT_IP_ADDRESS;</code> line. In this case,
                you'll need an <code>allow</code> statement or IP range for
                everywhere that you plan to run your Temporal Workers, or any
                other Temporal Client, or connect via the <code>temporal</code>{" "}
                CLI.
              </p>
              <p>
                Save and close the file, and create a symbolic link as
                before:
              </p>
              <CodeBlock language="bash">
                sudo ln -s /etc/nginx/sites-available/temporal /etc/nginx/sites-enabled/temporal
              </CodeBlock>
              <p>
                Now you can restart your Nginx service, so it will reflect
                your new configuration:
              </p>
              <CodeBlock language="bash">
                sudo systemctl restart nginx
              </CodeBlock>
              <p>
                Navigate to <strong>YOUR_DOMAIN</strong> in a web browser,
                and you should receive the Temporal Web UI. At this point,
                you're finished with configuration. In the final step, you'll
                review the logs generated by your Temporal Service, as well
                as your options for connecting to it from the Temporal CLI or
                SDK.
              </p>
            </section>

            <section className={styles.section} id="interact">
              <h2 className={styles.sectionTitle}>
                Interact with the Temporal Service
              </h2>
              <p>
                In the last step, when you configured your Nginx reverse
                proxy, you enabled logging to{" "}
                <code>/var/log/nginx/temporal.access.log</code> when you set
                the <code>access_log</code> parameter. Check this file if you
                ever need to review access logs to the Temporal Web UI.
              </p>
              <p>
                You can also use <code>journalctl</code> to access logs from
                the Temporal Server itself.{" "}
                <code>journalctl -u service-name.service</code> allows you to
                view the full logs of any service running through{" "}
                <code>systemd</code>.
              </p>
              <p>
                If you ever need to restart the Temporal Service after making
                a configuration change, use{" "}
                <code>systemctl restart temporal</code> or{" "}
                <code>systemctl restart temporal-ui</code>. If you need to
                reload your Nginx configuration after adding additional IP
                addresses to your allow list, use{" "}
                <code>systemctl reload nginx</code> to reload without
                potentially disrupting network traffic with a restart.
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
                Temporal Service fronted by an Nginx reverse proxy. Next, you
                can read about Temporal's{" "}
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
                  to="/tutorials/infrastructure/envoy-sqlite-binary/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Alternative proxy</span>
                  <h3 className={styles.nextTitle}>Try the Envoy variant</h3>
                  <p className={styles.nextBody}>
                    Use Envoy as an edge proxy with RBAC and CORS - well-suited
                    for load-balanced setups.
                  </p>
                  <span className={styles.nextCta}>
                    Set up Envoy <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/infrastructure/configuring-sqlite-binary/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Without a proxy</span>
                  <h3 className={styles.nextTitle}>Review the baseline setup</h3>
                  <p className={styles.nextBody}>
                    Deploy the Temporal Server and UI binaries directly,
                    without an external proxy layer.
                  </p>
                  <span className={styles.nextCta}>
                    See the baseline <span aria-hidden="true">→</span>
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
