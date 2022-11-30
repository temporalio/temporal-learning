# hello-world-project-template-go

This is the Hello World project which has all the basic files explained in our [Hello World Tutorial](https://learn.temporal.io/getting_started/go/hello_world_in_go/).

## Instructions

Ensure you have Go 1.16 or later installed locally, and that you have Docker installed to run the Temporal Cluster.

Clone this repository:

```bash
git clone https://github.com/temporalio/hello-world-project-template-go
```

[Install and run the Temporal Server]((https://docs.temporal.io/docs/server/quick-install) using `docker compose`.

```bash
git clone https://github.com/temporalio/docker-compose.git
cd docker-compose
docker-compose up
```

You can now view Temporal Web at <http://localhost:8080>.

Run the worker and starter included in the project.

```bash
go run worker/main.go
go run start/main.go
```

If you have [`nodemon`](https://nodemon.io/) installed, you can automatically reload when you change any files: `nodemon --watch './**/*.go' --signal SIGTERM --exec 'go' run worker/main.go`
