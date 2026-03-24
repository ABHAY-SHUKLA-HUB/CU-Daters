import React, { useEffect, useState } from 'react';
import { resolvePublicProfileVisual } from '../utils/profileMedia';

/**
 * Enhanced Match Popup with Premium Celebratory Effects
 * Features:
 * - Confetti particles (animated)
 * - Hearts floating effect  
 * - Smooth scale-in animation
 * - Dual profile image display
 * - CTA buttons with hover effects
 */
export default function EnhancedMatchPopup({
  currentUser,
  matchedUser,
  conversationId = '',
  onStartChat,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [confetti, setConfetti] = useState([]);
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    // Generate confetti
    const confettiParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2.5 + Math.random() * 1.5,
      rotation: Math.random() * 360,
    }));
    setConfetti(confettiParticles);

    // Generate floating hearts
    const heartParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: 40 + Math.random() * 20,
      delay: Math.random() * 0.5,
      duration: 3 + Math.random() * 2,
    }));
    setHearts(heartParticles);

    // Auto close
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const currentUserVisual = resolvePublicProfileVisual(currentUser);
  const matchedUserVisual = resolvePublicProfileVisual(matchedUser);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 500);
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-500 ${
        isVisible
          ? 'opacity-100 backdrop-blur-sm bg-black/60'
          : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleClose}
    >
      {/* Confetti Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((particle) => (
          <div
            key={`confetti-${particle.id}`}
            className="fixed animate-confetti text-2xl pointer-events-none"
            style={{
              left: `${particle.left}%`,
              top: '-20px',
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              transform: `rotateZ(${particle.rotation}deg)`,
            }}
          >
            {['🎉', '✨', '💕', '⭐', '🎊', '💫', '🌟'][Math.floor(Math.random() * 7)]}
          </div>
        ))}
      </div>

      {/* Floating Hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {hearts.map((heart) => (
          <div
            key={`heart-${heart.id}`}
            className="fixed text-4xl animate-float"
            style={{
              left: `${heart.left}%`,
              bottom: '-50px',
              animationDelay: `${heart.delay}s`,
              animationDuration: `${heart.duration}s`,
              opacity: 0.7,
            }}
          >
            💕
          </div>
        ))}
      </div>

      {/* Main Modal Card */}
      <div
        className={`bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl rounded-3xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl transform transition-all duration-500 relative z-10 ${
          isVisible
            ? 'scale-100 opacity-100 animate-match-pop'
            : 'scale-75 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-purple-500/10 rounded-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          {/* Title with Glow */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black mb-2 animate-bounce-in text-glow">
              🎉 It&apos;s a{' '}
              <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                Match!
              </span>{' '}
              🎉
            </h1>
            <p className="text-gray-300 text-sm">You both liked each other!</p>
          </div>

          {/* Profile Images Container */}
          <div className="relative h-48 mb-8 flex items-center justify-center">
            {/* Current User Image */}
            <div className="absolute left-0 w-32 h-48 rounded-2xl overflow-hidden border-4 border-red-500/50 shadow-2xl transform -rotate-12 hover:rotate-0 transition-all duration-300 hover:-translate-y-2 hover:shadow-red-500/50">
              {currentUserVisual.type === 'photo' ? (
                <img
                  src={currentUserVisual.value}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-6xl">
                  {currentUserVisual.value}
                </div>
              )}
            </div>

            {/* Animated Heart Icon */}
            <div className="absolute z-20 text-5xl animate-bounce" style={{ animation: 'bounce 0.6s ease-in-out infinite' }}>
              💕
            </div>

            {/* Matched User Image */}
            <div className="absolute right-0 w-32 h-48 rounded-2xl overflow-hidden border-4 border-purple-500/50 shadow-2xl transform rotate-12 hover:rotate-0 transition-all duration-300 hover:-translate-y-2 hover:shadow-purple-500/50">
              {matchedUserVisual.type === 'photo' ? (
                <img
                  src={matchedUserVisual.value}
                  alt={matchedUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-6xl">
                  {matchedUserVisual.value}
                </div>
              )}
            </div>
          </div>

          {/* Names */}
          <div className="text-center mb-8">
            <p className="text-lg font-bold text-white mb-1">
              {currentUser.name}{' '}
              <span className="text-gray-400 text-base font-normal">&</span> {matchedUser.name}
            </p>
            <p className="text-sm text-gray-400">You have a new connection ✨</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleClose}
              className="btn-secondary py-3 px-4 rounded-full text-sm font-bold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Keep Swiping
            </button>
            <button
              onClick={() => {
                if (typeof onStartChat === 'function') {
                  onStartChat(conversationId || '');
                  return;
                }
                window.location.href = conversationId ? `/chat?conversationId=${conversationId}` : '/chat';
              }}
              className="btn-primary py-3 px-4 rounded-full text-sm font-bold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              Start Chatting 💬
            </button>
          </div>

          {/* Bottom Text */}
          <p className="text-center text-xs text-gray-500">Click anywhere to close</p>
        </div>
      </div>
    </div>
  );
}
