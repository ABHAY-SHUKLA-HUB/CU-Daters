import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, clearAuth } = useAuth();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || user?.role !== 'admin') {
      navigate('/admin-login', { replace: true });
      return;
    }

    setAdmin(user);
  }, [authLoading, navigate, user]);

  const handleLogout = () => {
    clearAuth();
    navigate('/', { replace: true });
  };

  if (!admin) {
    return null;
  }

  return (
    <div className="page-shell bg-creamyWhite pt-24 pb-12">
      <div className="page-content max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {admin?.name || 'Admin'}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-xl font-bold mb-4">Admin Profile</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-bold text-lg">{admin?.name || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-bold text-sm break-all">{admin?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-bold text-lg capitalize">{admin?.role || 'user'}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold mb-4">System Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-bold text-green-600">✅ Active</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">API</p>
                <p className="font-bold">Connected</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="font-bold">Running</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold mb-6">System Information</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">✅ Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ User Management</li>
                <li>✓ View All Users</li>
                <li>✓ Subscription Approval</li>
                <li>✓ Activity Monitoring</li>
                <li>✓ System Reports</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">ℹ️ Details</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>App:</strong> SeeU-Daters</p>
                <p><strong>Backend:</strong> http://localhost:5000</p>
                <p><strong>Frontend:</strong> http://localhost:5173</p>
                <p><strong>Auth:</strong> JWT</p>
                <p><strong>Database:</strong> MongoDB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
