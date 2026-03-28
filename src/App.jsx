import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import StickyCTA from './components/StickyCTA';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const RequestsPage = React.lazy(() => import('./pages/RequestsPage'));
const ConnectionsPage = React.lazy(() => import('./pages/ConnectionsPage'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminPortal = React.lazy(() => import('./pages/AdminPortal'));
const Features = React.lazy(() => import('./pages/Features'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Terms = React.lazy(() => import('./pages/Terms'));
const PaymentCheckoutFinal = React.lazy(() => import('./pages/PaymentCheckoutFinal'));
const PendingApproval = React.lazy(() => import('./pages/PendingApproval'));
import AdminRouteGuard from './components/admin/AdminRouteGuard';
import UserStatusGuard from './components/UserStatusGuard';
import './index.css';

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin'];

function PublicAuthRoute({ children }) {
  const { loading, isAuthenticated, isAdmin, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creamyWhite text-softBrown">
        Resolving session...
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    return isAdmin ? <Navigate to="/admin-portal" replace /> : <Navigate to="/dashboard" replace />;
  }

  return children;
}

// App Content Component
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const hideHeader = location.pathname.startsWith('/admin');
  const hideGlobalChrome = location.pathname === '/chat' || location.pathname.startsWith('/admin');
  const immersiveSurface = location.pathname === '/dashboard' || location.pathname === '/profile';

  React.useEffect(() => {
    const handleAdminShortcut = (event) => {
      if (!(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a')) {
        return;
      }

      event.preventDefault();

      if (user && ADMIN_ROLES.includes(user?.role)) {
        navigate('/admin-portal');
      } else {
        navigate('/admin-login');
      }
    };

    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, [navigate, user]);

  return (
    <div className="app-shell">
      {!hideHeader && <Header />}
      <main className={`app-main min-h-screen ${immersiveSurface ? 'bg-transparent' : 'bg-creamyWhite'}`}>
        <React.Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-softBrown">
              Loading SeeU-Daters...
            </div>
          }
        >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<PublicAuthRoute><Signup /></PublicAuthRoute>} />
          
          {/* User Routes */}
          <Route path="/dashboard" element={<UserStatusGuard><Dashboard /></UserStatusGuard>} />
          <Route path="/profile" element={<UserStatusGuard><Profile /></UserStatusGuard>} />
          <Route path="/requests" element={<UserStatusGuard><RequestsPage /></UserStatusGuard>} />
          <Route path="/connections" element={<UserStatusGuard><ConnectionsPage /></UserStatusGuard>} />
          <Route path="/chat" element={<UserStatusGuard><ChatPage /></UserStatusGuard>} />
          <Route path="/checkout" element={<UserStatusGuard><PaymentCheckoutFinal /></UserStatusGuard>} />
          <Route path="/payment" element={<UserStatusGuard><PaymentCheckoutFinal /></UserStatusGuard>} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          
          {/* Admin Routes */}
          <Route path="/admin-login" element={<PublicAuthRoute><AdminLogin /></PublicAuthRoute>} />
          <Route path="/admin-dashboard" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
          <Route path="/admin-portal" element={<AdminRouteGuard><AdminPortal /></AdminRouteGuard>} />
          
          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
        </React.Suspense>
      </main>
      {!hideGlobalChrome && <Footer />}
      {!hideGlobalChrome && <StickyCTA />}
    </div>
  );
}

// Main App with Error Boundary
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}


