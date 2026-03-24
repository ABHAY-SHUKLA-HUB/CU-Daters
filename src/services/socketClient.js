import { io } from 'socket.io-client';
import { getStoredToken } from '../utils/authStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let socketInstance = null;

const resolveAuthToken = () => getStoredToken();

export const getSocketClient = () => {
  const token = resolveAuthToken();

  if (!token) {
    return null;
  }

  if (socketInstance) {
    return socketInstance;
  }

  socketInstance = io(API_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    auth: { token }
  });

  return socketInstance;
};

export const disconnectSocketClient = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
