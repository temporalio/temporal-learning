import React from "react";
import CourseLandingPage from "@site/src/components/hub/CourseLandingPage/CourseLandingPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/courses/temporal_101/go/" },
  { sdk: "java", label: "Java", href: "/courses/temporal_101/java/" },
  { sdk: "python", label: "Python", href: "/courses/temporal_101/python/" },
  { sdk: "ruby", label: "Ruby", href: "/courses/temporal_101/ruby/" },
  { sdk: "typescript", label: "TypeScript", href: "/courses/temporal_101/typescript/" },
  { sdk: "dotnet", label: ".NET", href: "/courses/temporal_101/dotnet/" },
];

const OUTCOMES = [
  "Configure an environment for developing Temporal Applications",
  "Use Temporal to describe and implement a business process",
  "Interpret Temporal's Workflow execution model",
  "Use Temporal's tooling to manage the lifecycle of your application",
];

export default function Temporal101LandingPage() {
  return (
    <CourseLandingPage
      badge="Preview available"
      title="Temporal 101: Introducing the Temporal Platform"
      description="Discover the essentials of Temporal application development in this course, focusing on Workflows and Activities. You'll develop a small app, recover from failures, and use Temporal's execution model and tools to manage your application lifecycle effectively."
      body="Explore the basic building blocks of Temporal - Workflows and Activities - by building a small app that communicates with an external service. Recover from failures, inspect event history, and use Temporal's tooling to manage your application lifecycle."
      duration="2 hours"
      sdkTargets={SDK_TARGETS}
      pickerSubtitle="Pick your SDK to either start a preview or take the full course free on our LMS."
      outcomes={OUTCOMES}
    />
  );
}
