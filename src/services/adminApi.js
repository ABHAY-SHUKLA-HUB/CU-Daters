import api from './api';

const getAdminHeaders = (adminPin) => {
  const headers = {};
  if (adminPin) {
    headers['x-admin-pin'] = adminPin;
  }
  return { headers };
};

const adminApi = {
  verifyStepUp: async (payload) => {
    const response = await api.post('/api/admin/step-up/verify', payload);
    return response.data;
  },

  getAdminSessions: async () => {
    const response = await api.get('/api/admin/sessions');
    return response.data;
  },

  revokeAdminSession: async (sessionId) => {
    const response = await api.delete(`/api/admin/sessions/${sessionId}`);
    return response.data;
  },

  logoutAllSessions: async () => {
    const response = await api.post('/api/admin/logout-all');
    return response.data;
  },

  getImmutableAuditLogs: async (params = {}) => {
    const response = await api.get('/api/admin/audit-logs/immutable', { params });
    return response.data;
  },

  exportImmutableAuditLogs: async (params = {}) => {
    const response = await api.get('/api/admin/audit-logs/immutable/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  getSecurityAlerts: async () => {
    const response = await api.get('/api/admin/security/alerts');
    return response.data;
  },

  getFlaggedUsers: async (params = {}) => {
    const response = await api.get('/api/admin/flagged-users', { params });
    return response.data;
  },

  getModerationCases: async (params = {}) => {
    const response = await api.get('/api/admin/trust-safety/cases', { params });
    return response.data;
  },

  assignModerationCase: async (caseId, payload) => {
    const response = await api.post(`/api/admin/trust-safety/cases/${caseId}/assign`, payload);
    return response.data;
  },

  escalateModerationCase: async (caseId, payload, stepUpToken = '') => {
    const response = await api.post(`/api/admin/trust-safety/cases/${caseId}/escalate`, payload, {
      headers: stepUpToken ? { 'x-step-up-token': stepUpToken } : {}
    });
    return response.data;
  },

  getAppeals: async (params = {}) => {
    const response = await api.get('/api/admin/appeals', { params });
    return response.data;
  },

  updateAppeal: async (appealId, payload) => {
    const response = await api.put(`/api/admin/appeals/${appealId}`, payload);
    return response.data;
  },

  getDeletionRequests: async (params = {}) => {
    const response = await api.get('/api/admin/deletion-requests', { params });
    return response.data;
  },

  getScreenshotPrivacyEvents: async (params = {}) => {
    const response = await api.get('/api/admin/privacy-events/screenshots', { params });
    return response.data;
  },

  getScreenshotRiskProfiles: async (params = {}) => {
    const response = await api.get('/api/admin/privacy-events/screenshots/risk', { params });
    return response.data;
  },

  exportScreenshotPrivacyEvents: async (params = {}) => {
    const response = await api.get('/api/admin/privacy-events/screenshots/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  updateDeletionRequest: async (requestId, payload) => {
    const response = await api.put(`/api/admin/deletion-requests/${requestId}`, payload);
    return response.data;
  },

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

  approveRegistration: async (userId, payload = {}, adminPin) => {
    const response = await api.put(`/api/admin/registrations/${userId}/approve`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  rejectRegistration: async (userId, payload = {}, adminPin) => {
    const response = await api.put(`/api/admin/registrations/${userId}/reject`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  requestRegistrationResubmission: async (userId, payload = {}, adminPin) => {
    const response = await api.put(`/api/admin/registrations/${userId}/resubmission`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  getVerificationFileBlob: async (submissionId, documentType) => {
    const response = await api.get(`/api/admin/verification-files/${submissionId}/${documentType}`, {
      responseType: 'blob'
    });
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

  deleteUser: async (userId, payload = {}, adminPin) => {
    const response = await api.delete(`/api/admin/users/${userId}`, {
      ...getAdminHeaders(adminPin),
      data: payload
    });
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

  getFullViewChats: async (limit = 30, messageLimit = 120, reason = 'moderation_review') => {
    const response = await api.get('/api/admin/chats/full-view', { params: { limit, messageLimit, reason } });
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

  approveSubscription: async (subscriptionId, payload = {}, adminPin) => {
    const response = await api.put(`/api/admin/subscriptions/${subscriptionId}/approve`, payload, getAdminHeaders(adminPin));
    return response.data;
  },

  rejectSubscription: async (subscriptionId, payload = {}, adminPin) => {
    const response = await api.put(`/api/admin/subscriptions/${subscriptionId}/reject`, payload, getAdminHeaders(adminPin));
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

  getAnalytics: async (params = {}) => {
    const response = await api.get('/api/admin/analytics/engagement', { params });
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
