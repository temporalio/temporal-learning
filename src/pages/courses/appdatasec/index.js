import React from "react";
import CourseLandingPage from "@site/src/components/hub/CourseLandingPage/CourseLandingPage";

const SDK_TARGETS = [
  { sdk: "go", label: "Go", href: "/courses/appdatasec/go/" },
  { sdk: "java", label: "Java", href: "/courses/appdatasec/java/" },
  { sdk: "python", label: "Python", href: "/courses/appdatasec/python/" },
  { sdk: "typescript", label: "TypeScript", href: "/courses/appdatasec/typescript/" },
];

const OUTCOMES = [
  "Apply an appropriate authentication and encryption strategy",
  "Implement a Custom Data Converter",
  "Deploy and Integrate a Codec Server with a Temporal Cluster",
];

export default function AppdatasecLandingPage() {
  return (
    <CourseLandingPage
      title="Securing Application Data"
      description="Implement Custom Data Conversion for your Temporal Workflows, including Encryption Codecs. Use Custom Data Converters and a Codec Server to support complex input and output data with encryption and key rotation considerations."
      body="Implement Custom Data Conversion for your Temporal Workflows, including the use of Encryption Codecs. Use Custom Data Converters and a Codec Server to support complex input and output data, with guidance on user management, encryption standards, and key rotation."
      duration="2 hours"
      sdkTargets={SDK_TARGETS}
      outcomes={OUTCOMES}
    />
  );
}
