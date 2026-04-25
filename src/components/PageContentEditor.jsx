import React, { useEffect, useState } from 'react';
import cmsApi from '../services/cmsApi';

const PAGE_OPTIONS = [
  { key: 'home', label: 'Home Page' },
  { key: 'features', label: 'Features' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'about', label: 'About' },
  { key: 'careers', label: 'Careers' },
  { key: 'contact', label: 'Contact' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'terms', label: 'Terms & Conditions' }
];

const PageContentEditor = ({ token, onSuccess, onError }) => {
  const [pages, setPages] = useState({});
  const [selectedPage, setSelectedPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (pages[selectedPage]) {
      setFormData(pages[selectedPage]);
    }
  }, [selectedPage, pages]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await cmsApi.getPages(token);
      if (response.success) {
        setPages(response.data.pages);
      }
    } catch (error) {
      onError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await cmsApi.updatePage(selectedPage, formData, token);
      if (response.success) {
        setPages(prev => ({
          ...prev,
          [selectedPage]: response.data.page
        }));
        onSuccess(`${PAGE_OPTIONS.find(p => p.key === selectedPage)?.label} updated successfully`);
      } else {
        onError(response.message || 'Failed to save page');
      }
    } catch (error) {
      onError('Error saving page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="cms-loading">Loading pages...</div>;
  }

  return (
    <div className="page-editor">
      <div className="editor-container">
        <div className="editor-sidebar">
          <h4>Select Page</h4>
          <div className="page-list">
            {PAGE_OPTIONS.map(page => (
              <button
                key={page.key}
                className={`page-btn ${selectedPage === page.key ? 'active' : ''}`}
                onClick={() => setSelectedPage(page.key)}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-main">
          <h3>Edit: {PAGE_OPTIONS.find(p => p.key === selectedPage)?.label}</h3>
          
          {formData && (
            <form className="editor-form">
              {Object.entries(formData).map(([key, value]) => {
                // Skip system fields
                if (['updatedAt', 'updatedBy', 'createdAt'].includes(key)) return null;

                // Determine input type
                const isTextarea = typeof value === 'string' && value.length > 100;
                const isArray = Array.isArray(value);
                const isObject = typeof value === 'object' && !isArray && value !== null;

                return (
                  <div key={key} className="form-group">
                    <label htmlFor={key}>
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </label>

                    {isTextarea ? (
                      <textarea
                        id={key}
                        name={key}
                        value={value}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder={`Enter ${key}...`}
                      />
                    ) : isArray ? (
                      <textarea
                        id={key}
                        name={key}
                        value={JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              [key]: parsed
                            }));
                          } catch (err) {
                            // Keep editing as text
                            handleInputChange(e);
                          }
                        }}
                        rows={6}
                        placeholder="Enter valid JSON array..."
                      />
                    ) : isObject ? (
                      <textarea
                        id={key}
                        name={key}
                        value={JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              [key]: parsed
                            }));
                          } catch (err) {
                            handleInputChange(e);
                          }
                        }}
                        rows={6}
                        placeholder="Enter valid JSON object..."
                      />
                    ) : (
                      <input
                        id={key}
                        type="text"
                        name={key}
                        value={value}
                        onChange={handleInputChange}
                        placeholder={`Enter ${key}...`}
                      />
                    )}
                  </div>
                );
              })}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageContentEditor;
