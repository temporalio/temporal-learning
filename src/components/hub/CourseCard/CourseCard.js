import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

export default function CourseCard({ course, size = "md" }) {
  if (!course) return null;
  const { url, title, thumbnail, topics = [], kind } = course;
  const accent = topics[0] ?? "workflows";
  const ctaLabel = kind === "tutorial" ? "Try the tutorial" : "Take the course";

  return (
    <article className={styles.card} data-size={size}>
      <Link to={url} className={styles.cardLink}>
        <div className={styles.thumbWrap} data-accent={accent}>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className={styles.thumb}
              loading="lazy"
            />
          ) : (
            <div className={styles.thumbFallback} aria-hidden="true" />
          )}
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.cta}>
            {ctaLabel}
            <span aria-hidden="true" className={styles.ctaArrow}>→</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
