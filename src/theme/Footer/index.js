import React, { useEffect } from 'react';
import Footer from '@theme-original/Footer';
import { FeedbackButton } from 'pushfeedback-react';
import { defineCustomElements } from 'pushfeedback/loader';
import 'pushfeedback/dist/pushfeedback/pushfeedback.css';

function FeedbackWidget() {
    const projectId = '1kn2tyqqpk';

    useEffect(() => {
        if (typeof window !== 'undefined') {
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
    return (
        <>
            <Footer {...props} />
            <FeedbackWidget />
        </>
    );
}
