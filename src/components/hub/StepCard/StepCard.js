import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

export default function StepCard({ n, duration, title, description, href, cta = "Start step" }) {
  return (
    <Link to={href} className={styles.card}>
      <div className={styles.head}>
        <span className={styles.num}>{n}</span>
        {duration && <span className={styles.duration}>{duration}</span>}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.cta}>
        {cta}
        <span aria-hidden="true" className={styles.arrow}>→</span>
      </div>
    </Link>
  );
}
