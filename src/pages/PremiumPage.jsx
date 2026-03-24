// src/pages/PremiumPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";

const PremiumPage = () => {
  const [selected, setSelected] = useState('monthly');
  const navigate = useNavigate();

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Premium',
      price: '₹4.99',
      period: '/month',
      features: ['Unlimited chats', 'No ads', 'Verified badge', 'Priority matching']
    },
    {
      id: 'yearly',
      name: 'Yearly Premium',
      price: '₹39.99',
      period: '/year',
      savings: 'Save 33%',
      features: ['Unlimited chats', 'No ads', 'Verified badge', 'Priority matching']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Unlock Premium Features</h1>
          <p className="text-xl text-gray-600">Get instant matches with verified members</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`p-8 rounded-2xl border-2 cursor-pointer transition ${
                selected === plan.id
                  ? 'border-pink-500 bg-pink-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-pink-300'
              }`}
              onClick={() => setSelected(plan.id)}
            >
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              {plan.savings && <p className="text-green-600 font-bold mb-4">{plan.savings}</p>}
              <div className="text-4xl font-bold mb-4">
                {plan.price} <span className="text-lg text-gray-600">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <span className="text-pink-500 font-bold text-lg">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-bold transition ${
                  selected === plan.id
                    ? 'bg-pink-500 text-white hover:bg-pink-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
                onClick={() => navigate('/checkout', { state: { plan: plan.id } })}
              >
                Continue
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
