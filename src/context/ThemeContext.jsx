/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const THEMES = [
  {
    id: 'soft-rose',
    name: 'Soft Rose',
    tone: 'Premium',
    portal: 'both',
    vip: false,
    description: 'Premium soft rose blush dating product - warm, romantic, attractively designed.',
    preview: 'linear-gradient(135deg,#fff7fa 0%,#fceef3 50%,#f8e8f0 100%)'
  },
  {
    id: 'cream-dream',
    name: 'Cream Dream',
    tone: 'Light',
    portal: 'both',
    vip: false,
    description: 'Clean cream and soft lavender - elegant, minimal, premium light interface.',
    preview: 'linear-gradient(135deg,#fafaf8 0%,#f5f3f8 50%,#f0eff5 100%)'
  },
  {
    id: 'lavender-blush',
    name: 'Lavender Blush',
    tone: 'Romantic',
    portal: 'both',
    vip: false,
    description: 'Soft lavender with warm accents - romantic and emotionally engaging.',
    preview: 'linear-gradient(135deg,#faf8fc 0%,#f3eef8 50%,#ede5f5 100%)'
  },
  {
    id: 'warm-night',
    name: 'Warm Night',
    tone: 'Dark',
    portal: 'both',
    vip: true,
    description: 'Soft dark mode - warm charcoal with rose accents, premium without harsh glow.',
    preview: 'linear-gradient(135deg,#3d3a3f 0%,#4a424e 50%,#5d525d 100%)'
  },
  {
    id: 'admin-pro',
    name: 'Professional Admin Pro',
    tone: 'Enterprise',
    portal: 'admin',
    vip: false,
    description: 'Operational SaaS theme with high readability for dense data.',
    preview: 'linear-gradient(135deg,#0e1726 0%,#1d2738 48%,#243446 100%)'
  },
  {
    id: 'gold-luxury',
    name: 'Gold Luxury',
    tone: 'Luxury',
    portal: 'both',
    vip: true,
    description: 'Premium gold and warm cream - sophisticated dating premium tier.',
    preview: 'linear-gradient(135deg,#faf6f0 0%,#f5f0ea 50%,#e8ddd0 100%)'
  },
  {
    id: 'midnight-glass',
    name: 'Midnight Glass',
    tone: 'Dark',
    portal: 'both',
    vip: true,
    description: 'Deep blue radial gradient dark mode - modern and sophisticated.',
    preview: 'radial-gradient(circle at 18% 12%, #1a3f62 0%, transparent 36%), linear-gradient(145deg, #040a13 0%, #172f53 100%)'
  },
  {
    id: 'romantic-gradient',
    name: 'Romantic Gradient',
    tone: 'Dark',
    portal: 'both',
    vip: true,
    description: 'Red to magenta gradient dark - bold and romantic.',
    preview: 'linear-gradient(135deg, #1a0a15 0%, #3d1a2e 50%, #2d0f20 100%)'
  },
  {
    id: 'vibrant-genz',
    name: 'Vibrant Gen-Z',
    tone: 'Dark',
    portal: 'both',
    vip: true,
    description: 'Blue and purple neon dark - energetic and trendy.',
    preview: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f3f 50%, #2a0a4f 100%)'
  }
];

const STORAGE_KEYS = {
  user: 'app_theme_user',
  admin: 'app_theme_admin'
};

const DEFAULT_THEME = {
  user: 'lavender-blush',
  admin: 'admin-pro'
};

const LIGHT_THEME_IDS = new Set(['soft-rose', 'cream-dream', 'lavender-blush', 'gold-luxury']);

const THEME_MAP = THEMES.reduce((acc, theme) => {
  acc[theme.id] = theme;
  return acc;
}, {});

export const ThemeContext = createContext(null);

const resolvePortalScope = (pathname) => (pathname.startsWith('/admin') ? 'admin' : 'user');

