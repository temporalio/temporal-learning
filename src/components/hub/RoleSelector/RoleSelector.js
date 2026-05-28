import React from "react";
import Link from "@docusaurus/Link";
import { PERSONAS } from "@site/src/data/hub";
import styles from "./styles.module.css";

export default function RoleSelector() {
  return (
    <div className={styles.grid}>
      {PERSONAS.map((persona) => (
        <Link
          key={persona.slug}
          to={`/paths/${persona.pathSlug}`}
          className={styles.card}
          data-persona={persona.slug}
        >
          <div className={styles.eyebrow}>I am a</div>
          <h3 className={styles.title}>{persona.title}</h3>
          <p className={styles.description}>{persona.description}</p>
          <div className={styles.cta}>
            See path
            <span aria-hidden="true" className={styles.arrow}>→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
