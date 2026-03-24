import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Enhanced Premium Section with Animated Effects
 * Features:
 * - Gradient background with glow
 * - Animated CTA button
 * - Feature highlights with icons
 * - Premium badge with shine effect
 * - Hover effects and transitions
 */
export default function EnhancedPremiumSection() {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    { icon: '👀', text: 'See who sent request first', delay: 0 },
    { icon: '∞', text: 'Unlimited requests', delay: 0.08 },
    { icon: '🚀', text: 'Profile Boost', delay: 0.16 },
    { icon: '🎯', text: 'Advanced filters', delay: 0.24 },
    { icon: '✨', text: 'Highlight profile in discovery', delay: 0.32 },
  ];

  return (
    <div
      className="glass-panel rounded-3xl p-6 overflow-hidden hover:shadow-2xl transition-all duration-300 border border-rose-300/60 bg-gradient-to-br from-white via-rose-50 to-violet-50 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-fuchsia-400/10 to-violet-500/10 pointer-events-none opacity-0 transition-opacity duration-500"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Glow Effect */}
      <div
        className="absolute -inset-12 bg-gradient-to-br from-rose-400/25 to-violet-400/25 blur-3xl pointer-events-none opacity-0 transition-opacity duration-500"
        style={{ opacity: isHovered ? 0.5 : 0 }}
      />

      {/* Premium Badge */}
      <div className="relative z-10 mb-4">
        <div className="inline-block">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-100 to-violet-100 border border-rose-300/60 backdrop-blur-sm">
            <span className="text-lg animate-pulse-glow">💎</span>
            <p className="text-xs font-bold bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent tracking-widest uppercase">
              Premium
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-rose-900 mb-1 relative z-10">Premium Visibility Pack</h3>
      <p className="text-sm text-rose-700/80 mb-4 relative z-10">Built for request-first connections</p>

      {/* Features List with Staggered Animation */}
      <div className="space-y-2 mb-6 relative z-10">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/70 transition-all duration-300 transform hover:translate-x-1"
            style={{
              animation: isHovered ? `slideInLeft 0.5s ease-out ${feature.delay}s forwards` : 'none',
              opacity: isHovered ? 1 : 0.85,
            }}
          >
            <span className="text-xl">{feature.icon}</span>
            <span className="text-xs text-rose-800/90">{feature.text}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Link to="/pricing" className="block relative z-10">
        <button
          className="w-full px-4 py-3 rounded-full text-sm font-bold transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 relative overflow-hidden group text-white bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 shadow-[0_16px_34px_rgba(221,62,130,0.35)]"
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer pointer-events-none group-hover:opac-100" />

          {/* Button Text */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>Get Premium Visibility</span>
            <span className="text-lg animate-bounce-in">✨</span>
          </span>
        </button>
      </Link>

      {/* Footer Text */}
      <p className="text-center text-xs text-rose-700/70 mt-3 relative z-10">
        Includes request insight, boost credits, and advanced targeting
      </p>
    </div>
  );
}
