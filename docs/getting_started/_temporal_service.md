The fastest way to get a development version of the Temporal Service running on your local machine is to use [Temporal CLI](https://docs.temporal.io/cli).

Temporal CLI is a tool for interacting with the Temporal Service from the command-line interface. It includes a self-contained distribution of the Temporal Service and [Web UI](https://docs.temporal.io/web-ui) as well which you can use for local development.

Install Temporal CLI on your local machine using the following instructions for your platform.

<Tabs groupId="os" queryString>
  <TabItem value="mac" label="macOS">

You can install the latest version with [Homebrew](https://brew.sh) using the following command:

```command
brew install temporal
```

  </TabItem>
  <TabItem value="win" label="Windows">

To install Temporal CLI on Windows, download the version for your architecture:

- [Download Temporal CLI for Windows amd64](https://temporal.download/cli/archive/latest?platform=windows&arch=amd64)
- [Download Temporal CLI for Windows arm64](https://temporal.download/cli/archive/latest?platform=windows&arch=arm64)

Once you've downloaded the file, extract the downloaded archive and add the `temporal.exe` binary to your `PATH`.

  </TabItem>
  <TabItem value="linux" label="Linux">


To install Temporal CLI, download the version for your architecture

- [Download Temporal CLI for Linux amd64](https://temporal.download/cli/archive/latest?platform=linux&arch=amd64)
- [Download Temporal CLI for Linux arm64](https://temporal.download/cli/archive/latest?platform=linux&arch=arm64)

Once you've downloaded the file, extract the downloaded archive and add the `temporal` binary to your `PATH` by copying it to a directory like `/usr/local/bin`.

  </TabItem>
</Tabs>

Once you've installed Temporal CLI and added it to your `PATH`, open a new Terminal window and run the following command:

```command
temporal server start-dev
```

This command starts a local Temporal Service. It starts the Web UI, creates the default [Namespace](https://docs.temporal.io/namespaces), and uses an in-memory database.

* The Temporal Service will be available on `localhost:7233`.
* The Temporal Web UI will be available at [`http://localhost:8233`](http://localhost:8233/).

Leave the local Temporal Service running as you work through tutorials and other projects. You can stop the Temporal Service at any time by pressing `CTRL+C`.

:::tip Change the Web UI port

The Temporal Web UI may be on a different port in some examples or tutorials. To change the port for the Web UI, use the `--ui-port` option when starting the server:

```command
temporal server start-dev --ui-port 8080
```

The Temporal Web UI will now be available at [`http://localhost:8080`](http://localhost:8080/).
:::

The `temporal server start-dev` command uses an in-memory database, so stopping the server will erase all your Workflows and all your Task Queues. If you want to retain those between runs, start the server and specify a database filename using the `--db-filename` option, like this:

```command
temporal server start-dev --db-filename your_temporal.db
```

When you stop and restart the Temporal Service and specify the same filename again, your Workflows and other information will be available.
