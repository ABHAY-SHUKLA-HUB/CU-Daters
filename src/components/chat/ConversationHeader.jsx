import React from 'react';
import { resolvePublicProfileVisual } from '../../utils/profileMedia';

export default function ConversationHeader({
  participant,
  viewerNickname,
  chatTheme,
  isOnline,
  lastSeenAt,
  blocked,
  onBack,
  onViewProfile,
  onSetNickname,
  onChangeTheme,
  onBlock,
  onReport,
  onUnmatch,
  onDelete,
  onStartVoiceCall,
  onStartVideoCall
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const visual = resolvePublicProfileVisual(participant);

  const presenceLabel = React.useMemo(() => {
    if (blocked) {
      return 'Chat unavailable';
    }
    if (isOnline) {
      return 'Active now';
    }
    if (!lastSeenAt) {
      return 'Offline';
    }
    return `Last seen ${new Date(lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [blocked, isOnline, lastSeenAt]);

  return (
    <header className="relative border-b border-rose-200/60 px-4 md:px-5 py-3.5 bg-white/86 backdrop-blur-xl flex items-center justify-between gap-3 shadow-[0_8px_24px_rgba(190,24,93,0.08)]">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onBack} className="md:hidden text-xl text-rose-500 w-9 h-9 rounded-full border border-rose-200/70 bg-white shadow-sm" aria-label="Back to conversations">
          ←
        </button>

        <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 text-white flex items-center justify-center font-bold overflow-hidden shadow-[0_12px_28px_rgba(244,63,94,0.24)]">
          {visual.type === 'photo' ? (
            <img src={visual.value} alt={participant?.name || 'User'} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl">{visual.value}</span>
          )}
          {isOnline ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" /> : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-bold text-darkBrown truncate text-[15px]">{viewerNickname || participant?.name || 'Conversation'}</p>
            {(participant?.privacy?.showVerifiedBadge !== false) && (participant?.verified_badge || participant?.is_verified || participant?.college_verification_status === 'verified') ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-blue-200 bg-blue-50 text-blue-600">
                ✓ Verified
              </span>
            ) : null}
          </div>
          {viewerNickname ? (
            <p className="text-[11px] text-softBrown/80">@{participant?.name || 'User'}</p>
          ) : null}
          <p className="text-xs text-softBrown">{presenceLabel}</p>
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={onStartVoiceCall}
          disabled={blocked}
          className="w-9 h-9 rounded-full border border-rose-200/70 bg-white hover:bg-rose-50 text-base shadow-sm disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label="Start voice call"
          title="Start voice call"
        >
          📞
        </button>
        <button
          onClick={onStartVideoCall}
          disabled={blocked}
          className="w-9 h-9 rounded-full border border-rose-200/70 bg-white hover:bg-rose-50 text-base shadow-sm disabled:opacity-45 disabled:cursor-not-allowed"
          aria-label="Start video call"
          title="Start video call"
        >
          🎥
        </button>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-9 h-9 rounded-full border border-rose-200/70 bg-white hover:bg-rose-50 text-rose-500 shadow-sm"
          aria-label="Chat actions"
        >
          ⋯
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-10 w-44 bg-white/95 border border-rose-200/80 rounded-xl shadow-[0_18px_40px_rgba(190,24,93,0.16)] overflow-hidden z-20 backdrop-blur-sm">
            <button
              onClick={() => {
                setMenuOpen(false);
                onViewProfile?.();
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-creamyWhite"
            >
              View profile
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onSetNickname?.();
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-creamyWhite"
            >
              Set nickname
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onChangeTheme?.();
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-creamyWhite"
            >
              Change theme
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onBlock();
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-creamyWhite"
            >
              Block user
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onReport?.();
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-creamyWhite"
            >
              Report user
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onUnmatch();
              }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-creamyWhite"
            >
              Unmatch
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete chat
            </button>
          </div>
        ) : null}
      </div>

      {chatTheme ? (
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border border-softPink/40 bg-white/80 text-softBrown absolute left-1/2 -translate-x-1/2 top-3">
          Theme: {chatTheme}
        </span>
      ) : null}
    </header>
  );
}
