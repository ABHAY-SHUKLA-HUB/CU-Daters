import React, { useRef, useState } from 'react';
import { resolveProfileGallery, resolvePublicProfileVisual } from '../utils/profileMedia';
import PhotoPreviewModal from './PhotoPreviewModal';

function createSeed(value = '') {
  return String(value)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getRelativeActivityLabel(profile = {}, seed = 0) {
  const dateValue = profile?.last_active_at || profile?.lastLogin || profile?.updated_at;
  if (!dateValue) {
    return seed % 2 === 0 ? 'Active now' : 'Recently active';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Recently active';
  }

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60)));
  if (diffMinutes <= 5) return 'Active now';
  if (diffMinutes <= 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours <= 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function deriveSignals(profile = {}) {
  const idSeed = createSeed(profile?._id || profile?.id || profile?.name || 'profile');
  const interestsLength = Array.isArray(profile?.interests) ? profile.interests.length : 0;
  const vibeMatch = profile?.vibeMatch ?? (72 + (idSeed % 27));
  const sharedInterests = profile?.mutualInterests?.length ?? Math.min(interestsLength, 2 + (idSeed % 4));
  const campusPulse = (idSeed % 100) > 58;
  const matchMomentum = 8 + (idSeed % 18);
  const createdAt = new Date(profile?.createdAt || profile?.created_at || profile?.updated_at || Date.now());
  const isFreshProfile = !Number.isNaN(createdAt.getTime()) && (Date.now() - createdAt.getTime()) <= 1000 * 60 * 60 * 24 * 14;

  return {
    vibeMatch,
    sharedInterests,
    campusPulse,
    matchMomentum,
    activityLabel: getRelativeActivityLabel(profile, idSeed),
    isFreshProfile,
    isPopular: campusPulse || vibeMatch >= 88
  };
}

export default function EnhancedProfileCard({
  profile,
  onLike,
  onDislike,
  onSuperLike,
  onChatRequest
}) {
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  const [dragState, setDragState] = useState({ x: 0, y: 0, isDragging: false });
  const [swipeOverlay, setSwipeOverlay] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [bioExpanded, setBioExpanded] = useState(false);

  if (!profile) {
    return (
      <div className="w-full h-full rounded-[2rem] flex items-center justify-center border" style={{ borderColor: 'rgba(251,113,133,0.2)', background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(252,238,243,0.92))' }}>
        <div className="text-center px-7">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'linear-gradient(140deg, rgba(255,107,138,0.16), rgba(176,123,172,0.18))' }}>
            <span className="text-4xl">💫</span>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>You are all caught up</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Fresh profiles will appear soon. Stay nearby for your next vibe match.</p>
        </div>
      </div>
    );
  }

  const visual = resolvePublicProfileVisual(profile);
  const gallery = resolveProfileGallery(profile);
  const hasPhoto = gallery.length > 0;
  const activePhoto = hasPhoto ? gallery[selectedPhotoIndex] : null;
  const multiplePhotos = gallery.length > 1;

  const isVerifiedProfile = Boolean(
    profile?.verified ||
    profile?.verified_badge ||
    profile?.is_verified ||
    profile?.college_verification_status === 'verified'
  );

  const signals = deriveSignals(profile);
  const aboutText =
    profile?.shortAbout ||
    profile?.bio ||
    profile?.about ||
    `Into good vibes, real conversations, and ${profile?.college ? `${profile.college} moments` : 'local adventures'}.`;
  const interestList = Array.isArray(profile?.interests) ? profile.interests.slice(0, 7) : [];

  const showPreviewModal = () => {
    if (!hasPhoto) return;
    setShowPhotoModal(true);
  };

  const showPreviousPhoto = (event) => {
    event.stopPropagation();
    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const showNextPhoto = (event) => {
    event.stopPropagation();
    setSelectedPhotoIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  const handleMouseDown = (event) => {
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    setDragState((prev) => ({ ...prev, isDragging: true }));
  };

  const handleTouchStart = (event) => {
    startXRef.current = event.touches[0].clientX;
    startYRef.current = event.touches[0].clientY;
    setDragState((prev) => ({ ...prev, isDragging: true }));
  };

  const updateDrag = (deltaX, deltaY) => {
    setDragState({ x: deltaX, y: deltaY, isDragging: true });

    if (Math.abs(deltaX) > 40) {
      setSwipeOverlay(deltaX > 0 ? 'like' : 'dislike');
      return;
    }

    if (deltaY < -45) {
      setSwipeOverlay('superlike');
      return;
    }

    setSwipeOverlay(null);
  };

  const handleMouseMove = (event) => {
    if (!dragState.isDragging) return;
    updateDrag(event.clientX - startXRef.current, event.clientY - startYRef.current);
  };

  const handleTouchMove = (event) => {
    if (!dragState.isDragging) return;
    updateDrag(event.touches[0].clientX - startXRef.current, event.touches[0].clientY - startYRef.current);
  };

  const handleEnd = () => {
    const threshold = 110;

    if (dragState.x > threshold) {
      onLike?.();
    } else if (dragState.x < -threshold) {
      onDislike?.();
    } else if (dragState.y < -threshold) {
      onSuperLike?.();
    }

    setDragState({ x: 0, y: 0, isDragging: false });
    setSwipeOverlay(null);
  };

  const rotationAngle = (dragState.x / 320) * 7;
  const translateX = dragState.x * 0.52;
  const translateY = dragState.y * 0.15;
  const scaleValue = 1 - Math.min(Math.abs(dragState.x), 160) / 1900;

  return (
    <>
      <div
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        className="w-full h-full rounded-[2rem] cursor-grab active:cursor-grabbing touch-none overflow-hidden border relative"
        style={{
          borderColor: 'rgba(251,113,133,0.24)',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.99), rgba(252,238,243,0.95) 56%, rgba(247,230,239,0.96))',
          boxShadow: '0 42px 110px rgba(190,24,93,0.22), 0 18px 42px rgba(15,23,42,0.14)',
          transform: `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rotationAngle}deg) scale(${scaleValue})`,
          opacity: 1 - Math.min(Math.abs(dragState.x), 260) / 1300,
          transition: dragState.isDragging ? 'none' : 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease',
          animation: 'fadeInUp 520ms cubic-bezier(0.22, 1, 0.36, 1), float 7s ease-in-out infinite 0.5s'
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 84% 2%, rgba(251,113,133,0.24), transparent 34%), radial-gradient(circle at 10% 86%, rgba(176,123,172,0.18), transparent 28%)' }} />

        {swipeOverlay === 'like' ? (
          <div className="absolute inset-0 z-40 border-4 border-emerald-400/85 rounded-[2rem] flex items-center justify-center bg-emerald-50/20">
            <span className="text-7xl swipe-overlay-icon">❤️</span>
          </div>
        ) : null}

        {swipeOverlay === 'dislike' ? (
          <div className="absolute inset-0 z-40 border-4 border-rose-500/85 rounded-[2rem] flex items-center justify-center bg-rose-50/25">
            <span className="text-7xl swipe-overlay-icon">✕</span>
          </div>
        ) : null}

        {swipeOverlay === 'superlike' ? (
          <div className="absolute inset-0 z-40 border-4 border-violet-500/85 rounded-[2rem] flex items-center justify-center bg-violet-50/25">
            <span className="text-7xl swipe-overlay-icon">⭐</span>
          </div>
        ) : null}

        <div className="relative h-full flex flex-col">
          <section className="relative flex-[1.35] min-h-0 p-4 md:p-5 pb-2">
            <div
              onClick={showPreviewModal}
              className="relative h-full rounded-[1.6rem] overflow-hidden border group"
              style={{
                borderColor: 'rgba(255,255,255,0.82)',
                boxShadow: '0 24px 58px rgba(190,24,93,0.25), inset 0 1px 0 rgba(255,255,255,0.58)',
                background: 'linear-gradient(145deg, rgba(244,114,182,0.22), rgba(176,123,172,0.24))'
              }}
            >
              {hasPhoto ? (
                <img
                  src={activePhoto}
                  alt={`${profile?.name || 'Profile'} photo ${selectedPhotoIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #ffd8e6 0%, #f8dff4 48%, #dfd7ff 100%)' }}>
                  <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }} />
                  <div className="absolute -bottom-12 -right-10 w-44 h-44 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.38)' }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[62%] max-w-[220px] aspect-square rounded-full border backdrop-blur-xl flex items-center justify-center" style={{ borderColor: 'rgba(255,255,255,0.72)', background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8), rgba(255,255,255,0.24))', boxShadow: '0 30px 60px rgba(123,31,79,0.24), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                    <div className="w-[72%] h-[72%] rounded-full border flex items-center justify-center text-[5rem]" style={{ borderColor: 'rgba(255,255,255,0.62)', background: 'linear-gradient(140deg, rgba(255,255,255,0.7), rgba(255,255,255,0.16))' }}>
                      {visual.value}
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.22) 42%, rgba(15,23,42,0.65) 100%)' }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(125deg, rgba(255,255,255,0.28) 0%, transparent 30%, transparent 60%, rgba(255,255,255,0.14) 100%)' }} />

              {multiplePhotos ? (
                <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center gap-1.5">
                  {gallery.map((item, idx) => (
                    <button
                      type="button"
                      key={`${item}-top-${idx}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPhotoIndex(idx);
                      }}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        flex: 1,
                        backgroundColor: idx === selectedPhotoIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                        boxShadow: idx === selectedPhotoIndex ? '0 0 18px rgba(255,255,255,0.62)' : 'none'
                      }}
                    />
                  ))}
                </div>
              ) : null}

              <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border backdrop-blur-md" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.38)' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#34d399' }} />
                  {signals.activityLabel}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {isVerifiedProfile ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.38)' }}>
                      ✅ Verified
                    </span>
                  ) : null}
                  {signals.isPopular ? (
                    <StatusBadge label="Popular" icon="🔥" tone="popular" />
                  ) : null}
                  {signals.isFreshProfile ? (
                    <StatusBadge label="New" icon="🌟" tone="new" />
                  ) : null}
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <div className="rounded-2xl p-3.5 backdrop-blur-xl border" style={{ backgroundColor: 'rgba(10,10,18,0.35)', borderColor: 'rgba(255,255,255,0.38)' }}>
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h1 className="text-3xl md:text-[2.65rem] font-black text-white leading-none truncate tracking-tight" style={{ textShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                        {profile?.name || 'Unknown'}, <span className="text-white/85">{profile?.age || 21}</span>
                      </h1>
                      <p className="text-xs mt-2 text-white/80 truncate">
                        {profile?.college || 'Community member'}
                        {profile?.course ? ` • ${profile.course}` : ''}
                        {profile?.year ? ` • Year ${profile.year}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold" style={{ background: 'linear-gradient(140deg, rgba(255,107,138,0.95), rgba(176,123,172,0.95))', color: '#fff', boxShadow: '0 0 18px rgba(244,114,182,0.55)', animation: 'pulseHeart 2.4s ease-in-out infinite' }}>
                      {signals.vibeMatch}% vibe
                    </div>
                  </div>
                </div>
              </div>

              {multiplePhotos ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border flex items-center justify-center text-white transition hover:scale-110"
                    style={{ backgroundColor: 'rgba(15,23,42,0.35)', borderColor: 'rgba(255,255,255,0.45)' }}
                    title="Previous photo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border flex items-center justify-center text-white transition hover:scale-110"
                    style={{ backgroundColor: 'rgba(15,23,42,0.35)', borderColor: 'rgba(255,255,255,0.45)' }}
                    title="Next photo"
                  >
                    ›
                  </button>
                </>
              ) : null}

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1 rounded-full border backdrop-blur-md" style={{ backgroundColor: 'rgba(15,23,42,0.25)', borderColor: 'rgba(255,255,255,0.35)' }}>
                <span className="text-white/85 text-[11px] animate-pulse">◀</span>
                <span className="text-white text-[10px] font-semibold tracking-[0.12em] uppercase">Swipe vibes</span>
                <span className="text-white/85 text-[11px] animate-pulse">▶</span>
              </div>
            </div>
          </section>

          <section className="px-5 md:px-6 pt-0 pb-4">
            <div className="rounded-2xl border px-4 py-4 backdrop-blur-xl" style={{ borderColor: 'rgba(251,113,133,0.27)', background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(252,239,246,0.82))', boxShadow: '0 16px 34px rgba(190,24,93,0.1)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <SignalChip label="Vibe Match" value={`${signals.vibeMatch}%`} tone="rose" />
                <SignalChip label="Shared Interests" value={`${signals.sharedInterests}`} tone="lavender" />
                <SignalChip label="Popular Nearby" value={signals.campusPulse ? 'Trending' : 'Growing'} tone="neutral" />
                <SignalChip label="Weekly Requests" value={`+${signals.matchMomentum}`} tone="warm" />
              </div>

              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.14em] font-bold" style={{ color: '#91516e' }}>About</p>
                <div className="mt-1.5 rounded-xl border px-3 py-2.5" style={{ borderColor: 'rgba(251,113,133,0.2)', background: 'rgba(255,255,255,0.72)' }}>
                  <p
                    className={`text-sm leading-relaxed ${bioExpanded ? '' : 'line-clamp-2'}`}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {aboutText}
                  </p>
                  {aboutText.length > 130 ? (
                    <button
                      type="button"
                      onClick={() => setBioExpanded((prev) => !prev)}
                      className="text-xs font-semibold mt-1.5 transition hover:opacity-80"
                      style={{ color: 'var(--accent-pink)' }}
                    >
                      {bioExpanded ? 'Show less' : 'Expand bio'}
                    </button>
                  ) : null}
                </div>
              </div>

              {interestList.length > 0 ? (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {interestList.map((interest, idx) => (
                    <span
                      key={`${interest}-${idx}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-default"
                      style={{
                        borderColor: 'rgba(251,113,133,0.28)',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(252,238,243,0.9))',
                        color: 'var(--text-dark)'
                      }}
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3.5">
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold border" style={{ borderColor: 'rgba(251,113,133,0.2)', backgroundColor: 'rgba(255,255,255,0.86)', color: 'var(--text-secondary)' }}>
                    ✨ New vibes loading
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="px-4 md:px-6 pb-4 md:pb-5 mt-auto">
            <div className="rounded-[1.4rem] border px-3 py-3 backdrop-blur-xl" style={{ borderColor: 'rgba(251,113,133,0.3)', background: 'linear-gradient(140deg, rgba(255,255,255,0.94), rgba(252,238,243,0.88))', boxShadow: '0 20px 42px rgba(190,24,93,0.14)' }}>
              <div className="flex items-end justify-center gap-2.5 md:gap-3.5">
                <ActionButton label="Pass" icon="✕" tone="cool" onClick={onDislike} />
                <ActionButton label="Connect" icon="❤️" tone="primary" onClick={onLike} featured />
                <ActionButton label="Boost" icon="⭐" tone="violet" onClick={onSuperLike} />
                <ActionButton label="Chat" icon="💬" tone="sky" onClick={onChatRequest} />
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] px-1" style={{ color: '#85586e' }}>
              <span className="inline-flex items-center gap-1">
                <span style={{ color: 'var(--accent-pink)', animation: 'floatUp 1.8s ease-in-out infinite' }}>◀</span>
                Swipe left to pass
              </span>
              <span className="inline-flex items-center gap-1">
                Swipe right to connect
                <span style={{ color: 'var(--accent-pink)', animation: 'floatUp 1.8s ease-in-out infinite 0.22s' }}>▶</span>
              </span>
            </div>
          </section>
        </div>
      </div>

      <PhotoPreviewModal
        isOpen={showPhotoModal}
        photos={gallery}
        captions={(profile?.gallery || []).map((item) => item?.caption || '')}
        initialIndex={selectedPhotoIndex}
        onClose={() => setShowPhotoModal(false)}
        userName={profile?.name || 'User'}
      />
    </>
  );
}

