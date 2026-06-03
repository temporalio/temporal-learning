import React from "react";
import styles from "./info-box.module.css";

export const InfoBox = ({ title, children }) => {
  return (
    <div className={styles.infoBox}>
      <div className={styles.infoIcon} aria-hidden="true">ⓘ</div>
      <div className={styles.content}>
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
};
