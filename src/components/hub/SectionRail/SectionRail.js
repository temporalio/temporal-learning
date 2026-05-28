import React from "react";
import Link from "@docusaurus/Link";
import CourseCard from "../CourseCard/CourseCard";
import styles from "./styles.module.css";

export default function SectionRail({
  title,
  titleHref,
  seeAllHref,
  seeAllLabel = "See all",
  courses,
  columns = 3,
  cardSize,
  children,
}) {
  const useChildren = children != null;
  if (!useChildren && (!courses || courses.length === 0)) return null;

  const resolvedCardSize = cardSize ?? (columns === 2 ? "lg" : "md");

  const titleEl = titleHref ? (
    <Link to={titleHref} className={styles.titleLink}>
      <h2 className={styles.title}>
        {title}
        <span aria-hidden="true" className={styles.titleArrow}>→</span>
      </h2>
    </Link>
  ) : (
    <h2 className={styles.title}>{title}</h2>
  );

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        {titleEl}
        {seeAllHref && (
          <Link to={seeAllHref} className={styles.seeAll}>
            {seeAllLabel}
            <span aria-hidden="true" className={styles.arrow}>→</span>
          </Link>
        )}
      </header>

      {useChildren ? (
        children
      ) : (
        <div className={styles.grid} data-columns={columns}>
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} size={resolvedCardSize} />
          ))}
        </div>
      )}
    </section>
  );
}
