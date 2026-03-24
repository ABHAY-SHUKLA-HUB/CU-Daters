import React from 'react';
import { resolvePublicProfileVisual } from '../utils/profileMedia';

const TAG_OPTIONS = ['Friend', 'Close Friend', 'Crush', 'Study Buddy', 'Coffee Buddy', 'Campus Buddy', 'Date Vibe'];

export default function RecentMatches({
  matches,
  onMessage,
  onViewAll,
  compact = false,
  mode = 'matches',
  onToggleFavorite,
  onToggleMute,
  onTagChange,
  onRemoveConnection
}) {
  const isConnectionsMode = mode === 'connections';
  const rootClass = compact
    ? ''
    : isConnectionsMode
      ? 'rounded-2xl p-5 border border-rose-200/80 bg-white/95 shadow-[0_12px_34px_rgba(190,24,93,0.08)]'
      : 'glass-panel rounded-2xl p-5 border border-white/15';

  const normalizedItems = (matches || []).map((item) => {
    if (item?.participant) {
      return {
        id: item._id,
        profile: item.participant,
        connectionMeta: item.connectionMeta || {},
        raw: item
      };
    }
    return {
      id: item?._id || item?.id || Math.random().toString(36).slice(2),
      profile: item,
      connectionMeta: item?.connectionMeta || {},
      raw: item
    };
  });

  return (
    <div className={rootClass}>
      <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isConnectionsMode ? 'text-rose-700' : 'text-white'}`}>
        <span className="text-xl">{mode === 'connections' ? '🤝' : '❤️'}</span>
        {mode === 'connections' ? 'Your People' : 'Recent Matches'}
      </h3>

      {mode === 'connections' ? (
        <div className="space-y-2.5">
          {normalizedItems.length ? normalizedItems.map((item) => {
            const visual = resolvePublicProfileVisual(item.profile);
            const tag = item.connectionMeta?.tag || 'Friend';
            const favorite = Boolean(item.connectionMeta?.favorite);
            const muted = Boolean(item.connectionMeta?.muted);

            return (
              <div key={item.id} className="rounded-xl border border-rose-200/75 bg-white p-3 shadow-[0_8px_20px_rgba(190,24,93,0.06)]">
                <div className="flex items-center justify-between gap-2">
                  <button className="flex items-center gap-2 min-w-0 text-left" onClick={() => onMessage?.(item.raw)}>
                    {visual.type === 'photo' ? (
                      <img src={visual.value} alt={item.profile?.name} className="w-10 h-10 rounded-full object-cover border border-rose-200" />
                    ) : (
                      <span className="w-10 h-10 rounded-full border border-rose-200 flex items-center justify-center text-xl bg-rose-50">{visual.value}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-rose-700 truncate">{item.profile?.name || 'Campus friend'}</p>
                      <p className="text-[11px] text-rose-500 truncate">{item.profile?.college || 'Campus network'}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => onMessage?.(item.raw)}
                    className="px-2.5 py-1 text-[11px] rounded-full border border-rose-200 bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 transition"
                  >
                    Message
                  </button>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                  <select
                    value={tag}
                    onChange={(event) => onTagChange?.(item.raw, event.target.value)}
                    className="rounded-full border border-rose-200 bg-white text-rose-700 text-[11px] px-2 py-1"
                  >
                    {TAG_OPTIONS.map((opt) => <option key={opt} value={opt} className="text-black">{opt}</option>)}
                  </select>

                  <button onClick={() => onToggleFavorite?.(item.raw, !favorite)} className={`text-[11px] px-2 py-1 rounded-full border ${favorite ? 'border-amber-300 bg-amber-100 text-amber-700' : 'border-rose-200 bg-white text-rose-700'}`}>
                    {favorite ? '★ Favorite' : '☆ Favorite'}
                  </button>

                  <button onClick={() => onToggleMute?.(item.raw, !muted)} className={`text-[11px] px-2 py-1 rounded-full border ${muted ? 'border-sky-300 bg-sky-100 text-sky-700' : 'border-rose-200 bg-white text-rose-700'}`}>
                    {muted ? 'Muted' : 'Mute'}
                  </button>

                  <button onClick={() => onRemoveConnection?.(item.raw)} className="text-[11px] px-2 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition">
                    Remove
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">🤝</p>
              <p className="text-sm text-gray-300">No connections yet</p>
              <p className="text-xs text-gray-500 mt-1">Accept a request to start your campus circle.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {normalizedItems.length > 0 ? (
            normalizedItems.slice(0, 6).map((item, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-xl bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center cursor-pointer hover:shadow-lg transition-all hover:scale-105 border border-white/10 hover:border-white/30"
              onClick={() => onMessage?.(item.raw)}
            >
              <div className="text-center px-2">
                {resolvePublicProfileVisual(item.profile).type === 'photo' ? (
                  <img
                    src={resolvePublicProfileVisual(item.profile).value}
                    alt={item.profile?.name}
                    className="w-12 h-12 rounded-full object-cover mx-auto mb-1 border border-white/30"
                  />
                ) : (
                  <p className="text-3xl mb-1">{resolvePublicProfileVisual(item.profile).value}</p>
                )}
                <p className="text-xs font-bold text-white truncate">{item.profile?.name}</p>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onMessage?.(item.raw);
                  }}
                  className="mt-1 px-2 py-1 text-[10px] rounded-full border border-white/25 bg-white/12 text-white font-semibold hover:bg-white/20 transition"
                >
                  Message Now
                </button>
              </div>
            </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6">
              <p className="text-2xl mb-2">💔</p>
              <p className="text-sm text-gray-300">No matches yet</p>
              <p className="text-xs text-gray-500 mt-1">Start liking profiles!</p>
            </div>
          )}
        </div>
      )}

      {mode !== 'connections' && matches && matches.length > 6 && (
        <button onClick={() => onViewAll?.()} className="w-full mt-4 py-2 text-sm font-bold text-white btn-secondary rounded-lg">
          View All ({matches.length})
        </button>
      )}
    </div>
  );
}
