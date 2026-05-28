import React from "react";
import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";

export default function VerifyCard() {
  return (
    <div className={styles.verifyCard}>
      <h3 className={styles.verifyTitle}>
        <span className={styles.verifyIcon} aria-hidden="true">
          ✓
        </span>
        Verify your setup
      </h3>
      <p>Before moving on, confirm everything works:</p>
      <ol className={styles.verifyList}>
        <li>
          <strong>Temporal CLI is installed.</strong>
          <CodeBlock language="bash">temporal --version</CodeBlock>
          <p>
            Returns the installed version (e.g.{" "}
            <code>temporal version 1.x.x</code>).
          </p>
        </li>
        <li>
          <strong>The local Temporal Service runs.</strong> Start it in a new
          terminal:
          <CodeBlock language="bash">temporal server start-dev</CodeBlock>
          <p>
            You'll see the server start, with the Web UI listening on{" "}
            <code>http://localhost:8233</code>.
          </p>
        </li>
        <li>
          <strong>The Web UI loads.</strong> Open{" "}
          <a
            href="http://localhost:8233"
            target="_blank"
            rel="noopener noreferrer"
          >
            http://localhost:8233
          </a>{" "}
          in a browser - you should see the Temporal Web UI with no Workflows
          yet.
        </li>
      </ol>
    </div>
  );
}
