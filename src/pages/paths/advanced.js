import React from "react";
import PathDetail from "@site/src/components/hub/PathDetail/PathDetail";

export default function AdvancedPath() {
  return (
    <PathDetail
      slug="advanced"
      outcomes={[
        "Roll out new Worker versions without breaking running Workflows",
        "Operate your application against Temporal Cloud",
        "Manage namespaces, RBAC, and observability for your team",
      ]}
      completionLink={{
        href: "/paths/advanced-complete",
        label: "Already finished the Advanced path? Jump to the recap and quiz.",
      }}
      bottomCta={{
        href: "https://temporal.io/get-cloud",
        label: "Get Temporal Cloud",
      }}
    />
  );
}
