Download and install the Temporal development cluster locally using Docker Compose. You'll run this server in the background while you develop your applications.

You must have [Docker](https://docs.docker.com/engine/install) and [Docker Compose](https://docs.docker.com/compose/install) installed.

Then clone the [temporalio/docker-compose](https://github.com/temporalio/docker-compose) repository and run `docker-compose up` from the root of that repo:

```command
git clone https://github.com/temporalio/docker-compose.git
```

Switch to the directory:

```command
cd docker-compose
```

Then run `docker compose` to download the various container images and start the development cluster:

```command
docker compose up
```

When the Temporal Cluster is running, the Temporal Web UI becomes available in your browser. Visit [localhost:8080](http://localhost:8080/)

Review other methods in the [Run a dev Cluster](https://docs.temporal.io/application-development/foundations#run-a-dev-cluster) section in Temporal's documentation.
