import React from 'react';

export default function SocialProof() {
  return (
    <section className="py-16 md:py-20 px-4 bg-[linear-gradient(180deg,#fff8fb_0%,#fff_52%,#fff9f1_100%)] border-y border-rose-200/60">
      <div className="max-w-7xl mx-auto">
        {/* Main Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-12">
          {/* Stat 1 */}
          <div className="text-center animate-fade-in-up rounded-2xl border border-rose-200/60 bg-white/90 p-5 shadow-[0_10px_28px_rgba(190,24,93,0.08)]">
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent mb-2">50K+</p>
            <p className="text-darkBrown font-bold">Verified Students</p>
            <p className="text-sm text-softBrown">Across top campuses</p>
          </div>

          {/* Stat 2 */}
          <div className="text-center animate-fade-in-up rounded-2xl border border-rose-200/60 bg-white/90 p-5 shadow-[0_10px_28px_rgba(190,24,93,0.08)]" style={{ animationDelay: '100ms' }}>
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent mb-2">200K+</p>
            <p className="text-darkBrown font-bold">Matches Made</p>
            <p className="text-sm text-softBrown">Real connections daily</p>
          </div>

          {/* Stat 3 */}
          <div className="text-center animate-fade-in-up rounded-2xl border border-rose-200/60 bg-white/90 p-5 shadow-[0_10px_28px_rgba(190,24,93,0.08)]" style={{ animationDelay: '200ms' }}>
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent mb-2">4.9★</p>
            <p className="text-darkBrown font-bold">App Rating</p>
            <p className="text-sm text-softBrown">Trusted by students</p>
          </div>

          {/* Stat 4 */}
          <div className="text-center animate-fade-in-up rounded-2xl border border-rose-200/60 bg-white/90 p-5 shadow-[0_10px_28px_rgba(190,24,93,0.08)]" style={{ animationDelay: '300ms' }}>
            <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent mb-2">100%</p>
            <p className="text-darkBrown font-bold">Verified</p>
            <p className="text-sm text-softBrown">Zero fake profiles</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap animate-fade-in-up">
          <div className="px-5 py-2.5 rounded-full bg-white border border-rose-200 hover:border-rose-400 transition shadow-sm">
            <span className="text-sm font-semibold text-darkBrown">✓ Trusted Campus Product</span>
          </div>
          <div className="px-5 py-2.5 rounded-full bg-white border border-rose-200 hover:border-rose-400 transition shadow-sm">
            <span className="text-sm font-semibold text-darkBrown">🎓 By College Students</span>
          </div>
          <div className="px-5 py-2.5 rounded-full bg-white border border-rose-200 hover:border-rose-400 transition shadow-sm">
            <span className="text-sm font-semibold text-darkBrown">🔒 Privacy First Platform</span>
          </div>
        </div>
      </div>
    </section>
  );
}
