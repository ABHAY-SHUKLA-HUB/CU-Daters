// src/services/api.js
import axios from 'axios';
import { formatErrorMessage } from '../utils/safeProperties';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { clearStoredAuthState, getStoredToken } from '../utils/authStorage';

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
  timeout: 15000, // Keep UI responsive when a backend endpoint is slow/unavailable
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add Bearer token to all requests
api.interceptors.request.use((config) => {
  try {
    config.url = normalizeApiPath(config.url, config.baseURL || API_URL);

    const token = getStoredToken();
    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`;
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
    
    if (statusCode === 401) {
      // Clear centralized auth state so all subscribed UI updates immediately.
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
