import React, { useMemo } from "react";
import { TOPICS, PERSONAS, USE_CASES } from "@site/src/data/hub";
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
        {options.map((opt) => (
          <li key={opt.value}>
            <label className={styles.option}>
              <input
                type="checkbox"
                checked={selected.has(opt.value)}
                onChange={() => onToggle(opt.value)}
                className={styles.checkbox}
              />
              <span className={styles.optionLabel}>
                {opt.label.toUpperCase()}
              </span>
              <span className={styles.count}>({opt.count})</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CategorySidebar({ items, filters, onChange }) {
  const { topics, sdks, personas, useCases } = filters;

  const toggle = (group) => (value) => {
    const set = new Set(filters[group]);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange({ ...filters, [group]: set });
  };

  const totalSelected =
    topics.size + sdks.size + personas.size + useCases.size;
  const clearAll = () =>
    onChange({
      topics: new Set(),
      sdks: new Set(),
      personas: new Set(),
      useCases: new Set(),
    });

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
  const useCaseCounts = useMemo(
    () => countBy(items, (i) => i.useCases ?? []),
    [items]
  );

  const useCaseOptions = Object.keys(USE_CASES)
    .filter((u) => useCaseCounts.has(u))
    .map((u) => ({
      value: u,
      label: USE_CASES[u].label,
      count: useCaseCounts.get(u),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const topicOptions = Object.keys(TOPICS)
    .filter((t) => topicCounts.has(t))
    .map((t) => ({
      value: t,
      label: TOPICS[t].label,
      count: topicCounts.get(t),
    }));
  const sdkOptions = Object.keys(SDK_LABELS)
    .filter((s) => sdkCounts.has(s))
    .map((s) => ({ value: s, label: SDK_LABELS[s], count: sdkCounts.get(s) }));
  const personaOptions = PERSONAS.filter((p) => personaCounts.has(p.slug)).map(
    (p) => ({
      value: p.slug,
      label: p.title,
      count: personaCounts.get(p.slug),
    })
  );

  return (
    <aside className={styles.sidebar}>
      <FilterGroup
        title="Categories"
        options={topicOptions}
        selected={topics}
        onToggle={toggle("topics")}
      />
      <FilterGroup
        title="SDK"
        options={sdkOptions}
        selected={sdks}
        onToggle={toggle("sdks")}
      />
      <FilterGroup
        title="Use Case"
        options={useCaseOptions}
        selected={useCases}
        onToggle={toggle("useCases")}
      />
      <FilterGroup
        title="Persona"
        options={personaOptions}
        selected={personas}
        onToggle={toggle("personas")}
      />
      {totalSelected > 0 && (
        <button onClick={clearAll} className={styles.clear}>
          Clear filters
        </button>
      )}
    </aside>
  );
}
