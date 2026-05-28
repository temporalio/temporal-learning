import React from "react";
import CourseLandingPage from "@site/src/components/hub/CourseLandingPage/CourseLandingPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/courses/temporal_102/go/" },
  { sdk: "java", label: "Java", href: "/courses/temporal_102/java/" },
  { sdk: "python", label: "Python", href: "/courses/temporal_102/python/" },
  { sdk: "ruby", label: "Ruby", href: "/courses/temporal_102/ruby/" },
  { sdk: "typescript", label: "TypeScript", href: "/courses/temporal_102/typescript/" },
  { sdk: "dotnet", label: ".NET", href: "/courses/temporal_102/dotnet/" },
];

const OUTCOMES = [
  "Evaluate how the Temporal Platform achieves Durable Execution",
  "Apply best practices for Temporal application development",
  "Analyze an Event History to debug problems with Workflow Execution",
  "Prepare for using Temporal in a production environment",
];

export default function Temporal102LandingPage() {
  return (
    <CourseLandingPage
      title="Temporal 102: Exploring Durable Execution"
      description="Go beyond the basics and gain a deeper understanding of how Temporal works as you explore Temporal's event history, application lifecycle, write tests, and explore Durable Execution."
      body="Go beyond the basics of Temporal application development. Learn how to test, debug, and deploy applications, and gain a deeper understanding of Durable Execution through key concepts and best practices."
      duration="4 hours"
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
    />
  );
}
