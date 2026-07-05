import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-content animate-in">
        <h1 className="hero-title">Data Professional</h1>
        <p className="hero-subtitle">
          Product & GTM Analytics | Strategic Data Workflows
        </p>
        <p className="hero-description">
          I am a strategic Data Analyst dedicated to solving complex business problems. By combining rigorous SQL and BI foundations with advanced predictive workflows, I transform raw data into actionable Go-To-Market strategies, optimize product funnels, and drive sustainable growth.
        </p>
        <div className="hero-cta">
          <button className="primary-btn">View Flagship Project</button>
          <button>Explore Capabilities</button>
        </div>
      </div>
    </section>
  );
}
