import api from './api';

const safetyApi = {
  getBlocks: async () => {
    const response = await api.get('/api/safety/blocks');
    return response.data ?? {};
  },

  blockUser: async (targetUserId, reason = '') => {
    const response = await api.post(`/api/safety/block/${targetUserId}`, { reason });
    return response.data ?? {};
  },

  unblockUser: async (targetUserId) => {
    const response = await api.delete(`/api/safety/block/${targetUserId}`);
    return response.data ?? {};
  },

  reportUser: async ({ targetUserId, reason, details = '', targetType = 'user', targetId = '' }) => {
    const response = await api.post('/api/safety/report', {
      targetUserId,
      reason,
      details,
      targetType,
      targetId
    });
    return response.data ?? {};
  },

  getPrivacy: async () => {
    const response = await api.get('/api/safety/privacy');
    return response.data ?? {};
  },

  updatePrivacy: async (privacyPayload) => {
    const response = await api.put('/api/safety/privacy', privacyPayload);
    return response.data ?? {};
  },

  requestCollegeVerification: async (collegeEmail) => {
    const response = await api.post('/api/safety/college-verification/request', { collegeEmail });
    return response.data ?? {};
  }
};

export default safetyApi;
