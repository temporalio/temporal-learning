import React from "react";
import styles from "./styles.module.css";

export default function GetHelp({ tight = false }) {
  return (
    <section className={tight ? `${styles.section} ${styles.tight}` : styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.sectionTitle}>Get Help</h2>
        <div className={styles.helpGrid}>
          <a href="https://temporal.io/slack" className={styles.helpCard}>
            <h3 className={styles.helpTitle}>
              <img
                src="https://docs.temporal.io/img/icons/slack-dark-mode-24x24.svg"
                alt=""
                className={styles.helpIcon}
                width={24}
                height={24}
              />
              Community Slack
            </h3>
            <p className={styles.helpBody}>
              Ask questions and chat with thousands of Temporal developers.
            </p>
          </a>
          <a href="https://community.temporal.io/" className={styles.helpCard}>
            <h3 className={styles.helpTitle}>
              <img
                src="https://docs.temporal.io/img/icons/forum-dark-mode-24x24.svg"
                alt=""
                className={styles.helpIcon}
                width={24}
                height={24}
              />
              Developer Forum
            </h3>
            <p className={styles.helpBody}>
              Search past questions or post your own to the Temporal community.
            </p>
          </a>
          <a href="https://docs.temporal.io" className={styles.helpCard}>
            <h3 className={styles.helpTitle}>
              <img
                src="https://docs.temporal.io/img/icons/learn-dark-mode-24x24.svg"
                alt=""
                className={styles.helpIcon}
                width={24}
                height={24}
              />
              Documentation
            </h3>
            <p className={styles.helpBody}>
              The full reference - concepts, SDKs, deployment, troubleshooting.
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}
