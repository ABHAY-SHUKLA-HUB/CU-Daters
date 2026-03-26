import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../services/authApi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(email.toLowerCase().trim(), password);

      if (response.success) {
        setAuth({
          token: response.data.token,
          user: response.data.user
        });
        console.log('✅ Login successful');
        navigate('/dashboard', { replace: true });
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      let errorMsg = 'Login failed. Please try again.';

      if (err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message || '')) {
        errorMsg = '⏳ Server is slow (Render waking up). Please wait 60 seconds and try again.';
      } else if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND') {
        errorMsg = 'Cannot reach backend. Is server running?';
      } else if (err?.status === 401) {
        const rawMsg = String(err?.message || err?.data?.message || '').toLowerCase();
        if (rawMsg.includes('admin portal') || rawMsg.includes('/admin-login')) {
          errorMsg = 'This is an admin account. Please sign in from the Admin Portal login.';
        } else {
          errorMsg = 'Access denied for this account.';
        }
      } else if (err?.status === 503) {
        errorMsg = 'Database unavailable. Please wait a moment and try again.';
      } else if (err?.message === 'Network Error') {
        errorMsg = 'Network/CORS error: backend not reachable from this origin.';
      } else if (err?.message) {
        errorMsg = err.message;
      } else if (err?.data?.message) {
        errorMsg = err.data.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="text-5xl mb-4">💕</div>
          <h1 className="text-3xl font-bold gradient-text mb-2">SEEU-DATERS</h1>
          <p className="text-softBrown mb-8">Login to find your perfect match</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
              {String(error).toLowerCase().includes('admin account') ? (
                <div className="mt-2">
                  <Link to="/admin-login" className="font-bold underline text-rose-700">Go to Admin Login</Link>
                </div>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-left text-darkBrown font-bold mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
              />
              <p className="text-xs text-softBrown mt-1">📧 Use your registered email</p>
            </div>

            <div>
              <label className="block text-left text-darkBrown font-bold mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold"
              />
              <div className="flex justify-end mt-2">
                <Link 
                  to="/forgot-password" 
                  className="text-blushPink hover:underline text-sm font-semibold"
                >
                  🔐 Forgot Password?
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full text-lg mt-6 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-softPink"></div>
            <span className="text-softBrown text-sm">OR</span>
            <div className="flex-1 h-px bg-softPink"></div>
          </div>

          <Link to="/signup">
            <button className="btn-secondary w-full text-lg">
              Create New Account
            </button>
          </Link>

          <p className="text-softBrown text-sm mt-6">
            🔐 Open to everyone • 100% Verified
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-blushPink hover:underline font-bold">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

