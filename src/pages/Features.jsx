import React from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '../components/ScrollReveal';
import LazySection from '../components/LazySection';

export default function Features() {
  const sectionFallback = (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="h-20 rounded-2xl border border-rose-200/60 bg-gradient-to-r from-rose-50 to-fuchsia-50 animate-pulse" />
    </div>
  );

  const features = [
    {
      icon: '✅',
      title: 'Verified Real Profiles',
      desc: 'Email verification, live face detection, government ID checks, and admin review protect authenticity.'
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
      desc: 'Browse compatible profiles nearby first. Expand your discovery radius with premium.'
    },
    {
      icon: '🛡️',
      title: 'Safety First',
      desc: 'Report/block users. Automated content moderation. Verified badges. What happens in chats stays in chats - NO admin monitoring.'
    },
  ];

  return (
    <div className="pt-20 pb-20">
      <section className="bg-[radial-gradient(circle_at_12%_12%,rgba(244,114,182,0.1),transparent_36%),radial-gradient(circle_at_84%_20%,rgba(251,191,36,0.08),transparent_30%),linear-gradient(180deg,#fff_0%,#fff7fb_50%,#fff_100%)] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal delayMs={30}>
            <p className="text-xs uppercase tracking-[0.22em] text-rose-500 font-bold text-center">Product Architecture</p>
            <h1 className="text-5xl md:text-6xl font-black text-darkBrown text-center mt-3">Startup-Grade Feature Stack</h1>
            <p className="text-center max-w-3xl mx-auto text-lg text-softBrown mt-4 leading-relaxed">
              SeeU-Daters combines trust technology, intent-focused matching, and private communication to deliver a safer and higher-quality social experience.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {features.map((feature, idx) => (
              <ScrollReveal key={idx} className="card" delayMs={90 + idx * 60}>
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-darkBrown mb-3">{feature.title}</h3>
                <p className="text-softBrown">{feature.desc}</p>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-10 rounded-2xl border border-rose-200/70 bg-white p-5 flex flex-wrap items-center justify-between gap-3" delayMs={120}>
            <p className="text-sm text-darkBrown font-semibold">Want the full experience with higher visibility and smarter control?</p>
            <Link to="/pricing" className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-sm font-bold hover:brightness-110 transition">Compare Plans</Link>
          </ScrollReveal>
        </div>
      </section>

      <LazySection fallback={sectionFallback}>
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal delayMs={40}>
              <h2 className="text-4xl font-black text-darkBrown text-center">Verification Process</h2>
              <p className="text-center text-softBrown mt-3">Strict verification standards create a trusted network from day one.</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-5 gap-4 mt-12">
              {[
                { step: 1, title: 'Email Signup', desc: 'Any valid email' },
                { step: 2, title: 'OTP Verify', desc: 'Mobile verification' },
                { step: 3, title: 'Face Detect', desc: 'Selfie + anti-spoofing' },
                { step: 4, title: 'ID Upload', desc: 'Government ID card' },
                { step: 5, title: 'Approved!', desc: 'Admin verification' },
              ].map((item, idx) => (
                <ScrollReveal key={idx} className="text-center" delayMs={100 + idx * 70}>
                  <div className="bg-blushPink text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-darkBrown">{item.title}</h4>
                  <p className="text-sm text-softBrown">{item.desc}</p>
                </ScrollReveal>
              ))}            </div>
          </div>
        </section>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <section className="py-16 px-4 bg-warmCream">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal delayMs={40}>
              <h2 className="text-4xl font-black text-darkBrown text-center">How Anonymous Reveals Work</h2>
            </ScrollReveal>

            <div className="max-w-3xl mx-auto mt-12 space-y-4">
              {[
                { msgs: '1-10', reveal: 'First letter of name', emoji: '🔒' },
                { msgs: '11-20', reveal: 'First name + Age', emoji: '📛' },
                { msgs: '21-30', reveal: 'Course + Year', emoji: '🎓' },
                { msgs: '31-40', reveal: 'Photo (50% unblur)', emoji: '📸' },
                { msgs: '41-50', reveal: 'Full photo + Full name', emoji: '👤' },
                { msgs: '50+', reveal: 'Complete profile visible', emoji: '✨' },
              ].map((item, idx) => (
                <ScrollReveal key={idx} delayMs={90 + idx * 55} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
                  <div className="text-3xl min-w-fit">{item.emoji}</div>
                  <div className="flex-1">
                    <strong className="text-darkBrown">Messages {item.msgs}</strong>
                    <p className="text-softBrown">{item.reveal}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </LazySection>

      <LazySection fallback={sectionFallback}>
        <section className="py-16 px-4 bg-softPink">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal delayMs={40}>
              <h2 className="text-3xl font-bold text-darkBrown mb-6">🔐 Privacy is Sacred</h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-8">
              <ScrollReveal className="bg-white p-6 rounded-lg" delayMs={90}>
                <h4 className="text-lg font-bold text-darkBrown mb-2">✅ You Have</h4>
                <ul className="text-left text-softBrown space-y-2">
                  <li>✓ Full control of your profile visibility</li>
                  <li>✓ Block/report bad actors immediately</li>
                  <li>✓ All chats encrypted and private</li>
                  <li>✓ Delete account anytime</li>
                </ul>
              </ScrollReveal>
              <ScrollReveal className="bg-white p-6 rounded-lg" delayMs={150}>
                <h4 className="text-lg font-bold text-darkBrown mb-2">❌ Admin Cannot</h4>
                <ul className="text-left text-softBrown space-y-2">
                  <li>✗ Read your private messages</li>
                  <li>✗ View your private photos</li>
                  <li>✗ Monitor your chats</li>
                  <li>✗ Share your data with anyone</li>
                </ul>
              </ScrollReveal>
            </div>

            <ScrollReveal className="mt-10 flex flex-wrap justify-center gap-3" delayMs={180}>
              <Link to="/signup" className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white font-bold hover:brightness-110 transition">Join SeeU-Daters</Link>
              <Link to="/pricing" className="px-6 py-3 rounded-full border-2 border-rose-300 text-rose-600 font-bold hover:bg-white/60 transition">See Pricing</Link>
            </ScrollReveal>
          </div>
        </section>
      </LazySection>
    </div>
  );
}

