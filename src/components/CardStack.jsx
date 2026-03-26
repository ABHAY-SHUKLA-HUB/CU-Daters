import React, { useState, useRef, useEffect } from 'react';
import { resolvePublicProfileVisual } from '../utils/profileMedia';

/**
 * SwipeCard Component - Individual card with swipe animations and interactions
 */
export const SwipeCard = React.forwardRef(
  ({ profile, index = 0, onLike, onDislike, onSuperLike }, ref) => {
    const [dragState, setDragState] = useState({ x: 0, y: 0, isDragging: false });
    const [swipeOverlay, setSwipeOverlay] = useState(null);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const matchPercentage = profile?.matchScore || 85;

    if (!profile) return null;

    const visual = resolvePublicProfileVisual(profile);
    const displayAge = profile?.age || 21;
    const campusLabel = profile?.college || 'Local Community';
    const interestTags = Array.isArray(profile?.interests) && profile.interests.length > 0
      ? profile.interests
      : ['Coffee Walks', 'Live Events', 'Late Night Chats'];

    const getBadge = () => {
      if (profile.verified) return { text: 'Verified', icon: '✔', color: 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50' };
      if (matchPercentage >= 85) return { text: 'Hot Match', icon: '🔥', color: 'bg-red-500/30 text-red-200 border border-red-500/50' };
      if (matchPercentage >= 75) return { text: 'Popular', icon: '⭐', color: 'bg-amber-500/30 text-amber-200 border border-amber-500/50' };
      return { text: 'New', icon: '✨', color: 'bg-blue-500/30 text-blue-200 border border-blue-500/50' };
    };

    const badge = getBadge();

    const handleMouseDown = (e) => {
      startXRef.current = e.clientX;
      startYRef.current = e.clientY;
      setDragState(prev => ({ ...prev, isDragging: true }));
    };

    const handleTouchStart = (e) => {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      setDragState(prev => ({ ...prev, isDragging: true }));
    };

    const handleMouseMove = (e) => {
      if (!dragState.isDragging) return;
      const deltaX = e.clientX - startXRef.current;
      const deltaY = e.clientY - startYRef.current;
      setDragState({ x: deltaX, y: deltaY, isDragging: true });

      // Show like/dislike overlay based on drag direction
      if (Math.abs(deltaX) > 30) {
        setSwipeOverlay(deltaX > 0 ? 'like' : 'dislike');
      } else if (Math.abs(deltaY) > 30) {
        setSwipeOverlay(deltaY < 0 ? 'superlike' : null);
      }
    };

    const handleTouchMove = (e) => {
      if (!dragState.isDragging) return;
      const deltaX = e.touches[0].clientX - startXRef.current;
      const deltaY = e.touches[0].clientY - startYRef.current;
      setDragState({ x: deltaX, y: deltaY, isDragging: true });

      if (Math.abs(deltaX) > 30) {
        setSwipeOverlay(deltaX > 0 ? 'like' : 'dislike');
      } else if (Math.abs(deltaY) > 30) {
        setSwipeOverlay(deltaY < 0 ? 'superlike' : null);
      }
    };

    const handleEnd = () => {
      const { x, y } = dragState;
      const threshold = 100;

      if (Math.abs(x) > threshold) {
        if (x > threshold) {
          onLike();
        } else {
          onDislike();
        }
      } else if (y < -threshold) {
        onSuperLike();
      } else {
        // Reset card
        setDragState({ x: 0, y: 0, isDragging: false });
        setSwipeOverlay(null);
      }
    };

    const rotationAngle = (dragState.x / 200) * 15;
    const scaleValue = 1 - Math.abs(dragState.x) / 1000;

    return (
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        className="absolute top-0 left-0 w-full h-full rounded-3xl cursor-grab active:cursor-grabbing touch-none"
        style={{
          transform: `translateX(${dragState.x}px) translateY(${dragState.y}px) rotate(${rotationAngle}deg) scale(${scaleValue})`,
          opacity: 1 - Math.abs(dragState.x) / 500,
          transition: dragState.isDragging ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 10 - index,
        }}
      >
        {/* Swipe Overlay Icons */}
        {swipeOverlay === 'like' && (
          <div className="absolute inset-0 rounded-3xl border-4 border-green-400 flex items-center justify-center pointer-events-none z-20">
            <div className="text-6xl animate-pulse">❤️</div>
          </div>
        )}
        {swipeOverlay === 'dislike' && (
          <div className="absolute inset-0 rounded-3xl border-4 border-red-500 flex items-center justify-center pointer-events-none z-20">
            <div className="text-6xl animate-pulse">❌</div>
          </div>
        )}
        {swipeOverlay === 'superlike' && (
          <div className="absolute inset-0 rounded-3xl border-4 border-blue-400 flex items-center justify-center pointer-events-none z-20">
            <div className="text-6xl animate-pulse">⭐</div>
          </div>
        )}

        {/* Card Content */}
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-black/20">
          {/* Background Image */}
          <div className="absolute inset-0">
            {visual.type === 'photo' ? (
              <img
                src={visual.value}
                alt={profile.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-fuchsia-600/30 to-purple-900/30">
                <span className="text-9xl">{visual.value}</span>
              </div>
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          </div>

          {/* Top Badges (Verified, Active, Match %) */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10 flex-wrap">
            <div className="flex gap-2">
              <div className="bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full text-xs font-semibold text-white/90 border border-white/15">
                <span className="bg-gradient-to-r from-pink-300 to-fuchsia-300 bg-clip-text text-transparent font-bold">{matchPercentage}%</span> match
              </div>
              <div className="bg-emerald-500/20 text-emerald-100 border border-emerald-300/35 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-lg hidden sm:block">
                ● Active now
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-lg ${badge.color} border`}>
              {badge.icon} {badge.text}
            </div>
          </div>

          {/* Bottom Info Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-10">
            {/* Name, Age, Year */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-4xl sm:text-5xl font-black text-white">{profile.name}, {displayAge}</h2>
              </div>
              <p className="text-sm sm:text-base text-white/90">
                {profile.year ? <span className="font-semibold">{profile.year}</span> : null}
                {profile.year && profile.course ? ' • ' : null}
                {profile.course ? <span>{profile.course}</span> : null}
              </p>
              <p className="text-xs sm:text-sm text-white/75 mt-1">{campusLabel}</p>
            </div>

            {/* Interests Tags */}
            <div className="flex flex-wrap gap-2">
              {interestTags.slice(0, 4).map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm hover:bg-white/20 transition"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';

/**
 * CardStack Component - Manages multiple cards with stack effect
 */
export default function CardStack({ profiles = [], currentIndex = 0, onLike, onDislike, onSuperLike, matchedIds = new Set() }) {
  const containerRef = useRef(null);
  const [stackCards, setStackCards] = useState([]);

  useEffect(() => {
    // Show current and next 2 cards
    const cards = [];
    for (let i = 0; i < 3 && currentIndex + i < profiles.length; i++) {
      cards.push({
        profile: profiles[currentIndex + i],
        offset: i,
        index: i,
      });
    }
    setStackCards(cards);
  }, [profiles, currentIndex]);

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-3xl">
      {stackCards.map((card, i) => (
        <SwipeCard
          key={`${currentIndex + i}-${card.profile?._id || card.profile?.id}`}
          profile={card.profile}
          offset={card.offset}
          isMatched={matchedIds.has(String(card.profile?._id || card.profile?.id || ''))}
          index={i}
          totalCards={stackCards.length}
          onLike={onLike}
          onDislike={onDislike}
          onSuperLike={onSuperLike}
        />
      ))}
    </div>
  );
}
