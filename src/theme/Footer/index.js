import React, {useEffect, useState} from "react";
import {createPortal} from "react-dom";
import Footer from "@theme-original/Footer";
import {FeedbackButton} from "pushfeedback-react";
import {defineCustomElements} from "pushfeedback/loader";
import "pushfeedback/dist/pushfeedback/pushfeedback.css";

const openConsentBanner = () => {
  window.dispatchEvent(new Event("temporal:consent-banner-open"));
};

function FeedbackWidget() {
  const projectId = "1kn2tyqqpk";

  useEffect(() => {
    if (typeof window !== "undefined") {
      defineCustomElements(window);
    }
  }, []);

  return (
    <div className="feedback-widget">
      <FeedbackButton
        project={projectId}
        button-position="center-right"
        button-style="dark"
        modal-position="sidebar-right"
        modal-title="Share your feedback"
        rating-placeholder="Was this page helpful?"
      >
        Feedback
      </FeedbackButton>
    </div>
  );
}

export default function FooterWrapper(props) {
  const [footerCopyright, setFooterCopyright] = useState(null);

  useEffect(() => {
    setFooterCopyright(document.querySelector(".footer__copyright"));
  }, []);

  return (
    <>
      <Footer {...props} />
      {footerCopyright &&
        createPortal(
          <button
            type="button"
            className="footer__link-item footer__privacy-choices"
            onClick={openConsentBanner}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="14"
              viewBox="0 0 30 14"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M7.4 12.8h6.8l3.1-11.6H7.4C4.2 1.2 1.6 3.8 1.6 7s2.6 5.8 5.8 5.8Z"
                fill="#fff"
              />
              <path
                d="M22.6 0H7.4a7 7 0 1 0 0 14h15.2a7 7 0 1 0 0-14ZM1.6 7c0-3.2 2.6-5.8 5.8-5.8h9.9l-3.1 11.6H7.4A5.8 5.8 0 0 1 1.6 7Z"
                fill="#0066ff"
              />
              <path
                d="M24.6 4c.2.2.2.6 0 .8L22.5 7l2.2 2.2c.2.2.2.6 0 .8-.2.2-.6.2-.8 0L21.7 7.8 19.5 10c-.2.2-.6.2-.8 0-.2-.2-.2-.6 0-.8L20.8 7l-2.2-2.2c-.2-.2-.2-.6 0-.8.2-.2.6-.2.8 0l2.2 2.2L23.8 4c.2-.2.6-.2.8 0Z"
                fill="#fff"
              />
              <path
                d="M12.7 4.1c.2.2.3.6.1.8L8.6 9.8c-.1.1-.2.2-.3.2-.2.1-.5.1-.7-.1L5.4 7.7c-.2-.2-.2-.6 0-.8.2-.2.6-.2.8 0L8 8.6l3.8-4.5c.2-.2.6-.2.9 0Z"
                fill="#0066ff"
              />
            </svg>
            Your Privacy Choices
          </button>,
          footerCopyright
        )}
      <FeedbackWidget />
    </>
  );
}
