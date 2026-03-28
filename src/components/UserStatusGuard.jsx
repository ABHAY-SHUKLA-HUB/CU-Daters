import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects routes that require active user status
 * Redirects pending/rejected users appropriately
 */
export default function UserStatusGuard({ children }) {
  const location = useLocation();
  const { user: currentUser, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-creamyWhite flex items-center justify-center text-softBrown">
        Resolving session...
      </div>
    );
  }

  // Not logged in
  if (!token || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // User is pending approval
  if (currentUser.status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  // User is rejected
  if (currentUser.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4">
        <div className="max-w-md text-center card">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-darkBrown mb-2">Registration Rejected</h1>
          <p className="text-softBrown mb-6">Your registration was not approved. Please contact support for more information.</p>
          <a 
            href="mailto:support@cudaters.tech" 
            className="btn-primary inline-block"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // User is banned
  if (currentUser.status === 'banned') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-creamyWhite via-warmCream to-softPink flex items-center justify-center px-4">
        <div className="max-w-md text-center card">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-darkBrown mb-2">Account Suspended</h1>
          <p className="text-softBrown mb-6">Your account has been suspended. Please contact support for assistance.</p>
          <a 
            href="mailto:support@cudaters.tech" 
            className="btn-primary inline-block"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // Admin cannot access user routes
  const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin'];
  if (ADMIN_ROLES.includes(currentUser.role)) {
    return <Navigate to="/admin-portal" replace />;
  }

  // User is active - allow access
  return children;
}

