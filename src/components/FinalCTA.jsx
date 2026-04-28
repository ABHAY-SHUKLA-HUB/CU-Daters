import React from 'react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-warmCream">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Message */}
        <div className="animate-fade-in-up mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-darkBrown mb-6 leading-tight">
            Coming Soon to Your Campus
          </h2>
          <p className="text-xl text-softBrown mb-8 leading-relaxed">
            Join verified members making real connections. Launching exclusively for Chandigarh University (Mohali & UP). Be the first to connect with students from your campus. Start free today. No credit card needed.
          </p>
        </div>

        {/* Trust Chips */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up flex-wrap">
          <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-md hover:shadow-lg transition">
            <span className="text-lg">✓</span>
            <span className="text-sm font-semibold text-darkBrown">100% Verified</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-md hover:shadow-lg transition">
            <span className="text-lg">🔒</span>
            <span className="text-sm font-semibold text-darkBrown">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-md hover:shadow-lg transition">
            <span className="text-lg">📱</span>
            <span className="text-sm font-semibold text-darkBrown">Works on Web & App</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in-up">
          <Link to="/signup">
            <button className="btn-primary px-8 py-4 text-lg">
              Join the Waitlist
            </button>
          </Link>
          <Link to="/features">
            <button className="hidden sm:block btn-secondary px-8 py-4 text-lg">
              Learn More
            </button>
          </Link>
        </div>

        {/* Subtext */}
        <p className="text-softBrown text-sm animate-fade-in-up">
          Join 500+ students already on the waitlist • College email verification required
        </p>

        {/* Community Stats & Launch Info */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-creamyWhite to-warmCream border-2 border-softPink animate-fade-in-up">
          <p className="text-darkBrown mb-6 font-semibold text-lg">🚀 Launching Exclusively For & Active Community</p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-black gradient-text">📍</p>
              <p className="text-xs text-softBrown mt-2">CU Mohali</p>
            </div>
            <div>
              <p className="text-3xl font-black gradient-text">📍</p>
              <p className="text-xs text-softBrown mt-2">CU UP</p>
            </div>
            <div>
              <p className="text-3xl font-black text-rose-600">50K+</p>
              <p className="text-xs text-softBrown mt-2">Verified Members</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
