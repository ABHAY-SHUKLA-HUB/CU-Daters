import React, { useEffect, useState } from 'react';
import { resolvePublicProfileVisual } from '../utils/profileMedia';

export default function MatchPopup({ currentUser, matchedUser, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [confetti, setConfetti] = useState([]);

  // Generate confetti particles
  useEffect(() => {
    const particles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 2 + Math.random() * 1,
    }));
    setConfetti(particles);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const currentUserVisual = resolvePublicProfileVisual(currentUser);
  const matchedUserVisual = resolvePublicProfileVisual(matchedUser);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-500 ${
        isVisible ? 'opacity-100 backdrop-blur-md bg-black/40' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }}
    >
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="fixed animate-confetti text-2xl pointer-events-none"
          style={{
            left: `${particle.left}%`,
            top: '-20px',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          {['🎉', '✨', '💕', '⭐', '🎊'][Math.floor(Math.random() * 5)]}
        </div>
      ))}

      {/* Main Card */}
      <div
        className={`bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl transform transition-all duration-500 ${
          isVisible ? 'scale-100 opacity-100 animate-match-pop' : 'scale-75 opacity-0'
        }`}
      >
        {/* Title with Glow */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2 text-glow">
            🎉 It&apos;s a <span className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">Match!</span> 🎉
          </h1>
          <p className="text-gray-300 text-sm">You both liked each other</p>
        </div>

        {/* Profile Images Container */}
        <div className="relative h-40 mb-8 flex items-center justify-center">
          {/* Current User Image */}
          <div className="absolute left-0 w-32 h-40 rounded-2xl overflow-hidden border-4 border-red-500/50 shadow-lg transform -rotate-12 hover:rotate-0 transition-transform duration-300">
            {currentUserVisual.type === 'photo' ? (
              <img
                src={currentUserVisual.value}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-5xl">
                {currentUserVisual.value}
              </div>
            )}
          </div>

          {/* Heart Icon in Center */}
          <div className="absolute z-10 text-4xl animate-bounce">💕</div>

          {/* Matched User Image */}
          <div className="absolute right-0 w-32 h-40 rounded-2xl overflow-hidden border-4 border-purple-500/50 shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
            {matchedUserVisual.type === 'photo' ? (
              <img
                src={matchedUserVisual.value}
                alt={matchedUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl">
                {matchedUserVisual.value}
              </div>
            )}
          </div>
        </div>

        {/* Names */}
        <div className="text-center mb-8">
          <p className="text-lg font-bold text-white mb-1">
            {currentUser.name} <span className="text-gray-400">&</span> {matchedUser.name}
          </p>
          <p className="text-sm text-gray-400">You have a new connection</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 500);
            }}
            className="btn-secondary py-3 rounded-full text-sm font-bold"
          >
            Keep Swiping
          </button>
          <button
            onClick={() => {
              window.location.href = '/chat';
            }}
            className="btn-primary py-3 rounded-full text-sm font-bold"
          >
            Start Chat 💬
          </button>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-xs text-gray-500 mt-4">Click anywhere to close</p>
      </div>
    </div>
  );
}
