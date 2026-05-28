import React from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HubHero from "@site/src/components/hub/HubHero/HubHero";
import MagentaCta from "@site/src/components/hub/MagentaCta/MagentaCta";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import styles from "./foundation-complete.module.css";

const KNOW_NOW = [
  {
    title: "Durable execution",
    body: "You can explain why a Workflow survives a Worker crash and where Activities fit into Temporal's execution model.",
  },
  {
    title: "Event history",
    body: "You can read a Workflow's event history in the Web UI and follow exactly what happened.",
  },
  {
    title: "Failure recovery",
    body: "You've watched Temporal retry failed Activities and resume Workflows after a crash, without any custom recovery code.",
  },
  {
    title: "Testing Workflows",
    body: "You know how to write Workflow tests and verify your code paths behave correctly before shipping.",
  },
];

function drawCertificate(canvas) {
  return new Promise((resolve) => {
    const W = 1600;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#06060E");
    bg.addColorStop(0.5, "#0C0F22");
    bg.addColorStop(1, "#1A2356");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const stripe = ctx.createLinearGradient(0, 0, W, 0);
    stripe.addColorStop(0, "#444CE7");
    stripe.addColorStop(0.5, "#7F86F1");
    stripe.addColorStop(1, "#E0157A");
    ctx.fillStyle = stripe;
    ctx.fillRect(0, 0, W, 16);

    ctx.strokeStyle = "rgba(248, 250, 252, 0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(72, 72, W - 144, H - 144);

    const drawText = () => {
      ctx.textAlign = "center";

      ctx.fillStyle = "#7F86F1";
      ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
      ctx.fillText("CERTIFICATE OF COMPLETION", W / 2, 320);

      ctx.fillStyle = "#F8FAFC";
      ctx.font = "bold 150px -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
      ctx.fillText("Foundation", W / 2, 490);

      ctx.fillStyle = "#9CA3AF";
      ctx.font = "32px -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
      ctx.fillText("Temporal 101 + Temporal 102  ·  15 lessons", W / 2, 560);

      ctx.fillStyle = "#F8FAFC";
      ctx.font = "28px -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
      ctx.fillText(
        "Awarded to a Temporal builder who knows how to",
        W / 2,
        700
      );
      ctx.fillText(
        "add durable execution to their applications.",
        W / 2,
        740
      );

      const monthYear = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      ctx.fillStyle = "#9CA3AF";
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
      ctx.fillText(`learn.temporal.io  ·  ${monthYear}`, W / 2, 880);
    };

    const img = new Image();
    img.onload = () => {
      const size = 110;
      ctx.drawImage(img, (W - size) / 2, 150, size, size);
      drawText();
      resolve();
    };
    img.onerror = () => {
      drawText();
      resolve();
    };
    img.src = "/img/temporal-symbol-dark.png";
  });
}

async function downloadCertificate() {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  await drawCertificate(canvas);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "temporal-foundation-certificate.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

function addToLinkedIn() {
  if (typeof window === "undefined") return;
  const now = new Date();
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: "Temporal Foundation",
    organizationName: "Temporal",
    issueYear: String(now.getFullYear()),
    issueMonth: String(now.getMonth() + 1),
    certUrl: window.location.href,
  });
  window.open(
    `https://www.linkedin.com/profile/add?${params.toString()}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export default function FoundationCompletePage() {
  return (
    <Layout
      title="Foundation complete"
      description="You've finished the Foundation path on learn.temporal.io."
    >
      <div className="nd-hub-page">
        <HubHero
          eyebrow="Foundation complete"
          title="You're a Temporal builder now."
          body="You've finished Temporal 101 and 102. You know how durable execution works, you can read a Workflow's event history, and you've configured retry policies that recover from failure. That's the foundation - everything else builds on it."
          showSearch={false}
        />

        <div className={styles.pageInner}>
          <div className={styles.breadcrumbWrap}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Paths", href: "/paths" },
                { label: "Foundation", href: "/paths/foundation" },
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

          <section className={styles.shareSection}>
            <div className={styles.badge} aria-hidden="true">
              <div className={styles.badgeStripe} />
              <div className={styles.badgeBody}>
                <span className={styles.badgeEyebrow}>Path complete</span>
                <span className={styles.badgeTitle}>Foundation</span>
                <span className={styles.badgeMeta}>15 lessons · Temporal 101 + 102</span>
              </div>
              <div className={styles.badgeFoot}>
                <span className={styles.badgeIssuer}>learn.temporal.io</span>
              </div>
            </div>
            <div className={styles.shareContent}>
              <h2 className={styles.sectionTitle}>Share the milestone</h2>
              <p className={styles.shareBody}>
                Tell your team, add it to your LinkedIn profile, or grab the link.
              </p>
              <div className={styles.shareButtons}>
                <button
                  type="button"
                  className={styles.shareBtnPrimary}
                  onClick={downloadCertificate}
                >
                  Download certificate (PNG)
                </button>
                <button
                  type="button"
                  className={styles.shareBtn}
                  onClick={addToLinkedIn}
                >
                  Add to LinkedIn profile
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.swagCard}>
              <div className={styles.swagText}>
                <span className={styles.swagEyebrow}>Foundation reward</span>
                <h2 className={styles.swagTitle}>Claim a Temporal shirt</h2>
                <p className={styles.swagBody}>
                  Finishing Foundation earns you a free Temporal shirt. One per
                  email - we ship anywhere we can.
                </p>
              </div>
              {/* TODO: wire to real fulfillment - Marketo/Hubspot form, store discount code, or manual review queue. Placeholder links to the store. */}
              <a
                className={styles.swagBtn}
                href="https://store.temporal.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Claim your shirt →
              </a>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What's next</h2>
            <div className={styles.nextGrid}>
              <Link to="/paths/intermediate" className={styles.nextCard}>
                <span className={styles.nextEyebrow}>Path · Practical</span>
                <h3 className={styles.nextTitle}>Building Resilient Applications</h3>
                <p className={styles.nextBody}>
                  Error handling strategies, Signals and Queries, securing
                  payloads end-to-end.
                </p>
                <span className={styles.nextCta}>
                  Start the Intermediate path <span aria-hidden="true">→</span>
                </span>
              </Link>
              <Link to="/tutorials" className={styles.nextCard}>
                <span className={styles.nextEyebrow}>Build a project</span>
                <h3 className={styles.nextTitle}>Pick a tutorial</h3>
                <p className={styles.nextBody}>
                  Apply what you learned with a tutorial. Pick from several use cases including background check, order processing,
                  email drip, AI etc.
                </p>
                <span className={styles.nextCta}>
                  Browse tutorials <span aria-hidden="true">→</span>
                </span>
              </Link>
            </div>
          </section>

          <div className={styles.bottomCta}>
            <MagentaCta to="/paths/intermediate">Continue to Intermediate</MagentaCta>
          </div>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
