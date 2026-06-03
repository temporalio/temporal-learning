import React from "react";
import StepPage from "@site/src/components/hub/StepPage/StepPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/getting_started/go/hello_world_in_go/" },
  { sdk: "java", label: "Java", href: "/getting_started/java/hello_world_in_java/" },
  { sdk: "python", label: "Python", href: "/getting_started/python/hello_world_in_python/" },
  { sdk: "ruby", label: "Ruby", href: "/getting_started/ruby/hello_world_in_ruby/" },
  { sdk: "typescript", label: "TypeScript", href: "/getting_started/typescript/hello_world_in_typescript/" },
];

const OUTCOMES = [
  "A Workflow and Activity you wrote from scratch",
  "A Worker connecting to a Task Queue",
  "The Temporal Web UI showing your Workflow completing",
];

export default function BuildFromScratchPage() {
  return (
    <StepPage
      step={3}
      title="Build an application from scratch."
      body="Write and run your first Temporal application from scratch, step by step in your language. You'll build it piece by piece and see it execute end to end."
      pickerSubtitle="Available in five SDKs - pick yours and follow the build."
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
      nextHref="/paths/beginner"
      nextLabel="Done - take the Beginner path"
    />
  );
}
