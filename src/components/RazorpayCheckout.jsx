import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import classNames from 'classnames';

export default function RazorpayCheckout({ planType = 'monthly', amount = 99, onSuccess, onError }) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if we're in test mode
    const checkTestMode = async () => {
      try {
        const response = await fetch('/api/razorpay/key');
        const data = await response.json();
        setIsTestMode(data.testMode !== false);
      } catch (err) {
        console.error('Error checking test mode:', err);
      }
    };
    checkTestMode();
  }, []);

  const handlePaymentClick = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please log in to make a payment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get Razorpay Key
      const keyResponse = await fetch('/api/razorpay/key');
      const keyData = await keyResponse.json();
      const keyId = keyData.keyId;

      // Step 2: Create Order
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          planType
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.data.id;

      // Step 3: Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'SeeU-Daters',
        description: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Premium`,
        order_id: orderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || ''
        },
        notes: {
          planType,
          userId: user?._id
        },
        handler: async (response) => {
          try {
            // Step 4: Verify Payment
            const verifyResponse = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planType,
                amount
              })
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            
            // Success!
            if (onSuccess) {
              onSuccess(verifyData.data);
            } else {
              alert('✅ Payment successful! Your subscription is now active.');
              window.location.href = '/dashboard';
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
            if (onError) {
              onError(err);
            }
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled');
          }
        },
        theme: {
          color: '#f472b6' // Rose-500
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError(`Payment failed: ${response.error.description}`);
          setLoading(false);
          if (onError) {
            onError(response.error);
          }
        });
        rzp.open();
      } else {
        throw new Error('Razorpay script not loaded');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed');
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {isTestMode && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-900 font-semibold">
            ⚠️ Test Mode – No real money will be deducted
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Test card: <code className="bg-amber-100 px-2 py-1 rounded">4111 1111 1111 1111</code> (any expiry/CVV)
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      <button
        onClick={handlePaymentClick}
        disabled={loading || !isAuthenticated}
        className={classNames(
          'w-full px-4 py-3 rounded-lg font-semibold text-white transition duration-200',
          {
            'bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:brightness-110 cursor-pointer': !loading && isAuthenticated,
            'bg-gray-400 cursor-not-allowed opacity-60': loading || !isAuthenticated
          }
        )}
      >
        {loading ? 'Processing...' : `Pay ₹${amount}`}
      </button>

      {!isAuthenticated && (
        <p className="text-xs text-gray-500 text-center">
          Please log in to upgrade to premium
        </p>
      )}
    </div>
  );
}
