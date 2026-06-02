import React from "react";
import Layout from "@theme/Layout";
import NotifyBanner from "@site/src/components/hub/NotifyBanner/NotifyBanner";
import PathBreadcrumb from "@site/src/components/hub/PathBreadcrumb/PathBreadcrumb";
import styles from "./zines.module.css";

const ZINES = [
  {
    title: "What is Durable Execution?",
    href: "/zines/zines.pdf",
    cover: "/zines/coverart.png",
    description:
      "A comic that delves into the world of Temporal and Durable Execution. Why Durable Execution? What can you use it for? What happens when an external service goes down? How does the Event History guarantee durability? Engaging for engineers, non-technical readers, and the just-curious.",
    authors: ["Mason Egger", "Angela Zhou"],
    illustrator: "Ash Ramos",
  },
];

export default function ZinesPage() {
  return (
    <Layout
      title="Zines"
      description="Comic-style explainers for Temporal and Durable Execution."
    >
      <div className="nd-hub-page">
        <div className={styles.heroBanner}>
          <img
            src="/img/banners/zines.png"
            alt="Zines"
            className={styles.heroBannerImg}
          />
        </div>

        <div className={styles.pageInner}>
          <div className={styles.breadcrumbWrap}>
            <PathBreadcrumb
              items={[
                { label: "Learn Temporal", href: "/" },
                { label: "Zines" },
              ]}
            />
          </div>

          <p className={styles.intro}>
            Comic-style explainers for visual learners or someone without a technical background. Short, fun, and informative.
          </p>

          <section className={styles.section}>
            <div className={styles.grid}>
              {ZINES.map((zine) => (
                <article key={zine.href} className={styles.card}>
                  <a
                    href={zine.href}
                    className={styles.coverLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={zine.cover}
                      alt={zine.title}
                      className={styles.cover}
                      loading="lazy"
                    />
                  </a>
                  <div className={styles.body}>
                    <h2 className={styles.title}>
                      <a
                        href={zine.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {zine.title}
                      </a>
                    </h2>
                    <p className={styles.description}>{zine.description}</p>
                    <dl className={styles.credits}>
                      <div className={styles.creditRow}>
                        <dt>Authors</dt>
                        <dd>{zine.authors.join(", ")}</dd>
                      </div>
                      <div className={styles.creditRow}>
                        <dt>Illustrator</dt>
                        <dd>{zine.illustrator}</dd>
                      </div>
                    </dl>
                    <a
                      href={zine.href}
                      className={styles.cta}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read the zine (PDF){" "}
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <p className={styles.footnote}>More zines coming soon.</p>
          </section>
        </div>

        <NotifyBanner />
      </div>
    </Layout>
  );
}
