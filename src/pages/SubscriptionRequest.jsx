// src/pages/SubscriptionRequest.jsx
/**
 * User Subscription Request Form
 * Allow users to request and pay for subscription plans
 */

import React, { useState, useRef } from 'react';
import axios from 'axios';

const SubscriptionRequest = () => {
  // State management
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState(1); // 1: plan selection, 2: payment, 3: confirmation
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const fileInputRef = useRef(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 499,
      period: 'month',
      features: [
        'Up to 100 candidates/month',
        'Basic screening',
        '24/7 Support',
        'Email notifications'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 1499,
      period: 'month',
      features: [
        'Up to 500 candidates/month',
        'Advanced screening',
        '24/7 Priority support',
        'Real-time alerts',
        'Custom workflows',
        'Team collaboration (up to 3 users)'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 4999,
      period: 'month',
      features: [
        'Unlimited candidates',
        'AI-powered verification',
        'Dedicated support',
        'Custom integrations',
        'White-label options',
        'Unlimited team members',
        'Advanced analytics'
      ]
    }
  ];

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshotPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmitRequest = async () => {
    // Validation
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    if (!utrNumber.trim()) {
      setError('Please enter UTR/Reference number');
      return;
    }

    if (!senderName.trim()) {
      setError('Please enter sender name');
      return;
    }

    if (!screenshot) {
      setError('Please upload payment screenshot');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to terms and conditions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        setError('Please log in first');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('plan_type', selectedPlan);
      formData.append('amount', plans.find(p => p.id === selectedPlan)?.price);
      formData.append('payment_id', utrNumber);
      formData.append('sender_name', senderName);
      formData.append('payment_method', paymentMethod);
      formData.append('screenshot', screenshot);

      const response = await axios.post(
        'http://localhost:5000/api/subscription/request',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setRequestId(response.data.request_id);
      setSuccess(true);
      setStep(3);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit request. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getPlanDetails = () => plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Subscribe to Datee and unlock full potential</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-8 max-w-2xl">
            {[
              { step: 1, label: 'Select Plan' },
              { step: 2, label: 'Payment' },
              { step: 3, label: 'Confirmation' }
            ].map((s, idx) => (
              <React.Fragment key={s.step}>
                <div className={`flex flex-col items-center ${step >= s.step ? 'text-pink-600' : 'text-gray-400'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                    step >= s.step ? 'bg-pink-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step > s.step ? '✓' : s.step}
                  </div>
                  <p className="font-semibold">{s.label}</p>
                </div>
                {idx < 2 && <div className={`flex-1 h-1 ${step > s.step ? 'bg-pink-600' : 'bg-gray-300'}`}></div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-2xl p-8 cursor-pointer transition transform hover:scale-105 relative ${
                    selectedPlan === plan.id
                      ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-2xl'
                      : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-pink-300'
                  }`}
                >
                  {plan.popular && (
                    <div className={`absolute -top-4 left-0 right-0 mx-auto w-fit px-4 py-1 rounded-full text-sm font-bold ${
                      selectedPlan === plan.id ? 'bg-white text-pink-600' : 'bg-pink-500 text-white'
                    }`}>
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-sm ml-2 opacity-75">/{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-xl mt-0.5">✓</span>
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      selectedPlan === plan.id
                        ? 'bg-white text-pink-600 hover:bg-gray-100'
                        : 'bg-pink-600 text-white hover:bg-pink-700'
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected ✓' : 'Select'}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => window.history.back()}
                className="px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-900 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedPlan}
                className="px-8 py-3 rounded-lg font-semibold bg-pink-600 text-white hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              {/* Plan Summary */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Plan:</p>
                    <p className="font-bold text-lg capitalize">{getPlanDetails()?.name}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Amount:</p>
                    <p className="font-bold text-2xl text-pink-600">₹{getPlanDetails()?.price}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">Billing Period:</p>
                    <p className="font-bold">1 month</p>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Payment Instructions</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h4 className="font-bold text-blue-900 mb-3">Bank Transfer Details</h4>
                  <div className="space-y-2 text-sm text-blue-900">
                    <p><span className="font-semibold">Account Holder:</span> Datee Verification Pvt Ltd</p>
                    <p><span className="font-semibold">Account Number:</span> 1234567890123</p>
                    <p><span className="font-semibold">IFSC Code:</span> HDFC0005678</p>
                    <p><span className="font-semibold">Bank Name:</span> HDFC Bank Limited</p>
                    <p className="mt-3"><span className="font-semibold">UPI ID:</span> datee@hdfc</p>
                    <p className="mt-4 text-xs bg-blue-100 p-2 rounded">
                      ⚠️ <span className="font-semibold">Important:</span> Use your User ID as reference/UTR while making payment
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-6">
                {/* UTR Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    UTR/Reference Number *
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter payment UTR or reference number"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-600 focus:outline-none"
                  />
                  <p className="text-xs text-gray-600 mt-1">This should match the reference you used in bank transfer</p>
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Sender Name *
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Name used for bank transfer"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-600 focus:outline-none"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-600 focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="neft">NEFT</option>
                    <option value="rtgs">RTGS</option>
                  </select>
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Payment Screenshot *
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-600 hover:bg-pink-50 transition"
                  >
                    {screenshotPreview ? (
                      <div className="space-y-2">
                        <img src={screenshotPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                        <p className="text-xs text-gray-600">Click to change image</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-3xl">📸</p>
                        <p className="font-semibold text-gray-900">Click to upload screenshot</p>
                        <p className="text-xs text-gray-600">JPG, PNG (max 5MB)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </div>

                {/* Terms & Conditions */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 mt-1 accent-pink-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that I have submitted correct payment details and screenshot. I understand that false information may result in account suspension.
                  </span>
                </label>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-900 font-semibold">⚠️ {error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between gap-4 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-900 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitRequest}
                    disabled={loading || !agreeTerms || !utrNumber || !senderName || !screenshot}
                    className="px-8 py-3 rounded-lg font-semibold bg-pink-600 text-white hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Payment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && success && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="mb-6">
                <p className="text-6xl mb-4">✓</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Received!</h2>
                <p className="text-xl text-gray-600">Thank you for subscribing to Datee</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-bold text-green-900 mb-4">Request Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <p className="text-gray-700">Request ID:</p>
                    <p className="font-mono font-bold text-green-900">{requestId}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-700">Plan:</p>
                    <p className="font-bold capitalize">{getPlanDetails()?.name}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-700">Amount Paid:</p>
                    <p className="font-bold text-pink-600">₹{getPlanDetails()?.price}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-gray-700">Status:</p>
                    <p className="font-bold text-blue-600">Pending Review</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-bold text-blue-900 mb-3">What's Next?</h3>
                <ul className="space-y-2 text-sm text-blue-900">
                  <li>✓ Our team will verify your payment within 24 hours</li>
                  <li>✓ You'll receive a confirmation email once approved</li>
                  <li>✓ Your subscription will activate immediately after approval</li>
                  <li>✓ Check your email for updates</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mb-8">
                Save your Request ID: <span className="font-mono font-bold text-gray-900">{requestId}</span>
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 px-8 py-3 rounded-lg font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 transition"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectedPlan(null);
                    setUtrNumber('');
                    setSenderName('');
                    setScreenshot(null);
                    setScreenshotPreview('');
                    setError('');
                    setSuccess(false);
                  }}
                  className="flex-1 px-8 py-3 rounded-lg font-semibold bg-pink-600 text-white hover:bg-pink-700 transition"
                >
                  Back to Plans
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRequest;
