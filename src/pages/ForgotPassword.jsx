import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const API_URL = getApiBaseUrl();
  const AUTH_API_BASE = API_URL.endsWith('/api') ? `${API_URL}/auth` : `${API_URL}/api/auth`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('📧 Sending forgot password request to:', `${AUTH_API_BASE}/forgot-password`);
      
      const response = await axios.post(`${AUTH_API_BASE}/forgot-password`, {
        email: email.toLowerCase().trim()
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setSuccessMessage(response.data.message || 'Password reset link sent! Check your email.');
        setEmail('');
        console.log('✅ Forgot password request successful');
        
        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(response.data.message || 'Failed to process request');
      }
    } catch (err) {
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      let errorMsg = 'Failed to process your request. Please try again.';
      if (err.response?.status === 429) {
        errorMsg = 'Too many requests. Please try again later.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout. Please try again.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold gradient-text mb-4">Check Your Email</h1>
            
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
              <p className="font-semibold mb-2">Password reset link sent!</p>
              <p className="text-sm">{successMessage}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 px-6 py-4 rounded-lg mb-6">
              <p className="text-sm text-darkBrown font-semibold mb-3">📋 What to do next:</p>
              <ul className="text-left text-sm text-softBrown space-y-2">
                <li>✓ Check your email inbox (and spam folder)</li>
                <li>✓ Click the "Reset Your Password" button or link</li>
                <li>✓ Enter your new password</li>
                <li>✓ Login with your new password</li>
              </ul>
            </div>

            <p className="text-softBrown text-sm mb-6">
              ⏱️ The link will expire in <strong>1 hour</strong>. Act quickly!
            </p>

            <p className="text-softBrown text-sm mb-6">
              Redirecting you to login in a moment... or{' '}
              <Link to="/login" className="text-blushPink font-bold hover:underline">
                click here to go now
              </Link>
            </p>

            <Link to="/login">
              <button className="btn-primary w-full text-lg">
                Back to Login
              </button>
            </Link>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 <strong>Tip:</strong> Didn't receive the email? Check your spam/junk folder or try again.
              </p>
            </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Forgot Password?</h1>
          <p className="text-softBrown mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
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
                disabled={loading}
              />
              <p className="text-xs text-softBrown mt-1">
                📧 Enter the email associated with your CU Daters account
              </p>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full text-lg mt-6 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-softPink"></div>
            <span className="text-softBrown text-sm">OR</span>
            <div className="flex-1 h-px bg-softPink"></div>
          </div>

          <Link to="/login">
            <button className="btn-secondary w-full text-lg">
              Back to Login
            </button>
          </Link>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Remember your password?</strong> You can <Link to="/login" className="font-bold underline">login directly</Link> instead.
            </p>
          </div>

          <p className="text-softBrown text-sm mt-6">
            🔒 Your password reset link is secure and will expire in 1 hour
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
