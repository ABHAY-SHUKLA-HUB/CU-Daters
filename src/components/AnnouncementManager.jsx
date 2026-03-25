import React, { useEffect, useState } from 'react';
import cmsApi from '../services/cmsApi';

const AnnouncementManager = ({ token, onSuccess, onError }) => {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    link: '',
    enabled: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await cmsApi.getAnnouncement();
      if (response.success && response.data.announcement) {
        const ann = response.data.announcement;
        setAnnouncement(ann);
        setFormData({
          text: ann.text || '',
          link: ann.link || '',
          enabled: ann.enabled !== false,
          expiresAt: ann.expiresAt ? ann.expiresAt.split('T')[0] : ''
        });
      }
    } catch (error) {
      onError('Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!formData.text.trim()) {
      onError('Announcement text is required');
      return;
    }

    try {
      setSaving(true);
      const response = await cmsApi.createAnnouncement(
        {
          text: formData.text,
          link: formData.link || null,
          enabled: formData.enabled,
          expiresAt: formData.expiresAt
            ? new Date(formData.expiresAt).toISOString()
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        token
      );

      if (response.success) {
        setAnnouncement(response.data.announcement);
        setShowForm(false);
        onSuccess('Announcement saved successfully');
      } else {
        onError(response.message || 'Failed to save announcement');
      }
    } catch (error) {
      onError('Error saving announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this announcement?')) {
      try {
        const response = await cmsApi.deleteAnnouncement(token);
        if (response.success) {
          setAnnouncement(null);
          setFormData({
            text: '',
            link: '',
            enabled: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
          onSuccess('Announcement deleted');
        } else {
          onError(response.message || 'Failed to delete announcement');
        }
      } catch (error) {
        onError('Error deleting announcement');
      }
    }
  };

  if (loading) {
    return <div className="cms-loading">Loading announcement...</div>;
  }

  return (
    <div className="announcement-manager">
      <div className="manager-header">
        <h3>📢 Site-wide Announcement</h3>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : announcement ? '✏️ Edit' : '+ Create'}
        </button>
      </div>

      {showForm && (
        <div className="announcement-form">
          <h4>{announcement ? 'Edit Announcement' : 'Create Announcement'}</h4>

          <div className="form-group">
            <label>Announcement Text *</label>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter announcement message (e.g., 'Launching April 2! Get early access...')"
            />
            <small>{formData.text.length} characters</small>
          </div>

          <div className="form-group">
            <label>Link (Optional)</label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="e.g., https://example.com/launch"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expires On</label>
              <input
                type="date"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleInputChange}
                />
                <span>Enable Announcement</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-save"
              onClick={handleSave}
              disabled={saving || !formData.text.trim()}
            >
              {saving ? 'Saving...' : '💾 Save Announcement'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {announcement && !showForm && (
        <div className="announcement-preview">
          <div className="preview-header">
            <h4>Current Announcement (Live)</h4>
          </div>

          <div className="announcement-banner">
            <div className="banner-content">
              <p className="banner-text">{announcement.text}</p>
              {announcement.link && (
                <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="banner-link">
                  Learn More →
                </a>
              )}
            </div>
            <button className="banner-close">✕</button>
          </div>

          <div className="announcement-details">
            <div className="detail">
              <span className="label">Status:</span>
              <span className={`status ${announcement.enabled ? 'enabled' : 'disabled'}`}>
                {announcement.enabled ? '🟢 Enabled' : '🔴 Disabled'}
              </span>
            </div>
            <div className="detail">
              <span className="label">Expires:</span>
              <span>{new Date(announcement.expiresAt).toLocaleDateString()}</span>
            </div>
            <div className="detail">
              <span className="label">Created:</span>
              <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-delete"
              onClick={handleDelete}
            >
              🗑️ Delete Announcement
            </button>
          </div>
        </div>
      )}

      {!announcement && !showForm && (
        <div className="empty-state">
          <p>No announcement is currently active.</p>
          <p className="hint">Create one to display a message across your entire site!</p>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManager;
