import React from "react";
import { TOPICS } from "@site/src/data/hub";
import styles from "./styles.module.css";

export default function TopicTag({ topic, size = "sm" }) {
  const entry = TOPICS[topic];
  const label = entry ? entry.label : topic;
  return (
    <span className={styles.tag} data-topic={topic} data-size={size}>
      {label.toUpperCase()}
    </span>
  );
}
