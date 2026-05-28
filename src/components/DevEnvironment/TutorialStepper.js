import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

export default function TutorialStepper({ steps, currentStep }) {
  return (
    <ol className={styles.stepper} aria-label="Tutorial progress">
      {steps.map((step) => {
        const isPast = step.n < currentStep;
        const isCurrent = step.n === currentStep;
        const stateClass = isCurrent
          ? styles.stepCurrent
          : isPast
            ? styles.stepPast
            : styles.stepFuture;
        const content = (
          <>
            <span className={styles.stepNumber} aria-hidden="true">
              {isPast ? "✓" : step.n}
            </span>
            <span className={styles.stepLabel}>{step.label}</span>
          </>
        );
        return (
          <li key={step.n} className={`${styles.step} ${stateClass}`}>
            {isCurrent ? (
              <span className={styles.stepLink} aria-current="step">
                {content}
              </span>
            ) : (
              <Link to={step.href} className={styles.stepLink}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
