---
title: "Adding a Retry Policy"
hide_title: true
sidebar_position: 7
hide_table_of_contents: true
pagination_next: null
image: /img/temporal-logo-twitter-card.png
---

import Link from '@docusaurus/Link';

<div className="temporal-tour-container">
  <div className="sdk-logo">
    <img src="/img/sdk-icons/sdk-java.svg" alt="Java" />
  </div>
  
  <div className="content-area">
    <div className="left-panel">
      <div className="tour-header">
        <h1>Adding a Retry Policy</h1>
        <div className="content-text">
          <p>Let’s go ahead and add a retry policy and timeout to our Workflow code. Remember, your Activity contains code that is prone to failure. By default, Temporal automatically retries failed Activities until it either succeeds or is canceled. You can also override the default retry policies like in the code sample.</p>
          <p>With the following configuration, your Activities will retry up to 100 times with an exponential backoff — waiting 2 seconds before the first retry, doubling the delay after each failure up to a 1-minute cap — and each attempt can run for at most 5 seconds.</p>
        </div>
      </div>
      
    <div className="tour-navigation">
        <Link className="button button--primary next-step" to="/see_temporal_in_action/typescript/adding-an-error">
          Next Step
        </Link>
      </div>
    </div>
    
    <div className="right-panel">
      <div className="demo-area">
        <div className="demo-header">
          <a href="https://github.com/temporalio/edu-get-started-flow/blob/7e22ba7d3277ba29e66415b9c61d42ac4f322111/typescript/src/workflows.ts" 
             className="demo-title-link" 
             target="_blank" 
             rel="noopener noreferrer">
            <span className="demo-title">Workflow Code</span>
            <img src="/img/icons/github.png" alt="GitHub" className="github-icon" />
          </a>
        </div>
        <div className="code-preview">
          <pre><code className="language-java">{`import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
const { withdrawMoney, depositMoney } = proxyActivities<typeof activities>({
 retry: {
   initialInterval: '2s', // duration before the first retry
   backoffCoefficient: 2, // multiplier used for subsequent retries
   maximumInterval: '1m', // maximum duration between retries
   maximumAttempts: 100, // maximum number of retry attempts
 },
 startToCloseTimeout: '5s', //maximum time allowed for a single attempt of an Activity to execute
});
export async function reimbursementWorkflow(userId: string, amount: number): Promise<string> {
  await withdrawMoney(amount);
  await depositMoney(amount);
  return \`reimbursement to \${userId} successfully complete\`;
}`}</code></pre>
        </div>
      </div>
    </div>
  </div>
  
  <div className="step-navigation">
    <div className="step-indicator">5 / 9</div>
  </div>
</div>

<style jsx>{`
  .temporal-tour-container {
    min-height: 100vh;
    background: radial-gradient(ellipse at top, #1e1b4b 0%, #0f0f23 70%);
    position: relative;
    color: white;
    overflow: hidden;
  }
  
  .temporal-tour-container::before {
    display: none;
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  
  .temporal-tour-container > * {
    position: relative;
    z-index: 2;
  }
  
  .sdk-logo {
    position: absolute;
    top: 2rem;
    right: 2rem;
    width: 48px;
    height: 48px;
    z-index: 10;
  }
  
  .sdk-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .content-area {
    display: flex;
    min-height: 100vh;
  }
  
  .left-panel {
    width: 40%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .right-panel {
    width: 60%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  
  .tour-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: white;
    letter-spacing: -0.025em;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .content-text {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.7;
    margin-bottom: 3rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .content-text p {
    margin-bottom: 1.5rem;
  }
  
  .content-text ul {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }
  
  .content-text li {
    margin-bottom: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .content-text strong {
    color: #8b5cf6;
    font-weight: 600;
  }
  
  .tour-navigation {
    margin-bottom: 6rem;
  }
  
  .next-step {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
    border: none !important;
    padding: 0.75rem 1.5rem !important;
    font-size: 1rem !important;
    font-weight: 600 !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
  }
  
  .next-step:hover {
    background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.6) !important;
  }
  
  .demo-area {
    max-width: none;
    width: 100%;
    margin: 0;
  }
  
  .demo-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px 12px 0 0;
  }
  
  .demo-title {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 500;
  }
  
  .demo-title-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: inherit;
    transition: opacity 0.2s ease;
  }
  
  .demo-title-link:hover {
    opacity: 0.9;
    text-decoration: none;
  }
  
  .github-icon {
    width: 16px;
    height: 16px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }
  
  .demo-title-link:hover .github-icon {
    opacity: 1;
  }
  
  .code-preview {
    padding: pre;
  }

  .codeblock {
    padding: 1rem;
  }
  
  .code-preview pre {
    padding: 1.5rem;
    margin: 0;
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #e2e8f0;
    background: none;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-x: auto;
  }
  
  .code-preview code {
    background: none;
    padding: 0;
    color: inherit;
  }
  

  .language-java .token.keyword {
    color: #c792ea;
    font-weight: 500;
  }
  
  .language-java .token.function {
    color: #82aaff;
  }
  
  .language-java .token.string {
    color: #c3e88d;
  }
  
  .language-java .token.comment {
    color: #546e7a;
    font-style: italic;
  }
  
  .language-java .token.operator {
    color: #89ddff;
  }
  
  .language-java .token.punctuation {
    color: #89ddff;
  }
  
  .language-java .token.property {
    color: #f07178;
  }
  
  .language-java .token.number {
    color: #f78c6c;
  }
  
  .language-java .token.parameter {
    color: #ffcb6b;
  }
  
  .step-navigation {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .step-nav-button {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .step-nav-button:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    text-decoration: none;
  }
  
  .step-nav-button.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .step-indicator {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    font-family: 'Courier New', monospace;
    font-weight: 500;
  }
  
  @media (max-width: 1024px) {
    .content-area {
      flex-direction: column;
    }
    
    .left-panel, .right-panel {
      width: 100%;
    }
    
    .left-panel {
      padding: 2rem 1rem;
    }
    
    .right-panel {
      width: 70%;
    }
    
    .sdk-logo {
      top: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
    }
    
    .tour-header h1 {
      font-size: 2rem;
    }
    
    .step-navigation {
      position: static;
      justify-content: center;
      padding: 1rem;
      margin-top: 2rem;
    }
  }
`}</style>
