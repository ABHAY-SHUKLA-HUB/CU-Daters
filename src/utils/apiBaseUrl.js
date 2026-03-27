const PRODUCTION_API_URL = 'https://cu-daters-backend.onrender.com';
const LOCAL_API_URL = 'http://localhost:5000';

function normalizeBaseUrl(url = '') {
  if (!url) {
    return '';
  }

  const trimmed = String(url).trim().replace(/\/+$/, '');
  // Prevent duplicated route assembly like /api/api/auth/login.
  return trimmed.replace(/\/api$/i, '');
}

function isLocalhost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  );
}

function isVercelHost(hostname) {
  return typeof hostname === 'string' && hostname.toLowerCase().endsWith('.vercel.app');
}

export function getApiBaseUrl() {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL || '');
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const appIsLocal = isLocalhost(hostname);

  const envPointsToLegacyLocalFunctions = /localhost:8787|127\.0\.0\.1:8787|0\.0\.0\.0:8787/.test(envUrl);

  // In local development, default API to local backend unless explicitly overridden.
  if (appIsLocal) {
    if (envPointsToLegacyLocalFunctions) {
      return LOCAL_API_URL;
    }
    return normalizeBaseUrl(envUrl || LOCAL_API_URL);
  }

  // On Vercel deployments, always use same-origin /api and let vercel.json rewrite
  // to backend. This permanently avoids browser CORS issues across preview domains.
  if (isVercelHost(hostname)) {
    return '/api';
  }

  // Never call localhost API from deployed frontend.
  if (!appIsLocal && envUrl && /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(envUrl)) {
    return PRODUCTION_API_URL;
  }

  return normalizeBaseUrl(envUrl || PRODUCTION_API_URL);
}
