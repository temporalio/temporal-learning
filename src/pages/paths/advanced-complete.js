import React from "react";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import Quiz from "@site/src/components/hub/Quiz/Quiz";
import styles from "./foundation-complete.module.css";

const KNOW_NOW = [
  {
    title: "Temporal Cloud fundamentals",
    body: "You can explain what's managed for you, what stays your responsibility, and what drives Temporal Cloud's consumption pricing.",
  },
  {
    title: "Identity and access",
    body: "You can secure a Namespace with API Keys, TLS certificate filters, and the right account-level roles for your team.",
  },
  {
    title: "Resilient deployments",
    body: "You can design Multi-Region Namespaces with active and standby regions to keep your application available through a region outage.",
  },
  {
    title: "Operational visibility",
    body: "You can shape Custom Search Attributes for the way your team queries Workflows and understand the Event History timing that supports them.",
  },
];

const QUIZ_QUESTIONS = [
  {
    source: "Intro to Temporal Cloud",
    prompt:
      "Which of the following best describes the purpose of an API Key in Temporal Cloud?",
    options: [
      "It provides identity-based authentication for users and service accounts.",
      "It unlocks access to the Worker API when using Temporal Cloud.",
      "It unlocks access to the Client API when using Temporal Cloud.",
      "It is used to configure SAML-based Single Sign-On (SSO) access to the Temporal Cloud Web UI.",
    ],
    correctIndex: 0,
    reason:
      "An API Key is a secret value, linked to the identity of a user or service account, used to authenticate client requests. It is an alternative to using TLS certificates for authentication. The Worker and Client APIs provided by the Temporal SDK don't require an API Key, and SAML-based SSO is configured separately.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt:
      "Which of the following best describes the Multi-Region Namespace feature in Temporal Cloud?",
    options: [
      "It provides a single logical Namespace that operates across two physical cloud provider regions (active and standby).",
      "It provides a single logical Namespace that uses IP geolocation to distribute Tasks to Workers based on the regions where those Workers run.",
      "It provides a single logical Namespace that evaluates current network latency across multiple regions and automatically selects a single region with the best performance.",
      "It provides a single logical Namespace composed of a cloud provider region and a self-hosted Temporal Service.",
    ],
    correctIndex: 0,
    reason:
      "The Multi-Region Namespace feature improves availability even when there is disruption within a cloud provider region. It operates across and synchronizes data between two regions - one active and one standby. Network latency is one criterion it monitors when deciding whether to fail over, but the person creating the Namespace picks both the active and standby regions.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt: "What is the purpose of a Certificate Filter in Temporal Cloud?",
    options: [
      "It limits the ability to connect to a Temporal Cloud Namespace based on values in a client certificate.",
      "It limits who can see the client certificate in the Namespace settings of the Temporal Cloud Web UI.",
      "It limits who can see the Certificate Authority certificate in the Namespace settings of the Temporal Cloud Web UI.",
      "It filters the list of Workflow Executions displayed in the Temporal Cloud Web UI based on the certificate used to start them.",
    ],
    correctIndex: 0,
    reason:
      "Certificate Filters authorize client certificates based on Distinguished Name (DN) fields, letting you restrict which certificates can be used to connect to a particular Namespace.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt:
      "Which of the following are factors that affect the cost of using Temporal Cloud? (The original allows two correct answers - pick either.)",
    options: [
      "The number of Actions that occurred during Workflow Executions.",
      "The duration of each user session in the Temporal Cloud Web UI.",
      "The Retention Period for each Namespace in your account.",
      "The number of user sessions in the Temporal Cloud Web UI.",
    ],
    correctIndex: 0,
    reason:
      "The number of Actions and the amount of storage used over a given timeframe are the two primary factors in Temporal Cloud's consumption-based pricing. Retention Period affects storage, so it's also correct. The frequency or duration of Web UI sessions does not affect cost.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt:
      "You use a Workflow to manage a customer loyalty program. Which type is most appropriate for a Custom Search Attribute that represents the number of loyalty program points a customer has earned?",
    options: ["Double", "Int", "Keyword", "Entity"],
    correctIndex: 1,
    reason:
      "The number of points earned by a customer is a whole number like 250 or 5,000, making Int the best type for this Attribute.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt:
      "You have the account-level role of Developer in Temporal Cloud. You've created a new Namespace but haven't assigned any users to it yet. Maria also has the Developer role. Which of the following best describes who can modify or delete the Namespace?",
    options: [
      "Neither you nor Maria will be able to modify or delete this Namespace.",
      "Both you and Maria will be able to modify or delete this Namespace.",
      "You will be able to modify and delete this Namespace, but Maria will not.",
      "You will be able to modify this Namespace, but Maria will not, and neither of you will be able to delete it.",
    ],
    correctIndex: 2,
    reason:
      "You will be able to modify and delete this Namespace, but Maria will not. The Developer role allows you to perform those functions on Namespaces that you create.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt: "Which of the below is a benefit of using Temporal Cloud?",
    options: [
      "It provides full control over the underlying infrastructure for the Temporal Service.",
      "It eliminates the need to maintain a self-hosted deployment of the Temporal Service.",
      "It eliminates the need to write Workflows or Activities.",
      "It eliminates the need to run Temporal Workers.",
    ],
    correctIndex: 1,
    reason:
      "Temporal Cloud provides a Temporal Service operated and maintained by Temporal's staff, eliminating the need to install, maintain, and support a self-hosted deployment. It does not eliminate the need to write application code (Workflows and Activities) or to run Workers on your preferred infrastructure.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt: "What is the role of Namespaces in the Temporal Service?",
    options: [
      "They provide logical isolation for Workflow Executions.",
      "They act as network ingress for Workers.",
      "They act as an API gateway for Client requests.",
      "They provide hostname resolution for Workers.",
    ],
    correctIndex: 0,
    reason:
      "Namespaces provide logical isolation for Workflow Executions. Two teams using the same Temporal Service can operate Workflow Executions in different Namespaces so that settings and access controls are configured independently. Namespaces are not network ingress, hostname resolution, or an API gateway.",
  },
  {
    source: "Intro to Temporal Cloud",
    prompt:
      "Why is the ActivityTaskStarted Event not written to the Event History when the Activity Execution begins?",
    options: [
      "This Event contains the final attempt number, which isn't known until the Activity closes.",
      "The premise of the question is incorrect; the Event is immediately written to History when Activity Execution begins.",
      "This behavior may or may not occur, depending on the specific SDK used for the Activity.",
      "This behavior may or may not occur, depending on the specific database used for persistence with the Temporal Service.",
    ],
    correctIndex: 0,
    reason:
      "The ActivityTaskStarted Event contains an attribute with the final attempt number. Since an Activity Execution may fail and each failure can lead to another retry attempt, the final attempt number remains unknown until the execution closes. This behavior is independent of the SDK or persistence database.",
  },
];

