import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, AlertCircle, MessageCircle, Check, CheckCheck, Smile } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { getStoredAuthState } from '../../utils/authStorage';
import './SupportCenter.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SupportCenter = () => {
  const { isAuthenticated, user, token: contextToken } = useAuth();
  const [view, setView] = useState('form'); // form, chat, expired
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState(null);
  const [socket, setSocket] = useState(null);
  const [authError, setAuthError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [aiWaiting, setAiWaiting] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    if (!categories.length) {
      fetchCategories();
    }
  }, []);

  // Handle timer countdown
  useEffect(() => {
    if (view === 'chat' && requestStatus === 'pending' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && requestStatus === 'pending') {
      handleRequestExpired();
    }
  }, [timeLeft, view, requestStatus]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/support/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      setAuthError('Failed to load support categories');
    } finally {
      setIsLoading(false);
    }
  };

  const connectToSocket = (requestId) => {
    try {
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      if (!token) {
        setAuthError('Please login to use support');
        return;
      }

      const supportSocket = io(`${API_BASE_URL}/support`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      supportSocket.on('connect', () => {
        setAuthError('');
        supportSocket.emit('join_support_request', { requestId });
      });

      supportSocket.on('support_message', (data) => {
        setChatMessages(prev => [...prev, data]);
        setAiWaiting(false);
      });

      supportSocket.on('support_request_accepted', (data) => {
        setRequestStatus('accepted');
      });

      supportSocket.on('support_typing_start', (data) => {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      });

      supportSocket.on('support_typing_stop', (data) => {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      });

      supportSocket.on('support_request_expired', () => {
        handleRequestExpired();
      });

      supportSocket.on('connect_error', (error) => {
        if (error?.message?.includes('token')) {
          setAuthError('Authentication failed. Please refresh.');
        }
      });

      supportSocket.on('disconnect', () => {
        // Handle disconnection
      });

      setSocket(supportSocket);
    } catch (error) {
      setAuthError('Failed to connect to support');
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedCategory || !description.trim()) {
      alert('Please select a category and describe your issue');
      return;
    }

    if (!isAuthenticated) {
      setAuthError('Please login first');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: selectedCategory,
          message: description.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'Failed to create request');
        return;
      }

      setCurrentRequest(data.data);
      setRequestStatus('pending');
      setView('chat');
      setTimeLeft(300);
      connectToSocket(data.data._id);

      // Fetch existing messages
      fetchMessages(data.data._id);
      setAiWaiting(true);
    } catch (error) {
      setAuthError('Network error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (requestId) => {
    try {
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/request/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages(data.data.messages || []);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (requestStatus === 'accepted' && socket) {
      socket.emit('send_support_message', {
        requestId: currentRequest._id,
        message: inputMessage.trim()
      });
    } else {
      // HTTP fallback
      sendMessageViaHttp(inputMessage.trim());
    }

    setInputMessage('');
  };

  const sendMessageViaHttp = async (message) => {
    try {
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/request/${currentRequest._id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        setChatMessages(prev => [...prev, {
          _id: Date.now(),
          message,
          sender_type: 'user',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleRequestExpired = () => {
    setView('expired');
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const handleReset = () => {
    setView('form');
    setSelectedCategory('');
    setDescription('');
    setChatMessages([]);
    setCurrentRequest(null);
    setRequestStatus(null);
    setTimeLeft(300);
    setAiWaiting(false);
    setTypingUsers(new Set());
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="support-center-container auth-required">
        <div className="auth-required-card">
          <h2>Sign in to access support</h2>
          <p>You need to be logged in to contact our support team.</p>
          <a href="/login" className="btn-primary">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="support-center-container">
      {/* LEFT SIDEBAR */}
      <div className="support-left-sidebar">
        {/* Intro Section */}
        <div className="support-intro-card">
          <div className="intro-badge">✨ 24/7 Premium Support</div>
          <h2>How can we help?</h2>
          <p>Get instant help from our AI assistant or connect with our support team</p>
          
          {/* Stats */}
          <div className="support-stats">
            <div className="stat">
              <div className="stat-value">{"<2min"}</div>
              <div className="stat-label">Avg response</div>
            </div>
            <div className="stat">
              <div className="stat-value">98%</div>
              <div className="stat-label">Satisfaction</div>
            </div>
            <div className="stat">
              <div className="stat-value">Online</div>
              <div className="stat-label">Always here</div>
            </div>
          </div>
        </div>

        {/* Support Categories */}
        <div className="support-categories-section">
          <h3>Common Issues</h3>
          <div className="categories-grid">
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`category-card ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setView('form');
                }}
              >
                <span className="cat-icon">{cat.icon || '💬'}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="support-right-panel">
        {/* Error Message */}
        {authError && (
          <div className="support-error-banner">
            <AlertCircle size={18} />
            <span>{authError}</span>
            <button onClick={() => setAuthError('')}>×</button>
          </div>
        )}

        {/* FORM VIEW */}
        {view === 'form' && (
          <div className="support-form-view">
            <div className="form-header">
              <h3>Tell us what's wrong</h3>
              <p>We'll get you sorted in no time</p>
            </div>

            <div className="form-content">
              {/* Category Selection */}
              <div className="form-group">
                <label>What's your issue about? *</label>
                <div className="floating-select">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={selectedCategory ? 'has-value' : ''}
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <span className="floating-label">Select category</span>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Tell us more *</label>
                <div className="floating-textarea">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    placeholder="Describe your issue in detail..."
                    className={description ? 'has-value' : ''}
                  />
                  <span className="char-count">{description.length}/1000</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateRequest}
                disabled={isLoading || !selectedCategory || !description.trim()}
                className="btn-submit-support"
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    Start Support Chat
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && (
          <div className="support-chat-view">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-user-info">
                  <h3>{selectedCategory}</h3>
                  <span className={`status ${requestStatus}`}>
                    {requestStatus === 'pending' && '⏳ Waiting for agent...'}
                    {requestStatus === 'accepted' && '✓ Agent online'}
                  </span>
                </div>
              </div>
              <div className="chat-header-right">
                <div className="timer-display">
                  <span className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <div className="empty-state">
                  <div className="ai-avatar-large">🤖</div>
                  <h4>Hi! I'm SeeU Assistant</h4>
                  <p>I'm here to help you with {selectedCategory}. Let me connect you with our support team...</p>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`message-bubble ${msg.sender_type === 'user' ? 'user' : 'agent'}`}
                >
                  {msg.sender_type !== 'user' && (
                    <span className="message-sender">{msg.sender_name || 'Support'}</span>
                  )}
                  <div className="message-content">
                    {msg.message}
                  </div>
                  <div className="message-meta">
                    <span className="timestamp">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.sender_type === 'user' && (
                      <span className="read-status">
                        {msg.read_by && msg.read_by.length > 0 ? <CheckCheck size={14} /> : <Check size={14} />}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="message-bubble agent typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              {aiWaiting && chatMessages.length === 0 && (
                <div className="message-bubble agent typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="message-input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="btn-send"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXPIRED VIEW */}
        {view === 'expired' && (
          <div className="support-expired-view">
            <div className="expired-card">
              <div className="expired-icon">⏰</div>
              <h3>Session Expired</h3>
              <p>Your support request has expired after 5 minutes of waiting.</p>
              <p className="subtext">Create a new request to connect with our support team.</p>
              <button onClick={handleReset} className="btn-primary">
                Start New Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenter;
