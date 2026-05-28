import React from "react";
import styles from "./styles.module.css";

function formatDuration(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `~${minutes} min`;
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `~${hours} hr`;
  return `~${hours.toFixed(1)} hr`;
}

export default function DurationBadge({ minutes }) {
  const text = formatDuration(minutes);
  if (!text) return null;
  return <span className={styles.badge}>{text}</span>;
}
