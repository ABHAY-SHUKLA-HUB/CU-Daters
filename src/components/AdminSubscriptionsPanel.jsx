import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const AdminSubscriptionsPanel = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Load subscriptions on mount
  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Filter subscriptions based on status, search, and sort
  useEffect(() => {
    let filtered = subscriptions;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.senderName?.toLowerCase().includes(term) ||
        sub.paymentId?.toLowerCase().includes(term) ||
        sub.planName?.toLowerCase().includes(term) ||
        sub.userId?.toLowerCase().includes(term)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'amount-high') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'amount-low') {
      filtered.sort((a, b) => a.amount - b.amount);
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, statusFilter, searchTerm, sortBy]);

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken') || 'test-token-123';
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/admin/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.data || []);
      console.log('✅ Subscriptions loaded:', data.data);
    } catch (err) {
      console.error('❌ Error fetching subscriptions:', err);
      setError(err.message || 'Failed to load subscriptions');
      // Use mock data for demo
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Approve subscription
  const handleApprove = async (subId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken') || 'test-token-123';

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/admin/approve/${subId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminNotes: 'Payment verified and approved'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve subscription');
      }

      const data = await response.json();
      console.log('✅ Subscription approved:', data);

      // Update local state with safe property access
      const responseData = data?.data || data || {};
      setSubscriptions(subscriptions.map(sub =>
        sub.id === subId ? { ...sub, status: 'approved', ...responseData } : sub
      ));
      setSelectedSub(null);

      alert(`✅ Subscription approved!\n\nUser: ${responseData.senderName || 'Unknown'}\nPlan: ${responseData.planName || 'Standard'}\nStart Date: ${responseData.startDate || 'N/A'}`);
    } catch (err) {
      console.error('❌ Approval error:', err);
      alert('❌ Failed to approve: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject subscription
  const handleReject = async (subId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('authToken') || 'test-token-123';

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/admin/reject/${subId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminNotes: rejectReason || 'Payment verification failed'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject subscription');
      }

      const data = await response.json();
      console.log('✅ Subscription rejected:', data);

      // Update local state with safe property access
      const responseData = data?.data || data || {};
      setSubscriptions(subscriptions.map(sub =>
        sub.id === subId ? { ...sub, status: 'rejected', ...responseData } : sub
      ));
      setSelectedSub(null);
      setShowRejectModal(false);
      setRejectReason('');

      alert(`❌ Subscription rejected!\n\nUser: ${responseData.senderName || 'Unknown'}\nReason: ${rejectReason || 'Verification failed'}`);
    } catch (err) {
      console.error('❌ Rejection error:', err);
      alert('❌ Failed to reject: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Get statistics
  const stats = {
    total: subscriptions.length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    approved: subscriptions.filter(s => s.status === 'approved').length,
    rejected: subscriptions.filter(s => s.status === 'rejected').length
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-2">💳 Subscription Approvals</h2>
            <p className="text-softBrown">Review and approve payment requests from users</p>
          </div>
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="py-2 px-4 bg-blushPink text-white rounded-lg font-bold hover:bg-pink-600 transition disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-softBrown text-sm">Total Requests</p>
          <p className="text-2xl font-bold text-darkBrown">{stats.total}</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">⏳</div>
          <p className="text-softBrown text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-softBrown text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">❌</div>
          <p className="text-softBrown text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by name, UTR, plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-creamyWhite"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-lg font-bold transition text-sm ${
                  statusFilter === status
                    ? 'bg-blushPink text-white'
                    : 'bg-softPink text-darkBrown hover:bg-blushPink hover:text-white'
                }`}
              >
                {status === 'all' ? '📋 All' :
                 status === 'pending' ? '⏳ Pending' :
                 status === 'approved' ? '✓ Approved' :
                 '❌ Rejected'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-bold text-darkBrown block mb-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-48 px-3 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-creamyWhite"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Highest Amount</option>
              <option value="amount-low">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-2 border-red-300">
          <p className="text-red-800 font-bold">⚠️ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-8">
          <p className="text-softBrown text-lg">⏳ Loading subscriptions...</p>
        </div>
      )}

      {/* Main Content Grid */}
      {!loading && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Subscriptions List */}
          <div className="md:col-span-2">
            <div className="card">
              {filteredSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-softBrown">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-lg">No subscriptions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubscriptions.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedSub?.id === sub.id
                          ? 'border-blushPink bg-pink-50'
                          : 'border-softPink hover:border-blushPink hover:bg-warmCream'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-darkBrown">{sub.senderName}</h3>
                          <p className="text-xs text-softBrown">ID: {sub.id}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${
                          sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sub.status === 'pending' ? '⏳ PENDING' :
                           sub.status === 'approved' ? '✓ APPROVED' :
                           '❌ REJECTED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <p className="text-xs text-softBrown">Plan</p>
                          <p className="font-bold text-darkBrown">{sub.planName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-softBrown">Amount</p>
                          <p className="font-bold text-darkBrown">₹{sub.amount}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-softBrown">UTR</p>
                          <p className="font-bold text-darkBrown font-mono text-xs">{sub.paymentId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-softBrown">Submitted</p>
                          <p className="font-bold text-darkBrown text-xs">{formatDate(sub.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-softBrown mt-6 text-center">
                Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
              </p>
            </div>
          </div>

          {/* Detail Panel */}
          <div>
            <div className="card sticky top-20">
              {selectedSub ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-darkBrown border-b-2 border-softPink pb-3">Details</h3>

                  {/* User Info */}
                  <div>
                    <p className="text-xs text-softBrown font-bold mb-1">USER ID</p>
                    <p className="text-sm font-bold text-darkBrown break-all">{selectedSub.userId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-softBrown font-bold mb-1">SENDER NAME</p>
                    <p className="text-sm font-bold text-darkBrown">{selectedSub.senderName}</p>
                  </div>

                  {/* Plan Info */}
                  <div className="pt-2 border-t border-softPink">
                    <p className="text-xs text-softBrown font-bold mb-1">PLAN</p>
                    <p className="text-sm font-bold text-darkBrown">{selectedSub.planName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-softBrown font-bold mb-1">AMOUNT</p>
                    <p className="text-lg font-bold text-blushPink">₹{selectedSub.amount}</p>
                  </div>

                  {/* Payment Info */}
                  <div className="pt-2 border-t border-softPink">
                    <p className="text-xs text-softBrown font-bold mb-1">PAYMENT ID (UTR)</p>
                    <p className="text-sm font-mono font-bold text-darkBrown break-all">{selectedSub.paymentId}</p>
                  </div>

                  {/* Dates */}
                  <div>
                    <p className="text-xs text-softBrown font-bold mb-1">SUBMITTED</p>
                    <p className="text-sm text-darkBrown">{formatDate(selectedSub.createdAt)}</p>
                  </div>

                  {selectedSub.startDate && (
                    <div>
                      <p className="text-xs text-softBrown font-bold mb-1">APPROVED</p>
                      <p className="text-sm text-darkBrown">{formatDate(selectedSub.startDate)}</p>
                    </div>
                  )}

                  {/* Screenshot Preview */}
                  {selectedSub.screenshotFile && (
                    <div className="pt-2 border-t border-softPink">
                      <button
                        onClick={() => {
                          setPreviewImage(`/uploads/${selectedSub.screenshotFile}`);
                          setShowPreviewModal(true);
                        }}
                        className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition"
                      >
                        📸 View Screenshot
                      </button>
                    </div>
                  )}

                  {/* Status */}
                  <div className="pt-2 border-t border-softPink">
                    <p className="text-xs text-softBrown font-bold mb-1">STATUS</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                      selectedSub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedSub.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedSub.status === 'pending' ? '⏳ PENDING' :
                       selectedSub.status === 'approved' ? '✓ APPROVED' :
                       '❌ REJECTED'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {selectedSub.status === 'pending' && (
                    <div className="pt-3 border-t border-softPink space-y-2">
                      <button
                        onClick={() => handleApprove(selectedSub.id)}
                        disabled={actionLoading}
                        className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition disabled:opacity-50"
                      >
                        {actionLoading ? '⏳ Processing...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedSub(null);
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="w-full mt-2 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-darkBrown rounded-lg font-bold transition"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-softBrown">
                  <div className="text-4xl mb-2">👁️</div>
                  <p>Select a subscription to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-96 overflow-auto">
            <div className="flex justify-between items-center p-4 border-b-2 border-softPink sticky top-0 bg-white">
              <h3 className="font-bold text-darkBrown">Payment Screenshot</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-2xl text-softBrown hover:text-darkBrown transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 text-center">
              <img
                src={previewImage}
                alt="Payment Screenshot"
                className="max-w-full max-h-96 mx-auto rounded-lg"
                onError={() => alert('Error loading image')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b-2 border-softPink">
              <h3 className="font-bold text-darkBrown">Reject Subscription</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="text-2xl text-softBrown hover:text-darkBrown transition"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-softBrown font-bold mb-2">⚠️ Reason for rejection (optional):</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Screenshot unclear, UTR not found, Duplicate submission..."
                  className="w-full p-3 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none resize-none"
                  rows="4"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-darkBrown rounded-lg font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedSub.id)}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {actionLoading ? '⏳ Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsPanel;
