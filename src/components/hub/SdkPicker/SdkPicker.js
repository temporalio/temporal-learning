import React from "react";
import Link from "@docusaurus/Link";
import SdkLogo from "../SdkLogo/SdkLogo";
import styles from "./styles.module.css";

export default function SdkPicker({ targets }) {
  return (
    <div className={styles.grid}>
      {targets.map((t) => (
        <Link key={t.sdk} to={t.href} className={styles.card}>
          <SdkLogo sdk={t.sdk} />
          <span className={styles.label}>{t.label}</span>
          <span aria-hidden="true" className={styles.arrow}>→</span>
        </Link>
      ))}
    </div>
  );
}
