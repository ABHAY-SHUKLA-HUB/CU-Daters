import React from 'react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-warmCream">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Message */}
        <div className="animate-fade-in-up mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-darkBrown mb-6 leading-tight">
            Ready to Find Your People?
          </h2>
          <p className="text-xl text-softBrown mb-8 leading-relaxed">
            Join 50K+ verified college students making real connections. Start free today. No credit card needed.
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
              Start Free Today
            </button>
          </Link>
          <Link to="/login">
            <button className="btn-secondary px-8 py-4 text-lg">
              Login
            </button>
          </Link>
          <Link to="/features">
            <button className="hidden sm:block btn-secondary px-8 py-4 text-lg">
              See How It Works
            </button>
          </Link>
        </div>

        {/* Subtext */}
        <p className="text-softBrown text-sm animate-fade-in-up">
          Takes 5 minutes to verify • No credit card required • Cancel anytime
        </p>

        {/* Campus Stats */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-creamyWhite to-warmCream border-2 border-softPink animate-fade-in-up">
          <p className="text-darkBrown mb-6 font-semibold text-lg">Active on Your Campus</p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-black gradient-text">50K+</p>
              <p className="text-xs text-softBrown mt-2">Verified Students</p>
            </div>
            <div>
              <p className="text-3xl font-black gradient-text">200K+</p>
              <p className="text-xs text-softBrown mt-2">Matches Made</p>
            </div>
            <div>
              <p className="text-3xl font-black gradient-text">4.9★</p>
              <p className="text-xs text-softBrown mt-2">App Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