export default function AdvancedCompletePage() {
  return (
    <Layout
      title="Advanced path complete"
      description="You've finished the Advanced path on learn.temporal.io."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Advanced complete"
          title="You can run Temporal in production."
          body="You've finished the Advanced path. You can operate against Temporal Cloud, lock down access with API Keys and certificate filters, design Multi-Region Namespaces for resilience, and shape the Search Attributes your team queries every day."
          showSearch={false}
        />

        <div className={styles.pageInner}>
          <div className={styles.breadcrumbWrap}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Paths", href: "/paths" },
                {
                  label: "Advanced",
                  href: "/paths/advanced",
                },
                { label: "Complete" },
              ]}
            />
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What you now understand</h2>
            <div className={styles.knowGrid}>
              {KNOW_NOW.map((item) => (
                <div key={item.title} className={styles.knowCard}>
                  <h3 className={styles.knowTitle}>{item.title}</h3>
                  <p className={styles.knowBody}>{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Quick check: test what you remember</h2>
            <p className={styles.quizIntro}>
              {QUIZ_QUESTIONS.length} questions drawn from Intro to Temporal Cloud. Pick
              an answer - if you miss it, the explanation appears once you find the right
              one.
            </p>
            <Quiz questions={QUIZ_QUESTIONS} />
          </section>

          <div className={styles.bottomCta}>
            <MagentaCta to="https://temporal.io/get-cloud">Get Temporal Cloud</MagentaCta>
          </div>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
