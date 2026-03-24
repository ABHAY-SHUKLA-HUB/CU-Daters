import React from 'react';
import { Link } from 'react-router-dom';
import { resolvePublicProfileVisual } from '../../utils/profileMedia';

export default function ChatEmptyState({ suggestedMatches = [], onStartConversation }) {
  const topMatches = Array.isArray(suggestedMatches) ? suggestedMatches.slice(0, 3) : [];

  return (
    <div className="h-full flex items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(255,182,193,0.25),transparent_38%),linear-gradient(180deg,#fff9f3_0%,#fff4ea_100%)] px-6">
      <div className="text-center max-w-lg rounded-2xl border border-[var(--border-light)] bg-white/[0.88] backdrop-blur-xl shadow-[0 4px 12px rgba(0,0,0,0.08)] p-8">
        
        {/* Empty State Icon */}
        <div className="text-6xl mb-4 animate-bounce">💖</div>
        
        {/* Main Message */}
        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>
          You haven't started any chats yet
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Match with someone to start a real-time conversation
        </p>

        {/* Quick Start Suggestions */}
        {topMatches.length > 0 && (
          <div className="mt-6 space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-secondary)' }}>
              💫 Start a conversation
            </p>
            {topMatches.map((match) => {
              const participant = match?.participant || match;
              const participantId = participant?._id || participant?.id;
              const visual = resolvePublicProfileVisual(participant);
              return (
                <button
                  key={participantId}
                  type="button"
                  onClick={() => onStartConversation?.(participantId)}
                  className="w-full px-4 py-3 rounded-lg transition"
                  style={{
                    backgroundColor: 'var(--glass-bg)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-dark)'
                  }}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'var(--accent-pink)', opacity: 0.2 }}
                      >
                        {visual.type === 'photo' ? (
                          <img src={visual.value} alt={participant?.name || 'Match'} className="w-full h-full object-cover" />
                        ) : (
                          <span>{visual.value}</span>
                        )}
                      </span>
                      <span className="truncate text-sm font-semibold">{participant?.name || 'Match'}</span>
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--accent-pink)' }}>
                      Chat →
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* CTA to Discover */}
        <Link 
          to="/dashboard?tab=browse" 
          className="inline-block mt-6 px-6 py-3 rounded-xl font-bold transition text-white"
          style={{
            backgroundColor: 'var(--accent-pink)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          ✨ Go to Discover
        </Link>

        {/* Secondary CTA */}
        <p className="text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
          Swipe through profiles and find your perfect match
        </p>
      </div>
    </div>
  );
}
