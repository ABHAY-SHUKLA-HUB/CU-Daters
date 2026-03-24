// src/services/likesApi.js
import api from './api.js';

const extractErrorMessage = (error) => {
  // Handle structured error from api interceptor
  if (error?.message) return error.message;
  // Handle axios error response
  if (error?.data?.message) return error.data.message;
  if (error?.data?.error) return error.data.error;
  // Fallback
  return 'Request failed. Please try again.';
};

const likesApi = {
  /**
   * Like a user's profile
   */
  likeProfile: async (targetUserId) => {
    try {
      const response = await api.post(`/api/likes/${targetUserId}`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Get all pending likes for current user
   */
  getPendingLikes: async () => {
    try {
      const response = await api.get('/api/likes/pending');
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Accept a like (creates match)
   */
  acceptLike: async (likeId) => {
    try {
      const response = await api.post(`/api/likes/${likeId}/accept`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Reject a like
   */
  rejectLike: async (likeId) => {
    try {
      const response = await api.post(`/api/likes/${likeId}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Get all likes sent by current user
   */
  getSentLikes: async () => {
    try {
      const response = await api.get('/api/likes/sent');
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Get statistics about likes
   */
  getLikeStats: async () => {
    try {
      const response = await api.get('/api/likes/stats');
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  getConnections: async (search = '') => {
    try {
      const response = await api.get('/api/likes/connections', { params: { search } });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  updateConnectionMeta: async (matchId, payload) => {
    try {
      const response = await api.patch(`/api/likes/connections/${matchId}`, payload);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  removeConnection: async (matchId) => {
    try {
      const response = await api.delete(`/api/likes/connections/${matchId}`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }
};

export default likesApi;
