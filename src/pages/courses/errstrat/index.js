import React from "react";
import CourseLandingPage from "@site/src/components/hub/CourseLandingPage/CourseLandingPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/courses/errstrat/go/" },
  { sdk: "java", label: "Java", href: "/courses/errstrat/java/" },
  { sdk: "python", label: "Python", href: "/courses/errstrat/python/" },
  { sdk: "typescript", label: "TypeScript", href: "/courses/errstrat/typescript/" },
  { sdk: "dotnet", label: ".NET", href: "/courses/errstrat/dotnet/" },
];

const OUTCOMES = [
  "Recommend an error handling strategy",
  "Implement an error handling strategy",
  "Integrate appropriate mechanisms for handling various types of errors",
];

export default function ErrstratLandingPage() {
  return (
    <CourseLandingPage
      title="Crafting an Error Handling Strategy"
      description="Design and implement effective error handling strategies that map your business logic to the Temporal platform. Explore different types of failures and learn essential concepts like idempotence, Heartbeating, and the Saga Pattern."
      body="Design and implement effective error handling strategies that map your business logic to the Temporal platform. Explore the nature of different failures and the support Temporal provides for addressing them, including idempotence, Heartbeating, and the Saga Pattern."
      duration="2.5 hours"
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
    />
  );
}
