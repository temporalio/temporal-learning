import React from "react";
import styles from "./styles.module.css";

const URL = "https://pages.temporal.io/get-updates-education";

export default function NotifyBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 className={styles.title}>
            Get notified when we launch new educational content
          </h2>
          <p className={styles.sub}>
            New courses, tutorials, and learning resources - straight to your inbox.
          </p>
        </div>
        <a
          href={URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.button}
        >
          Subscribe
          <span aria-hidden="true" className={styles.arrow}>→</span>
        </a>
      </div>
    </section>
  );
}
