The fastest way to get a development cluster running on your local machine is to use [Temporal CLI](https://docs.temporal.io/cli).

Temporal CLI is a tool for interacting with a Temporal Cluster from the command line, but it includes a distribution of the Temporal Server and [Web UI](https://docs.temporal.io/web-ui) as well. This local development Cluster runs as a single process with zero runtime dependencies and it supports persistence to disk and in-memory mode through SQLite.

Install Temporal CLI on your local machine using the following instructions for your platform.

<Tabs groupId="os" queryString>
  <TabItem value="mac" label="macOS">

You can install the latest stable version with [Homebrew](https://brew.sh) using the following command:

```command
brew install temporal
```

You can also install Temporal CLI using the [installation script](https://temporal.download/cli.sh). Review the script and then download and install Temporal CLI with the following command:

```command
curl -sSf https://temporal.download/cli.sh | sh
```

To manually install Temporal CLI, download the version for your architecture:

- [Download Temporal CLI for Intel Macs](https://temporal.download/cli/archive/latest?platform=darwin&arch=amd64)
- [Download Temporal CLI for Apple Silicon Macs](https://temporal.download/cli/archive/latest?platform=darwin&arch=arm64)

Once you've downloaded the file, extract the downloaded archive and add the `temporal` binary to your `PATH` by copying it to a directory like `/usr/local/bin`.


  </TabItem>
  <TabItem value="win" label="Windows">

To install Temporal CLI on Windows, download the version for your architecture:

- [Download Temporal CLI for Windows amd64](https://temporal.download/cli/archive/latest?platform=windows&arch=amd64)
- [Download Temporal CLI for Windows arm64](https://temporal.download/cli/archive/latest?platform=windows&arch=arm64)

Once you've downloaded the file, extract the downloaded archive and add the `temporal.exe` binary to your `PATH`.


  </TabItem>
  <TabItem value="linux" label="Linux">

Install Temporal CLI using the [installation script](https://temporal.download/cli.sh). Review the script and then download and install Temporal CLI with the following command:

```command
curl -sSf https://temporal.download/cli.sh | sh
```

To manually install Temporal CLI, download the version for your architecture

- [Download Temporal CLI for Linux amd64](https://temporal.download/cli/archive/latest?platform=linux&arch=amd64)
- [Download Temporal CLI for Linux arm64](https://temporal.download/cli/archive/latest?platform=linux&arch=arm64)

Once you've downloaded the file, extract the downloaded archive and add the `temporal` binary to your `PATH` by copying it to a directory like `/usr/local/bin`.

  </TabItem>
</Tabs>

Once you've installed Temporal CLI and added it to your `PATH`, open a new Terminal window and run the following command:

```command
temporal server start-dev
```

This command automatically starts the Web UI, creates the default [Namespace](https://docs.temporal.io/namespaces), and uses an in-memory database.

* The Temporal Server will be available on `localhost:7233`.
* The Temporal Web UI will be available at [`http://localhost:8233`](http://localhost:8233/).

:::tip Change the Web UI port

The Temporal Web UI may be on a different port in some examples or tutorials. To change the port for the Web UI, use the `--ui-port` option when starting the server::

```command
temporal server start-dev --ui-port 8080
```

The Temporal Web UI will now be available at [`http://localhost:8080`](http://localhost:8080/).

:::

Leave the cluster running as you work through tutorials and other projects. You can stop the cluster at any time by pressing `CTRL+C`.
