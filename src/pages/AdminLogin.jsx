import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../services/authApi';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin'];

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const trimmedEmail = email.toLowerCase().trim();

    try {
      const response = await authApi.adminLogin(trimmedEmail, password);

      const token = response?.data?.token || response?.token;
      const user = response?.data?.user || response?.user;

      if (!token || !user) {
        setError('Invalid login response from server');
        return;
      }

      if (!ADMIN_ROLES.includes(user.role)) {
        setError(`This account does not have admin access. Role: ${user.role}`);
        return;
      }

      setAuth({ token, user });
      setSuccess('Login successful. Redirecting...');
      navigate('/admin-portal', { replace: true });
    } catch (err) {
      const message =
        (err?.status === 401 ? 'Invalid admin email or password.' : '') ||
        (err?.status === 403 ? 'Admin access required for this account.' : '') ||
        (err?.status === 503 ? 'Database unavailable. Please retry in a moment.' : '') ||
        (err?.message === 'Network Error' ? 'Network/CORS error: backend not reachable from this origin.' : '') ||
        err?.message ||
        err?.data?.message ||
        'Failed to login as admin.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="card text-center p-8">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Admin Access</h1>
          <p className="text-softBrown mb-8">Restricted startup operations portal</p>

          {error ? (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
          ) : null}

          {success ? (
            <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">{success}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-left text-darkBrown font-bold mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-creamyWhite"
              />
            </div>

            <div>
              <label className="block text-left text-darkBrown font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter secure admin password"
                required
                className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-creamyWhite"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Authenticating...' : '🔐 Open Admin Portal'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-softPink"></div>
            <span className="text-softBrown text-sm">OR</span>
            <div className="flex-1 h-px bg-softPink"></div>
          </div>

          <Link to="/">
            <button className="btn-secondary w-full text-lg">Back to Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
