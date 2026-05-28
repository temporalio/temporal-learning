import React from "react";
import PathDetail from "@site/src/components/hub/PathDetail/PathDetail";

export default function FoundationPath() {
  return (
    <PathDetail
      slug="foundation"
      outcomes={[
        "Explain durable execution and Temporal's execution model",
        "Write a Workflow and Activity in your SDK of choice",
        "Use the Temporal Web UI and command-line tools",
        "Recognize and recover from common failure modes",
      ]}
      completionLink={{
        href: "/paths/foundation-complete",
        label: "Already finished Temporal 101 + 102? Mark the milestone",
      }}
      nextActions={{
        label: "What's next?",
        items: [
          {
            eyebrow: "Path · Practical",
            title: "Building Resilient Applications",
            body: "Error handling strategies, Signals and Queries, securing payloads end-to-end.",
            cta: "Start the Intermediate path",
            href: "/paths/intermediate",
          },
          {
            eyebrow: "Build a project",
            title: "Pick a tutorial",
            body: "Apply what you learned with a tutorial. Pick from several use cases including background check, order processing, email drip, AI etc.",
            cta: "Browse tutorials",
            href: "/tutorials",
          },
        ],
      }}
    />
  );
}
