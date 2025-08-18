---
title: "See Temporal in Action"
hide_title: true
sidebar_position: 2
hide_table_of_contents: true
pagination_next: getting_started/index
image: /img/temporal-logo-twitter-card.png
---

import Link from '@docusaurus/Link';

<div className="temporal-tour-container">
  <div className="tour-header">
    <h1>Welcome to the Tour</h1>
    <p>Select an SDK to start exploring Temporal:</p>
  </div>
  
  <div className="sdk-selector">
    <div className="sdk-grid">
      <Link to="/see_temporal_in_action/go/the-challenge" className="sdk-button go" title="Go">
        <img src="/img/sdk-icons/sdk-go.svg" alt="Go" />
      </Link>
      <Link to="/see_temporal_in_action/dotnet/the-challenge" className="sdk-button dotnet" title=".NET">
        <img src="/img/sdk-icons/sdk-dotnet.svg" alt=".NET" />
      </Link>
      <Link to="/see_temporal_in_action/java/the-challenge" className="sdk-button java" title="Java">
        <img src="/img/sdk-icons/sdk-java.svg" alt="Java" />
      </Link>
      <Link to="/see_temporal_in_action/php/the-challenge" className="sdk-button php" title="PHP">
        <img src="/img/sdk-icons/sdk-php.svg" alt="PHP" />
      </Link>
      <Link to="/see_temporal_in_action/python/the-challenge" className="sdk-button python" title="Python">
        <img src="/img/sdk-icons/sdk-python.svg" alt="Python" />
      </Link>
      <Link to="/see_temporal_in_action/typescript/the-challenge" className="sdk-button typescript" title="TypeScript">
        <img src="/img/sdk-icons/sdk-typescript.svg" alt="TypeScript" />
      </Link>
    </div>
  </div>
  
  
  <div className="step-indicator">
    1 / 9
  </div>
</div>

<style jsx>{`
  .temporal-tour-container {
    min-height: 100vh;
    background: radial-gradient(ellipse at top, #1e1b4b 0%, #0f0f23 70%);
    position: relative;
    color: white;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    overflow: hidden;
  }
  
  .temporal-tour-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(2px 2px at 20% 10%, white, transparent),
      radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 50% 60%, white, transparent),
      radial-gradient(2px 2px at 80% 10%, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 10% 90%, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.8), transparent),
      radial-gradient(2px 2px at 30% 80%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 60% 90%, white, transparent);
    background-size: 
      200% 200%, 300% 300%, 100% 100%, 150% 150%, 
      250% 250%, 180% 180%, 220% 220%, 160% 160%, 190% 190%;
    animation: twinkle 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 1;
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  
  .temporal-tour-container > * {
    position: relative;
    z-index: 2;
  }
  
  .tour-header {
    margin-top: 2rem;
  }
  
  .tour-header h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: white;
    letter-spacing: -0.025em;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .tour-header p {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 3rem;
    font-weight: 400;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .sdk-selector {
    margin-bottom: 3rem;
  }
  
  .sdk-grid {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .sdk-button {
    width: 60px;
    height: 60px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-decoration: none;
  }
  
  .sdk-button:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  }
  
  .sdk-button.selected {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  }
  
  .sdk-button img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .sdk-button.go { background-color: rgba(0, 173, 216, 0.1); }
  .sdk-button.java { background-color: rgba(237, 139, 0, 0.1); }
  .sdk-button.dotnet { background-color: rgba(81, 43, 212, 0.1); }
  .sdk-button.php { background-color: rgba(119, 123, 180, 0.1); }
  .sdk-button.python { background-color: rgba(55, 118, 171, 0.1); }
  .sdk-button.typescript { background-color: rgba(0, 122, 204, 0.1); }
  
  .tour-navigation {
    margin-bottom: 2rem;
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
  
  .mascot-container {
    position: absolute;
    bottom: 120px;
    right: 100px;
  }
  
  .temporal-mascot {
    width: 200px;
    height: auto;
  }
  
  .step-indicator {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    font-family: 'Courier New', monospace;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .temporal-tour-container {
      padding: 1rem;
    }
    
    .tour-header h1 {
      font-size: 2.5rem;
    }
    
    .sdk-grid {
      justify-content: center;
    }
    
    .mascot-container {
      position: static;
      text-align: center;
      margin-top: 2rem;
    }
    
    .temporal-mascot {
      width: 150px;
    }
    
    .step-indicator {
      position: static;
      text-align: center;
      margin-top: 2rem;
    }
  }
`}</style>

