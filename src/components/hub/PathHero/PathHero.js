import React from "react";
import styles from "./styles.module.css";

export default function PathHero({
  eyebrow,
  title,
  description,
  level,
  lessonCount,
  outcomes,
  freeBadge = false,
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        {freeBadge && <span className={styles.freeBadge}>100% Free</span>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {outcomes && outcomes.length > 0 && (
          <div className={styles.outcomes}>
            <div className={styles.outcomesLabel}>You will be able to</div>
            <ul className={styles.outcomesList}>
              {outcomes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
