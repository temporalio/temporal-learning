import React from "react";
import StepPage from "@site/src/components/hub/StepPage/StepPage";
import styles from "./styles.module.css";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/start/dev-environment/go" },
  { sdk: "java", label: "Java", href: "/start/dev-environment/java" },
  { sdk: "dotnet", label: ".NET", href: "/start/dev-environment/dotnet" },
  { sdk: "php", label: "PHP", href: "/start/dev-environment/php" },
  { sdk: "python", label: "Python", href: "/start/dev-environment/python" },
  { sdk: "ruby", label: "Ruby", href: "/start/dev-environment/ruby" },
  { sdk: "rust", label: "Rust", href: "/start/dev-environment/rust" },
  { sdk: "typescript", label: "TypeScript", href: "/start/dev-environment/typescript" },
];

const OUTCOMES = [
  "The Temporal CLI installed and on your PATH",
  "The Temporal SDK installed in a fresh project",
  "A local Temporal Service running on your machine",
];

const PICKER_SUBTITLE = (
  <>
    Choose your language to get started locally. If you're using Temporal Cloud,
    check out{" "}
    <a
      className={styles.cloudLink}
      href="https://docs.temporal.io/cloud/get-started"
    >
      Get started with Temporal Cloud
    </a>
    .
  </>
);

export default function DevEnvironmentPage() {
  return (
    <StepPage
      step={2}
      title="Set up your dev environment."
      body="Install the Temporal CLI, the SDK in your language, and verify a local Temporal Service is running. Pick your language to follow the quickstart."
      sdkTargets={SDK_TARGETS}
      pickerSubtitle={PICKER_SUBTITLE}
      outcomes={OUTCOMES}
      nextHref="/start/build-from-scratch"
      nextLabel="Step 03 — Build an application from scratch"
    />
  );
}
