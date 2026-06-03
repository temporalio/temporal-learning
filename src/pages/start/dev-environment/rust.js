import React from "react";
import SetupContentPage from "@site/src/components/hub/setup/SetupContentPage";
import RustSetup from "../_setup/rust.mdx";

export default function RustSetupPage() {
  return (
    <SetupContentPage
      label="Rust"
      Content={RustSetup}
      nextHref="/courses/temporal_101"
      nextLabel="Take the Temporal 101 course"
    />
  );
}
