import React, { useState } from "react";
import { useHistory } from "@docusaurus/router";
import styles from "./styles.module.css";

export default function HeroSearch({
  placeholder = "What do you want to learn today?",
}) {
  const history = useHistory();
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    history.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form className={styles.form} role="search" onSubmit={handleSubmit}>
      <span aria-hidden="true" className={styles.icon}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search learning content"
      />
    </form>
  );
}
