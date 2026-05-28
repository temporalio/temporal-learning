import React from "react";
import Link from "@docusaurus/Link";
import styles from "./styles.module.css";

const SDK_LABELS = {
  go: "Go",
  java: "Java",
  dotnet: ".NET",
  python: "Python",
  ruby: "Ruby",
  typescript: "TypeScript",
  php: "PHP",
};

export default function SdkChips({ sdks, baseUrl }) {
  if (!sdks || sdks.length === 0) return null;
  return (
    <div className={styles.row}>
      {sdks.map((sdk) => {
        const label = SDK_LABELS[sdk] ?? sdk;
        const href = baseUrl ? `${baseUrl}/${sdk}` : null;
        const Element = href ? Link : "span";
        const props = href ? { to: href } : {};
        return (
          <Element key={sdk} className={styles.chip} {...props}>
            {label}
          </Element>
        );
      })}
    </div>
  );
}
