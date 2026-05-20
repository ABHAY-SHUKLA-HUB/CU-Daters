// Notification Sound Service
export const playNotificationSound = async (soundType = 'default') => {
  try {
    // Create an audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    let oscillator, gainNode, filter;
    
    switch (soundType) {
      case 'default':
        // Gentle notification sound
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
        
      case 'urgent':
        // More urgent sound
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
        
      case 'success':
        // Pleasant notification sound
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Two-tone success sound
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
        
      default:
        return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error playing notification sound:', error);
    return false;
  }
};

// Request notification permissions
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Send browser notification
export const sendBrowserNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/logo.png',
      badge: '/badge.png',
      tag: 'support-notification',
      requireInteraction: true,
      ...options
    };

    new Notification(title, defaultOptions);
  }
};

// Show in-app notification toast
export const showNotificationToast = (message, type = 'info', duration = 3000) => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `notification-toast notification-${type}`;
  toast.textContent = message;

  // Style the toast
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '16px 24px',
    background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
    color: 'white',
    borderRadius: '8px',
    zIndex: '9999',
    animation: 'slideInUp 0.3s ease-out',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    maxWidth: '300px',
    wordWrap: 'break-word'
  });

  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOutDown 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, duration);
};

// Unread count management
export const getUnreadCount = async (token) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API_BASE_URL}/api/support/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data?.count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (token, requestId) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    await fetch(
      `${API_BASE_URL}/api/support/notifications/mark-read/${requestId}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
};

export default {
  playNotificationSound,
  requestNotificationPermission,
  sendBrowserNotification,
  showNotificationToast,
  getUnreadCount,
  markNotificationsAsRead
};
