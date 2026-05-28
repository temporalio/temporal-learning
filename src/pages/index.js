import React from "react";
import Layout from "@theme/Layout";
import Home from "@site/src/components/hub/Home/Home";

export default function HomePage() {
  return (
    <Layout
      title="Learn Temporal"
      description="Build invincible applications with Temporal through hands-on tutorials and courses."
    >
      <Home />
    </Layout>
  );
}
