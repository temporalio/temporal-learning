import React from "react";
import LevelBadge from "../LevelBadge/LevelBadge";
import styles from "./styles.module.css";

export default function PathHero({
  eyebrow,
  title,
  description,
  level,
  lessonCount,
  outcomes,
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.metaRow}>
          {level && <LevelBadge level={level} count={lessonCount} unit="tracks" showLabel={false} />}
        </div>
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
