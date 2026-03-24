import api from './api';
import { ensureArray, safeGet } from '../utils/safeProperties';

const isRouteNotFoundError = (error) => {
  const status = error?.status;
  const message = String(error?.message || '').toLowerCase();
  return status === 404 && (message.includes('route') || message.includes('not found'));
};

const profileAccessApi = {
  getProfileView: async (profileOwnerId) => {
    try {
      const response = await api.get(`/api/profile-access/profiles/${profileOwnerId}`);
      return response.data ?? {};
    } catch (error) {
      const status = error?.status;
      const message = String(error?.message || '').toLowerCase();
      const isRouteNotFound = status === 404 || message.includes('route') || message.includes('not found');

      if (!isRouteNotFound) {
        throw error;
      }

      const fallbackResponse = await api.get(`/api/profile-access/profile/${profileOwnerId}`);
      return fallbackResponse.data ?? {};
    }
  },

  requestFullProfile: async (profileOwnerId, message = '') => {
    const response = await api.post('/api/profile-access/requests', { profileOwnerId, message });
    return response.data ?? {};
  },

  cancelRequest: async (requestId) => {
    const response = await api.post(`/api/profile-access/requests/${requestId}/cancel`);
    return response.data ?? {};
  },

  approveRequest: async (requestId, message = '') => {
    const response = await api.post(`/api/profile-access/requests/${requestId}/approve`, { message });
    return response.data ?? {};
  },

  declineRequest: async (requestId, message = '') => {
    const response = await api.post(`/api/profile-access/requests/${requestId}/decline`, { message });
    return response.data ?? {};
  },

  revokeViewerAccess: async (viewerId) => {
    const response = await api.post(`/api/profile-access/viewers/${viewerId}/revoke`);
    return response.data ?? {};
  },

  getIncomingRequests: async () => {
    try {
      const response = await api.get('/api/profile-access/requests/incoming');
      return {
        ...response.data,
        requests: ensureArray(safeGet(response.data, 'data.requests', []))
      };
    } catch (error) {
      if (isRouteNotFoundError(error)) {
        return { success: false, requests: [] };
      }
      throw error;
    }
  },

  getOutgoingRequests: async () => {
    try {
      const response = await api.get('/api/profile-access/requests/outgoing');
      return {
        ...response.data,
        requests: ensureArray(safeGet(response.data, 'data.requests', []))
      };
    } catch (error) {
      if (isRouteNotFoundError(error)) {
        return { success: false, requests: [] };
      }
      throw error;
    }
  },

  getApprovedViewers: async () => {
    try {
      const response = await api.get('/api/profile-access/viewers');
      return {
        ...response.data,
        viewers: ensureArray(safeGet(response.data, 'data.viewers', []))
      };
    } catch (error) {
      if (isRouteNotFoundError(error)) {
        return { success: false, viewers: [] };
      }
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await api.patch('/api/profile-access/settings', { settings });
      return response.data ?? {};
    } catch (error) {
      if (isRouteNotFoundError(error)) {
        // Keep profile save flow working even when profile-access module is unavailable.
        return { success: false, skipped: true };
      }
      throw error;
    }
  }
};

export default profileAccessApi;
