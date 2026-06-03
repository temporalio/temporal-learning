import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import JavaSetup from "../_setup/java.mdx";

export default function JavaSetupPage() {
  return <SetupContentPage label="Java" Content={JavaSetup} />;
}
