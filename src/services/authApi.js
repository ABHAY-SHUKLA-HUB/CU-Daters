// src/services/authApi.js
import api from './api';

const authApi = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Admin login
  adminLogin: async (email, password) => {
    try {
      const response = await api.post('/api/auth/admin-login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Signup
  signup: async (userData) => {
    try {
      const response = await api.post('/api/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update profile (name, bio, interests, phone, livePhoto)
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/api/auth/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify Firebase token
  verifyFirebaseToken: async (token) => {
    try {
      const response = await api.post('/api/auth/verify-firebase', { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/api/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default authApi;
