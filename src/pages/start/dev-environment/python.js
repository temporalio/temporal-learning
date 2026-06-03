import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import PythonSetup from "../_setup/python.mdx";

export default function PythonSetupPage() {
  return (
    <SetupContentPage
      label="Python"
      Content={PythonSetup}
      nextHref="/getting_started/python/hello_world_in_python/"
    />
  );
}
