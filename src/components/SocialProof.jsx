import React from 'react';

export default function SocialProof() {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-creamyWhite via-warmCream to-creamyWhite border-y border-softPink">
      <div className="max-w-7xl mx-auto">
        {/* Coming Soon Banner */}
        <div className="text-center mb-12 p-6 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200 animate-fade-in-up">
          <p className="text-lg font-bold text-rose-600 mb-2">🚀 Launching Soon</p>
          <p className="text-darkBrown font-semibold">Exclusively for CU Mohali & CU UP</p>
        </div>

        {/* Main Stats */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Stat 1 */}
          <div className="text-center animate-fade-in-up">
            <p className="text-5xl font-black gradient-text mb-2">2</p>
            <p className="text-darkBrown font-bold">Campuses Launching</p>
            <p className="text-sm text-softBrown">CU Mohali + CU UP</p>
          </div>

          {/* Stat 2 */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <p className="text-5xl font-black gradient-text mb-2">✓</p>
            <p className="text-darkBrown font-bold">Coming Soon</p>
            <p className="text-sm text-softBrown">Join the waitlist</p>
          </div>

          {/* Stat 3 */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <p className="text-5xl font-black gradient-text mb-2">🎓</p>
            <p className="text-darkBrown font-bold">Built by Students</p>
            <p className="text-sm text-softBrown">For students, for real</p>
          </div>

          {/* Stat 4 */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <p className="text-5xl font-black gradient-text mb-2">🔐</p>
            <p className="text-darkBrown font-bold">Real Students Only</p>
            <p className="text-sm text-softBrown">College email verified</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap animate-fade-in-up">
          <div className="px-6 py-3 rounded-full bg-white border-2 border-softPink hover:border-blushPink transition shadow-md">
            <span className="text-sm font-semibold text-darkBrown">✓ TechCrunch Mentioned</span>
          </div>
          <div className="px-6 py-3 rounded-full bg-white border-2 border-softPink hover:border-blushPink transition shadow-md">
            <span className="text-sm font-semibold text-darkBrown">🎓 By College Students</span>
          </div>
          <div className="px-6 py-3 rounded-full bg-white border-2 border-softPink hover:border-blushPink transition shadow-md">
            <span className="text-sm font-semibold text-darkBrown">🔒 Privacy First Platform</span>
          </div>
        </div>
      </div>
    </section>
  );
}
