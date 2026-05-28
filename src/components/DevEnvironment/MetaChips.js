import React from "react";
import styles from "./styles.module.css";

export default function MetaChips({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={styles.metaChips}>
      {items.map((item, i) => (
        <span key={i} className={styles.metaChip}>
          {item}
        </span>
      ))}
    </div>
  );
}
