import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import TypeScriptSetup from "../_setup/typescript.mdx";

export default function TypeScriptSetupPage() {
  return (
    <SetupContentPage
      label="TypeScript"
      Content={TypeScriptSetup}
      nextHref="/getting_started/typescript/hello_world_in_typescript/"
    />
  );
}
