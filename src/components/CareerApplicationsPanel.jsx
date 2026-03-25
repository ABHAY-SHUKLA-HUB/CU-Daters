import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { useAuth } from '../context/AuthContext';

const CareerApplicationsPanel = () => {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [campusFilter, setCampusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedAppId, setExpandedAppId] = useState(null);

  // Load applications on mount
  useEffect(() => {
    fetchApplications();
  }, [token]);

  // Filter applications
  useEffect(() => {
    // Ensure applications is always an array
    const appsArray = Array.isArray(applications) ? applications : (applications?.data ? applications.data : []);
    
    let filtered = appsArray;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by campus
    if (campusFilter !== 'all') {
      filtered = filtered.filter(app => app.campus === campusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.fullName.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        app.phone.includes(term)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    setFilteredApplications(filtered);
  }, [applications, statusFilter, campusFilter, searchTerm, sortBy]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        setError('No authentication token available. Please log in again.');
        setLoading(false);
        return;
      }

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/admin/career-applications?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch applications`);
      }

      const data = await response.json();
      // The API returns { data: { data: [...], pagination: {...} } }
      const appsArray = data.data?.data || [];
      setApplications(appsArray);
      console.log('✅ Career applications loaded:', appsArray, 'Total:', appsArray.length);
    } catch (err) {
      const errorMessage = err.message || 'Failed to load applications';
      setError(errorMessage);
      console.error('❌ Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setAdminNotes(app.adminNotes || '');
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedApp(null);
    setNewStatus('pending');
    setAdminNotes('');
  };

  const handleStatusChange = async () => {
    if (!selectedApp) return;

    setStatusChangeLoading(true);
    try {
      if (!token) {
        alert('No authentication token available. Please log in again.');
        return;
      }

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/admin/career-applications/${selectedApp._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const data = await response.json();
      console.log('✅ Application updated:', data.data);

      // Update local state
      setApplications(prev =>
        prev.map(app => (app._id === selectedApp._id ? data.data : app))
      );

      // Update selected app
      setSelectedApp(data.data);

      alert('Application updated successfully!');
    } catch (err) {
      alert('Error: ' + (err.message || 'Failed to update application'));
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'contacted':
        return '📞';
      case 'rejected':
        return '❌';
      case 'approved':
        return '✅';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600 font-semibold">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-700">
            {applications.filter(a => a.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-600">Pending Review</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">
            {applications.filter(a => a.status === 'contacted').length}
          </div>
          <div className="text-sm text-blue-600">Contacted</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {applications.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">
            {applications.filter(a => a.status === 'rejected').length}
          </div>
          <div className="text-sm text-red-600">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="font-bold text-lg text-gray-800">Filters & Search</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Campus Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Campus</label>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Campuses</option>
              <option value="CU Mohali">CU Mohali</option>
              <option value="CU UP">CU UP</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Applications List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-600 font-semibold">No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <div
              key={app._id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              {/* Row Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedAppId(expandedAppId === app._id ? null : app._id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{app.fullName}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(app.status)}`}>
                      {getStatusIcon(app.status)} {app.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">✉️ Email:</span> {app.email}
                    </div>
                    <div>
                      <span className="font-semibold">📱 Phone:</span> {app.phone}
                    </div>
                    <div>
                      <span className="font-semibold">📍 Campus:</span> {app.campus}
                    </div>
                    <div>
                      <span className="font-semibold">📅 Date:</span> {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-gray-400">
                  {expandedAppId === app._id ? '▼' : '▶'}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedAppId === app._id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Why They'd Be a Great Ambassador:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border border-gray-200">
                      {app.whyYou}
                    </p>
                  </div>

                  {app.instagram && (
                    <div>
                      <span className="font-semibold text-gray-800">📱 Instagram:</span> {app.instagram}
                    </div>
                  )}

                  {app.linkedin && (
                    <div>
                      <span className="font-semibold text-gray-800">💼 LinkedIn:</span> 
                      <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                        View Profile →
                      </a>
                    </div>
                  )}

                  {app.experience && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Past Experience:</h4>
                      <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                        {app.experience}
                      </p>
                    </div>
                  )}

                  {app.adminNotes && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Admin Notes:</h4>
                      <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap">
                        {app.adminNotes}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => openDetailModal(app)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Edit & Update Status
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedApp.fullName}</h2>
              <button
                onClick={closeDetailModal}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending Review</option>
                  <option value="contacted">Contacted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={closeDetailModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={statusChangeLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
              >
                {statusChangeLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerApplicationsPanel;
