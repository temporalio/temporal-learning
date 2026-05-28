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
  { id: "envoy", label: "Deploy an Envoy edge proxy" },
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

const ENVOY_YAML = `admin:
  access_log:
  - name: envoy.access_loggers.stdout
    typed_config:
      "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog

static_resources:
  listeners:
    - name: webui
      address:
        socket_address : { address: '::', port_value: 8000, ipv4_compat: true }
      filter_chains:
      - name: webui_filter_chain
        filters:
        - name: envoy.filters.network.http_connection_manager
          typed_config:
            "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
            stat_prefix: http_connection_manager
            route_config:
              virtual_hosts:
              - name: webui_localhost
                domains: ["*"]
                routes:
                - name: webui-exporter-route
                  match: {prefix: "/"}
                  route:
                    cluster: webui-cluster-server
                    timeout: 0s
                    idle_timeout: 0s
            http_filters:
            - name: envoy.filters.http.rbac
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.http.rbac.v3.RBAC
                rules:
                  action: ALLOW
                  policies:
                    "allowed-user":
                      permissions:
                        - any: true
                      principals:
                        - remote_ip: {"address_prefix": 1.1.1.1, "prefix_len": 32} # Update to your allowed Web UI IP addresses
            - name: envoy.filters.http.router
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
    # Uncomment the below lines and update with \`your_domain\` if using HTTPS
    #    transport_socket:
    #      name: envoy.transport_sockets.tls
    #      typed_config:
    #        "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
    #        common_tls_context:
    #          tls_certificates:
    #          - certificate_chain: {filename: "/etc/letsencrypt/live/your_domain/cert.pem"}
    #            private_key: {filename: "/etc/letsencrypt/live/your_domain/privkey.pem"}
    #          alpn_protocols: ["h2,http/1.1"]
    #  listener_filters:
    #  - name: "envoy.filters.listener.tls_inspector"
    #    typed_config:
    #      "@type": type.googleapis.com/envoy.extensions.filters.listener.tls_inspector.v3.TlsInspector
    - name: temporal_grpc
      address:
        socket_address: { address: '::', port_value: 7233, ipv4_compat: true }
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                '@type': type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                codec_type: auto
                stat_prefix: ingress_http
                route_config:
                  name: grpc_route
                  virtual_hosts:
                    - name: grpc_localhost
                      domains: ['*']
                      routes:
                        - match: { prefix: '/' }
                          route:
                            cluster: grpc_service
                            timeout: 0s
                            max_stream_duration:
                              grpc_timeout_header_max: 0s
                      cors:
                        allow_origin_string_match:
                          - prefix: '*'
                        allow_methods: GET, PUT, DELETE, POST, OPTIONS
                        allow_headers: keep-alive,user-agent,cache-control,content-type,content-transfer-encoding,x-accept-content-transfer-encoding,x-accept-response-streaming,x-user-agent,x-grpc-web,grpc-timeout
                        max_age: '1728000'
                        expose_headers: grpc-status,grpc-message
                http_filters:
                  - name: envoy.filters.http.rbac
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.rbac.v3.RBAC
                      rules:
                        action: ALLOW
                        policies:
                          "allowed-user":
                            permissions:
                              - any: true
                            principals:
                              - remote_ip: {"address_prefix": 1.1.1.1, "prefix_len": 32} # Update to your allowed client IP addresses
                  - name: envoy.filters.http.grpc_web
                  - name: envoy.filters.http.cors
                  - name: envoy.filters.http.router

  clusters:
    - name: webui-cluster-server
      type: static
      connect_timeout: 2s
      load_assignment:
        cluster_name: webui-cluster-server
        endpoints:
        - lb_endpoints:
          - endpoint:
              address:
                socket_address: { address: 127.0.0.1, port_value: 8233, ipv4_compat: true }
    - name: grpc_service
      type: logical_dns
      connect_timeout: 1s
      http2_protocol_options: {}
      lb_policy: round_robin
      load_assignment:
        cluster_name: grpc_service
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address: { address: 127.0.0.1, port_value: 7236, ipv4_compat: true }`;

