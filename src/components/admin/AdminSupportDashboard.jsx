import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, CheckCircle, XCircle, Settings, Search, Bell, Clock, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { getStoredAuthState } from '../../utils/authStorage';
import './AdminSupportDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminSupportDashboard = () => {
  const { user, token: contextToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, pending, active, resolved
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize socket
  useEffect(() => {
    if (!contextToken) return;

    const adminSocket = io(`${API_BASE_URL}/support`, {
      auth: { token: contextToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    adminSocket.on('connect', () => {
      fetchConversations();
    });

    adminSocket.on('new_support_request', (data) => {
      setConversations(prev => [
        {
          _id: data.requestId,
          user_id: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          category: data.category,
          status: 'pending',
          description: data.description,
          priority: data.priority,
          aiMessages: 0,
          messages: [],
          created_at: new Date().toISOString(),
          hasUnread: true
        },
        ...prev
      ]);
      setUnreadCount(prev => prev + 1);
    });

    adminSocket.on('support_message', (data) => {
      if (selectedConversation && selectedConversation._id === data.requestId) {
        setMessages(prev => [...prev, data]);
      }
      setConversations(prev =>
        prev.map(conv =>
          conv._id === data.requestId
            ? { ...conv, hasUnread: true, lastMessage: data.message, lastMessageTime: new Date() }
            : conv
        )
      );
    });

    adminSocket.on('support_typing_start', (data) => {
      if (selectedConversation && selectedConversation._id === data.requestId) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    });

    adminSocket.on('support_typing_stop', (data) => {
      if (selectedConversation && selectedConversation._id === data.requestId) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
    });

    adminSocket.on('disconnect', () => {
      // Handle disconnection
    });

    setSocket(adminSocket);
    return () => adminSocket.disconnect();
  }, [contextToken]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setConversations(data.data.requests || []);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    
    try {
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/request/${conversation._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }

      // Mark as read
      if (socket) {
        socket.emit('mark_support_messages_read', { requestId: conversation._id });
      }

      // Update conversation
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversation._id ? { ...conv, hasUnread: false } : conv
        )
      );
    } catch (error) {
      // Handle error silently
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedConversation || !socket) return;

    socket.emit('send_admin_message', {
      requestId: selectedConversation._id,
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleAcceptRequest = () => {
    if (!selectedConversation || !socket) return;

    socket.emit('accept_support_request', {
      requestId: selectedConversation._id
    });

    setSelectedConversation(prev => ({ ...prev, status: 'accepted' }));
  };

  const handleResolveRequest = () => {
    if (!selectedConversation || !socket) return;

    socket.emit('resolve_support_request', {
      requestId: selectedConversation._id
    });

    setSelectedConversation(prev => ({ ...prev, status: 'resolved' }));
  };

  const handleCloseRequest = () => {
    if (!selectedConversation || !socket) return;

    socket.emit('close_support_request', {
      requestId: selectedConversation._id
    });

    setConversations(prev => prev.filter(c => c._id !== selectedConversation._id));
    setSelectedConversation(null);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesFilter = filter === 'all' || conv.status === filter;
    const matchesSearch = !searchQuery ||
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="admin-support-container access-denied">
        <div className="access-denied-card">
          <AlertCircle size={64} />
          <h2>Access Denied</h2>
          <p>Only admin users can access the support dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-support-container">
      {/* LEFT PANEL - CONVERSATIONS */}
      <div className="admin-conversations-panel">
        {/* Header */}
        <div className="conversations-header">
          <h2>Support Requests</h2>
          <div className="header-actions">
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="conversations-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filters */}
        <div className="conversations-filters">
          {['all', 'pending', 'active', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="conversations-list">
          {isLoading ? (
            <div className="loading-state">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state">No conversations</div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''} ${conv.hasUnread ? 'unread' : ''}`}
              >
                {/* Avatar */}
                <div className="conversation-avatar">
                  {conv.userName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="conversation-info">
                  <div className="conversation-header-info">
                    <span className="user-name">{conv.userName}</span>
                    <span className={`status-badge ${conv.status}`}>{conv.status}</span>
                  </div>
                  <div className="conversation-category">{conv.category}</div>
                  <div className="conversation-preview">
                    {conv.lastMessage || conv.description}
                  </div>
                </div>

                {/* Indicators */}
                <div className="conversation-indicators">
                  {conv.hasUnread && <div className="unread-dot"></div>}
                  {conv.priority === 'urgent' && (
                    <span className="priority-badge">🔴</span>
                  )}
                  <div className="status-indicator">
                    {conv.aiMessages > 0 && (
                      <span className="ai-badge">🤖</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL - CHAT */}
      {selectedConversation ? (
        <div className="admin-chat-panel">
          {/* Chat Header */}
          <div className="chat-header-admin">
            <div className="chat-user-details">
              <div className="user-avatar">
                {selectedConversation.userName.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h3>{selectedConversation.userName}</h3>
                <p>{selectedConversation.userEmail}</p>
              </div>
            </div>
            <div className="chat-controls-header">
              <span className={`status-badge ${selectedConversation.status}`}>
                {selectedConversation.status.toUpperCase()}
              </span>
              <span className="category-tag">{selectedConversation.category}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="admin-chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`admin-message-bubble ${msg.sender_type === 'admin' ? 'admin' : msg.sender_type === 'ai' ? 'ai' : 'user'}`}
                >
                  {msg.sender_type !== 'admin' && (
                    <span className="message-sender">
                      {msg.sender_name || 'User'}
                    </span>
                  )}
                  <div className="message-content">
                    {msg.message}
                  </div>
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="admin-message-bubble user typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Action Buttons */}
          {selectedConversation.status === 'pending' && (
            <div className="admin-action-buttons">
              <button
                onClick={handleAcceptRequest}
                className="btn-action btn-accept"
              >
                <CheckCircle size={18} />
                Accept Request
              </button>
              <button
                onClick={handleCloseRequest}
                className="btn-action btn-decline"
              >
                <XCircle size={18} />
                Decline
              </button>
            </div>
          )}

          {selectedConversation.status === 'active' && (
            <div className="admin-action-buttons">
              <button
                onClick={handleResolveRequest}
                className="btn-action btn-resolve"
              >
                <CheckCircle size={18} />
                Resolve Request
              </button>
              <button
                onClick={handleCloseRequest}
                className="btn-action btn-close"
              >
                <X size={18} />
                Close Chat
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="admin-input-area">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                className="message-input"
                disabled={selectedConversation.status === 'resolved' || selectedConversation.status === 'closed'}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || selectedConversation.status === 'resolved' || selectedConversation.status === 'closed'}
                className="btn-send"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-chat-empty">
          <div className="empty-state-large">
            <h3>Select a conversation</h3>
            <p>Choose a support request from the list to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportDashboard;
