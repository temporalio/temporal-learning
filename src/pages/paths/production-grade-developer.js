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
      nextActions={{
        label: "What's next?",
        items: [
          {
            eyebrow: "Temporal Cloud",
            title: "Run on Temporal Cloud",
            body: "Stop running your own Temporal Service. Spin up a managed namespace and start moving Workflows over in minutes.",
            cta: "Get Temporal Cloud",
            href: "https://temporal.io/get-cloud",
          },
        ],
      }}
    />
  );
}
