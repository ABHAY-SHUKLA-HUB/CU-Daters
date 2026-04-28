import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import StickyCTA from './components/StickyCTA';
import GlobalAnnouncementBanner from './components/GlobalAnnouncementBanner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Core pages imported directly for faster initial load
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ChatPage from './pages/ChatPage';
import RequestsPage from './pages/RequestsPage';
import ConnectionsPage from './pages/ConnectionsPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPortal from './pages/AdminPortal';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import PaymentCheckoutFinal from './pages/PaymentCheckoutFinal';
import PendingApproval from './pages/PendingApproval';

// Additional pages (lazy loaded)
const Security = React.lazy(() => import('./pages/Security'));
const Careers = React.lazy(() => import('./pages/Careers'));
const Blog = React.lazy(() => import('./pages/Blog'));
const Safety = React.lazy(() => import('./pages/Safety'));
const CookiePolicy = React.lazy(() => import('./pages/CookiePolicy'));
const RazorpayCheckoutPage = React.lazy(() => import('./pages/RazorpayCheckoutPage'));
const PremiumPage = React.lazy(() => import('./pages/PremiumPage'));
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
      <GlobalAnnouncementBanner />
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
          <Route path="/security" element={<Security />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/premium" element={<PremiumPage />} />
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
          <Route path="/razorpay-checkout" element={<UserStatusGuard><RazorpayCheckoutPage /></UserStatusGuard>} />
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


