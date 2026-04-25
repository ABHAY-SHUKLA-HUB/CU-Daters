import React, { useEffect, useState } from 'react';
import cmsApi from '../services/cmsApi';
import '../styles/announcementBanner.css';

const GlobalAnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncement();
    
    // Check if user dismissed in this session
    const isDismissed = sessionStorage.getItem('announcementDismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    // Refresh announcement every 30 seconds to catch new announcements
    const interval = setInterval(() => {
      loadAnnouncement();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAnnouncement = async () => {
    try {
      const response = await cmsApi.getAnnouncement();
      if (response.success && response.data.announcement) {
        const ann = response.data.announcement;
        
        // Check if announcement is enabled and not expired
        if (ann.enabled && (!ann.expiresAt || new Date(ann.expiresAt) > new Date())) {
          setAnnouncement(ann);
          // Clear dismissed state when new announcement loads
          setDismissed(false);
          sessionStorage.removeItem('announcementDismissed');
        } else {
          // No valid announcement
          setAnnouncement(null);
        }
      } else {
        setAnnouncement(null);
      }
    } catch (error) {
      console.error('Failed to load announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('announcementDismissed', 'true');
  };

  if (loading || dismissed || !announcement) {
    return null;
  }

  return (
    <div className="global-announcement-banner">
      <div className="announcement-container">
        <div className="announcement-content">
          <p className="announcement-text">{announcement.text}</p>
          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className="announcement-cta"
            >
              Learn More →
            </a>
          )}
        </div>
        <button
          className="announcement-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default GlobalAnnouncementBanner;
