import React, { useState, useEffect } from 'react';

/**
 * PREMIUM DUAL-SCREEN MOCKUP COMPONENT
 * Shows discovery screen + matched chat preview
 * Auto-animates and creates "alive" product feel
 */

export default function DualMockupPreview() {
  const [activeScreen, setActiveScreen] = useState('discovery'); // 'discovery' or 'chat'
  const [profileIndex, setProfileIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Profile data
  const profiles = [
    {
      name: 'Jordan',
      age: 21,
      year: '2nd Year',
      major: 'Engineering',
      interests: ['hiking', 'coffee', 'design'],
      matchScore: 92,
      emoji: '👨',
      online: true,
    },
    {
      name: 'Casey',
      age: 20,
      year: '1st Year',
      major: 'Business',
      interests: ['travel', 'art', 'music'],
      matchScore: 87,
      emoji: '👩',
      online: true,
    },
    {
      name: 'Morgan',
      age: 22,
      year: '3rd Year',
      major: 'Psychology',
      interests: ['reading', 'yoga', 'food'],
      matchScore: 95,
      emoji: '👨',
      online: false,
    },
  ];

  const currentProfile = profiles[profileIndex % profiles.length];
  const chatProfile = profiles[0]; // Jordan for chat demo

  // Auto-swipe effect every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showChat) {
        setProfileIndex((prev) => prev + 1);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [showChat]);

  // Simulate typing
  useEffect(() => {
    if (showChat) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showChat]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
      {/* SCREEN 1: DISCOVERY */}
      <div
        className={`transition-all duration-500 ${
          activeScreen === 'discovery' ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-[2.5rem] p-3 shadow-2xl w-80 transform hover:scale-105 transition-transform cursor-pointer"
             onClick={() => { setActiveScreen('discovery'); setShowChat(false); }}>
          {/* Notch */}
          <div className="bg-black rounded-3xl overflow-hidden">
            {/* Status Bar */}
            <div className="bg-gradient-to-r from-blushPink to-softPink px-6 py-3 text-white flex justify-between items-center text-xs font-bold">
              <span>9:41</span>
              <span className="flex gap-1">
                <span>●●●●</span>
                <span>●</span>
              </span>
            </div>

            {/* App Content - Discovery Screen */}
            <div className="bg-white min-h-96 p-4 space-y-3 relative overflow-hidden">
              {/* Profile Card - Animated Entrance */}
              <div
                key={profileIndex}
                className="bg-gradient-to-br from-blushPink via-softPink to-purple-200 rounded-2xl p-5 text-white animate-slide-in-left shadow-lg transform hover:scale-105 transition-transform"
              >
                {/* Photo Placeholder */}
                <div className="w-full h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-lg mb-3 flex items-center justify-center text-5xl font-bold">
                  {currentProfile.emoji}
                </div>

                {/* Profile Info */}
                <div className="mb-3">
                  <p className="font-black text-lg">
                    {currentProfile.name}, {currentProfile.age}
                  </p>
                  <p className="text-sm opacity-90">
                    {currentProfile.major} • {currentProfile.year}
                  </p>
                </div>

                {/* Interests */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {currentProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full backdrop-blur"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                {/* Match Score */}
                <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold">Match Score</span>
                  <span className="text-sm font-black">{currentProfile.matchScore}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-2">
                <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-transform shadow-md">
                  ✕
                </button>
                <button className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white text-xl font-bold hover:scale-110 active:scale-95 transition-transform shadow-md">
                  ⭐
                </button>
                <button className="w-12 h-12 rounded-full bg-blushPink flex items-center justify-center text-white text-xl font-bold hover:scale-110 active:scale-95 transition-transform shadow-md animate-pulse-heart">
                  ❤️
                </button>
              </div>

              {/* Trust Badge */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-full px-3 py-2 flex items-center justify-center gap-2 text-center">
                <span className="text-lg">🔒</span>
                <span className="text-xs font-semibold text-blue-900">Verified & Private</span>
              </div>

              {/* Online Status */}
              <div className="flex items-center justify-center gap-2 text-xs text-green-600 font-semibold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {currentProfile.online ? 'Online' : 'Offline'}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-softPink pt-2 mt-2">
                <div className="opacity-80">
                  <p className="font-black text-darkBrown">200K+</p>
                  <p className="text-softBrown text-xs">Matches</p>
                </div>
                <div className="opacity-80">
                  <p className="font-black text-darkBrown">4.9★</p>
                  <p className="text-softBrown text-xs">Rating</p>
                </div>
                <div className="opacity-80">
                  <p className="font-black text-darkBrown">50K+</p>
                  <p className="text-softBrown text-xs">Users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Screen Label */}
          <div className="text-center mt-3 text-xs font-semibold text-darkBrown opacity-60">
            Discover & Like
          </div>
        </div>
      </div>

      {/* SCREEN 2: MATCHED CHAT */}
      <div
        className={`transition-all duration-500 ${
          activeScreen === 'chat' || showChat ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-[2.5rem] p-3 shadow-2xl w-80 transform hover:scale-105 transition-transform cursor-pointer"
             onClick={() => { setActiveScreen('chat'); setShowChat(true); }}>
          {/* Notch */}
          <div className="bg-black rounded-3xl overflow-hidden">
            {/* Status Bar */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-6 py-3 text-white flex justify-between items-center text-xs font-bold">
              <span>9:43</span>
              <span className="flex gap-1">
                <span>●●●●</span>
                <span>●</span>
              </span>
            </div>

            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blushPink to-softPink rounded-full flex items-center justify-center text-lg font-bold">
                  {chatProfile.emoji}
                </div>
                <div>
                  <p className="font-bold text-sm text-darkBrown">{chatProfile.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-xs text-softBrown">Online</span>
                  </div>
                </div>
              </div>
              <span className="text-lg">⋯</span>
            </div>

            {/* Chat Messages - Animated */}
            <div className="bg-white min-h-96 p-4 space-y-3 overflow-y-auto flex flex-col justify-end">
              {/* Matched Badge */}
              <div className="flex justify-center mb-2">
                <div className="bg-gradient-to-r from-blushPink to-softPink text-white text-xs font-bold px-4 py-2 rounded-full">
                  ✓ You matched!
                </div>
              </div>

              {/* Message 1 - From other user */}
              <div className="flex justify-start animate-slide-in-left">
                <div className="bg-gray-100 text-darkBrown px-3 py-2 rounded-2xl rounded-tl-none max-w-xs text-sm">
                  <p>Hey! I'm {chatProfile.name} 👋</p>
                </div>
              </div>

              {/* Message 2 - From other user */}
              <div className="flex justify-start animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                <div className="bg-gray-100 text-darkBrown px-3 py-2 rounded-2xl rounded-tl-none max-w-xs text-sm">
                  <p>Saw you're into hiking too?</p>
                  <p>Let's grab coffee and talk about trails ☕</p>
                </div>
              </div>

              {/* Message 3 - From user (right side) */}
              <div className="flex justify-end animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
                <div className="bg-gradient-to-br from-blushPink to-softPink text-white px-3 py-2 rounded-2xl rounded-tr-none max-w-xs text-sm">
                  <p>That sounds amazing! 🏔️</p>
                </div>
              </div>

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-gray-100 text-darkBrown px-3 py-2 rounded-2xl rounded-tl-none flex gap-1">
                    <span className="w-2 h-2 bg-softBrown rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-softBrown rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-softBrown rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Warning */}
            <div className="bg-amber-50 border-t border-amber-200 px-3 py-2 flex items-start gap-2 text-xs">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-amber-900">Screenshot Protected</p>
                <p className="text-amber-800">Sender will be notified if screen captured</p>
              </div>
            </div>

            {/* Chat Input */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Say something..."
                className="flex-1 bg-gray-100 text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blushPink"
                disabled
              />
              <button className="text-lg">➔</button>
            </div>

            {/* Privacy Badge Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-darkBrown">
              <span>🔒</span>
              <span>End-to-End Encrypted</span>
            </div>
          </div>

          {/* Screen Label */}
          <div className="text-center mt-3 text-xs font-semibold text-darkBrown opacity-60">
            Private Chat
          </div>
        </div>
      </div>

      {/* MOBILE: Single Screen Carousel Hint */}
      <div className="md:hidden text-center text-xs text-softBrown font-semibold mt-4">
        ← Swipe to explore both screens →
      </div>
    </div>
  );
}
