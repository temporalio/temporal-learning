---
title: "Observing Retries"
hide_title: true
sidebar_position: 9
hide_table_of_contents: true
pagination_next: null
image: /img/temporal-logo-twitter-card.png
---

import Link from '@docusaurus/Link';

<div className="temporal-tour-container">
  <div className="sdk-logo">
    <img src="/img/sdk-icons/sdk-typescript.svg" alt="TypeScript" />
  </div>
  
  <div className="content-area">
    <div className="left-panel">
      <div className="tour-header">
        <h1>Observing Retries</h1>
        <div className="content-text">
          <p>Let’s run the code now and see what happens on the Web UI. You can see how to do this by following the <Link href="https://docs.temporal.io/develop/typescript/set-up-your-local-typescript" target="_blank" rel="noopener noreferrer" className="quickstart-link">Quickstart guide</Link>.</p>
          <p>As you can see, the <strong>withdrawMoney</strong> Activity is retrying over and over until it succeeds or hits our configured 100 attempts.</p>
        </div>
      </div>
      
      <div className="tour-navigation">
        <Link className="button button--primary next-step" to="/see_temporal_in_action/typescript/debugging-our-code">
          Next Step
        </Link>
      </div>
    </div>
    
    <div className="right-panel">
      <div className="demo-area">
        <div className="demo-header">
          <span className="demo-title">Temporal Web UI - Demonstrating Retries</span>
        </div>
        <div className="image-preview">
          <img 
            src="/see_temporal_in_action/Typescript/images/retries-gif.gif" 
            alt="Activity Retries in Temporal Web UI"
            onClick={(e) => {
              const img = e.target;
              const w = window.open('', '_blank');
              w.document.write(`
                <html>
                  <head>
                    <title>Activity Retries in Temporal Web UI</title>
                    <style>
                      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
                      img { max-width: 100%; max-height: 100vh; }
                    </style>
                  </head>
                  <body>
                    <img src="${img.src}" alt="${img.alt}" />
                  </body>
                </html>
              `);
            }}
            style={{cursor: 'pointer'}}
          />
        </div>
        <div className="image-detail-link">
          Click gif to enlarge
        </div>
      </div>
    </div>
  </div>
  
  <div className="step-navigation">
    <div className="step-indicator">7 / 9</div>
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
  
  .image-preview {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 0 0 12px 12px;
  }
  
  .image-preview img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .image-preview a:hover img {
    transform: scale(1.02);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  }
  
  .image-detail-link {
    padding: 0.5rem 1.5rem 1.5rem 1.5rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    text-align: left;
  }
  
  .quickstart-link {
    color: #8b5cf6;
    text-decoration: underline;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }
  
  .quickstart-link:hover {
    color: #7c3aed;
    opacity: 0.9;
  }
  

  .language-typescript .token.keyword {
    color: #c792ea;
    font-weight: 500;
  }
  
  .language-typescript .token.function {
    color: #82aaff;
  }
  
  .language-typescript .token.string {
    color: #c3e88d;
  }
  
  .language-typescript .token.comment {
    color: #546e7a;
    font-style: italic;
  }
  
  .language-typescript .token.operator {
    color: #89ddff;
  }
  
  .language-typescript .token.punctuation {
    color: #89ddff;
  }
  
  .language-typescript .token.property {
    color: #f07178;
  }
  
  .language-typescript .token.number {
    color: #f78c6c;
  }
  
  .language-typescript .token.parameter {
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


