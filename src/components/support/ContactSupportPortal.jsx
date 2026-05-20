import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Clock } from 'lucide-react';
import './ContactSupportPortal.css';

const ContactSupportPortal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: form, 2: chat
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    issue: ''
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'support',
      text: '👋 Namaste! How can we help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.category || !formData.issue) {
      alert('Please fill all fields');
      return;
    }

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: `Issue: ${formData.issue}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setStep(2);

    // AI Response
    setTimeout(() => {
      const aiMsg = {
        id: messages.length + 2,
        sender: 'support',
        text: '✓ Thank you for providing details! Our support team will help you shortly. Please wait...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Add user message
    const userMsg = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // Simulate support response
    setTimeout(() => {
      const responses = [
        'Got it! Let me check that for you.',
        'Thank you for the information. Can you provide more details?',
        'I understand. We are working on this.',
        'Is there anything else I can help you with?',
        'Your issue has been noted. Our team will follow up soon.'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const supportMsg = {
        id: messages.length + 2,
        sender: 'support',
        text: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, supportMsg]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="support-portal-overlay">
      <div className="support-portal-modal">
        {/* Header */}
        <div className="support-portal-header">
          <div className="header-content">
            <MessageCircle size={24} className="header-icon" />
            <h2>Live Support Chat</h2>
          </div>
          <button onClick={onClose} className="support-close-btn" title="Close">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="support-portal-body">
          {step === 1 ? (
            // Form Step
            <div className="support-form-container">
              <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
                Tell us about your issue
              </h3>
              
              <form onSubmit={handleFormSubmit} className="support-form">
                <div className="form-group">
                  <label>Your Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="your@email.com"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Issue Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    <option value="login">Login Issue</option>
                    <option value="payment">Payment Problem</option>
                    <option value="profile">Profile Issue</option>
                    <option value="verification">Verification Issue</option>
                    <option value="bug">Technical Bug</option>
                    <option value="safety">Safety Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Describe Your Issue *</label>
                  <textarea
                    name="issue"
                    value={formData.issue}
                    onChange={handleFormChange}
                    placeholder="Please describe your issue in detail..."
                    className="form-input"
                    rows="4"
                    required
                  />
                </div>

                <button type="submit" className="support-submit-btn">
                  Start Chat Support →
                </button>
              </form>
            </div>
          ) : (
            // Chat Step
            <div className="support-chat-wrapper">
              <div className="support-chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'support-message'}`}
                  >
                    <div className="message-bubble">
                      <p>{msg.text}</p>
                      <span className="message-time">
                        {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="support-chat-form">
                <div className="message-input-wrapper">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                  />
                  <button type="submit" className="send-btn" title="Send" disabled={!inputMessage.trim()}>
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer with timer */}
        {step === 2 && (
          <div className="support-portal-footer">
            <Clock size={16} />
            <span>This chat session is active for 5 minutes</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactSupportPortal;
