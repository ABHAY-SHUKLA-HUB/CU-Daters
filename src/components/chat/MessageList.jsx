import React from 'react';

const toSafeDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (dateValue) => {
  const date = toSafeDate(dateValue);
  if (!date) {
    return '';
  }
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDayLabel = (dateValue) => {
  const date = toSafeDate(dateValue);
  if (!date) {
    return 'Recent';
  }
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) {
    return 'Today';
  }
  if (sameDay(date, yesterday)) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
};

const resolveSenderId = (message) => {
  const sender = message?.senderId;
  if (typeof sender === 'string') {
    return sender;
  }
  if (sender && typeof sender === 'object' && sender._id) {
    return sender._id.toString();
  }
  return sender?.toString?.() || '';
};

const isEmojiOnlyText = (text) => {
  const normalized = String(text || '').trim();
  if (!normalized) {
    return false;
  }

  for (const char of normalized) {
    const cp = char.codePointAt(0);
    if (!cp) {
      return false;
    }

    const isWhitespace = /\s/.test(char);
    const isVariationSelector = cp === 0xfe0f;
    const isJoiner = cp === 0x200d;
    const isEmojiRange =
      (cp >= 0x1f000 && cp <= 0x1faff) ||
      (cp >= 0x2600 && cp <= 0x27bf) ||
      (cp >= 0x2300 && cp <= 0x23ff);

    if (!(isWhitespace || isVariationSelector || isJoiner || isEmojiRange)) {
      return false;
    }
  }

  return true;
};

