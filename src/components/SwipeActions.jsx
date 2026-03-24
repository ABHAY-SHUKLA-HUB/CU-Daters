import React from 'react';

/**
 * SwipeActions Component - Bottom action buttons for swipe interactions
 */
export default function SwipeActions({ onPass, onLike, onSuperLike, disabled = false, isLoading = false, superLikeLabel = 'Priority Request' }) {
  const baseClass = 'rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center font-bold text-xl sm:text-2xl transition-all duration-200 transform active:scale-90 shadow-lg border disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-4 z-20 rounded-full border border-rose-200/70 bg-white/90 px-3 py-2 shadow-[0_16px_40px_rgba(190,24,93,0.16)] backdrop-blur">
      {/* Pass Button - Left */}
      <button
        onClick={onPass}
        disabled={disabled || isLoading}
        className={`${baseClass} bg-white hover:bg-rose-50 text-rose-600 border-rose-200`}
        title="Pass"
        aria-label="Pass"
      >
        ✕
      </button>

      {/* Send Request Button - Center */}
      <button
        onClick={onLike}
        disabled={disabled || isLoading}
        className={`${baseClass} w-auto px-4 sm:px-5 bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-600 hover:to-fuchsia-600 text-white border-rose-300/50`}
        title="Send Request"
        aria-label="Send Request"
      >
        <span className="text-sm sm:text-base">Send Request</span>
      </button>

      {/* Priority Request Button - Right */}
      <button
        onClick={onSuperLike}
        disabled={disabled || isLoading}
        className={`${baseClass} bg-white hover:bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200`}
        title={superLikeLabel}
        aria-label={superLikeLabel}
      >
        {superLikeLabel === 'Chat' ? '💬' : '✨'}
      </button>
    </div>
  );
}