const normalizeThemeId = (themeId, scope) => {
  if (!themeId) {
    return DEFAULT_THEME[scope];
  }

  if (themeId === 'old') {
    return 'light-clean';
  }

  if (themeId === 'new') {
    return 'dark-premium';
  }

  const theme = THEME_MAP[themeId];
  if (!theme) {
    return DEFAULT_THEME[scope];
  }

  if (theme.portal !== 'both' && theme.portal !== scope) {
    return DEFAULT_THEME[scope];
  }

  return themeId;
};

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [themesByScope, setThemesByScope] = useState({
    user: DEFAULT_THEME.user,
    admin: DEFAULT_THEME.admin
  });

  const activeScope = resolvePortalScope(location.pathname);
  const activeTheme = themesByScope[activeScope] || DEFAULT_THEME[activeScope];

  useEffect(() => {
    const userSavedRaw = localStorage.getItem(STORAGE_KEYS.user) || localStorage.getItem('app_theme') || DEFAULT_THEME.user;
    const adminSavedRaw = localStorage.getItem(STORAGE_KEYS.admin) || DEFAULT_THEME.admin;

    const userSaved = normalizeThemeId(userSavedRaw, 'user');
    const adminSaved = normalizeThemeId(adminSavedRaw, 'admin');

    setThemesByScope({
      user: userSaved,
      admin: adminSaved
    });

    localStorage.setItem(STORAGE_KEYS.user, userSaved);
    localStorage.setItem(STORAGE_KEYS.admin, adminSaved);
    localStorage.setItem('app_theme', userSaved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.setAttribute('data-portal-scope', activeScope);
    document.documentElement.style.setProperty('color-scheme', LIGHT_THEME_IDS.has(activeTheme) ? 'light' : 'dark');
  }, [activeScope, activeTheme, mounted]);

  const setTheme = (themeId, targetScope = activeScope) => {
    const normalizedThemeId = normalizeThemeId(themeId, targetScope);

    setThemesByScope((prev) => {
      const next = {
        ...prev,
        [targetScope]: normalizedThemeId
      };
      localStorage.setItem(STORAGE_KEYS[targetScope], normalizedThemeId);
      if (targetScope === 'user') {
        localStorage.setItem('app_theme', normalizedThemeId);
      }
      return next;
    });
  };

  const setThemeForAllScopes = (themeId) => {
    const normalizedUserTheme = normalizeThemeId(themeId, 'user');
    const normalizedAdminTheme = normalizeThemeId(themeId, 'admin');

    setThemesByScope({
      user: normalizedUserTheme,
      admin: normalizedAdminTheme
    });

    localStorage.setItem(STORAGE_KEYS.user, normalizedUserTheme);
    localStorage.setItem(STORAGE_KEYS.admin, normalizedAdminTheme);
    localStorage.setItem('app_theme', normalizedUserTheme);
  };

  const resetTheme = (targetScope = activeScope) => {
    setTheme(DEFAULT_THEME[targetScope], targetScope);
  };

  const resetThemeForAllScopes = () => {
    setThemesByScope({
      user: DEFAULT_THEME.user,
      admin: DEFAULT_THEME.admin
    });
    localStorage.setItem(STORAGE_KEYS.user, DEFAULT_THEME.user);
    localStorage.setItem(STORAGE_KEYS.admin, DEFAULT_THEME.admin);
    localStorage.setItem('app_theme', DEFAULT_THEME.user);
  };

  const availableThemes = useMemo(
    () => THEMES.filter((theme) => theme.portal === 'both' || theme.portal === activeScope),
    [activeScope]
  );

  const value = {
    mounted,
    activeScope,
    activeTheme,
    userTheme: themesByScope.user,
    adminTheme: themesByScope.admin,
    themes: availableThemes,
    allThemes: THEMES,
    setTheme,
    setThemeForAllScopes,
    resetTheme,
    resetThemeForAllScopes,
    isVipTheme: THEMES.find((theme) => theme.id === activeTheme)?.vip || false
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
