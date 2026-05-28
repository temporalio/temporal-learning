import React from "react";
import PathDetail from "@site/src/components/hub/PathDetail/PathDetail";

export default function IntermediatePath() {
  return (
    <PathDetail
      slug="intermediate"
      outcomes={[
        "Design effective error-handling strategies for Workflows",
        "Interact with running Workflows via Signals and Queries",
        "Secure payloads with Custom Data Converters and a Codec Server",
        "Apply the Saga pattern and idempotence in your code",
        "Version Workflow code safely using the Patched API",
      ]}
      completionLink={{
        href: "/paths/intermediate-complete",
        label: "Already finished the Intermediate path?",
      }}
      nextActions={{
        label: "What's next?",
        items: [
          {
            eyebrow: "Path · Production",
            title: "Production-Grade Temporal",
            body: "Roll out Worker versions safely and operate your application against Temporal Cloud.",
            cta: "Start the Production-Grade path",
            href: "/paths/Production-Grade-developer",
          },
          {
            eyebrow: "Quiz · 41 questions",
            title: "Check your understanding",
            body: "Take a quick quiz across Error Handling, Interacting with Workflows, and Versioning. Miss one and you'll see the reasoning.",
            cta: "Take the quiz",
            href: "/paths/intermediate-complete",
          },
        ],
      }}
    />
  );
}
