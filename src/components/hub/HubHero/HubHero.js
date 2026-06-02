import React from "react";
import HeroSearch from "../HeroSearch/HeroSearch";
import styles from "./styles.module.css";

export default function HubHero({
  eyebrow,
  title,
  body,
  freeBadge = false,
  showSearch = true,
  compact = false,
  illustration = "/img/hero/learn-hero.png",
  illustrationAlt = "",
}) {
  return (
    <section
      className={`${styles.hero} ${compact ? styles.heroCompact : ""}`}
    >
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          {freeBadge && <span className={styles.freeBadge}>100% Free</span>}
          <h1 className={styles.title}>{title}</h1>
          {body && <p className={styles.body}>{body}</p>}
          {showSearch && (
            <div className={styles.searchWrap}>
              <HeroSearch />
            </div>
          )}
        </div>
        {illustration && (
          <div className={styles.illustrationWrap}>
            <img
              src={illustration}
              alt={illustrationAlt}
              className={styles.illustration}
              loading="eager"
            />
          </div>
        )}
      </div>
    </section>
  );
}
