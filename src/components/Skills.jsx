import React, { useState } from 'react';
import './Skills.css';

const skillHierarchy = [
  {
    category: 'Data Analytics',
    icon: '📊',
    skills: [
      { name: 'SQL', subskills: ['Joins', 'CTEs', 'Window Functions', 'Aggregations'] },
      { name: 'Python', subskills: ['Pandas', 'NumPy', 'Data Cleaning', 'ETL Scripting'] }
    ]
  },
  {
    category: 'Business Analytics',
    icon: '📈',
    skills: [
      { name: 'KPI Reporting', subskills: ['Dashboard Design', 'Metric Definitions'] },
      { name: 'Financial Analytics', subskills: ['Variance Analysis', 'Resource Allocation'] },
      { name: 'BI Tools', subskills: ['Power BI', 'Tableau'] }
    ]
  },
  {
    category: 'Product Analytics',
    icon: '📱',
    skills: [
      { name: 'Funnel Analysis', subskills: ['Drop-off Identification', 'User Journey Mapping'] },
      { name: 'Conversion Optimization', subskills: ['A/B Testing Analysis', 'Cohort Tracking'] }
    ]
  },
  {
    category: 'GTM Analytics',
    icon: '🚀',
    skills: [
      { name: 'Campaign Analysis', subskills: ['Acquisition Metrics', 'ROI Tracking'] },
      { name: 'Growth Loops', subskills: ['Referral System Evaluation', 'Viral Coefficient'] }
    ]
  },
  {
    category: 'Risk Analytics',
    icon: '🛡️',
    skills: [
      { name: 'Fraud Detection', subskills: ['Imbalanced Data Handling', 'Anomaly Detection'] },
      { name: 'Predictive Modeling', subskills: ['Classification Algorithms', 'Risk Scoring'] }
    ]
  },
  {
    category: 'Data Governance',
    icon: '🔐',
    skills: [
      { name: 'Data Quality', subskills: ['Automated Validation', 'Missing Value Imputation'] },
      { name: 'Reconciliation', subskills: ['Pipeline Monitoring', 'LLM Cleaning Workflows'] }
    ]
  }
];

export default function Skills() {
  const [activeCat, setActiveCat] = useState(0);
  const currentCategory = skillHierarchy[activeCat];

  return (
    <section id="skills" className="skills-section">
      <h2 className="section-title glow-text">Technical Core</h2>
      <p className="skills-subtitle">Select a domain node to explore your skill set.</p>

      <div className="hex-cluster-container">
        {/* Hexagon Row */}
        <div className="hex-row">
          {skillHierarchy.map((cat, idx) => (
            <div
              key={idx}
              className={`hex-cell ${activeCat === idx ? 'active-hex' : ''}`}
              onClick={() => setActiveCat(idx)}
            >
              <div className="hex-inner">
                <span className="hex-icon">{cat.icon}</span>
                <span className="hex-label">{cat.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Data Panel */}
        <div className="hex-data-panel glass-card animate-panel" key={activeCat}>
          <div className="panel-header">
            <h3>{currentCategory.icon} {currentCategory.category} Node Active</h3>
            <div className="pulse-dot"></div>
          </div>

          <div className="panel-skills-grid">
            {currentCategory.skills.map((skill, sIdx) => (
              <div key={sIdx} className="skill-data-block">
                <h4 className="neon-skill">{skill.name}</h4>
                <div className="subskill-tags">
                  {skill.subskills.map((sub, subIdx) => (
                    <span key={subIdx} className="sub-tag">
                      <span className="bracket">[</span> {sub} <span className="bracket">]</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
