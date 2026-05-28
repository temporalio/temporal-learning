import React from "react";
import CourseLandingPage from "@site/src/components/hub/CourseLandingPage/CourseLandingPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/courses/interacting_with_workflows/go/" },
  { sdk: "java", label: "Java", href: "/courses/interacting_with_workflows/java/" },
  { sdk: "python", label: "Python", href: "/courses/interacting_with_workflows/python/" },
  { sdk: "typescript", label: "TypeScript", href: "/courses/interacting_with_workflows/typescript/" },
];

const OUTCOMES = [
  "Integrate Signals and Queries with Workflows",
  "Develop Custom Search Attributes to identify specific Workflow Executions",
  "Evaluate methods to stop Workflow Executions",
  "Develop Activities asynchronously",
];

export default function InteractingWithWorkflowsLandingPage() {
  return (
    <CourseLandingPage
      title="Interacting with Workflows"
      description="Expand your ability to write dynamic Workflows by interacting with them and enabling them to respond to external stimuli. Use Signals, Queries, Search Attributes, and asynchronous Activity Completion."
      body="Expand your ability to write dynamic Workflows by interacting with them and enabling them to respond to external stimuli. Use Signals to interact with running Workflows, Queries to retrieve information, Search Attributes to filter Executions, and asynchronously complete Activities for long-running tasks."
      duration="3 hours"
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
    />
  );
}
