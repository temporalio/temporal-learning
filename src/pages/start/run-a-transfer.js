import React from "react";
import EmbedStepPage from "@site/src/components/hub/EmbedStepPage/EmbedStepPage";
import { CallToAction } from "@site/src/components/hub/setup/CallToAction";
import styles from "@site/src/components/hub/EmbedStepPage/styles.module.css";

// Instruqt embed URL from the track's Share > Simple Embed in the Instruqt Web UI.
// If cleared, the page links out to the lab instead of embedding it (the public
// play URL cannot be framed cross-origin).
const INSTRUQT_EMBED_SRC = "https://play.instruqt.com/embed/temporal/invite/mxen5cn2tf7d";

const LAB_URL = "https://play.instruqt.com/temporal/tracks/money-transfer";

const OUTCOMES = [
  "A money-transfer Workflow running in a hosted Temporal environment",
  "A feel for how Temporal recovers work automatically - before you install anything",
];

export default function RunATransferPage() {
  return (
    <EmbedStepPage
      step={1}
      title="See the power of Temporal."
      body="Run a money-transfer Workflow in an interactive lab, right in your browser. Nothing to install - just step through it and watch Temporal handle the work."
      embedTitle="Run the lab"
      outcomes={OUTCOMES}
      nextHref="/start/dev-environment"
      nextLabel="Step 02 — Set up your dev environment"
    >
      {INSTRUQT_EMBED_SRC ? (
        <>
          <iframe
            className={styles.embedFrame}
            src={INSTRUQT_EMBED_SRC}
            title="Temporal money-transfer interactive lab"
            allow="fullscreen"
            allowFullScreen
            sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-popups-to-escape-sandbox"
          />
          <p className={styles.embedFootnote}>
            Trouble loading the lab?{" "}
            <a href={LAB_URL} target="_blank" rel="noopener noreferrer">
              Open it in a new tab
            </a>
            .
          </p>
        </>
      ) : (
        <div className={styles.embedNotice}>
          <p>
            This lab runs in a hosted environment - no installs
            or logins required. Launch it in a new tab to watch Temporal recover from a failure.
          </p>
          <a
            className={styles.embedNoticeLink}
            href={LAB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Launch the lab <span aria-hidden="true">→</span>
          </a>
        </div>
      )}

      <CallToAction href="https://github.com/temporalio/edu-get-started-flow">
        <h3>Want to see the code and run locally?</h3>
        <p>
          Get the full source on GitHub and run the money-transfer app on your
          own machine.
        </p>
      </CallToAction>
    </EmbedStepPage>
  );
}
