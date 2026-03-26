import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'];

export default function AdminRouteGuard({ children }) {
  const location = useLocation();
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-creamyWhite flex items-center justify-center text-softBrown">
        Resolving session...
      </div>
    );
  }

  if (!token || !user || !ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}
