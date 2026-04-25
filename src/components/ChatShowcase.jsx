import React from 'react';
import { Link } from 'react-router-dom';

export default function ChatShowcase() {
  const features = [
    { icon: '🔒', title: 'End-to-End Encrypted', desc: 'Only you and your match can read messages. Not even we can.' },
    { icon: '⚠️', title: 'Screenshot Detection', desc: 'Screenshot alerts notify your match if photos are captured.' },
    { icon: '🚫', title: 'Block & Report', desc: 'Feel unsafe? Block instantly or report for safety review.' },
    { icon: '✓', title: 'Verified Users Only', desc: 'Chat only with verified people. No anonymous strangers.' },
    { icon: '📸', title: 'Secure Media Sharing', desc: 'Share photos, voice messages, and links safely—all encrypted.' },
    { icon: '🛡️', title: 'Limited Mod Access', desc: 'Our team only reviews flagged reports for safety. No random access.' },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="section-title mb-4">Private Conversations, No Compromises</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            After you match, start a private 1-to-1 conversation. Encrypted, safe, and only between you two.
          </p>
        </div>

        {/* Main Layout: Chat Mockup + Features */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Chat Mockup */}
          <div className="animate-fade-in-left">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 shadow-2xl overflow-hidden">
              {/* Phone Frame */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-darkBrown">
                {/* Status Bar */}
                <div className="bg-gradient-to-r from-blushPink to-softPink px-6 py-4 text-white flex justify-between items-center text-xs">
                  <span>9:41</span>
                  <span>●●●●●</span>
                </div>

                {/* Chat Header */}
                <div className="bg-white px-4 py-3 border-b border-softPink flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blushPink to-softPink flex items-center justify-center text-2xl">
                      👩
                    </div>
                    <div>
                      <p className="font-bold text-darkBrown text-sm">Alexandra</p>
                      <p className="text-xs text-softBrown">🟢 Active now</p>
                    </div>
                  </div>
                  <span className="text-2xl">ℹ️</span>
                </div>

                {/* Messages */}
                <div className="bg-white px-4 py-6 space-y-4 min-h-64 overflow-y-auto">
                  {/* Incoming message */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2 max-w-xs">
                      <p className="text-sm text-darkBrown">Hey! 👋 How's your day going?</p>
                    </div>
                  </div>

                  {/* Outgoing message */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-br from-blushPink to-softPink rounded-2xl rounded-br-none px-4 py-2 max-w-xs">
                      <p className="text-sm text-white">Great! Just finished classes. You?</p>
                    </div>
                  </div>

                  {/* Trust badge */}
                  <div className="flex justify-center my-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2 flex items-center gap-2">
                      <span className="text-lg">🔒</span>
                      <span className="text-xs font-semibold text-blue-700">End-to-end encrypted</span>
                    </div>
                  </div>

                  {/* Incoming message */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2 max-w-xs">
                      <p className="text-sm text-darkBrown">Let's grab coffee this week? ☕</p>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="bg-white px-4 py-4 border-t border-softPink flex gap-2">
                  <input
                    type="text"
                    placeholder="Message..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none"
                    readOnly
                    defaultValue="I'd love that!"
                  />
                  <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blushPink to-softPink flex items-center justify-center text-white font-bold">
                    📤
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Features Grid */}
          <div className="animate-fade-in-right space-y-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-gradient-to-br from-creamyWhite to-warmCream border-2 border-softPink hover:border-blushPink hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{feature.icon}</div>
                  <div>
                    <h4 className="font-bold text-darkBrown mb-1">{feature.title}</h4>
                    <p className="text-sm text-softBrown">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Message */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 border-2 border-blue-200 mb-16 animate-fade-in-up">
          <h3 className="text-xl font-bold text-darkBrown mb-6 text-center">Your Conversations Are Protected</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-4xl mb-3">🔐</p>
              <p className="font-bold text-darkBrown mb-1">Private</p>
              <p className="text-sm text-softBrown">Only between you and your match</p>
            </div>
            <div className="text-center">
              <p className="text-4xl mb-3">🔒</p>
              <p className="font-bold text-darkBrown mb-1">Encrypted</p>
              <p className="text-sm text-softBrown">We can't read them even if we wanted</p>
            </div>
            <div className="text-center">
              <p className="text-4xl mb-3">⚠️</p>
              <p className="font-bold text-darkBrown mb-1">Safe</p>
              <p className="text-sm text-softBrown">Screenshot alerts notify your match</p>
            </div>
            <div className="text-center">
              <p className="text-4xl mb-3">🛡️</p>
              <p className="font-bold text-darkBrown mb-1">Moderated</p>
              <p className="text-sm text-softBrown">Reports reviewed by safety team only</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fade-in-up">
          <h3 className="text-2xl font-bold text-darkBrown mb-4">Ready to Have Real Conversations?</h3>
          <p className="text-lg text-softBrown mb-8 max-w-2xl mx-auto">
            Find your match and start chatting in completely private, encrypted conversations.
          </p>
          <Link to="/signup">
            <button className="btn-primary">Match & Start Chatting 💬</button>
          </Link>
        </div>
      </div>
    </section>
  );
}
