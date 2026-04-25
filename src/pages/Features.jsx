import React from 'react';

export default function Features() {
  const features = [
    {
      icon: '🎓',
      title: 'Verified CU Students',
      desc: 'Only emails from @culkomail.in & @cumail.in are accepted. Live face detection, Student ID verification, and admin approval required.'
    },
    {
      icon: '🤫',
      title: 'Anonymous Chat System',
      desc: 'Chat completely anonymous. Profiles reveal gradually: First letter (msg 1-10) → Full name (msg 11-20) → Full profile (50+ msgs)'
    },
    {
      icon: '❤️',
      title: 'Swipe & Match',
      desc: '10 free likes per day. Super Like feature for premium. Get notified when both users like each other.'
    },
    {
      icon: '😂',
      title: 'Anonymous Crush',
      desc: 'Send anonymous crush to anyone. If they send back → mutual reveal! Free users: 1/week, Premium: 5/month'
    },
    {
      icon: '🎯',
      title: 'Interest-Based Matching',
      desc: 'Our algorithm learns from your behavior to suggest better matches based on interests, course, and vibes.'
    },
    {
      icon: '🚀',
      title: 'Premium Features',
      desc: 'Unlimited likes, see who liked you, advanced filters, read receipts, incognito mode, and message before match.'
    },
    {
      icon: '🔍',
      title: 'Explore & Nearby',
      desc: 'Browse profiles from your college first. Unlock nearby colleges (top 30) to expand your options with premium.'
    },
    {
      icon: '🛡️',
      title: 'Safety First',
      desc: 'Report/block users. Automated content moderation. Verified badges. What happens in chats stays in chats - NO admin monitoring.'
    },
  ];

  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="section-title text-center">🔥 Core Features</h1>
          <p className="section-subtitle text-center max-w-3xl mx-auto">
            Designed specifically for Chandigarh University students to find meaningful connections safely and anonymously.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {features.map((feature, idx) => (
              <div key={idx} className="card">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-darkBrown mb-3">{feature.title}</h3>
                <p className="text-softBrown">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authentication Flow */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">Verification Process</h2>
          <p className="section-subtitle text-center">Strict verification ensures a safe community</p>

          <div className="grid md:grid-cols-5 gap-4 mt-12">
            {[
              { step: 1, title: 'Email Signup', desc: 'CU email only' },
              { step: 2, title: 'OTP Verify', desc: 'Mobile verification' },
              { step: 3, title: 'Face Detect', desc: 'Selfie + anti-spoofing' },
              { step: 4, title: 'ID Upload', desc: 'Student ID card' },
              { step: 5, title: 'Approved!', desc: 'Admin verification' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-blushPink text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  {item.step}
                </div>
                <h4 className="font-bold text-darkBrown">{item.title}</h4>
                <p className="text-sm text-softBrown">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Reveal System */}
      <section className="py-16 px-4 bg-warmCream">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title text-center">How Anonymous Reveals Work</h2>
          
          <div className="max-w-3xl mx-auto mt-12 space-y-4">
            {[
              { msgs: '1-10', reveal: 'First letter of name', emoji: '🔒' },
              { msgs: '11-20', reveal: 'First name + Age', emoji: '📛' },
              { msgs: '21-30', reveal: 'Course + Year', emoji: '🎓' },
              { msgs: '31-40', reveal: 'Photo (50% unblur)', emoji: '📸' },
              { msgs: '41-50', reveal: 'Full photo + Full name', emoji: '👤' },
              { msgs: '50+', reveal: 'Complete profile visible', emoji: '✨' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
                <div className="text-3xl min-w-fit">{item.emoji}</div>
                <div className="flex-1">
                  <strong className="text-darkBrown">Messages {item.msgs}</strong>
                  <p className="text-softBrown">{item.reveal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="py-16 px-4 bg-softPink">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-darkBrown mb-8">🔐 Privacy is Sacred</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h4 className="text-lg font-bold text-darkBrown mb-4 flex items-center justify-center gap-2">
                <span className="text-2xl">✅</span> Your Controls
              </h4>
              <ul className="text-left text-softBrown space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">•</span>
                  <span>Full control over who sees your profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">•</span>
                  <span>Instant block and report for any user</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">•</span>
                  <span>All conversations encrypted and private</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold mt-0.5">•</span>
                  <span>Delete your account anytime with one click</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
              <h4 className="text-lg font-bold text-darkBrown mb-4 flex items-center justify-center gap-2">
                <span className="text-2xl">❌</span> Platform Does Not
              </h4>
              <ul className="text-left text-softBrown space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span>Have access to your private messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span>Have ability to view your private photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span>Monitor your chats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span>Share your data with third parties</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
