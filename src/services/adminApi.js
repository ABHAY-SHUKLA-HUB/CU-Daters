import api from './api';

const getAdminHeaders = (adminPin) => {
  const headers = {};
  if (adminPin) {
    headers['x-admin-pin'] = adminPin;
  }
  return { headers };
};

const adminApi = {
  verifyPin: async (pin) => {
    const response = await api.post('/api/admin/verify-pin', { pin });
    return response.data;
  },

  getOverviewStats: async () => {
    const response = await api.get('/api/admin/stats/overview');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },

  getUserActivity: async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}/activity`);
    return response.data;
  },

  getRegistrationApprovals: async () => {
    const response = await api.get('/api/admin/registration-approvals');
    return response.data;
  },

  updateUserModeration: async (userId, payload, adminPin) => {
    const response = await api.put(`/api/admin/users/${userId}/moderation`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getProfileApprovals: async (status = 'pending') => {
    const response = await api.get('/api/admin/profile-approvals', { params: { status } });
    return response.data;
  },

  updateProfileApproval: async (userId, payload, adminPin) => {
    const response = await api.put(`/api/admin/users/${userId}/profile-approval`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getMatches: async () => {
    const response = await api.get('/api/admin/matches');
    return response.data;
  },

  removeMatch: async (matchId, adminPin) => {
    const response = await api.delete(`/api/admin/matches/${matchId}`, getAdminHeaders(adminPin));
    return response.data;
  },

  getChatsMetadata: async () => {
    const response = await api.get('/api/admin/chats/metadata');
    return response.data;
  },

  getReadOnlyChats: async (limit = 20) => {
    const response = await api.get('/api/admin/chats/read-only', { params: { limit } });
    return response.data;
  },

  getFullViewChats: async (limit = 30, messageLimit = 120) => {
    const response = await api.get('/api/admin/chats/full-view', { params: { limit, messageLimit } });
    return response.data;
  },

  requestConversationReviewAccess: async (payload) => {
    const response = await api.post('/api/admin/chats/review-access', payload);
    return response.data;
  },

  getPayments: async (params = {}) => {
    const response = await api.get('/api/admin/payments', { params });
    return response.data;
  },

  getPaymentSummary: async () => {
    const response = await api.get('/api/admin/payments/summary');
    return response.data;
  },

  applyMembershipAction: async (payload, adminPin) => {
    const response = await api.post('/api/admin/payments/membership-action', payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getReports: async (params = {}) => {
    const response = await api.get('/api/admin/reports', { params });
    return response.data;
  },

  resolveReport: async (reportId, payload, adminPin) => {
    const response = await api.post(`/api/admin/reports/${reportId}/resolve`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getModerationPhotos: async () => {
    const response = await api.get('/api/admin/moderation/photos');
    return response.data;
  },

  getColleges: async () => {
    const response = await api.get('/api/admin/colleges');
    return response.data;
  },

  createCollege: async (payload, adminPin) => {
    const response = await api.post('/api/admin/colleges', payload, getAdminHeaders(adminPin));
    return response.data;
  },

  updateCollege: async (collegeId, payload, adminPin) => {
    const response = await api.put(`/api/admin/colleges/${collegeId}`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getSupportTickets: async (params = {}) => {
    const response = await api.get('/api/admin/support/tickets', { params });
    return response.data;
  },

  updateSupportTicket: async (ticketId, payload, adminPin) => {
    const response = await api.put(`/api/admin/support/tickets/${ticketId}`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/api/admin/analytics/engagement');
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/api/admin/settings');
    return response.data;
  },

  updateSetting: async (payload, adminPin) => {
    const response = await api.put('/api/admin/settings', payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getActivityLogs: async (params = {}) => {
    const response = await api.get('/api/admin/activity-logs', { params });
    return response.data;
  },

  exportUsersExcel: async (params = {}) => {
    const response = await api.get('/api/admin/export/users', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportSubscriptionsExcel: async (params = {}) => {
    const response = await api.get('/api/admin/export/subscriptions', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};

export default adminApi;
