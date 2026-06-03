import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import DotNetSetup from "../_setup/dotnet.mdx";

export default function DotNetSetupPage() {
  return <SetupContentPage label=".NET" Content={DotNetSetup} />;
}