const SYSTEMD_ENVOY = `[Unit]
Description=Envoy edge proxy
After=network.target

[Service]
User=temporal
Group=temporal
ExecStart=bash -c 'envoy -c /etc/envoy-temporal.yaml | tee'

[Install]
WantedBy=multi-user.target`;

const IMG_BASE = "/img/tutorials/infrastructure/envoy-sqlite-binary";

export default function EnvoySqliteBinaryPage() {
  return (
    <Layout
      title="How to Deploy a Temporal Service using an SQLite Backend with Envoy"
      description="Deploy a Temporal Service from scratch using our Server Binaries using an Envoy edge proxy."
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
                  { label: "Deploy with Envoy" },
                ]}
              />
            </div>

            <h1 className={styles.title}>
              How to Deploy a Temporal Service using an SQLite Backend with Envoy
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
              upon server startup, and you'll deploy an Envoy edge proxy to
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
                  A Linux server with SSH access and the Envoy proxy
                  installed. This can be a new Ubuntu server instance with no
                  additional configuration performed. To install Envoy, refer
                  to{" "}
                  <a
                    href="https://www.envoyproxy.io/docs/envoy/latest/start/install#install-envoy-on-debian-gnu-linux"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    the Envoy documentation
                  </a>
                  .
                </li>
                <li>
                  To enable HTTPS in the browser, you will need SSL
                  certificates and your own domain name pointing to the
                  server. You can create a standalone certificate using{" "}
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
                Note <code>localhost:7236</code> in the <code>rpcAddress</code>{" "}
                parameter. If you are using a domain name, update this to
                reflect the URL that the Temporal gRPC API will be available
                on. You may use a subdomain like{" "}
                <code>rpc.my_domain:7236</code>. If you use a port other than
                7236, you should also update the <code>grpcPort: 7236</code>{" "}
                parameter of the frontend service.
              </p>

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

            <section className={styles.section} id="envoy">
              <h2 className={styles.sectionTitle}>
                Deploying an Envoy edge proxy
              </h2>
              <p>
                <em>
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
                  .
                </em>
              </p>

              <Admonition type="note" title="Ensure your temporal user can access your certificates">
                <p>
                  In this step, you'll configure an Envoy edge proxy to be run
                  by the <code>temporal</code> user you created. If you used{" "}
                  <code>certbot</code> to obtain your SSL certificates, the{" "}
                  <code>temporal</code> user will not have access to them by
                  default. To fix this, you can update permissions like so:
                </p>
                <CodeBlock language="bash">
                  sudo chown -R temporal /etc/letsencrypt/
                </CodeBlock>
              </Admonition>

              <p>
                While your Temporal Service is currently running, it is still
                only available on the internal <code>localhost</code> network.
                Next you should make it available externally and secure
                connections to it. When <code>certbot</code> retrieves
                certificates, by default, it stores them in{" "}
                <code>/etc/letsencrypt/live/your_domain</code>. Check to make
                sure that you have them:
              </p>
              <CodeBlock language="bash">
                sudo ls /etc/letsencrypt/live/your_domain
              </CodeBlock>
              <CodeBlock>{CERTBOT_LS_OUTPUT}</CodeBlock>
              <p>
                Now, you can configure an Envoy <em>edge proxy</em> to expose
                your Temporal Service to external connections. Putting a proxy
                server such as Envoy in front of other web-facing applications
                can improve performance and reduce the complexity of securing
                a site. Envoy can take care of restricting access and securely
                handling requests from your clients to Temporal.
              </p>
              <p>
                Create an Envoy configuration file at{" "}
                <code>/etc/envoy-temporal.yaml</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/envoy-temporal.yaml
              </CodeBlock>
              <p>Paste the following into the new configuration file:</p>
              <CodeBlock language="yaml" title="/etc/envoy-temporal.yaml">
                {ENVOY_YAML}
              </CodeBlock>
              <p>
                This is an Envoy YAML configuration file that provides an edge
                proxy deployment for your Temporal Service and Web UI.
              </p>
              <p>
                Envoy configuration can be complex, and going through this
                file line by line is out of scope for this tutorial. You can
                refer to the{" "}
                <a
                  href="https://www.envoyproxy.io/docs/envoy/latest/configuration/configuration"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Envoy configuration reference
                </a>{" "}
                for more detail. However, there are still a few changes you'll
                need to make for your own deployment.
              </p>
              <p>
                First, if you're using your own domain name, make sure to
                uncomment all of the indicated lines above, and replace{" "}
                <code>your_domain</code> with your domain name.
              </p>
              <p>
                Next, find the{" "}
                <code># Update to your allowed Web UI IP addresses</code>{" "}
                comment. Replace the IP address on this line with the IP
                address that you'll need to access the Temporal Web UI from.
                You can add additional addresses in the same range using{" "}
                <a
                  href="https://www.digitalocean.com/community/tutorials/understanding-ip-addresses-subnets-and-cidr-notation-for-networking"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CIDR notation
                </a>
                , following the{" "}
                <a
                  href="https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/core/v3/address.proto#envoy-v3-api-msg-config-core-v3-cidrrange"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Envoy documentation
                </a>
                .
              </p>
              <p>
                Finally, you also need to update the IP address provided with
                the <code># Update to your allowed client IP addresses</code>{" "}
                comment. Here, you'll need to provide an IP range for
                everywhere that you plan to run your Temporal Workers, or any
                other Temporal Client, or connect via the <code>temporal</code>{" "}
                CLI.
              </p>
              <p>
                Save and close the file. Next, you'll need to create a system
                service for Envoy, as you did with the Temporal Service and
                Web UI. Open a new file at{" "}
                <code>/etc/systemd/system/envoy.service</code>:
              </p>
              <CodeBlock language="bash">
                sudo vim /etc/systemd/system/envoy.service
              </CodeBlock>
              <p>Add the following contents:</p>
              <CodeBlock title="/etc/systemd/system/envoy.service">
                {SYSTEMD_ENVOY}
              </CodeBlock>
              <p>
                Save and close the file. Now you can start your Envoy service,
                and <code>enable</code> it to run on boot automatically:
              </p>
              <CodeBlock language="bash">
                {`sudo systemctl start envoy
sudo systemctl enable envoy`}
              </CodeBlock>
              <p>
                Navigate to <strong>your_domain:8000</strong> in a web browser,
                and you should receive the Temporal Web UI. At this point,
                you're finished with configuration. Keep in mind that Envoy
                has much more sophisticated{" "}
                <a
                  href="https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  load balancing
                </a>{" "}
                features and other capabilities that you may want to explore
                as you expand on your deployment.
              </p>
              <p>
                In the final step, you'll review the logs generated by your
                Temporal Service, as well as your options for connecting to it
                from the Temporal CLI or SDK.
              </p>
            </section>

            <section className={styles.section} id="interact">
              <h2 className={styles.sectionTitle}>
                Interact with the Temporal Service
              </h2>
              <p>
                In the last step, when you configured your Envoy edge proxy,
                you enabled access logging on <code>stdout</code>. You can use{" "}
                <code>journalctl -u envoy.service</code> to view the logging
                output from Envoy.
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
                reload your Envoy configuration after adding additional IP
                addresses to your allow list, use{" "}
                <code>systemctl restart envoy</code>.
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
                  <span className={styles.nextEyebrow}>Alternative proxy</span>
                  <h3 className={styles.nextTitle}>Try the Nginx variant</h3>
                  <p className={styles.nextBody}>
                    Front the Temporal API and Web UI with Nginx for HTTPS
                    and IP-based access control.
                  </p>
                  <span className={styles.nextCta}>
                    Set up Nginx <span aria-hidden="true">→</span>
                  </span>
                </Link>
                <Link
                  to="/tutorials/infrastructure/configuring-sqlite-binary/"
                  className={styles.nextCard}
                >
                  <span className={styles.nextEyebrow}>Without a proxy</span>
                  <h3 className={styles.nextTitle}>Review the baseline setup</h3>
                  <p className={styles.nextBody}>
                    Configure a Temporal Service from scratch using the
                    official Server binaries without any additional
                    dependencies.
                  </p>
                  <span className={styles.nextCta}>
                    Read the baseline tutorial <span aria-hidden="true">→</span>
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
