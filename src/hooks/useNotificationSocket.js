// src/hooks/useNotificationSocket.js
import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { getStoredToken } from '../utils/authStorage';

const API_URL = getApiBaseUrl();

export function useNotificationSocket(onNewLike, onNewMatch, onRequestUpdate, onRequestReceived, onError) {
  useEffect(() => {
    let socket = null;

    try {
      const token = getStoredToken();
      if (!token) {
        console.warn('No auth token for notification socket');
        return;
      }

      // Connect to notification namespace
      socket = io(`${API_URL}/notifications`, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✓ Connected to notification socket');
      });

      socket.on('disconnect', () => {
        console.log('✗ Disconnected from notification socket');
      });

      // Listen for new likes
      socket.on('new_like', (data) => {
        console.log('💌 New like received:', data);
        if (onNewLike) {
          onNewLike(data);
        }
      });

      // Listen for new matches
      socket.on('new_match', (data) => {
        console.log('❤️ New match received:', data);
        if (onNewMatch) {
          onNewMatch(data);
        }
      });

      // Listen for request status updates (accept/decline/cancel)
      socket.on('chat_request_updated', (data) => {
        console.log('📨 Request update received:', data);
        if (onRequestUpdate) {
          onRequestUpdate(data);
        }
      });

      socket.on('chat_request_received', (data) => {
        console.log('💬 New request received:', data);
        if (onRequestReceived) {
          onRequestReceived(data);
        }
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('Notification socket error:', error);
        if (onError) {
          onError(error);
        }
      });

    } catch (error) {
      console.error('Failed to connect to notification socket:', error);
      if (onError) {
        onError(error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [onNewLike, onNewMatch, onRequestUpdate, onRequestReceived, onError]);
}
