import React from 'react';
import { resolvePublicProfileVisual } from '../../utils/profileMedia';

function formatRelative(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;

  return date.toLocaleDateString();
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onlineUsers,
  loading,
  error,
  unreadTotal,
  search,
  onSearchChange
}) {
  const filtered = React.useMemo(() => {
    try {
      if (!Array.isArray(conversations)) {
        return [];
      }
      return conversations.filter((item) => {
        if (!item || typeof item !== 'object') {
          return false;
        }
        const name = item?.participant?.name ?? '';
        const nickname = item?.viewerNickname ?? '';
        const query = (search ?? '').toLowerCase();
        return `${name} ${nickname}`.toLowerCase().includes(query);
      });
    } catch (error) {
      console.error('Error filtering conversations:', error);
      return conversations || [];
    }
  }, [conversations, search]);

  return (
    <aside className="w-full h-full bg-gradient-to-b from-white via-[#fff8f2] to-[#fff5ec] border-r border-softPink/45 flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-softPink/45 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-darkBrown tracking-tight">Inbox</h2>
          <span className="text-xs px-2.5 py-1 rounded-full border border-softPink/60 bg-softPink/15 text-darkBrown font-semibold">
            {unreadTotal > 0 ? `${unreadTotal} unread` : 'up to date'}
          </span>
        </div>
        <p className="text-sm text-softBrown mt-1">Your matches and conversations</p>

        <div className="mt-4 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-softBrown text-sm">🔎</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search matches"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-softPink/60 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blushPink"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? <StateMessage text="Loading conversations..." /> : null}
        {error ? <StateMessage text={error} isError /> : null}

        {!loading && !error && !filtered.length ? (
          <StateMessage text="No conversations yet. Match first to start chatting." />
        ) : null}

        {!loading && !error
          ? filtered.map((item) => {
              if (!item || typeof item !== 'object') {
                return null;
              }
              const isSelected = selectedConversationId === item._id;
              const online = onlineUsers.has(item.participant?._id);

              return (
                <button
                  key={item._id}
                  className={`w-full text-left px-4 py-3.5 border-b border-softPink/20 transition ${
                    isSelected
                      ? 'bg-white shadow-[inset_4px_0_0_0_rgba(244,114,182,0.95)]'
                      : 'hover:bg-white/70'
                  }`}
                  onClick={() => onSelectConversation(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-blushPink to-softPink flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
                      {resolvePublicProfileVisual(item.participant).type === 'photo' ? (
                        <img
                          src={resolvePublicProfileVisual(item.participant).value}
                          alt={item.participant?.name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{resolvePublicProfileVisual(item.participant).value}</span>
                      )}
                      {online ? (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <p className="font-semibold text-darkBrown truncate text-[15px]">{item?.participant?.name ?? 'Unknown User'}</p>
                          {item?.viewerNickname ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border border-softPink/60 bg-softPink/15 text-darkBrown">
                              {item.viewerNickname}
                            </span>
                          ) : null}
                          {(item?.participant?.privacy?.showVerifiedBadge !== false) && (item?.participant?.verified_badge || item?.participant?.is_verified || item?.participant?.college_verification_status === 'verified') ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border border-blue-200 bg-blue-50 text-blue-600">
                              ✓
                            </span>
                          ) : null}
                        </div>
                        <span className="text-xs text-softBrown">{formatRelative(item?.lastMessageTime ?? item?.updatedAt)}</span>
                      </div>

                      <p className="text-sm text-softBrown truncate mt-0.5">{item?.lastMessage ?? 'Say hello 👋'}</p>
                    </div>

                    {(item?.unreadCount ?? 0) > 0 ? (
                      <span className="h-6 min-w-6 px-2 rounded-full bg-blushPink text-white text-xs font-bold flex items-center justify-center">
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          : null}
      </div>
    </aside>
  );
}

function StateMessage({ text, isError = false }) {
  return (
    <div className={`p-6 text-sm text-center ${isError ? 'text-red-600' : 'text-softBrown'}`}>
      {text}
    </div>
  );
}
