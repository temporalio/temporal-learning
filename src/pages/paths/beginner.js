import React from "react";
import PathDetail from "@site/src/components/hub/PathDetail/PathDetail";

export default function BeginnerPath() {
  return (
    <PathDetail
      slug="beginner"
      outcomes={[
        "Explain durable execution and Temporal's execution model",
        "Write a Workflow and Activity in your SDK of choice",
        "Use the Temporal Web UI and command-line tools",
        "Recognize and recover from common failure modes",
      ]}
      completionLink={{
        href: "/paths/beginner-complete",
        label: "Already finished Temporal 101 + 102? Jump to the recap and quiz",
      }}
      bottomCta={{
        href: "/paths/intermediate",
        label: "Continue to the Intermediate Learning Path",
      }}
    />
  );
}
