import React from 'react';

export default function SocialProof() {
  return (
    <section className="py-16 px-4 bg-gradient-to-r from-creamyWhite via-warmCream to-creamyWhite border-y border-softPink">
      <div className="max-w-7xl mx-auto">
        {/* Main Stats */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Stat 1 */}
          <div className="text-center animate-fade-in-up">
            <p className="text-5xl font-black gradient-text mb-2">50K+</p>
            <p className="text-darkBrown font-bold">Verified Students</p>
            <p className="text-sm text-softBrown">Across top campuses</p>
          </div>

          {/* Stat 2 */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <p className="text-5xl font-black gradient-text mb-2">200K+</p>
            <p className="text-darkBrown font-bold">Matches Made</p>
            <p className="text-sm text-softBrown">Real connections daily</p>
          </div>

          {/* Stat 3 */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <p className="text-5xl font-black gradient-text mb-2">4.9★</p>
            <p className="text-darkBrown font-bold">App Rating</p>
            <p className="text-sm text-softBrown">Trusted by students</p>
          </div>

          {/* Stat 4 */}
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <p className="text-5xl font-black gradient-text mb-2">100%</p>
            <p className="text-darkBrown font-bold">Verified</p>
            <p className="text-sm text-softBrown">Zero fake profiles</p>
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
