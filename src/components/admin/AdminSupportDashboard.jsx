import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, MessageSquare, Clock } from 'lucide-react';
import AdminSupportChat from './AdminSupportChat';
import './AdminSupportDashboard.css';

const AdminSupportDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [filter, page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `/api/admin/support/requests?status=${filter}&page=${page}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        setRequests(data.data.data || []);
        setTotalPages(data.data.pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilAutoReject = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const timeElapsed = Math.round((now - created) / 1000); // seconds
    const timeRemaining = 300 - timeElapsed; // 5 minutes = 300 seconds

    if (timeRemaining <= 0) {
      return 'Auto-rejecting soon...';
    }

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAccept = async (requestId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/support/request/${requestId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchRequests();
        alert('Request accepted!');
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert('Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please provide a rejection reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/support/request/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        fetchRequests();
        alert('Request rejected');
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject request');
    }
  };

  return (
    <div className="admin-support-container">
      <div className="support-header">
        <h2>Support Requests</h2>
        <div className="support-filters">
          {['pending', 'accepted', 'rejected', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setPage(1);
              }}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : (
        <div className="support-requests-grid">
          {requests.length === 0 ? (
            <div className="no-requests">
              <AlertCircle size={32} />
              <p>No support requests found</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req._id} className="request-card">
                <div className="request-header">
                  <div className="request-info">
                    <h3>{req.user_id?.name || 'Unknown User'}</h3>
                    <p className="request-category">{req.category}</p>
                  </div>
                  <span className={`status-badge ${req.status}`}>
                    {req.status}
                  </span>
                </div>

                <div className="request-body">
                  <p className="request-message">{req.description}</p>
                  <div className="request-meta">
                    <span className="email">{req.user_id?.email}</span>
                    {req.messageCount > 0 && (
                      <span className="message-count">
                        <MessageSquare size={14} />
                        {req.messageCount} messages
                      </span>
                    )}
                  </div>
                </div>

                <div className="request-footer">
                  {req.status === 'pending' && (
                    <>
                      <span className="auto-reject-timer">
                        <Clock size={14} />
                        {getTimeUntilAutoReject(req.created_at)}
                      </span>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleAccept(req._id)}
                          className="accept-btn"
                        >
                          <Check size={16} /> Accept
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="reject-btn"
                        >
                          <X size={16} /> Reject
                        </button>
                      </div>
                    </>
                  )}
                  {req.status === 'accepted' && (
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="view-chat-btn"
                    >
                      <MessageSquare size={16} /> View Chat
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>{page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {selectedRequest && (
        <AdminSupportChat
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={fetchRequests}
        />
      )}
    </div>
  );
};

export default AdminSupportDashboard;
