import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

/**
 * RazorpayCheckout Component
 * 
 * Props:
 * - plan: { name, price, duration, id }
 * - onSuccess: callback function(subscriptionData)
 * - onFailure: callback function(error)
 */
const RazorpayCheckout = ({ plan, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please login first to access payment');
        setLoading(false);
        return;
      }
      const apiBaseUrl = getApiBaseUrl();

      // Step 1: Get Razorpay Key
      const keyResponse = await fetch(`${apiBaseUrl}/api/razorpay/key`);
      if (!keyResponse.ok) throw new Error('Failed to get Razorpay key');
      const keyData = await keyResponse.json();
      const keyId = keyData.data.keyId;

      // Step 2: Create Order
      console.log('📦 Creating Razorpay order...');
      const orderResponse = await fetch(`${apiBaseUrl}/api/razorpay/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: plan.price,
          plan: plan.id,  // Use plan ID (monthly, quarterly, yearly) not display name
          duration: plan.duration || 30,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('❌ Order creation failed:', errorData);
        throw new Error(errorData.message || errorData.data?.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.data.orderId;
      const userEmail = orderData.data.userEmail;
      const userName = orderData.data.userName;

      console.log(`✅ Order created: ${orderId}`);

      // Step 3: Open Razorpay Checkout
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const razorpayOptions = {
        key: keyId,
        amount: plan.price * 100, // Amount in paise
        currency: 'INR',
        order_id: orderId,
        name: 'CU Daters Premium',
        description: `${plan.name} - ${plan.duration || 30} days`,
        image: '/favicon.svg', // Your logo
        prefill: {
          email: userEmail,
          name: userName,
        },
        notes: {
          plan: plan.name || plan.id,
          duration: plan.duration || 30,
        },
        handler: async (response) => {
          try {
            console.log('💳 Payment response received');
            console.log('Payment ID:', response.razorpay_payment_id);

            // Step 4: Verify Payment Signature
            console.log('🔐 Verifying payment signature...');
            const verifyResponse = await fetch(`${apiBaseUrl}/api/razorpay/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: plan.id,  // Use plan ID, not name
                amount: plan.price,
                duration: plan.duration || 30,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            console.log('✅ Payment verified successfully!');
            console.log('Subscription activated:', verifyData.data);

            // Call success callback
            if (onSuccess) {
              onSuccess(verifyData.data);
            }
          } catch (err) {
            console.error('❌ Verification error:', err);
            setError(err.message);
            if (onFailure) {
              onFailure(err);
            }
          }
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment cancelled by user');
            setLoading(false);
            setError('Payment cancelled');
          },
        },
        theme: {
          color: '#ec4899', // Pink color (matching your design)
        },
      };

      console.log('🎯 Opening Razorpay checkout...');
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();

      // Razorpay handles closing, so we don't set loading to false here
    } catch (err) {
      console.error('❌ Error initiating payment:', err);
      const errorMsg = err?.message || err?.toString?.() || 'Payment failed. Please try again.';
      setError(errorMsg);
      setLoading(false);

      if (onFailure) {
        onFailure(err);
      }
    }
  };

  return (
    <div className="razorpay-checkout">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">❌ {error}</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-3 px-6 rounded-lg font-bold text-white transition ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:shadow-lg'
        }`}
      >
        {loading ? '⏳ Processing...' : `💳 Pay ₹${plan.price}`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-2">
        💯 Powered by Razorpay • 🔒 Secure Payment
      </p>
    </div>
  );
};

export default RazorpayCheckout;
