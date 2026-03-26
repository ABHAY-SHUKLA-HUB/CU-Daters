// src/hooks/useNotificationSocket.js
import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { getStoredToken } from '../utils/authStorage';

export function useNotificationSocket(onNewLike, onNewMatch, onRequestUpdate, onRequestReceived, onPrivacyCaptureAlert, onSecurityAlert, onError) {
  const handlersRef = React.useRef({
    onNewLike,
    onNewMatch,
    onRequestUpdate,
    onRequestReceived,
    onPrivacyCaptureAlert,
    onSecurityAlert,
    onError
  });

  React.useEffect(() => {
    handlersRef.current = {
      onNewLike,
      onNewMatch,
      onRequestUpdate,
      onRequestReceived,
      onPrivacyCaptureAlert,
      onSecurityAlert,
      onError
    };
  }, [onNewLike, onNewMatch, onRequestUpdate, onRequestReceived, onPrivacyCaptureAlert, onSecurityAlert, onError]);

  useEffect(() => {
    let socket = null;

    try {
      const token = getStoredToken();
      if (!token) {
        console.warn('No auth token for notification socket');
        return;
      }

      const apiBase = String(getApiBaseUrl() || '').trim();
      const socketBase = (!apiBase || apiBase === '/api')
        ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')
        : apiBase.replace(/\/+$/, '').replace(/\/api$/i, '');

      // Connect to notification namespace
      socket = io(`${socketBase}/notifications`, {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        timeout: 25000,
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1200,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 20,
        upgrade: true
      });

      // Connection events
      socket.on('connect', () => {
        console.log('✓ Connected to notification socket');
      });

      socket.on('disconnect', (reason) => {
        if (reason !== 'io client disconnect') {
          console.log(`✗ Disconnected from notification socket (${reason})`);
        }
      });

      socket.on('connect_error', (error) => {
        const message = String(error?.message || 'notification socket connect failed');
        console.warn('Notification socket connect_error:', message);
        handlersRef.current.onError?.(error);
      });

      // Listen for new likes
      socket.on('new_like', (data) => {
        console.log('💌 New like received:', data);
        handlersRef.current.onNewLike?.(data);
      });

      // Listen for new matches
      socket.on('new_match', (data) => {
        console.log('❤️ New match received:', data);
        handlersRef.current.onNewMatch?.(data);
      });

      // Listen for request status updates (accept/decline/cancel)
      socket.on('chat_request_updated', (data) => {
        console.log('📨 Request update received:', data);
        handlersRef.current.onRequestUpdate?.(data);
      });

      socket.on('chat_request_received', (data) => {
        console.log('💬 New request received:', data);
        handlersRef.current.onRequestReceived?.(data);
      });

      socket.on('privacy_capture_alert', (data) => {
        console.log('🛡️ Privacy capture alert received:', data);
        handlersRef.current.onPrivacyCaptureAlert?.(data);
      });

      socket.on('security_alert', (data) => {
        console.log('🚨 Security alert received:', data);
        handlersRef.current.onSecurityAlert?.(data);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('Notification socket error:', error);
        handlersRef.current.onError?.(error);
      });

    } catch (error) {
      console.error('Failed to connect to notification socket:', error);
      handlersRef.current.onError?.(error);
    }

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);
}
