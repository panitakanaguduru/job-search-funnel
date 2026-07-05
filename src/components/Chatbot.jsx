import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const predefinedQA = {
  "What does Panita specialize in?": "Data analytics with focus on product, GTM, and business insights using SQL, dashboards, and AI-enhanced workflows.",
  "What is the GTM project?": "A funnel analysis project identifying drop-offs from acquisition to conversion and improving user conversion strategies.",
  "Does Panita know ML/NLP?": "Yes, applied in fraud detection, NLP resume screening, and LLM-based data workflows.",
  "Are you an ML Engineer?": "No, I am a Data Analyst who solves business problems. I use ML, NLP, and LLMs as supporting tools."
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Panita's AI Assistant. How can I help you understand her portfolio?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textInput) => {
    const query = textInput.trim();
    if (!query) return;

    setMessages(prev => [...prev, { text: query, isBot: false }]);
    setInput("");

    setTimeout(() => {
      let response = "I'm not fully sure about that. You can contact Panita directly using the buttons below.";

      for (const [q, a] of Object.entries(predefinedQA)) {
        if (query.toLowerCase() === q.toLowerCase() || 
            (query.toLowerCase().includes("specialize") && q.includes("specialize")) ||
            (query.toLowerCase().includes("gtm") && q.includes("GTM")) ||
            ((query.toLowerCase().includes("ml") || query.toLowerCase().includes("nlp")) && q.includes("ML/NLP"))) {
          response = a;
          break;
        }
      }

      setMessages(prev => [...prev, { text: response, isBot: true }]);
    }, 600);
  };

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          <span className="icon">💬</span> Ask AI Assistant
        </button>
      )}

      {isOpen && (
        <div className="chat-window glass-card">
          <div className="chat-header">
            <div>
              <h4>🤖 AI Assistant</h4>
              <span className="online-status">Online</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          {/* PERSISTENT CONTACT STRIP */}
          <div className="chat-persistent-contact">
            <span className="contact-label">Connect instantly:</span>
            <div className="contact-links">
              <a href="mailto:panitakanaguduru.18@gmail.com" className="contact-mini email">Email</a>
              <a href="https://linkedin.com/in/panitak" target="_blank" rel="noreferrer" className="contact-mini linkedin">LinkedIn</a>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.isBot ? 'bot' : 'user'}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-suggestions">
            {Object.keys(predefinedQA).map((q, idx) => (
              <button key={idx} className="suggestion-chip" onClick={() => handleSend(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Ask a question..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
            />
            <button onClick={() => handleSend(input)}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
