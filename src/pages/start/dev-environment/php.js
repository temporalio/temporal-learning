import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import PhpSetup from "../_setup/php.mdx";

export default function PhpSetupPage() {
  return <SetupContentPage label="PHP" Content={PhpSetup} />;
}
