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
        label: "Already finished the Intermediate path? Jump to the recap and quiz.",
      }}
      bottomCta={{
        href: "/paths/advanced",
        label: "Continue to the Advanced Learning Path",
      }}
    />
  );
}
