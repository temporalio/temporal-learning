import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

export default function PathBreadcrumb({ items }) {
  return (
    <nav className={styles.crumb} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {item.href && !isLast ? (
              <Link to={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? styles.current : styles.link}>
                {item.label}
              </span>
            )}
            {!isLast && <span aria-hidden="true" className={styles.sep}>/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
