import React from 'react';
import './Flagship.css';

export default function Flagship() {
  return (
    <section id="flagship" className="flagship-section glass-card">
      <div className="flagship-badge">Flagship Project</div>
      <h2 className="flagship-title">End-to-End GTM Analytics: Optimizing Campaign Conversion</h2>
      
      <div className="flagship-grid">
        <div className="flagship-content">
          <div className="problem-statement">
            <h3>The Business Problem</h3>
            <p>
              Marketing campaigns were successfully driving user acquisition, but there was a severe drop-off before 
              "Activation" and "Conversion". Additionally, unstructured referral feedback was masking why organic growth was stalling.
            </p>
          </div>
          
          <div className="approach-list">
            <div className="approach-item">
              <div className="icon">📊</div>
              <div>
                <h4>1. Funnel Diagnostics (SQL & BI)</h4>
                <p>Built advanced SQL CTEs to map the user journey. Created interactive Power BI dashboards to visualize drop-off rates by cohort.</p>
              </div>
            </div>
            
            <div className="approach-item">
              <div className="icon">🤖</div>
              <div>
                <h4>2. Predictive Targeting (ML)</h4>
                <p>Developed a classification model to predict which users have the highest probability of converting, enabling targeted retargeting.</p>
              </div>
            </div>
            
            <div className="approach-item">
              <div className="icon">🧠</div>
              <div>
                <h4>3. Data Governance (LLMs)</h4>
                <p>Implemented a GPT-based data cleaning workflow to standardize unstructured referral text and categorize friction points.</p>
              </div>
            </div>
          </div>
          
          <div className="impact-box">
            <h4>💡 Business Impact</h4>
            <p>Identified a 40% drop-off at activation. Enabled targeted promotions over blanket discounting, and automated manual text categorization workflows.</p>
          </div>
        </div>
        
        <div className="flagship-visual">
          <div className="funnel-container">
            <div className="funnel-stage s1">
              <span>Acquisition</span>
              <span className="count">100%</span>
            </div>
            <div className="funnel-stage s2">
              <span>Registration</span>
              <span className="count">85%</span>
            </div>
            <div className="funnel-stage s3 drop-off">
              <span>Activation</span>
              <span className="count">45%</span>
              <div className="alert-badge">Critical Drop-off</div>
            </div>
            <div className="funnel-stage s4">
              <span>Conversion</span>
              <span className="count">15%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
