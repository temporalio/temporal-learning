import React from "react";
import Link from "@docusaurus/Link";
import { FIRST_STEPS } from "@site/src/data/hub";
import styles from "./styles.module.css";

export default function StepProgress({ current }) {
  return (
    <nav className={styles.progress} aria-label="Step progress">
      {FIRST_STEPS.map((step, i) => {
        const isActive = step.n === current;
        return (
          <React.Fragment key={step.n}>
            <Link
              to={step.href}
              className={styles.step}
              data-active={isActive ? "true" : undefined}
              aria-current={isActive ? "step" : undefined}
            >
              <span className={styles.num}>{String(step.n).padStart(2, "0")}</span>
              <span className={styles.label}>{step.shortLabel}</span>
            </Link>
            {i < FIRST_STEPS.length - 1 && (
              <span aria-hidden="true" className={styles.connector}>→</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
