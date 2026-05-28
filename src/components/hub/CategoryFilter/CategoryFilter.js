import React, { useState, useMemo } from "react";
import CourseCard from "../CourseCard/CourseCard";
import { TOPICS, PERSONAS } from "@site/src/data/hub";
import styles from "./styles.module.css";

const SDK_LABELS = {
  go: "Go",
  java: "Java",
  dotnet: ".NET",
  php: "PHP",
  python: "Python",
  ruby: "Ruby",
  typescript: "TypeScript",
};

function countBy(items, keyFn) {
  const counts = new Map();
  items.forEach((item) => {
    const keys = keyFn(item) ?? [];
    keys.forEach((k) => counts.set(k, (counts.get(k) || 0) + 1));
  });
  return counts;
}

function FilterGroup({ title, options, selected, onToggle }) {
  if (options.length === 0) return null;
  return (
    <div className={styles.group}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <ul className={styles.options}>
        {options.map((opt) => {
          const isChecked = selected.has(opt.value);
          return (
            <li key={opt.value}>
              <label className={styles.option}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(opt.value)}
                  className={styles.checkbox}
                />
                <span className={styles.optionLabel}>
                  {opt.label.toUpperCase()}
                </span>
                <span className={styles.count}>({opt.count})</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function CategoryFilter({
  items,
  title = "Browse the library",
  subtitle = "Filter by category, SDK, or persona to find what you need.",
}) {
  const [topics, setTopics] = useState(new Set());
  const [sdks, setSdks] = useState(new Set());
  const [personas, setPersonas] = useState(new Set());

  const makeToggle = (current, setter) => (value) => {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (topics.size > 0 && !(item.topics ?? []).some((t) => topics.has(t)))
        return false;
      if (
        sdks.size > 0 &&
        !(item.sdkLanguages ?? []).some((s) => sdks.has(s))
      )
        return false;
      if (personas.size > 0 && !(item.persona && personas.has(item.persona)))
        return false;
      return true;
    });
  }, [items, topics, sdks, personas]);

  const topicCounts = useMemo(
    () => countBy(items, (i) => i.topics ?? []),
    [items]
  );
  const sdkCounts = useMemo(
    () => countBy(items, (i) => i.sdkLanguages ?? []),
    [items]
  );
  const personaCounts = useMemo(
    () => countBy(items, (i) => (i.persona ? [i.persona] : [])),
    [items]
  );

  const topicOptions = Object.keys(TOPICS)
    .filter((t) => topicCounts.has(t))
    .map((t) => ({ value: t, label: TOPICS[t].label, count: topicCounts.get(t) }));
  const sdkOptions = Object.keys(SDK_LABELS)
    .filter((s) => sdkCounts.has(s))
    .map((s) => ({ value: s, label: SDK_LABELS[s], count: sdkCounts.get(s) }));
  const personaOptions = PERSONAS.filter((p) => personaCounts.has(p.slug)).map(
    (p) => ({ value: p.slug, label: p.title, count: personaCounts.get(p.slug) })
  );

  const totalSelected = topics.size + sdks.size + personas.size;
  const clearAll = () => {
    setTopics(new Set());
    setSdks(new Set());
    setPersonas(new Set());
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <div className={styles.count}>
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
            {totalSelected > 0 && (
              <button onClick={clearAll} className={styles.clear}>
                Clear filters
              </button>
            )}
          </div>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <FilterGroup
              title="Categories"
              options={topicOptions}
              selected={topics}
              onToggle={makeToggle(topics, setTopics)}
            />
            <FilterGroup
              title="SDK"
              options={sdkOptions}
              selected={sdks}
              onToggle={makeToggle(sdks, setSdks)}
            />
            <FilterGroup
              title="Persona"
              options={personaOptions}
              selected={personas}
              onToggle={makeToggle(personas, setPersonas)}
            />
          </aside>

          <div className={styles.grid}>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <CourseCard key={item.slug} course={item} />
              ))
            ) : (
              <p className={styles.empty}>
                No matches. Try clearing some filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
