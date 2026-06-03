import React from "react";
import { MDXProvider } from "@mdx-js/react";
import MDXComponents from "@theme/MDXComponents";
import EmbedStepPage from "@site/src/components/hub/EmbedStepPage/EmbedStepPage";

/**
 * Renders one SDK's local-setup quickstart (from src/pages/start/_setup/*.mdx)
 * inside the Learn step-page chrome. Used by the /start/dev-environment/<sdk> pages.
 */
export default function SetupContentPage({
  label,
  Content,
  nextHref = "/start/build-from-scratch",
  nextLabel = "Step 03 — Build an application from scratch",
}) {
  return (
    <EmbedStepPage
      step={2}
      title={`Set up your dev environment with ${label}.`}
      body={`Install the Temporal CLI and the ${label} SDK, then verify a local Temporal Service is running.`}
      breadcrumbSub={label}
      nextHref={nextHref}
      nextLabel={nextLabel}
    >
      <div className="markdown">
        <MDXProvider components={MDXComponents}>
          <Content />
        </MDXProvider>
      </div>
    </EmbedStepPage>
  );
}
