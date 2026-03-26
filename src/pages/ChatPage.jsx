import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConversationList from '../components/chat/ConversationList';
import ConversationHeader from '../components/chat/ConversationHeader';
import MessageList from '../components/chat/MessageList';
import MessageComposer from '../components/chat/MessageComposer';
import ChatEmptyState from '../components/chat/ChatEmptyState';
import chatApi from '../services/chatApi';
import connectionApi from '../services/connectionApi';
import safetyApi from '../services/safetyApi';
import { disconnectSocketClient, getSocketClient } from '../services/socketClient';
import { useAuth } from '../context/AuthContext';

const CHAT_THEME_STYLES = {
  'romantic-pink': {
    background: 'radial-gradient(circle at 15% 20%, rgba(255,144,181,0.18), transparent 38%), radial-gradient(circle at 90% 8%, rgba(255,205,142,0.2), transparent 35%), linear-gradient(180deg,#fffaf4 0%,#fff6ef 60%,#fff2e8 100%)'
  },
  'lavender-blush': {
    background: 'radial-gradient(circle at 12% 18%, rgba(190,162,255,0.18), transparent 38%), radial-gradient(circle at 85% 10%, rgba(255,187,218,0.2), transparent 35%), linear-gradient(180deg,#faf8ff 0%,#f7f2ff 60%,#f1e9ff 100%)'
  },
  'heart-mode': {
    background: 'radial-gradient(circle at 20% 18%, rgba(255,107,138,0.22), transparent 34%), radial-gradient(circle at 82% 12%, rgba(255,162,120,0.2), transparent 30%), linear-gradient(180deg,#fff3f6 0%,#ffeef4 58%,#ffe7ef 100%)'
  },
  'soft-night': {
    background: 'linear-gradient(180deg,#2f2a36 0%,#3a3040 52%,#45354a 100%)'
  },
  'cream-dream': {
    background: 'linear-gradient(180deg,#fffaf3 0%,#fff6ec 58%,#fff1e4 100%)'
  },
  'minimal-white': {
    background: 'linear-gradient(180deg,#ffffff 0%,#fbfbfd 60%,#f6f7fb 100%)'
  },
  'dark-romantic': {
    background: 'radial-gradient(circle at 16% 14%, rgba(255,87,152,0.2), transparent 34%), linear-gradient(180deg,#1d1020 0%,#28142b 56%,#341933 100%)'
  }
};

const CHAT_THEME_OPTIONS = [
  { id: 'romantic-pink', label: 'Romantic Pink' },
  { id: 'lavender-blush', label: 'Lavender Blush' },
  { id: 'heart-mode', label: 'Heart Mode' },
  { id: 'soft-night', label: 'Soft Night' },
  { id: 'cream-dream', label: 'Cream Dream' },
  { id: 'minimal-white', label: 'Minimal White' },
  { id: 'dark-romantic', label: 'Dark Romantic' }
];

