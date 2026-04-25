import React, { useEffect, useState } from 'react';
import cmsApi from '../services/cmsApi';

const AmbassadorPositionsManager = ({ token, onSuccess, onError }) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetReach: '200-300 students',
    timeCommitment: '3-5 hours/week',
    rewards: []
  });
  const [rewardInput, setRewardInput] = useState('');

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const response = await cmsApi.getAmbassadorPositions(token);
      if (response.success) {
        setPositions(response.data.positions || []);
      }
    } catch (error) {
      onError('Failed to load positions');
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

  const handleAddReward = () => {
    if (rewardInput.trim()) {
      setFormData(prev => ({
        ...prev,
        rewards: [...prev.rewards, rewardInput.trim()]
      }));
      setRewardInput('');
    }
  };

  const handleRemoveReward = (index) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      onError('Title and description are required');
      return;
    }

    try {
      setSaving(true);
      let response;

      if (editingId) {
        response = await cmsApi.updateAmbassadorPosition(editingId, formData, token);
        if (response.success) {
          setPositions(prev =>
            prev.map(p => p.id === editingId ? response.data.position : p)
          );
          onSuccess('Position updated successfully');
        }
      } else {
        response = await cmsApi.createAmbassadorPosition(formData, token);
        if (response.success) {
          setPositions(prev => [...prev, response.data.position]);
          onSuccess('Position created successfully');
        }
      }

      if (!response.success) {
        onError(response.message || 'Failed to save position');
      } else {
        resetForm();
      }
    } catch (error) {
      onError('Error saving position');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (position) => {
    setFormData(position);
    setEditingId(position.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this position? This cannot be undone.')) {
      try {
        const response = await cmsApi.deleteAmbassadorPosition(id, token);
        if (response.success) {
          setPositions(prev => prev.filter(p => p.id !== id));
          onSuccess('Position deleted');
        } else {
          onError(response.message || 'Failed to delete position');
        }
      } catch (error) {
        onError('Error deleting position');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetReach: '200-300 students',
      timeCommitment: '3-5 hours/week',
      rewards: []
    });
    setEditingId(null);
    setShowForm(false);
    setRewardInput('');
  };

  if (loading) {
    return <div className="cms-loading">Loading positions...</div>;
  }

  return (
    <div className="ambassador-manager">
      <div className="manager-header">
        <h3>🎓 Ambassador Positions</h3>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ Add Position'}
        </button>
      </div>

      {showForm && (
        <div className="position-form">
          <h4>{editingId ? 'Edit Position' : 'Create New Position'}</h4>

          <div className="form-group">
            <label>Position Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Campus Ambassador – CU Mohali"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              placeholder="Detailed description of the position..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Reach</label>
              <input
                type="text"
                name="targetReach"
                value={formData.targetReach}
                onChange={handleInputChange}
                placeholder="e.g., 200-300 students"
              />
            </div>

            <div className="form-group">
              <label>Time Commitment</label>
              <input
                type="text"
                name="timeCommitment"
                value={formData.timeCommitment}
                onChange={handleInputChange}
                placeholder="e.g., 3-5 hours/week"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Rewards</label>
            <div className="reward-input-group">
              <input
                type="text"
                value={rewardInput}
                onChange={(e) => setRewardInput(e.target.value)}
                placeholder="Add a reward and press enter..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddReward()}
              />
              <button
                type="button"
                className="btn-add-reward"
                onClick={handleAddReward}
              >
                +
              </button>
            </div>

            {formData.rewards.length > 0 && (
              <div className="rewards-list">
                {formData.rewards.map((reward, idx) => (
                  <div key={idx} className="reward-tag">
                    <span>{reward}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReward(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : '💾 Save Position'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="positions-list">
        {positions.length === 0 ? (
          <p className="empty-state">No positions yet. Create one to get started!</p>
        ) : (
          positions.map(position => (
            <div key={position.id} className="position-card">
              <div className="position-header">
                <h4>{position.title}</h4>
                <div className="position-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(position)}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(position.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="position-description">{position.description}</p>

              <div className="position-details">
                <div className="detail">
                  <span className="label">Target Reach:</span>
                  <span>{position.targetReach}</span>
                </div>
                <div className="detail">
                  <span className="label">Time Commitment:</span>
                  <span>{position.timeCommitment}</span>
                </div>
              </div>

              {position.rewards && position.rewards.length > 0 && (
                <div className="position-rewards">
                  <strong>Rewards:</strong>
                  <ul>
                    {position.rewards.map((reward, idx) => (
                      <li key={idx}>{reward}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="position-meta">
                {position.active && <span className="badge-active">Active</span>}
                <span className="meta-text">
                  Created: {new Date(position.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AmbassadorPositionsManager;
