const AUTH_TOKEN_KEY = 'auth_token';
const LEGACY_TOKEN_KEYS = ['authToken', 'firebase_token'];
const AUTH_USER_KEY = 'current_user';
const AUTH_CHANGE_EVENT = 'auth-state-changed';

const safeParse = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getStoredToken = () => {
  const direct = localStorage.getItem(AUTH_TOKEN_KEY);
  if (direct) {
    return direct;
  }

  for (const legacyKey of LEGACY_TOKEN_KEYS) {
    const legacyToken = localStorage.getItem(legacyKey);
    if (legacyToken) {
      return legacyToken;
    }
  }

  return '';
};

export const getStoredUser = () => safeParse(localStorage.getItem(AUTH_USER_KEY));

export const getStoredAuthState = () => {
  const token = getStoredToken();
  const user = getStoredUser();
  return {
    token,
    user,
    isAuthenticated: Boolean(token && user)
  };
};

export const persistAuthState = ({ token = '', user = null }) => {
  if (!token || !user) {
    clearStoredAuthState();
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  // Remove legacy/duplicate keys to avoid stale reads in older code paths.
  LEGACY_TOKEN_KEYS.forEach((legacyKey) => {
    localStorage.removeItem(legacyKey);
    sessionStorage.removeItem(legacyKey);
  });
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);

  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, {
    detail: {
      token,
      user,
      isAuthenticated: true
    }
  }));
};

export const clearStoredAuthState = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  LEGACY_TOKEN_KEYS.forEach((legacyKey) => localStorage.removeItem(legacyKey));

  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  LEGACY_TOKEN_KEYS.forEach((legacyKey) => sessionStorage.removeItem(legacyKey));

  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, {
    detail: {
      token: '',
      user: null,
      isAuthenticated: false
    }
  }));
};

export const patchStoredUser = (updater) => {
  const currentUser = getStoredUser();
  if (!currentUser) {
    return null;
  }

  const nextUser = typeof updater === 'function' ? updater(currentUser) : updater;
  if (!nextUser) {
    return null;
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));

  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, {
    detail: {
      token: getStoredToken(),
      user: nextUser,
      isAuthenticated: Boolean(getStoredToken())
    }
  }));

  return nextUser;
};

export const AUTH_STORAGE_KEYS = {
  token: AUTH_TOKEN_KEY,
  user: AUTH_USER_KEY,
  legacyTokens: LEGACY_TOKEN_KEYS
};

export const AUTH_EVENTS = {
  changed: AUTH_CHANGE_EVENT
};
