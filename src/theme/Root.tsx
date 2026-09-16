import React, {type ReactNode} from "react";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";

if (ExecutionEnvironment.canUseDOM) {
  import("@temporalio-web/consent-banner");
}

export default function Root({children}: {children: ReactNode}): ReactNode {
  return (
    <>
      {children}
      {React.createElement("temporal-consent-banner")}
    </>
  );
}
