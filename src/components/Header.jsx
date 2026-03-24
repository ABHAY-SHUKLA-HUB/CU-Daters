import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import chatApi from '../services/chatApi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeSettingsPanel from './ThemeSettingsPanel';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, clearAuth, isAuthenticated, loading } = useAuth();
  const { activeTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [themePanelOpen, setThemePanelOpen] = React.useState(false);
  const [unreadTotal, setUnreadTotal] = React.useState(0);
  const pathname = location.pathname;
  const isDashboardSurface = pathname === '/dashboard' || pathname === '/profile';
  const currentThemeName = React.useMemo(() => {
    if (activeTheme === 'classic-light' || activeTheme === 'light-clean') return 'Light Clean';
    if (activeTheme === 'dark-premium') return 'Dark Premium';
    if (activeTheme === 'midnight-glass') return 'Midnight Glass';
    if (activeTheme === 'romantic-gradient') return 'Romantic Gradient';
    if (activeTheme === 'vibrant-genz') return 'Vibrant Gen-Z';
    if (activeTheme === 'vip-luxury') return 'VIP Luxury';
    if (activeTheme === 'admin-pro') return 'Admin Pro';
    return activeTheme;
  }, [activeTheme]);
  const isPremium = Boolean(currentUser?.isPremium || currentUser?.subscriptionStatus === 'active');

  const handleLogout = () => {
    clearAuth();
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  React.useEffect(() => {
    if (!isAuthenticated || !currentUser?._id) {
      setUnreadTotal(0);
      return;
    }

    let mounted = true;
    let inFlight = false;

    const loadUnread = async () => {
      if (document.hidden || inFlight) {
        return;
      }

      try {
        inFlight = true;
        const response = await chatApi.getUnreadSummary();
        if (!mounted) {
          return;
        }
        // Safe property access with fallback
        const total = response?.data?.unreadTotal ?? response?.unreadTotal ?? 0;
        setUnreadTotal(typeof total === 'number' ? total : 0);
      } catch (err) {
        console.error('Failed to load unread count:', err);
        if (mounted) {
          setUnreadTotal(0);
        }
      } finally {
        inFlight = false;
      }
    };

    void loadUnread();
    const intervalId = setInterval(() => {
      void loadUnread();
    }, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadUnread();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser?._id, isAuthenticated]);

  return (
    <header className="fixed top-0 w-full z-50 h-16 flex items-center overflow-x-hidden border-b backdrop-blur-2xl shadow-[0_12px_35px_rgba(193,96,146,0.16)]" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-light)' }}>
      <nav className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="hidden lg:grid grid-cols-[auto_1fr_auto] items-center gap-8 h-16">
          <div className="justify-self-start">
            <Link to="/" className="flex items-center gap-2.5 text-xl lg:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--header-text)' }}>
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-base ${isDashboardSurface ? 'bg-rose-500/20 text-rose-200 border border-rose-300/25' : 'bg-blushPink/15 border border-blushPink/30'}`}>🔗</span>
              <span>CU DATERS</span>
            </Link>
          </div>

          <div className="justify-self-center">
            <div className="flex items-center gap-6 xl:gap-8">
              <Link to="/" className={`transition text-sm font-medium ${pathname === '/' ? 'text-rose-500' : 'text-rose-900/80 hover:text-rose-500'}`}>Home</Link>
              <Link to="/features" className={`transition text-sm font-medium ${pathname === '/features' ? 'text-rose-500' : 'text-rose-900/80 hover:text-rose-500'}`}>Features</Link>
              <Link to="/pricing" className={`transition text-sm font-medium ${pathname === '/pricing' ? 'text-rose-500' : 'text-rose-900/80 hover:text-rose-500'}`}>Pricing</Link>
              <Link to="/about" className={`transition text-sm font-medium ${pathname === '/about' ? 'text-rose-500' : 'text-rose-900/80 hover:text-rose-500'}`}>About</Link>
              <Link to="/contact" className={`transition text-sm font-medium ${pathname === '/contact' ? 'text-rose-500' : 'text-rose-900/80 hover:text-rose-500'}`}>Contact</Link>
              {currentUser ? <Link to="/requests" className={`transition text-sm font-medium ${pathname === '/requests' ? 'text-rose-500' : 'text-rose-900/80 hover:text-rose-500'}`}>Requests</Link> : null}
              {currentUser ? <Link to="/connections" className={`transition text-sm font-medium ${pathname === '/connections' ? 'text-rose-500' : 'text-rose-900/80 hover:text-rose-500'}`}>Connections</Link> : null}
            </div>
          </div>

          <div className="justify-self-end">
            {!loading && currentUser ? (
              <div className="flex items-center gap-2 xl:gap-3 whitespace-nowrap">
                <button
                  onClick={() => setThemePanelOpen(true)}
                  className="px-3 py-2 text-xs rounded-xl font-semibold transition border bg-white border-rose-200 text-rose-800 hover:bg-rose-50"
                  title="Open theme settings"
                >
                  🎨 {currentThemeName}
                </button>

                <Link to="/chat" className="relative">
                  <button className="px-4 py-2 text-sm rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-fuchsia-500 shadow-lg shadow-rose-900/40 hover:brightness-110 transition">Chat</button>
                  {unreadTotal > 0 ? (
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-blushPink text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  ) : null}
                </Link>

                <Link to="/profile">
                  <button className="px-4 py-2 text-sm rounded-xl font-semibold transition bg-white border border-rose-200 text-rose-800 hover:bg-rose-50">Profile</button>
                </Link>

                <Link to="/dashboard" className="px-3.5 py-2 rounded-xl border text-sm font-semibold transition bg-white border-rose-200 text-rose-800 hover:bg-rose-50">
                  <span className="truncate max-w-[150px] inline-block align-middle">{currentUser?.name || 'User'}</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border border-orange-300/50 bg-orange-100 text-orange-600">
                    {isPremium ? 'Premium' : 'Classic'}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 text-sm rounded-xl font-medium transition text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-300/40"
                >
                  Logout
                </button>
              </div>
            ) : !loading ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setThemePanelOpen(true)}
                  className="bg-white border border-rose-200 text-rose-800 hover:bg-rose-50 px-3.5 py-2 text-xs rounded-xl font-semibold transition"
                  title="Open theme settings"
                >
                  🎨 Themes
                </button>
                <Link to="/login">
                  <button className="bg-white border border-rose-200 text-rose-800 hover:bg-rose-50 px-4 py-2 text-sm rounded-xl font-semibold transition">Login</button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:hidden flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold gradient-text tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-base bg-rose-100 border border-rose-200 text-rose-600">🔗</span>
          <span>CU DATERS</span>
        </Link>
          <button 
            className="p-2 rounded-lg text-rose-800 hover:bg-rose-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t absolute top-16 left-0 right-0 shadow-lg bg-[#fff9fc] border-rose-200">
          <div className="flex flex-col gap-3 p-4 max-w-7xl mx-auto w-full">
            <Link to="/" className="text-sm transition text-rose-900/90 hover:text-rose-500">Home</Link>
            <Link to="/features" className="text-sm transition text-rose-900/90 hover:text-rose-500">Features</Link>
            
            <button
              onClick={() => setThemePanelOpen(true)}
              className="text-sm px-3 py-2 rounded-full transition border font-semibold bg-white hover:bg-rose-50 border-rose-200 text-rose-700"
              title="Open theme settings"
            >
              🎨 Theme Settings
            </button>

            <Link to="/pricing" className="text-sm transition text-rose-900/90 hover:text-rose-500">Pricing</Link>
            <Link to="/about" className="text-sm transition text-rose-900/90 hover:text-rose-500">About</Link>
            <Link to="/contact" className="text-sm transition text-rose-900/90 hover:text-rose-500">Contact</Link>
            {currentUser ? <Link to="/requests" className="text-sm transition text-rose-900/90 hover:text-rose-500">Requests</Link> : null}
            {currentUser ? <Link to="/connections" className="text-sm transition text-rose-900/90 hover:text-rose-500">Connections</Link> : null}
            {!loading && currentUser ? (
              <>
                <Link to="/chat" className="text-sm flex items-center justify-between text-rose-900/90 hover:text-rose-500">
                  <span>Chat</span>
                  {unreadTotal > 0 ? (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-blushPink text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
                    </span>
                  ) : null}
                </Link>
                <Link to="/dashboard">
                  <button className="btn-primary w-full py-2 text-sm">👤 {currentUser?.name || 'User'}</button>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 text-sm rounded-full font-semibold transition bg-white border-2 border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  Logout
                </button>
              </>
            ) : !loading ? (
              <>
                <Link to="/login">
                  <button className="bg-white border border-rose-200 text-rose-800 hover:bg-rose-50 w-full py-2 text-sm rounded-full font-semibold transition">Login</button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}

      <ThemeSettingsPanel
        open={themePanelOpen}
        onClose={() => setThemePanelOpen(false)}
      />
    </header>
  );
}
