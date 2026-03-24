import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const navigate = useNavigate();
  const API_URL = getApiBaseUrl();

  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No reset token provided. Please request a new password reset.');
        setVerifying(false);
        return;
      }

      try {
        console.log('🔍 Verifying reset token...');
        const response = await axios.get(
          `${API_URL}/api/auth/verify-reset-token/${token}`,
          {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success && response.data.data.valid) {
          setTokenValid(true);
          console.log('✅ Reset token verified');
        } else {
          setError('Invalid reset token. Please request a new password reset.');
        }
      } catch (err) {
        console.error('❌ Token verification error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });

        let errorMsg = 'Failed to verify reset token.';
        if (err.response?.status === 400) {
          errorMsg = err.response.data.message || 'Invalid or expired reset token. Please request a new password reset.';
        } else if (err.code === 'ECONNABORTED') {
          errorMsg = 'Request timeout. Please refresh and try again.';
        }

        setError(errorMsg);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password) => {
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!formData.confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Submitting password reset...');
      const response = await axios.post(
        `${API_URL}/api/auth/reset-password`,
        {
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setSuccessMessage(response.data.message || 'Password reset successful! Redirecting to login...');
        setFormData({
          password: '',
          confirmPassword: '',
          showPassword: false,
          showConfirmPassword: false
        });
        console.log('✅ Password reset successful');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('❌ Reset password error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });

      let errorMsg = 'Failed to reset password. Please try again.';
      if (err.response?.status === 400) {
        errorMsg = err.response.data.message || 'Invalid or expired reset token.';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout. Please try again.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Verifying token state
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Verifying...</h1>
            <p className="text-softBrown">
              We're verifying your reset link. Please wait...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Token invalid state
  if (!tokenValid || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold gradient-text mb-4">Invalid Link</h1>

            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              <p className="font-semibold">{error}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 px-6 py-4 rounded-lg mb-6">
              <p className="text-sm text-yellow-800">
                💡 Reset links expire after 1 hour for security reasons.
              </p>
            </div>

            <Link to="/forgot-password">
              <button className="btn-primary w-full text-lg mb-4">
                📧 Request New Reset Link
              </button>
            </Link>

            <Link to="/login">
              <button className="btn-secondary w-full text-lg">
                Back to Login
              </button>
            </Link>
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

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold gradient-text mb-4">Password Reset!</h1>

            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
              <p className="font-semibold">{successMessage}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 px-6 py-4 rounded-lg mb-6">
              <p className="text-sm text-darkBrown font-semibold mb-3">🎉 You're all set!</p>
              <ul className="text-left text-sm text-softBrown space-y-2">
                <li>✓ Your password has been successfully reset</li>
                <li>✓ You can now login with your new password</li>
                <li>✓ Keep your new password secure</li>
              </ul>
            </div>

            <p className="text-softBrown text-sm mb-6">
              Redirecting you to login in a moment...
            </p>

            <Link to="/login">
              <button className="btn-primary w-full text-lg">
                🔐 Go to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Reset Your Password</h1>
          <p className="text-softBrown mb-8">
            Create a new password for your CU Daters account
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-left text-darkBrown font-bold mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={formData.showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('showPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-softBrown hover:text-darkBrown"
                  disabled={loading}
                >
                  {formData.showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-softBrown mt-1">
                🔒 Minimum 6 characters recommended
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-left text-darkBrown font-bold mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={formData.showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 border-2 border-softPink rounded-lg focus:border-blushPink focus:outline-none bg-white text-black font-semibold pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('showConfirmPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-softBrown hover:text-darkBrown"
                  disabled={loading}
                >
                  {formData.showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
              )}
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">✗ Passwords do not match</p>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full text-lg mt-6 disabled:opacity-50"
              disabled={loading || !formData.password || !formData.confirmPassword}
            >
              {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              🔒 <strong>Security tip:</strong> Use a strong, unique password that you don't use on other websites.
            </p>
          </div>

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
