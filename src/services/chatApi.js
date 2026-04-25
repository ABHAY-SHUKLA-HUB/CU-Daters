import api from './api';
import { safeGet, ensureArray } from '../utils/safeProperties';

export const chatApi = {
  discoverProfiles: async (page = 1, limit = 20, options = {}) => {
    const { lite = true, genderFilter = 'both' } = options;
    const response = await api.get('/api/chat/discover', {
      params: { 
        page, 
        limit, 
        lite: lite ? 1 : 0,
        genderFilter // Pass gender filter to backend
      },
      timeout: 12000  // Reduced from 25s for faster feedback
    });
    return {
      ...response.data,
      profiles: ensureArray(safeGet(response.data, 'data.profiles', [])),
      pagination: safeGet(response.data, 'data.pagination', {}),
      currentGenderFilter: safeGet(response.data, 'data.currentGenderFilter', 'both'),
      userGender: safeGet(response.data, 'data.userGender', null),
      defaultPreference: safeGet(response.data, 'data.defaultPreference', 'both')
    };
  },

  getMatches: async () => {
    const response = await api.get('/api/chat/matches');
    return {
      ...response.data,
      matches: ensureArray(safeGet(response.data, 'data.matches', []))
    };
  },

  swipeProfile: async (targetUserId, action) => {
    const response = await api.post('/api/chat/swipe', { targetUserId, action });
    return response.data ?? {};
  },

  createMatch: async (targetUserId) => {
    const response = await api.post('/api/chat/matches', { targetUserId });
    return response.data ?? {};
  },

  createOrGetConversation: async (participantId) => {
    const response = await api.post('/api/chat/conversations', { participantId });
    return response.data ?? {};
  },

  getConversations: async () => {
    const response = await api.get('/api/chat/conversations');
    return {
      ...response.data,
      conversations: ensureArray(safeGet(response.data, 'data.conversations', [])),
      unreadTotal: safeGet(response.data, 'data.unreadTotal', 0)
    };
  },

  getUnreadSummary: async () => {
    try {
      const response = await api.get('/api/chat/conversations/unread-summary', { timeout: 25000 });
      return {
        ...response.data,
        unreadTotal: safeGet(response.data, 'data.unreadTotal', 0)
      };
    } catch (error) {
      const status = error?.status;
      const message = String(error?.message || '').toLowerCase();
      const isTransientTimeout = message.includes('timeout') || message.includes('network') || status === 503;
      const isRouteMissing = status === 404 || (message.includes('route') && message.includes('not found'));

      if (!isRouteMissing && !isTransientTimeout) {
        throw error;
      }

      try {
        const fallbackResponse = await api.get('/api/chat/conversations', { timeout: 25000 });
        const fallbackUnreadTotal = safeGet(fallbackResponse.data, 'data.unreadTotal', 0);
        return {
          ...fallbackResponse.data,
          unreadTotal: fallbackUnreadTotal,
          data: {
            ...(fallbackResponse.data?.data || {}),
            unreadTotal: fallbackUnreadTotal
          }
        };
      } catch {
        // Do not hard-fail header badges during backend warm-up.
        return {
          success: false,
          unreadTotal: 0,
          data: {
            unreadTotal: 0
          }
        };
      }
    }
  },

  getMessages: async (conversationId, params = {}) => {
    const response = await api.get(`/api/chat/conversations/${conversationId}/messages`, { params });
    return {
      ...response.data,
      messages: ensureArray(safeGet(response.data, 'data.messages', []))
    };
  },

  sendMessage: async (conversationId, payload) => {
    const response = await api.post(`/api/chat/conversations/${conversationId}/messages`, payload);
    return response.data ?? {};
  },

  reactToMessage: async (conversationId, messageId, emoji = '❤️') => {
    const response = await api.post(`/api/chat/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji });
    return response.data ?? {};
  },

  uploadAttachment: async (conversationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/chat/conversations/${conversationId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data ?? {};
  },

  markSeen: async (conversationId) => {
    const response = await api.post(`/api/chat/conversations/${conversationId}/seen`);
    return response.data ?? {};
  },

  updateConversationTheme: async (conversationId, theme) => {
    const response = await api.patch(`/api/chat/conversations/${conversationId}/theme`, { theme });
    return response.data ?? {};
  },

  updateConversationNickname: async (conversationId, nickname) => {
    const response = await api.patch(`/api/chat/conversations/${conversationId}/nickname`, { nickname });
    return response.data ?? {};
  },

  blockUser: async (conversationId) => {
    const response = await api.post(`/api/chat/conversations/${conversationId}/block`);
    return response.data ?? {};
  },

  unmatchUser: async (conversationId) => {
    const response = await api.post(`/api/chat/conversations/${conversationId}/unmatch`);
    return response.data ?? {};
  },

  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/api/chat/conversations/${conversationId}`);
    return response.data ?? {};
  },

  // Premium discover experience - save gender filter preference
  updateDiscoveringPreference: async (preference) => {
    const response = await api.put('/api/auth/discovering-preference', { 
      discoveringPreference: preference 
    });
    return response.data ?? {};
  }
};

export default chatApi;
