import React from "react";
import styles from "./styles.module.css";

export default function FilterSortRow({ count, label = "courses" }) {
  return (
    <div className={styles.row}>
      <div className={styles.count}>
        {count} {label}
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.control}>
          Filter <span aria-hidden="true">▾</span>
        </button>
        <button type="button" className={styles.control}>
          Sort <span aria-hidden="true">▾</span>
        </button>
      </div>
    </div>
  );
}
