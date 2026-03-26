import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSupportContactConfig from '../hooks/useSupportContactConfig';

export default function PendingApproval() {
  const contactConfig = useSupportContactConfig();
  const supportEmail = contactConfig.supportEmail || 'support@seeudaters.in';
  const [user, setUser] = useState(null);
  const [, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading, clearAuth } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUser) {
      navigate('/login', { replace: true });
      return;
    }

    setUser(authUser);
    setLoading(false);
  }, [authLoading, authUser, navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };



  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20 pb-12">
        <div className="text-center">
          <p className="text-red-600 text-lg">Unable to load user data</p>
          <Link to="/login" className="text-blue-600 hover:underline mt-4 block">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4 pt-20 pb-12">
      <div className="w-full max-w-2xl">
        <div className="card text-center">
          {/* Animated Icon */}
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-darkBrown mb-2">
            Account Pending Approval
          </h1>
          
          {/* Subtitle */}
          <p className="text-softBrown mb-6 text-lg">
            Thank you for signing up! <br />
            Your account is under review. You will be notified by email/SMS once approved by our admin team.
          </p>

          {/* Timeline */}
          <div className="bg-warmCream p-6 rounded-lg mb-8 text-left">
            <h3 className="font-bold text-darkBrown mb-4 text-center">What happens next? 📋</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blushPink text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-semibold text-darkBrown">Profile Review</p>
                  <p className="text-sm text-softBrown">Our team will verify your photos and details (24-48 hours)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blushPink text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-semibold text-darkBrown">Verification Check</p>
                  <p className="text-sm text-softBrown">We'll confirm your college/email and validate your identity</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blushPink text-white flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-semibold text-darkBrown">Approval & Activation</p>
                  <p className="text-sm text-softBrown">You'll receive a notification and can start using the app immediately!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Your Account Details */}
          <div className="bg-warmCream p-6 rounded-lg mb-8">
            <h3 className="font-bold text-darkBrown mb-4">Your Account Details 👤</h3>
            <div className="text-sm text-softBrown space-y-2 text-left">
              <div className="flex justify-between border-b border-softPink/30 pb-2">
                <span className="font-semibold">Full Name:</span>
                <span>{user?.name || 'Not specified'}</span>
              </div>
              {user?.collegeEmail && (
                <div className="flex justify-between border-b border-softPink/30 pb-2">
                  <span className="font-semibold">CU Email:</span>
                  <span className="break-all">{user.collegeEmail}</span>
                </div>
              )}
              {user?.personalEmail && (
                <div className="flex justify-between border-b border-softPink/30 pb-2">
                  <span className="font-semibold">Personal Email:</span>
                  <span className="break-all">{user.personalEmail}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex justify-between border-b border-softPink/30 pb-2">
                  <span className="font-semibold">Phone:</span>
                  <span>{user.phone}</span>
                </div>
              )}
              {user?.course && (
                <div className="flex justify-between border-b border-softPink/30 pb-2">
                  <span className="font-semibold">Course:</span>
                  <span>{user.course}</span>
                </div>
              )}
              {user?.year && (
                <div className="flex justify-between border-b border-softPink/30 pb-2">
                  <span className="font-semibold">Year:</span>
                  <span>{user.year}</span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="font-semibold">Status:</span>
                <span className="text-amber-600 font-bold">⏳ Pending Approval</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg mb-8 text-left">
            <h3 className="font-bold text-blue-900 mb-3">❓ Common Questions</h3>
            <div className="space-y-3 text-sm text-blue-900">
              <div>
                <p className="font-semibold">How long does approval take?</p>
                <p className="text-xs text-blue-800 mt-1">Usually 24-48 hours. You'll get an email as soon as it's approved.</p>
              </div>
              <div>
                <p className="font-semibold">Can I edit my profile while pending?</p>
                <p className="text-xs text-blue-800 mt-1">Not yet. Once approved, you can make changes anytime.</p>
              </div>
              <div>
                <p className="font-semibold">Why was I rejected?</p>
                <p className="text-xs text-blue-800 mt-1">Rejections are usually due to unclear photos or invalid email. Check the email for details.</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg mb-8">
            <p className="text-sm text-green-900">
              <span className="font-bold">Need help?</span><br />
              Email: <a href={`mailto:${supportEmail}`} className="text-green-700 hover:underline font-semibold">{supportEmail}</a>
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn-secondary w-full"
          >
            Logout
          </button>

          {/* Back to Home Link */}
          <Link 
            to="/" 
            className="mt-4 block text-center text-softBrown hover:text-blushPink font-semibold transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

