import React from "react";
import styles from "./styles.module.css";

const LEVEL_LABELS = {
  essential: "Essential",
  practical: "Practical",
  production: "Production",
};

export default function LevelBadge({ level, count, unit = "lessons" }) {
  const label = LEVEL_LABELS[level] ?? level;
  const countText = count != null ? ` · ${count} ${unit}` : "";

  return (
    <span className={styles.badge} data-level={level}>
      {label}
      {countText}
    </span>
  );
}
