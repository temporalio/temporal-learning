import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

const SDK_LABELS = {
  go: "Go",
  java: "Java",
  dotnet: ".NET",
  python: "Python",
  ruby: "Ruby",
  typescript: "TypeScript",
  php: "PHP",
};

export default function ArchetypeCard({
  title,
  description,
  accent = "workflows",
  impls = [],
  implsLabel = "Build it in",
}) {
  return (
    <article className={styles.card} data-accent={accent}>
      <div className={styles.accent} aria-hidden="true" />
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.foot}>
        <div className={styles.implsLabel}>{implsLabel}</div>
        <div className={styles.impls}>
          {impls.map((impl, i) => (
            <Link key={i} to={impl.href} className={styles.impl}>
              {impl.label ?? SDK_LABELS[impl.sdk] ?? impl.sdk}
              <span aria-hidden="true" className={styles.implArrow}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
