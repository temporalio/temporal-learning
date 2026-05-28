import React, { useState, useEffect, useRef } from "react";
import styles from "./styles.module.css";

export default function DevEnvironmentToc({ items }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const observerRef = useRef(null);

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean);
    if (targets.length === 0) return undefined;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.offsetTop - b.target.offsetTop);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );

    targets.forEach((t) => observerRef.current.observe(t));
    return () => observerRef.current && observerRef.current.disconnect();
  }, [items]);

  const handleClick = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    // Offset by ~navbar height + buffer so the section heading isn't hidden
    // under the sticky navbar after scrolling.
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
    if (history.replaceState) history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav className={styles.toc} aria-label="On this page">
      <div className={styles.tocLabel}>On this page</div>
      <ol className={styles.tocList}>
        {items.map((item, i) => {
          const n = String(i + 1).padStart(2, "0");
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`${styles.tocLink} ${isActive ? styles.tocLinkActive : ""}`}
                aria-current={isActive ? "true" : undefined}
              >
                <span className={styles.tocNum}>{n}</span>
                <span className={styles.tocText}>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
