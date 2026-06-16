import React from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";

// Shared sign-up call-to-action used across all tutorials.
// Renders a card with a headline, subheading, and a button featuring an
// animated Ziggy mascot (see `.ziggy-cta` styles in src/css/custom.css).
export default function TutorialCta({
  to = "https://pages.temporal.io/get-updates-education",
  heading = "Never miss a new tutorial",
  children = "Be the first to know when we ship new tutorials, courses, and hands-on guides. No spam, unsubscribe anytime.",
  cta = "Join the Temporal education list →",
  // `excited` swaps the gentle idle float for an intense, can't-contain-it shake.
  excited = false,
}) {
  const ziggy = useBaseUrl("/img/ziggy.png");
  const ctaClass = "button button--primary button--lg ziggy-cta" + (excited ? " ziggy-cta--excited" : "");
  return (
    <div className="card padding--lg margin-vert--lg" style={{textAlign: "center"}}>
      <h2 className="margin-bottom--sm">{heading}</h2>
      <p className="margin-bottom--md">{children}</p>
      <Link className={ctaClass} to={to}>
        <img src={ziggy} alt="" aria-hidden="true" className="ziggy-cta__mascot" />
        {cta}
      </Link>
    </div>
  );
}
