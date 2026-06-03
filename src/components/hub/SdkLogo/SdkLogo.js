import React from "react";
import styles from "./styles.module.css";

const LOGO_FILES = {
  go: "go.jpg",
  java: "java.png",
  dotnet: "dotnet.png",
  php: "php.jpg",
  python: "python.jpg",
  ruby: "ruby.jpg",
  rust: "rust.png",
  typescript: "typescript.jpg",
};

/**
 * Branded SDK logo tile. Each image lives in static/img/sdk-logos/ and
 * already includes its own colored tile background.
 */
export default function SdkLogo({ sdk, size = 40 }) {
  const file = LOGO_FILES[sdk];
  const url = file ? `/img/sdk-logos/${file}` : null;
  return (
    <span
      className={`${styles.tile} ${url ? "" : styles.fallback}`}
      style={{
        width: size,
        height: size,
        backgroundImage: url ? `url('${url}')` : undefined,
      }}
      aria-hidden="true"
    />
  );
}
