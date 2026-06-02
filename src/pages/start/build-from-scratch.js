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
      title="Build one from scratch."
      body="Write your first Workflow and Activity from the ground up."
      pickerSubtitle="Available in five SDKs - pick yours and follow the build."
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
      nextHref="/paths/foundation"
      nextLabel="Done — take the Foundation path"
    />
  );
}
