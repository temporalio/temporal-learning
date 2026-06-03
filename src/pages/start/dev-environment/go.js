import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import GoSetup from "../_setup/go.mdx";

export default function GoSetupPage() {
  return (
    <SetupContentPage
      label="Go"
      Content={GoSetup}
      nextHref="/getting_started/go/hello_world_in_go/"
    />
  );
}
