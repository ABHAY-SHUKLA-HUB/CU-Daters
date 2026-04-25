// src/pages/FullShowcase.jsx
/**
 * Complete Website Showcase
 * View all pages and features in one place
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FullShowcase = () => {
  const [activeCategory, setActiveCategory] = useState('user');

  const userPages = [
    { name: '🏠 होम', path: '/', description: 'मुख्य पृष्ठ' },
    { name: '✨ फीचर्स', path: '/features', description: 'सभी features' },
    { name: '💰 प्राइसिंग', path: '/pricing', description: 'सभी plans' },
    { name: '📖 About', path: '/about', description: 'कंपनी के बारे में' },
    { name: '📞 संपर्क', path: '/contact', description: 'Contact करें' },
    { name: '🔐 Login', path: '/login', description: 'यूजर लॉगिन' },
    { name: '📝 Signup', path: '/signup', description: 'नया अकाउंट बनाएं' },
    { name: '👤 Dashboard', path: '/dashboard', description: 'यूजर डैशबोर्ड' },
    { name: '💬 Chat', path: '/chat', description: 'Chat पेज' },
    { name: '🎁 Premium', path: '/premium', description: 'प्रीमियम फीचर्स' },
    { name: '🛒 Checkout', path: '/checkout', description: 'Payment Checkout' },
    { name: '🔔 Pending', path: '/pending-approval', description: 'Pending Approval' },
  ];

  const adminPages = [
    { name: '🔑 Admin Login', path: '/admin-login', description: 'Admin लॉगिन', isNew: false },
    { name: '📊 Dashboard', path: '/admin-dashboard', description: 'Admin डैशबोर्ड', isNew: false },
    { name: '💳 Subscriptions', path: '/admin/subscriptions', description: 'सब्सक्रिप्शन requests (नया)', isNew: true },
    { name: '👁️ Chat Monitor', path: '/admin-chat-monitor', description: 'Chat monitoring', isNew: false },
    { name: '📋 Activity Log', path: '/admin-activity-log', description: 'User activity log', isNew: false },
    { name: '📈 Reports', path: '/admin-reports-moderation', description: 'Reports & Moderation', isNew: false },
    { name: '📊 Analytics', path: '/admin-analytics-dashboard', description: 'Analytics Dashboard', isNew: false },
  ];

  const newFeatures = [
    {
      name: '💳 सब्सक्राइबर सिस्टम',
      path: '/subscribe',
      description: 'यूजर सब्सक्रिप्शन request फॉर्म - 3-स्टेप प्रोसेस',
      features: ['Plan selection', 'Payment details', 'Screenshot upload', 'Confirmation'],
      isNew: true,
      icon: '🎯'
    },
    {
      name: '👨‍💼 Admin Approval Panel',
      path: '/admin/subscriptions',
      description: 'सब्सक्रिप्शन requests को approve/reject करें',
      features: ['Pending requests', 'Fraud detection', 'Real-time stats', 'Screenshot review'],
      isNew: true,
      icon: '⚡'
    },
    {
      name: '🛒 QR Code Payment',
      path: '/checkout',
      description: 'UPI QR Code से payment लें',
      features: ['Dynamic QR code', 'UPI integration', 'Amount pre-fill', 'Screenshot proof'],
      isNew: true,
      icon: '📱'
    },
  ];

  const legalPages = [
    { name: '🔒 Privacy Policy', path: '/privacy', description: 'गोपनीयता नीति' },
    { name: '⚖️ Terms & Conditions', path: '/terms', description: 'शर्तें और नियम' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-3">🌍 SEEU-DATERS - पूरी Website</h1>
          <p className="text-xl text-pink-100">एक जगह पर सभी pages और features देखें</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* ⭐ नए Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            ⭐ नई Features (अभी जोड़े थे)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newFeatures.map((feature) => (
              <Link
                key={feature.path}
                to={feature.path}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition p-6 border-2 border-pink-200"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.name}
                  <span className="ml-2 px-2 py-1 bg-pink-500 text-white text-xs rounded-full">NEW</span>
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="space-y-1 mb-4">
                  {feature.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-pink-500">✓</span> {f}
                    </div>
                  ))}
                </div>
                <button className="w-full bg-pink-500 text-white py-2 rounded-lg font-semibold group-hover:bg-pink-600 transition">
                  लिंक खोलें →
                </button>
              </Link>
            ))}
          </div>
        </section>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { id: 'user', label: '👥 यूजर Pages', count: userPages.length },
            { id: 'admin', label: '🔐 Admin Pages', count: adminPages.length },
            { id: 'legal', label: '⚖️ Legal', count: legalPages.length },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeCategory === cat.id
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-pink-500'
              }`}
            >
              {cat.label} <span className="ml-2 bg-gray-200 px-2 py-1 rounded-full text-sm">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {activeCategory === 'user' &&
            userPages.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-102 transition p-6 border-l-4 border-blue-500"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{page.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{page.description}</p>
                <div className="text-xs text-gray-500 font-mono mb-3">{page.path}</div>
                <button className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold text-sm hover:bg-blue-600 transition">
                  खोलें →
                </button>
              </Link>
            ))}

          {activeCategory === 'admin' &&
            adminPages.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-102 transition p-6 border-l-4 ${
                  page.isNew ? 'border-pink-500 bg-pink-50' : 'border-red-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{page.name}</h3>
                  {page.isNew && <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded-full font-bold">NEW</span>}
                </div>
                <p className="text-gray-600 text-sm mb-4">{page.description}</p>
                <div className="text-xs text-gray-500 font-mono mb-3">{page.path}</div>
                <button className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold text-sm hover:bg-red-600 transition">
                  खोलें →
                </button>
              </Link>
            ))}

          {activeCategory === 'legal' &&
            legalPages.map((page) => (
              <Link
                key={page.path}
                to={page.path}
                className="bg-white rounded-xl shadow-md hover:shadow-xl hover:scale-102 transition p-6 border-l-4 border-gray-500"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{page.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{page.description}</p>
                <div className="text-xs text-gray-500 font-mono mb-3">{page.path}</div>
                <button className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold text-sm hover:bg-gray-600 transition">
                  खोलें →
                </button>
              </Link>
            ))}
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-pink-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Website Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">यूजर Pages</p>
              <p className="text-3xl font-bold text-blue-600">{userPages.length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Admin Pages</p>
              <p className="text-3xl font-bold text-red-600">{adminPages.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">नई Features</p>
              <p className="text-3xl font-bold text-green-600">{newFeatures.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">कुल Pages</p>
              <p className="text-3xl font-bold text-purple-600">{userPages.length + adminPages.length + legalPages.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">⚡ सबसे महत्वपूर्ण Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { path: '/', label: '🏠 होम' },
              { path: '/subscribe', label: '💳 Subscribe' },
              { path: '/admin/subscriptions', label: '👨‍💼 Admin' },
              { path: '/checkout', label: '🛒 Checkout' },
              { path: '/dashboard', label: '👤 Dashboard' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 py-3 px-4 rounded-lg font-bold transition backdrop-blur"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="mb-2">✨ आपकी SEEU-DATERS Website पूरी तरह तैयार है!</p>
          <p className="text-sm">सभी features उपलब्ध हैं - client को दिखाने के लिए तैयार</p>
        </div>
      </div>
    </div>
  );
};

export default FullShowcase;
