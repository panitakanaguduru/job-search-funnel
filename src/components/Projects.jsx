import React, { useState } from 'react';
import './Projects.css';

const projectsData = [
  {
    id: 'gtm',
    title: 'GTM Funnel & Referral Analysis',
    role: 'Product / GTM Analyst',
    tagline: 'Optimizing campaign conversion and referral engagement via SQL and ML.',
    tags: ['SQL', 'Power BI', 'ML', 'LLM'],
    isFlagship: true,
    problem: 'Marketing campaigns drove acquisition, but severe drop-off occurred before Activation and Conversion. Unstructured referral data masked why organic growth stalled.',
    impact: 'Identified a 40% drop-off at activation. Enabled targeted ML promotions over blanket discounting, and automated manual text categorization.',
    approach: 'Used SQL CTEs to map the user journey. Built an ML classification model to predict conversion likelihood. Implemented GPT cleaning for referral text.',
    techniques: 'Funnel extraction, Logistic Regression (Conversion Prediction), LLM imputation (Text noise).',
    metrics: 'Conversion rate, Activation drop-off %, Referral completion rate.',
    results: 'Streamlined onboarding UI strategy, 3x conversion likelihood for Day-1 actors, auto-apply referral links recommended.',
    insights: 'Blanket discounts are inefficient; targeted ML nudges at the activation stage yield the highest ROI.',
    tools: ['SQL', 'Python', 'Scikit-Learn', 'Power BI', 'OpenAI API']
  },
  {
    id: 'data-cleaning',
    title: 'LLM-Based Data Cleaning Workflow',
    role: 'Data Analyst',
    tagline: 'Automating data governance and reducing cleaning time.',
    tags: ['Python', 'LLM', 'Data Quality'],
    problem: 'Dirty data delays reporting and causes inaccurate KPIs.',
    impact: 'Automated complex text/categorical corrections, ensuring reliable downstream BI reporting.',
    approach: 'Simulated data corruption and benchmarked traditional imputation against GPT-based cleaning.',
    techniques: 'Mean/Mode imputation, IQR/Z-score capping, Logistic Detect, 5-fold CV.',
    metrics: 'MSE (Mean Squared Error), Cleaning Time.',
    results: 'LLM-based cleaning outperformed traditional methods on unstructured text noise.',
    insights: 'LLMs are highly effective for categorical and text imputation, reducing manual data engineering overhead.',
    tools: ['Python', 'Pandas', 'GPT-4']
  },
  {
    id: 'fraud',
    title: 'Credit Card Fraud Detection',
    role: 'Risk Analyst',
    tagline: 'Financial risk & anomaly detection modeling.',
    tags: ['Python', 'SQL', 'Classification'],
    problem: 'Fraudulent transactions cause financial loss and degrade trust.',
    impact: 'Developed a predictive framework to reduce fraud loss while ensuring valid customers are not blocked.',
    approach: 'Analyzed highly imbalanced transaction data using Python and SQL to build classification models.',
    techniques: 'Anomaly Detection, Classification (Random Forest), SMOTE for imbalance.',
    metrics: 'Precision, Recall, F1-Score.',
    results: 'High recall model successfully flagged 95% of anomalous transactions.',
    insights: 'In fraud detection, minimizing false negatives (missed fraud) is prioritized over false positives.',
    tools: ['Python', 'Scikit-Learn', 'SQL']
  },
  {
    id: 'healthcare',
    title: 'Healthcare Operations Analysis',
    role: 'Operational Analyst',
    tagline: 'Optimizing scheduling & predicting no-shows.',
    tags: ['Power BI', 'SQL', 'Analytics'],
    problem: 'Patient no-shows cost clinics money and waste resources.',
    impact: 'Delivered actionable insights to improve clinic utilization and revenue forecasting.',
    approach: 'Conducted behavioral and operational analysis to identify key drivers of missed appointments.',
    techniques: 'Cohort analysis, Time-series forecasting.',
    metrics: 'No-show rate, Clinic utilization %.',
    results: 'Identified optimal reminder windows and high-risk demographic factors.',
    insights: 'Targeted SMS reminders 24 hours prior reduce no-shows by 15%.',
    tools: ['SQL', 'Power BI']
  },
  {
    id: 'nlp-resume',
    title: 'HR Process Automation (NLP)',
    role: 'Data Analyst',
    tagline: 'NLP-driven candidate screening for Talent Ops.',
    tags: ['NLP', 'Python', 'Automation'],
    problem: 'Manual resume screening is a bottleneck in recruitment.',
    impact: 'Demonstrated how AI tools reduce operational overhead and improve shortlisting speed.',
    approach: 'Built an NLP text classification system to parse, rank, and match applicant profiles.',
    techniques: 'TF-IDF, Text Classification, Cosine Similarity.',
    metrics: 'Screening time per candidate, Match accuracy.',
    results: 'Automated the initial parsing of 1000+ resumes.',
    insights: 'NLP can act as a highly effective first-pass filter for high-volume roles.',
    tools: ['Python', 'NLTK', 'Spacy']
  },
  {
    id: 'cnn',
    title: 'Image Processing Pipeline',
    role: 'Data Analyst',
    tagline: 'Unstructured data pipeline optimization.',
    tags: ['CNN', 'Python'],
    problem: 'Need for extracting structured features from raw image data.',
    impact: 'Proved capability to handle complex, unstructured data engineering tasks.',
    approach: 'Built a Convolutional Neural Network to classify images.',
    techniques: 'Deep Learning, Image Augmentation.',
    metrics: 'Accuracy, Loss.',
    results: 'Successfully classified images into distinct categories.',
    insights: 'Deep learning is a powerful supporting tool for unstructured data.',
    tools: ['Python', 'TensorFlow/Keras']
  }
];

