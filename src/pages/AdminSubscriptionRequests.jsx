// src/pages/AdminSubscriptionRequests.jsx
/**
 * Admin Subscription Request Management Panel
 * Review, approve, and reject pending payment requests
 */

import React, { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import api from '../services/api';

const AdminSubscriptionRequests = () => {
  // State management
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
    fetchStats();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchPendingRequests();
      fetchStats();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/api/admin/subscription/requests', {
        params: { status: 'pending_review', limit: 50, offset: 0 }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Failed to fetch requests: ' + (error?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'http://localhost:5000/api/admin/subscription/stats',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this subscription request?')) return;

    setActionLoading(true);
    try {
      await adminApi.approveSubscription(requestId, { adminNotes: approvalNotes || '' });

      alert('✓ Subscription approved!');
      setRequests(requests.filter(r => r.request_id !== requestId));
      setSelectedRequest(null);
      setApprovalNotes('');
      fetchStats();
    } catch (error) {
      alert('Error: ' + (error?.data?.message || error?.message || 'Failed to approve'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide rejection reason');
      return;
    }

    if (!window.confirm('Reject this subscription request?')) return;

    setActionLoading(true);
    try {
      await adminApi.rejectSubscription(requestId, { reason: rejectionReason });

      alert('✓ Subscription rejected!');
      setRequests(requests.filter(r => r.request_id !== requestId));
      setSelectedRequest(null);
      setRejectionReason('');
      fetchStats();
    } catch (error) {
      alert('Error: ' + (error?.data?.message || error?.message || 'Failed to reject'));
    } finally {
      setActionLoading(false);
    }
  };

  const fraudLevelColor = (level) => {
    switch(level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'very_high': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="page-shell pt-24 pb-12">
        <div className="page-content max-w-6xl animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => {
    if (filter === 'low') return r.fraud_level === 'low';
    if (filter === 'medium') return r.fraud_level === 'medium';
    if (filter === 'high') return ['high', 'very_high'].includes(r.fraud_level);
    return true;
  });

  return (
    <div className="page-shell pt-24 pb-12">
      <div className="page-content max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Subscription Requests</h1>
        <p className="text-gray-600">{requests.length} pending requests</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border-l-4 border-red-500">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border-l-4 border-amber-500">
            <p className="text-gray-600 text-sm">Avg Fraud Score</p>
            <p className="text-3xl font-bold text-amber-600">{stats.average_fraud_score?.toFixed(1) || 0}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          {/* Filter controls */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {['all', 'low', 'medium', 'high'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === f
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} Risk {f !== 'all' && `(${requests.filter(r => r.fraud_level === f).length})`}
              </button>
            ))}
          </div>

          {/* Requests cards */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <p className="text-gray-600 text-lg">No pending requests</p>
              </div>
            ) : (
              filteredRequests.map(request => (
                <div
                  key={request.request_id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedRequest?.request_id === request.request_id
                      ? 'border-pink-500 bg-pink-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-pink-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-mono font-bold text-sm text-gray-600">{request.request_id}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {request.plan_type.charAt(0).toUpperCase() + request.plan_type.slice(1)} - ₹{request.amount}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">User: {request.user_id}</p>
                      <p className="text-xs text-gray-600">UTR: {request.payment_id}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold inline-block ${fraudLevelColor(request.fraud_level)}`}>
                        {request.fraud_level.toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-600 mt-2">{request.fraud_score}/100</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        request.fraud_score < 20 ? 'bg-green-500' :
                        request.fraud_score < 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(request.fraud_score, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Submitted: {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Panel */}
        {selectedRequest && (
          <div className="bg-white rounded-lg border-2 border-pink-300 p-6 sticky top-6 h-fit max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Request Details</h2>

            {/* Basic Info */}
            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-600 uppercase">Request ID</p>
                <p className="font-mono font-bold text-sm break-all mt-1">{selectedRequest.request_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase">User ID</p>
                <p className="font-bold text-sm mt-1">{selectedRequest.user_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase">Plan</p>
                <p className="font-bold text-sm capitalize mt-1">{selectedRequest.plan_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase">Amount</p>
                <p className="font-bold text-lg text-pink-600 mt-1">₹{selectedRequest.amount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase">Payment ID (UTR)</p>
                <p className="font-mono font-bold text-sm mt-1">{selectedRequest.payment_id}</p>
              </div>
            </div>

            {/* Fraud Detection */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3">Fraud Detection</h3>
              <div className="mb-3">
                <p className="text-xs text-gray-600 uppercase">Fraud Score</p>
                <p className={`text-3xl font-bold mt-1 ${
                  selectedRequest.fraud_score < 20 ? 'text-green-600' :
                  selectedRequest.fraud_score < 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {selectedRequest.fraud_score}/100
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className={`h-2 rounded-full ${
                    selectedRequest.fraud_score < 20 ? 'bg-green-500' :
                    selectedRequest.fraud_score < 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(selectedRequest.fraud_score, 100)}%` }}
                ></div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${fraudLevelColor(selectedRequest.fraud_level)}`}>
                {selectedRequest.fraud_level.toUpperCase()}
              </span>
              {selectedRequest.fraud_flags && selectedRequest.fraud_flags.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 font-semibold mb-2">Flags:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.fraud_flags.map(flag => (
                      <span key={flag} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Screenshot */}
            {selectedRequest.screenshot_url && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-xs text-gray-600 uppercase mb-2">Payment Screenshot</p>
                <img
                  src={selectedRequest.screenshot_url}
                  alt="Payment proof"
                  className="w-full rounded-lg border border-gray-300 max-h-48 object-cover"
                />
              </div>
            )}

            {/* Approval Notes */}
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Approval notes (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-sm placeholder-gray-500"
              rows="2"
            />

            {/* Rejection Reason */}
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Rejection reason"
              className="w-full px-3 py-2 border border-red-300 rounded-lg mb-4 text-sm placeholder-red-500"
              rows="2"
            />

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleApprove(selectedRequest.request_id)}
                disabled={actionLoading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? '⏳ Processing...' : '✓ Approve Payment'}
              </button>
              <button
                onClick={() => handleReject(selectedRequest.request_id)}
                disabled={actionLoading || !rejectionReason.trim()}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? '⏳ Processing...' : '✕ Reject Payment'}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>💡 Tip:</strong> Check fraud score and flags before making decision. Contact user if payment doesn't match.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionRequests;
