import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { getStoredAuthState } from '../../utils/authStorage';
import './AdminSupportPanel.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminSupportPanel = () => {
  const { token: contextToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  // Initialize socket
  useEffect(() => {
    let token = contextToken;
    if (!token) {
      const stored = getStoredAuthState();
      token = stored?.token;
    }

    if (!token) return;

    const supportSocket = io(`${API_BASE_URL}/support`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Listen for new support requests
    supportSocket.on('new_support_request', (data) => {
      setRequests(prev => {
        const exists = prev.find(r => r.requestId === data.requestId);
        if (!exists) {
          return [data, ...prev];
        }
        return prev;
      });
    });

    // Listen for support messages
    supportSocket.on('support_message', (data) => {
      if (selectedRequest && data.requestId === selectedRequest.requestId) {
        setChatMessages(prev => [...prev, data]);
      }
    });

    // Listen for request updates
    supportSocket.on('support_request_updated', (data) => {
      setRequests(prev =>
        prev.map(r => r.requestId === data.requestId ? { ...r, ...data } : r)
      );
    });

    setSocket(supportSocket);

    return () => supportSocket.disconnect();
  }, [contextToken]);

  // Fetch pending support requests
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/admin/requests?status=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data?.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectRequest = async (request) => {
    setSelectedRequest(request);
    setChatMessages([]);

    // Join the support room
    if (socket) {
      socket.emit('join_support_request', { requestId: request.requestId }, (ack) => {
        if (ack?.ok) {
          // Fetch existing messages
          fetchMessages(request.requestId);
        }
      });
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

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.data?.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const acceptRequest = () => {
    if (!selectedRequest || !socket) return;

    socket.emit('send_support_message', {
      requestId: selectedRequest.requestId,
      message: `Hello, I'm here to help with your ${selectedRequest.category} issue.`
    });

    // Update local state
    setRequests(prev =>
      prev.map(r =>
        r.requestId === selectedRequest.requestId
          ? { ...r, status: 'accepted' }
          : r
      )
    );

    setSelectedRequest(prev => ({ ...prev, status: 'accepted' }));
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedRequest || !socket) return;

    socket.emit('send_support_message', {
      requestId: selectedRequest.requestId,
      message: inputMessage
    });

    setInputMessage('');
  };

  const closeRequest = async (requestId) => {
    try {
      let token = contextToken;
      if (!token) {
        const stored = getStoredAuthState();
        token = stored?.token;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/admin/request/${requestId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.requestId !== requestId));
        if (selectedRequest?.requestId === requestId) {
          setSelectedRequest(null);
        }
      }
    } catch (error) {
      console.error('Error closing request:', error);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'active') return r.status === 'accepted';
    return true;
  });

  return (
    <div className="admin-support-panel">
      <div className="support-list-side">
        <div className="support-list-header">
          <h3>Support Requests</h3>
          <span className="badge">{filteredRequests.length}</span>
        </div>

        <div className="support-filters">
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <Clock size={16} /> Pending
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            <CheckCircle size={16} /> Active
          </button>
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>

        <div className="support-requests-list">
          {loading ? (
            <div className="loading">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="empty-state">No support requests</div>
          ) : (
            filteredRequests.map(request => (
              <div
                key={request.requestId}
                className={`request-item ${selectedRequest?.requestId === request.requestId ? 'active' : ''}`}
                onClick={() => selectRequest(request)}
              >
                <div className="request-info">
                  <h4>{request.userName}</h4>
                  <p className="request-category">{request.category}</p>
                  <span className={`status-badge ${request.status}`}>{request.status}</span>
                </div>
                <span className="request-time">
                  {new Date(request.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="support-chat-side">
        {selectedRequest ? (
          <>
            <div className="chat-header">
              <div>
                <h3>{selectedRequest.userName}</h3>
                <p>{selectedRequest.category}</p>
              </div>
              <button
                className="close-request-btn"
                onClick={() => closeRequest(selectedRequest.requestId)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="messages-container">
              {chatMessages.length === 0 && (
                <div className="empty-messages">
                  <MessageSquare size={32} />
                  <p>No messages yet</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div
                  key={msg._id || idx}
                  className={`message ${msg.sender_type === 'admin' ? 'admin' : 'user'}`}
                >
                  <div className="message-sender">{msg.sender_name || 'Unknown'}</div>
                  <div className="message-content">{msg.message}</div>
                  <div className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="input-container">
              {selectedRequest.status === 'pending' ? (
                <button className="accept-btn" onClick={acceptRequest}>
                  Accept & Reply
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                  />
                  <button onClick={sendMessage} disabled={!inputMessage.trim()}>
                    Send
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="no-selection">
            <MessageSquare size={48} />
            <h3>Select a support request to chat</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportPanel;
