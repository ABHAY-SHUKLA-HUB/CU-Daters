import api from './api';

const extractError = (error) => {
  if (error?.message) return error.message;
  if (error?.data?.message) return error.data.message;
  return 'Request failed';
};

const isConnectionsRouteMissing = (error) => {
  const rawMessage = String(extractError(error) || '').toLowerCase();
  const responseMessage = String(error?.data?.message || '').toLowerCase();
  const merged = `${rawMessage} ${responseMessage}`;

  return (
    merged.includes('route /api/connections/requests not found') ||
    merged.includes('route /api/connections/request not found') ||
    merged.includes('cannot post /api/connections/requests') ||
    merged.includes('cannot post /api/connections/request')
  );
};

const normalizeSendRequestError = (error) => {
  if (isConnectionsRouteMissing(error)) {
    return 'Connection service is temporarily unavailable. Please refresh and try again.';
  }
  return extractError(error);
};

const connectionApi = {
  sendRequest: async (receiverId, options = {}) => {
    const payload = {
      receiverId,
      requestType: options?.requestType || 'connection',
      requestMessage: options?.requestMessage || ''
    };

    try {
      const response = await api.post('/api/connections/requests', payload);
      return response.data;
    } catch (error) {
      const shouldRetryLegacyRoute = isConnectionsRouteMissing(error);

      if (shouldRetryLegacyRoute) {
        try {
          const fallbackResponse = await api.post('/api/connections/request', payload);
          return fallbackResponse.data;
        } catch (fallbackError) {
          throw new Error(normalizeSendRequestError(fallbackError));
        }
      }

      throw new Error(normalizeSendRequestError(error));
    }
  },

  getConnections: async () => {
    try {
      const response = await api.get('/api/connections');
      return response.data;
    } catch (error) {
      throw new Error(extractError(error));
    }
  },

  getStatus: async (targetUserId) => {
    try {
      const response = await api.get(`/api/connections/status/${targetUserId}`);
      return response.data;
    } catch (error) {
      throw new Error(extractError(error));
    }
  },

  getIncomingRequests: async () => {
    try {
      const response = await api.get('/api/connections/requests/incoming');
      return response.data;
    } catch (error) {
      throw new Error(extractError(error));
    }
  },

  getOutgoingRequests: async () => {
    try {
      const response = await api.get('/api/connections/requests/outgoing');
      return response.data;
    } catch (error) {
      throw new Error(extractError(error));
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const response = await api.post(`/api/connections/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      throw new Error(extractError(error));
    }
  },

  declineRequest: async (requestId) => {
    try {
      const response = await api.post(`/api/connections/requests/${requestId}/decline`);
      return response.data;
    } catch (error) {
      throw new Error(extractError(error));
    }
  },

  cancelRequest: async (requestId) => {
    try {
      const response = await api.post(`/api/connections/requests/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(extractError(error));
    }
  }
};

export default connectionApi;
