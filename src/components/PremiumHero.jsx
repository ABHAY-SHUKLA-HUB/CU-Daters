import React from 'react';
import { Link } from 'react-router-dom';
import DualMockupPreview from './DualMockupPreview';
import heroImage from '../assets/hero.png';

/**
 * PREMIUM HERO COMPONENT - SERIES A LEVEL
 * 
 * Improvements over previous version:
 * ✓ Emotionally resonant headline "Your People Are Here"
 * ✓ Specific subheadline with product loop (Discover → Match → Chat)
 * ✓ Enhanced trust positioning with verification steps
 * ✓ Richer color palette (deeper magenta, purple, emerald accents)
 * ✓ Dual-screen mockup (discovery + matched chat)
 * ✓ Premium depth effects (shadows, glassmorphism, blur)
 * ✓ Smooth micro-interactions (stagger animations, hover effects)
 * ✓ Stronger CTA with reduced friction messaging
 * ✓ Social proof integration
 * ✓ Mobile-first responsive design
 */

export default function PremiumHero() {
  return (
    <div className="relative overflow-hidden">
      {/* ANIMATED BACKGROUND BLOB */}
      <div className="absolute inset-0 -z-10 opacity-40 blur-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-softPink to-purple-200 rounded-full animate-float"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blushPink to-yellow-100 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* HERO SECTION */}
      <section className="min-h-screen bg-gradient-to-br from-creamyWhite via-white to-purple-50 pt-40 pb-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* CONTENT GRID */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* LEFT: COPY & CTAs */}
            <div className="space-y-6 animate-fade-in-left">
              {/* ===== PREMIUM BADGE ===== */}
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blushPink via-softPink to-purple-200 text-white px-5 py-3 rounded-full font-bold shadow-lg backdrop-blur-sm border border-white border-opacity-20 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <span className="text-lg animate-pulse">🎓</span>
                <span className="text-sm font-semibold">Verified through • Face ID • Email • Student ID</span>
              </div>

              {/* ===== HEADLINE ===== */}
              <h1 className="text-6xl md:text-7xl font-black text-darkBrown leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Your People <br className="hidden md:block" />
                Are Here
              </h1>

              {/* ===== SUBHEADLINE ===== */}
              <p className="text-2xl text-softBrown font-bold leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Find real people from your campus. Match instantly. Chat privately.
              </p>

              {/* ===== VALUE PROPOSITION ===== */}
              <p className="text-lg text-softBrown leading-relaxed font-medium animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                It's like Tinder met a verification system and agreed a private chat app should exist. Built by college students. <span className="font-bold">For college students.</span>
              </p>

              {/* ===== ADVANCED TRUST POSITIONING ===== */}
              <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <p className="text-sm font-bold text-darkBrown uppercase tracking-wide">Why Students Trust Us</p>
                <div className="grid gap-3">
                  {/* Trust Chip 1 */}
                  <div className="flex items-start gap-3 p-4 bg-white bg-opacity-70 backdrop-blur-sm rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                    <span className="text-2xl">🔐</span>
                    <div>
                      <p className="font-bold text-darkBrown text-sm group-hover:text-blushPink transition">Messages Are Yours Alone</p>
                      <p className="text-xs text-softBrown">End-to-End Encrypted • We can't read them</p>
                    </div>
                  </div>

                  {/* Trust Chip 2 */}
                  <div className="flex items-start gap-3 p-4 bg-white bg-opacity-70 backdrop-blur-sm rounded-xl border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer group">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-bold text-darkBrown text-sm group-hover:text-blushPink transition">Screenshot Protected</p>
                      <p className="text-xs text-softBrown">Sender gets alerted • Your privacy matters</p>
                    </div>
                  </div>

                  {/* Trust Chip 3 */}
                  <div className="flex items-start gap-3 p-4 bg-white bg-opacity-70 backdrop-blur-sm rounded-xl border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group">
                    <span className="text-2xl">✓</span>
                    <div>
                      <p className="font-bold text-darkBrown text-sm group-hover:text-blushPink transition">Verified 100 Ways</p>
                      <p className="text-xs text-softBrown">Student ID • Face ID • Campus Email • Real profiles</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== CTAs - PRIMARY & SECONDARY ===== */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 pt-4 animate-fade-in-up md:justify-center md:items-center md:flex-wrap" style={{ animationDelay: '0.5s' }}>
                {/* PRIMARY CTA */}
                <Link to="/signup" className="w-full md:w-auto">
                  <button className="group relative w-full md:w-auto px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blushPink to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>Start Matching</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blushPink opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                </Link>

                {/* SECONDARY CTA - ALWAYS VISIBLE */}
                <Link to="/features" className="w-full md:w-auto">
                  <button className="w-full md:w-auto px-8 py-4 text-lg font-bold text-softBrown bg-white border-2 border-softPink rounded-full hover:border-blushPink hover:text-blushPink hover:bg-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300">
                    Free
                  </button>
                </Link>

                {/* LOGIN CTA */}
                <Link to="/login" className="w-full md:w-auto">
                  <button className="w-full md:w-auto px-8 py-4 text-lg font-bold text-blushPink bg-white border-2 border-blushPink rounded-full hover:bg-blushPink hover:text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300">
                    Login
                  </button>
                </Link>
              </div>

              {/* ===== LOW-FRICTION MICROCOPY ===== */}
              <div className="space-y-2 text-sm text-softBrown font-semibold animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <p>✓ Verify in 2 minutes • No credit card needed</p>
                <p>✓ Easy to delete • Your data is yours</p>
                <p>✓ 50K+ students already matching</p>
              </div>

              {/* ===== STATS AT BOTTOM ===== */}
              <div className="grid grid-cols-3 gap-6 pt-12 border-t-2 border-softPink border-opacity-30 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                <div className="group cursor-pointer">
                  <p className="text-4xl font-black bg-gradient-to-r from-blushPink to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">50K+</p>
                  <p className="text-xs text-softBrown mt-2 font-semibold">Verified Students</p>
                </div>
                <div className="group cursor-pointer">
                  <p className="text-4xl font-black bg-gradient-to-r from-blushPink to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">200K+</p>
                  <p className="text-xs text-softBrown mt-2 font-semibold">Matches Made</p>
                </div>
                <div className="group cursor-pointer">
                  <p className="text-4xl font-black bg-gradient-to-r from-blushPink to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">4.9★</p>
                  <p className="text-xs text-softBrown mt-2 font-semibold">App Rating</p>
                </div>
              </div>
            </div>

            {/* RIGHT: DUAL MOCKUP PREVIEW */}
            <div className="flex justify-center items-center animate-fade-in-right" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <img
                  src={heroImage}
                  alt="CU-Daters hero visual"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="hidden xl:block absolute -left-20 -top-16 w-56 h-auto opacity-80 pointer-events-none"
                />
                <DualMockupPreview />
              </div>
            </div>
          </div>

          {/* BOTTOM: SOCIAL PROOF CAROUSEL */}
          <div className="mt-20 pt-12 border-t border-softPink border-opacity-30">
            <p className="text-center text-sm font-bold text-softBrown uppercase tracking-widest mb-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              Real student voices
            </p>
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
              {/* Testimonial 1 */}
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 border border-softPink hover:border-blushPink hover:shadow-lg transition-all">
                <p className="text-lg font-bold text-darkBrown mb-2">"Found my boyfriend here 💕"</p>
                <p className="text-sm text-softBrown mb-4">Finally a dating app that actually verified everyone. Game changer.</p>
                <p className="text-xs font-semibold text-blushPink">— Sarah, 20</p>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 border border-softPink hover:border-blushPink hover:shadow-lg transition-all">
                <p className="text-lg font-bold text-darkBrown mb-2">"Actually private & safe"</p>
                <p className="text-sm text-softBrown mb-4">The encryption and screenshot protection made me feel like my chats actually matter.</p>
                <p className="text-xs font-semibold text-blushPink">— Jordan, 21</p>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 border border-softPink hover:border-blushPink hover:shadow-lg transition-all">
                <p className="text-lg font-bold text-darkBrown mb-2">"Met my friend group here"</p>
                <p className="text-sm text-softBrown mb-4">Not just dating—found people with actual shared interests. Love this community.</p>
                <p className="text-xs font-semibold text-blushPink">— Ryan, 22</p>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY MOBILE CTA */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-r from-blushPink to-purple-600 p-4 shadow-2xl z-50">
          <Link to="/signup">
            <button className="w-full bg-white text-blushPink font-bold py-3 rounded-full hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2">
              <span>💕 Match Free Now</span>
              <span>→</span>
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
