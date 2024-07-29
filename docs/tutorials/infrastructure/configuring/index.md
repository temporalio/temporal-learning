---
id: configuring-binary-tutorial
sidebar_position: 3
keywords: [sqlite, binary, systemd, certbot, hosting, deploy, config, minimal, baseline]
tags: [Server, Binary]
last_update:
  date: 2024-07-08
title: How to Configure a Temporal Service without a Proxy
description: Configure a Temporal Service from scratch using our Server Binaries without requiring any additional dependencies.
image: /img/temporal-logo-twitter-card.png
---

### Introduction

There are many ways of deploying a Temporal Service. For a large-scale deployment, you can use [Docker](https://github.com/temporalio/docker-compose) or [Kubernetes](https://github.com/temporalio/helm-charts) to configure multiple pods with the ability to scale horizontally. For local development, you can use the `server` subcommand of the [Temporal CLI client](https://docs.temporal.io/cli/server) to run a single-user server.

If you need a deployment that fits in between these options -- for example, if you need to scale for multiple users, with fine-grained control over your deployment parameters, but without the overhead of Kubernetes -- you can deploy a Temporal Service using the official server binaries.

In this tutorial, you'll configure and deploy the two binaries needed for a complete Temporal Service (the core server and the UI server). You'll create `systemd` unit files to gracefully run and restart the Temporal Service automatically upon server startup, and you'll review additional configuration parameters for your Temporal Service. This will give you everything you need to run a production Temporal Service, and evaluate how to scale further or [migrate to Temporal Cloud](https://temporal.io/cloud). Let's get started.

## Prerequisites

- A Linux server with SSH access. This can be a new Ubuntu server instance with no additional configuration performed.

## Obtaining the Temporal Binaries

You'll begin by downloading and configuring the Temporal Server binaries.

The Temporal Core Server can be obtained from its [Github Releases Page](https://github.com/temporalio/temporal/releases/). The Temporal Core Server is responsible for orchestrating all tasks regarding the execution of Temporal Workflows, such as maintaining the Event History, maintaining Task Queues, responding to commands and more. Download the newest binary for your operating system (probably `linux_amd64`) and extract it on the command line using `curl` and `tar`:

```bash
curl -OL https://github.com/temporalio/temporal/releases/download/v1.24.2/temporal_1.24.2_linux_amd64.tar.gz
tar -xzf temporal_1.24.2_linux_amd64.tar.gz
```

The extracted binary will be called `temporal-server`. Move it to the `/usr/bin/` directory on your path and make it executable:

```bash
sudo mv temporal-server /usr/bin/temporal-server
sudo chmod +x /usr/bin/temporal-server
```

You'll also need the Temporal UI server. The Temporal UI Server hooks in to a Temporal Core Server and provides a web-based UI for displaying information about Workflow Executions. It is a standalone binary that can also be obtained from its [Github Releases page](https://github.com/temporalio/ui-server/releases). Download the latest binary for your operating system and extract it on the command line using `curl` and `tar`:

```bash
curl -OL https://github.com/temporalio/ui-server/releases/download/v2.28.0/ui-server_2.28.0_linux_amd64.tar.gz
tar -xzf ui-server_2.28.0_linux_amd64.tar.gz
```

The extracted binary will be called `ui-server`. Move it to the `/usr/bin` directory on your path:

```bash
sudo mv ui-server /usr/bin/temporal-ui-server
sudo chmod +x /usr/bin/temporal-ui-server
```

At this point, you've downloaded everything you need. The last thing to do is create a `temporal` user on your server that has the appropriate permissions to run the Temporal Service, and a directory accessible to this user to store your data in. Run the following commands:

```bash
sudo useradd temporal
sudo mkdir /etc/temporal
sudo chown temporal /etc/temporal
```

Next, you'll create configuration files for both the Temporal Server and the UI Server in the `/etc/temporal/` directory.

## Configuring the Temporal Binaries

In this tutorial, you'll configure a connection to a SQLite database, since it doesn't require any additional dependencies. Using your favorite text editor, open a new file called `/etc/temporal/temporal-server.yaml`:

```bash
sudo vim /etc/temporal/temporal-server.yaml
```

Paste the following contents into the file for a starting configuration. You can update any of these values later.

```
log:
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
  policy: "noop"
```

Note `localhost:7233` in the `rpcAddress` parameter. If you are using a domain name, you should update this to reflect the URL that the Temporal gRPC API will be available on. You may use a subdomain like `rpc.my_domain:7233`. If you use a port other than 7233, you should also update the `grpcPort: 7233` parameter of the frontend service.

:::note External access to the Temporal Service

The gRPC API frontend configuration in this tutorial uses a default value of `bindOnIP: '0.0.0.0'`, meaning that the Temporal API will be available globally, without authentication, to anyone who can access this server. This is generally only appropriate if you are otherwise controlling access to this server (e.g. through Kubernetes or by using an external proxy). If you need a self-contained access control solution, refer to our tutorials on [Deploying Temporal with Nginx](/tutorials/infrastructure/nginx/index.md) or [Deploying Temporal with Envoy](/tutorials/infrastructure/envoy/index.md).

:::

:::tip 

Temporal's gRPC API does not use TLS by default; depending your security envelope, TLS is not always necessary for gRPC endpoints. To configure TLS for your gRPC endpoint, refer to the [Temporal documentation](https://docs.temporal.io/references/configuration#tls).

:::


Save and close the file. Next, you'll create the configuration file for the UI Server. Using your favorite text editor, open a new file called `/etc/temporal/temporal-ui-server.yaml`:

```bash
sudo vim /etc/temporal/temporal-ui-server.yaml
```

Paste the following contents into the file.

```
temporalGrpcAddress: 127.0.0.1:7233
host: YOUR_DOMAIN
port: 8233
enableUi: true
cors:
  allowOrigins:
    - http://YOUR_DOMAIN:8233
defaultNamespace: default
```

As with the gRPC API, this will make the Web UI available over HTTP to anyone who can access this server -- ensure that you do not need a local proxy solution before proceeding.

You can now run a Temporal Service on this server. In the remainder of this tutorial, you'll configure this server for production use.

## Creating and Registering System Services

Because you installed Temporal directly from binaries, you need to run it manually from the command line. To run them automatically, you'll need to set up your own background services.

To do this, you’ll create `unit` files that can be used by your server’s `init` system. On nearly all modern Linux distributions, the init system is called **systemd**, and you can interact with it by using the `systemctl` command.

Using your favorite text editor, open a new file called `/etc/systemd/system/temporal.service`:

```bash
sudo vim /etc/systemd/system/temporal.service
```

Your unit file needs, at minimum, a `[Unit]` section, a `[Service]` section, and an `[Install]` section:

```
[Unit]
Description=Temporal Service
After=network.target

[Service]
User=temporal
Group=temporal
ExecStart=temporal-server -r / -c etc/temporal/ -e temporal-server start

[Install]
WantedBy=multi-user.target
```

This file can be broken down as follows:

- The `[Unit]` section contains a plaintext `Description` of your new service, as well as an `After` hook that specifies when it should be run at system startup, in this case, it will be run after your server’s networking interfaces have come up.
- The `[Service]` section specifies which command (`ExecStart`) should actually be run, as well as which `User` and `Group` the command should be running as. In this case, you will use the `temporal` user you created, and the `temporal-server` command from the previous step.
- The `[Install]` section contains only the `WantedBy=multi-user.target` line, which works together with the `After` line in the `[Unit]` section to ensure that the service is started when the server is ready to accept user logins.

Save and close the file. You can now `start` your new Temporal service, and `enable` it to run on boot automatically:

```bash
sudo systemctl start temporal
sudo systemctl enable temporal
```

Use the `systemctl` command to verify that `temporal` started successfully. You should receive similar output to when you first ran the command in a terminal.

```bash
sudo systemctl status temporal
```

```output
● temporal.service - Temporal Service
     Loaded: loaded (/etc/systemd/system/temporal.service; disabled; vendo>
     Active: active (running) since Mon 2024-07-08 11:24:40 PDT; 4s ago
   Main PID: 19925 (temporal-server)
      Tasks: 22 (limit: 18707)
     Memory: 62.7M
     CGroup: /system.slice/temporal.service
             └─19925 temporal-server -r / -c etc/temporal/ -e temporal-server

Jul 08 11:24:42 Omelas temporal-server[19925]: {"level":"info","ts":"2024->
Jul 08 11:24:42 Omelas temporal-server[19925]: {"level":"info","ts":"2024->
Jul 08 11:24:42 Omelas temporal-server[19925]: {"level":"info","ts":"2024-
```

Next, repeat these steps for the UI server. Open a new file called `/etc/systemd/system/temporal-ui.service`:

```bash
sudo vim /etc/systemd/system/temporal-ui.service
```

Add the following contents:

```
[Unit]
Description=Temporal UI Server
After=network.target

[Service]
User=temporal
Group=temporal
ExecStart=temporal-ui-server -r / -c etc/temporal/ -e temporal-ui-server start

[Install]
WantedBy=multi-user.target
```

Save and close the file, then `start` the UI Server service, and `enable` it to run on boot automatically:

```bash
sudo systemctl start temporal-ui
sudo systemctl enable temporal-ui
```

Use the `systemctl` command to verify that `temporal-ui` started successfully:

```bash
sudo systemctl status temporal-ui
```

Both services should now be running in the background. Navigate to **YOUR_SERVER_IP:8233** in a web browser, and you should receive the Temporal Web UI. You now have a working Temporal Service. In the next step, you'll review some additional configuration options.

## Additional Configuration Options

### Other Database Backends

This tutorial provides an example of using Temporal with a SQLite database backend. Temporal also supports MySQL, PostgreSQL, and Cassandra as database backends. Refer to the [datasores](https://docs.temporal.io/references/configuration#datastores) documentation reference to make changes.

### Load Balancing

You may have noticed that the `temporal-server.yaml` configuration file that you edited earlier also contained several other port bindings -- for example, the History service and the Matching service. This is because most components of a Temporal Service can scale horizontally by adding additional nodes that can communicate and distribute load across a cluster.

In this tutorial, you deployed a single, standalone server binary. For more information about adding additional nodes, refer to [Scaling Temporal: The Basics](https://temporal.io/blog/scaling-temporal-the-basics).

### Visibility

This tutorial actually creates two different SQLite databases -- one for persisting your Workflow Event Histories, and another to act as a Visibility store. A Visibility store is required in a Temporal Service setup because it is used for querying and filtering your Workflows. Like your primary data store, your Visibility store can be configured to use a different database backend, and does not need to use the same configuration as your primary data store.

It is also possible to configure two Visibility stores, called [Dual Visibility](https://docs.temporal.io/visibility#dual-visibility). This can be useful when preparing to migrate databases, or if your deployment is optimized to read from one database and write to another. Refer to [How to set up Dual Visibility](https://docs.temporal.io/self-hosted-guide/visibility#dual-visibility) for more information.

### Dev Ops

For any parameters not covered in this tutorial, refer to the Temporal documentation reference for both the [Temporal Server](https://docs.temporal.io/references/configuration) (also referred to as a Temporal Cluster) and the [Web UI](https://docs.temporal.io/references/web-ui-configuration). There are also dedicated documentation pages for several other [self-hosting topics](https://docs.temporal.io/self-hosted-guide).

You can also refer to the [Docker configuation template](https://github.com/temporalio/temporal/blob/main/docker/config_template.yaml) used by Temporal's [Dockerhub images](https://hub.docker.com/r/temporalio/auto-setup). If you are using Kubernetes, Temporal's [helm-charts repo](https://github.com/temporalio/helm-charts) contains detailed documentation of the available options. You may also be interested in the [Temporal Kubernetes Operator](https://github.com/alexandrevilain/temporal-operator).

At this point, you're finished with configuration. In the final step, you'll review the logs generated by your Temporal Service, as well as your options for connecting to it from the Temporal CLI or SDK.

## Interacting with the Temporal Service

You can use `journalctl` to access logs from the Temporal Server. `journalctl -u service-name.service` allows you to view the full logs of any service running through `systemd`.

If you ever need to restart the Temporal Service after making a configuration change, use `systemctl restart temporal` or `systemctl restart temporal-ui`.

Finally, you should now be able to interact with your Temporal Service as if it were running locally. Just include `--address your_server:7233` with your CLI commands as needed. The first thing you'll likely need to do is create a `default` namespace, since this is not done automatically:

```bash
temporal --address your_server:7233 operator namespace create default
```

After that, you can visit the Web UI to ensure that it loads the `default` namespace correctly by visting `your_server` in a browser:

![A screenshot of the Temporal Web UI showing the default namespace](images/default-webui.png)

From then on, you can run commands like so:

```bash
temporal --address your_server:7233 workflow list 
```

Refer to the [Temporal documentation](https://docs.temporal.io/) for more.

## Conclusion

In this tutorial, you configured and deployed a baseline Temporal Service. Next, you can read about Temporal's [Visiblity features](https://docs.temporal.io/visibility) which require adding ElasticSearch to your deployment. You can also [learn more about the Temporal platform by following our self-paced online courses](https://learn.temporal.io/courses/), or talk to an expert about [Temporal Cloud](https://temporal.io/cloud). 