import React from "react";
import PathDetail from "@site/src/components/hub/PathDetail/PathDetail";

export default function ProductionGradeDeveloperPath() {
  return (
    <PathDetail
      slug="Production-Grade-developer"
      outcomes={[
        "Roll out new Worker versions without breaking running Workflows",
        "Operate your application against Temporal Cloud",
        "Manage namespaces, RBAC, and observability for your team",
      ]}
      completionLink={{
        href: "/paths/production-grade-developer-complete",
        label: "Already finished the Production-Grade path?",
      }}
      nextActions={{
        label: "What's next?",
        items: [
          {
            eyebrow: "Quiz · 9 questions",
            title: "Check your understanding",
            body: "Take a quick quiz on Intro to Temporal Cloud. Miss one and you'll see the reasoning.",
            cta: "Take the quiz",
            href: "/paths/production-grade-developer-complete",
          },
          {
            eyebrow: "Temporal Cloud",
            title: "Run on Temporal Cloud",
            body: "Skip the infrastructure work. Spin up a managed Namespace and start moving Workflows over in minutes.",
            cta: "Get Temporal Cloud",
            href: "https://temporal.io/get-cloud",
          },
        ],
      }}
    />
  );
}
