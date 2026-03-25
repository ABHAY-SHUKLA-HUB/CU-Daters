// src/services/authApi.js
import api from './api';

const authApi = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  // Admin login
  adminLogin: async (email, password) => {
    const response = await api.post('/api/auth/admin-login', { email, password });
    return response.data;
  },

  // Signup
  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Update profile (name, bio, interests, phone, livePhoto)
  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Verify Firebase token
  verifyFirebaseToken: async (token) => {
    const response = await api.post('/api/auth/verify-firebase', { token });
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/api/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export default authApi;
