// src/components/SubscriptionStatus.jsx
/**
 * Subscription Status Display Component
 * Shows user's current subscription and pending requests
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SubscriptionStatus = ({ userId }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptionStatus();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchSubscriptionStatus, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'http://localhost:5000/api/v1/subscription/status',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSubscriptionData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err.response?.data?.message || 'Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const { status, activeSubscription, pendingRequest } = subscriptionData;

  // Status configuration
  const statusConfig = {
    active: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      icon: '✓',
      label: 'Active'
    },
    pending: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      icon: '⏳',
      label: 'Pending Review'
    },
    rejected: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      icon: '✕',
      label: 'Rejected'
    },
    inactive: {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-800',
      icon: '○',
      label: 'Inactive'
    }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  // Calculate days remaining
  const daysRemaining = activeSubscription
    ? Math.ceil(
        (new Date(activeSubscription.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className={`rounded-2xl shadow-lg p-8 border-2 ${config.borderColor} ${config.bgColor}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Subscription Status</h2>
        <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${config.badgeBg} ${config.badgeText}`}>
          <span className="text-lg">{config.icon}</span>
          {config.label}
        </span>
      </div>

      {/* Active Subscription */}
      {activeSubscription && (
        <div className="bg-white rounded-xl p-6 mb-6 border-l-4 border-green-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {activeSubscription.plan_type} Premium
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Expires On</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date(activeSubscription.expiry_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
              <p className={`text-2xl font-bold ${
                daysRemaining > 7 ? 'text-green-600' : 'text-amber-600'
              }`}>
                {daysRemaining} days
              </p>
            </div>
          </div>

          {/* Success features list */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-3">✓ Premium Features Unlocked:</p>
            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-700">
              <li>✓ Unlimited Chats</li>
              <li>✓ No Ads</li>
              <li>✓ Verified Badge</li>
              <li>✓ Priority Matching</li>
            </ul>
          </div>

          {/* Renewal reminder */}
          {daysRemaining <= 7 && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-amber-900 text-sm">
                <strong>⏰ Renewal Reminder:</strong> Your subscription expires in {daysRemaining} days. 
                <button
                  onClick={() => window.location.href = '/razorpay-checkout'}
                  className="ml-2 text-amber-700 font-bold hover:underline"
                >
                  Renew now
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pending Request */}
      {pendingRequest && (
        <div className="bg-white rounded-xl p-6 mb-6 border-l-4 border-amber-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Request ID</p>
              <p className="font-mono font-bold text-gray-900 text-sm break-all">
                {pendingRequest.request_id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Plan Requested</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {pendingRequest.plan_type} - ₹{pendingRequest.amount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment ID (UTR)</p>
              <p className="font-mono font-bold text-gray-900">{pendingRequest.payment_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Submitted On</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(pendingRequest.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Fraud score indicator */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600">Fraud Detection Score</p>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                pendingRequest.fraud_level === 'low' ? 'bg-green-100 text-green-800' :
                pendingRequest.fraud_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {pendingRequest.fraud_level.toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  pendingRequest.fraud_score < 20 ? 'bg-green-500' :
                  pendingRequest.fraud_score < 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(pendingRequest.fraud_score, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {pendingRequest.fraud_score}/100
            </p>
          </div>

          {/* Wait message */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-900 text-sm">
              <strong>📋 Under Review:</strong> Our team is verifying your payment. 
              Verification usually takes 24-48 hours.
            </p>
          </div>
        </div>
      )}

      {/* Inactive / No subscription */}
      {status === 'inactive' && !activeSubscription && !pendingRequest && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-8 text-center">
          <p className="text-lg text-gray-700 mb-6">
            Unlock premium features and connect with more verified members!
          </p>
          <button
            onClick={() => window.location.href = '/razorpay-checkout'}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition"
          >
            Upgrade to Premium ✨
          </button>
        </div>
      )}

      {/* Rejected status */}
      {status === 'rejected' && (
        <div className="bg-white rounded-xl p-6 border-l-4 border-red-500">
          <p className="text-red-900 mb-4">
            <strong>✕ Your subscription request was rejected.</strong>
          </p>
          {pendingRequest?.rejection_reason && (
            <p className="text-red-800 mb-4">
              <strong>Reason:</strong> {pendingRequest.rejection_reason}
            </p>
          )}
          <p className="text-gray-700 mb-6">
            You can submit a new payment proof and try again. Make sure:
          </p>
          <ul className="text-gray-700 space-y-2 mb-6 text-sm">
            <li>✓ Payment amount matches the plan price</li>
            <li>✓ Payment ID (UTR) is clearly visible</li>
            <li>✓ Screenshot is clear and readable</li>
            <li>✓ Payment was made from your account</li>
          </ul>
          <button
            onClick={() => window.location.href = '/razorpay-checkout'}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-600 transition"
          >
            Try Again →
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchSubscriptionStatus}
            className="text-red-600 hover:text-red-700 font-semibold text-sm mt-2"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
