import React from "react";
import CodeBlock from "@theme/CodeBlock";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";
import Admonition from "@theme/Admonition";

export default function TemporalServiceSetup() {
  return (
    <>
      <p>
        The fastest way to get a development version of the Temporal Service
        running on your local machine is to use{" "}
        <a
          href="https://docs.temporal.io/cli"
          target="_blank"
          rel="noopener noreferrer"
        >
          Temporal CLI
        </a>
        .
      </p>
      <p>
        Temporal CLI is a tool for interacting with the Temporal Service from
        the command-line interface. It includes a self-contained distribution
        of the Temporal Service and{" "}
        <a
          href="https://docs.temporal.io/web-ui"
          target="_blank"
          rel="noopener noreferrer"
        >
          Web UI
        </a>{" "}
        which you can use for local development.
      </p>
      <p>
        Install Temporal CLI on your local machine using the following
        instructions for your platform.
      </p>

      <Tabs groupId="os" queryString>
        <TabItem value="mac" label="macOS">
          <p>
            You can install the latest version with{" "}
            <a
              href="https://brew.sh"
              target="_blank"
              rel="noopener noreferrer"
            >
              Homebrew
            </a>{" "}
            using the following command:
          </p>
          <CodeBlock language="bash">brew install temporal</CodeBlock>
        </TabItem>
        <TabItem value="win" label="Windows">
          <p>
            To install Temporal CLI on Windows, download the version for your
            architecture:
          </p>
          <ul>
            <li>
              <a href="https://temporal.download/cli/archive/latest?platform=windows&arch=amd64">
                Download Temporal CLI for Windows amd64
              </a>
            </li>
            <li>
              <a href="https://temporal.download/cli/archive/latest?platform=windows&arch=arm64">
                Download Temporal CLI for Windows arm64
              </a>
            </li>
          </ul>
          <p>
            Once you've downloaded the file, extract the downloaded archive
            and add the <code>temporal.exe</code> binary to your{" "}
            <code>PATH</code>.
          </p>
        </TabItem>
        <TabItem value="linux" label="Linux">
          <p>
            To install Temporal CLI, download the version for your
            architecture:
          </p>
          <ul>
            <li>
              <a href="https://temporal.download/cli/archive/latest?platform=linux&arch=amd64">
                Download Temporal CLI for Linux amd64
              </a>
            </li>
            <li>
              <a href="https://temporal.download/cli/archive/latest?platform=linux&arch=arm64">
                Download Temporal CLI for Linux arm64
              </a>
            </li>
          </ul>
          <p>
            Once you've downloaded the file, extract the downloaded archive
            and add the <code>temporal</code> binary to your{" "}
            <code>PATH</code> by copying it to a directory like{" "}
            <code>/usr/local/bin</code>.
          </p>
        </TabItem>
      </Tabs>

      <p>
        Once you've installed Temporal CLI and added it to your{" "}
        <code>PATH</code>, open a new Terminal window and run the following
        command:
      </p>
      <CodeBlock language="bash">temporal server start-dev</CodeBlock>
      <p>
        This command starts a local Temporal Service. It starts the Web UI,
        creates the default{" "}
        <a
          href="https://docs.temporal.io/namespaces"
          target="_blank"
          rel="noopener noreferrer"
        >
          Namespace
        </a>
        , and uses an in-memory database.
      </p>
      <ul>
        <li>
          The Temporal Service will be available on{" "}
          <code>localhost:7233</code>.
        </li>
        <li>
          The Temporal Web UI will be available at{" "}
          <a
            href="http://localhost:8233"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://localhost:8233
          </a>
          .
        </li>
      </ul>
      <p>
        Leave the local Temporal Service running as you work through tutorials
        and other projects. You can stop the Temporal Service at any time by
        pressing <code>CTRL+C</code>.
      </p>

      <Admonition type="tip" title="Change the Web UI port">
        <p>
          The Temporal Web UI may be on a different port in some examples or
          tutorials. To change the port for the Web UI, use the{" "}
          <code>--ui-port</code> option when starting the server:
        </p>
        <CodeBlock language="bash">
          temporal server start-dev --ui-port 8080
        </CodeBlock>
        <p>
          The Temporal Web UI will now be available at{" "}
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://localhost:8080
          </a>
          .
        </p>
      </Admonition>

      <p>
        The <code>temporal server start-dev</code> command uses an in-memory
        database, so stopping the server will erase all your Workflows and all
        your Task Queues. If you want to retain those between runs, start the
        server and specify a database filename using the{" "}
        <code>--db-filename</code> option, like this:
      </p>
      <CodeBlock language="bash">
        temporal server start-dev --db-filename your_temporal.db
      </CodeBlock>
      <p>
        When you stop and restart the Temporal Service and specify the same
        filename again, your Workflows and other information will be
        available.
      </p>
    </>
  );
}
