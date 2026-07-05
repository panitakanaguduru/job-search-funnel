import React, { useState } from 'react';
import './Experience.css';

const experiences = [
  {
    id: 'superworld',
    company: 'SuperWorld',
    role: 'Product & Business Data Analyst | GTM Analytics',
    period: 'Recent',
    metrics: ['Funnel Optimization', 'Conversion Growth', 'Automated Workflows'],
    points: [
      'Conducted end-to-end funnel analysis (Acquisition → Activation → Conversion) to pinpoint critical drop-off stages.',
      'Evaluated referral system performance and organic growth health, identifying UI friction points.',
      'Built interactive SQL dashboards to track product KPIs and GTM metrics for executive stakeholders.',
      'Designed and deployed LLM-based workflows for complex data validation and automated reporting, drastically reducing manual data cleaning time.'
    ]
  },
  {
    id: 'ucf',
    company: 'University of Central Florida',
    role: 'Graduate Data Analyst & Business Analyst',
    period: 'Previous',
    metrics: ['Operational Analytics', 'Data Reconciliation', 'Financial Forecasting'],
    points: [
      'Led financial and operational analytics initiatives to optimize university resource allocation.',
      'Performed rigorous data validation and reconciliation for financial reporting across thousands of records.',
      'Developed reporting dashboards to track key operational metrics and predict resource bottlenecks.',
      'Optimized database performance to reduce reporting latency, ensuring real-time data availability.'
    ]
  },
  {
    id: 'soti',
    company: 'SOTI',
    role: 'Data Analyst | Associate Data Engineer',
    period: 'Early Career',
    metrics: ['SQL Pipelines', 'BI Dashboards', 'Data Quality'],
    points: [
      'Built and maintained robust SQL pipelines for enterprise-scale reporting.',
      'Automated recurring reporting tasks, saving significant manual effort across the data team.',
      'Designed executive-level Power BI and Tableau dashboards to track global sales and operational metrics.',
      'Ensured high data quality through automated reconciliation checks and anomaly detection scripts.'
    ]
  }
];

export default function Experience() {
  const [activeExp, setActiveExp] = useState(experiences[0]);

  return (
    <section id="experience" className="experience-section">
      <h2 className="section-title">Professional Journey</h2>
      
      <div className="experience-console glass-card">
        <div className="exp-sidebar">
          {experiences.map((exp) => (
            <button 
              key={exp.id} 
              className={`exp-tab ${activeExp.id === exp.id ? 'active' : ''}`}
              onClick={() => setActiveExp(exp)}
            >
              <span className="tab-company">{exp.company}</span>
              <span className="tab-period">{exp.period}</span>
            </button>
          ))}
        </div>
        
        <div className="exp-content">
          <div className="exp-header-area">
            <h3 className="exp-role">{activeExp.role}</h3>
            <h4 className="exp-company-large">@ {activeExp.company}</h4>
          </div>
          
          <div className="exp-metrics">
            {activeExp.metrics.map(metric => (
              <span key={metric} className="metric-badge">{metric}</span>
            ))}
          </div>

          <ul className="exp-points">
            {activeExp.points.map((pt, i) => (
              <li key={i} className="animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
