/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import {
  AUTH_EVENTS,
  clearStoredAuthState,
  getStoredAuthState,
  patchStoredUser,
  persistAuthState,
  persistCsrfToken
} from '../utils/authStorage';

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'];

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = React.useState(() => {
    const stored = getStoredAuthState();
    return {
      ...stored,
      loading: true
    };
  });

  const hydrateFromStorage = React.useCallback(() => {
    const stored = getStoredAuthState();
    setAuthState((prev) => ({
      ...prev,
      token: stored.token,
      user: stored.user,
      isAuthenticated: stored.isAuthenticated,
      loading: false
    }));
  }, []);

  React.useEffect(() => {
    hydrateFromStorage();

    const handleStorage = (event) => {
      if (!event.key || ['auth_token', 'authToken', 'firebase_token', 'current_user'].includes(event.key)) {
        hydrateFromStorage();
      }
    };

    const handleAuthChange = (event) => {
      const detail = event?.detail;
      if (!detail) {
        hydrateFromStorage();
        return;
      }

      setAuthState({
        token: detail.token || '',
        user: detail.user || null,
        isAuthenticated: Boolean(detail.isAuthenticated),
        loading: false
      });
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(AUTH_EVENTS.changed, handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(AUTH_EVENTS.changed, handleAuthChange);
    };
  }, [hydrateFromStorage]);

  React.useEffect(() => {
    const restoreSession = async () => {
      const stored = getStoredAuthState();
      if (!stored?.token || stored?.user) {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        const baseUrl = getApiBaseUrl();
        const response = await axios.get(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${stored.token}` },
          timeout: 15000
        });

        const resolvedUser = response?.data?.data || response?.data?.user || null;
        if (resolvedUser) {
          persistAuthState({ token: stored.token, user: resolvedUser });
          setAuthState({
            token: stored.token,
            user: resolvedUser,
            isAuthenticated: true,
            loading: false
          });
          return;
        }

        clearStoredAuthState();
      } catch {
        clearStoredAuthState();
      } finally {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    };

    void restoreSession();
  }, []);

  const setAuth = React.useCallback(({ token, user, csrfToken = '' }) => {
    persistAuthState({ token, user });
    persistCsrfToken(csrfToken || '');
  }, []);

  const clearAuth = React.useCallback(() => {
    clearStoredAuthState();
  }, []);

  const updateUser = React.useCallback((updater) => {
    patchStoredUser(updater);
  }, []);

  const value = React.useMemo(() => {
    const role = authState.user?.role || '';
    return {
      user: authState.user,
      token: authState.token,
      loading: authState.loading,
      isAuthenticated: authState.isAuthenticated,
      isAdmin: ADMIN_ROLES.includes(role),
      setAuth,
      clearAuth,
      updateUser,
      refreshAuth: hydrateFromStorage
    };
  }, [authState, setAuth, clearAuth, updateUser, hydrateFromStorage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
