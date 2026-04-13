// src/services/api.js
import axios from 'axios';
import { formatErrorMessage } from '../utils/safeProperties';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import {
  clearStoredAuthState,
  getStoredCsrfToken,
  getStoredToken,
  getStoredUser,
  persistAuthState,
  persistCsrfToken
} from '../utils/authStorage';

const API_URL = getApiBaseUrl();

const normalizeApiPath = (url = '', baseURL = '') => {
  if (typeof url !== 'string') {
    return url;
  }

  const normalizedBase = String(baseURL || '').replace(/\/+$/, '');
  // If baseURL is /api and request starts with /api/, strip one prefix.
  if (/\/api$/i.test(normalizedBase) && /^\/api\//i.test(url)) {
    return url.replace(/^\/api/i, '');
  }

  return url;
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds for large file uploads (signup with base64 images)
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Allow cookies to be sent/received for CSRF and session management
  // Allow larger payloads for image uploads
  maxContentLength: 50 * 1024 * 1024, // 50MB
  maxBodyLength: 50 * 1024 * 1024 // 50MB
});

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'];
let refreshPromise = null;

// Add Bearer token to all requests
api.interceptors.request.use((config) => {
  try {
    config.url = normalizeApiPath(config.url, config.baseURL || API_URL);

    const token = getStoredToken();
    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const csrfToken = getStoredCsrfToken();
    const method = String(config.method || 'get').toUpperCase();
    const url = String(config.url || '');
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isAdminRoute = url.includes('/api/admin');

    if (csrfToken && isMutating && isAdminRoute) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  } catch (error) {
    console.error('Error adding token to request:', error);
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => {
    // Ensure response.data exists
    return {
      ...response,
      data: response?.data ?? { success: false, error: 'Empty response' }
    };
  },
  (error) => {
    const statusCode = error?.response?.status;

    if (statusCode === 401 && !error?.config?._retry) {
      const user = getStoredUser();
      const role = String(user?.role || '').toLowerCase();
      const isAdmin = ADMIN_ROLES.includes(role);

      if (isAdmin) {
        const originalRequest = error.config;
        originalRequest._retry = true;

        if (!refreshPromise) {
          refreshPromise = axios.post(`${API_URL}/api/admin/refresh`, {}, {
            withCredentials: true,
            timeout: 15000
          }).finally(() => {
            refreshPromise = null;
          });
        }

        return refreshPromise
          .then((refreshResponse) => {
            const payload = refreshResponse?.data?.data || refreshResponse?.data || {};
            const newToken = payload.accessToken || payload.token;
            const newCsrf = payload.csrfToken || '';

            if (!newToken) {
              throw new Error('No refreshed access token returned');
            }

            persistAuthState({ token: newToken, user: user || null });
            persistCsrfToken(newCsrf);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            if (newCsrf && ['post', 'put', 'patch', 'delete'].includes(String(originalRequest.method || '').toLowerCase())) {
              originalRequest.headers['x-csrf-token'] = newCsrf;
            }

            return api(originalRequest);
          })
          .catch(() => {
            clearStoredAuthState();
            window.location.href = '/login';
            return Promise.reject(error);
          });
      }

      // Non-admin unauthorized fallback
      try {
        clearStoredAuthState();
        window.location.href = '/login';
      } catch {
        console.error('Error clearing auth on 401');
      }
    }

    // Return structured error
    return Promise.reject({
      status: statusCode,
      message: formatErrorMessage(error),
      data: error?.response?.data ?? null,
      error
    });
  }
);

export default api;
