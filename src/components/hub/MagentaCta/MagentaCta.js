import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

export default function MagentaCta({
  to,
  href,
  children,
  variant = "bar",
  onClick,
  type = "button",
}) {
  const className = `${styles.cta} ${variant === "button" ? styles.button : styles.bar}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        <span className={styles.label}>{children}</span>
        <span aria-hidden="true" className={styles.arrow}>→</span>
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={className}>
        <span className={styles.label}>{children}</span>
        <span aria-hidden="true" className={styles.arrow}>→</span>
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={className}>
      <span className={styles.label}>{children}</span>
      <span aria-hidden="true" className={styles.arrow}>→</span>
    </button>
  );
}
