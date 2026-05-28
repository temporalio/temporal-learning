import React from "react";
import StepPage from "@site/src/components/hub/StepPage/StepPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/getting_started/go/first_program_in_go/" },
  { sdk: "java", label: "Java", href: "/getting_started/java/first_program_in_java/" },
  { sdk: "dotnet", label: ".NET", href: "/getting_started/dotnet/first_program_in_dotnet/" },
  { sdk: "php", label: "PHP", href: "/getting_started/php/hello_world_in_php/" },
  { sdk: "python", label: "Python", href: "/getting_started/python/first_program_in_python/" },
  { sdk: "ruby", label: "Ruby", href: "/getting_started/ruby/first_program_in_ruby/" },
  { sdk: "typescript", label: "TypeScript", href: "/getting_started/typescript/first_program_in_typescript/" },
];

const OUTCOMES = [
  "A running Temporal Workflow in your terminal",
  "The Temporal Web UI open, showing the Workflow Execution",
  "A Worker crash-and-recover demo that survives you killing the process",
];

export default function RunAnAppPage() {
  return (
    <StepPage
      step={2}
      title="Run a Temporal application."
      body="Download a small Temporal app, run it, and watch how it handles failures - including ones you cause yourself by killing the Worker."
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
      nextHref="/start/build-from-scratch"
      nextLabel="Step 03 — Build one from scratch"
    />
  );
}
