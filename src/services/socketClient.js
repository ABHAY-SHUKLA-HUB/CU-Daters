import { io } from 'socket.io-client';
import { getStoredToken } from '../utils/authStorage';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

let socketInstance = null;

const resolveAuthToken = () => getStoredToken();

const resolveSocketBaseUrl = () => {
  const apiBase = String(getApiBaseUrl() || '').trim();

  // On Vercel deployments getApiBaseUrl can return /api for HTTP rewrites.
  // Socket.IO must connect to a real origin, not the API rewrite path.
  if (!apiBase || apiBase === '/api') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'http://localhost:5000';
  }

  return apiBase.replace(/\/+$/, '').replace(/\/api$/i, '');
};

export const getSocketClient = () => {
  const token = resolveAuthToken();

  if (!token) {
    return null;
  }

  if (socketInstance) {
    socketInstance.auth = { token };
    return socketInstance;
  }

  socketInstance = io(resolveSocketBaseUrl(), {
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    timeout: 25000,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1200,
    reconnectionDelayMax: 10000,
    upgrade: true,
    autoConnect: true,
    auth: { token }
  });

  socketInstance.on('connect_error', (error) => {
    const message = String(error?.message || 'socket connect failed');
    console.warn('[socket] connect_error:', message);
  });

  return socketInstance;
};

export const disconnectSocketClient = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
