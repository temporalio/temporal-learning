import React, { useState } from "react";
import styles from "./Quiz.module.css";

export default function Quiz({ questions }) {
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState({});
  const [reasonOpen, setReasonOpen] = useState({});
  const total = questions.length;
  const q = questions[index];
  const qAttempts = attempts[index] || [];
  const correctIdx = q.correctIndex;
  const solved = qAttempts.includes(correctIdx);
  const wasWrong = qAttempts.some((a) => a !== correctIdx);
  const userOpened = !!reasonOpen[index];
  const showReason = solved && (wasWrong || userOpened);
  const showReasonToggle = solved && !wasWrong;

  function toggleReason() {
    setReasonOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  const goPrev = () => setIndex((i) => (i === 0 ? total - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === total - 1 ? 0 : i + 1));

  function pick(optIdx) {
    if (solved) return;
    if (qAttempts.includes(optIdx)) return;
    setAttempts((prev) => ({
      ...prev,
      [index]: [...(prev[index] || []), optIdx],
    }));
  }

  function statusFor(optIdx) {
    if (!qAttempts.includes(optIdx)) return null;
    if (optIdx === correctIdx) return "correct";
    return "wrong";
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.slide} key={index}>
          <div className={styles.header}>
            <span className={styles.step}>
              Question {index + 1} of {total}
              {q.source ? (
                <span className={styles.source}> · {q.source}</span>
              ) : null}
            </span>
            {solved && !wasWrong && (
              <span className={styles.badgeRight}>Correct</span>
            )}
            {solved && wasWrong && (
              <span className={styles.badgeRetry}>Got it</span>
            )}
          </div>
          <h3 className={styles.prompt}>{q.prompt}</h3>
          <ul className={styles.options}>
            {q.options.map((opt, i) => {
              const status = statusFor(i);
              const cls =
                status === "correct"
                  ? styles.optCorrect
                  : status === "wrong"
                  ? styles.optWrong
                  : styles.opt;
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={cls}
                    onClick={() => pick(i)}
                    disabled={solved || qAttempts.includes(i)}
                    aria-pressed={status === "correct"}
                  >
                    <span className={styles.letter}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={styles.optText}>{opt}</span>
                    {status === "correct" && (
                      <span aria-hidden="true" className={styles.check}>
                        ✓
                      </span>
                    )}
                    {status === "wrong" && (
                      <span aria-hidden="true" className={styles.x}>
                        ✕
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {!solved && wasWrong && (
            <div className={styles.tryAgain}>
              Not quite - try another answer.
            </div>
          )}
          {showReasonToggle && (
            <button
              type="button"
              className={styles.reasonToggle}
              onClick={toggleReason}
              aria-expanded={userOpened}
            >
              {userOpened ? "Hide reasoning" : "See reasoning"}
              <span aria-hidden="true" className={styles.reasonToggleArrow}>
                {userOpened ? "▲" : "▼"}
              </span>
            </button>
          )}
          {showReason && (
            <div className={styles.reason}>
              <span className={styles.reasonLabel}>Why</span>
              <p>{q.reason}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={goPrev}
          aria-label="Previous question"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={goNext}
          aria-label="Next question"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className={styles.dots} role="tablist" aria-label="Quiz questions">
        {Array.from({ length: total }).map((_, i) => {
          const a = attempts[i] || [];
          const isSolved = a.includes(questions[i].correctIndex);
          let cls = styles.dot;
          if (i === index) cls = styles.dotActive;
          else if (isSolved) cls = styles.dotSolved;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Question ${i + 1} of ${total}${
                isSolved ? " (answered)" : ""
              }`}
              className={cls}
              onClick={() => setIndex(i)}
            />
          );
        })}
      </div>
    </div>
  );
}
