import React, { useState, useEffect, useRef } from 'react';
import {
  Send, X, Clock, CheckCircle, AlertCircle, Users, Search,
  Filter, Bell, Volume2, Phone, Mail, MessageSquare, FileText,
  Download, Check, CheckCheck, Loader, Eye, EyeOff
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { getStoredAuthState } from '../../utils/authStorage';
import './AdminSupportDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdvancedAdminSupportDashboard = () => {
  const { token: contextToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const [supportRequests, setSupportRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, active, resolved, expired
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationSound, setNotificationSound] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize Socket.IO
  useEffect(() => {
    const token = contextToken || getStoredAuthState()?.token;
    if (!token) return;

    const adminSocket = io(`${API_BASE_URL}/support`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    adminSocket.on('connect', () => {
      console.log('✅ Admin connected to support socket');
      fetchSupportRequests();
      adminSocket.emit('get_unread_count', (response) => {
        if (response?.ok) {
          setUnreadCount(response.unreadCount);
        }
      });
    });

    adminSocket.on('new_support_request', (request) => {
      console.log('🔔 New support request:', request);
      setSupportRequests((prev) => [request, ...prev]);
      playNotificationSound();
      setUnreadCount((prev) => prev + 1);
    });

    adminSocket.on('support_message', (msg) => {
      if (selectedRequest && msg.requestId === selectedRequest._id.toString()) {
        setChatMessages((prev) => [...prev, msg]);
      }
    });

    adminSocket.on('support_typing_indicator', () => {
      // Handle typing indicator
    });

    setSocket(adminSocket);

    return () => {
      adminSocket.disconnect();
    };
  }, [contextToken]);

  // Fetch support requests
  const fetchSupportRequests = async () => {
    try {
      setIsLoading(true);
      const token = contextToken || getStoredAuthState()?.token;
      const response = await fetch(`${API_BASE_URL}/api/admin/support/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSupportRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching support requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load chat messages when request is selected
  useEffect(() => {
    if (selectedRequest) {
      fetchChatMessages();
    }
  }, [selectedRequest]);

  const fetchChatMessages = async () => {
    try {
      const token = contextToken || getStoredAuthState()?.token;
      const response = await fetch(
        `${API_BASE_URL}/api/admin/support/${selectedRequest._id}/messages`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        setChatMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !socket || !selectedRequest) return;

    socket.emit('send_support_message', {
      requestId: selectedRequest._id,
      message: messageInput.trim()
    });

    setMessageInput('');
  };

  // Accept request
  const handleAcceptRequest = () => {
    if (!socket || !selectedRequest) return;

    socket.emit('admin_accept_request', { requestId: selectedRequest._id }, (response) => {
      if (response?.ok) {
        setSelectedRequest((prev) => ({ ...prev, status: 'active' }));
        setSupportRequests((prev) =>
          prev.map((req) =>
            req._id === selectedRequest._id ? { ...req, status: 'active' } : req
          )
        );
      }
    });
  };

  // Reject request
  const handleRejectRequest = () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason || !socket || !selectedRequest) return;

    socket.emit('admin_reject_request', {
      requestId: selectedRequest._id,
      reason
    }, (response) => {
      if (response?.ok) {
        setSelectedRequest((prev) => ({ ...prev, status: 'expired' }));
        setSupportRequests((prev) =>
          prev.map((req) =>
            req._id === selectedRequest._id ? { ...req, status: 'expired' } : req
          )
        );
      }
    });
  };

  // Resolve ticket
  const handleResolveTicket = () => {
    if (!socket || !selectedRequest || !resolutionNote.trim()) return;

    socket.emit('resolve_support_ticket', {
      requestId: selectedRequest._id,
      resolutionNote: resolutionNote.trim()
    }, (response) => {
      if (response?.ok) {
        setSelectedRequest((prev) => ({ ...prev, status: 'resolved' }));
        setSupportRequests((prev) =>
          prev.map((req) =>
            req._id === selectedRequest._id ? { ...req, status: 'resolved' } : req
          )
        );
        setShowResolutionModal(false);
        setResolutionNote('');
      }
    });
  };

  // Filter requests
  const filteredRequests = supportRequests
    .filter((req) => filter === 'all' || req.status === filter)
    .filter((req) =>
      searchQuery === '' ||
      req.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get timer display
  const getTimerDisplay = (expiresAt) => {
    const timeRemaining = Math.max(0, new Date(expiresAt) - new Date());
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="admin-support-dashboard">
      {/* Audio for notifications */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA="
        type="audio/wav"
      />

      <div className="support-dashboard-container">
        {/* Left Panel - Requests List */}
        <div className="support-left-panel">
          <div className="support-panel-header">
            <div className="panel-title-section">
              <h2>Support Requests</h2>
              <div className="notification-badge">
                {unreadCount > 0 && (
                  <span className="badge-number">{unreadCount}</span>
                )}
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="support-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-tabs">
              {['all', 'pending', 'active', 'resolved', 'expired'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`filter-tab ${filter === status ? 'active' : ''}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          <div className="requests-list">
            {isLoading ? (
              <div className="empty-state">
                <Loader size={32} className="spinner" />
                <p>Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="empty-state">
                <Users size={32} />
                <p>No support requests</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request._id}
                  onClick={() => setSelectedRequest(request)}
                  className={`request-card ${selectedRequest?._id === request._id ? 'active' : ''}`}
                >
                  <div className="request-card-header">
                    <h4>{request.userName}</h4>
                    <span className={`status-badge ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="request-category">{request.category}</p>
                  <p className="request-preview">{request.description.substring(0, 60)}...</p>
                  
                  <div className="request-card-footer">
                    <span className="request-time">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                    {request.status === 'pending' && request.expiresAt && (
                      <span className="timer-display">
                        <Clock size={14} />
                        {getTimerDisplay(request.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="support-right-panel">
          {selectedRequest ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <h3>{selectedRequest.userName}</h3>
                  <p className="chat-header-meta">
                    <Mail size={14} /> {selectedRequest.userEmail}
                  </p>
                  <p className="chat-header-category">{selectedRequest.category}</p>
                </div>

                <div className="chat-header-actions">
                  <button
                    className="chat-action-btn"
                    title="Call user"
                    onClick={() => alert('Call feature would be implemented here')}
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    className="chat-action-btn"
                    title="Send email"
                    onClick={() => window.location.href = `mailto:${selectedRequest.userEmail}`}
                  >
                    <Mail size={18} />
                  </button>
                </div>
              </div>

              {/* User Info Card */}
              <div className="user-info-card">
                <div className="info-row">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{selectedRequest.userUsername}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{selectedRequest.category}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Priority:</span>
                  <span className={`info-badge priority-${selectedRequest.priority}`}>
                    {selectedRequest.priority.toUpperCase()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`info-badge ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="chat-messages">
                {chatMessages.map((msg, index) => (
                  <div
                    key={msg._id || index}
                    className={`chat-message ${msg.sender_type}`}
                  >
                    <div className="message-bubble">
                      <div className="message-sender">{msg.sender_name}</div>
                      <div className="message-text">{msg.message}</div>
                      <div className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              {selectedRequest.status === 'active' && (
                <form onSubmit={handleSendMessage} className="chat-input-form">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                  />
                  <button type="submit" className="chat-send-btn">
                    <Send size={18} />
                  </button>
                </form>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={handleAcceptRequest}
                      className="action-btn accept"
                    >
                      <CheckCircle size={18} /> Accept Request
                    </button>
                    <button
                      onClick={handleRejectRequest}
                      className="action-btn reject"
                    >
                      <X size={18} /> Reject Request
                    </button>
                  </>
                )}

                {selectedRequest.status === 'active' && (
                  <button
                    onClick={() => setShowResolutionModal(true)}
                    className="action-btn resolve"
                  >
                    <CheckCircle size={18} /> Resolve Ticket
                  </button>
                )}

                {selectedRequest.status === 'resolved' && (
                  <div className="resolved-message">
                    ✅ This ticket has been resolved
                  </div>
                )}

                {selectedRequest.status === 'expired' && (
                  <div className="expired-message">
                    ⏰ This request has expired
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <MessageSquare size={48} />
              <p>Select a support request to view details and chat</p>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Resolve Support Ticket</h3>
              <button
                onClick={() => setShowResolutionModal(false)}
                className="modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Enter resolution notes..."
                rows="6"
                className="resolution-textarea"
              />
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowResolutionModal(false)}
                className="modal-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveTicket}
                disabled={!resolutionNote.trim()}
                className="modal-btn resolve"
              >
                Resolve Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAdminSupportDashboard;
