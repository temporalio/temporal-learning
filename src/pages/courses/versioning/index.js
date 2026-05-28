import React from "react";
import CourseLandingPage from "@site/src/components/hub/CourseLandingPage/CourseLandingPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/courses/versioning/go/" },
  { sdk: "java", label: "Java", href: "/courses/versioning/java/" },
  { sdk: "python", label: "Python", href: "/courses/versioning/python/" },
  { sdk: "typescript", label: "TypeScript", href: "/courses/versioning/typescript/" },
];

const OUTCOMES = [
  "Apply an appropriate Versioning strategy to modify your Workflows",
  "Implement a Versioned Workflow",
  "Verify correct implementations of Versioning strategies",
];

export default function VersioningLandingPage() {
  return (
    <CourseLandingPage
      title="Versioning Workflows"
      description="Go beyond the fundamentals and learn how to safely evolve your Temporal application code in production. Cover several approaches to versioning Temporal Workflows, with examples of monitoring and testing your Workflow Execution History."
      body="Go beyond the fundamentals and learn how to safely evolve your Temporal application code in production. Cover several approaches to versioning Temporal Workflows, bookended by examples of how to monitor and test your Workflow Execution History."
      duration="1.5 hours"
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
    />
  );
}
