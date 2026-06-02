import React from "react";
import Link from "@docusaurus/Link";
import LevelBadge from "../LevelBadge/LevelBadge";
import styles from "./styles.module.css";

export default function PathCard({
  href,
  tier,
  title,
  description,
  thumbnail,
  thumbnailAlt,
  level,
  lessonCount,
  cta = "Start path",
}) {
  return (
    <article className={styles.card} data-tier={tier}>
      <div className={styles.accent} aria-hidden="true" />

      <Link to={href} className={styles.thumbWrap} tabIndex={-1}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={thumbnailAlt ?? ""}
            className={styles.thumb}
            loading="lazy"
          />
        ) : (
          <div className={styles.thumbFallback} aria-hidden="true" />
        )}
      </Link>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link to={href} className={styles.titleLink}>
            {title}
          </Link>
        </h3>

        {description && <p className={styles.description}>{description}</p>}

        {level && (
          <div className={styles.badgeRow}>
            <LevelBadge
              level={level}
              count={lessonCount}
              unit="tracks"
              showLabel={false}
            />
          </div>
        )}

        <Link to={href} className={styles.cta}>
          {cta}
          <span aria-hidden="true" className={styles.ctaArrow}>→</span>
        </Link>
      </div>
    </article>
  );
}
