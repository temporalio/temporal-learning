import React from "react";
import StepPage from "@site/src/components/hub/StepPage/StepPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/getting_started/go/dev_environment/" },
  { sdk: "java", label: "Java", href: "/getting_started/java/dev_environment/" },
  { sdk: "dotnet", label: ".NET", href: "/getting_started/dotnet/dev_environment/" },
  { sdk: "php", label: "PHP", href: "/getting_started/php/dev_environment/" },
  { sdk: "python", label: "Python", href: "/getting_started/python/dev_environment/" },
  { sdk: "ruby", label: "Ruby", href: "/getting_started/ruby/dev_environment/" },
  { sdk: "typescript", label: "TypeScript", href: "/getting_started/typescript/dev_environment/" },
];

const OUTCOMES = [
  "The Temporal CLI installed and on your PATH",
  "The Temporal SDK installed in a fresh project",
  "A local Temporal Service running on your machine",
];

export default function DevEnvironmentPage() {
  return (
    <StepPage
      step={1}
      title="Set up your dev environment."
      body="Install the Temporal CLI, the SDK in your language, and verify a local Temporal Service is running. About five minutes once you've picked a language."
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
      nextHref="/start/run-an-app"
      nextLabel="Step 02 — Run a Temporal app"
    />
  );
}
