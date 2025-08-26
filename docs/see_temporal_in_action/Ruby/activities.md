---
title: "Introduction to Activities"
hide_title: true
sidebar_position: 3
hide_table_of_contents: true
pagination_next: null
image: /img/temporal-logo-twitter-card.png
---

import Link from '@docusaurus/Link';

<div className="temporal-tour-container">
  <div className="sdk-logo">
    <img src="/img/sdk-icons/sdk-ruby.svg" alt="Ruby" />
  </div>
  
  <div className="content-area">
    <div className="left-panel">
      <div className="tour-header">
        <h1>Introduction to Activities</h1>
        <div className="content-text">
          <p>An Activity is a function that executes a single, well-defined action (either short or long running), which handles operations that can fail. Here are some examples:</p>
          <ul>
            <li>Sending e-mails</li>
            <li>API calls</li>
            <li>Database writes</li>
            <li>Network requests</li>
          </ul>
          <p>An Activity involves code that is prone to failure because if it fails (let’s say the API is down), Temporal automatically retries it over and over until it succeeds or until your customized retry or timeout configuration is hit.</p>
          <p><strong>Here are two Activities: one for withdrawing money and one for depositing money.</strong></p>
        </div>
      </div>
      
      <div className="tour-navigation">
        <Link className="button button--primary next-step" to="/see_temporal_in_action/ruby/workflows">
          Next Step
        </Link>
      </div>
    </div>
    
    <div className="right-panel">
      <div className="demo-area">
        <div className="demo-header">
          <a href="https://github.com/temporalio/edu-get-started-flow/blob/main/ruby/lib/activities.rb" 
             className="demo-title-link" 
             target="_blank" 
             rel="noopener noreferrer">
            <span className="demo-title">Activity Code</span>
            <img src="/img/icons/github.png" alt="GitHub" className="github-icon" />
          </a>
        </div>
        <div className="code-preview">
          <pre className="codeblock"><code className="language-ruby">{`require 'temporalio/activity'\n
class WithdrawMoneyActivity < Temporalio::Activity::Definition
  def execute(amount)
    # This would usually contain code that is prone to failure, 
    # like an API call, but it is a print statement here for simplicity.
    puts "Successfully withdrawn $#{amount}"
    true
  end
end\n
class DepositMoneyActivity < Temporalio::Activity::Definition
  def execute(amount)
    puts "Successfully deposited $#{amount}"
    true
  end
end`
}</code></pre>
        </div>
        <div className="code-detail-link">
          See our code in more detail <a href="https://github.com/temporalio/edu-get-started-flow/blob/main/ruby/README.md" target="_blank" rel="noopener noreferrer">here</a>.
        </div>
      </div>
    </div>
  </div>
  
  <div className="step-navigation">
    <div className="step-indicator">3 / 9</div>
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
  
  .code-detail-link {
    padding: 0 1.5rem 1.5rem 1.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    text-align: left;
  }
  
  .code-detail-link a {
    color: #8b5cf6;
    text-decoration: none;
    transition: opacity 0.2s ease;
  }
  
  .code-detail-link a:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .codeblock {
    padding: 1rem;
  }
  
  .code-preview pre {
    padding: 1.5rem 1.5rem 0.5rem 1.5rem;
    margin: 0;
    font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    color: #e2e8f0;
    background: none;
    white-space: pre;
    scrollbar-width: thin;
    scrollbar-color: rgba(139, 92, 246, 0.5) rgba(255, 255, 255, 0.1);
    overflow-x: auto;
  }

  /* Always show scrollbar for code blocks */
  .code-preview pre::-webkit-scrollbar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
  }

  .code-preview pre::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  .code-preview pre::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 4px;
  }

  .code-preview pre::-webkit-scrollbar-thumb:hover {
    background: rgba(139, 92, 246, 0.7);
  }

  
  .code-preview code {
    background: none;
    padding: 0;
    color: inherit;
  }
  
  /* Ruby Syntax Highlighting */
  .language-ruby .token.keyword {
    color: #c792ea;
    font-weight: 500;
  }
  
  .language-ruby .token.function {
    color: #82aaff;
  }
  
  .language-ruby .token.string {
    color: #c3e88d;
  }
  
  .language-ruby .token.comment {
    color: #546e7a;
    font-style: italic;
  }
  
  .language-ruby .token.operator {
    color: #89ddff;
  }
  
  .language-ruby .token.punctuation {
    color: #89ddff;
  }
  
  .language-ruby .token.property {
    color: #f07178;
  }
  
  .language-ruby .token.number {
    color: #f78c6c;
  }
  
  .language-ruby .token.parameter {
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
`}</style>