export default function MessageList({
  conversationId,
  messages,
  myUserId,
  typingName,
  participantName,
  hasMore = false,
  loadingOlder = false,
  onLoadOlder,
  onReact
}) {
  const listRef = React.useRef(null);
  const bottomAnchorRef = React.useRef(null);
  const shouldStickToBottomRef = React.useRef(true);
  const previousMessageCountRef = React.useRef(0);
  const previousLastMessageIdRef = React.useRef('');
  const previousConversationIdRef = React.useRef(conversationId || '');
  const [showNewMessagesButton, setShowNewMessagesButton] = React.useState(false);
  const [pendingNewMessages, setPendingNewMessages] = React.useState(0);
  const [hoveredMessageId, setHoveredMessageId] = React.useState('');

  const SCROLL_BOTTOM_THRESHOLD = 120;

  const scrollToBottom = React.useCallback((behavior = 'smooth') => {
    const listNode = listRef.current;
    if (!listNode) {
      return;
    }

    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior, block: 'end' });
      return;
    }

    listNode.scrollTo({ top: listNode.scrollHeight, behavior });
  }, []);

  const queueScrollToBottom = React.useCallback((behavior = 'smooth') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom(behavior);
      });
    });
  }, [scrollToBottom]);

  const normalizeSenderId = React.useCallback((message) => resolveSenderId(message), []);

  const checkStickiness = React.useCallback(() => {
    if (!listRef.current) {
      return;
    }
    const node = listRef.current;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    const nearBottom = distanceFromBottom < SCROLL_BOTTOM_THRESHOLD;
    shouldStickToBottomRef.current = nearBottom;

    if (nearBottom) {
      setShowNewMessagesButton(false);
      setPendingNewMessages(0);
    }
  }, [SCROLL_BOTTOM_THRESHOLD]);

  React.useEffect(() => {
    if (!listRef.current) {
      return;
    }

    const conversationChanged = previousConversationIdRef.current !== (conversationId || '');
    if (conversationChanged) {
      shouldStickToBottomRef.current = true;
      previousMessageCountRef.current = messages.length;
      previousLastMessageIdRef.current = '';
      previousConversationIdRef.current = conversationId || '';
      setShowNewMessagesButton(false);
      setPendingNewMessages(0);
      queueScrollToBottom('auto');
    }

    const lastMessage = messages[messages.length - 1];
    const currentLastMessageId =
      lastMessage?._id ||
      lastMessage?.clientTempId ||
      lastMessage?.clientMessageId ||
      `${lastMessage?.createdAt || ''}-${messages.length}`;
    const previousLastMessageId = previousLastMessageIdRef.current;
    const isNewLastMessage = Boolean(currentLastMessageId && currentLastMessageId !== previousLastMessageId);
    const lastMessageIsMine = normalizeSenderId(lastMessage) === (myUserId ? myUserId.toString() : '');
    const messageCountIncreased = messages.length > previousMessageCountRef.current;

    if (typingName && shouldStickToBottomRef.current) {
      queueScrollToBottom('smooth');
    }

    if (shouldStickToBottomRef.current || (isNewLastMessage && lastMessageIsMine)) {
      setShowNewMessagesButton(false);
      setPendingNewMessages(0);
      queueScrollToBottom(conversationChanged ? 'auto' : 'smooth');
    } else if (messageCountIncreased && isNewLastMessage) {
      setShowNewMessagesButton(true);
      setPendingNewMessages((prev) => prev + 1);
    }

    previousMessageCountRef.current = messages.length;
    previousLastMessageIdRef.current = currentLastMessageId;
  }, [conversationId, messages, myUserId, normalizeSenderId, queueScrollToBottom, typingName]);

  React.useEffect(() => {
    const node = listRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (shouldStickToBottomRef.current) {
        queueScrollToBottom('auto');
      }
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [queueScrollToBottom]);

  React.useEffect(() => {
    const node = listRef.current;
    if (!node) {
      return;
    }
    node.addEventListener('scroll', checkStickiness);
    return () => node.removeEventListener('scroll', checkStickiness);
  }, [checkStickiness]);

  React.useEffect(() => {
    const viewport = window.visualViewport;
    const handleResize = () => {
      if (shouldStickToBottomRef.current) {
        queueScrollToBottom('auto');
      }
    };

    window.addEventListener('resize', handleResize);
    viewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      viewport?.removeEventListener('resize', handleResize);
    };
  }, [queueScrollToBottom]);

  const resolveDeliveryLabel = (message) => {
    if (message.deliveryStatus === 'failed') return { label: 'Failed', className: 'text-rose-500' };
    if (message.deliveryStatus === 'sending') return { label: 'Sending', className: 'text-amber-500' };
    if (message.seen || message.deliveryStatus === 'seen') return { label: 'Seen', className: 'text-blue-500' };
    if (message.deliveryStatus === 'delivered') return { label: 'Delivered', className: 'text-emerald-500' };
    return { label: 'Sent', className: 'text-gray-400' };
  };

  const formatDuration = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleLoadOlder = async () => {
    if (loadingOlder || !hasMore || typeof onLoadOlder !== 'function' || !listRef.current) {
      return;
    }

    const node = listRef.current;
    const previousScrollHeight = node.scrollHeight;
    const previousScrollTop = node.scrollTop;

    await onLoadOlder();

    requestAnimationFrame(() => {
      if (!listRef.current) {
        return;
      }
      const newScrollHeight = listRef.current.scrollHeight;
      listRef.current.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
    });
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={listRef}
        className="h-full overflow-y-auto px-4 py-5 space-y-3 bg-gradient-to-b from-white to-creamyWhite"
        style={{ scrollBehavior: 'smooth', scrollPaddingBottom: '14px' }}
      >
      {hasMore ? (
        <div className="flex justify-center pb-2">
          <button
            type="button"
            onClick={() => void handleLoadOlder()}
            disabled={loadingOlder}
            className="px-3 py-1.5 rounded-full border border-softPink/45 bg-white/90 text-softBrown text-xs font-semibold hover:bg-white disabled:opacity-60"
          >
            {loadingOlder ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      ) : null}

      {!messages.length ? (
        <div className="h-full flex items-center justify-center text-center text-softBrown">
          <div>
            <p className="text-4xl mb-2">💕</p>
            <p className="font-semibold text-darkBrown">
              {participantName ? `You matched with ${participantName}` : 'Start your first conversation'}
            </p>
            <p className="text-sm mt-1">
              {participantName ? 'Say hi to start the conversation. Send your first message below.' : 'Say something thoughtful and break the ice.'}
            </p>
          </div>
        </div>
      ) : null}

      {messages.map((message, index) => {
        const mine = resolveSenderId(message) === (myUserId ? myUserId.toString() : '');
        const prev = messages[index - 1];
        const createdAt = message.createdAt || new Date().toISOString();
        const prevCreatedAt = prev?.createdAt || createdAt;
        const showDayDivider = !prev || formatDayLabel(prevCreatedAt) !== formatDayLabel(createdAt);
        const messageType = message.messageType || 'text';
        const isVoice = messageType === 'voice';
        const isAttachment = messageType === 'attachment' || messageType === 'image' || messageType === 'file';
        const isSystem = messageType === 'system' || messageType === 'call';
        const rawText = typeof message.text === 'string' ? message.text : '';
        const isEmojiOnly = isEmojiOnlyText(rawText);
        const voiceDuration = Number(message?.voiceNote?.durationSec) || 0;
        const voiceUrl =
          message?.voiceNote?.url ||
          message?.voiceNote?.audioUrl ||
          message?.voiceNote?.dataUrl ||
          '';
        const attachment = message?.attachment || {};
        const attachmentUrl = attachment.url || attachment.previewUrl || '';
        const attachmentName = attachment.name || message.text || 'Attachment';
        const delivery = resolveDeliveryLabel(message);

        if (isSystem) {
          return (
            <div key={message._id || `${message.createdAt}-${message.text}-${index}`} className="flex justify-center py-1">
              <span className="px-3 py-1 rounded-full border border-slate-300/40 bg-slate-100 text-slate-600 text-[11px] font-medium">
                {message.text}
              </span>
            </div>
          );
        }

        return (
          <React.Fragment key={message._id || `${message.createdAt}-${message.text}-${index}`}>
            {showDayDivider ? (
              <div className="flex justify-center py-1">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-white/75 border border-softPink/45 text-softBrown shadow-sm">
                  {formatDayLabel(message.createdAt)}
                </span>
              </div>
            ) : null}

            <div
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              onMouseEnter={() => setHoveredMessageId(message?._id || '')}
              onMouseLeave={() => setHoveredMessageId('')}
            >
              <div className="max-w-[85%] lg:max-w-[72%]">
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm animate-message-bubble ${
                    mine
                      ? 'bg-gradient-to-r from-blushPink to-softPink text-white rounded-br-md'
                      : 'bg-white border border-softPink/50 text-darkBrown rounded-bl-md'
                  }`}
                >
                  {isVoice ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>🎙️</span>
                        <span>Voice note</span>
                        {voiceDuration ? <span className={`text-xs ${mine ? 'text-pink-50/90' : 'text-softBrown'}`}>{formatDuration(voiceDuration)}</span> : null}
                      </div>
                      {voiceUrl ? (
                        <audio controls src={voiceUrl} className="w-full h-9" preload="metadata" />
                      ) : (
                        <div className={`h-8 rounded-lg border px-3 flex items-center text-xs ${mine ? 'border-pink-100/40 text-pink-50/90' : 'border-softPink/60 text-softBrown'}`}>
                          Audio preview unavailable on this device
                        </div>
                      )}
                    </div>
                  ) : isAttachment ? (
                    attachment.mimeType?.startsWith('image/') && attachmentUrl ? (
                      <div className="space-y-2">
                        <img src={attachmentUrl} alt={attachmentName} className="w-full max-h-64 object-cover rounded-xl border border-white/20" />
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className={`${mine ? 'text-pink-50/90' : 'text-softBrown'} truncate`}>{attachmentName}</span>
                          <a href={attachmentUrl} target="_blank" rel="noreferrer" className={`underline ${mine ? 'text-pink-50' : 'text-rose-600'}`}>Open</a>
                        </div>
                      </div>
                    ) : (
                      <div className={`rounded-xl border px-3 py-2 ${mine ? 'border-pink-100/40 bg-white/10' : 'border-softPink/60 bg-softPink/10'}`}>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{attachment.mimeType?.startsWith('audio/') ? '🎵' : '📎'}</span>
                          <span className="truncate">{attachmentName}</span>
                        </div>
                        <div className="text-xs mt-1 opacity-80">{formatFileSize(attachment.size)} • {attachment.mimeType || 'file'}</div>
                        {attachmentUrl ? (
                          <a href={attachmentUrl} target="_blank" rel="noreferrer" className={`inline-block mt-1 text-xs underline ${mine ? 'text-pink-50' : 'text-rose-600'}`}>
                            Download / Open
                          </a>
                        ) : null}
                      </div>
                    )
                  ) : (
                    <p className={`${isEmojiOnly ? 'text-3xl leading-tight' : 'text-sm'} whitespace-pre-wrap break-words`}>{rawText}</p>
                  )}
                </div>

                {(message.reactions || []).length > 0 ? (
                  <div className={`mt-1 flex flex-wrap gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {(message.reactions || []).map((reaction, reactionIndex) => (
                      <span
                        key={`${reaction?.userId || 'u'}-${reaction?.emoji || 'e'}-${reactionIndex}`}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border border-softPink/45 bg-white/90 text-softBrown"
                      >
                        {reaction?.emoji || '❤️'}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className={`mt-1 text-xs flex items-center gap-1 ${mine ? 'justify-end text-softBrown' : 'text-softBrown'}`}>
                  <span>{formatTime(createdAt)}</span>
                  {mine ? <span className={delivery.className}>{delivery.label}</span> : null}
                </p>

                {!isSystem && message?._id ? (
                  <div className={`mt-1 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`inline-flex items-center gap-1 rounded-full border border-softPink/45 bg-white/85 backdrop-blur-sm px-1.5 py-1 transition-all duration-200 ${hoveredMessageId === message._id ? 'opacity-100 translate-y-0' : 'opacity-75'}`}>
                      {['❤️', '😂', '🔥', '😍'].map((emoji) => (
                        <button
                          key={`${message._id}-${emoji}`}
                          type="button"
                          onClick={() => onReact?.(message, emoji)}
                          className="h-6 w-6 rounded-full text-sm transition-transform duration-150 hover:scale-125 hover:bg-rose-50"
                          title={`React ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {typingName ? (
        <div className="flex justify-start">
          <div className="px-3 py-2 rounded-2xl bg-white border border-softPink/50 text-softBrown text-xs inline-flex items-center gap-2">
            <span>{typingName} is typing</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-typing-dot" style={{ animationDelay: '0.16s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-typing-dot" style={{ animationDelay: '0.32s' }} />
            </span>
          </div>
        </div>
      ) : null}

        <div ref={bottomAnchorRef} className="h-px w-full" aria-hidden="true" />
      </div>

      {showNewMessagesButton ? (
        <button
          type="button"
          onClick={() => {
            shouldStickToBottomRef.current = true;
            setShowNewMessagesButton(false);
            setPendingNewMessages(0);
            queueScrollToBottom('smooth');
          }}
          className="absolute right-4 bottom-4 z-20 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-white/35 bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:scale-[1.02] active:scale-95 transition animate-bounce-in"
        >
          <span>⬇ New messages</span>
          {pendingNewMessages > 0 ? (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5">
              {pendingNewMessages > 99 ? '99+' : pendingNewMessages}
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
