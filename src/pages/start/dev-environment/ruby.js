import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import RubySetup from "../_setup/ruby.mdx";

export default function RubySetupPage() {
  return <SetupContentPage label="Ruby" Content={RubySetup} />;
}
