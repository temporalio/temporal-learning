import React from "react";
import PathDetail from "@site/src/components/hub/PathDetail/PathDetail";

export default function AiPath() {
  return (
    <PathDetail
      slug="ai"
      outcomes={[
        "Build durable AI applications backed by Temporal Workflows",
        "Expose Workflows as MCP tools that LLM agents can call",
        "Run long-running research agents that survive failure",
      ]}
      nextActions={{
        label: "What's next?",
        items: [
          {
            eyebrow: "AI resources",
            title: "Explore more AI on Temporal",
            body: "Demos, expert sessions, MCP integrations, and reference architectures for durable AI agents.",
            cta: "Browse AI resources",
            href: "/ai",
          },
          {
            eyebrow: "Temporal for AI",
            title: "See how teams ship durable AI",
            body: "Customer stories, solution patterns, and use cases for running AI agents on Temporal.",
            cta: "Visit temporal.io/solutions/ai",
            href: "https://temporal.io/solutions/ai",
          },
        ],
      }}
    />
  );
}
