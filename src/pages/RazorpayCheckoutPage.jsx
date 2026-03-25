import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RazorpayCheckout from '../components/RazorpayCheckout';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const RazorpayCheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Plan selection, 2: Payment, 3: Success

  // Default plan if not passed in state
  const defaultPlan = {
    id: 'premium',
    name: 'Premium',
    price: 99, // INR
    duration: 30,
    features: ['Unlimited likes', 'See who liked you', 'No ads', 'Verified badge', 'Priority matching'],
  };

  const plan = location.state?.plan || defaultPlan;

  const plans = [
    {
      id: 'premium',
      name: 'Premium',
      price: 99,
      duration: 30,
      features: ['Unlimited likes', 'See who liked you', 'No ads', 'Verified badge', 'Priority matching'],
      description: 'Unlock all features and connect with verified members',
    },
  ];

  const handlePaymentSuccess = async (subscriptionData) => {
    console.log('✅ Payment successful!', subscriptionData);
    setStep(3);

    // Optional: Refresh user data to reflect new subscription status
    setTimeout(() => {
      // Navigate to dashboard after 2 seconds
      navigate('/dashboard', { replace: true });
    }, 2000);
  };

  const handlePaymentFailure = (error) => {
    console.error('❌ Payment failed:', error);
    // User stays on page and can retry
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Upgrade to Premium</h1>
          <p className="text-lg text-gray-600">Unlock exclusive features and connect with verified members</p>
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Plan Selection */}
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setStep(2)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition transform hover:scale-105 ${
                    plan.id === p.id
                      ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-pink-300'
                  }`}
                >
                  {p.badge && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                  <p className="text-3xl font-bold text-pink-600 mb-1">₹{p.price}</p>
                  <p className="text-sm text-gray-600 mb-4">{p.description}</p>

                  <ul className="space-y-2 mb-6">
                    {p.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-pink-500 font-bold mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className="w-full py-2 rounded-lg font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:shadow-lg transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStep(2);
                    }}
                  >
                    Select Plan
                  </button>
                </div>
              ))}
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-bold text-gray-900 mb-1">100% Secure</h4>
                <p className="text-sm text-gray-600">Encrypted by Razorpay</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">⏸️</div>
                <h4 className="font-bold text-gray-900 mb-1">Cancel Anytime</h4>
                <p className="text-sm text-gray-600">No hidden charges</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl mb-2">✨</div>
                <h4 className="font-bold text-gray-900 mb-1">Instant Access</h4>
                <p className="text-sm text-gray-600">Features enabled immediately</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            {/* Plan Summary */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl mb-8">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Plan:</span>
                  <span className="font-bold text-gray-900">
                    {plans.find((p) => p.id === plan.id)?.name || 'Premium'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duration:</span>
                  <span className="font-bold text-gray-900">
                    {plan.duration} days
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-pink-600">₹{plan.price}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4">Payment Method</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">💳 Razorpay Secure Checkout</p>
                <p className="text-xs text-gray-500">
                  You'll be redirected to Razorpay to complete your payment securely.
                </p>
              </div>
            </div>

            {/* Razorpay Button */}
            <RazorpayCheckout
              plan={plan}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
            />

            {/* Back Button */}
            <button
              onClick={() => setStep(1)}
              className="w-full mt-4 py-2 text-gray-600 font-semibold hover:text-gray-900 transition"
            >
              ← Back to Plans
            </button>

            {/* Security Info */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>🔐 Your payment information is secure and encrypted by Razorpay</p>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your subscription is now active. You can enjoy all premium features immediately.
            </p>

            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-green-900 mb-4">🎉 What's Unlocked:</h3>
              <ul className="space-y-2 text-left text-green-900">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Unlimited chats with matches</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Ad-free experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Verified member badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Priority matching algorithm</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg transition"
            >
              Go to Dashboard →
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Redirecting to dashboard in a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayCheckoutPage;
