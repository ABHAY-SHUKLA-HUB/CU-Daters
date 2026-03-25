import React, { useRef, useState } from 'react';
import { resolvePublicProfileVisual } from '../utils/profileMedia';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

export default function ProfileCard({ profile, isMatched = false, onLike, onDislike, onSuperLike, onMessage }) {
  // eslint-disable-next-line react-hooks/purity
  const randomScoreRef = useRef(Math.floor(Math.random() * 30) + 70);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const cardRef = useRef(null);
  
  const matchPercentage = profile?.matchScore !== undefined 
    ? profile.matchScore 
    : randomScoreRef.current;

  // Swipe gesture handlers
  const handleSwipeLeft = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    onDislike?.();
  };

  const handleSwipeRight = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    onLike?.();
  };

  const { handlers: swipeHandlers } = useSwipeGesture(
    handleSwipeLeft,
    handleSwipeRight,
    onSuperLike,
    null
  );

  if (!profile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/30 to-purple-900/30 rounded-3xl border border-white/10 backdrop-blur-md">
        <div className="text-center">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-2xl font-bold text-white mb-2">All Done!</p>
          <p className="text-gray-300 text-lg">Come back tomorrow for more matches</p>
        </div>
      </div>
    );
  }
  const visual = resolvePublicProfileVisual(profile);
  const displayAge = profile?.age || 21;
  const campusLabel = profile?.college || 'Chandigarh University';
  const mutualCue = profile?.mutualInterests?.length
    ? `${profile.mutualInterests.length} mutual interests`
    : '3 mutual connections';
  const interestTags = Array.isArray(profile?.interests) && profile.interests.length > 0
    ? profile.interests
    : ['Coffee Walks', 'Campus Events', 'Late Night Chats'];
  const isVerifiedProfile = Boolean(
    profile?.verified ||
    profile?.verified_badge ||
    profile?.is_verified ||
    profile?.college_verification_status === 'verified'
  );

  // Determine badge - Updated for dark theme
  const getBadge = () => {
    if (isVerifiedProfile) return { text: 'Verified', icon: '✅', color: 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/50' };
    if (matchPercentage >= 85) return { text: 'Hot Match', icon: '🔥', color: 'bg-red-500/30 text-red-200 border border-red-500/50' };
    if (matchPercentage >= 75) return { text: 'Popular', icon: '⭐', color: 'bg-amber-500/30 text-amber-200 border border-amber-500/50' };
    return { text: 'New', icon: '✨', color: 'bg-blue-500/30 text-blue-200 border border-blue-500/50' };
  };
  
  const badge = getBadge();

  const handleLike = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    onLike();
  };

  const handleDislike = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    onDislike();
  };

  return (
    <div
      ref={cardRef}
      className={`w-full h-full rounded-[2rem] shadow-[0_30px_70px_rgba(190,24,93,0.18)] overflow-hidden relative group transition-all duration-500 cursor-grab active:cursor-grabbing border border-rose-200/70 bg-white ${isAnimating ? 'scale-95 opacity-75' : 'scale-100 opacity-100'}`}
      {...swipeHandlers}
    >
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-rose-300/25 blur-3xl" />

      <div className="relative h-full grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[360px] xl:min-h-0 overflow-hidden">
          {visual.type === 'photo' ? (
            <img
              src={visual.value}
              alt={profile.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.035] transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-100 to-fuchsia-100">
              <span className="text-9xl">{visual.value}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-rose-900/55 via-rose-800/10 to-transparent" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="bg-white/85 backdrop-blur-xl px-3.5 py-1.5 rounded-full shadow-lg border border-rose-200/80">
              <p className="text-xs font-semibold text-rose-700">
                <span className="bg-gradient-to-r from-rose-300 to-fuchsia-300 bg-clip-text text-transparent font-bold">{matchPercentage}%</span>
                <span className="text-rose-700"> match</span>
              </p>
            </div>
            <div className="bg-white/85 text-emerald-700 border border-emerald-200/70 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-lg">
              ● Active
            </div>
            {isMatched ? (
              <div className="bg-white/85 text-rose-700 border border-rose-200/70 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-lg">
                ❤️ Matched
              </div>
            ) : null}
          </div>

          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-lg ${badge.color} shadow-lg transition-all duration-300`}>
            <span className="mr-1">{badge.icon}</span>
            {badge.text}
          </div>

          <div className="absolute bottom-4 left-4 right-4 xl:hidden rounded-2xl border border-rose-200/60 bg-white/85 backdrop-blur-lg px-4 py-3 text-rose-800">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold">{profile.name}, {displayAge}</h2>
              {isVerifiedProfile ? <span className="text-sm px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-300/35">✓</span> : null}
            </div>
              <p className="text-xs text-rose-600 mt-1">{campusLabel}</p>
          </div>
        </div>

            <div className="h-full flex flex-col bg-gradient-to-b from-white to-rose-50/60 backdrop-blur-md p-5 xl:p-6 text-rose-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl xl:text-[2.1rem] leading-tight font-extrabold tracking-tight">{profile.name}, {displayAge}</h2>
                {isVerifiedProfile ? <span className="text-sm px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-300/35">✓</span> : null}
              </div>
              <p className="text-sm text-rose-700/80 mt-1.5">
                {profile.course ? <span>{profile.course}</span> : null}
                {profile.course && profile.year ? <span> • </span> : null}
                {profile.year ? <span>{profile.year}</span> : null}
                {(profile.course || profile.year) ? <span> • </span> : null}
                <span>{campusLabel}</span>
              </p>
            </div>

            <span className="text-[11px] xl:text-xs font-semibold px-3 py-1 rounded-full border border-rose-200 bg-rose-100 text-rose-700">
              Popular on campus
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <span className="px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-center">Campus verified</span>
            <span className="px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-center">{mutualCue}</span>
            <span className="px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-center">Request-first chat</span>
            <span className="px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-center">Profile updated recently</span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-rose-500 mb-1.5">Bio</p>
            <p className={`text-sm text-rose-800/90 leading-relaxed ${showFullProfile ? '' : 'line-clamp-3'}`}>
              {profile.bio || 'Loves meeting new people around campus and creating meaningful conversations over coffee, events, and study breaks.'}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-rose-500 mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {(showFullProfile ? interestTags : interestTags.slice(0, 6)).map((interest, idx) => (
                <span key={idx} className="text-xs bg-rose-50 text-rose-700 px-3 py-1 rounded-full font-medium border border-rose-200 hover:bg-rose-100 transition-all duration-300">
                  {interest}
                </span>
              ))}
              {!showFullProfile && interestTags.length > 6 ? (
                <span className="text-xs bg-rose-50 text-rose-700 px-3 py-1 rounded-full font-medium border border-rose-200">+{interestTags.length - 6}</span>
              ) : null}
            </div>
          </div>

          <div className="mt-auto pt-5">
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowFullProfile((prev) => !prev)}
                className="px-3 py-2 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-xs font-semibold text-rose-700 transition"
              >
                {showFullProfile ? 'Hide Profile' : 'View Profile'}
              </button>
              {isMatched ? (
                <button
                  onClick={() => onMessage?.()}
                  className="px-3 py-2 rounded-full border border-rose-300/40 bg-rose-500/20 hover:bg-rose-500/35 text-xs font-semibold text-rose-100 transition"
                >
                  Message Now
                </button>
              ) : (
                <button
                  onClick={handleLike}
                  className="px-3 py-2 rounded-full border border-rose-300/50 bg-gradient-to-r from-rose-500 to-fuchsia-500 text-xs font-semibold text-white transition"
                >
                  Send Request
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-5">
              <button
                onClick={handleDislike}
                className="btn-action-pass w-14 h-14 md:w-16 md:h-16 rounded-full text-white font-bold text-2xl"
                title="Pass (Swipe Left)"
              >
                <span>✕</span>
              </button>

              {isMatched ? (
                <button
                  onClick={() => onMessage?.()}
                  className="btn-action-super w-16 h-16 md:w-[72px] md:h-[72px] rounded-full text-white font-bold text-xl animate-pulse-glow"
                  title="Open Conversation"
                >
                  <span>💬</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowFullProfile((prev) => !prev)}
                  className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-full text-rose-700 font-bold text-2xl border border-rose-200 bg-white"
                  title="View Profile"
                >
                  <span>👀</span>
                </button>
              )}

              {isMatched ? (
                <button
                  onClick={() => onMessage?.()}
                  className="btn-action-like w-14 h-14 md:w-16 md:h-16 rounded-full text-white font-bold text-xl animate-pulse-glow"
                  title="Message Now"
                >
                  <span>✉️</span>
                </button>
              ) : (
                <button
                  onClick={handleLike}
                  className="btn-action-like w-14 h-14 md:w-16 md:h-16 rounded-full text-white font-bold text-2xl animate-pulse-glow"
                  title="Send Request"
                >
                  <span>💌</span>
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-rose-600">
              <span>Pass</span>
              <span>{isMatched ? 'Open Chat' : 'View'}</span>
              <span>{isMatched ? 'Message' : 'Send Request'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
