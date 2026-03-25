import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import useSupportContactConfig from '../hooks/useSupportContactConfig';
import pricingApi from '../services/pricingApi';

const PaymentCheckoutFinal = () => {
  const contactConfig = useSupportContactConfig();
  const supportEmail = contactConfig.supportEmail || 'support@cudaters.in';
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log('PaymentCheckoutFinal rendered');
  console.log('Location state:', location.state);
  
  const plan = location.state?.plan || {
    id: 'default-plan',
    name: 'Monthly Plan',
    price: '₹99',
    period: '/month',
    duration: '30 days',
  };

  const numericPrice = typeof plan.price === 'string' 
    ? parseInt(plan.price.replace(/[^\d]/g, '') || '99') 
    : (plan.price || 99);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentId, setPaymentId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [senderName, setSenderName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const loadPricing = async () => {
      try {
        const config = await pricingApi.getPricingConfig();
        if (mounted) {
          setPaymentConfig(config?.payment || null);
        }
      } catch (err) {
        console.error('Failed to load pricing config:', err);
      } finally {
        if (mounted) {
          setConfigLoading(false);
        }
      }
    };

    loadPricing();
    return () => {
      mounted = false;
    };
  }, []);

  const paymentMethods = paymentConfig?.methods || {};
  const bankMethod = paymentMethods.bank || {};
  const upiMethod = paymentMethods.upi || {};
  const qrMethod = paymentMethods.qr || {};
  const isBankEnabled = bankMethod.enabled !== false;
  const isUpiEnabled = upiMethod.enabled !== false;
  const isQrEnabled = qrMethod.enabled !== false;
  const upiId = upiMethod.id || 'campusconnect@upi';
  const accountHolder = bankMethod.accountHolder || 'CU Daters Pvt Ltd';
  const bankName = bankMethod.bankName || 'HDFC Bank';
  const accountNumber = bankMethod.accountNumber || '1234567890123456';
  const ifscCode = bankMethod.ifscCode || 'HDFC0005678';
  const paymentInstructions = paymentConfig?.paymentInstructions || 'Use your payment ID/UTR while submitting your proof for faster review.';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Only JPG and PNG allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size max 5MB');
      return;
    }

    setScreenshot(file);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshotPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!paymentId.trim()) {
      setError('Payment ID required');
      return;
    }

    if (!senderName.trim()) {
      setError('Sender name required');
      return;
    }

    if (!screenshot) {
      setError('Screenshot required');
      return;
    }

    if (!agreeTerms) {
      setError('Accept terms first');
      return;
    }

    setLoading(true);

    try {
      // Check for token with both possible keys (auth_token or authToken)
      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      
      // Get userId from current_user object
      const userJson = localStorage.getItem('current_user');
      let userId = null;
      
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          userId = userData._id || userData.id;
        } catch (e) {
          console.error('Failed to parse current_user:', e);
        }
      }

      if (!token || !userId) {
        console.error('❌ Missing auth. Token:', !!token, 'UserId:', !!userId);
        setError('Please login first to submit payment');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('plan', plan.name);  // Backend expects 'plan' field
      formData.append('amount', numericPrice);
      formData.append('paymentId', paymentId.toUpperCase());
      formData.append('senderName', senderName);
      formData.append('screenshot', screenshot);

      console.log('📤 Submitting payment request...');
      
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/subscriptions/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Payment submitted successfully!');
        // Clear form but DON'T navigate away - stay on confirmation
        setPaymentId('');
        setSenderName('');
        setScreenshot(null);
        setScreenshotPreview('');
        setAgreeTerms(false);
        // Move to confirmation step
        setStep(3);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Submission failed' }));
        console.error('❌ Backend error:', errorData);
        setError(errorData.message || 'Submission failed. Please check your payment details.');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setError(`Network error: ${err.message}. Please check your internet connection and try again.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-pink-600 hover:text-pink-700 font-semibold mb-6"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Checkout</h1>
          <p className="text-gray-600">Complete your {plan.name} subscription</p>
        </div>

        {/* Step 1: Instructions */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Plan Info */}
            <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-6 rounded-xl mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="text-2xl font-bold text-pink-600">{plan.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-pink-600">₹{numericPrice}</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Payment Details</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {isUpiEnabled ? <span className="inline-flex rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">UPI Enabled</span> : null}
                {isBankEnabled ? <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Bank Transfer Enabled</span> : null}
                {isQrEnabled ? <span className="inline-flex rounded-full border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">QR Enabled</span> : null}
                {configLoading ? <span className="inline-flex rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">Syncing admin payment config...</span> : null}
              </div>
              <div className="space-y-3 bg-blue-50 p-6 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-700">Account Holder:</span>
                  <span className="font-bold">{accountHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Bank:</span>
                  <span className="font-bold">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Account:</span>
                  <span className="font-mono font-bold">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">IFSC:</span>
                  <span className="font-mono font-bold">{ifscCode}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-blue-200">
                  <span className="text-gray-700">UPI ID:</span>
                  <span className="font-mono font-bold">{upiId}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg mb-8">
              <h2 className="text-lg font-bold text-green-900 mb-4">📋 Steps:</h2>
              <ol className="space-y-2 text-green-900">
                <li>1️⃣ Transfer ₹{numericPrice} using your enabled payment method</li>
                {isUpiEnabled ? <li>2️⃣ Use UPI ID: <span className="font-bold">{upiId}</span></li> : <li>2️⃣ Use bank transfer details shown above</li>}
                <li>3️⃣ Note the Payment ID (UTR) from your bank</li>
                <li>4️⃣ Take a screenshot of payment confirmation</li>
                <li>5️⃣ Upload it in the next step</li>
              </ol>
              <p className="text-xs text-green-800/90 mt-3">{paymentInstructions}</p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition"
            >
              I've Made the Payment → Next
            </button>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment ID */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Payment ID (UTR) *
                </label>
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value.toUpperCase())}
                  placeholder="e.g., UTR123456789012"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-600 focus:outline-none"
                />
                <p className="text-xs text-gray-600 mt-1">12 character UTR from your bank</p>
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Sender Name *
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-600 focus:outline-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Payment Screenshot *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-pink-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-600 hover:bg-pink-50 transition"
                >
                  {screenshotPreview ? (
                    <div>
                      <img src={screenshotPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg mb-3" />
                      <p className="text-sm text-pink-600 font-semibold">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">📸</p>
                      <p className="font-bold text-gray-900">Click to upload</p>
                      <p className="text-xs text-gray-600 mt-1">JPG or PNG (max 5MB)</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 mt-1 accent-pink-600"
                />
                <span className="text-sm text-gray-700">
                  I confirm payment details are correct.
                </span>
              </label>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-lg font-bold border-2 border-gray-300 text-gray-900 hover:bg-gray-100 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !agreeTerms || !paymentId || !screenshot}
                  className="px-6 py-3 rounded-lg font-bold bg-pink-600 text-white hover:bg-pink-700 transition disabled:opacity-50"
                >
                  {loading ? '⏳ Submitting...' : '✓ Submit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-2xl mx-auto">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                <span className="text-5xl">✅</span>
              </div>
              <h2 className="text-3xl font-bold text-green-700 mb-2">Payment Request Received!</h2>
              <p className="text-gray-600 text-lg">We've successfully received your payment request</p>
            </div>

            {/* Plan Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-8 text-left">
              <h3 className="font-bold text-gray-900 mb-4">Subscription Details:</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Plan:</span>
                  <span className="font-bold text-pink-600">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-bold text-pink-600">₹{numericPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Payment ID:</span>
                  <span className="font-mono font-bold text-gray-900">{paymentId.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Main Message */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-8 mb-8">
              <p className="text-lg font-bold text-green-900 leading-relaxed">
                ✨ Your payment request has been sent for approval. Your subscription will be activated within 30 minutes. Thank you for your patience! ✨
              </p>
            </div>

            {/* What Happens Next */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-bold text-blue-900 mb-4">📋 What Happens Next?</h3>
              <ol className="space-y-3 text-blue-900">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                  <span>Our team will verify your payment details within 30 minutes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                  <span>You'll receive a confirmation email when your subscription is activated</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                  <span>Your subscription benefits will be active immediately</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                  <span>You can track the status in your account dashboard</span>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                📊 View Dashboard
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg font-bold bg-gray-100 text-gray-900 hover:bg-gray-200 transition transform hover:scale-105 flex items-center justify-center gap-2"
              >
                🏠 Back to Home
              </button>
            </div>

            {/* Support Info */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-bold">Need help?</span> Contact our support team at{' '}
                <a href={`mailto:${supportEmail}`} className="text-pink-600 hover:underline font-semibold">
                  {supportEmail}
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCheckoutFinal;
