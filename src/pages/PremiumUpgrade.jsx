import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RazorpayCheckout from '../components/RazorpayCheckout';
import ScrollReveal from '../components/ScrollReveal';

export default function PremiumUpgrade() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [plans] = useState({
    monthly: { amount: 99, type: 'monthly', label: 'Monthly', duration: '1 Month' },
    quarterly: { amount: 299, type: 'quarterly', label: 'Quarterly', duration: '3 Months' },
    yearly: { amount: 999, type: 'yearly', label: 'Yearly', duration: '1 Year' }
  });

  const currentPlan = plans[selectedPlan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-rose-50/30 to-fuchsia-50/20 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/pricing')}
          className="mb-8 flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold"
        >
          ← Back to Pricing
        </button>

        <ScrollReveal className="mb-12 text-center" delayMs={40}>
          <h1 className="text-4xl md:text-5xl font-black text-darkBrown mb-4">
            Upgrade to 
            <span className="block bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">
              SeeU Premium
            </span>
          </h1>
          <p className="text-lg text-softBrown max-w-2xl mx-auto">
            Get instant access to priority visibility, advanced filtering, and everything you need to find meaningful connections faster.
          </p>
        </ScrollReveal>

        {/* Plan Selection */}
        <ScrollReveal className="mb-12" delayMs={100}>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {Object.entries(plans).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === key
                    ? 'border-rose-500 bg-gradient-to-r from-rose-50 to-fuchsia-50 shadow-lg shadow-rose-200/50'
                    : 'border-gray-200 bg-white hover:border-rose-300'
                }`}
              >
                <h3 className="font-bold text-darkBrown">{plan.label}</h3>
                <p className="text-2xl font-black text-rose-600 mt-2">₹{plan.amount}</p>
                <p className="text-xs text-softBrown mt-1">{plan.duration}</p>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Payment Section */}
        <ScrollReveal className="rounded-3xl border border-rose-200/70 bg-white p-8 shadow-[0_18px_50px_rgba(190,24,93,0.08)]" delayMs={140}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-darkBrown mb-4">Complete Your Upgrade</h2>
            
            <div className="space-y-3 mb-8 pb-8 border-b border-gray-100">
              <div className="flex justify-between">
                <span className="text-softBrown">Plan</span>
                <span className="font-semibold text-darkBrown">{currentPlan.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-softBrown">Duration</span>
                <span className="font-semibold text-darkBrown">{currentPlan.duration}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-bold text-darkBrown">Total Amount</span>
                <span className="font-black text-rose-600">₹{currentPlan.amount}</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-8">
              <h3 className="font-bold text-darkBrown mb-3">What You'll Get:</h3>
              <ul className="space-y-2 text-sm text-softBrown">
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span>Priority visibility in discovery algorithm</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span>Advanced filtering and search options</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span>See who liked your profile</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span>Unlimited connection requests</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-500 font-bold">✓</span>
                  <span>Browse profiles anonymously</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Razorpay Checkout */}
          <RazorpayCheckout
            planType={selectedPlan}
            amount={currentPlan.amount}
            onSuccess={() => {
              setTimeout(() => {
                navigate('/dashboard?tab=discover&upgraded=true');
              }, 1500);
            }}
            onError={(err) => {
              console.error('Payment failed:', err);
            }}
          />

          {/* Security Info */}
          <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">🔒 Secure</span> - Your payment is processed securely by Razorpay. Your card details are never stored on our servers.
            </p>
          </div>

          {/* Cancel Subscription Notice */}
          <p className="text-xs text-center text-gray-500 mt-4">
            You can cancel your subscription anytime from your account settings.
          </p>
        </ScrollReveal>

        {/* FAQ */}
        <ScrollReveal className="mt-12 grid md:grid-cols-2 gap-6" delayMs={180}>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-bold text-darkBrown mb-2">Need Help?</h3>
            <p className="text-sm text-softBrown mb-3">Questions about Premium?</p>
            <a href="/contact" className="text-rose-600 hover:text-rose-700 text-sm font-semibold">
              Contact Support →
            </a>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-bold text-darkBrown mb-2">Money-Back Guarantee</h3>
            <p className="text-sm text-softBrown">
              Not satisfied? Request a refund within 7 days of purchase.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