function SignalChip({ label, value, tone = 'rose' }) {
  const toneMap = {
    rose: {
      bg: 'linear-gradient(140deg, rgba(255,107,138,0.18), rgba(255,255,255,0.95))',
      color: '#7f1d51'
    },
    lavender: {
      bg: 'linear-gradient(140deg, rgba(176,123,172,0.2), rgba(255,255,255,0.95))',
      color: '#5b326b'
    },
    neutral: {
      bg: 'linear-gradient(140deg, rgba(255,255,255,0.95), rgba(244,234,241,0.82))',
      color: '#6d4c7d'
    },
    warm: {
      bg: 'linear-gradient(140deg, rgba(255,167,196,0.24), rgba(255,255,255,0.95))',
      color: '#8f3455'
    }
  };

  const style = toneMap[tone] || toneMap.rose;

  return (
    <div className="rounded-xl border px-2.5 py-2" style={{ borderColor: 'rgba(251,113,133,0.2)', background: style.bg }}>
      <p className="text-[10px] uppercase tracking-[0.14em] font-semibold opacity-80" style={{ color: style.color }}>{label}</p>
      <p className="text-sm font-bold mt-1" style={{ color: style.color }}>{value}</p>
    </div>
  );
}

function StatusBadge({ label, icon, tone = 'popular' }) {
  const toneMap = {
    popular: {
      background: 'linear-gradient(135deg, rgba(251,113,133,0.86), rgba(236,72,153,0.9))',
      shadow: '0 10px 22px rgba(236,72,153,0.4)'
    },
    new: {
      background: 'linear-gradient(135deg, rgba(59,130,246,0.84), rgba(14,165,233,0.9))',
      shadow: '0 10px 22px rgba(59,130,246,0.35)'
    }
  };

  const style = toneMap[tone] || toneMap.popular;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white border border-white/45"
      style={{
        background: style.background,
        boxShadow: style.shadow,
        animation: 'pulseHeart 2.2s ease-in-out infinite'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function ActionButton({ label, icon, tone, onClick, featured = false }) {
  const styles = {
    cool: 'linear-gradient(145deg, #7c8db4, #adbad8)',
    primary: 'linear-gradient(145deg, #ff5f90, #b07bac)',
    violet: 'linear-gradient(145deg, #8f6df2, #b08bff)',
    sky: 'linear-gradient(145deg, #2dbcd4, #4b95f1)'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1 transition-transform duration-200 hover:-translate-y-1.5 active:translate-y-0.5 active:scale-95"
      title={label}
      style={{ animation: featured ? 'pulseHeart 2.2s ease-in-out infinite' : 'none' }}
    >
      <div
        className={`rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${featured ? 'w-20 h-20 text-[2.5rem]' : 'w-16 h-16 text-[1.7rem]'}`}
        style={{
          background: styles[tone] || styles.primary,
          boxShadow: featured ? '0 0 30px rgba(244,114,182,0.55), 0 18px 34px rgba(236,72,153,0.42)' : '0 12px 20px rgba(15,23,42,0.24)'
        }}
      >
        {icon}
      </div>
      <span className="text-[11px] font-semibold" style={{ color: featured ? 'var(--accent-pink)' : 'var(--text-secondary)' }}>{label}</span>
    </button>
  );
}
