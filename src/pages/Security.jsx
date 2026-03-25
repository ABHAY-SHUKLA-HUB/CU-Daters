import React from 'react';

export default function Security() {
  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-darkBrown text-center mb-4">🔐 Security & Privacy</h1>
          <p className="text-lg text-softBrown text-center mb-12">
            Your safety is our top priority. We use industry-leading security practices to protect your data and conversations.
          </p>

          {/* Security Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 my-12">
            <div className="card">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">End-to-End Encrypted Chats</h3>
              <p className="text-softBrown">All messages are encrypted between you and your match. Not even CU Daters can read your conversations.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Screenshot Detection</h3>
              <p className="text-softBrown">Users are alerted when their messages are screenshotted, protecting sensitive conversations and media.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🆔</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Strict Verification</h3>
              <p className="text-softBrown">Face ID, college email verification, and student ID check ensure only real CU students can join.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Data Protection</h3>
              <p className="text-softBrown">We comply with GDPR, SOC 2, and use encrypted databases to protect all personal information.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🚨</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">Report & Block System</h3>
              <p className="text-softBrown">One-click reporting and blocking. Our safety team reviews reports 24/7 to maintain a safe community.</p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-darkBrown mb-3">No Admin Monitoring</h3>
              <p className="text-softBrown">Your chats are completely private. Admins only review flagged reports—zero proactive monitoring.</p>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="bg-white rounded-2xl p-8 border-2 border-softPink my-12">
            <h2 className="text-2xl font-bold text-darkBrown mb-6">Encryption Standards</h2>
            <ul className="space-y-3 text-softBrown">
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold">✓</span>
                <span><strong>Signal Protocol:</strong> Same encryption standard used by WhatsApp and Signal.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold">✓</span>
                <span><strong>AES-256:</strong> Military-grade encryption for all stored data.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold">✓</span>
                <span><strong>TLS 1.3:</strong> Secure transmission of all communications.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blushPink font-bold">✓</span>
                <span><strong>Perfect Forward Secrecy:</strong> Even if a key is compromised, past messages remain secure.</span>
              </li>
            </ul>
          </div>

          {/* Trust Badges */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-darkBrown mb-6 text-center">Compliance & Certifications</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl mb-2">🔐</div>
                <p className="font-bold text-darkBrown">GDPR Compliant</p>
                <p className="text-sm text-softBrown">Fully compliant with EU data protection regulations</p>
              </div>
              <div>
                <div className="text-4xl mb-2">✓</div>
                <p className="font-bold text-darkBrown">SOC 2 Type II</p>
                <p className="text-sm text-softBrown">Annual third-party security audits</p>
              </div>
              <div>
                <div className="text-4xl mb-2">🛡️</div>
                <p className="font-bold text-darkBrown">End-to-End Encrypted</p>
                <p className="text-sm text-softBrown">All user communications completely private</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold text-darkBrown mb-4">Have Security Questions?</h3>
            <p className="text-softBrown mb-6">Contact our security team at security@cudaters.tech</p>
            <a href="mailto:security@cudaters.tech" className="inline-block px-8 py-3 bg-gradient-to-r from-blushPink to-softPink text-white font-bold rounded-full hover:shadow-lg transition">
              Email Security Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
