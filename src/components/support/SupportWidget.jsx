import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, Loader, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { getStoredAuthState } from '../../utils/authStorage';
import './SupportWidget.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SupportWidget = () => {
  const { isAuthenticated, user, token: contextToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: categories, 2: message, 3: chat
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState(null);
  const [socket, setSocket] = useState(null);
  const [authError, setAuthError] = useState('');

  // Fetch categories on mount (public endpoint, no auth needed)
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setAuthError('');
      
      const response = await fetch(`${API_BASE_URL}/api/support/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data.categories) {
        setCategories(data.data.categories);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      setAuthError('Failed to load support categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to support socket when request is accepted
  useEffect(() => {
    if (currentRequest && currentRequest.status === 'accepted') {
      connectToSocket();
    }
  }, [currentRequest]);

  const connectToSocket = () => {
    try {
      // Get token from context first, then fallback to storage
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }
      
      if (!token) {
        setAuthError('Please login to use support chat');
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
        supportSocket.emit('join_support_request', { requestId: currentRequest._id });
      });

      supportSocket.on('connect_error', (error) => {
        if (error?.message?.includes('token')) {
          setAuthError('Authentication failed. Please refresh and login again.');
        }
      });

      supportSocket.on('support_message', (data) => {
        setChatMessages(prev => [...prev, data]);
      });

      supportSocket.on('support_typing_indicator', (data) => {
        // Handle typing indicator
      });

      supportSocket.on('disconnect', () => {
        // Handle disconnection
      });

      supportSocket.on('error', (error) => {
        // Handle socket error
      });

      setSocket(supportSocket);
    } catch (error) {
      setAuthError('Failed to connect to support chat');
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedCategory || !message.trim()) {
      alert('Please select a category and enter a message');
      return;
    }

    if (!isAuthenticated) {
      setAuthError('Please login to create a support request');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    try {
      // Get token from context first, then fallback to storage
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }
      
      if (!token) {
        setAuthError('No authentication token found. Please refresh and login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: selectedCategory,
          message: message.trim()
        })
      });

      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        setAuthError(data.message || 'Session expired. Please refresh and login again.');
        return;
      }

      if (!response.ok) {
        setAuthError(data.message || `Error: ${response.status}`);
        return;
      }

      if (data.success) {
        setCurrentRequest(data.data);
        setRequestStatus('pending');
        setStep(3);
        
        // Fetch messages
        fetchMessages(data.data._id || data.data.request_id);
      } else {
        setAuthError(data.message || 'Failed to create support request');
      }
    } catch (error) {
      setAuthError('Network error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (requestId) => {
    try {
      // Get token from context first, then fallback to storage
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/request/${requestId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setChatMessages(data.data.messages || []);
      }
    } catch (error) {
      // Handle fetch error
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      if (requestStatus === 'accepted' && socket) {
        // Send via socket for real-time
        socket.emit('send_support_message', {
          requestId: currentRequest._id,
          message: inputMessage.trim()
        });
      } else {
        // Send via HTTP
        // Get token from context first, then fallback to storage
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
          body: JSON.stringify({ message: inputMessage.trim() })
        });

        if (response.ok) {
          setChatMessages(prev => [...prev, {
            _id: Date.now(),
            message: inputMessage.trim(),
            sender_type: 'user',
            created_at: new Date().toISOString()
          }]);
        }
      }

      setInputMessage('');
    } catch (error) {
      // Handle send error
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedCategory('');
    setMessage('');
    setCurrentRequest(null);
    setChatMessages([]);
    setRequestStatus(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  return (
    <>
      {/* Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="support-widget-button"
          title="Get support"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Support Modal */}
      {isOpen && (
        <div className="support-widget-container">
          <div className="support-widget-header">
            <h3>Need Help?</h3>
            <button
              onClick={handleClose}
              className="support-close-btn"
            >
              <X size={20} />
            </button>
          </div>

          <div className="support-widget-body">
            {/* Authentication Error Message */}
            {authError && (
              <div className="support-error-message">
                <AlertCircle size={16} />
                <p>{authError}</p>
              </div>
            )}

            {/* Not Authenticated Message */}
            {!isAuthenticated && !authError && (
              <div className="support-auth-required">
                <p>Please login to access support chat</p>
                <a href="/login" className="support-login-link">Go to Login</a>
              </div>
            )}

            {/* Authenticated User - Show Normal Steps */}
            {isAuthenticated && !authError && (
              <>
                {step === 1 && (
                  <div className="support-step-categories">
                    <p className="support-step-title">Select your issue category</p>
                    <div className="support-categories-list">
                      {categories.map(cat => (
                        <button
                          key={cat._id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`support-category-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                        >
                          {cat.icon && <span className="category-icon">{cat.icon}</span>}
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!selectedCategory}
                      className="support-next-btn"
                    >
                      Next
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="support-step-message">
                    <p className="support-step-title">Describe your issue</p>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please provide details about your issue..."
                      className="support-message-input"
                      maxLength={1000}
                      rows={5}
                    />
                    <div className="support-char-count">
                      {message.length}/1000
                    </div>
                    <div className="support-button-group">
                      <button
                        onClick={() => setStep(1)}
                        className="support-back-btn"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleCreateRequest}
                        disabled={isLoading || !message.trim()}
                        className="support-submit-btn"
                      >
                        {isLoading ? (
                          <>
                            <Loader size={16} className="loading-spin" />
                            Sending...
                          </>
                        ) : (
                          'Start Chat'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="support-step-chat">
                    <div className="support-status-bar">
                      <span className={`support-status ${requestStatus}`}>
                        {requestStatus === 'pending' && '⏳ Waiting for support agent...'}
                        {requestStatus === 'accepted' && '✓ Chat connected'}
                        {requestStatus === 'rejected' && '✗ Request rejected'}
                      </span>
                    </div>

                    <div className="support-chat-messages">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={msg._id || idx}
                          className={`support-message ${msg.sender_type === 'user' ? 'user' : 'admin'}`}
                        >
                          <div className="support-message-content">
                            <strong>{msg.sender_type === 'admin' ? 'Support Agent' : 'You'}</strong>
                            <p>{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {requestStatus === 'accepted' && (
                      <div className="support-chat-input">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message..."
                          className="support-input"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="support-send-btn"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    )}

                    {requestStatus === 'rejected' && (
                      <div className="support-rejected-notice">
                        <p>No agent available at this moment. Please try again later.</p>
                        <button
                          onClick={handleReset}
                          className="support-new-request-btn"
                        >
                          Start New Request
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportWidget;