export default function Projects() {
  const [activeProject, setActiveProject] = useState(null);
  const [modalTab, setModalTab] = useState('overview'); // overview, technical, impact

  const openModal = (project) => {
    setActiveProject(project);
    setModalTab('overview');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActiveProject(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <section id="projects" className="projects-section">
      <h2 className="section-title">Case Studies & Impact</h2>
      <p style={{textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem'}}>Click any card to explore the interactive case study.</p>
      
      <div className="projects-grid">
        {projectsData.map(proj => (
          <div 
            key={proj.id} 
            className={`project-card glass-card ${proj.isFlagship ? 'flagship-card' : ''}`}
            onClick={() => openModal(proj)}
          >
            {proj.isFlagship && <div className="flagship-badge">⭐ Flagship Project</div>}
            <div className="project-role">{proj.role}</div>
            <h3 className="project-title">{proj.title}</h3>
            <p className="project-desc">{proj.tagline}</p>
            <div className="project-tags">
              {proj.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <button className="view-case-btn">View Case Study →</button>
            <div className="card-hover-glow"></div>
          </div>
        ))}
      </div>

      {activeProject && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>×</button>
            
            <div className="modal-header">
              <span className="modal-role">{activeProject.role}</span>
              <h2>{activeProject.title}</h2>
              <div className="modal-tags">
                {activeProject.tools.map(t => <span key={t} className="tool-tag">{t}</span>)}
              </div>
            </div>

            <div className="modal-tabs">
              <button 
                className={`modal-tab-btn ${modalTab === 'overview' ? 'active' : ''}`}
                onClick={() => setModalTab('overview')}
              >Overview</button>
              <button 
                className={`modal-tab-btn ${modalTab === 'technical' ? 'active' : ''}`}
                onClick={() => setModalTab('technical')}
              >Technical Approach</button>
              <button 
                className={`modal-tab-btn ${modalTab === 'impact' ? 'active' : ''}`}
                onClick={() => setModalTab('impact')}
              >Business Impact</button>
            </div>

            <div className="modal-body">
              {modalTab === 'overview' && (
                <div className="tab-pane animate-in">
                  <h3>The Business Problem</h3>
                  <p>{activeProject.problem}</p>
                  
                  <div className="insight-box" style={{marginTop: '2rem'}}>
                    <h4>🧠 Strategic Insight</h4>
                    <p>{activeProject.insights}</p>
                  </div>
                  
                  {/* Special Flagship Visual on Overview */}
                  {activeProject.isFlagship && (
                    <div className="flagship-visual-container">
                      <h3 style={{textAlign: 'center', marginBottom: '1rem'}}>Funnel Visualization</h3>
                      <div className="funnel-container">
                        <div className="funnel-stage s1"><span>Acquisition</span><span className="count">100%</span></div>
                        <div className="funnel-stage s2"><span>Registration</span><span className="count">85%</span></div>
                        <div className="funnel-stage s3 drop-off">
                          <span>Activation</span><span className="count">45%</span>
                          <div className="alert-badge">Critical Drop-off</div>
                        </div>
                        <div className="funnel-stage s4"><span>Conversion</span><span className="count">15%</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'technical' && (
                <div className="tab-pane animate-in">
                  <h3>Methodology & Approach</h3>
                  <p>{activeProject.approach}</p>
                  <div className="tech-box">
                    <h4>Techniques Applied:</h4>
                    <p>{activeProject.techniques}</p>
                  </div>
                </div>
              )}

              {modalTab === 'impact' && (
                <div className="tab-pane animate-in">
                  <div className="impact-box">
                    <h4>💡 Business Value Delivered</h4>
                    <p>{activeProject.impact}</p>
                  </div>
                  <h3>Key Results</h3>
                  <p>{activeProject.results}</p>
                  <p><strong>Metrics Tracked:</strong> <span style={{color: 'var(--accent-cyan)'}}>{activeProject.metrics}</span></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
