// src/pages/AdminSubscriptionPanel.jsx
/**
 * Admin Subscription Management Panel
 * View, approve, and reject subscription requests
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminSubscriptionPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        `http://localhost:5000/api/admin/subscriptions?status=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setRequests(response.data.subscriptions || []);
      setError('');
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch subscription requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        'http://localhost:5000/api/admin/stats',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this request?')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      await axios.post(
        'http://localhost:5000/api/admin/approve',
        {
          requestId,
          notes: approvalNotes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('✓ Subscription approved successfully');
      setApprovalNotes('');
      setSelectedRequest(null);
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError('Failed to approve request: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this request?')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      await axios.post(
        'http://localhost:5000/api/admin/reject',
        {
          requestId,
          reason: rejectionReason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('✓ Subscription rejected successfully');
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
      fetchStats();
    } catch (err) {
      setError('Failed to reject request: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-2">Review and approve subscription requests</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Revenue</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{stats.totalRevenue}</p>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests List */}
          <div className="lg:col-span-2">
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Requests */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div
                    key={req._id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-lg cursor-pointer transition border-2 ${
                      selectedRequest?._id === req._id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{req.planName}</p>
                        <p className="text-sm text-gray-600">
                          {req.userId?.userName} ({req.userEmail})
                        </p>
                        <p className="text-sm text-gray-600">Payment ID: {req.paymentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-pink-600">₹{req.amount}</p>
                        <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          {selectedRequest && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Request Details</h2>

              {/* Basic Info */}
              <div className="space-y-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-xs text-gray-600">Request ID</p>
                  <p className="font-mono text-sm font-bold">{selectedRequest._id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">User</p>
                  <p className="font-bold">{selectedRequest.userId?.userName}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Plan</p>
                  <p className="font-bold">{selectedRequest.planName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Amount</p>
                  <p className="font-bold text-pink-600 text-lg">₹{selectedRequest.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Sender Name</p>
                  <p className="font-bold">{selectedRequest.senderName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Payment ID</p>
                  <p className="font-mono font-bold">{selectedRequest.paymentId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Submitted</p>
                  <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Screenshot */}
              {selectedRequest.screenshotUrl && (
                <div className="mb-6 pb-6 border-b">
                  <p className="text-xs text-gray-600 mb-2">Payment Screenshot</p>
                  <img
                    src={selectedRequest.screenshotUrl}
                    alt="Payment proof"
                    className="w-full rounded-lg border border-gray-300 max-h-48 object-cover"
                  />
                </div>
              )}

              {/* Action Buttons - Only for Pending Requests */}
              {selectedRequest.status === 'pending' && (
                <>
                  {/* Approval Notes */}
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Approval notes (optional)"
                    className="w-full px-3 py-2 border rounded-lg mb-4 text-sm"
                    rows="2"
                  />

                  {/* Rejection Reason */}
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Rejection reason"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg mb-4 text-sm"
                    rows="2"
                  />

                  {/* Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleApprove(selectedRequest._id)}
                      disabled={actionLoading}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? '⏳ Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest._id)}
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? '⏳ Processing...' : '✕ Reject'}
                    </button>
                  </div>
                </>
              )}

              {/* Show status for processed requests */}
              {selectedRequest.status !== 'pending' && (
                <div className={`p-4 rounded-lg text-center font-bold ${
                  selectedRequest.status === 'approved'
                    ? 'bg-green-50 text-green-900'
                    : 'bg-red-50 text-red-900'
                }`}>
                  <p>Status: {selectedRequest.status.toUpperCase()}</p>
                  {selectedRequest.rejectionReason && (
                    <p className="text-sm mt-2">Reason: {selectedRequest.rejectionReason}</p>
                  )}
                  {selectedRequest.reviewedAt && (
                    <p className="text-xs mt-2">
                      Reviewed: {new Date(selectedRequest.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPanel;
