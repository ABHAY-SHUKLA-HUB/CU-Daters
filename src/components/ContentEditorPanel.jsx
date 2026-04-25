import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import cmsApi from '../services/cmsApi';
import PageContentEditor from './PageContentEditor';
import AmbassadorPositionsManager from './AmbassadorPositionsManager';
import AnnouncementManager from './AnnouncementManager';
import '../styles/contentEditor.css';

const ContentEditorPanel = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('pages');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  return (
    <div className="content-editor-panel">
      <div className="cms-header">
        <h2>📝 Content Management System</h2>
        <p className="cms-subtitle">Update website content without touching code</p>
      </div>

      {error && <div className="cms-error">{error}</div>}
      {success && <div className="cms-success">✓ {success}</div>}

      <div className="cms-tabs">
        <button
          className={`tab-btn ${activeTab === 'pages' ? 'active' : ''}`}
          onClick={() => setActiveTab('pages')}
        >
          📄 Pages
        </button>
        <button
          className={`tab-btn ${activeTab === 'ambassador' ? 'active' : ''}`}
          onClick={() => setActiveTab('ambassador')}
        >
          🎓 Ambassador Positions
        </button>
        <button
          className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Announcements
        </button>
      </div>

      <div className="cms-content">
        {activeTab === 'pages' && (
          <PageContentEditor
            token={token}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === 'ambassador' && (
          <AmbassadorPositionsManager
            token={token}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementManager
            token={token}
            onSuccess={showSuccess}
            onError={showError}
          />
        )}
      </div>
    </div>
  );
};

export default ContentEditorPanel;