const requiresRequestAcceptance = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('request acceptance') || message.includes('request accepted') || message.includes('messaging is allowed only after request acceptance');
};

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser, token: authToken, loading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [conversations, setConversations] = React.useState([]);
  const [matches, setMatches] = React.useState([]);
  const [creatingConversationFor, setCreatingConversationFor] = React.useState('');
  const [selectedConversationId, setSelectedConversationId] = React.useState(searchParams.get('conversationId') || '');
  const [messages, setMessages] = React.useState([]);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [typingByConversation, setTypingByConversation] = React.useState({});
  const [onlineUsers, setOnlineUsers] = React.useState(new Set());
  const [notice, setNotice] = React.useState('');
  const [themeModalOpen, setThemeModalOpen] = React.useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = React.useState(false);
  const [nicknameDraft, setNicknameDraft] = React.useState('');
  const [callState, setCallState] = React.useState({
    open: false,
    mode: 'voice',
    phase: 'idle',
    direction: 'outgoing',
    callId: '',
    startedAt: null
  });
  const [callDurationSec, setCallDurationSec] = React.useState(0);
  const [callPermissionError, setCallPermissionError] = React.useState('');
  const [isMuted, setIsMuted] = React.useState(false);
  const [isCameraOn, setIsCameraOn] = React.useState(true);
  const callTransitionTimersRef = React.useRef([]);
  const localCallStreamRef = React.useRef(null);
  const remoteCallStreamRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const messageCacheRef = React.useRef(new Map());
  const paginationRef = React.useRef(new Map());
  const inFlightSendRef = React.useRef(new Set());
  const conversationsRef = React.useRef([]);
  const loadMessagesRequestIdRef = React.useRef(0);
  const selectedConversationIdRef = React.useRef(selectedConversationId);
  const participantBootstrapRef = React.useRef('');
  const loadConversationsRef = React.useRef(null);
  const loadMessagesRef = React.useRef(null);
  const typingExpiryTimersRef = React.useRef(new Map());
  const [loadingOlderMessages, setLoadingOlderMessages] = React.useState(false);
  const [hasMoreMessages, setHasMoreMessages] = React.useState(false);
  const [privacyNotice, setPrivacyNotice] = React.useState('');
  const [watermarkClock, setWatermarkClock] = React.useState(Date.now());
  const lastPrivacySignalRef = React.useRef(0);

  React.useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  React.useEffect(() => {
    const timer = setInterval(() => setWatermarkClock(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    let active = true;
    safetyApi.getPrivacyNotice()
      .then((response) => {
        const notice = response?.data?.consentNotice || 'For your privacy, screenshots may be monitored on supported devices. Screenshots cannot be fully prevented on web.';
        if (active) {
          setPrivacyNotice(notice);
        }
      })
      .catch(() => {
        if (active) {
          setPrivacyNotice('For your privacy, screenshots may be monitored on supported devices. Screenshots cannot be fully prevented on web.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const now = Date.now();
    if (now - lastPrivacySignalRef.current < 30 * 1000) {
      return;
    }
    lastPrivacySignalRef.current = now;

    safetyApi.reportPrivacyEvent({
      eventType: 'chat_sensitive_view',
      conversationId: selectedConversationId,
      platform: 'web',
      supportedSignal: true,
      consentContext: 'chat-privacy-notice-visible'
    }).catch(() => {});
  }, [selectedConversationId]);

  React.useEffect(() => {
    const onKeyDown = (event) => {
      if (!selectedConversationId) {
        return;
      }

      if (event.key === 'PrintScreen') {
        const now = Date.now();
        if (now - lastPrivacySignalRef.current < 5000) {
          return;
        }
        lastPrivacySignalRef.current = now;

        safetyApi.reportPrivacyEvent({
          eventType: 'printscreen_key',
          conversationId: selectedConversationId,
          platform: 'web',
          supportedSignal: true,
          metadata: { key: 'PrintScreen' },
          consentContext: 'best-effort-web-key-signal'
        }).catch(() => {});

        safetyApi.reportScreenshotEvent({
          actorUserId: currentUser?._id,
          targetUserId: conversationsRef.current.find((item) => String(item?._id || '') === String(selectedConversationId))?.participant?._id,
          conversationId: selectedConversationId,
          timestamp: new Date().toISOString(),
          platform: 'web',
          contextType: 'chat',
          detectionSignal: 'printscreen_key',
          supportedSignal: true,
          metadata: {
            source: 'chat_page_key_signal',
            bestEffort: true
          }
        }).catch(() => {});

        showNotice('Privacy warning: screenshot key signal detected (best-effort web signal).');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedConversationId, currentUser?._id, showNotice]);

  React.useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const normalizeId = React.useCallback((value) => {
    if (!value) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && value._id) {
      return String(value._id);
    }
    return value?.toString?.() || '';
  }, []);

  const resolveSenderId = React.useCallback((message) => {
    if (!message || typeof message !== 'object') {
      return '';
    }

    return normalizeId(
      message.senderId ||
      message.sender ||
      message.sender?._id ||
      message.sender?.id ||
      message.userId ||
      message.user?._id ||
      message.user?.id
    );
  }, [normalizeId]);

  const getMessageIdentity = React.useCallback((message) => {
    if (!message || typeof message !== 'object') {
      return '';
    }

    if (message.clientTempId) {
      return `temp:${String(message.clientTempId)}`;
    }

    if (message.clientMessageId) {
      return `client:${String(message.clientMessageId)}`;
    }

    if (message._id) {
      return `id:${String(message._id)}`;
    }

    return '';
  }, []);

  const mergeAndSortMessages = React.useCallback((baseMessages, incomingMessages) => {
    const mergedMap = new Map();

    const write = (message) => {
      const normalized =
        message && typeof message === 'object'
          ? {
              ...message,
              _id: message._id ? String(message._id) : message._id,
              clientMessageId: message.clientMessageId || message.clientTempId || '',
              clientTempId: message.clientTempId || message.clientMessageId || '',
              conversationId: normalizeId(message.conversationId),
              senderId: resolveSenderId(message),
              receiverId: normalizeId(message.receiverId),
              seen: Boolean(message.seen),
              delivered: Boolean(message.delivered || message.seen),
              deliveryStatus:
                message.deliveryStatus || (message.seen ? 'seen' : message.delivered ? 'delivered' : 'sent')
            }
          : null;

      if (!normalized || typeof normalized !== 'object') {
        return;
      }

      const primaryIdentity = getMessageIdentity(normalized);
      const byObjectId = normalized?._id ? `id:${String(normalized._id)}` : '';
      const fallbackIdentity = primaryIdentity || byObjectId || `fallback:${normalized.createdAt || ''}:${normalizeId(normalized.senderId)}:${normalized.text || ''}`;

      const knownIdentity =
        (normalized.clientTempId && mergedMap.has(`temp:${String(normalized.clientTempId)}`) && `temp:${String(normalized.clientTempId)}`) ||
        (byObjectId && mergedMap.has(byObjectId) && byObjectId) ||
        fallbackIdentity;

      const existing = mergedMap.get(knownIdentity);
      const merged = existing ? { ...existing, ...normalized } : normalized;

      if (
        existing?._id &&
        normalized?._id &&
        String(existing._id) !== String(normalized._id)
      ) {
        mergedMap.delete(`id:${String(existing._id)}`);
      }

      mergedMap.set(knownIdentity, merged);

      if (normalized.clientTempId) {
        mergedMap.set(`temp:${String(normalized.clientTempId)}`, merged);
      }

      if (byObjectId) {
        mergedMap.set(byObjectId, merged);
      }
    };

    (Array.isArray(baseMessages) ? baseMessages : []).forEach(write);
    (Array.isArray(incomingMessages) ? incomingMessages : []).forEach(write);

    const unique = Array.from(new Set(Array.from(mergedMap.values())));
    return unique.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [getMessageIdentity, normalizeId, resolveSenderId]);

  const normalizeIncomingMessage = React.useCallback((message) => {
    if (!message || typeof message !== 'object') {
      return message;
    }
    const seen = Boolean(message.seen);
    const delivered = Boolean(message.delivered || seen);
    return {
      ...message,
      _id: message._id ? String(message._id) : message._id,
      clientMessageId: message.clientMessageId || message.clientTempId || '',
      clientTempId: message.clientTempId || message.clientMessageId || '',
      conversationId: normalizeId(message.conversationId),
      senderId: resolveSenderId(message),
      receiverId: normalizeId(message.receiverId),
      deliveryStatus:
        message.deliveryStatus || (seen ? 'seen' : delivered ? 'delivered' : 'sent'),
      seen,
      delivered
    };
  }, [normalizeId, resolveSenderId]);

  const toConversationPreviewText = React.useCallback((message) => {
    if (!message) {
      return '';
    }

    if (message.messageType === 'voice') {
      return 'Voice note';
    }

    if (message.messageType === 'image') {
      return 'Image';
    }

    if (message.messageType === 'attachment' || message.messageType === 'file') {
      return 'Attachment';
    }

    return message.text || '';
  }, []);

  const getConversationIdFromResponse = React.useCallback((response) => {
    return (
      response?.data?.conversation?._id ||
      response?.conversation?._id ||
      response?.data?.conversationId ||
      response?.conversationId ||
      ''
    );
  }, []);

  const loadMatches = React.useCallback(async () => {
    try {
      const response = await chatApi.getMatches();
      const nextMatches = Array.isArray(response?.matches)
        ? response.matches.filter((item) => item && typeof item === 'object')
        : [];
      setMatches(nextMatches);
    } catch {
      setMatches([]);
    }
  }, []);

  const updateConversationPreview = React.useCallback((conversationId, message, incomingFromOther = false) => {
    const normalizedConversationId = normalizeId(conversationId);
    if (!normalizedConversationId || !message) {
      return;
    }

    const activeConversationId = selectedConversationIdRef.current;

    setConversations((prev) =>
      prev
        .map((item) => {
          if (normalizeId(item._id) !== normalizedConversationId) {
            return item;
          }

          return {
            ...item,
            lastMessage: toConversationPreviewText(message),
            lastMessageTime: message.createdAt || new Date().toISOString(),
            unreadCount:
              incomingFromOther && normalizedConversationId !== activeConversationId
                ? (item.unreadCount || 0) + 1
                : normalizedConversationId === activeConversationId
                  ? 0
                  : item.unreadCount || 0
          };
        })
        .sort((a, b) => new Date(b.lastMessageTime || b.updatedAt) - new Date(a.lastMessageTime || a.updatedAt))
    );
  }, [normalizeId, toConversationPreviewText]);

  const showNotice = React.useCallback((text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 3500);
  }, []);

  const mutateConversationCache = React.useCallback((conversationId, updater) => {
    if (!conversationId || typeof updater !== 'function') {
      return;
    }
    const existing = messageCacheRef.current.get(conversationId) || [];
    messageCacheRef.current.set(conversationId, updater(existing));
  }, []);

  const stopCallMedia = React.useCallback(() => {
    if (localCallStreamRef.current) {
      localCallStreamRef.current.getTracks().forEach((track) => track.stop());
      localCallStreamRef.current = null;
    }
    if (remoteCallStreamRef.current) {
      remoteCallStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteCallStreamRef.current = null;
    }
  }, []);

  const addSystemMessage = React.useCallback((text) => {
    if (!selectedConversationId) {
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        _id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversationId: selectedConversationId,
        senderId: 'system',
        messageType: 'system',
        text,
        createdAt: new Date().toISOString()
      }
    ]);
  }, [selectedConversationId]);

  React.useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authToken || !currentUser?._id) {
      navigate('/login');
      return;
    }

    const loadConversationsFn = loadConversationsRef.current;
    if (typeof loadConversationsFn === 'function') {
      void loadConversationsFn();
    }
    void loadMatches();
  }, [authLoading, authToken, currentUser?._id, loadMatches, navigate]);

  React.useEffect(() => {
    const participantId = searchParams.get('participantId');

    if (!participantId || !currentUser?._id) {
      return;
    }

    if (participantBootstrapRef.current === participantId) {
      return;
    }

    participantBootstrapRef.current = participantId;

    const bootstrapConversation = async () => {
      try {
        setCreatingConversationFor(participantId);
        const response = await chatApi.createOrGetConversation(participantId);
        const conversationId = getConversationIdFromResponse(response);

        const loadConversationsFn = loadConversationsRef.current;
        if (typeof loadConversationsFn === 'function') {
          await loadConversationsFn({ preferredConversationId: conversationId });
        }
        if (conversationId) {
          navigate(`/chat?conversationId=${conversationId}`, { replace: true });
          showNotice('Conversation is ready. Say hi to start the chat.');
        }
      } catch (error) {
        showNotice(error?.message || 'Unable to start conversation for this match.');
      } finally {
        setCreatingConversationFor('');
      }
    };

    void bootstrapConversation();
  }, [currentUser?._id, getConversationIdFromResponse, navigate, searchParams, showNotice]);

  React.useEffect(() => {
    const socket = getSocketClient();
    if (!socket || !currentUser?._id) {
      return;
    }

    const handleReceiveMessage = (rawMessage) => {
      const message = normalizeIncomingMessage(rawMessage);
      if (!message?.conversationId) {
        return;
      }
      const lastMessageLabel =
        message.messageType === 'voice'
          ? 'Voice note'
          : message.messageType === 'attachment' || message.messageType === 'image' || message.messageType === 'file'
            ? 'Attachment'
            : message.messageType === 'call' || message.messageType === 'system'
              ? message.text
            : message.text;

      const activeConversationId = selectedConversationIdRef.current;
      const incomingFromOther = resolveSenderId(message) !== currentUser._id;

      updateConversationPreview(message.conversationId, { ...message, text: lastMessageLabel }, incomingFromOther);

      setMessages((prev) => {
        if (message.conversationId !== activeConversationId) {
          return prev;
        }

        return mergeAndSortMessages(prev, [message]);
      });

      mutateConversationCache(message.conversationId, (prev) => mergeAndSortMessages(prev, [message]));
    };

    const handleChatNotification = ({ conversationId }) => {
      const normalizedConversationId = normalizeId(conversationId);
      if (!normalizedConversationId) {
        return;
      }

      // Always refresh conversation list to keep unread counts and ordering accurate,
      // regardless of whether this conversation already exists locally.
      const loadConversationsFn = loadConversationsRef.current;
      if (typeof loadConversationsFn === 'function') {
        void loadConversationsFn({
          preserveSelection: true,
          preferredConversationId: selectedConversationIdRef.current,
          silent: true
        });
      }
    };

    const handleTypingStart = ({ conversationId, userId }) => {
      if (userId === currentUser._id) {
        return;
      }
      setTypingByConversation((prev) => ({ ...prev, [conversationId]: userId }));

      const existingTimer = typingExpiryTimersRef.current.get(conversationId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timeoutId = setTimeout(() => {
        setTypingByConversation((prev) => {
          const copy = { ...prev };
          delete copy[conversationId];
          return copy;
        });
        typingExpiryTimersRef.current.delete(conversationId);
      }, 3500);
      typingExpiryTimersRef.current.set(conversationId, timeoutId);
    };

    const handleTypingStop = ({ conversationId }) => {
      const existingTimer = typingExpiryTimersRef.current.get(conversationId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        typingExpiryTimersRef.current.delete(conversationId);
      }
      setTypingByConversation((prev) => {
        const copy = { ...prev };
        delete copy[conversationId];
        return copy;
      });
    };

    const handleMessageReaction = ({ conversationId, message }) => {
      const normalizedConversationId = normalizeId(conversationId || message?.conversationId);
      if (!normalizedConversationId || !message) {
        return;
      }

      mutateConversationCache(normalizedConversationId, (prev) => mergeAndSortMessages(prev, [message]));
      if (selectedConversationIdRef.current === normalizedConversationId) {
        setMessages((prev) => mergeAndSortMessages(prev, [message]));
      }
    };

    const handleMessageSeen = ({ conversationId }) => {
      if (conversationId !== selectedConversationIdRef.current) {
        return;
      }
      setMessages((prev) => prev.map((item) => (resolveSenderId(item) === currentUser._id ? { ...item, seen: true, delivered: true, deliveryStatus: 'seen' } : item)));
      mutateConversationCache(conversationId, (prev) => prev.map((item) => (
        resolveSenderId(item) === currentUser._id ? { ...item, seen: true, delivered: true, deliveryStatus: 'seen' } : item
      )));
    };

    const handleCallOffer = ({ conversationId, mode, callId, fromName, fromUserId }) => {
      if (normalizeId(conversationId) !== selectedConversationIdRef.current) {
        return;
      }

      setCallPermissionError('');
      setCallState({
        open: true,
        mode: mode || 'voice',
        phase: 'ringing',
        direction: 'incoming',
        callId: callId || `${Date.now()}`,
        startedAt: null,
        fromUserId
      });
      addSystemMessage(`Incoming ${mode || 'voice'} call from ${fromName || 'match'}`);
    };

    const handleCallAnswer = ({ callId }) => {
      setCallState((prev) => {
        if (!prev.open || prev.callId !== callId) {
          return prev;
        }
        return { ...prev, phase: 'connecting' };
      });

      const connectTimer = setTimeout(() => {
        setCallState((prev) => {
          if (!prev.open || prev.callId !== callId) {
            return prev;
          }
          return { ...prev, phase: 'connected', startedAt: Date.now() };
        });
      }, 1200);
      callTransitionTimersRef.current.push(connectTimer);
    };

    const handleCallEnd = ({ callId }) => {
      setCallState((prev) => {
        if (!prev.open || (callId && prev.callId !== callId)) {
          return prev;
        }
        return { ...prev, phase: 'ended' };
      });
      addSystemMessage('Call ended');
      stopCallMedia();
      setTimeout(() => {
        setCallState((prev) => ({ ...prev, open: false, phase: 'idle', startedAt: null }));
      }, 900);
    };

    const handleCallReject = ({ callId }) => {
      setCallState((prev) => {
        if (!prev.open || (callId && prev.callId !== callId)) {
          return prev;
        }
        return { ...prev, phase: 'missed' };
      });
      addSystemMessage('Call missed');
      stopCallMedia();
      setTimeout(() => {
        setCallState((prev) => ({ ...prev, open: false, phase: 'idle', startedAt: null }));
      }, 1200);
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('chat_notification', handleChatNotification);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_reaction', handleMessageReaction);
    socket.on('message_seen', handleMessageSeen);
    socket.on('call_offer', handleCallOffer);
    socket.on('call_answer', handleCallAnswer);
    socket.on('call_end', handleCallEnd);
    socket.on('call_reject', handleCallReject);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('chat_notification', handleChatNotification);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_reaction', handleMessageReaction);
      socket.off('message_seen', handleMessageSeen);
      socket.off('call_offer', handleCallOffer);
      socket.off('call_answer', handleCallAnswer);
      socket.off('call_end', handleCallEnd);
      socket.off('call_reject', handleCallReject);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [addSystemMessage, currentUser?._id, mergeAndSortMessages, mutateConversationCache, normalizeId, normalizeIncomingMessage, resolveSenderId, stopCallMedia, updateConversationPreview]);

  React.useEffect(() => {
    const messageCache = messageCacheRef.current;
    const typingTimers = typingExpiryTimersRef.current;

    return () => {
      disconnectSocketClient();
      stopCallMedia();
      messageCache.clear();
      typingTimers.forEach((timerId) => clearTimeout(timerId));
      typingTimers.clear();
      loadMessagesRequestIdRef.current += 1;
    };
  }, [stopCallMedia]);

  React.useEffect(() => {
    return () => {
      callTransitionTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      callTransitionTimersRef.current = [];
    };
  }, []);

  React.useEffect(() => {
    if (!callState.open || callState.phase !== 'connected' || !callState.startedAt) {
      setCallDurationSec(0);
      return;
    }

    const intervalId = setInterval(() => {
      setCallDurationSec(Math.floor((Date.now() - callState.startedAt) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [callState.open, callState.phase, callState.startedAt]);

  React.useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const socket = getSocketClient();
    if (!socket) {
      return;
    }

    const joinSelectedConversation = () => {
      socket.emit('join_chat', { conversationId: selectedConversationId }, (result) => {
        if (!result?.ok) {
          return;
        }
        // Keep a single seen-write path to avoid duplicate writes and listener races.
        void chatApi.markSeen(selectedConversationId).catch(() => null);
      });

      // Refresh only the selected thread to keep joins snappy.
      const loadMessagesFn = loadMessagesRef.current;
      if (typeof loadMessagesFn === 'function') {
        void loadMessagesFn(selectedConversationId, { preferCache: false });
      }
    };

    if (socket.connected) {
      joinSelectedConversation();
    }

    socket.on('connect', joinSelectedConversation);

    return () => {
      socket.off('connect', joinSelectedConversation);
    };
  }, [selectedConversationId]);

  const loadConversations = async (options = {}) => {
    const {
      preferredConversationId = '',
      preserveSelection = false,
      forceRefreshMessages = false,
      silent = false
    } = options;
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');

      const response = await chatApi.getConversations();
      const loadedRaw = response?.conversations || response?.data?.conversations || [];
      const loaded = Array.isArray(loadedRaw)
        ? loadedRaw.filter((item) => item && typeof item === 'object' && (item._id || item.id))
        : [];
      setConversations(loaded);

      const initialConversationId =
        preferredConversationId ||
        (preserveSelection ? selectedConversationIdRef.current : selectedConversationId) ||
        loaded[0]?._id;
      if (initialConversationId) {
        selectedConversationIdRef.current = initialConversationId;
        setSelectedConversationId(initialConversationId);
        void loadMessages(initialConversationId, { preferCache: !forceRefreshMessages });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  loadConversationsRef.current = loadConversations;

  const loadMessages = async (conversationId, options = {}) => {
    const { preferCache = true, page = 1, appendOlder = false } = options;
    const requestId = ++loadMessagesRequestIdRef.current;

    const hasCache = preferCache && messageCacheRef.current.has(conversationId);
    if (!hasCache) {
      setMessages([]);
    }

    try {
      if (!appendOlder && !messageCacheRef.current.has(conversationId)) {
        setLoadingMessages(true);
      }
      const response = await chatApi.getMessages(conversationId, { page, limit: 50 });
      const loadedMessages = response?.messages || response?.data?.messages || [];
      const hasMore = Boolean(response?.data?.pagination?.hasMore);
      const existing = messageCacheRef.current.get(conversationId) || [];
      const mergedMessages = mergeAndSortMessages(appendOlder ? [...loadedMessages, ...existing] : existing, appendOlder ? [] : loadedMessages);

      messageCacheRef.current.set(conversationId, mergedMessages);
      paginationRef.current.set(conversationId, { page, hasMore });

      if (requestId !== loadMessagesRequestIdRef.current) {
        return;
      }

      setMessages(mergedMessages);
      setHasMoreMessages(hasMore);

      setConversations((prev) =>
        prev
          .filter((item) => item && typeof item === 'object')
          .map((item) => (item._id === conversationId ? { ...item, unreadCount: 0 } : item))
      );
    } catch (err) {
      if (requestId === loadMessagesRequestIdRef.current) {
        setError(err.response?.data?.message || 'Failed to load messages');
      }
    } finally {
      if (requestId === loadMessagesRequestIdRef.current) {
        setLoadingMessages(false);
      }
    }
  };

  loadMessagesRef.current = loadMessages;

  const loadOlderMessages = React.useCallback(async () => {
    if (!selectedConversationId || loadingOlderMessages) {
      return;
    }

    const pagination = paginationRef.current.get(selectedConversationId) || { page: 1, hasMore: false };
    if (!pagination.hasMore) {
      setHasMoreMessages(false);
      return;
    }

    setLoadingOlderMessages(true);
    try {
      const loadMessagesFn = loadMessagesRef.current;
      if (typeof loadMessagesFn !== 'function') {
        return;
      }
      await loadMessagesFn(selectedConversationId, {
        preferCache: true,
        page: pagination.page + 1,
        appendOlder: true
      });
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [loadingOlderMessages, selectedConversationId]);

  const handleSelectConversation = async (conversation) => {
    if (!conversation?._id) {
      return;
    }
    selectedConversationIdRef.current = conversation._id;
    setSelectedConversationId(conversation._id);
    void loadMessages(conversation._id, { preferCache: true });
  };

  const selectedConversation = React.useMemo(
    () => (Array.isArray(conversations)
      ? conversations.find((item) => item && item._id === selectedConversationId)
      : null),
    [conversations, selectedConversationId]
  );

  const selectedChatTheme = selectedConversation?.chatTheme || 'romantic-pink';
  const chatThemeStyle = CHAT_THEME_STYLES[selectedChatTheme] || CHAT_THEME_STYLES['romantic-pink'];

  const matchesWithoutConversation = React.useMemo(() => {
    const existingPartnerIds = new Set(
      conversations
        .map((item) => normalizeId(item?.participant?._id || item?.participant?.id))
        .filter(Boolean)
    );

    return matches.filter((match) => {
      const partnerId = normalizeId(match?.participant?._id || match?.participant?.id);
      return partnerId && !existingPartnerIds.has(partnerId);
    });
  }, [conversations, matches, normalizeId]);

  const handleStartConversationFromMatch = React.useCallback(async (participantId) => {
    if (!participantId) {
      return;
    }

    try {
      setCreatingConversationFor(participantId);
      const response = await chatApi.createOrGetConversation(participantId);
      const conversationId = getConversationIdFromResponse(response);

      const loadConversationsFn = loadConversationsRef.current;
      if (typeof loadConversationsFn === 'function') {
        await loadConversationsFn({ preferredConversationId: conversationId });
      }
      if (conversationId) {
        navigate(`/chat?conversationId=${conversationId}`, { replace: true });
      }
      showNotice('Conversation ready. Send the first message.');
    } catch (error) {
      if (requiresRequestAcceptance(error)) {
        try {
          await connectionApi.sendRequest(participantId, {
            requestType: 'chat',
            requestMessage: 'I would like to start chatting with you 💬'
          });
          showNotice('Chat request sent. It will appear in their Requests section.');
        } catch (requestError) {
          const requestMessage = String(requestError?.message || '').toLowerCase();
          if (requestMessage.includes('already pending') || requestMessage.includes('already sent')) {
            showNotice('Chat request already pending. Waiting for acceptance.');
          } else if (requestMessage.includes('already connected')) {
            showNotice('Already connected. Please try opening chat again.');
          } else {
            showNotice(requestError?.message || 'Unable to send chat request right now.');
          }
        }
      } else {
        showNotice(error?.message || 'Unable to open this conversation right now.');
      }
    } finally {
      setCreatingConversationFor('');
    }
  }, [getConversationIdFromResponse, navigate, showNotice]);

  const upsertOptimisticMessageStatus = React.useCallback((clientTempId, patch) => {
    setMessages((prev) => prev.map((item) => (
      item.clientTempId === clientTempId ? { ...item, ...patch } : item
    )));
    if (selectedConversation?._id) {
      mutateConversationCache(selectedConversation._id, (prev) => prev.map((item) => (
        item.clientTempId === clientTempId ? { ...item, ...patch } : item
      )));
    }
  }, [mutateConversationCache, selectedConversation?._id]);

  const sendMessageWithFallback = React.useCallback(async (payload) => {
    const clientTempId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (inFlightSendRef.current.has(clientTempId)) {
      return;
    }
    inFlightSendRef.current.add(clientTempId);

    const optimisticMessage = {
      _id: `local-${clientTempId}`,
      clientTempId,
      clientMessageId: clientTempId,
      senderId: currentUser?._id,
      conversationId: selectedConversation._id,
      text: payload.text,
      messageType: payload.messageType,
      voiceNote: payload.voiceNote,
      attachment: payload.attachment,
      createdAt: new Date().toISOString(),
      seen: false,
      deliveryStatus: 'sending'
    };

    setMessages((prev) => mergeAndSortMessages(prev, [optimisticMessage]));
    mutateConversationCache(selectedConversation._id, (prev) => mergeAndSortMessages(prev, [optimisticMessage]));
    updateConversationPreview(selectedConversation._id, optimisticMessage, false);

    const outbound = {
      ...payload,
      conversationId: selectedConversation._id,
      clientTempId,
      clientMessageId: clientTempId
    };

    try {
      const response = await chatApi.sendMessage(selectedConversation._id, outbound);
      const serverMessage = normalizeIncomingMessage({ ...(response?.data?.message || null), clientTempId });
      if (serverMessage?._id) {
        setMessages((prev) => mergeAndSortMessages(prev, [serverMessage]));
        mutateConversationCache(selectedConversation._id, (prev) => mergeAndSortMessages(prev, [serverMessage]));
        updateConversationPreview(selectedConversation._id, serverMessage, false);
      } else {
        upsertOptimisticMessageStatus(clientTempId, { deliveryStatus: 'sent' });
      }
    } catch (sendError) {
      upsertOptimisticMessageStatus(clientTempId, { deliveryStatus: 'failed' });
      showNotice(sendError?.message || 'Unable to send message.');
      throw sendError;
    } finally {
      inFlightSendRef.current.delete(clientTempId);
    }
  }, [currentUser?._id, mergeAndSortMessages, mutateConversationCache, normalizeIncomingMessage, selectedConversation, showNotice, updateConversationPreview, upsertOptimisticMessageStatus]);

  const handleSendMessage = async (text) => {
    if (!selectedConversation) {
      throw new Error('No conversation selected');
    }

    const trimmedText = String(text || '').trim();
    if (!trimmedText) {
      throw new Error('Cannot send an empty message');
    }

    try {
      await sendMessageWithFallback({
        text: trimmedText,
        messageType: trimmedText.length <= 2 ? 'emoji' : 'text'
      });
      return true;
    } catch {
      setError('Failed to send message');
      throw new Error('Failed to send message');
    }
  };

  const handleSendVoiceNote = async ({ blob, durationSec, mimeType, fileName }) => {
    if (!selectedConversation) {
      throw new Error('No conversation selected');
    }

    if (!blob) {
      throw new Error('Voice recording is empty');
    }

    try {
      const uploaded = await chatApi.uploadAttachment(
        selectedConversation._id,
        new File([blob], fileName || `voice-note-${Date.now()}.webm`, { type: mimeType || 'audio/webm' })
      );
      const uploadedAttachment = uploaded?.data?.attachment || {};

      await sendMessageWithFallback({
        text: `Voice note (${durationSec}s)`,
        messageType: 'voice',
        voiceNote: {
          durationSec,
          mimeType: mimeType || 'audio/webm',
          fileName: fileName || uploadedAttachment.name || `voice-note-${Date.now()}.webm`,
          url: uploadedAttachment.url || ''
        }
      });
      return true;
    } catch {
      setError('Voice note could not be sent');
      throw new Error('Voice note could not be sent');
    }
  };

  const handleSendAttachment = async (files) => {
    if (!selectedConversation || !Array.isArray(files) || !files.length) {
      throw new Error('No files selected');
    }

    const sendTasks = files.map(async (fileItem) => {
      const kind = fileItem.kind === 'image' ? 'image' : fileItem.kind === 'audio' ? 'attachment' : 'file';
      const uploadResponse = await chatApi.uploadAttachment(selectedConversation._id, fileItem.file);
      const uploadedAttachment = uploadResponse?.data?.attachment || {};

      await sendMessageWithFallback({
        text: fileItem.name,
        messageType: kind,
        attachment: {
          name: uploadedAttachment.name || fileItem.name,
          size: uploadedAttachment.size || fileItem.size,
          mimeType: uploadedAttachment.mimeType || fileItem.mimeType,
          url: uploadedAttachment.url || ''
        }
      });
    });

    try {
      await Promise.all(sendTasks);
      return true;
    } catch {
      setError('One or more attachments failed to send');
      throw new Error('One or more attachments failed to send');
    }
  };

  const handleReactToMessage = async (message, emoji = '❤️') => {
    if (!selectedConversation?._id || !message?._id) {
      return;
    }

    try {
      const response = await chatApi.reactToMessage(selectedConversation._id, message._id, emoji);
      const updatedMessage = normalizeIncomingMessage(response?.data?.message);
      if (!updatedMessage?._id) {
        return;
      }

      setMessages((prev) => mergeAndSortMessages(prev, [updatedMessage]));
      mutateConversationCache(selectedConversation._id, (prev) => mergeAndSortMessages(prev, [updatedMessage]));
    } catch (err) {
      showNotice(err?.message || 'Unable to add reaction');
    }
  };

  const handleTypingStart = () => {
    if (!selectedConversationId) {
      return;
    }
    const socket = getSocketClient();
    socket?.emit('typing_start', { conversationId: selectedConversationId });
  };

  const handleTypingStop = () => {
    if (!selectedConversationId) {
      return;
    }
    const socket = getSocketClient();
    socket?.emit('typing_stop', { conversationId: selectedConversationId });
  };

  const handleBlock = async () => {
    const targetUserId = selectedConversation?.participant?._id;
    if (!selectedConversationId || !targetUserId) {
      return;
    }
    const reason = window.prompt('Optional: Why are you blocking this user?', 'Safety concern') || '';
    await safetyApi.blockUser(targetUserId, reason);
    await chatApi.blockUser(selectedConversationId);
    await loadConversations();
    showNotice('User blocked successfully. Messaging disabled.');
  };

  const handleReport = async () => {
    const targetUserId = selectedConversation?.participant?._id;
    if (!targetUserId) {
      return;
    }

    const reason = window.prompt('Report reason (required):', 'Harassment');
    if (!reason || reason.trim().length < 3) {
      showNotice('Report cancelled. Please provide a valid reason.');
      return;
    }

    const details = window.prompt('Additional details (optional):', '') || '';
    await safetyApi.reportUser({
      targetUserId,
      reason: reason.trim(),
      details,
      targetType: 'chat',
      targetId: selectedConversationId
    });
    showNotice('Report submitted to moderation.');
  };

  const handleUnmatch = async () => {
    if (!selectedConversationId) {
      return;
    }
    await chatApi.unmatchUser(selectedConversationId);
    await loadConversations();
  };

  const handleDelete = async () => {
    if (!selectedConversationId) {
      return;
    }
    messageCacheRef.current.delete(selectedConversationId);
    loadMessagesRequestIdRef.current += 1;
    await chatApi.deleteConversation(selectedConversationId);
    setSelectedConversationId('');
    setMessages([]);
    await loadConversations();
  };

  const handleViewProfile = () => {
    const profileOwnerId = selectedConversation?.participant?._id;
    if (!profileOwnerId) {
      showNotice('Profile is unavailable right now');
      return;
    }
    navigate(`/profile?viewUserId=${encodeURIComponent(profileOwnerId)}`, {
      state: {
        profilePreview: selectedConversation?.participant || null
      }
    });
  };

  const handleSetNickname = async () => {
    if (!selectedConversationId) {
      return;
    }
    setNicknameDraft(selectedConversation?.viewerNickname || '');
    setNicknameModalOpen(true);
  };

  const handleChangeTheme = async () => {
    if (!selectedConversationId) {
      return;
    }
    setThemeModalOpen(true);
  };

  const applyNickname = async () => {
    if (!selectedConversationId) {
      setNicknameModalOpen(false);
      return;
    }

    const nextNickname = String(nicknameDraft || '').trim();
    try {
      const response = await chatApi.updateConversationNickname(selectedConversationId, nextNickname);
      const viewerNickname = response?.data?.viewerNickname ?? nextNickname;
      setConversations((prev) => prev.map((item) => (
        item._id === selectedConversationId ? { ...item, viewerNickname } : item
      )));
      setNicknameModalOpen(false);
      showNotice(viewerNickname ? 'Nickname updated' : 'Nickname removed');
    } catch (err) {
      showNotice(err?.message || 'Unable to update nickname');
    }
  };

  const applyTheme = async (themeId) => {
    if (!selectedConversationId) {
      setThemeModalOpen(false);
      return;
    }

    try {
      const response = await chatApi.updateConversationTheme(selectedConversationId, themeId);
      const chatTheme = response?.data?.chatTheme || themeId;
      setConversations((prev) => prev.map((item) => (
        item._id === selectedConversationId ? { ...item, chatTheme } : item
      )));
      setThemeModalOpen(false);
      showNotice('Chat theme updated');
    } catch (err) {
      showNotice(err?.message || 'Unable to update chat theme');
    }
  };

  const requestCallMedia = async (mode) => {
    const constraints = mode === 'video' ? { audio: true, video: true } : { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localCallStreamRef.current = stream;
    setIsMuted(false);
    setIsCameraOn(mode === 'video');
    return stream;
  };

  const transitionCallPhase = (phase, delayMs) => {
    const timer = setTimeout(() => {
      setCallState((prev) => {
        if (!prev.open) {
          return prev;
        }
        return {
          ...prev,
          phase,
          startedAt: phase === 'connected' ? Date.now() : prev.startedAt
        };
      });
    }, delayMs);
    callTransitionTimersRef.current.push(timer);
  };

  const handleStartCall = async (mode) => {
    if (!selectedConversationId) {
      return;
    }

    callTransitionTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    callTransitionTimersRef.current = [];

    setCallPermissionError('');

    try {
      await requestCallMedia(mode);
    } catch (mediaError) {
      const message = mediaError?.message?.includes('Permission')
        ? `${mode === 'video' ? 'Camera or microphone' : 'Microphone'} permission denied.`
        : `Unable to start ${mode} call.`;
      setCallPermissionError(message);
      showNotice(message);
      return;
    }

    const callId = `call-${Date.now()}`;

    setCallState({
      open: true,
      mode,
      phase: 'calling',
      direction: 'outgoing',
      callId,
      startedAt: null
    });

    addSystemMessage(`${mode === 'video' ? 'Video' : 'Voice'} call started`);

    const socket = getSocketClient();
    socket?.emit('call_offer', {
      conversationId: selectedConversationId,
      callId,
      mode,
      fromUserId: currentUser?._id,
      fromName: currentUser?.name || 'User'
    });

    transitionCallPhase('ringing', 800);
    transitionCallPhase('connecting', 2200);
    transitionCallPhase('connected', 3200);

    const missedTimer = setTimeout(() => {
      setCallState((prev) => {
        if (!prev.open || prev.phase === 'connected') {
          return prev;
        }
        return { ...prev, phase: 'missed' };
      });
      addSystemMessage('Call missed');
    }, 20000);
    callTransitionTimersRef.current.push(missedTimer);
  };

  const handleAcceptCall = async () => {
    try {
      await requestCallMedia(callState.mode);
      const socket = getSocketClient();
      socket?.emit('call_answer', {
        conversationId: selectedConversationId,
        callId: callState.callId,
        mode: callState.mode
      });
      setCallState((prev) => ({ ...prev, phase: 'connected', startedAt: Date.now() }));
      addSystemMessage(`${callState.mode === 'video' ? 'Video' : 'Voice'} call accepted`);
    } catch (mediaError) {
      const message = mediaError?.message?.includes('Permission')
        ? `${callState.mode === 'video' ? 'Camera or microphone' : 'Microphone'} permission denied.`
        : 'Unable to accept call.';
      setCallPermissionError(message);
      showNotice(message);
    }
  };

  const handleRejectCall = () => {
    const socket = getSocketClient();
    socket?.emit('call_reject', {
      conversationId: selectedConversationId,
      callId: callState.callId,
      mode: callState.mode
    });
    addSystemMessage('Call rejected');
    handleEndCall('ended');
  };

  const handleEndCall = (phase = 'ended') => {
    callTransitionTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    callTransitionTimersRef.current = [];

    const socket = getSocketClient();
    if (callState.callId) {
      socket?.emit('call_end', {
        conversationId: selectedConversationId,
        callId: callState.callId,
        mode: callState.mode
      });
    }

    stopCallMedia();

    setCallState({
      open: false,
      mode: callState.mode,
      phase,
      direction: 'outgoing',
      callId: '',
      startedAt: null
    });
    addSystemMessage(phase === 'missed' ? 'Call missed' : 'Call ended');
    setCallDurationSec(0);
    setCallPermissionError('');
  };

  const toggleMute = () => {
    if (!localCallStreamRef.current) {
      return;
    }
    const next = !isMuted;
    localCallStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setIsMuted(next);
  };

  const toggleCamera = () => {
    if (!localCallStreamRef.current) {
      return;
    }
    const next = !isCameraOn;
    localCallStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setIsCameraOn(next);
  };

  const formatCallDuration = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const unreadTotal = conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0);
  const typingUserId = typingByConversation[selectedConversationId];
  const typingName =
    typingUserId && selectedConversation?.participant?._id === typingUserId
      ? selectedConversation.viewerNickname || selectedConversation.participant.name
      : '';
  const starterMessages = [
    'Hey, nice to connect 😊',
    'How is your day going?',
    'Which college event do you like most?',
    'Coffee after class?'
  ];

  const handleStarterClick = async (starter) => {
    try {
      await handleSendMessage(starter);
    } catch {
      return;
    }
  };

  const watermarkLabel = React.useMemo(() => {
    const username = String(currentUser?.name || currentUser?.email || 'anonymous').slice(0, 24);
    const idTail = String(currentUser?._id || 'anon').slice(-8);
    const participantTail = String(selectedConversation?.participant?._id || '').slice(-6);
    return `SeeU-Daters Privacy Watermark • ${username} • ${idTail} • ${participantTail} • ${new Date(watermarkClock).toLocaleString()}`;
  }, [currentUser?.name, currentUser?.email, currentUser?._id, selectedConversation?.participant?._id, watermarkClock]);

  const watermarkLayers = React.useMemo(() => {
    const seedBase = `${selectedConversationId || 'none'}-${watermarkClock}`;
    const layers = [];
    for (let i = 0; i < 6; i += 1) {
      const seed = Array.from(`${seedBase}-${i}`).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const top = 8 + ((seed * 13) % 78);
      const left = 2 + ((seed * 7) % 82);
      const rotate = -22 + ((seed * 5) % 44);
      layers.push({
        id: `${seedBase}-${i}`,
        top,
        left,
        rotate
      });
    }
    return layers;
  }, [selectedConversationId, watermarkClock]);

  return (
    <section className="pt-16 h-[calc(100vh-4rem)] min-h-0 theme-transition-scope" style={chatThemeStyle}>
      {privacyNotice ? (
        <div className="fixed bottom-4 left-4 right-4 z-40 rounded-xl border border-amber-300/60 bg-amber-50/95 px-4 py-2 text-xs text-amber-800 shadow-lg">
          {privacyNotice}
        </div>
      ) : null}

      {notice ? (
        <div className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-xl border border-rose-300/40 bg-white/90 text-rose-700 text-sm font-medium shadow-xl">
          {notice}
        </div>
      ) : null}

      {creatingConversationFor ? (
        <div className="fixed top-20 left-4 z-50 px-4 py-2.5 rounded-xl border border-amber-300/50 bg-white/90 text-amber-700 text-sm font-medium shadow-xl">
          Preparing your conversation...
        </div>
      ) : null}

      <div className="h-full w-full min-h-0 px-0 lg:px-3 py-0 lg:py-3">
        <div className="h-full w-full min-h-0 overflow-hidden border-y lg:border border-softPink/35 bg-white/88 backdrop-blur-xl shadow-[0_24px_80px_rgba(152,82,112,0.18)] grid lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
          <div className={`${selectedConversation ? 'hidden md:block' : 'block'} h-full min-h-0`}>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onlineUsers={onlineUsers}
              loading={loading}
              error={error}
              unreadTotal={unreadTotal}
              search={search}
              onSearchChange={setSearch}
            />
          </div>

          <div className={`${selectedConversation ? 'block' : 'hidden md:block'} h-full min-h-0 flex flex-col`}>
            {!selectedConversation ? (
              <ChatEmptyState
                suggestedMatches={matchesWithoutConversation}
                onStartConversation={handleStartConversationFromMatch}
              />
            ) : (
              <>
                <ConversationHeader
                  participant={selectedConversation.participant}
                  viewerNickname={selectedConversation.viewerNickname}
                  chatTheme={selectedConversation.chatTheme}
                  isOnline={selectedConversation.participant?.privacy?.showOnlineStatus === false ? false : onlineUsers.has(selectedConversation.participant?._id)}
                  lastSeenAt={selectedConversation.participant?.privacy?.showOnlineStatus === false ? null : (selectedConversation.participant?.lastActiveAt || selectedConversation.lastMessageTime || selectedConversation.updatedAt)}
                  blocked={selectedConversation.isBlocked}
                  onBack={() => setSelectedConversationId('')}
                  onViewProfile={handleViewProfile}
                  onSetNickname={handleSetNickname}
                  onChangeTheme={handleChangeTheme}
                  onBlock={handleBlock}
                  onReport={handleReport}
                  onUnmatch={handleUnmatch}
                  onDelete={handleDelete}
                  onStartVoiceCall={() => handleStartCall('voice')}
                  onStartVideoCall={() => handleStartCall('video')}
                />

                {loadingMessages ? (
                  <div className="flex-1 flex items-center justify-center text-softBrown">Loading messages...</div>
                ) : (
                  <>
                    <div className="mx-4 mt-3 rounded-2xl border border-rose-200/70 bg-rose-50/65 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-rose-500 font-semibold">Privacy Layer</p>
                        <p className="text-sm text-rose-700">Chat is unlocked. Full profile requires separate owner approval.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleViewProfile}
                        className="px-3 py-1.5 rounded-full bg-white border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition"
                      >
                        View profile privacy
                      </button>
                    </div>

                    {messages.length === 0 ? (
                      <div className="mx-4 mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-rose-600 font-semibold">Connected Recently</p>
                        <p className="text-sm text-rose-700 mt-1">Start the conversation with a warm opener.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {starterMessages.map((starter) => (
                            <button
                              key={starter}
                              type="button"
                              onClick={() => handleStarterClick(starter)}
                              className="text-xs rounded-full border border-rose-200 bg-white px-3 py-1.5 text-rose-700 hover:bg-rose-100 transition"
                            >
                              {starter}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="relative isolate">
                      <MessageList
                        conversationId={selectedConversationId}
                        messages={messages}
                        myUserId={currentUser?._id}
                        typingName={typingName}
                        participantName={selectedConversation?.viewerNickname || selectedConversation?.participant?.name}
                        hasMore={hasMoreMessages}
                        loadingOlder={loadingOlderMessages}
                        onLoadOlder={loadOlderMessages}
                        onReact={handleReactToMessage}
                      />
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        {watermarkLayers.map((layer) => (
                          <div
                            key={layer.id}
                            style={{
                              position: 'absolute',
                              top: `${layer.top}%`,
                              left: `${layer.left}%`,
                              transform: `rotate(${layer.rotate}deg)`,
                              fontSize: '10px',
                              letterSpacing: '0.12em',
                              opacity: 0.12,
                              color: '#5b1d3a',
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              fontWeight: 700,
                              textShadow: '0 0 1px rgba(255,255,255,0.45)',
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            {watermarkLabel}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mx-4 mb-2 rounded-xl border border-slate-300/40 bg-slate-50/70 px-3 py-2 text-[11px] text-slate-600">
                      {watermarkLabel}
                    </div>
                  </>
                )}

                <MessageComposer
                  disabled={selectedConversation.isBlocked}
                  onSend={handleSendMessage}
                  onSendVoiceNote={handleSendVoiceNote}
                  onSendAttachment={handleSendAttachment}
                  onTypingStart={handleTypingStart}
                  onTypingStop={handleTypingStop}
                  onError={(message) => showNotice(message)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {nicknameModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-200/70 bg-white/95 shadow-[0_24px_70px_rgba(152,82,112,0.28)] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-rose-500 font-semibold">Private Nickname</p>
            <h3 className="mt-1 text-2xl font-semibold text-softBrown">Name this chat your way</h3>
            <p className="mt-2 text-sm text-softBrown/75">Only you can see this nickname. Leave empty to clear it.</p>

            <input
              type="text"
              value={nicknameDraft}
              onChange={(event) => setNicknameDraft(event.target.value.slice(0, 40))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyNickname();
                }
              }}
              placeholder="e.g. Library Crush"
              className="mt-4 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-softBrown placeholder-softBrown/40 focus:outline-none focus:ring-2 focus:ring-rose-300/55"
              autoFocus
            />

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNicknameModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyNickname}
                className="px-4 py-2 rounded-xl border border-rose-300/40 bg-rose-500 text-white hover:bg-rose-600 transition shadow-sm"
              >
                Save Nickname
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {themeModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-rose-200/70 bg-white/95 shadow-[0_24px_70px_rgba(152,82,112,0.28)] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-rose-500 font-semibold">Conversation Theme</p>
            <h3 className="mt-1 text-2xl font-semibold text-softBrown">Pick the mood for this chat</h3>
            <p className="mt-2 text-sm text-softBrown/75">Applies instantly for this conversation.</p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHAT_THEME_OPTIONS.map((option) => {
                const active = selectedConversation?.chatTheme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => applyTheme(option.id)}
                    className={`text-left rounded-2xl border px-4 py-3 transition ${active ? 'border-rose-400 bg-rose-100/80 shadow-sm' : 'border-rose-200 bg-white hover:bg-rose-50'}`}
                  >
                    <p className="text-sm font-semibold text-softBrown">{option.label}</p>
                    <p className="text-xs text-softBrown/65 mt-1">{option.id}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setThemeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {callState.open ? (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-slate-900/92 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300 mb-2">{callState.mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
            <p className="text-2xl font-semibold">{selectedConversation?.participant?.name || 'Connecting'}</p>
            <p className="text-sm text-slate-300 mt-1">
              {callState.phase === 'calling' ? 'Calling...' : null}
              {callState.phase === 'ringing' ? (callState.direction === 'incoming' ? 'Incoming call...' : 'Ringing...') : null}
              {callState.phase === 'connecting' ? 'Connecting...' : null}
              {callState.phase === 'connected' ? `Connected • ${formatCallDuration(callDurationSec)}` : null}
              {callState.phase === 'missed' ? 'Missed call' : null}
              {callState.phase === 'ended' ? 'Call ended' : null}
            </p>

            {callPermissionError ? (
              <p className="mt-2 text-xs text-rose-300">{callPermissionError}</p>
            ) : null}

            {callState.mode === 'video' ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/15 bg-black/25 p-2">
                  <p className="text-xs text-slate-300 mb-2">Your preview</p>
                  {localCallStreamRef.current ? (
                    <video
                      autoPlay
                      muted
                      playsInline
                      ref={(node) => {
                        if (node && localCallStreamRef.current) {
                          node.srcObject = localCallStreamRef.current;
                        }
                      }}
                      className="w-full h-40 object-cover rounded-xl bg-black"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-black/55 flex items-center justify-center text-slate-400 text-sm">Camera preview unavailable</div>
                  )}
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/25 p-2">
                  <p className="text-xs text-slate-300 mb-2">Remote video</p>
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-40 object-cover rounded-xl bg-black" />
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/15 bg-black/20 h-32 flex items-center justify-center text-slate-300 text-sm">
                Voice call in progress
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-4">
              {callState.direction === 'incoming' && callState.phase === 'ringing' ? (
                <>
                  <button className="px-4 py-2 rounded-xl border border-rose-300/35 bg-rose-500/25 text-rose-100 font-semibold" onClick={handleRejectCall}>Decline</button>
                  <button className="px-4 py-2 rounded-xl border border-emerald-300/35 bg-emerald-500/25 text-emerald-100 font-semibold" onClick={handleAcceptCall}>Accept</button>
                </>
              ) : (
                <>
                  <button className={`w-14 h-14 rounded-full border border-white/25 ${isMuted ? 'bg-amber-500/30' : 'bg-white/10'} text-xl`} onClick={toggleMute} title="Toggle mute">🎤</button>
                  {callState.mode === 'video' ? <button className={`w-14 h-14 rounded-full border border-white/25 ${isCameraOn ? 'bg-white/10' : 'bg-amber-500/30'} text-xl`} onClick={toggleCamera} title="Toggle camera">📷</button> : null}
                  <button className="w-14 h-14 rounded-full border border-red-300/40 bg-red-500/85 text-xl" onClick={() => handleEndCall('ended')}>📞</button>
                </>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-400 text-center">
              WebRTC-ready UI state with socket signaling hooks. Attach peer-connection signaling on `call_offer` / `call_answer` / `call_end` events.
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

